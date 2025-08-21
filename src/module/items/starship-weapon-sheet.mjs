const api = foundry.applications.api;
const sheets = foundry.applications.sheets;
import {STAItems} from './sta-items.mjs';

export class STAStarshipWeaponSheet extends STAItems {
  static PARTS = {
    itemsheet: {
      template: 'systems/sta/templates/items/starship-weapon-sheet.hbs'
    },
  };

  static DEFAULT_OPTIONS = {
    position: {
      height: 'auto',
      width: 565,
    },
  };
}
