const request = require('supertest');
const app = require('../../src/app');

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

  test('authenticated users can create a plain text fragment with charset=utf-8', async () => {
    const res = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('content-type', 'text/plain; charset=utf-8')
      .send('This is a fragment with utf-8 charset')
      .expect(201);

    expect(res.header.location).toMatch(/\/v1\/fragments\/([\w-]+)$/);
  });

  test('authenticated users can create a markdown fragment', async () => {
    const res = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('content-type', 'text/markdown')
      .send('# Markdown fragment')
      .expect(201);

    expect(res.header.location).toMatch(/\/v1\/fragments\/([\w-]+)$/);
  });

  test('authenticated users can create an HTML fragment', async () => {
    const res = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('content-type', 'text/html')
      .send('<p>This is an HTML fragment</p>')
      .expect(201);

    expect(res.header.location).toMatch(/\/v1\/fragments\/([\w-]+)$/);
  });

  test('authenticated users can create a CSV fragment', async () => {
    const res = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('content-type', 'text/csv')
      .send('col1,col2\nval1,val2')
      .expect(201);

    expect(res.header.location).toMatch(/\/v1\/fragments\/([\w-]+)$/);
  });

  test('authenticated users can create a JSON fragment', async () => {
    const res = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('content-type', 'application/json')
      .send(JSON.stringify({ key: 'value' }))
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
