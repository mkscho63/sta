const api = foundry.applications.api;

export class STARoll {

  // ######################################################
  // #                                                    #
  // #                    Task Rolls                      #
  // #                                                    #
  // ######################################################

  async rollTask(taskdata) {
    const chatData  = await this._performRollTask(taskdata);

    // Check if the dice3d module exists (Dice So Nice). If it does, post a roll in that and then send to chat after the roll has finished. If not just send to chat.
    if (game.dice3d) {
      game.dice3d.showForRoll(taskRolled, game.user, true).then((displayed) => {
        this.sendToChat(chatData);
      });
    } else {
      this.sendToChat(chatData);
    };
  }

  async _performRollTask(taskData) {
    //Collect the data to make the roll
    const defaultValue = '2';
    let dicePool = defaultValue;
    let usingFocus = false;
    let usingDedicatedFocus = false;
    let usingDetermination = false;
    let complicationRange = 1;
    let chattemplate = 'systems/sta/templates/chat/attribute-test.hbs';
    const calculatedComplicationRange  = await this._sceneComplications();
    const template = taskData.template;
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
      dicePool = parseInt(formData.get('dicePoolSlider'), 10);
      usingFocus = formData.get('usingFocus') === 'on';
      usingDedicatedFocus = formData.get('usingDedicatedFocus') === 'on';
      usingDetermination = formData.get('usingDetermination') === 'on';
      complicationRange = parseInt(formData.get('complicationRange'), 10);
    }
 
    //pre-roll calculations
    if (taskData.useReputationInstead) {
      selectedDiscipline = 'reputation';
      selectedDisciplineValue = taskData.reputationValue;
    }
    const checkTarget = taskData.selectedAttributeValue + taskData.selectedDisciplineValue + taskData.selectedSystemValue + taskData.selectedDepartmentValue;
    const doubleDiscipline = taskData.selectedDisciplineValue + taskData.selectedDisciplineValue;  
    const complicationMinimumValue = 20 - complicationRange;
    let diceToRoll = dicePool;
    if (usingDetermination && taskData.actortype !== 'character1e') {
      diceToRoll = dicePool - 1;
    }

    //do the roll
    const taskRolled = await new Roll(diceToRoll + 'd20').evaluate({});

    //work out the results
    let i;
    let result = 0;
    let diceString = '';
    let diceOutcome = [];
    let success = 0;
    let complication = 0;
    let withDetermination = '';
    for (i = 0; i < diceToRoll; i++) {
      result = taskRolled.terms[0].results[i].result;
      // If using focus and the result is less than or equal to the discipline, that counts as 2 successes and we want to show the dice as green.
      if ((usingFocus && result <= taskData.selectedDisciplineValue) || result == 1) {
        diceString += '<li class="roll die d20 max">' + result + '</li>';
        diceOutcome.push(result);
        success += 2;
      // If using dedicated focus and the result is less than or equal to double the discipline, that counts as 2 successes and we want to show the dice as green.
      } else if ((usingDedicatedFocus && result <= doubleDiscipline) || result == 1) {
        diceString += '<li class="roll die d20 max">' + result + '</li>';
        diceOutcome.push(result);
        success += 2;
        // If the result is less than or equal to the target (the discipline and attribute added together), that counts as 1 success but we want to show the dice as normal.
      } else if (result <= checkTarget) {
        diceString += '<li class="roll die d20">' + result + '</li>';
        diceOutcome.push(result);
        success += 1;
        // If the result is greater than or equal to the complication range, then we want to count it as a complication. We also want to show it as red!
      } else if (result >= complicationMinimumValue) {
        diceString += '<li class="roll die d20 min">' + result + '</li>';
        diceOutcome.push(result);
        complication += 1;
        // If none of the above is true, the dice failed to do anything and is treated as normal.
      } else {
        diceString += '<li class="roll die d20">' + result + '</li>';
        diceOutcome.push(result);
      }
    }
    if (usingDetermination) {
      diceString += '<li class="roll die d20 max">' + 1 + '</li>';
      diceOutcome.push(1);
      success += 2;
      withDetermination = ', ' + game.i18n.format('sta.actor.character.determination');
    }
    if (usingFocus) {
      withFocus = ', ' + game.i18n.format('sta.actor.belonging.focus.title');
    }
    if (usingDedicatedFocus) {
      withDedicatedFocus = withDedicatedFocus = ', ' + game.i18n.format('sta.roll.dedicatedfocus');
    }

