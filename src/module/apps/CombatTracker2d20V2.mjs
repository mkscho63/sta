export default class CombatTracker2d20V2 extends foundry.applications.sidebar.tabs.CombatTracker {
  static DEFAULT_OPTIONS = {
    actions: {
      toggleCombatantTurnDone: CombatTracker2d20V2._onCombatantControl,
      incAction: CombatTracker2d20V2._onCombatantPlus,
    },
  };

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


    const combat = this.viewed;
    if (!combat?.started) {
      ui.notifications.warn(game.i18n.localize('sta.combat.combatnotstarted'));
      return;
    }

    const {combatantId} = target?.closest('[data-combatant-id]')?.dataset ?? {};
    if (!combatantId) return;

    const combatant = combat.combatants.get(combatantId);
    if (!combatant) return;

    const max = combat.actionsPerRoundFor?.(combatant) ?? 1;

    let before = combat.actionsRemainingThisRound?.[combatantId];
    if (before == null) {
      await combat.setActionsRemaining?.(combatantId, max);
      before = max;
    }

    if (before > 0) {
      await combat.adjustActionsRemaining?.(combatantId, -1);
      const after =
        combat.actionsRemainingThisRound?.[combatantId] ?? Math.max(0, before - 1);

      if (after === 0) {
        await combat.toggleTurnDone(combatant.id);
      }
    } else {
      await combat.toggleTurnDone(combatant.id);
    }
    ui.combat?.render(true);
  }

  static async _onCombatantPlus(event, target) {
    event?.preventDefault?.();
    event?.stopPropagation?.();

    if (!game.user.isGM) return;

    const combat = this.viewed;
    if (!combat?.started) {
      ui.notifications?.warn?.(game.i18n.localize('sta.combat.combatnotstarted'));
      return;
    }

    const {combatantId} = target?.closest('[data-combatant-id]')?.dataset ?? {};
    if (!combatantId) return;
    const combatant = combat.combatants.get(combatantId);
    if (!combatant) return;

    const max = combat.actionsPerRoundFor?.(combatant) ?? 1;
    if (combat.actionsRemainingThisRound?.[combatantId] == null) {
      await combat.setActionsRemaining?.(combatantId, max);
    }

    const after = await combat.adjustActionsRemaining?.(combatantId, +1);

    const wasDone = combat.getTurnDone?.(combatantId) ?? (combatant.getFlag('sta', 'turnDone') ?? false);
    if (after > 0 && wasDone) {
      await combat.toggleTurnDone?.(combatant.id, false);
    }
    ui.combat?.render(true);
  }

  static _dispositionInfo(combatant) {
    const disp = combatant?.token?.disposition ?? 0;

    const map = {
      [-1]: {name: 'hostile', key: 'HOSTILE'},
      [0]: {name: 'neutral', key: 'NEUTRAL'},
      [1]: {name: 'friendly', key: 'FRIENDLY'},
      [2]: {name: 'friendly', key: 'FRIENDLY'},
    };
    const info = map[disp] ?? map[0];

    const colors = (CONFIG.Canvas && CONFIG.Canvas.dispositionColors) || {};
    const hexNum = colors[info.key];
    const color = Number.isFinite(hexNum) ? `#${hexNum.toString(16).padStart(6, '0')}` : null;

    return {value: disp, name: info.name, color};
  }

  async _prepareTrackerContext(context, options) {
    await super._prepareTrackerContext(context, options);
    const combat = this.viewed;
    if (!combat) return;

    const rem = combat.actionsRemainingThisRound;
    for (const turn of context.turns) {
      const c = combat.combatants.get(turn.id);
      const max = combat.actionsPerRoundFor(c);
      turn.actionsPerRound = max;
      turn.actionsRemaining = rem[turn.id] ?? max;

      const disp = this.constructor._dispositionInfo(c);
      turn.disposition = disp;
      turn.css = `${turn.css ?? ''} dispo-${disp.name}`.trim();

      const flagDone = c.getFlag('sta', 'turnDone') ?? false;
      turn.turnDone = (turn.actionsRemaining <= 0) || flagDone;
    }
  }
}
