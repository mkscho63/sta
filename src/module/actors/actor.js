import {
  STARollDialog
} from '../apps/roll-dialog.js';
import {
  STARoll
} from '../roll.js';

export class STAActor extends Actor {
  prepareData() {
    if (!this.img) this.img = game.sta.defaultImage;

    super.prepareData();
  }
}

/** Shared functions for actors **/
export class STASharedActorFunctions {
  // This function renders all the tracks. This will be used every time the character sheet is loaded. It is a vital element as such it runs before most other code!
  staRenderTracks(html, stressTrackMax, determinationPointsMax,
    repPointsMax, shieldsTrackMax, powerTrackMax, crewTrackMax) {
    let i;
    // Checks if details for the Stress Track was included, this should happen for all Characters!
    if (stressTrackMax) {
      for (i = 0; i < stressTrackMax; i++) {
        html.find('[id^="stress"]')[i].classList.add('stress');
        if (i + 1 <= html.find('#total-stress')[0].value) {
          html.find('[id^="stress"]')[i].setAttribute('data-selected', 'true');
          html.find('[id^="stress"]')[i].classList.add('selected');
        } else {
          html.find('[id^="stress"]')[i].removeAttribute('data-selected');
          html.find('[id^="stress"]')[i].classList.remove('selected');
        }
      }
    }
    // Checks if details for the Determination Track was included, this should happen for all Characters!
    if (determinationPointsMax) {
      for (i = 0; i < determinationPointsMax; i++) {
        html.find('[id^="determination"]')[i].classList.add('determination');
        if (i + 1 <= html.find('#total-determination')[0].value) {
          html.find('[id^="determination"]')[i].setAttribute('data-selected', 'true');
          html.find('[id^="determination"]')[i].classList.add('selected');
        } else {
          html.find('[id^="determination"]')[i].removeAttribute('data-selected');
          html.find('[id^="determination"]')[i].classList.remove('selected');
        }
      }
    }
    // Checks if details for the Reputation Track was included, this should happen for all Characters!
    if (repPointsMax) {
      for (i = 0; i < repPointsMax; i++) {
        html.find('[id^="rep"]')[i].classList.add('rep');
        if (i + 1 <= html.find('#total-rep')[0].value) {
          html.find('[id^="rep"]')[i].setAttribute('data-selected', 'true');
          html.find('[id^="rep"]')[i].classList.add('selected');
        } else {
          html.find('[id^="rep"]')[i].removeAttribute('data-selected');
          html.find('[id^="rep"]')[i].classList.remove('selected');
        }
      }
    }
    // if this is a starship, it will have shields instead of stress, but will be handled very similarly
    if (shieldsTrackMax) {
      for (i = 0; i < shieldsTrackMax; i++) {
        html.find('[id^="shields"]')[i].classList.add('shields');
        if (i + 1 <= html.find('#total-shields').val()) {
          html.find('[id^="shields"]')[i].setAttribute('data-selected', 'true');
          html.find('[id^="shields"]')[i].classList.add('selected');
        } else {
          html.find('[id^="shields"]')[i].removeAttribute('data-selected');
          html.find('[id^="shields"]')[i].classList.remove('selected');
        }
      }
    }
    // if this is a starship, it will have power instead of determination, but will be handled very similarly
    if (powerTrackMax) {
      for (i = 0; i < powerTrackMax; i++) {
        html.find('[id^="power"]')[i].classList.add('power');
        if (i + 1 <= html.find('#total-power').val()) {
          html.find('[id^="power"]')[i].setAttribute('data-selected', 'true');
          html.find('[id^="power"]')[i].classList.add('selected');
        } else {
          html.find('[id^="power"]')[i].removeAttribute('data-selected');
          html.find('[id^="power"]')[i].classList.remove('selected');
        }
      }
    }
    // if this is a starship, it will also have crew support level instead of determination, but will be handled very similarly
    if (crewTrackMax) {
      for (i = 0; i < crewTrackMax; i++) {
        html.find('[id^="crew"]')[i].classList.add('crew');
        if (i + 1 <= html.find('#total-crew').val()) {
          html.find('[id^="crew"]')[i].setAttribute('data-selected', 'true');
          html.find('[id^="crew"]')[i].classList.add('selected');
        } else {
          html.find('[id^="crew"]')[i].removeAttribute('data-selected');
          html.find('[id^="crew"]')[i].classList.remove('selected');
        }
      }
    }
  }

