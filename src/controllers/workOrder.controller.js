const { WorkOrder } = require('../models');
const { Op } = require('sequelize');
const { WorkOrderRefresh } = require('../models');
const axios = require('axios');

// Create new work order
exports.createWorkOrder = async (req, res) => {
  try {
    // Only single work order creation logic
    const {
      work_order_number,
      sr_no,
      date,
      tool,
      sub_tool,
      door_colour,
      handle,
      micom,
      lock1,
      disp_type,
      input_plan,
      output_plan,
      consumed_quantity,
      balance_quantity,
      status,
      created_by
    } = req.body;

    if (!work_order_number || !sr_no || !date || !tool || !sub_tool || !input_plan) {
      return res.status(400).json({
        success: false,
        message: 'work_order_number, sr_no, date, tool, sub_tool, and input_plan are required'
      });
    }
    // Check if combination exists
    const exists = await WorkOrder.findOne({ where: { work_order_number, sub_tool } });
    if (exists) {
      return res.status(409).json({
        success: false,
        message: 'Work order number and sub_tool combination already exists'
      });
    }
    const payload = {
      work_order_number,
      sr_no,
      date,
      tool,
      sub_tool,
      door_colour: door_colour || null,
      handle: handle || null,
      micom: micom || null,
      lock1: lock1 || null,
      disp_type: disp_type || null,
      input_plan,
      consumed_quantity: consumed_quantity || 0,
      balance_quantity: balance_quantity || 0,
      output_plan: output_plan || 0,
      status: status || 'PENDING',
      created_by: created_by || null
    };
    const workOrder = await WorkOrder.create(payload);
    res.status(201).json({
      success: true,
      message: 'Work order created successfully',
      data: workOrder
    });
  } catch (error) {
    console.error('Error creating work order:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating work order',
      error: error.message
    });
  }
};

// Get all work orders with filters and pagination
exports.getAllWorkOrders = async (req, res) => {
  try {
    const {
      work_order_number,
      tool,
      sub_tool,
      status,
      date_from,
      date_to,
      page = 1,
      limit = 50
    } = req.query;

    const where = {};

    if (work_order_number) {
      where.work_order_number = { [Op.iLike]: `%${work_order_number}%` };
    }
    if (tool) {
      where.tool = { [Op.iLike]: `%${tool}%` };
    }
    if (sub_tool) {
      where.sub_tool = { [Op.iLike]: `%${sub_tool}%` };
    }
    if (status) {
      where.status = status;
    }
    if (date_from && date_to) {
      where.date = {
        [Op.between]: [date_from, date_to]
      };
    } else if (date_from) {
      where.date = { [Op.gte]: date_from };
    } else if (date_to) {
      where.date = { [Op.lte]: date_to };
    }

    const offset = (page - 1) * limit;

    const { count, rows } = await WorkOrder.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['date', 'DESC'], ['sr_no', 'ASC']]
    });

    res.status(200).json({
      success: true,
      data: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit),
        workOrders: rows
      }
    });

  } catch (error) {
    console.error('Error fetching work orders:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching work orders',
      error: error.message
    });
  }
};

exports.getWorkOrderSummary = async (req, res) => {
  try {
    const { date_from, date_to } = req.query;
    const where = {};

    // Validate presence
    if (!date_from || !date_to) {
      return res.status(400).json({
        success: false,
        message: 'Both date_from and date_to are required.'
      });
    }

    // Validate proper date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date_from) || !dateRegex.test(date_to)) {
      return res.status(400).json({
        success: false,
        message: 'date_from and date_to must be in YYYY-MM-DD format.'
      });
    }

    // Check if valid date
    const fromDate = new Date(date_from);
    const toDate = new Date(date_to);
    if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'date_from and date_to must be valid dates.'
      });
    }

    where.date = {
      [Op.between]: [date_from, date_to]
    };

    const summary = await WorkOrder.findAll({
      where,
      order: [['date', 'DESC'], ['sr_no', 'ASC']]
    });

    res.status(200).json({
      success: true,
      data: {
        workOrders: summary
      }
    });
  } catch (error) {
    console.error('Error fetching work order summary:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching work order summary',
      error: error.message
    });
  }
};

