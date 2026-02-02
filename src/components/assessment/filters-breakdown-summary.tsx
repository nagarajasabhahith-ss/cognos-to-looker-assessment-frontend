"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { FiltersBreakdown } from "@/lib/api";
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
    if (c === "medium") return "default";
    if (c === "low") return "secondary";
    return "outline";
}

interface FiltersBreakdownSummaryProps {
    data: FiltersBreakdown | null;
    isLoading?: boolean;
}

export function FiltersBreakdownSummary({ data, isLoading }: FiltersBreakdownSummaryProps) {
    const [open, setOpen] = useState(false);

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Filters</CardTitle>
                    <CardDescription>Loading…</CardDescription>
                </CardHeader>
            </Card>
        );
    }

    if (!data) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Filters</CardTitle>
                    <CardDescription>No filter data available.</CardDescription>
                </CardHeader>
            </Card>
        );
    }

    const { total_filters, stats, filters } = data;
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
                <CardTitle>Filters</CardTitle>
                <CardDescription>
                    Total filters: {total_filters}. Per-filter: type (detail/summary), scope (query/report/data module), style (expression/definition), simple vs complex, dashboards/reports containing, associated report/query.
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
                        Per-filter breakdown ({filters.length} {filters.length === 1 ? "filter" : "filters"})
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                        <div className="pt-2 overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Complexity</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Scope</TableHead>
                                        <TableHead>Style</TableHead>
                                        <TableHead>Kind</TableHead>
                                        <TableHead className="max-w-[120px] truncate">Associated</TableHead>
                                        <TableHead className="text-right">Dashboards</TableHead>
                                        <TableHead className="text-right">Reports</TableHead>
                                        <TableHead className="max-w-[200px]">Expression</TableHead>
                                        <TableHead>Refs / Params</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filters.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={11} className="text-muted-foreground text-center">
                                                No filters
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filters.map((f) => (
                                            <TableRow key={f.filter_id}>
                                                <TableCell className="font-medium max-w-[120px] truncate" title={f.name}>
                                                    {f.name}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={complexityBadgeVariant(f.complexity)}>
                                                        {f.complexity ?? "Low"}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-muted-foreground text-sm">
                                                    {f.filter_type ? (
                                                        <Badge variant="outline" className="font-normal">
                                                            {f.filter_type === "detail" ? "Detail" : f.filter_type === "summary" ? "Summary" : f.filter_type}
                                                        </Badge>
                                                    ) : "—"}
                                                </TableCell>
                                                <TableCell className="text-muted-foreground text-sm">
                                                    {f.filter_scope ? (
                                                        <Badge variant="secondary" className="font-normal text-xs">
                                                            {f.filter_scope.replace(/_/g, " ")}
                                                        </Badge>
                                                    ) : "—"}
                                                </TableCell>
                                                <TableCell className="text-muted-foreground text-sm">
                                                    {f.filter_style ? (
                                                        <span className="text-xs">{f.filter_style === "expression" ? "Expression" : f.filter_style === "definition" ? "Definition" : f.filter_style}</span>
                                                    ) : "—"}
                                                </TableCell>
                                                <TableCell className="text-muted-foreground text-sm">
                                                    {f.is_complex ? (
                                                        <Badge variant="secondary">Complex</Badge>
                                                    ) : f.is_simple ? (
                                                        <Badge variant="outline">Simple</Badge>
                                                    ) : "—"}
                                                </TableCell>
                                                <TableCell className="text-muted-foreground text-sm max-w-[120px] truncate" title={f.parent_name ?? f.filter_definition_summary ?? ""}>
                                                    {f.parent_name ?? f.associated_container_type ?? "—"}
                                                </TableCell>
                                                <TableCell className="text-right tabular-nums">
                                                    {f.dashboards_containing_count ?? 0}
                                                </TableCell>
                                                <TableCell className="text-right tabular-nums">
                                                    {f.reports_containing_count ?? 0}
                                                </TableCell>
                                                <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate font-mono" title={f.expression ?? ""}>
                                                    {f.expression ?? "—"}
                                                </TableCell>
                                                <TableCell className="text-muted-foreground text-sm max-w-[140px] truncate" title={[
                                                    f.referenced_columns?.length ? `Columns: ${(f.referenced_columns as string[]).join(", ")}` : "",
                                                    f.parameter_references?.length ? `Params: ${(f.parameter_references as string[]).join(", ")}` : "",
                                                ].filter(Boolean).join(" | ")}>
                                                    {f.referenced_columns?.length ? `${(f.referenced_columns as string[]).length} cols` : ""}
                                                    {f.referenced_columns?.length && f.parameter_references?.length ? ", " : ""}
                                                    {f.parameter_references?.length ? `${(f.parameter_references as string[]).length} params` : ""}
                                                    {!f.referenced_columns?.length && !f.parameter_references?.length ? "—" : ""}
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
