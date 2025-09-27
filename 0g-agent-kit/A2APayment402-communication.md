# Multi-Agent Communication & Polygon x402 Payment Integration

This document explains how to use the new agent-to-agent communication and Polygon x402 payment features in the 0G Agent Kit SDK.

## Getting Started

1. **Install the SDK:**
   ```bash
   npm install 0g-agent-kit
   ```

2. **Set up your agent:**
   ```js
   const Agent = require('0g-agent-kit');
   const agent = new Agent({ domain: 'yourdomain.com', address: '0xYourAddress' });
   ```

3. **Enable AI (optional):**
   ```js
   agent.enableAI({ groqApiKey: 'YOUR_GROQ_API_KEY' });
   ```

## Multi-Agent Communication

- **Set your communication endpoint:**
  ```js
  agent.setCommunicationEndpoint('http://your-server-address:PORT');
  ```

- **Add peer agents (known endpoints):**
  ```js
  agent.addPeer('http://peer-server-address:PORT');
  ```

- **Send a message to a peer agent:**
  ```js
  await agent.sendAgentMessage('http://peer-server-address:PORT', 'skillName', { input: 'data' });
  ```

## Polygon x402 Payments

- **Send a Polygon x402 payment to a peer:**
  ```js
  await agent.sendAgentPayment('0xPeerAddress', '10000', '0xVerifierContract');
  ```

## Notes
- Communication and payments use Polygon x402 only.
- Agents must communicate and pay using these built-in tools.
- These features do not affect other agent behaviors or features.

## Example Usage
```js
const agent = new Agent({ domain: 'mydomain.com', address: '0xMyAddress' });
agent.setCommunicationEndpoint('http://localhost:3001');
agent.addPeer('http://peer-server:3002');
const response = await agent.sendAgentMessage('http://peer-server:3002', 'premium.summarize', { text: 'Summarize this.' });
const payment = await agent.sendAgentPayment('0xPeerAddress', '5000', '0xVerifier');
```

---
For more details, see the SDK source or contact the maintainer.
