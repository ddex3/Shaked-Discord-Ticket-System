import {
  ChatInputCommandInteraction,
  GuildMember,
  MessageFlags,
  SlashCommandBuilder,
} from "discord.js";
import { HelpService } from "../services/helpService";

export const data = new SlashCommandBuilder()
  .setName("help")
  .setDescription("View all available commands and bot information");

export async function execute(
  interaction: ChatInputCommandInteraction
): Promise<void> {
  const member = interaction.member as GuildMember;
  const service = new HelpService(interaction.client, member);

  const embed = service.getPage(0);
  const row = HelpService.buildNavigationRow(0, service.getTotalPages());

  await interaction.reply({
    embeds: [embed],
    components: [row],
    flags: MessageFlags.Ephemeral,
  });
}
