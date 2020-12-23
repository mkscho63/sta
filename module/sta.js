// Import Modules
import {
    STAActor
} from "./actors/actor.js";
import {
    STACharacterSheet
} from "./actors/sheets/character-sheet.js";
import {
    STAStarshipSheet
} from "./actors/sheets/starship-sheet.js";
import {
    STAItemSheet
} from "./items/item-sheet.js";
import {
    STAWeaponSheet
} from "./items/weapon-sheet.js";
import {
    STAArmorSheet
} from "./items/armor-sheet.js";
import {
    STATalentSheet
} from "./items/talent-sheet.js";
import {
    STAGenericSheet
} from "./items/generic-sheet.js";
import { 
    STATracker 
} from "./apps/tracker.js";
import { 
    STALogo
} from "./apps/logo.js";
import * as macros from "./macro.js";

/* -------------------------------------------- */
/*  Foundry VTT Initialization                  */
/* -------------------------------------------- */

Hooks.once("init", function() {
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
    .`)


    // Create a namespace within the game global
    game.sta = {
        applications: {
            STACharacterSheet,
            STAStarshipSheet,
            STAItemSheet,
            STAWeaponSheet,
            STAArmorSheet,
            STATalentSheet,
            STAGenericSheet,
        },
        entities: {
            STAActor,
        },
        macros: macros,
        attributeTest: macros.attributeTest
    };

    // Define initiative for the system.
    CONFIG.Combat.initiative = {
        formula: "@disciplines.security.value",
        decimals: 0
    };

    // Define custom Entity classes
    CONFIG.Actor.entityClass = STAActor;

    // Register sheet application classes
    Actors.unregisterSheet("core", ActorSheet);
    Actors.registerSheet("sta", STACharacterSheet, {
        types: ["character"],
        makeDefault: true
    });
    Actors.registerSheet("sta", STAStarshipSheet, {
        types: ["starship"]
    });
    Items.unregisterSheet("core", ItemSheet);
    Items.registerSheet("sta", STAItemSheet, {
        types: ["item"],
        makeDefault: true
    });
    Items.registerSheet("sta", STAWeaponSheet, {
        types: ["weapon"],
    });
    Items.registerSheet("sta", STAArmorSheet, {
        types: ["armor"],
    });
    Items.registerSheet("sta", STATalentSheet, {
        types: ["talent"],
    });
    Items.registerSheet("sta", STAGenericSheet, {
        types: ["value"],
    });
    Items.registerSheet("sta", STAGenericSheet, {
        types: ["focus"],
    });
    Items.registerSheet("sta", STAGenericSheet, {
        types: ["injury"],
    });


    // Register system settings
    game.settings.register("FVTT-StarTrekAdventures", "multipleComplications", {
        name: 'Multiple Complications:',
        hint: 'The rulebook states "Any die which rolled 20 causes a complication". This is slightly unclear and as of Version 8 of the PDF, this is still not clear - likely due to the incredible rarity. Enabling this will allow roles to display "There were x Complications" if multiple 20s are rolled. Disabling will just state a single complication.',
        scope: "world",
        type: Boolean,
        default: true,
        config: true
    });

    game.settings.register("FVTT-StarTrekAdventures", "threatPermissionLevel", {
        name: 'Threat Tracker User Role:',
        hint: 'Who should be allowed to amend the threat tracker? Please note, the permission level MUST have the Modify Configuration Settings permission.',
        scope: "world",
        type: String,
        default: "ASSISTANT",
        config: true,
        choices: {
          "PLAYER": "Players",
          "TRUSTED": "Trusted Players",
          "ASSISTANT": "Assistant Gamemaster",
          "GAMEMASTER": "Gamemasters",
        }
    });

    game.settings.register("FVTT-StarTrekAdventures", "momentumPermissionLevel", {
        name: 'Momentum Tracker User Role:',
        hint: 'Who should be allowed to amend the momentum tracker? Please note, the permission level MUST have the Modify Configuration Settings permission.',
        scope: "world",
        type: String,
        default: "PLAYER",
        config: true,
        choices: {
          "PLAYER": "Players",
          "TRUSTED": "Trusted Players",
          "ASSISTANT": "Assistant Gamemaster",
          "GAMEMASTER": "Gamemasters",
        }
    });

    game.settings.register("FVTT-StarTrekAdventures", "maxNumberOfReputation", {
        name: 'Maximum amount of Reputation:',
        hint: 'Max number of reputation that can be given to a character. 10 is default.',
        scope: "world",
        type: Number,
        default: 20,
        config: true
    });

    game.settings.register("FVTT-StarTrekAdventures", "trackerRefreshRate", {
        name: 'Refresh Rate of Threat & Momentum:',
        hint: 'In seconds, how often should the tracker refresh. It is inadvisable to set this too low. Up this if it appears to be causing optimisation issues.',
        scope: "world",
        type: Number,
        default: 5,
        config: true
    });
    
    game.settings.register("FVTT-StarTrekAdventures", "threat", {
        scope: "world",
        type: Number,
        default: 0,
        config: false
    });

    game.settings.register("FVTT-StarTrekAdventures", "momentum", {
        scope: "world",
        type: Number,
        default: 0,
        config: false
    });

    Hooks.on("ready", function() {
        let i = USER_ROLES[game.settings.get("FVTT-StarTrekAdventures", "momentumPermissionLevel")];
        for (i; i <= 4; i++) {
            if (!game.permissions.SETTINGS_MODIFY.includes(i)) var error = true;
        }
        if (error) {
            console.error("The Momentum Tracker User Role does not have permissions to Modify Configuration Settings. Please change one of these in Permission Configuration or System Settings.");
            ui.notifications.error("The Momentum Tracker User Role does not have permissions to Modify Configuration Settings. Please change one of these in Permission Configuration or System Settings.");
        }
        let t = new STATracker()
        renderTemplate("systems/FVTT-StarTrekAdventures/templates/apps/tracker.html").then(html => {
            t.render(true);
        });
        let l = new STALogo()
        renderTemplate("systems/FVTT-StarTrekAdventures/templates/apps/logo.html").then(html => {
            l.render(true);
        });
    });
});


export function getFoundryVersion() {
    let version = game.world.coreVersion;
    let verArray = version.split(".")
    for(var i=0; i<verArray.length; i++) { 
        verArray[i] = +verArray[i]; 
    }
    return verArray;
}