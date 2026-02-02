"use client";

import {
    Document,
    Page,
    View,
    Text,
    StyleSheet,
} from "@react-pdf/renderer";
import type { Summary, ComplexAnalysis } from "@/lib/api";
import { buildUsageStatsSections } from "./buildUsageStatsSections";

// Register fonts for consistent rendering (optional; fallback to built-in)
const styles = StyleSheet.create({
    page: { padding: 40, fontFamily: "Helvetica", fontSize: 9 },
    coverHeader: {
        backgroundColor: "#1a5f3f",
        color: "white",
        padding: 24,
        marginBottom: 24,
        borderRadius: 4,
    },
    coverTitle: { fontSize: 24, fontWeight: "bold", marginBottom: 12, textAlign: "center" },
    coverSubtitle: { fontSize: 12, marginBottom: 8, textAlign: "center" },
    coverMeta: { fontSize: 10, textAlign: "center", color: "#e5e5e5" },
    sectionTitle: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#1a5f3f",
        marginBottom: 8,
        borderBottomWidth: 2,
        borderBottomColor: "#c29a4a",
        paddingBottom: 4,
    },
    sectionSubtitle: { fontSize: 12, fontWeight: "bold", color: "#1a5f3f", marginTop: 16, marginBottom: 6 },
    bodyText: { marginBottom: 10, color: "#333" },
    table: { marginBottom: 16 },
    tableRow: { flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: "#ddd" },
    tableHeaderRow: { flexDirection: "row", backgroundColor: "#1a5f3f", color: "white" },
    tableCell: { padding: 6, flex: 1 },
    tableCellSmall: { padding: 6, flex: 0.5 },
    tableCellLarge: { padding: 6, flex: 2 },
    tableHeaderCell: { padding: 6, flex: 1, fontWeight: "bold", fontSize: 8 },
    tableHeaderCellSmall: { padding: 6, flex: 0.5, fontWeight: "bold", fontSize: 8 },
    tableHeaderCellLarge: { padding: 6, flex: 2, fontWeight: "bold", fontSize: 8 },
    badge: { backgroundColor: "#e5e5e5", paddingHorizontal: 6, paddingVertical: 2, alignSelf: "flex-start", borderRadius: 2 },
    pageNumber: { position: "absolute", bottom: 20, right: 40, fontSize: 8, color: "#666" },
});

function PageNumber() {
    return (
        <Text fixed style={styles.pageNumber} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
    );
}

export interface ReportPdfData {
    formattedDate: string;
    assessmentName?: string;
    biTool?: string;
    summary?: Summary | null;
    complex_analysis?: ComplexAnalysis | null;
    inventorySummary: {
        totalDashboards: number;
        totalReports: number;
    };
    overallComplexity: string;
    usage_stats?: Record<string, unknown> | null;
    challengesList: Array<{
        visualization: string;
        visualization_type: string;
        complexity: string;
        description?: string | null;
        recommended?: string | null;
        dashboard_or_report_name?: string | null;
    }>;
    appendixDashboardsList: Array<{ name: string; package: string[]; data_module: string[]; owner: string }>;
    appendixReportsList: Array<{ name: string; package: string[]; data_module: string[]; owner: string }>;
}

function PdfTable({
    headers,
    rows,
}: {
    headers: { label: string; flex?: number }[];
    rows: (string | number)[][];
}) {
    if (rows.length === 0) return null;
    const flex = (i: number) => headers[i]?.flex ?? 1;
    return (
        <View style={styles.table}>
            <View style={styles.tableHeaderRow}>
                {headers.map((h, i) => (
                    <View key={i} style={[styles.tableHeaderCell, { flex: flex(i) }]}>
                        <Text>{h.label}</Text>
                    </View>
                ))}
            </View>
            {rows.map((row, ri) => (
                <View key={ri} style={[styles.tableRow, ...(ri % 2 === 1 ? [{ backgroundColor: "#f9f9f9" }] : [])]}>
                    {row.map((cell, ci) => (
                        <View key={ci} style={[styles.tableCell, { flex: flex(ci) }]}>
                            <Text>{String(cell ?? "—")}</Text>
                        </View>
                    ))}
                </View>
            ))}
        </View>
    );
}

