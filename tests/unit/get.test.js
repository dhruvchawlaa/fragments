const request = require('supertest');
const app = require('../../src/app');

describe('GET /v1/fragments', () => {
  let fragmentId;

  beforeAll(async () => {
    // Create a fragment to be used in the tests
    const res = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/markdown')
      .send('# This is a markdown fragment');
    fragmentId = res.body.fragment.id;
  });

  test('should deny unauthenticated requests', async () => {
    const res = await request(app).get('/v1/fragments');
    expect(res.statusCode).toBe(401);
  });

  test('should deny requests with incorrect credentials', async () => {
    const res = await request(app)
      .get('/v1/fragments')
      .auth('invaliduser@email.com', 'invalidpassword');
    expect(res.statusCode).toBe(401);
  });

  test('should fetch existing fragments', async () => {
    const res = await request(app).get('/v1/fragments').auth('user1@email.com', 'password1');
    expect(res.statusCode).toBe(200);
    expect(res.body.fragments).toContain(fragmentId);
  });

  test('should handle query parameter "expand" correctly', async () => {
    const res = await request(app)
      .get('/v1/fragments?expand=1')
      .auth('user1@email.com', 'password1');
    expect(res.statusCode).toBe(200);
    expect(res.body.fragments).toHaveLength(1);
    expect(res.body.fragments[0]).toHaveProperty('id');
    expect(res.body.fragments[0]).toHaveProperty('created');
    expect(res.body.fragments[0]).toHaveProperty('updated');
  });

  test('should return fragments with metadata when expand is true', async () => {
    const res = await request(app)
      .get('/v1/fragments?expand=1')
      .auth('user1@email.com', 'password1');
    expect(res.statusCode).toBe(200);
    expect(res.body.fragments[0].id).toBe(fragmentId);
    expect(res.body.fragments[0]).toHaveProperty('created');
    expect(res.body.fragments[0]).toHaveProperty('updated');
  });
});

describe('GET /v1/fragments/:id', () => {
  let fragmentId;

  beforeAll(async () => {
    // Create a fragment to be used in the tests
    const res = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/markdown')
      .send('# This is a markdown fragment');
    fragmentId = res.body.fragment.id;
  });

  test('should deny unauthenticated requests', async () => {
    const res = await request(app).get(`/v1/fragments/${fragmentId}`);
    expect(res.statusCode).toBe(401);
  });

  test('should deny requests with incorrect credentials', async () => {
    const res = await request(app)
      .get(`/v1/fragments/${fragmentId}`)
      .auth('invaliduser@email.com', 'invalidpassword');
    expect(res.statusCode).toBe(401);
  });

  test('should return specific fragment data', async () => {
    const body = '# This is a markdown fragment';
    const res = await request(app)
      .get(`/v1/fragments/${fragmentId}`)
      .auth('user1@email.com', 'password1');
    expect(res.statusCode).toBe(200);
    expect(res.text).toBe(body);
  });

  test('should return 404 if fragment ID does not exist', async () => {
    const res = await request(app)
      .get('/v1/fragments/non_existent_fragment_id')
      .auth('user1@email.com', 'password1');
    expect(res.statusCode).toBe(404);
  });

  test('should return 404 for unsupported extension', async () => {
    const res = await request(app)
      .get('/v1/fragments/unsupported_fragment_id.xml')
      .auth('user1@email.com', 'password1');
    expect(res.statusCode).toBe(404);
  });

  test('should fetch fragments with correct ID', async () => {
    const body = '# This is a markdown fragment';
    const res = await request(app)
      .get(`/v1/fragments/${fragmentId}.txt`)
      .auth('user1@email.com', 'password1');
    expect(res.statusCode).toBe(200);
    expect(res.text).toBe(body);
  });

  test('should return fragment data as text/plain for .txt extension', async () => {
    const body = '# This is a markdown fragment';
    const res = await request(app)
      .get(`/v1/fragments/${fragmentId}.txt`)
      .auth('user1@email.com', 'password1');
    expect(res.statusCode).toBe(200);
    expect(res.type).toBe('text/plain');
    expect(res.text).toBe(body);
  });

  test('should return fragment data as text/html for .html extension', async () => {
    const res = await request(app)
      .get(`/v1/fragments/${fragmentId}.html`)
      .auth('user1@email.com', 'password1');
    expect(res.statusCode).toBe(200);
    expect(res.type).toBe('text/html');
    expect(res.text).toContain('<h1>This is a markdown fragment</h1>');
  });

  test('should return fragment data as text/markdown for .md extension', async () => {
    const body = '# This is a markdown fragment';
    const res = await request(app)
      .get(`/v1/fragments/${fragmentId}.md`)
      .auth('user1@email.com', 'password1');
    expect(res.statusCode).toBe(200);
    expect(res.type).toBe('text/markdown');
    expect(res.text).toBe(body);
  });

  test('should return 415 for unsupported extension request', async () => {
    const res = await request(app)
      .get(`/v1/fragments/${fragmentId}.unsupported`)
      .auth('user1@email.com', 'password1');
    expect(res.statusCode).toBe(415);
    expect(res.body.error.message).toBe(
      'The fragment cannot be converted into the extension specified!'
    );
  });
});

describe('GET /v1/fragments/:id/info', () => {
  let fragmentId;

  beforeAll(async () => {
    // Create a fragment to be used in the tests
    const res = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/markdown')
      .send('# This is a markdown fragment');
    fragmentId = res.body.fragment.id;
  });

  test('should return fragment metadata', async () => {
    const res = await request(app)
      .get(`/v1/fragments/${fragmentId}/info`)
      .auth('user1@email.com', 'password1');
    expect(res.statusCode).toBe(200);
    expect(res.body.fragment.id).toBe(fragmentId);
    expect(res.body.fragment).toHaveProperty('created');
    expect(res.body.fragment).toHaveProperty('updated');
  });

  test('should return 404 if fragment metadata is not found', async () => {
    const res = await request(app)
      .get('/v1/fragments/non_existent_fragment_id/info')
      .auth('user1@email.com', 'password1');
    expect(res.statusCode).toBe(404);
    expect(res.body.error.message).toBe('Fragment not found: ID non_existent_fragment_id');
  });
});
