import {
  ChatInputCommandInteraction,
  ChannelType,
  EmbedBuilder,
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";
import { upsertGuildConfig, getGuildConfig } from "../database/queries";
import { GuildConfig } from "../types";
import { Colors } from "../utils/constants";

export const data = new SlashCommandBuilder()
  .setName("ticket-config")
  .setDescription("Configure the ticket system")
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
  .addSubcommand((sub) =>
    sub
      .setName("logs-channel")
      .setDescription("Set the logs channel")
      .addChannelOption((opt) =>
        opt
          .setName("channel")
          .setDescription("The channel for ticket logs")
          .addChannelTypes(ChannelType.GuildText)
          .setRequired(true)
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName("transcripts-channel")
      .setDescription("Set the transcripts channel")
      .addChannelOption((opt) =>
        opt
          .setName("channel")
          .setDescription("The channel for ticket transcripts")
          .addChannelTypes(ChannelType.GuildText)
          .setRequired(true)
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName("ticket-category")
      .setDescription("Set the category where tickets will be created")
      .addChannelOption((opt) =>
        opt
          .setName("category")
          .setDescription("The category for ticket channels")
          .addChannelTypes(ChannelType.GuildCategory)
          .setRequired(true)
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName("low-staff-role")
      .setDescription("Set the low-level staff role")
      .addRoleOption((opt) =>
        opt
          .setName("role")
          .setDescription("The low-level staff role")
          .setRequired(true)
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName("high-staff-role")
      .setDescription("Set the high-level staff role")
      .addRoleOption((opt) =>
        opt
          .setName("role")
          .setDescription("The high-level staff role")
          .setRequired(true)
      )
  )
  .addSubcommand((sub) =>
    sub.setName("view").setDescription("View current configuration")
  );

export async function execute(
  interaction: ChatInputCommandInteraction
): Promise<void> {
  const guildId = interaction.guildId!;
  const subcommand = interaction.options.getSubcommand();

  if (subcommand === "view") {
    const config = getGuildConfig(guildId);
    const embed = new EmbedBuilder()
      .setTitle("Ticket System Configuration")
      .addFields(
        {
          name: "Logs Channel",
          value: config?.logsChannelId
            ? `<#${config.logsChannelId}>`
            : "Not set",
          inline: true,
        },
        {
          name: "Transcripts Channel",
          value: config?.transcriptsChannelId
            ? `<#${config.transcriptsChannelId}>`
            : "Not set",
          inline: true,
        },
        {
          name: "Ticket Category",
          value: config?.ticketCategoryId
            ? `<#${config.ticketCategoryId}>`
            : "Not set",
          inline: true,
        },
        {
          name: "Low Staff Role",
          value: config?.lowStaffRoleId
            ? `<@&${config.lowStaffRoleId}>`
            : "Not set",
          inline: true,
        },
        {
          name: "High Staff Role",
          value: config?.highStaffRoleId
            ? `<@&${config.highStaffRoleId}>`
            : "Not set",
          inline: true,
        }
      )
      .setColor(Colors.Primary)
      .setTimestamp();

    await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    return;
  }

  const fieldMap: Record<string, string> = {
    "logs-channel": "logsChannelId",
    "transcripts-channel": "transcriptsChannelId",
    "ticket-category": "ticketCategoryId",
    "low-staff-role": "lowStaffRoleId",
    "high-staff-role": "highStaffRoleId",
  };

  const field = fieldMap[subcommand];
  if (!field) return;

  const isChannelOption =
    subcommand === "logs-channel" || subcommand === "transcripts-channel";
  const isCategoryOption = subcommand === "ticket-category";
  const isRoleOption = !isChannelOption && !isCategoryOption;

  let value: string;
  if (isChannelOption) {
    value = interaction.options.getChannel("channel", true).id;
  } else if (isCategoryOption) {
    value = interaction.options.getChannel("category", true).id;
  } else {
    value = interaction.options.getRole("role", true).id;
  }

  upsertGuildConfig(
    guildId,
    field as keyof Omit<GuildConfig, "guildId">,
    value
  );

  const displayValue = isRoleOption ? `<@&${value}>` : `<#${value}>`;

  const embed = new EmbedBuilder()
    .setDescription(
      `**${subcommand}** has been updated to ${displayValue}.`
    )
    .setColor(Colors.Success);

  await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
}
