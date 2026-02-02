"use client";

import { useMemo, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExtractedObject, ObjectRelationship, ComplexAnalysis, KeyFinding, Summary, ChallengeItem, AppendixItem } from "@/lib/api";
import { Info } from "lucide-react";
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

/** Row from usage_stats JSON; keys may be UPPER_SNAKE_CASE (e.g. TARGET_NAME, VIEWS_LAST_60_DAYS). */
type UsageStatsRow = Record<string, unknown>;

interface MigrationAssessmentReportProps {
    objects: ExtractedObject[];
    relationships: ObjectRelationship[];
    complex_analysis?: ComplexAnalysis | null;
    summary?: Summary | null;
    challenges?: { visualization: ChallengeItem[] } | null;
    appendix?: { dashboards: AppendixItem[]; reports: AppendixItem[] } | null;
    /** Optional usage stats from usage_stats.json upload (usage_stats, content_creation, user_stats, performance, quick_wins, pilot_recommendations). */
    usage_stats?: Record<string, unknown> | null;
    assessmentName?: string;
    biTool?: string;
    createdAt?: string;
}

// Visualization type → complexity (aligned with inventory-summary.tsx)
const visualizationMapping: Record<string, { complexity: string }> = {
    "area": { complexity: "Low" }, "bar": { complexity: "Low" }, "box plot": { complexity: "High" },
    "bubble": { complexity: "High" }, "bullet": { complexity: "Critical" }, "conditional formatting column": { complexity: "Critical" },
    "crosstab": { complexity: "High" }, "data player": { complexity: "Critical" }, "decision tree": { complexity: "Critical" },
    "driver analysis": { complexity: "Critical" }, "drop-down list": { complexity: "Critical" }, "heatmap": { complexity: "Critical" },
    "hierarchy bubble": { complexity: "Critical" }, "kpi": { complexity: "Low" }, "legacy map": { complexity: "Critical" },
    "line": { complexity: "Low" }, "line and column": { complexity: "Low" }, "list": { complexity: "Low" },
    "map": { complexity: "High" }, "marimekko": { complexity: "Critical" }, "network": { complexity: "Critical" },
    "packed bubble": { complexity: "Critical" }, "pie": { complexity: "Low" }, "point": { complexity: "High" },
    "radar": { complexity: "Critical" }, "radial": { complexity: "Critical" }, "scatter": { complexity: "Low" },
    "spiral": { complexity: "Critical" }, "stacked bar": { complexity: "Low" }, "stacked column": { complexity: "Low" },
    "summary": { complexity: "Medium" }, "sunburst": { complexity: "Critical" }, "table": { complexity: "Low" },
    "tornado": { complexity: "High" }, "treemap": { complexity: "Critical" }, "waterfall": { complexity: "Medium" },
    "word cloud": { complexity: "Medium" }, "custom viz": { complexity: "High" }, "stepped area": { complexity: "High" },
    "stepped line": { complexity: "High" }, "stacked combination": { complexity: "Medium" }, "smooth line": { complexity: "Medium" },
    "smooth area": { complexity: "Medium" }, "gantt": { complexity: "Critical" }, "floating bar": { complexity: "Critical" },
    "floating column": { complexity: "Critical" }, "donut": { complexity: "Medium" }, "clustered column": { complexity: "Low" },
    "clustered combination": { complexity: "Low" }, "clustered bar": { complexity: "Low" }, "list, crosstab": { complexity: "Low" },
    "repeater table": { complexity: "Critical" }, "data table": { complexity: "Critical" }, "repeater": { complexity: "Critical" },
    "singleton": { complexity: "Medium" },
};

const getVisualizationComplexity = (type: string): string => {
    const normalized = type.toLowerCase().trim();
    if (visualizationMapping[normalized]) return visualizationMapping[normalized].complexity;
    for (const [key, value] of Object.entries(visualizationMapping)) {
        if (normalized.includes(key) || key.includes(normalized)) return value.complexity;
    }
    return "Unknown";
};

// Helper to get complexity badge variant
const getComplexityBadgeVariant = (complexity: string) => {
    switch (complexity.toLowerCase()) {
        case "low":
            return "default";
        case "medium":
            return "secondary";
        case "high":
            return "outline";
        case "critical":
            return "destructive";
        default:
            return "outline";
    }
};

// Calculate overall complexity score
const calculateOverallComplexity = (objects: ExtractedObject[], relationships: ObjectRelationship[]): string => {
    const objectsMap = new Map<string, ExtractedObject>();
    objects.forEach(obj => objectsMap.set(obj.id, obj));

    const relationshipsBySource = new Map<string, ObjectRelationship[]>();
    relationships.forEach(rel => {
        if (!relationshipsBySource.has(rel.source_object_id)) {
            relationshipsBySource.set(rel.source_object_id, []);
        }
        relationshipsBySource.get(rel.source_object_id)!.push(rel);
    });

    const dashboards = objects.filter(obj => obj.object_type === "dashboard");
    let highComplexityCount = 0;
    let criticalComplexityCount = 0;

    dashboards.forEach(dashboard => {
        const outgoingRels = relationshipsBySource.get(dashboard.id) || [];
        const tabs = outgoingRels.filter(rel => {
            if (rel.relationship_type === "contains") {
                const targetObj = objectsMap.get(rel.target_object_id);
                return targetObj?.object_type === "tab";
            }
            return false;
        });
        const tabCount = tabs.length;
        const tabIds = tabs.map(rel => rel.target_object_id);

        let visualizationCount = outgoingRels.filter(rel => {
            if (rel.relationship_type === "contains") {
                const targetObj = objectsMap.get(rel.target_object_id);
                return targetObj?.object_type === "visualization";
            }
            return false;
        }).length;

        tabIds.forEach(tabId => {
            const tabRels = relationshipsBySource.get(tabId) || [];
            visualizationCount += tabRels.filter(rel => {
                if (rel.relationship_type === "contains") {
                    const targetObj = objectsMap.get(rel.target_object_id);
                    return targetObj?.object_type === "visualization";
                }
                return false;
            }).length;
        });

        if (tabCount >= 10 || visualizationCount >= 10) {
            criticalComplexityCount++;
        } else if (tabCount >= 5 || visualizationCount >= 5) {
            highComplexityCount++;
        }
    });

    if (criticalComplexityCount > 0) return "Critical";
    if (highComplexityCount > dashboards.length * 0.3) return "High";
    if (highComplexityCount > 0) return "Medium";
    return "Low";
};

// Helper to get value from usage_stats row (keys may be UPPER_SNAKE_CASE or camelCase)
function usVal(row: UsageStatsRow, ...keys: string[]): string | number | undefined {
    for (const k of keys) {
        const v = row[k];
        if (v !== undefined && v !== null) return v as string | number;
        const upper = k.replace(/([A-Z])/g, "_$1").replace(/^_/, "").toUpperCase();
        const v2 = row[upper];
        if (v2 !== undefined && v2 !== null) return v2 as string | number;
    }
    return undefined;
}

