const { Trolly, MovementTracking, Gate, RFIDAntenna, StoreLocation } = require('../models');
const { v4: uuidv4 } = require('uuid');
const websocketService = require('./websocket.service');

class MovementService {
  constructor() {
    this.rfidEventCache = new Map(); // Cache for deduplication
    this.cacheTimeout = parseInt(process.env.RFID_DUPLICATE_READ_WINDOW) || 2000;
  }

  /**
   * Process RFID read event and detect movement
   */
  async processRFIDEvent(rfidEvent) {
    try {
      const { epc, readerId, antennaId, antennaPort, rssi, timestamp } = rfidEvent;

      // Deduplicate rapid successive reads
      if (this.isDuplicate(epc, antennaId, timestamp)) {
        console.log(`⏭️ Skipping duplicate read for tag ${epc}`);
        return null;
      }

      // Find trolly by RFID tag
      const trolly = await Trolly.findOne({
        where: { rfid_tag: epc },
        include: [{ model: StoreLocation, as: 'currentLocation' }]
      });

      if (!trolly) {
        console.warn(`⚠️ Unknown RFID tag: ${epc}`);
        return null;
      }

      // Find antenna and associated gate
      const antenna = await RFIDAntenna.findOne({
        where: { antenna_id: antennaId },
        include: [
          { model: StoreLocation, as: 'storeLocation' }
        ]
      });

      if (!antenna) {
        console.warn(`⚠️ Unknown antenna: ${antennaId}`);
        return null;
      }

      // Find gate associated with this antenna
      const gate = await Gate.findOne({
        where: {
          $or: [
            { entry_antenna_id: antenna.id },
            { exit_antenna_id: antenna.id },
            { zone_a_antenna_id: antenna.id },
            { zone_b_antenna_id: antenna.id }
          ]
        },
        include: [
          { model: RFIDAntenna, as: 'entryAntenna' },
          { model: RFIDAntenna, as: 'exitAntenna' },
          { model: StoreLocation, as: 'fromLocation' },
          { model: StoreLocation, as: 'toLocation' }
        ]
      });

      if (!gate) {
        console.warn(`⚠️ No gate found for antenna ${antennaId}`);
        return null;
      }

      // Determine movement direction
      const movementType = this.determineMovementType(antenna, gate);
      const direction = this.determineDirection(antenna, gate);

      // Create movement tracking record
      const movement = await this.createMovementRecord({
        trolly,
        antenna,
        gate,
        rfidEvent,
        movementType,
        direction
      });

      // Update trolly location
      await this.updateTrollyLocation(trolly, gate, movementType);

      // Broadcast movement via WebSocket
      websocketService.broadcastTrollyMovement({
        trackingId: movement.tracking_id,
        trollyId: trolly.trolly_id,
        trollyType: trolly.trolly_type,
        fromLocationId: movement.from_location_id,
        toLocationId: movement.to_location_id,
        gateId: gate.gate_id,
        gateName: gate.gate_name,
        movementType: movement.movement_type,
        direction: movement.direction,
        timestamp: movement.rfid_read_time
      });

      console.log(`✅ Movement tracked: ${trolly.trolly_id} - ${movementType} via ${gate.gate_name}`);
      return movement;

    } catch (error) {
      console.error('Error processing RFID event:', error);
      throw error;
    }
  }

  /**
   * Check if RFID read is duplicate (within time window)
   */
  isDuplicate(epc, antennaId, timestamp) {
    const cacheKey = `${epc}-${antennaId}`;
    const lastRead = this.rfidEventCache.get(cacheKey);

    if (lastRead) {
      const timeDiff = new Date(timestamp) - new Date(lastRead);
      if (timeDiff < this.cacheTimeout) {
        return true;
      }
    }

    // Update cache
    this.rfidEventCache.set(cacheKey, timestamp);

    // Clean old cache entries
    setTimeout(() => {
      this.rfidEventCache.delete(cacheKey);
    }, this.cacheTimeout);

    return false;
  }

