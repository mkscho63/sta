const api = foundry.applications.api;
const sheets = foundry.applications.sheets;
import {STAActors} from './sta-actors.mjs';

export class STAExtendedTaskSheet extends STAActors {
  static PARTS = {
    charactersheet: {
      template: 'systems/sta/templates/actors/extended-task-sheet.hbs'
    },
  };

  static DEFAULT_OPTIONS = {
    position: {
      height: 'auto',
      width: 500
    },
  };

  _configureRenderOptions(options) {
    super._configureRenderOptions(options);
    options.parts = ['charactersheet'];
  }

  get title() {
    return `${this.actor.name} - Extended Task`;
  }

  get tracks() {
    return {
      ...super.tracks,
      work: true,
    };
  }
}
