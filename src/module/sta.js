// Import Modules
import {
  default as Combat2d20
} from './apps/Combat2d20.mjs';
import {
  default as CombatTracker2d20V2
} from './apps/CombatTracker2d20V2.mjs';
import {
  STACharacterSheet
} from './actors/character-sheet.mjs';
import {
  STACharacterSheet2e
} from './actors/character-sheet2e.mjs';
import {
  STANPCSheet2e
} from './actors/npc-sheet2e.mjs';
import {
  STAStarshipSheet
} from './actors/starship-sheet.mjs';
import {
  STAStarshipSheet2e
} from './actors/starship-sheet2e.mjs';
import {
  STASmallCraftSheet
} from './actors/smallcraft-sheet.mjs';
import {
  STASmallCraftSheet2e
} from './actors/smallcraft-sheet2e.mjs';
import {
  STAExtendedTaskSheet
} from './actors/extended-task-sheet.mjs';
import {
  STASceneTraits
} from './actors/scenetraits-sheet.mjs';
import {
  STAItemSheet
} from './items/item-sheet.mjs';
import {
  STACharacterWeaponSheet
} from './items/character-weapon-sheet.mjs';
import {
  STACharacterWeaponSheet2e
} from './items/character-weapon-sheet2e.mjs';
import {
  STAStarshipWeaponSheet
} from './items/starship-weapon-sheet.mjs';
import {
  STAStarshipWeaponSheet2e
} from './items/starship-weapon-sheet2e.mjs';
import {
  STAArmorSheet
} from './items/armor-sheet.mjs';
import {
  STATalentSheet
} from './items/talent-sheet.mjs';
import {
  STATraitSheet
} from './items/trait-sheet.mjs';
import {
  STAGenericSheet
} from './items/generic-sheet.mjs';
import {
  STALogSheet
} from './items/log-sheet.mjs';
import {
  STAMilestoneSheet
} from './items/milestone-sheet.mjs';
import {
  STASmallCraftContainerSheet
} from './items/smallcraftcontainer-sheet.mjs';
import {
  STATracker
} from './apps/tracker.mjs';
import {
  registerDsnUfpThemes
} from './apps/dice-so-nice.js';
import {
  Collapsible
} from './apps/Collapsible.mjs';
import {
  STARoll
} from './apps/roll.js';

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
      STANPCSheet2e,
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
      STALogSheet,
      STAMilestoneSheet,
      STASmallCraftContainerSheet,
    },
    defaultImage: 'systems/sta/assets/icons/voyagercombadgeicon.svg'
  };

  window.STARoll = STARoll;

  // Define initiative for the system.
  CONFIG.Combat.initiative = {
    formula: '@attributes.daring.value',
    decimals: 0
  };

  // Register sheet application classes
  foundry.applications.apps.DocumentSheetConfig.unregisterSheet(Actor, 'core', foundry.appv1.sheets.ActorSheet);
  foundry.applications.apps.DocumentSheetConfig.registerSheet(Actor, 'sta', STACharacterSheet, {
    types: ['character'],
    label: '1e Character'
  });
  foundry.applications.apps.DocumentSheetConfig.registerSheet(Actor, 'sta', STACharacterSheet2e, {
    types: ['character'],
    label: '2e Character',
    makeDefault: true
  });
  foundry.applications.apps.DocumentSheetConfig.registerSheet(Actor, 'sta', STANPCSheet2e, {
    types: ['character'],
    label: '2e NPC'
  });
  foundry.applications.apps.DocumentSheetConfig.registerSheet(Actor, 'sta', STAStarshipSheet, {
    types: ['starship'],
    label: '1e Starship'
  });
  foundry.applications.apps.DocumentSheetConfig.registerSheet(Actor, 'sta', STAStarshipSheet2e, {
    types: ['starship'],
    label: '2e Starship'
  });
  foundry.applications.apps.DocumentSheetConfig.registerSheet(Actor, 'sta', STASmallCraftSheet, {
    types: ['smallcraft'],
    label: '1e Small Craft'
  });
  foundry.applications.apps.DocumentSheetConfig.registerSheet(Actor, 'sta', STASmallCraftSheet2e, {
    types: ['smallcraft'],
    label: '2e Small Craft'
  });
  foundry.applications.apps.DocumentSheetConfig.registerSheet(Actor, 'sta', STAExtendedTaskSheet, {
    types: ['extendedtask'],
    label: 'Extended Task'
  });
  foundry.applications.apps.DocumentSheetConfig.registerSheet(Actor, 'sta', STASceneTraits, {
    types: ['scenetraits'],
    label: 'Scene Traits'
  });

  foundry.applications.apps.DocumentSheetConfig.unregisterSheet(Item, 'core', foundry.appv1.sheets.ItemSheet);
  foundry.applications.apps.DocumentSheetConfig.registerSheet(Item, 'sta', STAItemSheet, {
    types: ['item'],
    makeDefault: true
  });
  foundry.applications.apps.DocumentSheetConfig.registerSheet(Item, 'sta', STACharacterWeaponSheet, {
    types: ['characterweapon']
  });
  foundry.applications.apps.DocumentSheetConfig.registerSheet(Item, 'sta', STACharacterWeaponSheet2e, {
    types: ['characterweapon2e']
  });
  foundry.applications.apps.DocumentSheetConfig.registerSheet(Item, 'sta', STAStarshipWeaponSheet, {
    types: ['starshipweapon']
  });
  foundry.applications.apps.DocumentSheetConfig.registerSheet(Item, 'sta', STAStarshipWeaponSheet2e, {
    types: ['starshipweapon2e']
  });
  foundry.applications.apps.DocumentSheetConfig.registerSheet(Item, 'sta', STAArmorSheet, {
    types: ['armor']
  });
  foundry.applications.apps.DocumentSheetConfig.registerSheet(Item, 'sta', STATalentSheet, {
    types: ['talent']
  });
  foundry.applications.apps.DocumentSheetConfig.registerSheet(Item, 'sta', STATraitSheet, {
    types: ['trait']
  });
  foundry.applications.apps.DocumentSheetConfig.registerSheet(Item, 'sta', STATraitSheet, {
    types: ['injury']
  });
  foundry.applications.apps.DocumentSheetConfig.registerSheet(Item, 'sta', STAGenericSheet, {
    types: ['value']
  });
  foundry.applications.apps.DocumentSheetConfig.registerSheet(Item, 'sta', STAGenericSheet, {
    types: ['focus']
  });
  foundry.applications.apps.DocumentSheetConfig.registerSheet(Item, 'sta', STAMilestoneSheet, {
    types: ['milestone']
  });
  foundry.applications.apps.DocumentSheetConfig.registerSheet(Item, 'sta', STALogSheet, {
    types: ['log']
  });
  foundry.applications.apps.DocumentSheetConfig.registerSheet(Item, 'sta', STASmallCraftContainerSheet, {
    types: ['smallcraftcontainer']
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
    hint: 'Max number of reputation that can be given to a character, 20 is default.',
    scope: 'world',
    type: Number,
    default: 20,
    config: true
  });

  game.settings.register('sta', 'maxNumberOfReputation2e', {
    name: 'Maximum Reputation (2nd ed):',
    hint: 'Max number of reputation that can be given to a character, 5 is default.',
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

  game.settings.register('sta', 'momentumTrackerPosition', {
    name: 'Screen position of the tracker',
    hint: 'Where on the screen should the momentum/threat tracker be?',
    scope: 'world',
    type: String,
    default: 'BottomRight',
    config: true,
    choices: {
      'BottomRight': 'Bottom Right',
      'BottomLeft': 'Bottom Left',
      'TopRight': 'Top Right',
      'TopLeft': 'Top Left',
    }
  });

  game.settings.register('sta', 'sendMomemtumThreatToChat', {
    name: 'Send Momentum and Threat Updates to Chat:',
    hint: 'Uncheck this if you do not want to see momentum and threat updates in the chat.',
    scope: 'world',
    type: Boolean,
    default: true,
    config: true
  });

  game.settings.register('sta', 'useSTAPopcornCombat', {
    name: 'Use the built in STA Popcorn combat tracker:',
    hint: 'Uncheck this if you do not want to use the built in combact tracker.',
    scope: 'world',
    type: Boolean,
    default: true,
    config: true
  });

  preloadHandlebarsTemplates();
  Hooks.on('renderChatMessageHTML', (msg, html, data) => {
    Collapsible.attachHeaderListener(html);
  });

  Hooks.once('renderSidebar', function() {
    const t = new STATracker();
    foundry.applications.handlebars.renderTemplate('systems/sta/templates/apps/tracker.hbs').then((html) => {
      t.render(true);
    });
  });

  Hooks.once('diceSoNiceReady', (dice3d) => {
    registerDsnUfpThemes(dice3d);
  });

  const usePopcorn = game.settings.get('sta', 'useSTAPopcornCombat');
  if (usePopcorn) {
    CONFIG.ui.combat = CombatTracker2d20V2;
    CONFIG.Combat.documentClass = Combat2d20;
  }
});

