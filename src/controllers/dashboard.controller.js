const Trolly = require('../models/trolly.model');
const { Material, WorkOrder } = require('../models');
const { Op } = require('sequelize');
const sequelize = require('../config/database');

exports.getDashboardStats = async (req, res) => {
  try {
    const [activeTrollies, totalMaterials, pendingWorkOrders] = await Promise.all([
      Trolly.count({ where: { status: 'ACTIVE' } }),
      Material.count(),
      WorkOrder.count({ where: { status: 'PENDING' } })
    ]);

    res.status(200).json({
      success: true,
      data: {
        activeTrollies,
        totalMaterials,
        pendingWorkOrders
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve dashboard stats',
      error: error.message
    });
  }
};

exports.getDashboardMaterials = async (req, res) => {
  try {
    const rows = await sequelize.query(
      `SELECT
         m.material_id,
         m.material_code,
         m.material_name,
         m.status,
         mt.material_type,
         s.name AS subtool_name,
         COALESCE(SUM(ms.quantity), 0) AS total_quantity,
         COALESCE(SUM(CASE WHEN ms.status = 'CONSUMED' THEN ms.quantity ELSE 0 END), 0) AS consumed_quantity,
         COALESCE(SUM(CASE WHEN ms.status != 'CONSUMED' THEN ms.quantity ELSE 0 END), 0) AS in_stock_quantity
       FROM material m
       LEFT JOIN material_type mt ON m.material_type_id = mt.material_type_id
       LEFT JOIN subtool s ON m.subtool_id = s.subtool_id
       LEFT JOIN material_stock ms ON ms.material_code = m.material_code
       GROUP BY m.material_id, m.material_code, m.material_name, m.status, mt.material_type, s.name
       ORDER BY m.created_at DESC`,
      { type: sequelize.QueryTypes.SELECT }
    );

    res.status(200).json({ success: true, data: rows });
  } catch (error) {
    console.error('Error fetching dashboard materials:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve materials',
      error: error.message
    });
  }
};
