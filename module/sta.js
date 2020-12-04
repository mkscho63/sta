// Import Modules
import {
    DishonoredActor
} from "./actors/actor.js";
import {
    DishonoredCharacterSheet
} from "./actors/sheets/character-sheet.js";
import {
    DishonoredNPCSheet
} from "./actors/sheets/npc-sheet.js";
import {
    DishonoredItemSheet
} from "./items/item-sheet.js";
import {
    DishonoredFocusSheet
} from "./items/focus-sheet.js";
import {
    DishonoredBonecharmSheet
} from "./items/bonecharm-sheet.js";
import {
    DishonoredWeaponSheet
} from "./items/weapon-sheet.js";
import {
    DishonoredArmorSheet
} from "./items/armor-sheet.js";
import {
    DishonoredTalentSheet
} from "./items/talent-sheet.js";
import {
    DishonoredContactSheet
} from "./items/contact-sheet.js";
import {
    DishonoredPowerSheet
} from "./items/power-sheet.js";
import { 
    DishonoredTracker 
} from "./apps/tracker.js";
import { 
    DishonoredLogo
} from "./apps/logo.js";
import * as macros 
from "./macro.js";

/* -------------------------------------------- */
/*  Foundry VTT Initialization                  */
/* -------------------------------------------- */

Hooks.once("init", function() {
    // Splash Screen
    console.log(`Initializing Star Trek Adventures Tabletop Roleplaying Game System
                                                            @@
             @                                            @@
    @         @@                     @      @@         @@@@
      @@       @@@                 @@@   @@@        @@@@
        @@@@     @@@@@@@@@@@@@@@@@@@@    @@      @@@@@
          @@@@    @@@@            @@   @@@     @@@@@
            @@@@@   @     @@@@@@@@   @@@    @@@@@      @@
      @@@      @@@@ @@@@@@@       @@@@@  @@@@@@    @@@@
          @@@@    @@@@              @ @@@@@@   @@@@@
              @@@@   @              @@@@@@  @@@  @@@
                        @@@@@@@@@@@@@@@@          @@@
                      @@@@        @@@@            @@@
                      @@    @@@@@   @@@  @@@@@     @@
                            @@@@   @@@   @@@@@     @@
                        @@@       @@@@            @@@
            @@@@  @  @@@@@@@@@@@@@@               @@
            @@ @@  @@@@@                         @@@
                 @@@@                    @@    @@@
                @@                         @@@@@@
              @                              @@@@
                                                @@@
                                                   @@@
                                                      @@`)


    // Create a namespace within the game global
    game.dishonored = {
        applications: {
            DishonoredCharacterSheet,
            DishonoredNPCSheet,
            DishonoredItemSheet,
            DishonoredFocusSheet,
            DishonoredBonecharmSheet,
            DishonoredWeaponSheet,
            DishonoredArmorSheet,
            DishonoredTalentSheet,
            DishonoredContactSheet,
            DishonoredPowerSheet,
        },
        entities: {
            DishonoredActor,
        },
        macros: macros,
        skillTest: macros.skillTest
    };

    // Define initiative for the system.
    CONFIG.Combat.initiative = {
        formula: "@styles.swiftly.value",
        decimals: 0
    };

    // Define custom Entity classes
    CONFIG.Actor.entityClass = DishonoredActor;

    // Register sheet application classes
    Actors.unregisterSheet("core", ActorSheet);
    Actors.registerSheet("dishonored", DishonoredCharacterSheet, {
        types: ["character"],
        makeDefault: true
    });
    Actors.registerSheet("dishonored", DishonoredNPCSheet, {
        types: ["npc"]
    });
    Items.unregisterSheet("core", ItemSheet);
    Items.registerSheet("dishonored", DishonoredItemSheet, {
        types: ["item"],
        makeDefault: true
    });
    Items.registerSheet("dishonored", DishonoredFocusSheet, {
        types: ["focus"],
    });
    Items.registerSheet("dishonored", DishonoredBonecharmSheet, {
        types: ["bonecharm"],
    });
    Items.registerSheet("dishonored", DishonoredWeaponSheet, {
        types: ["weapon"],
    });
    Items.registerSheet("dishonored", DishonoredArmorSheet, {
        types: ["armor"],
    });
    Items.registerSheet("dishonored", DishonoredTalentSheet, {
        types: ["talent"],
    });
    Items.registerSheet("dishonored", DishonoredContactSheet, {
        types: ["contact"],
    });
    Items.registerSheet("dishonored", DishonoredPowerSheet, {
        types: ["power"],
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

    game.settings.register("FVTT-StarTrekAdventures", "send2ActorPermissionLevel", {
        name: 'Send2Actor User Role:',
        hint: 'The contact item type has the ability to create an NPC, who should be allowed to see & use this functionality?',
        scope: "world",
        type: String,
        default: "ASSISTANT",
        config: true,
        choices: {
          "NONE": "Switch Off Send2Actor",
          "PLAYER": "Players",
          "TRUSTED": "Trusted Players",
          "ASSISTANT": "Assistant Gamemaster",
          "GAMEMASTER": "Gamemasters",
        }
    });

    game.settings.register("FVTT-StarTrekAdventures", "chaosPermissionLevel", {
        name: 'Chaos Tracker User Role:',
        hint: 'Who should be allowed to amend the chaos tracker? Please note, the permission level MUST have the Modify Configuration Settings permission.',
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

    game.settings.register("FVTT-StarTrekAdventures", "maxNumberOfExperience", {
        name: 'Maximum amount of Experience:',
        hint: 'Max number of experience that can be given to a character. 30 is default, anything past 50 becomes almost unreadable.',
        scope: "world",
        type: Number,
        default: 30,
        config: true
    });

    game.settings.register("FVTT-StarTrekAdventures", "trackerRefreshRate", {
        name: 'Refresh Rate of Chaos & Momentum:',
        hint: 'In seconds, how often should the tracker refresh. It is inadvisable to set this too low. Up this if it appears to be causing optimisation issues.',
        scope: "world",
        type: Number,
        default: 5,
        config: true
    });

    // game.settings.register("FVTT-StarTrekAdventures", "individualMomentum", {
    //     name: 'Indvidual Momentum:',
    //     hint: 'Should the system use individual momentum instead of global momentum. This is homebrew and not recommended.',
    //     scope: "world",
    //     type: Boolean,
    //     default: false,
    //     config: true
    // });

    game.settings.register("FVTT-StarTrekAdventures", "chaos", {
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
        let t = new DishonoredTracker()
        renderTemplate("systems/FVTT-StarTrekAdventures/templates/apps/tracker.html").then(html => {
            t.render(true);
        });
        let l = new DishonoredLogo()
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