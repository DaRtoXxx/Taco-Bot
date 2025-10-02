const fs = require("fs");
const express = require("express");
const {
  Client,
  GatewayIntentBits,
  PermissionsBitField,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType
} = require("discord.js");
require("dotenv").config();

const prefix = "!";
const allowedUsers = ["965998238282948630", "1208512644622065777", "987430969772507206"];
const configPath = "./ticketConfig.json";

// Charger ou créer la config
let ticketConfig = { logChannelId: null };
if (fs.existsSync(configPath)) {
  ticketConfig = JSON.parse(fs.readFileSync(configPath, "utf8"));
} else {
  fs.writeFileSync(configPath, JSON.stringify(ticketConfig, null, 2));
}

// Création du client Discord
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.DirectMessages
  ],
  partials: ["CHANNEL"]
});

// Serveur express pour keep-alive
const app = express();
app.get("/", (req, res) => res.send("Bot en ligne"));
app.listen(process.env.PORT || 3000, () => console.log("Bot en ligne"));

// Map pour stocker les messages des tickets
const ticketMessages = new Map();

// -------------------- CHARGEMENT DES COMMANDES --------------------
client.commands = new Map();
const commandFiles = fs.readdirSync("./commands").filter(f => f.endsWith(".js"));
for (const file of commandFiles) {
  const cmd = require(`./commands/${file}`);
  client.commands.set(cmd.name, cmd);
}

// -------------------- READY --------------------
client.once("ready", () => {
  console.log(`✅ Connecté en tant que ${client.user.tag}`);
});

// -------------------- MESSAGE CREATE --------------------
client.on("messageCreate", async (message) => {
  if (message.author.bot || !message.guild || !message.content.startsWith(prefix)) return;

  const args = message.content.slice(prefix.length).trim().split(/\s+/);
  const commandName = args.shift().toLowerCase();

  // -------------------- EXECUTION DES COMMANDES --------------------
  const command = client.commands.get(commandName);
  if (command) {
    try {
      await command.execute(client, message, args, { allowedUsers, ticketConfig, configPath, prefix });
    } catch (err) {
      console.error(`Erreur commande ${commandName}:`, err);
      message.reply("❌ Une erreur est survenue lors de l'exécution de la commande.");
    }
  }

  // -------------------- ENREGISTREMENT DES MESSAGES DE TICKET --------------------
  if (message.channel.name?.startsWith("ticket-") && !message.author.bot) {
    if (!ticketMessages.has(message.channel.id)) ticketMessages.set(message.channel.id, []);
    const arr = ticketMessages.get(message.channel.id);

    const lastMsg = arr[arr.length - 1];
    if (lastMsg && lastMsg.authorId === message.author.id && lastMsg.content === message.content) return;

    arr.push({
      authorTag: message.author.tag,
      authorId: message.author.id,
      content: message.content,
      timestamp: new Date()
    });
  }
});

// -------------------- LOGIN --------------------
client.login(process.env.TOKEN);
