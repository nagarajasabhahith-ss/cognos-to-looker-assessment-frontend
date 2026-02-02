"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { CalculatedFieldsBreakdown } from "@/lib/api";
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

interface CalculatedFieldsBreakdownSummaryProps {
    data: CalculatedFieldsBreakdown | null;
    isLoading?: boolean;
}

export function CalculatedFieldsBreakdownSummary({ data, isLoading }: CalculatedFieldsBreakdownSummaryProps) {
    const [open, setOpen] = useState(false);

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Calculated Fields</CardTitle>
                    <CardDescription>Loading…</CardDescription>
                </CardHeader>
            </Card>
        );
    }

    if (!data) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Calculated Fields</CardTitle>
                    <CardDescription>No calculated field data available.</CardDescription>
                </CardHeader>
            </Card>
        );
    }

    const { total_calculated_fields, calculated_fields } = data;
    const stats = calculated_fields.reduce(
        (acc, f) => {
            const c = (f.complexity ?? "").toLowerCase();
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
                <CardTitle>Calculated Fields</CardTitle>
                <CardDescription>
                    Total calculated fields: {total_calculated_fields}. Per-field: name, type, complexity, dashboards/reports containing, expression.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {/* Calculated fields stats by complexity */}
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
                        Per-field breakdown ({calculated_fields.length} {calculated_fields.length === 1 ? "field" : "fields"})
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                        <div className="pt-2 overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Complexity</TableHead>
                                        <TableHead className="text-right">Dashboards</TableHead>
                                        <TableHead className="text-right">Reports</TableHead>
                                        <TableHead>Expression</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {calculated_fields.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-muted-foreground text-center">
                                                No calculated fields
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        calculated_fields.map((f) => (
                                            <TableRow key={f.calculated_field_id}>
                                                <TableCell className="font-medium max-w-[200px] truncate" title={f.name}>
                                                    {f.name}
                                                </TableCell>
                                                <TableCell className="text-muted-foreground text-sm max-w-[120px] truncate">
                                                    {f.calculation_type ?? f.cognosClass ?? "—"}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={complexityBadgeVariant(f.complexity)}>
                                                        {f.complexity ?? "Low"}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right tabular-nums">
                                                    {f.dashboards_containing_count ?? 0}
                                                </TableCell>
                                                <TableCell className="text-right tabular-nums">
                                                    {f.reports_containing_count ?? 0}
                                                </TableCell>
                                                <TableCell className="text-muted-foreground text-sm max-w-[320px] truncate font-mono" title={f.expression ?? ""}>
                                                    {f.expression ?? "—"}
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
