import { Client, GatewayIntentBits } from "discord.js";
import dotenv from "dotenv";
import { getDatabase } from "./database/connection";
import { handleInteraction } from "./handlers/interactionRouter";
import { restoreLeaderboards } from "./services/leaderboardService";
import { printStartup } from "./utils/console";

dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

client.once("clientReady", async () => {
  getDatabase();
  printStartup(client);
  await restoreLeaderboards(client);
});

client.on("interactionCreate", handleInteraction);

client.login(process.env.DISCORD_TOKEN);
