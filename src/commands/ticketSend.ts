import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder,
  TextChannel,
} from "discord.js";
import { isGuildConfigured } from "../database/queries";
import { buildTicketPanelEmbed, buildTicketPanelRow } from "../utils/embeds";
import { Colors } from "../utils/constants";

export const data = new SlashCommandBuilder()
  .setName("ticket-send")
  .setDescription("Send the ticket panel embed")
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(
  interaction: ChatInputCommandInteraction
): Promise<void> {
  const guildId = interaction.guildId!;

  if (!isGuildConfigured(guildId)) {
    const embed = new EmbedBuilder()
      .setDescription(
        "__**The ticket system is not fully configured.**__\n\n" +
          "Use `/ticket-config view` to see which values are missing.\n" +
          "All required configuration values must be set before using this command."
      )
      .setColor(Colors.Danger);

    await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    return;
  }

  const panelEmbed = buildTicketPanelEmbed();
  const row = buildTicketPanelRow();

  await (interaction.channel as TextChannel).send({ embeds: [panelEmbed], components: [row] });
  await interaction.reply({
    content: "Ticket panel has been sent to this channel.",
    flags: MessageFlags.Ephemeral,
  });
}
