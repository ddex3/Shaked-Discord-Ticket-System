# Shaked Ticket System

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Discord.js](https://img.shields.io/badge/discord.js-v14-5865F2.svg)](https://discord.js.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6.svg)](https://www.typescriptlang.org)

A production-grade Discord ticket system bot built with TypeScript and Discord.js v14. Manage support tickets with staff controls, transcripts, priority levels, escalation, and a live leaderboard.

## Features

- **Ticket Management** - Create, claim, close, and escalate support tickets
- **Staff Control Panel** - Rename, add/remove users, change priority, staff notes
- **HTML Transcripts** - Auto-generated ticket transcripts saved to a dedicated channel
- **Priority System** - Low, Medium, High, and Urgent priority levels
- **Escalation** - Escalate tickets to senior staff with automatic role pings
- **Staff Notes** - Internal notes visible only to staff members
- **Live Leaderboard** - Auto-updating top 10 ticket claimers with medal rankings
- **Role-Based Permissions** - Low staff, high staff, and administrator tiers
- **Persistent Storage** - SQLite database with zero external dependencies
- **Paginated Help** - Interactive help command with navigation buttons

## Prerequisites

- [Node.js](https://nodejs.org) v18 or higher
- A [Discord Bot Application](https://discord.com/developers/applications) with the following intents enabled:
  - Server Members Intent
  - Message Content Intent

## Installation

```bash
git clone https://github.com/ddex3/Shaked-Discord-Ticket-System.git
cd Shaked-Discord-Ticket-System
npm install
```

## Configuration

Copy the example environment file and fill in your values:

```bash
cp .env.example .env
```

```env
DISCORD_TOKEN=your_bot_token_here
CLIENT_ID=your_client_id_here
GUILD_ID=your_guild_id_here
```

| Variable | Description |
|---|---|
| `DISCORD_TOKEN` | Your bot token from the Discord Developer Portal |
| `CLIENT_ID` | Your bot's application/client ID |
| `GUILD_ID` | Your server ID (for guild-scoped command registration) |

> Remove `GUILD_ID` to register commands globally (takes up to 1 hour to propagate).

## Usage

### Build and start

```bash
npm run build
npm run register
npm run start
```

### Development mode

```bash
npm run dev
```

### Register slash commands

```bash
npm run register
```

### In-server setup

Once the bot is online, configure it with `/ticket-config`:

```
/ticket-config logs-channel {yourLogsChannel}
/ticket-config transcripts-channel {yourTranscriptsChannel}
/ticket-config ticket-category {yourTicketCategory}
/ticket-config low-staff-role {yourSupportRole}
/ticket-config high-staff-role {yourSeniorStaffRole}
```

Verify your configuration:

```
/ticket-config view
```

Then send the ticket panel to any channel:

```
/ticket-send
```

## Commands

| Command | Permission | Description |
|---|---|---|
| `/help` | Everyone | View all commands with paginated navigation |
| `/ticket-config` | Administrator | Configure channels, categories, and staff roles |
| `/ticket-send` | Administrator | Send the ticket panel embed |
| `/ticket-leaderboard` | Administrator | Send a live-updating claims leaderboard |

## Project Structure

```
src/
├── commands/           # Slash command definitions
│   ├── help.ts
│   ├── registry.ts
│   ├── ticketConfig.ts
│   ├── ticketLeaderboard.ts
│   └── ticketSend.ts
├── database/           # SQLite schema and queries
│   ├── connection.ts
│   └── queries.ts
├── handlers/           # Interaction event handlers
│   ├── helpPagination.ts
│   ├── interactionRouter.ts
│   ├── staffControls.ts
│   ├── ticketActions.ts
│   ├── ticketCreate.ts
│   └── transcripts.ts
├── services/           # Business logic
│   ├── helpService.ts
│   └── leaderboardService.ts
├── types/              # TypeScript interfaces and enums
│   └── index.ts
├── utils/              # Shared utilities
│   ├── console.ts
│   ├── constants.ts
│   ├── embeds.ts
│   ├── logger.ts
│   └── permissions.ts
├── deploy-commands.ts  # Command registration script
└── index.ts            # Bot entry point
```

## Tech Stack

- **Runtime** - Node.js
- **Language** - TypeScript 5.7
- **Framework** - Discord.js v14
- **Database** - SQLite (better-sqlite3)
- **Transcripts** - discord-html-transcripts

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

Built with ❤️ by **[@ddex3](https://github.com/ddex3)**
