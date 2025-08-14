const api = foundry.applications.api;
const sheets = foundry.applications.sheets;

export class STAMilestoneSheet extends api.HandlebarsApplicationMixin(sheets.ItemSheetV2) {
  static PARTS = {
    itemsheet: {
      template: 'systems/sta/templates/items/milestone-sheet.hbs'
    },
  };

  static DEFAULT_OPTIONS = {
    actions: {},
    form: {
      submitOnChange: true,
      closeOnSubmit: false,
    },
    position: {
      height: 'auto',
      width: 700,
    },
  };

  get title() {
    return `${this.item.name} - Milestone`;
  }

  async _prepareContext(options) {
    const actor = this.item.actor ?? null;
    const availableLogs = actor
      ? actor.items
          .filter(i => i.type === "log" && actor.isOwner)
          .map(i => ({ id: i.id, name: i.name }))
      : [];

    const arc = this.item.system?.arc ?? {};
    const isArc = !!arc.isArc;
    let totalSteps = Number.isFinite(Number(arc.steps)) ? Number(arc.steps) : 3;
    totalSteps = Math.max(3, totalSteps);
    const extraCount = isArc ? Math.max(0, totalSteps - 2) : 0;
    const letters = Array.from({ length: extraCount }, (_, i) => String.fromCharCode(67 + i));
    const arcLetters = letters.map(L => ({
      key: `child${L}`,
      label: L,
      value: this.item.system?.[`child${L}`] ?? ""
    }));

    return {
      item: this.item,
      actor,
      availableLogs,
      arcLetters,
      enrichedNotes: await foundry.applications.ux.TextEditor.enrichHTML(
        this.item.system?.description ?? "",
        { async: true, relativeTo: this.item }
      ),
    };
  }
}
