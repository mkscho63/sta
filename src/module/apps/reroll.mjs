const api = foundry.applications.api;

export class RerollHandler {
  static attachListeners(html) {
    const element = html instanceof jQuery ? html[0] : html;
    element.addEventListener('click', async (event) => {
      if (!event.target.matches('.reroll-button')) return;
      event.preventDefault();
      
      const chatMessageEl = event.target.closest('.chat-message');
      const messageId = chatMessageEl?.dataset.messageId;

      if (!messageId) {
        ui.notifications.warn('Could not find the chat-message ID for reroll.');
        return;
      }

      await RerollHandler.handleReroll(messageId);
    });
  }

  static async handleReroll(messageId) {
    const message = game.messages.get(messageId);

    if (!message) {
      ui.notifications.warn(`No chat message found with ID ${messageId}`);
      return;
    }

    const chatData = message.flags.sta?.chatData ?? {};
    let isChallengeRoll = false;

    if (chatData.rollType === 'challenge' || chatData.rollType === 'weapon') {
      isChallengeRoll = true;
    }
    
    const dialog = new api.DialogV2({
      window: {
        title: game.i18n.localize('sta.roll.rerollresults')
      },
      position: {
        height: 'auto',
        width: 350
      },
      content: isChallengeRoll ? RerollHandler.challengeRerollDialog(chatData) : RerollHandler.taskRerollDialog(chatData),
      buttons: [
        {
          action: 'reroll',
          label: game.i18n.localize('sta.roll.rerollresults'),
          callback: async (event, button, dialog) => {}
        },
        {
          action: 'cancel',
          label: 'Cancel',
          callback: () => {}
        }
      ],
      submit: async (result) => {
        if (result === 'reroll') {
          const checkedDice = Array.from(dialog.element.querySelectorAll('input[name="reroll-die"]'))
            .filter((checkbox) => checkbox.checked)
            .map((checkbox) => ({
              index: parseInt(checkbox.value),
              value: parseInt(checkbox.dataset.dieValue),
              type: checkbox.dataset.dieType
            }));

          const keptDice = Array.from(dialog.element.querySelectorAll('input[name="reroll-die"]'))
            .filter((checkbox) => !checkbox.checked)
            .map((checkbox) => parseInt(checkbox.dataset.dieValue));

          if (checkedDice.length === 0) {
            ui.notifications.warn('Please select at least one die to reroll');
            return;
          }

          if (checkedDice[0].type === 'task') {
            await RerollHandler.performTaskReroll(messageId, chatData, checkedDice, keptDice);
          } else if (checkedDice[0].type === 'challenge') {
            await RerollHandler.performChallengeReroll(messageId, chatData, checkedDice, keptDice);
          }
        }
      }
    });

    await dialog.render(true);
  }

  static taskRerollDialog(chatData) {
    return `
      <div class="dialogue">
        ${game.i18n.localize(`sta.roll.rerollwhichresults`)}
        ${RerollHandler.createCheckableTaskDice(chatData.diceHtml, chatData)}
      </div>
    `;
  }

  static challengeRerollDialog(chatData) {
    return `
      <div class="dialogue">
        ${game.i18n.localize(`sta.roll.rerollwhichresults`)}
        ${RerollHandler.createCheckableChallengeDice(chatData.diceHtml, chatData)}
      </div>
    `;
  }

  static createCheckableTaskDice(diceHtml, chatData) {
    if (!diceHtml) return '<p>No dice data available</p>';

    const usingFocus = chatData.withFocus || false;
    const usingDedicatedFocus = chatData.withDedicatedFocus || false;
    const selectedAttributeValue = chatData.selectedAttributeValue;
    const selectedDisciplineValue = chatData.selectedDisciplineValue;
    const complicationMinimumValue = chatData.complicationMinimumValue;
    const checkTarget = parseInt(selectedAttributeValue) + parseInt(selectedDisciplineValue);
    const doubledetermination = parseInt(selectedDisciplineValue) + parseInt(selectedDisciplineValue);

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = diceHtml;
    const diceElements = tempDiv.querySelectorAll('li.die');

    if (diceElements.length === 0) {
      return '<p>No dice to reroll</p>';
    }

    let checkableDiceHtml = '<div class="dice-rolls">';

    diceElements.forEach((die, index) => {
      const dieValue = parseInt(die.textContent.trim());
      let diceString = '';

      if ((usingFocus && dieValue <= selectedDisciplineValue) || dieValue == 1) {
        diceString = `<li class="roll die d20 max">${dieValue}</li>`;
      } else if ((usingDedicatedFocus && dieValue <= doubledetermination) || dieValue == 1) {
        diceString = `<li class="roll die d20 max">${dieValue}</li>`;
      } else if (dieValue <= checkTarget) {
        diceString = `<li class="roll die d20">${dieValue}</li>`;
      } else if (dieValue >= complicationMinimumValue) {
        diceString = `<li class="roll die d20 min">${dieValue}</li>`;
      } else {
        diceString = `<li class="roll die d20">${dieValue}</li>`;
      }

      checkableDiceHtml += `
        <input type="checkbox" name="reroll-die" value="${index}" data-die-value="${dieValue}" data-die-type="task">
        ${diceString}
      `;
    });

    checkableDiceHtml += '</div>';

    return checkableDiceHtml;
  }

