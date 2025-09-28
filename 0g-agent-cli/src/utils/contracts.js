// 0g-agent-cli/src/utils/contracts.js - Direct contract interaction (SIMPLIFIED)

import { ethers } from 'ethers';

// Contract addresses and basic config
const CONFIG = {
  rpcUrl: 'https://rpc-zero-gravity-testnet.rockx.com',
  contracts: {
    identity: '0xb4641C1E1e01917292cCeC8DA99517142f547C8E',
    reputation: '0xe3850deDED5AD7eC5177edA0B3E1E462AE72008B',
    validation: '0xF8F218aA4b0A0C18Ec22Dc97E68095e79cDCefB3'
  }
};

// Basic ABIs - only the functions we need
const ABIS = {
  identity: [
    "function registerAgent(string memory agentDomain, address agentAddress) public returns (uint256 agentId)",
    "function getAgent(uint256 agentId) public view returns (uint256 agentId_, string memory agentDomain, address agentAddress)",
    "function resolveByDomain(string memory agentDomain) public view returns (uint256 agentId, string memory agentDomain_, address agentAddress)",
    "function resolveByAddress(address agentAddress) public view returns (uint256 agentId, string memory agentDomain, address agentAddress_)",
    "function getTotalAgents() public view returns (uint256 count)",
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
    "function getPendingValidations(uint256 agentValidatorId) public view returns (bytes32[] memory requestIds)",
    "function getServerValidations(uint256 agentServerId) public view returns (bytes32[] memory requestIds)",
    "function isValidationCompleted(bytes32 dataHash) public view returns (bool completed)",
    "event ValidationRequested(uint256 indexed agentValidatorId, uint256 indexed agentServerId, bytes32 indexed dataHash, bytes32 requestId)"
  ]
};

let provider = null;
let signer = null;
let contracts = {};

// Initialize provider and contracts
export function initProvider() {
  if (!provider) {
    provider = new ethers.JsonRpcProvider(CONFIG.rpcUrl);
  }
}

export function initWallet(privateKey) {
  initProvider();
  signer = new ethers.Wallet(privateKey, provider);
  
  // Initialize contracts with signer
  contracts.identity = new ethers.Contract(CONFIG.contracts.identity, ABIS.identity, signer);
  contracts.reputation = new ethers.Contract(CONFIG.contracts.reputation, ABIS.reputation, signer);
  contracts.validation = new ethers.Contract(CONFIG.contracts.validation, ABIS.validation, signer);
  
  return signer.address;
}

export function getWalletAddress() {
  return signer ? signer.address : null;
}

export async function getWalletBalance() {
  if (!signer) throw new Error('Wallet not initialized');
  const balance = await provider.getBalance(signer.address);
  return ethers.formatEther(balance);
}

// IDENTITY FUNCTIONS
export async function registerAgent(domain, address) {
  if (!contracts.identity) throw new Error('Wallet not initialized');
  
  const tx = await contracts.identity.registerAgent(domain, address);
  const receipt = await tx.wait();
  
  // Extract agent ID from event
  let agentId = null;
  for (const log of receipt.logs) {
    try {
      const parsed = contracts.identity.interface.parseLog(log);
      if (parsed && parsed.name === 'AgentRegistered') {
        agentId = parsed.args.agentId.toString();
        break;
      }
    } catch (e) {
      continue;
    }
  }
  
  return {
    success: true,
    agentId,
    domain,
    address,
    txHash: receipt.hash,
    blockNumber: receipt.blockNumber
  };
}

export async function getAgent(agentId) {
  if (!contracts.identity) throw new Error('Wallet not initialized');
  
  const result = await contracts.identity.getAgent(agentId);
  return {
    agentId: result[0].toString(),
    domain: result[1],
    address: result[2]
  };
}

export async function resolveByDomain(domain) {
  if (!contracts.identity) throw new Error('Wallet not initialized');
  
  const result = await contracts.identity.resolveByDomain(domain);
  return {
    agentId: result[0].toString(),
    domain: result[1],
    address: result[2]
  };
}

export async function resolveByAddress(address) {
  if (!contracts.identity) throw new Error('Wallet not initialized');
  
  const result = await contracts.identity.resolveByAddress(address);
  return {
    agentId: result[0].toString(),
    domain: result[1],
    address: result[2]
  };
}

