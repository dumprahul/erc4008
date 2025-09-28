#!/usr/bin/env node
// 0g-agent-cli/src/cli.js - Main CLI entry point (DEBUG VERSION)

import chalk from 'chalk';

async function startCLI() {
  console.clear();
  console.log(chalk.cyan('\n=== 0G Agent CLI ===\n'));
  
  try {
    console.log('Step 1: Loading display utilities...');
    const { displayWelcome, displayHeader } = await import('./utils/display.js');
    
    console.log('Step 2: Loading wallet utilities...');
    const { setupWallet, checkWallet } = await import('./utils/wallet.js');
    
    console.log('Step 3: Loading main menu...');
    const { mainMenu } = await import('./menus/mainMenu.js');
    
    console.log('Step 4: Displaying welcome...');
    displayWelcome();
    
    console.log('Step 5: Checking wallet...');
    const hasWallet = await checkWallet();
    
    if (!hasWallet) {
      console.log('Step 6: Setting up wallet...');
      await setupWallet();
    } else {
      console.log('Step 6: Wallet ready!');
    }
    
    console.log('Step 7: Starting main menu...');
    await mainMenu();
    
  } catch (error) {
    console.log(chalk.red('Error at step:', error.message));
    console.log('Stack:', error.stack);
  }
}

// Handle process exit gracefully
process.on('SIGINT', () => {
  console.log(chalk.yellow('\n\nThanks for using 0G Agent CLI!'));
  process.exit(0);
});

// Start the CLI
startCLI().catch((error) => {
  console.error(chalk.red('CLI Error:'), error.message);
  process.exit(1);
});