"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { PromptsBreakdown } from "@/lib/api";
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

interface PromptsBreakdownSummaryProps {
    data: PromptsBreakdown | null;
    isLoading?: boolean;
}

export function PromptsBreakdownSummary({ data, isLoading }: PromptsBreakdownSummaryProps) {
    const [open, setOpen] = useState(false);

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Prompts</CardTitle>
                    <CardDescription>Loading…</CardDescription>
                </CardHeader>
            </Card>
        );
    }

    if (!data) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Prompts</CardTitle>
                    <CardDescription>No prompt data available.</CardDescription>
                </CardHeader>
            </Card>
        );
    }

    const { total_prompts, stats, prompts } = data;
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
                <CardTitle>Prompts</CardTitle>
                <CardDescription>
                    Total prompts: {total_prompts}. Per-prompt: name, type, value, dashboards/reports containing.
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
                        Per-prompt breakdown ({prompts.length} {prompts.length === 1 ? "prompt" : "prompts"})
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                        <div className="pt-2 overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Complexity</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Value</TableHead>
                                        <TableHead className="text-right">Dashboards</TableHead>
                                        <TableHead className="text-right">Reports</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {prompts.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-muted-foreground text-center">
                                                No prompts
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        prompts.map((p) => (
                                            <TableRow key={p.prompt_id}>
                                                <TableCell className="font-medium max-w-[200px] truncate" title={p.name}>
                                                    {p.name}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={complexityBadgeVariant(p.complexity)}>
                                                        {p.complexity ?? "Low"}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-muted-foreground text-sm">
                                                    {p.prompt_type ?? "—"}
                                                </TableCell>
                                                <TableCell className="text-muted-foreground text-sm max-w-[280px] truncate font-mono" title={p.value ?? ""}>
                                                    {p.value ?? "—"}
                                                </TableCell>
                                                <TableCell className="text-right tabular-nums">
                                                    {p.dashboards_containing_count ?? 0}
                                                </TableCell>
                                                <TableCell className="text-right tabular-nums">
                                                    {p.reports_containing_count ?? 0}
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
