// src/tools.catalog.ts
export const TOOL_CATALOG = [
  {
    name: "get_health_summary",
    description:
      "Get an overview of all health data including VO2 max, activities, sleep, and race predictions",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "get_vo2max",
    description:
      "Get VO2 max history and trends. VO2 max measures cardiovascular fitness in ml/kg/min.",
    inputSchema: {
      type: "object",
      properties: {
        start_date: { type: "string", description: "Start date (YYYY-MM-DD)" },
        end_date: {
          type: "string",
          description: "End date (YYYY-MM-DD, exclusive recommended)",
        },
        sport: {
          type: "string",
          description: "Filter by sport (e.g., 'running', 'cycling')",
        },
      },
    },
  },
  {
    name: "get_activities",
    description:
      "Get activity breakdown by type, including counts, distances, and durations",
    inputSchema: {
      type: "object",
      properties: {
        start_date: { type: "string", description: "Start date (YYYY-MM-DD)" },
        end_date: {
          type: "string",
          description: "End date (YYYY-MM-DD, exclusive recommended)",
        },
        activity_type: {
          type: "string",
          description: "Filter by activity type (e.g., 'running')",
        },
      },
    },
  },
  {
    name: "get_sleep",
    description:
      "Get sleep statistics including average duration and total nights tracked. Optionally filter by date range.",
    inputSchema: {
      type: "object",
      properties: {
        start_date: { type: "string", description: "Start date (YYYY-MM-DD)" },
        end_date: {
          type: "string",
          description: "End date (YYYY-MM-DD, exclusive recommended)",
        },
      },
    },
  },
  {
    name: "get_race_predictions",
    description:
      "Get predicted race times for 5K, 10K, half marathon, and marathon based on current fitness",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "get_heart_rate_zones",
    description:
      "Get personalized heart rate training zones based on max HR and lactate threshold",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "get_training_load",
    description:
      "Get training load data including acute/chronic workload ratio to assess overtraining risk",
    inputSchema: {
      type: "object",
      properties: {
        days: { type: "number", description: "Number of days (default: 30)" },
      },
    },
  },
] as const;
