"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { MeasuresBreakdown } from "@/lib/api";
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
    if (c === "critical") return "destructive";
    if (c === "medium") return "default";
    if (c === "low") return "secondary";
    return "outline";
}

interface MeasuresBreakdownSummaryProps {
    data: MeasuresBreakdown | null;
    isLoading?: boolean;
}

export function MeasuresBreakdownSummary({ data, isLoading }: MeasuresBreakdownSummaryProps) {
    const [open, setOpen] = useState(false);

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Measures</CardTitle>
                    <CardDescription>Loading…</CardDescription>
                </CardHeader>
            </Card>
        );
    }

    if (!data) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Measures</CardTitle>
                    <CardDescription>No measure data available.</CardDescription>
                </CardHeader>
            </Card>
        );
    }

    const { total_measures, measures } = data;
    const stats = measures.reduce(
        (acc, m) => {
            const c = (m.complexity ?? "").toLowerCase();
            if (c === "low") acc.low += 1;
            else if (c === "medium") acc.medium += 1;
            else if (c === "critical") acc.critical += 1;
            return acc;
        },
        { low: 0, medium: 0, critical: 0 }
    );
    const statItems = [
        { label: "Low", count: stats.low, variant: "secondary" as const },
        { label: "Medium", count: stats.medium, variant: "default" as const },
        { label: "Critical", count: stats.critical, variant: "destructive" as const },
    ];

    return (
        <Card>
            <CardHeader>
                <CardTitle>Measures</CardTitle>
                <CardDescription>
                    Total measures: {total_measures}. Per-measure: name, complexity (from expression), aggregation, parent data module, dashboards/reports containing.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {/* Measure stats by complexity (same rules as calculated fields) */}
                <div className="mb-4 grid grid-cols-3 gap-3">
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

                <Collapsible open={open} onOpenChange={setOpen}>
                    <CollapsibleTrigger className="flex items-center gap-2 rounded-md py-2 text-left text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
                        <ChevronRight className={`h-4 w-4 shrink-0 transition-transform duration-200 ${open ? "rotate-90" : ""}`} />
                        Per-measure breakdown ({measures.length} {measures.length === 1 ? "measure" : "measures"})
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                        <div className="pt-2 overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Measure</TableHead>
                                        <TableHead>Complexity</TableHead>
                                        <TableHead>Aggregation</TableHead>
                                        <TableHead>Parent module</TableHead>
                                        <TableHead className="text-right">Dashboards</TableHead>
                                        <TableHead className="text-right">Reports</TableHead>
                                        <TableHead>Kind</TableHead>
                                        <TableHead className="max-w-[180px]">Expression (preview)</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {measures.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={8} className="text-muted-foreground text-center">
                                                No measures
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        measures.map((m) => (
                                            <TableRow key={m.measure_id}>
                                                <TableCell className="font-medium max-w-[180px] truncate" title={m.name}>
                                                    {m.name}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={complexityBadgeVariant(m.complexity)}>
                                                        {m.complexity ?? "Low"}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-muted-foreground text-sm">
                                                    {m.aggregation ?? "—"}
                                                </TableCell>
                                                <TableCell className="text-muted-foreground text-sm max-w-[160px] truncate" title={m.parent_module_name ?? ""}>
                                                    {m.parent_module_name ?? m.parent_module_id ?? "—"}
                                                </TableCell>
                                                <TableCell className="text-right tabular-nums">
                                                    {m.dashboards_containing_count ?? 0}
                                                </TableCell>
                                                <TableCell className="text-right tabular-nums">
                                                    {m.reports_containing_count ?? 0}
                                                </TableCell>
                                                <TableCell>
                                                    {m.is_complex ? (
                                                        <Badge variant="secondary">Complex</Badge>
                                                    ) : m.is_simple ? (
                                                        <Badge variant="outline">Simple</Badge>
                                                    ) : (
                                                        "—"
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-muted-foreground text-sm max-w-[180px] truncate font-mono" title={m.expression ?? ""}>
                                                    {m.expression ?? "—"}
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
