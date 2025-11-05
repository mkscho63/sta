const api = foundry.applications.api;
const sheets = foundry.applications.sheets;

export class STAActors extends api.HandlebarsApplicationMixin(sheets.ActorSheetV2) {
  static DEFAULT_OPTIONS = {
    actions: {
      onItemCreate: STAActors._onItemCreate,
      onItemEdit: STAActors._onItemEdit,
      onItemDelete: STAActors._onItemDelete,
      onItemtoChat: STAActors._onItemtoChat,
      onStrikeThrough: STAActors._onStrikeThrough,
      onSmallCraft: STAActors._onSmallCraft,
      onSelectAttribute: function(ev) {
        return this._onSelectAttribute(ev);
      },
      onSelectDiscipline: function(ev) {
        return this._onSelectDiscipline(ev);
      },
      onSelectSystem: function(ev) {
        return this._onSelectSystem(ev);
      },
      onSelectDepartment: function(ev) {
        return this._onSelectDepartment(ev);
      },
      onAttributeTest: function(ev) {
        return this._onAttributeTest(ev);
      },
      onChallengeTest: function(ev) {
        return this._onChallengeTest(ev);
      },
      onReputationTest: function(ev) {
        return this._onReputationTest(ev);
      },
      onCheatSheet: function(ev) {
        return this._onCheatSheet(ev);
      },
      onStressTrackUpdate: function(ev) {
        return this._onStressTrackUpdate(ev);
      },
      onDeterminationTrackUpdate: function(ev) {
        return this._onDeterminationTrackUpdate(ev);
      },
      onReputationTrackUpdate: function(ev) {
        return this._onReputationTrackUpdate(ev);
      },
      onWorkTrackUpdate: function(ev) {
        return this._onWorkTrackUpdate(ev);
      },
      onShieldTrackUpdate: function(ev) {
        return this._onShieldTrackUpdate(ev);
      },
      onCrewTrackUpdate: function(ev) {
        return this._onCrewTrackUpdate(ev);
      },
      onPowerTrackUpdate: function(ev) {
        return this._onPowerTrackUpdate(ev);
      },
    },
    form: {
      submitOnChange: true,
      closeOnSubmit: false,
    },
    position: {
      height: 'auto',
      width: 850
    },
    window: {
      resizable: true,
    },
  };

  _configureRenderOptions(options) {
    super._configureRenderOptions(options);
    if (this.document.limited) {
      options.parts = ['limitedsheet'];
    } else {
      options.parts = ['charactersheet'];
    }
  }

