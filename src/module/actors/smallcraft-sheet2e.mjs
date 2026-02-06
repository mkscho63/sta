const api = foundry.applications.api;
const sheets = foundry.applications.sheets;
import {STAActors} from './sta-actors.mjs';

export class STASmallCraftSheet2e extends STAActors {
  static PARTS = {
    charactersheet: {
      template: 'systems/sta/templates/actors/smallcraft-sheet2e.hbs'
    },
    limitedsheet: {
      template: 'systems/sta/templates/actors/limited-ship.hbs'
    },
  };

  get title() {
    return `${this.actor.name} - Small Craft (2e)`;
  }

  get tracks() {
    return {
      ...super.tracks,
      shield: true,
      weapon: true,
      breach: true,
    };
  }

  get allowedItemTypes() {
    return new Set([
      'item',
      'value',
      'starshipweapon2e',
      'talent',
      'injury',
      'trait'
    ]);
  }

  get  taskRollData() {
    return {
      template: 'systems/sta/templates/apps/dicepool-attributess.hbs',
      rolltype: 'starship',
      defaultValue: '1',
    };
  }

  async _shieldsTrackMax() {
    const localizedValues = {
      advancedshields: game.i18n.localize('sta.actor.starship.talents.advancedshields'),
      polarizedhullplating: game.i18n.localize('sta.actor.starship.talents.polarizedhullplating'),
    };

    const structureValue = parseInt(this.element.querySelector('#structure')?.value || 0, 10);
    const securityValue = parseInt(this.element.querySelector('#security')?.value || 0, 10);
    const scaleValue = parseInt(this.element.querySelector('#scale')?.value || 0, 10);
    const shieldModValue = parseInt(this.element.querySelector('#shieldmod')?.value || 0, 10);
    let shieldsTrackMax = structureValue + securityValue + scaleValue + shieldModValue;
    const hasAdvancedShields = this.element.querySelector(`[data-talent-name*="${localizedValues.advancedshields}"]`);
    if (hasAdvancedShields) {
      shieldsTrackMax += 5;
    }
    const hasPolarizedHullPlating = this.element.querySelector(`[data-talent-name*="${localizedValues.polarizedhullplating}"]`);
    if (hasPolarizedHullPlating) {
      shieldsTrackMax = structureValue + shieldModValue;
    }
    return shieldsTrackMax;
  }  
}