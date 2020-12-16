import {
    STARoll
} from './roll.js'

export function attributeTest(actor, attributeName, disciplineName, focusRating, numberOfDice) {
    let fail = false;  
    if (actor === undefined) {
        ui.notifications.warn("Please provide an actor to the macro!");
        fail = true;
    }
    if (attributeName === undefined) {
        ui.notifications.warn("Please provide an attribute to the macro!");
        fail = true;
    }
    if (disciplineName === undefined) {
        ui.notifications.warn("Please provide an discipline to the macro!");
        fail = true;
    }
    if (numberOfDice > 5) {
        ui.notifications.warn("You cannot roll more than 5 die!");
        fail = true;
    }
    else if (numberOfDice < 1) {
        ui.notifications.warn("You must roll a dice!");
        fail = true;
    }
    if (fail === true) {
        return false;
    }
    if (numberOfDice === undefined) {
        numberOfDice = 2;
    }
    if (focusRating === undefined) {
        focusRating = 1;
    }
    let attributeValue = parseInt(actor.data.data.attributes[attributeName].value);
    let disciplineValue = parseInt(actor.data.data.disciplines[disciplineName].value);
    let staRoll = new STARoll();
    staRoll.performAttributeTest(numberOfDice, attributeValue+disciplineValue, focusRating, attributeName, disciplineName, actor);
}
  