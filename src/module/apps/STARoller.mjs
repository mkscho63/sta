const api = foundry.applications.api;
export class STARoller {
  static async _onTaskRoll(event) {
    event.preventDefault();
    const selectedAttribute = null;
    const selectedDiscipline = null;

    const defaultValue = 2;
    const speaker = {
      type: 'sidebar'
    };
    const template = 'systems/sta/templates/apps/dicepool-attribroller.hbs';
    const html = await foundry.applications.handlebars.renderTemplate(template, {
      defaultValue
    });
    const formData = await api.DialogV2.wait({
      window: {
        title: game.i18n.localize('sta.apps.dicepoolwindow')
      },
      position: {
        height: 'auto',
        width: 350
      },
      content: html,
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
    if (formData) {
      const dicePool = parseInt(formData.get('dicePoolSlider'), 10) || defaultValue;
      const selectedAttributeValue = parseInt(document.getElementById('selectedAttributeValue').value, 10) || 0;
      const selectedDisciplineValue = parseInt(document.getElementById('selectedDisciplineValue').value, 10) || 0;
      const usingFocus = formData.get('usingFocus') === 'on';
      const usingDedicatedFocus = formData.get('usingDedicatedFocus') === 'on';
      const usingDetermination = formData.get('usingDetermination') === 'on';
      const complicationRange = parseInt(formData.get('complicationRange'), 10) || 1;
      const staRoll = new STARoll();
      staRoll.performAttributeTest(
        dicePool,
        usingFocus,
        usingDedicatedFocus,
        usingDetermination,
        selectedAttribute,
        selectedAttributeValue,
        selectedDiscipline,
        selectedDisciplineValue,
        complicationRange,
        speaker
      );
    }
  }

  static async _onChallengeRoll(event) {
    event.preventDefault();
    const defaultValue = 2;
    const speaker = game.user;
    const weaponName = '';
    const template = 'systems/sta/templates/apps/dicepool-challenge.hbs';
    const html = await foundry.applications.handlebars.renderTemplate(template, {
      defaultValue
    });
    const formData = await api.DialogV2.wait({
      window: {
        title: game.i18n.localize('sta.apps.dicepoolwindow')
      },
      position: {
        height: 'auto',
        width: 350
      },
      content: html,
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
    const dicePool = formData?.get('dicePoolValue') || defaultValue;
    const staRoll = new STARoll();
    staRoll.performChallengeRoll(dicePool, weaponName, speaker);
  }

  static async _onNPCRoll(event) {
let selectedTokens = canvas.tokens.controlled;
let characterToken = selectedTokens.find(t => t.actor?.type === "character");
let starshipToken = selectedTokens.find(t => ["starship", "smallcraft"].includes(t.actor?.type));
let character = characterToken?.actor ?? { type: 'npccharacter' };
let starship = starshipToken?.actor ?? { type: 'npcship' };

if (starshipToken?.actor?.type === "smallcraft") {
  starship.type = "starship";
}

let attributes = ["control", "daring", "fitness", "insight", "presence", "reason"];
let disciplines = ["command", "conn", "engineering", "security", "medicine", "science"];
let systems = ["communications", "computers", "engines", "sensors", "structure", "weapons"];
let departments = ["command", "conn", "engineering", "security", "medicine", "science"];
let rollList = [
  "justrollboth", "justrollcrew", "melee", "ranged", "attack", "firstaid", "direct", "guard", "sprint",
  "rally", "damagecontrol", "transport", "attackpattern", "evasiveaction", "maneuver", "ram", "warp",
  "regainpower", "regenerateshields", "reveal", "scanforweakness", "sensorsweep", "defensivefire", "tractorbeam"
];

let roller = new STARoll();
let AttributeValue = 0;
let DisciplineValue = 0;
let SystemValue = 0;
let DepartmentValue = 0;

let characterSheet = `
  <div class="title">${character.name}</div>
  <div class="row">
    <div class="tracktitle">${game.i18n.localize(`sta.actor.character.attribute.title`)}</div>
    <select id="attribute" class="form-select">
      ${attributes.map(attr => `<option value="${attr}">${game.i18n.localize(`sta.actor.character.attribute.${attr}`)}</option>`).join("")}
    </select>
  </div>
  <div class="row">
    <div class="tracktitle">${game.i18n.localize(`sta.actor.character.discipline.title`)}</div>
    <select id="discipline" class="form-select">
      ${disciplines.map(disc => `<option value="${disc}">${game.i18n.localize(`sta.actor.character.discipline.${disc}`)}</option>`).join("")}
    </select>
  </div>
  <div class="row">
    <div class="tracktitle">${game.i18n.localize(`sta.apps.focus`)}</div>
    <input type="checkbox" name="usingFocus" id="usingFocus">
  </div>
`;

let starshipSheet = `
  <div>
    <div class="title">${starship.name}</div>
    <div class="row">
      <div class="tracktitle">${game.i18n.localize(`sta.actor.starship.system.title`)}</div>
      <select id="system" class="form-select">
        ${systems.map(system => `<option value="${system}">${game.i18n.localize(`sta.actor.starship.system.${system}`)}</option>`).join("")}
      </select>
    </div>
    <div class="row">
      <div class="tracktitle">${game.i18n.localize(`sta.actor.starship.department.title`)}</div>
      <select id="department" class="form-select">
        ${departments.map(dept => `<option value="${dept}">${game.i18n.localize(`sta.actor.starship.department.${dept}`)}</option>`).join("")}
      </select>
    </div>
`;

let characterNPCSheet = `
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

let starshipNPCSheet = `
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

let commonForm = `
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
        ${[1, 2, 3, 4, 5].map(n => `
          <span class="label ${n === 1 ? "align-left" : "centered"} flex-1">${n}</span>
          <span class="centered flex-1"></span>
        `).join("")}
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
        ${[20, "19+", "18+", "17+", "16+"].map(label => `
          <span class="label ${label === 20 ? "align-left" : "centered"} flex-1">${label}</span>
          <span class="centered flex-1"></span>
        `).join("")}
      </div>
      <input type="range" name="complicationRange" min="1" max="5" value="1" class="slider" id="complication-range">
    </div>
  </div>
  <div class="row">
    <div class="tracktitle">${game.i18n.localize(`sta.roll.task.name`)}</div>
    <select id="rollList" class="form-select">
      ${rollList.map(item => `<option value="${item}">${game.i18n.localize(`sta.roll.${item}`)}</option>`).join("")}
    </select>
  </div>
</div>
`;

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

const formData = await foundry.applications.api.DialogV2.wait({
  window: { title: game.i18n.localize(`sta.roll.npcshipandcrewroll`) },
  position: { height: 'auto', width: 450 },
  content: template,
  classes: ['dialogue'],
  buttons: [{
    action: 'roll',
    default: true,
    label: game.i18n.localize('sta.apps.rolldice'),
    class: 'button100',
    callback: (event, button, dialog) => {
      return {
        selectedAttribute: dialog.element.querySelector('#attribute')?.value,
        selectedDiscipline: dialog.element.querySelector('#discipline')?.value,
        selectedSystem: dialog.element.querySelector('#system')?.value,
        selectedDepartment: dialog.element.querySelector('#department')?.value,
        charDicePool: parseInt(dialog.element.querySelector('#char-dice-pool')?.value),
        ComplicationRange: parseInt(dialog.element.querySelector('#complication-range')?.value),
        usingFocus: dialog.element.querySelector('#usingFocus')?.checked || false,
        usingDedicatedFocus: dialog.element.querySelector('#usingDedicatedFocus')?.checked,
        usingDetermination: dialog.element.querySelector('#usingDetermination')?.checked,
        skillLevel: dialog.element.querySelector('input[name="skillLevel"]:checked')?.value,
        systemValue: parseInt(dialog.element.querySelector('input[name="systemValue"]')?.value),
        departmentValue: parseInt(dialog.element.querySelector('input[name="departmentValue"]')?.value),
        selectedRoll: dialog.element.querySelector('#rollList')?.value,
      };
    }
  }],
  close: () => null
});

if (!formData) return;

let {
  selectedAttribute,
  selectedDiscipline,
  selectedSystem,
  selectedDepartment,
  charDicePool,
  ComplicationRange,
  usingFocus,
  usingDedicatedFocus,
  usingDetermination,
  skillLevel,
  systemValue,
  departmentValue,
  selectedRoll
} = formData;

const rollPresets = {
  melee: ["daring", "security", "none", "none"],
  ranged: ["control", "security", "none", "none"],
  attack: ["control", "security", "weapons", "security"],
  firstaid: ["daring", "medicine", "none", "none"],
  direct: ["control", "command", "none", "none"],
  guard: ["insight", "security", "none", "none"],
  sprint: ["fitness", "conn", "none", "none"],
  rally: ["presence", "command", "none", "none"],
  damagecontrol: ["presence", "engineering", "none", "none"],
  transport: ["control", "engineering", "sensors", "science"],
  attackpattern: ["control", "conn", "engines", "conn"],
  evasiveaction: ["daring", "conn", "structure", "conn"],
  maneuver: ["control", "conn", "engines", "conn"],
  ram: ["daring", "conn", "engines", "conn"],
  warp: ["control", "conn", "engines", "conn"],
  regainpower: ["control", "engineering", "none", "none"],
  regenerateshields: ["control", "engineering", "structure", "engineering"],
  reveal: ["reason", "science", "sensors", "science"],
  scanforweakness: ["control", "science", "sensors", "security"],
  sensorsweep: ["reason", "science", "sensors", "science"],
  defensivefire: ["daring", "security", "weapons", "security"],
  tractorbeam: ["control", "security", "structure", "security"]
};

if (rollPresets[selectedRoll]) {
  [selectedAttribute, selectedDiscipline, selectedSystem, selectedDepartment] = rollPresets[selectedRoll];
} else if (selectedRoll === 'justrollcrew') {
  selectedSystem = selectedDepartment = 'none';
}

if (!characterToken) {
  const npcValues = {
    basic: [8, 1, 'basic'],
    proficient: [9, 2, 'proficient'],
    talented: [10, 3, 'talented'],
    exceptional: [11, 4, 'exceptional']
  };
  [AttributeValue, DisciplineValue, selectedAttribute] = npcValues[skillLevel] ?? [8, 1, 'basic'];
} else {
  AttributeValue = character.system.attributes[selectedAttribute]?.value ?? 0;
  DisciplineValue = character.system.disciplines[selectedDiscipline]?.value ?? 0;
}

if (!starshipToken) {
  selectedSystem = "NPC";
  SystemValue = systemValue;
  DepartmentValue = departmentValue;
} else {
  SystemValue = starship.system.systems[selectedSystem]?.value ?? 0;
  DepartmentValue = starship.system.departments[selectedDepartment]?.value ?? 0;
}

if (usingDetermination) {
  charDicePool = Math.max(1, charDicePool - 1);
}

roller.performAttributeTest(
  charDicePool,
  usingFocus,
  usingDedicatedFocus,
  usingDetermination,
  selectedAttribute,
  AttributeValue,
  selectedDiscipline,
  DisciplineValue,
  ComplicationRange,
  character
);

if (selectedDepartment !== 'none') {
  roller.performAttributeTest(
    1,
    true,
    false,
    false,
    selectedSystem,
    SystemValue,
    selectedDepartment,
    DepartmentValue,
    ComplicationRange,
    starship
  );
}
  }
}
