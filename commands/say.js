module.exports = {
  name: "say",
  description: "Fait parler le bot",
  async execute(client, message, args) {
    if (!args.length) return message.reply("❌ Tu dois écrire un texte !");
    const text = args.join(" ");
    await message.delete().catch(() => {});
    message.channel.send(text);
  }
};
