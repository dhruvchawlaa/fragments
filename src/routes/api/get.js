const { createSuccessResponse, createErrorResponse } = require('../../response');
const { Fragment } = require('../../model/fragment');
const logger = require('../../logger');

const getFragments = async (req, res) => {
  logger.debug('Received request to GET /v1/fragments');
  try {
    const userId = req.user;
    logger.debug({ userId }, 'Fetching fragments for user ID');

    const expand = req.query.expand === '1';
    logger.debug({ expand }, 'Expand parameter');

    const fragments = await Fragment.byUser(userId, expand);
    logger.info('Fragments fetched successfully', { fragments });

    res.status(200).json(createSuccessResponse({ fragments }));
    logger.info('Response sent with status 200');
  } catch (error) {
    logger.error({ error }, 'Internal server error while fetching fragments');
    res.status(500).json(createErrorResponse(500, 'Internal server error'));
  }
};

const splitExtension = (id) => {
  const parts = id.split('.');
  if (parts.length > 1) {
    const extension = parts.pop();
    const fragmentId = parts.join('.');
    logger.debug({ fragmentId, extension }, 'Split extension from ID');
    return { fragmentId, extension };
  }
  logger.debug({ fragmentId: id, extension: null }, 'No extension found in ID');
  return { fragmentId: id, extension: null };
};

const getFragmentByID = async (req, res) => {
  const { id } = req.params;
  logger.debug(`Received request to GET fragment by ID: ${id}`);
  const { fragmentId, extension } = splitExtension(id);
  const ownerId = req.user;

  let fragment, fragmentMetadata;
  try {
    fragmentMetadata = await Fragment.byId(ownerId, fragmentId);
    logger.debug({ fragmentMetadata }, 'Fragment Metadata fetched');
    fragment = new Fragment(fragmentMetadata);
  } catch (error) {
    logger.error(`No fragment with ID ${fragmentId} found. Error: ${error}`);
    res.status(404).json(createErrorResponse(404, `No fragment with ID ${fragmentId} found`));
    return;
  }

  try {
    const contentType = extension ? fragment.getMimeType(extension) : fragment.mimeType;
    const fragmentData = extension ? await fragment.convertTo(extension) : await fragment.getData();

    res.status(200).type(contentType).send(fragmentData);
    logger.info('Fragment data sent with converted MIME type');
  } catch (error) {
    if (error.message === 'Unsupported extension' || error.message === 'Unsupported conversion') {
      res
        .status(415)
        .json(
          createErrorResponse(415, 'The fragment cannot be converted into the extension specified!')
        );
    } else {
      logger.error({ error }, 'Error converting fragment data');
      res.status(500).json(createErrorResponse(500, 'Internal server error'));
    }
  }
};

const getFragmentInfoByID = async (req, res) => {
  try {
    const { id } = req.params;
    const ownerId = req.user;

    logger.info(`Fetching fragment info by ID: ${id} for user: ${ownerId}`);

    const fragmentMetadata = await Fragment.byId(ownerId, id);

    logger.debug({ fragmentMetadata }, 'Successfully retrieved fragment metadata');

    res.status(200).json(createSuccessResponse({ fragment: fragmentMetadata }));
  } catch (error) {
    logger.warn({ error }, `Fragment not found: ID ${req.params.id}`);
    res.status(404).json(createErrorResponse(404, `Fragment not found: ID ${req.params.id}`));
  }
};

module.exports = {
  getFragments,
  getFragmentByID,
  getFragmentInfoByID,
};
