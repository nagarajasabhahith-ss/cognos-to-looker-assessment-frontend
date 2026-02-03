"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { SortsBreakdown } from "@/lib/api";
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

function complexityBadgeVariant(c: string | null | undefined): "default" | "secondary" | "destructive" | "outline" {
    const x = (c ?? "").toLowerCase();
    if (x === "critical" || x === "high") return "destructive";
    if (x === "medium") return "default";
    if (x === "low") return "secondary";
    return "outline";
}

interface SortsBreakdownSummaryProps {
    data: SortsBreakdown | null;
    isLoading?: boolean;
}

export function SortsBreakdownSummary({ data, isLoading }: SortsBreakdownSummaryProps) {
    const [open, setOpen] = useState(false);

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Sorts</CardTitle>
                    <CardDescription>Loading…</CardDescription>
                </CardHeader>
            </Card>
        );
    }

    if (!data) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Sorts</CardTitle>
                    <CardDescription>No sort data available.</CardDescription>
                </CardHeader>
            </Card>
        );
    }

    const { total_sorts, overall_complexity, stats, sorts } = data;
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
                <div className="flex flex-wrap items-center gap-2">
                    <CardTitle>Sorts</CardTitle>
                    {overall_complexity != null && overall_complexity !== "" && (
                        <Badge variant={complexityBadgeVariant(overall_complexity)}>
                            Overall: {overall_complexity}
                        </Badge>
                    )}
                </div>
                <CardDescription>
                    Total sorts: {total_sorts}. Per-sort: name, direction, sorted column, dashboards/reports containing.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {statItems.length > 0 && (
                    <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                        {statItems.map(({ label, count, variant }) => (
                            <div key={label} className="flex flex-col gap-1 rounded-lg border bg-muted/50 px-3 py-2">
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
                        Per-sort breakdown ({sorts.length} {sorts.length === 1 ? "sort" : "sorts"})
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                        <div className="pt-2 overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Complexity</TableHead>
                                        <TableHead>Direction</TableHead>
                                        <TableHead>Sorted column</TableHead>
                                        <TableHead>Sort items</TableHead>
                                        <TableHead className="text-right">Dashboards</TableHead>
                                        <TableHead className="text-right">Reports</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {sorts.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="text-muted-foreground text-center">
                                                No sorts
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        sorts.map((s) => (
                                            <TableRow key={s.sort_id}>
                                                <TableCell className="font-medium max-w-[160px] truncate" title={s.name}>
                                                    {s.name}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={complexityBadgeVariant(s.complexity)}>
                                                        {s.complexity ?? "Low"}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-muted-foreground text-sm">
                                                    {s.direction ?? "—"}
                                                </TableCell>
                                                <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate">
                                                    {s.sorted_column ?? "—"}
                                                </TableCell>
                                                <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate" title={Array.isArray(s.sort_items) ? s.sort_items.map((i: { column?: string; direction?: string }) => `${i.column ?? "?"}: ${i.direction ?? "?"}`).join(", ") : ""}>
                                                    {Array.isArray(s.sort_items) && s.sort_items.length
                                                        ? `${s.sort_items.length} item(s)`
                                                        : "—"}
                                                </TableCell>
                                                <TableCell className="text-right tabular-nums">
                                                    {s.dashboards_containing_count ?? 0}
                                                </TableCell>
                                                <TableCell className="text-right tabular-nums">
                                                    {s.reports_containing_count ?? 0}
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
