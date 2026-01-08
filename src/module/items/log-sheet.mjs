const api = foundry.applications.api;
const sheets = foundry.applications.sheets;
import {STAItems} from './sta-items.mjs';

export class STALogSheet extends STAItems {
  static PARTS = {
    itemsheet: {
      template: 'systems/sta/templates/items/log-sheet.hbs'
    },
  };

  static DEFAULT_OPTIONS = {
    actions: {
      onSelectValue: function(ev) {
        return this._onSelectValue(ev);
      },
    },
    position: {
      height: 'auto',
      width: 700,
    },
  };

  async _prepareContext(options) {
    const actor = this.item.actor ?? null;
    const valueStates = foundry.utils.duplicate(this.item.system?.valueStates ?? {});
    const valueCallbacks = foundry.utils.duplicate(this.item.system?.valueCallbacks ?? {});
    const valueItems = actor ? actor.items.filter((i) => i.type === 'value') : [];

    const ids = new Set(valueItems.map((i) => i.id));
    for (const key of Object.keys(valueStates)) if (!ids.has(key)) delete valueStates[key];
    for (const key of Object.keys(valueCallbacks)) if (!ids.has(key)) delete valueCallbacks[key];
    for (const [key, val] of Object.entries(valueStates)) {
      if (typeof val === 'string') {
        valueStates[key] = [val];
      } else if (!Array.isArray(val)) {
        valueStates[key] = [];
      }
    }

    const actorValues = valueItems.map((i) => {
      let stateArray = valueStates[i.id] || [];
      if (stateArray.length === 0) {
        stateArray = ['unused'];
      }
      return {
        id: i.id,
        name: i.name,
        stateArray: stateArray,
        isUnused: stateArray.includes('unused'),
        isPositive: stateArray.includes('positive'),
        isNegative: stateArray.includes('negative'),
        isChallenged: stateArray.includes('challenged'),
        cb: !!valueCallbacks[i.id]
      };
    });

    const enrichedNotes = await foundry.applications.ux.TextEditor.enrichHTML(
      this.item.system?.description ?? '',
      {async: true, relativeTo: this.item}
    );

    return {
      item: this.item,
      actor,
      enrichedNotes,
      actorValues,
      valueStates,
      valueCallbacks
    };
  }

  _onSelectValue(event) {
    const clickedCheckbox = event.target;
    const name = clickedCheckbox.name;
    const valueId = name.split('.').pop();
    const clickedValue = clickedCheckbox.value;
    const checkboxes = this.element.querySelectorAll(`input[name="system.valueStates.${valueId}"]`);
  
    if (clickedValue === 'unused') {
      checkboxes.forEach((checkbox) => {
        if (checkbox !== clickedCheckbox) {
          checkbox.checked = false;
        }
      });
    } else {
      checkboxes.forEach((checkbox) => {
        if (checkbox.value === 'unused' && checkbox !== clickedCheckbox) {
          checkbox.checked = false;
        }
      });
    }
    const allUnchecked = Array.from(checkboxes).every((checkbox) => !checkbox.checked);
  
    if (allUnchecked) {
      const unusedCheckbox = Array.from(checkboxes).find((checkbox) => checkbox.value === 'unused');
      if (unusedCheckbox) {
        unusedCheckbox.checked = true;
      }
    }
  }
}
