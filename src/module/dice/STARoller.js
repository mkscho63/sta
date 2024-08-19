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
      id: 'sidebar'
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
    <label>Number of Dice: <span id="diceValue">2</span></label>
    <input type="range" id="numDice" name="numDice" min="1" max="5" value="2" oninput="document.getElementById('diceValue').textContent = this.value">
  </div>
  <h4>NPC Crew Skill Level</h4>
  <div class="form-group">
    <label><input type="radio" name="skillLevel" value="basic" checked> Basic</label><br>
    <label><input type="radio" name="skillLevel" value="proficient"> Proficient</label><br>
    <label><input type="radio" name="skillLevel" value="talented"> Talented</label><br>
    <label><input type="radio" name="skillLevel" value="exceptional"> Exceptional</label>
  </div>
  <div class="form-group">
    <label>Complication Range: <span id="complicationValue">1</span></label>
    <input type="range" id="complication" name="complication" min="1" max="5" value="1" oninput="document.getElementById('complicationValue').textContent = this.value">
  </div>
  <div class="form-group">
    <label>Difficulty: <input type="number" id="difficulty" name="difficulty" value="2"></label>
  </div>

  <div class="form-group">
    <label>Is the Ship Assisting?<input type="checkbox" id="shipAssist" name="shipAssist" checked></label>
  </div>
  
  <div class="form-group">
    <label>Private GM Roll? <input type="checkbox" id="privateRoll" name="privateRoll"></label>
  </div>

  <h3>NPC Ship</h3>
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
        const token = canvas.tokens.controlled[0];
        const isPrivateRoll = html.find('#privateRoll').is(':checked');
        if (!token) {
          ui.notifications.error("Please select a token for the NPC Ship.");
          return;
        }
        const actor = token.actor;
        const tokenName = token.name || actor.name || "Unknown Ship";

        // Get selected system and department
        let selectedSystem = html.find('.selector.system:checked').val();
        let selectedSystemLabel = html.find(`#${selectedSystem}-selector`).siblings('label').text().trim();
        let selectedSystemValue = html.find(`#${selectedSystem}`).text();
        
        let selectedDepartment = html.find('.selector.department:checked').val();
        let selectedDepartmentLabel = html.find(`#${selectedDepartment}-selector`).siblings('label').text().trim();
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
        const difficulty = parseInt(html.find('#difficulty').val());
        const complicationRange = parseInt(html.find('#complication').val());
        
        const shipNumDice = parseInt(html.find('#shipNumDice').val());
        
        const shipSystems = parseInt(selectedSystemValue);
        const shipDepartments = parseInt(selectedDepartmentValue);
        const shipAttributes = shipSystems + shipDepartments;
        
        let rolls = [];
        let successes = 0;
        let complications = 0;
        
        function processRoll(roll) {
          let rollText = `<span>${roll.toString()}</span>`;
          let success = 0;
          if (roll > 20 - complicationRange) {
            complications++;
            rollText = `<span style="color: red;">${rollText}</span>`;
          } else if (roll <= departments) {
            success = 2;
            rollText = `<strong style="color: yellow;">${rollText}</strong>`;
          } else if (roll <= attributes + departments) {
            success = 1;
            rollText = `<strong style="color: green;">${rollText}</strong>`;
          }
          return { rollText, success };
        }

        function processShipRoll(roll) {
          let rollShipText = `<span>${roll.toString()}</span>`;
          let success = 0;
          if (roll > 20 - complicationRange) {
            complications++;
            rollShipText = `<span style="color: red;">${rollShipText}</span>`;
          } else if (roll <= shipDepartments) {
            success = 2;
            rollShipText = `<strong style="color: yellow;">${rollShipText}</strong>`;
          } else if (roll <= shipAttributes) {
            success = 1;
            rollShipText = `<strong style="color: green;">${rollShipText}</strong>`;
          }
          return { rollText: rollShipText, success };
        }

        // NPC Crew rolls
        for (let i = 0; i < numDice; i++) {
          let { rollText, success } = processRoll(Math.floor(Math.random() * 20) + 1);
          rolls.push(rollText);
          successes += success;
        }
        
        
        let resultMessage = `<p style="text-align: center; font-size:18px; "><b>${tokenName}</b></p>`;
        resultMessage += `<h3>NPC Crew</h3>`;
        resultMessage += `Rolling ${numDice}d20<br>`;
        resultMessage += `Skill Level: ${skillLevel.charAt(0).toUpperCase() + skillLevel.slice(1)}<br>`;
        resultMessage += `Rolls: ${rolls.join(', ')}<br>`;
        resultMessage += `Successes: ${successes}<br>`;
        resultMessage += `(Attributes: ${attributes}, Departments: ${departments})<br>`;
        resultMessage += `<br>`;

        let shipRolls = [];
        let crewSuccesses = successes; // Store crew successes separately
        if (html.find('#shipAssist').is(':checked')) {
          if (crewSuccesses > 0) {
            for (let i = 0; i < shipNumDice; i++) {
              let { rollText, success } = processShipRoll(Math.floor(Math.random() * 20) + 1);
              shipRolls.push(rollText);
              successes += success;
            }
            let shipSuccesses = successes - crewSuccesses; // Calculate ship successes

            resultMessage += `<h3>NPC Ship</h3>`;
            resultMessage += `Rolling ${shipNumDice}d20<br>`;
            resultMessage += `Rolls: ${shipRolls.join(', ')}<br>`;
            resultMessage += `Ship Successes: ${shipSuccesses}<br>`;
            resultMessage += `Total Successes: ${successes}<br>`;
            resultMessage += `Selected Ship System: ${selectedSystemLabel} (${selectedSystemValue})<br>`;
            resultMessage += `Selected Ship Department: ${selectedDepartmentLabel} (${selectedDepartmentValue})<br>`;
          } else {
            resultMessage += `<h3>NPC Ship</h3>`;
            resultMessage += `<strong style="color: red;">NPC Crew did not get a success, so NPC Ship does not roll.</strong><br>`;
          }
        } else {
          resultMessage += `<h3>NPC Ship</h3>`;
          resultMessage += `<strong style="color: red;">Ship Assist is not checked. NPC Ship does not roll.</strong><br>`;
        }
        
        resultMessage += `<br>`;
        resultMessage += `<h3>Results</h3>`;
        resultMessage += `Difficulty: ${difficulty}<br>`;
        resultMessage += `Complication Range: ${21 - complicationRange}-20<br>`;
        
        if (complications > 0) {
          resultMessage += `<strong style="color: red;">Complication!</strong><br>`;
        }
        
        if (successes >= difficulty) {
          resultMessage += `<strong style="color: green;">Success!</strong> (${successes} ≥ ${difficulty})`;
          if (successes > difficulty) {
            let threat = successes - difficulty;
            resultMessage += `<br><strong style="color: orange;">Threat generated: ${threat}</strong>`;
          }
        } else {
          resultMessage += `<strong style="color: red;">Failure.</strong> (${successes} < ${difficulty})`;
        }
        
        ChatMessage.create({
          content: resultMessage,
          whisper: isPrivateRoll ? [game.user.id] : null
        });
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
    html.find('#difficulty').css({
      'width': '35px',
      'min-width': '35px',
      'max-width': '50px'
    });
    const token = canvas.tokens.controlled[0];
    if (!token) {
      ui.notifications.error("Please select a token for the NPC Ship.");
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