export function MigrationAssessmentReport({
    objects,
    relationships,
    complex_analysis,
    summary,
    challenges,
    appendix,
    usage_stats,
    assessmentName,
    biTool = "Cognos",
    createdAt
}: MigrationAssessmentReportProps) {
    const [currentPage, setCurrentPage] = useState(1);
    const [challengesPage, setChallengesPage] = useState(1);
    const [appendixDashPage, setAppendixDashPage] = useState(1);
    const [appendixReportPage, setAppendixReportPage] = useState(1);
    const itemsPerPage = 10;
    const challengesItemsPerPage = 10;
    const appendixItemsPerPage = 10;

    // Build object map for quick lookup
    const objectsMap = useMemo(() => {
        const map = new Map<string, ExtractedObject>();
        objects.forEach(obj => map.set(obj.id, obj));
        return map;
    }, [objects]);

    // Build relationship maps
    const relationshipsBySource = useMemo(() => {
        const map = new Map<string, ObjectRelationship[]>();
        relationships.forEach(rel => {
            if (!map.has(rel.source_object_id)) {
                map.set(rel.source_object_id, []);
            }
            map.get(rel.source_object_id)!.push(rel);
        });
        return map;
    }, [relationships]);

    const relationshipsByTarget = useMemo(() => {
        const map = new Map<string, ObjectRelationship[]>();
        relationships.forEach(rel => {
            if (!map.has(rel.target_object_id)) {
                map.set(rel.target_object_id, []);
            }
            map.get(rel.target_object_id)!.push(rel);
        });
        return map;
    }, [relationships]);

    // Calculate inventory summary
    const inventorySummary = useMemo(() => {
        const dashboards = objects.filter(obj => obj.object_type === "dashboard");
        const reports = objects.filter(obj => obj.object_type === "report");
        const views = objects.filter(obj => obj.object_type === "visualization");
        const pagesAndTabs = objects.filter(obj => obj.object_type === "page" || obj.object_type === "tab");
        const packages = objects.filter(obj => obj.object_type === "package");
        const dataSources = objects.filter(obj => obj.object_type === "data_source");
        const dataModules = objects.filter(obj => obj.object_type === "data_module");

        return {
            totalDashboardsAndReports: dashboards.length + reports.length,
            totalDashboards: dashboards.length,
            totalReports: reports.length,
            totalViews: views.length,
            totalPagesAndTabs: pagesAndTabs.length,
            totalPackages: packages.length,
            totalDataSources: dataSources.length,
            totalDataModules: dataModules.length,
        };
    }, [objects]);

    // Get detailed inventory for appendix
    const detailedInventory = useMemo(() => {
        const dashboardsAndReports = objects.filter(obj => obj.object_type === "report" || obj.object_type === "dashboard");

        return dashboardsAndReports.map(item => {
            const outgoingRels = relationshipsBySource.get(item.id) || [];
            const dashboardNames: string[] = [];
            const datasets: string[] = [];

            // If it's a dashboard, use itself; if it's a report, find related dashboards
            if (item.object_type === "dashboard") {
                dashboardNames.push(item.name);
            } else {
                // For reports, find related dashboards
                const relatedDashboards = outgoingRels
                    .filter(rel => {
                        const targetObj = objectsMap.get(rel.target_object_id);
                        return targetObj?.object_type === "dashboard";
                    })
                    .map(rel => {
                        const targetObj = objectsMap.get(rel.target_object_id);
                        return targetObj?.name || "";
                    })
                    .filter(Boolean);
                dashboardNames.push(...relatedDashboards);
            }

            // Find packages, data sources, and data modules
            const dataItems = outgoingRels
                .filter(rel => {
                    const targetObj = objectsMap.get(rel.target_object_id);
                    return targetObj?.object_type === "package" ||
                        targetObj?.object_type === "data_source" ||
                        targetObj?.object_type === "data_module";
                })
                .map(rel => {
                    const targetObj = objectsMap.get(rel.target_object_id);
                    return targetObj?.name || "";
                })
                .filter(Boolean);
            datasets.push(...dataItems);

            return {
                dashboardOrReportName: item.name,
                dashboardNames: dashboardNames.length > 0 ? dashboardNames : ["N/A"],
                datasetsUsed: datasets.length > 0 ? datasets : ["N/A"],
                ownerId: (item.properties?.owner as string) || "Unknown",
            };
        });
    }, [objects, relationshipsBySource, objectsMap]);

    // Paginate detailed inventory
    const paginatedInventory = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        const end = start + itemsPerPage;
        return detailedInventory.slice(start, end);
    }, [detailedInventory, currentPage]);

    const totalPages = Math.ceil(detailedInventory.length / itemsPerPage);

    // Challenges pagination
    const challengesList = challenges?.visualization ?? [];
    const challengesTotalPages = Math.ceil(challengesList.length / challengesItemsPerPage) || 1;
    const paginatedChallenges = useMemo(() => {
        const page = Math.min(challengesPage, challengesTotalPages) || 1;
        const start = (page - 1) * challengesItemsPerPage;
        return challengesList.slice(start, start + challengesItemsPerPage);
    }, [challengesList, challengesPage, challengesTotalPages]);

    // Page numbers with ellipsis for challenges (e.g. 1 ... 8 9 10 11 ... 20)
    const challengesPageNumbers = useMemo(() => {
        const total = challengesTotalPages;
        if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1) as (number | "ellipsis")[];
        const show = 2;
        const pages: (number | "ellipsis")[] = [1];
        if (challengesPage > show + 2) pages.push("ellipsis");
        for (let p = Math.max(2, challengesPage - show); p <= Math.min(total - 1, challengesPage + show); p++) {
            pages.push(p);
        }
        if (challengesPage < total - show - 1) pages.push("ellipsis");
        if (total > 1) pages.push(total);
        return pages;
    }, [challengesTotalPages, challengesPage]);

    // Appendix pagination (dashboards and reports)
    const appendixDashboardsList = appendix?.dashboards ?? [];
    const appendixReportsList = appendix?.reports ?? [];
    const appendixDashTotalPages = Math.ceil(appendixDashboardsList.length / appendixItemsPerPage) || 1;
    const appendixReportTotalPages = Math.ceil(appendixReportsList.length / appendixItemsPerPage) || 1;
    const paginatedAppendixDashboards = useMemo(() => {
        const page = Math.min(appendixDashPage, appendixDashTotalPages) || 1;
        const start = (page - 1) * appendixItemsPerPage;
        return appendixDashboardsList.slice(start, start + appendixItemsPerPage);
    }, [appendixDashboardsList, appendixDashPage, appendixDashTotalPages]);
    const paginatedAppendixReports = useMemo(() => {
        const page = Math.min(appendixReportPage, appendixReportTotalPages) || 1;
        const start = (page - 1) * appendixItemsPerPage;
        return appendixReportsList.slice(start, start + appendixItemsPerPage);
    }, [appendixReportsList, appendixReportPage, appendixReportTotalPages]);
    const appendixDashPageNumbers = useMemo(() => {
        const total = appendixDashTotalPages;
        if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1) as (number | "ellipsis")[];
        const show = 2;
        const pages: (number | "ellipsis")[] = [1];
        if (appendixDashPage > show + 2) pages.push("ellipsis");
        for (let p = Math.max(2, appendixDashPage - show); p <= Math.min(total - 1, appendixDashPage + show); p++) {
            pages.push(p);
        }
        if (appendixDashPage < total - show - 1) pages.push("ellipsis");
        if (total > 1) pages.push(total);
        return pages;
    }, [appendixDashTotalPages, appendixDashPage]);
    const appendixReportPageNumbers = useMemo(() => {
        const total = appendixReportTotalPages;
        if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1) as (number | "ellipsis")[];
        const show = 2;
        const pages: (number | "ellipsis")[] = [1];
        if (appendixReportPage > show + 2) pages.push("ellipsis");
        for (let p = Math.max(2, appendixReportPage - show); p <= Math.min(total - 1, appendixReportPage + show); p++) {
            pages.push(p);
        }
        if (appendixReportPage < total - show - 1) pages.push("ellipsis");
        if (total > 1) pages.push(total);
        return pages;
    }, [appendixReportTotalPages, appendixReportPage]);

    const overallComplexity = calculateOverallComplexity(objects, relationships);
    const formattedDate = createdAt
        ? new Date(createdAt).toLocaleString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
        : new Date().toLocaleString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

    return (
        <div className="w-full">
            {/* Header Section */}
            <div className="bg-[var(--deep-green)] text-white p-6 rounded-t-lg mb-0">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-white rounded flex items-center justify-center">
                            <div className="w-4 h-4 bg-[var(--deep-green)] rounded"></div>
                        </div>
                        <span className="text-lg font-semibold">SQUARESHIFT</span>
                    </div>
                    <Button className="bg-[var(--royal-gold)] text-[var(--deep-green)] hover:bg-[var(--royal-gold)] font-semibold rounded-md">
                        ASSESSMENT REPORT
                    </Button>
                </div>
                <div className="text-center">
                    <h1 className="text-[54px] font-bold mb-6">Migration Assessment Report</h1>
                    <p className="text-xl mb-4">{biTool} to Looker Strategic Migration Analysis</p>
                    <div className="text-sm text-gray-200 space-x-4">
                        <span>Date Generated: {formattedDate}</span>
                        <span>•</span>
                        <span>Assessed Environment: {assessmentName || "Assessment"}</span>
                    </div>
                </div>
            </div>

            {/* Main Content with Sub-tabs */}
            <div className="bg-[#f5f5dc] rounded-b-lg">
                <Tabs defaultValue="summary" className="w-full">
                    <TabsList className="w-full flex bg-[#f5f5dc] border-b border-gray-300 rounded-none h-auto p-0">
                        <TabsTrigger
                            value="summary"
                            className="flex-1 bg-white py-[20px] px-[28px] rounded-none border-b-4 border-transparent text-[#4f4f4f] data-[state=active]:border-b-4 data-[state=active]:border-[var(--royal-gold)] data-[state=active]:bg-white data-[state=active]:text-[var(--deep-green)] font-semibold uppercase"
                        >
                            SUMMARY
                        </TabsTrigger>
                        <TabsTrigger
                            value="complexity"
                            className="flex-1 bg-white py-[20px] px-[28px] rounded-none border-b-4 border-transparent text-[#4f4f4f] data-[state=active]:border-b-4 data-[state=active]:border-[var(--royal-gold)] data-[state=active]:bg-white data-[state=active]:text-[var(--deep-green)] font-semibold uppercase"
                        >
                            COMPLEXITY ANALYSIS
                        </TabsTrigger>
                        <TabsTrigger
                            value="usage"
                            className="flex-1 bg-white py-[20px] px-[28px] rounded-none border-b-4 border-transparent text-[#4f4f4f] data-[state=active]:border-b-4 data-[state=active]:border-[var(--royal-gold)] data-[state=active]:bg-white data-[state=active]:text-[var(--deep-green)] font-semibold uppercase"
                        >
                            USAGE STATS
                        </TabsTrigger>
                        <TabsTrigger
                            value="challenges"
                            className="flex-1 bg-white py-[20px] px-[28px] rounded-none border-b-4 border-transparent text-[#4f4f4f] data-[state=active]:border-b-4 data-[state=active]:border-[var(--royal-gold)] data-[state=active]:bg-white data-[state=active]:text-[var(--deep-green)] font-semibold uppercase"
                        >
                            CHALLENGES
                        </TabsTrigger>
                        <TabsTrigger
                            value="appendix"
                            className="flex-1 bg-white py-[20px] px-[28px] rounded-none border-b-4 border-transparent text-[#4f4f4f] data-[state=active]:border-b-4 data-[state=active]:border-[var(--royal-gold)] data-[state=active]:bg-white data-[state=active]:text-[var(--deep-green)] font-semibold uppercase"
                        >
                            APPENDIX
                        </TabsTrigger>
                    </TabsList>

                    <div className="p-6 bg-white">
                        {/* SUMMARY Tab */}
                        <TabsContent value="summary" className="mt-0 space-y-6">
                            <div>
                                <h2 className="text-[2.6em] font-bold text-[var(--deep-green)] mb-[35px]">
                                    <span className="border-b-4 border-[var(--royal-gold)]">Executive</span> Summary
                                </h2>
                                <div className="bg-[var(--light-cream)] border-l-4 border-[var(--royal-gold)] rounded-lg shadow-sm text-[1.12em] mb-[35px] py-[24px] px-[28px]">
                                    <p className="text-[#333333]">
                                        This assessment analyzed the {biTool} environment ({inventorySummary.totalDashboards} dashboards, {inventorySummary.totalReports} reports)
                                        focusing on inventory, usage, and complexity to inform the Looker migration strategy.
                                    </p>
                                </div>
                                <div className="mb-6">
                                    <span className="text-lg font-semibold">Overall Complexity Score: </span>
                                    <Badge variant={getComplexityBadgeVariant(overallComplexity)} className="ml-2 text-lg">
                                        {overallComplexity}
                                    </Badge>
                                </div>
                            </div>

                            {/* Key Findings (from API summary.key_findings only) */}
                            {summary?.key_findings && summary.key_findings.length > 0 && (() => {
                                const keyFindings = summary.key_findings;
                                return (
                                    <div>
                                        <h3 className="text-[var(--deep-green)] text-2xl font-semibold mb-4 border-l-4 border-[var(--royal-gold)] pl-4">
                                            Key Findings
                                        </h3>
                                        <div className="mb-8 rounded-lg shadow-md overflow-hidden border border-[var(--light-cream)] [font-family:var(--font-roboto-condensed)]">
                                            <Table className="text-lg">
                                                <TableHeader>
                                                    <TableRow className="bg-[var(--deep-green)] hover:bg-[var(--deep-green)] border-b-2 border-[var(--light-cream)]">
                                                        <TableHead className="text-white font-bold rounded-tl-lg py-4 px-5 h-auto">AREA</TableHead>
                                                        <TableHead className="text-white font-bold py-4 px-5 h-auto text-center">COMPLEXITY / IMPACT</TableHead>
                                                        <TableHead className="text-white font-bold py-4 px-5 h-auto text-left">COUNT</TableHead>
                                                        {/* <TableHead className="text-white font-bold py-4 px-5 h-auto">FEATURE</TableHead> */}
                                                        <TableHead className="text-white font-bold py-4 px-5 h-auto text-left">DASHBOARD</TableHead>
                                                        <TableHead className="text-white font-bold text-right rounded-tr-lg py-4 px-5 h-auto text-left">REPORT</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {keyFindings.map((finding, idx) => {
                                                        const feature = (() => {
                                                            if (!complex_analysis) return undefined;
                                                            const entityKey = (finding.feature_area || "").toLowerCase().replace(/\s+/g, "_") as keyof ComplexAnalysis;
                                                            const items = complex_analysis[entityKey];
                                                            if (!Array.isArray(items)) return undefined;
                                                            const comp = (finding.complexity || "").toLowerCase();
                                                            const item = items.find((i) => (i.complexity || "").toLowerCase() === comp);
                                                            return (item as { feature?: string })?.feature;
                                                        })();
                                                        const isLast = idx === keyFindings.length - 1;
                                                        return (
                                                            <TableRow key={idx} className={`${idx % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-[var(--light-cream)]`}>
                                                                <TableCell className={`font-medium text-gray-900 py-4 px-5 ${isLast ? "rounded-bl-lg" : ""}`}>{finding.feature_area}</TableCell>
                                                                <TableCell className="text-gray-900 py-4 px-5 text-center">
                                                                    <Badge variant={getComplexityBadgeVariant(finding.complexity)}>
                                                                        {finding.complexity}
                                                                    </Badge>
                                                                </TableCell>
                                                                <TableCell className="text-gray-900 py-4 px-5 text-left">{finding.count}</TableCell>
                                                                {/* <TableCell className="text-gray-900 py-4 px-5">{feature ?? "—"}</TableCell> */}
                                                                <TableCell className="text-gray-900 py-4 px-5 text-left">{finding.dashboards_summary}</TableCell>
                                                                <TableCell className={`text-gray-900 py-4 px-5 text-left ${isLast ? "rounded-br-lg" : ""}`}>{finding.reports_summary}</TableCell>
                                                            </TableRow>
                                                        );
                                                    })}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    </div>
                                );
                            })()}

                            {/* High-Level Complexity Overview (from API summary.high_level_complexity_overview only) */}
                            {summary?.high_level_complexity_overview && summary.high_level_complexity_overview.length > 0 && (() => {
                                const overview = summary.high_level_complexity_overview;
                                return (
                                    <div>
                                        <h3 className="text-[var(--deep-green)] text-2xl font-semibold mb-4 border-l-4 border-[var(--royal-gold)] pl-4">
                                            High-Level Complexity Overview
                                        </h3>
                                        <div className="mb-8 rounded-lg shadow-md overflow-hidden border border-[var(--light-cream)] [font-family:var(--font-roboto-condensed)]">
                                            <Table className="text-lg">
                                                <TableHeader>
                                                    <TableRow className="bg-[var(--deep-green)] hover:bg-[var(--deep-green)] border-b-2 border-[var(--light-cream)]">
                                                        <TableHead className="text-white font-bold rounded-tl-lg py-4 px-5 h-auto">COMPLEXITY</TableHead>
                                                        <TableHead className="text-white font-bold py-4 px-5 h-auto text-right">VISUALIZATION</TableHead>
                                                        <TableHead className="text-white font-bold py-4 px-5 h-auto text-right">DASHBOARD</TableHead>
                                                        <TableHead className="text-white font-bold text-right rounded-tr-lg py-4 px-5 h-auto">REPORT</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {overview.map((row, idx) => {
                                                        const isLast = idx === overview.length - 1;
                                                        return (
                                                            <TableRow
                                                                key={row.complexity}
                                                                className={idx % 2 === 0 ? "bg-white hover:bg-[var(--light-cream)]" : "bg-gray-50 hover:bg-[var(--light-cream)]"}
                                                            >
                                                                <TableCell className={`font-medium text-gray-900 py-4 px-5 ${isLast ? "rounded-bl-lg" : ""}`}>{row.complexity}</TableCell>
                                                                <TableCell className="text-gray-900 py-4 px-5 text-right">{row.visualization_count}</TableCell>
                                                                <TableCell className="text-gray-900 py-4 px-5 text-right">{row.dashboard_count}</TableCell>
                                                                <TableCell className={`text-right text-gray-900 py-4 px-5 ${isLast ? "rounded-br-lg" : ""}`}>{row.report_count}</TableCell>
                                                            </TableRow>
                                                        );
                                                    })}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    </div>
                                );
                            })()}

                            {/* Inventory Summary (from API summary.inventory only) */}
                            {summary?.inventory && summary.inventory.length > 0 && (() => {
                                const inventory = summary.inventory;
                                return (
                                    <div>
                                        <h3 className="text-[var(--deep-green)] text-2xl font-semibold mb-4 border-l-4 border-[var(--royal-gold)] pl-4">
                                            Inventory Summary
                                        </h3>
                                        <div className="mb-8 rounded-lg shadow-md overflow-hidden border border-[var(--light-cream)] [font-family:var(--font-roboto-condensed)]">
                                            <Table className="text-lg">
                                                <TableHeader>
                                                    <TableRow className="bg-[var(--deep-green)] hover:bg-[var(--deep-green)] border-b-2 border-[var(--light-cream)]">
                                                        <TableHead className="text-white font-bold rounded-tl-lg py-4 px-5 h-auto">ASSET TYPE</TableHead>
                                                        <TableHead className="text-white font-bold text-right rounded-tr-lg py-4 px-5 h-auto">COUNT</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {inventory.map((item, idx) => {
                                                        const isLast = idx === inventory.length - 1;
                                                        return (
                                                            <TableRow
                                                                key={item.asset_type}
                                                                className={idx % 2 === 0 ? "bg-white hover:bg-[var(--light-cream)]" : "bg-gray-50 hover:bg-[var(--light-cream)]"}
                                                            >
                                                                <TableCell className={`font-medium text-gray-900 py-4 px-5 ${isLast ? "rounded-bl-lg" : ""}`}>{item.asset_type}</TableCell>
                                                                <TableCell className={`text-right text-gray-900 py-4 px-5 ${isLast ? "rounded-br-lg" : ""}`}>{item.count}</TableCell>
                                                            </TableRow>
                                                        );
                                                    })}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    </div>
                                );
                            })()}

                            {/* Asset count chart */}
                            {summary?.inventory && summary.inventory.length > 0 && (
                                <div className="mt-8">
                                    <h3 className="text-[var(--deep-green)] text-2xl font-semibold mb-4 border-l-4 border-[var(--royal-gold)] pl-4">
                                        Asset Count
                                    </h3>
                                    <div className="rounded-lg border border-[var(--light-cream)] bg-white shadow-md overflow-hidden p-6">
                                        <div className="h-[320px] w-full">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart
                                                    data={summary.inventory.map((item) => ({ name: item.asset_type, count: item.count }))}
                                                    margin={{ top: 16, right: 16, left: 0, bottom: 60 }}
                                                >
                                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" vertical={false} />
                                                    <XAxis
                                                        dataKey="name"
                                                        tick={{ fontSize: 12, fill: "var(--deep-green)" }}
                                                        angle={-25}
                                                        textAnchor="end"
                                                        height={60}
                                                        interval={0}
                                                    />
                                                    <YAxis
                                                        tick={{ fontSize: 12, fill: "var(--deep-green)" }}
                                                        allowDecimals={false}
                                                        tickLine={false}
                                                    />
                                                    <Tooltip
                                                        contentStyle={{ borderRadius: "8px", border: "1px solid var(--light-cream)" }}
                                                        labelStyle={{ color: "var(--deep-green)", fontWeight: 600 }}
                                                        formatter={(value: number) => [value, "Count"]}
                                                        labelFormatter={(label) => label}
                                                    />
                                                    <Bar
                                                        dataKey="count"
                                                        name="Count"
                                                        radius={[4, 4, 0, 0]}
                                                    >
                                                        {summary.inventory.map((_, index) => {
                                                            const palette = ["#1a5f3f", "#c29a4a", "#6b9bb5", "#8fbc8f", "#b8860b", "#2e7d5e"];
                                                            const hash = summary.inventory![index].asset_type
                                                                .split("")
                                                                .reduce((acc, c) => ((acc << 5) - acc + c.charCodeAt(0)) | 0, 0);
                                                            const fill = palette[Math.abs(hash) % palette.length];
                                                            return <Cell key={index} fill={fill} />;
                                                        })}
                                                    </Bar>
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                </div>
                            )}

                        </TabsContent>

                        {/* COMPLEXITY ANALYSIS Tab */}
                        <TabsContent value="complexity" className="mt-0 space-y-6">
                            <div>
                                <h2 className="text-[2.6em] font-bold text-[var(--deep-green)] mb-[35px]">
                                    <span className="border-b-4 border-[var(--royal-gold)]">Complexity</span> Analysis
                                </h2>
                                <div className="bg-[var(--light-cream)] border-l-4 border-[var(--royal-gold)] rounded-lg shadow-sm text-[1.12em] mb-[35px] py-[24px] px-[28px] flex items-start gap-3">
                                    <Info className="h-5 w-5 text-[var(--deep-green)] mt-0.5 flex-shrink-0" />
                                    <p className="text-[#333333]">
                                        Information about identified numbers of elements across various categories to show the overall plan of the data migration.
                                    </p>
                                </div>
                            </div>


                            {/* Visualization Complexity (from API complex_analysis.visualization) */}
                            {complex_analysis?.visualization && complex_analysis.visualization.length > 0 && (
                                <div>
                                    <h2 className="text-[var(--color-text-primary)] text-2xl font-semibold mb-4 border-l-4 border-[var(--royal-gold)] pl-4">
                                        Visualization
                                    </h2>
                                    <div className="mb-8 rounded-lg shadow-md overflow-hidden border border-[var(--light-cream)] [font-family:var(--font-roboto-condensed)]">
                                        <div className="rounded-lg overflow-hidden">
                                            <Table className="text-lg">
                                                <TableHeader>
                                                    <TableRow className="bg-[var(--deep-green)] hover:bg-[var(--deep-green)] border-b-2 border-[var(--light-cream)]">
                                                        <TableHead className="text-white font-bold rounded-tl-lg py-4 px-5 h-auto">FEATURE AREA</TableHead>
                                                        <TableHead className="text-white font-bold py-4 px-5 h-auto">COMPLEXITY</TableHead>
                                                        <TableHead className="text-white font-bold py-4 px-5 h-auto">FEATURE</TableHead>
                                                        <TableHead className="text-white font-bold text-right py-4 px-5 h-auto">VISUALIZATIONS</TableHead>
                                                        <TableHead className="text-white font-bold text-right py-4 px-5 h-auto">DASHBOARDS AFFECTED</TableHead>
                                                        <TableHead className="text-white font-bold text-right rounded-tr-lg py-4 px-5 h-auto">REPORTS AFFECTED</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {complex_analysis.visualization.map((item, idx) => {
                                                        const isLast = idx === complex_analysis.visualization.length - 1;
                                                        return (
                                                            <TableRow
                                                                key={item.complexity}
                                                                className={`${idx % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-[var(--light-cream)]`}
                                                            >
                                                                <TableCell className={`text-gray-900 py-4 px-5 ${isLast ? "rounded-bl-lg" : ""}`}>Visualization</TableCell>
                                                                <TableCell className="font-medium text-gray-900 py-4 px-5">
                                                                    {item.complexity
                                                                        ? item.complexity.charAt(0).toUpperCase() + item.complexity.slice(1).toLowerCase()
                                                                        : item.complexity}
                                                                </TableCell>
                                                                <TableCell className="text-gray-900 py-4 px-5">{(item as { feature?: string }).feature ?? "—"}</TableCell>
                                                                <TableCell className="text-right text-gray-900 py-4 px-5">{item.visualization_count}</TableCell>
                                                                <TableCell className="text-right text-gray-900 py-4 px-5">{item.dashboards_containing_count}</TableCell>
                                                                <TableCell className={`text-right text-gray-900 py-4 px-5 ${isLast ? "rounded-br-lg" : ""}`}>{item.reports_containing_count}</TableCell>
                                                            </TableRow>
                                                        );
                                                    })}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    </div>
                                </div>

                            )}

                            {/* Dashboard Complexity (from API complex_analysis.dashboard) */}
                            {complex_analysis?.dashboard && complex_analysis.dashboard.length > 0 && (() => {
                                const dashboardItems = complex_analysis.dashboard;
                                return (
                                <div>
                                    <h2 className="text-[var(--color-text-primary)] text-2xl font-semibold mb-4 border-l-4 border-[var(--royal-gold)] pl-4">
                                        Dashboard
                                    </h2>
                                    <div className="mb-8 rounded-lg shadow-md overflow-hidden border border-[var(--light-cream)] [font-family:var(--font-roboto-condensed)]">
                                        <div className="rounded-lg overflow-hidden">
                                            <Table className="text-lg">
                                                <TableHeader>
                                                    <TableRow className="bg-[var(--deep-green)] hover:bg-[var(--deep-green)] border-b-2 border-[var(--light-cream)]">
                                                        <TableHead className="text-white font-bold rounded-tl-lg py-4 px-5 h-auto">FEATURE AREA</TableHead>
                                                        <TableHead className="text-white font-bold py-4 px-5 h-auto">COMPLEXITY</TableHead>
                                                        <TableHead className="text-white font-bold py-4 px-5 h-auto">FEATURE</TableHead>
                                                        <TableHead className="text-white font-bold text-right rounded-tr-lg py-4 px-5 h-auto">DASHBOARDS AFFECTED</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {dashboardItems.map((item, idx) => {
                                                        const isLast = idx === dashboardItems.length - 1;
                                                        return (
                                                            <TableRow
                                                                key={item.complexity}
                                                                className={`${idx % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-[var(--light-cream)]`}
                                                            >
                                                                <TableCell className={`text-gray-900 py-4 px-5 ${isLast ? "rounded-bl-lg" : ""}`}>Dashboard</TableCell>
                                                                <TableCell className="font-medium text-gray-900 py-4 px-5">
                                                                    {item.complexity
                                                                        ? item.complexity.charAt(0).toUpperCase() + item.complexity.slice(1).toLowerCase()
                                                                        : item.complexity}
                                                                </TableCell>
                                                                <TableCell className="text-gray-900 py-4 px-5">{(item as { feature?: string }).feature ?? "—"}</TableCell>
                                                                <TableCell className={`text-right text-gray-900 py-4 px-5 ${isLast ? "rounded-br-lg" : ""}`}>{item.dashboards_containing_count}</TableCell>
                                                            </TableRow>
                                                        );
                                                    })}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    </div>
                                </div>
                                );
                            })()}

                            {/* Report Complexity (from API complex_analysis.report) */}
                            {complex_analysis?.report && complex_analysis.report.length > 0 && (() => {
                                const reportItems = complex_analysis.report;
                                return (
                                <div>
                                    <h2 className="text-[var(--color-text-primary)] text-2xl font-semibold mb-4 border-l-4 border-[var(--royal-gold)] pl-4">
                                        Report
                                    </h2>
                                    <div className="mb-8 rounded-lg shadow-md overflow-hidden border border-[var(--light-cream)] [font-family:var(--font-roboto-condensed)]">
                                        <div className="rounded-lg overflow-hidden">
                                            <Table className="text-lg">
                                                <TableHeader>
                                                    <TableRow className="bg-[var(--deep-green)] hover:bg-[var(--deep-green)] border-b-2 border-[var(--light-cream)]">
                                                        <TableHead className="text-white font-bold rounded-tl-lg py-4 px-5 h-auto">FEATURE AREA</TableHead>
                                                        <TableHead className="text-white font-bold py-4 px-5 h-auto">COMPLEXITY</TableHead>
                                                        <TableHead className="text-white font-bold py-4 px-5 h-auto">FEATURE</TableHead>
                                                        <TableHead className="text-white font-bold text-right rounded-tr-lg py-4 px-5 h-auto">REPORTS AFFECTED</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {reportItems.map((item, idx) => {
                                                        const isLast = idx === reportItems.length - 1;
                                                        return (
                                                            <TableRow
                                                                key={item.complexity}
                                                                className={`${idx % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-[var(--light-cream)]`}
                                                            >
                                                                <TableCell className={`text-gray-900 py-4 px-5 ${isLast ? "rounded-bl-lg" : ""}`}>Report</TableCell>
                                                                <TableCell className="font-medium text-gray-900 py-4 px-5">
                                                                    {item.complexity
                                                                        ? item.complexity.charAt(0).toUpperCase() + item.complexity.slice(1).toLowerCase()
                                                                        : item.complexity}
                                                                </TableCell>
                                                                <TableCell className="text-gray-900 py-4 px-5">{(item as { feature?: string }).feature ?? "—"}</TableCell>
                                                                <TableCell className={`text-right text-gray-900 py-4 px-5 ${isLast ? "rounded-br-lg" : ""}`}>{item.reports_containing_count}</TableCell>
                                                            </TableRow>
                                                        );
                                                    })}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    </div>
                                </div>
                                );
                            })()}

                            {/* Calculated Field Complexity (from API complex_analysis.calculated_field) */}
                            {complex_analysis?.calculated_field && complex_analysis.calculated_field.length > 0 && (() => {
                                const cfItems = complex_analysis.calculated_field;
                                return (
                                <div>
                                    <h2 className="text-[var(--color-text-primary)] text-2xl font-semibold mb-4 border-l-4 border-[var(--royal-gold)] pl-4">
                                        Calculated Field
                                    </h2>
                                    <div className="mb-8 rounded-lg shadow-md overflow-hidden border border-[var(--light-cream)] [font-family:var(--font-roboto-condensed)]">
                                        <div className="rounded-lg overflow-hidden">
                                            <Table className="text-lg">
                                                <TableHeader>
                                                    <TableRow className="bg-[var(--deep-green)] hover:bg-[var(--deep-green)] border-b-2 border-[var(--light-cream)]">
                                                        <TableHead className="text-white font-bold rounded-tl-lg py-4 px-5 h-auto">FEATURE AREA</TableHead>
                                                        <TableHead className="text-white font-bold py-4 px-5 h-auto">COMPLEXITY</TableHead>
                                                        <TableHead className="text-white font-bold py-4 px-5 h-auto">FEATURE</TableHead>
                                                        <TableHead className="text-white font-bold text-right py-4 px-5 h-auto">CALCULATED FIELDS</TableHead>
                                                        <TableHead className="text-white font-bold text-right py-4 px-5 h-auto">DASHBOARDS AFFECTED</TableHead>
                                                        <TableHead className="text-white font-bold text-right rounded-tr-lg py-4 px-5 h-auto">REPORTS AFFECTED</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {cfItems.map((item, idx) => {
                                                        const isLast = idx === cfItems.length - 1;
                                                        return (
                                                            <TableRow
                                                                key={item.complexity}
                                                                className={`${idx % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-[var(--light-cream)]`}
                                                            >
                                                                <TableCell className={`text-gray-900 py-4 px-5 ${isLast ? "rounded-bl-lg" : ""}`}>Calculated Field</TableCell>
                                                                <TableCell className="font-medium text-gray-900 py-4 px-5">
                                                                    {item.complexity
                                                                        ? item.complexity.charAt(0).toUpperCase() + item.complexity.slice(1).toLowerCase()
                                                                        : item.complexity}
                                                                </TableCell>
                                                                <TableCell className="text-gray-900 py-4 px-5">{(item as { feature?: string }).feature ?? "—"}</TableCell>
                                                                <TableCell className="text-right text-gray-900 py-4 px-5">{item.calculated_field_count}</TableCell>
                                                                <TableCell className="text-right text-gray-900 py-4 px-5">{item.dashboards_containing_count}</TableCell>
                                                                <TableCell className={`text-right text-gray-900 py-4 px-5 ${isLast ? "rounded-br-lg" : ""}`}>{item.reports_containing_count}</TableCell>
                                                            </TableRow>
                                                        );
                                                    })}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    </div>
                                </div>
                                );
                            })()}

                            {/* Filter Complexity (from API complex_analysis.filter) */}
                            {complex_analysis?.filter && complex_analysis.filter.length > 0 && (() => {
                                const filterItems = complex_analysis.filter;
                                return (
                                <div>
                                    <h2 className="text-[var(--color-text-primary)] text-2xl font-semibold mb-4 border-l-4 border-[var(--royal-gold)] pl-4">
                                        Filter
                                    </h2>
                                    <div className="mb-8 rounded-lg shadow-md overflow-hidden border border-[var(--light-cream)] [font-family:var(--font-roboto-condensed)]">
                                        <div className="rounded-lg overflow-hidden">
                                            <Table className="text-lg">
                                                <TableHeader>
                                                    <TableRow className="bg-[var(--deep-green)] hover:bg-[var(--deep-green)] border-b-2 border-[var(--light-cream)]">
                                                        <TableHead className="text-white font-bold rounded-tl-lg py-4 px-5 h-auto">FEATURE AREA</TableHead>
                                                        <TableHead className="text-white font-bold py-4 px-5 h-auto">COMPLEXITY</TableHead>
                                                        <TableHead className="text-white font-bold py-4 px-5 h-auto">FEATURE</TableHead>
                                                        <TableHead className="text-white font-bold text-right py-4 px-5 h-auto">FILTERS</TableHead>
                                                        <TableHead className="text-white font-bold text-right py-4 px-5 h-auto">DASHBOARDS AFFECTED</TableHead>
                                                        <TableHead className="text-white font-bold text-right rounded-tr-lg py-4 px-5 h-auto">REPORTS AFFECTED</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {filterItems.map((item, idx) => {
                                                        const isLast = idx === filterItems.length - 1;
                                                        return (
                                                            <TableRow
                                                                key={item.complexity}
                                                                className={`${idx % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-[var(--light-cream)]`}
                                                            >
                                                                <TableCell className={`text-gray-900 py-4 px-5 ${isLast ? "rounded-bl-lg" : ""}`}>Filter</TableCell>
                                                                <TableCell className="font-medium text-gray-900 py-4 px-5">
                                                                    {item.complexity
                                                                        ? item.complexity.charAt(0).toUpperCase() + item.complexity.slice(1).toLowerCase()
                                                                        : item.complexity}
                                                                </TableCell>
                                                                <TableCell className="text-gray-900 py-4 px-5">{(item as { feature?: string }).feature ?? "—"}</TableCell>
                                                                <TableCell className="text-right text-gray-900 py-4 px-5">{item.filter_count}</TableCell>
                                                                <TableCell className="text-right text-gray-900 py-4 px-5">{item.dashboards_containing_count}</TableCell>
                                                                <TableCell className={`text-right text-gray-900 py-4 px-5 ${isLast ? "rounded-br-lg" : ""}`}>{item.reports_containing_count}</TableCell>
                                                            </TableRow>
                                                        );
                                                    })}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    </div>
                                </div>
                                );
                            })()}

                            {/* Measures Complexity (from API complex_analysis.measure) */}
                            {complex_analysis?.measure && complex_analysis.measure.length > 0 && (() => {
                                const measureItems = complex_analysis.measure;
                                return (
                                <div>
                                    <h2 className="text-[var(--color-text-primary)] text-2xl font-semibold mb-4 border-l-4 border-[var(--royal-gold)] pl-4">
                                        Measure
                                    </h2>
                                    <div className="mb-8 rounded-lg shadow-md overflow-hidden border border-[var(--light-cream)] [font-family:var(--font-roboto-condensed)]">
                                        <div className="rounded-lg overflow-hidden">
                                            <Table className="text-lg">
                                                <TableHeader>
                                                    <TableRow className="bg-[var(--deep-green)] hover:bg-[var(--deep-green)] border-b-2 border-[var(--light-cream)]">
                                                        <TableHead className="text-white font-bold rounded-tl-lg py-4 px-5 h-auto">FEATURE AREA</TableHead>
                                                        <TableHead className="text-white font-bold py-4 px-5 h-auto">COMPLEXITY</TableHead>
                                                        <TableHead className="text-white font-bold py-4 px-5 h-auto">FEATURE</TableHead>
                                                        <TableHead className="text-white font-bold text-right py-4 px-5 h-auto">MEASURES</TableHead>
                                                        <TableHead className="text-white font-bold text-right py-4 px-5 h-auto">DASHBOARDS AFFECTED</TableHead>
                                                        <TableHead className="text-white font-bold text-right rounded-tr-lg py-4 px-5 h-auto">REPORTS AFFECTED</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {measureItems.map((item, idx) => {
                                                        const isLast = idx === measureItems.length - 1;
                                                        return (
                                                            <TableRow
                                                                key={item.complexity}
                                                                className={`${idx % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-[var(--light-cream)]`}
                                                            >
                                                                <TableCell className={`text-gray-900 py-4 px-5 ${isLast ? "rounded-bl-lg" : ""}`}>Measure</TableCell>
                                                                <TableCell className="font-medium text-gray-900 py-4 px-5">
                                                                    {item.complexity
                                                                        ? item.complexity.charAt(0).toUpperCase() + item.complexity.slice(1).toLowerCase()
                                                                        : item.complexity}
                                                                </TableCell>
                                                                <TableCell className="text-gray-900 py-4 px-5">{(item as { feature?: string }).feature ?? "—"}</TableCell>
                                                                <TableCell className="text-right text-gray-900 py-4 px-5">{item.measure_count}</TableCell>
                                                                <TableCell className="text-right text-gray-900 py-4 px-5">{item.dashboards_containing_count}</TableCell>
                                                                <TableCell className={`text-right text-gray-900 py-4 px-5 ${isLast ? "rounded-br-lg" : ""}`}>{item.reports_containing_count}</TableCell>
                                                            </TableRow>
                                                        );
                                                    })}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    </div>
                                </div>
                                );
                            })()}

                            {/* Dimensions Complexity (from API complex_analysis.dimension) */}
                            {complex_analysis?.dimension && complex_analysis.dimension.length > 0 && (() => {
                                const dimensionItems = complex_analysis.dimension;
                                return (
                                <div>
                                    <h2 className="text-[var(--color-text-primary)] text-2xl font-semibold mb-4 border-l-4 border-[var(--royal-gold)] pl-4">
                                        Dimension
                                    </h2>
                                    <div className="mb-8 rounded-lg shadow-md overflow-hidden border border-[var(--light-cream)] [font-family:var(--font-roboto-condensed)]">
                                        <div className="rounded-lg overflow-hidden">
                                            <Table className="text-lg">
                                                <TableHeader>
                                                    <TableRow className="bg-[var(--deep-green)] hover:bg-[var(--deep-green)] border-b-2 border-[var(--light-cream)]">
                                                        <TableHead className="text-white font-bold rounded-tl-lg py-4 px-5 h-auto">FEATURE AREA</TableHead>
                                                        <TableHead className="text-white font-bold py-4 px-5 h-auto">COMPLEXITY</TableHead>
                                                        <TableHead className="text-white font-bold py-4 px-5 h-auto">FEATURE</TableHead>
                                                        <TableHead className="text-white font-bold text-right py-4 px-5 h-auto">DIMENSIONS</TableHead>
                                                        <TableHead className="text-white font-bold text-right py-4 px-5 h-auto">DASHBOARDS AFFECTED</TableHead>
                                                        <TableHead className="text-white font-bold text-right rounded-tr-lg py-4 px-5 h-auto">REPORTS AFFECTED</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {dimensionItems.map((item, idx) => {
                                                        const isLast = idx === dimensionItems.length - 1;
                                                        return (
                                                            <TableRow
                                                                key={item.complexity}
                                                                className={`${idx % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-[var(--light-cream)]`}
                                                            >
                                                                <TableCell className={`text-gray-900 py-4 px-5 ${isLast ? "rounded-bl-lg" : ""}`}>Dimension</TableCell>
                                                                <TableCell className="font-medium text-gray-900 py-4 px-5">
                                                                    {item.complexity
                                                                        ? item.complexity.charAt(0).toUpperCase() + item.complexity.slice(1).toLowerCase()
                                                                        : item.complexity}
                                                                </TableCell>
                                                                <TableCell className="text-gray-900 py-4 px-5">{(item as { feature?: string }).feature ?? "—"}</TableCell>
                                                                <TableCell className="text-right text-gray-900 py-4 px-5">{item.dimension_count}</TableCell>
                                                                <TableCell className="text-right text-gray-900 py-4 px-5">{item.dashboards_containing_count}</TableCell>
                                                                <TableCell className={`text-right text-gray-900 py-4 px-5 ${isLast ? "rounded-br-lg" : ""}`}>{item.reports_containing_count}</TableCell>
                                                            </TableRow>
                                                        );
                                                    })}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    </div>
                                </div>
                                );
                            })()}

                            {/* Parameters Complexity (from API complex_analysis.parameter) */}
                            {complex_analysis?.parameter && complex_analysis.parameter.length > 0 && (() => {
                                const items = complex_analysis.parameter;
                                return (
                                <div>
                                    <h2 className="text-[var(--color-text-primary)] text-2xl font-semibold mb-4 border-l-4 border-[var(--royal-gold)] pl-4">
                                        Parameter
                                    </h2>
                                    <div className="mb-8 rounded-lg shadow-md overflow-hidden border border-[var(--light-cream)] [font-family:var(--font-roboto-condensed)]">
                                        <div className="rounded-lg overflow-hidden">
                                            <Table className="text-lg">
                                                <TableHeader>
                                                    <TableRow className="bg-[var(--deep-green)] hover:bg-[var(--deep-green)] border-b-2 border-[var(--light-cream)]">
                                                        <TableHead className="text-white font-bold rounded-tl-lg py-4 px-5 h-auto">FEATURE AREA</TableHead>
                                                        <TableHead className="text-white font-bold py-4 px-5 h-auto">COMPLEXITY</TableHead>
                                                        <TableHead className="text-white font-bold py-4 px-5 h-auto">FEATURE</TableHead>
                                                        <TableHead className="text-white font-bold text-right py-4 px-5 h-auto">PARAMETERS</TableHead>
                                                        <TableHead className="text-white font-bold text-right py-4 px-5 h-auto">DASHBOARDS AFFECTED</TableHead>
                                                        <TableHead className="text-white font-bold text-right rounded-tr-lg py-4 px-5 h-auto">REPORTS AFFECTED</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {items.map((item, idx) => {
                                                        const isLast = idx === items.length - 1;
                                                        return (
                                                            <TableRow
                                                                key={item.complexity}
                                                                className={`${idx % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-[var(--light-cream)]`}
                                                            >
                                                                <TableCell className={`text-gray-900 py-4 px-5 ${isLast ? "rounded-bl-lg" : ""}`}>Parameter</TableCell>
                                                                <TableCell className="font-medium text-gray-900 py-4 px-5">
                                                                    {item.complexity ? item.complexity.charAt(0).toUpperCase() + item.complexity.slice(1).toLowerCase() : item.complexity}
                                                                </TableCell>
                                                                <TableCell className="text-gray-900 py-4 px-5">{(item as { feature?: string }).feature ?? "—"}</TableCell>
                                                                <TableCell className="text-right text-gray-900 py-4 px-5">{item.parameter_count}</TableCell>
                                                                <TableCell className="text-right text-gray-900 py-4 px-5">{item.dashboards_containing_count}</TableCell>
                                                                <TableCell className={`text-right text-gray-900 py-4 px-5 ${isLast ? "rounded-br-lg" : ""}`}>{item.reports_containing_count}</TableCell>
                                                            </TableRow>
                                                        );
                                                    })}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    </div>
                                </div>
                                );
                            })()}

                            {/* Sorts Complexity (from API complex_analysis.sort) */}
                            {complex_analysis?.sort && complex_analysis.sort.length > 0 && (() => {
                                const items = complex_analysis.sort;
                                return (
                                <div>
                                    <h2 className="text-[var(--color-text-primary)] text-2xl font-semibold mb-4 border-l-4 border-[var(--royal-gold)] pl-4">
                                        Sort
                                    </h2>
                                    <div className="mb-8 rounded-lg shadow-md overflow-hidden border border-[var(--light-cream)] [font-family:var(--font-roboto-condensed)]">
                                        <div className="rounded-lg overflow-hidden">
                                            <Table className="text-lg">
                                                <TableHeader>
                                                    <TableRow className="bg-[var(--deep-green)] hover:bg-[var(--deep-green)] border-b-2 border-[var(--light-cream)]">
                                                        <TableHead className="text-white font-bold rounded-tl-lg py-4 px-5 h-auto">FEATURE AREA</TableHead>
                                                        <TableHead className="text-white font-bold py-4 px-5 h-auto">COMPLEXITY</TableHead>
                                                        <TableHead className="text-white font-bold py-4 px-5 h-auto">FEATURE</TableHead>
                                                        <TableHead className="text-white font-bold text-right py-4 px-5 h-auto">SORTS</TableHead>
                                                        <TableHead className="text-white font-bold text-right py-4 px-5 h-auto">DASHBOARDS AFFECTED</TableHead>
                                                        <TableHead className="text-white font-bold text-right rounded-tr-lg py-4 px-5 h-auto">REPORTS AFFECTED</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {items.map((item, idx) => {
                                                        const isLast = idx === items.length - 1;
                                                        return (
                                                            <TableRow
                                                                key={item.complexity}
                                                                className={`${idx % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-[var(--light-cream)]`}
                                                            >
                                                                <TableCell className={`text-gray-900 py-4 px-5 ${isLast ? "rounded-bl-lg" : ""}`}>Sort</TableCell>
                                                                <TableCell className="font-medium text-gray-900 py-4 px-5">
                                                                    {item.complexity ? item.complexity.charAt(0).toUpperCase() + item.complexity.slice(1).toLowerCase() : item.complexity}
                                                                </TableCell>
                                                                <TableCell className="text-gray-900 py-4 px-5">{(item as { feature?: string }).feature ?? "—"}</TableCell>
                                                                <TableCell className="text-right text-gray-900 py-4 px-5">{item.sort_count}</TableCell>
                                                                <TableCell className="text-right text-gray-900 py-4 px-5">{item.dashboards_containing_count}</TableCell>
                                                                <TableCell className={`text-right text-gray-900 py-4 px-5 ${isLast ? "rounded-br-lg" : ""}`}>{item.reports_containing_count}</TableCell>
                                                            </TableRow>
                                                        );
                                                    })}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    </div>
                                </div>
                                );
                            })()}

                            {/* Prompts Complexity (from API complex_analysis.prompt) */}
                            {complex_analysis?.prompt && complex_analysis.prompt.length > 0 && (() => {
                                const items = complex_analysis.prompt;
                                return (
                                <div>
                                    <h2 className="text-[var(--color-text-primary)] text-2xl font-semibold mb-4 border-l-4 border-[var(--royal-gold)] pl-4">
                                        Prompt
                                    </h2>
                                    <div className="mb-8 rounded-lg shadow-md overflow-hidden border border-[var(--light-cream)] [font-family:var(--font-roboto-condensed)]">
                                        <div className="rounded-lg overflow-hidden">
                                            <Table className="text-lg">
                                                <TableHeader>
                                                    <TableRow className="bg-[var(--deep-green)] hover:bg-[var(--deep-green)] border-b-2 border-[var(--light-cream)]">
                                                        <TableHead className="text-white font-bold rounded-tl-lg py-4 px-5 h-auto">FEATURE AREA</TableHead>
                                                        <TableHead className="text-white font-bold py-4 px-5 h-auto">COMPLEXITY</TableHead>
                                                        <TableHead className="text-white font-bold py-4 px-5 h-auto">FEATURE</TableHead>
                                                        <TableHead className="text-white font-bold text-right py-4 px-5 h-auto">PROMPTS</TableHead>
                                                        <TableHead className="text-white font-bold text-right py-4 px-5 h-auto">DASHBOARDS AFFECTED</TableHead>
                                                        <TableHead className="text-white font-bold text-right rounded-tr-lg py-4 px-5 h-auto">REPORTS AFFECTED</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {items.map((item, idx) => {
                                                        const isLast = idx === items.length - 1;
                                                        return (
                                                            <TableRow
                                                                key={item.complexity}
                                                                className={`${idx % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-[var(--light-cream)]`}
                                                            >
                                                                <TableCell className={`text-gray-900 py-4 px-5 ${isLast ? "rounded-bl-lg" : ""}`}>Prompt</TableCell>
                                                                <TableCell className="font-medium text-gray-900 py-4 px-5">
                                                                    {item.complexity ? item.complexity.charAt(0).toUpperCase() + item.complexity.slice(1).toLowerCase() : item.complexity}
                                                                </TableCell>
                                                                <TableCell className="text-gray-900 py-4 px-5">{(item as { feature?: string }).feature ?? "—"}</TableCell>
                                                                <TableCell className="text-right text-gray-900 py-4 px-5">{item.prompt_count}</TableCell>
                                                                <TableCell className="text-right text-gray-900 py-4 px-5">{item.dashboards_containing_count}</TableCell>
                                                                <TableCell className={`text-right text-gray-900 py-4 px-5 ${isLast ? "rounded-br-lg" : ""}`}>{item.reports_containing_count}</TableCell>
                                                            </TableRow>
                                                        );
                                                    })}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    </div>
                                </div>
                                );
                            })()}

                            {/* Queries Complexity (from API complex_analysis.query) */}
                            {complex_analysis?.query && complex_analysis.query.length > 0 && (() => {
                                const items = complex_analysis.query;
                                return (
                                <div>
                                    <h2 className="text-[var(--color-text-primary)] text-2xl font-semibold mb-4 border-l-4 border-[var(--royal-gold)] pl-4">
                                        Query
                                    </h2>
                                    <div className="mb-8 rounded-lg shadow-md overflow-hidden border border-[var(--light-cream)] [font-family:var(--font-roboto-condensed)]">
                                        <div className="rounded-lg overflow-hidden">
                                            <Table className="text-lg">
                                                <TableHeader>
                                                    <TableRow className="bg-[var(--deep-green)] hover:bg-[var(--deep-green)] border-b-2 border-[var(--light-cream)]">
                                                        <TableHead className="text-white font-bold rounded-tl-lg py-4 px-5 h-auto">FEATURE AREA</TableHead>
                                                        <TableHead className="text-white font-bold py-4 px-5 h-auto">COMPLEXITY</TableHead>
                                                        <TableHead className="text-white font-bold py-4 px-5 h-auto">FEATURE</TableHead>
                                                        <TableHead className="text-white font-bold text-right py-4 px-5 h-auto">QUERIES</TableHead>
                                                        <TableHead className="text-white font-bold text-right py-4 px-5 h-auto">DASHBOARDS AFFECTED</TableHead>
                                                        <TableHead className="text-white font-bold text-right rounded-tr-lg py-4 px-5 h-auto">REPORTS AFFECTED</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {items.map((item, idx) => {
                                                        const isLast = idx === items.length - 1;
                                                        return (
                                                            <TableRow
                                                                key={item.complexity}
                                                                className={`${idx % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-[var(--light-cream)]`}
                                                            >
                                                                <TableCell className={`text-gray-900 py-4 px-5 ${isLast ? "rounded-bl-lg" : ""}`}>Query</TableCell>
                                                                <TableCell className="font-medium text-gray-900 py-4 px-5">
                                                                    {item.complexity ? item.complexity.charAt(0).toUpperCase() + item.complexity.slice(1).toLowerCase() : item.complexity}
                                                                </TableCell>
                                                                <TableCell className="text-gray-900 py-4 px-5">{(item as { feature?: string }).feature ?? "—"}</TableCell>
                                                                <TableCell className="text-right text-gray-900 py-4 px-5">{item.query_count}</TableCell>
                                                                <TableCell className="text-right text-gray-900 py-4 px-5">{item.dashboards_containing_count}</TableCell>
                                                                <TableCell className={`text-right text-gray-900 py-4 px-5 ${isLast ? "rounded-br-lg" : ""}`}>{item.reports_containing_count}</TableCell>
                                                            </TableRow>
                                                        );
                                                    })}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    </div>
                                </div>
                                );
                            })()}

                        </TabsContent>

                        {/* USAGE STATS Tab */}
                        <TabsContent value="usage" className="mt-0 space-y-6">
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
                            {usage_stats && (
                                <div className="space-y-8">
                                    {/* Most Used Content (Last 60 Days) */}
                                    {(() => {
                                        const data = (usage_stats.usage_stats as Record<string, unknown>)?.["most_used_content_last_60_days"] as UsageStatsRow[] | undefined;
                                        if (!Array.isArray(data) || data.length === 0) return null;
                                        return (
                                            <div key="most-used">
                                                <h3 className="text-xl font-bold text-[var(--deep-green)] mb-4">Most Used Content (Last 60 Days)</h3>
                                                <div className="mb-8 rounded-lg shadow-md overflow-hidden border border-[var(--light-cream)] [font-family:var(--font-roboto-condensed)]">
                                                    <Table className="text-lg">
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
                                                            {data.map((row, idx) => {
                                                                const isLast = idx === data.length - 1;
                                                                return (
                                                                    <TableRow key={idx} className={`${idx % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-[var(--light-cream)]`}>
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
                                                    </Table>
                                                </div>
                                            </div>
                                        );
                                    })()}

                                    {/* Inactive Content (Last 60 Days) */}
                                    {(() => {
                                        const data = (usage_stats.usage_stats as Record<string, unknown>)?.["inactive_content_last_60_days"] as UsageStatsRow[] | undefined;
                                        if (!Array.isArray(data) || data.length === 0) return null;
                                        return (
                                            <div key="inactive">
                                                <h3 className="text-xl font-bold text-[var(--deep-green)] mb-4">Inactive Content (Last 60 Days)</h3>
                                                <div className="mb-8 rounded-lg shadow-md overflow-hidden border border-[var(--light-cream)] [font-family:var(--font-roboto-condensed)]">
                                                    <Table className="text-lg">
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
                                                            {data.map((row, idx) => {
                                                                const isLast = idx === data.length - 1;
                                                                return (
                                                                    <TableRow key={idx} className={`${idx % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-[var(--light-cream)]`}>
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
                                                    </Table>
                                                </div>
                                            </div>
                                        );
                                    })()}

                                    {/* Content Creation Rate */}
                                    {(() => {
                                        const data = (usage_stats.content_creation as Record<string, unknown>)?.["content_creation_rate"] as UsageStatsRow[] | undefined;
                                        if (!Array.isArray(data) || data.length === 0) return null;
                                        return (
                                            <div key="content-creation">
                                                <h3 className="text-xl font-bold text-[var(--deep-green)] mb-4">Content Creation Rate</h3>
                                                <div className="mb-8 rounded-lg shadow-md overflow-hidden border border-[var(--light-cream)] [font-family:var(--font-roboto-condensed)]">
                                                    <Table className="text-lg">
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
                                                            {data.map((row, idx) => {
                                                                const isLast = idx === data.length - 1;
                                                                return (
                                                                    <TableRow key={idx} className={`${idx % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-[var(--light-cream)]`}>
                                                                        <TableCell className={`font-medium text-gray-900 py-4 px-5 ${isLast ? "rounded-bl-lg" : ""}`}>{usVal(row, "month_label", "MONTH_LABEL") ?? "—"}</TableCell>
                                                                        <TableCell className="text-gray-900 py-4 px-5">{usVal(row, "content_type", "CONTENT_TYPE") ?? "—"}</TableCell>
                                                                        <TableCell className="text-gray-900 py-4 px-5 text-right">{usVal(row, "new_artifacts_created", "NEW_ARTIFACTS_CREATED") ?? "—"}</TableCell>
                                                                        <TableCell className="text-gray-900 py-4 px-5 text-right">{usVal(row, "artifacts_modified", "ARTIFACTS_MODIFIED") ?? "—"}</TableCell>
                                                                        <TableCell className={`text-gray-900 py-4 px-5 max-w-[240px] truncate ${isLast ? "rounded-br-lg" : ""}`} title={String(usVal(row, "example_of_new_content", "EXAMPLE_OF_NEW_CONTENT") ?? "")}>{usVal(row, "example_of_new_content", "EXAMPLE_OF_NEW_CONTENT") ?? "—"}</TableCell>
                                                                    </TableRow>
                                                                );
                                                            })}
                                                        </TableBody>
                                                    </Table>
                                                </div>
                                            </div>
                                        );
                                    })()}

                                    {/* Top Active Users */}
                                    {(() => {
                                        const data = (usage_stats.user_stats as Record<string, unknown>)?.["top_active_users"] as UsageStatsRow[] | undefined;
                                        if (!Array.isArray(data) || data.length === 0) return null;
                                        return (
                                            <div key="top-active-users">
                                                <h3 className="text-xl font-bold text-[var(--deep-green)] mb-4">Top Active Users</h3>
                                                <div className="mb-8 rounded-lg shadow-md overflow-hidden border border-[var(--light-cream)] [font-family:var(--font-roboto-condensed)]">
                                                    <Table className="text-lg">
                                                        <TableHeader>
                                                            <TableRow className="bg-[var(--deep-green)] hover:bg-[var(--deep-green)] border-b-2 border-[var(--light-cream)]">
                                                                <TableHead className="text-white font-bold rounded-tl-lg py-4 px-5 h-auto">RANK</TableHead>
                                                                <TableHead className="text-white font-bold py-4 px-5 h-auto">USER NAME</TableHead>
                                                                <TableHead className="text-white font-bold py-4 px-5 h-auto text-right">EXECUTIONS (60D)</TableHead>
                                                                <TableHead className="text-white font-bold rounded-tr-lg py-4 px-5 h-auto">PRIMARY FOCUS</TableHead>
                                                            </TableRow>
                                                        </TableHeader>
                                                        <TableBody>
                                                            {data.map((row, idx) => {
                                                                const isLast = idx === data.length - 1;
                                                                return (
                                                                    <TableRow key={idx} className={`${idx % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-[var(--light-cream)]`}>
                                                                        <TableCell className={`font-medium text-gray-900 py-4 px-5 ${isLast ? "rounded-bl-lg" : ""}`}>{usVal(row, "rank", "RANK") ?? "—"}</TableCell>
                                                                        <TableCell className="text-gray-900 py-4 px-5">{usVal(row, "user_name", "USER_NAME") ?? "—"}</TableCell>
                                                                        <TableCell className="text-gray-900 py-4 px-5 text-right">{usVal(row, "executions_last_60_days", "EXECUTIONS_LAST_60_DAYS") ?? "—"}</TableCell>
                                                                        <TableCell className={`text-gray-900 py-4 px-5 ${isLast ? "rounded-br-lg" : ""}`}>{usVal(row, "primary_focus_most_viewed", "PRIMARY_FOCUS_MOST_VIEWED") ?? "—"}</TableCell>
                                                                    </TableRow>
                                                                );
                                                            })}
                                                        </TableBody>
                                                    </Table>
                                                </div>
                                            </div>
                                        );
                                    })()}

                                    {/* Developer Activity */}
                                    {(() => {
                                        const data = (usage_stats.user_stats as Record<string, unknown>)?.["developer_activity"] as UsageStatsRow[] | undefined;
                                        if (!Array.isArray(data) || data.length === 0) return null;
                                        return (
                                            <div key="developer-activity">
                                                <h3 className="text-xl font-bold text-[var(--deep-green)] mb-4">Developer Activity</h3>
                                                <div className="mb-8 rounded-lg shadow-md overflow-hidden border border-[var(--light-cream)] [font-family:var(--font-roboto-condensed)]">
                                                    <Table className="text-lg">
                                                        <TableHeader>
                                                            <TableRow className="bg-[var(--deep-green)] hover:bg-[var(--deep-green)] border-b-2 border-[var(--light-cream)]">
                                                                <TableHead className="text-white font-bold rounded-tl-lg py-4 px-5 h-auto">USERNAME</TableHead>
                                                                <TableHead className="text-white font-bold py-4 px-5 h-auto text-right">REPORTS CREATED</TableHead>
                                                                <TableHead className="text-white font-bold py-4 px-5 h-auto text-right">DASHBOARDS CREATED</TableHead>
                                                                <TableHead className="text-white font-bold rounded-tr-lg py-4 px-5 h-auto">EXAMPLE WORKBOOKS</TableHead>
                                                            </TableRow>
                                                        </TableHeader>
                                                        <TableBody>
                                                            {data.map((row, idx) => {
                                                                const isLast = idx === data.length - 1;
                                                                return (
                                                                    <TableRow key={idx} className={`${idx % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-[var(--light-cream)]`}>
                                                                        <TableCell className={`font-medium text-gray-900 py-4 px-5 ${isLast ? "rounded-bl-lg" : ""}`}>{usVal(row, "username", "USERNAME") ?? "—"}</TableCell>
                                                                        <TableCell className="text-gray-900 py-4 px-5 text-right">{usVal(row, "reports_created", "REPORTS_CREATED") ?? "—"}</TableCell>
                                                                        <TableCell className="text-gray-900 py-4 px-5 text-right">{usVal(row, "dashboards_created", "DASHBOARDS_CREATED") ?? "—"}</TableCell>
                                                                        <TableCell className={`text-gray-900 py-4 px-5 max-w-[280px] truncate ${isLast ? "rounded-br-lg" : ""}`} title={String(usVal(row, "example_workbooks_published", "EXAMPLE_WORKBOOKS_PUBLISHED") ?? "")}>{usVal(row, "example_workbooks_published", "EXAMPLE_WORKBOOKS_PUBLISHED") ?? "—"}</TableCell>
                                                                    </TableRow>
                                                                );
                                                            })}
                                                        </TableBody>
                                                    </Table>
                                                </div>
                                            </div>
                                        );
                                    })()}

                                    {/* Frequently Used Slow Reports */}
                                    {(() => {
                                        const data = (usage_stats.performance as Record<string, unknown>)?.["frequently_used_slow_reports"] as UsageStatsRow[] | undefined;
                                        if (!Array.isArray(data) || data.length === 0) return null;
                                        return (
                                            <div key="slow-reports">
                                                <h3 className="text-xl font-bold text-[var(--deep-green)] mb-4">Frequently Used Slow Reports</h3>
                                                <div className="mb-8 rounded-lg shadow-md overflow-hidden border border-[var(--light-cream)] [font-family:var(--font-roboto-condensed)]">
                                                    <Table className="text-lg">
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
                                                            {data.map((row, idx) => {
                                                                const isLast = idx === data.length - 1;
                                                                return (
                                                                    <TableRow key={idx} className={`${idx % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-[var(--light-cream)]`}>
                                                                        <TableCell className={`font-medium text-gray-900 py-4 px-5 ${isLast ? "rounded-bl-lg" : ""}`}>{usVal(row, "rank", "RANK") ?? "—"}</TableCell>
                                                                        <TableCell className="text-gray-900 py-4 px-5">{usVal(row, "workbook_name", "WORKBOOK_NAME") ?? "—"}</TableCell>
                                                                        <TableCell className="text-gray-900 py-4 px-5 text-right">{usVal(row, "avg_load_time_seconds", "AVG_LOAD_TIME_SECONDS") ?? "—"}</TableCell>
                                                                        <TableCell className="text-gray-900 py-4 px-5 text-right">{usVal(row, "views_last_60_days", "VIEWS_LAST_60_DAYS") ?? "—"}</TableCell>
                                                                        <TableCell className={`text-gray-900 py-4 px-5 max-w-[200px] truncate ${isLast ? "rounded-br-lg" : ""}`} title={String(usVal(row, "report_path", "REPORT_PATH") ?? "")}>{usVal(row, "report_path", "REPORT_PATH") ?? "—"}</TableCell>
                                                                    </TableRow>
                                                                );
                                                            })}
                                                        </TableBody>
                                                    </Table>
                                                </div>
                                            </div>
                                        );
                                    })()}

                                    {/* Quick Wins Scatter */}
                                    {(() => {
                                        const data = (usage_stats.quick_wins as Record<string, unknown>)?.["quick_wins_scatter"] as UsageStatsRow[] | undefined;
                                        if (!Array.isArray(data) || data.length === 0) return null;
                                        return (
                                            <div key="quick-wins">
                                                <h3 className="text-xl font-bold text-[var(--deep-green)] mb-4">Quick Wins</h3>
                                                <div className="mb-8 rounded-lg shadow-md overflow-hidden border border-[var(--light-cream)] [font-family:var(--font-roboto-condensed)]">
                                                    <Table className="text-lg">
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
                                                            {data.map((row, idx) => {
                                                                const isLast = idx === data.length - 1;
                                                                return (
                                                                    <TableRow key={idx} className={`${idx % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-[var(--light-cream)]`}>
                                                                        <TableCell className={`font-medium text-gray-900 py-4 px-5 ${isLast ? "rounded-bl-lg" : ""}`}>{usVal(row, "target_name", "TARGET_NAME") ?? "—"}</TableCell>
                                                                        <TableCell className="text-gray-900 py-4 px-5">{usVal(row, "content_type", "CONTENT_TYPE") ?? "—"}</TableCell>
                                                                        <TableCell className="text-gray-900 py-4 px-5 text-right">{usVal(row, "views_last_60_days", "VIEWS_LAST_60_DAYS") ?? "—"}</TableCell>
                                                                        <TableCell className="text-gray-900 py-4 px-5">{usVal(row, "migration_category", "MIGRATION_CATEGORY") ?? "—"}</TableCell>
                                                                        <TableCell className={`text-gray-900 py-4 px-5 max-w-[200px] truncate ${isLast ? "rounded-br-lg" : ""}`} title={String(usVal(row, "cogipf_target_path", "COGIPF_TARGET_PATH") ?? "")}>{usVal(row, "cogipf_target_path", "COGIPF_TARGET_PATH") ?? "—"}</TableCell>
                                                                    </TableRow>
                                                                );
                                                            })}
                                                        </TableBody>
                                                    </Table>
                                                </div>
                                            </div>
                                        );
                                    })()}

                                    {/* Recommended Pilot Reports */}
                                    {(() => {
                                        const data = (usage_stats.pilot_recommendations as Record<string, unknown>)?.["recommended_pilot_reports"] as UsageStatsRow[] | undefined;
                                        if (!Array.isArray(data) || data.length === 0) return null;
                                        return (
                                            <div key="pilot-recommendations">
                                                <h3 className="text-xl font-bold text-[var(--deep-green)] mb-4">Recommended Pilot Reports</h3>
                                                <div className="mb-8 rounded-lg shadow-md overflow-hidden border border-[var(--light-cream)] [font-family:var(--font-roboto-condensed)]">
                                                    <Table className="text-lg">
                                                        <TableHeader>
                                                            <TableRow className="bg-[var(--deep-green)] hover:bg-[var(--deep-green)] border-b-2 border-[var(--light-cream)]">
                                                                <TableHead className="text-white font-bold rounded-tl-lg py-4 px-5 h-auto">TARGET NAME</TableHead>
                                                                <TableHead className="text-white font-bold py-4 px-5 h-auto">CONTENT TYPE</TableHead>
                                                                <TableHead className="text-white font-bold py-4 px-5 h-auto">MIGRATION CATEGORY</TableHead>
                                                                <TableHead className="text-white font-bold rounded-tr-lg py-4 px-5 h-auto text-right">AVG VIEWS</TableHead>
                                                            </TableRow>
                                                        </TableHeader>
                                                        <TableBody>
                                                            {data.map((row, idx) => {
                                                                const isLast = idx === data.length - 1;
                                                                return (
                                                                    <TableRow key={idx} className={`${idx % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-[var(--light-cream)]`}>
                                                                        <TableCell className={`font-medium text-gray-900 py-4 px-5 ${isLast ? "rounded-bl-lg" : ""}`}>{usVal(row, "target_name", "TARGET_NAME") ?? "—"}</TableCell>
                                                                        <TableCell className="text-gray-900 py-4 px-5">{usVal(row, "content_type", "CONTENT_TYPE") ?? "—"}</TableCell>
                                                                        <TableCell className="text-gray-900 py-4 px-5">{usVal(row, "migration_category", "MIGRATION_CATEGORY") ?? "—"}</TableCell>
                                                                        <TableCell className={`text-gray-900 py-4 px-5 text-right ${isLast ? "rounded-br-lg" : ""}`}>{usVal(row, "avg_views", "AVG_VIEWS") ?? "—"}</TableCell>
                                                                    </TableRow>
                                                                );
                                                            })}
                                                        </TableBody>
                                                    </Table>
                                                </div>
                                            </div>
                                        );
                                    })()}
                                </div>
                            )}
                            {!usage_stats && (
                                <div className="text-center py-8 text-muted-foreground">
                                    Usage statistics data would be displayed here when available. Upload a <code className="bg-gray-100 px-1 rounded">usage_stats.json</code> file with your assessment to see metrics.
                                </div>
                            )}
                        </TabsContent>

                        {/* CHALLENGES Tab */}
                        <TabsContent value="challenges" className="mt-0 space-y-6">
                            <div>
                                <h2 className="text-[2.6em] font-bold text-[var(--deep-green)] mb-[35px]">
                                    <span className="border-b-4 border-[var(--royal-gold)]">Identified Challenges</span> & Recommendations
                                </h2>
                                <div className="bg-[var(--light-cream)] border-l-4 border-[var(--royal-gold)] rounded-lg shadow-sm text-[1.12em] mb-[35px] py-[24px] px-[28px] flex items-start gap-3">
                                    <Info className="h-5 w-5 text-[var(--deep-green)] mt-0.5 flex-shrink-0" />
                                    <p className="text-[#333333]">
                                        Based on the assessment, several key challenges have been identified along with strategic recommendations to ensure a successful migration.
                                    </p>
                                </div>
                            </div>
                            {challenges?.visualization && challenges.visualization.length > 0 ? (
                                <>
                                    <div className="mb-8 rounded-lg shadow-md overflow-hidden border border-[var(--light-cream)] [font-family:var(--font-roboto-condensed)]">
                                        <div className="rounded-lg overflow-hidden">
                                            <Table className="text-lg">
                                                <TableHeader>
                                                    <TableRow className="bg-[var(--deep-green)] hover:bg-[var(--deep-green)] border-b-2 border-[var(--light-cream)]">
                                                        <TableHead className="text-white font-bold rounded-tl-lg py-4 px-5 h-auto">VISUALIZATION</TableHead>
                                                        <TableHead className="text-white font-bold py-4 px-5 h-auto">TYPE</TableHead>
                                                        <TableHead className="text-white font-bold py-4 px-5 h-auto">COMPLEXITY</TableHead>
                                                        <TableHead className="text-white font-bold py-4 px-5 h-auto">DESCRIPTION</TableHead>
                                                        <TableHead className="text-white font-bold py-4 px-5 h-auto">RECOMMENDED</TableHead>
                                                        <TableHead className="text-white font-bold rounded-tr-lg py-4 px-5 h-auto">DASHBOARD / REPORT</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {paginatedChallenges.map((item, idx) => {
                                                        const isLast = idx === paginatedChallenges.length - 1;
                                                        return (
                                                            <TableRow
                                                                key={(challengesPage - 1) * challengesItemsPerPage + idx}
                                                                className={`${idx % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-[var(--light-cream)]`}
                                                            >
                                                                <TableCell className={`text-gray-900 font-medium py-4 px-5 ${isLast ? "rounded-bl-lg" : ""}`}>{item.visualization}</TableCell>
                                                                <TableCell className="text-gray-900 py-4 px-5">{item.visualization_type}</TableCell>
                                                                <TableCell className="py-4 px-5">
                                                                    {(item.complexity || "").charAt(0).toUpperCase() + (item.complexity || "").slice(1).toLowerCase()}
                                                                </TableCell>
                                                                <TableCell className="text-gray-900 py-4 px-5 max-w-[280px]">{item.description ?? "—"}</TableCell>
                                                                <TableCell className="text-gray-900 py-4 px-5 max-w-[280px]">{item.recommended ?? "—"}</TableCell>
                                                                <TableCell className={`text-gray-900 py-4 px-5 ${isLast ? "rounded-br-lg" : ""}`}>{item.dashboard_or_report_name ?? "—"}</TableCell>
                                                            </TableRow>
                                                        );
                                                    })}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    </div>
                                    {/* Pagination */}
                                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
                                        <div className="text-sm text-gray-600">
                                            Showing {(challengesPage - 1) * challengesItemsPerPage + 1} to {Math.min(challengesPage * challengesItemsPerPage, challengesList.length)} of {challengesList.length} entries
                                        </div>
                                        <div className="flex gap-2 items-center">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="rounded-md text-[var(--deep-green)] border-gray-300 bg-[var(--light-cream)] hover:bg-gray-100"
                                                onClick={() => setChallengesPage((p) => Math.max(1, p - 1))}
                                                disabled={challengesPage === 1}
                                            >
                                                Previous
                                            </Button>
                                            {challengesPageNumbers.map((page, i) =>
                                                page === "ellipsis" ? (
                                                    <span key={`ellipsis-${i}`} className="px-2 py-1.5 rounded-md bg-[var(--light-cream)] text-gray-500" aria-hidden>
                                                        …
                                                    </span>
                                                ) : (
                                                    <Button
                                                        key={page}
                                                        variant="outline"
                                                        size="sm"
                                                        className={`rounded-md min-w-[2rem] ${
                                                            challengesPage === page
                                                                ? "bg-[var(--royal-gold)] text-[var(--deep-green)] hover:bg-[var(--royal-gold)] border-[var(--royal-gold)]"
                                                                : "text-[var(--deep-green)] border-gray-300 bg-[var(--light-cream)] hover:bg-gray-100"
                                                        }`}
                                                        onClick={() => setChallengesPage(page)}
                                                    >
                                                        {page}
                                                    </Button>
                                                )
                                            )}
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="rounded-md text-[var(--deep-green)] border-gray-300 bg-[var(--light-cream)] hover:bg-gray-100"
                                                onClick={() => setChallengesPage((p) => Math.min(challengesTotalPages, p + 1))}
                                                disabled={challengesPage === challengesTotalPages}
                                            >
                                                Next
                                            </Button>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="text-center py-8 text-muted-foreground">
                                    No challenges data available for this assessment.
                                </div>
                            )}
                        </TabsContent>

                        {/* APPENDIX Tab */}
                        <TabsContent value="appendix" className="mt-0 space-y-6">
                            <div>
                                <h2 className="text-[2.6em] font-bold text-[var(--deep-green)] mb-[35px]">
                                    <span className="border-b-4 border-[var(--royal-gold)]">Appendix:</span> Detailed Inventory
                                </h2>
                                <div className="bg-[var(--light-cream)] border-l-4 border-[var(--royal-gold)] rounded-lg shadow-sm text-[1.12em] mb-[35px] py-[24px] px-[28px] flex items-start gap-3">
                                    <Info className="h-5 w-5 text-[var(--deep-green)] mt-0.5 flex-shrink-0" />
                                    <p className="text-[#333333]">
                                        This appendix provides comprehensive details about the current {biTool} environment, including complete dashboard and report inventory, data source catalog.
                                    </p>
                                </div>
                            </div>

                            {/* dashboard and report appendix */}
                            {(appendixDashboardsList.length > 0 || appendixReportsList.length > 0) ? (
                                <>
                                    {appendixDashboardsList.length > 0 && (
                                        <div className="space-y-4">
                                            <h3 className="text-xl font-bold text-[var(--deep-green)]">Dashboards</h3>
                                            <div className="mb-8 rounded-lg shadow-md overflow-hidden border border-[var(--light-cream)] [font-family:var(--font-roboto-condensed)]">
                                                <div className="rounded-lg overflow-hidden">
                                                    <Table className="text-lg">
                                                        <TableHeader>
                                                            <TableRow className="bg-[var(--deep-green)] hover:bg-[var(--deep-green)] border-b-2 border-[var(--light-cream)]">
                                                                <TableHead className="text-white font-bold rounded-tl-lg py-4 px-5 h-auto">NAME</TableHead>
                                                                <TableHead className="text-white font-bold py-4 px-5 h-auto">PACKAGE</TableHead>
                                                                <TableHead className="text-white font-bold py-4 px-5 h-auto">DATA MODULE</TableHead>
                                                                <TableHead className="text-white font-bold rounded-tr-lg py-4 px-5 h-auto">OWNER</TableHead>
                                                            </TableRow>
                                                        </TableHeader>
                                                        <TableBody>
                                                            {paginatedAppendixDashboards.map((item, idx) => {
                                                                const isLast = idx === paginatedAppendixDashboards.length - 1;
                                                                return (
                                                                    <TableRow
                                                                        key={(appendixDashPage - 1) * appendixItemsPerPage + idx}
                                                                        className={`${idx % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-[var(--light-cream)]`}
                                                                    >
                                                                        <TableCell className={`text-gray-900 font-medium py-4 px-5 ${isLast ? "rounded-bl-lg" : ""}`}>{item.name ?? "—"}</TableCell>
                                                                        <TableCell className="text-gray-900 py-4 px-5 max-w-[240px]">{(item.package?.length ? item.package.join(", ") : "—")}</TableCell>
                                                                        <TableCell className="text-gray-900 py-4 px-5 max-w-[240px]">{(item.data_module?.length ? item.data_module.join(", ") : "—")}</TableCell>
                                                                        <TableCell className={`text-gray-900 py-4 px-5 ${isLast ? "rounded-br-lg" : ""}`}>{item.owner ?? "—"}</TableCell>
                                                                    </TableRow>
                                                                );
                                                            })}
                                                        </TableBody>
                                                    </Table>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
                                                <div className="text-sm text-gray-600">
                                                    Showing {(appendixDashPage - 1) * appendixItemsPerPage + 1} to {Math.min(appendixDashPage * appendixItemsPerPage, appendixDashboardsList.length)} of {appendixDashboardsList.length} entries
                                                </div>
                                                <div className="flex gap-2 items-center">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="rounded-md text-[var(--deep-green)] border-gray-300 bg-[var(--light-cream)] hover:bg-gray-100"
                                                        onClick={() => setAppendixDashPage((p) => Math.max(1, p - 1))}
                                                        disabled={appendixDashPage === 1}
                                                    >
                                                        Previous
                                                    </Button>
                                                    {appendixDashPageNumbers.map((page, i) =>
                                                        page === "ellipsis" ? (
                                                            <span key={`ellipsis-dash-${i}`} className="px-2 py-1.5 rounded-md bg-[var(--light-cream)] text-gray-500" aria-hidden>
                                                                …
                                                            </span>
                                                        ) : (
                                                            <Button
                                                                key={page}
                                                                variant="outline"
                                                                size="sm"
                                                                className={`rounded-md min-w-[2rem] ${
                                                                    appendixDashPage === page
                                                                        ? "bg-[var(--royal-gold)] text-[var(--deep-green)] hover:bg-[var(--royal-gold)] border-[var(--royal-gold)]"
                                                                        : "text-[var(--deep-green)] border-gray-300 bg-[var(--light-cream)] hover:bg-gray-100"
                                                                }`}
                                                                onClick={() => setAppendixDashPage(page)}
                                                            >
                                                                {page}
                                                            </Button>
                                                        )
                                                    )}
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="rounded-md text-[var(--deep-green)] border-gray-300 bg-[var(--light-cream)] hover:bg-gray-100"
                                                        onClick={() => setAppendixDashPage((p) => Math.min(appendixDashTotalPages, p + 1))}
                                                        disabled={appendixDashPage === appendixDashTotalPages}
                                                    >
                                                        Next
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    {appendixReportsList.length > 0 && (
                                        <div className="space-y-4">
                                            <h3 className="text-xl font-bold text-[var(--deep-green)]">Reports</h3>
                                            <div className="mb-8 rounded-lg shadow-md overflow-hidden border border-[var(--light-cream)] [font-family:var(--font-roboto-condensed)]">
                                                <div className="rounded-lg overflow-hidden">
                                                    <Table className="text-lg">
                                                        <TableHeader>
                                                            <TableRow className="bg-[var(--deep-green)] hover:bg-[var(--deep-green)] border-b-2 border-[var(--light-cream)]">
                                                                <TableHead className="text-white font-bold rounded-tl-lg py-4 px-5 h-auto">NAME</TableHead>
                                                                <TableHead className="text-white font-bold py-4 px-5 h-auto">PACKAGE</TableHead>
                                                                <TableHead className="text-white font-bold py-4 px-5 h-auto">DATA MODULE</TableHead>
                                                                <TableHead className="text-white font-bold rounded-tr-lg py-4 px-5 h-auto">OWNER</TableHead>
                                                            </TableRow>
                                                        </TableHeader>
                                                        <TableBody>
                                                            {paginatedAppendixReports.map((item, idx) => {
                                                                const isLast = idx === paginatedAppendixReports.length - 1;
                                                                return (
                                                                    <TableRow
                                                                        key={(appendixReportPage - 1) * appendixItemsPerPage + idx}
                                                                        className={`${idx % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-[var(--light-cream)]`}
                                                                    >
                                                                        <TableCell className={`text-gray-900 font-medium py-4 px-5 ${isLast ? "rounded-bl-lg" : ""}`}>{item.name ?? "—"}</TableCell>
                                                                        <TableCell className="text-gray-900 py-4 px-5 max-w-[240px]">{(item.package?.length ? item.package.join(", ") : "—")}</TableCell>
                                                                        <TableCell className="text-gray-900 py-4 px-5 max-w-[240px]">{(item.data_module?.length ? item.data_module.join(", ") : "—")}</TableCell>
                                                                        <TableCell className={`text-gray-900 py-4 px-5 ${isLast ? "rounded-br-lg" : ""}`}>{item.owner ?? "—"}</TableCell>
                                                                    </TableRow>
                                                                );
                                                            })}
                                                        </TableBody>
                                                    </Table>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
                                                <div className="text-sm text-gray-600">
                                                    Showing {(appendixReportPage - 1) * appendixItemsPerPage + 1} to {Math.min(appendixReportPage * appendixItemsPerPage, appendixReportsList.length)} of {appendixReportsList.length} entries
                                                </div>
                                                <div className="flex gap-2 items-center">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="rounded-md text-[var(--deep-green)] border-gray-300 bg-[var(--light-cream)] hover:bg-gray-100"
                                                        onClick={() => setAppendixReportPage((p) => Math.max(1, p - 1))}
                                                        disabled={appendixReportPage === 1}
                                                    >
                                                        Previous
                                                    </Button>
                                                    {appendixReportPageNumbers.map((page, i) =>
                                                        page === "ellipsis" ? (
                                                            <span key={`ellipsis-report-${i}`} className="px-2 py-1.5 rounded-md bg-[var(--light-cream)] text-gray-500" aria-hidden>
                                                                …
                                                            </span>
                                                        ) : (
                                                            <Button
                                                                key={page}
                                                                variant="outline"
                                                                size="sm"
                                                                className={`rounded-md min-w-[2rem] ${
                                                                    appendixReportPage === page
                                                                        ? "bg-[var(--royal-gold)] text-[var(--deep-green)] hover:bg-[var(--royal-gold)] border-[var(--royal-gold)]"
                                                                        : "text-[var(--deep-green)] border-gray-300 bg-[var(--light-cream)] hover:bg-gray-100"
                                                                }`}
                                                                onClick={() => setAppendixReportPage(page)}
                                                            >
                                                                {page}
                                                            </Button>
                                                        )
                                                    )}
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="rounded-md text-[var(--deep-green)] border-gray-300 bg-[var(--light-cream)] hover:bg-gray-100"
                                                        onClick={() => setAppendixReportPage((p) => Math.min(appendixReportTotalPages, p + 1))}
                                                        disabled={appendixReportPage === appendixReportTotalPages}
                                                    >
                                                        Next
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="text-center py-8 text-muted-foreground">
                                    No appendix data available for this assessment.
                                </div>
                            )}
                        </TabsContent>
                    </div>
                </Tabs>
            </div>
        </div>
    );
}
