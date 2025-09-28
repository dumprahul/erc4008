// 0g-agent-cli/src/menus/reputationMenu.js - Reputation Registry operations
// 0g-agent-cli/src/menus/reputationMenu.js - Reputation Registry operations

import { getAgentSDK } from '../utils/wallet.js';
import { createSpinner } from 'nanospinner';
import { 
  promptSelect, 
  promptAgentId,
  pressAnyKey,
  promptMenu
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
export async function reputationMenu() {
  while (true) {
    displayHeader('Reputation Registry', 'Feedback & Trust Management');
    
    const choices = [
      { name: `${icons.authorize} Authorize Feedback`, value: 'authorize' },
      { name: `${icons.check} Check Authorization`, value: 'check-auth' },
      { name: `${icons.search} View Authorization Details`, value: 'view-auth' },
      { name: `${icons.star} Client Authorizations`, value: 'client-auths' },
      { name: `${icons.feedback} Server Authorizations`, value: 'server-auths' }
    ];
    
    const choice = await promptSelect(choices, 'Select reputation operation:');
    
    if (choice === 'back') return;
    
    try {
      switch (choice) {
        case 'authorize':
          await authorizeFeedback();
          break;
          
        case 'check-auth':
          await checkAuthorization();
          break;
          
        case 'view-auth':
          await viewAuthorizationDetails();
          break;
          
        case 'client-auths':
          await viewClientAuthorizations();
          break;
          
        case 'server-auths':
          await viewServerAuthorizations();
          break;
      }
    } catch (error) {
      displayError(`Operation failed: ${error.message}`);
      await pressAnyKey();
    }
  }
}

async function authorizeFeedback() {
  displayHeader('Authorize Feedback', 'Enable client to rate server');
  
  console.log(colors.info(`${icons.info} Authorize a client agent to provide feedback for a server agent\n`));
  
  const clientId = await promptAgentId('Client Agent ID');
  const serverId = await promptAgentId('Server Agent ID');
  
  if (clientId === serverId) {
    displayError('Client and server agents cannot be the same!');
    await pressAnyKey();
    return;
  }
  
  const spinner = createSpinner('🔐 Authorizing feedback...').start();
  
  try {
    const result = await Agent.authorizeFeedback(clientId, serverId);
    spinner.success({ text: '✅ Feedback authorized successfully!' });
    
    displayTransactionResult(result, 'Feedback Authorization');
    
    console.log(colors.success(`\n${icons.star} Authorization Details:`));
    console.log(`  ${colors.muted('Auth ID:')} ${colors.accent(result.feedbackAuthId)}`);
    console.log(`  ${colors.muted('Client:')} ${colors.info(result.agentClientId)}`);
    console.log(`  ${colors.muted('Server:')} ${colors.secondary(result.agentServerId)}`);
    
  } catch (error) {
    spinner.error({ text: '❌ Authorization failed!' });
    throw error;
  }
  
  await pressAnyKey();
}

async function checkAuthorization() {
  displayHeader('Check Authorization', 'Verify feedback authorization');
  
  const authId = await promptFeedbackAuthId();
  
  const spinner = createSpinner('🔍 Checking authorization...').start();
  
  try {
      const Agent = await getAgentSDK(); 
    const isAuthorized = await Agent.isFeedbackAuthorized(authId);
    spinner.success({ text: '✅ Check completed!' });
    
    if (isAuthorized) {
      displaySuccess(`Authorization ${authId} is ACTIVE`);
    } else {
      displayError(`Authorization ${authId} is INACTIVE or doesn't exist`);
    }
    
  } catch (error) {
    spinner.error({ text: '❌ Check failed!' });
    throw error;
  }
  
  await pressAnyKey();
}

async function viewAuthorizationDetails() {
  displayHeader('Authorization Details', 'View complete authorization info');
  
  const authId = await promptFeedbackAuthId();
  
  const spinner = createSpinner('🔍 Fetching details...').start();
  
  try {
     const Agent = await getAgentSDK(); 
    const auth = await Agent.getFeedbackAuthorization(authId);
    spinner.success({ text: '✅ Details loaded!' });
    
    console.log(colors.primary(`\n${icons.star} Authorization Information:\n`));
    console.log(`  ${colors.muted('Auth ID:')} ${colors.accent(auth.feedbackAuthId)}`);
    console.log(`  ${colors.muted('Client Agent:')} ${colors.info(auth.agentClientId)}`);
    console.log(`  ${colors.muted('Server Agent:')} ${colors.secondary(auth.agentServerId)}`);
    console.log(`  ${colors.muted('Status:')} ${auth.isAuthorized ? colors.success('✅ Active') : colors.error('❌ Inactive')}`);
    console.log('');
    
  } catch (error) {
    spinner.error({ text: '❌ Failed to load details!' });
    throw error;
  }
  
  await pressAnyKey();
}

async function viewClientAuthorizations() {
  displayHeader('Client Authorizations', 'View authorizations as client');
  
  const clientId = await promptAgentId('Client Agent ID');
  
  const spinner = createSpinner('📋 Loading authorizations...').start();
  
  try {
     const Agent = await getAgentSDK(); 
    const auths = await Agent.getClientFeedbackAuthorizations(clientId);
    spinner.success({ text: '✅ Authorizations loaded!' });
    
    displayList(
      auths, 
      `Client Agent ${clientId} - Feedback Authorizations`, 
      'No authorizations found for this client'
    );
    
  } catch (error) {
    spinner.error({ text: '❌ Failed to load authorizations!' });
    throw error;
  }
  
  await pressAnyKey();
}

async function viewServerAuthorizations() {
  displayHeader('Server Authorizations', 'View authorizations as server');
  
  const serverId = await promptAgentId('Server Agent ID');
  
  const spinner = createSpinner('📋 Loading authorizations...').start();
  
  try {
     const Agent = await getAgentSDK(); 
    const auths = await Agent.getServerFeedbackAuthorizations(serverId);
    spinner.success({ text: '✅ Authorizations loaded!' });
    
    displayList(
      auths, 
      `Server Agent ${serverId} - Feedback Authorizations`, 
      'No authorizations found for this server'
    );
    
  } catch (error) {
    spinner.error({ text: '❌ Failed to load authorizations!' });
    throw error;
  }
  
  await pressAnyKey();
}

async function promptFeedbackAuthId() {
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'authId',
      message: `${icons.authorize} Enter feedback authorization ID:`,
      validate: (input) => {
        if (!input) return 'Authorization ID is required';
        if (!/^0x[a-fA-F0-9]{64}$/.test(input)) {
          return 'Invalid authorization ID format (0x... 64 chars)';
        }
        return true;
      }
    }
  ]);
  
  return answers.authId;
}