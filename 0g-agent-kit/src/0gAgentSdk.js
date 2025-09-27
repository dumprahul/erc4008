// 0g-agent-kit.js - Main 0G Agent Kit SDK

import * as IdentityRegistry from './IdentityRegistry.js';

/**
 * Agent class - Simple interface for 0G Agent creation
 */
class Agent {
  constructor(config = {}) {
    this.domain = config.domain;
    this.address = config.address;
    this.agentId = null;
  }

  /**
   * Create and register agent in one step
   * @param {Object} config - Agent configuration
   * @returns {Promise<Agent>} Registered agent instance
   */
  static async create(config) {
    const agent = new Agent(config);
    if (agent.domain && agent.address) {
      await agent.register();
    }
    return agent;
  }

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
      const result = await IdentityRegistry.updateAgent(this.agentId, newDomain, newAddress);
      
      // Update local properties if successful
      if (result.success) {
        if (newDomain) this.domain = newDomain;
        if (newAddress) this.address = newAddress;
      }
      
      return result;
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

  /**
   * Check if this agent exists
   * @returns {Promise<boolean>} Whether agent exists
   */
  async exists() {
    if (!this.agentId) {
      return false;
    }

    try {
      return await IdentityRegistry.agentExists(this.agentId);
    } catch (error) {
      console.error('❌ Failed to check agent existence:', error.message);
      return false;
    }
  }

  // Static methods for wallet management
  static importWallet(privateKey) {
    return IdentityRegistry.importWallet(privateKey);
  }

  static getWalletAddress() {
    return IdentityRegistry.getWalletAddress();
  }

  static async getWalletBalance() {
    return await IdentityRegistry.getWalletBalance();
  }

  // Static methods for contract queries
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

  // Direct registry access
  static async registerAgent(domain, address) {
    return await IdentityRegistry.registerAgent(domain, address);
  }

  static async updateAgent(agentId, newDomain, newAddress) {
    return await IdentityRegistry.updateAgent(agentId, newDomain, newAddress);
  }
}

// Export the Agent class as default
export default Agent;

// Also export for named imports
export { Agent };

// Export utility functions
export const {
  importWallet,
  getWalletAddress,
  getWalletBalance,
  registerAgent,
  updateAgent,
  getAgent,
  resolveByDomain,
  resolveByAddress,
  agentExists,
  getTotalAgents,
  getNextAgentId
} = IdentityRegistry;