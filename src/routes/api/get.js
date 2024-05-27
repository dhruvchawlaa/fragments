// src/routes/api/get.js
const { createSuccessResponse } = require('../../response'); // Import the response function

/**
 * Get a list of fragments for the current user
 */
module.exports = (req, res) => {
  // Assuming you have fetched fragments data from somewhere
  const fragments = []; // Placeholder for fragments data

  res.status(200).json(createSuccessResponse({ fragments })); // Use createSuccessResponse function
};
