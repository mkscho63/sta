export class STARoll {
  async performAttributeTest(dicePool, usingFocus, usingDedicatedFocus, usingDetermination,
    selectedAttribute, selectedAttributeValue, selectedDiscipline,
    selectedDisciplineValue, complicationRange, speaker) {
    // Define some variables that we will be using later.
    let i;
    let result = 0;
    let diceString = '';
    let success = 0;
    let complication = 0;
    let withFocus = '';
    let withDedicatedFocus = '';
    let withDetermination = '';
    const checkTarget =
      parseInt(selectedAttributeValue) + parseInt(selectedDisciplineValue);
    const complicationMinimumValue = 20 - (complicationRange - 1);
    const doubledetermination = parseInt(selectedDisciplineValue) + parseInt(selectedDisciplineValue);
    // Foundry will soon make rolling async only, setting it up as such now avoids a warning. 
    const r = await new Roll(dicePool + 'd20').evaluate({});
    // Now for each dice in the dice pool we want to check what the individual result was.
    for (i = 0; i < dicePool; i++) {
      result = r.terms[0].results[i].result;
      // If the result is less than or equal to the focus, that counts as 2 successes and we want to show the dice as green.
      if ((usingFocus && result <= selectedDisciplineValue) || result == 1) {
        diceString += '<li class="roll die d20 max">' + result + '</li>';
        success += 2;
      } else if ((usingDedicatedFocus && result <= doubledetermination) || result == 1) {
        diceString += '<li class="roll die d20 max">' + result + '</li>';
        success += 2;
        // If the result is less than or equal to the target (the discipline and attribute added together), that counts as 1 success but we want to show the dice as normal.
      } else if (result <= checkTarget) {
        diceString += '<li class="roll die d20">' + result + '</li>';
        success += 1;
        // If the result is greater than or equal to the complication range, then we want to count it as a complication. We also want to show it as red!
      } else if (result >= complicationMinimumValue) {
        diceString += '<li class="roll die d20 min">' + result + '</li>';
        complication += 1;
        // If none of the above is true, the dice failed to do anything and is treated as normal.
      } else {
        diceString += '<li class="roll die d20">' + result + '</li>';
      }
    }
    if (usingFocus) {
      withFocus = ', ' + game.i18n.format('sta.actor.belonging.focus.title');
    }
    if (usingDedicatedFocus) {
      withDedicatedFocus = withDedicatedFocus = ', ' + game.i18n.format('sta.roll.dedicatedfocus');
    }
    // If using a Value and Determination, automatically add in an extra critical roll
    if (usingDetermination) {
      diceString += '<li class="roll die d20 max">' + 1 + '</li>';
      success += 2;
      withDetermination = ', ' + game.i18n.format('sta.actor.character.determination');
    }
    // Here we want to check if the success was exactly one (as "1 Successes" doesn't make grammatical sense). We create a string for the Successes.
    let successText = '';
    if (success == 1) {
      successText = success + ' ' + game.i18n.format('sta.roll.success');
    } else {
      successText = success + ' ' + game.i18n.format('sta.roll.successPlural');
    }
    // Check if we allow multiple complications, or if only one complication ever happens.
    const multipleComplicationsAllowed = game.settings.get('sta', 'multipleComplications');
    // If there is any complications, we want to crate a string for this. If we allow multiple complications and they exist, we want to pluralise this also.
    // If no complications exist then we don't even show this box.
    let complicationText = '';
    if (complication >= 1) {
      if (complication > 1 && multipleComplicationsAllowed === true) {
        const localisedPluralisation = game.i18n.format('sta.roll.complicationPlural');
        complicationText = '<h4 class="dice-total failure"> ' + localisedPluralisation.replace('|#|', complication) + '</h4>';
      } else {
        complicationText = '<h4 class="dice-total failure"> ' + game.i18n.format('sta.roll.complication') + '</h4>';
      }
    } else {
      complicationText = '';
    }
    // Set the flavour to "[Attribute] [Discipline] Attribute Test". This shows the chat what type of test occured.
    let flavor = '';
    switch (speaker.type) {
    case 'character':
      flavor = game.i18n.format('sta.actor.character.attribute.' + selectedAttribute) + ' ' + game.i18n.format('sta.actor.character.discipline.' + selectedDiscipline) + ' ' + game.i18n.format('sta.roll.task.name');
      break;
    case 'starship':
      flavor = game.i18n.format('sta.actor.starship.system.' + selectedAttribute) + ' ' + game.i18n.format('sta.actor.starship.department.' + selectedDiscipline) + ' ' + game.i18n.format('sta.roll.task.name');
      break;
    case 'sidebar':
      flavor = game.i18n.format('sta.apps.staroller') + ' ' + game.i18n.format('sta.roll.task.name');
      break;
    case 'npccharacter':
      flavor = game.i18n.format('sta.roll.npccrew' + selectedAttribute) + ' ' + game.i18n.format('sta.roll.npccrew') + ' ' + game.i18n.format('sta.roll.task.name');
      break;
    case 'npcship':
      flavor = game.i18n.format('sta.roll.npcship') + ' ' + game.i18n.format('sta.roll.task.name');
      break;
    }
    const chatData = {
      speakerId: speaker.id,
      tokenId: speaker.token ? speaker.token.uuid : null,
      dicePool,
      checkTarget,
      complicationMinimumValue: complicationMinimumValue + '+',
      diceHtml: diceString,
      complicationHtml: complicationText,
      successText,
      selectedAttribute,
      selectedAttributeValue,
      selectedDiscipline,
      selectedDisciplineValue,
      withFocus,
      withDedicatedFocus,
      withDetermination,
    };
    const html = await foundry.applications.handlebars.renderTemplate('systems/sta/templates/chat/attribute-test.hbs', chatData);
    // Check if the dice3d module exists (Dice So Nice). If it does, post a roll in that and then send to chat after the roll has finished. If not just send to chat.
    if (game.dice3d) {
      game.dice3d.showForRoll(r, game.user, true).then((displayed) => {
        this.sendToChat(speaker, html, undefined, r, flavor, '');
      });
    } else {
      this.sendToChat(speaker, html, undefined, r, flavor, 'sounds/dice.wav');
    };
  }

  async performChallengeRoll(dicePool, challengeName, speaker = null) {
    // Foundry will soon make rolling async only, setting it up as such now avoids a warning. 
    const rolledChallenge = await new Roll(dicePool + 'd6').evaluate({});
    const flavor = challengeName + ' ' + game.i18n.format('sta.roll.challenge.name');
    const successes = getSuccessesChallengeRoll(rolledChallenge);
    const effects = getEffectsFromChallengeRoll(rolledChallenge);
    const diceString = getDiceImageListFromChallengeRoll(rolledChallenge);
    // pluralize success string
    let successText = '';
    successText = successes + ' ' + i18nPluralize(successes, 'sta.roll.success');
    // pluralize effect string
    let effectText = '';
    if (effects >= 1) {
      effectText = '<h4 class="dice-total effect"> ' + i18nPluralize(effects, 'sta.roll.effect') + '</h4>';
    }
    const chatData = {
      speakerId: speaker && speaker.id,
      tokenId: speaker && speaker.token ? speaker.token.uuid : null,
      dicePool,
      diceHtml: diceString,
      successText,
      effectHtml: effectText,
    };
    const html =
      `<div class="sta roll chat card" 
            data-token-id="${chatData.tokenId}" 
            data-speaker-id="${chatData.speakerId}">
              ${await foundry.applications.handlebars.renderTemplate('systems/sta/templates/chat/challenge-roll.hbs', chatData)}
      </div>`;
    // Check if the dice3d module exists (Dice So Nice). If it does, post a roll in that and then send to chat after the roll has finished. If not just send to chat.
    if (game.dice3d) {
      game.dice3d.showForRoll(rolledChallenge, game.user, true).then((displayed) => {
        this.sendToChat(speaker, html, undefined, rolledChallenge, flavor, '');
      });
    } else {
      this.sendToChat(speaker, html, undefined, rolledChallenge, flavor, 'sounds/dice.wav');
    };
  }

  async performItemRoll(item, speaker) {
    // Create variable div and populate it with localisation to use in the HTML.
    const variablePrompt = game.i18n.format('sta.roll.item.quantity');
    const variable = `<div class='dice-formula'> ` + variablePrompt.replace('|#|', item.system.quantity) + `</div>`;
    // Send the divs to populate a HTML template and sends to chat.
    this.genericItemTemplate(item, speaker, variable)
      .then((html) => this.sendToChat(speaker, html, item));
  }

  async performTalentRoll(item, speaker) {
    // Send the divs to populate a HTML template and sends to chat.
    this.genericItemTemplate(item, speaker)
      .then((html) => this.sendToChat(speaker, html, item));
  }

  async performFocusRoll(item, speaker) {
    // Send the divs to populate a HTML template and sends to chat.
    this.genericItemTemplate(item, speaker)
      .then((html) => this.sendToChat(speaker, html, item));
  }

  async performValueRoll(item, speaker) {
    // Send the divs to populate a HTML template and sends to chat.
    this.genericItemTemplate(item, speaker)
      .then((html) => this.sendToChat(speaker, html, item));
  }

  async performInjuryRoll(item, speaker) {
    // Send the divs to populate a HTML template and sends to chat.
    this.genericItemTemplate(item, speaker)
      .then((html) => this.sendToChat(speaker, html, item));
  }

  async performTraitRoll(item, speaker) {
    // Send the divs to populate a HTML template and sends to chat.
    this.genericItemTemplate(item, speaker)
      .then((html) => this.sendToChat(speaker, html, item));
  }

  async performMilestoneRoll(item, speaker) {
    // Send the divs to populate a HTML template and sends to chat.
    this.genericItemTemplate(item, speaker)
      .then((html) => this.sendToChat(speaker, html, item));
  }

  async performLogRoll(item, speaker) {
    // Send the divs to populate a HTML template and sends to chat.
    this.genericItemTemplate(item, speaker)
      .then((html) => this.sendToChat(speaker, html, item));
  }

  async performWeaponRoll(item, speaker) {
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
    const tags = item.type === 'characterweapon' ?
      this._assembleCharacterWeaponTags(item) :
      this._assembleShipWeaponsTags(item);
    const damageRoll = await new Roll(calculatedDamage + 'd6').evaluate({});
    const successes = getSuccessesChallengeRoll(damageRoll);
    const effects = getEffectsFromChallengeRoll(damageRoll);
    const diceString = getDiceImageListFromChallengeRoll(damageRoll);
    // pluralize success string
    let successText = '';
    successText = successes + ' ' + i18nPluralize(successes, 'sta.roll.success');
    // pluralize effect string
    let effectText = '';
    if (effects >= 1) {
      effectText = '<h4 class="dice-total effect"> ' + i18nPluralize(effects, 'sta.roll.effect') + '</h4>';
    }
    const rolls = {
      challenge: {
        diceHtml: diceString,
        effectHtml: effectText,
        successText,
      }
    };
    const flags = {
      sta: {
        itemData: item.toObject(),
      }
    };
    // Send the divs to populate a HTML template and sends to chat.
    // Check if the dice3d module exists (Dice So Nice). If it does, post a roll in that and then send to chat after the roll has finished. If not just send to chat.
    this.genericItemTemplate(item, speaker, variable, tags, rolls).then((genericItemHTML) => {
      const finalHTML = genericItemHTML;
      if (game.dice3d) {
        game.dice3d.showForRoll(damageRoll, game.user, true).then(() => {
          this.sendToChat(speaker, finalHTML, item, damageRoll, item.name, '');
        });
      } else {
        this.sendToChat(speaker, finalHTML, item, damageRoll, item.name, 'sounds/dice.wav');
      }
    });
  }
  /**
   * Parse out tag strings appropriate for a characterweapon Chat Card.
   *
   * @param {Item} item
   *
   * @return {string[]}
   * @private
   */
  _assembleCharacterWeaponTags(item) {
    const LABELS = Object.freeze({
      melee: 'sta.actor.belonging.weapon.melee',
      ranged: 'sta.actor.belonging.weapon.ranged',
      area: 'sta.actor.belonging.weapon.area',
      intense: 'sta.actor.belonging.weapon.intense',
      knockdown: 'sta.actor.belonging.weapon.knockdown',
      accurate: 'sta.actor.belonging.weapon.accurate',
      charge: 'sta.actor.belonging.weapon.charge',
      cumbersome: 'sta.actor.belonging.weapon.cumbersome',
      deadly: 'sta.actor.belonging.weapon.deadly',
      debilitating: 'sta.actor.belonging.weapon.debilitating',
      grenade: 'sta.actor.belonging.weapon.grenade',
      inaccurate: 'sta.actor.belonging.weapon.inaccurate',
      nonlethal: 'sta.actor.belonging.weapon.nonlethal',
      hiddenx: 'sta.actor.belonging.weapon.hiddenx',
      persistentx: 'sta.actor.belonging.weapon.persistentx',
      piercingx: 'sta.actor.belonging.weapon.piercingx',
      viciousx: 'sta.actor.belonging.weapon.viciousx',
      severity: 'sta.item.genericitem.severity',
      stun: 'sta.actor.belonging.weapon.stun',
      escalation: 'sta.item.genericitem.escalation',
      opportunity: 'sta.item.genericitem.opportunity',
    });

    const tooltips = Object.freeze({
      area: game.i18n.localize('sta.tooltip.character.weapon.area'),
      intense: game.i18n.localize('sta.tooltip.character.weapon.intense'),
      knockdown: game.i18n.localize('sta.tooltip.character.weapon.knockdown'),
      accurate: game.i18n.localize('sta.tooltip.character.weapon.accurate'),
      charge: game.i18n.localize('sta.tooltip.character.weapon.charge'),
      cumbersome: game.i18n.localize('sta.tooltip.character.weapon.cumbersome'),
      deadly: game.i18n.localize('sta.tooltip.character.weapon.deadly'),
      debilitating: game.i18n.localize('sta.tooltip.character.weapon.debilitating'),
      grenade: game.i18n.localize('sta.tooltip.character.weapon.grenade'),
      inaccurate: game.i18n.localize('sta.tooltip.character.weapon.inaccurate'),
      nonlethal: game.i18n.localize('sta.tooltip.character.weapon.nonlethal'),
      hiddenx: game.i18n.localize('sta.tooltip.character.weapon.hiddenx'),
      persistentx: game.i18n.localize('sta.tooltip.character.weapon.persistentx'),
      piercingx: game.i18n.localize('sta.tooltip.character.weapon.piercingx'),
      viciousx: game.i18n.localize('sta.tooltip.character.weapon.viciousx'),
      severity: game.i18n.localize('sta.tooltip.character.weapon.severity'),
    });

    const tags = [];
  
    // Add range tags
    if (item.system.range === 'melee') {
      tags.push({
        label: game.i18n.localize(LABELS.melee),
      });
    } else if (item.system.range === 'ranged') {
      tags.push({
        label: game.i18n.localize(LABELS.ranged),
      });
    }

    // Loop through item qualities and apply tooltips per quality
    const qualities = item.system.qualities;
    for (const property in qualities) {
      if (!Object.hasOwn(LABELS, property) || !qualities[property]) continue;

      const label = game.i18n.localize(LABELS[property]);
      const tag = Number.isInteger(qualities[property]) ? `${label} ${qualities[property]}` : label;

      tags.push({
        label: tag,
        tooltip: tooltips[property] || ''
      });
    }

    // Handle special case for hands
    if (item.system.hands) {
      tags.push({
        label: `${item.system.hands} ${game.i18n.localize('sta.item.genericitem.handed')}`,
      });
    }

    return tags;
  }


  async performWeaponRoll2e(item, speaker) {
    // Create variable div and populate it with localisation to use in the HTML.
    const variablePrompt = game.i18n.format('sta.roll.weapon.damage2e');
    const variable = `<div class='dice-formula'> ` + variablePrompt.replace('|#|', item.system.damage) + `</div>`;
    const tags = this._assembleCharacterWeaponTags(item);
    // Send the divs to populate a HTML template and sends to chat.
    this.genericItemTemplate(item, speaker, variable, tags)
      .then((html) => this.sendToChat(speaker, html, item));
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
    const tags = this._assembleShipWeaponsTags(item);
    const flags = {
      sta: {
        itemData: item.toObject(),
      }
    };
    // Send the divs to populate a HTML template and sends to chat.
    this.genericItemTemplate(item, speaker, variable, tags)
      .then((html) => this.sendToChat(speaker, html, item));
  }

  /**
   * Parse out tag strings appropriate for a shipweapon Chat Card.
   *
   * @param {Item} item
   *
   * @return {string[]}
   * @private
   */
  _assembleShipWeaponsTags(item) {
    const LABELS = Object.freeze({
      area: 'sta.actor.belonging.weapon.area',
      calibration: 'sta.actor.belonging.weapon.calibration',
      cumbersome: 'sta.actor.belonging.weapon.cumbersome',
      dampening: 'sta.actor.belonging.weapon.dampening',
      depleting: 'sta.actor.belonging.weapon.depleting',
      devastating: 'sta.actor.belonging.weapon.devastating',
      hiddenx: 'sta.actor.belonging.weapon.hiddenx',
      highyield: 'sta.actor.belonging.weapon.highyield',
      intense: 'sta.actor.belonging.weapon.intense',
      jamming: 'sta.actor.belonging.weapon.jamming',
      piercing: 'sta.actor.belonging.weapon.piercingx',
      piercingx: 'sta.actor.belonging.weapon.piercingx',
      slowing: 'sta.actor.belonging.weapon.slowing',
      spread: 'sta.actor.belonging.weapon.spread',
      versatilex: 'sta.actor.belonging.weapon.versatilex',
      viciousx: 'sta.actor.belonging.weapon.viciousx',
    });

    const tooltips = Object.freeze({
      area: game.i18n.localize('sta.tooltip.starship.weapon.area'),
      calibration: game.i18n.localize('sta.tooltip.starship.weapon.calibration'),
      cumbersome: game.i18n.localize('sta.tooltip.starship.weapon.cumbersome'),
      dampening: game.i18n.localize('sta.tooltip.starship.weapon.dampening'),
      depleting: game.i18n.localize('sta.tooltip.starship.weapon.depleting'),
      devastating: game.i18n.localize('sta.tooltip.starship.weapon.devastating'),
      hiddenx: game.i18n.localize('sta.tooltip.starship.weapon.hiddenx'),
      highyield: game.i18n.localize('sta.tooltip.starship.weapon.highyield'),
      intense: game.i18n.localize('sta.tooltip.starship.weapon.intense'),
      jamming: game.i18n.localize('sta.tooltip.starship.weapon.jamming'),
      piercing: game.i18n.localize('sta.tooltip.starship.weapon.piercing'),
      piercingx: game.i18n.localize('sta.tooltip.starship.weapon.piercingx'),
      slowing: game.i18n.localize('sta.tooltip.starship.weapon.slowing'),
      spread: game.i18n.localize('sta.tooltip.starship.weapon.spread'),
      versatilex: game.i18n.localize('sta.tooltip.starship.weapon.versatilex'),
      viciousx: game.i18n.localize('sta.tooltip.starship.weapon.viciousx'),
      scale: game.i18n.localize('sta.tooltip.starship.weapon.scale'),
    });

    const tags = [];

    // Add range tag if present
    if (item.system.range) {
      tags.push({
        label: game.i18n.localize(`sta.actor.belonging.weapon.${item.system.range}`),
      });
    }

    // Handle energy, torpedo, or scale-based tags
    if (item.system.includescale === 'energy') {
      tags.push({
        label: game.i18n.localize('sta.actor.belonging.weapon.energy'),
      });
    } else if (item.system.includescale === 'torpedo') {
      tags.push({
        label: game.i18n.localize('sta.actor.belonging.weapon.torpedo'),
      });
    } else if (item.system.includescale === true) {
      tags.push({
        label: game.i18n.localize('sta.actor.belonging.weapon.includescale'),
        tooltip: game.i18n.localize('sta.tooltip.starship.weapon.scale')
      });
    }

    // Loop through item qualities and generate tags + tooltips
    const qualities = item.system.qualities;
    for (const property in qualities) {
      if (!Object.hasOwn(LABELS, property) || !qualities[property]) continue;

      const label = game.i18n.localize(LABELS[property]);
      const tag = Number.isInteger(qualities[property]) ? `${label} ${qualities[property]}` : label;

      tags.push({
        label: tag,
        tooltip: tooltips[property] || ''
      });
    }

    return tags;
  }

  async performArmorRoll(item, speaker) {
    // Create variable div and populate it with localisation to use in the HTML.
    const variablePrompt = game.i18n.format('sta.roll.armor.protect');
    const variable = `<div class='dice-formula'> ` + variablePrompt.replace('|#|', item.system.protection) + `</div>`;
    // Send the divs to populate a HTML template and sends to chat.
    this.genericItemTemplate(item, speaker, variable)
      .then((html) => this.sendToChat(speaker, html, item));
  }

  /**
   * Render a generic item card.
   *
   * @param {Item} item
   * @param {Actor} speaker
   * @param {string=} variable
   * @param {Array<string>=} tags
   * @param {object=} rolls
   *
   * @return {Promise<string>}
   */
  async genericItemTemplate(item, speaker, variable = '', tags = [], rolls) {
    // Checks if the following are empty/undefined. If so sets to blank.
    const descField = item.system.description ? item.system.description : '';
    const cardData = {
      speakerId: speaker.id,
      tokenId: speaker.token ? speaker.token.uuid : null,
      itemId: item.id,
      img: item.img,
      type: game.i18n.localize(`sta.actor.belonging.${item.type}.title`),
      name: item.name,
      descFieldHtml: descField,
      tags: tags.concat(this._assembleGenericTags(item)),
      varFieldHtml: variable,
      rolls: rolls,
    };
    // Returns it for the sendToChat to utilise.
    return await foundry.applications.handlebars.renderTemplate('systems/sta/templates/chat/generic-item.hbs', cardData);
  }

  /**
   * Parse out tag strings appropriate for a general Item Chat Card.
   *
   * @param {Item} item
   *
   * @return {string[]}
   * @private
   */
  _assembleGenericTags(item) {
    const LABELS = Object.freeze({
      escalation: 'sta.item.genericitem.escalation',
      opportunity: 'sta.item.genericitem.opportunity',
    });
    const tags = [];
    for (const property in item.system) {
      if (!Object.hasOwn(LABELS, property) || !item.system[property]) continue;
      // Some qualities have tiers/ranks/numbers.
      const label = game.i18n.localize(LABELS[property]);
      const tag = Number.isInteger(item.system[property]) ? `${label} ${item.system[property]}` : label;
      tags.push(tag);
    }
    return tags;
  }

  async sendToChat(speaker, content, item, roll, flavor, sound) {
    const rollMode = game.settings.get('core', 'rollMode');
    const messageProps = {
      user: game.user.id,
      speaker: ChatMessage.getSpeaker({
        actor: speaker
      }),
      content: content,
      sound: sound,
      flags: {},
    };
    if (typeof item != 'undefined') {
      messageProps.flags.sta = {
        itemData: item.toObject(),
      };
    }
    if (typeof roll != 'undefined') {
      messageProps.roll = roll;
    }
    if (typeof flavor != 'undefined') {
      messageProps.flavor = flavor;
    }
    // Apply the roll mode to automatically adjust visibility settings
    ChatMessage.applyRollMode(messageProps, rollMode);
    // Send the chat message
    return await ChatMessage.create(messageProps);
  }
}

