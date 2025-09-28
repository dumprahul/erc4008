// 0g-agent-cli/src/menus/identityMenu.js - Simplified identity operations (NO SDK)

import { createSpinner } from 'nanospinner';
import { 
  registerAgent,
  getAgent,
  resolveByDomain,
  resolveByAddress,
  getTotalAgents,
  agentExists
} from '../utils/wallet.js';
import { 
  promptSelect, 
  promptDomain, 
  promptAddress, 
  promptAgentId,
  pressAnyKey
} from '../utils/prompts.js';
import { 
  displayHeader, 
  displaySuccess, 
  displayError, 
  displayAgentInfo,
  displayTransactionResult,
  displayInfo
} from '../utils/display.js';
import { colors, icons } from '../config/style.js';

export async function identityMenu() {
  while (true) {
    displayHeader('Identity Registry', 'Agent Management');
    
    const choices = [
      { name: `${icons.register} Register New Agent`, value: 'register' },
      { name: `${icons.search} View Agent Info`, value: 'view' },
      { name: `${icons.search} Resolve by Domain`, value: 'resolve-domain' },
      { name: `${icons.search} Resolve by Address`, value: 'resolve-address' },
      { name: `${icons.info} Registry Stats`, value: 'stats' }
    ];
    
    const choice = await promptSelect(choices, 'Select identity operation:');
    
    if (choice === 'back') return;
    
    try {
      switch (choice) {
        case 'register':
          await handleRegisterAgent();
          break;
          
        case 'view':
          await handleViewAgent();
          break;
          
        case 'resolve-domain':
          await handleResolveByDomain();
          break;
          
        case 'resolve-address':
          await handleResolveByAddress();
          break;
          
        case 'stats':
          await handleShowStats();
          break;
      }
    } catch (error) {
      displayError(`Operation failed: ${error.message}`);
      await pressAnyKey();
    }
  }
}

async function handleRegisterAgent() {
  displayHeader('Register Agent', 'Create new agent identity');
  
  console.log(colors.info(`${icons.info} Register a new agent on the 0G network\n`));
  
  const domain = await promptDomain();
  const address = await promptAddress();
  
  const spinner = createSpinner('🚀 Registering agent...').start();
  
  try {
    const result = await registerAgent(domain, address);
    spinner.success({ text: '✅ Agent registered successfully!' });
    
    displayTransactionResult(result, 'Agent Registration');
    displayAgentInfo({
      agentId: result.agentId,
      domain: result.domain,
      address: result.address
    });
    
  } catch (error) {
    spinner.error({ text: '❌ Registration failed!' });
    throw error;
  }
  
  await pressAnyKey();
}

async function handleViewAgent() {
  displayHeader('View Agent', 'Get agent information');
  
  const agentId = await promptAgentId();
  
  const spinner = createSpinner('🔍 Fetching agent info...').start();
  
  try {
    const agent = await getAgent(agentId);
    spinner.success({ text: '✅ Agent found!' });
    
    displayAgentInfo(agent);
    
  } catch (error) {
    spinner.error({ text: '❌ Agent not found!' });
    throw error;
  }
  
  await pressAnyKey();
}

async function handleResolveByDomain() {
  displayHeader('Resolve by Domain', 'Find agent by domain name');
  
  const domain = await promptDomain();
  
  const spinner = createSpinner('🔍 Resolving domain...').start();
  
  try {
    const agent = await resolveByDomain(domain);
    spinner.success({ text: '✅ Domain resolved!' });
    
    displayAgentInfo(agent);
    
  } catch (error) {
    spinner.error({ text: '❌ Domain not found!' });
    throw error;
  }
  
  await pressAnyKey();
}

async function handleResolveByAddress() {
  displayHeader('Resolve by Address', 'Find agent by wallet address');
  
  const address = await promptAddress();
  
  const spinner = createSpinner('🔍 Resolving address...').start();
  
  try {
    const agent = await resolveByAddress(address);
    spinner.success({ text: '✅ Address resolved!' });
    
    displayAgentInfo(agent);
    
  } catch (error) {
    spinner.error({ text: '❌ Address not found!' });
    throw error;
  }
  
  await pressAnyKey();
}

async function handleShowStats() {
  displayHeader('Registry Statistics', 'Network overview');
  
  const spinner = createSpinner('📊 Fetching stats...').start();
  
  try {
    const totalAgents = await getTotalAgents();
    const nextId = parseInt(totalAgents) + 1;
    
    spinner.success({ text: '✅ Stats loaded!' });
    
    console.log(colors.primary(`\n${icons.info} Identity Registry Statistics:\n`));
    console.log(`  ${colors.muted('Total Agents:')} ${colors.accent(totalAgents)}`);
    console.log(`  ${colors.muted('Next Agent ID:')} ${colors.accent(nextId)}`);
    console.log(`  ${colors.muted('Network:')} ${colors.info('0G Testnet')}`);
    console.log('');
    
  } catch (error) {
    spinner.error({ text: '❌ Failed to load stats!' });
    throw error;
  }
  
  await pressAnyKey();
}