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

  _onStressTrackUpdate(event) {
    const numValues = this.actor.itemTypes.value.length;
    if (!numValues) return;

    const localizedValues = {
      tough: game.i18n.localize('sta.actor.character.talents.tough'),
      resolute: game.i18n.localize('sta.actor.character.talents.resolute'),
      mentaldiscipline: game.i18n.localize('sta.actor.character.talents.mentaldiscipline')
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

  _onDeterminationTrackUpdate(event) {
    const numValues = this.actor.itemTypes.value.length;
    if (!numValues) return;

    if (event) {
      const clickedDetermination = event.target;
      const determinationValue = parseInt(clickedDetermination.textContent, 10);
      if (determinationValue === 1 && clickedDetermination.classList.contains('selected') && this.actor.system.determination.value === 1) {
        this.actor.system.determination.value = 0;
      } else {
        this.actor.system.determination.value = determinationValue;
      }
    }
    const determinationTrackMax = 3;
    const barRenderer = this.element.querySelector('#bar-determination-renderer');
    barRenderer.innerHTML = '';
    const totalDeterminationValue = this.actor?.system?.determination?.value || parseInt(this.element.querySelector('#total-determination')?.value || 0, 10);
    for (let i = 1; i <= determinationTrackMax; i++) {
      const div = document.createElement('div');
      div.className = 'box determination';
      div.id = `determination-${i}`;
      div.textContent = i;
      div.style.width = `calc(100% / ${determinationTrackMax})`;
      div.setAttribute('data-action', 'onDeterminationTrackUpdate');
      if (i <= totalDeterminationValue) {
        div.classList.add('selected');
      }
      barRenderer.appendChild(div);
    }
    this.actor?.update({
      'system.determination.value': this.actor.system.determination.value,
    });
  }
}
