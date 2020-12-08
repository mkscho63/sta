import {
    getFoundryVersion
} from './sta.js'

export class STARoll {

    async performAttributeTest(dicePool, checkTarget, focusTarget, selectedAttribute, selectedDiscipline, speaker) {
        // Define some variables that we will be using later.
        let foundryVersion = getFoundryVersion();
        let i;
        let result = 0;
        let diceString = "";
        let success = 0;
        let complication = 0;
        // Check if we are using a Foundry version below 0.7.0, if so use the old code.
        if (foundryVersion[0] == 0 && foundryVersion[1] < 7) {
            // Define r as our dice roll we want to perform (1d20, 2d20, 3d20, 4d20 or 5d20). We will then roll it.
            var r = new Roll(dicePool+"d20")
            r.roll();
            // Now for each dice in the dice pool we want to check what the individual result was.
            for (i = 0; i < dicePool; i++) {
                result = r.dice[0].rolls[i].roll;
                // If the result is less than or equal to the focus, that counts as 2 successes and we want to show the dice as green.
                if (result <= focusTarget) {
                    diceString += '<li class="roll die d20 max">' + result + '</li>';
                    success += 2;
                } 
                // If the result is less than or equal to the target (the discipline and attribute added together), that counts as 1 success but we want to show the dice as normal.
                else if (result <= checkTarget) {
                    diceString += '<li class="roll die d20">' + result + '</li>';
                    success += 1;
                }
                // If the result is 20, than we want to count it as a complication. We also want to show it as red!
                else if (result == 20) {
                    diceString += '<li class="roll die d20 min">' + result + '</li>';
                    complication += 1;
                }
                // If none of the above is true, the dice failed to do anything and is treated as normal.
                else {
                    diceString += '<li class="roll die d20">' + result + '</li>';
                }
            }
        }
        // If not use the shiny new code.
        else {
            // Define r as our dice roll we want to perform (1d20, 2d20, 3d20, 4d20 or 5d20). We will then roll it.
            var r = new Roll(dicePool+"d20")
            r.roll();
            // Now for each dice in the dice pool we want to check what the individual result was.
            for (i = 0; i < dicePool; i++) {
                result = r.terms[0].results[i].result;
                // If the result is less than or equal to the focus, that counts as 2 successes and we want to show the dice as green.
                if (result <= focusTarget) {
                    diceString += '<li class="roll die d20 max">' + result + '</li>';
                    success += 2;
                } 
                // If the result is less than or equal to the target (the discipline and attribute added together), that counts as 1 success but we want to show the dice as normal.
                else if (result <= checkTarget) {
                    diceString += '<li class="roll die d20">' + result + '</li>';
                    success += 1;
                }
                // If the result is 20, than we want to count it as a complication. We also want to show it as red!
                else if (result == 20) {
                    diceString += '<li class="roll die d20 min">' + result + '</li>';
                    complication += 1;
                }
                // If none of the above is true, the dice failed to do anything and is treated as normal.
                else {
                    diceString += '<li class="roll die d20">' + result + '</li>';
                }
            }
        }
        // Here we want to check if the success was exactly one (as "1 Successes" doesn't make grammatical sense). We create a string for the Successes.
        if (success == 1) {
            var successText = success + game.i18n.format("sta.roll.success");
        } else {
            var successText = success + game.i18n.format("sta.roll.successPlural");
        }

        // Check if we allow multiple complications, or if only one complication ever happens.
        const multipleComplicationsAllowed = game.settings.get("FVTT-StarTrekAdventures", "multipleComplications");

        // If there is any complications, we want to crate a string for this. If we allow multiple complications and they exist, we want to pluralise this also.
        // If no complications exist then we don't even show this box.
        if (complication >= 1) {
            if (complication > 1 && multipleComplicationsAllowed === true) {
                var localisedPluralisation = game.i18n.format("sta.roll.complicationPlural")
                var complicationText = '<h4 class="dice-total failure"> ' + localisedPluralisation.replace('|#|', complication) + '</h4>';
            } else {
                var complicationText = '<h4 class="dice-total failure"> ' + game.i18n.format("sta.roll.complication") + '</h4>';
            }
        } else {
            var complicationText = '';
        }

        // Set the flavour to "[Attribute] [Discipline] Attribute Test". This shows the chat what type of test occured.
        let flavor = game.i18n.format("sta.actor.attribute." + selectedAttribute) + " " + game.i18n.format("sta.actor.discipline." + selectedDiscipline) + game.i18n.format("sta.roll.test");

        // Build a dynamic html using the variables from above.
        let html = `
            <div class="sta roll attribute">
                <div class="dice-roll">
                    <div class="dice-result">
                        <div class="dice-formula">
                            <table class="aim">
                                <tr>
                                    <td> ` + dicePool + `d20 </td>
                                    <td> Target:` + checkTarget + ` </td>
                                    <td> Focus:` + focusTarget + ` </td>
                                </tr>
                            </table>
                        </div>
                        <div class="dice-tooltip">
                            <section class="tooltip-part">
                                <div class="dice">
                                    <ol class="dice-rolls">` + diceString + `</ol>
                                </div>
                            </section>
                        </div>` +
                        complicationText +
                        `<h4 class="dice-total">` + successText + `</h4>
                    </div>
                </div>
            </div>
        `
        // Check if the dice3d module exists (Dice So Nice). If it does, post a roll in that and then send to chat after the roll has finished. If not just send to chat.
        if(game.dice3d) {
            game.dice3d.showForRoll(r).then(displayed => {
                this.sendToChat(speaker, html, r, flavor);
            });
        }
        else {
            this.sendToChat(speaker, html, r, flavor);
        };
    }

