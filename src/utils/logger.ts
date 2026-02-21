import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Client,
  EmbedBuilder,
  TextChannel,
} from "discord.js";
import { getGuildConfig } from "../database/queries";
import { Ticket } from "../types";
import { Colors } from "./constants";

interface CloseLogData {
  ticket: Ticket;
  channelName: string;
  closeReason: string;
  closedBy: string;
  transcriptUrl: string | null;
}

export async function logTicketClose(
  client: Client,
  guildId: string,
  data: CloseLogData
): Promise<void> {
  const config = getGuildConfig(guildId);
  if (!config?.logsChannelId) return;

  try {
    const channel = await client.channels.fetch(config.logsChannelId);
    if (!channel || !(channel instanceof TextChannel)) return;

    const openedAtTimestamp = Math.floor(
      new Date(data.ticket.createdAt + "Z").getTime() / 1000
    );
    const closedAtTimestamp = Math.floor(Date.now() / 1000);

    const embed = new EmbedBuilder()
      .setTitle(`Ticket Closed - ${data.channelName}`)
      .addFields(
        {
          name: "Ticket Name",
          value: data.channelName,
          inline: true,
        },
        {
          name: "Opened By",
          value: `<@${data.ticket.userId}>`,
          inline: true,
        },
        {
          name: "Closed By",
          value: `<@${data.closedBy}>`,
          inline: true,
        },
        {
          name: "Claimed By",
          value: data.ticket.claimedBy
            ? `<@${data.ticket.claimedBy}>`
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
          value: `<t:${closedAtTimestamp}:F>`,
          inline: true,
        },
        {
          name: "Close Reason",
          value: data.closeReason,
        }
      )
      .setColor(Colors.Danger)
      .setTimestamp();

    const components: ActionRowBuilder<ButtonBuilder>[] = [];

    if (data.transcriptUrl) {
      components.push(
        new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setLabel("Transcript")
            .setStyle(ButtonStyle.Link)
            .setURL(data.transcriptUrl)
        )
      );
    }

    await channel.send({ embeds: [embed], components });
  } catch {
  }
}
