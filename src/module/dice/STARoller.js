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
            <li class="scene-control sta-roller" data-control="STARoller" title="STA Dice Roller">
                <i class="fa-solid fa-hand-spock"></i>
                <ol class="nested-buttons sub-controls control-tools">
                </ol>
            </li>
        `);

    // Create the task roll button
    const taskrollbtn = $(`
            <li class="control-tool nested-button task" data-control="STARoller" title="STA Roll Task">
                <i class="fa-solid fa-dice-d20"></i>
            </li>
        `);

    // Create the challenge roll button
    const challengerollbtn = $(`
            <li class="control-tool nested-button challenge" data-control="STARoller" title="STA Roll Challenge">
                <i class="fa-solid fa-dice"></i>
            </li>
        `);

    // Create the NPC Starship & Crew roll button
    const npcssrollbtn = $(`
            <li class="control-tool nested-button npccrew" data-control="STARoller" title="STA Roll NPC Starship & Crew">
                <i class="fa-solid fa-starship"></i>
            </li>
        `);

    // Append the nested buttons to the main button's container
    diceRollbtn.find('.nested-buttons').append(taskrollbtn).append(challengerollbtn).append(npcssrollbtn);

    // Append the main button to the main controls
    html.find('.main-controls').append(diceRollbtn);

    // Add event listener to the main button to toggle the visibility of nested buttons
    diceRollbtn.on('click', (ev) => {
      const nestedButtons = diceRollbtn.find('.nested-buttons');
      diceRollbtn.toggleClass('active');
      diceRollbtn.find('.sub-controls').toggleClass('active');
      nestedButtons.toggle();
    });

    taskrollbtn.on('click', (ev) => {
      this.rollTaskRoll(ev);
    });

    challengerollbtn.on('click', (ev) => {
      this.rollChallengeRoll(ev);
    });

    npcssrollbtn.on('click', (ev) => {
      this.rollnpcssroll(ev);
    });

  }
 
  static async rollTaskRoll(event) {

    let selectedAttribute = 'STARoller';
    let selectedDiscipline = 'STARoller';
    let defaultValue = 2;
    const speaker = {
      type: 'sidebar',
    };

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

    let weaponName = 'STARoller';
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


static async rollnpcssroll(event) {

let dialogContent = `
<form>
  <h3>NPC Crew</h3>
  <div class="form-group">
	<label><input type="radio" name="skillLevel" value="basic" checked> Basic</label><br>
    <label><input type="radio" name="skillLevel" value="proficient"> Proficient</label><br>
    <label><input type="radio" name="skillLevel" value="talented"> Talented</label><br>
    <label><input type="radio" name="skillLevel" value="exceptional"> Exceptional</label>
  </div>
  <div class="form-group">
    <label>Number of Dice: <span id="diceValue">2</span></label>
    <input type="range" id="numDice" name="numDice" min="1" max="5" value="2" oninput="document.getElementById('diceValue').textContent = this.value">
  </div>
  <h3>NPC Ship</h3>
  <div class="form-group">
    <label>Is the Ship Assisting?<input type="checkbox" id="shipAssist" name="shipAssist"></label>
  </div>  
  <div class="form-group">
    <label>Number of Dice: <span id="shipDiceValue">1</span></label>
    <input type="range" id="shipNumDice" name="shipNumDice" min="1" max="3" value="1" oninput="document.getElementById('shipDiceValue').textContent = this.value">
  </div>
  <div class="form-group">
    <table>
      <tr>
        <td>
          <h3>Ship Systems</h3>
          <div id="shipSystems"></div>
        </td>
        <td>
          <h3>Ship Departments</h3>
          <div id="shipDepartments"></div>
        </td>
      </tr>
    </table>
  </div>
  <div class="form-group">
    <label>Complication Range: <span id="complicationValue">1</span></label>
    <input type="range" id="complication" name="complication" min="1" max="5" value="1" oninput="document.getElementById('complicationValue').textContent = this.value">
  </div>
