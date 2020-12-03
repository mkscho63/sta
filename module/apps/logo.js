export class DishonoredLogo extends Application {

    static get defaultOptions() {
        const options = super.defaultOptions;
        options.template = "systems/FVTT-StarTrekAdventures/templates/apps/logo.html";
        options.popOut = false;
        options.resizable = false;
        return options;
    }

    activateListeners(html) {
        html[0].href += game.system.data.version;
        html.find('#dishonored-logo-verID')[0].innerHTML = game.system.data.version;
    }
}

