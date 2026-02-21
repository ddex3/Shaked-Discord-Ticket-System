import {
  ActionRowBuilder,
  ButtonInteraction,
  EmbedBuilder,
  MessageFlags,
  ModalBuilder,
  ModalSubmitInteraction,
  TextChannel,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js";
import {
  claimTicket,
  getGuildConfig,
  getTicketByChannel,
  updateTicketStatus,
} from "../database/queries";
import { TicketStatus } from "../types";
import { isStaff } from "../utils/permissions";
import { Colors, ModalIds } from "../utils/constants";
import {
  buildStaffControlPanel,
  buildTicketEmbed,
  buildTicketActionRows,
} from "../utils/embeds";
import { logTicketClose } from "../utils/logger";
import { generateTranscript } from "./transcripts";

export async function handleClaim(
  interaction: ButtonInteraction
): Promise<void> {
  const ticket = getTicketByChannel(interaction.channelId);
  if (!ticket) {
    await interaction.reply({
      content: "This ticket could not be found.",
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  const member = interaction.guild!.members.cache.get(interaction.user.id);
  if (!member || !isStaff(member)) {
    await interaction.reply({
      content: "Only staff members can claim tickets.",
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  if (ticket.claimedBy) {
    await interaction.reply({
      content: `This ticket is already claimed by <@${ticket.claimedBy}>.`,
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  claimTicket(ticket.id, interaction.user.id);

  const updatedTicket = { ...ticket, claimedBy: interaction.user.id, status: TicketStatus.Claimed };
  const channelName = (interaction.channel as TextChannel).name;
  const embed = buildTicketEmbed(updatedTicket, channelName);
  const rows = buildTicketActionRows(interaction.user.username);

  await interaction.update({ embeds: [embed], components: rows });

  await interaction.message.reply({
    content: `This ticket has been claimed by <@${interaction.user.id}>.`,
  });
}

export async function handleClose(
  interaction: ButtonInteraction
): Promise<void> {
  const ticket = getTicketByChannel(interaction.channelId);
  if (!ticket) {
    await interaction.reply({
      content: "This ticket could not be found.",
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  const member = interaction.guild!.members.cache.get(interaction.user.id);
  const allowed =
    interaction.user.id === ticket.userId || (member && isStaff(member));

  if (!allowed) {
    await interaction.reply({
      content: "You do not have permission to close this ticket.",
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  const modal = new ModalBuilder()
    .setCustomId(ModalIds.CloseTicket)
    .setTitle("Close Ticket")
    .addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId("close_reason")
          .setLabel("Reason for closing")
          .setStyle(TextInputStyle.Short)
          .setPlaceholder("Enter the reason for closing this ticket...")
          .setMaxLength(1000)
          .setRequired(true)
      )
    );

  await interaction.showModal(modal);
}

export async function handleCloseSubmit(
  interaction: ModalSubmitInteraction
): Promise<void> {
  if (!interaction.channelId) return;

  const ticket = getTicketByChannel(interaction.channelId);
  if (!ticket) {
    await interaction.reply({
      content: "This ticket could not be found.",
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  await interaction.deferUpdate();

  const closeReason = interaction.fields.getTextInputValue("close_reason");
  const channelName = (interaction.channel as TextChannel).name;

  updateTicketStatus(ticket.id, TicketStatus.Closed);

  const config = getGuildConfig(interaction.guildId!);
  let transcriptUrl: string | null = null;

  if (config?.transcriptsChannelId) {
    transcriptUrl = await generateTranscript(
      interaction,
      ticket,
      config.transcriptsChannelId
    );
  }

  await logTicketClose(interaction.client, interaction.guildId!, {
    ticket,
    channelName,
    closeReason,
    closedBy: interaction.user.id,
    transcriptUrl,
  });

  await (interaction.channel as TextChannel).send({
    embeds: [
      new EmbedBuilder()
        .setDescription(
          "This ticket has been closed. The channel will be removed in 5 seconds."
        )
        .setColor(Colors.Danger),
    ],
  });

  setTimeout(async () => {
    try {
      await (interaction.channel as TextChannel).delete();
    } catch {
    }
  }, 5000);
}

export async function handleStaffOptions(
  interaction: ButtonInteraction
): Promise<void> {
  const ticket = getTicketByChannel(interaction.channelId);
  if (!ticket) {
    await interaction.reply({
      content: "This ticket could not be found.",
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  const member = interaction.guild!.members.cache.get(interaction.user.id);
  if (!member || !isStaff(member)) {
    await interaction.reply({
      content: "Only staff members can access staff options.",
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  const rows = buildStaffControlPanel();
  const embed = new EmbedBuilder()
    .setTitle("Staff Control Panel")
    .setDescription(`${(interaction.channel as TextChannel).name} - select an action below.`)
    .setColor(Colors.Primary);

  await interaction.reply({
    embeds: [embed],
    components: rows,
    flags: MessageFlags.Ephemeral,
  });
}