  // This handles performing an attribute test using the "Perform Check" button.
  async rollAttributeTest(event, selectedAttribute, selectedAttributeValue,
    selectedDiscipline, selectedDisciplineValue, defaultValue, speaker) {
    event.preventDefault();
    if (!defaultValue) defaultValue = 2;
    // This creates a dialog to gather details regarding the roll and waits for a response
    const rolldialog = await STARollDialog.create(true, defaultValue);
    if (rolldialog) {
      const dicePool = rolldialog.get('dicePoolSlider');
      const usingFocus = rolldialog.get('usingFocus') == null ? false : true;
	  const usingDedicatedFocus = rolldialog.get('usingDedicatedFocus') == null ? false : true;
      const usingDetermination = rolldialog.get('usingDetermination') == null ? false : true;
      const complicationRange = parseInt(rolldialog.get('complicationRange'));
      // Once the response has been collected it then sends it to be rolled.
      const staRoll = new STARoll();
      staRoll.performAttributeTest(dicePool, usingFocus, usingDedicatedFocus, usingDetermination,
        selectedAttribute, selectedAttributeValue, selectedDiscipline,
        selectedDisciplineValue, complicationRange, speaker);
    }
  }
	
  // This handles performing an challenge roll using the "Perform Challenge Roll" button.
  async rollChallengeRoll(event, weaponName, defaultValue, speaker = null) {
    event.preventDefault();
    // This creates a dialog to gather details regarding the roll and waits for a response
    const rolldialog = await STARollDialog.create(false, defaultValue);
    if (rolldialog) {
      const dicePool = rolldialog.get('dicePoolValue');
      // Once the response has been collected it then sends it to be rolled.
      const staRoll = new STARoll();
      staRoll.performChallengeRoll(dicePool, weaponName, speaker);
    }
  }

  // This handles performing an "item" roll by clicking the item's image.
  async rollGenericItem(event, type, id, speaker) {
    event.preventDefault();
    const item = speaker.items.get(id);
    const staRoll = new STARoll();
    // It will send it to a different method depending what item type was sent to it.
    switch (type) {
    case 'item':
      staRoll.performItemRoll(item, speaker);
      break;
    case 'focus':
      staRoll.performFocusRoll(item, speaker);
      break;
    case 'value':
      staRoll.performValueRoll(item, speaker);
      break;
    case 'characterweapon':
    case 'starshipweapon':
      staRoll.performWeaponRoll(item, speaker);
      break;
    case 'characterweapon2e':
      staRoll.performWeaponRoll2e(item, speaker);
      break;
    case 'starshipweapon2e':
      staRoll.performStarshipWeaponRoll2e(item, speaker);
      break;		  
    case 'armor':
      staRoll.performArmorRoll(item, speaker);
      break;
    case 'talent':
      staRoll.performTalentRoll(item, speaker);
      break;
    case 'injury':
      staRoll.performInjuryRoll(item, speaker);
      break;
    }
  }

  /**
   * Create the "Are you sure?" delete dialog used for sheets' item delete behavior.
   *
   * @param {string} itemName - The item name to display.
   * @param {function} yesCb - The callback to handle a "yes" click.
   * @param {function} closeCb - The callback handling a "close" event.
   *
   * @return {Dialog}
   */
  deleteConfirmDialog(itemName, yesCb, closeCb) {

    // Dialog uses Simple Worldbuilding System Code.
    return new Dialog({
      title: 'Confirm Item Deletion',
      content: 'Are you sure you want to delete ' + itemName + '?',
      buttons: {
        yes: {
          icon: '<i class="fas fa-check"></i>',
          label: game.i18n.localize("Yes"),
          callback: yesCb,
        },
        no: {
          icon: '<i class="fas fa-times"></i>',
          label: game.i18n.localize("No"),
        }
      },
      default: 'no',
      close: closeCb,
    });
  }
}
// Add unarmed strike to new characters
Hooks.on('createActor', async (actor, options, userId) => {
  if (actor.type === 'character') {

    const compendium2e = await game.packs.get('sta.equipment-crew');
	const item1 = await compendium2e.getDocument('cxIi0Ltb1sUCFnzp');

    const compendium1e = await game.packs.get('sta.personal-weapons-core');
	const item2 = await compendium1e.getDocument('3PTFLawY0tCva3gG');

    if (item1 && item2) {
      await actor.createEmbeddedDocuments('Item', [
        item1.toObject(),
        item2.toObject()
      ]);
    } else {
      console.error("One or both items were not found in the compendiums.");
    }
  }
});