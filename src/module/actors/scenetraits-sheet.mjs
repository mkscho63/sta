const api = foundry.applications.api;
const sheets = foundry.applications.sheets;
import {STAActors} from './sta-actors.mjs';

export class STASceneTraits extends STAActors {
  static PARTS = {
    charactersheet: {
      template: 'systems/sta/templates/actors/scenetraits-sheet.hbs'
    }
  };

  static DEFAULT_OPTIONS = {
    position: {
      height: 'auto',
      width: 300,
    },
  };

  _configureRenderOptions(options) {
    super._configureRenderOptions(options);
    options.parts = ['charactersheet'];
  }

  get title() {
    return `${this.actor.name} - Scene Traits`;
  }

  get allowedItemTypes() {
    return new Set([
      'trait'
    ]);
  }
}
