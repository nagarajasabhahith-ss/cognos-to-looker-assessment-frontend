"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { ReportsBreakdown } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

function complexityBadgeVariant(
    complexity: string | null | undefined
): "default" | "secondary" | "destructive" | "outline" {
    const c = (complexity ?? "").toLowerCase();
    if (c === "critical" || c === "high") return "destructive";
    if (c === "medium") return "default";
    if (c === "low") return "secondary";
    return "outline";
}

interface ReportsBreakdownSummaryProps {
    data: ReportsBreakdown | null;
    isLoading?: boolean;
}

export function ReportsBreakdownSummary({ data, isLoading }: ReportsBreakdownSummaryProps) {
    const [open, setOpen] = useState(false);

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Reports Breakdown</CardTitle>
                    <CardDescription>Loading…</CardDescription>
                </CardHeader>
            </Card>
        );
    }

    if (!data) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Reports Breakdown</CardTitle>
                    <CardDescription>No report data available.</CardDescription>
                </CardHeader>
            </Card>
        );
    }

    const { total_reports, stats, reports } = data;
    const statItems = stats
        ? [
            { label: "Low", count: stats.low ?? 0, variant: "secondary" as const },
            { label: "Medium", count: stats.medium ?? 0, variant: "default" as const },
            { label: "High", count: stats.high ?? 0, variant: "destructive" as const },
            { label: "Critical", count: stats.critical ?? 0, variant: "destructive" as const },
        ]
        : [];

    return (
        <Card>
            <CardHeader>
                <CardTitle>Reports Breakdown</CardTitle>
                <CardDescription>
                    Total reports: {total_reports}. Per-report counts (visualizations, pages, tables, columns, filters, parameters, measures, dimensions, etc.).
                </CardDescription>
            </CardHeader>
            <CardContent>
                {/* Report stats cards by complexity */}
                {statItems.length > 0 && (
                    <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                        {statItems.map(({ label, count, variant }) => (
                            <div
                                key={label}
                                className="flex flex-col gap-1 rounded-lg border bg-muted/50 px-3 py-2"
                            >
                                <span className="text-xs font-medium text-muted-foreground">{label}</span>
                                <div className="flex items-center gap-2">
                                    <Badge variant={variant}>{label}</Badge>
                                    <span className="text-lg font-semibold tabular-nums">{count}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <Collapsible open={open} onOpenChange={setOpen}>
                    <CollapsibleTrigger className="flex items-center gap-2 rounded-md py-2 text-left text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
                        <ChevronRight className={`h-4 w-4 shrink-0 transition-transform duration-200 ${open ? "rotate-90" : ""}`} />
                        Per-report breakdown ({reports.length} {reports.length === 1 ? "report" : "reports"})
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                        <div className="pt-2 overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Report</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Complexity</TableHead>
                                        <TableHead className="text-right" title="Total viz; below: L=Low, M=Medium, H=High, C=Critical">
                                            Viz
                                        </TableHead>
                                        <TableHead className="text-right">Pages</TableHead>
                                        <TableHead className="text-right">Measures</TableHead>
                                        <TableHead className="text-right">Dimensions</TableHead>
                                        <TableHead className="text-right" title="Total calc fields; below: L=Low, M=Medium, H=High, C=Critical">
                                            Calc fields
                                        </TableHead>
                                        <TableHead className="text-right">Filters</TableHead>
                                        <TableHead className="text-right">Params</TableHead>
                                        <TableHead className="text-right">Sorts</TableHead>
                                        <TableHead className="text-right">Prompts</TableHead>
                                        <TableHead className="text-right">Data modules</TableHead>
                                        <TableHead className="text-right">Tables</TableHead>
                                        <TableHead className="text-right">Columns</TableHead>
                                        <TableHead className="text-right">Packages</TableHead>
                                        <TableHead className="text-right">Data sources</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {reports.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={17} className="text-muted-foreground text-center">
                                                No report data
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        reports.map((r) => (
                                            <TableRow key={r.report_id}>
                                                <TableCell className="font-medium max-w-[200px] truncate" title={r.report_name}>
                                                    {r.report_name}
                                                </TableCell>
                                                <TableCell className="text-muted-foreground text-sm">{r.report_type ?? "report"}</TableCell>
                                                <TableCell>
                                                    <Badge variant={complexityBadgeVariant(r.complexity)}>
                                                        {r.complexity ?? "Low"}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex flex-col items-end gap-1">
                                                        <span className="tabular-nums font-medium">
                                                            {r.total_visualizations ?? 0}
                                                        </span>
                                                        {r.visualizations_by_complexity &&
                                                            (r.visualizations_by_complexity.low > 0 ||
                                                                r.visualizations_by_complexity.medium > 0 ||
                                                                r.visualizations_by_complexity.high > 0 ||
                                                                r.visualizations_by_complexity.critical > 0) && (
                                                            <div className="flex flex-wrap justify-end gap-1 text-xs">
                                                                {r.visualizations_by_complexity.low > 0 && (
                                                                    <Badge variant="secondary" className="font-normal px-1.5 py-0">
                                                                        L:{r.visualizations_by_complexity.low}
                                                                    </Badge>
                                                                )}
                                                                {r.visualizations_by_complexity.medium > 0 && (
                                                                    <Badge variant="default" className="font-normal px-1.5 py-0">
                                                                        M:{r.visualizations_by_complexity.medium}
                                                                    </Badge>
                                                                )}
                                                                {r.visualizations_by_complexity.high > 0 && (
                                                                    <Badge variant="destructive" className="font-normal px-1.5 py-0">
                                                                        H:{r.visualizations_by_complexity.high}
                                                                    </Badge>
                                                                )}
                                                                {r.visualizations_by_complexity.critical > 0 && (
                                                                    <Badge variant="destructive" className="font-normal px-1.5 py-0">
                                                                        C:{r.visualizations_by_complexity.critical}
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right">{r.total_pages ?? 0}</TableCell>
                                                <TableCell className="text-right">{r.total_measures ?? 0}</TableCell>
                                                <TableCell className="text-right">{r.total_dimensions ?? 0}</TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex flex-col items-end gap-1">
                                                        <span className="tabular-nums font-medium">
                                                            {r.total_calculated_fields ?? 0}
                                                        </span>
                                                        {r.calculated_fields_by_complexity &&
                                                            (r.calculated_fields_by_complexity.low > 0 ||
                                                                r.calculated_fields_by_complexity.medium > 0 ||
                                                                r.calculated_fields_by_complexity.high > 0 ||
                                                                r.calculated_fields_by_complexity.critical > 0) && (
                                                            <div className="flex flex-wrap justify-end gap-1 text-xs">
                                                                {r.calculated_fields_by_complexity.low > 0 && (
                                                                    <Badge variant="secondary" className="font-normal px-1.5 py-0">
                                                                        L:{r.calculated_fields_by_complexity.low}
                                                                    </Badge>
                                                                )}
                                                                {r.calculated_fields_by_complexity.medium > 0 && (
                                                                    <Badge variant="default" className="font-normal px-1.5 py-0">
                                                                        M:{r.calculated_fields_by_complexity.medium}
                                                                    </Badge>
                                                                )}
                                                                {r.calculated_fields_by_complexity.high > 0 && (
                                                                    <Badge variant="destructive" className="font-normal px-1.5 py-0">
                                                                        H:{r.calculated_fields_by_complexity.high}
                                                                    </Badge>
                                                                )}
                                                                {r.calculated_fields_by_complexity.critical > 0 && (
                                                                    <Badge variant="destructive" className="font-normal px-1.5 py-0">
                                                                        C:{r.calculated_fields_by_complexity.critical}
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right">{r.total_filters ?? 0}</TableCell>
                                                <TableCell className="text-right">{r.total_parameters ?? 0}</TableCell>
                                                <TableCell className="text-right">{r.total_sorts ?? 0}</TableCell>
                                                <TableCell className="text-right">{r.total_prompts ?? 0}</TableCell>
                                                <TableCell className="text-right">{r.total_data_modules ?? 0}</TableCell>
                                                <TableCell className="text-right">{r.total_tables ?? 0}</TableCell>
                                                <TableCell className="text-right">{r.total_columns ?? 0}</TableCell>
                                                <TableCell className="text-right">{r.total_packages ?? 0}</TableCell>
                                                <TableCell className="text-right">{r.total_data_sources ?? 0}</TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CollapsibleContent>
                </Collapsible>
            </CardContent>
        </Card>
    );
}
