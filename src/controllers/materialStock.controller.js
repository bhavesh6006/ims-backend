const { MaterialStock, StoreLocation } = require('../models');
const { Op } = require('sequelize');

// Create new material stock entry
exports.createMaterialStock = async (req, res) => {
  try {
    const {
      material_code,
      trolley_code,
      quantity,
      location,
      work_order_id,
      work_order_number,
      loading_type,
      loaded_by,
      loaded_at,
      status,
      remarks
    } = req.body;

    // Validate required fields
    if (!material_code || !trolley_code || !quantity) {
      return res.status(400).json({
        success: false,
        message: 'material_code, trolley_code, and quantity are required'
      });
    }

    // Validate quantity
    if (quantity < 0) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be a positive number'
      });
    }

    const materialStock = await MaterialStock.create({
      material_code,
      trolley_code,
      quantity,
      location: location || null,
      work_order_id: work_order_id || null,
      work_order_number: work_order_number || null,
      loading_type: loading_type || null,
      loaded_by: loaded_by || null,
      loaded_at: loaded_at || new Date().toISOString(),
      status: status || 'IN_STOCK',
      remarks: remarks || null
    });

    res.status(201).json({
      success: true,
      message: 'Material stock created successfully',
      data: materialStock
    });

  } catch (error) {
    console.error('Error creating material stock:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating material stock',
      error: error.message
    });
  }
};

// Get all material stocks with filters
exports.getAllMaterialStocks = async (req, res) => {
  try {
    const {
      material_code,
      trolley_code,
      work_order_number,
      status,
      location,
      page = 1,
      limit = 50
    } = req.query;

    const where = {};

    if (material_code) {
      where.material_code = { [Op.iLike]: `%${material_code}%` };
    }
    if (trolley_code) {
      where.trolley_code = { [Op.iLike]: `%${trolley_code}%` };
    }
    if (work_order_number) {
      where.work_order_number = { [Op.iLike]: `%${work_order_number}%` };
    }
    if (status) {
      where.status = status;
    }
    if (location) {
      where.location = { [Op.iLike]: `%${location}%` };
    }

    const offset = (page - 1) * limit;

    const { count, rows } = await MaterialStock.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']]
    });

    res.status(200).json({
      success: true,
      data: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit),
        stocks: rows
      }
    });

  } catch (error) {
    console.error('Error fetching material stocks:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching material stocks',
      error: error.message
    });
  }
};

// Get material stock by ID
exports.getMaterialStockById = async (req, res) => {
  try {
    const { id } = req.params;

    const materialStock = await MaterialStock.findByPk(id);

    if (!materialStock) {
      return res.status(404).json({
        success: false,
        message: 'Material stock not found'
      });
    }

    res.status(200).json({
      success: true,
      data: materialStock
    });

  } catch (error) {
    console.error('Error fetching material stock:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching material stock',
      error: error.message
    });
  }
};

// Get material stocks by material code
exports.getMaterialStocksByMaterialCode = async (req, res) => {
  try {
    const { materialCode } = req.params;

    const stocks = await MaterialStock.findAll({
      where: { material_code: materialCode },
      order: [['created_at', 'DESC']]
    });

    res.status(200).json({
      success: true,
      data: stocks
    });

  } catch (error) {
    console.error('Error fetching material stocks by material code:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching material stocks',
      error: error.message
    });
  }
};

// Get material stocks by trolley code
exports.getMaterialStocksByTrolleyCode = async (req, res) => {
  try {
    const { trolleyCode } = req.params;

    const stocks = await MaterialStock.findAll({
      where: { trolley_code: trolleyCode },
      order: [['created_at', 'DESC']]
    });

    res.status(200).json({
      success: true,
      data: stocks
    });

  } catch (error) {
    console.error('Error fetching material stocks by trolley code:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching material stocks',
      error: error.message
    });
  }
};

// Get material stocks by work order
exports.getMaterialStocksByWorkOrder = async (req, res) => {
  try {
    const { workOrderNumber } = req.params;

    const stocks = await MaterialStock.findAll({
      where: { work_order_id: workOrderNumber },
      order: [['created_at', 'DESC']]
    });

    // Fetch location names for all unique location IDs
    const locationIds = [...new Set(stocks.map(s => s.location).filter(Boolean))];
    const locations = locationIds.length
      ? await StoreLocation.findAll({
          where: { store_location_id: locationIds },
          attributes: ['store_location_id', 'store_name']
        })
      : [];
    const locationMap = Object.fromEntries(
      locations.map(loc => [loc.store_location_id, loc.store_name])
    );

    const data = stocks.map(stock => ({
      ...stock.toJSON(),
      location_name: locationMap[stock.location] || null
    }));

    res.status(200).json({
      success: true,
      data
    });

  } catch (error) {
    console.error('Error fetching material stocks by work order:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching material stocks',
      error: error.message
    });
  }
};

// Update material stock
exports.updateMaterialStock = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      quantity,
      location,
      status,
      loading_type,
      remarks
    } = req.body;

    const materialStock = await MaterialStock.findByPk(id);

    if (!materialStock) {
      return res.status(404).json({
        success: false,
        message: 'Material stock not found'
      });
    }

    // Update only provided fields
    if (quantity !== undefined) {
      if (quantity < 0) {
        return res.status(400).json({
          success: false,
          message: 'Quantity must be a positive number'
        });
      }
      materialStock.quantity = quantity;
    }
    if (loading_type !== undefined) materialStock.loading_type = loading_type;
    if (location !== undefined) materialStock.location = location;
    if (status !== undefined) materialStock.status = status;
    if (remarks !== undefined) materialStock.remarks = remarks;

    await materialStock.save();

    res.status(200).json({
      success: true,
      message: 'Material stock updated successfully',
      data: materialStock
    });

  } catch (error) {
    console.error('Error updating material stock:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating material stock',
      error: error.message
    });
  }
};

// Update material stock status
exports.updateMaterialStockStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['IN_STOCK', 'IN_TRANSIT', 'CONSUMED'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Valid status is required (IN_STOCK, IN_TRANSIT, CONSUMED)'
      });
    }

    const materialStock = await MaterialStock.findByPk(id);

    if (!materialStock) {
      return res.status(404).json({
        success: false,
        message: 'Material stock not found'
      });
    }

    materialStock.status = status;
    await materialStock.save();

    res.status(200).json({
      success: true,
      message: 'Material stock status updated successfully',
      data: materialStock
    });

  } catch (error) {
    console.error('Error updating material stock status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating status',
      error: error.message
    });
  }
};

// Delete material stock
exports.deleteMaterialStock = async (req, res) => {
  try {
    const { id } = req.params;

    const materialStock = await MaterialStock.findByPk(id);

    if (!materialStock) {
      return res.status(404).json({
        success: false,
        message: 'Material stock not found'
      });
    }

    await materialStock.destroy();

    res.status(200).json({
      success: true,
      message: 'Material stock deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting material stock:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting material stock',
      error: error.message
    });
  }
};

// Get stock summary by material
exports.getStockSummaryByMaterial = async (req, res) => {
  try {
    const { materialCode } = req.params;

    const summary = await MaterialStock.findAll({
      where: { material_code: materialCode },
      attributes: [
        'status',
        [sequelize.fn('SUM', sequelize.col('quantity')), 'total_quantity'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'record_count']
      ],
      group: ['status']
    });

    res.status(200).json({
      success: true,
      data: {
        material_code: materialCode,
        summary
      }
    });

  } catch (error) {
    console.error('Error fetching stock summary:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching stock summary',
      error: error.message
    });
  }
};
