const api = foundry.applications.api;
const sheets = foundry.applications.sheets;
import {STAItems} from './sta-items.mjs';

export class STACharacterWeaponSheet2e extends STAItems {
  static PARTS = {
    itemsheet: {
      template: 'systems/sta/templates/items/character-weapon-sheet2e.hbs'
    },
  };
  
  static migrateData(source) {
    super.migrateData(source);

    const q = source.system.qualities;

    if (q.opportunity !== undefined) {
      source.system.opportunity = q.opportunity;
      delete q.opportunity;
    }

    if (q.escalation !== undefined) {
      source.system.escalation = q.escalation;
      delete q.escalation;
    }
  }
}
