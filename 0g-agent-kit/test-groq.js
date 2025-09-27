// ================================
// server.js - API Server for your AI SDK
// ================================

import express from 'express';
import cors from 'cors';
import Agent from './src/0gAgentSdk.js';

const app = express();
app.use(cors());
app.use(express.json());

// Initialize agent with AI
const agent = new Agent();

// Import wallet
Agent.importWallet('');

// 🤖 CHAT ENDPOINT - Use your AI SDK
app.post('/chat', async (req, res) => {
  try {
    const { command } = req.body;
    
    console.log(`💬 Chat: "${command}"`);
    
    // Use your AI SDK's chat method
    const result = await agent.chat(command);
    
    res.json(result);
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Health check
app.get('/', (req, res) => {
  res.json({
    message: '🤖 0G Agent Kit API',
    endpoint: 'POST /chat',
    example: { command: "Create a new wallet" }
  });
});

app.listen(3000, () => {
  console.log('🚀 API Server running on http://localhost:3000');
  console.log('🔗 Test: POST /chat with {"command": "your message"}');
});

// ================================
// Test with curl:
// ================================

/*
curl -X POST http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -d '{"command": "Create a new wallet for me"}'

curl -X POST http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -d '{"command": "Check my wallet balance"}'

curl -X POST http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -d '{"command": "Register me as agent with domain mystore.com"}'
*/