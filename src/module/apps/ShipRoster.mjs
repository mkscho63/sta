const api = foundry.applications.api;

export class ShipRoster extends api.HandlebarsApplicationMixin(api.ApplicationV2) {
  static instance = null;

  static async _onShipRoster(event) {
    event.preventDefault();

    const starships = game.actors.filter((a) => a.type === 'starship');
    const visibleShips = starships.filter((s) =>
      s.testUserPermission(game.user, 'OBSERVER')
    );

    if (visibleShips.length === 0) {
      ui.notifications.warn(game.i18n.localize('sta.apps.notanobserver'));
      return;
    }

    if (!ShipRoster.instance) ShipRoster.instance = new ShipRoster();
    ShipRoster.instance.render(true);
  }

  static DEFAULT_OPTIONS = {
    classes: ['console-container'],
    actions: {
      openActor: ShipRoster._onOpenActor,
      onAttributeTest: ShipRoster._onAttributeTest,
      onChangeView: ShipRoster._onChangeView,
    },
    form: {
      submitOnChange: true,
      closeOnSubmit: false,
    },
    window: {
      frame: true,
      positioned: true,
      width: 'auto',
      height: 'auto',
    },
  };

  static PARTS = {
    tracker: {
      template: 'systems/sta/templates/apps/ship-roster.hbs',
    },
  };

  constructor(...args) {
    super(...args);
    this.options.window.title = game.i18n.localize('sta.apps.roster');
  }

  async _prepareContext(options) {
    const context = await super._prepareContext(options);

    const staRoll = new STARoll();
    const calculatedComplicationRange = await staRoll._sceneComplications();

    const starships = game.actors.filter((a) => a.type === 'starship');
    const characters = game.actors.filter(
      (a) => a.type === 'character' && a.system.assignment
    );

    let tabs = starships.map((starship) => {
      const shipName = String(starship.name ?? '').trim().toLowerCase();
      const assigned = characters.filter((char) => {
        const assignment = String(char.system.assignment ?? '').trim().toLowerCase();
        const matchesShip = assignment === shipName;
        const canSeeCrew = char.testUserPermission(game.user, 'OBSERVER');
        return matchesShip && canSeeCrew;
      });

      const groups = {character: [], supporting: [], npc: []};

      for (const actor of assigned) {
        actor.focusItems = actor.items
          .filter((item) => item.type === 'focus')
          .map((item) => ({name: item.name}));

        actor.valueItems = actor.items
          .filter((item) => item.type === 'value')
          .map((item) => ({name: item.name}));

        const sheetClass = actor.sheet?.constructor;
        if (sheetClass === game.sta.applications.STANPCSheet2e) {
          groups.npc.push(actor);
        } else if (sheetClass === game.sta.applications.STASupportingSheet2e) {
          groups.supporting.push(actor);
        } else {
          groups.character.push(actor);
        }
      }

      let defaultCrewMember = null;
      if (groups.character.length) {
        defaultCrewMember = groups.character[0].id;
      } else if (groups.supporting.length) {
        defaultCrewMember = groups.supporting[0].id;
      } else if (groups.npc.length) {
        defaultCrewMember = groups.npc[0].id;
      } else {
        defaultCrewMember = 'proficient';
      }

      return {
        id: starship.id,
        name: starship.name,
        actor: starship,
        img: starship.img,
        active: false,
        radioGroup: `selectedCrewMember-${starship.id}`,
        groups,
        characterCount: groups.character.length,
        supportingCount: groups.supporting.length,
        npcCount: groups.npc.length,
        totalCount:
          groups.character.length + groups.supporting.length + groups.npc.length,
        canSeeShip: starship.testUserPermission(game.user, 'OBSERVER'),
        defaultCrewMember,
      };
    });

    tabs = tabs.filter((t) => t.canSeeShip);
    tabs.sort((a, b) => b.totalCount - a.totalCount);

    if (!this.tabGroups.primary && tabs.length) {
      this.tabGroups.primary = tabs[0].id;
    }

    for (const tab of tabs) tab.active = tab.id === this.tabGroups.primary;

    const activeTab = tabs.find((t) => t.id === this.tabGroups.primary);
    const attributes = ['control', 'daring', 'fitness', 'insight', 'presence', 'reason'];
    const disciplines = ['command', 'conn', 'engineering', 'security', 'medicine', 'science'];
    const systems = ['communications', 'computers', 'engines', 'sensors', 'structure', 'weapons'];
    const departments = ['command', 'conn', 'engineering', 'security', 'medicine', 'science'];
    const rollList = [
      'justrollboth', 'justrollcrew', 'melee', 'ranged', 'attack', 'firstaid',
      'direct', 'guard', 'sprint', 'rally', 'damagecontrol', 'transport',
      'attackpattern', 'evasiveaction', 'maneuver', 'ram', 'warp',
      'regainpower', 'regenerateshields', 'reveal', 'scanforweakness',
      'sensorsweep', 'defensivefire', 'tractorbeam'
    ];

    return {
      ...context,
      tabs,
      activeTab,
      activeActor: activeTab?.actor ?? null,
      attributes,
      disciplines,
      systems,
      departments,
      rollList,
      calculatedComplicationRange,
    };
  }

