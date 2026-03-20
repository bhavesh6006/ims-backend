const sequelize = require('../config/database');
const { QueryTypes } = require('sequelize');

// Helper to safely emit socket events
const emitLoadingUpdate = (data) => {
    try {
        const { emitToWorkOrders } = require('../config/socket');
        const payload = {
            event: 'loading:stockUpdate',
            ...data,
            timestamp: new Date().toISOString()
        };
        emitToWorkOrders('loading:stockUpdate', [data.workOrderId].filter(Boolean), payload);
        console.log(`[Socket.IO] Emitted loading:stockUpdate for trolley ${data.trolleyCode}`);
    } catch (err) {
        console.error('[Socket.IO] Failed to emit loading event:', err.message);
    }
};

const processLoading = async (params) => {
    const {
        trolleyCode, trolleyId, trolleyTypeId,
        materialCode, materialId,
        workOrderId, workOrderNumber,
        qrCode, loadedBy
    } = params;

    const transaction = await sequelize.transaction();

    try {
        // 1. Get trolley's current loading_status
        const [trolley] = await sequelize.query(
            `SELECT trolley_id, trolley_code, loading_status, is_occupied
             FROM trolley
             WHERE trolley_id = :trolleyId`,
            {
                replacements: { trolleyId },
                type: QueryTypes.SELECT,
                transaction
            }
        );

        if (!trolley) {
            await transaction.rollback();
            return {
                success: false,
                message: `Trolley not found with ID: ${trolleyId}`
            };
        }

        // 2. Get the mapping for this material + trolley type
        const [mapping] = await sequelize.query(
            `SELECT mapping_id, trolley_type_id, material_id, max_quantity,
                    mapping_group_id, group_total_quantity, is_group_mapping
             FROM trolley_material_mapping
             WHERE material_id = :materialId
               AND trolley_type_id = :trolleyTypeId
               AND status = 'ACTIVE'
             LIMIT 1`,
            {
                replacements: { materialId, trolleyTypeId },
                type: QueryTypes.SELECT,
                transaction
            }
        );

        if (!mapping) {
            await transaction.rollback();
            return {
                success: false,
                message: 'No mapping found for this material-cart type combination'
            };
        }

        const isGroupMapping = mapping.is_group_mapping;
        const mappingGroupId = mapping.mapping_group_id;
        const maxQuantity = mapping.max_quantity;

        if (!isGroupMapping) {
            // === INDIVIDUAL (non-group) mapping ===

            // Check trolley loading_status - must be EMPTY for individual loading
            if (trolley.loading_status === 'FULL_LOADED') {
                await transaction.rollback();
                return {
                    success: false,
                    message: `Cart/Container already fully loaded with code: ${materialCode}`
                };
            }

            if (trolley.loading_status === 'PARTIAL_LOADED') {
                await transaction.rollback();
                return {
                    success: false,
                    message: `Cart/Container is partially loaded with group materials. Cannot load individual material.`
                };
            }

            // Also check if this material is already loaded on this trolley (by material_code + trolley_code)
            const existingMaterialOnTrolley = await sequelize.query(
                `SELECT id FROM material_stock
                 WHERE trolley_code = :trolleyCode 
                   AND material_code = :materialCode
                   AND status IN ('IN_STOCK', 'IN_TRANSIT')`,
                {
                    replacements: { trolleyCode, materialCode },
                    type: QueryTypes.SELECT,
                    transaction
                }
            );

            if (existingMaterialOnTrolley.length > 0) {
                await transaction.rollback();
                return {
                    success: false,
                    message: `Material ${materialCode} is already loaded on cart ${trolleyCode}`
                };
            }

            // Create material_stock entry
            const stockResult = await sequelize.query(
                `INSERT INTO material_stock 
                 (material_code, trolley_code, quantity, loading_type, status, loaded_at, 
                  remarks, work_order_id, work_order_number, loaded_by, mapping_group_id)
                 VALUES (:materialCode, :trolleyCode, :quantity, 'FULL', 'IN_STOCK', NOW(),
                         :remarks, :workOrderId, :workOrderNumber, :loadedBy, NULL)
                 RETURNING id`,
                {
                    replacements: {
                        materialCode,
                        trolleyCode,
                        quantity: maxQuantity,
                        remarks: `Loaded in cart ${trolleyCode}`,
                        workOrderId,
                        workOrderNumber,
                        loadedBy
                    },
                    type: QueryTypes.SELECT,
                    transaction
                }
            );

            // Update trolley: occupied + FULL_LOADED
            await sequelize.query(
                `UPDATE trolley SET is_occupied = TRUE, loading_status = 'FULL_LOADED', updated_at = NOW()
                 WHERE trolley_id = :trolleyId`,
                {
                    replacements: { trolleyId },
                    type: QueryTypes.UPDATE,
                    transaction
                }
            );

            await transaction.commit();

            emitLoadingUpdate({
                trolleyCode,
                materialCode,
                workOrderId,
                workOrderNumber,
                quantity: maxQuantity,
                loadingType: 'FULL',
                isGroupMapping: false
            });

            return {
                success: true,
                message: 'Cart loaded successfully (individual mapping)',
                data: {
                    id: stockResult[0]?.id,
                    trolley_code: trolleyCode,
                    material_code: materialCode,
                    quantity: maxQuantity,
                    loading_type: 'FULL',
                    status: 'IN_STOCK',
                    mapping_group_id: null
                },
                loadingType: 'FULL',
                quantity: maxQuantity
            };

        } else {
            // === GROUP mapping ===

            // Block if trolley is FULL_LOADED
            if (trolley.loading_status === 'FULL_LOADED') {
                await transaction.rollback();
                return {
                    success: false,
                    message: `Cart/Container already fully loaded with code: ${materialCode}`
                };
            }

            // Get all group members
            const groupMembers = await sequelize.query(
                `SELECT tmm.mapping_id, tmm.material_id, tmm.max_quantity,
                        m.material_code
                 FROM trolley_material_mapping tmm
                 JOIN material m ON m.material_id = tmm.material_id
                 WHERE tmm.mapping_group_id = :mappingGroupId
                   AND tmm.status = 'ACTIVE'`,
                {
                    replacements: { mappingGroupId },
                    type: QueryTypes.SELECT,
                    transaction
                }
            );

            const totalGroupMembers = groupMembers.length;

            // Check if this specific material is already loaded on this trolley (by material_code + trolley_code)
            const alreadyLoadedMaterial = await sequelize.query(
                `SELECT id FROM material_stock
                 WHERE trolley_code = :trolleyCode 
                   AND material_code = :materialCode
                   AND status IN ('IN_STOCK', 'IN_TRANSIT')`,
                {
                    replacements: { trolleyCode, materialCode },
                    type: QueryTypes.SELECT,
                    transaction
                }
            );

            if (alreadyLoadedMaterial.length > 0) {
                await transaction.rollback();
                return {
                    success: false,
                    message: `Material ${materialCode} is already loaded on this cart. Load a different group material.`
                };
            }

            // If trolley is PARTIAL_LOADED, check it has stock from the SAME group (not a different group or individual)
            if (trolley.loading_status === 'PARTIAL_LOADED') {
                const existingOtherGroupStock = await sequelize.query(
                    `SELECT id, mapping_group_id FROM material_stock
                     WHERE trolley_code = :trolleyCode
                       AND status IN ('IN_STOCK', 'IN_TRANSIT')
                       AND (mapping_group_id IS NULL OR mapping_group_id != :mappingGroupId)`,
                    {
                        replacements: { trolleyCode, mappingGroupId },
                        type: QueryTypes.SELECT,
                        transaction
                    }
                );
                if (existingOtherGroupStock.length > 0) {
                    await transaction.rollback();
                    return {
                        success: false,
                        message: `Cart/Container already occupied with materials from a different group or individual mapping`
                    };
                }
            }

            // If trolley is EMPTY, check there's no stale individual stock
            if (trolley.loading_status === 'EMPTY') {
                const existingIndividualStock = await sequelize.query(
                    `SELECT id FROM material_stock
                     WHERE trolley_code = :trolleyCode 
                       AND mapping_group_id IS NULL
                       AND status IN ('IN_STOCK', 'IN_TRANSIT')`,
                    {
                        replacements: { trolleyCode },
                        type: QueryTypes.SELECT,
                        transaction
                    }
                );
                if (existingIndividualStock.length > 0) {
                    await transaction.rollback();
                    return {
                        success: false,
                        message: `Cart/Container already occupied with an individual material load`
                    };
                }
            }

            // Count how many group materials are already loaded on this trolley for this group
            const existingGroupStock = await sequelize.query(
                `SELECT id, material_code, quantity
                 FROM material_stock
                 WHERE trolley_code = :trolleyCode 
                   AND mapping_group_id = :mappingGroupId
                   AND status IN ('IN_STOCK', 'IN_TRANSIT')`,
                {
                    replacements: { trolleyCode, mappingGroupId },
                    type: QueryTypes.SELECT,
                    transaction
                }
            );

            const loadedSoFar = existingGroupStock.length;
            const willBeFullyLoaded = (loadedSoFar + 1) >= totalGroupMembers;

            // Create material_stock entry
            const loadingType = willBeFullyLoaded ? 'FULL' : 'PARTIAL';
            const stockResult = await sequelize.query(
                `INSERT INTO material_stock 
                 (material_code, trolley_code, quantity, loading_type, status, loaded_at,
                  remarks, work_order_id, work_order_number, loaded_by, mapping_group_id)
                 VALUES (:materialCode, :trolleyCode, :quantity, :loadingType, 'IN_STOCK', NOW(),
                         :remarks, :workOrderId, :workOrderNumber, :loadedBy, :mappingGroupId)
                 RETURNING id`,
                {
                    replacements: {
                        materialCode,
                        trolleyCode,
                        quantity: maxQuantity,
                        loadingType,
                        remarks: `Group loaded in cart ${trolleyCode} (${loadedSoFar + 1}/${totalGroupMembers})`,
                        workOrderId,
                        workOrderNumber,
                        loadedBy,
                        mappingGroupId
                    },
                    type: QueryTypes.SELECT,
                    transaction
                }
            );

            // Update trolley loading_status
            const newLoadingStatus = willBeFullyLoaded ? 'FULL_LOADED' : 'PARTIAL_LOADED';
            const newIsOccupied = willBeFullyLoaded ? true : false;
            await sequelize.query(
                `UPDATE trolley 
                 SET is_occupied = :newIsOccupied, 
                     loading_status = :newLoadingStatus, 
                     updated_at = NOW()
                 WHERE trolley_id = :trolleyId`,
                {
                    replacements: { trolleyId, newLoadingStatus, newIsOccupied },
                    type: QueryTypes.UPDATE,
                    transaction
                }
            );

            // If fully loaded, update previously loaded entries to FULL loading_type
            if (willBeFullyLoaded && existingGroupStock.length > 0) {
                await sequelize.query(
                    `UPDATE material_stock 
                     SET loading_type = 'FULL', updated_at = NOW()
                     WHERE trolley_code = :trolleyCode 
                       AND mapping_group_id = :mappingGroupId
                       AND status IN ('IN_STOCK', 'IN_TRANSIT')`,
                    {
                        replacements: { trolleyCode, mappingGroupId },
                        type: QueryTypes.UPDATE,
                        transaction
                    }
                );
            }

            await transaction.commit();

            emitLoadingUpdate({
                trolleyCode,
                materialCode,
                workOrderId,
                workOrderNumber,
                quantity: maxQuantity,
                loadingType,
                isGroupMapping: true,
                groupInfo: {
                    mapping_group_id: mappingGroupId,
                    total_members: totalGroupMembers,
                    loaded_count: loadedSoFar + 1,
                    is_fully_loaded: willBeFullyLoaded
                }
            });

            // Build remaining materials info
            const loadedMaterialCodes = [...existingGroupStock.map(s => s.material_code), materialCode];
            const remainingMembers = groupMembers.filter(
                gm => !loadedMaterialCodes.includes(gm.material_code)
            );

            return {
                success: true,
                message: willBeFullyLoaded
                    ? `Cart fully loaded (all ${totalGroupMembers} group materials loaded)`
                    : `Cart partially loaded (${loadedSoFar + 1}/${totalGroupMembers} group materials). Remaining: ${remainingMembers.map(r => r.material_code).join(', ')}`,
                data: {
                    id: stockResult[0]?.id,
                    trolley_code: trolleyCode,
                    material_code: materialCode,
                    quantity: maxQuantity,
                    loading_type: loadingType,
                    status: 'IN_STOCK',
                    mapping_group_id: mappingGroupId
                },
                loadingType,
                quantity: maxQuantity,
                groupInfo: {
                    mapping_group_id: mappingGroupId,
                    total_members: totalGroupMembers,
                    loaded_count: loadedSoFar + 1,
                    is_fully_loaded: willBeFullyLoaded,
                    remaining_materials: remainingMembers.map(r => r.material_code)
                }
            };
        }

    } catch (error) {
        await transaction.rollback();
        throw error;
    }
};

module.exports = { processLoading };
