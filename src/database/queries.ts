import { getDatabase } from "./connection";
import {
  GuildConfig,
  LeaderboardMessage,
  StaffNote,
  Ticket,
  TicketLog,
  TicketPriority,
  TicketStatus,
} from "../types";

export function getGuildConfig(guildId: string): GuildConfig | undefined {
  const db = getDatabase();
  return db
    .prepare("SELECT * FROM guild_config WHERE guildId = ?")
    .get(guildId) as GuildConfig | undefined;
}

export function upsertGuildConfig(
  guildId: string,
  field: keyof Omit<GuildConfig, "guildId">,
  value: string
): void {
  const db = getDatabase();
  const existing = getGuildConfig(guildId);
  if (existing) {
    db.prepare(`UPDATE guild_config SET ${field} = ? WHERE guildId = ?`).run(
      value,
      guildId
    );
  } else {
    db.prepare(
      `INSERT INTO guild_config (guildId, ${field}) VALUES (?, ?)`
    ).run(guildId, value);
  }
}

export function isGuildConfigured(guildId: string): boolean {
  const config = getGuildConfig(guildId);
  if (!config) return false;
  return !!(
    config.logsChannelId &&
    config.transcriptsChannelId &&
    config.ticketCategoryId &&
    config.lowStaffRoleId &&
    config.highStaffRoleId
  );
}

export function getNextTicketNumber(guildId: string): number {
  const db = getDatabase();
  const result = db
    .prepare(
      "SELECT MAX(ticketNumber) as maxNum FROM tickets WHERE guildId = ?"
    )
    .get(guildId) as { maxNum: number | null };
  return (result.maxNum ?? 0) + 1;
}

export function createTicket(
  userId: string,
  channelId: string,
  guildId: string,
  ticketNumber: number
): Ticket {
  const db = getDatabase();
  const result = db
    .prepare(
      "INSERT INTO tickets (userId, channelId, guildId, ticketNumber) VALUES (?, ?, ?, ?)"
    )
    .run(userId, channelId, guildId, ticketNumber);
  return db
    .prepare("SELECT * FROM tickets WHERE id = ?")
    .get(result.lastInsertRowid) as Ticket;
}

export function getTicketByChannel(channelId: string): Ticket | undefined {
  const db = getDatabase();
  return db
    .prepare("SELECT * FROM tickets WHERE channelId = ?")
    .get(channelId) as Ticket | undefined;
}

export function getTicketById(id: number): Ticket | undefined {
  const db = getDatabase();
  return db.prepare("SELECT * FROM tickets WHERE id = ?").get(id) as
    | Ticket
    | undefined;
}

export function getOpenTicketByUser(
  userId: string,
  guildId: string
): Ticket | undefined {
  const db = getDatabase();
  return db
    .prepare(
      "SELECT * FROM tickets WHERE userId = ? AND guildId = ? AND status != 'closed'"
    )
    .get(userId, guildId) as Ticket | undefined;
}

export function updateTicketStatus(
  ticketId: number,
  status: TicketStatus
): void {
  const db = getDatabase();
  const updates =
    status === TicketStatus.Closed
      ? "status = ?, closedAt = datetime('now')"
      : "status = ?";
  db.prepare(`UPDATE tickets SET ${updates} WHERE id = ?`).run(
    status,
    ticketId
  );
}

export function updateTicketPriority(
  ticketId: number,
  priority: TicketPriority
): void {
  const db = getDatabase();
  db.prepare("UPDATE tickets SET priority = ? WHERE id = ?").run(
    priority,
    ticketId
  );
}

export function claimTicket(ticketId: number, staffId: string): void {
  const db = getDatabase();
  db.prepare(
    "UPDATE tickets SET claimedBy = ?, status = 'claimed' WHERE id = ?"
  ).run(staffId, ticketId);
}

export function updateTicketChannel(
  ticketId: number,
  channelId: string
): void {
  const db = getDatabase();
  db.prepare("UPDATE tickets SET channelId = ? WHERE id = ?").run(
    channelId,
    ticketId
  );
}

export function addStaffNote(
  ticketId: number,
  authorId: string,
  content: string
): StaffNote {
  const db = getDatabase();
  const result = db
    .prepare(
      "INSERT INTO staff_notes (ticketId, authorId, content) VALUES (?, ?, ?)"
    )
    .run(ticketId, authorId, content);
  return db
    .prepare("SELECT * FROM staff_notes WHERE id = ?")
    .get(result.lastInsertRowid) as StaffNote;
}

export function getStaffNotes(ticketId: number): StaffNote[] {
  const db = getDatabase();
  return db
    .prepare(
      "SELECT * FROM staff_notes WHERE ticketId = ? ORDER BY createdAt DESC"
    )
    .all(ticketId) as StaffNote[];
}

export function addTicketLog(
  ticketId: number,
  action: string,
  performedBy: string,
  details?: string
): void {
  const db = getDatabase();
  db.prepare(
    "INSERT INTO ticket_logs (ticketId, action, performedBy, details) VALUES (?, ?, ?, ?)"
  ).run(ticketId, action, performedBy, details ?? null);
}

export function getTicketLogs(ticketId: number): TicketLog[] {
  const db = getDatabase();
  return db
    .prepare(
      "SELECT * FROM ticket_logs WHERE ticketId = ? ORDER BY createdAt DESC"
    )
    .all(ticketId) as TicketLog[];
}

export function getTopClaimers(
  guildId: string,
  limit: number = 10
): { claimedBy: string; claimCount: number }[] {
  const db = getDatabase();
  return db
    .prepare(
      "SELECT claimedBy, COUNT(*) as claimCount FROM tickets WHERE guildId = ? AND claimedBy IS NOT NULL GROUP BY claimedBy ORDER BY claimCount DESC LIMIT ?"
    )
    .all(guildId, limit) as { claimedBy: string; claimCount: number }[];
}

export function saveLeaderboardMessage(
  guildId: string,
  channelId: string,
  messageId: string
): void {
  const db = getDatabase();
  db.prepare(
    "INSERT INTO leaderboard_messages (guildId, channelId, messageId) VALUES (?, ?, ?)"
  ).run(guildId, channelId, messageId);
}

export function getLeaderboardMessages(): LeaderboardMessage[] {
  const db = getDatabase();
  return db
    .prepare("SELECT * FROM leaderboard_messages")
    .all() as LeaderboardMessage[];
}

export function deleteLeaderboardMessage(messageId: string): void {
  const db = getDatabase();
  db.prepare("DELETE FROM leaderboard_messages WHERE messageId = ?").run(
    messageId
  );
}
