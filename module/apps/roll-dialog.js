export class STARollDialog {

    static async create() {
        // Grab the RollDialog HTML file/
        const html = await renderTemplate("systems/FVTT-StarTrekAdventures/templates/apps/dicepool.html");
        // Create a new promise for the HTML above.
        return new Promise((resolve) => {
            let formData = null;
            // Create a new dialog.
            const dlg = new Dialog({
                title: game.i18n.localize('sta.apps.dicepoolwindow'),
                content: html,
                buttons: {
                    roll: {
                        label: game.i18n.localize('sta.apps.rolldice'),
                        callback: html => {
                            formData = new FormData(html[0].querySelector("#dice-pool-form"));
                            return resolve(formData);
                        }
                    }
                },
                default: "roll",
                close: () => {}
            });
            // Render the dialog
            dlg.render(true);
        });
    }
}