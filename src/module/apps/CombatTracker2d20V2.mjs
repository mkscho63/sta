const DEPARTMENT_KEYS = ['command', 'conn', 'security', 'engineering', 'science', 'medicine'];

export default class CombatTracker2d20V2 extends foundry.applications.sidebar.tabs.CombatTracker {
  expandedDepartments = new Set();

  static DEFAULT_OPTIONS = {
    actions: {
      toggleCombatantTurnDone: CombatTracker2d20V2._onCombatantControl,
      incAction: CombatTracker2d20V2._onCombatantPlus,
      toggleDepartments: CombatTracker2d20V2._onToggleDepartments,
      toggleDepartmentUsed: CombatTracker2d20V2._onToggleDepartmentUsed,
    },
  };

  static _getDepartments() {
    return DEPARTMENT_KEYS.map((key) => ({
      key,
      label: game.i18n.localize(`sta.actor.starship.department.${key}`),
    }));
  }

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

  static _onToggleDepartments(event, target) {
    event.preventDefault();
    event.stopPropagation();

    const li = target.closest('li.combatant');
    const list = li?.querySelector('.department-list'); 
    if (!list) return;

    const {combatantId} = li.dataset;
    const isCollapsed = list.classList.toggle('collapsed');
    target.classList.toggle('expanded', !isCollapsed);
    target.setAttribute('aria-expanded', String(!isCollapsed));

    if (isCollapsed) {
      this.expandedDepartments.delete(combatantId);
    } else {
      this.expandedDepartments.add(combatantId);
    }
  }


  static async _onToggleDepartmentUsed(event, target) {
    event.preventDefault();
    event.stopPropagation();

    if (!game.user.isGM) return;

    const {combatantId} = target?.closest('[data-combatant-id]')?.dataset ?? {};
    if (!combatantId) return;

    const combat = this.viewed;
    const combatant = combat?.combatants.get(combatantId);
    if (!combatant) return;

    const dept = target.dataset.department;
    if (!dept) return;

    const current = combatant.getFlag('sta', 'departmentsUsed') ?? {};
    const next = {...current, [dept]: target.checked};
    await combatant.setFlag('sta', 'departmentsUsed', next);
  }

  _onRender(context, options) {
    super._onRender?.(context, options);
    this._syncDepartmentCheckboxes();
  }

  _syncDepartmentCheckboxes() {
    const combat = this.viewed;
    if (!combat) return;

    const rows = this.element?.querySelectorAll?.('li.combatant[data-combatant-id]') ?? [];
    for (const li of rows) {
      const combatant = combat.combatants.get(li.dataset.combatantId);
      if (!combatant) continue;

      const used = combatant.getFlag('sta', 'departmentsUsed') ?? {};
      for (const checkbox of li.querySelectorAll('.department-checkbox')) {
        const dept = checkbox.dataset.department;
        checkbox.checked = !!used[dept];
      }
    }
  }

  async _prepareTrackerContext(context, options) {
    await super._prepareTrackerContext(context, options);
    const combat = this.viewed;
    if (!combat) return;

    const resourceToNumber = (res) => {
      if (res == null) return Number.NEGATIVE_INFINITY;
      if (typeof res === 'number' && Number.isFinite(res)) return res;
      const s = String(res).replace(/<[^>]*>/g, '');
      const m = s.match(/-?\d+(?:\.\d+)?/);
      return m ? Number(m[0]) : Number.NEGATIVE_INFINITY;
    };

    const dispositionInfo = (combatant) => {
      const disp = combatant?.token?.disposition ?? 0;
      const keyByVal = {[-1]: 'HOSTILE', 0: 'NEUTRAL', 1: 'FRIENDLY', 2: 'FRIENDLY'};
      const nameByVal = {[-1]: 'hostile', 0: 'neutral', 1: 'friendly', 2: 'friendly'};
      const key = keyByVal[disp] ?? 'NEUTRAL';
      const name = nameByVal[disp] ?? 'neutral';
      const palette = (CONFIG?.Canvas?.dispositionColors) || {};
      let color = palette[key];
      if (typeof color === 'number') color = `#${color.toString(16).padStart(6, '0')}`;
      if (typeof color !== 'string') color = null;
      return {value: disp, name, color};
    };

    const rem = combat.actionsRemainingThisRound;

    for (const turn of context.turns) {
      const c = combat.combatants.get(turn.id);
      if (!c) continue;

      const max = combat.actionsPerRoundFor(c);
      turn.actionsPerRound = max;
      turn.actionsRemaining = rem[turn.id] ?? max;

      const disp = dispositionInfo(c);
      turn.disposition = disp;
      turn.css = `${turn.css ?? ''} dispo-${disp.name}`.trim();

      const flagDone = c.getFlag('sta', 'turnDone') ?? false;
      turn.turnDone = (turn.actionsRemaining <= 0) || flagDone;

      const basis = (turn.resource != null && turn.resource !== '') ? turn.resource : turn.actionsRemaining;
      turn._resourceSort = resourceToNumber(basis);

      const used = c.getFlag('sta', 'departmentsUsed') ?? {};
      turn.departments = CombatTracker2d20V2._getDepartments().map((d) => ({...d, used: !!used[d.key]}));
      turn.departmentsExpanded = this.expandedDepartments.has(c.id);
    }

    context.turns.sort((a, b) => {
      const d = (b._resourceSort ?? -Infinity) - (a._resourceSort ?? -Infinity);
      if (d) return d;
      return String(a.name ?? '').localeCompare(String(b.name ?? ''));
    });
  }
}
