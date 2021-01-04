export class STARoll {
  async performAttributeTest(dicePool, usingFocus, usingDetermination,
    selectedAttribute, selectedAttributeValue, selectedDiscipline,
    selectedDisciplineValue, complicationRange, speaker) {
    // Define some variables that we will be using later.
    
    let i;
    let result = 0;
    let diceString = '';
    let success = 0;
    let complication = 0;
    const checkTarget = 
      parseInt(selectedAttributeValue) + parseInt(selectedDisciplineValue);
    const complicationMinimumValue = 20 - (complicationRange - 1);

    // Define r as our dice roll we want to perform (1d20, 2d20, 3d20, 4d20 or 5d20). We will then roll it.
    const r = new Roll(dicePool+'d20');
    r.roll();
    // Now for each dice in the dice pool we want to check what the individual result was.
    for (i = 0; i < dicePool; i++) {
      result = r.terms[0].results[i].result;
      // If the result is less than or equal to the focus, that counts as 2 successes and we want to show the dice as green.
      if ((usingFocus && result <= selectedDisciplineValue) || result == 1) {
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

    // If using a Value and Determination, automatically add in an extra critical roll
    if (usingDetermination) {
      diceString += '<li class="roll die d20 max">' + 1 + '</li>';
      success += 2;
    }

    // Here we want to check if the success was exactly one (as "1 Successes" doesn't make grammatical sense). We create a string for the Successes.
    let successText = '';
    if (success == 1) {
      successText = success + game.i18n.format('sta.roll.success');
    } else {
      successText = success + game.i18n.format('sta.roll.successPlural');
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
    switch (speaker.data.type) {
    case 'character':
      flavor = game.i18n.format('sta.actor.character.attribute.' + selectedAttribute) + ' ' + game.i18n.format('sta.actor.character.discipline.' + selectedDiscipline) + ' ' + game.i18n.format('sta.roll.task.name');
      break;
    case 'starship':
      flavor = game.i18n.format('sta.actor.starship.system.' + selectedAttribute) + ' ' + game.i18n.format('sta.actor.starship.department.' + selectedDiscipline) + ' ' + game.i18n.format('sta.roll.task.name');
    }

    // Build a dynamic html using the variables from above.
    const html = `
            <div class="sta roll attribute">
                <div class="dice-roll">
                    <div class="dice-result">
                        <div class="dice-formula">
                            <table class="aim">
                                <tr>
                                    <td> ` + dicePool + `d20 </td>
                                    <td> Target:` + checkTarget + ` </td>
                                    <td> ` + game.i18n.format('sta.roll.complicationrange') + complicationMinimumValue + `+ </td>
                                    </tr>
                            </table>
                        </div>
                        <div class="dice-tooltip">
                            <section class="tooltip-part">
                                <div class="dice">
                                    <ol class="dice-rolls">` + diceString + `</ol>
                                </div>
                            </section>
                        </div>` +
                        complicationText +
                        `<h4 class="dice-total">` + successText + `</h4>
                    </div>
                </div>
                <div class="reroll-result attribute">
                    <span>` + game.i18n.format('sta.roll.rerollresults') + `</span>
                    <input id="selectedAttribute" type="hidden" value="` + selectedAttribute + `" >
                    <input id="selectedAttributeValue" type="hidden" value="` + selectedAttributeValue + `" >
                    <input id="selectedDiscipline" type="hidden" value="` + selectedDiscipline + `" >
                    <input id="selectedDisciplineValue" type="hidden" value="` + selectedDisciplineValue + `" >
                    <input id="speakerId" type="hidden" value="` + speaker._id + `" >
                </div>
            </div>
        `;

    // Check if the dice3d module exists (Dice So Nice). If it does, post a roll in that and then send to chat after the roll has finished. If not just send to chat.
    if (game.dice3d) {
      game.dice3d.showForRoll(r).then((displayed) => {
        this.sendToChat(speaker, html, r, flavor);
      });
    } else {
      this.sendToChat(speaker, html, r, flavor);
    };
  }

  async performChallengeRoll(dicePool, weaponName, speaker) {
    // Define some variables that we will be using later.
    let i;
    let result = 0;
    let diceString = '';
    let success = 0;
    let effect = 0;
        
    // Define r as our dice roll we want to perform (#d6). We will then roll it.
    const r = new Roll(dicePool+'d6');
    r.roll();

    // Now for each dice in the dice pool we want to check what the individual result was.
    for (i = 0; i < dicePool; i++) {
      result = r.terms[0].results[i].result;
            
      switch (result) {
      case 1:
        diceString += '<li class="roll die d6"><img src="systems/sta/assets/icons/ChallengeDie_Success1_small.png" /></li>';
        success += 1;
        break;
      case 2:
        diceString += '<li class="roll die d6"><img src="systems/sta/assets/icons/ChallengeDie_Success2_small.png" /></li>';
        success += 2;
        break;
      case 5:
      case 6:
        diceString += '<li class="roll die d6"><img src="systems/sta/assets/icons/ChallengeDie_Effect_small.png" /></li>';
        success += 1;
        effect += 1;
        break;
      case 3:
      case 4:
      default:
        diceString += '<li class="roll die d6"><img src="systems/sta/assets/icons/ChallengeDie_Success0_small.png" /></li>';
        break;
      }
    }

    // Here we want to check if the success was exactly one (as "1 Successes" doesn't make grammatical sense). We create a string for the Successes.
    let successText = '';
    if (success == 1) {
      successText = success + game.i18n.format('sta.roll.success');
    } else {
      successText = success + game.i18n.format('sta.roll.successPlural');
    }

    // If there is any effect, we want to crate a string for this. If we have multiple effects and they exist, we want to pluralise this also.
    // If no effects exist then we don't even show this box.
    let effectText = '';
    if (effect >= 1) {
      if (effect > 1) {
        const localisedPluralisation = game.i18n.format('sta.roll.effectPlural');
        effectText = '<h4 class="dice-total effect"> ' + localisedPluralisation.replace('|#|', effect) + '</h4>';
      } else {
        effectText = '<h4 class="dice-total effect"> ' + game.i18n.format('sta.roll.effect') + '</h4>';
      }
    }

    const flavor = weaponName + ' ' + game.i18n.format('sta.roll.task.name');
                
    // Build a dynamic html using the variables from above.
    const html = `
          <div class="sta roll attribute">
            <div class="dice-roll">
              <div class="dice-result">
                <div class="dice-formula">
                  <table class="aim">
                    <tr>
                      <td> ` + dicePool + `d6 </td>
                    </tr>
                  </table>
                </div>
                <div class="dice-tooltip">
                  <section class="tooltip-part">
                    <div class="dice">
                      <ol class="dice-rolls">` + diceString + `</ol>
                    </div>
                  </section>
                </div>` +
                  effectText +
                  `<h4 class="dice-total">` + successText + `</h4>
                </div>
              </div>
              <div class="reroll-result challenge">
                <span>` + game.i18n.format('sta.roll.rerollresults') + `</span>
                <input id="speakerId" type="hidden" value="` + speaker._id + `" >
              </div>
            </div>`;
    
    // Check if the dice3d module exists (Dice So Nice). If it does, post a roll in that and then send to chat after the roll has finished. If not just send to chat.
    if (game.dice3d) {
      game.dice3d.showForRoll(r).then((displayed) => {
        this.sendToChat(speaker, html, r, flavor);
      });
    } else {
      this.sendToChat(speaker, html, r, flavor);
    };
  }

  async performItemRoll(item, speaker) {
    // Create variable div and populate it with localisation to use in the HTML.
    const variablePrompt = game.i18n.format('sta.roll.item.quantity');
    const variable = `<div class='dice-formula'> `+variablePrompt.replace('|#|', item.data.data.quantity)+`</div>`;
    
    // Create dynamic tags div and populate it with localisation to use in the HTML.
    let valueTag = '';
    if (item.data.data.cost > 0) {
      const costLocalisation = game.i18n.format('sta.roll.item.value');
      valueTag = '<div class=\'tag\'> '+costLocalisation.replace('|#|', item.data.data.cost)+'</div>';
    }
    
    // Send the divs to populate a HTML template and sends to chat.
    this.genericItemTemplate(item.data.img, item.data.name,
      item.data.data.description, variable, valueTag)
      .then((html)=>this.sendToChat(speaker, html));
  }

  async performFocusRoll(item, speaker) {
    // Send the divs to populate a HTML template and sends to chat.
    this.genericItemTemplate(item.data.img, item.data.name,
      item.data.data.description, null)
      .then((html)=>this.sendToChat(speaker, html));
  }

  async performValueRoll(item, speaker) {
    // Send the divs to populate a HTML template and sends to chat.
    this.genericItemTemplate(item.data.img, item.data.name,
      item.data.data.description, null)
      .then((html)=>this.sendToChat(speaker, html));
  }

  async performInjuryRoll(item, speaker) {
    // Send the divs to populate a HTML template and sends to chat.
    this.genericItemTemplate(item.data.img, item.data.name,
      item.data.data.description, null)
      .then((html)=>this.sendToChat(speaker, html));
  }

  async performWeaponRoll(item, speaker) {
    // Create variable div and populate it with localisation to use in the HTML.
    const variablePrompt = game.i18n.format('sta.roll.weapon.damage');
    const variable = `<div class='dice-formula'> `+variablePrompt.replace('|#|', item.data.data.damage)+`</div>`;
    
    // Create dynamic tags div and populate it with localisation to use in the HTML.
    let tags = '';
    if (item.data.data.cost > 0) {
      const costLocalisation = game.i18n.format('sta.roll.item.value');
      tags = '<div class=\'tag\'> '+costLocalisation.replace('|#|', item.data.data.cost)+'</div>';
    }
    
    if (item.data.data.qualities.melee) tags += '<div class=\'tag\'> '+game.i18n.format('sta.actor.belonging.weapon.melee')+'</div>';
    if (item.data.data.qualities.ranged) tags += '<div class=\'tag\'> '+game.i18n.format('sta.actor.belonging.weapon.ranged')+'</div>';
    if (item.data.data.qualities.area) tags += '<div class=\'tag\'> '+game.i18n.format('sta.actor.belonging.weapon.area')+'</div>';
    if (item.data.data.qualities.intense) tags += '<div class=\'tag\'> '+game.i18n.format('sta.actor.belonging.weapon.intense')+'</div>';
    if (item.data.data.qualities.knockdown) tags += '<div class=\'tag\'> '+game.i18n.format('sta.actor.belonging.weapon.knockdown')+'</div>';
    if (item.data.data.qualities.accurate) tags += '<div class=\'tag\'> '+game.i18n.format('sta.actor.belonging.weapon.accurate')+'</div>';
    if (item.data.data.qualities.charge) tags += '<div class=\'tag\'> '+game.i18n.format('sta.actor.belonging.weapon.charge')+'</div>';
    if (item.data.data.qualities.cumbersome) tags += '<div class=\'tag\'> '+game.i18n.format('sta.actor.belonging.weapon.cumbersome')+'</div>';
    if (item.data.data.qualities.deadly) tags += '<div class=\'tag\'> '+game.i18n.format('sta.actor.belonging.weapon.deadly')+'</div>';
    if (item.data.data.qualities.debilitating) tags += '<div class=\'tag\'> '+game.i18n.format('sta.actor.belonging.weapon.debilitating')+'</div>';
    if (item.data.data.qualities.grenade) tags += '<div class=\'tag\'> '+game.i18n.format('sta.actor.belonging.weapon.grenade')+'</div>';
    if (item.data.data.qualities.inaccurate) tags += '<div class=\'tag\'> '+game.i18n.format('sta.actor.belonging.weapon.inaccurate')+'</div>';
    if (item.data.data.qualities.nonlethal) tags += '<div class=\'tag\'> '+game.i18n.format('sta.actor.belonging.weapon.nonlethal')+'</div>';

    if (item.data.data.qualities.hiddenx > 0) tags += '<div class=\'tag\'> '+game.i18n.format('sta.actor.belonging.weapon.hiddenx') + ' ' + item.data.data.qualities.hiddenx +'</div>';
    if (item.data.data.qualities.piercingx > 0) tags += '<div class=\'tag\'> '+game.i18n.format('sta.actor.belonging.weapon.piercingx') + ' ' + item.data.data.qualities.piercingx +'</div>';
    if (item.data.data.qualities.viciousx > 0) tags += '<div class=\'tag\'> '+game.i18n.format('sta.actor.belonging.weapon.viciousx') + ' ' + item.data.data.qualities.viciousx +'</div>';

        
    // Send the divs to populate a HTML template and sends to chat.
    this.genericItemTemplate(item.data.img, item.data.name,
      item.data.data.description, variable, tags)
      .then((html)=>this.sendToChat(speaker, html));
  }

  async performArmorRoll(item, speaker) {
    // Create variable div and populate it with localisation to use in the HTML.
    const variablePrompt = game.i18n.format('sta.roll.armor.protect');
    const variable = `<div class='dice-formula'> `+variablePrompt.replace('|#|', item.data.data.protection)+`</div>`;
    
    // Create dynamic tags div and populate it with localisation to use in the HTML.
    let valueTag = '';
    if (item.data.data.cost > 0) {
      const costLocalisation = game.i18n.format('sta.roll.item.value');
      valueTag = '<div class=\'tag\'> '+costLocalisation.replace('|#|', item.data.data.cost)+'</div>';
    }

    // Send the divs to populate a HTML template and sends to chat.
    this.genericItemTemplate(item.data.img, item.data.name,
      item.data.data.description, variable, valueTag)
      .then((html)=>this.sendToChat(speaker, html));
  }

  async performTalentRoll(item, speaker) {
    // Create variable div and populate it with localisation to use in the HTML.
    const variablePrompt = game.i18n.format('sta.roll.talent.type');
    const variable = `<div class='dice-formula'> `+variablePrompt.replace('|#|', item.data.data.type)+`</div>`;
    // Send the divs to populate a HTML template and sends to chat.
    this.genericItemTemplate(item.data.img, item.data.name,
      item.data.data.description, variable)
      .then((html)=>this.sendToChat(speaker, html));
  }

  async genericItemTemplate(img, name, description, variable, tags) {
    // Checks if the following are empty/undefined. If so sets to blank.
    const descField = description ? description : '';
    const tagField = tags ? tags : '';
    const varField = variable ? variable : '';

    // Builds a generic HTML template that is used for all items.
    const html = `<div class='sta roll generic'>
                    <div class='dice-roll'>
                      <div class="dice-result">
                        <div class='dice-formula title'>
                          <img class='img' src=`+img+`></img>
                            <div>`+name+`</div>
                          </div>
                        `+varField+`
                        <div class="dice-tooltip">`+descField+`</div>
                          <div class='tags'> 
                            `+tagField+`
                          </div>
                        <div>
                      </div>
                    </div>`;

    // Returns it for the sendToChat to utilise.
    return html;
  }

  async sendToChat(speaker, content, roll, flavor) {
    // Send's Chat Message to foundry, if items are missing they will appear as false or undefined and this not be rendered.
    ChatMessage.create({
      user: game.user._id,
      speaker: ChatMessage.getSpeaker({actor: speaker}),
      flavor: flavor,
      content: content,
      roll: roll,
      sound: 'sounds/dice.wav'
    }).then((msg) => {
      return msg;
    });
  }
}
