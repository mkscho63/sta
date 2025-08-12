const api = foundry.applications.api;
const sheets = foundry.applications.sheets;

export class STAStarshipSheet extends api.HandlebarsApplicationMixin(sheets.ActorSheetV2) {
  static PARTS = {
    charactersheet: {
      template: 'systems/sta/templates/actors/starship-sheet.hbs'
    },
    limitedsheet: {
      template: 'systems/sta/templates/actors/limited-ship.hbs'
    },
  };

  static DEFAULT_OPTIONS = {
    actions: {
      onItemCreate: STAStarshipSheet._onItemCreate,
      onItemEdit: STAStarshipSheet._onItemEdit,
      onItemDelete: STAStarshipSheet._onItemDelete,
      onItemtoChat: STAStarshipSheet._onItemtoChat,
      onSmallCraft: STAStarshipSheet._onSmallCraft,
      onShieldTrackUpdate: this.prototype._onShieldTrackUpdate,
      onCrewTrackUpdate: this.prototype._onCrewTrackUpdate,
      onPowerTrackUpdate: this.prototype._onPowerTrackUpdate,
      onSelectSystem: this.prototype._onSelectSystem,
      onSelectDepartment: this.prototype._onSelectDepartment,
      onAttributeTest: this.prototype._onAttributeTest,
      onChallengeTest: this.prototype._onChallengeTest,
    },
    form: {
      submitOnChange: true,
      closeOnSubmit: false,
    },
    position: {
      height: 'auto',
      width: 850
    },
    dragDrop: [{dragSelector: '[data-drag]', dropSelector: null}],
  };

  get title() {
    return `${this.actor.name} - Starship (1e)`;
  }

  _configureRenderOptions(options) {
    super._configureRenderOptions(options);
    options.parts = this.document.limited ? ['limitedsheet'] : ['charactersheet'];
  }

