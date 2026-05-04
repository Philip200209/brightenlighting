# Brighten Lighting — M-Pesa STK Backend

This is a minimal Node/Express backend that performs Safaricom Daraja M-Pesa STK Push requests.

Requirements
- Node.js (16+ recommended)
- An ngrok (or similar) public URL for Daraja callback when testing locally

Setup
1. Copy `.env.example` to `.env` and fill the values:

```bash
cp .env.example .env
# edit .env to set MPESA_CONSUMER_KEY, MPESA_CONSUMER_SECRET, MPESA_PASSKEY, MPESA_CALLBACK_URL
```

2. Install dependencies and start:

```bash
npm install
npm start
```

Testing
- Use your phone number (format 2547XXXXXXXX) and send a POST to `/stkpush` with JSON:

```json
{
  "phone": "2547XXXXXXXX",
  "amount": 100,
  "accountReference": "Order-1234",
  "description": "Payment for lights"
}
```

- The server will obtain an access token from Daraja and call the STK push API. Daraja will call your `MPESA_CALLBACK_URL` with the result — use ngrok to expose a local callback while testing.

Security
- Keep credentials out of source control; use environment variables or secret manager.
