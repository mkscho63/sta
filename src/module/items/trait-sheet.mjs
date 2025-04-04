const api = foundry.applications.api;
const sheets = foundry.applications.sheets;

export class STATraitSheet extends api.HandlebarsApplicationMixin(sheets.ItemSheetV2) {
  static PARTS = {
    itemsheet: {
      template: 'systems/sta/templates/items/trait-sheet.hbs'
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
    case 'trait':
      return `${this.item.name} - Trait`;
    case 'injury':
      return `${this.item.name} - Injury`;
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
