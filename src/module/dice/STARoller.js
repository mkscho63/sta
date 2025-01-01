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
            <li class="scene-control sta-roller" data-control="STARoller" title="${game.i18n.localize('sta.apps.staroller')}">
                <i class="fa-solid fa-hand-spock"></i>
                <ol class="nested-buttons sub-controls control-tools">
                </ol>
            </li>
        `);

    // Create the task roll button
    const taskrollbtn = $(`
            <li class="control-tool nested-button task" data-control="STARoller" title="${game.i18n.localize('sta.actor.attdis.task')}">
                <i class="fa-solid fa-dice-d20"></i>
            </li>
        `);

    // Create the challenge roll button
    const challengerollbtn = $(`
            <li class="control-tool nested-button challenge" data-control="STARoller" title="${game.i18n.localize('sta.actor.challenge.roll')}">
                <i class="fa-solid fa-dice"></i>
            </li>
        `);

    // Create the NPC Starship & Crew roll button
    const npcssrollbtn = $(`
            <li class="control-tool nested-button npccrew" data-control="STARoller" title="${game.i18n.localize('sta.roll.npccrew')}">
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
    const selectedAttribute = 'STARoller';
    const selectedDiscipline = 'STARoller';
    const defaultValue = 2;
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


  static async rollChallengeRoll(event) {
    const weaponName = 'STARoller';
    const defaultValue = 2;

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
    const dialogContent = `
    <form>
      <h3>${game.i18n.localize('sta.roll.npccrew')}</h3>
      <div class="form-group">
      <label><input type="radio" name="skillLevel" value="basic" checked> ${game.i18n.localize('sta.roll.npccrewbasic')}</label><br>
        <label><input type="radio" name="skillLevel" value="proficient"> ${game.i18n.localize('sta.roll.npccrewproficient')}</label><br>
        <label><input type="radio" name="skillLevel" value="talented"> ${game.i18n.localize('sta.roll.npccrewtalented')}</label><br>
        <label><input type="radio" name="skillLevel" value="exceptional"> ${game.i18n.localize('sta.roll.npccrewexceptional')}</label>
      </div>
      <div class="form-group">
        <label>${game.i18n.localize('sta.apps.dicepoolwindow')}: <span id="diceValue">2</span></label>
        <input type="range" id="numDice" name="numDice" min="1" max="5" value="2" oninput="document.getElementById('diceValue').textContent = this.value">
      </div>
      <h3>${game.i18n.localize('sta.roll.npcship')}</h3>
      <div class="form-group">
        <label>${game.i18n.localize('sta.roll.shipassisting')}<input type="checkbox" id="shipAssist" name="shipAssist"></label>
      </div>  
      <div class="form-group">
        <label>${game.i18n.localize('sta.apps.dicepoolwindow')}: <span id="shipDiceValue">1</span></label>
        <input type="range" id="shipNumDice" name="shipNumDice" min="1" max="3" value="1" oninput="document.getElementById('shipDiceValue').textContent = this.value">
      </div>
      <div class="form-group">
        <table>
          <tr>
            <td>
              <h3>${game.i18n.localize('sta.actor.starship.system.name')}</h3>
              <div id="shipSystems"></div>
            </td>
            <td>
              <h3>${game.i18n.localize('sta.actor.starship.department.name')}</h3>
              <div id="shipDepartments"></div>
            </td>
          </tr>
        </table>
      </div>
      <div class="form-group">
        <label>${game.i18n.localize('sta.roll.complicationroller')}: <span id="complicationValue">1</span></label>
        <input type="range" id="complication" name="complication" min="1" max="5" value="1" oninput="document.getElementById('complicationValue').textContent = this.value">
      </div>
    </form>`;

    new Dialog({
      title: `${game.i18n.localize('sta.roll.npcshipandcrewroll')}`,
      content: dialogContent,
      width: 600,
      buttons: {
        roll: {
          label: `${game.i18n.localize('sta.apps.rolldice')}`,
          callback: (html) => {
            // Get selected system and department
            const selectedSystem = html.find('.selector.system:checked').val();
            let selectedSystemLabel = html.find(`#${selectedSystem}-selector`).siblings('.original-system-label').val();
            if (selectedSystemLabel) {
              selectedSystemLabel = selectedSystemLabel.substring(26);
            }
            let selectedSystemValue = html.find(`#${selectedSystem}`).text();

            const selectedDepartment = html.find('.selector.department:checked').val();
            let selectedDepartmentLabel = html.find(`#${selectedDepartment}-selector`).siblings('.original-department-label').val();
            if (selectedDepartmentLabel) {
              selectedDepartmentLabel = selectedDepartmentLabel.substring(30);
            }
            let selectedDepartmentValue = html.find(`#${selectedDepartment}`).text();
    
            const numDice = parseInt(html.find('#numDice').val());
            const skillLevel = html.find('input[name="skillLevel"]:checked').val();
            let attributes;
            let departments;
            switch (skillLevel) {
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
            if (!token || (token.actor.type !== 'starship' && token.actor.type !== 'smallcraft')) {
              selectedSystemLabel = 'STARoller';
              selectedSystemValue = parseInt(html.find('#systemValue').val());

              selectedDepartmentLabel = 'STARoller';
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
        html.find('button').addClass('dialog-button roll default');
        const token = canvas.tokens.controlled[0];
    
        // Fallback to input box in case no token is selected
        if (!token || (token.actor.type !== 'starship' && token.actor.type !== 'smallcraft')) {
          const systemsHtml = `
            <div>
              <input type="number" id="systemValue" name="systemValue" min="0" max="20" value="7">
            </div>
            `;
          html.find('#shipSystems').html(systemsHtml);

          const departmentsHtml = `
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
        for (const [key, system] of Object.entries(actor.system.systems)) {
          const systemLabel = game.i18n.localize(system.label);
    
          systemsHtml += `
          <div>
            <input type="radio" id="${key}-selector" name="system" class="selector system" value="${key}">
            <label for="${key}-selector">${systemLabel}: </label>
            <span id="${key}">${system.value}</span>
            <input type="hidden" for="${key}-selector" class="original-system-label" value="${system.label}">
          </div>
          `;
        }
        html.find('#shipSystems').html(systemsHtml);
    
        // Populate ship departments
        let departmentsHtml = '';
        for (const [key, department] of Object.entries(actor.system.departments)) {
          const departmentLabel = game.i18n.localize(department.label);
    
          departmentsHtml += `
          <div>
            <input type="radio" id="${key}-selector" name="department" class="selector department" value="${key}">
            <label for="${key}-selector">${departmentLabel}: </label>
            <span id="${key}">${department.value}</span>
            <input type="hidden" for="${key}-selector" class="original-department-label" value="${department.label}">
          </div>
          `;
        }
        html.find('#shipDepartments').html(departmentsHtml);
      }
    }).render(true);
  }
}
Hooks.on('renderSceneControls', (controls, html) => {
  /* eslint-disable-next-line new-cap */
  STARoller.Init(controls, html);
});
