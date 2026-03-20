const rfidEventService = require('../services/rfid-event.service');

const processRfidEvent = async (req, res) => {
    try {
        let { EPC, LocationID, ZoneID, AnteenaId, DeviceId, Type } = req.body;

        // Validate required fields
        if (Type === 'Manual'){
            if (!EPC || !Type) {
                return res.status(400).json({
                    success: false,
                    message: 'Missing required fields: EPC, Type'
                });
            } else if (Type === 'Manual') {
                LocationID = '3290aa81-5b10-42cf-b5cc-de2b50aec0c8';
                ZoneID = null;
                AnteenaId = null;
                DeviceId = null;
            } else {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid Type value.'
                });
            }
        } else {
            if (!EPC || !LocationID || !AnteenaId || !DeviceId) {
                return res.status(400).json({
                    success: false,
                    message: 'Missing required fields: EPC, LocationID, AnteenaId, DeviceId'
                });
            }
        }

        const result = await rfidEventService.processEvent({
            epc: EPC,
            locationId: LocationID,
            zoneId: ZoneID,
            antennaId: AnteenaId,
            deviceId: DeviceId
        });

        return res.status(200).json({
            success: true,
            message: result.message,
            data: result.data || null
        });
    } catch (error) {
        console.error('RFID Event processing error:', error.message);

        const statusCode = error.statusCode || 500;
        return res.status(statusCode).json({
            success: false,
            message: error.message || 'Internal server error'
        });
    }
};

module.exports = { processRfidEvent };
