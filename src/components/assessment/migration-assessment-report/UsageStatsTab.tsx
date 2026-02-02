"use client";

import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Info } from "lucide-react";
import type { UsageStatsRow } from "./types";
import type { PageNumber } from "./types";
import { usVal, buildPageNumbers } from "./utils";
import { PaginationControls } from "./PaginationControls";

const ITEMS_PER_PAGE = 10;

interface UsageStatsTabProps {
    usage_stats: Record<string, unknown> | null | undefined;
}

function UsageTable({
    title,
    data,
    children,
}: {
    title: string;
    data: UsageStatsRow[] | undefined;
    children: React.ReactNode;
}) {
    if (!Array.isArray(data) || data.length === 0) return null;
    return (
        <div key={title}>
            <h3 className="text-xl font-bold text-[var(--deep-green)] mb-4">{title}</h3>
            <div className="mb-8 rounded-lg shadow-md overflow-hidden border border-[var(--light-cream)] [font-family:var(--font-roboto-condensed)]">
                <Table className="text-lg">
                    {children}
                </Table>
            </div>
        </div>
    );
}

type SectionKey =
    | "mostUsed"
    | "inactive"
    | "contentRate"
    | "topUsers"
    | "devActivity"
    | "slowReports"
    | "quickWins"
    | "pilot";

