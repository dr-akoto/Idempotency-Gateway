const request = require('supertest');
const { app } = require('../index');
const idempotencyStore = require('../idempotencyStore');

beforeEach(() => idempotencyStore.clear());

describe('POST /process-payment', () => {
  it('processes a new payment (happy path)', async () => {
    const res = await request(app)
      .post('/process-payment')
      .set('Idempotency-Key', 'key1')
      .send({ amount: 100, currency: 'GHS' });
    expect(res.statusCode).toBe(201);
    expect(res.body.status).toBe('Charged 100 GHS');
    expect(res.headers['x-cache-hit']).toBeUndefined();
  });

  it('returns cached response for duplicate request', async () => {
    await request(app)
      .post('/process-payment')
      .set('Idempotency-Key', 'key2')
      .send({ amount: 50, currency: 'GHS' });
    const res = await request(app)
      .post('/process-payment')
      .set('Idempotency-Key', 'key2')
      .send({ amount: 50, currency: 'GHS' });
    expect(res.statusCode).toBe(201);
    expect(res.body.status).toBe('Charged 50 GHS');
    expect(res.headers['x-cache-hit']).toBe('true');
  });

  it('rejects same key with different body', async () => {
    await request(app)
      .post('/process-payment')
      .set('Idempotency-Key', 'key3')
      .send({ amount: 10, currency: 'GHS' });
    const res = await request(app)
      .post('/process-payment')
      .set('Idempotency-Key', 'key3')
      .send({ amount: 20, currency: 'GHS' });
    expect(res.statusCode).toBe(409);
    expect(res.body.error).toMatch(/already used for a different request body/);
  });
});
