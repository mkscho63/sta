const api = foundry.applications.api;

export class STARoller {
  /* --------------------------------------------------------------------- */
  /* Roll a task or a challenge.                                      */
  /* --------------------------------------------------------------------- */
  static async _onTaskRoll(event) {
    event.preventDefault();

    const staRoll = new STARoll();
    const defaultValue = '2';
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
          action: 'task',
          default: true,
          label: game.i18n.localize('sta.actor.attdis.task'),
          callback: (event, button, dialog) => {
            const form = dialog.element.querySelector('form');
            return {action: 'task', data: form ? new FormData(form) : null};
          },
        },
        {
          action: 'challenge',
          label: game.i18n.localize('sta.actor.challenge.roll'),
          callback: (event, button, dialog) => {
            const form = dialog.element.querySelector('form');
            return {action: 'challenge', data: form ? new FormData(form) : null};
          },
        }
      ],
      close: () => null,
    });

    if (!formData) return;

    const {action, data} = formData;

    // Shared dice pool
    const dicePool = parseInt(data.get('dicePoolSlider'), 10) || 2;

    if (action === 'challenge') {
    // Challenge roll
      const challengeData = {
        speakerName: 'STARoller',
        dicePool,
        challengeName: ''
      };

      const staRoll = new STARoll();
      return staRoll.performChallengeRoll(challengeData);
    }

    // Task roll
    const usingFocus = data.get('usingFocus') === 'on';
    const usingDedicatedFocus = data.get('usingDedicatedFocus') === 'on';
    const usingDetermination = data.get('usingDetermination') === 'on';
    const complicationRange = parseInt(data.get('complicationRange'), 10);

    const selectedAttributeValue =
    parseInt(document.getElementById('selectedAttributeValue').value, 10) || 0;

    const selectedDisciplineValue =
    parseInt(document.getElementById('selectedDisciplineValue').value, 10) || 0;

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

  /* --------------------------------------------------------------------- */
  /* Roll a task for NPC or starship.                                      */
  /* --------------------------------------------------------------------- */
  static async _onNPCRoll(event) {
    event.preventDefault();

    const selectedTokens = canvas.tokens.controlled;
    const characterToken = selectedTokens.find(
      (t) => t.actor?.type === 'character'
    );
    const starshipTokens = selectedTokens.filter((t) =>
      ['starship', 'smallcraft'].includes(t.actor?.type)
    );

    if (starshipTokens.length > 1) {
      STARoller._rollAllTokens(characterToken, starshipTokens);
    } else {
      STARoller._rollOneToken(characterToken, starshipTokens);
    }
  }

  /* --------------------------------------------------------------------- */
  /* Roll a single starship         .                                      */
  /* --------------------------------------------------------------------- */
  static async _rollOneToken(characterToken, starshipTokens) {
    event.preventDefault();
    const staRoll = new STARoll();
    const calculatedComplicationRange = await staRoll._sceneComplications();

    const starshipToken = starshipTokens[0];
    const character = characterToken?.actor ?? {type: 'npccharacter'};
    const starship = starshipToken?.actor ?? {type: 'npcship'};

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
    const sheetStart = `
  <div>
    <div class="row">
      <div class="tracktitle">${game.i18n.localize(`sta.roll.task.name`)}</div>
      <select id="rollList" name="rollList" class="form-select">
        ${rollList.map((item) => `<option value="${item}">${game.i18n.localize(`sta.roll.${item}`)}</option>`).join('')}
      </select>
    </div>
`;

    const selectedAttr = attributes.find((attr) => characterToken?.actor?.system?.attributes?.[attr]?.selected) ?? '';
    const selectedDisc = disciplines.find((disc) => characterToken?.actor?.system?.disciplines?.[disc]?.selected) ?? '';
    const characterSheet = `
  <div class="title">${character.name}</div>
  <div class="characterRollList">
    <div class="row">
      <div class="tracktitle">${game.i18n.localize(`sta.actor.character.attribute.title`)}</div>
      <select id="attribute" name="attribute" class="form-select">
        ${attributes.map((attr) =>
    `<option value="${attr}" ${attr === selectedAttr ? 'selected' : ''}>
            ${game.i18n.localize(`sta.actor.character.attribute.${attr}`)}
          </option>`
  ).join('')}
      </select>
    </div>
    <div class="row">
      <div class="tracktitle">${game.i18n.localize(`sta.actor.character.discipline.title`)}</div>
      <select id="discipline" name="discipline" class="form-select">
        ${disciplines.map((disc) =>
    `<option value="${disc}" ${disc === selectedDisc ? 'selected' : ''}>
            ${game.i18n.localize(`sta.actor.character.discipline.${disc}`)}
          </option>`
  ).join('')}
      </select>
    </div>
  </div>
  <div class="row">
    <div class="tracktitle">${game.i18n.localize(`sta.apps.focus`)}</div>
    <input type="checkbox" name="usingFocus" id="usingFocus">
  </div>
`;

    const selectedSys = systems.find((sys) => starshipToken?.actor?.system?.systems?.[sys]?.selected) ?? '';
    const selectedDept = departments.find((dept) => starshipToken?.actor?.system?.departments?.[dept]?.selected) ?? '';
    const starshipSheet = `
  <div class="title">${starship.name}</div>
  <div class="starshipRollList">
    <div class="row">
      <div class="tracktitle">${game.i18n.localize(`sta.actor.starship.system.title`)}</div>
      <select id="system" name="system" class="form-select">
        ${systems.map((system) =>
    `<option value="${system}" ${system === selectedSys ? 'selected' : ''}>
            ${game.i18n.localize(`sta.actor.starship.system.${system}`)}
          </option>`
  ).join('')}
      </select>
    </div>
    <div class="row">
      <div class="tracktitle">${game.i18n.localize(`sta.actor.starship.department.title`)}</div>
      <select id="department" name="department" class="form-select">
        ${departments.map((dept) =>
    `<option value="${dept}" ${dept === selectedDept ? 'selected' : ''}>
       ${game.i18n.localize(`sta.actor.starship.department.${dept}`)}
          </option>`
  ).join('')}
      </select>
    </div>
  </div>
`;

    const characterNPCSheet = `
  <div class="title">${game.i18n.localize(`sta.roll.npccrew`)}</div>
  <div class="row NPC">
      <label>${game.i18n.localize(`sta.roll.npccrewpoor`)}<input type="radio" name="skillLevel" value="poor"></label>
      <label>${game.i18n.localize(`sta.roll.npccrewbasic`)}<input type="radio" name="skillLevel" value="basic"></label>
      <label>${game.i18n.localize(`sta.roll.npccrewproficient`)}<input type="radio" name="skillLevel" value="proficient" checked></label>
      <label>${game.i18n.localize(`sta.roll.npccrewtalented`)}<input type="radio" name="skillLevel" value="talented"></label>
      <label>${game.i18n.localize(`sta.roll.npccrewexceptional`)}<input type="radio" name="skillLevel" value="exceptional"></label>
  </div>
  <div class="row">
    <div class="tracktitle">${game.i18n.localize(`sta.apps.focus`)}</div>
    <input type="checkbox" name="usingFocus" id="usingFocus" checked>
  </div>
`;

    const starshipNPCSheet = `
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
    <div class="tracktitle">${game.i18n.localize(`sta.apps.complicationrange`)}</div>
    <input class="numeric-entry" type="number" name="complicationRange" value="${calculatedComplicationRange}" id="complicationRange">
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
</div>
`;

    /* --------------------------------------------------------------------- */
    /* Build final template                                                  */
    /* --------------------------------------------------------------------- */
    let template = '';
    if (!characterToken && !starshipToken) {
      template = sheetStart + starshipNPCSheet + characterNPCSheet + commonForm;
    } else if (!characterToken && starshipToken) {
      template = sheetStart + starshipSheet + characterNPCSheet + commonForm;
    } else if (characterToken && !starshipToken) {
      template = sheetStart + starshipNPCSheet + characterSheet + commonForm;
    } else {
      template = sheetStart + starshipSheet + characterSheet + commonForm;
    }

    /* --------------------------------------------------------------------- */
    /* Show dialog and collect form data                                     */
    /* --------------------------------------------------------------------- */
    const formData = await api.DialogV2.wait({
      window: {
        title: game.i18n.localize('sta.roll.npcshipandcrewroll'),
      },
      position: {height: 'auto', width: 450},
      content: template,
      classes: ['dialogue'],
      render: (event, dialog) => {
        const checkbox = dialog.element.querySelector('#rollList');
        const characterSection = dialog.element.querySelector('.characterRollList');
        const starshipSection = dialog.element.querySelector('.starshipRollList');
        checkbox.addEventListener('change', () => {
          const value = checkbox.value;
          const isBoth = value === 'justrollboth';
          const isCrew = value === 'justrollcrew';
          if (characterSection) {
            characterSection.classList.toggle('hidden', !(isBoth || isCrew));
          }
          if (starshipSection) {
            starshipSection.classList.toggle('hidden', !isBoth);
          }
          dialog.setPosition({height: 'auto'});
        });
      },
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
    const dicePool = parseInt(formData.get('charDicePool')) || 2;
    const complicationRange = parseInt(formData.get('complicationRange')) || calculatedComplicationRange;
    const usingFocus = formData.get('usingFocus') === 'on' || false;
    const usingDedicatedFocus = formData.get('usingDedicatedFocus') === 'on' || false;
    const usingDetermination = formData.get('usingDetermination') === 'on' || false;
    const skillLevel = formData.get('skillLevel') || 'basic';
    const selectedRoll = formData.get('rollList') || '';

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
        poor: [7, 0],
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

  /* --------------------------------------------------------------------- */
  /* Roll a group of starships                                             */
  /* --------------------------------------------------------------------- */
  static async _rollAllTokens(characterToken, starshipTokens) {
    event.preventDefault();

    const staRoll = new STARoll();
    const calculatedComplicationRange = await staRoll._sceneComplications();

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
      'transport',
      'attackpattern',
      'evasiveaction',
      'maneuver',
      'ram',
      'warp',
      'regenerateshields',
      'reveal',
      'scanforweakness',
      'sensorsweep',
      'defensivefire',
      'tractorbeam',
    ];

    const rollOptions = rollList
      .map((item) => `<option value="${item}">${game.i18n.localize(`sta.roll.${item}`)}</option>`)
      .join('');

    const systemOptions = systems
      .map((system) => `<option value="${system}">${game.i18n.localize(`sta.actor.starship.system.${system}`)}</option>`)
      .join('');

    const deptOptions = departments
      .map((dept) => `<option value="${dept}">${game.i18n.localize(`sta.actor.starship.department.${dept}`)}</option>`)
      .join('');

    const template = 'systems/sta/templates/apps/roll-multiple-tokens.hbs';
    const html = await foundry.applications.handlebars.renderTemplate(template, {
      rollOptions,
      systemOptions,
      deptOptions,
      complicationRange: calculatedComplicationRange,
    });

    /* --------------------------------------------------------------------- */
    /* Show dialog and collect form data                                     */
    /* --------------------------------------------------------------------- */
    const formData = await api.DialogV2.wait({
      window: {
        title: game.i18n.localize('sta.roll.npcshipandcrewroll'),
      },
      position: {height: 'auto', width: 450},
      content: html,
      classes: ['dialogue'],
      render: (event, dialog) => {
        const checkbox = dialog.element.querySelector('#rollList');
        const starshipSection = dialog.element.querySelector('.starshipRollList');
        checkbox.addEventListener('change', () => {
          const value = checkbox.value;
          const isBoth = value === 'justrollboth';
          if (starshipSection) {
            starshipSection.classList.toggle('hidden', !isBoth);
          }
          dialog.setPosition({height: 'auto'});
        });
      },
      buttons: [{
        action: 'roll',
        default: true,
        label: game.i18n.localize('sta.apps.rollalltokendice'),
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
    const selectedSystemValue = parseInt(formData.get('systemValue')) || 7;
    const selectedDepartmentValue = parseInt(formData.get('departmentValue')) || 2;
    let selectedSystem = formData.get('system') || '';
    let selectedDepartment = formData.get('department') || '';
    const dicePool = parseInt(formData.get('charDicePool')) || 2;
    const complicationRange = parseInt(formData.get('complicationRange')) || calculatedComplicationRange;
    const skillLevel = formData.get('skillLevel') || 'basic';
    const selectedRoll = formData.get('rollList') || '';

    /* --------------------------------------------------------------------- */
    /* Roll presets logic                                                    */
    /* --------------------------------------------------------------------- */
    const rollPresets = {
      attack: ['weapons', 'security'],
      transport: ['sensors', 'science'],
      attackpattern: ['engines', 'conn'],
      evasiveaction: ['structure', 'conn'],
      maneuver: ['engines', 'conn'],
      ram: ['engines', 'conn'],
      warp: ['engines', 'conn'],
      regenerateshields: ['structure', 'engineering'],
      reveal: ['sensors', 'science'],
      scanforweakness: ['sensors', 'security'],
      sensorsweep: ['sensors', 'science'],
      defensivefire: ['weapons', 'security'],
      tractorbeam: ['structure', 'security'],
    };

    if (rollPresets[selectedRoll]) {
      [
        selectedSystem,
        selectedDepartment,
      ] = rollPresets[selectedRoll];
    }

    let selectedAttributeValue = 0;
    let selectedDisciplineValue = 0;
    const npcValues = {
      poor: [7, 0],
      basic: [8, 1],
      proficient: [9, 2],
      talented: [10, 3],
      exceptional: [11, 4],
    };
    [
      selectedAttributeValue,
      selectedDisciplineValue,
    ] = npcValues[skillLevel] ?? [8, 1];

    /* --------------------------------------------------------------------- */
    /* Starship values                                                       */
    /* --------------------------------------------------------------------- */
    for (const starshipToken of starshipTokens) {
      const starship = starshipToken.actor;
      const selectedSystemValue = starship.system.systems[selectedSystem]?.value ?? 0;
      const selectedDepartmentValue = starship.system.departments[selectedDepartment]?.value ?? 0;

      /* --------------------------------------------------------------------- */
      /* Assemble final task data                                              */
      /* --------------------------------------------------------------------- */
      const taskData = {
        speakerName: 'NPC Crew',
        starshipName: starship.name,
        rolltype: 'character2e',
        selectedAttribute: '',
        selectedAttributeValue,
        selectedDiscipline: '',
        selectedDisciplineValue,
        selectedSystem,
        selectedSystemValue,
        selectedDepartment,
        selectedDepartmentValue,
        dicePool: 2,
        usingFocus: true,
        usingDedicatedFocus: false,
        usingDetermination: false,
        complicationRange,
        skillLevel,
      };

      /* --------------------------------------------------------------------- */
      /* Send the NPC roll to STARoll                                          */
      /* --------------------------------------------------------------------- */
      await staRoll.rollNPCTask(taskData);
    }
  }
}
