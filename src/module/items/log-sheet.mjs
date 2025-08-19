const api = foundry.applications.api;
const sheets = foundry.applications.sheets;

export class STALogSheet extends api.HandlebarsApplicationMixin(sheets.ItemSheetV2) {
  static PARTS = {
    itemsheet: {
      template: 'systems/sta/templates/items/log-sheet.hbs'
    },
  };

  static DEFAULT_OPTIONS = {
    actions: {},
    form: {
      submitOnChange: true,
      closeOnSubmit: false,
    },
    position: {
      height: 'auto',
      width: 700,
    },
	window: {
      resizable: true,
    },
  };

  get title() {
    return `${this.item.name} - Log`;
  }

  async _prepareContext(options) {
    const actor = this.item.actor ?? null;
    const valueStates = foundry.utils.duplicate(this.item.system?.valueStates ?? {});
    const valueCallbacks = foundry.utils.duplicate(this.item.system?.valueCallbacks ?? {});
    const valueItems = actor ? actor.items.filter((i) => i.type === 'value') : [];

    const ids = new Set(valueItems.map((i) => i.id));
    for (const key of Object.keys(valueStates)) if (!ids.has(key)) delete valueStates[key];
    for (const key of Object.keys(valueCallbacks)) if (!ids.has(key)) delete valueCallbacks[key];

    const actorValues = valueItems.map((i) => {
      const state = valueStates[i.id] ?? 'unused';
      const cb = !!valueCallbacks[i.id]; // default false
      return {
        id: i.id,
        name: i.name,
        state,
        isUnused: state === 'unused',
        isPositive: state === 'positive',
        isNegative: state === 'negative',
        isChallenged: state === 'challenged',
        cb
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
}
