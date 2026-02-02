"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { DataSourceConnectionsBreakdown } from "@/lib/api";
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

interface DataSourceConnectionsSummaryProps {
    data: DataSourceConnectionsBreakdown | null;
    isLoading?: boolean;
}

export function DataSourceConnectionsSummary({ data, isLoading }: DataSourceConnectionsSummaryProps) {
    const [open, setOpen] = useState(false);

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Data Source Connections</CardTitle>
                    <CardDescription>Loading…</CardDescription>
                </CardHeader>
            </Card>
        );
    }

    if (!data) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Data Source Connections</CardTitle>
                    <CardDescription>No data source connection data available.</CardDescription>
                </CardHeader>
            </Card>
        );
    }

    const {
        total_data_sources,
        total_data_source_connections,
        total_unique_connections,
        total_data_modules,
        total_packages,
        stats,
        connections,
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
                <CardTitle>Data Source Connections</CardTitle>
                <CardDescription>
                    Data sources: {total_data_sources}, connections: {total_data_source_connections}, unique: {total_unique_connections}.
                    Data modules: {total_data_modules}, packages: {total_packages}. Per-connection: dashboards and reports using each.
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
                        Per-connection breakdown ({connections.length} {connections.length === 1 ? "connection" : "connections"})
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                        <div className="pt-2 overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Connection</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Complexity</TableHead>
                                        <TableHead className="text-right">Dashboards</TableHead>
                                        <TableHead className="text-right">Reports</TableHead>
                                        <TableHead>Identifier / Preview</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {connections.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-muted-foreground text-center">
                                                No connections
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        connections.map((c) => (
                                            <TableRow key={c.connection_id}>
                                                <TableCell className="font-medium max-w-[180px] truncate" title={c.connection_name}>
                                                    {c.connection_name}
                                                </TableCell>
                                                <TableCell className="text-muted-foreground text-sm">
                                                    {c.connection_type ?? c.object_type ?? "—"}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={complexityBadgeVariant(c.complexity ?? "Medium")}>
                                                        {(c.complexity ?? "Medium").charAt(0).toUpperCase() + (c.complexity ?? "Medium").slice(1).toLowerCase()}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">{c.dashboards_using_count ?? 0}</TableCell>
                                                <TableCell className="text-right">{c.reports_using_count ?? 0}</TableCell>
                                                <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate" title={c.connection_string_preview ?? c.identifier ?? ""}>
                                                    {c.identifier ?? (c.connection_string_preview ? "…" : "—")}
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
