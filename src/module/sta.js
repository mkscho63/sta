// Import Modules
import {
  STAActor
} from './actors/actor.js';
import {
  STACharacterSheet
} from './actors/sheets/character-sheet.js';
import {
  STAStarshipSheet
} from './actors/sheets/starship-sheet.js';
import {
  STASmallCraftSheet
} from './actors/sheets/smallcraft-sheet.js';
import {
  STAExtendedTaskSheet
} from './actors/sheets/extended-task-sheet.js';
import {
  STAItemSheet
} from './items/item-sheet.js';
import {
  STACharacterWeaponSheet
} from './items/character-weapon-sheet.js';
import {
  STAStarshipWeaponSheet
} from './items/starship-weapon-sheet.js';
import {
  STAArmorSheet
} from './items/armor-sheet.js';
import {
  STATalentSheet
} from './items/talent-sheet.js';
import {
  STAGenericSheet
} from './items/generic-sheet.js';
import {
  STASmallcraftContainerSheet
} from './items/smallcraftcontainer-sheet.js';
import { 
  STATracker 
} from './apps/tracker.js';
import { 
  STALogo
} from './apps/logo.js';
import * as macros from './macro.js';
import { 
  STAItem
} from './items/item.js';

/* -------------------------------------------- */
/*  Foundry VTT Initialization                  */
/* -------------------------------------------- */

