"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import type { ComplexAnalysis, Summary } from "@/lib/api";
import { getComplexityBadgeVariant } from "./utils";

interface SummaryTabProps {
    summary: Summary | null | undefined;
    complex_analysis: ComplexAnalysis | null | undefined;
    inventorySummary: {
        totalDashboards: number;
        totalReports: number;
    };
    /** Overall complexity from API only (displayed when non-empty). */
    overallComplexity: string;
    biTool?: string;
}

export function SummaryTab({
    summary,
    complex_analysis,
    inventorySummary,
    overallComplexity,
    biTool = "Cognos",
}: SummaryTabProps) {
    return (
        <div className="space-y-6">
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
                {overallComplexity !== "" && (
                    <div className="mb-6">
                        <span className="text-lg font-semibold">Overall Complexity: </span>
                        <Badge variant={getComplexityBadgeVariant(overallComplexity)} className="ml-2 text-lg">
                            {overallComplexity}
                        </Badge>
                    </div>
                )}
            </div>

            {/* Overall Key Findings */}
            {summary?.overall_key_findings && summary.overall_key_findings.length > 0 && (
                <div>
                    <h3 className="text-[var(--deep-green)] text-2xl font-semibold mb-4 border-l-4 border-[var(--royal-gold)] pl-4">
                        Overall Key Findings
                    </h3>
                    <div className="mb-8 rounded-lg shadow-md overflow-hidden border border-[var(--light-cream)] [font-family:var(--font-roboto-condensed)]">
                        <Table className="text-lg">
                            <TableHeader>
                                <TableRow className="bg-[var(--deep-green)] hover:bg-[var(--deep-green)] border-b-2 border-[var(--light-cream)]">
                                    <TableHead className="text-white font-bold rounded-tl-lg py-4 px-5 h-auto">AREA</TableHead>
                                    <TableHead className="text-white font-bold py-4 px-5 h-auto text-center">COMPLEXITY / IMPACT</TableHead>
                                    {/* <TableHead className="text-white font-bold py-4 px-5 h-auto text-left">COUNT</TableHead> */}
                                    <TableHead className="text-white font-bold py-4 px-5 h-auto text-left">DASHBOARD</TableHead>
                                    <TableHead className="text-white font-bold text-right rounded-tr-lg py-4 px-5 h-auto text-left">REPORT</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {summary.overall_key_findings.map((finding, idx) => {
                                    const isLast = idx === summary.overall_key_findings!.length - 1;
                                    return (
                                        <TableRow key={idx} className={`${idx % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-[var(--light-cream)]`}>
                                            <TableCell className={`font-medium text-gray-900 py-4 px-5 ${isLast ? "rounded-bl-lg" : ""}`}>{finding.feature_area}</TableCell>
                                            <TableCell className="text-gray-900 py-4 px-5 text-center">
                                                {finding.complexity
                                                    ? finding.complexity.charAt(0).toUpperCase() + finding.complexity.slice(1).toLowerCase()
                                                    : finding.complexity}
                                            </TableCell>
                                            {/* <TableCell className="text-gray-900 py-4 px-5 text-left">{finding.count}</TableCell> */}
                                            <TableCell className="text-gray-900 py-4 px-5 text-left">{finding.dashboards_summary}</TableCell>
                                            <TableCell className={`text-gray-900 py-4 px-5 text-left ${isLast ? "rounded-br-lg" : ""}`}>{finding.reports_summary}</TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            )}

            {/* {summary?.key_findings && summary.key_findings.length > 0 && (
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
                                    <TableHead className="text-white font-bold py-4 px-5 h-auto text-left">DASHBOARD</TableHead>
                                    <TableHead className="text-white font-bold text-right rounded-tr-lg py-4 px-5 h-auto text-left">REPORT</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {summary.key_findings.map((finding, idx) => {
                                    const isLast = idx === summary.key_findings!.length - 1;
                                    return (
                                        <TableRow key={idx} className={`${idx % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-[var(--light-cream)]`}>
                                            <TableCell className={`font-medium text-gray-900 py-4 px-5 ${isLast ? "rounded-bl-lg" : ""}`}>{finding.feature_area}</TableCell>
                                            <TableCell className="text-gray-900 py-4 px-5 text-center">
                                                {finding.complexity
                                                    ? finding.complexity.charAt(0).toUpperCase() + finding.complexity.slice(1).toLowerCase()
                                                    : finding.complexity}
                                            </TableCell>
                                            <TableCell className="text-gray-900 py-4 px-5 text-left">{finding.count}</TableCell>
                                            <TableCell className="text-gray-900 py-4 px-5 text-left">{finding.dashboards_summary}</TableCell>
                                            <TableCell className={`text-gray-900 py-4 px-5 text-left ${isLast ? "rounded-br-lg" : ""}`}>{finding.reports_summary}</TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            )} */}

            {summary?.high_level_complexity_overview && summary.high_level_complexity_overview.length > 0 && (
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
                                {summary.high_level_complexity_overview.map((row, idx) => {
                                    const isLast = idx === summary.high_level_complexity_overview!.length - 1;
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
            )}

            {summary?.inventory && summary.inventory.length > 0 && (
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
                                {summary.inventory.map((item, idx) => {
                                    const isLast = idx === summary.inventory!.length - 1;
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
            )}

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
        </div>
    );
}
