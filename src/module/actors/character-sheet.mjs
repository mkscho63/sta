const api = foundry.applications.api;
const sheets = foundry.applications.sheets;
import {STAActors} from './sta-actors.mjs';

export class STACharacterSheet extends STAActors {
  static PARTS = {
    charactersheet: {
      template: 'systems/sta/templates/actors/character-sheet.hbs'
    },
    limitedsheet: {
      template: 'systems/sta/templates/actors/limited-sheet.hbs'
    },
  };

  get title() {
    return `${this.actor.name} - Character (1e)`;
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
      'characterweapon',
      'armor',
      'talent',
      'log',
      'milestone',
      'injury',
      'trait'
    ]);
  }

  get taskRollData() {
    return {
      template: 'systems/sta/templates/apps/dicepool-attribute1e.hbs',
      rolltype: 'character1e',
      defaultValue: '2',
    };
  }

  get cheatsheet() {
    return {
      tmpl: 'systems/sta/templates/apps/cheat-sheet1e.hbs',
      version: ' - 1e',
    };
  }

  async _StressTrackMax() {
    const localizedValues = {
      resolute: game.i18n.localize('sta.actor.character.talents.resolute'),
    };
    const fitnessValue = parseInt(this.element.querySelector('#fitness')?.value || 0, 10);
    const securityValue = parseInt(this.element.querySelector('#security')?.value || 0, 10);
    const stressModValue = parseInt(this.element.querySelector('#strmod')?.value || 0, 10);
    let stressTrackMax = fitnessValue + securityValue + stressModValue;
    const hasResolute = this.element.querySelector(`[data-talent-name*="${localizedValues.resolute}"]`);
    if (hasResolute) {
      stressTrackMax += 3;
    }
    return stressTrackMax;
  }

  get reputationTrackMax() {
    return {
      value: game.settings.get('sta', 'maxNumberOfReputation'),
    };
  }
}