Hooks.once('init', function() {
  // Splash Screen
  console.log(`Initializing Star Trek Adventures Tabletop Roleplaying Game System
                 .
                .:.
               .:::.
              .:::::.
          ***.:::::::.***
     *******.:::::::::.*******       
   ********.:::::::::::.********     
  ********.:::::::::::::.********    
  *******.::::::'***\::::.*******    
  ******.::::'*********\`::.******    
   ****.:::'*************\`:.****
     *.::'*****************\`.*
     .:'  ***************    .
    .`);


  // Create a namespace within the game global
  game.sta = {
    applications: {
      STACharacterSheet,
      STAStarshipSheet,
      STASmallCraftSheet,
      STAExtendedTaskSheet,
      STAItemSheet,
      STACharacterWeaponSheet,
      STAStarshipWeaponSheet,
      STAArmorSheet,
      STATalentSheet,
      STAGenericSheet,
      STASmallcraftContainerSheet,
      STAItem,
    },
    entities: {
      STAActor,
    },
    macros: macros,
    attributeTest: macros.attributeTest
  };

  // Define initiative for the system.
  CONFIG.Combat.initiative = {
    formula: '@disciplines.security.value',
    decimals: 0
  };

  // Set up custom challenge dice
  // CONFIG.sta.CHALLENGE_RESULTS = {
  //     1: { label: `<img src='systems/sta/assets/icons/ChallengeDie_Success1.svg'/>`, success: 1, effect: 0 },
  //     2: { label: `<img src='systems/sta/assets/icons/ChallengeDie_Success2.svg'/>`, success: 2, effect: 0 },
  //     3: { label: `<img src='systems/sta/assets/icons/ChallengeDie_Success0.svg'/>`, success: 0, effect: 0 },
  //     4: { label: `<img src='systems/sta/assets/icons/ChallengeDie_Success0.svg'/>`, success: 0, effect: 0 },
  //     5: { label: `<img src='systems/sta/assets/icons/ChallengeDie_Effect.svg'/>`, success: 1, effect: 1 },
  //     6: { label: `<img src='systems/sta/assets/icons/ChallengeDie_Effect.svg'/>`, success: 1, effect: 1 },
  //   };

  // Define custom Entity classes
  CONFIG.Actor.entityClass = STAActor;
  CONFIG.Item.entityClass = STAItem;

  // Register sheet application classes
  Actors.unregisterSheet('core', ActorSheet);
  Actors.registerSheet('sta', STACharacterSheet, {
    types: ['character'],
    makeDefault: true
  });
  Actors.registerSheet('sta', STAStarshipSheet, {
    types: ['starship']
  });
  Actors.registerSheet('sta', STASmallCraftSheet, {
    types: ['smallcraft'],
  });
  Actors.registerSheet('sta', STAExtendedTaskSheet, {
    types: ['extendedtask']
  });
  Items.unregisterSheet('core', ItemSheet);
  Items.registerSheet('sta', STAItemSheet, {
    types: ['item'],
    makeDefault: true
  });
  Items.registerSheet('sta', STACharacterWeaponSheet, {
    types: ['characterweapon'],
  });
  Items.registerSheet('sta', STAStarshipWeaponSheet, {
    types: ['starshipweapon'],
  });
  Items.registerSheet('sta', STAArmorSheet, {
    types: ['armor'],
  });
  Items.registerSheet('sta', STATalentSheet, {
    types: ['talent'],
  });
  Items.registerSheet('sta', STAGenericSheet, {
    types: ['value'],
  });
  Items.registerSheet('sta', STAGenericSheet, {
    types: ['focus'],
  });
  Items.registerSheet('sta', STAGenericSheet, {
    types: ['injury'],
  });
  Items.registerSheet('sta', STASmallcraftContainerSheet, {
    types: ['smallcraftcontainer'],
  });


  // Register system settings
  game.settings.register('sta', 'multipleComplications', {
    name: 'Multiple Complications:',
    hint: 'The rulebook states "Any die which rolled 20 causes a complication". This is slightly unclear and as of Version 8 of the PDF, this is still not clear - likely due to the incredible rarity. Enabling this will allow roles to display "There were x Complications" if multiple 20s are rolled. Disabling will just state a single complication.',
    scope: 'world',
    type: Boolean,
    default: true,
    config: true
  });

  game.settings.register('sta', 'threatPermissionLevel', {
    name: 'Threat Tracker User Role:',
    hint: 'Who should be allowed to amend the threat tracker? Please note, the permission level MUST have the Modify Configuration Settings permission.',
    scope: 'world',
    type: String,
    default: 'ASSISTANT',
    config: true,
    choices: {
      'PLAYER': 'Players',
      'TRUSTED': 'Trusted Players',
      'ASSISTANT': 'Assistant Gamemaster',
      'GAMEMASTER': 'Gamemasters',
    }
  });

  game.settings.register('sta', 'momentumPermissionLevel', {
    name: 'Momentum Tracker User Role:',
    hint: 'Who should be allowed to amend the momentum tracker? Please note, the permission level MUST have the Modify Configuration Settings permission.',
    scope: 'world',
    type: String,
    default: 'PLAYER',
    config: true,
    choices: {
      'PLAYER': 'Players',
      'TRUSTED': 'Trusted Players',
      'ASSISTANT': 'Assistant Gamemaster',
      'GAMEMASTER': 'Gamemasters',
    }
  });

  game.settings.register('sta', 'maxNumberOfReputation', {
    name: 'Maximum amount of Reputation:',
    hint: 'Max number of reputation that can be given to a character. 10 is default.',
    scope: 'world',
    type: Number,
    default: 20,
    config: true
  });

  game.settings.register('sta', 'trackerRefreshRate', {
    name: 'Refresh Rate of Threat & Momentum:',
    hint: 'In seconds, how often should the tracker refresh. It is inadvisable to set this too low. Up this if it appears to be causing optimisation issues.',
    scope: 'world',
    type: Number,
    default: 5,
    config: true
  });
    
  game.settings.register('sta', 'threat', {
    scope: 'world',
    type: Number,
    default: 0,
    config: false
  });

  game.settings.register('sta', 'momentum', {
    scope: 'world',
    type: Number,
    default: 0,
    config: false
  });

  Hooks.on('renderChatLog', (app, html, data) =>
    STAItem.chatListeners(html)
  );

  Hooks.on('ready', function() {
    let error = false;
    let i = USER_ROLES[game.settings.get('sta', 'momentumPermissionLevel')];
    for (i; i <= 4; i++) {
      if (!game.permissions.SETTINGS_MODIFY.includes(i)) error = true;
    }
    if (error) {
      console.error('The Momentum Tracker User Role does not have permissions to Modify Configuration Settings. Please change one of these in Permission Configuration or System Settings.');
      ui.notifications.error('The Momentum Tracker User Role does not have permissions to Modify Configuration Settings. Please change one of these in Permission Configuration or System Settings.');
    }
    const t = new STATracker();
    renderTemplate('systems/sta/templates/apps/tracker.html').then((html) => {
      t.render(true);
    });
    const l = new STALogo();
    renderTemplate('systems/sta/templates/apps/logo.html').then((html) => {
      l.render(true);
    });
  });

  // Hooks.once("diceSoNiceReady", (dice3d) => {
  //     dice3d.addSystem({ id: "sta", name: "Star Trek Adventures" }, true);

  //     dice3d.addDicePreset(
  //         {
  //           type: "dc",
  //           labels: ["", "", "s", "s  \n  a", "a  \n  a", "a"],
  //           colorset: "blue",
  //           system: "sta",
  //         },
  //         "d6"
  //     );
  // });
});

export function getFoundryVersion() {
  const version = game.world.coreVersion;
  const verArray = version.split('.');
  for (let i=0; i<verArray.length; i++) { 
    verArray[i] = +verArray[i]; 
  }
  return verArray;
}