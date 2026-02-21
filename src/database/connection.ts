import Database from "better-sqlite3";
import path from "path";

const DB_PATH = path.join(process.cwd(), "database.db");

let db: Database.Database;

export function getDatabase(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma("journal_mode = DELETE");
    db.pragma("foreign_keys = ON");
    initializeSchema();
  }
  return db;
}

function initializeSchema(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS guild_config (
      guildId TEXT PRIMARY KEY,
      logsChannelId TEXT,
      transcriptsChannelId TEXT,
      ticketCategoryId TEXT,
      lowStaffRoleId TEXT,
      highStaffRoleId TEXT
    );

    CREATE TABLE IF NOT EXISTS tickets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId TEXT NOT NULL,
      channelId TEXT NOT NULL UNIQUE,
      guildId TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'open',
      priority TEXT NOT NULL DEFAULT 'low',
      claimedBy TEXT,
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      closedAt TEXT,
      ticketNumber INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS staff_notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticketId INTEGER NOT NULL,
      authorId TEXT NOT NULL,
      content TEXT NOT NULL,
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (ticketId) REFERENCES tickets(id)
    );

    CREATE TABLE IF NOT EXISTS ticket_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticketId INTEGER NOT NULL,
      action TEXT NOT NULL,
      performedBy TEXT NOT NULL,
      details TEXT,
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (ticketId) REFERENCES tickets(id)
    );

    CREATE INDEX IF NOT EXISTS idx_tickets_guildId ON tickets(guildId);
    CREATE INDEX IF NOT EXISTS idx_tickets_userId ON tickets(userId);
    CREATE INDEX IF NOT EXISTS idx_tickets_channelId ON tickets(channelId);
    CREATE INDEX IF NOT EXISTS idx_ticket_logs_ticketId ON ticket_logs(ticketId);
    CREATE INDEX IF NOT EXISTS idx_staff_notes_ticketId ON staff_notes(ticketId);

    CREATE TABLE IF NOT EXISTS leaderboard_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      guildId TEXT NOT NULL,
      channelId TEXT NOT NULL,
      messageId TEXT NOT NULL UNIQUE
    );
  `);

  const columns = db
    .prepare("PRAGMA table_info(guild_config)")
    .all() as { name: string }[];
  if (!columns.some((c) => c.name === "ticketCategoryId")) {
    db.exec("ALTER TABLE guild_config ADD COLUMN ticketCategoryId TEXT");
  }
}
