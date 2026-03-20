const sequelize = require('../config/database');
const { QueryTypes } = require('sequelize');
const { getIO } = require('../config/socket');

const processEvent = async ({ epc, locationId, zoneId, antennaId, deviceId }) => {
    const transaction = await sequelize.transaction();

    try {
        // 1. Get store_location by store_location_id (LocationID) and its location_type
        const [storeLocation] = await sequelize.query(
            `SELECT sl.store_location_id, sl.store_code, sl.store_name, sl.location_type_id,
                    lt.name AS location_type_name
             FROM store_location sl
             JOIN location_type lt ON lt.location_type_id = sl.location_type_id
             WHERE sl.store_location_id = :storeLocationId AND sl.status = 'ACTIVE'`,
            {
                replacements: { storeLocationId: locationId },
                type: QueryTypes.SELECT,
                transaction
            }
        );

        if (!storeLocation) {
            const error = new Error(`Store location not found for ID: ${locationId}`);
            error.statusCode = 404;
            throw error;
        }

        const locationType = storeLocation.location_type_name.toUpperCase();
        
        // 2. Get trolley by QR code (EPC)
        const [trolley] = await sequelize.query(
            `SELECT trolley_id, trolley_code, qr_code, trolly_type_id, loading_status
             FROM trolley
             WHERE qr_code = :epc AND status = 'ACTIVE'`,
            {
                replacements: { epc },
                type: QueryTypes.SELECT,
                transaction
            }
        );

        if (!trolley) {
            const error = new Error(`Trolley not found for EPC/QR code: ${epc}`);
            error.statusCode = 404;
            throw error;
        }

        const trolleyCode = trolley.trolley_code;

        // 3. Process based on location type
        if (locationType === 'CONSUMED') {
            const alreadyConsumed = await isAlreadyConsumed(trolleyCode, transaction);
            if (alreadyConsumed) {
                await transaction.commit();
                return {
                    message: `Trolley ${trolleyCode} is already consumed. No changes made.`,
                    data: {
                        trolleyCode,
                        locationType,
                        locationId,
                        skipped: true
                    }
                };
            }
            await handleConsumed(trolleyCode, locationId, transaction);
        } else if (locationType === 'IN_TRANSIT') {
            await handleInTransit(trolleyCode, locationId, transaction);
        } else if (locationType === 'IN_STOCK') {
            await handleInStock(trolleyCode, locationId, transaction);
        } else {
            const error = new Error(`Unknown location type: ${locationType}`);
            error.statusCode = 400;
            throw error;
        }

        // 4. Update trolley status based on location type
        if (locationType === 'CONSUMED') {
            await sequelize.query(
                `UPDATE trolley SET is_occupied = FALSE, loading_status = 'EMPTY', updated_at = NOW()
                 WHERE trolley_code = :trolleyCode`,
                {
                    replacements: { trolleyCode },
                    type: QueryTypes.UPDATE,
                    transaction
                }
            );
        }

        // Fetch affected work order IDs and material stock data for the socket event
        const affectedStocks = await sequelize.query(
            `SELECT id, material_code, trolley_code, quantity, status, 
                    work_order_id, work_order_number, location, loading_type
             FROM material_stock
             WHERE trolley_code = :trolleyCode`,
            {
                replacements: { trolleyCode },
                type: QueryTypes.SELECT,
                transaction
            }
        );

        const affectedWorkOrderIds = [...new Set(
            affectedStocks.map(s => s.work_order_id).filter(Boolean)
        )];

        await transaction.commit();

        // === Emit Socket.IO event ===
        try {
            const { emitToWorkOrders } = require('../config/socket');
            const payload = {
                event: 'rfid:stockUpdate',
                trolleyCode,
                locationType,
                locationId,
                locationName: storeLocation.store_name,
                affectedWorkOrderIds,
                affectedStocks,
                timestamp: new Date().toISOString()
            };
            emitToWorkOrders('rfid:stockUpdate', affectedWorkOrderIds, payload);
            console.log(`[Socket.IO] Emitted rfid:stockUpdate for trolley ${trolleyCode}`);
        } catch (socketError) {
            console.error('[Socket.IO] Failed to emit event:', socketError.message);
        }

        return {
            message: `RFID event processed successfully. Location type: ${locationType}`,
            data: {
                trolleyCode,
                locationType,
                locationId: locationId
            }
        };
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
};

/**
 * Check if all material_stock records for this trolley are already CONSUMED
 */
const isAlreadyConsumed = async (trolleyCode, transaction) => {
    const activeRecords = await sequelize.query(
        `SELECT COUNT(*) as count
         FROM material_stock
         WHERE trolley_code = :trolleyCode AND status IN ('IN_STOCK', 'IN_TRANSIT')`,
        {
            replacements: { trolleyCode },
            type: QueryTypes.SELECT,
            transaction
        }
    );

    return parseInt(activeRecords[0].count) === 0;
};

/**
 * CONSUMED: Update material_stock status to CONSUMED,
 * then update work_orders consumed_quantity for each respective work order
 */
const handleConsumed = async (trolleyCode, locationId, transaction) => {
    // Get all active material_stock records for this trolley
    const stockRecords = await sequelize.query(
        `SELECT id, material_code, trolley_code, quantity, work_order_id, work_order_number, mapping_group_id
         FROM material_stock
         WHERE trolley_code = :trolleyCode AND status IN ('IN_STOCK', 'IN_TRANSIT')`,
        {
            replacements: { trolleyCode },
            type: QueryTypes.SELECT,
            transaction
        }
    );

    if (!stockRecords || stockRecords.length === 0) {
        const error = new Error(`No active material stock found for trolley: ${trolleyCode}`);
        error.statusCode = 404;
        throw error;
    }

    // Update each stock record and its respective work order
    for (const stock of stockRecords) {
        // Update material_stock status to CONSUMED
        await sequelize.query(
            `UPDATE material_stock
             SET status = 'CONSUMED', location = :locationId, updated_at = NOW()
             WHERE id = :stockId`,
            {
                replacements: { stockId: stock.id, locationId },
                type: QueryTypes.UPDATE,
                transaction
            }
        );

        // Update work_orders: add to consumed_quantity for the respective work order
        if (stock.work_order_id) {
            await sequelize.query(
                `UPDATE work_orders
                 SET consumed_quantity = consumed_quantity + :quantity,
                     updated_at = NOW()
                 WHERE id = :workOrderId`,
                {
                    replacements: {
                        quantity: stock.quantity,
                        workOrderId: stock.work_order_id
                    },
                    type: QueryTypes.UPDATE,
                    transaction
                }
            );
        }
    }
};

/**
 * IN_TRANSIT: Update material_stock status to IN_TRANSIT, set location to received locationId
 */
const handleInTransit = async (trolleyCode, locationId, transaction) => {
    const [result] = await sequelize.query(
        `UPDATE material_stock
         SET status = 'IN_TRANSIT', location = :locationId, updated_at = NOW()
         WHERE trolley_code = :trolleyCode AND status IN ('IN_STOCK', 'IN_TRANSIT')
         RETURNING id`,
        {
            replacements: { trolleyCode, locationId },
            type: QueryTypes.UPDATE,
            transaction
        }
    );

    if (!result || result.length === 0) {
        const error = new Error(`No active material stock found for trolley: ${trolleyCode}`);
        error.statusCode = 404;
        throw error;
    }
};

/**
 * IN_STOCK: Update material_stock status to IN_STOCK, set location to store_code
 */
const handleInStock = async (trolleyCode, locationID, transaction) => {
    const [result] = await sequelize.query(
        `UPDATE material_stock
         SET status = 'IN_STOCK', location = :locationID, updated_at = NOW()
         WHERE trolley_code = :trolleyCode AND status IN ('IN_STOCK', 'IN_TRANSIT')
         RETURNING id`,
        {
            replacements: { trolleyCode, locationID },
            type: QueryTypes.UPDATE,
            transaction
        }
    );

    if (!result || result.length === 0) {
        const error = new Error(`No active material stock found for trolley: ${trolleyCode}`);
        error.statusCode = 404;
        throw error;
    }
};

module.exports = { processEvent };
