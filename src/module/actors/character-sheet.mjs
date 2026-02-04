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

  get  taskRollData() {
    return {
      template: 'systems/sta/templates/apps/dicepool-attribute1e.hbs',
      rolltype: 'character1e',
      defaultValue: '2',
    };
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