async function preloadHandlebarsTemplates() {
  const paths = {
    ['sta.chat.weapon-roll']: 'systems/sta/templates/chat/challenge-roll.hbs',
  };
  return foundry.applications.handlebars.loadTemplates(paths);
}

Hooks.on('preCreateItem', (item, options, userId) => {
  if (!item.img || item.img === 'icons/svg/item-bag.svg') {
    item.updateSource({
      img: 'systems/sta/assets/icons/VoyagerCombadgeIcon.png'
    });
  }
});

Hooks.on('createActor', async (actor, options, userId) => {
  if (game.user.id !== userId) return;

  if (actor.type === 'character') {
    const compendium2e = await game.packs.get('sta.equipment-crew');
    const item1 = await compendium2e.getDocument('cxIi0Ltb1sUCFnzp');
    const compendium1e = await game.packs.get('sta.personal-weapons-core');
    const item2 = await compendium1e.getDocument('3PTFLawY0tCva3gG');

    if (item1 && item2) {
      const existingItems = actor.items.map((item) => item.name);

      const itemsToAdd = [];
      if (!existingItems.includes(item1.name)) itemsToAdd.push(item1.toObject());
      if (!existingItems.includes(item2.name)) itemsToAdd.push(item2.toObject());

      if (itemsToAdd.length > 0) {
        await actor.createEmbeddedDocuments('Item', itemsToAdd);
      }
    } else {
      console.error('One or both items were not found in the compendiums.');
    }
  }
});
