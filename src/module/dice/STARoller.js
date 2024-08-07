import {
  STARoll
} from '../roll.js';
import {
  STARollDialog
} from '../apps/roll-dialog.js';


export class STARoller {
    static async Init(controls, html) {
        // Create the main dice roll button
        const diceRollbtn = $(`
            <li class="scene-control sdr-scene-control" data-control="STARoller" title="STA Dice Roller">
                <i class="fa-solid fa-starship"></i>
                <ul class="nested-buttons" style="display: none; list-style: none; padding-left: 20px; margin: 0;">
                </ul>
            </li>
        `);

        // Create the challenge roll button
        const challengerollbtn = $(`
            <li class="scene-control sdr-scene-control nested-button" data-control="STARoller" title="STA Roll Challenge" style="margin-left: 20px;">
                <i class="fa-solid fa-dice"></i>
            </li>
        `);

        // Create the task roll button
        const taskrollbtn = $(`
            <li class="scene-control sdr-scene-control nested-button" data-control="STARoller" title="STA Roll Task" style="margin-left: 20px;">
                <i class="fa-solid fa-dice-d20"></i>
            </li>
        `);

        // Append the nested buttons to the main button's container
        diceRollbtn.find('.nested-buttons').append(challengerollbtn).append(taskrollbtn);

        // Append the main button to the main controls
        html.find(".main-controls").append(diceRollbtn);

        // Add event listener to the main button to toggle the visibility of nested buttons
        diceRollbtn[0].addEventListener('click', ev => {
            const nestedButtons = diceRollbtn.find('.nested-buttons');
            nestedButtons.toggle();
        });


        challengerollbtn[0].addEventListener('click', ev => this.rollChallengeRoll(ev));
        taskrollbtn[0].addEventListener('click', ev => this.rollTaskRoll(ev));
    }


 
    static async rollTaskRoll(event) {

    let selectedAttribute = "STARoller";
    let selectedDiscipline = "STARoller";
    let defaultValue = 2;
    const speaker = {
        type: 'sidebar',
		id: 'sidebar'
        }

    event.preventDefault();
    // This creates a dialog to gather details regarding the roll and waits for a response
    const rolldialog = await STARollDialog.create(true, defaultValue, selectedAttribute);
    if (rolldialog) {
      const dicePool = rolldialog.get('dicePoolSlider');
      const usingFocus = rolldialog.get('usingFocus') == null ? false : true;
	  const usingDedicatedFocus = rolldialog.get('usingDedicatedFocus') == null ? false : true;
      const usingDetermination = rolldialog.get('usingDetermination') == null ? false : true;
      const complicationRange = parseInt(rolldialog.get('complicationRange'));
      const selectedAttributeValue = parseInt(rolldialog.get('selectedAttributeValue'));
      const selectedDisciplineValue = parseInt(rolldialog.get('selectedDisciplineValue'));
      // Once the response has been collected it then sends it to be rolled.
      const staRoll = new STARoll();
      staRoll.performAttributeTest(dicePool, usingFocus, usingDedicatedFocus, usingDetermination,
        selectedAttribute, selectedAttributeValue, selectedDiscipline,
        selectedDisciplineValue, complicationRange, speaker);
    }
   }


    static async rollChallengeRoll (event) {

    let weaponName = "STARoller";
    let defaultValue = 2;

    event.preventDefault();
    // This creates a dialog to gather details regarding the roll and waits for a response
    const rolldialog = await STARollDialog.create(false, defaultValue);
    if (rolldialog) {
      const dicePool = rolldialog.get('dicePoolValue');
      // Once the response has been collected it then sends it to be rolled.
      const staRoll = new STARoll();
      staRoll.performChallengeRoll(dicePool, weaponName);
    }
  }





}
Hooks.on('renderSceneControls', (controls, html) => {
    console.log("STARoller here", html);
    STARoller.Init(controls, html);
});
