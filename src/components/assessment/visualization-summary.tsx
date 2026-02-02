"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { VisualizationDetails } from "@/lib/api";
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

interface VisualizationSummaryProps {
    /** Visualization details from API – no local computation */
    data: VisualizationDetails | null;
    isLoading?: boolean;
}

function complexityBadgeVariant(
    complexity: string | null | undefined
): "default" | "secondary" | "destructive" | "outline" {
    const c = (complexity ?? "").toLowerCase();
    if (c === "critical" || c === "high") return "destructive";
    if (c === "medium") return "default";
    if (c === "low") return "secondary";
    return "outline";
}

export function VisualizationSummary({ data, isLoading }: VisualizationSummaryProps) {
    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Visualization Summary</CardTitle>
                    <CardDescription>Loading…</CardDescription>
                </CardHeader>
            </Card>
        );
    }

    if (!data) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Visualization Summary</CardTitle>
                    <CardDescription>No report data available.</CardDescription>
                </CardHeader>
            </Card>
        );
    }

    const { total_visualization, stats, breakdown } = data;
    const [open, setOpen] = useState(false);
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
                <CardTitle>Visualization Summary</CardTitle>
                <CardDescription>
                    Total visualizations: {total_visualization}. Breakdown by type: count, dashboards/reports/queries containing (from API).
                </CardDescription>
            </CardHeader>
            <CardContent>
                {/* Visualization stats cards by complexity */}
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
                        Breakdown by type ({breakdown.length} {breakdown.length === 1 ? "row" : "rows"})
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                        <div className="pt-2">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Visualization</TableHead>
                                        <TableHead>Complexity</TableHead>
                                        <TableHead className="text-right">Count</TableHead>
                                        <TableHead className="text-right">Dashboards</TableHead>
                                        <TableHead className="text-right">Reports</TableHead>
                                        <TableHead className="text-right">Queries</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {breakdown.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-muted-foreground text-center">
                                                No breakdown data
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        breakdown.map((item) => (
                                            <TableRow key={item.visualization}>
                                                <TableCell>{item.visualization}</TableCell>
                                                <TableCell>
                                                    <Badge variant={complexityBadgeVariant(item.complexity)}>
                                                        {item.complexity ?? "Low"}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">{item.count}</TableCell>
                                                <TableCell className="text-right">
                                                    {item.dashboards_containing_count ?? 0}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {item.reports_containing_count ?? 0}
                                                </TableCell>
                                                <TableCell className="text-right tabular-nums">
                                                    {item.queries_using_count ?? 0}
                                                </TableCell>
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