exports.getWorkOrderRefreshSummary = async (req, res) => {
  try {
    const now = new Date();
    const pad = n => n.toString().padStart(2, '0');
    const plan_date = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

    const payload = {
      credentials: {
        plan_date
      }
    };

    let response = null;
    // Get local time as last_refresh
    const localDate = new Date();
    try {
      response = await axios.post(process.env.REFRESH_DAILY_WORK_ORDERS, payload);

      console.log('Refresh API called:', process.env.REFRESH_DAILY_WORK_ORDERS, 'Payload:', payload, 'Response status:', response.status);
      console.log('Response data:', response?.data?.data || 'No data in response');

      // Store refresh status and reason for each attempt
      let status = 'success';
      let failed_reason = null;
      if (!response) {
        failed_reason = 'API is down or unreachable.';
      }

      await WorkOrderRefresh.create({
        last_refresh: localDate,
        status,
        failed_reason
      });
    } catch (error) {
      console.error('Error calling refresh API:', error);
      let failed_reason = error && error.message ? error.message : 'API is down or unreachable.';
      await WorkOrderRefresh.create({
        last_refresh: localDate,
        status: 'failure',
        failed_reason
      });
    }

    // Batch create work orders from response
    if (response && response.data && response.data.data && Array.isArray(response.data.data) && response.data.data.length > 0) {
      for (const orderObj of response.data.data) {
        let {
          W_O,
          wo_lot_qty,
          seq_no,
          tool,
          sub_tool,
          door_color,
          handel,
          micom,
          lock1,
          disp_type,
          plan_qty,
          shift_no,
          date,
          created_by
        } = orderObj;
        if (W_O && wo_lot_qty) {
          const workOrderNumbers = W_O.split(',').map(s => s.trim());
          const quantities = wo_lot_qty.split(',').map(s => parseInt(s.trim(), 10));
          for (let i = 0; i < workOrderNumbers.length; i++) {
            const woNum = workOrderNumbers[i];
            const qty = quantities[i];
            const exists = await WorkOrder.findOne({ where: { work_order_number: woNum, sub_tool } });
            if (exists) continue;
            const payload = {
              work_order_number: woNum,
              sr_no: seq_no || i + 1,
              date: plan_date,
              tool,
              sub_tool,
              door_colour: door_color || null,
              handle: handel || null,
              micom: micom || null,
              lock1: lock1 || null,
              disp_type: disp_type || null,
              input_plan: qty,
              consumed_quantity: 0,
              balance_quantity: 0,
              output_plan: 0,
              status: 'PENDING',
              created_by: created_by || null
            };
            await WorkOrder.create(payload);
            console.log(`Created work order ${woNum} with quantity ${qty}`);
          }
        }
      }
    }

    res.status(200).json({
      success: true,
      last_refresh: localDate.toISOString()
    });
  } catch (error) {
    console.error('Error fetching work order refresh summary:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching work order refresh summary',
      error: error.message
    });
  }
};

exports.getLastRefreshDate = async (req, res) => {
  try {
    const lastRefresh = await WorkOrderRefresh.findOne({
      order: [['id', 'DESC']]
    });

    // Convert last_refresh to IST (local time zone)
    let last_refresh_local = null;
    if (lastRefresh && lastRefresh.last_refresh) {
      const date = new Date(lastRefresh.last_refresh);
      // IST is UTC+5:30
      date.setMinutes(date.getMinutes() + 330);
      last_refresh_local = date.toISOString().replace('T', ' ').substring(0, 19);
    }
    res.status(200).json({
      success: true,
      last_refresh: last_refresh_local
    });
  } catch (error) {
    console.error('Error fetching last refresh date:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching last refresh date',
      error: error.message
    });
  }
};

// Get work order by ID
exports.getWorkOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    const workOrder = await WorkOrder.findByPk(id);

    if (!workOrder) {
      return res.status(404).json({
        success: false,
        message: 'Work order not found'
      });
    }

    res.status(200).json({
      success: true,
      data: workOrder
    });

  } catch (error) {
    console.error('Error fetching work order:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching work order',
      error: error.message
    });
  }
};

// Get work order by work order number
exports.getWorkOrderByNumber = async (req, res) => {
  try {
    const { workOrderNumber } = req.params;

    const workOrder = await WorkOrder.findOne({
      where: { work_order_number: workOrderNumber }
    });

    if (!workOrder) {
      return res.status(404).json({
        success: false,
        message: 'Work order not found'
      });
    }

    res.status(200).json({
      success: true,
      data: workOrder
    });

  } catch (error) {
    console.error('Error fetching work order:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching work order',
      error: error.message
    });
  }
};

