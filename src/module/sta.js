// Import Modules
import {STAActor} from './actors/actor.js';
import {STACharacterSheet} from './actors/sheets/character-sheet.js';
import {STACharacterSheet2e} from './actors/sheets/character-sheet2e.js';
import {STAStarshipSheet} from './actors/sheets/starship-sheet.js';
import {STAStarshipSheet2e} from './actors/sheets/starship-sheet2e.js';
import {STASmallCraftSheet} from './actors/sheets/smallcraft-sheet.js';
import {STASmallCraftSheet2e} from './actors/sheets/smallcraft-sheet2e.js';
import {STAExtendedTaskSheet} from './actors/sheets/extended-task-sheet.js';
import {STASceneTraits} from './actors/sheets/scenetraits-sheet.js';
import {STAItemSheet} from './items/item-sheet.js';
import {STACharacterWeaponSheet} from './items/character-weapon-sheet.js';
import {STACharacterWeaponSheet2e} from './items/character-weapon-sheet2e.js';
import {STAStarshipWeaponSheet} from './items/starship-weapon-sheet.js';
import {STAStarshipWeaponSheet2e} from './items/starship-weapon-sheet2e.js';
import {STAArmorSheet} from './items/armor-sheet.js';
import {STATalentSheet} from './items/talent-sheet.js';
import {STATraitSheet} from './items/trait-sheet.js';
import {STAGenericSheet} from './items/generic-sheet.js';
import {STASmallCraftContainerSheet} from './items/smallcraftcontainer-sheet.js';
import {STATracker} from './apps/tracker.js';
import {STARoller} from './apps/STARoller.js';
import {STAItem} from './items/item.js';
import {registerDsnUfpThemes} from './apps/dice-so-nice.js';
import {Collapsible} from './apps/Collapsible.js';

/* -------------------------------------------- */
/*  Foundry VTT Initialization                  */
/* -------------------------------------------- */

Hooks.once('init', function() {
  const versionInfo = game.world.coreVersion;
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
  ******.::::'*********\'::.******    
   ****.:::'*************\':.****
     *.::'*****************\'.*
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
	  STASceneTraits,
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
    defaultImage: 'systems/sta/assets/icons/voyagercombadgeicon.svg'
  };

  // Define initiative for the system.
  CONFIG.Combat.initiative = {
    formula: '@disciplines.security.value',
    decimals: 0
  };

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
  Actors.registerSheet('sta', STASceneTraits, {
    types: ['scenetraits']
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
  Items.registerSheet('sta', STATraitSheet, {
    types: ['trait'],
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

  game.settings.register('sta', 'sendMomemtumThreatToChat', {
    name: 'Send Momentum and Threat Updates to Chat:',
    hint: 'Uncheck this if you do not want to see momentum and threat updates in the chat.',
    scope: 'world',
    type: Boolean,
    default: true,
    config: true
  });

  preloadHandlebarsTemplates();

  Hooks.on('renderChatLog', (app, html, data) => {
    STAItem.chatListeners($(html));
  });


  Hooks.on('renderChatMessage', (msg, html, data) => {
    Collapsible.attachHeaderListener(html);
  });

  Hooks.on('ready', function() {
    const t = new STATracker();
    renderTemplate('systems/sta/templates/apps/tracker.hbs').then((html) => {
      t.render(true);
    });
  });

  Hooks.once("diceSoNiceReady", (dice3d) => {
    registerDsnUfpThemes(dice3d);
  });
});

async function preloadHandlebarsTemplates() {
  const paths = {
    ['sta.chat.attribute-test']: 'systems/sta/templates/chat/attribute-test.hbs',
    ['sta.chat.item-card']: 'systems/sta/templates/chat/generic-item.hbs',
    ['sta.chat.weapon-roll']: 'systems/sta/templates/chat/challenge-roll.hbs',
  };

  return loadTemplates(paths);
}

Hooks.on("preCreateItem", (item, options, userId) => {
  if (!item.img || item.img === "icons/svg/item-bag.svg") {
    item.updateSource({ img: "systems/sta/assets/icons/VoyagerCombadgeIcon.png" });
  }
});