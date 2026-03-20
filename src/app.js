const express = require('express');
const cors = require('cors');
const routes = require('./routes');
const rfidEventRoutes = require('./routes/rfid-event.routes');

const app = express();

// Initialize models and associations
require('./models');

const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
    : ['http://localhost:5173', 'http://localhost:3001'];

app.use(cors({
    origin: allowedOrigins,
    credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// HTTP Request/Response Logger Middleware
app.use((req, res, next) => {
  const start = Date.now();
  const { method, originalUrl } = req;

  // Capture response body for error responses
  const originalJson = res.json.bind(res);
  let responseBody;

  res.json = (body) => {
    responseBody = body;
    return originalJson(body);
  };

  res.on('finish', () => {
    const duration = Date.now() - start;
    const statusCode = res.statusCode;

    if (statusCode >= 500) {
      console.error(`❌ ${method} ${originalUrl} → ${statusCode} (${duration}ms) | Response: ${JSON.stringify(responseBody)}`);
    } else if (statusCode >= 400) {
      console.warn(`⚠️ ${method} ${originalUrl} → ${statusCode} (${duration}ms) | Response: ${JSON.stringify(responseBody)}`);
    } else {
      console.log(`✅ ${method} ${originalUrl} → ${statusCode} (${duration}ms)`);
    }
  });

  next();
});

app.use('/api', routes);
app.use('/api/rfid-event', rfidEventRoutes);

module.exports = app;