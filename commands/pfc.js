const { ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, EmbedBuilder } = require("discord.js");

module.exports = {
  name: "pfc",
  description: "Joue à pierre-feuille-ciseaux contre un membre (optionnel : nombre de manches)",
  async execute(client, message, args) {
    const opponent = message.mentions.members.first();
    if (!opponent || opponent.id === message.author.id) {
      return message.reply("❌ Mentionne un membre valide pour jouer contre toi !");
    }

    // Nombre de manches (optionnel)
    const manches = parseInt(args[1]) || 1;
    if (manches < 1 || manches > 10) return message.reply("❌ Tu peux jouer entre 1 et 10 manches.");

    const choices = ["pierre", "feuille", "ciseaux"];
    const createButtons = (disabled = false) =>
      new ActionRowBuilder().addComponents(
        choices.map(c => new ButtonBuilder()
          .setCustomId(c)
          .setLabel(c.charAt(0).toUpperCase() + c.slice(1))
          .setStyle(ButtonStyle.Primary)
          .setDisabled(disabled)
        )
      );

    let score = {
      [message.author.id]: 0,
      [opponent.id]: 0,
      tie: 0
    };

    let manche = 1;

    async function playManche() {
      if (manche > manches) {
        // Fin du jeu
        let resultText;
        if (score[message.author.id] > score[opponent.id]) resultText = `🏆 ${message.author} remporte la partie !`;
        else if (score[message.author.id] < score[opponent.id]) resultText = `🏆 ${opponent} remporte la partie !`;
        else resultText = "⚖️ La partie se termine sur une égalité !";

        const embed = new EmbedBuilder()
          .setTitle("🎮 Pierre-Feuille-Ciseaux - Résultat Final")
          .setDescription(
            `${message.author} : **${score[message.author.id]}** victoires\n` +
            `${opponent} : **${score[opponent.id]}** victoires\n` +
            `Égalités : **${score.tie}**\n\n${resultText}`
          )
          .setColor(0x5865F2)
          .setTimestamp();

        return message.channel.send({ embeds: [embed] });
      }

      // Messages pour chaque joueur
      const player1Msg = await message.reply({
        content: `🎮 Manche ${manche} - ${message.author}, choisis ton coup !`,
        components: [createButtons()]
      });

      const player2Msg = await message.channel.send({
        content: `🎮 Manche ${manche} - ${opponent}, choisis ton coup !`,
        components: [createButtons()]
      });

      const selections = {};
      const filter = i => i.user.id === message.author.id || i.user.id === opponent.id;

      const collector = message.channel.createMessageComponentCollector({
        filter,
        componentType: ComponentType.Button,
        time: 60000
      });

      collector.on("collect", async i => {
        await i.deferUpdate();
        selections[i.user.id] = i.customId;

        if (i.user.id === message.author.id) await player1Msg.edit({ components: [createButtons(true)] });
        else await player2Msg.edit({ components: [createButtons(true)] });

        if (selections[message.author.id] && selections[opponent.id]) {
          collector.stop();

          const p1Choice = selections[message.author.id];
          const p2Choice = selections[opponent.id];

          // Détermine le gagnant de la manche
          let mancheResult;
          if (p1Choice === p2Choice) {
            mancheResult = "⚖️ Égalité !";
            score.tie++;
          } else if (
            (p1Choice === "pierre" && p2Choice === "ciseaux") ||
            (p1Choice === "feuille" && p2Choice === "pierre") ||
            (p1Choice === "ciseaux" && p2Choice === "feuille")
          ) {
            mancheResult = `🏆 ${message.author} gagne la manche !`;
            score[message.author.id]++;
          } else {
            mancheResult = `🏆 ${opponent} gagne la manche !`;
            score[opponent.id]++;
          }

          // Embed de la manche
          const embed = new EmbedBuilder()
            .setTitle(`🎮 Manche ${manche}`)
            .setDescription(
              `${message.author} a choisi **${p1Choice}**\n` +
              `${opponent} a choisi **${p2Choice}**\n${mancheResult}`
            )
            .setColor(0x5865F2)
            .setTimestamp();

          message.channel.send({ embeds: [embed] });
          manche++;
          setTimeout(playManche, 1000); // Lancer la manche suivante après 1s
        }
      });

      collector.on("end", collected => {
        if (!selections[message.author.id] || !selections[opponent.id]) {
          message.channel.send("❌ La partie a été annulée (temps écoulé).");
          player1Msg.edit({ components: [createButtons(true)] });
          player2Msg.edit({ components: [createButtons(true)] });
        }
      });
    }

    // Lancer la première manche
    playManche();
  }
};
