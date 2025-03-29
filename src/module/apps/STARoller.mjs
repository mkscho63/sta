import {
  STARoll
} from '../apps/roll.js';
const api = foundry.applications.api;
export class STARoller {
  static async _onTaskRoll(event) {
    event.preventDefault();
    let selectedAttribute = null;
    let selectedDiscipline = null;

    const defaultValue = 2;
    const speaker = {
          type: 'sidebar'
        };
    const template = 'systems/sta/templates/apps/dicepool-attribroller.hbs';
    const html = await foundry.applications.handlebars.renderTemplate(template, {
      defaultValue
    });
    const formData = await api.DialogV2.wait({
      window: {
        title: game.i18n.localize('sta.apps.dicepoolwindow')
      },
      position: {
        height: "auto",
        width: 350
      },
      content: html,
      classes: ["dialogue"],
      buttons: [{
        action: "roll",
        default: true,
        label: game.i18n.localize('sta.apps.rolldice'),
        callback: (event, button, htmlElement) => {
          const form = htmlElement.querySelector("form");
          return form ? new FormData(form) : null;
        },
      }, ],
      close: () => null,
    });
    if (formData) {
      let dicePool = parseInt(formData.get('dicePoolSlider'), 10) || defaultValue;
      const selectedAttributeValue = parseInt(document.getElementById("selectedAttributeValue").value, 10) || 0;
      const selectedDisciplineValue = parseInt(document.getElementById("selectedDisciplineValue").value, 10) || 0;
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

  static async _onChallengeRoll(event) {
    event.preventDefault();
    const defaultValue = 2;
    const speaker = game.user;
    const weaponName = '';
    const template = 'systems/sta/templates/apps/dicepool-challenge.hbs';
    const html = await foundry.applications.handlebars.renderTemplate(template, {
      defaultValue
    });
    const formData = await api.DialogV2.wait({
      window: {
        title: game.i18n.localize('sta.apps.dicepoolwindow')
      },
      position: {
        height: "auto",
        width: 350
      },
      content: html,
      classes: ["dialogue"],
      buttons: [{
        action: "roll",
        default: true,
        label: game.i18n.localize('sta.apps.rolldice'),
        callback: (event, button, htmlElement) => {
          const form = htmlElement.querySelector("form");
          return form ? new FormData(form) : null;
        },
      }, ],
      close: () => null,
    });
    if (!formData) return;
    const dicePool = formData?.get('dicePoolValue') || defaultValue;
    const staRoll = new STARoll();
    staRoll.performChallengeRoll(dicePool, weaponName, speaker);
  }

  static async _onNPCRoll(event) {
    event.preventDefault();
    const defaultValue = 7;
    const defaultDepartmentValue = 2;
    const speakerNPC = {
      type: 'npccharacter'
    };
    let speakerStarship = {
      type: 'starship'
    };
    const token = canvas.tokens.controlled[0];
    const template = 'systems/sta/templates/apps/dicepool-npc.hbs';
    const html = await foundry.applications.handlebars.renderTemplate(template, {
      defaultValue,
      defaultDepartmentValue,
    });
    const formData = await api.DialogV2.wait({
      window: {
        title: game.i18n.localize('sta.roll.npcshipandcrewroll')
      },
      position: {
        height: 'auto',
        width: 420
      },
      content: html,
      classes: ['dialogue'],
      buttons: [{
        action: 'roll',
        default: true,
        label: game.i18n.localize('sta.apps.rolldice'),
        callback: (event, button, htmlElement) => {
          const form = htmlElement.querySelector('form');
          return form ? new FormData(form) : null;
        },
      }, ],
      close: () => null,
    });
    if (formData) {
      const selectedSystem = 'STARoller';
      const selectedSystemValue = parseInt(formData.get('systemValue'), 10) || defaultValue;
      const selectedDepartment = 'STARoller';
      const selectedDepartmentValue = parseInt(formData.get('departmentValue'), 10) || defaultDepartmentValue;
      const numDice = parseInt(formData.get('dicePoolSlider'), 10) || 2;
      const skillLevel = formData.get('skillLevel') || 'basic';
      const complicationRange = parseInt(formData.get('complicationRange'), 10) || 1;
      const shipNumDice = 1;
      const shipAssist = formData.get('shipAssist') === 'on';
      let attributes = 8;
      let departments = 1;
      switch (skillLevel) {
        case 'proficient':
          attributes = 9;
          departments = 2;
          break;
        case 'talented':
          attributes = 10;
          departments = 3;
          break;
        case 'exceptional':
          attributes = 11;
          departments = 4;
          break;
      }
      speakerStarship = {
        type: 'npcship'
      };
      const staRoll = new STARoll();
      staRoll.performAttributeTest(
        numDice,
        true,
        false,
        false,
        skillLevel,
        attributes,
        skillLevel,
        departments,
        complicationRange,
        speakerNPC
      );
      if (shipAssist) {
        staRoll.performAttributeTest(
          shipNumDice,
          true,
          false,
          false,
          selectedSystem,
          selectedSystemValue,
          selectedDepartment,
          selectedDepartmentValue,
          complicationRange,
          speakerStarship
        );
      }
    }
  }
}