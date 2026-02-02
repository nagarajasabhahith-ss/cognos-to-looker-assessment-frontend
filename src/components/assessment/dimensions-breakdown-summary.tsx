"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { DimensionsBreakdown } from "@/lib/api";
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

interface DimensionsBreakdownSummaryProps {
    data: DimensionsBreakdown | null;
    isLoading?: boolean;
}

export function DimensionsBreakdownSummary({ data, isLoading }: DimensionsBreakdownSummaryProps) {
    const [open, setOpen] = useState(false);

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Dimensions</CardTitle>
                    <CardDescription>Loading…</CardDescription>
                </CardHeader>
            </Card>
        );
    }

    if (!data) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Dimensions</CardTitle>
                    <CardDescription>No dimension data available.</CardDescription>
                </CardHeader>
            </Card>
        );
    }

    const { total_dimensions, dimensions } = data;
    const stats = dimensions.reduce(
        (acc, d) => {
            const c = (d.complexity ?? "").toLowerCase();
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
                <CardTitle>Dimensions</CardTitle>
                <CardDescription>
                    Total dimensions: {total_dimensions}. Per-dimension: name, complexity (from expression), usage, parent data module, dashboards/reports containing.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {/* Dimension stats by complexity (same rules as measures) */}
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
                        Per-dimension breakdown ({dimensions.length} {dimensions.length === 1 ? "dimension" : "dimensions"})
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                        <div className="pt-2 overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Dimension</TableHead>
                                        <TableHead>Complexity</TableHead>
                                        <TableHead>Usage</TableHead>
                                        <TableHead>Parent module</TableHead>
                                        <TableHead className="text-right">Dashboards</TableHead>
                                        <TableHead className="text-right">Reports</TableHead>
                                        <TableHead>Kind</TableHead>
                                        <TableHead className="max-w-[180px]">Expression (preview)</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {dimensions.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={8} className="text-muted-foreground text-center">
                                                No dimensions
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        dimensions.map((d) => (
                                            <TableRow key={d.dimension_id}>
                                                <TableCell className="font-medium max-w-[180px] truncate" title={d.name}>
                                                    {d.name}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={complexityBadgeVariant(d.complexity)}>
                                                        {d.complexity ?? "Low"}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-muted-foreground text-sm">
                                                    {d.usage ?? "—"}
                                                </TableCell>
                                                <TableCell className="text-muted-foreground text-sm max-w-[160px] truncate" title={d.parent_module_name ?? ""}>
                                                    {d.parent_module_name ?? d.parent_module_id ?? "—"}
                                                </TableCell>
                                                <TableCell className="text-right tabular-nums">
                                                    {d.dashboards_containing_count ?? 0}
                                                </TableCell>
                                                <TableCell className="text-right tabular-nums">
                                                    {d.reports_containing_count ?? 0}
                                                </TableCell>
                                                <TableCell>
                                                    {d.is_complex ? (
                                                        <Badge variant="secondary">Complex</Badge>
                                                    ) : d.is_simple ? (
                                                        <Badge variant="outline">Simple</Badge>
                                                    ) : (
                                                        "—"
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-muted-foreground text-sm max-w-[180px] truncate font-mono" title={d.expression ?? ""}>
                                                    {d.expression ?? "—"}
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
