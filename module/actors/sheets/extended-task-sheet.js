import {
  STASharedActorFunctions
} from '../actor.js'

export class STAExtendedTaskSheet extends ActorSheet {

  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["sta", "sheet", "actor", "extendedtask"],
      width: 500,
      height: 600
    });
  }

  /* -------------------------------------------- */
  // If the player is not a GM and has limited permissions - send them to the limited sheet, otherwise, continue as usual.
  /** @override */
  get template() {
    if ( !game.user.isGM && this.actor.limited) {
      ui.notifications.warn("You do not have permission to view this sheet!");
        return;
    }
    return `systems/sta/templates/actors/extended-task-sheet.html`;
  }

  /* -------------------------------------------- */

  /** @override */
  getData() {
    const data = super.getData();
    data.dtypes = ["String", "Number", "Boolean"];
    
    if (data.data.magnitude < 0) data.data.magnitude = 0;
    if (data.data.work < 0) data.data.work = 0;
    if (data.data.difficulty < 0) data.data.difficulty = 0;
    if (data.data.resistance < 0) data.data.resistance = 0;
    
    return data;
  }

  /* -------------------------------------------- */

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);
    
    // Opens the class STASharedActorFunctions for access at various stages.
    let staActor = new STASharedActorFunctions();

    // If the player has limited access to the actor, there is nothing to see here. Return.
    if ( !game.user.isGM && this.actor.limited) return;

    function renderExtendedWorkTracks() {
      var magnitude = parseInt(html.find('#magnitude')[0].value);
      var work = parseInt(html.find('#work')[0].value);

      var trackNumber = Math.ceil(work/5);
      
      var fullDiv = document.createElement("DIV");
      fullDiv.style = "width: 100%;";
      fullDiv.className = "extendedtask-bar";
      for (var i = 0; i < trackNumber; i++ ) {
        // put a divider at the top of each row
        var dividerDiv = document.createElement("DIV");
        dividerDiv.className = "extendedtask-divider";
        fullDiv.appendChild(dividerDiv);

        // build a row of numbers for the extended task track
        var rowDiv = document.createElement("DIV");
        rowDiv.className = "row";
        rowDiv.style = "width: 100%;";
        for (var j = 0; j < 5; j++) {
          var inputDiv = document.createElement("DIV");
          if (i * 5 + j + 1 <= work) {
            inputDiv.id = "extendedtask-box-" + (i * 5 + j + 1);
            inputDiv.className = "extendedtask-box";
            inputDiv.innerHTML = (i * 5 + j + 1);
          }
          inputDiv.style = "width: calc(100% / " + 5 + ");";
          rowDiv.appendChild(inputDiv);
        }
        // append to the div that will be put in the renderer div on extended-task-sheet.html
        fullDiv.appendChild(rowDiv);
      }

      html.find('#extendedtask-renderer').empty();
      html.find('#extendedtask-renderer')[0].appendChild(fullDiv);

      for (var k = 0; k < work; k++) {
				if (k + 1 <= html.find('#work-progress')[0].value) {
					html.find('[id^="extendedtask-box"]')[k].setAttribute("data-selected", "true");
					html.find('[id^="extendedtask-box"]')[k].style.backgroundColor = "#FFCC33";
					html.find('[id^="extendedtask-box"]')[k].style.color = "#1F1F1F";
				} else {
					html.find('[id^="extendedtask-box"]')[k].removeAttribute("data-selected");
					html.find('[id^="extendedtask-box"]')[k].style.backgroundColor = "#191813";
					html.find('[id^="extendedtask-box"]')[k].style.color = "#FEFEFF";
				}
			}
    }
    renderExtendedWorkTracks();

    html.find('[id^="extendedtask-box"]').click(ev => {
      var newTotalObject = $(ev.currentTarget)[0];
      var newTotal = newTotalObject.id.replace(/\D/g, '');
      if (newTotalObject.getAttribute("data-selected") === "true") {
        var nextCheck = 'extendedtask-box-' + (parseInt(newTotal) + 1);
        if (!html.find('#'+nextCheck)[0] || html.find('#'+nextCheck)[0].getAttribute("data-selected") != "true") {
          html.find('#work-progress')[0].value = html.find('#work-progress')[0].value - 1;
          this.submit();
        } else {
          var total = html.find('#work-progress')[0].value;
          if (total != newTotal) {
            html.find('#work-progress')[0].value = newTotal;
            this.submit();
          }
        }
      } else {
        var total = html.find('#work-progress')[0].value;
        if (total != newTotal) {
          html.find('#work-progress')[0].value = newTotal;
          this.submit();
        }
      }
    });
  }
}