/**
 * Structured logging utility for production-ready logging
 * Provides consistent log formatting and level-based filtering
 */

const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

const isProduction = process.env.NODE_ENV === 'production';

// Determine log level from environment or use defaults
const getLogLevel = () => {
  const envLevel = process.env.LOG_LEVEL?.toLowerCase();
  if (envLevel && LOG_LEVELS[envLevel] !== undefined) {
    return envLevel;
  }
  return isProduction ? 'info' : 'debug';
};

const currentLevel = getLogLevel();
const currentLevelValue = LOG_LEVELS[currentLevel];

/**
 * Format log message with timestamp and level
 */
const formatMessage = (level, message, meta = {}) => {
  const timestamp = new Date().toISOString();

  if (isProduction) {
    // JSON format for production (easier to parse by log aggregators)
    return JSON.stringify({
      timestamp,
      level,
      message,
      ...meta
    });
  }

  // Human-readable format for development
  const levelStr = level.toUpperCase().padEnd(5);
  const metaStr = Object.keys(meta).length > 0
    ? ` ${JSON.stringify(meta)}`
    : '';
  return `[${timestamp}] ${levelStr} ${message}${metaStr}`;
};

/**
 * Log at specified level if it meets threshold
 */
const log = (level, message, meta = {}) => {
  if (LOG_LEVELS[level] <= currentLevelValue) {
    const formattedMessage = formatMessage(level, message, meta);

    switch (level) {
      case 'error':
        console.error(formattedMessage);
        break;
      case 'warn':
        console.warn(formattedMessage);
        break;
      default:
        console.log(formattedMessage);
    }
  }
};

/**
 * Logger interface
 */
const logger = {
  error: (message, meta) => log('error', message, meta),
  warn: (message, meta) => log('warn', message, meta),
  info: (message, meta) => log('info', message, meta),
  http: (message, meta) => log('http', message, meta),
  debug: (message, meta) => log('debug', message, meta),

  // Get current log level
  getLevel: () => currentLevel,

  // Child logger with additional context
  child: (context) => ({
    error: (message, meta) => log('error', message, { ...context, ...meta }),
    warn: (message, meta) => log('warn', message, { ...context, ...meta }),
    info: (message, meta) => log('info', message, { ...context, ...meta }),
    http: (message, meta) => log('http', message, { ...context, ...meta }),
    debug: (message, meta) => log('debug', message, { ...context, ...meta }),
  })
};

module.exports = logger;
