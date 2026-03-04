const fs = require('fs');
const path = require('path');

// Detect if running as a packaged exe (pkg sets process.pkg)
const isPkg = typeof process.pkg !== 'undefined';
const appDir = isPkg ? path.dirname(process.execPath) : __dirname;

// Load .env from the directory where the exe/script lives
const dotenvPath = path.join(appDir, '.env');
if (fs.existsSync(dotenvPath)) {
  require('dotenv').config({ path: dotenvPath });
}

// Ensure logs directory exists FIRST
const logsDir = path.join(appDir, 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Override console methods to add timestamps
const originalLog = console.log;
const originalError = console.error;
const originalWarn = console.warn;

const log = (...args) => {
  originalLog(`[${new Date().toISOString()}] [INFO]`, ...args);
};
log.__timestamped = true;
console.log = log;

console.error = (...args) => {
  originalError(`[${new Date().toISOString()}] [ERROR]`, ...args);
};
console.warn = (...args) => {
  originalWarn(`[${new Date().toISOString()}] [WARN]`, ...args);
};

// Log startup immediately to diagnose service issues
const startupLog = path.join(logsDir, 'startup.log');
fs.appendFileSync(startupLog, `[${new Date().toISOString()}] Server starting...\n`);
fs.appendFileSync(startupLog, `[${new Date().toISOString()}] isPkg: ${isPkg}\n`);
fs.appendFileSync(startupLog, `[${new Date().toISOString()}] appDir: ${appDir}\n`);
fs.appendFileSync(startupLog, `[${new Date().toISOString()}] CWD: ${process.cwd()}\n`);
fs.appendFileSync(startupLog, `[${new Date().toISOString()}] Node version: ${process.version}\n`);

let app;
try {
  app = require('./src/app');
  fs.appendFileSync(startupLog, `[${new Date().toISOString()}] App module loaded successfully\n`);
} catch (err) {
  fs.appendFileSync(startupLog, `[${new Date().toISOString()}] FAILED to load app module:\n${err.stack}\n`);
  process.exit(1);
}

// Handle uncaught exceptions
process.on('uncaughtException', function (err) {
  const logFile = path.join(logsDir, 'crash.log');
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] UNCAUGHT EXCEPTION:\n${err.stack}\n\n`;
  
  fs.appendFileSync(logFile, logEntry);
  console.error('Uncaught Exception:', err);
  
  // Exit gracefully (let NSSM restart the service)
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  const logFile = path.join(logsDir, 'crash.log');
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] UNHANDLED REJECTION:\nPromise: ${promise}\nReason: ${reason}\n\n`;
  
  fs.appendFileSync(logFile, logEntry);
  console.error('Unhandled Rejection:', reason);
  
  // Exit gracefully (let NSSM restart the service)
  process.exit(1);
});

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  const msg = `Server running on port ${PORT}`;
  console.log(msg);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Logs directory: ${logsDir}`);
  fs.appendFileSync(startupLog, `[${new Date().toISOString()}] ${msg}\n`);
}).on('error', (err) => {
  const logFile = path.join(logsDir, 'crash.log');
  const timestamp = new Date().toISOString();

  if (err.code === 'EADDRINUSE') {
    const msg = `Port ${PORT} is already in use. Stop the other process first.`;
    fs.appendFileSync(logFile, `[${timestamp}] ${msg}\n`);
    console.error(msg);
  } else {
    const logEntry = `[${timestamp}] SERVER ERROR:\n${err.stack}\n\n`;
    fs.appendFileSync(logFile, logEntry);
    console.error('Server Error:', err);
  }

  process.exit(1);
});

// Graceful shutdown for Windows service (NSSM sends these signals)
process.on('SIGTERM', () => {
  fs.appendFileSync(startupLog, `[${new Date().toISOString()}] Received SIGTERM, shutting down...\n`);
  server.close(() => {
    fs.appendFileSync(startupLog, `[${new Date().toISOString()}] Server closed.\n`);
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  fs.appendFileSync(startupLog, `[${new Date().toISOString()}] Received SIGINT, shutting down...\n`);
  server.close(() => {
    fs.appendFileSync(startupLog, `[${new Date().toISOString()}] Server closed.\n`);
    process.exit(0);
  });
});

// Keep process alive
process.stdin.resume();