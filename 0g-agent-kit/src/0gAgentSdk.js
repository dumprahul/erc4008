// 0gAgentSdk.js - Complete 0G Agent Kit SDK with all registries

import * as IdentityRegistry from './IdentityRegistry.js';
import * as ReputationRegistry from './ReputationRegistry.js';
import * as ValidationRegistry from './ValidationRegistry.js';

/**
 * Agent class - Complete interface for 0G Agent creation, reputation, and validation
 */
class Agent {
  constructor(config = {}) {
    this.domain = config.domain;
    this.address = config.address;
    this.agentId = null;

    // Auto-register if domain and address provided
    if (this.domain && this.address) {
      this.register().catch(console.error);
    }
  }

  // ===== IDENTITY METHODS =====

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

  // ===== REPUTATION METHODS =====

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

  // ===== VALIDATION METHODS =====

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

  // ===== STATIC WALLET MANAGEMENT =====

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

  // ===== STATIC IDENTITY METHODS =====

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

  // ===== STATIC REPUTATION METHODS =====

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

  // ===== STATIC VALIDATION METHODS =====

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