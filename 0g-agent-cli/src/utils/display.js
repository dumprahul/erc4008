// 0g-agent-cli/src/utils/display.js - Colorful output formatting

import chalk from 'chalk';
import figlet from 'figlet';
import boxen from 'boxen';

import { colors, gradients, icons, boxStyles } from '../config/style.js';

export function displayWelcome() {
  const title = figlet.textSync('0G CLI', {
    font: 'ANSI Shadow',
    horizontalLayout: 'fitted'
  });
  
  console.log('\n');
  console.log(gradients.neon(title));
  console.log(colors.muted('                    Interactive CLI for Trustless Agents\n'));
}

export function displayHeader(title, subtitle = '') {
  console.clear();
  console.log('\n');
  console.log(gradients.ocean(`╭${'─'.repeat(50)}╮`));
  
  // Fix the padding calculation to prevent negative values
  const titlePadding = Math.max(0, 18 - Math.floor(title.length / 2));
  console.log(gradients.ocean(`│${' '.repeat(titlePadding)}${title}${' '.repeat(titlePadding)}│`));
  
  if (subtitle) {
    const subtitlePadding = Math.max(0, Math.floor((48 - subtitle.length) / 2));
    console.log(gradients.ocean(`│${' '.repeat(subtitlePadding)}${subtitle}${' '.repeat(subtitlePadding)}│`));
  }
  
  console.log(gradients.ocean(`╰${'─'.repeat(50)}╯`));
  console.log('');
}

export function displaySuccess(message) {
  console.log(boxen(
    `${icons.success} ${colors.success(message)}`,
    boxStyles.success
  ));
}

export function displayError(message) {
  console.log(boxen(
    `${icons.error} ${colors.error(message)}`,
    boxStyles.error
  ));
}

export function displayInfo(message) {
  console.log(boxen(
    `${icons.info} ${colors.info(message)}`,
    boxStyles.info
  ));
}

export function displayWarning(message) {
  console.log(colors.warning(`${icons.warning} ${message}`));
}

export function displayWalletInfo(address, balance) {
  const walletBox = [
    colors.primary(`${icons.wallet} Wallet Information`),
    '',
    `${colors.muted('Address:')} ${colors.accent(address)}`,
    `${colors.muted('Balance:')} ${colors.success(balance)} ETH`,
    `${colors.muted('Network:')} ${colors.info('0G Testnet')}`
  ].join('\n');
  
  console.log(boxen(walletBox, {
    ...boxStyles.main,
    title: '💰 Wallet',
    titleAlignment: 'center'
  }));
}

export function displayAgentInfo(agent) {
  const agentBox = [
    colors.primary(`${icons.agent} Agent Details`),
    '',
    `${colors.muted('ID:')} ${colors.accent(agent.agentId)}`,
    `${colors.muted('Domain:')} ${colors.info(agent.domain)}`,
    `${colors.muted('Address:')} ${colors.secondary(agent.address)}`
  ].join('\n');
  
  console.log(boxen(agentBox, {
    ...boxStyles.info,
    title: '🤖 Agent Info',
    titleAlignment: 'center'
  }));
}

export function displayTransactionResult(result, type = 'Transaction') {
  const resultBox = [
    colors.success(`${icons.success} ${type} Successful!`),
    '',
    ...(result.agentId ? [`${colors.muted('Agent ID:')} ${colors.accent(result.agentId)}`] : []),
    ...(result.feedbackAuthId ? [`${colors.muted('Auth ID:')} ${colors.accent(result.feedbackAuthId)}`] : []),
    ...(result.requestId ? [`${colors.muted('Request ID:')} ${colors.accent(result.requestId)}`] : []),
    `${colors.muted('Tx Hash:')} ${colors.secondary(result.txHash)}`,
    `${colors.muted('Block:')} ${colors.info(result.blockNumber)}`
  ].join('\n');
  
  console.log(boxen(resultBox, boxStyles.success));
}

export function displayList(items, title, emptyMessage = 'No items found') {
  if (!items || items.length === 0) {
    displayInfo(emptyMessage);
    return;
  }
  
  console.log(colors.primary(`\n${title}:`));
  items.forEach((item, index) => {
    console.log(`  ${colors.muted(index + 1 + '.')} ${colors.accent(item)}`);
  });
  console.log('');
}
export function displayTable(data, headers) {
  if (!data || data.length === 0) {
    displayInfo('No data to display');
    return;
  }
  
  console.log('\n');
  console.log(headers.join(' | '));
  console.log('-'.repeat(40));
  data.forEach(row => console.log(row.join(' | ')));
  console.log('');
}

export function displayMenu(title, choices) {
  displayHeader(title);
  
  choices.forEach((choice, index) => {
    const number = colors.primary(`[${index + 1}]`);
    const name = choice.name || choice;
    console.log(`  ${number} ${name}`);
  });
  
  console.log('');
}