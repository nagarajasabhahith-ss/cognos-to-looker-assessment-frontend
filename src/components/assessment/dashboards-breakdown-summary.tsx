"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { DashboardsBreakdown } from "@/lib/api";
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

interface DashboardsBreakdownSummaryProps {
    data: DashboardsBreakdown | null;
    isLoading?: boolean;
}

export function complexityBadgeVariant(
    complexity: string | null | undefined
): "default" | "secondary" | "destructive" | "outline" {
    const c = (complexity ?? "").toLowerCase();
    if (c === "critical" || c === "high") return "destructive";
    if (c === "medium") return "default";
    if (c === "low") return "secondary";
    return "outline";
}

export function DashboardsBreakdownSummary({ data, isLoading }: DashboardsBreakdownSummaryProps) {
    const [open, setOpen] = useState(false);

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Dashboards Breakdown</CardTitle>
                    <CardDescription>Loading…</CardDescription>
                </CardHeader>
            </Card>
        );
    }

    if (!data) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Dashboards Breakdown</CardTitle>
                    <CardDescription>No dashboard data available.</CardDescription>
                </CardHeader>
            </Card>
        );
    }

    const { total_dashboards, stats, dashboards } = data;
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
                <CardTitle>Dashboards Breakdown</CardTitle>
                <CardDescription>
                    Total dashboards: {total_dashboards}. Per-dashboard counts (visualizations, tabs, measures, dimensions, etc.).
                </CardDescription>
            </CardHeader>
            <CardContent>
                {/* Dashboard stats cards by complexity */}
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
                        Per-dashboard breakdown ({dashboards.length} {dashboards.length === 1 ? "dashboard" : "dashboards"})
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                        <div className="pt-2 overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Dashboard</TableHead>
                                        <TableHead>Complexity</TableHead>
                                        <TableHead className="text-right" title="Total viz; below: L=Low, M=Medium, H=High, C=Critical">
                                            Viz
                                        </TableHead>
                                        <TableHead className="text-right">Tabs</TableHead>
                                        <TableHead className="text-right">Measures</TableHead>
                                        <TableHead className="text-right">Dimensions</TableHead>
                                        <TableHead className="text-right">Calc fields</TableHead>
                                        <TableHead className="text-right">Data modules</TableHead>
                                        <TableHead className="text-right">Packages</TableHead>
                                        <TableHead className="text-right">Data sources</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {dashboards.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={10} className="text-muted-foreground text-center">
                                                No dashboard data
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        dashboards.map((d) => (
                                            <TableRow key={d.dashboard_id}>
                                                <TableCell className="font-medium max-w-[200px] truncate" title={d.dashboard_name}>
                                                    {d.dashboard_name}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={complexityBadgeVariant(d.complexity)}>
                                                        {d.complexity ?? "Low"}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex flex-col items-end gap-1">
                                                        <span className="tabular-nums font-medium">
                                                            {d.total_visualizations ?? 0}
                                                        </span>
                                                        {d.visualizations_by_complexity &&
                                                            (d.visualizations_by_complexity.low > 0 ||
                                                                d.visualizations_by_complexity.medium > 0 ||
                                                                d.visualizations_by_complexity.high > 0 ||
                                                                d.visualizations_by_complexity.critical > 0) && (
                                                            <div className="flex flex-wrap justify-end gap-1 text-xs">
                                                                {d.visualizations_by_complexity.low > 0 && (
                                                                    <Badge variant="secondary" className="font-normal px-1.5 py-0">
                                                                        L:{d.visualizations_by_complexity.low}
                                                                    </Badge>
                                                                )}
                                                                {d.visualizations_by_complexity.medium > 0 && (
                                                                    <Badge variant="default" className="font-normal px-1.5 py-0">
                                                                        M:{d.visualizations_by_complexity.medium}
                                                                    </Badge>
                                                                )}
                                                                {d.visualizations_by_complexity.high > 0 && (
                                                                    <Badge variant="destructive" className="font-normal px-1.5 py-0">
                                                                        H:{d.visualizations_by_complexity.high}
                                                                    </Badge>
                                                                )}
                                                                {d.visualizations_by_complexity.critical > 0 && (
                                                                    <Badge variant="destructive" className="font-normal px-1.5 py-0">
                                                                        C:{d.visualizations_by_complexity.critical}
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right">{d.total_tabs ?? 0}</TableCell>
                                                <TableCell className="text-right">{d.total_measures ?? 0}</TableCell>
                                                <TableCell className="text-right">{d.total_dimensions ?? 0}</TableCell>
                                                <TableCell className="text-right">{d.total_calculated_fields ?? 0}</TableCell>
                                                <TableCell className="text-right">{d.total_data_modules ?? 0}</TableCell>
                                                <TableCell className="text-right">{d.total_packages ?? 0}</TableCell>
                                                <TableCell className="text-right">{d.total_data_sources ?? 0}</TableCell>
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
