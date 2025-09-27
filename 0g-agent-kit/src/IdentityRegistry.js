import { ethers } from 'ethers';
import { IdentityRegistryAddress, IdentityRegistryABI, rpcUrl } from './config/config.js';

let provider;
let signer;
let contract;

// Initialize contract instance
function initContract() {
    if (!provider) {
        throw new Error('Provider not set. Please call importWallet or setProvider first.');
    }
    contract = new ethers.Contract(IdentityRegistryAddress, IdentityRegistryABI, signer || provider);
}

// Set wallet from private key
export const importWallet = (privateKey) => {
    try {
        provider = new ethers.JsonRpcProvider(rpcUrl); // 0G RPC endpoint
        signer = new ethers.Wallet(privateKey, provider);
        initContract();
        return signer.address;
    } catch (error) {
        throw new Error(`Failed to import wallet: ${error.message}`);
    }
};

// Get wallet address
export const getWalletAddress = () => {
    if (!signer) {
        throw new Error('No wallet imported');
    }
    return signer.address;
};

// Get wallet balance
export const getWalletBalance = async () => {
    if (!signer) {
        throw new Error('No wallet imported');
    }
    try {
        const balance = await provider.getBalance(signer.address);
        return ethers.formatEther(balance);
    } catch (error) {
        throw new Error(`Failed to get balance: ${error.message}`);
    }
};

// Register a new agent
export const registerAgent = async (domain, address) => {
    if (!contract || !signer) {
        throw new Error('Contract not initialized or no signer available');
    }
    
    try {
        // First check if domain/address already exists
        try {
            const existingDomain = await contract.resolveByDomain(domain);
            throw new Error(`Domain ${domain} already registered to agent ${existingDomain[0]}`);
        } catch (e) {
            // Good - domain doesn't exist yet
            if (!e.message.includes('Agent not found for domain')) {
                throw e;
            }
        }

        const tx = await contract.registerAgent(domain, address);
        const receipt = await tx.wait();
        
        // Extract agentId from the AgentRegistered event using contract interface
        let agentId = null;
        for (const log of receipt.logs) {
            try {
                const parsedLog = contract.interface.parseLog(log);
                if (parsedLog && parsedLog.name === 'AgentRegistered') {
                    agentId = parsedLog.args.agentId;
                    break;
                }
            } catch (e) {
                // Skip logs that can't be parsed
                continue;
            }
        }
        
        return {
            success: true,
            agentId: agentId ? agentId.toString() : null,
            txHash: receipt.hash,
            domain,
            address,
            blockNumber: receipt.blockNumber
        };
    } catch (error) {
        throw new Error(`Failed to register agent: ${error.message}`);
    }
};

// Update an existing agent
export const updateAgent = async (agentId, newDomain, newAddress) => {
    if (!contract || !signer) {
        throw new Error('Contract not initialized or no signer available');
    }
    
    try {
        const tx = await contract.updateAgent(agentId, newDomain, newAddress);
        const receipt = await tx.wait();
        
        return {
            success: receipt.status === 1,
            agentId,
            newDomain,
            newAddress,
            txHash: receipt.hash,
            blockNumber: receipt.blockNumber
        };
    } catch (error) {
        throw new Error(`Failed to update agent: ${error.message}`);
    }
};

// Get agent information by ID
export const getAgent = async (agentId) => {
    if (!contract) {
        throw new Error('Contract not initialized');
    }
    
    try {
        const result = await contract.getAgent(agentId);
        return {
            agentId: result[0].toString(),
            domain: result[1],
            address: result[2]
        };
    } catch (error) {
        throw new Error(`Failed to get agent: ${error.message}`);
    }
};

// Resolve agent by domain
export const resolveByDomain = async (domain) => {
    if (!contract) {
        throw new Error('Contract not initialized');
    }
    
    try {
        const result = await contract.resolveByDomain(domain);
        return {
            agentId: result[0].toString(),
            domain: result[1],
            address: result[2]
        };
    } catch (error) {
        throw new Error(`Failed to resolve by domain: ${error.message}`);
    }
};

// Resolve agent by address
export const resolveByAddress = async (address) => {
    if (!contract) {
        throw new Error('Contract not initialized');
    }
    
    try {
        const result = await contract.resolveByAddress(address);
        return {
            agentId: result[0].toString(),
            domain: result[1],
            address: result[2]
        };
    } catch (error) {
        throw new Error(`Failed to resolve by address: ${error.message}`);
    }
};

// Check if agent exists
export const agentExists = async (agentId) => {
    if (!contract) {
        throw new Error('Contract not initialized');
    }
    
    try {
        const exists = await contract.agentExists(agentId);
        return exists;
    } catch (error) {
        throw new Error(`Failed to check if agent exists: ${error.message}`);
    }
};

// Helper functions for the SDK
export const getTotalAgents = async () => {
    if (!contract) {
        throw new Error('Contract not initialized');
    }
    
    try {
        const total = await contract.getTotalAgents();
        return total.toString();
    } catch (error) {
        throw new Error(`Failed to get total agents: ${error.message}`);
    }
};

export const getNextAgentId = async () => {
    if (!contract) {
        throw new Error('Contract not initialized');
    }
    
    try {
        const nextId = await contract.getNextAgentId();
        return nextId.toString();
    } catch (error) {
        throw new Error(`Failed to get next agent ID: ${error.message}`);
    }
};