const COMPLEXITY_SECTION_CONFIG: Array<{
    key: keyof ComplexAnalysis;
    title: string;
    featureAreaLabel: string;
    columns: { header: string; key: string }[];
}> = [
    { key: "visualization", title: "Visualization", featureAreaLabel: "Visualization", columns: [
        { header: "VISUALIZATIONS", key: "visualization_count" }, { header: "DASHBOARDS AFFECTED", key: "dashboards_containing_count" }, { header: "REPORTS AFFECTED", key: "reports_containing_count" },
    ]},
    { key: "dashboard", title: "Dashboard", featureAreaLabel: "Dashboard", columns: [{ header: "DASHBOARDS AFFECTED", key: "dashboards_containing_count" }]},
    { key: "report", title: "Report", featureAreaLabel: "Report", columns: [{ header: "REPORTS AFFECTED", key: "reports_containing_count" }]},
    { key: "calculated_field", title: "Calculated Field", featureAreaLabel: "Calculated Field", columns: [
        { header: "CALCULATED FIELDS", key: "calculated_field_count" }, { header: "DASHBOARDS AFFECTED", key: "dashboards_containing_count" }, { header: "REPORTS AFFECTED", key: "reports_containing_count" },
    ]},
    { key: "filter", title: "Filter", featureAreaLabel: "Filter", columns: [
        { header: "FILTERS", key: "filter_count" }, { header: "DASHBOARDS AFFECTED", key: "dashboards_containing_count" }, { header: "REPORTS AFFECTED", key: "reports_containing_count" },
    ]},
    { key: "measure", title: "Measure", featureAreaLabel: "Measure", columns: [
        { header: "MEASURES", key: "measure_count" }, { header: "DASHBOARDS AFFECTED", key: "dashboards_containing_count" }, { header: "REPORTS AFFECTED", key: "reports_containing_count" },
    ]},
    { key: "dimension", title: "Dimension", featureAreaLabel: "Dimension", columns: [
        { header: "DIMENSIONS", key: "dimension_count" }, { header: "DASHBOARDS AFFECTED", key: "dashboards_containing_count" }, { header: "REPORTS AFFECTED", key: "reports_containing_count" },
    ]},
    { key: "parameter", title: "Parameter", featureAreaLabel: "Parameter", columns: [
        { header: "PARAMETERS", key: "parameter_count" }, { header: "DASHBOARDS AFFECTED", key: "dashboards_containing_count" }, { header: "REPORTS AFFECTED", key: "reports_containing_count" },
    ]},
    { key: "sort", title: "Sort", featureAreaLabel: "Sort", columns: [
        { header: "SORTS", key: "sort_count" }, { header: "DASHBOARDS AFFECTED", key: "dashboards_containing_count" }, { header: "REPORTS AFFECTED", key: "reports_containing_count" },
    ]},
    { key: "prompt", title: "Prompt", featureAreaLabel: "Prompt", columns: [
        { header: "PROMPTS", key: "prompt_count" }, { header: "DASHBOARDS AFFECTED", key: "dashboards_containing_count" }, { header: "REPORTS AFFECTED", key: "reports_containing_count" },
    ]},
    { key: "query", title: "Query", featureAreaLabel: "Query", columns: [
        { header: "QUERIES", key: "query_count" }, { header: "DASHBOARDS AFFECTED", key: "dashboards_containing_count" }, { header: "REPORTS AFFECTED", key: "reports_containing_count" },
    ]},
];

interface AssessmentReportPdfProps {
    data: ReportPdfData;
}

