"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { QueriesBreakdown } from "@/lib/api";
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
    if (x === "medium") return "default";
    if (x === "low") return "secondary";
    return "outline";
}

interface QueriesBreakdownSummaryProps {
    data: QueriesBreakdown | null;
    isLoading?: boolean;
}

export function QueriesBreakdownSummary({ data, isLoading }: QueriesBreakdownSummaryProps) {
    const [open, setOpen] = useState(false);

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Queries</CardTitle>
                    <CardDescription>Loading…</CardDescription>
                </CardHeader>
            </Card>
        );
    }

    if (!data) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Queries</CardTitle>
                    <CardDescription>No query data available.</CardDescription>
                </CardHeader>
            </Card>
        );
    }

    const { total_queries, stats, queries } = data;
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
                <CardTitle>Queries</CardTitle>
                <CardDescription>
                    Total queries: {total_queries}. Per-query: name, source type, report, simple vs complex, dashboards/reports containing.
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
                        Per-query breakdown ({queries.length} {queries.length === 1 ? "query" : "queries"})
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                        <div className="pt-2 overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Query</TableHead>
                                        <TableHead>Complexity</TableHead>
                                        <TableHead>Source type</TableHead>
                                        <TableHead>Report</TableHead>
                                        <TableHead>Kind</TableHead>
                                        <TableHead className="text-right">Dashboards</TableHead>
                                        <TableHead className="text-right">Reports</TableHead>
                                        <TableHead className="max-w-[200px]">SQL (preview)</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {queries.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={8} className="text-muted-foreground text-center">
                                                No queries
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        queries.map((q) => (
                                            <TableRow key={q.query_id}>
                                                <TableCell className="font-medium max-w-[180px] truncate" title={q.name}>
                                                    {q.name}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={complexityBadgeVariant(q.complexity)}>
                                                        {q.complexity ?? "Low"}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-muted-foreground text-sm">
                                                    {q.source_type ?? "—"}
                                                </TableCell>
                                                <TableCell className="text-muted-foreground text-sm max-w-[160px] truncate" title={q.report_name ?? ""}>
                                                    {q.report_name ?? q.report_id ?? "—"}
                                                </TableCell>
                                                <TableCell>
                                                    {q.is_complex ? (
                                                        <Badge variant="secondary">Complex</Badge>
                                                    ) : q.is_simple ? (
                                                        <Badge variant="outline">Simple</Badge>
                                                    ) : (
                                                        "—"
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right tabular-nums">
                                                    {q.dashboards_containing_count ?? 0}
                                                </TableCell>
                                                <TableCell className="text-right tabular-nums">
                                                    {q.reports_containing_count ?? 0}
                                                </TableCell>
                                                <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate font-mono" title={q.sql_content ?? ""}>
                                                    {q.sql_content ?? "—"}
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
