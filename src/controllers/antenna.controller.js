const { Antenna, DeviceMaster, StoreLocationAntenna, StoreLocation } = require('../models');
const sequelize = require('../config/database');
const { Op } = require('sequelize');

class AntennaController {
  // Get all antennas with server-side pagination and search
  async getAllAntennas(req, res) {
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
            { antenna_name: { [Op.iLike]: searchTerm } },
            { location_name: { [Op.iLike]: searchTerm } },
            { antenna_type: { [Op.iLike]: searchTerm } },
            { manufacturer: { [Op.iLike]: searchTerm } },
            { model: { [Op.iLike]: searchTerm } }
          ]
        });
      }

      // Combine all conditions with AND
      const whereClause = whereConditions.length > 0 
        ? { [Op.and]: whereConditions }
        : {};

      // Get total count for pagination
      const totalCount = await Antenna.count({ where: whereClause });

      // Fetch paginated antennas
      const antennas = await Antenna.findAll({ 
        where: whereClause,
        limit: limitNum,
        offset: offset,
        order: [['created_at', 'DESC']],
        include: [
          {
            model: DeviceMaster,
            as: 'device',
            attributes: ['device_id', 'device_name', 'ip_address', 'location']
          },
          {
            model: StoreLocation,
            as: 'storeLocation',
            attributes: ['store_location_id', 'store_name', 'location_type_id']
          }
        ]
      });

      // Calculate total pages
      const totalPages = Math.ceil(totalCount / limitNum);

      res.status(200).json({ 
        success: true, 
        data: antennas,
        count: totalCount,
        page: pageNum,
        pageSize: limitNum,
        totalPages: totalPages
      });
    } catch (error) {
      console.error('Error fetching antennas:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch antennas', error: error.message });
    }
  }

  // Get antennas by device ID
  async getAntennasByDevice(req, res) {
    try {
      const { deviceId } = req.params;
      const antennas = await Antenna.findAll({
        where: { device_id: deviceId },
        order: [['antenna_no', 'ASC']],
        include: [
          {
            model: DeviceMaster,
            as: 'device',
            attributes: ['device_id', 'device_name', 'ip_address', 'location']
          },
          {
            model: StoreLocation,
            as: 'storeLocation',
            attributes: ['store_location_id', 'store_name', 'location_type_id']
          }
        ]
      });
      res.status(200).json({ success: true, count: antennas.length, data: antennas });
    } catch (error) {
      console.error('Error fetching antennas by device:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch antennas', error: error.message });
    }
  }

  // Get unmapped antennas (not mapped to any store location)
  async getUnmappedAntennas(req, res) {
    try {
      const antennas = await Antenna.findAll({
        include: [
          {
            model: StoreLocationAntenna,
            as: 'storeMappings',
            required: false
          },
          {
            model: DeviceMaster,
            as: 'device',
            attributes: ['device_id', 'device_name', 'ip_address', 'location']
          }
        ],
        where: {
          is_enabled: true,
          '$storeMappings.antenna_id$': null
        }
      });

      return res.status(200).json({
        success: true,
        count: antennas.length,
        data: antennas
      });
    } catch (error) {
      console.error('Error fetching unmapped antennas:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch unmapped antennas',
        error: error.message
      });
    }
  }

  // Get antenna by ID
  async getAntennaById(req, res) {
    try {
      const antenna = await Antenna.findOne({ 
        where: { antenna_id: req.params.id },
        include: [
          {
            model: DeviceMaster,
            as: 'device',
            attributes: ['device_id', 'device_name', 'ip_address', 'location']
          },
          {
            model: StoreLocation,
            as: 'storeLocation',
            attributes: ['store_location_id', 'store_name', 'location_type_id']
          }
        ]
      });
      if (!antenna) {
        return res.status(404).json({ success: false, message: 'Antenna not found' });
      }
      res.status(200).json({ success: true, data: antenna });
    } catch (error) {
      console.error('Error fetching antenna:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch antenna', error: error.message });
    }
  }

  // Create new antenna
  async createAntenna(req, res) {
    try {
      let { 
        device_id,
        antenna_no,
        antenna_name,
        location_name,
        zone_id,
        antenna_type,
        polarization,
        manufacturer,
        model,
        orientation,
        mounting_height_m,
        facing_angle_deg,
        is_enabled,
        store_location_id
      } = req.body;

      // Validate required fields
      if (!device_id || !antenna_no) {
        return res.status(400).json({ 
          success: false, 
          message: 'device_id and antenna_no are required' 
        });
      }

      if (!store_location_id) {
        return res.status(400).json({ 
          success: false, 
          message: 'store_location_id is required' 
        });
      }

      // Check if device exists
      const device = await DeviceMaster.findOne({ where: { device_id } });
      if (!device) {
        return res.status(404).json({ 
          success: false, 
          message: 'Device not found' 
        });
      }

      const storeLocation = await StoreLocation.findOne({ where: { store_location_id } });
      if (!storeLocation) {
        return res.status(404).json({
          success: false, 
          message: 'Store location not found' 
        });
      }

      // Check if antenna_no already exists for this device
      const existing = await Antenna.findOne({ 
        where: { device_id, antenna_no } 
      });
      if (existing) {
        return res.status(409).json({ 
          success: false, 
          message: `Antenna number ${antenna_no} already exists for this device` 
        });
      }

      location_name = location_name || storeLocation.store_name;
      const antenna = await Antenna.create({
        device_id,
        antenna_no,
        antenna_name,
        location_name,
        zone_id,
        antenna_type,
        polarization,
        manufacturer,
        model,
        orientation,
        mounting_height_m,
        facing_angle_deg,
        is_enabled: is_enabled !== undefined ? is_enabled : true,
        is_connected: false, // Will be updated by middleware
        store_location_id
      });

      // Fetch the created antenna with device details
      const createdAntenna = await Antenna.findOne({
        where: { antenna_id: antenna.antenna_id },
        include: [
          {
            model: DeviceMaster,
            as: 'device',
            attributes: ['device_id', 'device_name', 'ip_address', 'location']
          },
          {
            model: StoreLocation,
            as: 'storeLocation',
            attributes: ['store_location_id', 'store_name', 'location_type_id']
          }
        ]
      });

      res.status(201).json({ 
        success: true, 
        message: 'Antenna created successfully', 
        data: createdAntenna 
      });
    } catch (error) {
      console.error('Error creating antenna:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to create antenna', 
        error: error.message 
      });
    }
  }

  // Update antenna
  async updateAntenna(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const antenna = await Antenna.findOne({
        where: { antenna_id: id }
      });

      if (!antenna) {
        return res.status(404).json({ 
          success: false, 
          message: 'Antenna not found' 
        });
      }

      const storeLocation = await StoreLocation.findOne({ where: { store_location_id: updateData.store_location_id } });
      if (!storeLocation) {
        return res.status(404).json({
          success: false, 
          message: 'Store location not found' 
        });
      }

      // If updating antenna_no, check for conflicts
      if (updateData.antenna_no && updateData.antenna_no !== antenna.antenna_no) {
        const existing = await Antenna.findOne({
          where: { 
            device_id: antenna.device_id, 
            antenna_no: updateData.antenna_no 
          }
        });
        if (existing) {
          return res.status(409).json({ 
            success: false, 
            message: `Antenna number ${updateData.antenna_no} already exists for this device` 
          });
        }
      }

      // Update timestamp
      updateData.updated_at = new Date();
      updateData.location_name = updateData.location_name || storeLocation.store_name;

      await antenna.update(updateData);

      // Fetch updated antenna with device details
      const updatedAntenna = await Antenna.findOne({
        where: { antenna_id: id },
        include: [
          {
            model: DeviceMaster,
            as: 'device',
            attributes: ['device_id', 'device_name', 'ip_address', 'location']
          },
          {
            model: StoreLocation,
            as: 'storeLocation',
            attributes: ['store_location_id', 'store_name', 'location_type_id']
          }
        ]
      });

      res.status(200).json({ 
        success: true, 
        message: 'Antenna updated successfully', 
        data: updatedAntenna 
      });
    } catch (error) {
      console.error('Error updating antenna:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to update antenna', 
        error: error.message 
      });
    }
  }

  // Delete antenna
  async deleteAntenna(req, res) {
    const transaction = await sequelize.transaction();
    try {
      const antenna = await Antenna.findOne({ 
        where: { antenna_id: req.params.id }, 
        transaction 
      });
      
      if (!antenna) {
        await transaction.rollback();
        return res.status(404).json({ 
          success: false, 
          message: 'Antenna not found' 
        });
      }

      // // Delete associated store location mappings first
      // await StoreLocationAntenna.destroy({ 
      //   where: { antenna_id: antenna.antenna_id }, 
      //   transaction 
      // });
      
      // Delete the antenna
      await antenna.destroy({ transaction });
      
      await transaction.commit();
      res.status(200).json({ 
        success: true, 
        message: 'Antenna and its store mappings deleted successfully' 
      });
    } catch (error) {
      await transaction.rollback();
      console.error('Error deleting antenna:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to delete antenna', 
        error: error.message 
      });
    }
  }

  // Middleware endpoint: Update antenna connection status
  async updateAntennaStatus(req, res) {
    try {
      const { device_id, antenna_no } = req.params;
      const { is_connected, tx_power_dbm, rx_sensitivity } = req.body;

      const antenna = await Antenna.findOne({
        where: { device_id, antenna_no }
      });

      if (!antenna) {
        return res.status(404).json({ 
          success: false, 
          message: 'Antenna not found' 
        });
      }

      await antenna.update({
        is_connected: is_connected !== undefined ? is_connected : antenna.is_connected,
        tx_power_dbm: tx_power_dbm !== undefined ? tx_power_dbm : antenna.tx_power_dbm,
        rx_sensitivity: rx_sensitivity !== undefined ? rx_sensitivity : antenna.rx_sensitivity,
        last_seen_time: new Date(),
        updated_at: new Date()
      });

      res.status(200).json({ 
        success: true, 
        message: 'Antenna status updated', 
        data: antenna 
      });
    } catch (error) {
      console.error('Error updating antenna status:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to update antenna status', 
        error: error.message 
      });
    }
  }
}

module.exports = new AntennaController();
