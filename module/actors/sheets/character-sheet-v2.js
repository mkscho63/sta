import {
  STASharedActorFunctions
} from '../actor.js'

export class STACharacterSheetV2 extends ActorSheet {
  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
        classes: ["sta", "sheet", "actor", "character"],
        width: 750,
        height: 900,
        dragDrop: [{
            dragSelector: ".item-list .item",
            dropSelector: null
        }]
    });
  }

  /* -------------------------------------------- */

  // If the player is not a GM and has limited permissions - send them to the limited sheet, otherwise, continue as usual.
  /** @override */
  get template() {
    if ( !game.user.isGM && this.actor.limited) return "systems/FVTT-StarTrekAdventures/templates/actors/limited-sheet.html";
    return `systems/FVTT-StarTrekAdventures/templates/actors/character-sheet-v2.html`;
  }

/* -------------------------------------------- */

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);
    
    // Opens the class STASharedActorFunctions for access at various stages.
    let staActor = new STASharedActorFunctions();
    
    var nav = document.getElementById("main_nav"),
        menuBtn = document.getElementById("menu-btn");

    menuBtn.addEventListener('click', toggleNav);

    function toggleNav(event) {
        nav.classList.toggle("active");
        if (menuBtn.innerText == "menu") {
            menuBtn.innerText = "close";
        } else {
            menuBtn.innerText = "menu";
        }
    }
  }
}