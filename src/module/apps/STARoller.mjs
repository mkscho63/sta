const api = foundry.applications.api;

export class STARoller {
  /* Roll a task. */
  static async _onTaskRoll(event) {
    event.preventDefault();

    const staRoll = new STARoll();
    const defaultValue = '2';
    let dicePool = defaultValue;
    let usingFocus = false;
    let usingDedicatedFocus = false;
    let usingDetermination = false;
    let complicationRange = 1;

    const calculatedComplicationRange = await staRoll._sceneComplications();

    const template = 'systems/sta/templates/apps/dicepool-attribroller.hbs';
    const html = await foundry.applications.handlebars.renderTemplate(template, {
      defaultValue,
      calculatedComplicationRange,
    });

    const formData = await api.DialogV2.wait({
      window: {
        title: game.i18n.localize('sta.apps.dicepoolwindow'),
      },
      position: {
        height: 'auto',
        width: 350,
      },
      content: html,
      classes: ['dialogue'],
      buttons: [
        {
          action: 'roll',
          default: true,
          label: game.i18n.localize('sta.apps.rolldice'),
          callback: (event, button, dialog) => {
            const form = dialog.element.querySelector('form');
            return form ? new FormData(form) : null;
          },
        },
      ],
      close: () => null,
    });

    if (!formData) return;

      dicePool = parseInt(formData.get('dicePoolSlider'), 10);
      usingFocus = formData.get('usingFocus') === 'on';
      usingDedicatedFocus = formData.get('usingDedicatedFocus') === 'on';
      usingDetermination = formData.get('usingDetermination') === 'on';
      complicationRange = parseInt(formData.get('complicationRange'), 10);

    const selectedAttributeValue = parseInt(
      document.getElementById('selectedAttributeValue').value,
      10
    ) || 0;
    const selectedDisciplineValue = parseInt(
      document.getElementById('selectedDisciplineValue').value,
      10
    ) || 0;

    const taskData = {
      speakerName: 'STARoller',
      selectedAttributeValue,
      selectedDisciplineValue,
      rolltype: 'sidebar',
      dicePool,
      usingFocus,
      usingDedicatedFocus,
      usingDetermination,
      complicationRange,
    };

    await staRoll.rollTask(taskData);
  }

  /* Roll a challenge. */
  static async _onChallengeRoll(event) {
    event.preventDefault();

    const defaultValue = 2;
    const challengeName = '';
    const template = 'systems/sta/templates/apps/dicepool-challenge.hbs';
    const html = await foundry.applications.handlebars.renderTemplate(template, {
      defaultValue,
    });

    const formData = await api.DialogV2.wait({
      window: {
        title: game.i18n.localize('sta.apps.dicepoolwindow'),
      },
      position: {
        height: 'auto',
        width: 350,
      },
      content: html,
      classes: ['dialogue'],
      buttons: [
        {
          action: 'roll',
          default: true,
          label: game.i18n.localize('sta.apps.rolldice'),
          callback: (event, button, dialog) => {
            const form = dialog.element.querySelector('form');
            return form ? new FormData(form) : null;
          },
        },
      ],
      close: () => null,
    });

    if (!formData) return;

    const dicePool = formData?.get('dicePoolValue') ?? defaultValue;
    const challengeData = {
      speakerName: 'STARoller',
      dicePool,
      challengeName,
    };
    const staRoll = new STARoll();
    staRoll.performChallengeRoll(challengeData);
  }

