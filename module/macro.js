import {
    DishonoredRoll
} from './roll.js'

export function skillTest(actor, skillName, styleName, focusRating, numberOfDice) {
    let fail = false;  
    if (actor === undefined) {
        ui.notifications.warn("Please provide an actor to the macro!");
        fail = true;
    }
    if (skillName === undefined) {
        ui.notifications.warn("Please provide an skill to the macro!");
        fail = true;
    }
    if (styleName === undefined) {
        ui.notifications.warn("Please provide an style to the macro!");
        fail = true;
    }
    if (focusRating < 1) {
        ui.notifications.warn("Focus cannot be less than 1!");
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
    let skillValue = parseInt(actor.data.data.skills[skillName].value);
    let styleValue = parseInt(actor.data.data.styles[styleName].value);
    let dishonoredRoll = new DishonoredRoll();
    dishonoredRoll.performSkillTest(numberOfDice, skillValue+styleValue, focusRating, skillName, styleName, actor);
}
  