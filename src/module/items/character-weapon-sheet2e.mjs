const api = foundry.applications.api;
const sheets = foundry.applications.sheets;

export class STACharacterWeaponSheet2e extends api.HandlebarsApplicationMixin(sheets.ItemSheetV2) {
  static PARTS = {
    itemsheet: {
      template: "systems/sta/templates/items/character-weapon-sheet2e.hbs"
    },
  };

  static DEFAULT_OPTIONS = {
    actions: {},
    form: {
      submitOnChange: true,
      closeOnSubmit: false,
    },
    position: {
      height: "auto",
      width: 565,
    },
  };
  get title() {
    return `${this.item.name} - Character Weapon (2e)`;
  }

  async _prepareContext(options) {
    const context = {
      item: this.item,
      enrichedNotes: await TextEditor.enrichHTML(this.item.system.description),
    };
    return context;
  }

  async _updateObject(event, formData) {
    await this.item.update(formData);
  }
}