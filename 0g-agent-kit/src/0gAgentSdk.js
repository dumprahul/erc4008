// 0gAgentSdk.js - Complete 0G Agent Kit SDK with AI-powered natural language interface

import * as IdentityRegistry from './IdentityRegistry.js';
import * as ReputationRegistry from './ReputationRegistry.js';
import * as ValidationRegistry from './ValidationRegistry.js';

// 🔥 AI IMPORTS - New AI functionality
import { GroqService } from './ai/groq-service.js';
import { WalletHelpers } from './ai/wallet-helpers.js';

/**
 * Agent class - Complete interface for 0G Agent creation, reputation, validation + AI
 */
class Agent {
  constructor(config = {}) {
    this.domain = config.domain;
    this.address = config.address;
    this.agentId = null;

    // 🔥 NEW AI PROPERTIES
    this.groqService = new GroqService();
    this.aiEnabled = false;

    // Auto-register if domain and address provided
    if (this.domain && this.address) {
      this.register().catch(console.error);
    }
  }

  // ===== 🔥 NEW AI METHODS =====

  /**
   * Enable AI capabilities with Groq API key
   * @param {Object} options - AI configuration
   * @param {string} options.groqApiKey - Groq API key for LLM
   * @returns {Agent} this instance for chaining
   */
  enableAI(options = {}) {
    if (!options.groqApiKey) {
      throw new Error('Groq API key is required for AI features. Get one at: https://console.groq.com');
    }

    this.groqService.enable(options.groqApiKey);
    this.aiEnabled = true;
    
    console.log('🤖 0G Agent Kit AI enabled!');
    console.log('💬 Use agent.chat("your command") for natural language interface');
    console.log('🔧 All manual methods still work as before');
    
    return this;
  }

