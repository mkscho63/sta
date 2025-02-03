import {
  STARoller
} from '../apps/STAroller.mjs';

const api = foundry.applications.api;

export class STATracker extends api.HandlebarsApplicationMixin(api.ApplicationV2) {
  static PARTS = {
    tracker: {
      template: "systems/sta/templates/apps/tracker.hbs"
    },
  };

  static DEFAULT_OPTIONS = {
    classes: ["tracker-container"],
    actions: {
      onMomentumIncrease: STATracker._onMomentumIncrease,
      onMomentumDecrease: STATracker._onMomentumDecrease,
      onThreatIncrease: STATracker._onThreatIncrease,
      onThreatDecrease: STATracker._onThreatDecrease,
      onMinimise: STATracker._onMinimise,
      onMaximise: STATracker._onMaximise,
      onTaskRoll: STARoller._onTaskRoll,
      onChallengeRoll: STARoller._onChallengeRoll,
      onNPCRoll: STARoller._onNPCRoll,
    },
    form: {
      submitOnChange: true,
      closeOnSubmit: false,
    },
    window: {
      frame: false,
      positioned: false
    },
  };

  constructor(options = {}) {
    super(options);
  }

  static async TrackerPosition(event) {
    let trackerForm = document.querySelector('.tracker-container');
    if (!trackerForm) {
      trackerForm = document.createElement('div');
      document.body.appendChild(trackerForm);
    }
    this.startPositionUpdater(trackerForm);
  }

  static positionDiceRoller(trackerForm) {
    const targetButton = document.querySelector(
      'button.collapse.ui-control.plain.icon[class*="fa-caret-"]'
    );
    const buttonRect = targetButton.getBoundingClientRect();
    trackerForm.style.position = 'absolute';
    trackerForm.style.top = `${buttonRect.bottom + 4}px`;
    trackerForm.style.left = `${buttonRect.left - 90}px`;
  }

  static startPositionUpdater(trackerForm) {
    const updatePosition = () => {
      this.positionDiceRoller(trackerForm);
      requestAnimationFrame(updatePosition);
    };
    requestAnimationFrame(updatePosition);
}

  static UPDATE_SOCKET_NAME = "system.sta";

  static MessageType = {
    SetResource: "set-resource",
    UpdateResource: "update-resource",
  };

  static Resource = {
    Momentum: "momentum",
    Threat: "threat",
  };

  static SocketMessage = class {
    type;
    resource;
    value;
    constructor(type, resource, value) {
      this.type = type;
      this.resource = resource;
      this.value = value;
    }
  }

  static LimitOf(resource) {
    return resource == STATracker.Resource.Momentum ? game.settings.get('sta', 'maxNumberOfMomentum') : 99;
  }

  static ValueOf(resource) {
    return game.settings.get("sta", resource);
  }

  static SendUpdateMessage(type, resource, value) {
    game.socket.emit(STATracker.UPDATE_SOCKET_NAME,
      new STATracker.SocketMessage(type, resource, value)
    );
  }

  static UserHasPermissionFor(resource) {
    let requiredLevel = game.settings.get("sta", `${resource}PermissionLevel`);
    return game.user.hasRole(requiredLevel);
  }

  static UserCanWriteSettings() {
    return game.permissions.SETTINGS_MODIFY.includes(game.user.role);
  }

  static accumulatedChanges = {
    momentum: 0,
    threat: 0
  };

  static chatMessageTimeout = null;

  static async DoUpdateResource(resource, newValue) {
    if (!STATracker.UserHasPermissionFor(resource)) {
      ui.notifications.error(game.i18n.localize(`sta.notifications.${resource}invalidpermissions`));
      return;
    } else if (newValue < 0) {
      ui.notifications.warn(game.i18n.localize(`sta.notifications.${resource}min`));
      STATracker.UpdateTracker();
      return;
    } else if (newValue > STATracker.LimitOf(resource)) {
      ui.notifications.warn(game.i18n.localize(`sta.notifications.${resource}max`) + STATracker.LimitOf(resource) + '!');
      STATracker.UpdateTracker();
      return;
    }
    let currentValue = STATracker.ValueOf(resource);
    if (newValue !== currentValue) {
      if (STATracker.UserCanWriteSettings()) {
        await game.settings.set('sta', resource, newValue);
        STATracker.SendUpdateMessage(STATracker.MessageType.UpdateResource);
        STATracker.UpdateTracker();
      } else {
        STATracker.SendUpdateMessage(STATracker.MessageType.SetResource, resource, newValue);
      }
      let resourceName = resource === STATracker.Resource.Momentum ? "momentum" : "threat";
      let diff = newValue - currentValue;
      STATracker.accumulatedChanges[resourceName] += diff;
      if (STATracker.chatMessageTimeout) {
        clearTimeout(STATracker.chatMessageTimeout);
      }
      STATracker.chatMessageTimeout = setTimeout(() => {
        let momentumDiff = STATracker.accumulatedChanges.momentum;
        let threatDiff = STATracker.accumulatedChanges.threat;
        let chatMessage = '';
        if (momentumDiff !== 0) {
          let momentumAction = momentumDiff > 0 ?
            game.i18n.format("sta.apps.addmomentum", {
              0: momentumDiff
            }) :
            game.i18n.format("sta.apps.removemomentum", {
              0: Math.abs(momentumDiff)
            });
          chatMessage += `${game.user.name} ${momentumAction}. `;
        }
        if (threatDiff !== 0) {
          let threatAction = threatDiff > 0 ?
            game.i18n.format("sta.apps.addthreat", {
              0: threatDiff
            }) :
            game.i18n.format("sta.apps.removethreat", {
              0: Math.abs(threatDiff)
            });
          chatMessage += `${game.user.name} ${threatAction}.`;
        }
        if (chatMessage && game.settings.get('sta', 'sendMomemtumThreatToChat')) {
          ChatMessage.create({
            speaker: {
              alias: "STA"
            },
            content: chatMessage
          });
        }
        STATracker.accumulatedChanges.momentum = 0;
        STATracker.accumulatedChanges.threat = 0;
      }, 1000);
    }
  }

