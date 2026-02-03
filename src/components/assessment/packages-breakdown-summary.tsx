"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { PackagesBreakdown } from "@/lib/api";
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

interface PackagesBreakdownSummaryProps {
    data: PackagesBreakdown | null;
    isLoading?: boolean;
}

export function PackagesBreakdownSummary({ data, isLoading }: PackagesBreakdownSummaryProps) {
    const [open, setOpen] = useState(false);

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Packages Breakdown</CardTitle>
                    <CardDescription>Loading…</CardDescription>
                </CardHeader>
            </Card>
        );
    }

    if (!data) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Packages Breakdown</CardTitle>
                    <CardDescription>No package data available.</CardDescription>
                </CardHeader>
            </Card>
        );
    }

    const { total_packages, overall_complexity, stats, packages } = data;

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
                    <CardTitle>Packages Breakdown</CardTitle>
                    {overall_complexity != null && overall_complexity !== "" && (
                        <Badge variant={complexityBadgeVariant(overall_complexity)}>
                            Overall: {overall_complexity}
                        </Badge>
                    )}
                </div>
                <CardDescription>
                    Total packages: {total_packages}. Per-package counts (data modules by type, tables, columns), dashboards/reports using each. Complexity: Medium when data modules &gt; 2, else Low.
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
                        Per-package breakdown ({packages.length} {packages.length === 1 ? "package" : "packages"})
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                        <div className="pt-2 overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Package</TableHead>
                                        <TableHead>Complexity</TableHead>
                                        <TableHead className="text-right">Data modules</TableHead>
                                        <TableHead className="text-right">Tables</TableHead>
                                        <TableHead className="text-right">Columns</TableHead>
                                        <TableHead className="text-right">Dashboards</TableHead>
                                        <TableHead className="text-right">Reports</TableHead>
                                        <TableHead>Module types</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {packages.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={8} className="text-muted-foreground text-center">
                                                No package data
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        packages.map((p) => (
                                            <TableRow key={p.package_id}>
                                                <TableCell className="font-medium max-w-[200px] truncate" title={p.package_name}>
                                                    {p.package_name}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={complexityBadgeVariant(p.complexity ?? "Low")}>
                                                        {(p.complexity ?? "Low").charAt(0).toUpperCase() + (p.complexity ?? "Low").slice(1).toLowerCase()}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">{p.total_data_modules ?? 0}</TableCell>
                                                <TableCell className="text-right">{p.total_tables ?? 0}</TableCell>
                                                <TableCell className="text-right">{p.total_columns ?? 0}</TableCell>
                                                <TableCell className="text-right tabular-nums">{p.dashboards_using_count ?? 0}</TableCell>
                                                <TableCell className="text-right tabular-nums">{p.reports_using_count ?? 0}</TableCell>
                                                <TableCell className="text-muted-foreground text-sm max-w-[240px] truncate" title={Object.entries(p.data_modules_by_type ?? {}).map(([k, v]) => `${k}: ${v}`).join(", ")}>
                                                    {Object.entries(p.data_modules_by_type ?? {}).length
                                                        ? Object.entries(p.data_modules_by_type)
                                                            .map(([k, v]) => `${k}: ${v}`)
                                                            .join(", ")
                                                        : "—"}
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
