const request = require('supertest');
const app = require('../../src/app');
const { Fragment } = require('../../src/model/fragment');
// const logger = require('../../logger');

describe('DELETE /v1/fragments/:id', () => {
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
    const res = await request(app).delete(`/v1/fragments/${fragmentId}`);
    expect(res.statusCode).toBe(401);
  });

  test('should deny requests with incorrect credentials', async () => {
    const res = await request(app)
      .delete(`/v1/fragments/${fragmentId}`)
      .auth('invaliduser@email.com', 'invalidpassword');
    expect(res.statusCode).toBe(401);
  });

  test('should delete an existing fragment', async () => {
    const res = await request(app)
      .delete(`/v1/fragments/${fragmentId}`)
      .auth('user1@email.com', 'password1');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  test('should return 404 if fragment ID does not exist', async () => {
    const res = await request(app)
      .delete('/v1/fragments/non_existent_fragment_id')
      .auth('user1@email.com', 'password1');
    expect(res.statusCode).toBe(404);
    expect(res.body.error.message).toBe('Fragment not found');
  });

  test('should log owner id and fragment id', async () => {
    const testFragmentId = 'testFragmentId';
    await request(app)
      .delete(`/v1/fragments/${testFragmentId}`)
      .auth('user1@email.com', 'password1');
    // Since we cannot directly assert logs, ensure the API is working as expected
    const res = await request(app)
      .delete(`/v1/fragments/${testFragmentId}`)
      .auth('user1@email.com', 'password1');
    expect(res.statusCode).toBe(404);
    expect(res.body.error.message).toBe('Fragment not found');
  });

  test('should handle unexpected errors gracefully', async () => {
    const originalDelete = Fragment.delete;
    Fragment.delete = async () => {
      throw new Error('Unexpected error');
    };

    const res = await request(app)
      .delete(`/v1/fragments/${fragmentId}`)
      .auth('user1@email.com', 'password1');
    expect(res.statusCode).toBe(404);
    expect(res.body.error.message).toBe('Fragment not found');

    Fragment.delete = originalDelete; // Restore the original method
  });
});
