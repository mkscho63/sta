const api = foundry.applications.api;
const sheets = foundry.applications.sheets;
import {STAItems} from './sta-items.mjs';

export class STASmallCraftContainerSheet extends STAItems {
  static PARTS = {
    itemsheet: {
      template: 'systems/sta/templates/items/smallcraftcontainer-sheet.hbs'
    },
  };

  static DEFAULT_OPTIONS = {
    position: {
      height: 'auto',
      width: 680,
    },
  };

  async _prepareContext(options) {
    const availableSmallcrafts = game.actors.filter((target) => target.type === 'smallcraft' && target.isOwner);
    if (!this.item.system.child) {
      this.item.system.child = availableSmallcrafts[0].id;
    }
    const context = {
      item: this.item,
      enrichedNotes: await foundry.applications.ux.TextEditor.enrichHTML(this.item.system.description),
      availableSmallcrafts: availableSmallcrafts,
    };
    return context;
  }
}
