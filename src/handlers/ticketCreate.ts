import {
  ButtonInteraction,
  ChannelType,
  EmbedBuilder,
  MessageFlags,
  OverwriteResolvable,
  PermissionFlagsBits,
} from "discord.js";
import {
  createTicket,
  getGuildConfig,
  getNextTicketNumber,
  getOpenTicketByUser,
  isGuildConfigured,
} from "../database/queries";
import { buildTicketEmbed, buildTicketActionRows } from "../utils/embeds";
import { Colors } from "../utils/constants";

export async function handleTicketCreate(
  interaction: ButtonInteraction
): Promise<void> {
  const guildId = interaction.guildId!;
  const userId = interaction.user.id;

  if (!isGuildConfigured(guildId)) {
    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setDescription("__**The ticket system is not configured.**__\n\nAn administrator must complete setup before tickets can be created.")
          .setColor(Colors.Danger),
      ],
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  const existingTicket = getOpenTicketByUser(userId, guildId);
  if (existingTicket) {
    await interaction.reply({
      content: `You already have an open ticket <#${existingTicket.channelId}>`,
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const config = getGuildConfig(guildId)!;
  const ticketNumber = getNextTicketNumber(guildId);

  const permissionOverwrites: OverwriteResolvable[] = [
    {
      id: interaction.guild!.id,
      deny: [PermissionFlagsBits.ViewChannel],
    },
    {
      id: userId,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.AttachFiles,
        PermissionFlagsBits.ReadMessageHistory,
      ],
    },
    {
      id: interaction.client.user!.id,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ManageChannels,
        PermissionFlagsBits.ManageMessages,
        PermissionFlagsBits.AttachFiles,
        PermissionFlagsBits.ReadMessageHistory,
      ],
    },
  ];

  if (config.lowStaffRoleId) {
    permissionOverwrites.push({
      id: config.lowStaffRoleId,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.AttachFiles,
        PermissionFlagsBits.ReadMessageHistory,
      ],
    });
  }

  if (config.highStaffRoleId) {
    permissionOverwrites.push({
      id: config.highStaffRoleId,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.AttachFiles,
        PermissionFlagsBits.ReadMessageHistory,
      ],
    });
  }

  const channel = await interaction.guild!.channels.create({
    name: `ticket-${interaction.user.username}`,
    type: ChannelType.GuildText,
    parent: config.ticketCategoryId!,
    permissionOverwrites,
  });

  const ticket = createTicket(userId, channel.id, guildId, ticketNumber);
  const embed = buildTicketEmbed(ticket, channel.name);
  const actionRows = buildTicketActionRows();

  await channel.send({
    content: `<@${userId}> <@&${config.lowStaffRoleId}>`,
    embeds: [embed],
    components: actionRows,
  });

  await interaction.editReply({
    content: `Your ticket has been created <#${channel.id}>`,
  });
}
