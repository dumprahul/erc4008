// ai/wallet-helpers.js - Fixed version

import { ethers } from 'ethers';

export class WalletHelpers {
  
  static createWallet() {
    try {
      // Generate new wallet
      const wallet = ethers.Wallet.createRandom();
      
      console.log('🔐 New wallet created successfully');
      
      return {
        address: wallet.address,
        privateKey: wallet.privateKey,
        mnemonic: wallet.mnemonic?.phrase || 'N/A', // Handle undefined mnemonic
        warning: "🚨 SAVE THESE CREDENTIALS SECURELY! Never share your private key!",
        next_steps: "Use Agent.importWallet(privateKey) to start using this wallet"
      };
    } catch (error) {
      console.error('Wallet creation error:', error);
      throw new Error(`Wallet creation failed: ${error.message}`);
    }
  }

  static async sendMoney(to, amount, fromAddress) {
    try {
      // Validate inputs
      if (!ethers.isAddress(to)) {
        throw new Error('Invalid recipient address format');
      }

      if (!fromAddress) {
        throw new Error('No wallet imported. Import a wallet first.');
      }

      const amountWei = ethers.parseEther(amount.toString());
      
      console.log(`💸 Preparing to send ${amount} ETH from ${fromAddress} to ${to}`);
      
      // For now, return simulation - in production you'd complete the actual transaction
      return {
        success: true,
        from: fromAddress,
        to: to,
        amount: amount,
        amountWei: amountWei.toString(),
        network: "0G Testnet",
        estimatedGas: "21000",
        note: "Transaction prepared - implement actual signing and broadcasting",
        warning: "This is a simulation. Implement actual transaction logic for production."
      };
      
    } catch (error) {
      throw new Error(`Send transaction failed: ${error.message}`);
    }
  }

  static validateAddress(address) {
    return ethers.isAddress(address);
  }

  static formatAmount(amount) {
    try {
      return ethers.formatEther(amount);
    } catch (error) {
      return amount.toString();
    }
  }
}

// Alternative: Simple wallet creation without ethers (backup)
export class SimpleWalletHelpers {
  static createWallet() {
    try {
      // Generate random private key (32 bytes)
      const privateKeyBytes = new Uint8Array(32);
      for (let i = 0; i < 32; i++) {
        privateKeyBytes[i] = Math.floor(Math.random() * 256);
      }
      
      const privateKey = '0x' + Array.from(privateKeyBytes)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
      
      // Generate random address (for demo - not cryptographically secure)
      const addressBytes = new Uint8Array(20);
      for (let i = 0; i < 20; i++) {
        addressBytes[i] = Math.floor(Math.random() * 256);
      }
      
      const address = '0x' + Array.from(addressBytes)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
      
      return {
        address: address,
        privateKey: privateKey,
        mnemonic: "demo wallet random seed words not secure",
        warning: "🚨 This is a DEMO wallet! Use ethers.js for production!",
        note: "Generated with basic randomness - not cryptographically secure"
      };
    } catch (error) {
      throw new Error(`Simple wallet creation failed: ${error.message}`);
    }
  }
}