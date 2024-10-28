/** TODO: Reformat this file so that it aligns with ES2020 constraints or update
    the ESLint config to allow for ES2022.  Currently cannot be parsed by ES2020.

    If code changes are being here made, temporarily switching to ES2022 within
    the eslint.config.mjs on your local machine is advised to catch mistakes.
 */
/* eslint-disable */

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
    // This is happening in _render() as opposed to render() because this has to happen after elements have been generated.
    this._updateRenderedPosition();
  }

  _updateRenderedPosition() {
    /** @type HTMLElement */
    const tracker = this.element[0];
    if (!tracker) return;

    /** @type CameraViews */
    const cameraViews = ui.webrtc;

    const CSS_CLASSES = {
      DOCK_RIGHT: 'av-right',
      DOCK_BOTTOM: 'av-bottom',
      DOCK_COLLAPSE: 'av-collapse',
    };

    /** @type HTMLElement */
    const element = cameraViews.element[0];

    // If A/V is disabled, it is currently using an unrendered <template> tag.
    // In the AV classes in Foundry itself, there's also a check for the presence
    // of an element at all before it attempts some behaviors.  For safety, also
    // including that check here.
    if (!element || element.nodeName === 'TEMPLATE' || cameraViews.hidden) {
      tracker.classList.remove(CSS_CLASSES.DOCK_RIGHT);
      tracker.classList.remove(CSS_CLASSES.DOCK_BOTTOM);
      tracker.classList.remove(CSS_CLASSES.DOCK_COLLAPSE);
      return;
    }

    const dockPosition = game.webrtc.settings.client.dockPosition;
    if (AVSettings.DOCK_POSITIONS.RIGHT === dockPosition) {
      tracker.classList.add(CSS_CLASSES.DOCK_RIGHT);
      tracker.classList.remove(CSS_CLASSES.DOCK_BOTTOM);
    } else if (AVSettings.DOCK_POSITIONS.BOTTOM === dockPosition) {
      tracker.classList.remove(CSS_CLASSES.DOCK_RIGHT);
      tracker.classList.add(CSS_CLASSES.DOCK_BOTTOM);
    } else {
      tracker.classList.remove(CSS_CLASSES.DOCK_RIGHT);
      tracker.classList.remove(CSS_CLASSES.DOCK_BOTTOM);
      tracker.classList.remove(CSS_CLASSES.DOCK_COLLAPSE);
    }

    // Whether the A/V is collapsed or not.  Not exactly "hidden" as the name implies.
    const dockHidden = game.webrtc.settings.client.hideDock;
    if (dockHidden) {
      tracker.classList.add(CSS_CLASSES.DOCK_COLLAPSE);
    } else {
      tracker.classList.remove(CSS_CLASSES.DOCK_COLLAPSE);
    }
  }

  /**
   * The name of the communication socket used to update the tracker information.
   * 
   * @private
   * @readonly
   * @constant {string}
   */
  static UPDATE_SOCKET_NAME = 'system.sta';

  /**
   * An enumeration to identify different messages transmitted on the tracker update socket.
   * 
   * @private
   * @readonly
   * @enum {string}
   */
  static MessageType = {
    /** Signal that a resource shall be set to the specified value */
    SetResource: 'set-resource',
    /** Signal that the resource tracker shall be re-rendered to reflect to current resource values */
    UpdateResource: 'update-resource',
  };

  /**
   * An enumeration to identify different resources.
   * 
   * The actual representations of the the enumerations values are chosen such that they can be
   * used when concatenating identifiers for localization strings, HTML ids, etc.
   * 
   * @private
   * @readonly
   * @enum {string}
   */
  static Resource = {
    /** The momentum resource */
    Momentum: 'momentum',
    /** The threat resource */
    Threat: 'threat',
  };

  /**
   * A message to be transmitted on the tracker update socket
   * 
   * @private
   * @class
   */
  static SocketMessage = class {
    /**
     * The type of message sent/received.
     * 
     * @public
     * @readonly
     * @type {STATracker.MessageType}
     */
    type;

    /**
     * The resource affected by this message, if any.
     * 
     * @public
     * @readonly
     * @type {(STATracker.Resource|undefined)}
     */
    resource;

    /**
     * The value of the resource affected by this message, if any.
     * 
     * @public
     * @readonly
     * @type {(number|undefined)}
     */
    value;

    /**
     * Construct a new message for transmission on the tracker update socket
     * @param {STATracker.MessageType} type 
     * @param {(STATracker.Resource|undefined)} resource 
     * @param {(number|undefined)} value 
     */
    constructor(type, resource, value) {
      this.type = type;
      this.resource = resource;
      this.value = value;
    }
  };

  /**
   * The default settings of this application.
   * 
   * @public
   * @readonly
   * @property {object}
   *
   * @return {ApplicationOptions}
   */
  static get defaultOptions() {
    const options = super.defaultOptions;
    options.template = 'systems/sta/templates/apps/tracker.hbs';
    options.popOut = false;
    options.resizable = false;
    return options;
  }

  /**
   * The momentum + and - buttons.
   * 
   * @private
   * @readonly
   * @type {HTMLElement[]}
   */
  static MomentumButtons = [];

  /**
   * The momentum value input.
   * 
   * @private
   * @readonly
   * @type {HTMLElement}
   */
  static MomentumInput;

  /**
   * The threat + and - buttons.
   * 
   * @private
   * @readonly
   * @type {HTMLElement[]}
   */
  static ThreatButtons = [];

  /**
   * The threat value input.
   * 
   * @private
   * @readonly
   * @type {HTMLElement}
   */
  static ThreatInput;

  /**
   * Get the limit of the given resource.
   * 
   * @private
   * @param {STATracker.Resource} resource The resource to query the limit of.
   * @return {6|99999999}
   */
  static LimitOf(resource) {
    return resource == STATracker.Resource.Momentum ? game.settings.get('sta', 'maxNumberOfMomentum') : 99999999;
  }

  /**
   * Get the current value of the given resource
   * 
   * @private
   * @param {STATracker.Resource} resource The resource to query the value of.
   * @return {number} The current value of the given resource
   */
  static ValueOf(resource) {
    return game.settings.get('sta', resource);
  }

  /**
   * Send a new update message to the tracker update socket.
   * 
   * @private
   * @param {STATracker.MessageType} type The type of update message to send.
   * @param {(STATracker.Resource|undefined)} resource The resource this message is relevant for.
   * @param {(number|undefined)} value The value of the resource this message is relevant for.
   */
  static SendUpdateMessage(type, resource, value) {
    game.socket.emit(STATracker.UPDATE_SOCKET_NAME,
      new STATracker.SocketMessage(type, resource, value)
    );
  }

  /**
   * Check if the user has the permission to modify the given resource.
   * 
   * @param {STATracker.Resource} resource The resource to check the current user's permissions for.
   * @return {true|false} true iff. the current user is allowed to modify the given resource, false otherwise.
   */
  static UserHasPermissionFor(resource) {
    const requiredLevel = game.settings.get('sta', `${resource}PermissionLevel`);
    return game.user.hasRole(requiredLevel);
  }

  /**
   * Check if the user has permission to write settings.
   * 
   * @return {true|false} true iff. the current user is allowed to write settings.
   */
  static UserCanWriteSettings() {
    return game.permissions.SETTINGS_MODIFY.includes(game.user.role);
  }

  /**
   * Update the given resource to the given value.
   * 
   * @private
   * @param {STATracker.Resource} resource The resource to modify.
   * @param {number} value The value to set for the given resource.
   */

  // Store the accumulated changes and a timer
  static accumulatedChanges = {
    momentum: 0,
    threat: 0
  };

  static chatMessageTimeout = null; // Holds the timeout for debouncing

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

    const currentValue = STATracker.ValueOf(resource);
    
    if (newValue !== currentValue) {
      if (STATracker.UserCanWriteSettings()) {
        await game.settings.set('sta', resource, newValue);
        STATracker.SendUpdateMessage(STATracker.MessageType.UpdateResource);
        STATracker.UpdateTracker();
      } else {
        STATracker.SendUpdateMessage(STATracker.MessageType.SetResource, resource, newValue);
      }

      // Accumulate changes for momentum or threat
      const resourceName = resource === STATracker.Resource.Momentum ? 'momentum' : 'threat';
      const diff = newValue - currentValue;
      STATracker.accumulatedChanges[resourceName] += diff;

      // Clear any previous timeout and reset it
      if (STATracker.chatMessageTimeout) {
        clearTimeout(STATracker.chatMessageTimeout);
      }

      // Set a new timeout to send the chat message after 1 second of inactivity
      STATracker.chatMessageTimeout = setTimeout(() => {
        const momentumDiff = STATracker.accumulatedChanges.momentum;
        const threatDiff = STATracker.accumulatedChanges.threat;
        let chatMessage = '';

        // Construct the chat message based on the accumulated changes
        if (momentumDiff !== 0) {
          const momentumAction = momentumDiff > 0 ?
            game.i18n.format('sta.apps.addmomentum', {0: momentumDiff}) :
            game.i18n.format('sta.apps.removemomentum', {0: Math.abs(momentumDiff)});
          chatMessage += `${game.user.name} ${momentumAction}. `;
        }
        if (threatDiff !== 0) {
          const threatAction = threatDiff > 0 ?
            game.i18n.format('sta.apps.addthreat', {0: threatDiff}) :
            game.i18n.format('sta.apps.removethreat', {0: Math.abs(threatDiff)});
          chatMessage += `${game.user.name} ${threatAction}.`;
        }

        // Send the chat message
        if (chatMessage && game.settings.get('sta', 'sendMomemtumThreatToChat')) {
          ChatMessage.create({
            speaker: {alias: 'STA'},
            content: chatMessage
          });
        }

        // Reset the accumulated changes
        STATracker.accumulatedChanges.momentum = 0;
        STATracker.accumulatedChanges.threat = 0;
      }, 1000); // 1-second delay
    }
  }

  /**
   * Handle an interaction with the +/- button of the given resource.
   * 
   * @param {STATracker.Resource} resource The resource to handle the event for.
   * @param {1|-1} delta The delta applied to the given resource.
   */
  static OnAdjustTracker(resource, delta) {
    STATracker.DoUpdateResource(resource, STATracker.ValueOf(resource) + delta);
  }

  /**
   * Handle a value for the given resource being set via the input field.
   * 
   * @private
   * @param {STATracker.Resource} resource The resource to handle the event for.
   */
  static OnInputTracker(resource) {
    const inputValue = Number.parseInt(document.getElementById(`sta-track-${resource}`).value);
    STATracker.DoUpdateResource(resource, inputValue);
  }

  /**
   * Update the displayed tracker values.
   * 
   * @private
   */
  static UpdateTracker() {
    document.getElementById('sta-track-momentum').value = STATracker.ValueOf(STATracker.Resource.Momentum);
    document.getElementById('sta-track-threat').value = STATracker.ValueOf(STATracker.Resource.Threat);
  }

  /**
   * Enable/Disable the momentum and threat +/- buttons and input fields depending on the current user's permissions.
   * 
   * @private
   */
  static ConfigureTrackerInterface() {
    if (!this.UserHasPermissionFor(STATracker.Resource.Momentum)) {
      STATracker.MomentumButtons.forEach((b) => b.style.display = 'none');
      STATracker.MomentumInput.disabled = true;
    }

    if (!this.UserHasPermissionFor(STATracker.Resource.Threat)) {
      STATracker.ThreatButtons.forEach((b) => b.style.display = 'none');
      STATracker.ThreatInput.disabled = true;
    }
  }

  /**
   * Attach the event handlers to the momentum and threat +/- buttons
   * 
   * @private
   */
  static ConfigureTrackerButtonActions() {
    $('#sta-momentum-track-decrease > .fas').click((_) => STATracker.OnAdjustTracker(STATracker.Resource.Momentum, -1));
    $('#sta-momentum-track-increase > .fas').click((_) => STATracker.OnAdjustTracker(STATracker.Resource.Momentum, +1));
    $('#sta-threat-track-decrease > .fas').click((_) => STATracker.OnAdjustTracker(STATracker.Resource.Threat, -1));
    $('#sta-threat-track-increase > .fas').click((_) => STATracker.OnAdjustTracker(STATracker.Resource.Threat, +1));
  }

  /**
   * Attach the event handler to the momentum and threat input fields
   * 
   * @private
   */
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

  /**
   * @private
   */
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
        $('.tracker-container').removeClass('hide').width('180px');
      }
    });
  }

  /**
   * @private
   */
  static ConfigureTrackerSlideWithSidebar() {
    $('.collapse').click((_) => {
      if ($('.tracker-container:not(.tracker-collapsed)')[0]) {
        $('#tracker-clickable-minus').addClass('tracker-collapsed');
        $('#tracker-clickable-plus').removeClass('tracker-collapsed');
        $('.tracker-container').addClass('tracker-collapsed').removeAttr('style');
      } else {
        $('#tracker-clickable-plus').addClass('tracker-collapsed');
        $('#tracker-clickable-minus').removeClass('tracker-collapsed');
        $('.tracker-container').addClass('tracker-collapsed').removeAttr('style');
        $('.tracker-container').removeClass('tracker-collapsed').width('180px');
      }
    });
  }

  /**
   * Process a message received on the tracker update socket.
   * 
   * @private
   * @param {STATracker.SocketMessage} message The received message.
   */
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

  /**
   * Hookup the application interactivity.
   * 
   * @param {HTMLElement} html 
   */
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
    STATracker.ConfigureTrackerSlideWithSidebar();
    STATracker.UpdateTracker();
  }
}
