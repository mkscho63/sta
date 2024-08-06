import {
  STASharedActorFunctions
} from '../actors/actor.js';

export class STAItem extends Item {
  // Augment basic Item data model with additional dynamic data.
  prepareData() {
    const itemData = this;
    const actorData = this.actor ? this.actor : {};
    const data = itemData;
    
    if (!this.img) this.img = game.sta.defaultImage;

    super.prepareData();
  }
  
  /**
   * Handle clickable rolls.
   * @param {Event} event   The originating click event
   * @private
   */
  async roll() {}

  static chatListeners(html) {
    html.on('click', '.reroll-result.attribute', this._onChatAttributeRerollResult.bind(this));
    html.on('click', '.reroll-result.challenge', this._onChatChallengeRerollResult.bind(this));
  }

  static async _onChatAttributeRerollResult(event) {
    event.preventDefault();
    const staActor = new STASharedActorFunctions();

    const card = event.currentTarget.closest('.chat.card');
    const speaker = await this._getChatCardSpeaker(card);

    const children = event.currentTarget.children;
    staActor.rollAttributeTest(event, children.selectedAttribute.value,
      children.selectedAttributeValue.value, children.selectedDiscipline.value,
      children.selectedDisciplineValue.value, null, speaker);
  }

  static async _onChatChallengeRerollResult(event) {
    event.preventDefault();
    const staActor = new STASharedActorFunctions();

    const card = event.currentTarget.closest('.chat.card');
    const messageId = card.closest('.message').dataset.messageId;
    const message = game.messages.get(messageId);
    const storedData = message.getFlag('sta', 'itemData');

    const speaker = await this._getChatCardSpeaker(card);

    // Restrict rerolls to users with permission.
    if (!(game.user.isGM || speaker.isOwner)) return;

    const item = storedData ? new Item(storedData, {parent: speaker}) : speaker.items.get(card.dataset.itemId);
    if (!item) {
      // If we coudlnt' figure out the item, this is probably a reroll, in practice.
      await staActor.rollChallengeRoll(event, 'Reroll', null, speaker);
      return;
    }

    const flavorText = game.i18n.format(`sta.roll.challenge.weaponreroll`, {name: item.name});
    await staActor.rollChallengeRoll(event, flavorText, null, speaker);
  }

  /**
   * Get the author of a chat card.
   *
   * Cribbed from the DND5E system.
   *
   * @param {HTMLElement} card
   * @return {Actor|null}
   * @private
   */
  static async _getChatCardSpeaker(card) {
    // Could be a token, a "synthetic" actor
    if (card.dataset.tokenId) {
      const token = await fromUuid(card.dataset.tokenId);
      if (!token) return null;
      return token.actor;
    }

    // Could be an actual World actor.
    const speakerId = card.dataset.speakerId;
    return game.actors.get(speakerId) || null;
  }
}
