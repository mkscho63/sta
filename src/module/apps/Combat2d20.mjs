function clamp(value, min, max) {
  let v = Number(value);
  if (!Number.isFinite(v)) v = 0;
  const lo = Number.isFinite(min) ? Number(min) : -Infinity;
  const hi = Number.isFinite(max) ? Number(max) : +Infinity;
  return Math.min(hi, Math.max(lo, v));
}

function getActorScale(actor) {
  const s = actor?.system ?? {};
  const candidates = [
    s.scale,
    s?.ship?.scale,
    s?.attributes?.scale,
    s?.attributes?.scale?.value,
  ];
  for (const v of candidates) {
    const n = typeof v === 'object' ? Number(v?.value ?? v?.current ?? v?.max) : Number(v);
    if (Number.isFinite(n) && n > 0) return n;
  }
  return 1;
}

function getSettingInt(namespace, key, fallback) {
  const raw = Number(game.settings.get(namespace, key));
  return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : fallback;
}

export default class Combat2d20 extends Combat {
  get actionsRemainingFlag() {
    return this.getFlag('sta', 'actionsRemaining') ?? [];
  }

  get actionsRemainingThisRound() {
    const all = this.actionsRemainingFlag;
    return foundry.utils.duplicate(all[this.round] ?? {});
  }

  actionsPerRoundFor(combatant) {
    const c = combatant instanceof Combatant ? combatant : this.combatants.get(combatant);
    if (!c) return 1;
    const a = c.actor;
    const type = a?.type ?? a?.system?.type;

    const override =
      c.getFlag('sta', 'actionsPerRoundOverride') ??
      a?.getFlag('sta', 'actionsPerRoundOverride');
    if (override != null && Number.isFinite(Number(override))) {
      return this._clampAPRByType(Number(override), type);
    }

    let baseAPR = 1;
    if (type === 'character') {
      baseAPR = getSettingInt('sta', 'characterActionsPerRound', 1);
    } else if (type === 'smallcraft' || type === 'starship') {
      baseAPR = getActorScale(a);
    } else {
      const legacy =
        c.getFlag('sta', 'actionsPerRound') ??
        a?.getFlag('sta', 'actionsPerRound');
      if (legacy != null && Number.isFinite(Number(legacy)) && Number(legacy) > 0) {
        baseAPR = Number(legacy);
      }
    }
    return this._clampAPRByType(baseAPR, type);
  }

  _clampAPRByType(value, type) {
    const v = Number(value) || 1;

    if (type === 'smallcraft' || type === 'starship') {
      return clamp(v, 1, Number.POSITIVE_INFINITY);
    }

    const maxChar = getSettingInt('sta', 'characterActionsPerRound', Number.POSITIVE_INFINITY);
    return clamp(v, 1, maxChar);
  }

  async _resetActionsForRound() {
    if (!this.started) return;
    const map = this.actionsRemainingThisRound;
    const clears = [];

    for (const c of this.combatants) {
      const id = c.id;
      if (map[id] == null) map[id] = this.actionsPerRoundFor(c);
      clears.push(c.setFlag('sta', 'turnDone', false).catch(() => {}));
    }

    const all = this.actionsRemainingFlag;
    all[this.round] = map;
    await this.setFlag('sta', 'actionsRemaining', all);
    await Promise.all(clears);
  }

  async startCombat() {
    const r = await super.startCombat();
    await this._resetActionsForRound();
    return r;
  }

  async nextRound() {
    const r = await super.nextRound();
    await this._resetActionsForRound();
    return r;
  }

  async previousRound() {
    const r = await super.previousRound();
    await this._resetActionsForRound();
    return r;
  }

  async endCombat() {
    try {
      const has = this.getFlag('sta', 'actionsRemaining');
      if (has != null) await this.unsetFlag('sta', 'actionsRemaining');
    } catch (e) {
      console.debug('STA 2d20: endCombat pre-clean failed (safe to ignore)', e);
    }

    return await super.endCombat();
  }

