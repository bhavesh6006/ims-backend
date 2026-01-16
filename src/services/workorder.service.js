const axios = require('axios');
const { WorkOrder } = require('../models');

class WorkOrderService {
  constructor() {
    this.apiBaseUrl = process.env.WO_API_BASE_URL;
    this.apiKey = process.env.WO_API_KEY;
    this.apiTimeout = parseInt(process.env.WO_API_TIMEOUT) || 10000;
    
    this.axiosInstance = axios.create({
      baseURL: this.apiBaseUrl,
      timeout: this.apiTimeout,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      }
    });
  }

  /**
   * Fetch work orders from external API
   */
  async fetchWorkOrders(filters = {}) {
    try {
      const params = {
        start_date: filters.startDate,
        end_date: filters.endDate,
        status: filters.status,
        wo_type: filters.woType,
        limit: filters.limit || 100
      };

      const response = await this.axiosInstance.get('/work-orders', { params });
      
      if (response.data && response.data.success) {
        return response.data.data || response.data.workOrders;
      }

      return [];
    } catch (error) {
      console.error('Error fetching work orders from external API:', error.message);
      throw new Error(`Failed to fetch work orders: ${error.message}`);
    }
  }

  /**
   * Fetch single work order by number
   */
  async fetchWorkOrderByNumber(woNumber) {
    try {
      const response = await this.axiosInstance.get(`/work-orders/${woNumber}`);
      
      if (response.data && response.data.success) {
        return response.data.data || response.data.workOrder;
      }

      return null;
    } catch (error) {
      if (error.response && error.response.status === 404) {
        return null;
      }
      console.error(`Error fetching work order ${woNumber}:`, error.message);
      throw error;
    }
  }

  /**
   * Sync work orders from external system to local database
   */
  async syncWorkOrders(filters = {}) {
    try {
      const externalWorkOrders = await this.fetchWorkOrders(filters);
      const syncResults = {
        total: externalWorkOrders.length,
        created: 0,
        updated: 0,
        failed: 0,
        errors: []
      };

      for (const externalWO of externalWorkOrders) {
        try {
          const woData = this.mapExternalToLocal(externalWO);
          
          const [workOrder, created] = await WorkOrder.findOrCreate({
            where: { wo_number: woData.wo_number },
            defaults: woData
          });

          if (!created) {
            await workOrder.update(woData);
            syncResults.updated++;
          } else {
            syncResults.created++;
          }
        } catch (error) {
          syncResults.failed++;
          syncResults.errors.push({
            wo_number: externalWO.wo_number || externalWO.workOrderNumber,
            error: error.message
          });
        }
      }

      console.log(`✅ Work order sync completed: ${syncResults.created} created, ${syncResults.updated} updated, ${syncResults.failed} failed`);
      return syncResults;
    } catch (error) {
      console.error('Work order sync failed:', error);
      throw error;
    }
  }

  /**
   * Map external work order data to local schema
   */
  mapExternalToLocal(externalWO) {
    return {
      wo_number: externalWO.wo_number || externalWO.workOrderNumber,
      wo_type: externalWO.wo_type || externalWO.type,
      product_code: externalWO.product_code || externalWO.productCode,
      product_description: externalWO.product_description || externalWO.description,
      quantity: externalWO.quantity,
      unit: externalWO.unit || 'pcs',
      door_types: externalWO.door_types || externalWO.doorTypes || [],
      door_orientation: externalWO.door_orientation || externalWO.doorOrientation,
      sfg_fg_classification: externalWO.sfg_fg_classification || externalWO.classification,
      start_date: externalWO.start_date || externalWO.startDate,
      due_date: externalWO.due_date || externalWO.dueDate,
      priority: externalWO.priority || 'medium',
      status: this.mapExternalStatus(externalWO.status),
      external_metadata: externalWO,
      sync_status: 'synced',
      synced_at: new Date()
    };
  }

  /**
   * Map external status to local status enum
   */
  mapExternalStatus(externalStatus) {
    const statusMap = {
      'PLANNED': 'planned',
      'RELEASED': 'released',
      'IN_PROGRESS': 'in_progress',
      'COMPLETED': 'completed',
      'CANCELLED': 'cancelled',
      'OPEN': 'released',
      'CLOSED': 'completed'
    };

    return statusMap[externalStatus?.toUpperCase()] || 'planned';
  }

  /**
   * Get work orders for operator selection (for loading trolly)
   */
  async getAvailableWorkOrders(filters = {}) {
    try {
      // First, try to get from local database
      const whereClause = {
        status: filters.status || ['planned', 'released', 'in_progress']
      };

      if (filters.startDate) {
        whereClause.start_date = { $gte: new Date(filters.startDate) };
      }

      if (filters.woType) {
        whereClause.wo_type = filters.woType;
      }

      let workOrders = await WorkOrder.findAll({
        where: whereClause,
        order: [['start_date', 'ASC'], ['priority', 'DESC']],
        limit: filters.limit || 50
      });

      // If no local work orders or sync requested, fetch from external API
      if (workOrders.length === 0 || filters.forceSync) {
        await this.syncWorkOrders(filters);
        
        workOrders = await WorkOrder.findAll({
          where: whereClause,
          order: [['start_date', 'ASC'], ['priority', 'DESC']],
          limit: filters.limit || 50
        });
      }

      return workOrders;
    } catch (error) {
      console.error('Error getting available work orders:', error);
      throw error;
    }
  }

  /**
   * Get work order details with material requirements
   */
  async getWorkOrderDetails(woNumber) {
    try {
      // Try local database first
      let workOrder = await WorkOrder.findOne({
        where: { wo_number: woNumber }
      });

      // If not found locally, fetch from external API
      if (!workOrder) {
        const externalWO = await this.fetchWorkOrderByNumber(woNumber);
        
        if (externalWO) {
          const woData = this.mapExternalToLocal(externalWO);
          workOrder = await WorkOrder.create(woData);
        }
      }

      return workOrder;
    } catch (error) {
      console.error(`Error getting work order details for ${woNumber}:`, error);
      throw error;
    }
  }

  /**
   * Update work order status in external system
   */
  async updateWorkOrderStatus(woNumber, status, notes = null) {
    try {
      const payload = {
        wo_number: woNumber,
        status: status,
        notes: notes,
        updated_at: new Date()
      };

      const response = await this.axiosInstance.put(`/work-orders/${woNumber}/status`, payload);
      
      // Update local database
      await WorkOrder.update(
        { status: this.mapExternalStatus(status), synced_at: new Date() },
        { where: { wo_number: woNumber } }
      );

      return response.data;
    } catch (error) {
      console.error(`Error updating work order status for ${woNumber}:`, error);
      throw error;
    }
  }

  /**
   * Check API health
   */
  async checkApiHealth() {
    try {
      const response = await this.axiosInstance.get('/health');
      return {
        status: 'connected',
        apiUrl: this.apiBaseUrl,
        response: response.data
      };
    } catch (error) {
      return {
        status: 'disconnected',
        apiUrl: this.apiBaseUrl,
        error: error.message
      };
    }
  }
}

module.exports = new WorkOrderService();