export function AssessmentReportPdf({ data }: AssessmentReportPdfProps) {
    const {
        formattedDate,
        assessmentName = "Assessment",
        biTool = "Cognos",
        summary,
        complex_analysis,
        inventorySummary,
        overallComplexity,
        usage_stats,
        challengesList,
        appendixDashboardsList,
        appendixReportsList,
    } = data;

    return (
        <Document>
            {/* Page 1: Cover / Title */}
            <Page size="A4" style={styles.page}>
                <View style={styles.coverHeader}>
                    <Text style={styles.coverTitle}>Migration Assessment Report</Text>
                    <Text style={styles.coverSubtitle}>{biTool} to Looker Strategic Migration Analysis</Text>
                    <Text style={styles.coverMeta}>Date Generated: {formattedDate}</Text>
                    <Text style={styles.coverMeta}>Assessed Environment: {assessmentName}</Text>
                </View>
                <Text style={styles.bodyText}>SQUARESHIFT</Text>
                <PageNumber />
            </Page>

            {/* Page 2: Summary */}
            <Page size="A4" style={styles.page}>
                <Text style={styles.sectionTitle}>Executive Summary</Text>
                <Text style={styles.bodyText}>
                    This assessment analyzed the {biTool} environment ({inventorySummary.totalDashboards} dashboards, {inventorySummary.totalReports} reports)
                    focusing on inventory, usage, and complexity to inform the Looker migration strategy.
                </Text>
                <Text style={styles.bodyText}>Overall Complexity Score: {overallComplexity}</Text>

                {summary?.key_findings && summary.key_findings.length > 0 && (
                    <>
                        <Text style={styles.sectionSubtitle}>Key Findings</Text>
                        <PdfTable
                            headers={[
                                { label: "AREA", flex: 1.2 },
                                { label: "COMPLEXITY", flex: 0.8 },
                                { label: "COUNT", flex: 0.5 },
                                { label: "DASHBOARD", flex: 1 },
                                { label: "REPORT", flex: 1 },
                            ]}
                            rows={summary.key_findings.map((f) => [
                                f.feature_area,
                                f.complexity,
                                f.count,
                                f.dashboards_summary,
                                f.reports_summary,
                            ])}
                        />
                    </>
                )}

                {summary?.high_level_complexity_overview && summary.high_level_complexity_overview.length > 0 && (
                    <>
                        <Text style={styles.sectionSubtitle}>High-Level Complexity Overview</Text>
                        <PdfTable
                            headers={[
                                { label: "COMPLEXITY", flex: 1 },
                                { label: "VISUALIZATION", flex: 0.8 },
                                { label: "DASHBOARD", flex: 0.8 },
                                { label: "REPORT", flex: 0.8 },
                            ]}
                            rows={summary.high_level_complexity_overview.map((r) => [
                                r.complexity,
                                r.visualization_count,
                                r.dashboard_count,
                                r.report_count,
                            ])}
                        />
                    </>
                )}

                {summary?.inventory && summary.inventory.length > 0 && (
                    <>
                        <Text style={styles.sectionSubtitle}>Inventory Summary</Text>
                        <PdfTable
                            headers={[{ label: "ASSET TYPE", flex: 1.5 }, { label: "COUNT", flex: 0.5 }]}
                            rows={summary.inventory.map((i) => [i.asset_type, i.count])}
                        />
                    </>
                )}
                <PageNumber />
            </Page>

            {/* Page 3: Complexity Analysis */}
            <Page size="A4" style={styles.page}>
                <Text style={styles.sectionTitle}>Complexity Analysis</Text>
                <Text style={styles.bodyText}>
                    Information about identified numbers of elements across various categories to show the overall plan of the data migration.
                </Text>
                {COMPLEXITY_SECTION_CONFIG.map(({ key, title, featureAreaLabel, columns }) => {
                    const items = complex_analysis?.[key];
                    if (!Array.isArray(items) || items.length === 0) return null;
                    const headers = [{ label: "FEATURE AREA", flex: 1 }, { label: "COMPLEXITY", flex: 0.8 }, { label: "FEATURE", flex: 1 }, ...columns.map((c) => ({ label: c.header, flex: 0.8 as number }))];
                    const rows = (items as unknown as Array<Record<string, unknown>>).map((item): (string | number)[] => {
                        const complexity = String(item.complexity ?? "").charAt(0).toUpperCase() + String(item.complexity ?? "").slice(1).toLowerCase();
                        return [
                            featureAreaLabel,
                            complexity,
                            String(item.feature ?? "—"),
                            ...columns.map((c): string | number => (typeof item[c.key] === "number" ? (item[c.key] as number) : String(item[c.key] ?? "—"))),
                        ];
                    });
                    return (
                        <View key={key}>
                            <Text style={styles.sectionSubtitle}>{title}</Text>
                            <PdfTable headers={headers} rows={rows} />
                        </View>
                    );
                })}
                <PageNumber />
            </Page>

            {/* Page 4: Usage Stats */}
            <Page size="A4" style={styles.page}>
                <Text style={styles.sectionTitle}>Usage Statistics</Text>
                <Text style={styles.bodyText}>
                    The following metrics detail which dashboards and reports are most valuable and which can be decommissioned to reduce migration scope.
                </Text>
                {usage_stats
                    ? buildUsageStatsSections(usage_stats).map((s) => (
                          <View key={s.title}>
                              <Text style={styles.sectionSubtitle}>{s.title}</Text>
                              <PdfTable headers={s.headers} rows={s.rows} />
                          </View>
                      ))
                    : <Text style={styles.bodyText}>No usage statistics data available.</Text>}
                <PageNumber />
            </Page>

            {/* Page 5: Challenges */}
            <Page size="A4" style={styles.page}>
                <Text style={styles.sectionTitle}>Identified Challenges & Recommendations</Text>
                <Text style={styles.bodyText}>
                    Based on the assessment, several key challenges have been identified along with strategic recommendations to ensure a successful migration.
                </Text>
                {challengesList.length > 0 ? (
                    <PdfTable
                        headers={[
                            { label: "VISUALIZATION", flex: 1 },
                            { label: "TYPE", flex: 0.6 },
                            { label: "COMPLEXITY", flex: 0.5 },
                            { label: "DESCRIPTION", flex: 1.2 },
                            { label: "RECOMMENDED", flex: 1.2 },
                            { label: "DASHBOARD / REPORT", flex: 1 },
                        ]}
                        rows={challengesList.map((c) => [
                            c.visualization,
                            c.visualization_type,
                            (c.complexity || "").charAt(0).toUpperCase() + (c.complexity || "").slice(1).toLowerCase(),
                            (c.description ?? "—").slice(0, 60),
                            (c.recommended ?? "—").slice(0, 60),
                            c.dashboard_or_report_name ?? "—",
                        ])}
                    />
                ) : (
                    <Text style={styles.bodyText}>No challenges data available for this assessment.</Text>
                )}
                <PageNumber />
            </Page>

            {/* Page 6: Appendix */}
            <Page size="A4" style={styles.page}>
                <Text style={styles.sectionTitle}>Appendix: Detailed Inventory</Text>
                <Text style={styles.bodyText}>
                    This appendix provides comprehensive details about the current {biTool} environment, including complete dashboard and report inventory.
                </Text>
                {appendixDashboardsList.length > 0 && (
                    <>
                        <Text style={styles.sectionSubtitle}>Dashboards</Text>
                        <PdfTable
                            headers={[
                                { label: "NAME", flex: 1.2 },
                                { label: "PACKAGE", flex: 1 },
                                { label: "DATA MODULE", flex: 1 },
                                { label: "OWNER", flex: 0.6 },
                            ]}
                            rows={appendixDashboardsList.map((a) => [
                                a.name,
                                (a.package?.length ? a.package.join(", ") : "—").slice(0, 50),
                                (a.data_module?.length ? a.data_module.join(", ") : "—").slice(0, 50),
                                a.owner ?? "—",
                            ])}
                        />
                    </>
                )}
                {appendixReportsList.length > 0 && (
                    <>
                        <Text style={styles.sectionSubtitle}>Reports</Text>
                        <PdfTable
                            headers={[
                                { label: "NAME", flex: 1.2 },
                                { label: "PACKAGE", flex: 1 },
                                { label: "DATA MODULE", flex: 1 },
                                { label: "OWNER", flex: 0.6 },
                            ]}
                            rows={appendixReportsList.map((a) => [
                                a.name,
                                (a.package?.length ? a.package.join(", ") : "—").slice(0, 50),
                                (a.data_module?.length ? a.data_module.join(", ") : "—").slice(0, 50),
                                a.owner ?? "—",
                            ])}
                        />
                    </>
                )}
                {appendixDashboardsList.length === 0 && appendixReportsList.length === 0 && (
                    <Text style={styles.bodyText}>No appendix data available for this assessment.</Text>
                )}
                <PageNumber />
            </Page>
        </Document>
    );
}
