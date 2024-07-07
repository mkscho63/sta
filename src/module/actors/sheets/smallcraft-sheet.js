import {
  STASharedActorFunctions
} from '../actor.js';

export class STASmallCraftSheet extends ActorSheet {
  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ['sta', 'sheet', 'actor', 'smallcraft'],
      width: 900,
      height: 735,
      dragDrop: [{
        dragSelector: '.item-list .item',
        dropSelector: null
      }]
    });
  }

  /* -------------------------------------------- */
  // If the player is not a GM and has limited permissions - send them to the limited sheet, otherwise, continue as usual.
  /** @override */
  get template() {
    let versionInfo = game.world.coreVersion;
    if ( !game.user.isGM && this.actor.limited) return 'systems/sta/templates/actors/limited-sheet.html';
    if (!foundry.utils.isNewerVersion(versionInfo,"0.8.-1")) return "systems/sta/templates/actors/smallcraft-sheet-legacy.html";
    return `systems/sta/templates/actors/smallcraft-sheet.html`;
  }
    

  /* -------------------------------------------- */

  /** @override */
  getData() {
    const sheetData = this.object;
    sheetData.dtypes = ['String', 'Number', 'Boolean'];

    // Ensure department values don't weigh over the max.  
    $.each(sheetData.system.departments, (key, department) => {
      if (department.value > 5) department.value = 5; 
    });

    // Checks if shields is larger than its max, if so, set to max. 
    if (sheetData.system.shields.value > sheetData.system.shields.max) {
      sheetData.system.shields.value = sheetData.system.shields.max;
    }
    if (sheetData.system.power.value > sheetData.system.power.max) {
      sheetData.system.power.value = sheetData.system.power.max;
    }
  
    // Ensure system and department values aren't lower than their minimums.
    $.each(sheetData.system.systems, (key, system) => {
      if (system.value < 0) system.value = 0; 
    });
  
    $.each(sheetData.system.departments, (key, department) => {
      if (department.value < 0) department.value = 0; 
    });

    // Checks if shields is below 0, if so - set it to 0.
    if (sheetData.system.shields.value < 0) {
      sheetData.system.shields.value = 0;
    }
    if (sheetData.system.power.value < 0) {
      sheetData.system.power.value = 0;
    }

    return sheetData;
  }

  /* -------------------------------------------- */

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);
    
    // Allows checking version easily 
    let versionInfo = game.world.coreVersion; 
    
    // Opens the class STASharedActorFunctions for access at various stages.
    const staActor = new STASharedActorFunctions();

    // If the player has limited access to the actor, there is nothing to see here. Return.
    if ( !game.user.isGM && this.actor.limited) {
      return;
    }

    // We use i alot in for loops. Best to assign it now for use later in multiple places.
    let i;
    let shieldsTrackMax = 0;
    let powerTrackMax = 0;

    // This creates a dynamic Shields tracker. It polls for the value of the structure system and security department. 
    // With the total value divided by 2, creates a new div for each and places it under a child called "bar-shields-renderer".
    function shieldsTrackUpdate() {
      shieldsTrackMax = Math.floor((parseInt(html.find('#structure')[0].value) + parseInt(html.find('#security')[0].value))/2) + parseInt(html.find('#shieldmod')[0].value);
      if (html.find('[data-talent-name="Advanced Shields"]').length > 0) {
        shieldsTrackMax += 5;
      }
      // This checks that the max-shields hidden field is equal to the calculated Max Shields value, if not it makes it so.
      if (html.find('#max-shields')[0].value != shieldsTrackMax) {
        html.find('#max-shields')[0].value = shieldsTrackMax;
      }
      html.find('#bar-shields-renderer').empty();
      for (i = 1; i <= shieldsTrackMax; i++) {
        const div = document.createElement('DIV');
        div.className = 'box';
        div.id = 'shields-' + i;
        div.innerHTML = i;
        div.style = 'width: calc(100% / ' + html.find('#max-shields')[0].value + ');';
        html.find('#bar-shields-renderer')[0].appendChild(div);
      }
    }
    shieldsTrackUpdate();

    // This creates a dynamic Power tracker. It polls for the value of the engines system. 
    // With the value, creates a new div for each and places it under a child called "bar-power-renderer".
    function powerTrackUpdate() {
      powerTrackMax = Math.ceil(parseInt(html.find('#engines')[0].value)/2);
      if (html.find('[data-talent-name="Secondary Reactors"]').length > 0) {
        powerTrackMax += 5;
      }
      // This checks that the max-power hidden field is equal to the calculated Max Power value, if not it makes it so.
      if (html.find('#max-power')[0].value != powerTrackMax) {
        html.find('#max-power')[0].value = powerTrackMax;
      }
      html.find('#bar-power-renderer').empty();
      for (i = 1; i <= powerTrackMax; i++) {
        const div = document.createElement('DIV');
        div.className = 'box';
        div.id = 'power-' + i;
        div.innerHTML = i;
        div.style = 'width: calc(100% / ' + html.find('#max-power')[0].value + ');';
        html.find('#bar-power-renderer')[0].appendChild(div);
      }
    }
    powerTrackUpdate();

    // Fires the function staRenderTracks as soon as the parameters exist to do so.
    staActor.staRenderTracks(html, null, null, null,
      shieldsTrackMax, powerTrackMax, null);

    // This allows for each item-edit image to link open an item sheet. This uses Simple Worldbuilding System Code.
    html.find('.control .edit').click( (ev) => {
      const li = $(ev.currentTarget).parents( '.entry' );
      const item = this.actor.items.get( li.data( 'itemId' ) ); 
      item.sheet.render(true);
    });

    // This if statement checks if the form is editable, if not it hides controls used by the owner, then aborts any more of the script.
    if (!this.options.editable) {
      // This hides the ability to Perform an System Test for the character
      for (i = 0; i < html.find('.check-button').length; i++) {
        html.find('.check-button')[i].style.display = 'none';
      }
      // This hides all add and delete item images.
      for (i = 0; i < html.find('.control.create').length; i++) {
        html.find('.control.create')[i].style.display = 'none';
      }
      for (i = 0; i < html.find('.control .delete').length; i++) {
        html.find('.control .delete')[i].style.display = 'none';
      }
      // This hides all system and department check boxes (and titles)
      for (i = 0; i < html.find('.selector').length; i++) {
        html.find('.selector')[i].style.display = 'none';
      }
      // Remove hover CSS from clickables that are no longer clickable.
      for (i = 0; i < html.find('.box').length; i++) {
        html.find('.box')[i].classList.add('unset-clickables');
      }
      for (i = 0; i < html.find('.rollable').length; i++) {
        html.find('.rollable')[i].classList.add('unset-clickables');
      }
      return;
    };
    
    // set up click handler for items to send to the actor rollGenericItem 
    html.find('.chat,.rollable').click( (ev) => {
      const itemType = $(ev.currentTarget).parents('.entry')[0].getAttribute('data-item-type');
      const itemId = $(ev.currentTarget).parents('.entry')[0].getAttribute('data-item-id');
      staActor.rollGenericItem(ev, itemType, itemId, this.actor);
    });

    // Allows item-create images to create an item of a type defined individually by each button. This uses code found via the Foundry VTT System Tutorial.
    html.find('.control.create').click((ev) => {
      ev.preventDefault();
      const header = ev.currentTarget;
      const type = header.dataset.type;
      const data = foundry.utils.duplicate(header.dataset);
      const name = `New ${type.capitalize()}`;
      const itemData = {
        name: name,
        type: type,
        data: data,
        img: game.sta.defaultImage
      };
      delete itemData.data['type'];
      if ( foundry.utils.isNewerVersion( versionInfo, '0.8.-1' )) {
        return this.actor.createEmbeddedDocuments( 'Item', [(itemData)] ); 
      } else {
        return this.actor.createOwnedItem( itemData );
      }
    });

    // Allows item-delete images to allow deletion of the selected item.
    html.find('.control .delete').click( (ev) => {
      // Cleaning up previous dialogs is nice, and also possibly avoids bugs from invalid popups.
      if (this.activeDialog) this.activeDialog.close();

      const li = $(ev.currentTarget).parents('.entry');
      this.activeDialog = staActor.deleteConfirmDialog(
        li[0].getAttribute('data-item-value'),
        () => {
          if ( foundry.utils.isNewerVersion( versionInfo, '0.8.-1' )) {
            this.actor.deleteEmbeddedDocuments( 'Item', [li.data('itemId')] );
          } else {
            this.actor.deleteOwnedItem( li.data( 'itemId' ));
          }
        },
        () => this.activeDialog = null
      );
      this.activeDialog.render(true);
    });

    // Reads if a shields track box has been clicked, and if it has will either: set the value to the clicked box, or reduce the value by one.
    // This check is dependent on various requirements, see comments in code.
    html.find('[id^="shields"]').click((ev) => {
      let total = '';
      const newTotalObject = $(ev.currentTarget)[0];
      const newTotal = newTotalObject.id.substring('shields-'.length);
      // data-selected stores whether the track box is currently activated or not. This checks that the box is activated
      if (newTotalObject.getAttribute('data-selected') === 'true') {
        // Now we check that the "next" track box is not activated. 
        // If there isn't one, or it isn't activated, we only want to decrease the value by 1 rather than setting the value.
        const nextCheck = 'shields-' + (parseInt(newTotal) + 1);
        if (!html.find('#'+nextCheck)[0] || html.find('#'+nextCheck)[0].getAttribute('data-selected') != 'true') {
          html.find('#total-shields')[0].value = html.find('#total-shields')[0].value - 1;
          this.submit();
        // If it isn't caught by the if, the next box is likely activated. If something happened, its safer to set the value anyway.
        } else {
          total = html.find('#total-shields')[0].value;
          if (total != newTotal) {
            html.find('#total-shields')[0].value = newTotal;
            this.submit();
          }
        }
      // If the clicked box wasn't activated, we need to activate it now.
      } else {
        total = html.find('#total-shields')[0].value;
        if (total != newTotal) {
          html.find('#total-shields')[0].value = newTotal;
          this.submit();
        }
      }
    });

    // Reads if a power track box has been clicked, and if it has will either: set the value to the clicked box, or reduce the value by one.
    // This check is dependent on various requirements, see comments in code.
    html.find('[id^="power"]').click((ev) => {
      let total = '';
      const newTotalObject = $(ev.currentTarget)[0];
      const newTotal = newTotalObject.id.substring('power-'.length);
      // data-selected stores whether the track box is currently activated or not. This checks that the box is activated
      if (newTotalObject.getAttribute('data-selected') === 'true') {
        // Now we check that the "next" track box is not activated. 
        // If there isn't one, or it isn't activated, we only want to decrease the value by 1 rather than setting the value.
        const nextCheck = 'power-' + (parseInt(newTotal) + 1);
        if (!html.find('#'+nextCheck)[0] || html.find('#'+nextCheck)[0].getAttribute('data-selected') != 'true') {
          html.find('#total-power')[0].value = html.find('#total-power')[0].value - 1;
          this.submit();
        // If it isn't caught by the if, the next box is likely activated. If something happened, its safer to set the value anyway.
        } else {
          total = html.find('#total-power')[0].value;
          if (total != newTotal) {
            html.find('#total-power')[0].value = newTotal;
            this.submit();
          }
        }
      // If the clicked box wasn't activated, we need to activate it now.
      } else {
        total = html.find('#total-power')[0].value;
        if (total != newTotal) {
          html.find('#total-power')[0].value = newTotal;
          this.submit();
        }
      }
    });

    // This is used to clean up all the HTML that comes from displaying outputs from the text editor boxes. There's probably a better way to do this but the quick and dirty worked this time.
    $.each($('[id^=talent-tooltip-text-]'), function(index, value) {
      const beforeDescription = value.innerHTML;
      const decoded = TextEditor.decodeHTML(beforeDescription);
      const prettifiedDescription = TextEditor.previewHTML(decoded, 1000);
      $('#' + value.id).html(prettifiedDescription);
    });


    html.find('.talent-tooltip-clickable').click((ev) => {
      const talentId = $(ev.currentTarget)[0].id.substring('talent-tooltip-clickable-'.length);
      const currentShowingTalentId = $('.talent-tooltip-container:not(.hide)')[0] ? $('.talent-tooltip-container:not(.hide)')[0].id.substring('talent-tooltip-container-'.length) : null;
      
      if (talentId == currentShowingTalentId) {
        $('#talent-tooltip-container-' + talentId).addClass('hide').removeAttr('style');
      } else {
        $('.talent-tooltip-container').addClass('hide').removeAttr('style');
        $('#talent-tooltip-container-' + talentId).removeClass('hide').height($('#talent-tooltip-text-' + talentId)[0].scrollHeight + 5);
      }
    });

    // Turns the System checkboxes into essentially a radio button. It removes any other ticks, and then checks the new system.
    // Finally a submit is required as data has changed.
    html.find('.selector.system').click((ev) => {
      for (i = 0; i <= 5; i++) {
        html.find('.selector.system')[i].checked = false;
      }
      $(ev.currentTarget)[0].checked = true;
      this.submit();
    });

    // Turns the Department checkboxes into essentially a radio button. It removes any other ticks, and then checks the new department.
    // Finally a submit is required as data has changed.
    html.find('.selector.department').click((ev) => {
      for (i = 0; i <= 5; i++) {
        html.find('.selector.department')[i].checked = false;
      }
      $(ev.currentTarget)[0].checked = true;
      this.submit();
    });

    // If the check-button is clicked it grabs the selected system and the selected department and fires the method rollSystemTest. See actor.js for further info.
    html.find('.check-button.attribute').click((ev) => {
      let selectedSystem = '';
      let selectedSystemValue = '';
      let selectedDepartment = '';
      let selectedDepartmentValue = '';
      for (i = 0; i <= 5; i++) {
        if (html.find('.selector.system')[i].checked === true) {
          selectedSystem = html.find('.selector.system')[i].id;
          selectedSystem = selectedSystem.slice(0, -9);
          selectedSystemValue = html.find('#'+selectedSystem)[0].value;
        }
      }
      for (i = 0; i <= 5; i++) {
        if (html.find('.selector.department')[i].checked === true) {
          selectedDepartment = html.find('.selector.department')[i].id;
          selectedDepartment = selectedDepartment.slice(0, -9);
          selectedDepartmentValue = html.find('#'+selectedDepartment)[0].value;
        }
      }
        
      staActor.rollAttributeTest(ev, selectedSystem,
        parseInt(selectedSystemValue), selectedDepartment,
        parseInt(selectedDepartmentValue), 2, this.actor);
    });
    
    // If the check-button is clicked it fires the method challenge roll method. See actor.js for further info.
    html.find('.check-button.challenge').click( (ev) => {
      staActor.rollChallengeRoll(ev, null, null, this.actor);
    });

    html.find('.reroll-result').click((ev) => {
      let selectedSystem = '';
      let selectedSystemValue = '';
      let selectedDepartment = '';
      let selectedDepartmentValue = '';
      for (i = 0; i <= 5; i++) {
        if (html.find('.selector.system')[i].checked === true) {
          selectedSystem = html.find('.selector.system')[i].id;
          selectedSystem = selectedSystem.slice(0, -9);
          selectedSystemValue = html.find('#'+selectedSystem)[0].value;
        }
      }
      for (i = 0; i <= 5; i++) {
        if (html.find('.selector.department')[i].checked === true) {
          selectedDepartment = html.find('.selector.department')[i].id;
          selectedDepartment = selectedDepartment.slice(0, -9);
          selectedDepartmentValue = html.find('#'+selectedDepartment)[0].value;
        }
      }
      
      staActor.rollAttributeTest(ev, selectedSystem,
        parseInt(selectedSystemValue), selectedDepartment,
        parseInt(selectedDepartmentValue), null, this.actor);
    });
    
    $(html).find('[id^=smallcraft-weapon-]').each(function(_, value) {
      const weaponDamage = parseInt(value.dataset.itemDamage);
      const securityValue = parseInt(html.find('#security')[0].value);
      let scaleDamage = 0;
      if (value.dataset.itemIncludescale == "true") scaleDamage = parseInt(html.find('#scale')[0].value);
      const attackDamageValue = weaponDamage + securityValue + scaleDamage;
      value.getElementsByClassName('damage')[0].innerText = attackDamageValue;
    });
  }
}
