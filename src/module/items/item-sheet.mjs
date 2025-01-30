const api = foundry.applications.api;
const sheets = foundry.applications.sheets;

export class STAItemSheet extends api.HandlebarsApplicationMixin(sheets.ItemSheetV2) {
  static PARTS = {
    itemsheet: {
      template: "systems/sta/templates/items/item-sheet.hbs"
    },
  };

  static DEFAULT_OPTIONS = {
    actions: {},
    form: {
      submitOnChange: true,
      closeOnSubmit: false,
    },
    position: {
      height: 370,
      width: 500,
    },
  };

  get title() {
    return `${this.item.name} - Item`;
  }

  async _prepareContext(options) {
    const context = {
      item: this.item,
      enrichedNotes: await TextEditor.enrichHTML(this.item.system.description),
    };
    return context;
  }
}