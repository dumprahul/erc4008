// 0g-agent-cli/src/utils/wallet.js - Complete wallet with all contract functions

import { ethers } from 'ethers';
import { promptPrivateKey, promptConfirm } from './prompts.js';
import { displaySuccess, displayError, displayWalletInfo } from './display.js';
import { colors, icons } from '../config/style.js';

// Contract config
const RPC_URL = 'https://sepolia.infura.io/v3/866b11e8b12045fd92b01f6133381b53';
const CONTRACTS = {
  identity: '0xb4641C1E1e01917292cCeC8DA99517142f547C8E',
  reputation: '0xe3850deDED5AD7eC5177edA0B3E1E462AE72008B',
  validation: '0xF8F218aA4b0A0C18Ec22Dc97E68095e79cDCefB3'
};

// Contract ABIs
const ABIS = {
  identity: [
    "function registerAgent(string memory agentDomain, address agentAddress) public returns (uint256 agentId)",
    "function updateAgent(uint256 agentId, string memory newAgentDomain, address newAgentAddress) public returns (bool success)",
    "function getAgent(uint256 agentId) public view returns (uint256 agentId_, string memory agentDomain, address agentAddress)",
    "function resolveByDomain(string memory agentDomain) public view returns (uint256 agentId, string memory agentDomain_, address agentAddress)",
    "function resolveByAddress(address agentAddress) public view returns (uint256 agentId, string memory agentDomain, address agentAddress_)",
    "function getTotalAgents() public view returns (uint256 count)",
    "function getNextAgentId() public view returns (uint256 nextId)",
    "function agentExists(uint256 agentId) public view returns (bool exists)",
    "event AgentRegistered(uint256 indexed agentId, string agentDomain, address agentAddress)"
  ],
  reputation: [
    "function authorizeFeedback(uint256 agentClientId, uint256 agentServerId) public returns (bytes32 feedbackAuthId)",
    "function isFeedbackAuthorized(bytes32 feedbackAuthId) public view returns (bool isAuthorized)",
    "function getFeedbackAuthorization(bytes32 feedbackAuthId) public view returns (uint256 agentClientId, uint256 agentServerId, bool isAuthorized)",
    "function getClientFeedbackAuthorizations(uint256 agentClientId) public view returns (bytes32[] memory feedbackAuthIds)",
    "function getServerFeedbackAuthorizations(uint256 agentServerId) public view returns (bytes32[] memory feedbackAuthIds)",
    "event FeedbackAuthorized(uint256 indexed agentClientId, uint256 indexed agentServerId, bytes32 indexed feedbackAuthId)"
  ],
  validation: [
    "function requestValidation(uint256 agentValidatorId, uint256 agentServerId, bytes32 dataHash) public returns (bytes32 requestId)",
    "function respondToValidation(bytes32 dataHash, uint256 response) public returns (bool success)",
    "function getValidationRequest(bytes32 requestId) public view returns (uint256 agentValidatorId, uint256 agentServerId, bytes32 dataHash, bool isPending, uint256 response)",
    "function getValidationRequestDetails(bytes32 requestId) public view returns (uint256 agentValidatorId, uint256 agentServerId, bytes32 dataHash, bool isPending, uint256 response, uint256 timestamp, uint256 timeout)",
    "function getPendingValidations(uint256 agentValidatorId) public view returns (bytes32[] memory requestIds)",
    "function getServerValidations(uint256 agentServerId) public view returns (bytes32[] memory requestIds)",
    "function isValidationCompleted(bytes32 dataHash) public view returns (bool completed)",
    "event ValidationRequested(uint256 indexed agentValidatorId, uint256 indexed agentServerId, bytes32 indexed dataHash, bytes32 requestId)"
  ]
};

let provider, signer, contracts = {};
let walletAddress = null;
let walletBalance = null;

function initContracts() {
  contracts.identity = new ethers.Contract(CONTRACTS.identity, ABIS.identity, signer);
  contracts.reputation = new ethers.Contract(CONTRACTS.reputation, ABIS.reputation, signer);
  contracts.validation = new ethers.Contract(CONTRACTS.validation, ABIS.validation, signer);
}

