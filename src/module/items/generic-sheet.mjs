const api = foundry.applications.api;
const sheets = foundry.applications.sheets;
import {STAItems} from './sta-items.mjs';

export class STAGenericSheet extends STAItems {
  static PARTS = {
    itemsheet: {
      template: 'systems/sta/templates/items/generic-sheet.hbs'
    },
  };
}
