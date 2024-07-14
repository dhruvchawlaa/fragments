const { createSuccessResponse, createErrorResponse } = require('../../response');
const { Fragment } = require('../../model/fragment');
const logger = require('../../logger');
const markdownIt = require('markdown-it')();

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
    const fragmentData = await fragment.getData();

    if (extension) {
      if (extension === 'txt') {
        logger.debug('Extension is .txt, fetching fragment data as text');
        res.status(200).type('text/plain').send(fragmentData);
        logger.info('Fragment data sent as text/plain');
        return;
      }

      if (extension === 'html' && fragment.type === 'text/markdown') {
        logger.debug('Converting Markdown to HTML');
        const htmlData = markdownIt.render(fragmentData.toString());
        res.status(200).type('text/html').send(htmlData);
        logger.info('Fragment data sent as text/html');
        return;
      }

      if (extension === 'md' && fragment.type === 'text/markdown') {
        logger.debug('Returning Markdown data');
        res.status(200).type('text/markdown').send(fragmentData);
        logger.info('Fragment data sent as text/markdown');
        return;
      }

      logger.warn({ extension }, 'Unsupported extension requested');
      res
        .status(415)
        .json(
          createErrorResponse(415, 'The fragment cannot be converted into the extension specified!')
        );
      logger.warn('Response sent with status 415 for unsupported extension');
      return;
    }

    res.status(200).type(fragment.mimeType).send(fragmentData);
    logger.info('Fragment data sent with original MIME type');
  } catch (error) {
    logger.error({ error }, 'Error retrieving fragment data');
    res.status(500).json(createErrorResponse(500, 'Internal server error'));
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