</form>
`;

new Dialog({
  title: "NPC Crew and Ship Roll",
  content: dialogContent,
  width: 600,
  buttons: {
    roll: {
      label: "Perform Task",
      callback: (html) => {

        // Get selected system and department
        let selectedSystem = html.find('.selector.system:checked').val();
        let selectedSystemLabel = html.find(`#${selectedSystem}-selector`).siblings('label').text().trim().replace(/:$/, '').toLowerCase();
        let selectedSystemValue = html.find(`#${selectedSystem}`).text();
        
        let selectedDepartment = html.find('.selector.department:checked').val();
        let selectedDepartmentLabel = html.find(`#${selectedDepartment}-selector`).siblings('label').text().trim().replace(/:$/, '').toLowerCase();
        let selectedDepartmentValue = html.find(`#${selectedDepartment}`).text();

        const numDice = parseInt(html.find('#numDice').val());
        const skillLevel = html.find('input[name="skillLevel"]:checked').val();
        let attributes, departments;
        switch(skillLevel) {
          case 'basic':
            attributes = 8;
            departments = 1;
            break;
          case 'proficient':
            attributes = 9;
            departments = 2;
            break;
          case 'talented':
            attributes = 10;
            departments = 3;
            break;
          case 'exceptional':
            attributes = 11;
            departments = 4;
            break;
        }
        const complicationRange = parseInt(html.find('#complication').val());
        const shipNumDice = parseInt(html.find('#shipNumDice').val());

        const speakerNPC = {
            type: 'npccharacter',
        };
        let speakerstarship = {
            type: 'starship',
        };

        const token = canvas.tokens.controlled[0];
        if (!token || token.actor.type !== 'starship') {
        selectedSystemLabel = "STARoller";
        selectedSystemValue = parseInt(html.find('#systemValue').val());

        selectedDepartmentLabel = "STARoller";
        selectedDepartmentValue = parseInt(html.find('#departmentValue').val());

        speakerstarship = {
            type: 'sidebar',
        };
        }

      const staRoll = new STARoll();
      staRoll.performAttributeTest(numDice, true, false, false,
        skillLevel, attributes, skillLevel,
        departments, complicationRange, speakerNPC);

      if (html.find('#shipAssist').is(':checked')) {
      staRoll.performAttributeTest(shipNumDice, true, false, false,
        selectedSystemLabel, selectedSystemValue, selectedDepartmentLabel,
        selectedDepartmentValue, complicationRange, speakerstarship);
        }
      }
    }
  },

  render: (html) => {
    html.find('.dialog-button').css({
      'background-color': 'gold',
      'color': 'black',
      'border-radius': '22px',
      'border': 'none',
      'padding': '7px 14px',
      'font-size': '14px',
      'cursor': 'pointer',
      'transition': 'background-color 0.3s ease'
    });
    html.find('.dialog-button').hover(function () {
      $(this).css('background-color', 'yellow');
    }, function () {
      $(this).css('background-color', 'gold');
    });
    html.find('.form-group').css({'width': '375px',});

    const token = canvas.tokens.controlled[0];

if (!token || token.actor.type !== 'starship') {
    let systemsHtml = `
    <div>
      <input type="number" id="systemValue" name="systemValue" min="0" max="20" value="7">
    </div>
    `;
    html.find('#shipSystems').html(systemsHtml);

    let departmentsHtml = `
    <div>
      <input type="number" id="departmentValue" name="departmentValue" min="0" max="10" value="2">
    </div>
    `;
    html.find('#shipDepartments').html(departmentsHtml);

    return;
}

	
    const actor = token.actor;

    // Populate ship systems
    let systemsHtml = '';
    for (let [key, system] of Object.entries(actor.system.systems)) {
      let systemLabel = system.label;
      // Check for specific system label name and change it
      if (systemLabel === "sta.actor.starship.system.communications") {
        systemLabel = "Communications";
      }
      if (systemLabel === "sta.actor.starship.system.computers") {
        systemLabel = "Computers";
      }
      if (systemLabel === "sta.actor.starship.system.engines") {
        systemLabel = "Engines";
      }
      if (systemLabel === "sta.actor.starship.system.sensors") {
        systemLabel = "Sensors";
      }
      if (systemLabel === "sta.actor.starship.system.structure") {
        systemLabel = "Structure";
      }
      if (systemLabel === "sta.actor.starship.system.weapons") {
        systemLabel = "Weapons";
      }
      systemsHtml += `
      <div>
        <input type="radio" id="${key}-selector" name="system" class="selector system" value="${key}">
        <label for="${key}-selector">${systemLabel}: </label>
        <span id="${key}">${system.value}</span>
      </div>
      `;
    }
    html.find('#shipSystems').html(systemsHtml);

    // Populate ship departments
    let departmentsHtml = '';
    for (let [key, department] of Object.entries(actor.system.departments)) {
      let departmentLabel = department.label;
      // Check for specific department label name and change it
      if (departmentLabel === "sta.actor.starship.department.command") {
        departmentLabel = "Command";
      }
      if (departmentLabel === "sta.actor.starship.department.conn") {
        departmentLabel = "Conn";
      }
      if (departmentLabel === "sta.actor.starship.department.engineering") {
        departmentLabel = "Engineering";
      }
      if (departmentLabel === "sta.actor.starship.department.medicine") {
        departmentLabel = "Medicine";
      }
      if (departmentLabel === "sta.actor.starship.department.science") {
        departmentLabel = "Science";
      }
      if (departmentLabel === "sta.actor.starship.department.security") {
        departmentLabel = "Security";
      }
      departmentsHtml += `
      <div>
        <input type="radio" id="${key}-selector" name="department" class="selector department" value="${key}">
        <label for="${key}-selector">${departmentLabel}: </label>
        <span id="${key}">${department.value}</span>
      </div>
      `;
    }
    html.find('#shipDepartments').html(departmentsHtml);
  }
}).render(true);
  }
}
Hooks.on('renderSceneControls', (controls, html) => {
  console.log('STARoller here', html);
  STARoller.Init(controls, html);
});
