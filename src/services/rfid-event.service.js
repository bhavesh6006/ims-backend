const { sequelize } = require('../config/db.config');
const { QueryTypes } = require('sequelize');

const processEvent = async ({ epc, locationId, zoneId, antennaId, deviceId }) => {
    const transaction = await sequelize.transaction();

    try {
        // 1. Get store_location by store_code (LocationID) and its location_type
        const [storeLocation] = await sequelize.query(
            `SELECT sl.store_location_id, sl.store_code, sl.store_name, sl.location_type_id,
                    lt.name AS location_type_name
             FROM store_location sl
             JOIN location_type lt ON lt.location_type_id = sl.location_type_id
             WHERE sl.store_code = :storeCode AND sl.status = 'ACTIVE'`,
            {
                replacements: { storeCode: locationId },
                type: QueryTypes.SELECT,
                transaction
            }
        );

        if (!storeLocation) {
            const error = new Error(`Store location not found for code: ${locationId}`);
            error.statusCode = 404;
            throw error;
        }

        const locationType = storeLocation.location_type_name.toUpperCase();

        // 2. Get trolley by QR code (EPC)
        const [trolley] = await sequelize.query(
            `SELECT trolley_id, trolley_code, qr_code
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
            await handleConsumed(trolleyCode, transaction);
        } else if (locationType === 'IN_TRANSIT') {
            await handleInTransit(trolleyCode, transaction);
        } else if (locationType === 'IN_STOCK') {
            await handleInStock(trolleyCode, locationId, transaction);
        } else {
            const error = new Error(`Unknown location type: ${locationType}`);
            error.statusCode = 400;
            throw error;
        }

        // 4. Update trolley is_occupied based on status
        if (locationType === 'CONSUMED') {
            await sequelize.query(
                `UPDATE trolley SET is_occupied = FALSE, updated_at = NOW()
                 WHERE trolley_code = :trolleyCode`,
                {
                    replacements: { trolleyCode },
                    type: QueryTypes.UPDATE,
                    transaction
                }
            );
        }

        await transaction.commit();

        return {
            message: `RFID event processed successfully. Location type: ${locationType}`,
            data: {
                trolleyCode,
                locationType,
                storeCode: locationId
            }
        };
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
};

/**
 * CONSUMED: Update material_stock status to CONSUMED,
 * then update work_orders consumed_quantity and balance_quantity
 */
const handleConsumed = async (trolleyCode, transaction) => {
    // Get all active material_stock records for this trolley
    const stockRecords = await sequelize.query(
        `SELECT id, material_code, trolley_code, quantity, work_order_id, work_order_number
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

    for (const stock of stockRecords) {
        // Update material_stock status to CONSUMED
        await sequelize.query(
            `UPDATE material_stock
             SET status = 'CONSUMED', location = NULL, updated_at = NOW()
             WHERE id = :stockId`,
            {
                replacements: { stockId: stock.id },
                type: QueryTypes.UPDATE,
                transaction
            }
        );

        // Update work_orders: add to consumed_quantity, subtract from balance_quantity
        if (stock.work_order_id) {
            await sequelize.query(
                `UPDATE work_orders
                 SET consumed_quantity = consumed_quantity + :quantity,
                     balance_quantity = GREATEST(balance_quantity - :quantity, 0),
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
 * IN_TRANSIT: Update material_stock status to IN_TRANSIT, set location to NULL
 */
const handleInTransit = async (trolleyCode, transaction) => {
    const [result] = await sequelize.query(
        `UPDATE material_stock
         SET status = 'IN_TRANSIT', location = NULL, updated_at = NOW()
         WHERE trolley_code = :trolleyCode AND status IN ('IN_STOCK', 'IN_TRANSIT')
         RETURNING id`,
        {
            replacements: { trolleyCode },
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
const handleInStock = async (trolleyCode, storeCode, transaction) => {
    const [result] = await sequelize.query(
        `UPDATE material_stock
         SET status = 'IN_STOCK', location = :storeCode, updated_at = NOW()
         WHERE trolley_code = :trolleyCode AND status IN ('IN_STOCK', 'IN_TRANSIT')
         RETURNING id`,
        {
            replacements: { trolleyCode, storeCode },
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
