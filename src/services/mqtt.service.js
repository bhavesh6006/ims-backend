const mqtt = require('mqtt');
const { EventEmitter } = require('events');

class MQTTService extends EventEmitter {
  constructor() {
    super();
    this.client = null;
    this.isConnected = false;
    this.reconnectInterval = 5000;
  }

  /**
   * Initialize MQTT connection
   */
  async connect() {
    try {
      const options = {
        clientId: `ims-backend-${Math.random().toString(16).slice(3)}`,
        clean: true,
        connectTimeout: 4000,
        username: process.env.MQTT_USERNAME || undefined,
        password: process.env.MQTT_PASSWORD || undefined,
        reconnectPeriod: this.reconnectInterval
      };

      this.client = mqtt.connect(process.env.MQTT_BROKER_URL, options);

      // Connection event handlers
      this.client.on('connect', () => {
        console.log('✅ Connected to MQTT broker');
        this.isConnected = true;
        this.subscribeToTopics();
      });

      this.client.on('error', (error) => {
        console.error('❌ MQTT connection error:', error.message);
        this.isConnected = false;
      });

      this.client.on('reconnect', () => {
        console.log('🔄 Reconnecting to MQTT broker...');
      });

      this.client.on('close', () => {
        console.log('⚠️ MQTT connection closed');
        this.isConnected = false;
      });

      this.client.on('offline', () => {
        console.log('📴 MQTT client offline');
        this.isConnected = false;
      });

      // Message handler
      this.client.on('message', (topic, message) => {
        this.handleMessage(topic, message);
      });

    } catch (error) {
      console.error('Failed to initialize MQTT:', error);
      throw error;
    }
  }

  /**
   * Subscribe to RFID and BLE topics
   */
  subscribeToTopics() {
    const topics = [
      process.env.MQTT_TOPIC_RFID_EVENTS || 'rfid/events/#',
      process.env.MQTT_TOPIC_BLE_EVENTS || 'ble/events/#',
      process.env.MQTT_TOPIC_GATE_EVENTS || 'gate/events/#',
      process.env.MQTT_TOPIC_READER_STATUS || 'reader/status/#'
    ];

    topics.forEach(topic => {
      this.client.subscribe(topic, { qos: 1 }, (err) => {
        if (err) {
          console.error(`Failed to subscribe to ${topic}:`, err);
        } else {
          console.log(`📡 Subscribed to topic: ${topic}`);
        }
      });
    });
  }

  /**
   * Handle incoming MQTT messages
   */
  handleMessage(topic, message) {
    try {
      const payload = JSON.parse(message.toString());
      
      if (topic.startsWith('rfid/events')) {
        this.handleRFIDEvent(payload);
      } else if (topic.startsWith('ble/events')) {
        this.handleBLEEvent(payload);
      } else if (topic.startsWith('gate/events')) {
        this.handleGateEvent(payload);
      } else if (topic.startsWith('reader/status')) {
        this.handleReaderStatus(payload);
      }
    } catch (error) {
      console.error('Error handling MQTT message:', error);
      console.error('Topic:', topic);
      console.error('Message:', message.toString());
    }
  }

  /**
   * Handle RFID tag read events
   */
  handleRFIDEvent(payload) {
    console.log('📌 RFID Event:', payload);
    
    const event = {
      type: 'rfid',
      timestamp: new Date(),
      readerId: payload.readerId || payload.reader_id,
      antennaId: payload.antennaId || payload.antenna_id,
      antennaPort: payload.antennaPort || payload.antenna_port,
      epc: payload.epc || payload.tag,
      tid: payload.tid,
      rssi: payload.rssi,
      phase: payload.phase,
      frequency: payload.frequency,
      readCount: payload.readCount || payload.read_count || 1,
      firstSeenTime: payload.firstSeenTime || payload.first_seen_time,
      lastSeenTime: payload.lastSeenTime || payload.last_seen_time || new Date(),
      raw: payload
    };

    // Emit event for processing by movement service
    this.emit('rfid-read', event);
  }

  /**
   * Handle BLE beacon events
   */
  handleBLEEvent(payload) {
    console.log('📍 BLE Event:', payload);
    
    const event = {
      type: 'ble',
      timestamp: new Date(),
      gatewayId: payload.gatewayId || payload.gateway_id,
      beaconMac: payload.beaconMac || payload.mac_address,
      uuid: payload.uuid,
      major: payload.major,
      minor: payload.minor,
      rssi: payload.rssi,
      distance: payload.distance,
      txPower: payload.txPower || payload.tx_power,
      raw: payload
    };

    // Emit event for processing
    this.emit('ble-beacon', event);
  }

  /**
   * Handle gate crossing events
   */
  handleGateEvent(payload) {
    console.log('🚪 Gate Event:', payload);
    
    const event = {
      type: 'gate',
      timestamp: new Date(),
      gateId: payload.gateId || payload.gate_id,
      trollyId: payload.trollyId || payload.trolly_id,
      rfidTag: payload.rfidTag || payload.rfid_tag,
      direction: payload.direction,
      raw: payload
    };

    // Emit event for processing
    this.emit('gate-crossing', event);
  }

  /**
   * Handle reader status updates
   */
  handleReaderStatus(payload) {
    console.log('🔧 Reader Status:', payload);
    
    const status = {
      readerId: payload.readerId || payload.reader_id,
      status: payload.status,
      temperature: payload.temperature,
      uptime: payload.uptime,
      timestamp: new Date(),
      raw: payload
    };

    // Emit status update
    this.emit('reader-status', status);
  }

  /**
   * Publish message to MQTT topic
   */
  publish(topic, message, options = {}) {
    if (!this.isConnected || !this.client) {
      console.error('Cannot publish: MQTT client not connected');
      return false;
    }

    const payload = typeof message === 'string' ? message : JSON.stringify(message);
    
    this.client.publish(topic, payload, { qos: options.qos || 1, retain: options.retain || false }, (err) => {
      if (err) {
        console.error(`Failed to publish to ${topic}:`, err);
      }
    });

    return true;
  }

  /**
   * Disconnect from MQTT broker
   */
  async disconnect() {
    if (this.client) {
      return new Promise((resolve) => {
        this.client.end(false, () => {
          console.log('MQTT client disconnected');
          this.isConnected = false;
          resolve();
        });
      });
    }
  }

  /**
   * Get connection status
   */
  getStatus() {
    return {
      connected: this.isConnected,
      brokerUrl: process.env.MQTT_BROKER_URL
    };
  }
}

// Export singleton instance
module.exports = new MQTTService();