  async _prepareContext(options) {
    const context = {
      actor: this.actor,
      items: this.actor.items?.contents || [],
      systems: this.actor.system.systems,
      departments: this.actor.system.departments,
      departmentorder: this.actor.system.departmentorder,
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
    let calculatedComplicationRange = 1;
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
            const m = /complication\s*range\s*\+(\d+)/i.exec(item.name ?? '');
            if (m) bonus += Number(m[1]) || 0;
          }
        }
        return bonus;
      } catch (err) {
        console.error('Scene complication bonus error:', err);
        return 0;
      }
    })();
    calculatedComplicationRange += sceneComplicationBonus;
    calculatedComplicationRange = Math.min(5, Math.max(1, calculatedComplicationRange));
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
    case 'starshipweapon':
      staRoll.performWeaponRoll(item, this.actor);
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

  _onItemTooltipShow(event) {
    const input = event.currentTarget;
    const itemId = input.dataset.itemId;
    const item = this.actor.items.get(itemId);
    if (item) {
      const description = item.system.description?.trim().replace(/\n/g, '<br>');
      if (description) {
        input._tooltipTimeout = setTimeout(() => {
          let tooltip = document.querySelector('.item-tooltip');
          if (!tooltip) {
            tooltip = document.createElement('div');
            tooltip.classList.add('item-tooltip');
            document.body.appendChild(tooltip);
          }
          tooltip.innerHTML = `${description}`;
          const {
            clientX: mouseX,
            clientY: mouseY
          } = event;
          tooltip.style.left = `${mouseX + 10}px`;
          tooltip.style.top = `${mouseY + 10}px`;
          const tooltipRect = tooltip.getBoundingClientRect();
          if (tooltipRect.bottom > window.innerHeight) {
            tooltip.style.top = `${window.innerHeight - tooltipRect.height - 20}px`;
          }
          input._tooltip = tooltip;
        }, 1000);
      }
    }
  }

  _onItemTooltipHide(event) {
    const input = event.currentTarget;
    if (input._tooltipTimeout) {
      clearTimeout(input._tooltipTimeout);
      delete input._tooltipTimeout;
    }
    if (input._tooltip) {
      input._tooltip.remove();
      delete input._tooltip;
    }
  }

  async _onShieldTrackUpdate(event) {
    const localizedValues = {
      advancedshields: game.i18n.localize('sta.actor.starship.talents.advancedshields'),
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
    const shieldModValue = parseInt(this.element.querySelector('#shieldmod')?.value || 0, 10);
    let shieldsTrackMax = structureValue + securityValue + shieldModValue;
    const hasAdvancedShields = this.element.querySelector(`[data-talent-name*="${localizedValues.advancedshields}"]`);
    if (hasAdvancedShields) {
      shieldsTrackMax += 5;
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
    const crewTrackMax = scaleValue + crwModValue;
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
    this.actor?.update({
      'system.power.value': this.actor.system.power.value,
      'system.power.max': powerTrackMax,
    });
  }

  _updateWeaponValues() {
    this.element.querySelectorAll('[id^=starship-weapon-]').forEach((element) => {
      const weaponDamage = parseInt(element.dataset.itemDamage, 10) || 0;
      const weaponsInput = this.element.querySelector('#security');
      let weaponValue = 0;
      weaponValue = parseInt(weaponsInput.value, 10) || 0;
      const scaleInput = this.element.querySelector('#scale');
      let scaleDamage = 0;
      if (element.dataset.itemIncludescale === 'true') {
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
      const isSystemDamaged = breachValue >= Math.ceil(shipScaleValue / 2);
      const isSystemDisabled = breachValue >= Math.ceil(shipScaleValue);
      const isSystemDestroyed = breachValue >= Math.ceil(shipScaleValue + 1);
      input.classList.remove('highlight-damaged', 'highlight-disabled', 'highlight-destroyed');
      if (isSystemDamaged && !isSystemDisabled && !isSystemDestroyed) {
        input.classList.add('highlight-damaged');
      } else if (isSystemDisabled && !isSystemDestroyed) {
        input.classList.add('highlight-disabled');
      } else if (isSystemDestroyed) {
        input.classList.add('highlight-destroyed');
      }
    });
  }

  _onRender(context, options) {
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
    this._onPowerTrackUpdate();
    this._updateWeaponValues();
    this._updateBreachValues();

    document.querySelectorAll('.item-name').forEach((input) => {
      input.addEventListener('change', this._onItemNameChange.bind(this));
    });

    document.querySelectorAll('.item-name').forEach((input) => {
      input.addEventListener('mouseover', this._onItemTooltipShow.bind(this));
    });

    document.querySelectorAll('.item-name').forEach((input) => {
      input.addEventListener('mouseout', this._onItemTooltipHide.bind(this));
    });

    document.querySelectorAll('.item-quantity').forEach((input) => {
      input.addEventListener('change', this._onItemQuantityChange.bind(this));
    });

    this.#dragDrop.forEach((d) => d.bind(this.element));
  }

  #dragDrop;

  constructor(...args) {
    super(...args);
    this.#dragDrop = this.#createDragDropHandlers();
  }

  get dragDrop() {
    return this.#dragDrop;
  }

  _canDragStart(selector) {
    return this.isEditable;
  }

  _canDragDrop(selector) {
    return this.isEditable;
  }

  _onDragStart(event) {
    const docRow = event.currentTarget.closest('li');
    if ('link' in event.target.dataset) return;
    const dragData = this._getEmbeddedDocument(docRow)?.toDragData();
    if (!dragData) return;
    event.dataTransfer.setData('text/plain', JSON.stringify(dragData));
  }

  _onDragOver(event) {}

  async _onDrop(event) {
    const data = foundry.applications.ux.TextEditor.getDragEventData(event);
    const actor = this.actor;
    const allowed = Hooks.call('dropActorSheetData', actor, this, data);
    if (allowed === false) return;
    await this._onDropItem(event, data);
  }

  async _onDropItem(event, data) {
    if (!this.actor.isOwner) return false;
    const item = await Item.implementation.fromDropData(data);
    const allowedSubtypes = [
      'item',
      'value',
      'starshipweapon',
      'talent',
      'injury',
      'smallcraftcontainer',
      'trait'
    ];

    if (!allowedSubtypes.includes(item.type)) {
      ui.notifications.warn(`${this.actor.name} ` + game.i18n.localize(`sta.notifications.actoritem`) + ` ${item.type}`);
      return false;
    }

    if (this.actor.uuid === item.parent?.uuid) {
      return await this._onSortItem(event, item);
    }

    return await this._onDropItemCreate(item, event);
  }

  async _onDropItemCreate(itemData, event) {
    itemData = itemData instanceof Array ? itemData : [itemData];
    return this.actor.createEmbeddedDocuments('Item', itemData);
  }

  #createDragDropHandlers() {
    return this.options.dragDrop.map((d) => {
      d.permissions = {
        dragstart: this._canDragStart.bind(this),
        drop: this._canDragDrop.bind(this),
      };
      d.callbacks = {
        dragstart: this._onDragStart.bind(this),
        dragover: this._onDragOver.bind(this),
        drop: this._onDrop.bind(this),
      };
      return new foundry.applications.ux.DragDrop(d);
    });
  }
}
