import {
    STASharedActorFunctions
} from '../actor.js'

export class STACharacterSheet extends ActorSheet {

    /** @override */
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            classes: ["sta", "sheet", "actor", "character"],
            width: 850,
            height: 900,
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
        return `systems/FVTT-StarTrekAdventures/templates/actors/character-sheet.html`;
      }

    /* -------------------------------------------- */

    /** @override */
    getData() {
        const data = super.getData();

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

        // Checks if any values are larger than their relevant max, if so, set to max. 
        if (data.data.determination.value > 3) data.data.determination.value = 3;
        if (data.data.stress.value > data.data.stress.max) data.data.stress.value = data.data.stress.max;

        //Ensure attribute and discipline values aren't lower than 4.
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

        // Checks if any values are below their theoretical minimum, if so - set it to the very minimum.
        if (data.data.determination.value < 0) data.data.determination.value = 0;
        if (data.data.stress.value < 0) data.data.stress.value = 0;
        if (data.data.reputation < 0) data.data.reputation = 0;
        
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

        // Here we are checking how many helmets and armors are equipped. 
        // The player can only have one of each armor type. As such, we will use this later.
        var armorNumber = 0;
        var helmetNumber = 0;
        var stressTrackMax = 0;
        function armorCount(currentActor) {
            armorNumber = 0;
            helmetNumber = 0;
            currentActor.actor.items.forEach((values) => {
                if (values.type == "armor") {
                    if (values.data.data.helmet == true && values.data.data.equipped == true) helmetNumber+= 1;
                    if (values.data.data.helmet == false && values.data.data.equipped == true) armorNumber+= 1;
                }
            });
        }
        armorCount(this);

        // This creates a dynamic Determination Point tracker. It sets max determination to 3 (it is dynamic in Dishonored) and
        // creates a new div for each and places it under a child called "bar-determination-renderer"
        var determinationPointsMax = 3;
        for (i = 1; i <= determinationPointsMax; i++) {
            var div = document.createElement("DIV");
            div.className = "box";
            div.id = "determination-" + i;
            div.innerHTML = i;
            div.style = "width: calc(100% / 3);"
            html.find('#bar-determination-renderer')[0].appendChild(div);
        }

        // This creates a dynamic Stress tracker. It polls for the value of the fitness attribute, security discipline, and checks for Resolute talent. 
        // With the total value, creates a new div for each and places it under a child called "bar-stress-renderer".
        function stressTrackUpdate() {
            stressTrackMax = parseInt(html.find('#fitness')[0].value) + parseInt(html.find('#security')[0].value);
            if(html.find('[data-talent-name="Resolute"]').length > 0)
            {
                stressTrackMax += 3;
            }
            // This checks that the max-stress hidden field is equal to the calculated Max Stress value, if not it makes it so.
            if (html.find('#max-stress')[0].value != stressTrackMax)
            {
                html.find('#max-stress')[0].value = stressTrackMax;
            }
            html.find('#bar-stress-renderer').empty();
            for (i = 1; i <= stressTrackMax; i++) {
                var div = document.createElement("DIV");
                div.className = "box";
                div.id = "stress-" + i;
                div.innerHTML = i;
                div.style = "width: calc(100% / " + html.find('#max-stress')[0].value + ");"
                html.find('#bar-stress-renderer')[0].appendChild(div);
            }
        }
        stressTrackUpdate();

        // This creates a dynamic Reputation tracker. For this it uses a max value of 30. This can be configured here. 
        // It creates a new div for each and places it under a child called "bar-rep-renderer"
        var repPointsMax = game.settings.get("FVTT-StarTrekAdventures", "maxNumberOfReputation");
        var i;
        for (i = 1; i <= repPointsMax; i++) {
            var div = document.createElement("DIV");
            div.className = "box";
            div.id = "rep-" + i;
            div.innerHTML = i;
            div.style = "width: calc(100% / " + repPointsMax + ");"
            html.find('#bar-rep-renderer')[0].appendChild(div);
        }

        // Fires the function staRenderTracks as soon as the parameters exist to do so.
        // staActor.staRenderTracks(html, stressTrackMax, determinationPointsMax, repPointsMax);
        staActor.staRenderTracks(html, stressTrackMax, determinationPointsMax, repPointsMax);

        // This allows for each item-edit image to link open an item sheet. This uses Simple Worldbuilding System Code.
        html.find('.control .edit').click(ev => {
            const li = $(ev.currentTarget).parents(".entry");
            const item = this.actor.getOwnedItem(li.data("itemId"));
            item.sheet.render(true);
        });

        // This if statement checks if the form is editable, if not it hides control used by the owner, then aborts any more of the script.
        if (!this.options.editable) {
            // This hides the ability to Perform an Attribute Test for the character.
            for (i = 0; i < html.find('.check-button').length; i++) {
                html.find('.check-button')[i].style.display = 'none';
            }
            // This hides all toggle, add and delete item images.
            for (i = 0; i < html.find('.control.create').length; i++) {
                html.find('.control.create')[i].style.display = 'none';
            }
            for (i = 0; i < html.find('.control .delete').length; i++) {
                html.find('.control .delete')[i].style.display = 'none';
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
            if (type == "armor" && armorNumber >= 1) {
                ui.notifications.info("The current actor has an equipped armor already. Adding unequipped.");
                data.equipped = false;
            }
            const itemData = {
                name: name,
                type: type,
                data: data
            };
            delete itemData.data["type"];
            return this.actor.createOwnedItem(itemData);
        });

        // Allows item-delete images to allow deletion of the selected item. This uses Simple Worldbuilding System Code.
        html.find('.control .delete').click(ev => {
            const li = $(ev.currentTarget).parents(".entry");
            this.actor.deleteOwnedItem(li.data("itemId"));
            li.slideUp(200, () => this.render(false));
        });

        // Reads if a reputation track box has been clicked, and if it has will either: set the value to the clicked box, or reduce the value by one. 
        // This check is dependent on various requirements, see comments in code.
        html.find('[id^="rep"]').click(ev => {
            var newTotalObject = $(ev.currentTarget)[0];
            var newTotal = newTotalObject.id.replace(/\D/g, '');
            // data-selected stores whether the track box is currently activated or not. This checks that the box is activated
            if (newTotalObject.getAttribute("data-selected") === "true") {
                // Now we check that the "next" track box is not activated. 
                // If there isn't one, or it isn't activated, we only want to decrease the value by 1 rather than setting the value.
                var nextCheck = 'rep-' + (parseInt(newTotal) + 1);
                if (!html.find('#'+nextCheck)[0] || html.find('#'+nextCheck)[0].getAttribute("data-selected") != "true") {
                    html.find('#total-rep')[0].value = html.find('#total-rep')[0].value - 1;
                    this.submit();
                } 
                // If it isn't caught by the if, the next box is likely activated. If something happened, its safer to set the value anyway.
                else {
                    var total = html.find('#total-rep')[0].value;
                    if (total != newTotal) {
                        html.find('#total-rep')[0].value = newTotal;
                        this.submit();
                    }
                }
            } 
            // If the clicked box wasn't activated, we need to activate it now.
            else {
                var total = html.find('#total-rep')[0].value;
                if (total != newTotal) {
                    html.find('#total-rep')[0].value = newTotal;
                    this.submit();
                }
            }
        });

        // Reads if a stress track box has been clicked, and if it has will either: set the value to the clicked box, or reduce the value by one.
        // See line 186-220 for a more detailed break down on the context of each scenario. Stress uses the same logic.
        html.find('[id^="stress"]').click(ev => {
            var newTotalObject = $(ev.currentTarget)[0];
            var newTotal = newTotalObject.id.substring(7);
            if (newTotalObject.getAttribute("data-selected") === "true") {
                var nextCheck = 'stress-' + (parseInt(newTotal) + 1);
                if (!html.find('#'+nextCheck)[0] || html.find('#'+nextCheck)[0].getAttribute("data-selected") != "true") {
                    html.find('#total-stress')[0].value = html.find('#total-stress')[0].value - 1;
                    this.submit();
                } else {
                    var total = html.find('#total-stress')[0].value;
                    if (total != newTotal) {
                        html.find('#total-stress')[0].value = newTotal;
                        this.submit();
                    }
                }
            } else {
                var total = html.find('#total-stress')[0].value;
                if (total != newTotal) {
                    html.find('#total-stress')[0].value = newTotal;
                    this.submit();
                }
            }
        });

        // Reads if a determination track box has been clicked, and if it has will either: set the value to the clicked box, or reduce the value by one.
        // See line 186-220 for a more detailed break down on the context of each scenario. Determination uses the same logic.
        html.find('[id^="determination"]').click(ev => {
            var newTotalObject = $(ev.currentTarget)[0];
            var newTotal = newTotalObject.id.replace(/\D/g, '');
            if (newTotalObject.getAttribute("data-selected") === "true") {
                var nextCheck = 'determination-' + (parseInt(newTotal) + 1);
                if (!html.find('#'+nextCheck)[0] || html.find('#'+nextCheck)[0].getAttribute("data-selected") != "true") {
                    html.find('#total-determination')[0].value = html.find('#total-determination')[0].value - 1;
                    this.submit();
                } else {
                    var total = html.find('#total-determination')[0].value;
                    if (total != newTotal) {
                        html.find('#total-determination')[0].value = newTotal;
                        this.submit();
                    }
                }
            } else {
                var total = html.find('#total-determination')[0].value;
                if (total != newTotal) {
                    html.find('#total-determination')[0].value = newTotal;
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
            
            staActor.rollAttributeTest(event, selectedAttribute, parseInt(selectedAttributeValue), selectedDiscipline, parseInt(selectedDisciplineValue), this.actor);
        });
    }
}