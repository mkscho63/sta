export default class CombatTracker2d20V2
  extends foundry.applications.sidebar.tabs.CombatTracker {
  /** @inheritDoc */
  static DEFAULT_OPTIONS = {
    actions: {
      toggleCombatantTurnDone: CombatTracker2d20V2._onCombatantControl,
    },
  };


  /** @override */
  static PARTS = {
    header: {
      // We're still using the default Foundry template for this part
      template: 'templates/sidebar/tabs/combat/header.hbs',
    },
    tracker: {
      template: 'systems/sta/templates/apps/combat-tracker.hbs',
    },
    footer: {
      // We're still using the default Foundry template for this part
      template: 'templates/sidebar/tabs/combat/footer.hbs',
    },
  };


  _onCombatantMouseDown(event, target) {
    super._onCombatantMouseDown(event, target);

    const isInputElement = (event.target instanceof HTMLInputElement);
    const isButtonElement = (event.target instanceof HTMLButtonElement);

    if (isInputElement || isButtonElement) return;

    if (game.user.isGM && this.viewed.started) {
      const {combatantId} = target?.dataset ?? {};

      const combat = this.viewed;

      const currentTurn = combat.turn ?? -1;

      let newTurn = currentTurn;

      for (const [i, turn] of combat.turns.entries() ) {
        if (turn.isDefeated) continue;
        if (turn.id === combatantId) {
          newTurn = i;
          break;
        }
      }

      if (newTurn !== currentTurn) {
        combat.setTurn(newTurn);
      }
    }
  }


  static async _onCombatantControl(event, target) {
    event.preventDefault();
    event.stopPropagation();

    if (!game.user.isGM) return;

    if (!this.viewed.started) {
      ui.notifications.warn(
        game.i18n.localize('sta.combat.combatnotstarted')
      );
      return;
    }

    const {combatantId} = target.closest('[data-combatant-id]')?.dataset ?? {};
    const combatant = this.viewed?.combatants.get(combatantId);

    if (!combatant) return;

    if (combatant.isOwner) {
      this.viewed.toggleTurnDone(combatant.id);
    }
  }


  /**
   * Prepare render context for the tracker part.
   * @param {ApplicationRenderContext} context
   * @param {HandlebarsRenderOptions} options
   * @returns {Promise<void>}
   * @protected
   */
  async _prepareTrackerContext(context, options) {
    await super._prepareTrackerContext(context, options);

    const combat = this.viewed;
    if ( !combat ) return;

    const combatantsTurnDone = combat.combatantsTurnsDoneThisRound;
    for (const turn of context.turns) {
      turn.turnDone = combatantsTurnDone[turn.id] ?? false;
    }
  }
}