    // Here we want to check if the success was exactly one (as "1 Successes" doesn't make grammatical sense). We create a string for the Successes.
    let successText = '';
    if (success == 1) {
      successText = success + ' ' + game.i18n.format('sta.roll.success');
    } else {
      successText = success + ' ' + game.i18n.format('sta.roll.successPlural');
    }

    let complicationText = '';
    if (complication >= 1) {
      const localisedPluralisation = game.i18n.format('sta.roll.complicationPlural');
      complicationText = '<h4 class="dice-total failure"> ' + localisedPluralisation.replace('|#|', complication) + '</h4>';
    }

    //add flavor for the roll card
    let flavor = '';
    switch (taskData.rolltype) {
    case 'character2e':
      flavor = game.i18n.format('sta.actor.character.attribute.' + taskData.selectedAttribute) + ' ' + game.i18n.format('sta.actor.character.discipline.' + taskData.selectedDiscipline) + ' ' + game.i18n.format('sta.roll.task.name');
      break;
    case 'starship':
      flavor = game.i18n.format('sta.actor.starship.system.' + taskData.selectedAttribute) + ' ' + game.i18n.format('sta.actor.starship.department.' + taskData.selectedDiscipline) + ' ' + game.i18n.format('sta.roll.task.name');
      break;
    case 'sidebar':
      flavor = game.i18n.format('sta.apps.staroller') + ' ' + game.i18n.format('sta.roll.task.name');
      break;
    case 'npccharacter':
      flavor = game.i18n.format('sta.roll.npccrew' + taskData.selectedAttribute) + ' ' + game.i18n.format('sta.roll.npccrew') + ' ' + game.i18n.format('sta.roll.task.name');
      break;
    case 'npcship':
      flavor = game.i18n.format('sta.roll.npcship') + ' ' + game.i18n.format('sta.roll.task.name');
      break;
    case 'reroll':
      flavor = game.i18n.format('sta.roll.rerollresults') + ' ' + speaker.id + ' ' + game.i18n.format('sta.roll.task.name');
      html = await foundry.applications.handlebars.renderTemplate('systems/sta/templates/chat/reroll.hbs', chatData);
      break;
    }

    //assemble the data for the chat card
    const chatData = { 
      chattemplate: chattemplate,
      speakername: taskData.speakername,
    }
    return chatData;
  }

  // get the complication range from scenetraits
  async _sceneComplications() {
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
    const calculatedComplicationRange  = Math.min(5, Math.max(1, 1 + sceneComplicationBonus));
    return calculatedComplicationRange;
  }






  // ######################################################
  // #                                                    #
  // #                   Send to Chat                     #
  // #                                                    #
  // ######################################################

  async sendToChat(chatData) {
    const rollMode = game.settings.get('core', 'rollMode');
    const messageProps = {
      user: game.user.id,
      speaker: chatData.speakername,
//      content: content,
//      sound: sound,
//      flags: {},
    };
//    if (typeof item != 'undefined') {
//      messageProps.flags.sta = {
//        itemData: item.toObject(),
//      };
//    }
//    if (chatData) {
//      messageProps.flags.sta = {
//        ...messageProps.flags.sta,
//        chatData: chatData,
//      };
//    }
//    if (typeof roll != 'undefined') {
//      messageProps.roll = roll;
//    }
//    if (typeof flavor != 'undefined') {
//      messageProps.flavor = flavor;
//    }
    // Apply the roll mode to automatically adjust visibility settings
    ChatMessage.applyRollMode(messageProps, rollMode);
    // Send the chat message
    return await ChatMessage.create(messageProps);
  }
}