  /**
   * 🔥 MAIN AI CHAT METHOD - Natural language interface to all SDK functions
   * @param {string} command - Natural language command
   * @returns {Promise<Object>} Execution result with AI response
   */
  async chat(command) {
    if (!this.aiEnabled) {
      throw new Error('🤖 AI not enabled. Call enableAI({ groqApiKey: "your-key" }) first.');
    }

    console.log(`\n💬 AI Chat: "${command}"`);

    try {
      // Step 1: AI analyzes the command
      const analysis = await this.groqService.analyzeCommand(command);
      
      console.log(`🎯 Executing: ${analysis.function}`);
      if (Object.keys(analysis.parameters).length > 0) {
        console.log(`📋 Parameters:`, analysis.parameters);
      }

      // Step 2: Execute the determined function
      const result = await this._executeAIFunction(analysis.function, analysis.parameters);

      // Step 3: Generate human-friendly response
      const aiResponse = await this.groqService.generateResponse(result, command);

      console.log(`✅ ${aiResponse}\n`);

      return {
        success: true,
        command,
        analysis: {
          function: analysis.function,
          parameters: analysis.parameters,
          reasoning: analysis.reasoning
        },
        result,
        response: aiResponse,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error(`❌ AI Chat Error: ${error.message}`);
      
      return {
        success: false,
        command,
        error: error.message,
        suggestion: "Try rephrasing your command or check if your wallet is imported",
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Check if AI is enabled
   * @returns {boolean} AI enabled status
   */
  isAIEnabled() {
    return this.aiEnabled;
  }

  /**
   * Get available AI commands
   * @returns {Object} Available command examples
   */
  getAICommands() {
    return {
      wallet: [
        "Create a new wallet for me",
        "Send 0.1 ETH to 0x742d35Cc6647C...",
        "What's my wallet balance?",
        "Show me my wallet address"
      ],
      identity: [
        "Register me as agent with domain mystore.com",
        "Update my agent with new domain newstore.com",
        "Get details for agent 123",
        "Find agent by domain example.com",
        "Check if agent 456 exists"
      ],
      reputation: [
        "Authorize feedback between client 123 and server 456",
        "Check if feedback is authorized for ID 0xabc...",
        "Get my client feedback authorizations",
        "Show server authorizations for agent 789"
      ],
      validation: [
        "Request validation from validator 123 for server 456 with data 0xabc...",
        "Respond to validation for data 0xdef... with score 85",
        "Get pending validations for validator 789",
        "Check if validation completed for data 0xghi..."
      ]
    };
  }

  // ===== PRIVATE AI METHODS =====

  /**
   * Execute AI-determined function with parameters
   * @private
   */
  async _executeAIFunction(functionName, parameters) {
    const processedParams = this._processAIParameters(parameters);

    switch (functionName) {
      // 🔐 WALLET FUNCTIONS
      case 'createWallet':
case 'generateWallet':
case 'newWallet':
  try {
    return WalletHelpers.createWallet();
  } catch (error) {
    console.error('Wallet creation error:', error);
    // Fallback to simple wallet creation
    const { SimpleWalletHelpers } = await import('../ai/wallet-helpers.js');
    return SimpleWalletHelpers.createWallet();
  }
      
      case 'sendMoney':
        return await WalletHelpers.sendMoney(
          processedParams.to, 
          processedParams.amount, 
          Agent.getWalletAddress()
        );
      
      case 'getBalance':
        const balance = await Agent.getWalletBalance();
        return { balance, address: Agent.getWalletAddress(), network: "0G Testnet" };
      
      case 'getAddress':
        const address = Agent.getWalletAddress();
        return { address, network: "0G Testnet" };

      // 🤖 IDENTITY FUNCTIONS
      case 'registerAgent':
        if (processedParams.domain && processedParams.address) {
          return await Agent.registerAgent(processedParams.domain, processedParams.address);
        } else if (this.domain) {
          return await this.register();
        } else {
          throw new Error('Domain required for registration');
        }
      
      case 'updateAgent':
        if (this.agentId) {
          return await this.update(processedParams.newDomain, processedParams.newAddress);
        } else {
          return await Agent.updateAgent(processedParams.agentId, processedParams.newDomain, processedParams.newAddress);
        }
      
      case 'getAgent':
        if (processedParams.agentId) {
          return await Agent.getAgent(processedParams.agentId);
        } else if (this.agentId) {
          return await this.getInfo();
        } else {
          throw new Error('Agent ID required');
        }
      
      case 'resolveByDomain':
        return await Agent.resolveByDomain(processedParams.domain);
      
      case 'resolveByAddress':
        return await Agent.resolveByAddress(processedParams.address);
      
      case 'agentExists':
        return await Agent.agentExists(processedParams.agentId);
      
      case 'getTotalAgents':
        return await Agent.getTotalAgents();
      
      case 'getNextAgentId':
        return await Agent.getNextAgentId();

      // ⭐ REPUTATION FUNCTIONS
      case 'authorizeFeedback':
        return await Agent.authorizeFeedback(processedParams.clientAgentId, processedParams.serverAgentId);
      
      case 'isFeedbackAuthorized':
        return await Agent.isFeedbackAuthorized(processedParams.feedbackAuthId);
      
      case 'getFeedbackAuthorization':
        return await Agent.getFeedbackAuthorization(processedParams.feedbackAuthId);
      
      case 'getClientFeedbackAuthorizations':
        return await Agent.getClientFeedbackAuthorizations(processedParams.agentId);
      
      case 'getServerFeedbackAuthorizations':
        return await Agent.getServerFeedbackAuthorizations(processedParams.agentId);

      // ✅ VALIDATION FUNCTIONS
      case 'requestValidation':
        return await Agent.requestValidation(
          processedParams.validatorAgentId,
          processedParams.serverAgentId, 
          processedParams.dataHash
        );
      
      case 'respondToValidation':
        return await Agent.respondToValidation(processedParams.dataHash, processedParams.response);
      
      case 'getValidationRequest':
        return await Agent.getValidationRequest(processedParams.requestId);
      
      case 'getValidationRequestDetails':
        return await Agent.getValidationRequestDetails(processedParams.requestId);
      
      case 'getPendingValidations':
        return await Agent.getPendingValidations(processedParams.validatorAgentId);
      
      case 'getServerValidations':
        return await Agent.getServerValidations(processedParams.serverAgentId);
      
      case 'isValidationCompleted':
        return await Agent.isValidationCompleted(processedParams.dataHash);

      default:
        throw new Error(`Unknown function: ${functionName}. Use getAICommands() to see available commands.`);
    }
  }

  /**
   * Process and clean AI parameters
   * @private
   */
  _processAIParameters(parameters) {
    const processed = { ...parameters };

    // Handle AUTO address replacement
    if (processed.address === 'AUTO') {
      processed.address = Agent.getWalletAddress();
      if (!processed.address) {
        throw new Error('No wallet imported. Use Agent.importWallet(privateKey) first.');
      }
    }

    // Ensure string format for agent IDs
    ['agentId', 'clientAgentId', 'serverAgentId', 'validatorAgentId'].forEach(param => {
      if (processed[param] !== undefined) {
        processed[param] = processed[param].toString();
      }
    });

    // Validate response scores (0-100)
    if (processed.response !== undefined) {
      const score = parseInt(processed.response);
      if (score < 0 || score > 100) {
        throw new Error('Validation response must be between 0 and 100');
      }
      processed.response = score;
    }

    return processed;
  }

  // ===== IDENTITY METHODS (Your existing methods - unchanged) =====

  /**
   * Register this agent
   * @returns {Promise<Object>} Registration result
   */
  async register() {
    if (!this.domain || !this.address) {
      throw new Error('Domain and address required for registration');
    }

    try {
      const result = await IdentityRegistry.registerAgent(this.domain, this.address);
      this.agentId = result.agentId;
      return result;
    } catch (error) {
      console.error('❌ Agent registration failed:', error.message);
      throw error;
    }
  }

  /**
   * Update this agent
   * @param {string} newDomain - New domain
   * @param {string} newAddress - New address
   * @returns {Promise<Object>} Update result
   */
  async update(newDomain = '', newAddress = '') {
    if (!this.agentId) {
      throw new Error('Agent must be registered before updating');
    }

    try {
      return await IdentityRegistry.updateAgent(this.agentId, newDomain, newAddress);
    } catch (error) {
      console.error('❌ Agent update failed:', error.message);
      throw error;
    }
  }

  /**
   * Get agent information
   * @returns {Promise<Object>} Agent information
   */
  async getInfo() {
    if (!this.agentId) {
      throw new Error('Agent not registered');
    }

    try {
      return await IdentityRegistry.getAgent(this.agentId);
    } catch (error) {
      console.error('❌ Failed to get agent info:', error.message);
      throw error;
    }
  }

  // ===== REPUTATION METHODS (Your existing methods - unchanged) =====

  /**
   * Authorize feedback for another agent (this agent becomes the client)
   * @param {number|string} serverAgentId - Server agent ID to authorize feedback for
   * @returns {Promise<Object>} Authorization result
   */
  async authorizeFeedbackFor(serverAgentId) {
    if (!this.agentId) {
      throw new Error('Agent must be registered before authorizing feedback');
    }

    return await ReputationRegistry.authorizeFeedback(this.agentId, serverAgentId);
  }

  /**
   * Get all feedback authorizations where this agent is the client
   * @returns {Promise<string[]>} Array of feedback authorization IDs
   */
  async getMyClientAuthorizations() {
    if (!this.agentId) {
      throw new Error('Agent must be registered');
    }

    return await ReputationRegistry.getClientFeedbackAuthorizations(this.agentId);
  }

  /**
   * Get all feedback authorizations where this agent is the server
   * @returns {Promise<string[]>} Array of feedback authorization IDs
   */
  async getMyServerAuthorizations() {
    if (!this.agentId) {
      throw new Error('Agent must be registered');
    }

    return await ReputationRegistry.getServerFeedbackAuthorizations(this.agentId);
  }

  // ===== VALIDATION METHODS (Your existing methods - unchanged) =====

  /**
   * Request validation from a validator agent (this agent is the requester)
   * @param {number|string} validatorAgentId - Validator agent ID
   * @param {string} dataHash - Hash of data to validate
   * @returns {Promise<Object>} Validation request result
   */
  async requestValidationFrom(validatorAgentId, dataHash) {
    if (!this.agentId) {
      throw new Error('Agent must be registered before requesting validation');
    }

    return await ValidationRegistry.requestValidation(validatorAgentId, this.agentId, dataHash);
  }

  /**
   * Respond to validation request (this agent acts as validator)
   * @param {string} dataHash - Hash of validated data
   * @param {number} response - Validation score (0-100)
   * @returns {Promise<Object>} Response result
   */
  async respondToValidation(dataHash, response) {
    return await ValidationRegistry.respondToValidation(dataHash, response);
  }

  /**
   * Get pending validation requests for this agent (when acting as validator)
   * @returns {Promise<string[]>} Array of pending request IDs
   */
  async getMyPendingValidations() {
    if (!this.agentId) {
      throw new Error('Agent must be registered');
    }

    return await ValidationRegistry.getPendingValidations(this.agentId);
  }

  /**
   * Get validation requests where this agent is the server
   * @returns {Promise<string[]>} Array of request IDs
   */
  async getMyValidationRequests() {
    if (!this.agentId) {
      throw new Error('Agent must be registered');
    }

    return await ValidationRegistry.getServerValidations(this.agentId);
  }

  // ===== STATIC WALLET MANAGEMENT (Your existing methods - unchanged) =====

  static importWallet(privateKey) {
    // Import wallet for all registries
    IdentityRegistry.importWallet(privateKey);
    ReputationRegistry.importWallet(privateKey);
    ValidationRegistry.importWallet(privateKey);
    return IdentityRegistry.getWalletAddress();
  }

  static getWalletAddress() {
    return IdentityRegistry.getWalletAddress();
  }

  static async getWalletBalance() {
    return await IdentityRegistry.getWalletBalance();
  }

  // ===== STATIC IDENTITY METHODS (Your existing methods - unchanged) =====

  static async getTotalAgents() {
    return await IdentityRegistry.getTotalAgents();
  }

  static async getNextAgentId() {
    return await IdentityRegistry.getNextAgentId();
  }

  static async resolveByDomain(domain) {
    return await IdentityRegistry.resolveByDomain(domain);
  }

  static async resolveByAddress(address) {
    return await IdentityRegistry.resolveByAddress(address);
  }

  static async agentExists(agentId) {
    return await IdentityRegistry.agentExists(agentId);
  }

  static async getAgent(agentId) {
    return await IdentityRegistry.getAgent(agentId);
  }

  static async registerAgent(domain, address) {
    return await IdentityRegistry.registerAgent(domain, address);
  }

  static async updateAgent(agentId, newDomain, newAddress) {
    return await IdentityRegistry.updateAgent(agentId, newDomain, newAddress);
  }

  // ===== STATIC REPUTATION METHODS (Your existing methods - unchanged) =====

  /**
   * Authorize feedback between any two agents
   * @param {number|string} clientAgentId - Client agent ID
   * @param {number|string} serverAgentId - Server agent ID
   * @returns {Promise<Object>} Authorization result
   */
  static async authorizeFeedback(clientAgentId, serverAgentId) {
    return await ReputationRegistry.authorizeFeedback(clientAgentId, serverAgentId);
  }

  /**
   * Check if feedback is authorized
   * @param {string} feedbackAuthId - Feedback authorization ID
   * @returns {Promise<boolean>} True if authorized
   */
  static async isFeedbackAuthorized(feedbackAuthId) {
    return await ReputationRegistry.isFeedbackAuthorized(feedbackAuthId);
  }

  /**
   * Get feedback authorization details
   * @param {string} feedbackAuthId - Feedback authorization ID
   * @returns {Promise<Object>} Authorization details
   */
  static async getFeedbackAuthorization(feedbackAuthId) {
    return await ReputationRegistry.getFeedbackAuthorization(feedbackAuthId);
  }

  /**
   * Get client feedback authorizations
   * @param {number|string} agentClientId - Client agent ID
   * @returns {Promise<string[]>} Array of authorization IDs
   */
  static async getClientFeedbackAuthorizations(agentClientId) {
    return await ReputationRegistry.getClientFeedbackAuthorizations(agentClientId);
  }

  /**
   * Get server feedback authorizations
   * @param {number|string} agentServerId - Server agent ID
   * @returns {Promise<string[]>} Array of authorization IDs
   */
  static async getServerFeedbackAuthorizations(agentServerId) {
    return await ReputationRegistry.getServerFeedbackAuthorizations(agentServerId);
  }

  // ===== STATIC VALIDATION METHODS (Your existing methods - unchanged) =====

  /**
   * Request validation between any two agents
   * @param {number|string} validatorAgentId - Validator agent ID
   * @param {number|string} serverAgentId - Server agent ID to validate
   * @param {string} dataHash - Hash of data to validate
   * @returns {Promise<Object>} Validation request result
   */
  static async requestValidation(validatorAgentId, serverAgentId, dataHash) {
    return await ValidationRegistry.requestValidation(validatorAgentId, serverAgentId, dataHash);
  }

  /**
   * Respond to validation request
   * @param {string} dataHash - Hash of validated data
   * @param {number} response - Validation score (0-100)
   * @returns {Promise<Object>} Response result
   */
  static async respondToValidation(dataHash, response) {
    return await ValidationRegistry.respondToValidation(dataHash, response);
  }

  /**
   * Get validation request details
   * @param {string} requestId - Request ID
   * @returns {Promise<Object>} Request details
   */
  static async getValidationRequest(requestId) {
    return await ValidationRegistry.getValidationRequest(requestId);
  }

  /**
   * Get pending validations for a validator
   * @param {number|string} validatorAgentId - Validator agent ID
   * @returns {Promise<string[]>} Array of pending request IDs
   */
  static async getPendingValidations(validatorAgentId) {
    return await ValidationRegistry.getPendingValidations(validatorAgentId);
  }

  /**
   * Get server validations
   * @param {number|string} serverAgentId - Server agent ID
   * @returns {Promise<string[]>} Array of request IDs
   */
  static async getServerValidations(serverAgentId) {
    return await ValidationRegistry.getServerValidations(serverAgentId);
  }

  /**
   * Get detailed validation request information
   * @param {string} requestId - Request ID
   * @returns {Promise<Object>} Detailed request information
   */
  static async getValidationRequestDetails(requestId) {
    return await ValidationRegistry.getValidationRequestDetails(requestId);
  }
// Add this case to your _executeAIFunction method in 0gAgentSdk.js

async _executeAIFunction(functionName, parameters) {
  const processedParams = this._processAIParameters(parameters);

  switch (functionName) {
    // 🔐 WALLET FUNCTIONS
    case 'createWallet':
      return WalletHelpers.createWallet();
    
    case 'sendMoney':
      return await WalletHelpers.sendMoney(
        processedParams.to, 
        processedParams.amount, 
        Agent.getWalletAddress()
      );
    
    case 'getBalance':
      const balance = await Agent.getWalletBalance();
      return { balance, address: Agent.getWalletAddress(), network: "0G Testnet" };
    
    case 'getAddress':
      const address = Agent.getWalletAddress();
      return { address, network: "0G Testnet" };

    // 🔥 ADD THESE MISSING FUNCTIONS:
    case 'getAvailableFunctions':
    case 'listFunctions':
    case 'showFunctions':
    case 'help':
      return this.getAICommands();

    case 'getAICommands':
      return this.getAICommands();

    // 🤖 IDENTITY FUNCTIONS
    case 'registerAgent':
      if (processedParams.domain && processedParams.address) {
        return await Agent.registerAgent(processedParams.domain, processedParams.address);
      } else if (this.domain) {
        return await this.register();
      } else {
        throw new Error('Domain required for registration');
      }
    
    case 'updateAgent':
      if (this.agentId) {
        return await this.update(processedParams.newDomain, processedParams.newAddress);
      } else {
        return await Agent.updateAgent(processedParams.agentId, processedParams.newDomain, processedParams.newAddress);
      }
    
    case 'getAgent':
      if (processedParams.agentId) {
        return await Agent.getAgent(processedParams.agentId);
      } else if (this.agentId) {
        return await this.getInfo();
      } else {
        throw new Error('Agent ID required');
      }
    
    case 'resolveByDomain':
      return await Agent.resolveByDomain(processedParams.domain);
    
    case 'resolveByAddress':
      return await Agent.resolveByAddress(processedParams.address);
    
    case 'agentExists':
      return await Agent.agentExists(processedParams.agentId);
    
    case 'getTotalAgents':
      return await Agent.getTotalAgents();
    
    case 'getNextAgentId':
      return await Agent.getNextAgentId();

    // ⭐ REPUTATION FUNCTIONS
    case 'authorizeFeedback':
      return await Agent.authorizeFeedback(processedParams.clientAgentId, processedParams.serverAgentId);
    
    case 'isFeedbackAuthorized':
      return await Agent.isFeedbackAuthorized(processedParams.feedbackAuthId);
    
    case 'getFeedbackAuthorization':
      return await Agent.getFeedbackAuthorization(processedParams.feedbackAuthId);
    
    case 'getClientFeedbackAuthorizations':
      return await Agent.getClientFeedbackAuthorizations(processedParams.agentId);
    
    case 'getServerFeedbackAuthorizations':
      return await Agent.getServerFeedbackAuthorizations(processedParams.agentId);

    // ✅ VALIDATION FUNCTIONS
    case 'requestValidation':
      return await Agent.requestValidation(
        processedParams.validatorAgentId,
        processedParams.serverAgentId, 
        processedParams.dataHash
      );
    
    case 'respondToValidation':
      return await Agent.respondToValidation(processedParams.dataHash, processedParams.response);
    
    case 'getValidationRequest':
      return await Agent.getValidationRequest(processedParams.requestId);
    
    case 'getValidationRequestDetails':
      return await Agent.getValidationRequestDetails(processedParams.requestId);
    
    case 'getPendingValidations':
      return await Agent.getPendingValidations(processedParams.validatorAgentId);
    
    case 'getServerValidations':
      return await Agent.getServerValidations(processedParams.serverAgentId);
    
    case 'isValidationCompleted':
      return await Agent.isValidationCompleted(processedParams.dataHash);

    default:
      // 🔥 BETTER ERROR HANDLING
      console.log(`❌ Unknown function: ${functionName}`);
      return {
        error: `Function "${functionName}" not found`,
        availableFunctions: Object.keys(this.getAICommands()).flat(),
        suggestion: "Try asking 'what functions can you do?' or 'help'"
      };
  }
}
  /**
   * Check if validation is completed
   * @param {string} dataHash - Data hash to check
   * @returns {Promise<boolean>} True if completed
   */
  static async isValidationCompleted(dataHash) {
    return await ValidationRegistry.isValidationCompleted(dataHash);
  }
}

export default Agent;