export class Collapsible {
  /**
   *
   * @param {HTMLElement | jQuery} html
   */
  static attachHeaderListener(html) {
    const element = html instanceof jQuery ? html[0] : html;
    const collapsibles = element.querySelectorAll('.sta.chat.card .collapsible');
    collapsibles.forEach(collapsible =>
      collapsible.addEventListener('click', this._onCollapsibleHeaderClick.bind(this))
    );
  }
  static _onCollapsibleHeaderClick(event) {
    event.preventDefault();
    event.currentTarget.classList.toggle('collapsed');
  }
}