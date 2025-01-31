import {
  STARoll
} from '../apps/roll.js';

const api = foundry.applications.api;
const sheets = foundry.applications.sheets;

export class STACharacterSheet2e extends api.HandlebarsApplicationMixin(sheets.ActorSheetV2) {

  static PARTS = {
    charactersheet: {
      template: "systems/STA/templates/actors/character-sheet2e.hbs"
    },
    limitedsheet: {
      template: "systems/STA/templates/actors/limited-sheet.hbs"
    },
  };

  static DEFAULT_OPTIONS = {
    actions: {
      onItemCreate: STACharacterSheet2e._onItemCreate,
      onItemEdit: STACharacterSheet2e._onItemEdit,
      onItemDelete: STACharacterSheet2e._onItemDelete,
      onItemtoChat: STACharacterSheet2e._onItemtoChat,
      onSelectAttribute: this.prototype._onSelectAttribute,
      onSelectDiscipline: this.prototype._onSelectDiscipline,
      onAttributeTest: this.prototype._onAttributeTest,
      onReputationTest: this.prototype._onReputationTest,
      onStressTrackUpdate: this.prototype._onStressTrackUpdate,
      onDeterminationTrackUpdate: this.prototype._onDeterminationTrackUpdate,
      onReputationTrackUpdate: this.prototype._onReputationTrackUpdate,
    },
    form: {
      submitOnChange: true,
      closeOnSubmit: false,
    },
    position: {
      height: "auto",
      width: 850
    },
    dragDrop: [{ dragSelector: "[data-drag]", dropSelector: null }],
  };

  get title() {
    return `${this.actor.name} - Character (2e)`;
  }

  _configureRenderOptions(options) {
    super._configureRenderOptions(options);
    if (this.document.limited) {
      options.parts = ['limitedsheet'];
    } else {
      options.parts = ['charactersheet'];
    }
  }

  async _prepareContext(options) {
    const context = {
      actor: this.actor,
      items: this.actor.items?.contents || [],
      attributes: this.actor.system.attributes,
      disciplines: this.actor.system.disciplines,
      disciplineorder2e: this.actor.system.disciplineorder2e,
      enrichedNotes: await TextEditor.enrichHTML(this.actor.system.notes),
      tabGroups: this.tabGroups,
      tabs: this.getTabs(),
    };

    Object.entries(context.attributes).forEach(([key, attributes]) => {
      attributes.value = Math.max(0, Math.min(99, attributes.value));
    });

    Object.entries(context.disciplines).forEach(([key, disciplines]) => {
      disciplines.value = Math.max(0, Math.min(99, disciplines.value));
    });
    return context;
  }

  getTabs() {
    let tabGroup = "primary";
    if (!this.tabGroups[tabGroup]) this.tabGroups[tabGroup] = 'biography';
    let tabs = {
      biography: {
        id: "biography",
        group: tabGroup,
      },
      traits: {
        id: "traits",
        group: tabGroup,
      },
      notes: {
        id: "notes",
        group: tabGroup,
      }
    }
    for (let tab in tabs) {
      if (this.tabGroups[tabGroup] === tabs[tab].id) {
        tabs[tab].cssClass = "active";
        tabs[tab].active = true;
      }
    }
    return tabs;
  }

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

