const express = require('express');
const { createSuccessResponse } = require('../response'); // Import the response functions
const { hostname } = require('os');

// version and author from package.json
const { version, author } = require('../../package.json');

// A router that we can use to mount our API
const router = express.Router();

// Our authentication middleware
const { authenticate } = require('../auth');

/**
 * Expose all of our API routes on /v1/* to include an API version.
 */
router.use(`/v1`, authenticate(), require('./api'));

/**
 * Define a simple health check route. If the server is running
 * we'll respond with a 200 OK.  If not, the server isn't healthy.
 */
router.get('/', (req, res) => {
  // Client's shouldn't cache this response (always request it fresh)
  res.setHeader('Cache-Control', 'no-cache');
  // Send a 200 'OK' response using createSuccessResponse function
  res.status(200).json(
    createSuccessResponse({
      author,
      // Use your own GitHub URL for this!
      githubUrl: 'https://github.com/dhruvchawlaa/fragments',
      version,
      // Include the hostname in the response
      hostname: hostname(),
    })
  );
});

module.exports = router;
