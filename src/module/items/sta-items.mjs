const api = foundry.applications.api;
const sheets = foundry.applications.sheets;

export class STAItems extends api.HandlebarsApplicationMixin(sheets.ItemSheetV2) {
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
    window: {
      resizable: true,
    },
  };

  get title() {
    switch (this.item.type) {
    case 'value':
      return `${this.item.name} - Value`;
    case 'focus':
      return `${this.item.name} - Focus`;
    case 'trait':
      return `${this.item.name} - Trait`;
    case 'injury':
      return `${this.item.name} - Injury`;
    case 'armor':
      return `${this.item.name} - Armor`;
    case 'characterweapon':
      return `${this.item.name} - Character Weapon (1e)`;
    case 'characterweapon2e':
      return `${this.item.name} - Character Weapon (2e)`;
    case 'item':
      return `${this.item.name} - Item`;
    case 'log':
      return `${this.item.name} - Log`;
    case 'milestone':
      return `${this.item.name} - Milestone`;
    case 'smallcraftcontainer':
      return `${this.item.name} - Smallcraft Container`;
    case 'starshipweapon':
      return `${this.item.name} - Starship Weapon (1e)`;
    case 'starshipweapon2e':
      return `${this.item.name} - Starship Weapon (2e)`;
    case 'talent':
      return `${this.item.name} - Talent`;
    }
  }

  async _prepareContext(options) {
    const context = {
      item: this.item,
      enrichedNotes: await foundry.applications.ux.TextEditor.enrichHTML(this.item.system.description),
    };
    return context;
  }

  async _updateObject(event, formData) {
    await this.item.update(formData);
  }
}
