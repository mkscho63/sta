export class STASmallCraftContainerSheet extends ItemSheet {
  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ['sta', 'sheet', 'item'],
      width: 680,
      height: 320,
      tabs: [{navSelector: '.sheet-tabs', contentSelector: '.sheet-body', initial: 'description'}]
    });
  }

  /* -------------------------------------------- */

  // If the player is not a GM and has limited permissions - send them to the limited sheet, otherwise, continue as usual.
  /** @override */
  get template() {
    let versionInfo;
    if (game.world.data) versionInfo = game.world.data.coreVersion;
    else game.world.coreVersion;
    if ( !game.user.isGM && this.item.limited) {
      ui.notifications.warn('You do not have permission to view this item!');
      return;
    }
    if (!foundry.utils.isNewerVersion(versionInfo,"0.8.-1")) return "systems/sta/templates/items/smallcraftcontainer-sheet-legacy.hbs";
    return `systems/sta/templates/items/smallcraftcontainer-sheet.hbs`;
  }

  /* -------------------------------------------- */

  /** @override */
  getData() {
    let versionInfo;
    if (game.world.data) versionInfo = game.world.data.coreVersion;
    else game.world.coreVersion;
    const data = this.object;
    data.dtypes = ['String', 'Number', 'Boolean'];
    let smallcrafts;

    if (!foundry.utils.isNewerVersion(versionInfo,"0.8.-1"))
    {
      smallcrafts = game.actors.filter((target) => 
        target.type === 'smallcraft' && target.owner);
    } else {
      smallcrafts = game.actors.filter((target) => 
        target.type === 'smallcraft' && target.isOwner);
    }
    data.availableSmallcrafts = smallcrafts;

    return data;
  }

  /* -------------------------------------------- */

  /** @override */
  setPosition(options = {}) {
    const position = super.setPosition(options);
    const sheetBody = this.element.find('.sheet-body');
    const bodyHeight = position.height - 192;
    sheetBody.css('height', bodyHeight);
    return position;
  }

  /* -------------------------------------------- */

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    // Everything below here is only needed if the sheet is editable
    if (!this.options.editable) return;
  }
}
