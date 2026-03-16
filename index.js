
const express = require('express');
const idempotencyStore = require('./idempotencyStore');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Health check
app.get('/', (req, res) => {
  res.send('Idempotency-Gateway API is running.');
});

// POST /process-payment with idempotency logic
app.post('/process-payment', async (req, res) => {
  const key = req.header('Idempotency-Key');
  const bodyString = JSON.stringify(req.body);
  if (!key) {
    return res.status(400).json({ error: 'Idempotency-Key header is required.' });
  }
  if (!req.body || typeof req.body.amount !== 'number' || !req.body.currency) {
    return res.status(400).json({ error: 'Request body must include amount (number) and currency.' });
  }

  let entry = idempotencyStore.get(key);
  if (entry) {
    // Check for body mismatch (fraud/error)
    if (entry.body !== bodyString) {
      return res.status(409).json({ error: 'Idempotency key already used for a different request body.' });
    }
    // If response is ready, return cached
    if (entry.response) {
      res.set('X-Cache-Hit', 'true');
      return res.status(entry.response.statusCode).json(entry.response.body);
    }
    // In-flight: wait for promise
    try {
      const cached = await entry.promise;
      res.set('X-Cache-Hit', 'true');
      return res.status(cached.statusCode).json(cached.body);
    } catch (err) {
      return res.status(500).json({ error: 'Internal error during in-flight handling.' });
    }
  }

  // First request: process and store promise
  let resolvePromise;
  const processingPromise = new Promise((resolve) => { resolvePromise = resolve; });
  idempotencyStore.set(key, { body: bodyString, promise: processingPromise });

  // Simulate payment processing (2s delay)
  setTimeout(() => {
    const response = {
      statusCode: 201,
      body: { status: `Charged ${req.body.amount} ${req.body.currency}` },
    };
    idempotencyStore.set(key, { body: bodyString, response });
    resolvePromise(response);
    res.status(response.statusCode).json(response.body);
  }, 2000);
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
