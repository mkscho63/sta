export class STATracker extends Application {

    static get defaultOptions() {
        const options = super.defaultOptions;
        options.template = "systems/FVTT-StarTrekAdventures/templates/apps/tracker.html";
        options.popOut = false;
        options.resizable = false;
        return options;
    }

    activateListeners(html) {
        var threat = game.settings.get("FVTT-StarTrekAdventures", "threat");
        var momentum = game.settings.get("FVTT-StarTrekAdventures", "momentum");
        renderTracker()
        this.checkUpdates();

        if (!game.user.hasRole(game.settings.get("FVTT-StarTrekAdventures", "threatPermissionLevel"))) {
            html.find('#sta-threat-track-decrease')[0].style.display = 'none';
            html.find('#sta-threat-track-increase')[0].style.display = 'none';
            html.find('#sta-track-threat')[0].disabled = true;
        }

        if (!game.user.hasRole(game.settings.get("FVTT-StarTrekAdventures", "momentumPermissionLevel"))) {
            html.find('#sta-momentum-track-decrease')[0].style.display = 'none';
            html.find('#sta-momentum-track-increase')[0].style.display = 'none';
            html.find('#sta-track-momentum')[0].disabled = true;
        }

        html.find('#sta-momentum-track-decrease').click(ev => {
            threat = game.settings.get("FVTT-StarTrekAdventures", "threat");
            momentum = parseInt(document.getElementById("sta-track-momentum").value);
            if (momentum === 0) {
                ui.notifications.warn("You can't set Momentum to a value below 0!");
                return false;
            }
            momentum = momentum - 1;
            game.settings.set("FVTT-StarTrekAdventures", "momentum", momentum);
            renderTracker();
        });

        html.find('#sta-threat-track-decrease').click(ev => {
            momentum = game.settings.get("FVTT-StarTrekAdventures", "momentum");
            threat = parseInt(document.getElementById("sta-track-threat").value);
            if (threat === 0) {
                ui.notifications.warn("You can't set Threat to a value below 0!");
                return false;
            }
            threat = threat - 1;
            game.settings.set("FVTT-StarTrekAdventures", "threat", threat);
            renderTracker();
        });

        html.find('#sta-threat-track-increase').click(ev => {
            momentum = game.settings.get("FVTT-StarTrekAdventures", "momentum");
            if (threat === 99999999) {
                ui.notifications.error("THERE IS TOO MUCH THREAT!");
                return false;
            }
            threat = parseInt(document.getElementById("sta-track-threat").value);
            threat = threat + 1;
            game.settings.set("FVTT-StarTrekAdventures", "threat", threat);
            renderTracker();
        });

        html.find('#sta-momentum-track-increase').click(ev => {
            threat = game.settings.get("FVTT-StarTrekAdventures", "threat");
            if (momentum === 6) {
                ui.notifications.error("THERE IS TOO MUCH MOMENTUM!");
                return false;
            }
            momentum = parseInt(document.getElementById("sta-track-momentum").value);
            momentum = momentum + 1;
            game.settings.set("FVTT-StarTrekAdventures", "momentum", momentum);
            renderTracker();
        });

        html.find('#sta-track-threat').keydown(ev => {
            if (ev.keyCode == 13) {
                html.find('#sta-track-threat').blur();
            }
        })

        html.find('#sta-track-momentum').keydown(ev => {
            if (ev.keyCode == 13) {
                html.find('#sta-track-momentum').blur();
            }
        })

        html.find('#sta-track-threat').change(ev => {
            threat = game.settings.get("FVTT-StarTrekAdventures", "threat");
            momentum = game.settings.get("FVTT-StarTrekAdventures", "momentum");
            if (document.getElementById("sta-track-threat").value < 0) {
                document.getElementById("sta-track-threat").value = threat;
                ui.notifications.warn("You can't set Threat to a value below 0!");
                return false;
            }
            if (document.getElementById("sta-track-threat").value > 99999999) {
                document.getElementById("sta-track-threat").value = threat;
                ui.notifications.error("THAT IS TOO MUCH CHAOS!");
                return false;
            }
            threat = document.getElementById("sta-track-threat").value;
            game.settings.set("FVTT-StarTrekAdventures", "threat", threat);
            renderTracker();
        });

        html.find('#sta-track-momentum').change(ev => {
        threat = game.settings.get("FVTT-StarTrekAdventures", "threat");
        momentum = game.settings.get("FVTT-StarTrekAdventures", "momentum");
            if (document.getElementById("sta-track-momentum").value < 0) {
                document.getElementById("sta-track-momentum").value = momentum;
                ui.notifications.warn("You can't set Momentum to a value below 0!");
                return false;
            }
            if (document.getElementById("sta-track-momentum").value > 6) {
                document.getElementById("sta-track-momentum").value = momentum;
                ui.notifications.error("THAT IS TOO MUCH MOMENTUM!");
                return false;
            }
            momentum = document.getElementById("sta-track-momentum").value;
            game.settings.set("FVTT-StarTrekAdventures", "momentum", momentum);
            renderTracker();
        });

        function renderTracker() {
            document.getElementById("sta-track-threat").value = threat;
            document.getElementById("sta-track-momentum").value = momentum;
        }

    }

    async checkUpdates() {
        let refreshRate = game.settings.get("FVTT-StarTrekAdventures", "trackerRefreshRate") * 1000;
        function check() {
            let threat = document.getElementById("sta-track-threat").value;
            let momentum = document.getElementById("sta-track-momentum").value;
            let storedThreat = game.settings.get("FVTT-StarTrekAdventures", "threat");
            let storedMomentum = game.settings.get("FVTT-StarTrekAdventures", "momentum");

            if ($("#sta-track-threat").is(':focus') == false) {
                if (storedThreat != threat) {
                    document.getElementById("sta-track-threat").value = storedThreat;
                }
            }
            if ($("#sta-track-momentum").is(':focus') == false) {
                if (storedMomentum != momentum) {
                    document.getElementById("sta-track-momentum").value = storedMomentum;
                }
            }
            setTimeout(check, refreshRate);
        }
        check();
    }
}