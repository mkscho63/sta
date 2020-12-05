export class STATracker extends Application {

    static get defaultOptions() {
        const options = super.defaultOptions;
        options.template = "systems/FVTT-StarTrekAdventures/templates/apps/tracker.html";
        options.popOut = false;
        options.resizable = false;
        return options;
    }

    activateListeners(html) {
        let chaos = game.settings.get("FVTT-StarTrekAdventures", "chaos");
        let momentum = game.settings.get("FVTT-StarTrekAdventures", "momentum");
        renderTracker()
        this.checkUpdates();

        if (!game.user.hasRole(game.settings.get("FVTT-StarTrekAdventures", "chaosPermissionLevel"))) {
            html.find('#sta-chaos-track-decrease')[0].style.display = 'none';
            html.find('#sta-chaos-track-increase')[0].style.display = 'none';
            html.find('#sta-track-chaos')[0].disabled = true;
        }

        if (!game.user.hasRole(game.settings.get("FVTT-StarTrekAdventures", "momentumPermissionLevel"))) {
            html.find('#sta-momentum-track-decrease')[0].style.display = 'none';
            html.find('#sta-momentum-track-increase')[0].style.display = 'none';
            html.find('#sta-track-momentum')[0].disabled = true;
        }

        html.find('#sta-momentum-track-decrease').click(ev => {
            momentum = parseInt(document.getElementById("sta-track-momentum").value);
            if (momentum === 0) {
                ui.notifications.warn("You can't set Momentum to a value below 0!");
                return false;
            }
            momentum = momentum - 1;
            game.settings.set("FVTT-StarTrekAdventures", "momentum", momentum);
            renderTracker();
        });

        html.find('#sta-chaos-track-decrease').click(ev => {
            chaos = parseInt(document.getElementById("sta-track-chaos").value);
            if (chaos === 0) {
                ui.notifications.warn("You can't set Chaos to a value below 0!");
                return false;
            }
            chaos = chaos - 1;
            game.settings.set("FVTT-StarTrekAdventures", "chaos", chaos);
            renderTracker();
        });

        html.find('#sta-chaos-track-increase').click(ev => {
            if (chaos === 99999999) {
                ui.notifications.error("THERE IS TOO MUCH CHAOS!");
                return false;
            }
            chaos = parseInt(document.getElementById("sta-track-chaos").value);
            chaos = chaos + 1;
            game.settings.set("FVTT-StarTrekAdventures", "chaos", chaos);
            renderTracker();
        });

        html.find('#sta-momentum-track-increase').click(ev => {
            if (momentum === 6) {
                ui.notifications.error("THERE IS TOO MUCH MOMENTUM!");
                return false;
            }
            momentum = parseInt(document.getElementById("sta-track-momentum").value);
            momentum = momentum + 1;
            game.settings.set("FVTT-StarTrekAdventures", "momentum", momentum);
            renderTracker();
        });

        html.find('#sta-track-chaos').keydown(ev => {
            if (ev.keyCode == 13) {
                html.find('#sta-track-chaos').blur();
            }
        })

        html.find('#sta-track-momentum').keydown(ev => {
            if (ev.keyCode == 13) {
                html.find('#sta-track-momentum').blur();
            }
        })

        html.find('#sta-track-chaos').change(ev => {
            if (document.getElementById("sta-track-chaos").value < 0) {
                document.getElementById("sta-track-chaos").value = chaos;
                ui.notifications.warn("You can't set Chaos to a value below 0!");
                return false;
            }
            if (document.getElementById("sta-track-chaos").value > 99999999) {
                document.getElementById("sta-track-chaos").value = chaos;
                ui.notifications.error("THAT IS TOO MUCH CHAOS!");
                return false;
            }
            chaos = document.getElementById("sta-track-chaos").value;
            game.settings.set("FVTT-StarTrekAdventures", "chaos", chaos);
            renderTracker();
        });

        html.find('#sta-track-momentum').change(ev => {
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
            document.getElementById("sta-track-chaos").value = chaos;
            document.getElementById("sta-track-momentum").value = momentum;
        }

    }

    async checkUpdates() {
        let refreshRate = game.settings.get("FVTT-StarTrekAdventures", "trackerRefreshRate") * 1000;
        function check() {
            let chaos = document.getElementById("sta-track-chaos").value;
            let momentum = document.getElementById("sta-track-momentum").value;
            let storedChaos = game.settings.get("FVTT-StarTrekAdventures", "chaos");
            let storedMomentum = game.settings.get("FVTT-StarTrekAdventures", "momentum");

            if ($("#sta-track-chaos").is(':focus') == false) {
                if (storedChaos != chaos) {
                    document.getElementById("sta-track-chaos").value = storedChaos;
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