    async performItemRoll(item, speaker) {
        // Create variable div and populate it with localisation to use in the HTML.
        var variablePrompt = game.i18n.format("sta.roll.item.quantity");
        let variable = `<div class='dice-formula'> `+variablePrompt.replace('|#|', item.data.data.quantity)+`</div>`;
        // Create dynamic tags div and populate it with localisation to use in the HTML.
        if (item.data.data.cost > 0) {
            var costLocalisation = game.i18n.format("sta.roll.item.value");
            var valueTag = "<div class='tag'> "+costLocalisation.replace('|#|', item.data.data.cost)+"</div>";
        }
        else {
            var valueTag = '';
        }
        // Send the divs to populate a HTML template and sends to chat.
        this.genericItemTemplate(item.data.img, item.data.name, item.data.data.description, variable, valueTag).then(html=>this.sendToChat(speaker, html));
    }

    async performFocusRoll(item, speaker) {
        // Create variable div and populate it with localisation to use in the HTML.
        let variablePrompt = game.i18n.format("sta.roll.focus.rating");
        let variable = `<div class='dice-formula'> `+variablePrompt.replace('|#|', item.data.data.rating)+`</div>`;
        // Send the divs to populate a HTML template and sends to chat.
        this.genericItemTemplate(item.data.img, item.data.name, item.data.data.description, variable).then(html=>this.sendToChat(speaker, html));
    }

