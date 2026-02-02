import type { UsageStatsRow } from "./types";
import { usVal } from "./utils";

export type UsageTableSection = {
    title: string;
    headers: { label: string; flex?: number }[];
    rows: (string | number)[][];
};

export function buildUsageStatsSections(usage_stats: Record<string, unknown>): UsageTableSection[] {
    const out: UsageTableSection[] = [];
    const usageStats = usage_stats.usage_stats as Record<string, unknown> | undefined;
    const contentCreation = usage_stats.content_creation as Record<string, unknown> | undefined;
    const userStats = usage_stats.user_stats as Record<string, unknown> | undefined;
    const performance = usage_stats.performance as Record<string, unknown> | undefined;
    const quickWins = usage_stats.quick_wins as Record<string, unknown> | undefined;
    const pilotRecs = usage_stats.pilot_recommendations as Record<string, unknown> | undefined;

    const mostUsed = (usageStats?.["most_used_content_last_60_days"] ?? []) as UsageStatsRow[];
    const inactive = (usageStats?.["inactive_content_last_60_days"] ?? []) as UsageStatsRow[];
    const contentRate = (contentCreation?.["content_creation_rate"] ?? []) as UsageStatsRow[];
    const topUsers = (userStats?.["top_active_users"] ?? []) as UsageStatsRow[];
    const devActivity = (userStats?.["developer_activity"] ?? []) as UsageStatsRow[];
    const slowReports = (performance?.["frequently_used_slow_reports"] ?? []) as UsageStatsRow[];
    const quickWinsData = (quickWins?.["quick_wins_scatter"] ?? []) as UsageStatsRow[];
    const pilotData = (pilotRecs?.["recommended_pilot_reports"] ?? []) as UsageStatsRow[];

    if (mostUsed.length) {
        out.push({
            title: "Most Used Content (Last 60 Days)",
            headers: [
                { label: "RANK", flex: 0.4 },
                { label: "TARGET NAME", flex: 1.2 },
                { label: "PATH", flex: 1 },
                { label: "CONTENT TYPE", flex: 0.6 },
                { label: "VIEWS (60D)", flex: 0.5 },
                { label: "PRIMARY USER", flex: 0.8 },
            ],
            rows: mostUsed.map((r) => [
                usVal(r, "rank", "RANK") ?? "—",
                usVal(r, "target_name", "TARGET_NAME") ?? "—",
                String(usVal(r, "cogipf_target_path", "COGIPF_TARGET_PATH") ?? "").slice(0, 40),
                usVal(r, "content_type", "CONTENT_TYPE") ?? "—",
                usVal(r, "views_last_60_days", "VIEWS_LAST_60_DAYS") ?? "—",
                usVal(r, "primary_user", "PRIMARY_USER") ?? "—",
            ]),
        });
    }
    if (inactive.length) {
        out.push({
            title: "Inactive Content (Last 60 Days)",
            headers: [
                { label: "RANK", flex: 0.4 },
                { label: "TARGET NAME", flex: 1.2 },
                { label: "CONTENT TYPE", flex: 0.6 },
                { label: "DAYS SINCE LAST EXEC", flex: 0.6 },
                { label: "LAST USER", flex: 0.6 },
                { label: "REPORT PATH", flex: 1 },
            ],
            rows: inactive.map((r) => [
                usVal(r, "rank", "RANK") ?? "—",
                usVal(r, "target_name", "TARGET_NAME") ?? "—",
                usVal(r, "content_type", "CONTENT_TYPE") ?? "—",
                usVal(r, "days_since_last_execution", "DAYS_SINCE_LAST_EXECUTION") ?? "—",
                usVal(r, "last_executing_user", "LAST_EXECUTING_USER") ?? "—",
                String(usVal(r, "report_path", "REPORT_PATH") ?? "").slice(0, 40),
            ]),
        });
    }
    if (contentRate.length) {
        out.push({
            title: "Content Creation Rate",
            headers: [
                { label: "MONTH", flex: 0.6 },
                { label: "CONTENT TYPE", flex: 0.6 },
                { label: "NEW", flex: 0.4 },
                { label: "MODIFIED", flex: 0.5 },
                { label: "EXAMPLE", flex: 1.5 },
            ],
            rows: contentRate.map((r) => [
                usVal(r, "month_label", "MONTH_LABEL") ?? "—",
                usVal(r, "content_type", "CONTENT_TYPE") ?? "—",
                usVal(r, "new_artifacts_created", "NEW_ARTIFACTS_CREATED") ?? "—",
                usVal(r, "artifacts_modified", "ARTIFACTS_MODIFIED") ?? "—",
                String(usVal(r, "example_of_new_content", "EXAMPLE_OF_NEW_CONTENT") ?? "").slice(0, 50),
            ]),
        });
    }
    if (topUsers.length) {
        out.push({
            title: "Top Active Users",
            headers: [
                { label: "RANK", flex: 0.4 },
                { label: "USER NAME", flex: 1.2 },
                { label: "EXECUTIONS (60D)", flex: 0.6 },
                { label: "PRIMARY FOCUS", flex: 1 },
            ],
            rows: topUsers.map((r) => [
                usVal(r, "rank", "RANK") ?? "—",
                usVal(r, "user_name", "USER_NAME") ?? "—",
                usVal(r, "executions_last_60_days", "EXECUTIONS_LAST_60_DAYS") ?? "—",
                usVal(r, "primary_focus_most_viewed", "PRIMARY_FOCUS_MOST_VIEWED") ?? "—",
            ]),
        });
    }
    if (devActivity.length) {
        out.push({
            title: "Developer Activity",
            headers: [
                { label: "USERNAME", flex: 1 },
                { label: "REPORTS CREATED", flex: 0.6 },
                { label: "DASHBOARDS CREATED", flex: 0.6 },
                { label: "EXAMPLE WORKBOOKS", flex: 1.2 },
            ],
            rows: devActivity.map((r) => [
                usVal(r, "username", "USERNAME") ?? "—",
                usVal(r, "reports_created", "REPORTS_CREATED") ?? "—",
                usVal(r, "dashboards_created", "DASHBOARDS_CREATED") ?? "—",
                String(usVal(r, "example_workbooks_published", "EXAMPLE_WORKBOOKS_PUBLISHED") ?? "").slice(0, 40),
            ]),
        });
    }
    if (slowReports.length) {
        out.push({
            title: "Frequently Used Slow Reports",
            headers: [
                { label: "RANK", flex: 0.4 },
                { label: "WORKBOOK NAME", flex: 1 },
                { label: "AVG LOAD (SEC)", flex: 0.5 },
                { label: "VIEWS (60D)", flex: 0.5 },
                { label: "REPORT PATH", flex: 1 },
            ],
            rows: slowReports.map((r) => [
                usVal(r, "rank", "RANK") ?? "—",
                usVal(r, "workbook_name", "WORKBOOK_NAME") ?? "—",
                usVal(r, "avg_load_time_seconds", "AVG_LOAD_TIME_SECONDS") ?? "—",
                usVal(r, "views_last_60_days", "VIEWS_LAST_60_DAYS") ?? "—",
                String(usVal(r, "report_path", "REPORT_PATH") ?? "").slice(0, 40),
            ]),
        });
    }
    if (quickWinsData.length) {
        out.push({
            title: "Quick Wins",
            headers: [
                { label: "TARGET NAME", flex: 1.2 },
                { label: "CONTENT TYPE", flex: 0.6 },
                { label: "VIEWS (60D)", flex: 0.5 },
                { label: "MIGRATION CATEGORY", flex: 0.8 },
                { label: "PATH", flex: 1 },
            ],
            rows: quickWinsData.map((r) => [
                usVal(r, "target_name", "TARGET_NAME") ?? "—",
                usVal(r, "content_type", "CONTENT_TYPE") ?? "—",
                usVal(r, "views_last_60_days", "VIEWS_LAST_60_DAYS") ?? "—",
                usVal(r, "migration_category", "MIGRATION_CATEGORY") ?? "—",
                String(usVal(r, "cogipf_target_path", "COGIPF_TARGET_PATH") ?? "").slice(0, 40),
            ]),
        });
    }
    if (pilotData.length) {
        out.push({
            title: "Recommended Pilot Reports",
            headers: [
                { label: "TARGET NAME", flex: 1.2 },
                { label: "CONTENT TYPE", flex: 0.6 },
                { label: "MIGRATION CATEGORY", flex: 0.8 },
                { label: "AVG VIEWS", flex: 0.5 },
            ],
            rows: pilotData.map((r) => [
                usVal(r, "target_name", "TARGET_NAME") ?? "—",
                usVal(r, "content_type", "CONTENT_TYPE") ?? "—",
                usVal(r, "migration_category", "MIGRATION_CATEGORY") ?? "—",
                usVal(r, "avg_views", "AVG_VIEWS") ?? "—",
            ]),
        });
    }
    return out;
}
