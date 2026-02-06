const api = foundry.applications.api;

export class STARoll {
  // #########################################################
  // #                                                         #
  // #                    Task Rolls                          #
  // #                                                         #
  // #########################################################

  //Perform a normal Task Roll
  async rollTask(taskData) {
    const taskRollData = await this._performRollTask(taskData);
    taskData = { ...taskData, ...taskRollData };

    const taskResult = await this._taskResult(taskData);
    taskData = { ...taskData, ...taskResult };

    const taskResultText = await this._taskResultText(taskData);
    taskData = { ...taskData, ...taskResultText };

    const chatData = await foundry.applications.handlebars.renderTemplate(
      'systems/sta/templates/chat/attribute-test.hbs',
      taskData
    );

    // Check if the dice3d module exists (Dice So Nice). If it does, post a roll in that and then send to chat after the roll has finished. If not just send to chat.
    if (game.dice3d) {
      game.dice3d
        .showForRoll(taskRolled, game.user, true)
        .then(() => this.sendToChat(chatData));
    } else {
      this.sendToChat(chatData);
    }
  }
  
  //Task roll from the NPC Roller
  async rollNPCTask(taskData) {
    let crewRolltype = '';
    let shipRolltype = '';

    if (taskData.speakerName === 'NPC Crew') {
      crewRolltype = 'npccrew';
    } else {
      crewRolltype = 'character2e';
    }

    if (taskData.starshipName === 'NPC Ship') {
      shipRolltype = 'npcship';
    } else {
      shipRolltype = 'starship';
    }

    let crewData = {
      speakerName: taskData.speakerName,
      selectedAttribute: taskData.selectedAttribute,
      selectedAttributeValue: taskData.selectedAttributeValue,
      selectedDiscipline: taskData.selectedDiscipline,
      selectedDisciplineValue: taskData.selectedDisciplineValue,
      rolltype: crewRolltype,
      dicePool: taskData.dicePool,
      usingFocus: taskData.usingFocus,
      usingDedicatedFocus: taskData.usingDedicatedFocus,
      usingDetermination: taskData.usingDetermination,
      complicationRange: taskData.complicationRange,
      skillLevel: taskData.skillLevel,
      selectedSystemValue: 0,
      selectedDepartmentValue: 0,
    };

    const crewtaskRollData = await this._performRollTask(crewData);
    crewData = { ...crewData, ...crewtaskRollData };

    const crewtaskResult = await this._taskResult(crewData);
    crewData = { ...crewData, ...crewtaskResult };

    let shipData = '';
    let chatData = '';

    if (taskData.selectedSystem === 'none') {
      const crewtaskResultText = await this._taskResultText(crewData);
      crewData = { ...crewData, ...crewtaskResultText };

      chatData = await foundry.applications.handlebars.renderTemplate(
        'systems/sta/templates/chat/attribute-test.hbs',
        crewData
      );
    } else {
      shipData = {
        speakerName: taskData.starshipName,
        selectedSystem: taskData.selectedSystem,
        selectedSystemValue: taskData.selectedSystemValue,
        selectedDepartment: taskData.selectedDepartment,
        selectedDepartmentValue: taskData.selectedDepartmentValue,
        rolltype: shipRolltype,
        complicationRange: taskData.complicationRange,
        dicePool: 1,
        usingFocus: true,
        selectedAttributeValue: 0,
        selectedDisciplineValue: 0,
      };

      const shiptaskRollData = await this._performRollTask(shipData);
      shipData = { ...shipData, ...shiptaskRollData };

      const shiptaskResult = await this._taskResult(shipData);
      shipData = { ...shipData, ...shiptaskResult };

      let crewshipData = {
        ...taskData,
        diceStringcrew: crewData.diceString,
        diceStringship: shipData.diceString,
        diceOutcome: [...crewData.diceOutcome, ...shipData.diceOutcome || []],
        success: crewData.success + shipData.success,
        checkTargetcrew: crewData.checkTarget,
        checkTargetship: shipData.checkTarget,
        doubleDiscipline: crewData.doubleDiscipline,
        complicationMinimumValue: crewData.complicationMinimumValue,
        withDetermination: crewData.withDetermination,
        withFocus: crewData.withFocus,
        withDedicatedFocus: crewData.withDedicatedFocus,
        flavorcrew: crewData.flavor,
        flavorship: shipData.flavor,
        complication: crewData.complication + shipData.complication,
        successText: crewData.successText + shipData.successText,
        complicationText: crewData.complicationText + shipData.complicationText,
      };

      const crewshiptaskResultText = await this._taskResultText(crewshipData);
      crewshipData = { ...crewshipData, ...crewshiptaskResultText };

      chatData = await foundry.applications.handlebars.renderTemplate(
        'systems/sta/templates/chat/attribute-test-npc.hbs',
        crewshipData
      );
    }

    // Check if the dice3d module exists (Dice So Nice). If it does, post a roll in that and then send to chat after the roll has finished. If not just send to chat.
    if (game.dice3d) {
      game.dice3d
        .showForRoll(taskRolled, game.user, true)
        .then(() => this.sendToChat(chatData));
    } else {
      this.sendToChat(chatData);
    }
  }