export async function getAgentSDK() {
  return {
    // Wallet functions
    importWallet: (privateKey) => {
      provider = new ethers.JsonRpcProvider(RPC_URL);
      signer = new ethers.Wallet(privateKey, provider);
      walletAddress = signer.address;
      initContracts();
      return walletAddress;
    },
    
    getWalletAddress: () => walletAddress,
    
    getWalletBalance: async () => {
      if (!signer) throw new Error('Wallet not initialized');
      const balance = await provider.getBalance(signer.address);
      return ethers.formatEther(balance);
    },

    // IDENTITY REGISTRY FUNCTIONS
    registerAgent: async (domain, address) => {
      const tx = await contracts.identity.registerAgent(domain, address);
      const receipt = await tx.wait();
      
      let agentId = null;
      for (const log of receipt.logs) {
        try {
          const parsed = contracts.identity.interface.parseLog(log);
          if (parsed && parsed.name === 'AgentRegistered') {
            agentId = parsed.args.agentId.toString();
            break;
          }
        } catch (e) { continue; }
      }
      
      return {
        success: true,
        agentId,
        domain,
        address,
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber
      };
    },

    updateAgent: async (agentId, newDomain, newAddress) => {
      const tx = await contracts.identity.updateAgent(agentId, newDomain, newAddress);
      const receipt = await tx.wait();
      
      return {
        success: receipt.status === 1,
        agentId,
        newDomain,
        newAddress,
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber
      };
    },

    getAgent: async (agentId) => {
      const result = await contracts.identity.getAgent(agentId);
      return {
        agentId: result[0].toString(),
        domain: result[1],
        address: result[2]
      };
    },

    resolveByDomain: async (domain) => {
      const result = await contracts.identity.resolveByDomain(domain);
      return {
        agentId: result[0].toString(),
        domain: result[1],
        address: result[2]
      };
    },

    resolveByAddress: async (address) => {
      const result = await contracts.identity.resolveByAddress(address);
      return {
        agentId: result[0].toString(),
        domain: result[1],
        address: result[2]
      };
    },

    getTotalAgents: async () => {
      const result = await contracts.identity.getTotalAgents();
      return result.toString();
    },

    getNextAgentId: async () => {
      const result = await contracts.identity.getNextAgentId();
      return result.toString();
    },

    agentExists: async (agentId) => {
      return await contracts.identity.agentExists(agentId);
    },

    // REPUTATION REGISTRY FUNCTIONS
    authorizeFeedback: async (clientId, serverId) => {
      const tx = await contracts.reputation.authorizeFeedback(clientId, serverId);
      const receipt = await tx.wait();
      
      let feedbackAuthId = null;
      for (const log of receipt.logs) {
        try {
          const parsed = contracts.reputation.interface.parseLog(log);
          if (parsed && parsed.name === 'FeedbackAuthorized') {
            feedbackAuthId = parsed.args.feedbackAuthId;
            break;
          }
        } catch (e) { continue; }
      }
      
      return {
        success: true,
        feedbackAuthId,
        agentClientId: clientId.toString(),
        agentServerId: serverId.toString(),
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber
      };
    },

    isFeedbackAuthorized: async (authId) => {
      return await contracts.reputation.isFeedbackAuthorized(authId);
    },

    getFeedbackAuthorization: async (authId) => {
      const result = await contracts.reputation.getFeedbackAuthorization(authId);
      return {
        feedbackAuthId: authId,
        agentClientId: result[0].toString(),
        agentServerId: result[1].toString(),
        isAuthorized: result[2]
      };
    },

    getClientFeedbackAuthorizations: async (clientId) => {
      return await contracts.reputation.getClientFeedbackAuthorizations(clientId);
    },

    getServerFeedbackAuthorizations: async (serverId) => {
      return await contracts.reputation.getServerFeedbackAuthorizations(serverId);
    },

    // VALIDATION REGISTRY FUNCTIONS
    requestValidation: async (validatorId, serverId, dataHash) => {
      const tx = await contracts.validation.requestValidation(validatorId, serverId, dataHash);
      const receipt = await tx.wait();
      
      let requestId = null;
      for (const log of receipt.logs) {
        try {
          const parsed = contracts.validation.interface.parseLog(log);
          if (parsed && parsed.name === 'ValidationRequested') {
            requestId = parsed.args.requestId;
            break;
          }
        } catch (e) { continue; }
      }
      
      return {
        success: true,
        requestId,
        agentValidatorId: validatorId.toString(),
        agentServerId: serverId.toString(),
        dataHash,
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber
      };
    },

    respondToValidation: async (dataHash, score) => {
      const tx = await contracts.validation.respondToValidation(dataHash, score);
      const receipt = await tx.wait();
      
      return {
        success: true,
        dataHash,
        response: score,
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber
      };
    },

    getValidationRequest: async (requestId) => {
      const result = await contracts.validation.getValidationRequest(requestId);
      return {
        requestId,
        agentValidatorId: result[0].toString(),
        agentServerId: result[1].toString(),
        dataHash: result[2],
        isPending: result[3],
        response: result[4].toString()
      };
    },

    getValidationRequestDetails: async (requestId) => {
      const result = await contracts.validation.getValidationRequestDetails(requestId);
      return {
        requestId,
        agentValidatorId: result[0].toString(),
        agentServerId: result[1].toString(),
        dataHash: result[2],
        isPending: result[3],
        response: result[4].toString(),
        timestamp: result[5].toString(),
        timeout: result[6].toString(),
        timeoutDate: new Date(Number(result[6]) * 1000).toISOString()
      };
    },

    getPendingValidations: async (validatorId) => {
      return await contracts.validation.getPendingValidations(validatorId);
    },

    getServerValidations: async (serverId) => {
      return await contracts.validation.getServerValidations(serverId);
    },

    isValidationCompleted: async (dataHash) => {
      return await contracts.validation.isValidationCompleted(dataHash);
    }
  };
}

