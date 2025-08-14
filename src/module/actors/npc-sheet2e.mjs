
import { STACharacterSheet2e } from "./character-sheet2e.mjs";

export class STANPCSheet2e extends STACharacterSheet2e {
  static PARTS = {
    charactersheet: {
      template: 'systems/sta/templates/actors/npc-sheet2e.hbs'
    },
    limitedsheet: {
      template: 'systems/sta/templates/actors/limited-sheet.hbs'
    },
  };

  _onDeterminationTrackUpdate(event) {
  }

  _onReputationTrackUpdate(event) {
  }

  _onStressTrackUpdate(event) {
    if (event) {
      const clickedStress = event.target;
      const stressValue = parseInt(clickedStress.textContent, 10);
      if (stressValue === 1 && clickedStress.classList.contains('selected') && this.actor.system.stress.value === 1) {
        this.actor.system.stress.value = 0;
      } else {
        this.actor.system.stress.value = stressValue;
      }
    }
    const npcType =
      this.actor?.system?.npcType ??
      this.element.querySelector('input[name="system.npcType"]:checked')?.value ??
      'minor';

    let numValues = 0;
    numValues = this.actor.itemTypes.value.length;

    let fitnessValue = 0;
    if (npcType === 'notable') fitnessValue = 3;
    if (npcType === 'major')   fitnessValue = 6 + numValues;

    const stressModValue = parseInt(this.element.querySelector('#strmod')?.value || 0, 10);
    let stressTrackMax = fitnessValue + stressModValue;

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
    this.actor?.update({
      'system.stress.value': this.actor.system.stress.value,
      'system.stress.max': stressTrackMax,
    });
  }
}