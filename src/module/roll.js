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
    const checkTarget = 
      parseInt(selectedAttributeValue) + parseInt(selectedDisciplineValue);
    const complicationMinimumValue = 20 - (complicationRange - 1);
    const doubledetermination = parseInt(selectedDisciplineValue) + parseInt(selectedDisciplineValue)
	
    // Foundry will soon make rolling async only, setting it up as such now avoids a warning. 
    const r = await new Roll( dicePool + 'd20' ).evaluate( {});
    
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

    // If using a Value and Determination, automatically add in an extra critical roll
    if (usingDetermination) {
      diceString += '<li class="roll die d20 max">' + 1 + '</li>';
      success += 2;
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
                  <td>` + game.i18n.format('sta.roll.target') + `: ` + checkTarget + ` </td>
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
          <input id="speakerId" type="hidden" value="` + speaker.id + `" >
        </div>
      </div>`;

    // Check if the dice3d module exists (Dice So Nice). If it does, post a roll in that and then send to chat after the roll has finished. If not just send to chat.
    if (game.dice3d) {
      game.dice3d.showForRoll(r, game.user, true).then((displayed) => {
        this.sendToChat(speaker, html, r, flavor, '');
      });
    } else {
      this.sendToChat(speaker, html, r, flavor, 'sounds/dice.wav');
    };
  }
  
  async performChallengeRoll(dicePool, challengeName, speaker) {
    // Foundry will soon make rolling async only, setting it up as such now avoids a warning. 
    const rolledChallenge = await new Roll( dicePool + 'd6' ).evaluate( {});

    const flavor = challengeName + ' ' + game.i18n.format('sta.roll.challenge.name');
    const successes = getSuccessesChallengeRoll( rolledChallenge );
    const effects = getEffectsFromChallengeRoll( rolledChallenge );
    const diceString = getDiceImageListFromChallengeRoll( rolledChallenge );
   
    // pluralize success string
    let successText = '';
    successText = successes + ' ' + i18nPluralize( successes, 'sta.roll.success' );
  
    // pluralize effect string
    let effectText = '';
    if (effects >= 1) {
      effectText = '<h4 class="dice-total effect"> ' + i18nPluralize( effects, 'sta.roll.effect' ) + '</h4>';
    }
    
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
            <input id="speakerId" type="hidden" value="` + speaker.id + `" >
          </div>
        </div>
      </div>`;
      
    // Check if the dice3d module exists (Dice So Nice). If it does, post a roll in that and then send to chat after the roll has finished. If not just send to chat.
    if (game.dice3d) {
      game.dice3d.showForRoll(rolledChallenge, game.user, true).then((displayed) => {
        this.sendToChat(speaker, html, rolledChallenge, flavor, '');
      });
    } else {
      this.sendToChat(speaker, html, rolledChallenge, flavor, 'sounds/dice.wav');
    };
  }

  async performItemRoll(item, speaker) {
    // Create variable div and populate it with localisation to use in the HTML.
    const variablePrompt = game.i18n.format('sta.roll.item.quantity');
    const variable = `<div class='dice-formula'> `+variablePrompt.replace('|#|', item.system.quantity)+`</div>`;
    
    // Send the divs to populate a HTML template and sends to chat.
    this.genericItemTemplate(item.img, item.name,
      item.system.description, variable, null)
      .then((html)=>this.sendToChat(speaker, html));
  }

  async performTalentRoll(item, speaker) {
    // Send the divs to populate a HTML template and sends to chat.
    console.log("Performing talent roll [actual]");
    this.genericItemTemplate(item.img, item.name,
      item.system.description, null)
      .then((html)=>this.sendToChat(speaker, html));
  }

  async performFocusRoll(item, speaker) {
    // Send the divs to populate a HTML template and sends to chat.
    this.genericItemTemplate(item.img, item.name,
      item.system.description, null)
      .then((html)=>this.sendToChat(speaker, html));
  }

  async performValueRoll(item, speaker) {
    // Send the divs to populate a HTML template and sends to chat.
    this.genericItemTemplate(item.img, item.name,
      item.system.description, null)
      .then((html)=>this.sendToChat(speaker, html));
  }

  async performInjuryRoll(item, speaker) {
    // Send the divs to populate a HTML template and sends to chat.
    this.genericItemTemplate(item.img, item.name,
      item.system.description, null)
      .then((html)=>this.sendToChat(speaker, html));
  }

  async performWeaponRoll(item, speaker) {
    let actorSecurity = 0;
    if ( speaker.system.disciplines ) {
      actorSecurity = parseInt( speaker.system.disciplines.security.value );
    } else if ( speaker.system.departments ) {
      actorSecurity = parseInt( speaker.system.departments.security.value );
    }
    let scaleDamage = 0;
    if ( item.system.includescale && speaker.system.scale ) scaleDamage = parseInt( speaker.system.scale );
    const calculatedDamage = item.system.damage + actorSecurity + scaleDamage;
    // Create variable div and populate it with localisation to use in the HTML.
    let variablePrompt = game.i18n.format('sta.roll.weapon.damagePlural');
    if ( calculatedDamage == 1 ) {
      variablePrompt = game.i18n.format('sta.roll.weapon.damage');
    }
    const variable = `<div class='dice-formula'> `+variablePrompt.replace('|#|', calculatedDamage)+`</div>`;

    // Create dynamic tags div and populate it with localisation to use in the HTML.
    let tags = '';
    
    if (item.system.qualities.melee) tags += '<div class=\'tag\'> '+game.i18n.format('sta.actor.belonging.weapon.melee')+'</div>';
    if (item.system.qualities.ranged) tags += '<div class=\'tag\'> '+game.i18n.format('sta.actor.belonging.weapon.ranged')+'</div>';
    if (item.system.qualities.area) tags += '<div class=\'tag\'> '+game.i18n.format('sta.actor.belonging.weapon.area')+'</div>';
    if (item.system.qualities.intense) tags += '<div class=\'tag\'> '+game.i18n.format('sta.actor.belonging.weapon.intense')+'</div>';
    if (item.system.qualities.knockdown) tags += '<div class=\'tag\'> '+game.i18n.format('sta.actor.belonging.weapon.knockdown')+'</div>';
    if (item.system.qualities.accurate) tags += '<div class=\'tag\'> '+game.i18n.format('sta.actor.belonging.weapon.accurate')+'</div>';
    if (item.system.qualities.charge) tags += '<div class=\'tag\'> '+game.i18n.format('sta.actor.belonging.weapon.charge')+'</div>';
    if (item.system.qualities.cumbersome) tags += '<div class=\'tag\'> '+game.i18n.format('sta.actor.belonging.weapon.cumbersome')+'</div>';
    if (item.system.qualities.deadly) tags += '<div class=\'tag\'> '+game.i18n.format('sta.actor.belonging.weapon.deadly')+'</div>';
    if (item.system.qualities.debilitating) tags += '<div class=\'tag\'> '+game.i18n.format('sta.actor.belonging.weapon.debilitating')+'</div>';
    if (item.system.qualities.grenade) tags += '<div class=\'tag\'> '+game.i18n.format('sta.actor.belonging.weapon.grenade')+'</div>';
    if (item.system.qualities.inaccurate) tags += '<div class=\'tag\'> '+game.i18n.format('sta.actor.belonging.weapon.inaccurate')+'</div>';
    if (item.system.qualities.nonlethal) tags += '<div class=\'tag\'> '+game.i18n.format('sta.actor.belonging.weapon.nonlethal')+'</div>';

    if (item.system.qualities.hiddenx > 0) tags += '<div class=\'tag\'> '+game.i18n.format('sta.actor.belonging.weapon.hiddenx') + ' ' + item.system.qualities.hiddenx +'</div>';
    if (item.system.qualities.piercingx > 0) tags += '<div class=\'tag\'> '+game.i18n.format('sta.actor.belonging.weapon.piercingx') + ' ' + item.system.qualities.piercingx +'</div>';
    if (item.system.qualities.viciousx > 0) tags += '<div class=\'tag\'> '+game.i18n.format('sta.actor.belonging.weapon.viciousx') + ' ' + item.system.qualities.viciousx +'</div>';

    const damageRoll = await new Roll( calculatedDamage + 'd6' ).evaluate( {});
    const successes = getSuccessesChallengeRoll( damageRoll );
    const effects = getEffectsFromChallengeRoll( damageRoll );
    const diceString = getDiceImageListFromChallengeRoll( damageRoll );
       
    // pluralize success string
    let successText = '';
    successText = successes + ' ' + i18nPluralize( successes, 'sta.roll.success' );
  
    // pluralize effect string
    let effectText = '';
    if (effects >= 1) {
      effectText = '<h4 class="dice-total effect"> ' + i18nPluralize( effects, 'sta.roll.effect' ) + '</h4>';
    }
    
    const rollHTML = `
      <div class="sta roll attribute">
          <div class="dice-roll">
            <div class="dice-result">
              <div class="dice-tooltip">
                <section class="tooltip-part">
                  <div class="dice">
                    <ol class="dice-rolls">` + diceString + `</ol>
                  </div>
                </section>
              </div>` +
                effectText + `<h4 class="dice-total">` + successText + `</h4>
              </div>
            </div>
            <div class="reroll-result challenge">
              <span>` + game.i18n.format('sta.roll.rerollresults') + `</span>
              <input id="speakerId" type="hidden" value="` + speaker.id + `" >
            </div>
          </div>
        </div>`;
    
    // Send the divs to populate a HTML template and sends to chat.
    // Check if the dice3d module exists (Dice So Nice). If it does, post a roll in that and then send to chat after the roll has finished. If not just send to chat.
    this.genericItemTemplate( 
      item.img, 
      item.name, 
      item.system.description, 
      variable, 
      tags, 
      item.id ).then( ( genericItemHTML ) => {
      const finalHTML = genericItemHTML + '</div>\n\n' + rollHTML;
      if (game.dice3d) {
        game.dice3d.showForRoll(damageRoll, game.user, true).then( ()=> {
          this.sendToChat( speaker, finalHTML, damageRoll, item.name, '');
        });
      } else {
        this.sendToChat( speaker, finalHTML, damageRoll, item.name, 'sounds/dice.wav');
      };
    });
    // if (game.dice3d) {
    //   game.dice3d.showForRoll(damageRoll).then((displayed) => {
    //     this.genericItemTemplate(item.img, item.name, item.system.description, variable, tags)
    //       .then((html)=>this.sendToChat(speaker, html, damageRoll, item.name, 'sounds/dice.wav'));
    //     });
    // } else {
    //   this.genericItemTemplate(item.img, item.name, item.system.description, variable, tags)
    //     .then((html)=>this.sendToChat(speaker, html, damageRoll, item.name, 'sounds/dice.wav'));
    // }
  }

  async performWeaponRoll2e(item, speaker) {
    // Create variable div and populate it with localisation to use in the HTML.
    const variablePrompt = game.i18n.format('sta.roll.weapon.damage2e');
    const variable = `<div class='dice-formula'> `+variablePrompt.replace('|#|', item.system.damage)+`</div>`;
	
	let weaponrange = game.i18n.format('sta.actor.belonging.weapon.melee');
	if (item.system.range == 'ranged') weaponrange = game.i18n.format('sta.actor.belonging.weapon.ranged');
	
	let tags = '';
    if (item.system.range) tags += '<div class=\'tag\'> ' + weaponrange + '</div>';
    if (item.system.hands > 0) tags += '<div class=\'tag\'> ' + item.system.hands + ' ' +game.i18n.format('sta.item.genericitem.handed') +'</div>';
    if (item.system.severity > 0) tags += '<div class=\'tag\'> '+game.i18n.format('sta.item.genericitem.severity') + ' ' + item.system.severity +'</div>';
    if (item.system.qualities.stun) tags += '<div class=\'tag\'> '+game.i18n.format('sta.actor.belonging.weapon.stun')+'</div>';    	
	if (item.system.qualities.deadly) tags += '<div class=\'tag\'> '+game.i18n.format('sta.actor.belonging.weapon.deadly')+'</div>';
    if (item.system.qualities.accurate) tags += '<div class=\'tag\'> '+game.i18n.format('sta.actor.belonging.weapon.accurate')+'</div>';
    if (item.system.qualities.area) tags += '<div class=\'tag\'> '+game.i18n.format('sta.actor.belonging.weapon.area')+'</div>';
    if (item.system.qualities.charge) tags += '<div class=\'tag\'> '+game.i18n.format('sta.actor.belonging.weapon.charge')+'</div>';
    if (item.system.qualities.cumbersome) tags += '<div class=\'tag\'> '+game.i18n.format('sta.actor.belonging.weapon.cumbersome')+'</div>';
    if (item.system.qualities.debilitating) tags += '<div class=\'tag\'> '+game.i18n.format('sta.actor.belonging.weapon.debilitating')+'</div>'
    if (item.system.qualities.grenade) tags += '<div class=\'tag\'> '+game.i18n.format('sta.actor.belonging.weapon.grenade')+'</div>';
    if (item.system.qualities.hiddenx > 0) tags += '<div class=\'tag\'> '+game.i18n.format('sta.actor.belonging.weapon.hiddenx') + ' ' + item.system.qualities.hiddenx +'</div>';	
    if (item.system.qualities.inaccurate) tags += '<div class=\'tag\'> '+game.i18n.format('sta.actor.belonging.weapon.inaccurate')+'</div>';	
    if (item.system.qualities.intense) tags += '<div class=\'tag\'> '+game.i18n.format('sta.actor.belonging.weapon.intense')+'</div>';
    if (item.system.qualities.piercingx) tags += '<div class=\'tag\'> '+game.i18n.format('sta.actor.belonging.weapon.piercingx')+'</div>';

    // Send the divs to populate a HTML template and sends to chat.
    this.genericItemTemplate(
	item.img, 
	item.name, 
	item.system.description, 
	variable, 
	tags, 
	)
      .then((html)=>this.sendToChat(speaker, html));
  }

  async performStarshipWeaponRoll2e(item, speaker) {
    // Create variable div and populate it with localisation to use in the HTML.
    const variablePrompt = game.i18n.format('sta.roll.weapon.damage2e');
    const variable = `<div class='dice-formula'> `+variablePrompt.replace('|#|', item.system.damage)+`</div>`;
	
	let weaponrange = game.i18n.format('sta.actor.belonging.weapon.close');
	if (item.system.range == 'medium') weaponrange = game.i18n.format('sta.actor.belonging.weapon.medium');
	if (item.system.range == 'long') weaponrange = game.i18n.format('sta.actor.belonging.weapon.long');
	
	let tags = '';
    if (item.system.range) tags += '<div class=\'tag\'> ' + weaponrange + '</div>';
    if (item.system.hands > 0) tags += '<div class=\'tag\'> ' + item.system.hands + ' ' +game.i18n.format('sta.item.genericitem.handed') +'</div>';
    if (item.system.qualities.energy) tags += '<div class=\'tag\'> '+game.i18n.format('sta.actor.belonging.weapon.energy')+'</div>';    	
	if (item.system.qualities.torpedo) tags += '<div class=\'tag\'> '+game.i18n.format('sta.actor.belonging.weapon.torpedo')+'</div>';
    if (item.system.qualities.highyield) tags += '<div class=\'tag\'> '+game.i18n.format('sta.actor.belonging.weapon.highyield')+'</div>';
    if (item.system.qualities.versatilex) tags += '<div class=\'tag\'> '+game.i18n.format('sta.actor.belonging.weapon.versatilex')+'</div>';

    // Send the divs to populate a HTML template and sends to chat.
    this.genericItemTemplate(
	item.img, 
	item.name, 
	item.system.description, 
	variable, 
	tags, 
	)
      .then((html)=>this.sendToChat(speaker, html));
  }

  async performArmorRoll(item, speaker) {
    // Create variable div and populate it with localisation to use in the HTML.
    const variablePrompt = game.i18n.format('sta.roll.armor.protect');
    const variable = `<div class='dice-formula'> `+variablePrompt.replace('|#|', item.system.protection)+`</div>`;
    
    // Send the divs to populate a HTML template and sends to chat.
    this.genericItemTemplate(item.img, item.name,
      item.system.description, variable, null)
      .then((html)=>this.sendToChat(speaker, html));
  }

  async genericItemTemplate(img, name, description, variable, tags, itemId) {
    // Checks if the following are empty/undefined. If so sets to blank.
    const descField = description ? description : '';
    const tagField = tags ? tags : '';
    const varField = variable ? variable : '';

    // Builds a generic HTML template that is used for all items.
    const html = `<div class='sta roll generic' data-item-id="`+itemId+`">
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

  async sendToChat(speaker, content, roll, flavor, sound) {
  let messageProps = {
    user: game.user.id,
    speaker: ChatMessage.getSpeaker({actor: speaker}),
    content: content,
    sound: sound
  };
  if (typeof roll != 'undefined')
    messageProps.roll = roll;
  if (typeof flavor != 'undefined')
    messageProps.flavor = flavor;
    // Send's Chat Message to foundry, if items are missing they will appear as false or undefined and this not be rendered.
    ChatMessage.create(messageProps).then((msg) => {
      return msg;
    });
  }
}

/*
  Returns the number of successes in a d6 challenge die roll
*/
function getSuccessesChallengeRoll( roll ) {
  let dice = roll.terms[0].results.map( ( die ) => die.result);
  dice = dice.map( ( die ) => {
    if ( die == 2 ) {
      return 2;
    } else if (die == 1 || die == 5 || die == 6) {
      return 1;
    }
    return 0;
  });
  return dice.reduce( ( a, b ) => a + b, 0);
}

/*
  Returns the number of effects in a  d6 challenge die roll
*/
function getEffectsFromChallengeRoll( roll ) {
  let dice = roll.terms[0].results.map( ( die ) => die.result);
  dice = dice.map( ( die ) => {
    if (die>=5) {
      return 1;
    }
    return 0;
  });
  return dice.reduce( ( a, b ) => a + b, 0);
}

/*
  Creates an HTML list of die face images from the results of a challenge roll
*/
function getDiceImageListFromChallengeRoll( roll ) {
  let diceString = '';
  const diceFaceTable = [
    '<li class="roll die d6"><img src="systems/sta/assets/icons/ChallengeDie_Success1_small.png" /></li>',
    '<li class="roll die d6"><img src="systems/sta/assets/icons/ChallengeDie_Success2_small.png" /></li>',
    '<li class="roll die d6"><img src="systems/sta/assets/icons/ChallengeDie_Success0_small.png" /></li>',
    '<li class="roll die d6"><img src="systems/sta/assets/icons/ChallengeDie_Success0_small.png" /></li>',
    '<li class="roll die d6"><img src="systems/sta/assets/icons/ChallengeDie_Effect_small.png" /></li>',
    '<li class="roll die d6"><img src="systems/sta/assets/icons/ChallengeDie_Effect_small.png" /></li>'
  ];
  diceString = roll.terms[0].results.map( ( die ) => die.result).map( ( result ) => diceFaceTable[result - 1]).join( ' ' );   
  return diceString;
}

/*
  grabs the nationalized local reference, switching to the plural form if count > 1, also, replaces |#| with count, then returns the resulting string. 
*/
function i18nPluralize( count, localizationReference ) {
  if ( count > 1 ) {
    return game.i18n.format( localizationReference + 'Plural' ).replace('|#|', count);
  }
  return game.i18n.format( localizationReference ).replace('|#|', count);
} 
