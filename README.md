# Garmin Health MCP Server

Query your Garmin health data in plain English through Claude Desktop.

**[Live Demo & Full Writeup →](https://willchung.io/garmin)**

## Quick Start

### Prerequisites

- Node.js 18+
- Claude Desktop
- Garmin data in Supabase

### Install
```bash
git clone https://github.com/willc121/garmin-health-mcp-server.git
cd garmin-health-mcp-server
npm install
npm run build
```

### Configure Claude Desktop

Add to your Claude Desktop config:

**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`  
**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`
```json
{
  "mcpServers": {
    "garmin": {
      "command": "node",
      "args": ["/absolute/path/to/dist/index.js"],
      "env": {
        "SUPABASE_URL": "your-supabase-url",
        "SUPABASE_ANON_KEY": "your-supabase-anon-key"
      }
    }
  }
}
```

Restart Claude Desktop. The Garmin connector should appear in your connectors menu.

## Available Tools

| Tool | Description |
|------|-------------|
| `get_health_summary` | Overview of all health data |
| `get_vo2max` | VO2 max history and trends |
| `get_activities` | Activity breakdown by type |
| `get_sleep` | Sleep statistics |
| `get_race_predictions` | Predicted race times |
| `get_heart_rate_zones` | Personalized HR training zones |
| `get_training_load` | Acute/chronic workload ratio |

## Example Queries
```
What's my VO2 max?
```
```
Am I overtraining?
```
```
Compare my running vs cycling this year
```

## Getting Your Garmin Data

### 1. Request your data export

- Go to [Garmin Account Management](https://www.garmin.com/account)
- Navigate to Account Settings → Data Management
- Click "Export Your Data" and request all data
- [Full instructions →](https://support.garmin.com/en-US/?faq=q22kMdCbU23NUT2Wmspz16)

### 2. Wait for the email

Garmin sends a download link within 48 hours. The export can be several GB depending on how long you've been tracking.

### 3. Download and extract

You'll get a zip with JSON files for activities, sleep, VO2 max, heart rate, and more.

### 4. Load into a database

The raw export is too large to query directly (mine was 9 years of data), so I loaded it into **Supabase** (free tier works fine).

You'll need these tables:
- `vo2_max` — VO2 max readings by date and sport
- `activities` — Activity records with type, duration, distance, HR
- `sleep_summary` — Aggregated sleep stats
- `race_predictions` — Garmin's predicted race times
- `heart_rate_zones` — HR zone boundaries
- `training_load` — Daily training load metrics

I wrote Python scripts to parse the Garmin JSON and insert into Supabase. Happy to share if there's interest — open an issue.

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Connector doesn't appear | Check JSON syntax, use absolute path, fully restart Claude |
| Connection errors | Verify Supabase credentials |

## License

MIT