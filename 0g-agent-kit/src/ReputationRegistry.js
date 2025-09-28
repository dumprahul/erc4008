// ReputationRegistry.js - Core reputation contract interaction module
import { ethers } from 'ethers';
import { ReputationRegistryAddress, ReputationRegistryABI, rpcUrl } from './config/config.js';

let provider;
let signer;
let reputationContract;

/**
 * Initialize reputation registry connection
 * @private
 */
function initializeProvider() {
  if (!provider) {
    provider = new ethers.JsonRpcProvider(rpcUrl);
  }
  
  if (!reputationContract && signer) {
    reputationContract = new ethers.Contract(ReputationRegistryAddress, ReputationRegistryABI, signer);
  }
}

/**
 * Import wallet for transactions
 * @param {string} privateKey - Private key for wallet
 * @returns {string} Wallet address
 */
function importWallet(privateKey) {
  try {
    initializeProvider();
    signer = new ethers.Wallet(privateKey, provider);
    reputationContract = new ethers.Contract(ReputationRegistryAddress, ReputationRegistryABI, signer);
    
    console.log('✅ Reputation wallet connected:', signer.address);
    return signer.address;
  } catch (error) {
    console.error('❌ Failed to import wallet:', error.message);
    throw error;
  }
}

/**
 * Get current wallet address
 * @returns {string} Wallet address or null
 */
function getWalletAddress() {
  return signer ? signer.address : null;
}

/**
 * Get wallet balance
 * @returns {Promise<string>} Balance in ETH format
 */
async function getWalletBalance() {
  if (!signer) {
    throw new Error('Wallet not imported. Call importWallet() first.');
  }
  
  const balance = await provider.getBalance(signer.address);
  return ethers.formatEther(balance);
}

/**
 * Authorize feedback between client and server agents
 * @param {number|string} agentClientId - Client agent ID
 * @param {number|string} agentServerId - Server agent ID
 * @returns {Promise<Object>} Authorization result with feedbackAuthId
 */
async function authorizeFeedback(agentClientId, agentServerId) {
  if (!reputationContract) {
    throw new Error('Wallet not imported. Call importWallet() first.');
  }

  if (!agentClientId || !agentServerId) {
    throw new Error('Both agentClientId and agentServerId are required');
  }

  if (agentClientId === agentServerId) {
    throw new Error('Client and server agents cannot be the same');
  }

  try {
    console.log(`🔄 Authorizing feedback: Client ${agentClientId} → Server ${agentServerId}`);
    
    const tx = await reputationContract.authorizeFeedback(
      agentClientId.toString(),
      agentServerId.toString()
    );
    
    console.log('⏳ Transaction sent:', tx.hash);
    const receipt = await tx.wait();
    console.log('✅ Transaction confirmed in block:', receipt.blockNumber);

    // Extract feedbackAuthId from events
    const feedbackAuthId = receipt.logs[0]?.topics[3]; // Third indexed parameter
    
    return {
      success: true,
      feedbackAuthId,
      agentClientId: agentClientId.toString(),
      agentServerId: agentServerId.toString(),
      txHash: tx.hash,
      blockNumber: receipt.blockNumber
    };
  } catch (error) {
    console.error('❌ Authorization failed:', error.message);
    throw error;
  }
}

/**
 * Check if feedback is authorized
 * @param {string} feedbackAuthId - Feedback authorization ID
 * @returns {Promise<boolean>} True if authorized
 */
async function isFeedbackAuthorized(feedbackAuthId) {
  if (!reputationContract) {
    throw new Error('Wallet not imported. Call importWallet() first.');
  }

  if (!feedbackAuthId || feedbackAuthId === '0x0000000000000000000000000000000000000000000000000000000000000000') {
    throw new Error('Valid feedbackAuthId is required');
  }

  try {
    const isAuthorized = await reputationContract.isFeedbackAuthorized(feedbackAuthId);
    console.log(`🔍 Feedback authorization status for ${feedbackAuthId}:`, isAuthorized);
    return isAuthorized;
  } catch (error) {
    console.error('❌ Failed to check authorization:', error.message);
    throw error;
  }
}

/**
 * Get feedback authorization details
 * @param {string} feedbackAuthId - Feedback authorization ID
 * @returns {Promise<Object>} Authorization details
 */
async function getFeedbackAuthorization(feedbackAuthId) {
  if (!reputationContract) {
    throw new Error('Wallet not imported. Call importWallet() first.');
  }

  if (!feedbackAuthId || feedbackAuthId === '0x0000000000000000000000000000000000000000000000000000000000000000') {
    throw new Error('Valid feedbackAuthId is required');
  }

  try {
    const [agentClientId, agentServerId, isAuthorized] = await reputationContract.getFeedbackAuthorization(feedbackAuthId);
    
    const result = {
      feedbackAuthId,
      agentClientId: agentClientId.toString(),
      agentServerId: agentServerId.toString(),
      isAuthorized
    };
    
    console.log('📄 Feedback authorization details:', result);
    return result;
  } catch (error) {
    console.error('❌ Failed to get authorization details:', error.message);
    throw error;
  }
}

/**
 * Get all feedback authorizations for a client agent
 * @param {number|string} agentClientId - Client agent ID
 * @returns {Promise<string[]>} Array of feedback authorization IDs
 */
async function getClientFeedbackAuthorizations(agentClientId) {
  if (!reputationContract) {
    throw new Error('Wallet not imported. Call importWallet() first.');
  }

  if (!agentClientId) {
    throw new Error('agentClientId is required');
  }

  try {
    const authIds = await reputationContract.getClientFeedbackAuthorizations(agentClientId.toString());
    
    console.log(`📋 Client ${agentClientId} has ${authIds.length} feedback authorizations`);
    return authIds;
  } catch (error) {
    console.error('❌ Failed to get client authorizations:', error.message);
    throw error;
  }
}

/**
 * Get all feedback authorizations for a server agent
 * @param {number|string} agentServerId - Server agent ID
 * @returns {Promise<string[]>} Array of feedback authorization IDs
 */
async function getServerFeedbackAuthorizations(agentServerId) {
  if (!reputationContract) {
    throw new Error('Wallet not imported. Call importWallet() first.');
  }

  if (!agentServerId) {
    throw new Error('agentServerId is required');
  }

  try {
    const authIds = await reputationContract.getServerFeedbackAuthorizations(agentServerId.toString());
    
    console.log(`📋 Server ${agentServerId} has ${authIds.length} feedback authorizations`);
    return authIds;
  } catch (error) {
    console.error('❌ Failed to get server authorizations:', error.message);
    throw error;
  }
}

// Export all functions
export {
  importWallet,
  getWalletAddress,
  getWalletBalance,
  authorizeFeedback,
  isFeedbackAuthorized,
  getFeedbackAuthorization,
  getClientFeedbackAuthorizations,
  getServerFeedbackAuthorizations
};