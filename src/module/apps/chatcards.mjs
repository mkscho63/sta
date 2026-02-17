const api = foundry.applications.api;

export class Collapsible {
  static attachHeaderListener(html) {
    html.addEventListener('click', (event) => {
      const header = event.target.closest('.collapsible');
      if (!header) return;

      event.preventDefault();

      const otherHeader = header.nextElementSibling?.classList.contains('collapsible')
        ? header.nextElementSibling
        : header.previousElementSibling;

      const content = header.parentElement.querySelector('.collapsible-content');

      header.classList.toggle('hidden');
      otherHeader.classList.toggle('hidden');

      if (content) content.classList.toggle('hidden');
    });
  }
}

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
    const staRoll = new STARoll();
    await staRoll.handleReroll(messageId);
  });
}
}