  /* Roll a task for NPC or starship. */
  static async _onNPCRoll(event) {
    event.preventDefault();

    const staRoll = new STARoll();
    const calculatedComplicationRange = await staRoll._sceneComplications();

    /* --------------------------------------------------------------------- */
    /* Gather tokens, actors and common data                                 */
    /* --------------------------------------------------------------------- */
    const selectedTokens = canvas.tokens.controlled;
    const characterToken = selectedTokens.find(
      (t) => t.actor?.type === 'character'
    );
    const starshipToken = selectedTokens.find((t) =>
      ['starship', 'smallcraft'].includes(t.actor?.type)
    );

    const character = characterToken?.actor ?? { type: 'npccharacter' };
    const starship = starshipToken?.actor ?? { type: 'npcship' };

    const attributes = [
      'control',
      'daring',
      'fitness',
      'insight',
      'presence',
      'reason',
    ];
    const disciplines = [
      'command',
      'conn',
      'engineering',
      'security',
      'medicine',
      'science',
    ];
    const systems = [
      'communications',
      'computers',
      'engines',
      'sensors',
      'structure',
      'weapons',
    ];
    const departments = [
      'command',
      'conn',
      'engineering',
      'security',
      'medicine',
      'science',
    ];
    const rollList = [
      'justrollboth',
      'justrollcrew',
      'melee',
      'ranged',
      'attack',
      'firstaid',
      'direct',
      'guard',
      'sprint',
      'rally',
      'damagecontrol',
      'transport',
      'attackpattern',
      'evasiveaction',
      'maneuver',
      'ram',
      'warp',
      'regainpower',
      'regenerateshields',
      'reveal',
      'scanforweakness',
      'sensorsweep',
      'defensivefire',
      'tractorbeam',
    ];

    /* --------------------------------------------------------------------- */
    /* Templates                                                             */
    /* --------------------------------------------------------------------- */
    const characterSheet = `
  <div class="title">${character.name}</div>
  <div class="row">
    <div class="tracktitle">${game.i18n.localize(`sta.actor.character.attribute.title`)}</div>
    <select id="attribute" name="attribute" class="form-select">
      ${attributes.map((attr) => `<option value="${attr}">${game.i18n.localize(`sta.actor.character.attribute.${attr}`)}</option>`).join('')}
    </select>
  </div>
  <div class="row">
    <div class="tracktitle">${game.i18n.localize(`sta.actor.character.discipline.title`)}</div>
    <select id="discipline" name="discipline" class="form-select">
      ${disciplines.map((disc) => `<option value="${disc}">${game.i18n.localize(`sta.actor.character.discipline.${disc}`)}</option>`).join('')}
    </select>
  </div>
  <div class="row">
    <div class="tracktitle">${game.i18n.localize(`sta.apps.focus`)}</div>
    <input type="checkbox" name="usingFocus" id="usingFocus">
  </div>
`;

    const starshipSheet = `
  <div>
    <div class="title">${starship.name}</div>
    <div class="row">
      <div class="tracktitle">${game.i18n.localize(`sta.actor.starship.system.title`)}</div>
      <select id="system" name="system" class="form-select">
        ${systems.map((system) => `<option value="${system}">${game.i18n.localize(`sta.actor.starship.system.${system}`)}</option>`).join('')}
      </select>
    </div>
    <div class="row">
      <div class="tracktitle">${game.i18n.localize(`sta.actor.starship.department.title`)}</div>
      <select id="department" name="department" class="form-select">
        ${departments.map((dept) => `<option value="${dept}">${game.i18n.localize(`sta.actor.starship.department.${dept}`)}</option>`).join('')}
      </select>
    </div>
`;

    const characterNPCSheet = `
  <div class="title">${game.i18n.localize(`sta.roll.npccrew`)}</div>
  <div class="row">
    <div class="tracktitle">${game.i18n.localize(`sta.roll.npccrew`)}</div>
    <label><input type="radio" name="skillLevel" value="basic" checked>${game.i18n.localize(`sta.roll.npccrewbasic`)}</label><br>
    <label><input type="radio" name="skillLevel" value="proficient">${game.i18n.localize(`sta.roll.npccrewproficient`)}</label><br>
    <label><input type="radio" name="skillLevel" value="talented">${game.i18n.localize(`sta.roll.npccrewtalented`)}</label><br>
    <label><input type="radio" name="skillLevel" value="exceptional">${game.i18n.localize(`sta.roll.npccrewexceptional`)}</label>
  </div>
  <div class="row">
    <div class="tracktitle">${game.i18n.localize(`sta.apps.focus`)}</div>
    <input type="checkbox" name="usingFocus" id="usingFocus" checked>
  </div>
`;

    const starshipNPCSheet = `
  <div>
    <div class="title">${game.i18n.localize(`sta.roll.npcship`)}</div>
    <div class="row">
      <div class="tracktitle">${game.i18n.localize(`sta.actor.starship.system.title`)}</div>
      <input type="number" name="systemValue" min="1" value="7" class="numeric-entry" id="systemValue">
    </div>
    <div class="row">
      <div class="tracktitle">${game.i18n.localize(`sta.actor.starship.department.title`)}</div>
      <input type="number" name="departmentValue" min="1" value="2" class="numeric-entry" id="departmentValue">
    </div>
`;

    const commonForm = `
  <div class="row">
    <div class="tracktitle">${game.i18n.localize(`sta.apps.dedicatedfocus`)}</div>
    <input type="checkbox" name="usingDedicatedFocus" id="usingDedicatedFocus">
  </div>
  <div class="row">
    <div class="tracktitle">${game.i18n.localize(`sta.apps.determination`)}</div>
    <input type="checkbox" name="usingDetermination" id="usingDetermination">
  </div>
  <div class="row">
    <div class="flex-1">
      <div class="tracktitle">${game.i18n.localize(`sta.apps.pool`)}</div>
    </div>
    <div class="flex-column flex-1">
      <div class="row">
        <span class="label align-left flex-1">1</span>
        <span class="centered flex-1"></span>
        <span class="label centered flex-1">2</span>
        <span class="centered flex-1"></span>
        <span class="label centered flex-1">3</span>
        <span class="centered flex-1"></span>
        <span class="label centered flex-1">4</span>
        <span class="centered flex-1"></span>
        <span class="label centered flex-1">5</span>
      </div>
      <input type="range" name="charDicePool" min="1" max="5" value="2" class="slider" id="char-dice-pool">
    </div>
  </div>
  <div class="row">
    <div class="flex-1">
      <div class="tracktitle">${game.i18n.localize(`sta.roll.complicationrange`)}</div>
    </div>
    <div class="flex-column flex-1">
      <div class="row">
        <span class="label align-left flex-1">20</span>
        <span class="centered flex-1"></span>
        <span class="label centered flex-1">19+</span>
        <span class="centered flex-1"></span>
        <span class="label centered flex-1">18+</span>
        <span class="centered flex-1"></span>
        <span class="label centered flex-1">17+</span>
        <span class="centered flex-1"></span>
        <span class="label centered flex-1">16+</span>
      </div>
      <input type="range" name="complicationRange" min="1" max="5" value="${calculatedComplicationRange}" class="slider" id="complication-range">
    </div>
  </div>
  <div class="row">
    <div class="tracktitle">${game.i18n.localize(`sta.roll.task.name`)}</div>
    <select id="rollList" name="rollList" class="form-select">
      ${rollList.map((item) => `<option value="${item}">${game.i18n.localize(`sta.roll.${item}`)}</option>`).join('')}
    </select>
  </div>
</div>
`;

    /* --------------------------------------------------------------------- */
    /* Build final template                                                  */
    /* --------------------------------------------------------------------- */
    let template = '';
    if (!characterToken && !starshipToken) {
      template = starshipNPCSheet + characterNPCSheet + commonForm;
    } else if (!characterToken && starshipToken) {
      template = starshipSheet + characterNPCSheet + commonForm;
    } else if (characterToken && !starshipToken) {
      template = starshipNPCSheet + characterSheet + commonForm;
    } else {
      template = starshipSheet + characterSheet + commonForm;
    }

    /* --------------------------------------------------------------------- */
    /* Show dialog and collect form data                                     */
    /* --------------------------------------------------------------------- */
    const formData = await api.DialogV2.wait({
      window: {
        title: game.i18n.localize('sta.roll.npcshipandcrewroll'),
      },
      position: { height: 'auto', width: 450 },
      content: template,
      classes: ['dialogue'],
      buttons: [{
        action: 'roll',
        default: true,
        label: game.i18n.localize('sta.apps.rolldice'),
        callback: (event, button, dialog) => {
          const form = dialog.element.querySelector('form');
          return form ? new FormData(form) : null;
        },
      },],
      close: () => null,
    });
    if (!formData) return;

    /* --------------------------------------------------------------------- */
    /* Pull data from form                                                   */
    /* --------------------------------------------------------------------- */
    let selectedAttributeValue = 7;
    let selectedDisciplineValue = 2;
    let selectedSystemValue = parseInt(formData.get('systemValue')) || 7;
    let selectedDepartmentValue = parseInt(formData.get('departmentValue')) || 2;
    let selectedAttribute = formData.get('attribute') || '';
    let selectedDiscipline = formData.get('discipline') || '';
    let selectedSystem = formData.get('system') || '';
    let selectedDepartment = formData.get('department') || '';
    let dicePool = parseInt(formData.get('charDicePool')) || 2;
    let complicationRange = parseInt(formData.get('complicationRange')) || calculatedComplicationRange;
    let usingFocus = formData.get('usingFocus') === 'on' || false;
    let usingDedicatedFocus = formData.get('usingDedicatedFocus') === 'on' || false;
    let usingDetermination = formData.get('usingDetermination') === 'on' || false;
    let skillLevel = formData.get('skillLevel') || 'basic';
    let selectedRoll = formData.get('rollList') || '';

    /* --------------------------------------------------------------------- */
    /* Roll presets logic                                                   */
    /* --------------------------------------------------------------------- */
    const rollPresets = {
      melee: ['daring', 'security', 'none', 'none'],
      ranged: ['control', 'security', 'none', 'none'],
      attack: ['control', 'security', 'weapons', 'security'],
      firstaid: ['daring', 'medicine', 'none', 'none'],
      direct: ['control', 'command', 'none', 'none'],
      guard: ['insight', 'security', 'none', 'none'],
      sprint: ['fitness', 'conn', 'none', 'none'],
      rally: ['presence', 'command', 'none', 'none'],
      damagecontrol: ['presence', 'engineering', 'none', 'none'],
      transport: ['control', 'engineering', 'sensors', 'science'],
      attackpattern: ['control', 'conn', 'engines', 'conn'],
      evasiveaction: ['daring', 'conn', 'structure', 'conn'],
      maneuver: ['control', 'conn', 'engines', 'conn'],
      ram: ['daring', 'conn', 'engines', 'conn'],
      warp: ['control', 'conn', 'engines', 'conn'],
      regainpower: ['control', 'engineering', 'none', 'none'],
      regenerateshields: ['control', 'engineering', 'structure', 'engineering'],
      reveal: ['reason', 'science', 'sensors', 'science'],
      scanforweakness: ['control', 'science', 'sensors', 'security'],
      sensorsweep: ['reason', 'science', 'sensors', 'science'],
      defensivefire: ['daring', 'security', 'weapons', 'security'],
      tractorbeam: ['control', 'security', 'structure', 'security'],
    };

    if (rollPresets[selectedRoll]) {
      [
        selectedAttribute,
        selectedDiscipline,
        selectedSystem,
        selectedDepartment,
      ] = rollPresets[selectedRoll];
    } else if (selectedRoll === 'justrollcrew') {
      selectedSystem = selectedDepartment = 'none';
    }

    /* --------------------------------------------------------------------- */
    /* NPC values (if no character token)                                    */
    /* --------------------------------------------------------------------- */
    if (!characterToken) {
      const npcValues = {
        basic: [8, 1],
        proficient: [9, 2],
        talented: [10, 3],
        exceptional: [11, 4],
      };
      [
        selectedAttributeValue,
        selectedDisciplineValue,
      ] = npcValues[skillLevel] ?? [8, 1];
    } else {
      selectedAttributeValue =
        character.system.attributes[selectedAttribute]?.value ?? 0;
      selectedDisciplineValue =
        character.system.disciplines[selectedDiscipline]?.value ?? 0;
    }

    /* --------------------------------------------------------------------- */
    /* Starship values (if a starship token)                                 */
    /* --------------------------------------------------------------------- */
    if (starshipToken) {
      selectedSystemValue =
        starship.system.systems[selectedSystem]?.value ?? 0;
      selectedDepartmentValue =
        starship.system.departments[selectedDepartment]?.value ?? 0;
    }

    /* --------------------------------------------------------------------- */
    /* Assemble final task data                                              */
    /* --------------------------------------------------------------------- */
    const taskData = {
      speakerName: character.name || 'NPC Crew',
      starshipName: starship.name || 'NPC Ship',
      rolltype: 'character2e',
      selectedAttribute,
      selectedAttributeValue,
      selectedDiscipline,
      selectedDisciplineValue,
      selectedSystem,
      selectedSystemValue,
      selectedDepartment,
      selectedDepartmentValue,
      dicePool,
      usingFocus,
      usingDedicatedFocus,
      usingDetermination,
      complicationRange,
      skillLevel,
    };

    /* --------------------------------------------------------------------- */
    /* Send the NPC roll to STARoll                                          */
    /* --------------------------------------------------------------------- */
    await staRoll.rollNPCTask(taskData);
  }
}
