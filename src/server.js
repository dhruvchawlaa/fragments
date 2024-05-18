// src/server.js

// We want to gracefully shutdown our server
const stoppable = require('stoppable');

// Get our logger instance
const logger = require('./logger');

// Get the desired port from the process' environment. Default to `8080`
const port = parseInt(process.env.PORT || '8080', 10);

// Get our express app instance
const app = require('./app');

// Start a server listening on this port
const server = stoppable(
  app.listen(port, () => {
    // Conditional check for printing environment variables
    if (process.env.LOG_LEVEL === 'debug') {
      // Log all environment variables
      logger.debug('Environment variables:');
      logger.debug(process.env);
    }

    // Log a message that the server has started, and which port it's using.
    logger.info(`Server started on port ${port}`);
  })
);

// Export our server instance so other parts of our code can access it if necessary.
module.exports = server;
