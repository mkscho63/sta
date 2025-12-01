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
    const useReputationInstead = this.element.querySelector('.rollrepnotdis input[type="checkbox"]').checked;
    const reputationValue = parseInt(this.element.querySelector('#total-rep')?.value, 10) || 0;
    const systemCheckboxes = this.element.querySelectorAll('.attribute-block .selector.attribute');
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
    if (useReputationInstead) {
      selectedDiscipline = 'reputation';
      selectedDisciplineValue = reputationValue;
    } else {
      const departmentCheckboxes = this.element.querySelectorAll('.discipline-block .selector.discipline');
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
    }
    const defaultValue = 2;
    const speaker = this.actor;
    const template = 'systems/sta/templates/apps/dicepool-attribute.hbs';
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

  async _onCheatSheet(event) {
    event?.preventDefault?.();
    const tmpl = 'systems/sta/templates/apps/cheat-sheet1e.hbs';
    const content = await foundry.applications.handlebars.renderTemplate(tmpl);
    new foundry.applications.api.DialogV2({
      window: {title: game.i18n.localize('sta.apps.cheatsheet') + ' - 1e'},
      content,
      classes: ['dialogue'],
      position: {width: 500, height: 'auto'},
      buttons: [
        {
          action: 'close',
          label: game.i18n.localize('sta.apps.close') || 'Close',
          default: true,
          callback: () => {}
        }
      ]
    }).render(true);
  }

  _onStressTrackUpdate(event) {
    const localizedValues = {
      resolute: game.i18n.localize('sta.actor.character.talents.resolute'),
    };
    if (event) {
      const clickedStress = event.target;
      const stressValue = parseInt(clickedStress.textContent, 10);
      if (stressValue === 1 && clickedStress.classList.contains('selected') && this.actor.system.stress.value === 1) {
        this.actor.system.stress.value = 0;
      } else {
        this.actor.system.stress.value = stressValue;
      }
    }
    const fitnessValue = parseInt(this.element.querySelector('#fitness')?.value || 0, 10);
    const securityValue = parseInt(this.element.querySelector('#security')?.value || 0, 10);
    const stressModValue = parseInt(this.element.querySelector('#strmod')?.value || 0, 10);
    let stressTrackMax = fitnessValue + securityValue + stressModValue;
    const hasResolute = this.element.querySelector(`[data-talent-name*="${localizedValues.resolute}"]`);
    if (hasResolute) {
      stressTrackMax += 3;
    }
    const maxStressInput = this.element.querySelector('#max-stress');
    if (maxStressInput && maxStressInput.value != stressTrackMax) {
      maxStressInput.value = stressTrackMax;
    }
    const barRenderer = this.element.querySelector('#bar-stress-renderer');
    barRenderer.innerHTML = '';
    const totalStressValue = this.actor?.system?.stress?.value || parseInt(this.element.querySelector('#total-stress')?.value || 0, 10);
    for (let i = 1; i <= stressTrackMax; i++) {
      const div = document.createElement('div');
      div.className = 'box stress';
      div.id = `stress-${i}`;
      div.textContent = i;
      div.style.width = `calc(100% / ${stressTrackMax})`;
      div.setAttribute('data-action', 'onStressTrackUpdate');
      if (i <= totalStressValue) {
        div.classList.add('selected');
      }
      barRenderer.appendChild(div);
    }
    if (!this.document.isOwner) return;
    this.actor?.update({
      'system.stress.value': this.actor.system.stress.value,
      'system.stress.max': stressTrackMax,
    });
  }

  _onReputationTrackUpdate(event) {
    if (event) {
      const clickedReputation = event.target;
      const reputationValue = parseInt(clickedReputation.textContent, 10);
      if (reputationValue === 1 && clickedReputation.classList.contains('selected') && this.actor.system.reputation === 1) {
        this.actor.system.reputation = 0;
      } else {
        this.actor.system.reputation = reputationValue;
      }
    }
    const reputationTrackMax = game.settings.get('sta', 'maxNumberOfReputation');
    const barRenderer = this.element.querySelector('#bar-rep-renderer');
    barRenderer.innerHTML = '';
    const totalReputationValue = this.actor?.system?.reputation || parseInt(this.element.querySelector('#total-rep')?.value || 0, 10);
    for (let i = 1; i <= reputationTrackMax; i++) {
      const div = document.createElement('div');
      div.className = 'box rep';
      div.id = `rep-${i}`;
      div.textContent = i;
      div.style.width = `calc(100% / ${reputationTrackMax})`;
      div.setAttribute('data-action', 'onReputationTrackUpdate');
      if (i <= totalReputationValue) {
        div.classList.add('selected');
      }
      barRenderer.appendChild(div);
    }
    this.actor?.update({
      'system.reputation': this.actor.system.reputation,
    });
  }
}
