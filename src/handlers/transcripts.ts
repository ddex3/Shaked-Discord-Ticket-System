import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  EmbedBuilder,
  MessageFlags,
  ModalSubmitInteraction,
  TextChannel,
} from "discord.js";
import { createTranscript, ExportReturnType } from "discord-html-transcripts";
import { Ticket } from "../types";
import { Colors } from "../utils/constants";
import { getGuildConfig, getTicketByChannel } from "../database/queries";
import { isStaff } from "../utils/permissions";

export async function generateTranscript(
  interaction: ButtonInteraction | ModalSubmitInteraction,
  ticket: Ticket,
  transcriptChannelId: string
): Promise<string | null> {
  try {
    const channel = interaction.channel as TextChannel;

    const attachment = await createTranscript(channel, {
      limit: -1,
      returnType: ExportReturnType.Attachment,
      filename: `${channel.name}.html`,
      poweredBy: false,
    });

    const transcriptChannel = await interaction.client.channels.fetch(
      transcriptChannelId
    );
    if (transcriptChannel && transcriptChannel instanceof TextChannel) {
      const msg = await transcriptChannel.send({ files: [attachment] });
      const fileUrl = msg.attachments.first()?.url ?? null;

      const openedAtTimestamp = Math.floor(
        new Date(ticket.createdAt + "Z").getTime() / 1000
      );

      const embed = new EmbedBuilder()
        .setTitle(`Transcript - ${channel.name}`)
        .addFields(
          { name: "Ticket Owner", value: `<@${ticket.userId}>`, inline: true },
          {
            name: "Closed By",
            value: `<@${interaction.user.id}>`,
            inline: true,
          },
          {
            name: "Claimed By",
            value: ticket.claimedBy
              ? `<@${ticket.claimedBy}>`
              : "Unclaimed",
            inline: true,
          },
          {
            name: "Opened At",
            value: `<t:${openedAtTimestamp}:F>`,
            inline: true,
          },
          {
            name: "Closed At",
            value: `<t:${Math.floor(Date.now() / 1000)}:F>`,
            inline: true,
          }
        )
        .setColor(Colors.Info)
        .setTimestamp();

      const components: ActionRowBuilder<ButtonBuilder>[] = [];
      if (fileUrl) {
        components.push(
          new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
              .setLabel("Download Transcript")
              .setStyle(ButtonStyle.Link)
              .setURL(fileUrl)
          )
        );
      }

      await msg.edit({
        embeds: [embed],
        components,
      });

      return fileUrl;
    }

    return null;
  } catch {
    return null;
  }
}

export async function handleSendTranscript(
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
      content: "Only staff members can send transcripts.",
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  const config = getGuildConfig(interaction.guildId!);
  if (!config?.transcriptsChannelId) {
    await interaction.reply({
      content: "The transcripts channel has not been configured. An administrator must set this up first.",
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  await interaction.deferReply({ flags: MessageFlags.Ephemeral });
  await generateTranscript(interaction, ticket, config.transcriptsChannelId);

  await interaction.editReply({
    embeds: [
      new EmbedBuilder()
        .setDescription("Transcript has been saved to the transcripts channel.")
        .setColor(Colors.Success),
    ],
  });
}
