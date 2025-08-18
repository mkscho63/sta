const api = foundry.applications.api;
const sheets = foundry.applications.sheets;

export class STAStarshipSheet2e extends api.HandlebarsApplicationMixin(sheets.ActorSheetV2) {
  static PARTS = {
    charactersheet: {
      template: 'systems/sta/templates/actors/starship-sheet2e.hbs'
    },
    limitedsheet: {
      template: 'systems/sta/templates/actors/limited-ship.hbs'
    },
  };

  static DEFAULT_OPTIONS = {
    actions: {
      onItemCreate: STAStarshipSheet2e._onItemCreate,
      onItemEdit: STAStarshipSheet2e._onItemEdit,
      onItemDelete: STAStarshipSheet2e._onItemDelete,
      onItemtoChat: STAStarshipSheet2e._onItemtoChat,
      onSmallCraft: STAStarshipSheet2e._onSmallCraft,
      onShieldTrackUpdate: this.prototype._onShieldTrackUpdate,
      onCrewTrackUpdate: this.prototype._onCrewTrackUpdate,
      onSelectSystem: this.prototype._onSelectSystem,
      onSelectDepartment: this.prototype._onSelectDepartment,
      onAttributeTest: this.prototype._onAttributeTest,
    },
    form: {
      submitOnChange: true,
      closeOnSubmit: false,
    },
    position: {
      height: 'auto',
      width: 850
    },
    dragDrop: [{
      dragSelector: 'li[data-item-id]',
      dropSelector: [
        '.window-content',
        '.sheet-body',
        '.sheet',
        '.tab',
        'ul.items',
        '.drop-zone'
      ].join(', ')
    }]
  };

  get title() {
    return `${this.actor.name} - Starship (2e)`;
  }

  _configureRenderOptions(options) {
    super._configureRenderOptions(options);
    options.parts = this.document.limited ? ['limitedsheet'] : ['charactersheet'];
  }

  async _prepareContext(options) {
    const items = this.actor.items?.contents || [];
    const itemsSorted = [...items].sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0));
    const context = {
      actor: this.actor,
      items: itemsSorted,
      systems: this.actor.system.systems,
      departments: this.actor.system.departments,
      departmentorder2e: this.actor.system.departmentorder2e,
      enrichedNotes: await foundry.applications.ux.TextEditor.enrichHTML(this.actor.system.notes),
    };

    Object.entries(context.systems).forEach(([key, system]) => {
      system.value = Math.max(0, Math.min(99, system.value));
    });

    Object.entries(context.departments).forEach(([key, department]) => {
      department.value = Math.max(0, Math.min(99, department.value));
    });
    return context;
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
    const systemCheckboxes = this.element.querySelectorAll('.systems-block .selector.system');
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
    const departmentCheckboxes = this.element.querySelectorAll('.departments-block .selector.department');
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
    const defaultValue = 1;
    const speaker = this.actor;
    const template = 'systems/sta/templates/apps/dicepool-attributess.hbs';
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
      const dicePool = parseInt(formData.get('dicePoolSlider'), 10) || defaultValue;
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
    case 'value':
      staRoll.performValueRoll(item, this.actor);
      break;
    case 'starshipweapon2e':
      staRoll.performStarshipWeaponRoll2e(item, this.actor);
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
    this.actor?.update({
      'system.shields.value': this.actor.system.shields.value,
      'system.shields.max': shieldsTrackMax,
    });
  }

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
    this.actor?.update({
      'system.crew.value': this.actor.system.crew.value,
      'system.crew.max': crewTrackMax,
    });
  }

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

  _updateBreachValues() {
    const scaleInput = this.element.querySelector('#scale');
    const shipScaleValue = scaleInput ? parseInt(scaleInput.value, 10) || 0 : 0;
    let totalBreaches = 0;
    this.element.querySelectorAll('.field.numeric-entry.breaches').forEach((input) => {
      const breachValue = parseInt(input.value, 10) || 0;
      totalBreaches += breachValue;
      const isSystemDestroyed = breachValue >= Math.ceil(shipScaleValue / 2);
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

  async _onRender(context, options) {
    if (this.document.limited) return;

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

    this._onShieldTrackUpdate();
    this._onCrewTrackUpdate();
    this._updateWeaponValues();
    this._updateBreachValues();

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
    this._dragDrop.forEach(d => d.bind(this.element));

    this.element.querySelectorAll('li[data-item-id]')?.forEach(li => {
      li.setAttribute('draggable', 'true');
    });
  }

  _canDragStart(selector) { return this.isEditable; }
  _canDragDrop(selector)  { return this.isEditable; }

  _onDragStart(event) {
    const docRow = event.currentTarget.closest('li[data-item-id]');
    if (!docRow) return;
    if ('link' in event.target.dataset) return;

    const item = this.actor?.items?.get?.(docRow.dataset.itemId) ?? this._getEmbeddedDocument?.(docRow);
    if (!item) return;

    const dragData = item.toDragData?.() ?? { type: "Item", uuid: item.uuid };
    event.dataTransfer.effectAllowed = "copyMove";
    event.dataTransfer.setData('text/plain', JSON.stringify(dragData));
  }

  _onDragOver(event) {
    event.preventDefault();
    const li = event.target.closest('li[data-item-id]');
    if (!li) return;
    const r = li.getBoundingClientRect();
    li.dataset.dropPosition = (event.clientY - r.top) < r.height / 2 ? "before" : "after";
  }

  async _onDrop(event) {
    const data = foundry.applications.ux.TextEditor.getDragEventData(event);
    const allowed = Hooks.call('dropActorSheetData', this.actor, this, data);
    if (allowed === false) return;

    if (data.type === "Item") return this._onDropItem(event, data);
  }

  async _onDropItem(event, data) {
    if (!this.actor?.isOwner) return false;

    const item = await Item.implementation.fromDropData(data);
    if (!item) return false;

    const allowedSubtypes = new Set([
      'item',
      'value',
      'starshipweapon2e',
      'talent',
      'injury',
      'smallcraftcontainer',
      'trait'
  ]);

    if (!allowedSubtypes.has(item.type)) {
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
    const payload = arr.map(d => {
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
      .map(el => this.actor.items.get(el.dataset.itemId))
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

    const updates = sortUpdates.map(u => ({
      _id: u.target.id ?? u.target._id,
      sort: u.update.sort
    })).filter(u => u._id != null);

    if (!updates.length) return false;

    return this.actor.updateEmbeddedDocuments('Item', updates);
  }

  get dragDrop() { return this._dragDrop || []; }

  _createDragDropHandlers() {
    const cfgs = Array.isArray(this.options?.dragDrop) && this.options.dragDrop.length
      ? this.options.dragDrop
      : [{
          dragSelector: 'li[data-item-id]',
          dropSelector: '.window-content, .sheet-body, .tab, ul.items, .drop-zone'
        }];

    return cfgs.map(d => new foundry.applications.ux.DragDrop({
      ...d,
      permissions: {
        dragstart: this._canDragStart.bind(this),
        drop:      this._canDragDrop.bind(this),
      },
      callbacks: {
        dragstart: this._onDragStart.bind(this),
        dragover:  this._onDragOver.bind(this),
        drop:      this._onDrop.bind(this),
      }
    }));
  }
}