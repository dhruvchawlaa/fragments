const { createSuccessResponse } = require('../../response');
const { createErrorResponse } = require('../../response');
const { Fragment } = require('../../model/fragment');
const logger = require('../../logger');

module.exports = async (req, res) => {
  logger.debug('Received request to POST /v1/fragments');
  try {
    if (Buffer.isBuffer(req.body)) {
      logger.info('v1/fragments POST route works');
      const headers = req.headers;
      const contentType = headers['content-type'];
      logger.debug({ contentType }, 'Received Content-Type');

      let fragmentData = new Fragment({
        ownerId: req.user,
        type: contentType,
        size: req.body.length,
      });
      logger.debug({ fragmentData }, 'A fragment is created');

      const host = process.env.API_URL || req.headers.host;
      res.location(host + `/v1/fragments/${fragmentData.id}`);
      logger.info(`Location header set to ${host}/v1/fragments/${fragmentData.id}`);

      await fragmentData.save();
      logger.info('Fragment data saved');

      await fragmentData.setData(req.body);
      logger.info('Fragment data set');

      res.status(201).json(createSuccessResponse({ fragment: fragmentData }));
      logger.info('Response sent with status 201');
    } else {
      logger.warn('Content-Type is not supported for POST');
      res
        .status(415)
        .json(
          createErrorResponse(
            415,
            'The Content-Type of the fragment being sent with the request is not supported'
          )
        );
      logger.warn('Response sent with status 415');
    }
  } catch (error) {
    logger.error({ error }, 'Internal Server Error');
    res.status(500).json(createErrorResponse(500, 'Internal Server Error'));
  }
};
