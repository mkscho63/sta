import {STASharedActorFunctions} from '../actor.js';

export class STACharacterSheet extends ActorSheet {
  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ['sta', 'sheet', 'actor', 'character'],
      width: 850,
      height: 910,
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
    if ( !game.user.isGM && this.actor.limited) return 'systems/sta/templates/actors/limited-sheet.hbs';
    if (!foundry.utils.isNewerVersion(versionInfo,"0.8.-1")) return "systems/sta/templates/actors/character-sheet-legacy.hbs";
    return `systems/sta/templates/actors/character-sheet.hbs`;
  }

  /* -------------------------------------------- */

  /** @override */
  getData() {
    const sheetData = this.object;
    sheetData.dtypes = ['String', 'Number', 'Boolean'];
	
    // Temporary fix I'm leaving in place until I deprecate in a future version
    const overrideMinAttributeTags = ['[Minor]', '[Notable]', '[Major]', '[NPC]', '[Child]'];
    const overrideMinAttribute = overrideMinAttributeTags.some((tag) => sheetData.name.toLowerCase().indexOf(tag.toLowerCase()) !== -1);
    

    // Ensure attribute and discipline values aren't over the max/min.
    let minAttribute = overrideMinAttribute ? 0 : 7;
    let maxAttribute = 12;
    const overrideAttributeLimitSetting = game.settings.get('sta', 'characterAttributeLimitIgnore');
    if (overrideAttributeLimitSetting) {
      minAttribute = 0;
      maxAttribute = 99;
    }
    $.each(sheetData.system.attributes, (key, attribute) => {
      if (attribute.value > maxAttribute) attribute.value = maxAttribute; 
      if (attribute.value < minAttribute) attribute.value = minAttribute;
    });
    let minDiscipline = 0;
    let maxDiscipline = 5;
    const overrideDisciplineLimitSetting = game.settings.get('sta', 'characterDisciplineLimitIgnore');
    if (overrideDisciplineLimitSetting) {
      maxDiscipline = 99;
    }
    $.each(sheetData.system.disciplines, (key, discipline) => {
      if (discipline.value > maxDiscipline) discipline.value = maxDiscipline;
      if (discipline.value < minDiscipline) discipline.value = minDiscipline;
    });

    // Check stress max/min
    if (!(sheetData.system.stress))
      sheetData.system.stress = {};
    if (sheetData.system.stress.value > sheetData.system.stress.max) {
      sheetData.system.stress.value = sheetData.system.stress.max;
    }
    if (sheetData.system.stress.value < 0) {
      sheetData.system.stress.value = 0;
    }

    // Check determination max/min
    if (!(sheetData.system.determination))
      sheetData.system.determination = {};
    if (sheetData.system.determination.value > 3) {
      sheetData.system.determination.value = 3;
    }
    if (sheetData.system.determination.value < 0) {
      sheetData.system.determination.value = 0;
    }
    
    // Check reputation max/min
    if (!(sheetData.system.reputation))
      sheetData.system.reputation = {};
    if (sheetData.system.reputation.value > 20) {
      sheetData.system.reputation.value = 20;
    }
    if (sheetData.system.reputation < 0) {
      sheetData.system.reputation = 0;
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
    if ( !game.user.isGM && this.actor.limited) return;

    // We use i a lot in for loops. Best to assign it now for use later in multiple places.
    let i;

    // TODO: This is not really doing anything yet
    // Here we are checking if there is armor equipped. 
    // The player can only have one armor. As such, we will use this later.
    let armorNumber = 0;
    let stressTrackMax = 0;
    function armorCount(currentActor) {
      armorNumber = 0;
      currentActor.actor.items.forEach((values) => {
        if (values.type == 'armor') {
          if (values.equipped == true) armorNumber+= 1;
        }
      });
    }
    armorCount(this);

    // This creates a dynamic Determination Point tracker. It sets max determination to 3 (it is dynamic in Dishonored) and
    // creates a new div for each and places it under a child called "bar-determination-renderer"
    const determinationPointsMax = 3;
    for (i = 1; i <= determinationPointsMax; i++) {
      const detDiv = document.createElement('DIV');
      detDiv.className = 'box';
      detDiv.id = 'determination-' + i;
      detDiv.innerHTML = i;
      detDiv.style = 'width: calc(100% / 3);';
      html.find('#bar-determination-renderer')[0].appendChild(detDiv);
    }

    // This creates a dynamic Stress tracker. It polls for the value of the fitness attribute, security discipline, and checks for Resolute talent. 
    // With the total value, creates a new div for each and places it under a child called "bar-stress-renderer".
    function stressTrackUpdate() {

      const localizedValues = {
        "resolute": game.i18n.localize('sta.actor.character.talents.resolute')
      };

      stressTrackMax = parseInt(html.find('#fitness')[0].value) + parseInt(html.find('#security')[0].value);
      if (html.find(`[data-talent-name*="${localizedValues.resolute}"]`).length > 0) {
        stressTrackMax += 3;
      }
	  stressTrackMax += parseInt(html.find('#strmod')[0].value)
      // This checks that the max-stress hidden field is equal to the calculated Max Stress value, if not it makes it so.
      if (html.find('#max-stress')[0].value != stressTrackMax) {
        html.find('#max-stress')[0].value = stressTrackMax;
      }
      html.find('#bar-stress-renderer').empty();
      for (let i = 1; i <= stressTrackMax; i++) {
        const stressDiv = document.createElement('DIV');
        stressDiv.className = 'box';
        stressDiv.id = 'stress-' + i;
        stressDiv.innerHTML = i;
        stressDiv.style = 'width: calc(100% / ' + html.find('#max-stress')[0].value + ');';
        html.find('#bar-stress-renderer')[0].appendChild(stressDiv);
      }
    }
    stressTrackUpdate();

    // This creates a dynamic Reputation tracker. For this it uses a max value of 30. This can be configured here. 
    // It creates a new div for each and places it under a child called "bar-rep-renderer"
    const repPointsMax = game.settings.get('sta', 'maxNumberOfReputation');
    for (let i = 1; i <= repPointsMax; i++) {
      const repDiv = document.createElement('DIV');
      repDiv.className = 'box';
      repDiv.id = 'rep-' + i;
      repDiv.innerHTML = i;
      repDiv.style = 'width: calc(100% / ' + repPointsMax + ');';
      html.find('#bar-rep-renderer')[0].appendChild(repDiv);
    }

    // Fires the function staRenderTracks as soon as the parameters exist to do so.
    // staActor.staRenderTracks(html, stressTrackMax, determinationPointsMax, repPointsMax);
    staActor.staRenderTracks(html, stressTrackMax,
      determinationPointsMax, repPointsMax);

    // This allows for each item-edit image to link open an item sheet. This uses Simple Worldbuilding System Code.
    html.find('.control .edit').click((ev) => {
      const li = $(ev.currentTarget).parents('.entry');
      const item = this.actor.items.get(li.data('itemId'));
      item.sheet.render(true);
    });

    // This if statement checks if the form is editable, if not it hides control used by the owner, then aborts any more of the script.
    if (!this.options.editable) {
      // This hides the ability to Perform an Attribute Test for the character.
      for (i = 0; i < html.find('.check-button').length; i++) {
        html.find('.check-button')[i].style.display = 'none';
      }
      // This hides all toggle, add, and delete item images.
      for (i = 0; i < html.find('.control.create').length; i++) {
        html.find('.control.create')[i].style.display = 'none';
      }
      for (i = 0; i < html.find('.control .delete').length; i++) {
        html.find('.control .delete')[i].style.display = 'none';
      }
      for (i = 0; i < html.find('.control.toggle').length; i++) {
        html.find('.control.delete')[i].style.display = 'none';
      }
      // This hides all attribute and discipline check boxes (and titles)
      for (i = 0; i < html.find('.selector').length; i++) {
        html.find('.selector')[i].style.display = 'none';
      }
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

    // This toggles whether the value is used or not.
    html.find('.control.toggle').click((ev) => {
      let itemId = ev.currentTarget.closest(".entry").dataset.itemId;
      let item = this.actor.items.get(itemId);
      let state = item.system.used;
      if (state) {
        item.system.used = false;
        $(ev.currentTarget).children()[0].classList.remove('fa-toggle-on');
        $(ev.currentTarget).children()[0].classList.add('fa-toggle-off');
        $(ev.currentTarget).parents('.entry')[0].setAttribute('data-item-used', 'false');
        $(ev.currentTarget).parents('.entry')[0].style.textDecoration = 'none';
      } else {
        item.system.used = true;
        $(ev.currentTarget).children()[0].classList.remove('fa-toggle-off');
        $(ev.currentTarget).children()[0].classList.add('fa-toggle-on');
        $(ev.currentTarget).parents('.entry')[0].setAttribute('data-item-used', 'true');
        $(ev.currentTarget).parents('.entry')[0].style.textDecoration = 'line-through';
      }
      return this.actor.items.get(itemId).update({['system.used']: getProperty(item.system, 'used')});
    });

    // This allows for all items to be rolled, it gets the current targets type and id and sends it to the rollGenericItem function.
    html.find('.chat,.rollable').click((ev) =>{
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
      if (type == 'armor' && armorNumber >= 1) {
        ui.notifications.info('The current actor has an equipped armor already. Adding unequipped.');
        data.equipped = false;
      }
      const itemData = {
        name: name,
        type: type,
        data: data,
        img: game.sta.defaultImage
      };
      delete itemData.data['type'];
      if (foundry.utils.isNewerVersion(versionInfo, '0.8.-1')) {
        return this.actor.createEmbeddedDocuments('Item', [(itemData)]);
      } else {
        return this.actor.createOwnedItem(itemData);
      }
    });

    // Allows item-delete images to allow deletion of the selected item.
    html.find('.control .delete').click((ev) => {
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

    // Reads if a reputation track box has been clicked, and if it has will either: set the value to the clicked box, or reduce the value by one. 
    // This check is dependent on various requirements, see comments in code.
    html.find('[id^="rep"]').click((ev) => {
      let total = '';
      const newTotalObject = $(ev.currentTarget)[0];
      const newTotal = newTotalObject.id.replace(/\D/g, '');
      // data-selected stores whether the track box is currently activated or not. This checks that the box is activated
      if (newTotalObject.getAttribute('data-selected') === 'true') {
        // Now we check that the "next" track box is not activated. 
        // If there isn't one, or it isn't activated, we only want to decrease the value by 1 rather than setting the value.
        const nextCheck = 'rep-' + (parseInt(newTotal) + 1);
        if (!html.find('#'+nextCheck)[0] || html.find('#'+nextCheck)[0].getAttribute('data-selected') != 'true') {
          html.find('#total-rep')[0].value = html.find('#total-rep')[0].value - 1;
          this.submit();
        // If it isn't caught by the if, the next box is likely activated. If something happened, its safer to set the value anyway.
        } else {
          total = html.find('#total-rep')[0].value;
          if (total != newTotal) {
            html.find('#total-rep')[0].value = newTotal;
            this.submit();
          }
        }
      // If the clicked box wasn't activated, we need to activate it now.
      } else {
        total = html.find('#total-rep')[0].value;
        if (total != newTotal) {
          html.find('#total-rep')[0].value = newTotal;
          this.submit();
        }
      }
    });

    // Reads if a stress track box has been clicked, and if it has will either: set the value to the clicked box, or reduce the value by one.
    // See line 186-220 for a more detailed break down on the context of each scenario. Stress uses the same logic.
    html.find('[id^="stress"]').click((ev) => {
      let total = '';
      const newTotalObject = $(ev.currentTarget)[0];
      const newTotal = newTotalObject.id.substring(7);
      if (newTotalObject.getAttribute('data-selected') === 'true') {
        const nextCheck = 'stress-' + (parseInt(newTotal) + 1);
        if (!html.find('#'+nextCheck)[0] || html.find('#'+nextCheck)[0].getAttribute('data-selected') != 'true') {
          html.find('#total-stress')[0].value = html.find('#total-stress')[0].value - 1;
          this.submit();
        // If it isn't caught by the if, the next box is likely activated. If something happened, its safer to set the value anyway.
        } else {
          total = html.find('#total-stress')[0].value;
          if (total != newTotal) {
            html.find('#total-stress')[0].value = newTotal;
            this.submit();
          }
        }
      // If the clicked box wasn't activated, we need to activate it now.
      } else {
        total = html.find('#total-stress')[0].value;
        if (total != newTotal) {
          html.find('#total-stress')[0].value = newTotal;
          this.submit();
        }
      }
    });

    // Reads if a determination track box has been clicked, and if it has will either: set the value to the clicked box, or reduce the value by one.
    // See line 186-220 for a more detailed break down on the context of each scenario. Determination uses the same logic.
    html.find('[id^="determination"]').click((ev) => {
      let total = '';
      const newTotalObject = $(ev.currentTarget)[0];
      const newTotal = newTotalObject.id.replace(/\D/g, '');
      if (newTotalObject.getAttribute('data-selected') === 'true') {
        const nextCheck = 'determination-' + (parseInt(newTotal) + 1);
        if (!html.find('#'+nextCheck)[0] || html.find('#'+nextCheck)[0].getAttribute('data-selected') != 'true') {
          html.find('#total-determination')[0].value = html.find('#total-determination')[0].value - 1;
          this.submit();
        // If it isn't caught by the if, the next box is likely activated. If something happened, its safer to set the value anyway.
        } else {
          total = html.find('#total-determination')[0].value;
          if (total != newTotal) {
            html.find('#total-determination')[0].value = newTotal;
            this.submit();
          }
        }
      // If the clicked box wasn't activated, we need to activate it now.
      } else {
        total = html.find('#total-determination')[0].value;
        if (total != newTotal) {
          html.find('#total-determination')[0].value = newTotal;
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

    $.each($('[id^=injury-tooltip-text-]'), function(index, value) {
      const beforeDescription = value.innerHTML;
      const decoded = TextEditor.decodeHTML(beforeDescription);
      const prettifiedDescription = TextEditor.previewHTML(decoded, 1000);
      $('#' + value.id).html(prettifiedDescription);
    });


    html.find('.injury-tooltip-clickable').click((ev) => {
      const injuryId = $(ev.currentTarget)[0].id.substring('injury-tooltip-clickable-'.length);
      const currentShowinginjuryId = $('.injury-tooltip-container:not(.hide)')[0] ? $('.injury-tooltip-container:not(.hide)')[0].id.substring('injury-tooltip-container-'.length) : null;
            
      if (injuryId == currentShowinginjuryId) {
        $('#injury-tooltip-container-' + injuryId).addClass('hide').removeAttr('style');
      } else {
        $('.injury-tooltip-container').addClass('hide').removeAttr('style');
        $('#injury-tooltip-container-' + injuryId).removeClass('hide').height($('#injury-tooltip-text-' + injuryId)[0].scrollHeight + 5);
      }
    });

    $.each($('[id^=focus-tooltip-text-]'), function(index, value) {
      const beforeDescription = value.innerHTML;
      const decoded = TextEditor.decodeHTML(beforeDescription);
      const prettifiedDescription = TextEditor.previewHTML(decoded, 1000);
      $('#' + value.id).html(prettifiedDescription);
    });


    html.find('.focus-tooltip-clickable').click((ev) => {
      const focusId = $(ev.currentTarget)[0].id.substring('focus-tooltip-clickable-'.length);
      const currentShowingfocusId = $('.focus-tooltip-container:not(.hide)')[0] ? $('.focus-tooltip-container:not(.hide)')[0].id.substring('focus-tooltip-container-'.length) : null;
            
      if (focusId == currentShowingfocusId) {
        $('#focus-tooltip-container-' + focusId).addClass('hide').removeAttr('style');
      } else {
        $('.focus-tooltip-container').addClass('hide').removeAttr('style');
        $('#focus-tooltip-container-' + focusId).removeClass('hide').height($('#focus-tooltip-text-' + focusId)[0].scrollHeight + 5);
      }
    });

    $.each($('[id^=value-tooltip-text-]'), function(index, value) {
      const beforeDescription = value.innerHTML;
      const decoded = TextEditor.decodeHTML(beforeDescription);
      const prettifiedDescription = TextEditor.previewHTML(decoded, 1000);
      $('#' + value.id).html(prettifiedDescription);
    });

    // Turns the Attribute checkboxes into essentially a radio button. It removes any other ticks, and then checks the new attribute.
    // Finally a submit is required as data has changed.
    html.find('.selector.attribute').click((ev) => {
      for (i = 0; i <= 5; i++) {
        html.find('.selector.attribute')[i].checked = false;
      }
      $(ev.currentTarget)[0].checked = true;
      this.submit();
    });

    // Turns the Discipline checkboxes into essentially a radio button. It removes any other ticks, and then checks the new discipline.
    // Finally a submit is required as data has changed.
    html.find('.selector.discipline').click((ev) => {
      for (i = 0; i <= 5; i++) {
        html.find('.selector.discipline')[i].checked = false;
      }
      $(ev.currentTarget)[0].checked = true;
      this.submit();
    });

    // If the check-button is clicked it grabs the selected attribute and the selected discipline and fires the method rollAttributeTest. See actor.js for further info.
    html.find('.check-button.attribute').click((ev) => {
      let selectedAttribute = '';
      let selectedAttributeValue = '';
      let selectedDiscipline = '';
      let selectedDisciplineValue = '';
      for (i = 0; i <= 5; i++) {
        if (html.find('.selector.attribute')[i].checked === true) {
          selectedAttribute = html.find('.selector.attribute')[i].id;
          selectedAttribute = selectedAttribute.slice(0, -9);
          selectedAttributeValue = html.find('#'+selectedAttribute)[0].value;
        }
      }
      for (i = 0; i <= 5; i++) {
        if (html.find('.selector.discipline')[i].checked === true) {
          selectedDiscipline = html.find('.selector.discipline')[i].id;
          selectedDiscipline = selectedDiscipline.slice(0, -9);
          selectedDisciplineValue = html.find('#'+selectedDiscipline)[0].value;
        }
      }
            
      staActor.rollAttributeTest(ev, selectedAttribute,
        parseInt(selectedAttributeValue), selectedDiscipline,
        parseInt(selectedDisciplineValue), 2, this.actor);
    });
        
    // If the check-button is clicked it fires the method challenge roll method. See actor.js for further info.
    html.find('.check-button.challenge').click((ev) => {
      staActor.rollChallengeRoll(ev, 'Generic', 0, this.actor);
    });

    html.find('.reroll-result').click((ev) => {
      let selectedAttribute = '';
      let selectedAttributeValue = '';
      let selectedDiscipline = '';
      let selectedDisciplineValue = '';
      for (i = 0; i <= 5; i++) {
        if (html.find('.selector.attribute')[i].checked === true) {
          selectedAttribute = html.find('.selector.attribute')[i].id;
          selectedAttribute = selectedAttribute.slice(0, -9);
          selectedAttributeValue = html.find('#'+selectedAttribute)[0].value;
        }
      }
      for (i = 0; i <= 5; i++) {
        if (html.find('.selector.discipline')[i].checked === true) {
          selectedDiscipline = html.find('.selector.discipline')[i].id;
          selectedDiscipline = selectedDiscipline.slice(0, -9);
          selectedDisciplineValue = html.find('#'+selectedDiscipline)[0].value;
        }
      }
            
      staActor.rollAttributeTest(ev, selectedAttribute,
        parseInt(selectedAttributeValue), selectedDiscipline,
        parseInt(selectedDisciplineValue), null, this.actor);
    });

    $(html).find('[id^=character-weapon-]').each( function( _, value ) {
      const weaponDamage = parseInt(value.dataset.itemDamage);
      const securityValue = parseInt(html.find('#security')[0].value);
      const attackDamageValue = weaponDamage + securityValue;
      value.getElementsByClassName('damage')[0].innerText = attackDamageValue;
    });
  }
}
