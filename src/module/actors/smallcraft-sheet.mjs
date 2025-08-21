const api = foundry.applications.api;
const sheets = foundry.applications.sheets;
import {STAActors} from './sta-actors.mjs';

export class STASmallCraftSheet extends STAActors {
  static PARTS = {
    charactersheet: {
      template: 'systems/sta/templates/actors/smallcraft-sheet.hbs'
    },
    limitedsheet: {
      template: 'systems/sta/templates/actors/limited-ship.hbs'
    },
  };

  get title() {
    return `${this.actor.name} - Small Craft (1e)`;
  }

  get tracks() {
    return {
      ...super.tracks,
      shield: true,
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
      'trait'
    ]);
  }

  async _onAttributeTest(event) {
    event.preventDefault();
    const i18nKey = 'sta.roll.complicationroller';
    let localizedLabel = game.i18n.localize(i18nKey)?.trim();
    if (!localizedLabel || localizedLabel === i18nKey) localizedLabel = 'Complication Range';
    const escRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const labelPattern = escRe(localizedLabel).replace(/\s+/g, '\\s*');
    const compRx = new RegExp(`${labelPattern}\\s*\\+\\s*(\\d+)`, 'i');
    const sceneComplicationBonus = (() => {
      try {
        const scene = game.scenes?.active;
        if (!scene) return 0;
        let bonus = 0;
        const tokens = scene.tokens?.contents ?? scene.tokens ?? [];
        for (const tok of tokens) {
          const actor = tok?.actor;
          if (!actor || actor.type !== 'scenetraits') continue;
          for (const item of actor.items ?? []) {
            const m = compRx.exec(item.name ?? '');
            if (m) bonus += Number(m[1]) || 0;
          }
        }
        return bonus;
      } catch (err) {
        console.error('Scene complication bonus error:', err);
        return 0;
      }
    })();
    const calculatedComplicationRange = Math.min(5, Math.max(1, 1 + sceneComplicationBonus));
    let selectedAttribute = null;
    let selectedAttributeValue = 0;
    let selectedDiscipline = null;
    let selectedDisciplineValue = 0;
    const systemCheckboxes = this.element.querySelectorAll('.systems-block .selector.system');
    systemCheckboxes.forEach((checkbox) => {
      if (checkbox.checked) {
        const systemId = checkbox.id.replace('.selector', '');
        selectedAttribute = systemId;
        const systemValueInput = this.element.querySelector(`#${systemId}`);
        if (systemValueInput) {
          selectedAttributeValue = parseInt(systemValueInput.value, 10) || 0;
        }
      }
    });

    const departmentCheckboxes = this.element.querySelectorAll('.departments-block .selector.department');
    departmentCheckboxes.forEach((checkbox) => {
      if (checkbox.checked) {
        const departmentId = checkbox.id.replace('.selector', '');
        selectedDiscipline = departmentId;
        const departmentValueInput = this.element.querySelector(`#${departmentId}`);
        if (departmentValueInput) {
          selectedDisciplineValue = parseInt(departmentValueInput.value, 10) || 0;
        }
      }
    });
    const defaultValue = 1;
    const speaker = this.actor;
    const template = 'systems/sta/templates/apps/dicepool-attributess.hbs';
    const html = await foundry.applications.handlebars.renderTemplate(template, {
      defaultValue, calculatedComplicationRange
    });
    const formData = await api.DialogV2.wait({
      window: {
        title: game.i18n.localize('sta.apps.dicepoolwindow')
      },
      position: {
        height: 'auto',
        width: 350
      },
      content: html,
      classes: ['dialogue'],
      buttons: [{
        action: 'roll',
        default: true,
        label: game.i18n.localize('sta.apps.rolldice'),
        callback: (event, button, dialog) => {
          const form = dialog.element.querySelector('form');
          return form ? new FormData(form) : null;
        },
      },],
      close: () => null,
    });
    if (formData) {
      const dicePool = parseInt(formData.get('dicePoolSlider'), 10) || defaultValue;
      const usingFocus = formData.get('usingFocus') === 'on';
      const usingDedicatedFocus = formData.get('usingDedicatedFocus') === 'on';
      const usingDetermination = formData.get('usingDetermination') === 'on';
      const complicationRange = parseInt(formData.get('complicationRange'), 10) || 1;
      const staRoll = new STARoll();
      staRoll.performAttributeTest(
        dicePool,
        usingFocus,
        usingDedicatedFocus,
        usingDetermination,
        selectedAttribute,
        selectedAttributeValue,
        selectedDiscipline,
        selectedDisciplineValue,
        complicationRange,
        speaker
      );
    }
  }

  async _onShieldTrackUpdate(event) {
    const localizedValues = {
      advancedshields: game.i18n.localize('sta.actor.starship.talents.advancedshields'),
    };
    if (event) {
      const clickedShield = event.target;
      const shieldValue = parseInt(clickedShield.textContent, 10);
      if (shieldValue === 1 && clickedShield.classList.contains('selected') && this.actor.system.shields.value === 1) {
        this.actor.system.shields.value = 0;
      } else {
        this.actor.system.shields.value = shieldValue;
      }
    }
    const structureValue = parseInt(this.element.querySelector('#structure')?.value || 0, 10);
    const securityValue = parseInt(this.element.querySelector('#security')?.value || 0, 10);
    const shieldModValue = parseInt(this.element.querySelector('#shieldmod')?.value || 0, 10);
    let shieldsTrackMax = Math.floor((structureValue + securityValue) / 2) + shieldModValue;
    const hasAdvancedShields = this.element.querySelector(`[data-talent-name*="${localizedValues.advancedshields}"]`);
    if (hasAdvancedShields) {
      shieldsTrackMax += 5;
    }
    const maxShieldsInput = this.element.querySelector('#max-shields');
    if (maxShieldsInput && maxShieldsInput.value != shieldsTrackMax) {
      maxShieldsInput.value = shieldsTrackMax;
    }
    const barRenderer = this.element.querySelector('#bar-shields-renderer');
    barRenderer.innerHTML = '';
    const totalShieldsValue = this.actor?.system?.shields?.value || parseInt(this.element.querySelector('#total-shields')?.value || 0, 10);
    for (let i = 1; i <= shieldsTrackMax; i++) {
      const div = document.createElement('div');
      div.className = 'box shields';
      div.id = `shields-${i}`;
      div.textContent = i;
      div.style.width = `calc(100% / ${shieldsTrackMax})`;
      div.setAttribute('data-action', 'onShieldTrackUpdate');
      if (i <= totalShieldsValue) {
        div.classList.add('selected');
      }
      barRenderer.appendChild(div);
    }
    this.actor?.update({
      'system.shields.value': this.actor.system.shields.value,
      'system.shields.max': shieldsTrackMax,
    });
  }

  async _onPowerTrackUpdate(event) {
    const localizedValues = {
      secondaryreactors: game.i18n.localize('sta.actor.starship.talents.secondaryreactors'),
    };
    if (event) {
      const clickedPower = event.target;
      const powerValue = parseInt(clickedPower.textContent, 10);
      if (powerValue === 1 && clickedPower.classList.contains('selected') && this.actor.system.power.value === 1) {
        this.actor.system.power.value = 0;
      } else {
        this.actor.system.power.value = powerValue;
      }
    }
    const engineValue = parseInt(this.element.querySelector('#engines')?.value || 0, 10);
    let powerTrackMax = Math.ceil(engineValue / 2);
    const hasSecondaryReactors = this.element.querySelector(`[data-talent-name*="${localizedValues.secondaryreactors}"]`);
    if (hasSecondaryReactors) {
      powerTrackMax += 5;
    }
    const maxPowerInput = this.element.querySelector('#max-power');
    if (maxPowerInput && maxPowerInput.value != powerTrackMax) {
      maxPowerInput.value = powerTrackMax;
    }
    const barRenderer = this.element.querySelector('#bar-power-renderer');
    barRenderer.innerHTML = '';
    const totalPowerValue = this.actor?.system?.power?.value || parseInt(this.element.querySelector('#total-power')?.value || 0, 10);
    for (let i = 1; i <= powerTrackMax; i++) {
      const div = document.createElement('div');
      div.className = 'box power';
      div.id = `power-${i}`;
      div.textContent = i;
      div.style.width = `calc(100% / ${powerTrackMax})`;
      div.setAttribute('data-action', 'onPowerTrackUpdate');
      if (i <= totalPowerValue) {
        div.classList.add('selected');
      }
      barRenderer.appendChild(div);
    }
    this.actor?.update({
      'system.power.value': this.actor.system.power.value,
      'system.power.max': powerTrackMax,
    });
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
