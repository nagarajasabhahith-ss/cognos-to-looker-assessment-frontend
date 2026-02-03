"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { DataModulesBreakdown } from "@/lib/api";
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

interface DataModulesBreakdownSummaryProps {
    data: DataModulesBreakdown | null;
    isLoading?: boolean;
}

export function DataModulesBreakdownSummary({ data, isLoading }: DataModulesBreakdownSummaryProps) {
    const [open, setOpen] = useState(false);

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Data Modules</CardTitle>
                    <CardDescription>Loading…</CardDescription>
                </CardHeader>
            </Card>
        );
    }

    if (!data) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Data Modules</CardTitle>
                    <CardDescription>No data module data available.</CardDescription>
                </CardHeader>
            </Card>
        );
    }

    const {
        total_data_modules,
        total_main_data_modules = 0,
        total_unique_modules,
        overall_complexity,
        stats,
        data_modules = [],
        main_data_modules = [],
    } = data;

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
                    <CardTitle>Data Modules</CardTitle>
                    {overall_complexity != null && overall_complexity !== "" && (
                        <Badge variant={complexityBadgeVariant(overall_complexity)}>
                            Overall: {overall_complexity}
                        </Badge>
                    )}
                </div>
                <CardDescription>
                    Main data modules (module, dataModule, model): {total_main_data_modules}. Total (incl. smartsModule, modelView): {total_data_modules}, unique: {total_unique_modules}.
                    Per-module: dashboards and reports using each; tables, columns, calculated fields, filters. Complexity: Medium for all data modules.
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
                        Main data modules ({main_data_modules.length} {main_data_modules.length === 1 ? "module" : "modules"})
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                        <div className="pt-2 overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Module</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Complexity</TableHead>
                                        <TableHead className="text-right">Dashboards</TableHead>
                                        <TableHead className="text-right">Reports</TableHead>
                                        <TableHead className="text-right">Tables</TableHead>
                                        <TableHead className="text-right">Columns</TableHead>
                                        <TableHead className="text-right">Calcs</TableHead>
                                        <TableHead className="text-right">Filters</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {main_data_modules.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={9} className="text-muted-foreground text-center">
                                                No main data modules
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        main_data_modules.map((m) => (
                                            <TableRow key={m.data_module_id}>
                                                <TableCell className="font-medium max-w-[180px] truncate" title={m.name}>
                                                    {m.name}
                                                </TableCell>
                                                <TableCell className="text-muted-foreground text-sm max-w-[100px] truncate">
                                                    {m.cognosClass ?? "—"}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={complexityBadgeVariant(m.complexity ?? "Medium")}>
                                                        {(m.complexity ?? "Medium").charAt(0).toUpperCase() + (m.complexity ?? "Medium").slice(1).toLowerCase()}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">{m.dashboards_using_count ?? 0}</TableCell>
                                                <TableCell className="text-right">{m.reports_using_count ?? 0}</TableCell>
                                                <TableCell className="text-right">{m.table_count ?? "—"}</TableCell>
                                                <TableCell className="text-right">{m.column_count ?? "—"}</TableCell>
                                                <TableCell className="text-right">{m.calculated_field_count ?? "—"}</TableCell>
                                                <TableCell className="text-right">{m.filter_count ?? "—"}</TableCell>
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
