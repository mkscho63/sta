const api = foundry.applications.api;
const sheets = foundry.applications.sheets;
import {STAItems} from './sta-items.mjs';

export class STATraitSheet extends STAItems {
  static PARTS = {
    itemsheet: {
      template: 'systems/sta/templates/items/trait-sheet.hbs'
    },
  };
}
