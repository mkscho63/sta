const api = foundry.applications.api;
const sheets = foundry.applications.sheets;
import {STAActors} from './sta-actors.mjs';

export class STANPCSheet2e extends STAActors {
  static PARTS = {
    charactersheet: {
      template: 'systems/sta/templates/actors/npc-sheet2e.hbs'
    },
    limitedsheet: {
      template: 'systems/sta/templates/actors/limited-sheet.hbs'
    },
  };

  get title() {
    return `${this.actor.name} - NPC (2e)`;
  }

  get tracks() {
    return {
      ...super.tracks,
      stress: true,
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
      'injury',
      'trait'
    ]);
  }

  get taskRollData() {
    const localizedValues = {
      squad: game.i18n.localize('sta.actor.character.squad'),
      squadron: game.i18n.localize('sta.actor.starship.squadron'),
    };

    const squadNameEl =
      this.element.querySelector(`[data-talent-name="${localizedValues.squad}"]`) ||
      this.element.querySelector(`[data-talent-name="${localizedValues.squadron}"]`);

    const squadRow = squadNameEl?.closest('li.row.entry');
    const quantityValue = squadRow?.querySelector('.item-quantity')?.value;
    const squadDice = quantityValue !== undefined ? parseInt(quantityValue, 10) : undefined;

    return {
      template: 'systems/sta/templates/apps/dicepool-attribute2e.hbs',
      rolltype: 'character2e',
      defaultValue: '2',
      squadDice,
    };
  }

  get cheatsheet() {
    return {
      tmpl: 'systems/sta/templates/apps/cheat-sheet.hbs',
      version: ' - 2e',
    };
  }

  async _StressTrackMax() {
    const npcType =
      this.actor?.system?.npcType ??
      this.element.querySelector('input[name="system.npcType"]:checked')?.value ??
      'minor';

    let numValues = 0;
    numValues = this.actor.itemTypes.value.length;

    let fitnessValue = 0;
    if (npcType === 'notable') fitnessValue = 3;
    if (npcType === 'major') fitnessValue = 6 + numValues;

    const stressModValue = parseInt(this.element.querySelector('#strmod')?.value || 0, 10);
    const stressTrackMax = fitnessValue + stressModValue;
    return stressTrackMax;
  }
}
