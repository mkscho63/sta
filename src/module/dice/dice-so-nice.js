export function register_dsn_ufp_themes(dice3d) {
  [
    {
      "background": "#00a3d1",
      "category": "Star Trek Adventures",
      "description": game.i18n.localize('sta.dice.dsn.ufp.blue'),
      "edge": "#006f8f",
      "font": "FoundryVTT",
      "foreground": "#000000",
      "material": "plastic",
      "name": "sta-ufp-blue",
      "outline": "none"
    },
    {
      "background": "#f7b50c",
      "category": "Star Trek Adventures",
      "description": game.i18n.localize('sta.dice.dsn.ufp.gold'),
      "edge": "#755400",
      "font": "FoundryVTT",
      "foreground": "#000000",
      "material": "plastic",
      "name": "sta-ufp-gold",
      "outline": "none"
    },
    {
      "background": "#d62100",
      "category": "Star Trek Adventures",
      "description": game.i18n.localize('sta.dice.dsn.ufp.red'),
      "edge": "#941700",
      "font": "FoundryVTT",
      "foreground": "#000000",
      "material": "plastic",
      "name": "sta-ufp-red",
      "outline": "none"
    }
  ].forEach(colorset => dice3d.addColorset(colorset))

  dice3d.addSystem({ id: "sta-black", name: "Star Trek Adventures UFP (Black)" }, "preferred");
  dice3d.addDicePreset({
    type: "d6",
    labels: [
      "systems/sta/assets/icons/dice-so-nice/challenge_die_one_success_black.png",
      "systems/sta/assets/icons/dice-so-nice/challenge_die_two_successes_black.png",
      "systems/sta/assets/icons/dice-so-nice/challenge_die_no_success_black.png",
      "systems/sta/assets/icons/dice-so-nice/challenge_die_no_success_black.png",
      "systems/sta/assets/icons/dice-so-nice/challenge_die_effect_black.png",
      "systems/sta/assets/icons/dice-so-nice/challenge_die_effect_black.png",
    ],
    system: "sta-black",
  });
  dice3d.addDicePreset({
    type: "d20",
    labels: [
      "systems/sta/assets/icons/dice-so-nice/d20_critical_black.png",
      "2", "3", "4", "5", "6", "7", "8", "9", "10",
      "11", "12", "13", "14", "15", "16", "17", "18", "19", "20",
    ],
    system: "sta-black",
  });

  dice3d.addSystem({ id: "sta-white", name: "Star Trek Adventures UFP (White)" }, "default");
  dice3d.addDicePreset({
    type: "d6",
    labels: [
      "systems/sta/assets/icons/dice-so-nice/challenge_die_one_success_white.png",
      "systems/sta/assets/icons/dice-so-nice/challenge_die_two_successes_white.png",
      "systems/sta/assets/icons/dice-so-nice/challenge_die_no_success_white.png",
      "systems/sta/assets/icons/dice-so-nice/challenge_die_no_success_white.png",
      "systems/sta/assets/icons/dice-so-nice/challenge_die_effect_white.png",
      "systems/sta/assets/icons/dice-so-nice/challenge_die_effect_white.png",
    ],
    system: "sta-white",
  });
  dice3d.addDicePreset({
    type: "d20",
    labels: [
      "systems/sta/assets/icons/dice-so-nice/d20_critical_white.png",
      "2", "3", "4", "5", "6", "7", "8", "9", "10",
      "11", "12", "13", "14", "15", "16", "17", "18", "19", "20",
    ],
    system: "sta-white",
  });

}