import request from 'supertest';
import app from '../src/app';   // ← we'll fix this path next

describe('Electromart API', () => {

  test('GET / should return 200', async () => {
    const res = await request(app).get('/');
    expect(res.statusCode).toBe(200);
  });

});