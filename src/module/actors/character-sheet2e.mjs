const api = foundry.applications.api;
const sheets = foundry.applications.sheets;
import {STAActors} from './sta-actors.mjs';

export class STACharacterSheet2e extends STAActors {
  static PARTS = {
    charactersheet: {
      template: 'systems/sta/templates/actors/character-sheet2e.hbs'
    },
    limitedsheet: {
      template: 'systems/sta/templates/actors/limited-sheet.hbs'
    },
  };

  get title() {
    return `${this.actor.name} - Character (2e)`;
  }

  get tracks() {
    return {
      ...super.tracks,
      stress: true,
      determination: true,
      reputation: true,
    };
  }

  get allowedItemTypes() {
    return new Set([
      'item',
      'focus',
      'value',
      'characterweapon2e',
      'armor',
      'talent',
      'milestone',
      'log',
      'injury',
      'trait'
    ]);
  }
}