  async _prepareContext(options) {
    const items = this.actor.items?.contents || [];
    const itemsSorted = [...items].sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0));
    const context = {
      actor: this.actor,
      items: itemsSorted,
      attributes: this.actor.system.attributes,
      disciplines: this.actor.system.disciplines,
      systems: this.actor.system.systems,
      departments: this.actor.system.departments,
      disciplineorder: this.actor.system.disciplineorder,
      disciplineorder2e: this.actor.system.disciplineorder2e,
      departmentorder: this.actor.system.departmentorder,
      departmentorder2e: this.actor.system.departmentorder2e,
      enrichedNotes: await foundry.applications.ux.TextEditor.enrichHTML(
        this.actor.system.notes, 
        {secrets: this.actor.isOwner, 
          relativeTo: this.actor, 
          rollData: this.actor.getRollData?.() ?? {}, 
          async: true
        }
      ),
      enrichedDescription: await foundry.applications.ux.TextEditor.enrichHTML(
        this.actor.system.description, 
        {secrets: this.actor.isOwner, 
          relativeTo: this.actor, 
          rollData: this.actor.getRollData?.() ?? {}, 
          async: true
        }
      ),
      tabGroups: this.tabGroups,
      tabs: this.getTabs(),
    };

    const clamp99 = (v) => Math.max(0, Math.min(99, Number(v) || 0));

    Object.entries(context?.attributes ?? {}).forEach(([, entry]) => {
      if (entry && typeof entry === 'object' && 'value' in entry) {
        entry.value = clamp99(entry.value);
      }
    });

    Object.entries(context?.disciplines ?? {}).forEach(([, entry]) => {
      if (entry && typeof entry === 'object' && 'value' in entry) {
        entry.value = clamp99(entry.value);
      }
    });

    Object.entries(context?.systems ?? {}).forEach(([, system]) => {
      if (system && typeof system === 'object' && 'value' in system) {
        system.value = clamp99(system.value);
      }
    });

    Object.entries(context?.departments ?? {}).forEach(([, department]) => {
      if (department && typeof department === 'object' && 'value' in department) {
        department.value = clamp99(department.value);
      }
    });

    const isLimited = this.document?.limited ?? this.actor?.limited ?? false;
    const showLimitedProse = game.settings.get('sta', 'showNotesInLimited');
    context.showProseMirror = isLimited ? showLimitedProse : true;

    return context;
  }

  get tracks() {
    return {
      stress: false,
      determination: false,
      reputation: false,
      work: false,
      shield: false,
      crew: false,
      power: false,
      weapon: false,
      breach: false,
    };
  }

  async _onRender(context, options) {
    if (this.document.limited) return;

    if (!this.document.isOwner) this._setObserver();

    if (this.document.isOwner) this._convertLegacy();
    if (this.tracks.stress) this._onStressTrackUpdate();
    if (this.tracks.determination) this._onDeterminationTrackUpdate();
    if (this.tracks.reputation) this._onReputationTrackUpdate();
    if (this.tracks.work) this._onWorkTrackUpdate();
    if (this.tracks.shield) this._onShieldTrackUpdate();
    if (this.tracks.crew) this._onCrewTrackUpdate();
    if (this.tracks.power) this._onPowerTrackUpdate();
    if (this.tracks.weapon) this._updateWeaponValues();
    if (this.tracks.breach) this._updateBreachValues();

    document.querySelectorAll('.item-name').forEach((input) => {
      input.addEventListener('change', this._onItemNameChange.bind(this));
    });

    document.querySelectorAll('.item-quantity').forEach((input) => {
      input.addEventListener('change', this._onItemQuantityChange.bind(this));
    });

    const els = Array.from(document.querySelectorAll('.item-name[data-item-id]'));
    for (const el of els) {
      const item = this.actor.items.get(el.dataset.itemId);
      const raw = (item?.system?.description ?? '').trim();
      if (!raw) continue;

      const enriched = await foundry.applications.ux.TextEditor.enrichHTML(raw, {
        async: true,
        documents: true,
        rolls: true,
        secrets: false
      });

      el.setAttribute('data-tooltip', enriched);
      el.setAttribute('data-tooltip-direction', 'UP');
    }

    if (!Array.isArray(this._dragDrop) || !this._dragDrop.length) {
      this._dragDrop = this._createDragDropHandlers();
    }
    this._dragDrop.forEach((d) => d.bind(this.element));

    this.element.querySelectorAll('a.edit[data-action="onItemEdit"], a.delete[data-action="onItemDelete"], img.chat[data-action="onItemtoChat"]')?.forEach((li) => {
      li.setAttribute('draggable', 'true');
    });
  }

  // Change the trait field into a trait item so that data is not lost, depreciate when convinced that no one is using trait fields anymore
  async _convertLegacy() {
    const actor = this.actor;
    if (actor.system.traits && actor.system.traits.trim()) {
      const traitName = actor.system.traits.trim();
      const existingTrait = actor.items.find(
        (trait) => trait.name === traitName && trait.type === 'trait'
      );

      if (!existingTrait) {
        const traitItemData = {
          name: traitName,
          type: 'trait',
        };

        actor.createEmbeddedDocuments('Item', [traitItemData])
          .then(() => actor.update({'system.traits': ''}))
          .catch((err) => {
            console.error(`Error creating trait item for actor ${actor.name}:`, err);
          });
      }
    }
  }

  // Limit to view only for observers
  async _setObserver() {
    const observersCanRoll = game.settings.get('sta', 'observersCanRoll');
    const restrictedWhenFalse = [
      '.extended-tasks',
      '.scenetraits-sheet',
      '.starship-sheet',
      '.top-right-column',
      '.bottom-left-column',
      '.sheet-body'
    ];
    const restrictedWhenTrue = [
      '.extended-tasks',
      '.scenetraits-sheet',
      '.right-column',
      '.top-right-column',
      '.numeric-entry',
      '.text-entry',
      '.sheet-body'
    ];

    const selectors = (observersCanRoll ? restrictedWhenTrue : restrictedWhenFalse).join(', ');

    for (const el of this.element.querySelectorAll(selectors)) {
      el.classList.add('observer');
      el.querySelectorAll('button, input, select, textarea, a, [tabindex]').forEach((ctrl) => {
        if (ctrl.tagName === 'TEXTAREA') ctrl.readOnly = true;
        else if ('disabled' in ctrl) ctrl.disabled = true;
        ctrl.tabIndex = -1;
      });
    }
  }

  // ######################################################
  // #                                                    #
  // #           Set up tabs for the sheets               #
  // #                                                    #
  // ######################################################

  getTabs() {
    const tabGroup = 'primary';
    if (!this.tabGroups[tabGroup]) this.tabGroups[tabGroup] = 'traits';
    const tabs = {
      biography: {
        id: 'biography',
        group: tabGroup,
      },
      traits: {
        id: 'traits',
        group: tabGroup,
      },
      development: {
        id: 'development',
        group: tabGroup,
      },
      notes: {
        id: 'notes',
        group: tabGroup,
      }
    };
    for (const tab in tabs) {
      if (this.tabGroups[tabGroup] === tabs[tab].id) {
        tabs[tab].cssClass = 'active';
        tabs[tab].active = true;
      }
    }
    return tabs;
  }

  // ######################################################
  // #                                                    #
  // #        Handle click events on attributes           #
  // #                                                    #
  // ######################################################

  _onSelectAttribute(event) {
    const clickedCheckbox = event.target;
    if (!clickedCheckbox.checked) {
      clickedCheckbox.checked = true;
      return;
    }
    this.element.querySelectorAll('.selector.attribute').forEach((checkbox) => {
      if (checkbox !== clickedCheckbox) {
        checkbox.checked = false;
      }
    });
  }

  _onSelectDiscipline(event) {
    const clickedCheckbox = event.target;
    if (!clickedCheckbox.checked) {
      clickedCheckbox.checked = true;
      return;
    }
    this.element.querySelectorAll('.selector.discipline').forEach((checkbox) => {
      if (checkbox !== clickedCheckbox) {
        checkbox.checked = false;
      }
    });
  }

  _onSelectSystem(event) {
    const clickedCheckbox = event.target;
    if (!clickedCheckbox.checked) {
      clickedCheckbox.checked = true;
      return;
    }
    this.element.querySelectorAll('.selector.system').forEach((checkbox) => {
      if (checkbox !== clickedCheckbox) {
        checkbox.checked = false;
      }
    });
  }

  _onSelectDepartment(event) {
    const clickedCheckbox = event.target;
    if (!clickedCheckbox.checked) {
      clickedCheckbox.checked = true;
      return;
    }
    this.element.querySelectorAll('.selector.department').forEach((checkbox) => {
      if (checkbox !== clickedCheckbox) {
        checkbox.checked = false;
      }
    });
  }

  // ######################################################
  // #                                                    #
  // #            Rollable tests start here               #
  // #                                                    #
  // ######################################################

  // Attribute test for 2e character - overridden in other sheets
  async _onAttributeTest(event) {
    event.preventDefault();
    const i18nKey = 'sta.roll.complicationroller';
    let localizedLabel = game.i18n.localize(i18nKey)?.trim();
    if (!localizedLabel || localizedLabel === i18nKey) localizedLabel = 'Complication Range';
    const escRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const labelPattern = escRe(localizedLabel).replace(/\s+/g, '\\s*');
    const compRx = new RegExp(`${labelPattern}\\s*\\+\\s*(\\d+)`, 'i');
    const sceneComplicationBonus = (() => {
      try {
        const scene = game.scenes?.active;
        if (!scene) return 0;
        let bonus = 0;
        const tokens = scene.tokens?.contents ?? scene.tokens ?? [];
        for (const tok of tokens) {
          const actor = tok?.actor;
          if (!actor || actor.type !== 'scenetraits') continue;
          for (const item of actor.items ?? []) {
            const m = compRx.exec(item.name ?? '');
            if (m) bonus += Number(m[1]) || 0;
          }
        }
        return bonus;
      } catch (err) {
        console.error('Scene complication bonus error:', err);
        return 0;
      }
    })();
    const calculatedComplicationRange = Math.min(5, Math.max(1, 1 + sceneComplicationBonus));
    let selectedAttribute = null;
    let selectedAttributeValue = 0;
    let selectedDiscipline = null;
    let selectedDisciplineValue = 0;
    const useReputationInstead = this.element.querySelector('.rollrepnotdis input[type="checkbox"]')?.checked ?? false;
    const reputationValue = parseInt(this.element.querySelector('#total-rep')?.value, 10) || 0;
    const systemCheckboxes = this.element.querySelectorAll('.attribute-block .selector.attribute');
    systemCheckboxes.forEach((checkbox) => {
      if (checkbox.checked) {
        const systemId = checkbox.id.replace('.selector', '');
        selectedAttribute = systemId;
        const systemValueInput = this.element.querySelector(`#${systemId}`);
        if (systemValueInput) {
          selectedAttributeValue = parseInt(systemValueInput.value, 10) || 0;
        }
      }
    });
    if (useReputationInstead) {
      selectedDiscipline = 'reputation';
      selectedDisciplineValue = reputationValue;
    } else {
      const departmentCheckboxes = this.element.querySelectorAll('.discipline-block .selector.discipline');
      departmentCheckboxes.forEach((checkbox) => {
        if (checkbox.checked) {
          const departmentId = checkbox.id.replace('.selector', '');
          selectedDiscipline = departmentId;
          const departmentValueInput = this.element.querySelector(`#${departmentId}`);
          if (departmentValueInput) {
            selectedDisciplineValue = parseInt(departmentValueInput.value, 10) || 0;
          }
        }
      });
    }
    const defaultValue = 2;
    const speaker = this.actor;
    const template = 'systems/sta/templates/apps/dicepool-attribute2e.hbs';
    const html = await foundry.applications.handlebars.renderTemplate(template, {
      defaultValue, calculatedComplicationRange
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
      let dicePool = parseInt(formData.get('dicePoolSlider'), 10) || defaultValue;
      const usingFocus = formData.get('usingFocus') === 'on';
      const usingDedicatedFocus = formData.get('usingDedicatedFocus') === 'on';
      const usingDetermination = formData.get('usingDetermination') === 'on';
      const complicationRange = parseInt(formData.get('complicationRange'), 10) || 1;
      if (usingDetermination) {
        dicePool = dicePool - 1;
      }
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

  // Challenge test for all sheets
  async _onChallengeTest(event) {
    event.preventDefault();
    const defaultValue = 2;
    const speaker = this.actor;
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

  // Reputation roll for 1e and 2e characters
  async _onReputationTest(event) {
    event.preventDefault();
    const currentReprimand = parseInt(
      this.element.querySelector('#currentreprimand')?.value || 0,
      10
    );
    const currentReputation = parseInt(
      this.element.querySelector('#total-rep')?.value || 0,
      10
    );
    const speaker = ChatMessage.getSpeaker({ actor: this.actor });
    const formData = await api.DialogV2.wait({
      window: { title: game.i18n.localize('sta.apps.dicepoolwindow') },
      position: { height: 'auto', width: 350 },
      content: await foundry.applications.handlebars.renderTemplate(
        'systems/sta/templates/apps/dicepool-reputation.hbs'
      ),
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
    const positiveInfluences = parseInt(formData.get('positiveInfluences'), 10) || 0;
    const negativeInfluences = parseInt(formData.get('negativeInfluences'), 10) || 0;
    const targetNumber = currentReputation + 7;
    const complicationThreshold = 20 - Math.min(currentReprimand, 5);
    const diceRollFormula = `${positiveInfluences}d20`;
    const roll = new Roll(diceRollFormula);
    await roll.evaluate();
    let diceHtml = '';
    let totalSuccesses = 0;
    let complications = 0;
    roll.terms[0].results.forEach((die) => {
      const dieResult = Math.round(parseFloat(die.result));
      let dieClass = 'roll die d20';
      if (die.result >= complicationThreshold) {
        dieClass += ' min';
        complications += 1;
      } else if (die.result <= currentReputation) {
        dieClass += ' max';
        totalSuccesses += 2;
      } else if (die.result <= targetNumber) {
        totalSuccesses += 1;
      }
      diceHtml += `<li class="${dieClass}">${dieResult}</li>`;
    });
    let outcomeText = '';
    if (totalSuccesses > negativeInfluences) {
      const acclaim = totalSuccesses - negativeInfluences;
      outcomeText = game.i18n.format('sta.roll.gainacclaim', { 0: acclaim });
    } else {
      const reprimand = negativeInfluences - totalSuccesses + complications;
      if (reprimand > 0) {
        outcomeText = game.i18n.format('sta.roll.gainreprimand', { 0: reprimand });
      } else {
        outcomeText = game.i18n.localize('sta.roll.nochange');
      }
    }
    const chatData = {
      speakerId: speaker.actor?.id ?? speaker.id,
      tokenId: speaker.token?.uuid ?? null,
      dicePool: positiveInfluences,
      diceHtml,
      outcomeText,
      targetNumber,
      complicationThreshold,
      negativeInfluences,
    };
    const chatHtml = await foundry.applications.handlebars.renderTemplate(
      'systems/sta/templates/chat/reputation-roll.hbs',
      chatData
    );
    ChatMessage.create({
      speaker,
      content: chatHtml,
    });
  }

  // Cheat sheet for 2e characters overridden in 1e sheet
  async _onCheatSheet(event) {
    event?.preventDefault?.();
    const tmpl = 'systems/sta/templates/apps/cheat-sheet.hbs';
    const content = await foundry.applications.handlebars.renderTemplate(tmpl);
    new foundry.applications.api.DialogV2({
      window: {title: game.i18n.localize('sta.apps.cheatsheet') + ' - 2e'},
      content,
      classes: ['dialogue'],
      position: {width: 450, height: 'auto'},
      buttons: [
        {
          action: 'close',
          label: game.i18n.localize('sta.apps.close') || 'Close',
          default: true,
          callback: () => {}
        }
      ]
    }).render(true);
  }

  // ######################################################
  // #                                                    #
  // #       Manage actions with on sheet items           #
  // #                                                    #
  // ######################################################

  async _onItemNameChange(event) {
    const input = event.currentTarget;
    const itemId = input.dataset.itemId;
    const newName = input.value.trim();
    const item = this.actor.items.get(itemId);
    await item.update({
      name: newName
    });
  }

  async _onItemQuantityChange(event) {
    const input = event.currentTarget;
    const itemId = input.dataset.itemId;
    const newQuantity = parseInt(input.value.trim(), 10);
    if (isNaN(newQuantity) || newQuantity < 0) {
      ui.notifications.error('Quantity must be a positive number.');
      return;
    }
    const item = this.actor.items.get(itemId);
    await item.update({
      'system.quantity': newQuantity
    });
  }

  static async _onItemtoChat(event) {
    const entry = event.target.closest('.entry');
    const itemId = entry.dataset.itemId;
    const itemType = entry.dataset.itemType;
    event.preventDefault();
    const item = this.actor.items.get(itemId);
    const staRoll = new STARoll();
    switch (itemType) {
    case 'item':
      staRoll.performItemRoll(item, this.actor);
      break;
    case 'focus':
      staRoll.performFocusRoll(item, this.actor);
      break;
    case 'value':
      staRoll.performValueRoll(item, this.actor);
      break;
    case 'characterweapon':
      staRoll.performWeaponRoll(item, this.actor);
      break;
    case 'characterweapon2e':
      staRoll.performWeaponRoll2e(item, this.actor);
      break;
    case 'starshipweapon':
      staRoll.performWeaponRoll(item, this.actor);
      break;
    case 'starshipweapon2e':
      staRoll.performStarshipWeaponRoll2e(item, this.actor);
      break;
    case 'armor':
      staRoll.performArmorRoll(item, this.actor);
      break;
    case 'talent':
      staRoll.performTalentRoll(item, this.actor);
      break;
    case 'injury':
      staRoll.performInjuryRoll(item, this.actor);
      break;
    case 'trait':
      staRoll.performTraitRoll(item, this.actor);
      break;
    case 'milestone':
      staRoll.performMilestoneRoll(item, this.actor);
      break;
    case 'log':
      staRoll.performLogRoll(item, this.actor);
      break;
    default:
      console.warn(`Unhandled item type: ${itemType}`);
    }
  }

  static async _onSmallCraft(event) {
    event.preventDefault();
    const entry = event.target.closest('.entry');
    const itemId = entry.dataset.itemId;
    const actor = this.actor;
    const item = actor.items.get(itemId);
    const childId = item.system?.child;
    const childShip = game.actors.get(childId);
    childShip.sheet.render(true);
  }

  static async _onStrikeThrough(event) {
    event.preventDefault();
    const entry = event.target.closest('.entry');
    const itemId = entry.dataset.itemId;
    const item = this.actor.items.get(itemId);
    if (!item) return;
    const isUsed = item.system.used;
    item.system.used = !isUsed;
    const icon = event.currentTarget.querySelector('i');
    icon.classList.toggle('fa-toggle-on', !isUsed);
    icon.classList.toggle('fa-toggle-off', isUsed);
    entry.setAttribute('data-item-used', !isUsed);
    entry.style.textDecoration = isUsed ? 'none' : 'line-through';
    await item.update({'system.used': item.system.used});
  }

  static async _onItemCreate(event, target) {
    const docCls = getDocumentClass(target.dataset.documentClass || 'Item');
    const type = target.dataset.type || 'item';
    const docData = {
      name: `New ${type.charAt(0).toUpperCase() + type.slice(1)}`,
      type: type,
      parent: this.actor,
    };
    for (const [dataKey, value] of Object.entries(target.dataset)) {
      if (['action', 'documentClass'].includes(dataKey)) continue;
      foundry.utils.setProperty(docData, dataKey, value);
    }
    await docCls.create(docData, {
      parent: this.actor
    });
  }

  static async _onItemEdit(event) {
    const entry = event.target.closest('.entry');
    const itemId = entry.dataset.itemId;
    const item = this.actor.items.get(itemId);
    item.sheet.render(true);
  }

  static async _onItemDelete(event) {
    const entry = event.target.closest('.entry');
    const itemId = entry.dataset.itemId;
    new api.DialogV2({
      window: {
        title: game.i18n.localize('sta.apps.deleteitem')
      },
      content: `<p>${game.i18n.localize('sta.apps.deleteconfirm')}</p>`,
      position: {
        height: 'auto',
        width: 350
      },
      buttons: [{
        action: 'yes',
        default: false,
        icon: '<i class="fas fa-check"></i>',
        label: game.i18n.localize('sta.apps.yes'),
        callback: async () => {
          await this.actor.deleteEmbeddedDocuments('Item', [itemId]);
        },
      },
      {
        action: 'no',
        default: true,
        icon: '<i class="fas fa-times"></i>',
        label: game.i18n.localize('sta.apps.no'),
        callback: (event, button, htmlElement) => {
          const form = htmlElement.querySelector('form');
          return form ? new FormData(form) : null;
        },
      },],
      close: () => null,
    }).render(true);
  }

  // ######################################################
  // #                                                    #
  // #              Track bars from here                  #
  // #                                                    #
  // ######################################################

  // Stress track for 2e characters, overridden in every other sheet
  _onStressTrackUpdate(event) {
    const localizedValues = {
      tough: game.i18n.localize('sta.actor.character.talents.tough'),
      resolute: game.i18n.localize('sta.actor.character.talents.resolute'),
      mentaldiscipline: game.i18n.localize('sta.actor.character.talents.mentaldiscipline')
    };
    if (event) {
      const clickedStress = event.target;
      const stressValue = parseInt(clickedStress.textContent, 10);
      if (stressValue === 1 && clickedStress.classList.contains('selected') && this.actor.system.stress.value === 1) {
        this.actor.system.stress.value = 0;
      } else {
        this.actor.system.stress.value = stressValue;
      }
    }
    const fitnessValue = parseInt(this.element.querySelector('#fitness')?.value || 0, 10);
    const stressModValue = parseInt(this.element.querySelector('#strmod')?.value || 0, 10);
    let stressTrackMax = fitnessValue + stressModValue;
    const hasTough = this.element.querySelector(`[data-talent-name*="${localizedValues.tough}"]`);
    if (hasTough) {
      stressTrackMax += 2;
    }
    const hasResolute = this.element.querySelector(`[data-talent-name*="${localizedValues.resolute}"]`);
    if (hasResolute) {
      stressTrackMax += parseInt(this.element.querySelector('#command')?.value || 0, 10);
    }
    const hasMentalDiscipline = this.element.querySelector(`[data-talent-name*="${localizedValues.mentaldiscipline}"]`);
    if (hasMentalDiscipline) {
      stressTrackMax = parseInt(this.element.querySelector('#control')?.value || 0, 10);
    }
    const maxStressInput = this.element.querySelector('#max-stress');
    if (maxStressInput && maxStressInput.value != stressTrackMax) {
      maxStressInput.value = stressTrackMax;
    }
    const barRenderer = this.element.querySelector('#bar-stress-renderer');
    barRenderer.innerHTML = '';
    const totalStressValue = this.actor?.system?.stress?.value || parseInt(this.element.querySelector('#total-stress')?.value || 0, 10);
    for (let i = 1; i <= stressTrackMax; i++) {
      const div = document.createElement('div');
      div.className = 'box stress';
      div.id = `stress-${i}`;
      div.textContent = i;
      div.style.width = `calc(100% / ${stressTrackMax})`;
      div.setAttribute('data-action', 'onStressTrackUpdate');
      if (i <= totalStressValue) {
        div.classList.add('selected');
      }
      barRenderer.appendChild(div);
    }
    if (!this.document.isOwner) return;
    this.actor?.update({
      'system.stress.value': this.actor.system.stress.value,
      'system.stress.max': stressTrackMax,
    });
  }

  // Determination track for characters
  _onDeterminationTrackUpdate(event) {
    if (event) {
      const clickedDetermination = event.target;
      const determinationValue = parseInt(clickedDetermination.textContent, 10);
      if (determinationValue === 1 && clickedDetermination.classList.contains('selected') && this.actor.system.determination.value === 1) {
        this.actor.system.determination.value = 0;
      } else {
        this.actor.system.determination.value = determinationValue;
      }
    }
    const determinationTrackMax = 3;
    const barRenderer = this.element.querySelector('#bar-determination-renderer');
    barRenderer.innerHTML = '';
    const totalDeterminationValue = this.actor?.system?.determination?.value || parseInt(this.element.querySelector('#total-determination')?.value || 0, 10);
    for (let i = 1; i <= determinationTrackMax; i++) {
      const div = document.createElement('div');
      div.className = 'box determination';
      div.id = `determination-${i}`;
      div.textContent = i;
      div.style.width = `calc(100% / ${determinationTrackMax})`;
      div.setAttribute('data-action', 'onDeterminationTrackUpdate');
      if (i <= totalDeterminationValue) {
        div.classList.add('selected');
      }
      barRenderer.appendChild(div);
    }
    this.actor?.update({
      'system.determination.value': this.actor.system.determination.value,
    });
  }

  // Reputation track for 1e and 2e characters
  _onReputationTrackUpdate(event) {
    if (event) {
      const clickedReputation = event.target;
      const reputationValue = parseInt(clickedReputation.textContent, 10);
      if (reputationValue === 1 && clickedReputation.classList.contains('selected') && this.actor.system.reputation === 1) {
        this.actor.system.reputation = 0;
      } else {
        this.actor.system.reputation = reputationValue;
      }
    }
    const reputationTrackMax = game.settings.get('sta', 'maxNumberOfReputation2e');
    const barRenderer = this.element.querySelector('#bar-rep-renderer');
    barRenderer.innerHTML = '';
    const totalReputationValue = this.actor?.system?.reputation || parseInt(this.element.querySelector('#total-rep')?.value || 0, 10);
    for (let i = 1; i <= reputationTrackMax; i++) {
      const div = document.createElement('div');
      div.className = 'box rep';
      div.id = `rep-${i}`;
      div.textContent = i;
      div.style.width = `calc(100% / ${reputationTrackMax})`;
      div.setAttribute('data-action', 'onReputationTrackUpdate');
      if (i <= totalReputationValue) {
        div.classList.add('selected');
      }
      barRenderer.appendChild(div);
    }
    this.actor?.update({
      'system.reputation': this.actor.system.reputation,
    });
  }

  // Work track for extended tasks
  _onWorkTrackUpdate(event) {
    if (event) {
      const clickedBox = event.target;
      if (!clickedBox || !clickedBox.id.startsWith('box')) return;
      const boxValue = parseInt(clickedBox.textContent, 10);
      const workProgressInput = this.element.querySelector('#work-progress');
	  const currentWorkValue = parseInt(workProgressInput.value, 10) || 0;
      if (boxValue === 1 && clickedBox.classList.contains('selected') && currentWorkValue === 1) {
        workProgressInput.value = 0;
      } else {
        workProgressInput.value = boxValue;
      }
    }
    const workInput = this.element.querySelector('#work');
    const work = parseInt(workInput.value || 0);
    const trackNumber = Math.ceil(work / 5);
    const fullDiv = document.createElement('div');
    fullDiv.style.width = '100%';
    fullDiv.className = 'bar extendedtask';
    for (let i = 0; i < trackNumber; i++) {
      const dividerDiv = document.createElement('div');
      dividerDiv.className = 'extendedtask-divider';
      fullDiv.appendChild(dividerDiv);
      const rowDiv = document.createElement('div');
      rowDiv.className = 'row';
      rowDiv.style.width = '100%';
      for (let j = 0; j < 5; j++) {
        const inputDiv = document.createElement('div');
        if (i * 5 + j + 1 <= work) {
          inputDiv.id = `box-${i * 5 + j + 1}`;
          inputDiv.className = 'box extendedtask';
          inputDiv.textContent = i * 5 + j + 1;
          inputDiv.setAttribute('data-action', 'onWorkTrackUpdate');
        }
        inputDiv.style.width = `calc(100% / 5)`;
        rowDiv.appendChild(inputDiv);
      }
      fullDiv.appendChild(rowDiv);
    }
    const renderer = this.element.querySelector('#extendedtask-renderer');
    renderer.innerHTML = '';
    renderer.appendChild(fullDiv);
    const workProgress = this.element.querySelector('#work-progress');
    const boxes = Array.from(this.element.querySelectorAll('[id^="box"]'));
    boxes.forEach((box, index) => {
      box.classList.add('extendedtask');
      if (index + 1 <= workProgress.value) {
        box.setAttribute('data-selected', 'true');
        box.classList.add('selected');
      } else {
        box.removeAttribute('data-selected');
        box.classList.remove('selected');
      }
    });
    this.submit();
  }

  // Shields track for 2e starships & small craft, overridden in 1e ship sheets
  async _onShieldTrackUpdate(event) {
    const localizedValues = {
      advancedshields: game.i18n.localize('sta.actor.starship.talents.advancedshields'),
      polarizedhullplating: game.i18n.localize('sta.actor.starship.talents.polarizedhullplating'),
    };
    if (event) {
      const clickedShield = event.target;
      const shieldValue = parseInt(clickedShield.textContent, 10);
      if (shieldValue === 1 && clickedShield.classList.contains('selected') && this.actor.system.shields.value === 1) {
        this.actor.system.shields.value = 0;
      } else {
        this.actor.system.shields.value = shieldValue;
      }
    }
    const structureValue = parseInt(this.element.querySelector('#structure')?.value || 0, 10);
    const securityValue = parseInt(this.element.querySelector('#security')?.value || 0, 10);
    const scaleValue = parseInt(this.element.querySelector('#scale')?.value || 0, 10);
    const shieldModValue = parseInt(this.element.querySelector('#shieldmod')?.value || 0, 10);
    let shieldsTrackMax = structureValue + securityValue + scaleValue + shieldModValue;
    const hasAdvancedShields = this.element.querySelector(`[data-talent-name*="${localizedValues.advancedshields}"]`);
    if (hasAdvancedShields) {
      shieldsTrackMax += 5;
    }
    const hasPolarizedHullPlating = this.element.querySelector(`[data-talent-name*="${localizedValues.polarizedhullplating}"]`);
    if (hasPolarizedHullPlating) {
      shieldsTrackMax = structureValue + shieldModValue;
    }
    const maxShieldsInput = this.element.querySelector('#max-shields');
    if (maxShieldsInput && maxShieldsInput.value != shieldsTrackMax) {
      maxShieldsInput.value = shieldsTrackMax;
    }
    const barRenderer = this.element.querySelector('#bar-shields-renderer');
    barRenderer.innerHTML = '';
    const totalShieldsValue = this.actor?.system?.shields?.value || parseInt(this.element.querySelector('#total-shields')?.value || 0, 10);
    for (let i = 1; i <= shieldsTrackMax; i++) {
      const div = document.createElement('div');
      div.className = 'box shields';
      div.id = `shields-${i}`;
      div.textContent = i;
      div.style.width = `calc(100% / ${shieldsTrackMax})`;
      div.setAttribute('data-action', 'onShieldTrackUpdate');
      if (i <= totalShieldsValue) {
        div.classList.add('selected');
      }
      barRenderer.appendChild(div);
    }
    if (!this.document.isOwner) return;
    this.actor?.update({
      'system.shields.value': this.actor.system.shields.value,
      'system.shields.max': shieldsTrackMax,
    });
  }

  // Crew track for 2e starships, overridden in 1e ship sheets
  async _onCrewTrackUpdate(event) {
    const localizedValues = {
      extensiveautomation: game.i18n.localize('sta.actor.starship.talents.extensiveautomation'),
      abundantpersonnel: game.i18n.localize('sta.actor.starship.talents.abundantpersonnel'),
      agingrelic: game.i18n.localize('sta.actor.starship.talents.agingrelic'),
    };
    if (event) {
      const clickedCrew = event.target;
      const crewValue = parseInt(clickedCrew.textContent, 10);
      if (crewValue === 1 && clickedCrew.classList.contains('selected') && this.actor.system.crew.value === 1) {
        this.actor.system.crew.value = 0;
      } else {
        this.actor.system.crew.value = crewValue;
      }
    }
    const scaleValue = parseInt(this.element.querySelector('#scale')?.value || 0, 10);
    const crwModValue = parseInt(this.element.querySelector('#crwmod')?.value || 0, 10);
    let crewTrackMax = scaleValue + crwModValue;
    const hasAgingRelic = this.element.querySelector(`[data-talent-name*="${localizedValues.agingrelic}"]`);
    if (hasAgingRelic) {
      crewTrackMax += 1;
    }
    const hasExtensiveAutomation = this.element.querySelector(`[data-talent-name*="${localizedValues.extensiveautomation}"]`);
    if (hasExtensiveAutomation) {
      crewTrackMax = Math.ceil(crewTrackMax / 2);
    }
    const hasAbundantPersonnel = this.element.querySelector(`[data-talent-name*="${localizedValues.abundantpersonnel}"]`);
    if (hasAbundantPersonnel) {
      crewTrackMax *= 2;
    }
    const maxCrewInput = this.element.querySelector('#max-crew');
    if (maxCrewInput && maxCrewInput.value != crewTrackMax) {
      maxCrewInput.value = crewTrackMax;
    }
    const barRenderer = this.element.querySelector('#bar-crew-renderer');
    barRenderer.innerHTML = '';
    const totalCrewValue = this.actor?.system?.crew?.value || parseInt(this.element.querySelector('#total-crew')?.value || 0, 10);
    for (let i = 1; i <= crewTrackMax; i++) {
      const div = document.createElement('div');
      div.className = 'box crew';
      div.id = `crew-${i}`;
      div.textContent = i;
      div.style.width = `calc(100% / ${crewTrackMax})`;
      div.setAttribute('data-action', 'onCrewTrackUpdate');
      if (i <= totalCrewValue) {
        div.classList.add('selected');
      }
      barRenderer.appendChild(div);
    }
    if (!this.document.isOwner) return;
    this.actor?.update({
      'system.crew.value': this.actor.system.crew.value,
      'system.crew.max': crewTrackMax,
    });
  }

  // Power track for 1e starships and small craft
  async _onPowerTrackUpdate(event) {
    const localizedValues = {
      secondaryreactors: game.i18n.localize('sta.actor.starship.talents.secondaryreactors'),
    };
    if (event) {
      const clickedPower = event.target;
      const powerValue = parseInt(clickedPower.textContent, 10);
      if (powerValue === 1 && clickedPower.classList.contains('selected') && this.actor.system.power.value === 1) {
        this.actor.system.power.value = 0;
      } else {
        this.actor.system.power.value = powerValue;
      }
    }
    const engineValue = parseInt(this.element.querySelector('#engines')?.value || 0, 10);
    let powerTrackMax = engineValue;
    const hasSecondaryReactors = this.element.querySelector(`[data-talent-name*="${localizedValues.secondaryreactors}"]`);
    if (hasSecondaryReactors) {
      powerTrackMax += 5;
    }
    const maxPowerInput = this.element.querySelector('#max-power');
    if (maxPowerInput && maxPowerInput.value != powerTrackMax) {
      maxPowerInput.value = powerTrackMax;
    }
    const barRenderer = this.element.querySelector('#bar-power-renderer');
    barRenderer.innerHTML = '';
    const totalPowerValue = this.actor?.system?.power?.value || parseInt(this.element.querySelector('#total-power')?.value || 0, 10);
    for (let i = 1; i <= powerTrackMax; i++) {
      const div = document.createElement('div');
      div.className = 'box power';
      div.id = `power-${i}`;
      div.textContent = i;
      div.style.width = `calc(100% / ${powerTrackMax})`;
      div.setAttribute('data-action', 'onPowerTrackUpdate');
      if (i <= totalPowerValue) {
        div.classList.add('selected');
      }
      barRenderer.appendChild(div);
    }
    if (!this.document.isOwner) return;
    this.actor?.update({
      'system.power.value': this.actor.system.power.value,
      'system.power.max': powerTrackMax,
    });
  }

  // ######################################################
  // #                                                    #
  // #            Weapons and breaches here               #
  // #                                                    #
  // ######################################################

  // Weapon damage update for 2e starships and small craft, overridden in 1e ship sheets
  _updateWeaponValues() {
    this.element.querySelectorAll('[id^=starship-weapon-]').forEach((element) => {
      const weaponDamage = parseInt(element.dataset.itemDamage, 10) || 0;
      const weaponsInput = this.element.querySelector('#weapons');
      let weaponValue = 0;
      if (weaponsInput) {
        const weaponsValue = parseInt(weaponsInput.value, 10) || 0;
        if (weaponsValue > 6) weaponValue = 1;
        if (weaponsValue > 8) weaponValue = 2;
        if (weaponsValue > 10) weaponValue = 3;
        if (weaponsValue > 12) weaponValue = 4;
      }
      const scaleInput = this.element.querySelector('#scale');
      let scaleDamage = 0;
      if (element.dataset.itemIncludescale === 'energy' && scaleInput) {
        scaleDamage = parseInt(scaleInput.value, 10) || 0;
      }
      const attackDamageValue = weaponDamage + weaponValue + scaleDamage;
      const damageElement = element.querySelector('.damage');
      if (damageElement) {
        damageElement.innerText = attackDamageValue;
      }
    });
  }

  // Breach update for 2e starships and small craft, overridden in 1e ship sheets
  _updateBreachValues() {
    const scaleInput = this.element.querySelector('#scale');
    const shipScaleValue = scaleInput ? parseInt(scaleInput.value, 10) || 0 : 0;
    let totalBreaches = 0;
    this.element.querySelectorAll('.field.numeric-entry.breaches').forEach((input) => {
      const breachValue = parseInt(input.value, 10) || 0;
      totalBreaches += breachValue;
      const isSystemDestroyed = breachValue > (shipScaleValue / 2);
      input.classList.remove('highlight-damaged', 'highlight-destroyed');
      if (breachValue > 0 && !isSystemDestroyed) {
        input.classList.add('highlight-damaged');
      } else if (isSystemDestroyed) {
        input.classList.add('highlight-destroyed');
      }
    });
    const sheetElement = this.element.querySelector(`#${this.id} .title`);
    if (sheetElement) {
      if (totalBreaches === shipScaleValue + 1) {
        sheetElement.classList.add('highlight-damaged');
        sheetElement.classList.remove('highlight-destroyed');
      } else if (totalBreaches > shipScaleValue + 1) {
        sheetElement.classList.add('highlight-destroyed');
        sheetElement.classList.remove('highlight-damaged');
      } else {
        sheetElement.classList.remove('highlight-damaged', 'highlight-destroyed');
      }
    }
  }

  // ######################################################
  // #                                                    #
  // #           Drag drop starts from here               #
  // #                                                    #
  // ######################################################

  _canDragStart(selector) {
    return this.isEditable;
  }
  _canDragDrop(selector) {
    return this.isEditable;
  }

  _onDragStart(event) {
    const docRow = event.currentTarget.closest('li[data-item-id]');
    if (!docRow) return;
    if ('link' in event.target.dataset) return;

    const item = this.actor?.items?.get?.(docRow.dataset.itemId) ?? this._getEmbeddedDocument?.(docRow);
    if (!item) return;

    const dragData = item.toDragData?.() ?? {type: 'Item', uuid: item.uuid};
    event.dataTransfer.effectAllowed = 'copyMove';
    event.dataTransfer.setData('text/plain', JSON.stringify(dragData));
  }

  _onDragOver(event) {
    event.preventDefault();
    const li = event.target.closest('li[data-item-id]');
    if (!li) return;
    const r = li.getBoundingClientRect();
    li.dataset.dropPosition = (event.clientY - r.top) < r.height / 2 ? 'before' : 'after';
  }

  async _onDrop(event) {
    const data = foundry.applications.ux.TextEditor.getDragEventData(event);
    const allowed = Hooks.call('dropActorSheetData', this.actor, this, data);
    if (allowed === false) return;

    if (data.type === 'Item') return this._onDropItem(event, data);
  }

  get allowedItemTypes() {
    return new Set([]);
  }

  async _onDropItem(event, data) {
    if (!this.actor?.isOwner) return false;

    const item = await Item.implementation.fromDropData(data);
    if (!item) return false;

    if (!this.allowedItemTypes.has(item.type)) {
      ui.notifications.warn(
        `${this.actor.name} ` +
        game.i18n.localize('sta.notifications.actoritem') +
        ` ${item.type}`
      );
      return false;
    }

    if (item.parent?.uuid === this.actor.uuid) {
      return this._onSortItem(event, item);
    }

    const move = event.altKey === true;
    const created = await this._onDropItemCreate(item);
    if (move && item.parent?.isOwner) await item.delete();
    return created;
  }

  async _onDropItemCreate(itemOrData) {
    const arr = Array.isArray(itemOrData) ? itemOrData : [itemOrData];
    const payload = arr.map((d) => {
      const obj = d instanceof Item ? d.toObject() : d;
      delete obj._id;
      return obj;
    });
    return this.actor.createEmbeddedDocuments('Item', payload);
  }

  async _onSortItem(event, item) {
    const container =
      event.target?.closest?.('ul.items') ||
      event.currentTarget?.closest?.('ul.items') ||
      this.element;

    const nodeList = container.querySelectorAll('li[data-item-id]');
    const siblings = Array.from(nodeList)
      .map((el) => this.actor.items.get(el.dataset.itemId))
      .filter(Boolean);

    if (!siblings.length) return false;

    const li = event.target.closest('li[data-item-id]');
    let target = null;
    let before = false;

    if (li) {
      target = this.actor.items.get(li.dataset.itemId) || null;
      before = (li.dataset.dropPosition === 'before');
      if (target?.id === item.id) return false;
    } else {
      target = siblings[siblings.length - 1] || null;
      before = false;
    }

    const sortUpdates = foundry.utils.performIntegerSort(item, {
      target,
      siblings,
      sortKey: 'sort',
      sortBefore: before
    });

    const updates = sortUpdates.map((u) => ({
      _id: u.target.id ?? u.target._id,
      sort: u.update.sort
    })).filter((u) => u._id != null);

    if (!updates.length) return false;

    return this.actor.updateEmbeddedDocuments('Item', updates);
  }

  get dragDrop() {
    return this._dragDrop || [];
  }

  _createDragDropHandlers() {
    const cfgs = Array.isArray(this.options?.dragDrop) && this.options.dragDrop.length ?
      this.options.dragDrop :
      [{
        dragSelector: 'a.edit[data-action="onItemEdit"], a.delete[data-action="onItemDelete"], img.chat[data-action="onItemtoChat"]',
        dropSelector: [
          '.window-content',
          '.sheet-body',
          '.sheet',
          '.tab',
          'ul.items',
          '.drop-zone'
        ].join(', ')
      }];

    return cfgs.map((d) => new foundry.applications.ux.DragDrop({
      ...d,
      permissions: {
        dragstart: this._canDragStart.bind(this),
        drop: this._canDragDrop.bind(this),
      },
      callbacks: {
        dragstart: this._onDragStart.bind(this),
        dragover: this._onDragOver.bind(this),
        drop: this._onDrop.bind(this),
      }
    }));
  }
}
