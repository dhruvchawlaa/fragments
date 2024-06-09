const request = require('supertest');
const app = require('../../src/app');
// const { createErrorResponse } = require('../../src/response');
// const logger = require('../../src/logger');

describe('POST /v1/fragments', () => {
  test('unauthenticated requests are denied', () => request(app).post('/v1/fragments').expect(401));

  test('incorrect credentials are denied', () =>
    request(app).post('/v1/fragments').auth('invalid@email.com', 'incorrect_password').expect(401));

  test('authenticated users can create a plain text fragment', async () => {
    const res = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('content-type', 'text/plain')
      .send('This is a fragment')
      .expect(201);

    expect(res.header.location).toMatch(/\/v1\/fragments\/([\w-]+)$/);
  });

  test('unsupported fragment type throws 415 Error', async () => {
    const res = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('content-type', 'application/xml')
      .send('This is a fragment')
      .expect(415);

    expect(res.body.error.message).toBe(
      'The Content-Type of the fragment being sent with the request is not supported'
    );
  });
});
