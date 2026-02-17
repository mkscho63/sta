const api = foundry.applications.api;
const sheets = foundry.applications.sheets;
import {STAActors} from './sta-actors.mjs';

export class STASupportingSheet2e extends STAActors {
  static PARTS = {
    charactersheet: {
      template: 'systems/sta/templates/actors/supporting-sheet2e.hbs'
    },
    limitedsheet: {
      template: 'systems/sta/templates/actors/limited-sheet.hbs'
    },
  };

  get title() {
    return `${this.actor.name} - Supporting Character (2e)`;
  }

  get tracks() {
    return {
      ...super.tracks,
      stress: true,
      determination: true,
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
      'injury',
      'trait'
    ]);
  }

  get  taskRollData() {
    return {
      template: 'systems/sta/templates/apps/dicepool-attribute2e.hbs',
      rolltype: 'character2e',
      defaultValue: '2',
    };
  }

  get cheatsheet() {
    return {
      tmpl: 'systems/sta/templates/apps/cheat-sheet.hbs',
      version: ' - 2e',
    };
  }
  
  async _StressTrackMax() {
    const numValues = this.actor.itemTypes.value.length;
    if (!numValues) return;

    const localizedValues = {
      tough: game.i18n.localize('sta.actor.character.talents.tough'),
      resolute: game.i18n.localize('sta.actor.character.talents.resolute'),
      mentaldiscipline: game.i18n.localize('sta.actor.character.talents.mentaldiscipline')
    };
    const fitnessValue = parseInt(this.element.querySelector('#fitness')?.value || 0, 10);
    const stressModValue = parseInt(this.element.querySelector('#strmod')?.value || 0, 10);
    let stressTrackMax = fitnessValue + stressModValue;
    const hasTough = this.element.querySelector(`[data-talent-name*="${localizedValues.tough}"]`);
    if (hasTough) {
      stressTrackMax += 2;
    }
    const hasResolute = this.element.querySelector(`[data-talent-name*="${localizedValues.resolute}"]`);
    if (hasResolute) {
      stressTrackMax += parseInt(this.element.querySelector('#command')?.value || 0, 10);
    }
    const hasMentalDiscipline = this.element.querySelector(`[data-talent-name*="${localizedValues.mentaldiscipline}"]`);
    if (hasMentalDiscipline) {
      stressTrackMax = parseInt(this.element.querySelector('#control')?.value || 0, 10);
    }
    if (numValues === 1) {
      stressTrackMax = Math.ceil(stressTrackMax / 2);
    }
    return stressTrackMax;
  }
}
