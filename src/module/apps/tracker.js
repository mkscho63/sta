export class STATracker extends Application {
  static get defaultOptions() {
    const options = super.defaultOptions;
    options.template = 'systems/sta/templates/apps/tracker.html';
    options.popOut = false;
    options.resizable = false;
    return options;
  }

  activateListeners(html) {
    let threat = game.settings.get('sta', 'threat');
    let momentum = game.settings.get('sta', 'momentum');
    renderTracker();
    this.checkUpdates();

    if (!game.user.hasRole(game.settings.get('sta', 'threatPermissionLevel'))) {
      html.find('#sta-threat-track-decrease')[0].style.display = 'none';
      html.find('#sta-threat-track-increase')[0].style.display = 'none';
      html.find('#sta-track-threat')[0].disabled = true;
    }

    if (!game.user.hasRole(game.settings.get('sta', 'momentumPermissionLevel'))) {
      html.find('#sta-momentum-track-decrease')[0].style.display = 'none';
      html.find('#sta-momentum-track-increase')[0].style.display = 'none';
      html.find('#sta-track-momentum')[0].disabled = true;
    }

    html.find('#sta-momentum-track-decrease > .fas').click((ev) => {
      if (!game.user.hasRole(game.settings.get('sta', 'threatPermissionLevel'))) {
        ui.notifications.error(game.i18n.localize('sta.notifications.momentuminvalidpermissions'));
        return false;
      }
      threat = game.settings.get('sta', 'threat');
      momentum = parseInt(document.getElementById('sta-track-momentum').value);
      if (momentum === 0) {
        ui.notifications.warn('You can\'t set Momentum to a value below 0!');
        return false;
      }
      momentum = momentum - 1;
      game.settings.set('sta', 'momentum', momentum);
      renderTracker();
    });

    html.find('#sta-threat-track-decrease > .fas').click((ev) => {
      if (!game.user.hasRole(game.settings.get('sta', 'threatPermissionLevel'))) {
        ui.notifications.error(game.i18n.localize('sta.notifications.threatinvalidpermissions'));
        return false;
      }
      momentum = game.settings.get('sta', 'momentum');
      threat = parseInt(document.getElementById('sta-track-threat').value);
      if (threat === 0) {
        ui.notifications.warn('You can\'t set Threat to a value below 0!');
        return false;
      }
      threat = threat - 1;
      game.settings.set('sta', 'threat', threat);
      renderTracker();
    });
    
    html.find('#sta-momentum-track-increase > .fas').click((ev) => {
      if (!game.user.hasRole(game.settings.get('sta', 'threatPermissionLevel'))) {
        ui.notifications.error(game.i18n.localize('sta.notifications.momentuminvalidpermissions'));
        return false;
      }
      threat = game.settings.get('sta', 'threat');
      if (momentum === 6) {
        ui.notifications.error('THERE IS TOO MUCH MOMENTUM!');
        return false;
      }
      momentum = parseInt(document.getElementById('sta-track-momentum').value);
      momentum = momentum + 1;
      game.settings.set('sta', 'momentum', momentum);
      renderTracker();
    });

    html.find('#sta-threat-track-increase > .fas').click((ev) => {
      if (!game.user.hasRole(game.settings.get('sta', 'threatPermissionLevel'))) {
        ui.notifications.error(game.i18n.localize('sta.notifications.threatinvalidpermissions'));
        return false;
      }
      momentum = game.settings.get('sta', 'momentum');
      if (threat === 99999999) {
        ui.notifications.error('THERE IS TOO MUCH THREAT!');
        return false;
      }
      threat = parseInt(document.getElementById('sta-track-threat').value);
      threat = threat + 1;
      game.settings.set('sta', 'threat', threat);
      renderTracker();
    });

    html.find('#sta-track-threat').keydown((ev) => {
      if (ev.keyCode == 13) {
        html.find('#sta-track-threat').blur();
      }
    });

    html.find('#sta-track-momentum').keydown((ev) => {
      if (ev.keyCode == 13) {
        html.find('#sta-track-momentum').blur();
      }
    });

    html.find('#sta-track-threat').change((ev) => {
      threat = game.settings.get('sta', 'threat');
      momentum = game.settings.get('sta', 'momentum');
      if (document.getElementById('sta-track-threat').value < 0) {
        document.getElementById('sta-track-threat').value = threat;
        ui.notifications.warn('You can\'t set Threat to a value below 0!');
        return false;
      }
      if (document.getElementById('sta-track-threat').value > 99999999) {
        document.getElementById('sta-track-threat').value = threat;
        ui.notifications.error('THAT IS TOO MUCH CHAOS!');
        return false;
      }
      threat = document.getElementById('sta-track-threat').value;
      game.settings.set('sta', 'threat', threat);
      renderTracker();
    });

    html.find('#sta-track-momentum').change((ev) => {
      threat = game.settings.get('sta', 'threat');
      momentum = game.settings.get('sta', 'momentum');
      if (document.getElementById('sta-track-momentum').value < 0) {
        document.getElementById('sta-track-momentum').value = momentum;
        ui.notifications.warn('You can\'t set Momentum to a value below 0!');
        return false;
      }
      if (document.getElementById('sta-track-momentum').value > 6) {
        document.getElementById('sta-track-momentum').value = momentum;
        ui.notifications.error('THAT IS TOO MUCH MOMENTUM!');
        return false;
      }
      momentum = document.getElementById('sta-track-momentum').value;
      game.settings.set('sta', 'momentum', momentum);
      renderTracker();
    });

    html.find('#tracker-clickable').click((ev) => {
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

    function renderTracker() {
      document.getElementById('sta-track-threat').value = threat;
      document.getElementById('sta-track-momentum').value = momentum;
    }
  }

  async checkUpdates() {
    const refreshRate = game.settings.get('sta', 'trackerRefreshRate') * 1000;
    function check() {
      const threat = document.getElementById('sta-track-threat').value;
      const momentum = document.getElementById('sta-track-momentum').value;
      const storedThreat = game.settings.get('sta', 'threat');
      const storedMomentum = game.settings.get('sta', 'momentum');

      if ($('#sta-track-threat').is(':focus') == false) {
        if (storedThreat != threat) {
          document.getElementById('sta-track-threat').value = storedThreat;
        }
      }
      if ($('#sta-track-momentum').is(':focus') == false) {
        if (storedMomentum != momentum) {
          document.getElementById('sta-track-momentum').value = storedMomentum;
        }
      }
      setTimeout(check, refreshRate);
    }
    check();
  }
}