// Update work order
exports.updateWorkOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      sr_no,
      date,
      tool,
      sub_tool,
      door_colour,
      handle,
      micom,
      lock1,
      disp_type,
      input_plan,
      output_plan,
      consumed_quantity,
      balance_quantity,
      status,
      updated_by
    } = req.body;

    const workOrder = await WorkOrder.findByPk(id);

    if (!workOrder) {
      return res.status(404).json({
        success: false,
        message: 'Work order not found'
      });
    }

    // Update only provided fields
    if (sr_no !== undefined) workOrder.sr_no = sr_no;
    if (date !== undefined) workOrder.date = date;
    if (tool !== undefined) workOrder.tool = tool;
    if (sub_tool !== undefined) workOrder.sub_tool = sub_tool;
    if (door_colour !== undefined) workOrder.door_colour = door_colour;
    if (handle !== undefined) workOrder.handle = handle;
    if (micom !== undefined) workOrder.micom = micom;
    if (lock1 !== undefined) workOrder.lock1 = lock1;
    if (disp_type !== undefined) workOrder.disp_type = disp_type;
    if (input_plan !== undefined) workOrder.input_plan = input_plan;
    if (consumed_quantity !== undefined) workOrder.consumed_quantity = consumed_quantity;
    if (balance_quantity !== undefined) workOrder.balance_quantity = balance_quantity;
    if (output_plan !== undefined) workOrder.output_plan = output_plan;
    if (status !== undefined) workOrder.status = status;
    if (updated_by !== undefined) workOrder.updated_by = updated_by;

    await workOrder.save();

    res.status(200).json({
      success: true,
      message: 'Work order updated successfully',
      data: workOrder
    });

  } catch (error) {
    console.error('Error updating work order:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating work order',
      error: error.message
    });
  }
};

// Update work order status
exports.updateWorkOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, updated_by } = req.body;

    if (!status || !['PENDING', 'IN_PROGRESS', 'CLOSED'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Valid status is required (PENDING, IN_PROGRESS, CLOSED)'
      });
    }

    const workOrder = await WorkOrder.findByPk(id);

    if (!workOrder) {
      return res.status(404).json({
        success: false,
        message: 'Work order not found'
      });
    }

    workOrder.status = status;
    if (updated_by) workOrder.updated_by = updated_by;
    await workOrder.save();

    res.status(200).json({
      success: true,
      message: 'Work order status updated successfully',
      data: workOrder
    });

  } catch (error) {
    console.error('Error updating work order status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating status',
      error: error.message
    });
  }
};

// Update output plan
exports.updateOutputPlan = async (req, res) => {
  try {
    const { id } = req.params;
    const { output_plan, updated_by } = req.body;

    if (output_plan === undefined || output_plan < 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid output_plan is required'
      });
    }

    const workOrder = await WorkOrder.findByPk(id);

    if (!workOrder) {
      return res.status(404).json({
        success: false,
        message: 'Work order not found'
      });
    }

    workOrder.output_plan = output_plan;

    // Auto-update status based on output_plan
    if (output_plan === 0) {
      workOrder.status = 'PENDING';
    } else if (output_plan < workOrder.input_plan) {
      workOrder.status = 'IN_PROGRESS';
    } else if (output_plan >= workOrder.input_plan) {
      workOrder.status = 'CLOSED';
    }

    if (updated_by) workOrder.updated_by = updated_by;
    await workOrder.save();

    res.status(200).json({
      success: true,
      message: 'Output plan updated successfully',
      data: workOrder
    });

  } catch (error) {
    console.error('Error updating output plan:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating output plan',
      error: error.message
    });
  }
};

// Delete work order
exports.deleteWorkOrder = async (req, res) => {
  try {
    const { id } = req.params;

    const workOrder = await WorkOrder.findByPk(id);

    if (!workOrder) {
      return res.status(404).json({
        success: false,
        message: 'Work order not found'
      });
    }

    await workOrder.destroy();

    res.status(200).json({
      success: true,
      message: 'Work order deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting work order:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting work order',
      error: error.message
    });
  }
};

// Get work order statistics
exports.getWorkOrderStats = async (req, res) => {
  try {
    const stats = await WorkOrder.findAll({
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('input_plan')), 'total_input'],
        [sequelize.fn('SUM', sequelize.col('output_plan')), 'total_output']
      ],
      group: ['status']
    });

    res.status(200).json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Error fetching work order stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching statistics',
      error: error.message
    });
  }
};