// Keep all existing wallet management functions exactly the same
export async function checkWallet() {
  try {
    const AgentSDK = await getAgentSDK();
    walletAddress = AgentSDK.getWalletAddress();
    return !!walletAddress;
  } catch (error) {
    return false;
  }
}

export async function setupWallet() {
  try {
    console.log(colors.info(`\n${icons.wallet} Wallet Setup Required\n`));
    console.log(colors.muted('To use the 0G Agent CLI, you need to configure your wallet.'));
    console.log(colors.muted('Your private key will be used to sign transactions.\n'));
    
    const privateKey = await promptPrivateKey();
    
    const AgentSDK = await getAgentSDK();
    walletAddress = AgentSDK.importWallet(privateKey);
    walletBalance = await AgentSDK.getWalletBalance();
    
    displaySuccess(`Wallet configured successfully!`);
    displayWalletInfo(walletAddress, walletBalance);
    
    return true;
  } catch (error) {
    displayError(`Failed to setup wallet: ${error.message}`);
    throw error;
  }
}

export async function getWalletInfo() {
  try {
    const AgentSDK = await getAgentSDK();
    
    if (!walletAddress) {
      walletAddress = AgentSDK.getWalletAddress();
    }
    
    walletBalance = await AgentSDK.getWalletBalance();
    
    return {
      address: walletAddress,
      balance: walletBalance
    };
  } catch (error) {
    displayError(`Failed to get wallet info: ${error.message}`);
    throw error;
  }
}

export async function displayCurrentWallet() {
  try {
    const info = await getWalletInfo();
    displayWalletInfo(info.address, info.balance);
  } catch (error) {
    displayError('No wallet configured. Please setup your wallet first.');
  }
}

export async function changeWallet() {
  try {
    console.log(colors.warning(`\n${icons.warning} Changing wallet will replace current configuration.\n`));
    
    const confirmed = await promptConfirm('Continue with wallet change?');
    if (!confirmed) {
      return false;
    }
    
    await setupWallet();
    return true;
  } catch (error) {
    displayError(`Failed to change wallet: ${error.message}`);
    return false;
  }
}

export function getAddress() {
  return walletAddress;
}

export function getBalance() {
  return walletBalance;
}

// Export all contract functions for direct use in menus
export async function registerAgent(domain, address) {
  const SDK = await getAgentSDK();
  return await SDK.registerAgent(domain, address);
}

export async function updateAgent(agentId, newDomain, newAddress) {
  const SDK = await getAgentSDK();
  return await SDK.updateAgent(agentId, newDomain, newAddress);
}

export async function getAgent(agentId) {
  const SDK = await getAgentSDK();
  return await SDK.getAgent(agentId);
}

export async function resolveByDomain(domain) {
  const SDK = await getAgentSDK();
  return await SDK.resolveByDomain(domain);
}

export async function resolveByAddress(address) {
  const SDK = await getAgentSDK();
  return await SDK.resolveByAddress(address);
}

export async function getTotalAgents() {
  const SDK = await getAgentSDK();
  return await SDK.getTotalAgents();
}

export async function getNextAgentId() {
  const SDK = await getAgentSDK();
  return await SDK.getNextAgentId();
}

export async function agentExists(agentId) {
  const SDK = await getAgentSDK();
  return await SDK.agentExists(agentId);
}

export async function authorizeFeedback(clientId, serverId) {
  const SDK = await getAgentSDK();
  return await SDK.authorizeFeedback(clientId, serverId);
}

export async function isFeedbackAuthorized(authId) {
  const SDK = await getAgentSDK();
  return await SDK.isFeedbackAuthorized(authId);
}

export async function getFeedbackAuthorization(authId) {
  const SDK = await getAgentSDK();
  return await SDK.getFeedbackAuthorization(authId);
}

export async function getClientFeedbackAuthorizations(clientId) {
  const SDK = await getAgentSDK();
  return await SDK.getClientFeedbackAuthorizations(clientId);
}

export async function getServerFeedbackAuthorizations(serverId) {
  const SDK = await getAgentSDK();
  return await SDK.getServerFeedbackAuthorizations(serverId);
}

export async function requestValidation(validatorId, serverId, dataHash) {
  const SDK = await getAgentSDK();
  return await SDK.requestValidation(validatorId, serverId, dataHash);
}

export async function respondToValidation(dataHash, score) {
  const SDK = await getAgentSDK();
  return await SDK.respondToValidation(dataHash, score);
}

export async function getValidationRequest(requestId) {
  const SDK = await getAgentSDK();
  return await SDK.getValidationRequest(requestId);
}

export async function getValidationRequestDetails(requestId) {
  const SDK = await getAgentSDK();
  return await SDK.getValidationRequestDetails(requestId);
}

export async function getPendingValidations(validatorId) {
  const SDK = await getAgentSDK();
  return await SDK.getPendingValidations(validatorId);
}

export async function getServerValidations(serverId) {
  const SDK = await getAgentSDK();
  return await SDK.getServerValidations(serverId);
}

export async function isValidationCompleted(dataHash) {
  const SDK = await getAgentSDK();
  return await SDK.isValidationCompleted(dataHash);
}