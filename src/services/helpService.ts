import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Client,
  EmbedBuilder,
  GuildMember,
  PermissionFlagsBits,
} from "discord.js";
import { getCommands, CommandEntry } from "../commands/registry";
import { Colors } from "../utils/constants";

export const HelpButtonIds = {
  Previous: "help_previous",
  Home: "help_home",
  Next: "help_next",
} as const;

interface HelpPage {
  embed: EmbedBuilder;
}

export class HelpService {
  private pages: HelpPage[] = [];

  constructor(
    private client: Client,
    private member: GuildMember
  ) {
    this.buildPages();
  }

  private getVisibleCommands(): CommandEntry[] {
    const isAdmin = this.member.permissions.has(
      PermissionFlagsBits.Administrator
    );
    return getCommands().filter((cmd) => !cmd.adminOnly || isAdmin);
  }

  private groupByCategory(
    commands: CommandEntry[]
  ): Map<string, CommandEntry[]> {
    const grouped = new Map<string, CommandEntry[]>();
    for (const cmd of commands) {
      const existing = grouped.get(cmd.category) ?? [];
      existing.push(cmd);
      grouped.set(cmd.category, existing);
    }
    return grouped;
  }

  private formatSubcommands(cmd: CommandEntry): string {
    const json = cmd.data.toJSON();
    const options = json.options ?? [];
    const subs = options.filter((o: any) => o.type === 1);

    if (subs.length === 0) {
      return `> \`/${json.name}\` - ${json.description}`;
    }

    const lines = [`> \`/${json.name}\` - ${json.description}`];
    for (const sub of subs) {
      lines.push(`>  \`${sub.name}\` - ${sub.description}`);
    }
    return lines.join("\n");
  }

  private buildPages(): void {
    const visible = this.getVisibleCommands();
    const grouped = this.groupByCategory(visible);
    const categories = Array.from(grouped.keys());

    const overviewEmbed = new EmbedBuilder()
      .setTitle(`${this.client.user?.username ?? "Bot"} - Help`)
      .setDescription(
        "A ticket management system for your Discord server.\n" +
          "Use the buttons below to navigate through command categories."
      )
      .addFields(
        {
          name: "Total Commands",
          value: `\`${visible.length}\``,
          inline: true,
        },
        {
          name: "Categories",
          value: `\`${categories.length}\``,
          inline: true,
        },
        {
          name: "\u200b",
          value: "\u200b",
          inline: true,
        }
      )
      .setColor(Colors.Primary)
      .setThumbnail(this.client.user?.displayAvatarURL() ?? null)
      .setFooter({
        text: `Page 1 of ${categories.length + 1}`,
      })
      .setTimestamp();

    const categoryList = categories
      .map((cat, i) => {
        const count = grouped.get(cat)!.length;
        return `**${i + 1}.** ${cat} - \`${count}\` command${count !== 1 ? "s" : ""}`;
      })
      .join("\n");

    overviewEmbed.addFields({
      name: "Categories",
      value: categoryList || "No categories available.",
    });

    this.pages.push({ embed: overviewEmbed });

    let pageIndex = 2;
    for (const [category, cmds] of grouped) {
      const adminTag = cmds.every((c) => c.adminOnly) ? " (Admin)" : "";
      const commandList = cmds.map((c) => this.formatSubcommands(c)).join("\n\n");

      const embed = new EmbedBuilder()
        .setTitle(`${category}${adminTag}`)
        .setDescription(commandList || "No commands in this category.")
        .setColor(Colors.Primary)
        .setFooter({
          text: `Page ${pageIndex} of ${categories.length + 1}`,
        })
        .setTimestamp();

      this.pages.push({ embed });
      pageIndex++;
    }
  }

  getPage(index: number): EmbedBuilder {
    const clamped = Math.max(0, Math.min(index, this.pages.length - 1));
    return this.pages[clamped].embed;
  }

  getTotalPages(): number {
    return this.pages.length;
  }

  static buildNavigationRow(
    currentPage: number,
    totalPages: number
  ): ActionRowBuilder<ButtonBuilder> {
    return new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(HelpButtonIds.Previous)
        .setLabel("Back")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(currentPage <= 0),
      new ButtonBuilder()
        .setCustomId(HelpButtonIds.Home)
        .setLabel("Home")
        .setStyle(ButtonStyle.Primary)
        .setDisabled(currentPage === 0),
      new ButtonBuilder()
        .setCustomId(HelpButtonIds.Next)
        .setLabel("Next")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(currentPage >= totalPages - 1)
    );
  }
}
