// src/app.js

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const passport = require('passport');
const authenticate = require('./auth');
const { createErrorResponse } = require('./response'); // Import the response function

const logger = require('./logger');
const pino = require('pino-http')({
  logger,
});

// Express app instance to attach middleware and HTTP routes
const app = express();

// Pino logging middleware
app.use(pino);

// helmetjs security middleware
app.use(helmet());

// CORS middleware so we can make requests across origins
app.use(cors());

// gzip/deflate compression middleware
app.use(compression());

// Passport authentication middleware
passport.use(authenticate.strategy());
app.use(passport.initialize());

// Define our routes
app.use('/', require('./routes'));

// 404 middleware to handle any requests for resources that can't be found
app.use((req, res) => {
  res.status(404).json(createErrorResponse(404, 'not found')); // Use createErrorResponse function
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  const status = err.status || 500;
  const message = err.message || 'unable to process request';

  if (status > 499) {
    logger.error({ err }, `Error processing request`);
  }

  res.status(status).json(createErrorResponse(status, message)); // Use createErrorResponse function
});

// Export our `app` so we can access it in server.js
module.exports = app;
