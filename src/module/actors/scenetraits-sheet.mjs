const api = foundry.applications.api;
const sheets = foundry.applications.sheets;

export class STASceneTraits extends api.HandlebarsApplicationMixin(sheets.ActorSheetV2) {
  static PARTS = {
    charactersheet: {
      template: 'systems/sta/templates/actors/scenetraits-sheet.hbs'
    }
  };

  static DEFAULT_OPTIONS = {
    actions: {
      onItemCreate: STASceneTraits._onItemCreate,
      onItemEdit: STASceneTraits._onItemEdit,
      onItemDelete: STASceneTraits._onItemDelete,
      onItemtoChat: STASceneTraits._onItemtoChat,
    },
    form: {
      submitOnChange: true,
      closeOnSubmit: false,
    },
    position: {
      height: 'auto',
      width: 300,
    },
    dragDrop: [{
      dragSelector: 'li[data-item-id]',
      dropSelector: [
        '.window-content',
        '.sheet-body',
        '.sheet',
        '.tab',
        'ul.items',
        '.drop-zone'
      ].join(', ')
    }]
  };

  get title() {
    return `${this.actor.name} - Scene Traits`;
  }

  async _prepareContext(options) {
    const items = this.actor.items?.contents || [];
    const itemsSorted = [...items].sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0));
    const context = {
      actor: this.actor,
      items: itemsSorted,
    };
    return context;
  }

  async _onItemNameChange(event) {
    const input = event.currentTarget;
    const itemId = input.dataset.itemId;
    const newName = input.value.trim();
    const item = this.actor.items.get(itemId);
    await item.update({
      name: newName
    });
  }

  async _onItemQuantityChange(event) {
    const input = event.currentTarget;
    const itemId = input.dataset.itemId;
    const newQuantity = parseInt(input.value.trim(), 10);
    if (isNaN(newQuantity) || newQuantity < 0) {
      ui.notifications.error('Quantity must be a positive number.');
      return;
    }
    const item = this.actor.items.get(itemId);
    await item.update({
      'system.quantity': newQuantity
    });
  }

  static async _onItemtoChat(event) {
    const entry = event.target.closest('.entry');
    const itemId = entry.dataset.itemId;
    event.preventDefault();
    const item = this.actor.items.get(itemId);
    const staRoll = new STARoll();
    staRoll.performTraitRoll(item, this.actor);
  }

  static async _onItemCreate(event, target) {
    const docCls = getDocumentClass(target.dataset.documentClass || 'Item');
    const type = target.dataset.type || 'item';
    const docData = {
      name: `New ${type.charAt(0).toUpperCase() + type.slice(1)}`,
      type: type,
      parent: this.actor,
    };
    for (const [dataKey, value] of Object.entries(target.dataset)) {
      if (['action', 'documentClass'].includes(dataKey)) continue;
      foundry.utils.setProperty(docData, dataKey, value);
    }
    await docCls.create(docData, {
      parent: this.actor
    });
  }

  static async _onItemEdit(event) {
    const entry = event.target.closest('.entry');
    const itemId = entry.dataset.itemId;
    const item = this.actor.items.get(itemId);
    item.sheet.render(true);
  }

  static async _onItemDelete(event) {
    const entry = event.target.closest('.entry');
    const itemId = entry.dataset.itemId;
    new api.DialogV2({
      window: {
        title: game.i18n.localize('sta.apps.deleteitem')
      },
      content: `<p>${game.i18n.localize('sta.apps.deleteconfirm')}</p>`,
      position: {
        height: 'auto',
        width: 350
      },
      buttons: [{
        action: 'yes',
        default: false,
        icon: '<i class="fas fa-check"></i>',
        label: game.i18n.localize('sta.apps.yes'),
        callback: async () => {
          await this.actor.deleteEmbeddedDocuments('Item', [itemId]);
        },
      },
      {
        action: 'no',
        default: true,
        icon: '<i class="fas fa-times"></i>',
        label: game.i18n.localize('sta.apps.no'),
        callback: (event, button, htmlElement) => {
          const form = htmlElement.querySelector('form');
          return form ? new FormData(form) : null;
        },
      },],
      close: () => null,
    }).render(true);
  }

  async _onRender(context, options) {
    document.querySelectorAll('.item-name').forEach((input) => {
      input.addEventListener('change', this._onItemNameChange.bind(this));
    });

    document.querySelectorAll('.item-quantity').forEach((input) => {
      input.addEventListener('change', this._onItemQuantityChange.bind(this));
    });

    const els = Array.from(document.querySelectorAll('.item-name[data-item-id]'));
    for (const el of els) {
      const item = this.actor.items.get(el.dataset.itemId);
      const raw = (item?.system?.description ?? '').trim();
      if (!raw) continue;

      const enriched = await foundry.applications.ux.TextEditor.enrichHTML(raw, {
        async: true,
        documents: true,
        rolls: true,
        secrets: false
      });

      el.setAttribute('data-tooltip', enriched);
      el.setAttribute('data-tooltip-direction', 'UP');
    }

    if (!Array.isArray(this._dragDrop) || !this._dragDrop.length) {
      this._dragDrop = this._createDragDropHandlers();
    }
    this._dragDrop.forEach((d) => d.bind(this.element));

    this.element.querySelectorAll('li[data-item-id]')?.forEach((li) => {
      li.setAttribute('draggable', 'true');
    });
  }

  _canDragStart(selector) {
    return this.isEditable;
  }
  _canDragDrop(selector) {
    return this.isEditable;
  }

  _onDragStart(event) {
    const docRow = event.currentTarget.closest('li[data-item-id]');
    if (!docRow) return;
    if ('link' in event.target.dataset) return;

    const item = this.actor?.items?.get?.(docRow.dataset.itemId) ?? this._getEmbeddedDocument?.(docRow);
    if (!item) return;

    const dragData = item.toDragData?.() ?? {type: 'Item', uuid: item.uuid};
    event.dataTransfer.effectAllowed = 'copyMove';
    event.dataTransfer.setData('text/plain', JSON.stringify(dragData));
  }

  _onDragOver(event) {
    event.preventDefault();
    const li = event.target.closest('li[data-item-id]');
    if (!li) return;
    const r = li.getBoundingClientRect();
    li.dataset.dropPosition = (event.clientY - r.top) < r.height / 2 ? 'before' : 'after';
  }

  async _onDrop(event) {
    const data = foundry.applications.ux.TextEditor.getDragEventData(event);
    const allowed = Hooks.call('dropActorSheetData', this.actor, this, data);
    if (allowed === false) return;

    if (data.type === 'Item') return this._onDropItem(event, data);
  }

  async _onDropItem(event, data) {
    if (!this.actor?.isOwner) return false;

    const item = await Item.implementation.fromDropData(data);
    if (!item) return false;

    const allowedSubtypes = new Set([
      'trait'
    ]);

    if (!allowedSubtypes.has(item.type)) {
      ui.notifications.warn(
        `${this.actor.name} ` +
        game.i18n.localize('sta.notifications.actoritem') +
        ` ${item.type}`
      );
      return false;
    }

    if (item.parent?.uuid === this.actor.uuid) {
      return this._onSortItem(event, item);
    }

    const move = event.altKey === true;
    const created = await this._onDropItemCreate(item);
    if (move && item.parent?.isOwner) await item.delete();
    return created;
  }


  async _onDropItemCreate(itemOrData) {
    const arr = Array.isArray(itemOrData) ? itemOrData : [itemOrData];
    const payload = arr.map((d) => {
      const obj = d instanceof Item ? d.toObject() : d;
      delete obj._id;
      return obj;
    });
    return this.actor.createEmbeddedDocuments('Item', payload);
  }

  async _onSortItem(event, item) {
    const container =
      event.target?.closest?.('ul.items') ||
      event.currentTarget?.closest?.('ul.items') ||
      this.element;

    const nodeList = container.querySelectorAll('li[data-item-id]');
    const siblings = Array.from(nodeList)
      .map((el) => this.actor.items.get(el.dataset.itemId))
      .filter(Boolean);

    if (!siblings.length) return false;

    const li = event.target.closest('li[data-item-id]');
    let target = null;
    let before = false;

    if (li) {
      target = this.actor.items.get(li.dataset.itemId) || null;
      before = (li.dataset.dropPosition === 'before');
      if (target?.id === item.id) return false;
    } else {
      target = siblings[siblings.length - 1] || null;
      before = false;
    }

    const sortUpdates = foundry.utils.performIntegerSort(item, {
      target,
      siblings,
      sortKey: 'sort',
      sortBefore: before
    });

    const updates = sortUpdates.map((u) => ({
      _id: u.target.id ?? u.target._id,
      sort: u.update.sort
    })).filter((u) => u._id != null);

    if (!updates.length) return false;

    return this.actor.updateEmbeddedDocuments('Item', updates);
  }

  get dragDrop() {
    return this._dragDrop || [];
  }

  _createDragDropHandlers() {
    const cfgs = Array.isArray(this.options?.dragDrop) && this.options.dragDrop.length ?
      this.options.dragDrop :
      [{
        dragSelector: 'li[data-item-id]',
        dropSelector: '.window-content, .sheet-body, .tab, ul.items, .drop-zone'
      }];

    return cfgs.map((d) => new foundry.applications.ux.DragDrop({
      ...d,
      permissions: {
        dragstart: this._canDragStart.bind(this),
        drop: this._canDragDrop.bind(this),
      },
      callbacks: {
        dragstart: this._onDragStart.bind(this),
        dragover: this._onDragOver.bind(this),
        drop: this._onDrop.bind(this),
      }
    }));
  }
}
