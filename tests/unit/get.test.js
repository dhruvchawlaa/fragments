const request = require('supertest');
const app = require('../../src/app');

describe('GET /v1/fragments/', () => {
  test('should return empty array for authenticated user with no fragments', async () => {
    const res = await request(app).get('/v1/fragments').auth('user1@email.com', 'password1');
    expect(res.statusCode).toBe(200);
    expect(res.body.fragments).toEqual([]);
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
    const res = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send('This is a fragment');
    const id = res.body.fragment.id;

    const res_2 = await request(app).get('/v1/fragments').auth('user1@email.com', 'password1');
    expect(res_2.body.fragments[0]).toBe(id);
  });

  // New Tests
  test('should handle query parameter "expand" correctly', async () => {
    const res = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send('This is a fragment with expand parameter');
    const res2 = await request(app)
      .get('/v1/fragments?expand=1')
      .auth('user1@email.com', 'password1');
    expect(res2.statusCode).toBe(200);
    expect(res2.body.fragments).toHaveLength(2);
    expect(res2.body.fragments[0]).toHaveProperty('id');
    expect(res2.body.fragments[0]).toHaveProperty('created');
    expect(res2.body.fragments[0]).toHaveProperty('updated');
  });

  test('should return fragments with metadata when expand is true', async () => {
    const res = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send('This is a fragment with metadata');
    const id = res.body.fragment.id;

    const res_2 = await request(app)
      .get('/v1/fragments?expand=1')
      .auth('user1@email.com', 'password1');
    expect(res_2.body.fragments[2].id).toBe(id);
    expect(res_2.body.fragments[2]).toHaveProperty('created');
    expect(res_2.body.fragments[2]).toHaveProperty('updated');
  });
});

describe('GET /v1/fragments/:id', () => {
  test('should deny unauthenticated requests', async () => {
    const res = await request(app).get('/v1/fragments/fragmentId');
    expect(res.statusCode).toBe(401);
  });

  test('should deny requests with incorrect credentials', async () => {
    const res = await request(app)
      .get('/v1/fragments/fragmentId')
      .auth('invaliduser@email.com', 'invalidpassword');
    expect(res.statusCode).toBe(401);
  });

  test('should return specific fragment data', async () => {
    const body = 'This is a fragment';
    const res = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send(body);
    const id = res.body.fragment.id;

    const res_2 = await request(app)
      .get(`/v1/fragments/${id}`)
      .auth('user1@email.com', 'password1');
    expect(res_2.statusCode).toBe(200);
    expect(res_2.text).toBe(body);
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
    const body = 'This is a fragment';
    const res = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send(body);
    const id = res.body.fragment.id;

    const res_2 = await request(app)
      .get(`/v1/fragments/${id}.txt`)
      .auth('user1@email.com', 'password1');
    expect(res_2.statusCode).toBe(200);
    expect(res_2.text).toBe(body);
  });

  // New Tests
  test('should return fragment data as text/plain for .txt extension', async () => {
    const body = 'This is a text fragment';
    const res = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send(body);
    const id = res.body.fragment.id;

    const res_2 = await request(app)
      .get(`/v1/fragments/${id}.txt`)
      .auth('user1@email.com', 'password1');
    expect(res_2.statusCode).toBe(200);
    expect(res_2.type).toBe('text/plain');
    expect(res_2.text).toBe(body);
  });

  test('should return 415 for unsupported extension request', async () => {
    const body = 'This is a fragment for unsupported extension';
    const res = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send(body);
    const id = res.body.fragment.id;

    const res_2 = await request(app)
      .get(`/v1/fragments/${id}.unsupported`)
      .auth('user1@email.com', 'password1');
    expect(res_2.statusCode).toBe(415);
    expect(res_2.body.error.message).toBe(
      'The fragment cannot be converted into the extension specified!'
    );
  });
});

describe('GET /v1/fragments/:id/info', () => {
  // New Tests
  test('should return fragment metadata', async () => {
    const body = 'This is a fragment with metadata info';
    const res = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send(body);
    const id = res.body.fragment.id;

    const res_2 = await request(app)
      .get(`/v1/fragments/${id}/info`)
      .auth('user1@email.com', 'password1');
    expect(res_2.statusCode).toBe(200);
    expect(res_2.body.fragment.id).toBe(id);
    expect(res_2.body.fragment).toHaveProperty('created');
    expect(res_2.body.fragment).toHaveProperty('updated');
  });

  test('should return 404 if fragment metadata is not found', async () => {
    const res = await request(app)
      .get('/v1/fragments/non_existent_fragment_id/info')
      .auth('user1@email.com', 'password1');
    expect(res.statusCode).toBe(404);
    expect(res.body.error.message).toBe('Fragment not found: ID non_existent_fragment_id');
  });
});
