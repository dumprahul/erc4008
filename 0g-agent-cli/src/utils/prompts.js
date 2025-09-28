// 0g-agent-cli/src/utils/prompts.js - Input collection utilities (FIXED)

import inquirer from 'inquirer';
import { colors, icons } from '../config/style.js';

export async function promptPrivateKey() {
  const answers = await inquirer.prompt([
    {
      type: 'password',
      name: 'privateKey',
      message: `${icons.key} Enter your private key:`,
      mask: '*',
      validate: (input) => {
        if (!input) return 'Private key is required';
        if (!input.startsWith('0x') && input.length !== 64) {
          return 'Invalid private key format';
        }
        return true;
      }
    }
  ]);
  
  return answers.privateKey;
}

export async function promptDomain() {
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'domain',
      message: `${icons.agent} Enter domain name:`,
      validate: (input) => {
        if (!input) return 'Domain is required';
        if (!/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(input)) {
          return 'Invalid domain format (e.g., example.com)';
        }
        return true;
      }
    }
  ]);
  
  return answers.domain;
}

export async function promptAddress() {
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'address',
      message: `${icons.wallet} Enter wallet address:`,
      validate: (input) => {
        if (!input) return 'Address is required';
        if (!/^0x[a-fA-F0-9]{40}$/.test(input)) {
          return 'Invalid address format (0x...)';
        }
        return true;
      },
      filter: (input) => {
        // Convert to lowercase to avoid checksum issues
        if (input.startsWith('0x')) {
          return '0x' + input.slice(2).toLowerCase();
        }
        return input.toLowerCase();
      }
    }
  ]);
  
  return answers.address;
}

export async function promptAgentId() {
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'agentId',
      message: `${icons.agent} Enter agent ID:`,
      validate: (input) => {
        if (!input) return 'Agent ID is required';
        if (!/^\d+$/.test(input)) {
          return 'Agent ID must be a number';
        }
        return true;
      }
    }
  ]);
  
  return answers.agentId;
}

export async function promptDataHash() {
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'dataHash',
      message: `${icons.validate} Enter data hash (bytes32):`,
      validate: (input) => {
        if (!input) return 'Data hash is required';
        if (!/^0x[a-fA-F0-9]{64}$/.test(input)) {
          return 'Invalid hash format (0x... 64 chars)';
        }
        return true;
      }
    }
  ]);
  
  return answers.dataHash;
}

export async function promptValidationScore() {
  const answers = await inquirer.prompt([
    {
      type: 'number',
      name: 'score',
      message: `${icons.star} Enter validation score (0-100):`,
      validate: (input) => {
        if (input === null || input === undefined) return 'Score is required';
        if (input < 0 || input > 100) return 'Score must be between 0 and 100';
        return true;
      }
    }
  ]);
  
  return answers.score;
}

export async function promptMenu(choices, message = 'Select an option:') {
  // Ensure choices is valid array and has valid length
  const validChoices = Array.isArray(choices) ? choices : [];
  if (validChoices.length === 0) {
    validChoices.push({ name: 'No options available', value: 'back' });
  }
  
  const answers = await inquirer.prompt([
    {
      type: 'list',
      name: 'choice',
      message: `${icons.arrow} ${message}`,
      choices: validChoices,
      pageSize: Math.min(validChoices.length, 8)
    }
  ]);
  
  return answers.choice;
}

export async function promptConfirm(message) {
  const answers = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirmed',
      message: `${icons.check} ${message}`,
      default: false
    }
  ]);
  
  return answers.confirmed;
}

export async function promptMultipleInputs(inputs) {
  return await inquirer.prompt(inputs.map(input => ({
    type: input.type || 'input',
    name: input.name,
    message: `${input.icon || icons.info} ${input.message}:`,
    validate: input.validate,
    default: input.default
  })));
}

export async function promptSelect(choices, message, allowBack = true) {
  // Ensure choices is a valid array
  const validChoices = Array.isArray(choices) ? [...choices] : [];
  
  if (allowBack) {
    validChoices.push({
      name: `${icons.back} Back to Main Menu`,
      value: 'back'
    });
  }
  
  // Ensure we have at least one choice
  if (validChoices.length === 0) {
    validChoices.push({
      name: 'No options available',
      value: 'back'
    });
  }
  
  return await promptMenu(validChoices, message);
}

export async function pressAnyKey(message = 'Press any key to continue...') {
  try {
    await inquirer.prompt([
      {
        type: 'input',
        name: 'continue',
        message: message,
        prefix: ''
      }
    ]);
  } catch (error) {
    // Just continue if there's an error with the prompt
    console.log('');
  }
}