const { DeviceMaster } = require('../models');
const sequelize = require('../config/database');
const { Op, Sequelize } = require('sequelize');

class DeviceMasterController {
  // Get all devices with server-side pagination and search
  async getAllDevices(req, res) {
    try {
      const { page = 1, limit = 10, search = '' } = req.query;
      
      // Parse pagination parameters
      const pageNum = parseInt(page, 10);
      const limitNum = parseInt(limit, 10);
      const offset = (pageNum - 1) * limitNum;

      // Build where clause
      const whereConditions = [];

      // Add search functionality
      if (search && search.trim() !== '') {
        const searchTerm = `%${search.trim()}%`;
        whereConditions.push({
          [Op.or]: [
            { device_name: { [Op.iLike]: searchTerm } },
            { location: { [Op.iLike]: searchTerm } },
            { department: { [Op.iLike]: searchTerm } },
            { hostname: { [Op.iLike]: searchTerm } },
            { serial_no: { [Op.iLike]: searchTerm } },
            { model: { [Op.iLike]: searchTerm } },
            { manufacturer: { [Op.iLike]: searchTerm } },
            { firmware_version: { [Op.iLike]: searchTerm } },
            // Cast ENUM status to text before using ILIKE
            Sequelize.where(Sequelize.cast(Sequelize.col('DeviceMaster.status'), 'text'), { [Op.iLike]: searchTerm }),
            // Cast INET ip_address to text before using ILIKE
            Sequelize.where(Sequelize.cast(Sequelize.col('DeviceMaster.ip_address'), 'text'), { [Op.iLike]: searchTerm }),
          ]
        });
      }

      // Combine all conditions with AND
      const whereClause = whereConditions.length > 0 
        ? { [Op.and]: whereConditions }
        : {};

      // Get total count for pagination
      const totalCount = await DeviceMaster.count({ where: whereClause });

      // Fetch paginated devices
      const devices = await DeviceMaster.findAll({
        where: whereClause,
        limit: limitNum,
        offset: offset,
        order: [['created_at', 'DESC']]
      });

      // Calculate total pages
      const totalPages = Math.ceil(totalCount / limitNum);

      res.status(200).json({ 
        success: true, 
        data: devices,
        count: totalCount,
        page: pageNum,
        pageSize: limitNum,
        totalPages: totalPages
      });
    } catch (error) {
      console.error('Error fetching devices:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch devices', 
        error: error.message 
      });
    }
  }

  // Get device by ID
  async getDeviceById(req, res) {
    try {
      const device = await DeviceMaster.findOne({
        where: { device_id: req.params.id }
      });
      
      if (!device) {
        return res.status(404).json({ 
          success: false, 
          message: 'Device not found' 
        });
      }
      
      res.status(200).json({ 
        success: true, 
        data: device 
      });
    } catch (error) {
      console.error('Error fetching device:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch device', 
        error: error.message 
      });
    }
  }

  // Get device by IP address
  async getDeviceByIp(req, res) {
    try {
      const device = await DeviceMaster.findOne({
        where: { ip_address: req.params.ip }
      });
      
      if (!device) {
        return res.status(404).json({ 
          success: false, 
          message: 'Device not found' 
        });
      }
      
      res.status(200).json({ 
        success: true, 
        data: device 
      });
    } catch (error) {
      console.error('Error fetching device by IP:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch device', 
        error: error.message 
      });
    }
  }

  // Create new device
  // User provides: device_name, ip_address, location, department
  // Middleware will later update: mac_address, hostname, serial_no, firmware_version, etc.
  async createDevice(req, res) {
    try {
      const { 
        device_name, 
        ip_address, 
        location, 
        department,
        installed_on
      } = req.body;

      // Validate required fields
      if (!device_name || !ip_address) {
        return res.status(400).json({ 
          success: false, 
          message: 'device_name and ip_address are required' 
        });
      }

      // Check if IP already exists
      const existing = await DeviceMaster.findOne({ 
        where: { ip_address } 
      });
      
      if (existing) {
        return res.status(409).json({ 
          success: false, 
          message: 'Device with this IP address already exists' 
        });
      }

      // Create device with minimal user-provided data
      const device = await DeviceMaster.create({
        device_name,
        ip_address,
        location,
        department,
        installed_on: installed_on || new Date(),
        status: 'OFFLINE', // Initial status
        is_active: true
      });

      res.status(201).json({ 
        success: true, 
        message: 'Device created successfully. Middleware will sync device details.', 
        data: device 
      });
    } catch (error) {
      console.error('Error creating device:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to create device', 
        error: error.message 
      });
    }
  }

  // Update device
  // Can be used by UI or middleware to update device information
  async updateDevice(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const device = await DeviceMaster.findOne({
        where: { device_id: id }
      });

      if (!device) {
        return res.status(404).json({ 
          success: false, 
          message: 'Device not found' 
        });
      }

      // Check if IP is being changed and if it already exists
      if (updateData.ip_address && updateData.ip_address !== device.ip_address) {
        const existing = await DeviceMaster.findOne({
          where: { ip_address: updateData.ip_address }
        });
        
        if (existing) {
          return res.status(409).json({ 
            success: false, 
            message: 'Device with this IP address already exists' 
          });
        }
      }

      // Update timestamp
      updateData.updated_at = new Date();

      await device.update(updateData);

      res.status(200).json({ 
        success: true, 
        message: 'Device updated successfully', 
        data: device 
      });
    } catch (error) {
      console.error('Error updating device:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to update device', 
        error: error.message 
      });
    }
  }

  // Soft delete device (set is_active to false)
  async deleteDevice(req, res) {
    try {
      const { id } = req.params;

      const device = await DeviceMaster.findOne({
        where: { device_id: id }
      });

      if (!device) {
        return res.status(404).json({ 
          success: false, 
          message: 'Device not found' 
        });
      }

      await device.update({ 
        is_active: false,
        status: 'OFFLINE',
        updated_at: new Date()
      });

      res.status(200).json({ 
        success: true, 
        message: 'Device deactivated successfully' 
      });
    } catch (error) {
      console.error('Error deleting device:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to delete device', 
        error: error.message 
      });
    }
  }

  // Middleware endpoint: Sync device information from LLRP/SNMP
  async syncDeviceInfo(req, res) {
    try {
      const { ip_address } = req.params;
      const middlewareData = req.body;

      let device = await DeviceMaster.findOne({
        where: { ip_address }
      });

      if (!device) {
        // Middleware auto-creates device if not exists
        device = await DeviceMaster.create({
          device_name: middlewareData.device_name || `Device-${ip_address}`,
          ip_address,
          ...middlewareData,
          last_llrp_sync: new Date(),
          last_snmp_sync: new Date(),
          last_seen_time: new Date(),
          updated_at: new Date()
        });

        return res.status(201).json({ 
          success: true, 
          message: 'Device auto-created and synced', 
          data: device 
        });
      }

      // Update existing device with middleware data
      await device.update({
        ...middlewareData,
        last_llrp_sync: new Date(),
        last_snmp_sync: new Date(),
        last_seen_time: new Date(),
        status: 'ONLINE',
        updated_at: new Date()
      });

      res.status(200).json({ 
        success: true, 
        message: 'Device synced successfully', 
        data: device 
      });
    } catch (error) {
      console.error('Error syncing device:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to sync device', 
        error: error.message 
      });
    }
  }

  // Update device status (heartbeat endpoint for middleware)
  async updateDeviceStatus(req, res) {
    try {
      const { ip_address } = req.params;
      const { status, uptime_sec, cpu_usage, temperature, memory_free_mb } = req.body;

      const device = await DeviceMaster.findOne({
        where: { ip_address }
      });

      if (!device) {
        return res.status(404).json({ 
          success: false, 
          message: 'Device not found' 
        });
      }

      await device.update({
        status: status || 'ONLINE',
        last_seen_time: new Date(),
        uptime_sec,
        cpu_usage,
        temperature,
        memory_free_mb,
        updated_at: new Date()
      });

      res.status(200).json({ 
        success: true, 
        message: 'Device status updated', 
        data: device 
      });
    } catch (error) {
      console.error('Error updating device status:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to update device status', 
        error: error.message 
      });
    }
  }
}

module.exports = new DeviceMasterController();
