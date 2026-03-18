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

exports.getDashboardTrollies = async (req, res) => {
  try {
    const { page = 1, limit = 10, occupied, type, location, subtool } = req.query;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const offset = (pageNum - 1) * limitNum;
    const replacements = { limit: limitNum, offset };

    const baseWhere = [`t.status = 'ACTIVE'`];
    if (type)             { baseWhere.push(`tt.trolly_type ILIKE :type`);           replacements.type     = `%${type}%`; }
    if (occupied === 'true')  baseWhere.push(`t.is_occupied = true`);
    if (occupied === 'false') baseWhere.push(`t.is_occupied = false`);

    const cteWhere = [];
    if (location) { cteWhere.push(`location_name ILIKE :location`); replacements.location = `%${location}%`; }
    if (subtool)  { cteWhere.push(`subtool ILIKE :subtool`);         replacements.subtool  = `%${subtool}%`; }

    const baseWhereClause = baseWhere.join(' AND ');
    const cteWhereClause  = cteWhere.length ? `WHERE ${cteWhere.join(' AND ')}` : '';

    const cteQuery = `
      WITH base AS (
        SELECT
          t.trolley_id,
          t.trolley_code,
          t.is_occupied,
          tt.trolly_type,
          tc.name AS trolly_condition,
          (
            SELECT sl.store_name
            FROM material_stock ms
            JOIN store_location sl ON sl.store_location_id::text = ms.location
            WHERE ms.trolley_code = t.trolley_code
              AND ms.location IS NOT NULL
            ORDER BY ms.loaded_at DESC
            LIMIT 1
          ) AS location_name,
          (
            SELECT string_agg(DISTINCT s.name, ', ')
            FROM material_stock ms2
            JOIN material m ON m.material_code = ms2.material_code
            LEFT JOIN subtool s ON s.subtool_id = m.subtool_id
            WHERE ms2.trolley_code = t.trolley_code
              AND ms2.status != 'CONSUMED'
              AND s.name IS NOT NULL
          ) AS subtool
        FROM trolley t
        LEFT JOIN trolly_type tt ON tt.trolly_type_id = t.trolly_type_id
        LEFT JOIN trolley_condition tc ON tc.trolley_condition_id = t.trolley_condition_id
        WHERE ${baseWhereClause}
      )
    `;

    const [countResult] = await sequelize.query(
      `${cteQuery} SELECT COUNT(*)::int AS total FROM base ${cteWhereClause}`,
      { replacements, type: sequelize.QueryTypes.SELECT }
    );
    const total = parseInt(countResult.total, 10);

    const rows = await sequelize.query(
      `${cteQuery} SELECT * FROM base ${cteWhereClause} ORDER BY trolley_code ASC LIMIT :limit OFFSET :offset`,
      { replacements, type: sequelize.QueryTypes.SELECT }
    );

    res.status(200).json({ success: true, data: rows, total, page: pageNum, limit: limitNum });
  } catch (error) {
    console.error('Error fetching dashboard trollies:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve trollies',
      error: error.message
    });
  }
};

exports.getDashboardMaterials = async (req, res) => {
  try {
    const { page = 1, limit = 10, type, location, subtool } = req.query;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const offset = (pageNum - 1) * limitNum;
    const replacements = { limit: limitNum, offset };

    const cteWhere = [];
    if (type)     { cteWhere.push(`material_type ILIKE :type`);     replacements.type     = `%${type}%`; }
    if (location) { cteWhere.push(`location_name ILIKE :location`); replacements.location = `%${location}%`; }
    if (subtool)  { cteWhere.push(`subtool_name ILIKE :subtool`);   replacements.subtool  = `%${subtool}%`; }

    const cteWhereClause = cteWhere.length ? `WHERE ${cteWhere.join(' AND ')}` : '';

    const cteQuery = `
      WITH base AS (
        SELECT
          m.material_code,
          mt.material_type,
          s.name AS subtool_name,
          wo.door_colour,
          wo.handle,
          wo.micom,
          wo.lock1 AS lock_type,
          wo.disp_type,
          COALESCE(SUM(CASE WHEN ms.status != 'CONSUMED' THEN ms.quantity ELSE 0 END), 0) AS in_stock_quantity,
          (
            SELECT sl.store_name
            FROM material_stock ms2
            JOIN store_location sl ON sl.store_location_id::text = ms2.location
            WHERE ms2.material_code = m.material_code
              AND ms2.location IS NOT NULL
            ORDER BY ms2.loaded_at DESC
            LIMIT 1
          ) AS location_name
        FROM material m
        LEFT JOIN material_type mt ON m.material_type_id = mt.material_type_id
        LEFT JOIN subtool s ON m.subtool_id = s.subtool_id
        LEFT JOIN material_stock ms ON ms.material_code = m.material_code
        LEFT JOIN work_orders wo ON wo.work_order_number = ms.work_order_number
        GROUP BY m.material_code, mt.material_type, s.name,
                 wo.door_colour, wo.handle, wo.micom, wo.lock1, wo.disp_type
      )
    `;

    const [countResult] = await sequelize.query(
      `${cteQuery} SELECT COUNT(*) AS total FROM base ${cteWhereClause}`,
      { replacements, type: sequelize.QueryTypes.SELECT }
    );
    const total = parseInt(countResult.total, 10);

    const rows = await sequelize.query(
      `${cteQuery} SELECT * FROM base ${cteWhereClause} ORDER BY subtool_name ASC, material_code ASC LIMIT :limit OFFSET :offset`,
      { replacements, type: sequelize.QueryTypes.SELECT }
    );

    res.status(200).json({ success: true, data: rows, total, page: pageNum, limit: limitNum });
  } catch (error) {
    console.error('Error fetching dashboard materials:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve materials',
      error: error.message
    });
  }
};