  static createCheckableChallengeDice(diceHtml, chatData) {
    if (!diceHtml) return '<p>No dice data available</p>';

    const parser = new DOMParser();
    const doc = parser.parseFromString(diceHtml, 'text/html');
    const dieElements = doc.querySelectorAll('li.roll.die.d6');
    const results = [];

    dieElements.forEach((die) => {
      const img = die.querySelector('img');
      if (!img) return;

      const src = img.getAttribute('src');
      const match = src.match(/ChallengeDie_(Success|Effect)(\d*)/);

      if (match) {
        const type = match[1];
        const value = match[2];

        if (type === 'Effect') {
          results.push('3');
        } else if (type === 'Success') {
          results.push(parseInt(value, 10));
        }
      }
    });

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = diceHtml;
    const diceElements = tempDiv.querySelectorAll('li.roll.die.d6');

    if (diceElements.length === 0) return '<p>No dice to reroll</p>';

    let checkableDiceHtml = '<div class="dice-rolls">';

    diceElements.forEach((die, index) => {
      const dieValue = results[index];
      checkableDiceHtml += `
        <input type="checkbox" name="reroll-die" value="${index}" data-die-value="${dieValue}" data-die-type="challenge"> ${die.outerHTML}
      `;
    });

    checkableDiceHtml += '</div>';
    return checkableDiceHtml;
  }

  static async performTaskReroll(messageId, chatData, checkedDice, keptDice) {
    const dicePool = checkedDice.length;
    const usingFocus = chatData.withFocus || false;
    const usingDedicatedFocus = chatData.withDedicatedFocus || false;
    const usingDetermination = false;
    const selectedAttribute = chatData.selectedAttribute;
    const selectedAttributeValue = chatData.selectedAttributeValue;
    const selectedDiscipline = chatData.selectedDiscipline;
    const selectedDisciplineValue = chatData.selectedDisciplineValue;
    const complicationMinimumValue = chatData.complicationMinimumValue;
    const complicationRange = 21 - chatData.complicationMinimumValue;
    const checkTarget = parseInt(selectedAttributeValue) + parseInt(selectedDisciplineValue);
    const doubledetermination = parseInt(selectedDisciplineValue) + parseInt(selectedDisciplineValue);

    let keptDiceString = '';
    let keptSuccess = 0;
    let keptComplication = 0;

    keptDice.forEach((dieValue) => {
      let dieClass = 'roll die d20';

      if ((usingFocus && dieValue <= selectedDisciplineValue) || dieValue == 1) {
        dieClass += ' max';
        keptSuccess += 2;
      } else if ((usingDedicatedFocus && dieValue <= doubledetermination) || dieValue == 1) {
        dieClass += ' max';
        keptSuccess += 2;
      } else if (dieValue <= checkTarget) {
        dieClass += '';
        keptSuccess += 1;
      } else if (dieValue >= complicationMinimumValue) {
        dieClass += ' min';
        keptComplication += 1;
      } else {
        dieClass += '';
      }

      keptDiceString += `<li class="${dieClass}">${dieValue}</li>`;
    });

    const speaker = {
      type: 'reroll',
      id: messageId,
      previousRoll: keptDiceString,
      previousSuccess: keptSuccess,
      previousComplication: keptComplication
    };

    const staroll = new STARoll();
    await staroll.performAttributeTest(dicePool, usingFocus, usingDedicatedFocus, usingDetermination,
      selectedAttribute, selectedAttributeValue, selectedDiscipline,
      selectedDisciplineValue, complicationRange, speaker);
  }

  static async performChallengeReroll(messageId, chatData, checkedDice, keptDice) {
    const dicePool = checkedDice.length;
    const challengeName = game.i18n.format('sta.roll.rerollresults') + ' ' + messageId;

    let keptSuccess = 0;
    let keptEffects = 0;
    let previousRoll = '';

    keptDice.forEach((dieValue) => {
      switch (dieValue) {
      case 0:
        previousRoll += '<li class="roll die d6"><img src="systems/sta/assets/icons/ChallengeDie_Success0_small.png" /></li>';
        break;
      case 1:
        keptSuccess += 1;
        previousRoll += '<li class="roll die d6"><img src="systems/sta/assets/icons/ChallengeDie_Success1_small.png" /></li>';
        break;
      case 2:
        keptSuccess += 2;
        previousRoll += '<li class="roll die d6"><img src="systems/sta/assets/icons/ChallengeDie_Success2_small.png" /></li>';
        break;
      case 3:
        keptSuccess += 1;
        keptEffects += 1;
        previousRoll += '<li class="roll die d6"><img src="systems/sta/assets/icons/ChallengeDie_Effect_small.png" /></li>';
        break;
      default:
        break;
      }
    });

    const speaker = {
      type: 'reroll',
      id: messageId,
      previousRoll,
      previousSuccess: keptSuccess,
      previousEffect: keptEffects
    };

    const staroll = new STARoll();
    await staroll.performChallengeRoll(dicePool, challengeName, speaker);
  }
}
