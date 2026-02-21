import { Client, EmbedBuilder, TextChannel } from "discord.js";
import {
  deleteLeaderboardMessage,
  getLeaderboardMessages,
  getTopClaimers,
} from "../database/queries";
import { Colors } from "../utils/constants";

const UPDATE_INTERVAL = 10_000;
const activeIntervals = new Map<string, ReturnType<typeof setInterval>>();

function buildLeaderboardEmbed(
  guildId: string
): EmbedBuilder {
  const top = getTopClaimers(guildId, 10);
  const medals = ["🥇", "🥈", "🥉"];

  let description: string;
  if (top.length === 0) {
    description = "No tickets have been claimed yet.";
  } else {
    description = top
      .map((entry, i) => {
        const prefix = i < 3 ? medals[i] : `**${i + 1}.**`;
        return `${prefix} <@${entry.claimedBy}> — **${entry.claimCount}** ticket${entry.claimCount === 1 ? "" : "s"}`;
      })
      .join("\n");
  }

  return new EmbedBuilder()
    .setTitle("Ticket Leaderboard")
    .setDescription(description)
    .setColor(Colors.Primary)
    .setFooter({ text: "Updates every 10 seconds" })
    .setTimestamp();
}

async function updateLeaderboardMessage(
  client: Client,
  guildId: string,
  channelId: string,
  messageId: string
): Promise<boolean> {
  try {
    const channel = await client.channels.fetch(channelId) as TextChannel | null;
    if (!channel) {
      deleteLeaderboardMessage(messageId);
      return false;
    }

    const message = await channel.messages.fetch(messageId);
    const embed = buildLeaderboardEmbed(guildId);
    await message.edit({ embeds: [embed] });
    return true;
  } catch {
    deleteLeaderboardMessage(messageId);
    return false;
  }
}

export function startLeaderboardInterval(
  client: Client,
  guildId: string,
  channelId: string,
  messageId: string
): void {
  const key = messageId;

  if (activeIntervals.has(key)) {
    clearInterval(activeIntervals.get(key)!);
  }

  const interval = setInterval(async () => {
    const success = await updateLeaderboardMessage(client, guildId, channelId, messageId);
    if (!success) {
      clearInterval(interval);
      activeIntervals.delete(key);
    }
  }, UPDATE_INTERVAL);

  activeIntervals.set(key, interval);
}

export async function restoreLeaderboards(client: Client): Promise<void> {
  const messages = getLeaderboardMessages();
  for (const msg of messages) {
    const success = await updateLeaderboardMessage(
      client,
      msg.guildId,
      msg.channelId,
      msg.messageId
    );
    if (success) {
      startLeaderboardInterval(client, msg.guildId, msg.channelId, msg.messageId);
    }
  }
}

export { buildLeaderboardEmbed };
