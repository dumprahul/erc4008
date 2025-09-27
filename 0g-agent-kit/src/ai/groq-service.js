// ai/groq-service.js - Fixed version

import { Groq } from 'groq-sdk';

export class GroqService {
  constructor(apiKey) {
    // Don't initialize Groq client until API key is provided
    this.client = null;
    this.enabled = false;
    this.apiKey = apiKey;
  }

  enable(apiKey) {
    if (!apiKey) {
      throw new Error('Groq API key is required. Get one at: https://console.groq.com/keys');
    }

    this.client = new Groq({ apiKey });
    this.enabled = true;
    console.log('🧠 AI enabled with Groq LLM');
  }

  async analyzeCommand(command) {
    if (!this.enabled || !this.client) {
      throw new Error('AI not enabled. Call enableAI() first.');
    }

    const response = await this.client.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [
        {
          role: 'system',
          content: `You are an AI for 0G Network Agent Kit. Analyze user commands and determine which function to call.

AVAILABLE FUNCTIONS:

🔐 WALLET FUNCTIONS:
- createWallet() - Generate new wallet with private key & mnemonic
- sendMoney(to, amount) - Send ETH to address
- getBalance() - Get current wallet balance  
- getAddress() - Get current wallet address

🤖 IDENTITY FUNCTIONS (Agent Registration):
- registerAgent(domain, address) - Register new agent (use "AUTO" for current address)
- updateAgent(agentId, newDomain, newAddress) - Update agent info
- getAgent(agentId) - Get agent details by ID
- resolveByDomain(domain) - Find agent by domain name
- resolveByAddress(address) - Find agent by wallet address
- agentExists(agentId) - Check if agent ID exists
- getTotalAgents() - Get total number of registered agents
- getNextAgentId() - Get next available agent ID

⭐ REPUTATION FUNCTIONS (Feedback Authorization):
- authorizeFeedback(clientAgentId, serverAgentId) - Authorize feedback between agents
- isFeedbackAuthorized(feedbackAuthId) - Check if feedback is authorized
- getFeedbackAuthorization(feedbackAuthId) - Get feedback authorization details
- getClientFeedbackAuthorizations(agentId) - Get authorizations for client agent
- getServerFeedbackAuthorizations(agentId) - Get authorizations for server agent

✅ VALIDATION FUNCTIONS (Data Validation):
- requestValidation(validatorAgentId, serverAgentId, dataHash) - Request validation
- respondToValidation(dataHash, response) - Respond to validation (0-100 score)
- getValidationRequest(requestId) - Get validation request details
- getValidationRequestDetails(requestId) - Get detailed validation info
- getPendingValidations(validatorAgentId) - Get pending validations for validator
- getServerValidations(serverAgentId) - Get validation requests for server
- isValidationCompleted(dataHash) - Check if validation is completed

🆘 HELP FUNCTIONS:
- help() - Show available functions
- getAICommands() - List all available commands with examples

Return JSON format: {"function": "functionName", "parameters": {...}, "reasoning": "brief explanation"}

Examples:
"What functions can you do?" → {"function": "help", "parameters": {}, "reasoning": "User wants to see available functions"}
"What's my balance?" → {"function": "getBalance", "parameters": {}, "reasoning": "User wants wallet balance"}
"Create a wallet" → {"function": "createWallet", "parameters": {}, "reasoning": "User wants new wallet"}
"Register domain mystore.com" → {"function": "registerAgent", "parameters": {"domain": "mystore.com", "address": "AUTO"}, "reasoning": "Register agent with domain"}`
        },
        { role: 'user', content: command }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1,
      max_tokens: 500
    });

    const result = JSON.parse(response.choices[0].message.content);
    console.log(`🧠 AI Analysis: ${result.function} - ${result.reasoning}`);
    return result;
  }

  async generateResponse(result, originalCommand) {
    if (!this.enabled || !this.client) return 'Command executed successfully!';

    try {
      const response = await this.client.chat.completions.create({
        model: 'llama-3.1-8b-instant',
        messages: [
          {
            role: 'system',
            content: 'Generate a brief, friendly response explaining the blockchain operation result.'
          },
          {
            role: 'user',
            content: `User command: "${originalCommand}"\nResult: ${JSON.stringify(result)}\n\nExplain what happened:`
          }
        ],
        max_tokens: 200,
        temperature: 0.3
      });

      return response.choices[0].message.content.trim();
    } catch (error) {
      console.error('Response generation error:', error);
      return 'Operation completed successfully!';
    }
  }
}