import {
  ActionRowBuilder,
  ButtonInteraction,
  EmbedBuilder,
  MessageFlags,
  ModalBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuInteraction,
  StringSelectMenuOptionBuilder,
  TextChannel,
  TextInputBuilder,
  TextInputStyle,
  ModalSubmitInteraction,
  UserSelectMenuBuilder,
  UserSelectMenuInteraction,
} from "discord.js";
import {
  addStaffNote,
  getGuildConfig,
  getStaffNotes,
  getTicketByChannel,
  getTicketById,
  updateTicketPriority,
  updateTicketStatus,
} from "../database/queries";
import { TicketPriority, TicketStatus } from "../types";
import { isStaff } from "../utils/permissions";
import { Colors, ModalIds, PriorityLabels, SelectMenuIds } from "../utils/constants";
import {
  buildPrioritySelect,
  buildTicketEmbed,
  buildTicketActionRows,
} from "../utils/embeds";
async function refreshTicketEmbed(
  interaction: ButtonInteraction | StringSelectMenuInteraction | ModalSubmitInteraction,
  ticketId: number
): Promise<void> {
  const ticket = getTicketById(ticketId);
  if (!ticket) return;

  const channel = interaction.channel as TextChannel;
  const messages = await channel.messages.fetch({ limit: 50 });
  const botMessage = messages.find(
    (m) =>
      m.author.id === interaction.client.user!.id &&
      m.embeds.length > 0 &&
      m.components.length > 0
  );

  if (botMessage) {
    let claimedByName: string | undefined;
    if (ticket.claimedBy) {
      try {
        const member = await interaction.guild!.members.fetch(ticket.claimedBy);
        claimedByName = member.user.username;
      } catch {
        claimedByName = "Unknown";
      }
    }
    const embed = buildTicketEmbed(ticket, channel.name);
    const rows = buildTicketActionRows(claimedByName);
    await botMessage.edit({ embeds: [embed], components: rows });
  }
}

export async function handleRename(
  interaction: ButtonInteraction
): Promise<void> {
  const ticket = getTicketByChannel(interaction.channelId);
  if (!ticket) {
    await interaction.reply({ content: "This ticket could not be found.", flags: MessageFlags.Ephemeral });
    return;
  }

  const member = interaction.guild!.members.cache.get(interaction.user.id);
  if (!member || !isStaff(member)) {
    await interaction.reply({ content: "This action is restricted to staff members.", flags: MessageFlags.Ephemeral });
    return;
  }

  const modal = new ModalBuilder()
    .setCustomId(ModalIds.RenameTicket)
    .setTitle("Rename Ticket")
    .addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId("new_name")
          .setLabel("New Channel Name")
          .setStyle(TextInputStyle.Short)
          .setPlaceholder("ticket-support")
          .setMaxLength(100)
          .setRequired(true)
      )
    );

  await interaction.showModal(modal);
}

export async function handleRenameSubmit(
  interaction: ModalSubmitInteraction
): Promise<void> {
  if (!interaction.channelId) return;
  const ticket = getTicketByChannel(interaction.channelId);
  if (!ticket) {
    await interaction.reply({ content: "This ticket could not be found.", flags: MessageFlags.Ephemeral });
    return;
  }

  const newName = interaction.fields.getTextInputValue("new_name");
  const channel = interaction.channel as TextChannel;

  await channel.setName(newName);

  await interaction.reply({
    content: `Channel has been renamed to **${newName}** by <@${interaction.user.id}>.`,
  });
}

export async function handleAddUser(
  interaction: ButtonInteraction
): Promise<void> {
  const ticket = getTicketByChannel(interaction.channelId);
  if (!ticket) {
    await interaction.reply({ content: "This ticket could not be found.", flags: MessageFlags.Ephemeral });
    return;
  }

  const member = interaction.guild!.members.cache.get(interaction.user.id);
  if (!member || !isStaff(member)) {
    await interaction.reply({ content: "This action is restricted to staff members.", flags: MessageFlags.Ephemeral });
    return;
  }

  const row = new ActionRowBuilder<UserSelectMenuBuilder>().addComponents(
    new UserSelectMenuBuilder()
      .setCustomId(SelectMenuIds.AddUser)
      .setPlaceholder("Select a user to add")
  );

  await interaction.reply({
    content: "Select the user to add to this ticket:",
    components: [row],
    flags: MessageFlags.Ephemeral,
  });
}