  async _performRollTask(taskData) {
    // Calculate how many dice to roll
    let diceToRoll = taskData.dicePool;
    if (taskData.usingDetermination && taskData.rolltype !== 'character1e') {
      diceToRoll = taskData.dicePool - 1;
    }

    // Do the roll
    const taskRolled = await new Roll(diceToRoll + 'd20').evaluate({});

    return { diceToRoll, taskRolled };
  }

  // Assemble the result strings for the chat card
  async _taskResult(taskData) {
    const checkTarget =
      taskData.selectedAttributeValue +
      taskData.selectedDisciplineValue +
      taskData.selectedSystemValue +
      taskData.selectedDepartmentValue;
    const complicationMinimumValue = 21 - taskData.complicationRange;

    if (taskData.useReputationInstead) {
      taskData.selectedDiscipline = 'reputation';
      taskData.selectedDisciplineValue = taskData.reputationValue;
    }

    const doubleDiscipline =
      taskData.selectedDisciplineValue + taskData.selectedDisciplineValue;
    let diceString = '';
    let diceOutcome = [];
    let success = 0;
    let complication = 0;
    let i;
    let result = 0;

    // Work out the number of successes and complications
    for (i = 0; i < taskData.diceToRoll; i++) {
      result = taskData.taskRolled.terms[0].results[i].result;

      // If using focus and the result is less than or equal to the discipline, that counts as 2 successes and we want to show the dice as green.
      if (
        (taskData.usingFocus &&
          result <=
            taskData.selectedDisciplineValue + taskData.selectedDepartmentValue) ||
        result === 1
      ) {
        diceString += `<li class="roll die d20 max">${result}</li>`;
        diceOutcome.push(result);
        success += 2;
      // If using dedicated focus and the result is less than or equal to double the discipline, that counts as 2 successes and we want to show the dice as green.
      } else if (
        (taskData.usingDedicatedFocus &&
          result <= doubleDiscipline) ||
        result === 1
      ) {
        diceString += `<li class="roll die d20 max">${result}</li>`;
        diceOutcome.push(result);
        success += 2;
      // If the result is less than or equal to the target (the discipline and attribute added together), that counts as 1 success but we want to show the dice as normal.
      } else if (result <= checkTarget) {
        diceString += `<li class="roll die d20">${result}</li>`;
        diceOutcome.push(result);
        success += 1;
      // If the result is greater than or equal to the complication range, then we want to count it as a complication. We also want to show it as red!
      } else if (result >= complicationMinimumValue) {
        diceString += `<li class="roll die d20 min">${result}</li>`;
        diceOutcome.push(result);
        complication += 1;
      // If none of the above is true, the dice failed to do anything and is treated as normal.
      } else {
        diceString += `<li class="roll die d20">${result}</li>`;
        diceOutcome.push(result);
      }
    }

    let withDetermination = '';
    if (taskData.usingDetermination) {
      diceString += `<li class="roll die d20 max">1</li>`;
      diceOutcome.push(1);
      success += 2;
      withDetermination = `, ${game.i18n.format('sta.actor.character.determination')}`;
    }

    // Add information about what was rolled
    let withFocus = '';
    if (taskData.usingFocus) {
      withFocus = `, ${game.i18n.format('sta.actor.belonging.focus.title')}`;
    }

    let withDedicatedFocus = '';
    if (taskData.usingDedicatedFocus) {
      withDedicatedFocus = `, ${game.i18n.format('sta.roll.dedicatedfocus')}`;
    }

    // Add flavor for the roll card
    let flavor = '';
    switch (taskData.rolltype) {
      case 'character2e':
      case 'character1e':
        flavor =
          `${game.i18n.format(`sta.actor.character.attribute.${taskData.selectedAttribute}`)} ` +
          `${game.i18n.format(`sta.actor.character.discipline.${taskData.selectedDiscipline}`)} ` +
          `${game.i18n.format('sta.roll.task.name')}`;
        break;
      case 'starship':
        flavor =
          `${game.i18n.format(`sta.actor.starship.system.${taskData.selectedSystem}`)} ` +
          `${game.i18n.format(`sta.actor.starship.department.${taskData.selectedDepartment}`)} ` +
          `${game.i18n.format('sta.roll.task.name')}`;
        break;
      case 'sidebar':
        flavor = game.i18n.format('sta.roll.task.name');
        break;
      case 'npccrew':
        flavor = `${game.i18n.format(`sta.roll.npccrew${taskData.skillLevel}`)} ${game.i18n.format('sta.roll.task.name')}`;
        break;
      case 'npcship':
        flavor = `${game.i18n.format('sta.roll.npcshipassist')} ${game.i18n.format('sta.roll.task.name')}`;
        break;
      case 'reroll':
        flavor = `${game.i18n.format('sta.roll.rerollresults')} ${speaker.id} ${game.i18n.format('sta.roll.task.name')}`;
        html = await foundry.applications.handlebars.renderTemplate(
          'systems/sta/templates/chat/reroll.hbs',
          chatData
        );
        break;
    }

    return {
      diceString,
      diceOutcome,
      success,
      complication,
      withDetermination,
      withFocus,
      withDedicatedFocus,
      flavor,
      checkTarget,
      complicationMinimumValue,
    };
  }

