export class STATracker extends Application {
  /**
   * The name of the communication socket used to update the tracker information.
   * 
   * @private
   * @readonly
   * @constant {string}
   */
  static UPDATE_SOCKET_NAME = "system.sta";

  /**
   * An enumeration to identify different messages transmitted on the tracker update socket.
   * 
   * @private
   * @readonly
   * @enum {string}
   */
  static MessageType = {
    /** Signal that a resource shall be set to the specified value */
    SetResource: "set-resource",
    /** Signal that the resource tracker shall be re-rendered to reflect to current resource values */
    UpdateResource: "update-resource",
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
    Momentum: "momentum",
    /** The threat resource */
    Threat: "threat",
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
  }

  /**
   * The default settings of this application.
   * 
   * @public
   * @readonly
   * @property {object}
   */
  static get defaultOptions() {
    const options = super.defaultOptions;
    options.template = 'systems/sta/templates/apps/tracker.html';
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
   * @returns {6|99999999}
   */
  static LimitOf(resource) {
    return resource == STATracker.Resource.Momentum ? 6 : 99999999;
  }

  /**
   * Get the current value of the given resource
   * 
   * @private
   * @param {STATracker.Resource} resource The resource to query the value of.
   * @returns {number} The current value of the given resource
   */
  static ValueOf(resource) {
    return game.settings.get("sta", resource);
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
   * @returns {true|false} true iff. the current user is allowed to modify the given resource, false otherwise.
   */
  static UserHasPermissionFor(resource) {
    let requiredLevel = game.settings.get("sta", `${resource}PermissionLevel`);
    return game.user.hasRole(requiredLevel);
  }

  /**
   * Check if the user has permission to write settings.
   * 
   * @returns {true|false} true iff. the current user is allowed to write settings.
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
  static async DoUpdateResource(resource, value) {
    if (!STATracker.UserHasPermissionFor(resource)) {
      ui.notifications.error(game.i18n.localize(`sta.notifications.${resource}InvalidPermissions`));
      return;
    } else if (value < 0) {
      ui.notifications.warn(game.i18n.localize(`sta.notifications.${resource}Negative`));
      STATracker.UpdateTracker()
      return;
    } else if (value > STATracker.LimitOf(resource)) {
      ui.notifications.warn(game.i18n.localize(`sta.notifications.${resource}TooGreat`));
      STATracker.UpdateTracker()
      return;
    }

    if(STATracker.UserCanWriteSettings()) {
      await game.settings.set('sta', resource, value);
      STATracker.SendUpdateMessage(STATracker.MessageType.UpdateResource);
      STATracker.UpdateTracker();
    }
    else
    {
      STATracker.SendUpdateMessage(STATracker.MessageType.SetResource, resource, value);
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
    let inputValue = Number.parseInt(document.getElementById(`sta-track-${resource}`).value);
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
      STATracker.MomentumButtons.forEach(b => b.style.display = "none");
      STATracker.MomentumInput.disabled = true;
    }

    if (!this.UserHasPermissionFor(STATracker.Resource.Threat)) {
      STATracker.ThreatButtons.forEach(b => b.style.display = "none");
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
        $('.tracker-container').removeClass('hide').width('200px')
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
    )
    STATracker.MomentumInput = html.find('#sta-track-momentum')[0];

    STATracker.ThreatButtons.push(
      html.find('#sta-threat-track-decrease')[0],
      html.find('#sta-threat-track-increase')[0]
    )
    STATracker.ThreatInput = html.find('#sta-track-threat')[0];

    game.socket.on(STATracker.UPDATE_SOCKET_NAME, STATracker.OnSocketData);

    STATracker.ConfigureTrackerInterface();
    STATracker.ConfigureTrackerButtonActions();
    STATracker.ConfigureTrackerInputActions();
    STATracker.ConfigureTrackerToggleAction();
    STATracker.UpdateTracker();
  }
}