    async performWeaponRoll(item, speaker) {
        // Create variable div and populate it with localisation to use in the HTML.
        var variablePrompt = game.i18n.format("sta.roll.weapon.damage");
        let variable = `<div class='dice-formula'> `+variablePrompt.replace('|#|', item.data.data.damage)+`</div>`;
        // Create dynamic tags div and populate it with localisation to use in the HTML.
        if (item.data.data.cost > 0) {
            var costLocalisation = game.i18n.format("sta.roll.item.value");
            var tags = "<div class='tag'> "+costLocalisation.replace('|#|', item.data.data.cost)+"</div>";
        }
        else {
            var tags = '';
        }
        if (item.data.data.qualities.armorpierce) tags += "<div class='tag'> "+game.i18n.format("sta.actor.belonging.weapon.armorpierce")+"</div>";
        if (item.data.data.qualities.awkward) tags += "<div class='tag'> "+game.i18n.format("sta.actor.belonging.weapon.awkward")+"</div>";
        if (item.data.data.qualities.blast) tags += "<div class='tag'> "+game.i18n.format("sta.actor.belonging.weapon.blast")+"</div>";
        if (item.data.data.qualities.block) tags += "<div class='tag'> "+game.i18n.format("sta.actor.belonging.weapon.block")+"</div>";
        if (item.data.data.qualities.burn) tags += "<div class='tag'> "+game.i18n.format("sta.actor.belonging.weapon.burn")+"</div>";
        if (item.data.data.qualities.concealed) tags += "<div class='tag'> "+game.i18n.format("sta.actor.belonging.weapon.concealed")+"</div>";
        if (item.data.data.qualities.melee) tags += "<div class='tag'> "+game.i18n.format("sta.actor.belonging.weapon.melee")+"</div>";
        if (item.data.data.qualities.messy) tags += "<div class='tag'> "+game.i18n.format("sta.actor.belonging.weapon.messy")+"</div>";
        if (item.data.data.qualities.mine) tags += "<div class='tag'> "+game.i18n.format("sta.actor.belonging.weapon.mine")+"</div>";
        if (item.data.data.qualities.rangeddistant) tags += "<div class='tag'> "+game.i18n.format("sta.actor.belonging.weapon.distant")+"</div>";
        if (item.data.data.qualities.rangednearby) tags += "<div class='tag'> "+game.i18n.format("sta.actor.belonging.weapon.nearby")+"</div>";
        // Send the divs to populate a HTML template and sends to chat.
        this.genericItemTemplate(item.data.img, item.data.name, item.data.data.description, variable, tags).then(html=>this.sendToChat(speaker, html));
    }

    async performArmorRoll(item, speaker) {
        // Create variable div and populate it with localisation to use in the HTML.
        let variablePrompt = game.i18n.format("sta.roll.armor.protect");
        let variable = `<div class='dice-formula'> `+variablePrompt.replace('|#|', item.data.data.protection)+`</div>`;
        // Create dynamic tags div and populate it with localisation to use in the HTML.
        if (item.data.data.cost > 0) {
            var costLocalisation = game.i18n.format("sta.roll.item.value");
            var valueTag = "<div class='tag'> "+costLocalisation.replace('|#|', item.data.data.cost)+"</div>";
        }
        else {
            var valueTag = '';
        }
        // Send the divs to populate a HTML template and sends to chat.
        this.genericItemTemplate(item.data.img, item.data.name, item.data.data.description, variable, valueTag).then(html=>this.sendToChat(speaker, html));
    }

    async performTalentRoll(item, speaker) {
        // Create variable div and populate it with localisation to use in the HTML.
        var variablePrompt = game.i18n.format("sta.roll.talent.type");
        var variable = `<div class='dice-formula'> `+variablePrompt.replace('|#|', item.data.data.type)+`</div>`;
        // Send the divs to populate a HTML template and sends to chat.
        this.genericItemTemplate(item.data.img, item.data.name, item.data.data.description, variable).then(html=>this.sendToChat(speaker, html));
    }

    async genericItemTemplate(img, name, description, variable, tags) {
        // Checks if the following are empty/undefined. If so sets to blank.
        let descField = description ? description : '';
        let tagField = tags ? tags : '';
        let varField = variable ? variable : '';
        // Builds a generic HTML template that is used for all items.
        let html = `
            <div class='sta roll generic'>
                <div class='dice-roll'>
                    <div class="dice-result">
                        <div class='dice-formula title'>
                            <img class='img' src=`+img+`></img>
                            <h1>`+name+`</h1>
                        </div>
                        `+varField+`
                        <div class="dice-tooltip">`+descField+`</div>
                        <div class='tags'> 
                            `+tagField+`
                        </div>
                    <div>
                </div>
            </div>
        `;
        // Returns it for the sendToChat to utilise.
        return html;
    }

    async sendToChat(speaker, content, roll, flavor) {
        // Send's Chat Message to foundry, if items are missing they will appear as false or undefined and this not be rendered.
        ChatMessage.create({
            user: game.user._id,
            speaker: ChatMessage.getSpeaker({ actor: speaker }),
            flavor: flavor,
            content: content,
            roll: roll,
            sound: "sounds/dice.wav"
        }).then(msg => {
            return msg;
        });
    }
}