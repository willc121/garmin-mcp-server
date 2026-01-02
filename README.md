# Garmin Health MCP Server

A Model Context Protocol (MCP) server that lets you query your Garmin health data directly in Claude Desktop.

## What This Does

Instead of copy-pasting data or using a web dashboard, you can ask Claude natural questions:

- "What's my VO2 max trend this year?"
- "Am I overtraining?"
- "How much did I sleep last week?"
- "What are my predicted race times?"

Claude calls the appropriate tools and fetches only the data it needs.

## Prerequisites

- Node.js 18+
- Claude Desktop installed
- Garmin data in Supabase (see main project)

## Setup

### 1. Install dependencies

```bash
cd garmin-mcp-server
npm install
```

### 2. Set environment variables

Create a `.env` file or export these:

```bash
export SUPABASE_URL="https://ylcbldppuaugitdnrjxv.supabase.co"
export SUPABASE_ANON_KEY="your-supabase-anon-key"
```

### 3. Build the server

```bash
npm run build
```

### 4. Configure Claude Desktop

Open your Claude Desktop config file:

- **Mac:** `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

Add this to the `mcpServers` section:

```json
{
  "mcpServers": {
    "garmin": {
      "command": "node",
      "args": ["/FULL/PATH/TO/garmin-mcp-server/dist/index.js"],
      "env": {
        "SUPABASE_URL": "https://ylcbldppuaugitdnrjxv.supabase.co",
        "SUPABASE_ANON_KEY": "your-supabase-anon-key"
      }
    }
  }
}
```

**Important:** Replace `/FULL/PATH/TO/` with the actual path on your machine.

### 5. Restart Claude Desktop

Completely quit and reopen Claude Desktop. You should see a hammer icon 🔨 indicating tools are available.

## Available Tools

| Tool | Description |
|------|-------------|
| `get_health_summary` | Overview of all health data |
| `get_vo2max` | VO2 max history and trends |
| `get_activities` | Activity breakdown by type |
| `get_sleep` | Sleep statistics |
| `get_race_predictions` | Predicted race times |
| `get_heart_rate_zones` | Personalized HR training zones |
| `get_training_load` | Acute/chronic workload for overtraining detection |

## Example Queries

Once configured, try asking Claude:

```
What's my current VO2 max and how has it changed over time?
```

```
Show me my activity breakdown for 2024
```

```
Am I at risk of overtraining? Check my training load.
```

```
What are my heart rate zones?
```

## Troubleshooting

**Claude doesn't show the hammer icon:**
- Check your config file JSON syntax
- Make sure the path is absolute, not relative
- Restart Claude Desktop completely (quit, not just close)

**"SUPABASE_ANON_KEY required" error:**
- Make sure the env vars are in your config file
- Or export them in your shell before running

**Connection errors:**
- Verify your Supabase URL and key are correct
- Test by running: `npm run dev`

## Development

Run in development mode (without building):

```bash
npm run dev
```

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Claude Desktop │────▶│   MCP Server    │────▶│    Supabase     │
│  (asks question)│◀────│   (this code)   │◀────│   (your data)   │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

1. You ask Claude a question about your health data
2. Claude determines which tool(s) to call
3. MCP server queries Supabase for just that data
4. Claude receives the data and formulates a response

## License

MIT
