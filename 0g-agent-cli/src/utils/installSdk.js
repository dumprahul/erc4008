// 0g-agent-cli/src/utils/installSdk.js - Dynamic SDK installation and import

import { exec } from 'child_process';
import { promisify } from 'util';
import { displayError, displaySuccess, displayInfo } from './display.js';
import { createSpinner } from 'nanospinner';
import { colors, icons } from '../config/style.js';

const execAsync = promisify(exec);

let Agent = null;

export async function ensureSdkInstalled() {
  try {
    // Try to import the SDK first
    Agent = await importSdk();
    return Agent;
  } catch (error) {
    // If import fails, try to install and then import
    console.log(colors.warning(`\n${icons.warning} 0G Agent Kit not found. Installing...\n`));
    
    await installSdk();
    Agent = await importSdk();
    return Agent;
  }
}

async function importSdk() {
  try {
    // Try different import methods
    let AgentModule;
    
    try {
      // Method 1: Direct npm package import
      AgentModule = await import('0g-agent-kit');
    } catch (e1) {
      try {
        // Method 2: Local file import
        AgentModule = await import('../../node_modules/0g-agent-kit/src/0gAgentSdk.js');
      } catch (e2) {
        try {
          // Method 3: Relative path import
          AgentModule = await import('../../../0g-agent-kit/src/0gAgentSdk.js');
        } catch (e3) {
          throw new Error('Cannot find 0g-agent-kit. Please ensure it is installed.');
        }
      }
    }
    
    return AgentModule.default || AgentModule;
  } catch (error) {
    throw new Error(`Failed to import 0G Agent Kit: ${error.message}`);
  }
}

async function installSdk() {
  const spinner = createSpinner('📦 Installing 0G Agent Kit...').start();
  
  try {
    // Try to install from different sources
    let installCommand;
    
    // Check if local 0g-agent-kit exists
    try {
      await execAsync('dir ..\\0g-agent-kit', { cwd: process.cwd() });
      // Local directory exists, install from file
      installCommand = 'npm install file:../0g-agent-kit';
      spinner.update({ text: '📦 Installing from local directory...' });
    } catch (error) {
      // Try to install from npm (if published)
      installCommand = 'npm install 0g-agent-kit';
      spinner.update({ text: '📦 Installing from npm registry...' });
    }
    
    const { stdout, stderr } = await execAsync(installCommand, { 
      cwd: process.cwd(),
      timeout: 60000 // 60 second timeout
    });
    
    if (stderr && !stderr.includes('WARN')) {
      throw new Error(stderr);
    }
    
    spinner.success({ text: '✅ 0G Agent Kit installed successfully!' });
    displaySuccess('SDK installation completed');
    
  } catch (error) {
    spinner.error({ text: '❌ Installation failed!' });
    
    console.log(colors.error(`\n${icons.error} Installation failed. Please install manually:\n`));
    console.log(colors.info('Option 1 - Local install:'));
    console.log(colors.muted('  npm install file:../0g-agent-kit\n'));
    console.log(colors.info('Option 2 - Copy files:'));
    console.log(colors.muted('  Copy 0g-agent-kit folder to node_modules/\n'));
    
    throw error;
  }
}

export function getAgent() {
  if (!Agent) {
    throw new Error('0G Agent Kit not loaded. Call ensureSdkInstalled() first.');
  }
  return Agent;
}

export async function checkSdkStatus() {
  try {
    const agent = await importSdk();
    displaySuccess('✅ 0G Agent Kit is ready');
    return true;
  } catch (error) {
    displayError('❌ 0G Agent Kit not found');
    return false;
  }
}