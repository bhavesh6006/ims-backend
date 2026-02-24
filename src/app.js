const express = require('express');
const cors = require('cors');
const routes = require('./routes');
const rfidEventRoutes = require('./routes/rfid-event.routes');

const app = express();

// Initialize models and associations
require('./models');

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use('/api', routes);
app.use('/api/rfid-event', rfidEventRoutes);

module.exports = app;