  static _onOpenActor(event, target) {
    event.preventDefault();
    const actorId = target.dataset.actorId;
    if (!actorId) return;

    const actor = game.actors.get(actorId);
    if (!actor) {
      console.warn(`STA Console | Could not find Actor ${actorId}`);
      return;
    }
    actor.sheet?.render(true);
  }

  static async _onAttributeTest(event, target) {
    event.preventDefault();
    const form = target.closest('.console-container');
    const activeTab = form.querySelector('.tab.active[data-group="primary"]');

    const data = {
      actor:
        activeTab?.querySelector('input[name^="selectedCrewMember-"]:checked')
          ?.value,
      starship: activeTab?.querySelector('[data-actor-id]')?.dataset.actorId,
      attribute: form.querySelector('select[name="attribute"]').value,
      discipline: form.querySelector('select[name="discipline"]').value,
      usingFocus: form.querySelector('#usingFocus').checked,
      usingDedicatedFocus: form.querySelector('#usingDedicatedFocus').checked,
      usingDetermination: form.querySelector('#usingDetermination').checked,
      complicationRange: Number(form.querySelector('#complicationRange').value),
      dicePool: Number(form.querySelector('#dicePoolSlider').value),
      assistPool: Number(form.querySelector('#assistPoolSlider').value),
      system: form.querySelector('select[name="system"]').value,
      department: form.querySelector('select[name="department"]').value,
      rollList: form.querySelector('select[name="rollList"]').value,
    };

    const character = game.actors.get(data.actor);
    const starship = game.actors.get(data.starship);
    let selectedAttributeValue = null;
    let selectedDisciplineValue = null;
    let selectedSystemValue = null;
    let selectedDepartmentValue = null;
    let selectedAttribute = data.attribute;
    let selectedDiscipline = data.discipline;
    let selectedSystem = data.system;
    let selectedDepartment = data.department;
    let speakerName = null;

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

    if (rollPresets[data.rollList]) {
      [
        selectedAttribute,
        selectedDiscipline,
        selectedSystem,
        selectedDepartment,
      ] = rollPresets[data.rollList];
    } else if (data.rollList === 'justrollcrew') {
      selectedSystem = selectedDepartment = 'none';
    }

    selectedSystemValue =
      starship?.system.systems[selectedSystem]?.value ?? null;
    selectedDepartmentValue =
      starship?.system.departments[selectedDepartment]?.value ?? null;
    selectedAttributeValue =
      character?.system.attributes[selectedAttribute]?.value ?? null;
    selectedDisciplineValue =
      character?.system.disciplines[selectedDiscipline]?.value ?? null;

    let skillLevel = null;

    if (!character) {
      skillLevel = data.actor;
      speakerName = 'NPC Crew';
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
      ] = npcValues[skillLevel] ?? [9, 2];
    } else {
      speakerName = character.name;
    }

    const taskData = {
      speakerName,
      starshipName: starship.name,
      rolltype: 'character2e',
      selectedAttribute,
      selectedAttributeValue,
      selectedDiscipline,
      selectedDisciplineValue,
      selectedSystem,
      selectedSystemValue,
      selectedDepartment: data.department,
      selectedDepartmentValue,
      dicePool: data.dicePool,
      assistPool: data.assistPool,
      usingFocus: data.usingFocus,
      usingDedicatedFocus: data.usingDedicatedFocus,
      usingDetermination: data.usingDetermination,
      complicationRange: data.complicationRange,
      skillLevel,
    };

    const staRoll = new STARoll();
    await staRoll.rollNPCTask(taskData);
  }

  static async _onChangeView(event) {
    const el = this.element;
    el.classList.toggle('roster');
  }
}
