import {
  STASharedActorFunctions
} from '../actors/actor.js'

export class STAItem extends Item {
  // Augment basic Item data model with additional dynamic data.
  prepareData () {
    super.prepareData();

    const itemData = this.data;
    const actorData = this.actor ? this.actor.data : {};
    const data = itemData.data;
  }
  
  /**
   * Handle clickable rolls.
   * @param {Event} event   The originating click event
   * @private
   */
  async roll () {}

  static chatListeners (html) {
    html.on('click', '.reroll-result.attribute', this._onChatAttributeRerollResult.bind(this))
    html.on('click', '.reroll-result.challenge', this._onChatChallengeRerollResult.bind(this))
  }

  static async _onChatAttributeRerollResult(event) {
    event.preventDefault();
    let staActor = new STASharedActorFunctions();

    var currentChildren = event.currentTarget.children;
    var speaker = game.actors.find(target => target._id === currentChildren.speakerId.value);

    staActor.rollAttributeTest(event, currentChildren.selectedAttribute.value, currentChildren.selectedAttributeValue.value, currentChildren.selectedDiscipline.value, currentChildren.selectedDisciplineValue.value, speaker);
  }

  static async _onChatChallengeRerollResult(event) {
    event.preventDefault();
    let staActor = new STASharedActorFunctions();

    var currentChildren = event.currentTarget.children;
    var speaker = game.actors.find(target => target._id === currentChildren.speakerId.value);

    staActor.rollChallengeRoll(event, speaker);
  }
}