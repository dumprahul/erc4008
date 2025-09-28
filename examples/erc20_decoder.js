/**
 * Example: Custom Event Decoder for ERC-20 Token Contract
 * 
 * This example shows how to extend the indexer to decode specific events
 * using contract ABIs for better data interpretation.
 */

import { ethers } from 'ethers';
import logger from '../src/utils/logger.js';

// ERC-20 Token ABI (simplified)
const ERC20_ABI = [
    "event Transfer(address indexed from, address indexed to, uint256 value)",
    "event Approval(address indexed owner, address indexed spender, uint256 value)",
    "function name() view returns (string)",
    "function symbol() view returns (string)",
    "function decimals() view returns (uint8)",
    "function totalSupply() view returns (uint256)",
    "function balanceOf(address) view returns (uint256)",
];

export class ERC20EventDecoder {
    constructor(provider) {
        this.provider = provider;
        this.interface = new ethers.Interface(ERC20_ABI);
    }

    /**
     * Decode ERC-20 events from raw log data
     */
    decodeEvent(log) {
        try {
            const decoded = this.interface.parseLog({
                topics: log.topics,
                data: log.data
            });

            if (!decoded) return null;

            const eventData = {
                name: decoded.name,
                signature: decoded.signature,
                args: {}
            };

            // Convert BigInt values to strings for JSON serialization
            for (const [key, value] of Object.entries(decoded.args)) {
                if (typeof value === 'bigint') {
                    eventData.args[key] = value.toString();
                } else {
                    eventData.args[key] = value;
                }
            }

            return eventData;

        } catch (error) {
            logger.debug('Failed to decode event:', error.message);
            return null;
        }
    }

    /**
     * Decode Transfer event specifically
     */
    decodeTransferEvent(log) {
        const decoded = this.decodeEvent(log);
        
        if (decoded && decoded.name === 'Transfer') {
            return {
                from: decoded.args.from,
                to: decoded.args.to,
                value: decoded.args.value,
                formattedValue: ethers.formatUnits(decoded.args.value, 18) // Assumes 18 decimals
            };
        }
        
        return null;
    }

    /**
     * Decode Approval event specifically
     */
    decodeApprovalEvent(log) {
        const decoded = this.decodeEvent(log);
        
        if (decoded && decoded.name === 'Approval') {
            return {
                owner: decoded.args.owner,
                spender: decoded.args.spender,
                value: decoded.args.value,
                formattedValue: ethers.formatUnits(decoded.args.value, 18) // Assumes 18 decimals
            };
        }
        
        return null;
    }

    /**
     * Get token information
     */
    async getTokenInfo(contractAddress) {
        try {
            const contract = new ethers.Contract(contractAddress, ERC20_ABI, this.provider);
            
            const [name, symbol, decimals, totalSupply] = await Promise.all([
                contract.name(),
                contract.symbol(),
                contract.decimals(),
                contract.totalSupply()
            ]);

            return {
                name,
                symbol,
                decimals: Number(decimals),
                totalSupply: totalSupply.toString(),
                formattedTotalSupply: ethers.formatUnits(totalSupply, decimals)
            };

        } catch (error) {
            logger.error(`Failed to get token info for ${contractAddress}:`, error);
            return null;
        }
    }
}

// Example usage
export async function exampleUsage() {
    const provider = new ethers.JsonRpcProvider(process.env.OG_RPC_URL);
    const decoder = new ERC20EventDecoder(provider);

    // Example contract address (replace with actual ERC-20 token address)
    const tokenAddress = "0x1234567890abcdef1234567890abcdef12345678";

    try {
        // Get token information
        console.log('Getting token info...');
        const tokenInfo = await decoder.getTokenInfo(tokenAddress);
        console.log('Token Info:', tokenInfo);

        // Get recent logs
        console.log('Getting recent Transfer events...');
        const latestBlock = await provider.getBlockNumber();
        const fromBlock = latestBlock - 100; // Last 100 blocks

        const logs = await provider.getLogs({
            address: tokenAddress,
            fromBlock,
            toBlock: latestBlock,
            topics: [
                ethers.id("Transfer(address,address,uint256)") // Transfer event signature
            ]
        });

        console.log(`Found ${logs.length} Transfer events`);

        // Decode each log
        for (const log of logs.slice(0, 5)) { // Show first 5 events
            const decoded = decoder.decodeTransferEvent(log);
            if (decoded) {
                console.log('Transfer:', {
                    from: decoded.from,
                    to: decoded.to,
                    amount: decoded.formattedValue,
                    txHash: log.transactionHash,
                    blockNumber: log.blockNumber
                });
            }
        }

    } catch (error) {
        console.error('Example failed:', error);
    }
}

// Uncomment to run the example
// exampleUsage();