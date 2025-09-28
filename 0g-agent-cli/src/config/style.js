// 0g-agent-cli/src/config/style.js - Color themes and styling

import chalk from 'chalk';
import gradient from 'gradient-string';

export const colors = {
  primary: chalk.cyan,
  secondary: chalk.magenta,
  success: chalk.green,
  warning: chalk.yellow,
  error: chalk.red,
  info: chalk.blue,
  muted: chalk.gray,
  highlight: chalk.bgCyan.black,
  accent: chalk.bold.white
};

export const gradients = {
  rainbow: gradient('red', 'orange', 'yellow', 'green', 'blue', 'purple'),
  ocean: gradient('cyan', 'blue'),
  fire: gradient('red', 'orange', 'yellow'),
  neon: gradient('magenta', 'cyan'),
  sunset: gradient('orange', 'red', 'purple')
};

export const icons = {
  // Identity
  agent: '🤖',
  register: '📝',
  update: '✏️',
  search: '🔍',
  info: 'ℹ️',
  
  // Reputation
  star: '⭐',
  feedback: '💬',
  authorize: '🔐',
  check: '✅',
  
  // Validation
  validate: '✅',
  pending: '⏳',
  respond: '💡',
  complete: '🎯',
  
  // Wallet
  wallet: '💰',
  balance: '💵',
  key: '🔑',
  
  // UI
  arrow: '→',
  bullet: '•',
  success: '✅',
  error: '❌',
  warning: '⚠️',
  loading: '⏳',
  back: '⬅️',
  exit: '🚪'
};

export const boxStyles = {
  main: {
    padding: 1,
    margin: 1,
    borderStyle: 'round',
    borderColor: 'cyan',
    backgroundColor: '#1a1a1a'
  },
  
  success: {
    padding: 1,
    margin: 0,
    borderStyle: 'round',
    borderColor: 'green'
  },
  
  error: {
    padding: 1,
    margin: 0,
    borderStyle: 'round',
    borderColor: 'red'
  },
  
  info: {
    padding: 1,
    margin: 0,
    borderStyle: 'round',
    borderColor: 'blue'
  }
};

export const menuChoices = {
  identity: {
    name: `${icons.agent} Identity Registry`,
    value: 'identity'
  },
  reputation: {
    name: `${icons.star} Reputation Registry`, 
    value: 'reputation'
  },
  validation: {
    name: `${icons.validate} Validation Registry`,
    value: 'validation'
  },
  wallet: {
    name: `${icons.wallet} Wallet Info`,
    value: 'wallet'
  },
  exit: {
    name: `${icons.exit} Exit`,
    value: 'exit'
  }
};