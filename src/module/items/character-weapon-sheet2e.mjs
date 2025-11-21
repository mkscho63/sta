const api = foundry.applications.api;
const sheets = foundry.applications.sheets;
import {STAItems} from './sta-items.mjs';

export class STACharacterWeaponSheet2e extends STAItems {
  static PARTS = {
    itemsheet: {
      template: 'systems/sta/templates/items/character-weapon-sheet2e.hbs'
    },
  };
}
