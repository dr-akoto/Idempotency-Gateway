
# Idempotency-Gateway (Pay-Once Protocol)

> Professional Node.js/Express implementation for FinSafe Transactions Ltd.


## Architecture Diagram

![Sequence Diagram](./IMAGE/Payment%20Processing-sequence-Diagram.png)

## Setup Instructions

1. Clone the repo and install dependencies:
     ```sh
     git clone https://github.com/amalitechglobaltraining/Idempotency-Gateway
     cd Idempotency-Gateway
     npm install
     ```
2. Start the server:
     ```sh
     npm run dev
     # or
     npm start
     ```

## API Documentation

### POST /process-payment
- **Headers:**
    - `Idempotency-Key: <unique-string>` (required)
- **Body:**
    - JSON: `{ "amount": 100, "currency": "GHS" }`
- **Responses:**
    - `201 Created` or `200 OK`: `{ "status": "Charged 100 GHS" }`
    - `409`/`422`: Key reused with different body
    - `X-Cache-Hit: true` header for duplicate requests

## Design Decisions
- In-memory store for idempotency (can swap for Redis/DB)
- Handles in-flight requests (race condition safe)
- Professional error handling and logging


## Developer's Choice: Rate Limiting

**Feature:** In-memory rate limiting per Idempotency-Key (max 5 requests per minute)

**Why:**
- Prevents abuse, accidental request loops, and denial-of-service attacks.
- Ensures fair use and protects the payment system from overload.

**How it works:**
- The server tracks the number of requests per Idempotency-Key within a 1-minute window.
- If a key exceeds 5 requests in a minute, further requests receive a `429 Too Many Requests` error.
- The count resets automatically after 1 minute.

**Example error response:**
```json
{
    "error": "Rate limit exceeded: max 5 requests per minute for this Idempotency-Key."
}
```

This feature is production-grade and can be extended to use client IP or a Client-Id header for broader rate limiting.

---


