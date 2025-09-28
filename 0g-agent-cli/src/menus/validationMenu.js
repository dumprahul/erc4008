// 0g-agent-cli/src/menus/validationMenu.js - Validation Registry operations

import { getAgentSDK } from '../utils/wallet.js';
import { createSpinner } from 'nanospinner';
import { 
  promptSelect, 
  promptAgentId,
  promptDataHash,
  promptValidationScore,
  pressAnyKey
} from '../utils/prompts.js';
import { 
  displayHeader, 
  displaySuccess, 
  displayError, 
  displayTransactionResult,
  displayList,
  displayInfo
} from '../utils/display.js';
import { colors, icons } from '../config/style.js';
import inquirer from 'inquirer';

export async function validationMenu() {
  while (true) {
    displayHeader('Validation Registry', 'Data Validation & Verification');
    
    const choices = [
      { name: `${icons.validate} Request Validation`, value: 'request' },
      { name: `${icons.respond} Respond to Validation`, value: 'respond' },
      { name: `${icons.search} View Request Details`, value: 'view-request' },
      { name: `${icons.pending} Pending Validations`, value: 'pending' },
      { name: `${icons.complete} Server Validations`, value: 'server-validations' },
      { name: `${icons.check} Check Completion Status`, value: 'check-completion' }
    ];
    
    const choice = await promptSelect(choices, 'Select validation operation:');
    
    if (choice === 'back') return;
    
    try {
      switch (choice) {
        case 'request':
          await requestValidation();
          break;
          
        case 'respond':
          await respondToValidation();
          break;
          
        case 'view-request':
          await viewRequestDetails();
          break;
          
        case 'pending':
          await viewPendingValidations();
          break;
          
        case 'server-validations':
          await viewServerValidations();
          break;
          
        case 'check-completion':
          await checkCompletionStatus();
          break;
      }
    } catch (error) {
      displayError(`Operation failed: ${error.message}`);
      await pressAnyKey();
    }
  }
}

async function requestValidation() {
  displayHeader('Request Validation', 'Submit data for validation');
  
  console.log(colors.info(`${icons.info} Request a validator to verify your data\n`));
  
  const validatorId = await promptAgentId('Validator Agent ID');
  const serverId = await promptAgentId('Server Agent ID');
  const dataHash = await promptDataHash();
  
  if (validatorId === serverId) {
    displayError('Validator and server agents cannot be the same!');
    await pressAnyKey();
    return;
  }
  
  const spinner = createSpinner('📋 Requesting validation...').start();
  
  try {
     const Agent = await getAgentSDK(); 
    const result = await Agent.requestValidation(validatorId, serverId, dataHash);
    spinner.success({ text: '✅ Validation requested successfully!' });
    
    displayTransactionResult(result, 'Validation Request');
    
    console.log(colors.success(`\n${icons.validate} Request Details:`));
    console.log(`  ${colors.muted('Request ID:')} ${colors.accent(result.requestId)}`);
    console.log(`  ${colors.muted('Validator:')} ${colors.info(result.agentValidatorId)}`);
    console.log(`  ${colors.muted('Server:')} ${colors.secondary(result.agentServerId)}`);
    console.log(`  ${colors.muted('Data Hash:')} ${colors.muted(result.dataHash)}`);
    
  } catch (error) {
    spinner.error({ text: '❌ Request failed!' });
    throw error;
  }
  
  await pressAnyKey();
}

async function respondToValidation() {
  displayHeader('Respond to Validation', 'Provide validation score');
  
  console.log(colors.info(`${icons.info} Respond to a validation request with a score (0-100)\n`));
  
  const dataHash = await promptDataHash();
  const score = await promptValidationScore();
  
  const spinner = createSpinner('💡 Submitting response...').start();
  
  try {
     const Agent = await getAgentSDK(); 
    const result = await Agent.respondToValidation(dataHash, score);
    spinner.success({ text: '✅ Response submitted successfully!' });
    
    displayTransactionResult(result, 'Validation Response');
    
    console.log(colors.success(`\n${icons.star} Response Details:`));
    console.log(`  ${colors.muted('Data Hash:')} ${colors.muted(result.dataHash)}`);
    console.log(`  ${colors.muted('Score:')} ${colors.accent(result.response + '/100')}`);
    console.log(`  ${colors.muted('Status:')} ${colors.success('Completed')}`);
    
  } catch (error) {
    spinner.error({ text: '❌ Response failed!' });
    throw error;
  }
  
  await pressAnyKey();
}