  static OnAdjustTracker(resource, delta) {
    STATracker.DoUpdateResource(resource, STATracker.ValueOf(resource) + delta);
  }

  static OnInputTracker(resource) {
    const inputValue = Number.parseInt(document.getElementById(`sta-track-${resource}`).value);
    STATracker.DoUpdateResource(resource, inputValue);
  }

  static UpdateTracker() {
    document.getElementById('sta-track-momentum').value = STATracker.ValueOf(STATracker.Resource.Momentum);
    document.getElementById('sta-track-threat').value = STATracker.ValueOf(STATracker.Resource.Threat);
  }

  static ConfigureTrackerInterface() {
    STATracker.MomentumButtons = [
      document.getElementById('sta-momentum-track-decrease'),
      document.getElementById('sta-momentum-track-increase'),
    ];
    if (!this.UserHasPermissionFor(STATracker.Resource.Momentum)) {
      STATracker.MomentumButtons.forEach(b => b.style.display = "none");
      STATracker.MomentumInput.disabled = true;
    }
    STATracker.ThreatButtons = [
      document.getElementById('sta-threat-track-decrease'),
      document.getElementById('sta-threat-track-increase'),
    ];
    if (!this.UserHasPermissionFor(STATracker.Resource.Threat)) {
      STATracker.ThreatButtons.forEach(b => b.style.display = "none");
      STATracker.ThreatInput.disabled = true;
    }
  }

  static _onMomentumIncrease() {
    STATracker.OnAdjustTracker(STATracker.Resource.Momentum, +1);
  }
  static _onMomentumDecrease() {
    STATracker.OnAdjustTracker(STATracker.Resource.Momentum, -1);
  }
  static _onThreatIncrease() {
    STATracker.OnAdjustTracker(STATracker.Resource.Threat, +1);
  }
  static _onThreatDecrease() {
    STATracker.OnAdjustTracker(STATracker.Resource.Threat, -1);
  }

  static ConfigureTrackerInputActions() {
    const momentumInput = document.querySelector('#sta-track-momentum');
    const threatInput = document.querySelector('#sta-track-threat');
    STATracker.MomentumInput = momentumInput;
    STATracker.ThreatInput = threatInput;
    if (momentumInput) {
      momentumInput.addEventListener('keydown', (ev) => {
        if (ev.key === 'Enter') {
          momentumInput.blur();
        }
      });
      momentumInput.addEventListener('change', () => STATracker.OnInputTracker(STATracker.Resource.Momentum));
    }
    if (threatInput) {
      threatInput.addEventListener('keydown', (ev) => {
        if (ev.key === 'Enter') {
          threatInput.blur();
        }
      });
      threatInput.addEventListener('change', () => STATracker.OnInputTracker(STATracker.Resource.Threat));
    }
  }

  static _onMinimise() {
    document.getElementById('tracker-clickable-minus').classList.add('hide');
    document.getElementById('tracker-clickable-plus').classList.remove('hide');
    document.querySelectorAll('.tracker-container').forEach(el => el.classList.add('hide'));
  }

  static _onMaximise() {
    document.getElementById('tracker-clickable-plus').classList.add('hide');
    document.getElementById('tracker-clickable-minus').classList.remove('hide');
    document.querySelectorAll('.tracker-container').forEach(el => el.classList.remove('hide'));
  }

  static async OnSocketData(message) {
    switch (message.type) {
      case STATracker.MessageType.SetResource:
        if (STATracker.UserCanWriteSettings()) {
          await game.settings.set('sta', message.resource, message.value);
          STATracker.SendUpdateMessage(STATracker.MessageType.UpdateResource);
          STATracker.UpdateTracker();
        }
        break;
      case STATracker.MessageType.UpdateResource:
        STATracker.UpdateTracker();
        break;
    }
  }

  _onRender(context, options) {
    game.socket.on(STATracker.UPDATE_SOCKET_NAME, STATracker.OnSocketData);
    STATracker.ConfigureTrackerInputActions();
    STATracker.ConfigureTrackerInterface();
    STATracker.UpdateTracker();
    STATracker.TrackerPosition()
  }
}