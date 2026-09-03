# Webhook examples

## Verify an incoming webhook

Configure the webhook with HS256 and store its secret separately from your API access token:

```bash
MONIME_WEBHOOK_KEY=your-webhook-hmac-secret
```

Pass `verifySignature` the complete `Monime-Signature` header and the body bytes exactly as they arrived. Do not call `request.json()` first or parse and re-serialize the body.

This example uses the standard Web `Request` API available in Node.js 20 and many server frameworks:

```javascript
import {
  MonimeClient,
  MonimeWebhookVerificationError,
} from "monimejs";

const client = new MonimeClient({
  spaceId: process.env.MONIME_SPACE_ID,
  accessToken: process.env.MONIME_ACCESS_TOKEN,
});

export async function handleMonimeWebhook(request) {
  const signature_header = request.headers.get("Monime-Signature");
  const webhook_secret = process.env.MONIME_WEBHOOK_KEY;

  if (!signature_header || !webhook_secret) {
    return new Response("Webhook verification is not configured", {
      status: 400,
    });
  }

  const raw_body = Buffer.from(await request.arrayBuffer());

  try {
    const event = client.webhook.verifySignature(
      raw_body,
      signature_header,
      webhook_secret,
    );

    // Process the authenticated event here.
    console.log(event.event.name, event.object.id);
    return new Response(null, { status: 204 });
  } catch (error) {
    if (error instanceof MonimeWebhookVerificationError) {
      return new Response("Invalid webhook", { status: 400 });
    }
    throw error;
  }
}
```

The default timestamp tolerance is 300 seconds. You can override it with `{ toleranceSeconds: number }`, but increasing the window also increases the time in which a captured request can be replayed.

The verifier supports HS256 only. It expects `Monime-Signature: t=<Unix seconds>,v1=<Base64 HMAC-SHA-256>` and signs `<timestamp>_<raw body>`. Monime's [public HMAC verification guide](https://docs.monime.io/guide/webhook/hmac-verification.md) is still a placeholder and does not provide an official test vector. The SDK does not verify ES256 because Monime has not published its delivery signature format.

## create with HMAC verification

Create a webhook with HMAC-SHA256 signature verification (symmetric key, requires secret minimum 32 characters).

```javascript
const { success, result } = await client.webhook.create({
  name: "Production Webhook",
  url: "https://yoursite.com/webhooks/monime",
  apiRelease: "caph",
  events: ["payment.completed", "payment.failed", "payout.completed"],
  verificationMethod: {
    type: "HS256",
    secret: "your-32-character-minimum-secret-key-here",
  },
  alertEmails: ["alerts@yoursite.com"],
  metadata: {
    environment: "production",
  },
});
```

## create with ECDSA verification

Create a webhook with ECDSA-SHA256 signature verification (asymmetric key pair, automatically generated).

```javascript
const { success, result } = await client.webhook.create({
  name: "Secure ECDSA Webhook",
  url: "https://yoursite.com/webhooks/monime-secure",
  apiRelease: "caph",
  events: [
    "payment.completed",
    "payment.failed",
    "payout.completed",
    "payout.failed",
  ],
  verificationMethod: {
    type: "ES256",
  },
  alertEmails: ["security@yoursite.com"],
});
```

## create with custom headers

Add custom headers to webhook requests for additional authentication or routing.

```javascript
const { success, result } = await client.webhook.create({
  name: "Authenticated Webhook",
  url: "https://yoursite.com/webhooks/monime",
  apiRelease: "caph",
  events: ["payment.completed", "checkout_session.completed"],
  verificationMethod: {
    type: "HS256",
    secret: "minimum-32-character-secret-for-production",
  },
  headers: {
    "X-Custom-Auth": "your-auth-token-here",
    "X-Environment": "production",
  },
});
```

## get

Retrieve detailed information about a specific webhook including its configuration and status.

```javascript
const { success, result } = await client.webhook.get(webhookId);
```

## list

List all webhooks in your space with pagination support.

```javascript
const { success, result, pagination } = await client.webhook.list();
```

## update - enable

Re-enable a webhook to start receiving events.

```javascript
const { success, result } = await client.webhook.update(webhookId, {
  enabled: true,
});
```

## update - disable

Disable a webhook to temporarily stop receiving events without deleting it.

```javascript
const { success, result } = await client.webhook.update(webhookId, {
  enabled: false,
});
```

## update configuration

Update webhook URL, events, or other settings.

```javascript
const { success, result } = await client.webhook.update(webhookId, {
  url: "https://yoursite.com/webhooks/monime-v2",
  events: [
    "payment.completed",
    "payment.failed",
    "payout.completed",
    "checkout_session.completed",
  ],
});
```

## delete

Permanently delete a webhook and stop receiving events.

```javascript
await client.webhook.delete(webhookId);
```
