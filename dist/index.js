"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_js_1 = require("@modelcontextprotocol/sdk/server/index.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
const types_js_1 = require("@modelcontextprotocol/sdk/types.js");
const supabase_js_1 = require("@supabase/supabase-js");
// ============================================================================
// CONFIGURATION
// ============================================================================
const SUPABASE_URL = process.env.SUPABASE_URL || "https://ylcbldppuaugitdnrjxv.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || "";
if (!SUPABASE_KEY) {
    console.error("Error: SUPABASE_ANON_KEY environment variable is required");
    process.exit(1);
}
const supabase = (0, supabase_js_1.createClient)(SUPABASE_URL, SUPABASE_KEY);
// ============================================================================
// HELPER FUNCTIONS
// ============================================================================
function formatTime(seconds) {
    if (!seconds)
        return "N/A";
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.round(seconds % 60);
    if (hrs > 0) {
        return `${hrs}:${mins.toString().padStart(2, "0")}:${secs
            .toString()
            .padStart(2, "0")}`;
    }
    return `${mins}:${secs.toString().padStart(2, "0")}`;
}
async function fetchAllActivities() {
    const pageSize = 1000;
    let from = 0;
    const all = [];
    while (true) {
        const { data, error } = await supabase
            .from("activities")
            .select("activity_type, distance_km, duration_minutes, avg_hr, start_time")
            .order("start_time", { ascending: true })
            .range(from, from + pageSize - 1);
        if (error)
            throw error;
        if (!data || data.length === 0)
            break;
        all.push(...data);
        if (data.length < pageSize)
            break;
        from += pageSize;
    }
    return all;
}
// ============================================================================
// TOOL IMPLEMENTATIONS
// ============================================================================
async function getVO2Max(startDate, endDate, sport) {
    let query = supabase
        .from("vo2_max")
        .select("calendar_date, vo2_max_value, sport")
        .order("calendar_date", { ascending: true });
    if (startDate)
        query = query.gte("calendar_date", startDate);
    // End date is exclusive
    if (endDate)
        query = query.lt("calendar_date", endDate);
    if (sport)
        query = query.eq("sport", sport);
    const { data, error } = await query;
    if (error)
        throw error;
    const values = (data || []).map((v) => v.vo2_max_value);
    const summary = {
        count: data?.length || 0,
        first: data?.[0] ?? null,
        latest: data?.[data.length - 1] ?? null,
        min: values.length ? Math.min(...values) : null,
        max: values.length ? Math.max(...values) : null,
        average: values.length
            ? Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10
            : null,
    };
    return { summary, data };
}
async function getActivities(startDate, endDate, activityType) {
    const all = await fetchAllActivities();
    let filtered = all;
    if (startDate)
        filtered = filtered.filter((a) => a.start_time >= startDate);
    if (endDate)
        filtered = filtered.filter((a) => a.start_time <= endDate);
    if (activityType)
        filtered = filtered.filter((a) => a.activity_type === activityType);
    const groups = {};
    filtered.forEach((a) => {
        const type = a.activity_type || "unknown";
        if (!groups[type])
            groups[type] = { count: 0, totalKm: 0, totalHours: 0 };
        groups[type].count += 1;
        groups[type].totalKm += a.distance_km || 0;
        groups[type].totalHours += (a.duration_minutes || 0) / 60;
    });
    const breakdown = Object.entries(groups)
        .map(([type, d]) => ({
        activity_type: type,
        count: d.count,
        total_km: Math.round(d.totalKm * 10) / 10,
        total_hours: Math.round(d.totalHours * 10) / 10,
    }))
        .sort((a, b) => b.count - a.count);
    return {
        total_activities: filtered.length,
        breakdown,
        date_range: {
            start: filtered[0]?.start_time?.split("T")[0] || null,
            end: filtered[filtered.length - 1]?.start_time?.split("T")[0] || null,
        },
    };
}
async function getSleep(startDate, endDate) {
    console.error("[getSleep] called with", { startDate, endDate });
    // If no date range, return the summary
    if (!startDate && !endDate) {
        const { data, error } = await supabase
            .from("sleep_summary")
            .select("*")
            .single();
        if (error)
            throw error;
        return {
            total_nights: data?.nights || 0,
            average_duration_hours: data?.avg_duration_hours
                ? Math.round(data.avg_duration_hours * 10) / 10
                : null,
            date_range: {
                first_night: data?.first_night || null,
                last_night: data?.last_night || null,
            },
        };
    }
    let query = supabase
        .from("sleep")
        .select("calendar_date, duration_hours")
        .not("duration_hours", "is", null)
        .order("calendar_date", { ascending: true });
    if (startDate)
        query = query.gte("calendar_date", startDate);
    // End date is exclusive (recommended)
    if (endDate)
        query = query.lt("calendar_date", endDate);
    const { data, error } = await query;
    if (error)
        throw error;
    const durations = (data || [])
        .map((s) => s.duration_hours)
        .filter((d) => typeof d === "number" && d > 0 && d < 24);
    const avgDuration = durations.length > 0
        ? Math.round((durations.reduce((a, b) => a + b, 0) / durations.length) * 10) / 10
        : null;
    return {
        total_nights: durations.length,
        average_duration_hours: avgDuration,
        min_hours: durations.length
            ? Math.round(Math.min(...durations) * 10) / 10
            : null,
        max_hours: durations.length
            ? Math.round(Math.max(...durations) * 10) / 10
            : null,
        date_range: {
            start: startDate || data?.[0]?.calendar_date || null,
            end: endDate || data?.[data.length - 1]?.calendar_date || null,
        },
    };
}
async function getRacePredictions() {
    const { data, error } = await supabase
        .from("race_predictions")
        .select("*")
        .order("calendar_date", { ascending: false })
        .limit(5);
    if (error)
        throw error;
    const latest = data?.[0];
    return {
        latest_date: latest?.calendar_date || null,
        predictions: {
            "5k": formatTime(latest?.race_time_5k),
            "10k": formatTime(latest?.race_time_10k),
            half_marathon: formatTime(latest?.race_time_half),
            marathon: formatTime(latest?.race_time_marathon),
        },
        history: data?.map((r) => ({
            date: r.calendar_date,
            "5k": formatTime(r.race_time_5k),
            "10k": formatTime(r.race_time_10k),
        })),
    };
}
async function getHeartRateZones() {
    const { data, error } = await supabase.from("heart_rate_zones").select("*").limit(1);
    if (error)
        throw error;
    const zones = data?.[0];
    if (!zones)
        return { error: "No heart rate zone data available" };
    return {
        max_hr: zones.max_hr,
        lactate_threshold_hr: zones.lactate_threshold_hr,
        zones: {
            zone1_warmup: `${zones.zone1_floor}-${zones.zone2_floor - 1} bpm`,
            zone2_easy: `${zones.zone2_floor}-${zones.zone3_floor - 1} bpm`,
            zone3_aerobic: `${zones.zone3_floor}-${zones.zone4_floor - 1} bpm`,
            zone4_threshold: `${zones.zone4_floor}-${zones.zone5_floor - 1} bpm`,
            zone5_maximum: `${zones.zone5_floor}-${zones.max_hr} bpm`,
        },
    };
}
async function getTrainingLoad(days = 30) {
    const { data, error } = await supabase
        .from("training_load")
        .select("*")
        .order("calendar_date", { ascending: false })
        .limit(days);
    if (error)
        throw error;
    const latest = data?.[0];
    return {
        latest: {
            date: latest?.calendar_date,
            acute_load: latest?.acute_load,
            chronic_load: latest?.chronic_load,
            status: latest?.acwr_status,
        },
        history: data?.map((t) => ({
            date: t.calendar_date,
            acute: t.acute_load,
            chronic: t.chronic_load,
            status: t.acwr_status,
        })),
    };
}
async function getHealthSummary() {
    const [vo2, activities, sleep, races, zones] = await Promise.all([
        getVO2Max(),
        getActivities(),
        getSleep(),
        getRacePredictions(),
        getHeartRateZones(),
    ]);
    return {
        vo2_max: {
            current: vo2.summary.latest?.vo2_max_value ?? null,
            peak: vo2.summary.max,
            readings: vo2.summary.count,
        },
        activities: {
            total: activities.total_activities,
            top_activity: activities.breakdown[0]?.activity_type ?? null,
            date_range: activities.date_range,
        },
        sleep: {
            nights_tracked: sleep.total_nights,
            average_hours: sleep.average_duration_hours,
        },
        race_predictions: races.predictions,
        max_hr: zones.max_hr || null,
    };
}
// ============================================================================
// MCP SERVER SETUP
// ============================================================================
const server = new index_js_1.Server({ name: "garmin-health-mcp-server", version: "1.0.0" }, { capabilities: { tools: {} } });
server.setRequestHandler(types_js_1.ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: "get_health_summary",
                description: "Get an overview of all health data including VO2 max, activities, sleep, and race predictions",
                inputSchema: { type: "object", properties: {} },
            },
            {
                name: "get_vo2max",
                description: "Get VO2 max history and trends. VO2 max measures cardiovascular fitness in ml/kg/min.",
                inputSchema: {
                    type: "object",
                    properties: {
                        start_date: { type: "string", description: "Start date (YYYY-MM-DD)" },
                        end_date: { type: "string", description: "End date (YYYY-MM-DD, exclusive recommended)" },
                        sport: { type: "string", description: "Filter by sport (e.g., 'running', 'cycling')" },
                    },
                },
            },
            {
                name: "get_activities",
                description: "Get activity breakdown by type, including counts, distances, and durations",
                inputSchema: {
                    type: "object",
                    properties: {
                        start_date: { type: "string", description: "Start date (YYYY-MM-DD)" },
                        end_date: { type: "string", description: "End date (YYYY-MM-DD)" },
                        activity_type: {
                            type: "string",
                            description: "Filter by activity type (e.g., 'running')",
                        },
                    },
                },
            },
            {
                name: "get_sleep",
                description: "Get sleep statistics including average duration and total nights tracked. Optionally filter by date range.",
                inputSchema: {
                    type: "object",
                    properties: {
                        start_date: { type: "string", description: "Start date (YYYY-MM-DD)" },
                        end_date: { type: "string", description: "End date (YYYY-MM-DD, exclusive recommended)" },
                    },
                },
            },
            {
                name: "get_race_predictions",
                description: "Get predicted race times for 5K, 10K, half marathon, and marathon based on current fitness",
                inputSchema: { type: "object", properties: {} },
            },
            {
                name: "get_heart_rate_zones",
                description: "Get personalized heart rate training zones based on max HR and lactate threshold",
                inputSchema: { type: "object", properties: {} },
            },
            {
                name: "get_training_load",
                description: "Get training load data including acute/chronic workload ratio to assess overtraining risk",
                inputSchema: {
                    type: "object",
                    properties: {
                        days: { type: "number", description: "Number of days (default: 30)" },
                    },
                },
            },
        ],
    };
});
server.setRequestHandler(types_js_1.CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    try {
        const a = args || {};
        console.error("[callTool]", name, a);
        let result;
        switch (name) {
            case "get_health_summary":
                result = await getHealthSummary();
                break;
            case "get_vo2max":
                result = await getVO2Max(a.start_date, a.end_date, a.sport);
                break;
            case "get_activities":
                result = await getActivities(a.start_date, a.end_date, a.activity_type);
                break;
            case "get_sleep":
                result = await getSleep(a.start_date, a.end_date);
                break;
            case "get_race_predictions":
                result = await getRacePredictions();
                break;
            case "get_heart_rate_zones":
                result = await getHeartRateZones();
                break;
            case "get_training_load":
                result = await getTrainingLoad(a.days || 30);
                break;
            default:
                throw new Error(`Unknown tool: ${name}`);
        }
        return {
            content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
    }
    catch (error) {
        return {
            content: [
                {
                    type: "text",
                    text: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
                },
            ],
            isError: true,
        };
    }
});
async function main() {
    const transport = new stdio_js_1.StdioServerTransport();
    await server.connect(transport);
    console.error("Garmin Health MCP Server running on stdio");
}
main().catch(console.error);
