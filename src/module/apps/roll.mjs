const api = foundry.applications.api;

export class STARoll {
  // #########################################################
  // #                                                       #
  // #                    Task Rolls                         #
  // #                                                       #
  // #########################################################

  // Perform a normal Task Roll
  async rollTask(taskData) {
    const taskRollData = await this._performRollTask(taskData);
    taskData = { ...taskData, ...taskRollData };

    const taskResult = await this._taskResult(taskData);
    taskData = { ...taskData, ...taskResult };

    const taskResultText = await this._taskResultText(taskData);
    taskData = { 
      ...taskData, 
      ...taskResultText, 
      rollType: 'task', 
      dice3dRoll: taskData.taskRolled,
    };

    this.sendToChat(taskData);
  }

  // Task roll from the NPC Roller
  async rollNPCTask(taskData) {
    let crewRolltype = '';
    let shipRolltype = '';

    if (taskData.speakerName === 'NPC Crew') {
      crewRolltype = 'npccrew';
    } else {
      crewRolltype = taskData.rolltype;
    }

    if (taskData.starshipName === 'NPC Ship') {
      shipRolltype = 'npcship';
    } else {
      shipRolltype = 'starshipassist';
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
      reputationValue: taskData.reputationValue,
      useReputationInstead: taskData.useReputationInstead,
    };

    const crewtaskRollData = await this._performRollTask(crewData);
    crewData = { ...crewData, ...crewtaskRollData };

    const crewtaskResult = await this._taskResult(crewData);
    crewData = { ...crewData, ...crewtaskResult };

    let shipData = '';
    let crewshipData = '';

    if (taskData.selectedSystem === 'none') {
      const crewtaskResultText = await this._taskResultText(crewData);
      crewshipData = { 
        ...crewData, 
        ...crewtaskResultText, 
        dice3dRoll: crewData.taskRolled,
        rollType: 'task' };
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

      crewshipData = {
        ...taskData,
        diceString: crewData.diceString,
        diceStringship: shipData.diceString,
        diceOutcome: crewData.diceOutcome,
        shipdiceOutcome: shipData.diceOutcome,
        success: crewData.success + shipData.success,
        checkTarget: crewData.checkTarget,
        checkTargetship: shipData.checkTarget,
        disDepTarget: crewData.disDepTarget,
        shipdisDepTarget: shipData.disDepTarget,
        complicationMinimumValue: crewData.complicationMinimumValue,
        withDetermination: crewData.withDetermination,
        withFocus: crewData.withFocus,
        withDedicatedFocus: crewData.withDedicatedFocus,
        flavor: crewData.flavor,
        flavorship: shipData.flavor,
        complication: crewData.complication + shipData.complication,
        successText: crewData.successText + shipData.successText,
        complicationText: crewData.complicationText + shipData.complicationText,
        rollDetails: crewData.rollDetails,
        dice3dRoll: crewData.taskRolled,
        dice3dshipRoll: shipData.taskRolled,
      };

      const crewshiptaskResultText = await this._taskResultText(crewshipData);
      crewshipData = { ...crewshipData, ...crewshiptaskResultText, rollType: 'npc' };
    }

    this.sendToChat(crewshipData);
  }

  async _performRollTask(taskData) {
    // Calculate how many dice to roll
    let diceToRoll = taskData.dicePool;
    if (taskData.usingDetermination && taskData.rolltype !== 'character1e') {
      diceToRoll = taskData.dicePool - 1;
    }

    // Do the roll
    const taskRolled = await new Roll(diceToRoll + 'd20').evaluate({});

    return { taskRolled };
  }

