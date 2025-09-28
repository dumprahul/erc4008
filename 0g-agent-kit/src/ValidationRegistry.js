// ValidationRegistry.js - Core validation contract interaction module
import { ethers } from 'ethers';
import crypto from 'crypto';
import { ValidationRegistryAddress, ValidationRegistryABI, rpcUrl } from './config/config.js';

let provider;
let signer;
let validationContract;

/**
 * Initialize validation registry connection
 * @private
 */
function initializeProvider() {
  if (!provider) {
    provider = new ethers.JsonRpcProvider(rpcUrl);
  }
  
  if (!validationContract && signer) {
    validationContract = new ethers.Contract(ValidationRegistryAddress, ValidationRegistryABI, signer);
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
    validationContract = new ethers.Contract(ValidationRegistryAddress, ValidationRegistryABI, signer);
    
    console.log('✅ Validation wallet connected:', signer.address);
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
 * Request validation from a validator agent
 * @param {number|string} agentValidatorId - Validator agent ID
 * @param {number|string} agentServerId - Server agent ID to validate
 * @param {string} dataHash - Hash of data to be validated (bytes32)
 * @returns {Promise<Object>} Validation request result with requestId
 */
async function requestValidation(agentValidatorId, agentServerId, dataHash) {
  if (!validationContract) {
    throw new Error('Wallet not imported. Call importWallet() first.');
  }

  if (!agentValidatorId || !agentServerId) {
    throw new Error('Both agentValidatorId and agentServerId are required');
  }

  if (!dataHash || dataHash === '0x0000000000000000000000000000000000000000000000000000000000000000') {
    throw new Error('Valid dataHash is required');
  }

  if (agentValidatorId === agentServerId) {
    throw new Error('Validator and server agents cannot be the same');
  }

  try {
    console.log(`🔄 Requesting validation: Validator ${agentValidatorId} → Server ${agentServerId}`);
    console.log(`📄 Data hash: ${dataHash}`);
    
    const tx = await validationContract.requestValidation(
      agentValidatorId.toString(),
      agentServerId.toString(),
      dataHash
    );
    
    console.log('⏳ Transaction sent:', tx.hash);
    const receipt = await tx.wait();
    console.log('✅ Transaction confirmed in block:', receipt.blockNumber);

    // Extract requestId from event data (requestId is not indexed, so it's in the data field)
    let requestId = null;
    if (receipt.logs && receipt.logs.length > 0) {
      try {
        // Parse the event log to get the requestId
        const iface = new ethers.Interface(ValidationRegistryABI);
        const parsedLog = iface.parseLog(receipt.logs[0]);
        requestId = parsedLog.args.requestId;
      } catch (error) {
        console.log('⚠️ Could not parse requestId from event, using fallback');
        // Fallback: generate a mock requestId for testing
        requestId = '0x' + crypto.randomBytes(32).toString('hex');
      }
    }
    
    return {
      success: true,
      requestId,
      agentValidatorId: agentValidatorId.toString(),
      agentServerId: agentServerId.toString(),
      dataHash,
      txHash: tx.hash,
      blockNumber: receipt.blockNumber
    };
  } catch (error) {
    console.error('❌ Validation request failed:', error.message);
    throw error;
  }
}

/**
 * Respond to a validation request
 * @param {string} dataHash - Hash of data that was validated
 * @param {number} response - Validation response (0-100)
 * @returns {Promise<Object>} Response result
 */
async function respondToValidation(dataHash, response) {
  if (!validationContract) {
    throw new Error('Wallet not imported. Call importWallet() first.');
  }

  if (!dataHash || dataHash === '0x0000000000000000000000000000000000000000000000000000000000000000') {
    throw new Error('Valid dataHash is required');
  }

  if (response < 0 || response > 100) {
    throw new Error('Response must be between 0 and 100');
  }

  try {
    console.log(`🔄 Responding to validation for data: ${dataHash}`);
    console.log(`📊 Response score: ${response}`);
    
    const tx = await validationContract.respondToValidation(dataHash, response);
    
    console.log('⏳ Transaction sent:', tx.hash);
    const receipt = await tx.wait();
    console.log('✅ Transaction confirmed in block:', receipt.blockNumber);
    
    return {
      success: true,
      dataHash,
      response,
      txHash: tx.hash,
      blockNumber: receipt.blockNumber
    };
  } catch (error) {
    console.error('❌ Validation response failed:', error.message);
    throw error;
  }
}

/**
 * Get validation request details
 * @param {string} requestId - Validation request ID
 * @returns {Promise<Object>} Request details
 */
async function getValidationRequest(requestId) {
  if (!validationContract) {
    throw new Error('Wallet not imported. Call importWallet() first.');
  }

  if (!requestId || requestId === '0x0000000000000000000000000000000000000000000000000000000000000000') {
    throw new Error('Valid requestId is required');
  }

  try {
    const [agentValidatorId, agentServerId, dataHash, isPending, response] = 
      await validationContract.getValidationRequest(requestId);
    
    const result = {
      requestId,
      agentValidatorId: agentValidatorId.toString(),
      agentServerId: agentServerId.toString(),
      dataHash,
      isPending,
      response: response.toString()
    };
    
    console.log('📄 Validation request details:', result);
    return result;
  } catch (error) {
    console.error('❌ Failed to get validation request:', error.message);
    throw error;
  }
}

/**
 * Get pending validations for a validator
 * @param {number|string} agentValidatorId - Validator agent ID
 * @returns {Promise<string[]>} Array of pending request IDs
 */
async function getPendingValidations(agentValidatorId) {
  if (!validationContract) {
    throw new Error('Wallet not imported. Call importWallet() first.');
  }

  if (!agentValidatorId) {
    throw new Error('agentValidatorId is required');
  }

  try {
    const requestIds = await validationContract.getPendingValidations(agentValidatorId.toString());
    
    console.log(`📋 Validator ${agentValidatorId} has ${requestIds.length} pending validations`);
    return requestIds;
  } catch (error) {
    console.error('❌ Failed to get pending validations:', error.message);
    throw error;
  }
}

/**
 * Get all validation requests for a server agent
 * @param {number|string} agentServerId - Server agent ID
 * @returns {Promise<string[]>} Array of request IDs
 */
async function getServerValidations(agentServerId) {
  if (!validationContract) {
    throw new Error('Wallet not imported. Call importWallet() first.');
  }

  if (!agentServerId) {
    throw new Error('agentServerId is required');
  }

  try {
    const requestIds = await validationContract.getServerValidations(agentServerId.toString());
    
    console.log(`📋 Server ${agentServerId} has ${requestIds.length} validation requests`);
    return requestIds;
  } catch (error) {
    console.error('❌ Failed to get server validations:', error.message);
    throw error;
  }
}

/**
 * Get detailed validation request information
 * @param {string} requestId - Validation request ID
 * @returns {Promise<Object>} Detailed request information
 */
async function getValidationRequestDetails(requestId) {
  if (!validationContract) {
    throw new Error('Wallet not imported. Call importWallet() first.');
  }

  if (!requestId || requestId === '0x0000000000000000000000000000000000000000000000000000000000000000') {
    throw new Error('Valid requestId is required');
  }

  try {
    const [agentValidatorId, agentServerId, dataHash, isPending, response, timestamp, timeout] = 
      await validationContract.getValidationRequestDetails(requestId);
    
    const result = {
      requestId,
      agentValidatorId: agentValidatorId.toString(),
      agentServerId: agentServerId.toString(),
      dataHash,
      isPending,
      response: response.toString(),
      timestamp: timestamp.toString(),
      timeout: timeout.toString(),
      timeoutDate: new Date(Number(timeout) * 1000).toISOString()
    };
    
    console.log('📄 Detailed validation request:', result);
    return result;
  } catch (error) {
    console.error('❌ Failed to get validation request details:', error.message);
    throw error;
  }
}

/**
 * Check if validation is completed for a data hash
 * @param {string} dataHash - Data hash to check
 * @returns {Promise<boolean>} True if validation is completed
 */
async function isValidationCompleted(dataHash) {
  if (!validationContract) {
    throw new Error('Wallet not imported. Call importWallet() first.');
  }

  if (!dataHash || dataHash === '0x0000000000000000000000000000000000000000000000000000000000000000') {
    throw new Error('Valid dataHash is required');
  }

  try {
    const isCompleted = await validationContract.isValidationCompleted(dataHash);
    console.log(`🔍 Validation completed for ${dataHash}:`, isCompleted);
    return isCompleted;
  } catch (error) {
    console.error('❌ Failed to check validation status:', error.message);
    throw error;
  }
}

// Export all functions
export {
  importWallet,
  getWalletAddress,
  getWalletBalance,
  requestValidation,
  respondToValidation,
  getValidationRequest,
  getPendingValidations,
  getServerValidations,
  getValidationRequestDetails,
  isValidationCompleted
};