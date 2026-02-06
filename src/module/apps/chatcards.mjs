const api = foundry.applications.api;

export class RerollHandler {
static attachListeners(html) {
  html.addEventListener('click', async (event) => {
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

    const rollData = message.flags.sta ?? {};
    
    // Extract speaker name and dice outcome from the original message
    const speakerName = rollData.speakerName;
    
    
    // Log the extracted data
    console.log('Reroll Handler - Speaker Name:', speakerName);

  }
}

export class Collapsible {
  static attachHeaderListener(html) {
    const collapsibles = html.querySelectorAll('.sta.chat.card .collapsible');
    collapsibles.forEach((collapsible) =>
      collapsible.addEventListener('click', this._onCollapsibleHeaderClick.bind(this))
    );
  }

  static _onCollapsibleHeaderClick(event) {
    event.preventDefault();
    event.currentTarget.classList.toggle('collapsed');
  }
}