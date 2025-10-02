module.exports = {
  name: "roll",
  description: "Lance un dé 🎲",
  async execute(client, message) {
    const number = Math.floor(Math.random() * 6) + 1;
    message.reply(`🎲 Tu as fait un **${number}** !`);
  }
};
