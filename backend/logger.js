// logger.js
const { createLogger, format, transports } = require('winston');
const path = require('path');

const logger = createLogger({
  level: 'info', // or 'debug', 'error', etc.
  format: format.combine(
    format.timestamp(),
    format.printf(({ timestamp, level, message }) => {
      return `[${timestamp}] ${level.toUpperCase()}: ${message}`;
    })
  ),
  transports: [
    new transports.File({ filename: path.join(__dirname, 'logs/app.log') }), // file
    new transports.Console() // console
  ],
});

module.exports = logger;
