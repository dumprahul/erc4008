// 0g-agent-cli/src/menus/mainMenu.js - Main navigation menu

import { promptSelect } from '../utils/prompts.js';
import { displayHeader, displaySuccess } from '../utils/display.js';
import { displayCurrentWallet, changeWallet } from '../utils/wallet.js';
import { identityMenu } from './identityMenu.js';
import { reputationMenu } from './reputationMenu.js';

import { validationMenu } from './ValidationMenu.js';
import { colors, icons, menuChoices } from '../config/style.js';

export async function mainMenu() {
  while (true) {
    displayHeader('0G AGENT CLI', 'Main Menu');
    
    const choices = [
      menuChoices.identity,
      menuChoices.reputation,
      menuChoices.validation,
      { name: `${icons.wallet} Wallet Info`, value: 'wallet' },
      { name: `${icons.key} Change Wallet`, value: 'change-wallet' },
      menuChoices.exit
    ];
    
    const choice = await promptSelect(choices, 'What would you like to do?', false);
    
    switch (choice) {
      case 'identity':
        await identityMenu();
        break;
        
      case 'reputation':
        await reputationMenu();
        break;
        
      case 'validation':
        await validationMenu();
        break;
        
      case 'wallet':
        displayHeader('Wallet Information');
        await displayCurrentWallet();
        await promptSelect([{ name: 'Back', value: 'back' }], '', false);
        break;
        
      case 'change-wallet':
        displayHeader('Change Wallet');
        await changeWallet();
        await promptSelect([{ name: 'Continue', value: 'back' }], '', false);
        break;
        
      case 'exit':
        console.log(colors.success(`\n${icons.success} Thanks for using 0G Agent CLI!`));
        console.log(colors.muted('Have a great day! 🚀\n'));
        process.exit(0);
        
      default:
        break;
    }
  }
}