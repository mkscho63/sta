export default class Combat2d20 extends Combat {
  get combatantsTurnDone() {
    return this.getFlag('sta', 'combatantsTurnDone') ?? [];
  }


  get combatantsTurnsDoneThisRound() {
    const combatantsTurnDone = this.combatantsTurnDone;
    return combatantsTurnDone[this.round] ?? {};
  }


  async endCombat() {
    const proceed = await foundry.applications.api.DialogV2.confirm({
      window: {
        title: game.i18n.localize('COMBAT.EndTitle'),
      },
      content: game.i18n.localize('COMBAT.EndConfirmation'),
      rejectClose: false,
      modal: true,
    });

    if (proceed) this.delete();
  }

  async nextRound() {
    this.turn = null;

    let advanceTime = Math.max(this.turns.length - this.turn, 0) * CONFIG.time.turnTime;
    advanceTime += CONFIG.time.roundTime;
    const nextRound = this.round + 1;

    // Update the document, passing data through a hook first
    const updateData = {round: nextRound, turn: this.turn};
    const updateOptions = {advanceTime, direction: 1};
    Hooks.callAll('combatRound', this, updateData, updateOptions);
    return this.update(updateData, updateOptions);
  }

  async rollInitiative() {
    return this;
  }

  async setTurn(newTurn) {
    this.turn = newTurn;

    // Update the document, passing data through a hook first
    const updateData = {round: this.round, turn: newTurn};
    const updateOptions = {advanceTime: CONFIG.time.turnTime, direction: 1};
    Hooks.callAll('combatTurn', this, updateData, updateOptions);
    return this.update(updateData, updateOptions);
  }

  setupTurns() {
    // Determine the turn order and the current turn
    const turns = this.combatants.contents;

    // Sort alphabetically by name first
    turns.sort((a, b) => {
      if (a.name < b.name) {
        return -1;
      }
      if (a.name > b.name) {
        return 1;
      }
      return 0;
    });

    // Now sort by type
    turns.sort((a, b) => {
      const actorA = game.actors.get(a.actorId);
      const actorB = game.actors.get(b.actorId);

      if (actorA.type < actorB.type) {
        return -1;
      }
      if (actorA.type > actorB.type) {
        return 1;
      }
      return 0;
    });

    if (this.turn !== null) {
      this.turn = Math.clamped(this.turn, 0, turns.length - 1);
    }

    // Update state tracking
    const c = turns[this.turn];
    this.current = {
      round: this.round,
      turn: this.turn,
      combatantId: c ? c.id : null,
      tokenId: c ? c.tokenId : null,
    };

    // One-time initialization of the previous state
    if (!this.previous) this.previous = this.current;

    // Return the array of prepared turns
    return this.turns = turns;
  }

  async startCombat() {
    const updateData = {
      round: 1,
      turn: 0,
    };

    Hooks.callAll('combatStart', this, updateData);

    return this.update(updateData);
  }

  async toggleTurnDone(combatantId) {
    if (!game.user.isGM) return;
    if (!this.started) return;

    const combatantsTurnsDoneThisRound = this.combatantsTurnsDoneThisRound;

    const turnDone = !(combatantsTurnsDoneThisRound[combatantId] ?? false);
    combatantsTurnsDoneThisRound[combatantId] = turnDone;

    const combatantsTurnDone = this.combatantsTurnDone;
    combatantsTurnDone[this.round] = combatantsTurnsDoneThisRound;

    this.setFlag('sta', 'combatantsTurnDone', combatantsTurnDone);
  }
}