  async _onAttributeTest(event) {
    event.preventDefault();
    let selectedAttribute = null;
    let selectedAttributeValue = 0;
    let selectedDiscipline = null;
    let selectedDisciplineValue = 0;
    const useReputationInstead = this.element.querySelector('.rollrepnotdis input[type="checkbox"]').checked;
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
      selectedDiscipline = "Reputation";
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
    const speaker = {
      type: 'character'
    };
    const template = 'systems/sta/templates/apps/dicepool-attribute2e.hbs';
    const html = await renderTemplate(template, {
      defaultValue
    });
    const formData = await api.DialogV2.wait({
      window: {
        title: game.i18n.localize('sta.apps.dicepoolwindow')
      },
      position: {
        height: "auto",
        width: 350
      },
      content: html,
      classes: ["dialogue"],
      buttons: [{
        action: "roll",
        default: true,
        label: game.i18n.localize('sta.apps.rolldice'),
        callback: (event, button, htmlElement) => {
          const form = htmlElement.querySelector("form");
          return form ? new FormData(form) : null;
        },
      }, ],
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

  async _onReputationTest(event) {
    event.preventDefault();
    const currentReprimand = parseInt(this.element.querySelector('#currentreprimand')?.value || 0, 10);
    const currentReputation = parseInt(this.element.querySelector('#total-rep')?.value || 0, 10);
    const speaker = ChatMessage.getSpeaker();
    const template = 'systems/sta/templates/apps/dicepool-reputation.hbs';
    const html = await renderTemplate(template);
    const formData = await api.DialogV2.wait({
        window: {
            title: game.i18n.localize('sta.apps.dicepoolwindow')
        },
        position: {
            height: "auto",
            width: 350
        },
        content: html,
        classes: ["dialogue"],
        buttons: [{
            action: "roll",
            default: true,
            label: game.i18n.localize('sta.apps.rolldice'),
            callback: (event, button, htmlElement) => {
                const form = htmlElement.querySelector("form");
                return form ? new FormData(form) : null;
            },
        }],
        close: () => null,
    });
    if (!formData) return;
    const positiveInfluences = parseInt(formData.get('positiveInfluences'), 10) || 0;
    const negativeInfluences = parseInt(formData.get('negativeInfluences'), 10) || 0;
    const targetNumber = currentReputation + 7;
    const complicationThreshold = 20 - Math.min(currentReprimand, 5);
    const diceRollFormula = `${positiveInfluences}d20`;
    const roll = new Roll(diceRollFormula);
    await roll.evaluate({async: true});
    let totalSuccesses = 0;
    let complications = 0;
    let acclaim = 0;
    let reprimand = 0;
    const diceResults = [];
    roll.terms[0].results.forEach(die => {
        let coloredDieResult;
        if (die.result >= complicationThreshold) {
            coloredDieResult = `<span style="color: red;">${die.result}</span>`;
            complications += 1;
        } else if (die.result <= currentReputation) {
            coloredDieResult = `<span style="color: green;">${die.result}</span>`;
            totalSuccesses += 2;
        } else if (die.result <= targetNumber) {
            coloredDieResult = `<span style="color: blue;">${die.result}</span>`;
            totalSuccesses += 1;
        } else {
            coloredDieResult = `<span>${die.result}</span>`;
        }
        diceResults.push(coloredDieResult);
    });
    let chatContent = `${game.i18n.format('sta.roll.dicerolls')} ${diceResults.join(', ')}<br>`;
    if (totalSuccesses > negativeInfluences) {
        acclaim = totalSuccesses - negativeInfluences;
        chatContent += `<strong>${game.i18n.format('sta.roll.gainacclaim', { 0: acclaim })}</strong>`;
    } else {
        reprimand = negativeInfluences - totalSuccesses + complications;
        if (reprimand > 0) {
            chatContent += `<strong>${game.i18n.format('sta.roll.gainreprimand', { 0: reprimand })}</strong>`;
        } else {
            chatContent += `<strong>${game.i18n.localize('sta.roll.nochange')}</strong>`;
        }
    }
    ChatMessage.create({
        speaker,
        content: chatContent,
    });
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
      ui.notifications.error("Quantity must be a positive number.");
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
      case 'characterweapon2e':
        staRoll.performWeaponRoll2e(item, this.actor);
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
      default:
        console.warn(`Unhandled item type: ${itemType}`);
    }
  }

  static async _onItemCreate(event, target) {
    const docCls = getDocumentClass(target.dataset.documentClass || "Item");
    const type = target.dataset.type || "item";
    const docData = {
      name: `New ${type.charAt(0).toUpperCase() + type.slice(1)}`,
      type: type,
      parent: this.actor,
    };
    for (const [dataKey, value] of Object.entries(target.dataset)) {
      if (["action", "documentClass"].includes(dataKey)) continue;
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
    new Dialog({
      title: game.i18n.localize('sta.apps.deleteitem'),
      content: `<p>${game.i18n.localize('sta.apps.deleteconfirm')}</p>`,
      buttons: {
        yes: {
          icon: '<i class="fas fa-check"></i>',
          label: game.i18n.localize('sta.apps.yes'),
          callback: async () => {
            await this.actor.deleteEmbeddedDocuments('Item', [itemId]);
          },
        },
        no: {
          icon: '<i class="fas fa-times"></i>',
          label: game.i18n.localize('sta.apps.no'),
        },
      },
      default: 'no',
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

  _onStressTrackUpdate(event) {
    const localizedValues = {
      tough: game.i18n.localize('sta.actor.character.talents.tough'),
      resolute: game.i18n.localize('sta.actor.character.talents.resolute'),
      mentaldiscipline: game.i18n.localize('sta.actor.character.talents.mentaldiscipline')
    };
    if (event) {
      const clickedStress = event.target;
      const stressValue = parseInt(clickedStress.textContent, 10);
      this.actor.system.stress.value = stressValue;
    }
    const fitnessValue = parseInt(this.element.querySelector('#fitness')?.value || 0, 10);
    const stressModValue = parseInt(this.element.querySelector('#stressmod')?.value || 0, 10);
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
    this.actor?.update({
      'system.stress.value': this.actor.system.stress.value,
      'system.stress.max': stressTrackMax,
    });
  }

  _onDeterminationTrackUpdate(event) {
    if (event) {
      const clickedDetermination = event.target;
      const determinationValue = parseInt(clickedDetermination.textContent, 10);
      this.actor.system.determination.value = determinationValue;
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

  _onReputationTrackUpdate(event) {
    if (event) {
      const clickedReputation = event.target;
      const reputationValue = parseInt(clickedReputation.textContent, 10);
      this.actor.system.reputation = reputationValue;
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

  _onRender(context, options) {
    if (this.document.limited) return;

    this._onStressTrackUpdate();
    this._onDeterminationTrackUpdate();
    this._onReputationTrackUpdate();

    document.querySelectorAll('.item-name').forEach(input => {
      input.addEventListener('change', this._onItemNameChange.bind(this));
    });

    document.querySelectorAll('.item-name').forEach(input => {
      input.addEventListener('mouseover', this._onItemTooltipShow.bind(this));
    });

    document.querySelectorAll('.item-name').forEach(input => {
      input.addEventListener('mouseout', this._onItemTooltipHide.bind(this));
    });

    document.querySelectorAll('.item-quantity').forEach(input => {
      input.addEventListener('change', this._onItemQuantityChange.bind(this));
    });

    this.#dragDrop.forEach(d => d.bind(this.element));
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
    let dragData = this._getEmbeddedDocument(docRow)?.toDragData();
    if (!dragData) return;
    event.dataTransfer.setData('text/plain', JSON.stringify(dragData));
  }

  _onDragOver(event) {}

  async _onDrop(event) {
    const data = TextEditor.getDragEventData(event);
    const actor = this.actor;
    const allowed = Hooks.call('dropActorSheetData', actor, this, data);
    if (allowed === false) return;
    await this._onDropItem(event, data);
  }

  async _onDropItem(event, data) {
    if (!this.actor.isOwner) return false;
    const item = await Item.implementation.fromDropData(data);
    const allowedSubtypes = [
      "item",
      "focus",
      "value",
      "characterweapon2e",
      "armor",
      "talent",
      "milestone",
      "injury",
      "trait"
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
    return this.options.dragDrop.map(d => {
      d.permissions = {
        dragstart: this._canDragStart.bind(this),
        drop: this._canDragDrop.bind(this),
      };
      d.callbacks = {
        dragstart: this._onDragStart.bind(this),
        dragover: this._onDragOver.bind(this),
        drop: this._onDrop.bind(this),
      };
      return new DragDrop(d);
    });
  }
}