import {
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  RESTPostAPIChatInputApplicationCommandsJSONBody,
  SharedSlashCommand,
} from "discord.js";
import * as ticketConfig from "./ticketConfig";
import * as ticketSend from "./ticketSend";
import * as ticketLeaderboard from "./ticketLeaderboard";
import * as help from "./help";

export interface CommandEntry {
  data: SharedSlashCommand;
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
  category: string;
  adminOnly: boolean;
}

function resolveCategory(name: string): string {
  if (name === "help") return "General";
  if (name.startsWith("ticket-config")) return "Configuration";
  if (name.startsWith("ticket-")) return "Tickets";
  return "General";
}

function resolveAdminOnly(builder: SharedSlashCommand): boolean {
  const json = builder.toJSON();
  const perms = json.default_member_permissions;
  if (!perms) return false;
  return (
    BigInt(perms) & PermissionFlagsBits.Administrator
  ) === PermissionFlagsBits.Administrator;
}

function createEntry(
  mod: {
    data: SharedSlashCommand;
    execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
  },
  categoryOverride?: string
): CommandEntry {
  const json = mod.data.toJSON();
  return {
    data: mod.data,
    execute: mod.execute,
    category: categoryOverride ?? resolveCategory(json.name),
    adminOnly: resolveAdminOnly(mod.data),
  };
}

const commands: CommandEntry[] = [
  createEntry(help, "General"),
  createEntry(ticketConfig, "Configuration"),
  createEntry(ticketSend, "Tickets"),
  createEntry(ticketLeaderboard, "Tickets"),
];

export function getCommands(): CommandEntry[] {
  return commands;
}

export function getCommandByName(name: string): CommandEntry | undefined {
  return commands.find((c) => c.data.toJSON().name === name);
}

export function getCommandsJson(): RESTPostAPIChatInputApplicationCommandsJSONBody[] {
  return commands.map((c) => c.data.toJSON());
}
