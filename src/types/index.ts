export enum TicketStatus {
  Open = "open",
  Claimed = "claimed",
  Closed = "closed",
  Escalated = "escalated",
}

export enum TicketPriority {
  Low = "low",
  Medium = "medium",
  High = "high",
  Urgent = "urgent",
}

export interface Ticket {
  id: number;
  userId: string;
  channelId: string;
  guildId: string;
  status: TicketStatus;
  priority: TicketPriority;
  claimedBy: string | null;
  createdAt: string;
  closedAt: string | null;
  ticketNumber: number;
}

export interface GuildConfig {
  guildId: string;
  logsChannelId: string | null;
  transcriptsChannelId: string | null;
  ticketCategoryId: string | null;
  lowStaffRoleId: string | null;
  highStaffRoleId: string | null;
}

export interface StaffNote {
  id: number;
  ticketId: number;
  authorId: string;
  content: string;
  createdAt: string;
}

export interface TicketLog {
  id: number;
  ticketId: number;
  action: string;
  performedBy: string;
  details: string | null;
  createdAt: string;
}

export interface LeaderboardMessage {
  id: number;
  guildId: string;
  channelId: string;
  messageId: string;
}
