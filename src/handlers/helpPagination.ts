import { ButtonInteraction, GuildMember } from "discord.js";
import { HelpService, HelpButtonIds } from "../services/helpService";

const pageState = new Map<string, number>();

const CLEANUP_INTERVAL = 10 * 60 * 1000;
setInterval(() => {
  pageState.clear();
}, CLEANUP_INTERVAL);

function getStateKey(interaction: ButtonInteraction): string {
  return `${interaction.user.id}:${interaction.message.id}`;
}

export async function handleHelpNavigation(
  interaction: ButtonInteraction
): Promise<void> {
  const key = getStateKey(interaction);
  const member = interaction.member as GuildMember;
  const service = new HelpService(interaction.client, member);
  const totalPages = service.getTotalPages();

  let currentPage = pageState.get(key) ?? 0;

  switch (interaction.customId) {
    case HelpButtonIds.Previous:
      currentPage = Math.max(0, currentPage - 1);
      break;
    case HelpButtonIds.Home:
      currentPage = 0;
      break;
    case HelpButtonIds.Next:
      currentPage = Math.min(totalPages - 1, currentPage + 1);
      break;
  }

  pageState.set(key, currentPage);

  const embed = service.getPage(currentPage);
  const row = HelpService.buildNavigationRow(currentPage, totalPages);

  await interaction.update({
    embeds: [embed],
    components: [row],
  });
}