async function viewRequestDetails() {
  displayHeader('Request Details', 'View validation request information');
  
  const requestId = await promptRequestId();
  
  const spinner = createSpinner('🔍 Fetching request details...').start();
  
  try {
     const Agent = await getAgentSDK(); 
    const request = await Agent.getValidationRequestDetails(requestId);
    spinner.success({ text: '✅ Details loaded!' });
    
    console.log(colors.primary(`\n${icons.validate} Validation Request Information:\n`));
    console.log(`  ${colors.muted('Request ID:')} ${colors.accent(request.requestId)}`);
    console.log(`  ${colors.muted('Validator:')} ${colors.info(request.agentValidatorId)}`);
    console.log(`  ${colors.muted('Server:')} ${colors.secondary(request.agentServerId)}`);
    console.log(`  ${colors.muted('Data Hash:')} ${colors.muted(request.dataHash)}`);
    console.log(`  ${colors.muted('Status:')} ${request.isPending ? colors.warning('⏳ Pending') : colors.success('✅ Completed')}`);
    console.log(`  ${colors.muted('Response:')} ${colors.accent(request.response + '/100')}`);
    console.log(`  ${colors.muted('Created:')} ${colors.info(new Date(request.timestamp * 1000).toLocaleString())}`);
    console.log(`  ${colors.muted('Timeout:')} ${colors.info(request.timeoutDate)}`);
    console.log('');
    
  } catch (error) {
    spinner.error({ text: '❌ Failed to load details!' });
    throw error;
  }
  
  await pressAnyKey();
}

async function viewPendingValidations() {
  displayHeader('Pending Validations', 'View pending requests for validator');
  
  const validatorId = await promptAgentId('Validator Agent ID');
  
  const spinner = createSpinner('📋 Loading pending validations...').start();
  
  try {
    const Agent = await getAgentSDK(); 
    const pending = await Agent.getPendingValidations(validatorId);
    spinner.success({ text: '✅ Pending validations loaded!' });
    
    // Handle the case where pending might be null or undefined
    const pendingArray = Array.isArray(pending) ? pending : [];
    
    displayList(
      pendingArray, 
      `Validator Agent ${validatorId} - Pending Validations`, 
      'No pending validations found'
    );
    
  } catch (error) {
    spinner.error({ text: '❌ Failed to load pending validations!' });
    console.log('Debug error:', error.message);
    throw error;
  }
  
  await pressAnyKey();
}

async function viewServerValidations() {
  displayHeader('Server Validations', 'View all validations for server');
  
  const serverId = await promptAgentId('Server Agent ID');
  
  const spinner = createSpinner('📋 Loading server validations...').start();
  
  try {
     const Agent = await getAgentSDK(); 
    const validations = await Agent.getServerValidations(serverId);
    spinner.success({ text: '✅ Server validations loaded!' });
    
    displayList(
      validations, 
      `Server Agent ${serverId} - All Validations`, 
      'No validations found for this server'
    );
    
  } catch (error) {
    spinner.error({ text: '❌ Failed to load server validations!' });
    throw error;
  }
  
  await pressAnyKey();
}

async function checkCompletionStatus() {
  displayHeader('Completion Status', 'Check if validation is completed');
  
  const dataHash = await promptDataHash();
  
  const spinner = createSpinner('🔍 Checking completion status...').start();
  
  try {
     const Agent = await getAgentSDK(); 
    const isCompleted = await Agent.isValidationCompleted(dataHash);
    spinner.success({ text: '✅ Status checked!' });
    
    console.log(colors.primary(`\n${icons.check} Validation Status:\n`));
    console.log(`  ${colors.muted('Data Hash:')} ${colors.muted(dataHash)}`);
    console.log(`  ${colors.muted('Status:')} ${isCompleted ? colors.success('✅ Completed') : colors.warning('⏳ Pending')}`);
    console.log('');
    
  } catch (error) {
    spinner.error({ text: '❌ Status check failed!' });
    throw error;
  }
  
  await pressAnyKey();
}

async function promptRequestId() {
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'requestId',
      message: `${icons.validate} Enter validation request ID:`,
      validate: (input) => {
        if (!input) return 'Request ID is required';
        if (!/^0x[a-fA-F0-9]{64}$/.test(input)) {
          return 'Invalid request ID format (0x... 64 chars)';
        }
        return true;
      }
    }
  ]);
  
  return answers.requestId;
}