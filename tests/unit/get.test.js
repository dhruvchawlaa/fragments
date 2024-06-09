const request = require('supertest');
const app = require('../../src/app');
const { Fragment } = require('../../src/model/fragment');

// Mock data
const mockFragments = [
  {
    id: 'b9e7a264-630f-436d-a785-27f30233faea',
    ownerId: 'mockUserId',
    created: '2021-11-02T15:09:50.403Z',
    updated: '2021-11-02T15:09:50.403Z',
    type: 'text/plain',
    size: 256,
  },
  {
    id: 'dad25b07-8cd6-498b-9aaf-46d358ea97fe',
    ownerId: 'mockUserId',
    created: '2021-11-02T15:09:50.403Z',
    updated: '2021-11-02T15:09:50.403Z',
    type: 'text/plain',
    size: 256,
  },
];

// Mock the Fragment model's byUser method
jest.mock('../../src/model/fragment', () => ({
  Fragment: {
    byUser: jest.fn(),
  },
}));

describe('GET /v1/fragments', () => {
  // If the request is missing the Authorization header, it should be forbidden
  test('unauthenticated requests are denied', () => request(app).get('/v1/fragments').expect(401));

  // If the wrong username/password pair are used (no such user), it should be forbidden
  test('incorrect credentials are denied', () =>
    request(app).get('/v1/fragments').auth('invalid@email.com', 'incorrect_password').expect(401));

  // Using a valid username/password pair should give a success result with a .fragments array
  test('authenticated users get a fragments array', async () => {
    Fragment.byUser.mockResolvedValue(mockFragments);

    const res = await request(app).get('/v1/fragments').auth('user1@email.com', 'password1');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(Array.isArray(res.body.fragments)).toBe(true);
    expect(res.body.fragments).toEqual(mockFragments);
  });

  test('authenticated users get expanded fragments array', async () => {
    Fragment.byUser.mockResolvedValue(mockFragments);

    const res = await request(app)
      .get('/v1/fragments?expand=1')
      .auth('user1@email.com', 'password1');

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(Array.isArray(res.body.fragments)).toBe(true);
    expect(res.body.fragments).toEqual(mockFragments);
  });

  test('authenticated users get an empty array if no fragments exist', async () => {
    Fragment.byUser.mockResolvedValue([]);

    const res = await request(app).get('/v1/fragments').auth('user1@email.com', 'password1');

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(Array.isArray(res.body.fragments)).toBe(true);
    expect(res.body.fragments).toEqual([]);
  });

  test('server error when fetching fragments', async () => {
    // Mock the byUser method to throw an error
    Fragment.byUser.mockRejectedValue(new Error('Internal server error'));

    const res = await request(app).get('/v1/fragments').auth('user1@email.com', 'password1');
    expect(res.statusCode).toBe(500);
    expect(res.body.status).toBe('error');
    expect(res.body.message).toBe('Internal server error');
  });
});
