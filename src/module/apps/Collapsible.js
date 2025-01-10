export class Collapsible {
  /**
   *
   * @param {jQuery} html
   */
  static attachHeaderListener(html) {
    html.find('.sta.chat.card .collapsible').on('click', this._onCollapsibleHeaderClick.bind(this));
  }

  static _onCollapsibleHeaderClick(event) {
    event.preventDefault();
    const header = event.currentTarget;
    $(header).toggleClass('collapsed');
  }
}