export async function handleAddUserSelect(
  interaction: UserSelectMenuInteraction
): Promise<void> {
  const ticket = getTicketByChannel(interaction.channelId);
  if (!ticket) {
    await interaction.reply({ content: "This ticket could not be found.", flags: MessageFlags.Ephemeral });
    return;
  }

  const userId = interaction.values[0];
  const channel = interaction.channel as TextChannel;

  await channel.permissionOverwrites.edit(userId, {
    ViewChannel: true,
    SendMessages: true,
    AttachFiles: true,
    ReadMessageHistory: true,
  });

  await interaction.update({
    content: `<@${userId}> has been added to this ticket.`,
    components: [],
  });
}

export async function handleRemoveUser(
  interaction: ButtonInteraction
): Promise<void> {
  const ticket = getTicketByChannel(interaction.channelId);
  if (!ticket) {
    await interaction.reply({ content: "This ticket could not be found.", flags: MessageFlags.Ephemeral });
    return;
  }

  const member = interaction.guild!.members.cache.get(interaction.user.id);
  if (!member || !isStaff(member)) {
    await interaction.reply({ content: "This action is restricted to staff members.", flags: MessageFlags.Ephemeral });
    return;
  }

  const channel = interaction.channel as TextChannel;
  const config = getGuildConfig(interaction.guildId ?? "");
  const botId = interaction.client.user!.id;

  const excludeIds = new Set<string>([
    ticket.userId,
    botId,
    interaction.guild!.id,
  ]);
  if (config?.lowStaffRoleId) excludeIds.add(config.lowStaffRoleId);
  if (config?.highStaffRoleId) excludeIds.add(config.highStaffRoleId);

  const options: StringSelectMenuOptionBuilder[] = [];
  for (const [id, overwrite] of channel.permissionOverwrites.cache) {
    if (excludeIds.has(id)) continue;
    if (overwrite.type !== 1) continue;
    try {
      const m = await interaction.guild!.members.fetch(id);
      options.push(
        new StringSelectMenuOptionBuilder()
          .setLabel(m.user.username)
          .setValue(id)
          .setDescription(m.user.tag)
      );
    } catch {
      options.push(
        new StringSelectMenuOptionBuilder()
          .setLabel(id)
          .setValue(id)
      );
    }
  }

  if (options.length === 0) {
    await interaction.reply({
      content: "There are no users that can be removed from this ticket.",
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId(SelectMenuIds.RemoveUser)
      .setPlaceholder("Select a user to remove")
      .addOptions(options)
  );

  await interaction.reply({
    content: "Select the user to remove from this ticket:",
    components: [row],
    flags: MessageFlags.Ephemeral,
  });
}

export async function handleRemoveUserSelect(
  interaction: StringSelectMenuInteraction
): Promise<void> {
  const ticket = getTicketByChannel(interaction.channelId);
  if (!ticket) {
    await interaction.reply({ content: "This ticket could not be found.", flags: MessageFlags.Ephemeral });
    return;
  }

  const userId = interaction.values[0];
  const channel = interaction.channel as TextChannel;

  try {
    await channel.permissionOverwrites.delete(userId);
  } catch {
    await interaction.update({
      content: "Unable to remove that user.",
      components: [],
    });
    return;
  }

  await interaction.update({
    content: `<@${userId}> has been removed from this ticket.`,
    components: [],
  });
}

export async function handleChangePriority(
  interaction: ButtonInteraction
): Promise<void> {
  const ticket = getTicketByChannel(interaction.channelId);
  if (!ticket) {
    await interaction.reply({ content: "This ticket could not be found.", flags: MessageFlags.Ephemeral });
    return;
  }

  const member = interaction.guild!.members.cache.get(interaction.user.id);
  if (!member || !isStaff(member)) {
    await interaction.reply({ content: "This action is restricted to staff members.", flags: MessageFlags.Ephemeral });
    return;
  }

  const row = buildPrioritySelect();
  await interaction.reply({
    content: "Select the new priority level:",
    components: [row],
    flags: MessageFlags.Ephemeral,
  });
}

export async function handlePrioritySelect(
  interaction: StringSelectMenuInteraction
): Promise<void> {
  const ticket = getTicketByChannel(interaction.channelId);
  if (!ticket) {
    await interaction.reply({ content: "This ticket could not be found.", flags: MessageFlags.Ephemeral });
    return;
  }

  const priority = interaction.values[0] as TicketPriority;
  updateTicketPriority(ticket.id, priority);

  const label = PriorityLabels[priority] ?? "Medium";

  await refreshTicketEmbed(interaction, ticket.id);

  await interaction.update({
    content: `Priority has been set to **${label}**.`,
    components: [],
  });
}


export async function handleEscalate(
  interaction: ButtonInteraction
): Promise<void> {
  const ticket = getTicketByChannel(interaction.channelId);
  if (!ticket) {
    await interaction.reply({ content: "This ticket could not be found.", flags: MessageFlags.Ephemeral });
    return;
  }

  const member = interaction.guild!.members.cache.get(interaction.user.id);
  if (!member || !isStaff(member)) {
    await interaction.reply({ content: "This action is restricted to staff members.", flags: MessageFlags.Ephemeral });
    return;
  }

  if (ticket.status === TicketStatus.Escalated) {
    await interaction.reply({
      content: "This ticket has already been escalated.",
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  updateTicketStatus(ticket.id, TicketStatus.Escalated);

  const config = getGuildConfig(interaction.guildId ?? "");
  const channel = interaction.channel as TextChannel;

  if (config?.highStaffRoleId) {
    const existingOverwrite = channel.permissionOverwrites.cache.get(
      config.highStaffRoleId
    );
    if (!existingOverwrite) {
      await channel.permissionOverwrites.edit(config.highStaffRoleId, {
        ViewChannel: true,
        SendMessages: true,
        AttachFiles: true,
        ReadMessageHistory: true,
      });
    }
  }

  await refreshTicketEmbed(interaction, ticket.id);

  const highStaffMention = config?.highStaffRoleId
    ? `<@&${config.highStaffRoleId}>`
    : "Senior staff";

  await channel.send({
    content: config?.highStaffRoleId ? `<@&${config.highStaffRoleId}>` : undefined,
    embeds: [
      new EmbedBuilder()
        .setDescription(
          `This ticket has been escalated. ${highStaffMention} has been notified.`
        )
        .setColor(Colors.Escalated),
    ],
  });

  await interaction.reply({
    content: "This ticket has been escalated to senior staff.",
    flags: MessageFlags.Ephemeral,
  });
}

export async function handleViewNotes(
  interaction: ButtonInteraction
): Promise<void> {
  const ticket = getTicketByChannel(interaction.channelId);
  if (!ticket) {
    await interaction.reply({ content: "This ticket could not be found.", flags: MessageFlags.Ephemeral });
    return;
  }

  const member = interaction.guild!.members.cache.get(interaction.user.id);
  if (!member || !isStaff(member)) {
    await interaction.reply({ content: "This action is restricted to staff members.", flags: MessageFlags.Ephemeral });
    return;
  }

  const notes = getStaffNotes(ticket.id);
  const notesText =
    notes.length > 0
      ? notes
          .slice(0, 10)
          .map(
            (n) =>
              `**<@${n.authorId}>** - <t:${Math.floor(new Date(n.createdAt + "Z").getTime() / 1000)}:R>\n${n.content}`
          )
          .join("\n\n")
      : "No notes have been added yet.";

  await interaction.reply({
    embeds: [
      new EmbedBuilder()
        .setTitle(`Staff Notes - ${(interaction.channel as TextChannel).name}`)
        .setDescription(notesText)
        .setColor(Colors.Primary),
    ],
    flags: MessageFlags.Ephemeral,
  });
}

export async function handleAddNote(
  interaction: ButtonInteraction
): Promise<void> {
  const ticket = getTicketByChannel(interaction.channelId);
  if (!ticket) {
    await interaction.reply({ content: "This ticket could not be found.", flags: MessageFlags.Ephemeral });
    return;
  }

  const member = interaction.guild!.members.cache.get(interaction.user.id);
  if (!member || !isStaff(member)) {
    await interaction.reply({ content: "This action is restricted to staff members.", flags: MessageFlags.Ephemeral });
    return;
  }

  const modal = new ModalBuilder()
    .setCustomId(ModalIds.StaffNote)
    .setTitle("Add Staff Note")
    .addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId("note_content")
          .setLabel("Note")
          .setStyle(TextInputStyle.Paragraph)
          .setPlaceholder("Enter your note here...")
          .setMaxLength(1000)
          .setRequired(true)
      )
    );

  await interaction.showModal(modal);
}

export async function handleStaffNoteSubmit(
  interaction: ModalSubmitInteraction
): Promise<void> {
  if (!interaction.channelId) return;
  const ticket = getTicketByChannel(interaction.channelId);
  if (!ticket) {
    await interaction.reply({ content: "This ticket could not be found.", flags: MessageFlags.Ephemeral });
    return;
  }

  const content = interaction.fields.getTextInputValue("note_content");
  addStaffNote(ticket.id, interaction.user.id, content);

  await interaction.deferUpdate();

  const channel = interaction.channel as TextChannel;
  const messages = await channel.messages.fetch({ limit: 50 });
  const botMessage = messages.find(
    (m) =>
      m.author.id === interaction.client.user!.id &&
      m.embeds.length > 0 &&
      m.components.length > 0
  );

  if (botMessage) {
    await botMessage.reply({
      content: `New note added by <@${interaction.user.id}>.`,
    });
  }
}
