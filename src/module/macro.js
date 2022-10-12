import {
  STARoll
} from './roll.js';

export function attributeTest(actor, usingFocus, usingDetermination,
  selectedAttribute, selectedDiscipline, complicationRange, numberOfDice) {
  let fail = false;  
  if (actor === undefined) {
    ui.notifications.warn('Please provide an actor to the macro!');
    fail = true;
  }
  if (selectedAttribute === undefined) {
    ui.notifications.warn('Please provide an attribute to the macro!');
    fail = true;
  }
  if (selectedDiscipline === undefined) {
    ui.notifications.warn('Please provide an discipline to the macro!');
    fail = true;
  }
  if (numberOfDice > 5) {
    ui.notifications.warn('You cannot roll more than 5 die!');
    fail = true;
  } else if (numberOfDice < 1) {
    ui.notifications.warn('You must roll a dice!');
    fail = true;
  }
  if (fail === true) {
    return false;
  }
  if (numberOfDice === undefined) {
    numberOfDice = 2;
  }
  if (usingFocus === undefined) {
    usingFocus = false;
  }
  if (usingDetermination === undefined) {
    usingDetermination = false;
  }
  const attrValue = 
    parseInt(actor.data.attributes[selectedAttribute].value);
  const discValue = 
    parseInt(actor.data.disciplines[selectedDiscipline].value);
  const staRoll = new STARoll();
  staRoll.performAttributeTest(numberOfDice, usingFocus, usingDetermination,
    selectedAttribute, attrValue, selectedDiscipline,
    discValue, complicationRange, actor);
}