  // Assemble the result strings for the chat card
  async _taskResult(taskData) {
  
    const attribValue = taskData.selectedAttributeValue ||
      taskData.selectedSystemValue ||
      0;
    let disDepTarget = taskData.disDepTarget || 
      taskData.selectedDisciplineValue || 
      taskData.selectedDepartmentValue || 
      0;
    const checkTarget = taskData.checkTarget || attribValue + disDepTarget;
    const complicationMinimumValue = taskData.complicationMinimumValue || 21 - taskData.complicationRange;

    if (taskData.useReputationInstead) {
      taskData.selectedDiscipline = 'reputation';
      disDepTarget = taskData.reputationValue;
    }

    const doubleDiscipline = disDepTarget * 2;
    let diceString = '';
    let diceOutcome = [];
    let success = 0;
    let complication = 0;
    let result = 0;

    const resultsArray =
      taskData.customResults
      ?? taskData.taskRolled?.dice?.flatMap(d => d.results.map(r => r.result))
      ?? [];

    resultsArray.forEach((result) => {
      if ((taskData.usingFocus &&
          result <= disDepTarget) ||
        result === 1) {
        diceString += `<li class="roll die d20 max">${result}</li>`;
        diceOutcome.push(result);
        success += 2;
      } else if (
        (taskData.usingDedicatedFocus &&
          result <= doubleDiscipline)) {
        diceString += `<li class="roll die d20 max">${result}</li>`;
        diceOutcome.push(result);
        success += 2;
      } else if (result <= checkTarget) {
        diceString += `<li class="roll die d20">${result}</li>`;
        diceOutcome.push(result);
        success += 1;
      } else if (result >= complicationMinimumValue) {
        diceString += `<li class="roll die d20 min">${result}</li>`;
        diceOutcome.push(result);
        complication += 1;
      } else {
        diceString += `<li class="roll die d20">${result}</li>`;
        diceOutcome.push(result);
      }
    });

    // Add Determination bonus
    if (taskData.usingDetermination) {
      diceString += `<li class="roll die d20 max">1</li>`;
      diceOutcome.push(1);
      success += 2;
    }

    // Add information about what was rolled
    let bonuses = [];
    if (taskData.usingFocus) {
      bonuses.push(game.i18n.format('sta.actor.belonging.focus.title'));
    }
    if (taskData.usingDedicatedFocus) {
      bonuses.push(game.i18n.format('sta.roll.dedicatedfocus'));
    }
    if (taskData.usingDetermination) {
      bonuses.push(game.i18n.format('sta.actor.character.determination'));
    }

    let rollDetails = bonuses.join(', ');

    // Add flavor for the roll card
    let flavor = '';
    switch (taskData.rolltype) {
      case 'character2e':
      case 'character1e':
        flavor =
          `${game.i18n.format(`sta.actor.character.attribute.${taskData.selectedAttribute}`)} ` +
          `${game.i18n.format(`sta.actor.character.discipline.${taskData.selectedDiscipline}`)}`;
        break;
      case 'starship':
        flavor =
          `${game.i18n.format(`sta.actor.starship.system.${taskData.selectedSystem}`)} ` +
          `${game.i18n.format(`sta.actor.starship.department.${taskData.selectedDepartment}`)}`;
        break;
      case 'starshipassist':
        flavor =
          `${game.i18n.format(`sta.actor.starship.system.${taskData.selectedSystem}`)} ` +
          `${game.i18n.format(`sta.actor.starship.department.${taskData.selectedDepartment}`)}`;
        break;
      case 'sidebar':
        flavor = game.i18n.format('sta.roll.task.name');
        break;
      case 'npccrew':
        flavor = `${game.i18n.format(`sta.roll.npccrew${taskData.skillLevel}`)} ${game.i18n.format('sta.roll.task.name')}`;
        break;
      case 'npcship':
        flavor = `${game.i18n.format('sta.roll.npcshipassist')}`;
        break;
      case 'reroll':
        flavor = `${game.i18n.format('sta.roll.rerollresults')} ${taskData.speakerName} ${game.i18n.format('sta.roll.task.name')}`;
        break;
      case 'custom':
        flavor = taskData.flavor;
        break;
      default:
        flavor = '';
        break;
    }

    return {
      diceString,
      diceOutcome,
      success,
      complication,
      flavor,
      checkTarget,
      complicationMinimumValue,
      disDepTarget,
      rollDetails,
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
      complicationText = `1 ${game.i18n.format('sta.roll.complication')}`;
    } else if (taskData.complication > 1) {
      complicationText = `${taskData.complication} ${game.i18n.format('sta.roll.complicationPlural')}`;
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
  // #                                                       #
  // #                 Challenge Rolls                       #
  // #                                                       #
  // #########################################################

  // Perform a normal Challenge Roll
  async performChallengeRoll(challengeData) {
    const rolledChallenge = await new Roll(challengeData.dicePool + 'd6').evaluate({});
    const getSuccessesEffects = await this._getSuccessesEffects(rolledChallenge);
    const getSuccessesEffectsText = await this._getSuccessesEffectsText(getSuccessesEffects);
    const diceString = await this._getDiceImageListFromChallengeRoll(rolledChallenge);
    const flavor = `${challengeData.challengeName} ${game.i18n.format('sta.roll.challenge.name')}`;

    challengeData = { 
      ...challengeData, 
      ...getSuccessesEffects, 
      ...getSuccessesEffectsText, 
      dice3dRoll: rolledChallenge, 
      diceString, 
      flavor, 
      rollType: 'challenge' 
    };

    this.sendToChat(challengeData);
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

    const resultsArray = rolledChallenge.customResults
      ?? rolledChallenge?.dice?.[0]?.results?.map(d => d.result)
      ?? [];

    const diceString = resultsArray
      .map(result => diceFaceTable[result - 1])
      .join(' ');

    return diceString;
  }

  /* Returns the number of successes in a d6 challenge die roll */
  async _getSuccessesEffects(rolledChallenge) {
    let successes = 0;
    let effects = 0;
    const diceOutcome = [];
    const dice = rolledChallenge.customResults
      ?? rolledChallenge?.dice?.[0]?.results?.map(d => d.result)
      ?? [];

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

    return { diceOutcome, successes, effects };
  }

  /* Writes the success text for the chat card */
  async _getSuccessesEffectsText(getSuccessesEffects) {
    let successText = '';
    if (getSuccessesEffects.successes === 1) {
      successText = `${getSuccessesEffects.successes} ${game.i18n.format('sta.roll.success')}`;
    } else {
      successText = `${getSuccessesEffects.successes} ${game.i18n.format('sta.roll.successPlural')}`;
    }

    let effectText = '';
    if (getSuccessesEffects.effects === 1) {
      effectText = `${getSuccessesEffects.effects} ${game.i18n.format('sta.roll.effect')}`;
    } else {
      effectText = `${getSuccessesEffects.effects} ${game.i18n.format('sta.roll.effectPlural')}`;
    }

    return { successText, effectText };
  }

  // #########################################################
  // #                                                       #
  // #                Item Rolls (not weapons)               #
  // #                                                       #
  // #########################################################

  async performItemRoll(item, speaker) {
    const itemData = {
      speakerName: speaker.name,
      img: item.img,
      flavor: game.i18n.localize(`sta.actor.belonging.${item.type}.title`),
      name: item.name,
      descFieldHtml: item.system.description,
      itemQuantity: item.system.quantity,
      opportunityCost: item.system.opportunity,
      escalationCost: item.system.escalation,
      rollType: 'item',
      quantityRow: true,
    };

    this.sendToChat(itemData);
  }

  async performTalentRoll(item, speaker) {
    const itemData = {
      speakerName: speaker.name,
      img: item.img,
      flavor: game.i18n.localize(`sta.actor.belonging.${item.type}.title`),
      name: item.name,
      descFieldHtml: item.system.description,
      rollType: 'item',
    };
    this.sendToChat(itemData);
  }

  async performFocusRoll(item, speaker) {
    const itemData = {
      speakerName: speaker.name,
      img: item.img,
      flavor: game.i18n.localize(`sta.actor.belonging.${item.type}.title`),
      name: item.name,
      descFieldHtml: item.system.description,
      rollType: 'item',
    };
    this.sendToChat(itemData);
  }

  async performValueRoll(item, speaker) {
    const itemData = {
      speakerName: speaker.name,
      img: item.img,
      flavor: game.i18n.localize(`sta.actor.belonging.${item.type}.title`),
      name: item.name,
      descFieldHtml: item.system.description,
      rollType: 'item',
    };
    this.sendToChat(itemData);
  }

  async performInjuryRoll(item, speaker) {
    const itemData = {
      speakerName: speaker.name,
      img: item.img,
      flavor: game.i18n.localize(`sta.actor.belonging.${item.type}.title`),
      name: item.name,
      descFieldHtml: item.system.description,
      rollType: 'item',
    };
    this.sendToChat(itemData);
  }

  async performTraitRoll(item, speaker) {
    const itemData = {
      speakerName: speaker.name,
      img: item.img,
      flavor: game.i18n.localize(`sta.actor.belonging.${item.type}.title`),
      name: item.name,
      descFieldHtml: item.system.description,
      rollType: 'item',
    };
    this.sendToChat(itemData);
  }

  async performMilestoneRoll(item, speaker) {
    const itemData = {
      speakerName: speaker.name,
      img: item.img,
      flavor: game.i18n.localize(`sta.actor.belonging.${item.type}.title`),
      name: item.name,
      descFieldHtml: item.system.description,
      rollType: 'item',
    };
    this.sendToChat(itemData);
  }

  async performLogRoll(item, speaker) {
    const itemData = {
      speakerName: speaker.name,
      img: item.img,
      flavor: game.i18n.localize(`sta.actor.belonging.${item.type}.title`),
      name: item.name,
      descFieldHtml: item.system.description,
      rollType: 'item',
    };
    this.sendToChat(itemData);
  }

  async performArmorRoll(item, speaker) {
    const itemData = {
      speakerName: speaker.name,
      img: item.img,
      flavor: game.i18n.localize(`sta.actor.belonging.${item.type}.title`),
      name: item.name,
      descFieldHtml: item.system.description,
      itemQuantity: item.system.protection,
      opportunityCost: item.system.opportunity,
      escalationCost: item.system.escalation,
      rollType: 'item',
      quantityRow: true,
    };
    this.sendToChat(itemData);
  }

  // Handle cases where (xCD) has been written into an item description causing it to be handled as a weapon instead of an item
  async onItemtoWeapon(item, speaker) {
    const regex = /\((.cd)\)/i;
    const match = item.system.description.toLowerCase().match(regex);
    let challengeDice = 1;

    if (match) {
      const x = match[1][0];

      if (x === 'x') {
        const defaultValue = 1;
        const template = 'systems/sta/templates/apps/dicepool-challenge.hbs';
        const html = await foundry.applications.handlebars.renderTemplate(template, {
          defaultValue
        });
        const formData = await api.DialogV2.wait({
          window: { title: game.i18n.localize('sta.apps.dicepoolwindow') },
          position: { height: 'auto', width: 350 },
          content: html,
          classes: ['dialogue'],
          buttons: [{
            action: 'roll',
            default: true,
            label: game.i18n.localize('sta.apps.rolldice'),
            callback: (event, button, dialog) => {
              const challengeDiceInput = dialog.element.querySelector('#dicePoolValue');
              return {
                challengeDice: challengeDiceInput?.valueAsNumber || 1
              };
            }
          }],
          close: () => null
        });

        challengeDice = formData.challengeDice;
      } else if (!isNaN(x) && x >= '0' && x <= '9') {
        challengeDice = parseInt(x);
        console.log('Challengedice set to:', challengeDice);
      }
    }

    const rolledChallenge = await new Roll(challengeDice + 'd6').evaluate({});
    const getSuccessesEffects = await this._getSuccessesEffects(rolledChallenge);
    const getSuccessesEffectsText = await this._getSuccessesEffectsText(getSuccessesEffects);
    const diceString = await this._getDiceImageListFromChallengeRoll(rolledChallenge);
    let weapontype = game.i18n.localize(`sta.actor.starship.scale`);
    if (item.system.includescale === false) {
      weapontype = 'No ' + game.i18n.localize(`sta.actor.starship.scale`);
    }

    const itemData = {
      speakerName: speaker.name,
      img: item.img,
      flavor: game.i18n.localize(`sta.actor.belonging.${item.type}.title`),
      name: item.name,
      descFieldHtml: item.system.description,
      rollType: 'item',
      ...getSuccessesEffects,
      ...getSuccessesEffectsText,
      diceString,
      rollAsWeapon: true,
      dice3dRoll: rolledChallenge,
    };

    this.sendToChat(itemData);
  }

  // #########################################################
  // #                                                       #
  // #                   Weapon Rolls                        #
  // #                                                       #
  // #########################################################

  async performWeaponRoll2e(item, speaker) {
    const LABELS = Object.freeze({
      accurate: 'sta.actor.belonging.weapon.accurate',
      area: 'sta.actor.belonging.weapon.area',
      charge: 'sta.actor.belonging.weapon.charge',
      cumbersome: 'sta.actor.belonging.weapon.cumbersome',
      debilitating: 'sta.actor.belonging.weapon.debilitating',
      grenade: 'sta.actor.belonging.weapon.grenade',
      inaccurate: 'sta.actor.belonging.weapon.inaccurate',
      intense: 'sta.actor.belonging.weapon.intense',
      piercingx: 'sta.actor.belonging.weapon.piercingx',
      hiddenx: 'sta.actor.belonging.weapon.hiddenx',
      stun: 'sta.actor.belonging.weapon.stun',
      deadly: 'sta.actor.belonging.weapon.deadly',
    });

    const TOOLTIP_TEXT = Object.freeze({
      accurate: game.i18n.localize('sta.tooltip.character.weapon.2e.accurate'),
      area: game.i18n.localize('sta.tooltip.character.weapon.2e.area'),
      charge: game.i18n.localize('sta.tooltip.character.weapon.2e.charge'),
      cumbersome: game.i18n.localize('sta.tooltip.character.weapon.2e.cumbersome'),
      debilitating: game.i18n.localize('sta.tooltip.character.weapon.2e.debilitating'),
      grenade: game.i18n.localize('sta.tooltip.character.weapon.2e.grenade'),
      inaccurate: game.i18n.localize('sta.tooltip.character.weapon.2e.inaccurate'),
      intense: game.i18n.localize('sta.tooltip.character.weapon.2e.intense'),
      piercingx: game.i18n.localize('sta.tooltip.character.weapon.2e.piercingx'),
      hiddenx: game.i18n.localize('sta.tooltip.character.weapon.2e.hiddenx'),
    });

    const tags = [];

    for (const [prop, rawValue] of Object.entries(item.system.qualities)) {
      if (rawValue === undefined || rawValue === null || rawValue === '') continue;
      if (!Object.prototype.hasOwnProperty.call(LABELS, prop)) continue;
      if (rawValue === true) {
        const label = game.i18n.localize(LABELS[prop]);
        const tip = TOOLTIP_TEXT[prop] ?? '';
        tags.push({ label, tooltip: tip });
      }
      else if (Number.isFinite(rawValue) && rawValue > 0) {
        const label = game.i18n.localize(LABELS[prop]);
        const display = `${label} ${rawValue}`;
        const tip = TOOLTIP_TEXT[prop] ?? '';
        tags.push({ label: display, tooltip: tip });
      }
    }

    const itemData = {
      speakerName: speaker.alias ?? speaker.name,
      img: item.img,
      flavor: game.i18n.localize(`sta.actor.belonging.${item.type}.title`),
      name: item.name,
      descFieldHtml: item.system.description,
      rollType: 'item',
      itemDamage: item.system.damage,
      itemQuantity: item.system.quantity || 1,
      opportunityCost: item.system.opportunity,
      escalationCost: item.system.escalation,
      tags,
      range: game.i18n.localize(`sta.actor.belonging.weapon.${item.system.range}`),
      weapontype: item.system.hands + ' ' + game.i18n.localize(`sta.item.genericitem.handed`),
      quantityRow: true,
      damageRow: true,
    };

    this.sendToChat(itemData);
  }

  async performStarshipWeaponRoll2e(item, speaker) {
    let actorWeapons = 0;
    if (speaker.system.systems.weapons.value > 6) actorWeapons = 1;
    if (speaker.system.systems.weapons.value > 8) actorWeapons = 2;
    if (speaker.system.systems.weapons.value > 10) actorWeapons = 3;
    if (speaker.system.systems.weapons.value > 12) actorWeapons = 4;
    let scaleDamage = 0;
    if (item.system.includescale == 'energy') scaleDamage = parseInt(speaker.system.scale);
    const calculatedDamage = item.system.damage + actorWeapons + scaleDamage;
    const variablePrompt = game.i18n.format('sta.roll.weapon.damage2e');
    const variable = `<div class='dice-formula'> ` + variablePrompt.replace('|#|', calculatedDamage) + `</div>`;

    const LABELS = Object.freeze({
      area: 'sta.actor.belonging.weapon.area',
      calibration: 'sta.actor.belonging.weapon.calibration',
      cumbersome: 'sta.actor.belonging.weapon.cumbersome',
      dampening: 'sta.actor.belonging.weapon.dampening',
      depleting: 'sta.actor.belonging.weapon.depleting',
      devastating: 'sta.actor.belonging.weapon.devastating',
      highyield: 'sta.actor.belonging.weapon.highyield',
      intense: 'sta.actor.belonging.weapon.intense',
      jamming: 'sta.actor.belonging.weapon.jamming',
      persistent: 'sta.actor.belonging.weapon.persistentx',
      piercing: 'sta.actor.belonging.weapon.piercingx',
      slowing: 'sta.actor.belonging.weapon.slowing',
      spread: 'sta.actor.belonging.weapon.spread',
      hiddenx: 'sta.actor.belonging.weapon.hiddenx',
      versatilex: 'sta.actor.belonging.weapon.versatilex',
    });

    const TOOLTIP_TEXT = Object.freeze({
      area: game.i18n.localize('sta.tooltip.starship.weapon.2e.area'),
      calibration: game.i18n.localize('sta.tooltip.starship.weapon.2e.calibration'),
      cumbersome: game.i18n.localize('sta.tooltip.starship.weapon.2e.cumbersome'),
      dampening: game.i18n.localize('sta.tooltip.starship.weapon.2e.dampening'),
      depleting: game.i18n.localize('sta.tooltip.starship.weapon.2e.depleting'),
      devastating: game.i18n.localize('sta.tooltip.starship.weapon.2e.devastating'),
      highyield: game.i18n.localize('sta.tooltip.starship.weapon.2e.highyield'),
      intense: game.i18n.localize('sta.tooltip.starship.weapon.2e.intense'),
      jamming: game.i18n.localize('sta.tooltip.starship.weapon.2e.jamming'),
      persistent: game.i18n.localize('sta.tooltip.starship.weapon.2e.persistent'),
      piercing: game.i18n.localize('sta.tooltip.starship.weapon.2e.piercing'),
      slowing: game.i18n.localize('sta.tooltip.starship.weapon.2e.slowing'),
      spread: game.i18n.localize('sta.tooltip.starship.weapon.2e.spread'),
      hiddenx: game.i18n.localize('sta.tooltip.starship.weapon.2e.hiddenx'),
      versatilex: game.i18n.localize('sta.tooltip.starship.weapon.2e.versatilex'),
    });

    const tags = [];

    for (const [prop, rawValue] of Object.entries(item.system.qualities)) {
      if (rawValue === undefined || rawValue === null || rawValue === '') continue;
      if (!Object.prototype.hasOwnProperty.call(LABELS, prop)) continue;
      if (rawValue === true) {
        const label = game.i18n.localize(LABELS[prop]);
        const tip = TOOLTIP_TEXT[prop] ?? '';
        tags.push({ label, tooltip: tip });
      }
      else if (Number.isFinite(rawValue) && rawValue > 0) {
        const label = game.i18n.localize(LABELS[prop]);
        const display = `${label} ${rawValue}`;
        const tip = TOOLTIP_TEXT[prop] ?? '';
        tags.push({ label: display, tooltip: tip });
      }
    }

    const itemData = {
      speakerName: speaker.alias ?? speaker.name,
      img: item.img,
      flavor: game.i18n.localize(`sta.actor.belonging.${item.type}.title`),
      name: item.name,
      descFieldHtml: item.system.description,
      rollType: 'item',
      varFieldHtml: variable,
      tags,
      itemDamage: item.system.damage,
      itemQuantity: item.system.quantity || 1,
      opportunityCost: item.system.opportunity,
      escalationCost: item.system.escalation,
      range: game.i18n.localize(`sta.actor.belonging.weapon.${item.system.range}`),
      weapontype: game.i18n.localize(`sta.actor.belonging.weapon.${item.system.includescale}`),
      quantityRow: true,
      damageRow: true,
    };

    this.sendToChat(itemData);
  }

  async performWeaponRoll1e(item, speaker) {
    let actorSecurity = 0;
    if (speaker.system.disciplines) {
      actorSecurity = parseInt(speaker.system.disciplines.security.value);
    } else if (speaker.system.departments) {
      actorSecurity = parseInt(speaker.system.departments.security.value);
    }
    let scaleDamage = 0;
    if (item.system.includescale && speaker.system.scale) scaleDamage = parseInt(speaker.system.scale);
    const calculatedDamage = item.system.damage + actorSecurity + scaleDamage;
    // Create variable div and populate it with localisation to use in the HTML.
    let variablePrompt = game.i18n.format('sta.roll.weapon.damagePlural');
    if (calculatedDamage == 1) {
      variablePrompt = game.i18n.format('sta.roll.weapon.damage');
    }
    const variable = `<div class='dice-formula'> ` + variablePrompt.replace('|#|', calculatedDamage) + `</div>`;

    const LABELS = Object.freeze({
      charge: 'sta.actor.belonging.weapon.charge',
      grenade: 'sta.actor.belonging.weapon.grenade',
      area: 'sta.actor.belonging.weapon.area',
      intense: 'sta.actor.belonging.weapon.intense',
      knockdown: 'sta.actor.belonging.weapon.knockdown',
      accurate: 'sta.actor.belonging.weapon.accurate',
      debilitating: 'sta.actor.belonging.weapon.debilitating',
      cumbersome: 'sta.actor.belonging.weapon.cumbersome',
      inaccurate: 'sta.actor.belonging.weapon.inaccurate',
      deadly: 'sta.actor.belonging.weapon.deadly',
      nonlethal: 'sta.actor.belonging.weapon.nonlethal',
      hiddenx: 'sta.actor.belonging.weapon.hiddenx',
      piercingx: 'sta.actor.belonging.weapon.piercingx',
      viciousx: 'sta.actor.belonging.weapon.viciousx',
    });

    const TOOLTIP_TEXT = Object.freeze({
      charge: game.i18n.localize('sta.tooltip.character.weapon.1e.charge'),
      grenade: game.i18n.localize('sta.tooltip.character.weapon.1e.grenade'),
      area: game.i18n.localize('sta.tooltip.character.weapon.1e.area'),
      intense: game.i18n.localize('sta.tooltip.character.weapon.1e.intense'),
      knockdown: game.i18n.localize('sta.tooltip.character.weapon.1e.knockdown'),
      accurate: game.i18n.localize('sta.tooltip.character.weapon.1e.accurate'),
      debilitating: game.i18n.localize('sta.tooltip.character.weapon.1e.debilitating'),
      cumbersome: game.i18n.localize('sta.tooltip.character.weapon.1e.cumbersome'),
      inaccurate: game.i18n.localize('sta.tooltip.character.weapon.1e.inaccurate'),
      deadly: game.i18n.localize('sta.tooltip.character.weapon.1e.deadly'),
      nonlethal: game.i18n.localize('sta.tooltip.character.weapon.1e.nonlethal'),
      hiddenx: game.i18n.localize('sta.tooltip.character.weapon.1e.hiddenx'),
      piercingx: game.i18n.localize('sta.tooltip.character.weapon.1e.piercingx'),
      viciousx: game.i18n.localize('sta.tooltip.character.weapon.1e.viciousx'),
    });

    const tags = [];

    for (const [prop, rawValue] of Object.entries(item.system.qualities)) {
      if (rawValue === undefined || rawValue === null || rawValue === '') continue;
      if (!Object.prototype.hasOwnProperty.call(LABELS, prop)) continue;
      if (rawValue === true) {
        const label = game.i18n.localize(LABELS[prop]);
        const tip = TOOLTIP_TEXT[prop] ?? '';
        tags.push({ label, tooltip: tip });
      }
      else if (Number.isFinite(rawValue) && rawValue > 0) {
        const label = game.i18n.localize(LABELS[prop]);
        const display = `${label} ${rawValue}`;
        const tip = TOOLTIP_TEXT[prop] ?? '';
        tags.push({ label: display, tooltip: tip });
      }
    }

    const rolledChallenge = await new Roll(calculatedDamage + 'd6').evaluate({});
    const getSuccessesEffects = await this._getSuccessesEffects(rolledChallenge);
    const getSuccessesEffectsText = await this._getSuccessesEffectsText(getSuccessesEffects);
    const diceString = await this._getDiceImageListFromChallengeRoll(rolledChallenge);

    const itemData = {
      speakerName: speaker.alias ?? speaker.name,
      img: item.img,
      flavor: game.i18n.localize(`sta.actor.belonging.${item.type}.title`),
      name: item.name,
      descFieldHtml: item.system.description,
      rollType: 'item',
      varFieldHtml: variable,
      tags,
      itemDamage: item.system.damage + 'd6',
      itemQuantity: item.system.quantity || 1,
      opportunityCost: item.system.opportunity,
      escalationCost: item.system.escalation,
      range: game.i18n.localize(`sta.roll.${item.system.range}`),
      weapontype: item.system.hands + ' ' + game.i18n.localize(`sta.item.genericitem.handed`),
      quantityRow: true,
      damageRow: true,
      ...getSuccessesEffects,
      ...getSuccessesEffectsText,
      diceString,
      rollAsWeapon: true,
      dice3dRoll: rolledChallenge,
    };

    this.sendToChat(itemData);
  }

  async performStarshipWeaponRoll1e(item, speaker) {
    let actorSecurity = 0;
    if (speaker.system.disciplines) {
      actorSecurity = parseInt(speaker.system.disciplines.security.value);
    } else if (speaker.system.departments) {
      actorSecurity = parseInt(speaker.system.departments.security.value);
    }
    let scaleDamage = 0;
    if (item.system.includescale && speaker.system.scale) scaleDamage = parseInt(speaker.system.scale);
    const calculatedDamage = item.system.damage + actorSecurity + scaleDamage;
    // Create variable div and populate it with localisation to use in the HTML.
    let variablePrompt = game.i18n.format('sta.roll.weapon.damagePlural');
    if (calculatedDamage == 1) {
      variablePrompt = game.i18n.format('sta.roll.weapon.damage');
    }
    const variable = `<div class='dice-formula'> ` + variablePrompt.replace('|#|', calculatedDamage) + `</div>`;

    const LABELS = Object.freeze({
      area: 'sta.actor.belonging.weapon.area',
      spread: 'sta.actor.belonging.weapon.spread',
      highyield: 'sta.actor.belonging.weapon.highyield',
      devastating: 'sta.actor.belonging.weapon.devastating',
      dampening: 'sta.actor.belonging.weapon.dampening',
      calibration: 'sta.actor.belonging.weapon.calibration',
      hiddenx: 'sta.actor.belonging.weapon.hiddenx',
      persistentx: 'sta.actor.belonging.weapon.persistentx',
      piercingx: 'sta.actor.belonging.weapon.piercingx',
      viciousx: 'sta.actor.belonging.weapon.viciousx',
      versatilex: 'sta.actor.belonging.weapon.versatilex',
    });

    const TOOLTIP_TEXT = Object.freeze({
      area: game.i18n.localize('sta.tooltip.starship.weapon.1e.area'),
      spread: game.i18n.localize('sta.tooltip.starship.weapon.1e.spread'),
      highyield: game.i18n.localize('sta.tooltip.starship.weapon.1e.highyield'),
      devastating: game.i18n.localize('sta.tooltip.starship.weapon.1e.devastating'),
      dampening: game.i18n.localize('sta.tooltip.starship.weapon.1e.dampening'),
      calibration: game.i18n.localize('sta.tooltip.starship.weapon.1e.calibration'),
      hiddenx: game.i18n.localize('sta.tooltip.starship.weapon.1e.hiddenx'),
      persistentx: game.i18n.localize('sta.tooltip.starship.weapon.1e.persistentx'),
      piercingx: game.i18n.localize('sta.tooltip.starship.weapon.1e.piercingx'),
      viciousx: game.i18n.localize('sta.tooltip.starship.weapon.1e.viciousx'),
      versatilex: game.i18n.localize('sta.tooltip.starship.weapon.1e.versatilex'),
    });

    const tags = [];

    for (const [prop, rawValue] of Object.entries(item.system.qualities)) {
      if (rawValue === undefined || rawValue === null || rawValue === '') continue;
      if (!Object.prototype.hasOwnProperty.call(LABELS, prop)) continue;
      if (rawValue === true) {
        const label = game.i18n.localize(LABELS[prop]);
        const tip = TOOLTIP_TEXT[prop] ?? '';
        tags.push({ label, tooltip: tip });
      }
      else if (Number.isFinite(rawValue) && rawValue > 0) {
        const label = game.i18n.localize(LABELS[prop]);
        const display = `${label} ${rawValue}`;
        const tip = TOOLTIP_TEXT[prop] ?? '';
        tags.push({ label: display, tooltip: tip });
      }
    }

    const rolledChallenge = await new Roll(calculatedDamage + 'd6').evaluate({});
    const getSuccessesEffects = await this._getSuccessesEffects(rolledChallenge);
    const getSuccessesEffectsText = await this._getSuccessesEffectsText(getSuccessesEffects);
    const diceString = await this._getDiceImageListFromChallengeRoll(rolledChallenge);
    let weapontype = game.i18n.localize(`sta.actor.starship.scale`);
    if (item.system.includescale === false) {
      weapontype = 'No ' + game.i18n.localize(`sta.actor.starship.scale`);
    }

    const itemData = {
      speakerName: speaker.alias ?? speaker.name,
      img: item.img,
      flavor: game.i18n.localize(`sta.actor.belonging.${item.type}.title`),
      name: item.name,
      descFieldHtml: item.system.description,
      rollType: 'item',
      varFieldHtml: variable,
      tags,
      itemDamage: item.system.damage + 'd6',
      itemQuantity: item.system.quantity || 1,
      opportunityCost: item.system.opportunity,
      escalationCost: item.system.escalation,
      range: game.i18n.localize(`sta.actor.belonging.weapon.${item.system.range}`),
      weapontype,
      quantityRow: true,
      damageRow: true,
      ...getSuccessesEffects,
      ...getSuccessesEffectsText,
      diceString,
      rollAsWeapon: true,
      dice3dRoll: rolledChallenge,
    };

    this.sendToChat(itemData);
  }

  // #########################################################
  // #                                                       #
  // #                      Reroll                           #
  // #                                                       #
  // #########################################################

  async handleReroll(messageId) {
    const message = game.messages.get(messageId);

    if (!message) {
      ui.notifications.warn(`No chat message found with ID ${messageId}`);
      return;
    }
    const rollData = message.flags.sta ?? {};

    const diceOutcome = rollData.diceOutcome;
    const shipdiceOutcome = rollData.shipdiceOutcome;

    let template = `
      <div class="dialogue">
        ${game.i18n.localize(`sta.roll.rerollwhichresults`)}
        <div class="dice-rolls">
    `;

    let diceImage = '';

    switch (rollData.rollType) {
      case 'task':
        diceOutcome.forEach((num, i) => {
          template += `
            <div>
              <div class="die-image">
                <li class="roll die d20">${num}</li>
              </div>
              <div class="checkbox-container">
                <input type="checkbox" name="num" value="${i}">
              </div>  
            </div>  
          `;
        });
        break;
      case 'challenge':
      case 'item':
        diceOutcome.forEach((num, i) => {
          switch (num) {
            case 1:
              diceImage = 'Success1';
              break;
            case 2:
              diceImage = 'Success2';
              break;
            case 3:
            case 4:
              diceImage = 'Success0';
              break;
            case 5:
            case 6:
              diceImage = 'Effect';
              break;
            default:
              break;
          };

          template += `
            <div>
              <div class="die-image">
                <li class="roll die d6"><img src="systems/sta/assets/icons/ChallengeDie_${diceImage}_small.png" /></li>
              </div>
              <div class="checkbox-container">
                <input type="checkbox" name="num" value="${i}">
              </div>  
            </div>  
          `;
        });
        break;
      case 'npc':
        diceOutcome.forEach((crewnum, i) => {
          template += `
            <div>
              <div class="die-image">
                <li class="roll die d20">${crewnum}</li>
              </div>
              <div class="checkbox-container">
                <input type="checkbox" name="crewnum" value="${i}">
              </div>  
            </div>  
          `;
        });

        shipdiceOutcome.forEach((shipnum, i) => {
          template += `
            </div>
            <div class="dice-rolls">
              <div>
                <div class="die-image">
                  <li class="roll die d20">${shipnum}</li>
                </div>
                <div class="checkbox-container">
                  <input type="checkbox" name="shipnum" value="${i}">
                </div>
              </div>  
          `;
        });
        break;

      default:
        break;
    }

    template += `
        </div>
      </div>
    `;

    const formData = await api.DialogV2.wait({
      window: {
        title: game.i18n.localize('sta.roll.rerollresults'),
      },
      position: {
        height: 'auto',
        width: 375,
      },
      content: template,
      classes: ['dialogue'],
      buttons: [
        {
          action: 'roll',
          default: true,
          label: game.i18n.localize('sta.roll.rerollresults'),
          callback: (event, button, dialog) => {
            const form = dialog.element.querySelector('form');
            return form ? new FormData(form) : null;
          },
        },
      ],
      close: () => null,
    });

    if (!formData) return;

    const rerolled = formData.getAll("num").map(Number);
    const kept = diceOutcome?.filter((_, i) => !rerolled.includes(i));
    const crewrerolled = formData.getAll("crewnum").map(Number);
    const crewkept = diceOutcome?.filter((_, i) => !crewrerolled.includes(i));
    const shiprerolled = formData.getAll("shipnum").map(Number);
    const shipkept = shipdiceOutcome?.filter((_, i) => !shiprerolled.includes(i));

    let retainedResult = '';
    let rerolledResult = '';
    let resultText = '';
    let shipretainedResult = '';
    let shiprerolledResult = '';
    let taskRolled = [];
    let shiptaskRolled = [];
    let isTaskReroll = false;
    let isChallengeReroll = false;
    let isNPCReroll = false;

    switch (rollData.rollType) {
      case 'task':
        const retainedTaskDice = {
          checkTarget: rollData.checkTarget,
          complicationMinimumValue: rollData.complicationMinimumValue,
          disDepTarget: rollData.disDepTarget,
          customResults: kept,
          usingFocus: rollData.usingFocus,
          usingDedicatedFocus: rollData.usingDedicatedFocus,
        };
        retainedResult = await this._taskResult(retainedTaskDice);

        taskRolled = await this._performRollTask({ dicePool: rerolled.length });

        const rerolledTaskDice = {
          checkTarget: rollData.checkTarget,
          complicationMinimumValue: rollData.complicationMinimumValue,
          disDepTarget: rollData.disDepTarget,
          usingFocus: rollData.usingFocus,
          usingDedicatedFocus: rollData.usingDedicatedFocus,
          ...taskRolled,
        };
        rerolledResult = await this._taskResult(rerolledTaskDice);

        const taskData = {
          success: retainedResult.success + rerolledResult.success,
          complication: retainedResult.complication + rerolledResult.complication,
        };

        resultText = await this._taskResultText(taskData);
        isTaskReroll = true;
        break;
      case 'challenge':
      case 'item':
        const retainedChallengeDice = { customResults: kept, };
        const retainedDiceString = await this._getDiceImageListFromChallengeRoll(retainedChallengeDice);
        const retainedSuccessesEffects = await this._getSuccessesEffects(retainedChallengeDice);

        retainedResult = { diceString: retainedDiceString, };

        taskRolled = await new Roll(rerolled.length + 'd6').evaluate({});
        const rerolledDiceString = await this._getDiceImageListFromChallengeRoll(taskRolled);
        const rerolledSuccessesEffects = await this._getSuccessesEffects(taskRolled);

        rerolledResult = { diceString: rerolledDiceString, };

        const challengeData = {
          successes: retainedSuccessesEffects.successes + rerolledSuccessesEffects.successes,
          effects: retainedSuccessesEffects.effects + rerolledSuccessesEffects.effects,
        };

        resultText = await this._getSuccessesEffectsText(challengeData);

        isChallengeReroll = true;
        break;
      case 'npc':
        // CREW
        const crewretainedTaskDice = {
          checkTarget: rollData.checkTarget,
          complicationMinimumValue: rollData.complicationMinimumValue,
          disDepTarget: rollData.disDepTarget,
          customResults: crewkept,
          usingFocus: rollData.usingFocus,
          usingDedicatedFocus: rollData.usingDedicatedFocus,
        };
        retainedResult = await this._taskResult(crewretainedTaskDice);

        taskRolled = await this._performRollTask({ dicePool: crewrerolled.length });

        const crewrerolledTaskDice = {
          checkTarget: rollData.checkTarget,
          complicationMinimumValue: rollData.complicationMinimumValue,
          disDepTarget: rollData.disDepTarget,
          usingFocus: rollData.usingFocus,
          usingDedicatedFocus: rollData.usingDedicatedFocus,
          ...taskRolled,
        };
        rerolledResult = await this._taskResult(crewrerolledTaskDice);

        // SHIP
        const shipretainedTaskDice = {
          checkTarget: rollData.checkTarget,
          complicationMinimumValue: rollData.complicationMinimumValue,
          shipdisDepTarget: rollData.shipdisDepTarget,
          usingFocus: true,
          customResults: shipkept,
        };
        shipretainedResult = await this._taskResult(shipretainedTaskDice);

        shiptaskRolled = await this._performRollTask({ dicePool: shiprerolled.length });

        const shiprerolledTaskDice = {
          checkTarget: rollData.checkTarget,
          complicationMinimumValue: rollData.complicationMinimumValue,
          shipdisDepTarget: rollData.shipdisDepTarget,
          usingFocus: rollData.usingFocus,
          ...shiptaskRolled,
        };
        shiprerolledResult = await this._taskResult(shiprerolledTaskDice);

        const shipcrewData = {
          success: shipretainedResult.success + shiprerolledResult.success + retainedResult.success + rerolledResult.success,
          complication: shipretainedResult.complication + shiprerolledResult.complication + retainedResult.complication + rerolledResult.complication,
        };

        resultText = await this._taskResultText(shipcrewData);

        isNPCReroll = true;
        break;

      default:
        break;
    }

    const rerollData = {
      speakerName: rollData.speakerName,
      rollType: 'reroll',
      originalRollType: rollData.rollType,
      flavor: rollData.flavor + ' ' + game.i18n.localize('sta.roll.rerollresults'),
      retainedRoll: retainedResult.diceString,
      rerolledRoll: rerolledResult.diceString,
      shipretainedRoll: shipretainedResult.diceString,
      shiprerolledRoll: shiprerolledResult.diceString,
      ...resultText,
      starshipName: rollData.starshipName,
      flavorship: rollData.flavorship + ' ' + game.i18n.localize('sta.roll.rerollresults'),
      isTaskReroll,
      isChallengeReroll,
      isNPCReroll,
      dice3dRoll: taskRolled.taskRolled || taskRolled,
      dice3dshipRoll: shiptaskRolled.taskRolled,
    };

    this.sendToChat(rerollData);
  }

  // #########################################################
  // #                                                       #
  // #                  Send to Chat                         #
  // #                                                       #
  // #########################################################

  async sendToChat(rollData) {
    let chatData = '';
    let sound = '';
    switch (rollData.rollType) {
      case 'task':
        chatData = await foundry.applications.handlebars.renderTemplate(
          'systems/sta/templates/chat/attribute-test.hbs',
          rollData
        );
        sound = CONFIG.sounds.dice;
        break;
      case 'challenge':
        chatData = await foundry.applications.handlebars.renderTemplate(
          'systems/sta/templates/chat/challenge-roll.hbs',
          rollData
        );
        sound = CONFIG.sounds.dice;
        break;
      case 'npc':
        chatData = await foundry.applications.handlebars.renderTemplate(
          'systems/sta/templates/chat/attribute-test-npc.hbs',
          rollData
        );
        sound = CONFIG.sounds.dice;
        break;
      case 'reroll':
        chatData = await foundry.applications.handlebars.renderTemplate(
          'systems/sta/templates/chat/reroll.hbs',
          rollData
        );
        sound = CONFIG.sounds.dice;
        break;
      case 'acclaim':
        chatData = await foundry.applications.handlebars.renderTemplate(
          'systems/sta/templates/chat/reputation-roll.hbs',
          rollData
        );
        sound = CONFIG.sounds.dice;
        break;
      case 'item':
        chatData = await foundry.applications.handlebars.renderTemplate(
          'systems/sta/templates/chat/generic-item.hbs',
          rollData
        );
        break;
      default:
        break;
    }

    const rollMode = game.settings.get('core', 'rollMode');

    // Check if the dice3d module exists (Dice So Nice). If it does, post a roll in that.
    if (game.dice3d && rollData.dice3dRoll) {
      game.dice3d.showForRoll(rollData.dice3dRoll, game.user, true);
    }

    if (game.dice3d && rollData.dice3dshipRoll) {
      game.dice3d.showForRoll(rollData.dice3dshipRoll, game.user, true);
    }

    const messageProps = {
      content: chatData,
      sound,
      flags: {
        'sta': {
          speakerName: rollData.speakerName,
          starshipName: rollData.starshipName,
          diceOutcome: rollData.diceOutcome,
          crewdiceOutcome: rollData.crewdiceOutcome,
          shipdiceOutcome: rollData.shipdiceOutcome,
          rollType: rollData.rollType,
          dicePool: rollData.dicePool,
          complicationMinimumValue: rollData.complicationMinimumValue,
          checkTarget: rollData.checkTarget,
          disDepTarget: rollData.disDepTarget,
          shipdisDepTarget: rollData.shipdisDepTarget,
          flavor: rollData.flavor,
          flavorship: rollData.flavorship,
          usingFocus: rollData.usingFocus,
          usingDedicatedFocus: rollData.usingDedicatedFocus,
        }
      },
    };

    // Apply the roll mode to automatically adjust visibility settings
    ChatMessage.applyRollMode(messageProps, rollMode);

    // Send the chat message
    return await ChatMessage.create(messageProps);
  }
}