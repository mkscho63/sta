const api = foundry.applications.api;
const sheets = foundry.applications.sheets;
export class STASmallCraftContainerSheet extends api.HandlebarsApplicationMixin(sheets.ItemSheetV2) {
  static PARTS = {
    itemsheet: {
      template: "systems/sta/templates/items/smallcraftcontainer-sheet.hbs"
    },
  };
  static DEFAULT_OPTIONS = {
    actions: {},
    form: {
      submitOnChange: true,
      closeOnSubmit: false,
    },
    position: {
      height: 390,
      width: 680,
    },
  };
  get title() {
    return `${this.item.name} - Smallcraft Container`;
  }
  async _prepareContext(options) {
    const context = {
      item: this.item,
      enrichedNotes: await TextEditor.enrichHTML(this.item.system.description),
      availableSmallcrafts: game.actors.filter((target) => target.type === 'smallcraft' && target.isOwner),
    };
    return context;
  }
  async _updateObject(event, formData) {
    await this.item.update(formData);
  }
}