const { createSuccessResponse, createErrorResponse } = require('../../response');
const { Fragment } = require('../../model/fragment');
const logger = require('../../logger');

module.exports = async (req, res) => {
  const { id } = req.params;
  logger.debug(`Received request to PUT fragment by ID: ${id}`);
  const ownerId = req.user;

  try {
    const fragment = await Fragment.byId(ownerId, id);
    logger.debug({ fragment }, 'Fragment fetched successfully');

    const contentType = req.headers['content-type'];
    logger.debug({ contentType }, 'Received Content-Type for PUT request');

    // Check if the Content-Type matches the existing fragment's type
    if (contentType !== fragment.type) {
      logger.warn('Content-Type does not match existing fragment type');
      res
        .status(400)
        .json(createErrorResponse(400, 'Content-Type does not match the existing fragment type'));
      return;
    }

    if (Buffer.isBuffer(req.body)) {
      await fragment.setData(req.body);
      logger.info('Fragment data updated successfully');

      res.status(200).json(createSuccessResponse({ fragment }));
      logger.info('Response sent with status 200');
    } else {
      logger.warn('Request body is not a Buffer');
      res.status(400).json(createErrorResponse(400, 'The request body must be a Buffer'));
    }
  } catch (error) {
    logger.error({ error }, 'Error updating fragment');
    if (error.message === 'Fragment not found') {
      res.status(404).json(createErrorResponse(404, `Fragment not found: ID ${id}`));
    } else {
      res.status(500).json(createErrorResponse(500, 'Internal Server Error'));
    }
  }
};
