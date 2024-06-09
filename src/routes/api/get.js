const { createSuccessResponse } = require('../../response');
const { Fragment } = require('../../model/fragment');

module.exports = async (req, res) => {
  try {
    const userId = req.user;
    console.log('Fetching fragments for user ID:', userId);
    const expand = req.query.expand === '1';
    console.log('Expand parameter:', expand);

    const fragments = await Fragment.byUser(userId, expand);
    console.log('Fetched fragments:', fragments);

    res.status(200).json(createSuccessResponse({ fragments }));
  } catch {
    // console.error('Error fetching fragments:', error);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};
