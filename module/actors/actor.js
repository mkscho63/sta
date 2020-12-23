import {
    STARollDialog
} from '../apps/roll-dialog.js'
import {
    STARoll
} from '../roll.js'

export class STAActor extends Actor {
	prepareData() {
		super.prepareData();
		// const actorData = this.data;
	}
}

export class STASharedActorFunctions {

	// This function renders all the tracks. This will be used every time the character sheet is loaded. It is a vital element as such it runs before most other code!
	staRenderTracks(html, stressTrackMax, determinationPointsMax, repPointsMax, shieldsTrackMax, powerTrackMax, crewTrackMax) {
		var i;
		// Checks if details for the Stress Track was included, this should happen in all cases!
		if (stressTrackMax) {
			for (i = 0; i < stressTrackMax; i++) {
				if (i + 1 <= html.find('#total-stress')[0].value) {
					html.find('[id^="stress"]')[i].setAttribute("data-selected", "true");
					html.find('[id^="stress"]')[i].style.backgroundColor = "#FF2200";
					html.find('[id^="stress"]')[i].style.color = "#0F0F0F";
				} else {
					html.find('[id^="stress"]')[i].removeAttribute("data-selected");
					html.find('[id^="stress"]')[i].style.backgroundColor = "#1111EE";
					html.find('[id^="stress"]')[i].style.color = "#FEFEFF";
				}
			}
		}
		// Checks if details for the Determination Track was included, this should happen for all Characters!
		if (determinationPointsMax) {
			for (i = 0; i < determinationPointsMax; i++) {
				if (i + 1 <= html.find('#total-determination')[0].value) {
					html.find('[id^="determination"]')[i].setAttribute("data-selected", "true");
					html.find('[id^="determination"]')[i].style.backgroundColor = "#FFCC33";
					html.find('[id^="determination"]')[i].style.color = "#0F0F0F";
				} else {
					html.find('[id^="determination"]')[i].removeAttribute("data-selected");
					html.find('[id^="determination"]')[i].style.backgroundColor = "#191813";
					html.find('[id^="determination"]')[i].style.color = "#FEFEFF";
				}
			}
		}
		// Checks if details for the Reputation Track was included, this should happen for all Characters!
		if (repPointsMax) {
			for (i = 0; i < repPointsMax; i++) {
				if (i + 1 <= html.find('#total-rep')[0].value) {
					html.find('[id^="rep"]')[i].setAttribute("data-selected", "true");
					html.find('[id^="rep"]')[i].style.backgroundColor = "#CC2233";
					html.find('[id^="rep"]')[i].style.color = "#0F0F0F";
				} else {
					html.find('[id^="rep"]')[i].removeAttribute("data-selected");
					html.find('[id^="rep"]')[i].style.backgroundColor = "#191813";
					html.find('[id^="rep"]')[i].style.color = "#FEFEFF";
				}
			}
		}
		// if this is a starship, it will have shields instead of stress, but will be handled very similarly
		if (shieldsTrackMax) {
			for (i = 0; i < shieldsTrackMax; i++) {
				if (i + 1 <= html.find('#total-shields')[0].value) {
					html.find('[id^="shields"]')[i].setAttribute("data-selected", "true");
					html.find('[id^="shields"]')[i].style.backgroundColor = "#FF2200";
					html.find('[id^="shields"]')[i].style.color = "#0F0F0F";
				} else {
					html.find('[id^="shields"]')[i].removeAttribute("data-selected");
					html.find('[id^="shields"]')[i].style.backgroundColor = "#1111EE";
					html.find('[id^="shields"]')[i].style.color = "#FEFEFF";
				}
			}
		}
		// if this is a starship, it will have power instead of determination, but will be handled very similarly
		if (powerTrackMax) {
			for (i = 0; i < powerTrackMax; i++) {
				if (i + 1 <= html.find('#total-power')[0].value) {
					html.find('[id^="power"]')[i].setAttribute("data-selected", "true");
					html.find('[id^="power"]')[i].style.backgroundColor = "#191813";
					html.find('[id^="power"]')[i].style.color = "#FEFEFF";
				} else {
					html.find('[id^="power"]')[i].removeAttribute("data-selected");
					html.find('[id^="power"]')[i].style.backgroundColor = "#FFCC33";
					html.find('[id^="power"]')[i].style.color = "#0F0F0F";
				}
			}
		}
		// if this is a starship, it will also have crew support level instead of determination, but will be handled very similarly
		if (crewTrackMax) {
			for (i = 0; i < crewTrackMax; i++) {
				if (i + 1 <= html.find('#total-crew')[0].value) {
					html.find('[id^="crew"]')[i].setAttribute("data-selected", "true");
					html.find('[id^="crew"]')[i].style.backgroundColor = "#191813";
					html.find('[id^="crew"]')[i].style.color = "#FEFEFF";
				} else {
					html.find('[id^="crew"]')[i].removeAttribute("data-selected");
					html.find('[id^="crew"]')[i].style.backgroundColor = "#CC2233";
					html.find('[id^="crew"]')[i].style.color = "#0F0F0F";
				}
			}
		}
	}

    // This handles performing an attribute test using the "Perform Check" button.
    async rollAttributeTest(event, selectedAttribute, selectedAttributeValue, selectedDiscipline, selectedDisciplineValue, speaker, isCharacter) {
				event.preventDefault();
				// This creates a dialog to gather details regarding the roll and waits for a response
        let rolldialog = await STARollDialog.create();
        if (rolldialog) {
            let dicePool = rolldialog.get("dicePoolSlider");
						let usingFocus = rolldialog.get("usingFocus") == null ? false : true;
						let usingDetermination = rolldialog.get("usingDetermination") == null ? false : true;
						let complicationRange = parseInt(rolldialog.get("complicationRange"));
						// Once the response has been collected it then sends it to be rolled.
            let staRoll = new STARoll();
            staRoll.performAttributeTest(dicePool, usingFocus, usingDetermination, selectedAttribute, selectedAttributeValue, selectedDiscipline, selectedDisciplineValue, complicationRange, speaker, isCharacter);
        }
    }

    // This handles performing an "item" roll by clicking the item's image.
    async rollGenericItem(event, type, id, speaker) {
        event.preventDefault();
        var item = speaker.items.get(id);
        let staRoll = new STARoll();
        // It will send it to a different method depending what item type was sent to it.
        switch(type) {
            case "item":
                staRoll.performItemRoll(item, speaker);
                break;
            case "focus":
                staRoll.performFocusRoll(item, speaker);
                break;
						case "value":
								staRoll.performValueRoll(item, speaker);
								break;
            case "weapon":
                staRoll.performWeaponRoll(item, speaker);
                break;
            case "armor":
                staRoll.performArmorRoll(item, speaker);
                break;
            case "talent":
                staRoll.performTalentRoll(item, speaker);
								break;
						case "talent":
								staRoll.performInjuryRoll(item, speaker);
								break;
        }
    }
}