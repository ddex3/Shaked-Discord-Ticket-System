import { REST, Routes } from "discord.js";
import dotenv from "dotenv";
import { getCommandsJson } from "./commands/registry";
import {
  printDeployHeader,
  printDeployProgress,
  printDeploySuccess,
  printDeployError,
} from "./utils/console";

dotenv.config();

const commands = getCommandsJson();

const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN!);

(async () => {
  printDeployHeader();
  printDeployProgress(commands.length);

  try {
    const scope = process.env.GUILD_ID ? "guild" : "global";

    if (process.env.GUILD_ID) {
      await rest.put(
        Routes.applicationGuildCommands(
          process.env.CLIENT_ID!,
          process.env.GUILD_ID
        ),
        { body: commands }
      );
    } else {
      await rest.put(Routes.applicationCommands(process.env.CLIENT_ID!), {
        body: commands,
      });
    }

    printDeploySuccess(commands.length, scope);
  } catch (error) {
    printDeployError(error);
  }
})();
