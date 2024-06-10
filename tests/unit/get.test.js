// tests/unit/get.test.js

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

  test('should return 415 for unsupported HTML extension', async () => {
    const body = 'This is a fragment';
    const res = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send(body);
    const id = res.body.fragment.id;

    const res_2 = await request(app)
      .get(`/v1/fragments/${id}.html`)
      .auth('user1@email.com', 'password1');
    expect(res_2.statusCode).toBe(415);
  });
});
