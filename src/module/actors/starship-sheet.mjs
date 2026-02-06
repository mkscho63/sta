const api = foundry.applications.api;
const sheets = foundry.applications.sheets;
import {STAActors} from './sta-actors.mjs';

export class STAStarshipSheet extends STAActors {
  static PARTS = {
    charactersheet: {
      template: 'systems/sta/templates/actors/starship-sheet.hbs'
    },
    limitedsheet: {
      template: 'systems/sta/templates/actors/limited-ship.hbs'
    },
  };

  get title() {
    return `${this.actor.name} - Starship (1e)`;
  }

  get tracks() {
    return {
      ...super.tracks,
      shield: true,
      crew: true,
      power: true,
      weapon: true,
      breach: true,
    };
  }

  get allowedItemTypes() {
    return new Set([
      'item',
      'value',
      'starshipweapon',
      'talent',
      'injury',
      'smallcraftcontainer',
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
    };

    const structureValue = parseInt(this.element.querySelector('#structure')?.value || 0, 10);
    const securityValue = parseInt(this.element.querySelector('#security')?.value || 0, 10);
    const shieldModValue = parseInt(this.element.querySelector('#shieldmod')?.value || 0, 10);
    let shieldsTrackMax = structureValue + securityValue + shieldModValue;
    const hasAdvancedShields = this.element.querySelector(`[data-talent-name*="${localizedValues.advancedshields}"]`);
    if (hasAdvancedShields) {
      shieldsTrackMax += 5;
    }
    return shieldsTrackMax;
  }

  async _crewTrackMax() {
    const scaleValue = parseInt(this.element.querySelector('#scale')?.value || 0, 10);
    const crwModValue = parseInt(this.element.querySelector('#crwmod')?.value || 0, 10);
    const crewTrackMax = scaleValue + crwModValue;
    const maxCrewInput = this.element.querySelector('#max-crew');
    return crewTrackMax;
  }

  async _powerTrackMax() {
    const localizedValues = {
      secondaryreactors: game.i18n.localize('sta.actor.starship.talents.secondaryreactors'),
    };

    const engineValue = parseInt(this.element.querySelector('#engines')?.value || 0, 10);
    let powerTrackMax = engineValue;
    const hasSecondaryReactors = this.element.querySelector(`[data-talent-name*="${localizedValues.secondaryreactors}"]`);
    if (hasSecondaryReactors) {
      powerTrackMax += 5;
    }
     return powerTrackMax;
  }

  _updateWeaponValues() {
    this.element.querySelectorAll('[id^=starship-weapon-]').forEach((element) => {
      const weaponDamage = parseInt(element.dataset.itemDamage, 10) || 0;
      const weaponsInput = this.element.querySelector('#security');
      let weaponValue = 0;
      weaponValue = parseInt(weaponsInput.value, 10) || 0;
      const scaleInput = this.element.querySelector('#scale');
      let scaleDamage = 0;
      if (element.dataset.itemIncludescale === 'true') {
        scaleDamage = parseInt(scaleInput.value, 10) || 0;
      }
      const attackDamageValue = weaponDamage + weaponValue + scaleDamage;
      const damageElement = element.querySelector('.damage');
      if (damageElement) {
        damageElement.innerText = attackDamageValue;
      }
    });
  }

  _updateBreachValues() {
    const scaleInput = this.element.querySelector('#scale');
    const shipScaleValue = scaleInput ? parseInt(scaleInput.value, 10) || 0 : 0;
    let totalBreaches = 0;
    this.element.querySelectorAll('.field.numeric-entry.breaches').forEach((input) => {
      const breachValue = parseInt(input.value, 10) || 0;
      totalBreaches += breachValue;
      const isSystemDamaged = breachValue >= Math.ceil(shipScaleValue / 2);
      const isSystemDisabled = breachValue >= Math.ceil(shipScaleValue);
      const isSystemDestroyed = breachValue >= Math.ceil(shipScaleValue + 1);
      input.classList.remove('highlight-damaged', 'highlight-disabled', 'highlight-destroyed');
      if (isSystemDamaged && !isSystemDisabled && !isSystemDestroyed) {
        input.classList.add('highlight-damaged');
      } else if (isSystemDisabled && !isSystemDestroyed) {
        input.classList.add('highlight-disabled');
      } else if (isSystemDestroyed) {
        input.classList.add('highlight-destroyed');
      }
    });
  }
}
