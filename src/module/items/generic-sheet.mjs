const api = foundry.applications.api;
const sheets = foundry.applications.sheets;

export class STAGenericSheet extends api.HandlebarsApplicationMixin(sheets.ItemSheetV2) {
  static PARTS = {
    itemsheet: {
      template: 'systems/sta/templates/items/generic-sheet.hbs'
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
      width: 500,
    },
  };

  get title() {
    switch (this.item.type) {
    case 'value':
      return `${this.item.name} - Value`;
    case 'focus':
      return `${this.item.name} - Focus`;
    case 'milestone':
      return `${this.item.name} - Milestone`;
    }
  }

  async _prepareContext(options) {
    const context = {
      item: this.item,
      enrichedNotes: await TextEditor.enrichHTML(this.item.system.description),
    };
    return context;
  }
}