  async _taskResultText(taskData) {
    // Here we want to check if the success was exactly one (as "1 Successes" doesn't make grammatical sense). We create a string for the Successes.
    let successText = '';
    if (taskData.success === 1) {
      successText = `${taskData.success} ${game.i18n.format('sta.roll.success')}`;
    } else {
      successText = `${taskData.success} ${game.i18n.format('sta.roll.successPlural')}`;
    }

    let complicationText = '';
    if (taskData.complication === 1) {
      complicationText = `<h4 class="dice-total failure"> ${game.i18n.format('sta.roll.complication')} </h4>`;
    } else if (taskData.complication > 1) {
      const localisedPluralisation = game.i18n.format('sta.roll.complicationPlural');
      complicationText = `<h4 class="dice-total failure"> ${localisedPluralisation.replace('|#|', taskData.complication)} </h4>`;
    }

    return { successText, complicationText };
  }

  // Get the complication range from scenetraits
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

    const calculatedComplicationRange = Math.min(5, Math.max(1, 1 + sceneComplicationBonus));
    return calculatedComplicationRange;
  }

  // #########################################################
  // #                                                         #
  // #                 Challenge Rolls                         #
  // #                                                         #
  // #########################################################

  //Perform a normal Challenge Roll
  async performChallengeRoll(challengeData) {
    const rolledChallenge = await new Roll(challengeData.dicePool + 'd6').evaluate({});
    const getSuccessesEffects = await this._getSuccessesEffects(rolledChallenge);
    const diceString = await this._getDiceImageListFromChallengeRoll(rolledChallenge);
    const flavor = `${challengeData.challengeName} ${game.i18n.format('sta.roll.challenge.name')}`;

    challengeData = { ...challengeData, ...getSuccessesEffects, diceString, flavor };

    const chatData = await foundry.applications.handlebars.renderTemplate(
      'systems/sta/templates/chat/challenge-roll.hbs',
      challengeData
    );

    // Check if the dice3d module exists (Dice So Nice). If it does, post a roll in that and then send to chat after the roll has finished. If not just send to chat.
    if (game.dice3d) {
      game.dice3d
        .showForRoll(rolledChallenge, game.user, true)
        .then(() => this.sendToChat(chatData));
    } else {
      this.sendToChat(chatData);
    }
  }

  /* Creates an HTML list of die face images from the results of a challenge roll */
  async _getDiceImageListFromChallengeRoll(rolledChallenge) {
    const diceFaceTable = [
      '<li class="roll die d6"><img src="systems/sta/assets/icons/ChallengeDie_Success1_small.png" /></li>',
      '<li class="roll die d6"><img src="systems/sta/assets/icons/ChallengeDie_Success2_small.png" /></li>',
      '<li class="roll die d6"><img src="systems/sta/assets/icons/ChallengeDie_Success0_small.png" /></li>',
      '<li class="roll die d6"><img src="systems/sta/assets/icons/ChallengeDie_Success0_small.png" /></li>',
      '<li class="roll die d6"><img src="systems/sta/assets/icons/ChallengeDie_Effect_small.png" /></li>',
      '<li class="roll die d6"><img src="systems/sta/assets/icons/ChallengeDie_Effect_small.png" /></li>',
    ];

    const diceString = rolledChallenge.terms[0].results
      .map((die) => die.result)
      .map((result) => diceFaceTable[result - 1])
      .join(' ');

    return diceString;
  }

  /* Returns the number of successes in a d6 challenge die roll */
  async _getSuccessesEffects(rolledChallenge) {
    let successes = 0;
    let effects = 0;
    const diceOutcome = [];
    const dice = rolledChallenge.terms[0].results.map((die) => die.result);

    for (const die of dice) {
      switch (die) {
        case 1:
          successes += 1;
          diceOutcome.push(1);
          break;
        case 2:
          successes += 2;
          diceOutcome.push(2);
          break;
        case 3:
          diceOutcome.push(3);
          break;
        case 4:
          diceOutcome.push(4);
          break;
        case 5:
          successes += 1;
          effects += 1;
          diceOutcome.push(5);
          break;
        case 6:
          successes += 1;
          effects += 1;
          diceOutcome.push(6);
          break;
        default:
          break;
      }
    }

    let successText = '';
    if (successes === 1) {
      successText = `${successes} ${game.i18n.format('sta.roll.success')}`;
    } else {
      successText = `${successes} ${game.i18n.format('sta.roll.successPlural')}`;
    }

    let effectText = '';
    if (effects === 1) {
      effectText = `${effects} ${game.i18n.format('sta.roll.effect')}`;
    } else {
      effectText = `${effects} ${game.i18n.format('sta.roll.effectPlural')}`;
    }

    return { successes, effects, successText, effectText };
  }

  // #########################################################
  // #                                                         #
  // #                  Send to Chat                          #
  // #                                                         #
  // #########################################################

  async sendToChat(chatData) {
    const rollMode = game.settings.get('core', 'rollMode');
    const messageProps = {
      content: chatData,
      flags: {
        /* 'sta': {
          // speakerName: chatData.speakerName,
          // ... all other custom flags
        } */
      },
    };

    // Apply the roll mode to automatically adjust visibility settings
    ChatMessage.applyRollMode(messageProps, rollMode);

    // Send the chat message
    return await ChatMessage.create(messageProps);
  }
}