  /**
   * Determine movement type based on antenna role
   */
  determineMovementType(antenna, gate) {
    if (gate.gate_type === 'entry' && antenna.id === gate.entry_antenna_id) {
      return 'entry';
    }
    if (gate.gate_type === 'exit' && antenna.id === gate.exit_antenna_id) {
      return 'exit';
    }
    if (gate.gate_type === 'bidirectional') {
      if (antenna.id === gate.entry_antenna_id) {
        return 'entry';
      } else if (antenna.id === gate.exit_antenna_id) {
        return 'exit';
      }
    }
    return 'zone_movement';
  }

  /**
   * Determine movement direction
   */
  determineDirection(antenna, gate) {
    if (antenna.antenna_role === 'entry') {
      return 'inbound';
    }
    if (antenna.antenna_role === 'exit') {
      return 'outbound';
    }
    return 'lateral';
  }

  /**
   * Create movement tracking record
   */
  async createMovementRecord({ trolly, antenna, gate, rfidEvent, movementType, direction }) {
    const trackingId = `TRK-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    const movementData = {
      tracking_id: trackingId,
      trolly_id: trolly.id,
      rfid_tag: rfidEvent.epc,
      from_location_id: trolly.current_location_id,
      to_location_id: movementType === 'entry' ? antenna.store_location_id : null,
      gate_id: gate.id,
      antenna_id: antenna.id,
      reader_id: antenna.reader_id,
      movement_type: movementType,
      direction: direction,
      detection_method: 'rfid',
      rfid_read_time: rfidEvent.timestamp || new Date(),
      rssi: rfidEvent.rssi,
      read_count: rfidEvent.readCount || 1,
      raw_event_data: rfidEvent.raw || rfidEvent,
      processed_at: new Date()
    };

    // If exiting, set destination based on gate configuration
    if (movementType === 'exit' && gate.to_location_id) {
      movementData.to_location_id = gate.to_location_id;
    }

    const movement = await MovementTracking.create(movementData);
    return movement;
  }

  /**
   * Update trolly's current location
   */
  async updateTrollyLocation(trolly, gate, movementType) {
    let newLocationId = null;

    if (movementType === 'entry' && gate.to_location_id) {
      newLocationId = gate.to_location_id;
    } else if (movementType === 'exit' && gate.from_location_id) {
      newLocationId = gate.from_location_id;
    }

    if (newLocationId) {
      await trolly.update({
        current_location_id: newLocationId,
        last_scanned_at: new Date()
      });
    } else {
      await trolly.update({
        last_scanned_at: new Date()
      });
    }
  }

  /**
   * Get trolly movement history
   */
  async getTrollyMovementHistory(trollyId, options = {}) {
    const { limit = 100, startDate, endDate } = options;

    const whereClause = { trolly_id: trollyId };

    if (startDate || endDate) {
      whereClause.rfid_read_time = {};
      if (startDate) whereClause.rfid_read_time.$gte = new Date(startDate);
      if (endDate) whereClause.rfid_read_time.$lte = new Date(endDate);
    }

    const movements = await MovementTracking.findAll({
      where: whereClause,
      include: [
        { model: Gate, as: 'gate' },
        { model: StoreLocation, as: 'fromLocation' },
        { model: StoreLocation, as: 'toLocation' }
      ],
      order: [['rfid_read_time', 'DESC']],
      limit
    });

    return movements;
  }

  /**
   * Get current trolly locations in a store
   */
  async getTrolliesInLocation(locationId) {
    const trollies = await Trolly.findAll({
      where: { current_location_id: locationId, status: 'active' },
      include: [
        { model: StoreLocation, as: 'currentLocation' }
      ]
    });

    return trollies;
  }

  /**
   * Detect anomalies in movement patterns
   */
  async detectAnomalies() {
    // Find trollies with suspicious movement patterns
    // Example: Multiple entries without exit, impossible travel times, etc.
    // This is a placeholder for custom anomaly detection logic
    
    const recentMovements = await MovementTracking.findAll({
      where: {
        rfid_read_time: {
          $gte: new Date(Date.now() - 3600000) // Last hour
        },
        is_anomaly: false
      },
      include: [{ model: Trolly, as: 'trolly' }]
    });

    // Implement anomaly detection logic here
    // For now, just return empty array
    return [];
  }
}

module.exports = new MovementService();
