import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
} from "discord.js";
import { Ticket, TicketPriority, TicketStatus } from "../types";
import {
  ButtonIds,
  Colors,
  PriorityLabels,
  SelectMenuIds,
  StatusLabels,
} from "./constants";

export function buildTicketPanelEmbed(): EmbedBuilder {
  return new EmbedBuilder()
    .setTitle("Support Tickets")
    .setDescription(
      "If you need assistance, open a ticket using the button below.\n\n" +
        "A staff member will respond as soon as one is available."
    )
    .setColor(Colors.Primary)
    .setFooter({ text: "Ticket System" })
    .setTimestamp();
}

export function buildTicketPanelRow(): ActionRowBuilder<ButtonBuilder> {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(ButtonIds.OpenTicket)
      .setLabel("Open Ticket")
      .setStyle(ButtonStyle.Primary)
  );
}

export function buildTicketEmbed(ticket: Ticket, channelName: string): EmbedBuilder {
  const priorityLabel = PriorityLabels[ticket.priority] ?? "Low";
  const statusLabel = StatusLabels[ticket.status] ?? "Open";

  return new EmbedBuilder()
    .setTitle(channelName)
    .setDescription("A staff member will be with you shortly.")
    .addFields(
      {
        name: "Status",
        value: statusLabel,
        inline: true,
      },
      {
        name: "Priority",
        value: priorityLabel,
        inline: true,
      },
      {
        name: "Created By",
        value: `<@${ticket.userId}>`,
        inline: true,
      },
      {
        name: "Claimed By",
        value: ticket.claimedBy ? `<@${ticket.claimedBy}>` : "Unclaimed",
        inline: true,
      }
    )
    .setColor(
      ticket.status === TicketStatus.Escalated
        ? Colors.Escalated
        : ticket.status === TicketStatus.Claimed
          ? Colors.Success
          : Colors.Primary
    )
    .setTimestamp();
}

export function buildTicketActionRows(claimedByName?: string): ActionRowBuilder<ButtonBuilder>[] {
  const claimButton = new ButtonBuilder()
    .setCustomId(ButtonIds.ClaimTicket)
    .setStyle(ButtonStyle.Success);

  if (claimedByName) {
    claimButton.setLabel(`Claimed by ${claimedByName}`).setDisabled(true);
  } else {
    claimButton.setLabel("Claim");
  }

  const primaryRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    claimButton,
    new ButtonBuilder()
      .setCustomId(ButtonIds.CloseTicket)
      .setLabel("Close Ticket")
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId(ButtonIds.StaffOptions)
      .setLabel("Staff Options")
      .setStyle(ButtonStyle.Secondary)
  );

  return [primaryRow];
}

export function buildStaffControlPanel(): ActionRowBuilder<ButtonBuilder>[] {
  const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(ButtonIds.RenameTicket)
      .setLabel("Rename")
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(ButtonIds.SendTranscript)
      .setLabel("Transcript")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId(ButtonIds.AddUser)
      .setLabel("Add User")
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(ButtonIds.RemoveUser)
      .setLabel("Remove User")
      .setStyle(ButtonStyle.Danger)
  );

  const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(ButtonIds.ChangePriority)
      .setLabel("Priority")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId(ButtonIds.EscalateTicket)
      .setLabel("Escalate")
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId(ButtonIds.ViewNotes)
      .setLabel("View Notes")
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(ButtonIds.AddNote)
      .setLabel("Add Note")
      .setStyle(ButtonStyle.Success)
  );

  return [row1, row2];
}

export function buildPrioritySelect(): ActionRowBuilder<StringSelectMenuBuilder> {
  return new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId(SelectMenuIds.Priority)
      .setPlaceholder("Select priority")
      .addOptions(
        new StringSelectMenuOptionBuilder()
          .setLabel("Low")
          .setValue(TicketPriority.Low)
          .setDescription("Non-urgent, can be addressed later"),
        new StringSelectMenuOptionBuilder()
          .setLabel("Medium")
          .setValue(TicketPriority.Medium)
          .setDescription("Standard priority"),
        new StringSelectMenuOptionBuilder()
          .setLabel("High")
          .setValue(TicketPriority.High)
          .setDescription("Important, should be handled soon"),
        new StringSelectMenuOptionBuilder()
          .setLabel("Urgent")
          .setValue(TicketPriority.Urgent)
          .setDescription("Requires immediate action")
      )
  );
}


