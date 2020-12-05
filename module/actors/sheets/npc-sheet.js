import {
    STASharedActorFunctions
} from '../actor.js'

export class STANPCSheet extends ActorSheet {

    /** @override */
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            classes: ["sta", "sheet", "actor", "npc"],
            width: 700,
            height: 735,
            dragDrop: [{
                dragSelector: ".item-list .item",
                dropSelector: null
            }]
        });
    }

    /* -------------------------------------------- */
    // If the player is not a GM and has limited permissions - send them to the limited sheet, otherwise, continue as usual.
    /** @override */
    get template() {
        if ( !game.user.isGM && this.actor.limited) return "systems/FVTT-StarTrekAdventures/templates/actors/limited-sheet.html";
        return `systems/FVTT-StarTrekAdventures/templates/actors/npc-sheet.html`;
      }

    /* -------------------------------------------- */

    /** @override */
    getData() {
        const data = super.getData();
        data.dtypes = ["String", "Number", "Boolean"];

        //Ensure attribute and discipline values don't weigh over the max.
        if (data.data.attributes.control.value > 12) data.data.attributes.control.value = 12;
        if (data.data.attributes.daring.value > 12) data.data.attributes.daring.value = 12;
        if (data.data.attributes.fitness.value > 12) data.data.attributes.fitness.value = 12;
        if (data.data.attributes.insight.value > 12) data.data.attributes.insight.value = 12;
        if (data.data.attributes.presence.value > 12) data.data.attributes.presence.value = 12;
        if (data.data.attributes.reason.value > 12) data.data.attributes.reason.value = 12;
        if (data.data.disciplines.command.value > 5) data.data.disciplines.command.value = 5;
        if (data.data.disciplines.conn.value > 5) data.data.disciplines.conn.value = 5;
        if (data.data.disciplines.engineering.value > 5) data.data.disciplines.engineering.value = 5;
        if (data.data.disciplines.medicine.value > 5) data.data.disciplines.medicine.value = 5;
        if (data.data.disciplines.science.value > 5) data.data.disciplines.science.value = 5;
        if (data.data.disciplines.security.value > 5) data.data.disciplines.security.value = 5;

        // Checks if stress is larger than its max, if so, set to max. 
        if (data.data.stress.value > data.data.stress.max) data.data.stress.value = data.data.stress.max;

        //Ensure attribute and discipline values aren't lower than their minimums.
        if (data.data.attributes.control.value < 7) data.data.attributes.control.value = 7;
        if (data.data.attributes.daring.value < 7) data.data.attributes.daring.value = 7;
        if (data.data.attributes.fitness.value < 7) data.data.attributes.fitness.value = 7;
        if (data.data.attributes.insight.value < 7) data.data.attributes.insight.value = 7;
        if (data.data.attributes.presence.value < 7) data.data.attributes.presence.value = 7;
        if (data.data.attributes.reason.value < 7) data.data.attributes.reason.value = 7;
        if (data.data.disciplines.command.value < 0) data.data.disciplines.command.value = 0;
        if (data.data.disciplines.conn.value < 0) data.data.disciplines.conn.value = 0;
        if (data.data.disciplines.engineering.value < 0) data.data.disciplines.engineering.value = 0;
        if (data.data.disciplines.medicine.value < 0) data.data.disciplines.medicine.value = 0;
        if (data.data.disciplines.science.value < 0) data.data.disciplines.science.value = 0;
        if (data.data.disciplines.security.value < 0) data.data.disciplines.security.value = 0;

        // Checks if stress is below 0, if so - set it to 0.
        if (data.data.stress.value < 0) data.data.stress.value = 0;
        
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

        // We use i alot in for loops. Best to assign it now for use later in multiple places.
        var i;

        // This creates a dynamic Stress tracker. It polls for the value of the insight attribute, adds any protection from armor. 
        // With the total value, creates a new div for each and places it under a child called "bar-stress-renderer".
        var stressTrackMax = parseInt(html.find('#insight')[0].value);
        var armor = html.find('[id^="protectval-armor"]');
        for (i = 0; i < armor.length; i++) {
            stressTrackMax += parseInt(armor[i].innerHTML);
        }
        if (html.find('#max-stress')[0].value != stressTrackMax)
        {
            html.find('#max-stress')[0].value = stressTrackMax;
            this.submit();
        }
        for (i = 1; i <= stressTrackMax; i++) {
            var div = document.createElement("DIV");
            div.className = "box";
            div.id = "stress-" + i;
            div.innerHTML = i;
            div.style = "width: calc(100% / " + html.find('#max-stress')[0].value + ");"
            html.find('#bar-stress-renderer')[0].appendChild(div);
        }

        // Fires the function staRenderTracks as soon as the parameters exist to do so.
        staActor.staRenderTracks(html, stressTrackMax);

        // This allows for each item-edit image to link open an item sheet. This uses Simple Worldbuilding System Code.
        html.find('.control.edit').click(ev => {
            const li = $(ev.currentTarget).parents(".entry");
            const item = this.actor.getOwnedItem(li.data("itemId"));
            item.sheet.render(true);
        });

        // This if statement checks if the form is editable, if not it hides controls used by the owner, then aborts any more of the script.
        if (!this.options.editable) {
            // This hides the ability to Perform an Attribute Test for the character
            for (i = 0; i < html.find('.check-button').length; i++) {
                html.find('.check-button')[i].style.display = 'none';
            }
            // This hides all add and delete item images.
            for (i = 0; i < html.find('.control.create').length; i++) {
                html.find('.control.create')[i].style.display = 'none';
            }
            for (i = 0; i < html.find('.control.delete').length; i++) {
                html.find('.control.delete')[i].style.display = 'none';
            }
            // This hides all attribute and discipline check boxes (and titles)
            for (i = 0; i < html.find('.selector').length; i++) {
                html.find('.selector')[i].style.display = 'none';
            }
            // Remove hover CSS from clickables that are no longer clickable.
            for (i = 0; i < html.find('.box').length; i++) {
                html.find('.box')[i].classList.add("unset-clickables");
            }
            for (i = 0; i < html.find('.rollable').length; i++) {
                html.find('.rollable')[i].classList.add("unset-clickables");
            }
            return;
        };

        // This allows for all items to be rolled, it gets the current targets type and id and sends it to the rollGenericItem function.
        html.find('.rollable').click(ev =>{
            var itemType = $(ev.currentTarget).parents(".entry")[0].getAttribute("data-item-type");
            var itemId = $(ev.currentTarget).parents(".entry")[0].getAttribute("data-item-id");
            staActor.rollGenericItem(event, itemType, itemId, this.actor);
        })

        // Allows item-create images to create an item of a type defined individually by each button. This uses code found via the Foundry VTT System Tutorial.
        html.find('.control.create').click(ev => {
            event.preventDefault();
            const header = event.currentTarget;
            const type = header.dataset.type;
            const data = duplicate(header.dataset);
            const name = `New ${type.capitalize()}`;
            const itemData = {
                name: name,
                type: type,
                data: data
            };
            delete itemData.data["type"];
            return this.actor.createOwnedItem(itemData);
        });

        // Allows item-delete images to allow deletion of the selected item. This uses Simple Worldbuilding System Code.
        html.find('.control.delete').click(ev => {
            const li = $(ev.currentTarget).parents(".entry");
            this.actor.deleteOwnedItem(li.data("itemId"));
            li.slideUp(200, () => this.render(false));
        });

        // Reads if a stress track box has been clicked, and if it has will either: set the value to the clicked box, or reduce the value by one.
        // This check is dependent on various requirements, see comments in code.
        html.find('[id^="stress"]').click(ev => {
            var newTotalObject = $(ev.currentTarget)[0];
            var newTotal = newTotalObject.id.substring(7);
            // data-selected stores whether the track box is currently activated or not. This checks that the box is activated
            if (newTotalObject.getAttribute("data-selected") === "true") {
                // Now we check that the "next" track box is not activated. 
                // If there isn't one, or it isn't activated, we only want to decrease the value by 1 rather than setting the value.
                var nextCheck = 'stress-' + (parseInt(newTotal) + 1);
                if (!html.find('#'+nextCheck)[0] || html.find('#'+nextCheck)[0].getAttribute("data-selected") != "true") {
                    html.find('#total-stress')[0].value = html.find('#total-stress')[0].value - 1;
                    this.submit();
                } 
                // If it isn't caught by the if, the next box is likely activated. If something happened, its safer to set the value anyway.
                else {
                    var total = html.find('#total-stress')[0].value;
                    if (total != newTotal) {
                        html.find('#total-stress')[0].value = newTotal;
                        this.submit();
                    }
                }
            } 
            // If the clicked box wasn't activated, we need to activate it now.
            else {
                var total = html.find('#total-stress')[0].value;
                if (total != newTotal) {
                    html.find('#total-stress')[0].value = newTotal;
                    this.submit();
                }
            }
        });

        // Turns the Attribute checkboxes into essentially a radio button. It removes any other ticks, and then checks the new attribute.
        // Finally a submit is required as data has changed.
        html.find('.selector.attribute').click(ev => {
            for (i = 0; i <= 5; i++) {
                html.find('.selector.attribute')[i].checked = false;
            }
            $(ev.currentTarget)[0].checked = true;
            this.submit();
        });

        // Turns the Discipline checkboxes into essentially a radio button. It removes any other ticks, and then checks the new discipline.
        // Finally a submit is required as data has changed.
        html.find('.selector.discipline').click(ev => {
            for (i = 0; i <= 5; i++) {
                html.find('.selector.discipline')[i].checked = false;
            }
            $(ev.currentTarget)[0].checked = true;
            this.submit();
        });

        // If the check-button is clicked it grabs the selected attribute and the selected discipline and fires the method rollAttributeTest. See actor.js for further info.
        html.find('.check-button').click(ev => {
            for (i = 0; i <= 5; i++) {
                if (html.find('.selector.attribute')[i].checked === true) {
                    var selectedAttribute = html.find('.selector.attribute')[i].id;
                    var selectedAttribute = selectedAttribute.slice(0, -9)
                    var selectedAttributeValue = html.find('#'+selectedAttribute)[0].value;
                }
            }
            for (i = 0; i <= 5; i++) {
                if (html.find('.selector.discipline')[i].checked === true) {
                    var selectedDiscipline = html.find('.selector.discipline')[i].id;
                    var selectedDiscipline = selectedDiscipline.slice(0, -9)
                    var selectedDisciplineValue = html.find('#'+selectedDiscipline)[0].value;
                }
            }
            var checkTarget = parseInt(selectedAttributeValue) + parseInt(selectedDisciplineValue);
            staActor.rollAttributeTest(event, checkTarget, selectedAttribute, selectedDiscipline, this.actor);
        });
    }
}