  async adjustActionsRemaining(combatantId, delta) {
    if (!this.started) return;
    const c = this.combatants.get(combatantId);
    if (!c) return;

    const max = this.actionsPerRoundFor(c);
    const map = this.actionsRemainingThisRound;
    const next = clamp((map[combatantId] ?? max) + Number(delta || 0), 0, max);
    map[combatantId] = next;

    const all = this.actionsRemainingFlag;
    all[this.round] = map;
    await this.setFlag('sta', 'actionsRemaining', all);
    return next;
  }

  async setActionsRemaining(combatantId, value) {
    if (!this.started) return;
    const c = this.combatants.get(combatantId);
    if (!c) return;

    const max = this.actionsPerRoundFor(c);
    const map = this.actionsRemainingThisRound;
    const next = clamp(Number(value), 0, max);
    map[combatantId] = next;

    const all = this.actionsRemainingFlag;
    all[this.round] = map;
    await this.setFlag('sta', 'actionsRemaining', all);
    return next;
  }

  getTurnDone(combatantId) {
    const c = this.combatants.get(combatantId);
    return c?.getFlag('sta', 'turnDone') ?? false;
  }

  async toggleTurnDone(combatantId, state) {
    const c = this.combatants.get(combatantId);
    if (!c) return false;
    const current = this.getTurnDone(combatantId);
    const next = (typeof state === 'boolean') ? state : !current;
    await c.setFlag('sta', 'turnDone', next);
    return next;
  }

  async setTurn(newTurn) {
    this.turn = newTurn;

    // Update the document, passing data through a hook first
    const updateData = {round: this.round, turn: newTurn};
    const updateOptions = {advanceTime: CONFIG.time.turnTime, direction: 1};
    Hooks.callAll('combatTurn', this, updateData, updateOptions);
    return this.update(updateData, updateOptions);
  }

  // custom initiative from here
  async createEmbeddedDocuments(embeddedName, data, options = {}) {
    const docs = await super.createEmbeddedDocuments(embeddedName, data, options);
    if (embeddedName === 'Combatant') {
      for (const c of docs) {
        await this._applyCustomInitiative(c);
      }
    }
    return docs;
  }

  async _applyCustomInitiative(combatant) {
    const rawFormula = game.settings.get('sta', 'useCustomInitiative');
    if (!rawFormula || typeof rawFormula !== 'string' || !rawFormula.trim()) return;
    const actor = combatant.actor;
    if (!actor) return;
    const data = actor.getRollData();
    const resolvedFormula = this._resolveItemBonuses(rawFormula, actor);
    let result = null;
    try {
      const roll = new Roll(resolvedFormula, data);
      roll.evaluateSync();
      result = roll.total;
    } catch (err) {
      console.warn('STA custom initiative formula failed:', err, '| resolved formula:', resolvedFormula);
      return;
    }
    if (Number.isFinite(result)) {
      await actor.update({'system.customInitiative': result});
      await combatant.update({initiative: result});
    }
  }

  _sanitizeItemKey(name) {
    return name
      .normalize('NFKD')
      .replace(/[^a-zA-Z0-9]/g, '')
      .toLowerCase();
  }

  _resolveItemBonuses(formula, actor) {
    const ownedCounts = {};
    for (const item of actor.items) {
      const key = this._sanitizeItemKey(item.name);
      if (!key) continue;
      ownedCounts[key] = (ownedCounts[key] ?? 0) + 1;
    }
    const pattern = /@items\.([A-Za-z0-9_]+)\(([+-]?\d+(?:\.\d+)?)\)/g;
    return formula.replace(pattern, (match, rawKey, rawValue) => {
      const key = rawKey.toLowerCase();
      const bonusPerItem = Number(rawValue);
      const count = ownedCounts[key] ?? 0;
      const total = count * bonusPerItem;
      return String(total);
    });
  }
}