export async function getTotalAgents() {
  if (!contracts.identity) throw new Error('Wallet not initialized');
  
  const result = await contracts.identity.getTotalAgents();
  return result.toString();
}

export async function agentExists(agentId) {
  if (!contracts.identity) throw new Error('Wallet not initialized');
  
  return await contracts.identity.agentExists(agentId);
}

// REPUTATION FUNCTIONS
export async function authorizeFeedback(clientId, serverId) {
  if (!contracts.reputation) throw new Error('Wallet not initialized');
  
  const tx = await contracts.reputation.authorizeFeedback(clientId, serverId);
  const receipt = await tx.wait();
  
  // Extract feedback auth ID from event
  let feedbackAuthId = null;
  for (const log of receipt.logs) {
    try {
      const parsed = contracts.reputation.interface.parseLog(log);
      if (parsed && parsed.name === 'FeedbackAuthorized') {
        feedbackAuthId = parsed.args.feedbackAuthId;
        break;
      }
    } catch (e) {
      continue;
    }
  }
  
  return {
    success: true,
    feedbackAuthId,
    agentClientId: clientId.toString(),
    agentServerId: serverId.toString(),
    txHash: receipt.hash,
    blockNumber: receipt.blockNumber
  };
}

export async function isFeedbackAuthorized(authId) {
  if (!contracts.reputation) throw new Error('Wallet not initialized');
  
  return await contracts.reputation.isFeedbackAuthorized(authId);
}

export async function getFeedbackAuthorization(authId) {
  if (!contracts.reputation) throw new Error('Wallet not initialized');
  
  const result = await contracts.reputation.getFeedbackAuthorization(authId);
  return {
    feedbackAuthId: authId,
    agentClientId: result[0].toString(),
    agentServerId: result[1].toString(),
    isAuthorized: result[2]
  };
}

export async function getClientFeedbackAuthorizations(clientId) {
  if (!contracts.reputation) throw new Error('Wallet not initialized');
  
  return await contracts.reputation.getClientFeedbackAuthorizations(clientId);
}

export async function getServerFeedbackAuthorizations(serverId) {
  if (!contracts.reputation) throw new Error('Wallet not initialized');
  
  return await contracts.reputation.getServerFeedbackAuthorizations(serverId);
}

// VALIDATION FUNCTIONS
export async function requestValidation(validatorId, serverId, dataHash) {
  if (!contracts.validation) throw new Error('Wallet not initialized');
  
  const tx = await contracts.validation.requestValidation(validatorId, serverId, dataHash);
  const receipt = await tx.wait();
  
  // Extract request ID from event
  let requestId = null;
  for (const log of receipt.logs) {
    try {
      const parsed = contracts.validation.interface.parseLog(log);
      if (parsed && parsed.name === 'ValidationRequested') {
        requestId = parsed.args.requestId;
        break;
      }
    } catch (e) {
      continue;
    }
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
}

export async function respondToValidation(dataHash, score) {
  if (!contracts.validation) throw new Error('Wallet not initialized');
  
  const tx = await contracts.validation.respondToValidation(dataHash, score);
  const receipt = await tx.wait();
  
  return {
    success: true,
    dataHash,
    response: score,
    txHash: receipt.hash,
    blockNumber: receipt.blockNumber
  };
}

export async function getValidationRequest(requestId) {
  if (!contracts.validation) throw new Error('Wallet not initialized');
  
  const result = await contracts.validation.getValidationRequest(requestId);
  return {
    requestId,
    agentValidatorId: result[0].toString(),
    agentServerId: result[1].toString(),
    dataHash: result[2],
    isPending: result[3],
    response: result[4].toString()
  };
}

export async function getPendingValidations(validatorId) {
  if (!contracts.validation) throw new Error('Wallet not initialized');
  
  return await contracts.validation.getPendingValidations(validatorId);
}

export async function getServerValidations(serverId) {
  if (!contracts.validation) throw new Error('Wallet not initialized');
  
  return await contracts.validation.getServerValidations(serverId);
}

export async function isValidationCompleted(dataHash) {
  if (!contracts.validation) throw new Error('Wallet not initialized');
  
  return await contracts.validation.isValidationCompleted(dataHash);
}