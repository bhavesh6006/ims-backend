const { Trolly, Material, TrollyLoading, TrollyMaterialMapping, WorkOrder, StoreLocation } = require('../models');
const workOrderService = require('../services/workorder.service');
const websocketService = require('../services/websocket.service');

class OperatorController {
  /**
   * Scan trolly by RFID/Barcode/QR
   */
  async scanTrolly(req, res) {
    try {
      const { identifier, scanType } = req.body; // scanType: rfid, barcode, qr

      let whereClause = {};
      if (scanType === 'rfid') {
        whereClause.rfid_tag = identifier;
      } else if (scanType === 'barcode') {
        whereClause.barcode = identifier;
      } else if (scanType === 'qr') {
        whereClause.qr_code = identifier;
      } else {
        whereClause.trolly_id = identifier;
      }

      const trolly = await Trolly.findOne({
        where: whereClause,
        include: [{ model: StoreLocation, as: 'currentLocation' }]
      });

      if (!trolly) {
        return res.status(404).json({
          success: false,
          message: `Trolly not found with ${scanType}: ${identifier}`
        });
      }

      if (trolly.status !== 'active') {
        return res.status(400).json({
          success: false,
          message: `Trolly is ${trolly.status}, cannot be used`
        });
      }

      res.status(200).json({
        success: true,
        message: 'Trolly scanned successfully',
        data: {
          trolly: trolly,
          currentLocation: trolly.currentLocation
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to scan trolly',
        error: error.message
      });
    }
  }

  /**
   * Get available work orders for operator selection
   */
  async getWorkOrders(req, res) {
    try {
      const { startDate, endDate, woType, status } = req.query;

      const workOrders = await workOrderService.getAvailableWorkOrders({
        startDate,
        endDate,
        woType,
        status: status || ['planned', 'released', 'in_progress'],
        limit: 50
      });

      res.status(200).json({
        success: true,
        count: workOrders.length,
        data: workOrders
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve work orders',
        error: error.message
      });
    }
  }

  /**
   * Get trolly-material compatibility
   */
  async getCompatibility(req, res) {
    try {
      const { trollyId, materialId } = req.params;

      const trolly = await Trolly.findOne({ where: { trolly_id: trollyId } });
      const material = await Material.findOne({ where: { material_id: materialId } });

      if (!trolly) {
        return res.status(404).json({ success: false, message: 'Trolly not found' });
      }

      if (!material) {
        return res.status(404).json({ success: false, message: 'Material not found' });
      }

      // Find trolly-material mapping
      const mapping = await TrollyMaterialMapping.findOne({
        where: {
          trolly_type: trolly.trolly_type,
          material_type: material.material_type,
          status: 'active'
        }
      });

      if (!mapping) {
        return res.status(200).json({
          success: true,
          compatible: false,
          message: 'No compatibility mapping found'
        });
      }

      res.status(200).json({
        success: true,
        compatible: true,
        data: {
          maxCapacity: mapping.max_capacity,
          positionWiseCapacity: mapping.position_wise_capacity,
          weightLimit: mapping.weight_limit,
          allowedPositions: material.allowed_positions
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to check compatibility',
        error: error.message
      });
    }
  }

  /**
   * Load trolly with materials (full or partial)
   */
  async loadTrolly(req, res) {
    try {
      const {
        trollyId,
        workOrderNumber,
        materialId,
        loadingType, // 'full' or 'partial'
        quantityLoaded,
        positions, // ['left', 'right', 'left_upper', etc.]
        positionDetails, // {left: 5, right: 5}
        locationId,
        notes
      } = req.body;

      const operatorId = req.user.id;

      // Validate trolly
      const trolly = await Trolly.findOne({ where: { trolly_id: trollyId } });
      if (!trolly) {
        return res.status(404).json({ success: false, message: 'Trolly not found' });
      }

      // Validate material
      const material = await Material.findOne({ where: { material_id: materialId } });
      if (!material) {
        return res.status(404).json({ success: false, message: 'Material not found' });
      }

      // Validate work order
      let workOrder = null;
      if (workOrderNumber) {
        workOrder = await WorkOrder.findOne({ where: { wo_number: workOrderNumber } });
        if (!workOrder) {
          // Try to fetch from external API
          workOrder = await workOrderService.getWorkOrderDetails(workOrderNumber);
        }
      }

      // Check trolly-material compatibility
      const mapping = await TrollyMaterialMapping.findOne({
        where: {
          trolly_type: trolly.trolly_type,
          material_type: material.material_type,
          status: 'active'
        }
      });

      if (!mapping) {
        return res.status(400).json({
          success: false,
          message: 'Trolly and material are not compatible'
        });
      }

      // Validate quantity and positions
      if (loadingType === 'full' && quantityLoaded > mapping.max_capacity) {
        return res.status(400).json({
          success: false,
          message: `Quantity ${quantityLoaded} exceeds maximum capacity ${mapping.max_capacity}`
        });
      }

      // Validate positions
      if (positions && positions.length > 0) {
        const invalidPositions = positions.filter(pos => !material.allowed_positions.includes(pos));
        if (invalidPositions.length > 0) {
          return res.status(400).json({
            success: false,
            message: `Invalid positions for this material: ${invalidPositions.join(', ')}`
          });
        }
      }

      // Create loading record
      const loadingId = `LOAD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      const loading = await TrollyLoading.create({
        loading_id: loadingId,
        trolly_id: trolly.id,
        work_order_id: workOrder ? workOrder.id : null,
        material_id: material.id,
        store_location_id: locationId,
        loading_type: loadingType,
        quantity_loaded: quantityLoaded,
        positions_used: positions || [],
        position_details: positionDetails || {},
        operator_id: operatorId,
        loading_timestamp: new Date(),
        status: 'loaded',
        notes: notes
      });

      // Broadcast loading event via WebSocket
      websocketService.broadcastTrollyLoading({
        loadingId: loading.loading_id,
        trollyId: trolly.trolly_id,
        materialId: material.material_id,
        loadingType: loading.loading_type,
        quantity: loading.quantity_loaded,
        operator: req.user.ldap_username,
        timestamp: loading.loading_timestamp
      });

      res.status(201).json({
        success: true,
        message: 'Trolly loaded successfully',
        data: loading
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to load trolly',
        error: error.message
      });
    }
  }

  /**
   * Unload trolly
   */
  async unloadTrolly(req, res) {
    try {
      const { loadingId } = req.params;
      const operatorId = req.user.id;

      const loading = await TrollyLoading.findOne({
        where: { loading_id: loadingId },
        include: [
          { model: Trolly, as: 'trolly' },
          { model: Material, as: 'material' }
        ]
      });

      if (!loading) {
        return res.status(404).json({
          success: false,
          message: 'Loading record not found'
        });
      }

      if (loading.status === 'unloaded') {
        return res.status(400).json({
          success: false,
          message: 'Trolly already unloaded'
        });
      }

      await loading.update({
        unloading_timestamp: new Date(),
        unloaded_by_id: operatorId,
        status: 'unloaded'
      });

      res.status(200).json({
        success: true,
        message: 'Trolly unloaded successfully',
        data: loading
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to unload trolly',
        error: error.message
      });
    }
  }

  /**
   * Get operator's loading history
   */
  async getLoadingHistory(req, res) {
    try {
      const operatorId = req.user.id;
      const { limit = 50, startDate, endDate } = req.query;

      const whereClause = { operator_id: operatorId };

      if (startDate || endDate) {
        whereClause.loading_timestamp = {};
        if (startDate) whereClause.loading_timestamp.$gte = new Date(startDate);
        if (endDate) whereClause.loading_timestamp.$lte = new Date(endDate);
      }

      const loadings = await TrollyLoading.findAll({
        where: whereClause,
        include: [
          { model: Trolly, as: 'trolly' },
          { model: Material, as: 'material' },
          { model: WorkOrder, as: 'workOrder' }
        ],
        order: [['loading_timestamp', 'DESC']],
        limit: parseInt(limit)
      });

      res.status(200).json({
        success: true,
        count: loadings.length,
        data: loadings
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve loading history',
        error: error.message
      });
    }
  }
}

module.exports = new OperatorController();