/*
  Returns the number of successes in a d6 challenge die roll
*/
function getSuccessesChallengeRoll(roll) {
  let dice = roll.terms[0].results.map((die) => die.result);
  dice = dice.map((die) => {
    if (die == 2) {
      return 2;
    } else if (die == 1 || die == 5 || die == 6) {
      return 1;
    }
    return 0;
  });
  return dice.reduce((a, b) => a + b, 0);
}

/*
  Returns the number of effects in a  d6 challenge die roll
*/
function getEffectsFromChallengeRoll(roll) {
  let dice = roll.terms[0].results.map((die) => die.result);
  dice = dice.map((die) => {
    if (die >= 5) {
      return 1;
    }
    return 0;
  });
  return dice.reduce((a, b) => a + b, 0);
}

/*
  Creates an HTML list of die face images from the results of a challenge roll
*/
function getDiceImageListFromChallengeRoll(roll) {
  let diceString = '';
  const diceFaceTable = [
    '<li class="roll die d6"><img src="systems/sta/assets/icons/ChallengeDie_Success1_small.png" /></li>',
    '<li class="roll die d6"><img src="systems/sta/assets/icons/ChallengeDie_Success2_small.png" /></li>',
    '<li class="roll die d6"><img src="systems/sta/assets/icons/ChallengeDie_Success0_small.png" /></li>',
    '<li class="roll die d6"><img src="systems/sta/assets/icons/ChallengeDie_Success0_small.png" /></li>',
    '<li class="roll die d6"><img src="systems/sta/assets/icons/ChallengeDie_Effect_small.png" /></li>',
    '<li class="roll die d6"><img src="systems/sta/assets/icons/ChallengeDie_Effect_small.png" /></li>'
  ];
  diceString = roll.terms[0].results.map((die) => die.result).map((result) => diceFaceTable[result - 1]).join(' ');
  return diceString;
}

/*
  grabs the nationalized local reference, switching to the plural form if count > 1, also, replaces |#| with count, then returns the resulting string. 
*/
function i18nPluralize(count, localizationReference) {
  if (count > 1) {
    return game.i18n.format(localizationReference + 'Plural').replace('|#|', count);
  }
  return game.i18n.format(localizationReference).replace('|#|', count);
}