export function UsageStatsTab({ usage_stats }: UsageStatsTabProps) {
    const [pages, setPages] = useState<Record<SectionKey, number>>({} as Record<SectionKey, number>);
    const getPage = (key: SectionKey) => pages[key] ?? 1;
    const setPage = (key: SectionKey, p: number) => setPages((prev) => ({ ...prev, [key]: p }));

    if (!usage_stats) {
        return (
            <div className="space-y-6">
                <div>
                    <h2 className="text-[2.6em] font-bold text-[var(--deep-green)] mb-[35px]">
                        <span className="border-b-4 border-[var(--royal-gold)]">Usage</span> Statistics
                    </h2>
                </div>
                <div className="text-center py-8 text-muted-foreground">
                    Usage statistics data would be displayed here when available. Upload a <code className="bg-gray-100 px-1 rounded">usage_stats.json</code> file with your assessment to see metrics.
                </div>
            </div>
        );
    }

    const usageStats = usage_stats.usage_stats as Record<string, unknown> | undefined;
    const contentCreation = usage_stats.content_creation as Record<string, unknown> | undefined;
    const userStats = usage_stats.user_stats as Record<string, unknown> | undefined;
    const performance = usage_stats.performance as Record<string, unknown> | undefined;
    const quickWins = usage_stats.quick_wins as Record<string, unknown> | undefined;
    const pilotRecs = usage_stats.pilot_recommendations as Record<string, unknown> | undefined;

    const mostUsed = usageStats?.["most_used_content_last_60_days"] as UsageStatsRow[] | undefined;
    const inactive = usageStats?.["inactive_content_last_60_days"] as UsageStatsRow[] | undefined;
    const contentRate = contentCreation?.["content_creation_rate"] as UsageStatsRow[] | undefined;
    const topUsers = userStats?.["top_active_users"] as UsageStatsRow[] | undefined;
    const devActivity = userStats?.["developer_activity"] as UsageStatsRow[] | undefined;
    const slowReports = performance?.["frequently_used_slow_reports"] as UsageStatsRow[] | undefined;
    const quickWinsData = quickWins?.["quick_wins_scatter"] as UsageStatsRow[] | undefined;
    const pilotData = pilotRecs?.["recommended_pilot_reports"] as UsageStatsRow[] | undefined;

    const paginate = (data: UsageStatsRow[] | undefined, key: SectionKey) => {
        const list = data ?? [];
        const currentPage = getPage(key);
        const totalPages = Math.ceil(list.length / ITEMS_PER_PAGE) || 1;
        const safePage = Math.min(Math.max(1, currentPage), totalPages);
        const start = (safePage - 1) * ITEMS_PER_PAGE;
        return {
            paginatedData: list.slice(start, start + ITEMS_PER_PAGE),
            totalPages,
            currentPage: safePage,
            pageNumbers: buildPageNumbers(totalPages, safePage) as PageNumber[],
            setPage: (p: number) => setPage(key, p),
            totalItems: list.length,
        };
    };

    const mostUsedP = paginate(mostUsed, "mostUsed");
    const inactiveP = paginate(inactive, "inactive");
    const contentRateP = paginate(contentRate, "contentRate");
    const topUsersP = paginate(topUsers, "topUsers");
    const devActivityP = paginate(devActivity, "devActivity");
    const slowReportsP = paginate(slowReports, "slowReports");
    const quickWinsP = paginate(quickWinsData, "quickWins");
    const pilotP = paginate(pilotData, "pilot");

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-[2.6em] font-bold text-[var(--deep-green)] mb-[35px]">
                    <span className="border-b-4 border-[var(--royal-gold)]">Usage</span> Statistics
                </h2>
                <div className="bg-[var(--light-cream)] border-l-4 border-[var(--royal-gold)] rounded-lg shadow-sm text-[1.12em] mb-[35px] py-[24px] px-[28px] flex items-start gap-3">
                    <Info className="h-5 w-5 text-[var(--deep-green)] mt-0.5 flex-shrink-0" />
                    <p className="text-[#333333]">
                        The following metrics detail which dashboards and reports are most valuable to the organization and which can be decommissioned to reduce migration scope.
                    </p>
                </div>
            </div>

            <div className="space-y-8">
                <UsageTable title="Most Used Content (Last 60 Days)" data={mostUsed}>
                    <TableHeader>
                        <TableRow className="bg-[var(--deep-green)] hover:bg-[var(--deep-green)] border-b-2 border-[var(--light-cream)]">
                            <TableHead className="text-white font-bold rounded-tl-lg py-4 px-5 h-auto">RANK</TableHead>
                            <TableHead className="text-white font-bold py-4 px-5 h-auto">TARGET NAME</TableHead>
                            <TableHead className="text-white font-bold py-4 px-5 h-auto">PATH</TableHead>
                            <TableHead className="text-white font-bold py-4 px-5 h-auto">CONTENT TYPE</TableHead>
                            <TableHead className="text-white font-bold py-4 px-5 h-auto text-right">VIEWS (60D)</TableHead>
                            <TableHead className="text-white font-bold rounded-tr-lg py-4 px-5 h-auto">PRIMARY USER</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {mostUsedP.paginatedData.map((row, idx) => {
                            const isLast = idx === mostUsedP.paginatedData.length - 1;
                            return (
                                <TableRow key={(mostUsedP.currentPage - 1) * ITEMS_PER_PAGE + idx} className={`${idx % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-[var(--light-cream)]`}>
                                    <TableCell className={`font-medium text-gray-900 py-4 px-5 ${isLast ? "rounded-bl-lg" : ""}`}>{usVal(row, "rank", "RANK") ?? "—"}</TableCell>
                                    <TableCell className="text-gray-900 py-4 px-5">{usVal(row, "target_name", "TARGET_NAME") ?? "—"}</TableCell>
                                    <TableCell className="text-gray-900 py-4 px-5 max-w-[200px] truncate" title={String(usVal(row, "cogipf_target_path", "COGIPF_TARGET_PATH") ?? "")}>{usVal(row, "cogipf_target_path", "COGIPF_TARGET_PATH") ?? "—"}</TableCell>
                                    <TableCell className="text-gray-900 py-4 px-5">{usVal(row, "content_type", "CONTENT_TYPE") ?? "—"}</TableCell>
                                    <TableCell className="text-gray-900 py-4 px-5 text-right">{usVal(row, "views_last_60_days", "VIEWS_LAST_60_DAYS") ?? "—"}</TableCell>
                                    <TableCell className={`text-gray-900 py-4 px-5 ${isLast ? "rounded-br-lg" : ""}`}>{usVal(row, "primary_user", "PRIMARY_USER") ?? "—"}</TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </UsageTable>
                {mostUsedP.totalItems > ITEMS_PER_PAGE && (
                    <PaginationControls
                        currentPage={mostUsedP.currentPage}
                        totalPages={mostUsedP.totalPages}
                        pageNumbers={mostUsedP.pageNumbers}
                        itemsPerPage={ITEMS_PER_PAGE}
                        totalItems={mostUsedP.totalItems}
                        onPageChange={mostUsedP.setPage}
                        label="entries"
                        ellipsisKeyPrefix="usage-mostUsed"
                    />
                )}

                <UsageTable title="Inactive Content (Last 60 Days)" data={inactive}>
                    <TableHeader>
                        <TableRow className="bg-[var(--deep-green)] hover:bg-[var(--deep-green)] border-b-2 border-[var(--light-cream)]">
                            <TableHead className="text-white font-bold rounded-tl-lg py-4 px-5 h-auto">RANK</TableHead>
                            <TableHead className="text-white font-bold py-4 px-5 h-auto">TARGET NAME</TableHead>
                            <TableHead className="text-white font-bold py-4 px-5 h-auto">CONTENT TYPE</TableHead>
                            <TableHead className="text-white font-bold py-4 px-5 h-auto text-right">DAYS SINCE LAST EXEC</TableHead>
                            <TableHead className="text-white font-bold py-4 px-5 h-auto">LAST USER</TableHead>
                            <TableHead className="text-white font-bold rounded-tr-lg py-4 px-5 h-auto">REPORT PATH</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {inactiveP.paginatedData.map((row, idx) => {
                            const isLast = idx === inactiveP.paginatedData.length - 1;
                            return (
                                <TableRow key={(inactiveP.currentPage - 1) * ITEMS_PER_PAGE + idx} className={`${idx % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-[var(--light-cream)]`}>
                                    <TableCell className={`font-medium text-gray-900 py-4 px-5 ${isLast ? "rounded-bl-lg" : ""}`}>{usVal(row, "rank", "RANK") ?? "—"}</TableCell>
                                    <TableCell className="text-gray-900 py-4 px-5">{usVal(row, "target_name", "TARGET_NAME") ?? "—"}</TableCell>
                                    <TableCell className="text-gray-900 py-4 px-5">{usVal(row, "content_type", "CONTENT_TYPE") ?? "—"}</TableCell>
                                    <TableCell className="text-gray-900 py-4 px-5 text-right">{usVal(row, "days_since_last_execution", "DAYS_SINCE_LAST_EXECUTION") ?? "—"}</TableCell>
                                    <TableCell className="text-gray-900 py-4 px-5">{usVal(row, "last_executing_user", "LAST_EXECUTING_USER") ?? "—"}</TableCell>
                                    <TableCell className={`text-gray-900 py-4 px-5 max-w-[200px] truncate ${isLast ? "rounded-br-lg" : ""}`} title={String(usVal(row, "report_path", "REPORT_PATH") ?? "")}>{usVal(row, "report_path", "REPORT_PATH") ?? "—"}</TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </UsageTable>
                {inactiveP.totalItems > ITEMS_PER_PAGE && (
                    <PaginationControls currentPage={inactiveP.currentPage} totalPages={inactiveP.totalPages} pageNumbers={inactiveP.pageNumbers} itemsPerPage={ITEMS_PER_PAGE} totalItems={inactiveP.totalItems} onPageChange={inactiveP.setPage} label="entries" ellipsisKeyPrefix="usage-inactive" />
                )}

                <UsageTable title="Content Creation Rate" data={contentRate}>
                    <TableHeader>
                        <TableRow className="bg-[var(--deep-green)] hover:bg-[var(--deep-green)] border-b-2 border-[var(--light-cream)]">
                            <TableHead className="text-white font-bold rounded-tl-lg py-4 px-5 h-auto">MONTH</TableHead>
                            <TableHead className="text-white font-bold py-4 px-5 h-auto">CONTENT TYPE</TableHead>
                            <TableHead className="text-white font-bold py-4 px-5 h-auto text-right">NEW</TableHead>
                            <TableHead className="text-white font-bold py-4 px-5 h-auto text-right">MODIFIED</TableHead>
                            <TableHead className="text-white font-bold rounded-tr-lg py-4 px-5 h-auto">EXAMPLE</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {contentRateP.paginatedData.map((row, idx) => {
                            const isLast = idx === contentRateP.paginatedData.length - 1;
                            return (
                                <TableRow key={(contentRateP.currentPage - 1) * ITEMS_PER_PAGE + idx} className={`${idx % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-[var(--light-cream)]`}>
                                    <TableCell className={`font-medium text-gray-900 py-4 px-5 ${isLast ? "rounded-bl-lg" : ""}`}>{usVal(row, "month_label", "MONTH_LABEL") ?? "—"}</TableCell>
                                    <TableCell className="text-gray-900 py-4 px-5">{usVal(row, "content_type", "CONTENT_TYPE") ?? "—"}</TableCell>
                                    <TableCell className="text-gray-900 py-4 px-5 text-right">{usVal(row, "new_artifacts_created", "NEW_ARTIFACTS_CREATED") ?? "—"}</TableCell>
                                    <TableCell className="text-gray-900 py-4 px-5 text-right">{usVal(row, "artifacts_modified", "ARTIFACTS_MODIFIED") ?? "—"}</TableCell>
                                    <TableCell className={`text-gray-900 py-4 px-5 max-w-[240px] truncate ${isLast ? "rounded-br-lg" : ""}`} title={String(usVal(row, "example_of_new_content", "EXAMPLE_OF_NEW_CONTENT") ?? "")}>{usVal(row, "example_of_new_content", "EXAMPLE_OF_NEW_CONTENT") ?? "—"}</TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </UsageTable>
                {contentRateP.totalItems > ITEMS_PER_PAGE && (
                    <PaginationControls currentPage={contentRateP.currentPage} totalPages={contentRateP.totalPages} pageNumbers={contentRateP.pageNumbers} itemsPerPage={ITEMS_PER_PAGE} totalItems={contentRateP.totalItems} onPageChange={contentRateP.setPage} label="entries" ellipsisKeyPrefix="usage-contentRate" />
                )}

                <UsageTable title="Top Active Users" data={topUsers}>
                    <TableHeader>
                        <TableRow className="bg-[var(--deep-green)] hover:bg-[var(--deep-green)] border-b-2 border-[var(--light-cream)]">
                            <TableHead className="text-white font-bold rounded-tl-lg py-4 px-5 h-auto">RANK</TableHead>
                            <TableHead className="text-white font-bold py-4 px-5 h-auto">USER NAME</TableHead>
                            <TableHead className="text-white font-bold py-4 px-5 h-auto text-right">EXECUTIONS (60D)</TableHead>
                            <TableHead className="text-white font-bold rounded-tr-lg py-4 px-5 h-auto">PRIMARY FOCUS</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {topUsersP.paginatedData.map((row, idx) => {
                            const isLast = idx === topUsersP.paginatedData.length - 1;
                            return (
                                <TableRow key={(topUsersP.currentPage - 1) * ITEMS_PER_PAGE + idx} className={`${idx % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-[var(--light-cream)]`}>
                                    <TableCell className={`font-medium text-gray-900 py-4 px-5 ${isLast ? "rounded-bl-lg" : ""}`}>{usVal(row, "rank", "RANK") ?? "—"}</TableCell>
                                    <TableCell className="text-gray-900 py-4 px-5">{usVal(row, "user_name", "USER_NAME") ?? "—"}</TableCell>
                                    <TableCell className="text-gray-900 py-4 px-5 text-right">{usVal(row, "executions_last_60_days", "EXECUTIONS_LAST_60_DAYS") ?? "—"}</TableCell>
                                    <TableCell className={`text-gray-900 py-4 px-5 ${isLast ? "rounded-br-lg" : ""}`}>{usVal(row, "primary_focus_most_viewed", "PRIMARY_FOCUS_MOST_VIEWED") ?? "—"}</TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </UsageTable>
                {topUsersP.totalItems > ITEMS_PER_PAGE && (
                    <PaginationControls currentPage={topUsersP.currentPage} totalPages={topUsersP.totalPages} pageNumbers={topUsersP.pageNumbers} itemsPerPage={ITEMS_PER_PAGE} totalItems={topUsersP.totalItems} onPageChange={topUsersP.setPage} label="entries" ellipsisKeyPrefix="usage-topUsers" />
                )}

                <UsageTable title="Developer Activity" data={devActivity}>
                    <TableHeader>
                        <TableRow className="bg-[var(--deep-green)] hover:bg-[var(--deep-green)] border-b-2 border-[var(--light-cream)]">
                            <TableHead className="text-white font-bold rounded-tl-lg py-4 px-5 h-auto">USERNAME</TableHead>
                            <TableHead className="text-white font-bold py-4 px-5 h-auto text-right">REPORTS CREATED</TableHead>
                            <TableHead className="text-white font-bold py-4 px-5 h-auto text-right">DASHBOARDS CREATED</TableHead>
                            <TableHead className="text-white font-bold rounded-tr-lg py-4 px-5 h-auto">EXAMPLE WORKBOOKS</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {devActivityP.paginatedData.map((row, idx) => {
                            const isLast = idx === devActivityP.paginatedData.length - 1;
                            return (
                                <TableRow key={(devActivityP.currentPage - 1) * ITEMS_PER_PAGE + idx} className={`${idx % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-[var(--light-cream)]`}>
                                    <TableCell className={`font-medium text-gray-900 py-4 px-5 ${isLast ? "rounded-bl-lg" : ""}`}>{usVal(row, "username", "USERNAME") ?? "—"}</TableCell>
                                    <TableCell className="text-gray-900 py-4 px-5 text-right">{usVal(row, "reports_created", "REPORTS_CREATED") ?? "—"}</TableCell>
                                    <TableCell className="text-gray-900 py-4 px-5 text-right">{usVal(row, "dashboards_created", "DASHBOARDS_CREATED") ?? "—"}</TableCell>
                                    <TableCell className={`text-gray-900 py-4 px-5 max-w-[280px] truncate ${isLast ? "rounded-br-lg" : ""}`} title={String(usVal(row, "example_workbooks_published", "EXAMPLE_WORKBOOKS_PUBLISHED") ?? "")}>{usVal(row, "example_workbooks_published", "EXAMPLE_WORKBOOKS_PUBLISHED") ?? "—"}</TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </UsageTable>
                {devActivityP.totalItems > ITEMS_PER_PAGE && (
                    <PaginationControls currentPage={devActivityP.currentPage} totalPages={devActivityP.totalPages} pageNumbers={devActivityP.pageNumbers} itemsPerPage={ITEMS_PER_PAGE} totalItems={devActivityP.totalItems} onPageChange={devActivityP.setPage} label="entries" ellipsisKeyPrefix="usage-devActivity" />
                )}

                <UsageTable title="Frequently Used Slow Reports" data={slowReports}>
                    <TableHeader>
                        <TableRow className="bg-[var(--deep-green)] hover:bg-[var(--deep-green)] border-b-2 border-[var(--light-cream)]">
                            <TableHead className="text-white font-bold rounded-tl-lg py-4 px-5 h-auto">RANK</TableHead>
                            <TableHead className="text-white font-bold py-4 px-5 h-auto">WORKBOOK NAME</TableHead>
                            <TableHead className="text-white font-bold py-4 px-5 h-auto text-right">AVG LOAD (SEC)</TableHead>
                            <TableHead className="text-white font-bold py-4 px-5 h-auto text-right">VIEWS (60D)</TableHead>
                            <TableHead className="text-white font-bold rounded-tr-lg py-4 px-5 h-auto">REPORT PATH</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {slowReportsP.paginatedData.map((row, idx) => {
                            const isLast = idx === slowReportsP.paginatedData.length - 1;
                            return (
                                <TableRow key={(slowReportsP.currentPage - 1) * ITEMS_PER_PAGE + idx} className={`${idx % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-[var(--light-cream)]`}>
                                    <TableCell className={`font-medium text-gray-900 py-4 px-5 ${isLast ? "rounded-bl-lg" : ""}`}>{usVal(row, "rank", "RANK") ?? "—"}</TableCell>
                                    <TableCell className="text-gray-900 py-4 px-5">{usVal(row, "workbook_name", "WORKBOOK_NAME") ?? "—"}</TableCell>
                                    <TableCell className="text-gray-900 py-4 px-5 text-right">{usVal(row, "avg_load_time_seconds", "AVG_LOAD_TIME_SECONDS") ?? "—"}</TableCell>
                                    <TableCell className="text-gray-900 py-4 px-5 text-right">{usVal(row, "views_last_60_days", "VIEWS_LAST_60_DAYS") ?? "—"}</TableCell>
                                    <TableCell className={`text-gray-900 py-4 px-5 max-w-[200px] truncate ${isLast ? "rounded-br-lg" : ""}`} title={String(usVal(row, "report_path", "REPORT_PATH") ?? "")}>{usVal(row, "report_path", "REPORT_PATH") ?? "—"}</TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </UsageTable>
                {slowReportsP.totalItems > ITEMS_PER_PAGE && (
                    <PaginationControls currentPage={slowReportsP.currentPage} totalPages={slowReportsP.totalPages} pageNumbers={slowReportsP.pageNumbers} itemsPerPage={ITEMS_PER_PAGE} totalItems={slowReportsP.totalItems} onPageChange={slowReportsP.setPage} label="entries" ellipsisKeyPrefix="usage-slowReports" />
                )}

                <UsageTable title="Quick Wins" data={quickWinsData}>
                    <TableHeader>
                        <TableRow className="bg-[var(--deep-green)] hover:bg-[var(--deep-green)] border-b-2 border-[var(--light-cream)]">
                            <TableHead className="text-white font-bold rounded-tl-lg py-4 px-5 h-auto">TARGET NAME</TableHead>
                            <TableHead className="text-white font-bold py-4 px-5 h-auto">CONTENT TYPE</TableHead>
                            <TableHead className="text-white font-bold py-4 px-5 h-auto text-right">VIEWS (60D)</TableHead>
                            <TableHead className="text-white font-bold py-4 px-5 h-auto">MIGRATION CATEGORY</TableHead>
                            <TableHead className="text-white font-bold rounded-tr-lg py-4 px-5 h-auto">PATH</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {quickWinsP.paginatedData.map((row, idx) => {
                            const isLast = idx === quickWinsP.paginatedData.length - 1;
                            return (
                                <TableRow key={(quickWinsP.currentPage - 1) * ITEMS_PER_PAGE + idx} className={`${idx % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-[var(--light-cream)]`}>
                                    <TableCell className={`font-medium text-gray-900 py-4 px-5 ${isLast ? "rounded-bl-lg" : ""}`}>{usVal(row, "target_name", "TARGET_NAME") ?? "—"}</TableCell>
                                    <TableCell className="text-gray-900 py-4 px-5">{usVal(row, "content_type", "CONTENT_TYPE") ?? "—"}</TableCell>
                                    <TableCell className="text-gray-900 py-4 px-5 text-right">{usVal(row, "views_last_60_days", "VIEWS_LAST_60_DAYS") ?? "—"}</TableCell>
                                    <TableCell className="text-gray-900 py-4 px-5">{usVal(row, "migration_category", "MIGRATION_CATEGORY") ?? "—"}</TableCell>
                                    <TableCell className={`text-gray-900 py-4 px-5 max-w-[200px] truncate ${isLast ? "rounded-br-lg" : ""}`} title={String(usVal(row, "cogipf_target_path", "COGIPF_TARGET_PATH") ?? "")}>{usVal(row, "cogipf_target_path", "COGIPF_TARGET_PATH") ?? "—"}</TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </UsageTable>
                {quickWinsP.totalItems > ITEMS_PER_PAGE && (
                    <PaginationControls currentPage={quickWinsP.currentPage} totalPages={quickWinsP.totalPages} pageNumbers={quickWinsP.pageNumbers} itemsPerPage={ITEMS_PER_PAGE} totalItems={quickWinsP.totalItems} onPageChange={quickWinsP.setPage} label="entries" ellipsisKeyPrefix="usage-quickWins" />
                )}

                <UsageTable title="Recommended Pilot Reports" data={pilotData}>
                    <TableHeader>
                        <TableRow className="bg-[var(--deep-green)] hover:bg-[var(--deep-green)] border-b-2 border-[var(--light-cream)]">
                            <TableHead className="text-white font-bold rounded-tl-lg py-4 px-5 h-auto">TARGET NAME</TableHead>
                            <TableHead className="text-white font-bold py-4 px-5 h-auto">CONTENT TYPE</TableHead>
                            <TableHead className="text-white font-bold py-4 px-5 h-auto">MIGRATION CATEGORY</TableHead>
                            <TableHead className="text-white font-bold rounded-tr-lg py-4 px-5 h-auto text-right">AVG VIEWS</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {pilotP.paginatedData.map((row, idx) => {
                            const isLast = idx === pilotP.paginatedData.length - 1;
                            return (
                                <TableRow key={(pilotP.currentPage - 1) * ITEMS_PER_PAGE + idx} className={`${idx % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-[var(--light-cream)]`}>
                                    <TableCell className={`font-medium text-gray-900 py-4 px-5 ${isLast ? "rounded-bl-lg" : ""}`}>{usVal(row, "target_name", "TARGET_NAME") ?? "—"}</TableCell>
                                    <TableCell className="text-gray-900 py-4 px-5">{usVal(row, "content_type", "CONTENT_TYPE") ?? "—"}</TableCell>
                                    <TableCell className="text-gray-900 py-4 px-5">{usVal(row, "migration_category", "MIGRATION_CATEGORY") ?? "—"}</TableCell>
                                    <TableCell className={`text-gray-900 py-4 px-5 text-right ${isLast ? "rounded-br-lg" : ""}`}>{usVal(row, "avg_views", "AVG_VIEWS") ?? "—"}</TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </UsageTable>
                {pilotP.totalItems > ITEMS_PER_PAGE && (
                    <PaginationControls currentPage={pilotP.currentPage} totalPages={pilotP.totalPages} pageNumbers={pilotP.pageNumbers} itemsPerPage={ITEMS_PER_PAGE} totalItems={pilotP.totalItems} onPageChange={pilotP.setPage} label="entries" ellipsisKeyPrefix="usage-pilot" />
                )}
            </div>
        </div>
    );
}
