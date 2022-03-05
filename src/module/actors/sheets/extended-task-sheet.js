import {
  STASharedActorFunctions
} from '../actor.js';

export class STAExtendedTaskSheet extends ActorSheet {
  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ['sta', 'sheet', 'actor', 'extendedtask'],
      width: 500,
      height: 600
    });
  }

  /* -------------------------------------------- */
  // If the player is not a GM and has limited permissions - send them to the limited sheet, otherwise, continue as usual.
  /** @override */
  get template() {
    if ( !game.user.isGM && this.actor.limited) {
      ui.notifications.warn('You do not have permission to view this sheet!');
      return false;
    }
    return `systems/sta/templates/actors/extended-task-sheet.html`;
  }

  /* -------------------------------------------- */

  /** @override */
  getData() {
    const sheetData = this.object;
    sheetData.dtypes = ['String', 'Number', 'Boolean'];
    
    if (sheetData.data.data.magnitude < 0) data.data.magnitude = 0;
    if (sheetData.data.data.work < 0) data.data.work = 0;
    if (sheetData.data.data.difficulty < 0) data.data.difficulty = 0;
    if (sheetData.data.data.resistance < 0) data.data.resistance = 0;
    
    return sheetData.data;
  }

  /* -------------------------------------------- */

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);
    
    // Opens the class STASharedActorFunctions for access at various stages.
    const staActor = new STASharedActorFunctions();

    // If the player has limited access to the actor, there is nothing to see here. Return.
    if ( !game.user.isGM && this.actor.limited) return;

    function renderExtendedWorkTracks() {
      const work = parseInt(html.find('#work')[0].value);

      const trackNumber = Math.ceil(work/5);
      
      const fullDiv = document.createElement('DIV');
      fullDiv.style = 'width: 100%;';
      fullDiv.className = 'bar extendedtask';
      for (let i = 0; i < trackNumber; i++ ) {
        // put a divider at the top of each row
        const dividerDiv = document.createElement('DIV');
        dividerDiv.className = 'extendedtask-divider';
        fullDiv.appendChild(dividerDiv);

        // build a row of numbers for the extended task track
        const rowDiv = document.createElement('DIV');
        rowDiv.className = 'row';
        rowDiv.style = 'width: 100%;';
        for (let j = 0; j < 5; j++) {
          const inputDiv = document.createElement('DIV');
          if (i * 5 + j + 1 <= work) {
            inputDiv.id = 'box-' + (i * 5 + j + 1);
            inputDiv.className = 'box extendedtask';
            inputDiv.innerHTML = (i * 5 + j + 1);
          }
          inputDiv.style = 'width: calc(100% / ' + 5 + ');';
          rowDiv.appendChild(inputDiv);
        }
        // append to the div that will be put in the renderer div on extended-task-sheet.html
        fullDiv.appendChild(rowDiv);
      }

      html.find('#extendedtask-renderer')[0].innerHTML = '';
      html.find('#extendedtask-renderer')[0].appendChild(fullDiv);

      for (let k = 0; k < work; k++) {
        html.find('[id^="box"]')[k].classList.add('extendedtask');
        if (k + 1 <= html.find('#work-progress')[0].value) {
          html.find('[id^="box"]')[k].setAttribute('data-selected', 'true');
          html.find('[id^="box"]')[k].classList.add('selected');
        } else {
          html.find('[id^="box"]')[k].removeAttribute('data-selected');
          html.find('[id^="box"]')[k].classList.remove('selected');
        }
      }
    }
    renderExtendedWorkTracks();

    html.find('[id^="box"]').click((ev) => {
      let total = '';
      const newTotalObject = $(ev.currentTarget)[0];
      const newTotal = newTotalObject.id.replace(/\D/g, '');
      if (newTotalObject.getAttribute('data-selected') === 'true') {
        const nextCheck = 'box-' + (parseInt(newTotal) + 1);
        if (!html.find('#'+nextCheck)[0] || html.find('#'+nextCheck)[0].getAttribute('data-selected') != 'true') {
          html.find('#work-progress')[0].value = html.find('#work-progress')[0].value - 1;
          this.submit();
        } else {
          total = html.find('#work-progress')[0].value;
          if (total != newTotal) {
            html.find('#work-progress')[0].value = newTotal;
            this.submit();
          }
        }
      } else {
        total = html.find('#work-progress')[0].value;
        if (total != newTotal) {
          html.find('#work-progress')[0].value = newTotal;
          this.submit();
        }
      }
    });
  }
}
