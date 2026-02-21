import {
  ChatInputCommandInteraction,
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder,
  TextChannel,
} from "discord.js";
import { saveLeaderboardMessage } from "../database/queries";
import {
  buildLeaderboardEmbed,
  startLeaderboardInterval,
} from "../services/leaderboardService";

export const data = new SlashCommandBuilder()
  .setName("ticket-leaderboard")
  .setDescription("Send a live-updating ticket claims leaderboard")
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(
  interaction: ChatInputCommandInteraction
): Promise<void> {
  const guildId = interaction.guildId!;
  const channel = interaction.channel as TextChannel;

  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const embed = buildLeaderboardEmbed(guildId);
  const message = await channel.send({ embeds: [embed] });

  saveLeaderboardMessage(guildId, channel.id, message.id);
  startLeaderboardInterval(interaction.client, guildId, channel.id, message.id);

  await interaction.editReply({
    content: "Leaderboard has been sent and will update every 10 seconds.",
  });
}
