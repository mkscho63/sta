export class STATracker extends Application {

  constructor(options = {}) {
    super(options);
  }

  get onSettingsChanged() {
    return this._onSettingsChanged;
  }

  _onSettingsChanged(changed) {
    const keys = Object.keys(foundry.utils.flattenObject(changed));
    this._updateRenderedPosition();
    if (keys.includes('world.mode') || keys.includes('client.dockPosition') || keys.includes('client.hideDock')) {
      this._updateRenderedPosition();
    }
  }

  async _render(force = false, options = {}) {
    await super._render(force, options);
    this._updateRenderedPosition();
  }

  _updateRenderedPosition() {
    const tracker = this.element[0];
    if (!tracker) return;

    const cameraViews = ui.webrtc;

    const CSS_CLASSES = {
      DOCK_BOTTOM: 'av-bottom',
    };

    const element = cameraViews.element[0];

    if (!element || element.nodeName === 'TEMPLATE' || cameraViews.hidden) {
      tracker.classList.remove(CSS_CLASSES.DOCK_BOTTOM);
      return;
    }

    const dockPosition = game.webrtc.settings.client.dockPosition;
    if (AVSettings.DOCK_POSITIONS.BOTTOM === dockPosition) {
      tracker.classList.add(CSS_CLASSES.DOCK_BOTTOM);
    }
    else {
      tracker.classList.remove(CSS_CLASSES.DOCK_BOTTOM);
    }
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

  static get defaultOptions() {
    const options = super.defaultOptions;
    options.template = 'systems/sta/templates/apps/tracker.hbs';
    options.popOut = false;
    options.resizable = false;
    return options;
  }

  static MomentumButtons = [];

  static MomentumInput;

  static ThreatButtons = [];

  static ThreatInput;

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

// Store the accumulated changes and a timer
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
                game.i18n.format("sta.apps.addmomentum", {0: momentumDiff}) : 
                game.i18n.format("sta.apps.removemomentum", {0: Math.abs(momentumDiff)});
            chatMessage += `${game.user.name} ${momentumAction}. `;
        }
        if (threatDiff !== 0) {
            let threatAction = threatDiff > 0 ? 
                game.i18n.format("sta.apps.addthreat", {0: threatDiff}) : 
                game.i18n.format("sta.apps.removethreat", {0: Math.abs(threatDiff)});
            chatMessage += `${game.user.name} ${threatAction}.`;
        }

            if (chatMessage && game.settings.get('sta', 'sendMomemtumThreatToChat')) {
                ChatMessage.create({
                    speaker: { alias: "STA" },
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
    if (!this.UserHasPermissionFor(STATracker.Resource.Momentum)) {
      STATracker.MomentumButtons.forEach(b => b.style.display = "none");
      STATracker.MomentumInput.disabled = true;
    }

    if (!this.UserHasPermissionFor(STATracker.Resource.Threat)) {
      STATracker.ThreatButtons.forEach(b => b.style.display = "none");
      STATracker.ThreatInput.disabled = true;
    }
  }

   static ConfigureTrackerButtonActions() {
    $('#sta-momentum-track-decrease > .fas').click((_) => STATracker.OnAdjustTracker(STATracker.Resource.Momentum, -1));
    $('#sta-momentum-track-increase > .fas').click((_) => STATracker.OnAdjustTracker(STATracker.Resource.Momentum, +1));
    $('#sta-threat-track-decrease > .fas').click((_) => STATracker.OnAdjustTracker(STATracker.Resource.Threat, -1));
    $('#sta-threat-track-increase > .fas').click((_) => STATracker.OnAdjustTracker(STATracker.Resource.Threat, +1));
  }

   static ConfigureTrackerInputActions() {
    $('#sta-track-momentum').keydown((ev) => {
      if (ev.keyCode == 13) {
        $('#sta-track-momentum').blur();
      }
    });

    $('#sta-track-momentum').change((_) => STATracker.OnInputTracker(STATracker.Resource.Momentum));

    $('#sta-track-threat').keydown((ev) => {
      if (ev.keyCode == 13) {
        $('#sta-track-threat').blur();
      }
    });

    $('#sta-track-threat').change((_) => STATracker.OnInputTracker(STATracker.Resource.Threat));
  }

  static ConfigureTrackerToggleAction() {
    $('#tracker-clickable').click((_) => {
      if ($('.tracker-container:not(.hide)')[0]) {
        $('#tracker-clickable-minus').addClass('hide');
        $('#tracker-clickable-plus').removeClass('hide');
        $('.tracker-container').addClass('hide').removeAttr('style');
      } else {
        $('#tracker-clickable-plus').addClass('hide');
        $('#tracker-clickable-minus').removeClass('hide');
        $('.tracker-container').addClass('hide').removeAttr('style');
        $('.tracker-container').removeClass('hide').width('180px')
      }
    });
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

  activateListeners(html) {
    STATracker.MomentumButtons.push(
      html.find('#sta-momentum-track-decrease')[0],
      html.find('#sta-momentum-track-increase')[0]
    );
    STATracker.MomentumInput = html.find('#sta-track-momentum')[0];

    STATracker.ThreatButtons.push(
      html.find('#sta-threat-track-decrease')[0],
      html.find('#sta-threat-track-increase')[0]
    );
    STATracker.ThreatInput = html.find('#sta-track-threat')[0];

    game.socket.on(STATracker.UPDATE_SOCKET_NAME, STATracker.OnSocketData);

    STATracker.ConfigureTrackerInterface();
    STATracker.ConfigureTrackerButtonActions();
    STATracker.ConfigureTrackerInputActions();
    STATracker.ConfigureTrackerToggleAction();
    STATracker.UpdateTracker();
  }

}