// Import Modules
import {
  STAActor
} from './actors/actor.js';
import {
  STACharacterSheet
} from './actors/sheets/character-sheet.js';
import {
  STACharacterSheet2e
} from './actors/sheets/character-sheet2e.js';
import {
  STAStarshipSheet
} from './actors/sheets/starship-sheet.js';
import {
  STAStarshipSheet2e
} from './actors/sheets/starship-sheet2e.js';
import {
  STASmallCraftSheet
} from './actors/sheets/smallcraft-sheet.js';
import {
  STASmallCraftSheet2e
} from './actors/sheets/smallcraft-sheet2e.js';
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
  STACharacterWeaponSheet2e
} from './items/character-weapon-sheet2e.js';
import {
  STAStarshipWeaponSheet
} from './items/starship-weapon-sheet.js';
import {
  STAStarshipWeaponSheet2e
} from './items/starship-weapon-sheet2e.js';
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
  STASmallCraftContainerSheet
} from './items/smallcraftcontainer-sheet.js';
import { 
  STATracker 
} from './apps/tracker.js';
import * as macros from './macro.js';
import { 
  STAItem
} from './items/item.js';
import {
  register_dsn_ufp_themes
} from './dice/dice-so-nice.js';
import {Collapsible} from './chat/Collapsible.js';
import {
  STARoller
} from './dice/STARoller.js';

/* -------------------------------------------- */
/*  Foundry VTT Initialization                  */
/* -------------------------------------------- */

Hooks.once('init', function() {
  let versionInfo = game.world.coreVersion;
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
	  STACharacterSheet2e,
      STAStarshipSheet,
      STAStarshipSheet2e,	  
      STASmallCraftSheet,
      STASmallCraftSheet2e,
      STAExtendedTaskSheet,
      STAItemSheet,
      STACharacterWeaponSheet,
	  STACharacterWeaponSheet2e,
      STAStarshipWeaponSheet,
      STAStarshipWeaponSheet2e,
      STAArmorSheet,
      STATalentSheet,
      STAGenericSheet,
      STASmallCraftContainerSheet,
      STAItem,
    },
    entities: {
      STAActor,
    },
    macros: macros,
    attributeTest: macros.attributeTest,
    defaultImage: 'systems/sta/assets/icons/voyagercombadgeicon.svg'
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
  Actors.registerSheet('sta', STACharacterSheet2e, {
    types: ['character']
  });
  Actors.registerSheet('sta', STAStarshipSheet, {
    types: ['starship']
  });
  Actors.registerSheet('sta', STAStarshipSheet2e, {
    types: ['starship']
  });
  Actors.registerSheet('sta', STASmallCraftSheet, {
    types: ['smallcraft'],
  });
  Actors.registerSheet('sta', STASmallCraftSheet2e, {
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
  Items.registerSheet('sta', STACharacterWeaponSheet2e, {
    types: ['characterweapon2e'],
  });
  Items.registerSheet('sta', STAStarshipWeaponSheet, {
    types: ['starshipweapon'],
  });
  Items.registerSheet('sta', STAStarshipWeaponSheet2e, {
    types: ['starshipweapon2e'],
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
  Items.registerSheet('sta', STASmallCraftContainerSheet, {
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
    hint: 'Who should be allowed to amend the threat tracker?',
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
    hint: 'Who should be allowed to amend the momentum tracker?',
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
    name: 'Maximum Reputation (1st ed):',
    hint: 'Max number of reputation that can be given to a character. 10 is default.',
    scope: 'world',
    type: Number,
    default: 20,
    config: true
  });

  game.settings.register('sta', 'maxNumberOfReputation2e', {
    name: 'Maximum Reputation (2nd ed):',
    hint: 'Max number of reputation that can be given to a character. 3 is default.',
    scope: 'world',
    type: Number,
    default: 5,
    config: true
  });

  game.settings.register('sta', 'maxNumberOfMomentum', {
    name: 'Maximum amount of Momentum:',
    hint: 'Max amount of momentum the players can have at a time. 6 is default.',
    scope: 'world',
    type: Number,
    default: 6,
    config: true
  });

  game.settings.register('sta', 'characterAttributeLimitIgnore', {
    name: 'Ignore normal Max/Min limits to Character/NPC Attributes:',
    hint: 'At system creation characters and NPCs were limited to Attribute values between 7 and 12, this option removes that limit and sets the limit to between 0 and 99.',
    scope: 'world',
    type: Boolean,
    default: false,
    config: true
  });
    
  game.settings.register('sta', 'characterDisciplineLimitIgnore', {
    name: 'Ignore normal Max/Min limits to Character/NPC Disciplines:',
    hint: 'At system creation characters and NPCs were limited to Discipline values between 0 and 5, this option removes that limit and sets the limit to between 0 and 99.',
    scope: 'world',
    type: Boolean,
    default: false,
    config: true
  });
  
  game.settings.register('sta', 'shipDepartmentLimitIgnore', {
    name: 'Ignore normal Max/Min limits to Starship/Small Craft Departments:',
    hint: 'At system creation Starships and Small Craft were limited to Department values between 0 and 5, this option removes that limit and sets the limit to between 0 and 99.',
    scope: 'world',
    type: Boolean,
    default: false,
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

  Hooks.on('renderChatMessage', (msg, html, data) => {
    Collapsible.attachHeaderListener(html);
  });

  Hooks.on('ready', function() {
    const t = new STATracker();
    renderTemplate('systems/sta/templates/apps/tracker.html').then((html) => {
      t.render(true);
    });
  });

  Hooks.once("diceSoNiceReady", (dice3d) => {
    register_dsn_ufp_themes(dice3d);
  });
});
