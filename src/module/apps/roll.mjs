const api = foundry.applications.api;

export class STARoll {

  // ######################################################
  // #                                                    #
  // #                    Task Rolls                      #
  // #                                                    #
  // ######################################################

  async rollTask(taskData) {
    const taskRollData  = await this._performRollTask(taskData);
    taskData = {...taskData, ...taskRollData};
    const taskresult = await this._taskResult(taskData);
    taskData = {...taskData, ...taskresult};
    const chatData = await foundry.applications.handlebars.renderTemplate('systems/sta/templates/chat/attribute-test.hbs', taskData);

    // Check if the dice3d module exists (Dice So Nice). If it does, post a roll in that and then send to chat after the roll has finished. If not just send to chat.
    if (game.dice3d) {
      game.dice3d.showForRoll(taskRolled, game.user, true).then((displayed) => {
        this.sendToChat(chatData);
      });
    } else {
      this.sendToChat(chatData);
    };
  }

  //assemble the required numbers and make the roll
  async _performRollTask(taskData) {
    let diceString = '';
    let diceOutcome = [];
    let success = 0;

    if (taskData.useReputationInstead) {
      selectedDiscipline = 'reputation';
      selectedDisciplineValue = taskData.reputationValue;
    }
    const checkTarget = taskData.selectedAttributeValue + taskData.selectedDisciplineValue + taskData.selectedSystemValue + taskData.selectedDepartmentValue;
    const doubleDiscipline = taskData.selectedDisciplineValue + taskData.selectedDisciplineValue;  
    const complicationMinimumValue = 20 - taskData.complicationRange;
    let diceToRoll = taskData.dicePool;
    if (taskData.usingDetermination && taskData.rolltype !== 'character1e') {
      diceToRoll = taskData.dicePool - 1;
    }
    let withDetermination = '';
    if (taskData.usingDetermination) {
      diceString += '<li class="roll die d20 max">' + 1 + '</li>';
      diceOutcome.push(1);
      success += 2;
      withDetermination = ', ' + game.i18n.format('sta.actor.character.determination');
    }
    let withFocus = '';
    if (taskData.usingFocus) {
      withFocus = ', ' + game.i18n.format('sta.actor.belonging.focus.title');
    }
    let withDedicatedFocus = '';
    if (taskData.usingDedicatedFocus) {
      withDedicatedFocus = withDedicatedFocus = ', ' + game.i18n.format('sta.roll.dedicatedfocus');
    }

    //add flavor for the roll card
    let flavor = '';
    switch (taskData.rolltype) {
    case 'character2e':
      flavor = game.i18n.format('sta.actor.character.attribute.' + taskData.selectedAttribute) + ' ' + game.i18n.format('sta.actor.character.discipline.' + taskData.selectedDiscipline) + ' ' + game.i18n.format('sta.roll.task.name');
      break;
    case 'character1e':
      flavor = game.i18n.format('sta.actor.character.attribute.' + taskData.selectedAttribute) + ' ' + game.i18n.format('sta.actor.character.discipline.' + taskData.selectedDiscipline) + ' ' + game.i18n.format('sta.roll.task.name');
      break;
      case 'starship':
      flavor = game.i18n.format('sta.actor.starship.system.' + taskData.selectedAttribute) + ' ' + game.i18n.format('sta.actor.starship.department.' + taskData.selectedDiscipline) + ' ' + game.i18n.format('sta.roll.task.name');
      break;
    case 'sidebar':
      flavor = game.i18n.format('sta.roll.task.name');
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

    //do the roll
    const taskRolled = await new Roll(diceToRoll + 'd20').evaluate({});

    //assemble the data for the chat card
    return {
      diceString,
      diceOutcome,
      success,
      diceToRoll,
      taskRolled,
      checkTarget,
      doubleDiscipline,
      complicationMinimumValue,
      withDetermination,
      withFocus,
      withDedicatedFocus,
      flavor,
    };
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

  async _taskResult(taskData) {
    let i;
    let result = 0;
    let complication = 0;
    for (i = 0; i < taskData.diceToRoll; i++) {
      result = taskData.taskRolled.terms[0].results[i].result;
      // If using focus and the result is less than or equal to the discipline, that counts as 2 successes and we want to show the dice as green.
      if ((taskData.usingFocus && result <= taskData.selectedDisciplineValue) || result == 1) {
        taskData.diceString += '<li class="roll die d20 max">' + result + '</li>';
        taskData.diceOutcome.push(result);
        taskData.success += 2;
      // If using dedicated focus and the result is less than or equal to double the discipline, that counts as 2 successes and we want to show the dice as green.
      } else if ((taskData.usingDedicatedFocus && result <= taskData.doubleDiscipline) || result == 1) {
        taskData.diceString += '<li class="roll die d20 max">' + result + '</li>';
        taskData.diceOutcome.push(result);
        taskData.success += 2;
        // If the result is less than or equal to the target (the discipline and attribute added together), that counts as 1 success but we want to show the dice as normal.
      } else if (result <= taskData.checkTarget) {
        taskData.diceString += '<li class="roll die d20">' + result + '</li>';
        taskData.diceOutcome.push(result);
        taskData.success += 1;
        // If the result is greater than or equal to the complication range, then we want to count it as a complication. We also want to show it as red!
      } else if (result >= taskData.complicationMinimumValue) {
        taskData.diceString += '<li class="roll die d20 min">' + result + '</li>';
        taskData.diceOutcome.push(result);
        complication += 1;
        // If none of the above is true, the dice failed to do anything and is treated as normal.
      } else {
        taskData.diceString += '<li class="roll die d20">' + result + '</li>';
        taskData.diceOutcome.push(result);
      }
    }
    // Here we want to check if the success was exactly one (as "1 Successes" doesn't make grammatical sense). We create a string for the Successes.
    let successText = '';
    if (taskData.success == 1) {
      successText = taskData.success + ' ' + game.i18n.format('sta.roll.success');
    } else {
      successText = taskData.success + ' ' + game.i18n.format('sta.roll.successPlural');
    }
    let complicationText = '';
    if (complication === 1) {
      complicationText = '<h4 class="dice-total failure"> ' + game.i18n.format('sta.roll.complication') + '</h4>';
    }
    if (complication > 1) {
      const localisedPluralisation = game.i18n.format('sta.roll.complicationPlural');
      complicationText = '<h4 class="dice-total failure"> ' + localisedPluralisation.replace('|#|', complication) + '</h4>';
    }
    return {
      complication,
      successText,
      complicationText
    };
  }

  // ######################################################
  // #                                                    #
  // #                   Send to Chat                     #
  // #                                                    #
  // ######################################################

  async sendToChat(chatData) {
    const rollMode = game.settings.get('core', 'rollMode');
    const messageProps = {
      content: chatData,
      flags: {
        'sta': {
      speakername: chatData.speakername,
      reputationValue: chatData.reputationValue,
      useReputationInstead: chatData.useReputationInstead,
      selectedAttribute: chatData.selectedAttribute,
      selectedAttributeValue: chatData.selectedAttributeValue,
      selectedDiscipline: chatData.selectedDiscipline,
      selectedSystem: chatData.selectedSystem,
      selectedSystemValue: chatData.selectedSystemValue,
      selectedDisciplineValue: chatData.selectedDisciplineValue,
      selectedDepartment: chatData.selectedDepartment,
      selectedDepartmentValue: chatData.selectedDepartmentValue,
      rolltype: chatData.rolltype,
      dicePool: chatData.dicePool,
      usingFocus: chatData.usingFocus,
      usingDedicatedFocus: chatData.usingDedicatedFocus,
      usingDetermination: chatData.usingDetermination,
      complicationRange: chatData.complicationRange,
      diceString: chatData.diceString,
      diceOutcome: chatData.diceOutcome,
      success: chatData.success,
      diceToRoll: chatData.diceToRoll,
      taskRolled: chatData.taskRolled,
      checkTarget: chatData.checkTarget,
      doubleDiscipline: chatData.doubleDiscipline,
      complicationMinimumValue: chatData.complicationMinimumValue,
      withDetermination: chatData.withDetermination,
      withFocus: chatData.withFocus,
      withDedicatedFocus: chatData.withDedicatedFocus,
      flavor: chatData.flavor,
      complication: chatData.complication,
      successText: chatData.successText,
      complicationText: chatData.complicationText,
        }
      }
    };
    // Apply the roll mode to automatically adjust visibility settings
    ChatMessage.applyRollMode(messageProps, rollMode);
    // Send the chat message
    return await ChatMessage.create(messageProps);
  }
}
