const request = require('supertest');
const app = require('../src/server.ts'); // import your express app

// Test 1: Is the server alive?
describe('Electromart API', () => {
  
  test('GET / should return 200', async () => {
    const res = await request(app).get('/');
    expect(res.statusCode).toBe(200);
  });

  test('GET /products should return an array', async () => {
    const res = await request(app).get('/products');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

});