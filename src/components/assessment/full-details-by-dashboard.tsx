"use client";

import { useState } from "react";
import { ChevronRight, BarChart3, Calculator, Ruler, Filter, Database, Columns, LayoutList, Package, Box, Plug } from "lucide-react";
import type { DashboardFullDetailsItem } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";

function complexityBadgeVariant(complexity: string | null | undefined): "default" | "secondary" | "destructive" | "outline" {
    const c = (complexity ?? "").toLowerCase();
    if (c === "critical" || c === "high") return "destructive";
    if (c === "medium") return "default";
    if (c === "low") return "secondary";
    return "outline";
}

/** Human-readable label for a data module (prefer display_name; avoid raw model ids). */
function dataModuleLabel(m: { id: string; name: string; display_name?: string }): string {
    const label = (m.display_name ?? m.name) || m.id;
    if (/^model[\da-f_]+$/i.test(label)) return "Embedded module";
    return label;
}

function ItemList<T extends { id: string; name: string }>({
    items,
    title,
    icon: Icon,
    renderExtra,
}: {
    items: T[];
    title: string;
    icon: React.ElementType;
    renderExtra?: (item: T) => React.ReactNode;
}) {
    if (!items?.length) return null;
    return (
        <Collapsible defaultOpen={items.length <= 5} className="group">
            <CollapsibleTrigger className="flex w-full items-center gap-2 rounded-md py-2 text-left text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
                <ChevronRight className="h-4 w-4 shrink-0 transition-transform group-data-[state=open]:rotate-90" />
                <Icon className="h-4 w-4 shrink-0" />
                <span>{title}</span>
                <Badge variant="secondary" className="ml-auto">{items.length}</Badge>
            </CollapsibleTrigger>
            <CollapsibleContent>
                <ul className="mt-2 space-y-1.5 pl-6 text-sm">
                    {items.map((item) => (
                        <li key={item.id} className="rounded border bg-muted/30 px-3 py-2">
                            <span className="font-medium">{item.name}</span>
                            {renderExtra && renderExtra(item)}
                        </li>
                    ))}
                </ul>
            </CollapsibleContent>
        </Collapsible>
    );
}

interface FullDetailsByDashboardProps {
    data: DashboardFullDetailsItem[] | null | undefined;
    isLoading?: boolean;
}

export function FullDetailsByDashboard({ data, isLoading }: FullDetailsByDashboardProps) {
    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Full Details by Dashboard</CardTitle>
                    <CardDescription>Loading…</CardDescription>
                </CardHeader>
            </Card>
        );
    }

    if (!data?.length) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Full Details by Dashboard</CardTitle>
                    <CardDescription>No dashboard details available. Run the assessment to see full details per dashboard.</CardDescription>
                </CardHeader>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            <div className="rounded-lg border bg-muted/30 p-4">
                <h2 className="text-lg font-semibold">Full Details by Dashboard</h2>
                <p className="text-sm text-muted-foreground mt-1">
                    Per-dashboard: tabs, visualizations (with data items), measures, dimensions, filters, queries, columns, packages, data modules, data sources.
                </p>
            </div>
            <div className="grid gap-6">
                {data.map((dashboard) => (
                    <Card key={dashboard.dashboard_id} className="overflow-hidden">
                        <CardHeader className="border-b bg-muted/20">
                            <CardTitle className="text-base truncate" title={dashboard.dashboard_name}>
                                {dashboard.dashboard_name}
                            </CardTitle>
                            <CardDescription>
                                Dashboard ID: {dashboard.dashboard_id}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-4 space-y-2">
                            {dashboard.viz_types?.length > 0 && (
                                <div>
                                    <div className="flex items-center gap-2 mb-2 text-sm font-medium text-muted-foreground">
                                        <BarChart3 className="h-4 w-4" />
                                        Visualization types
                                    </div>
                                    <div className="flex flex-wrap gap-1.5 pl-6">
                                        {dashboard.viz_types.map((vt) => (
                                            <Badge key={vt} variant="outline">{vt}</Badge>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <ItemList items={dashboard.tabs ?? []} title="Tabs" icon={LayoutList} />

                            {dashboard.visualizations?.length > 0 && (
                                <Collapsible defaultOpen={dashboard.visualizations.length <= 8} className="group">
                                    <CollapsibleTrigger className="flex w-full items-center gap-2 rounded-md py-2 text-left text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
                                        <ChevronRight className="h-4 w-4 shrink-0 transition-transform group-data-[state=open]:rotate-90" />
                                        <BarChart3 className="h-4 w-4 shrink-0" />
                                        <span>Visualizations (widgets)</span>
                                        <Badge variant="secondary" className="ml-auto">{dashboard.visualizations.length}</Badge>
                                    </CollapsibleTrigger>
                                    <CollapsibleContent>
                                        <ul className="mt-2 space-y-2 pl-6 text-sm">
                                            {dashboard.visualizations.map((viz) => (
                                                <li key={viz.id} className="rounded border bg-muted/30 px-3 py-2">
                                                    <div className="font-medium">{viz.name}</div>
                                                    <div className="mt-1 flex flex-wrap gap-1">
                                                        <Badge variant="outline" className="text-xs">{viz.viz_type}</Badge>
                                                    </div>
                                                    {(viz.data_items?.length ?? 0) > 0 && (
                                                        <div className="mt-2 text-xs text-muted-foreground">
                                                            <span className="font-medium">Data items:</span>
                                                            <ul className="mt-1 space-y-0.5 pl-2">
                                                                {(viz.data_items ?? []).slice(0, 20).map((di: Record<string, unknown>, idx: number) => (
                                                                    <li key={idx}>
                                                                        {"_truncated" in di
                                                                            ? `… +${Number((di as { _truncated: number })._truncated)} more`
                                                                            : [
                                                                                "itemId" in di && di.itemId != null && String(di.itemId),
                                                                                "itemLabel" in di && di.itemLabel != null && di.itemId !== di.itemLabel && ` (${String(di.itemLabel)})`,
                                                                                "modelRef" in di && di.modelRef != null && ` [${String(di.modelRef)}]`,
                                                                                "slot" in di && di.slot != null && "dataItemId" in di && ` ${String(di.slot)}: ${String(di.dataItemId)}`,
                                                                              ].filter(Boolean).join("") || JSON.stringify(di)}
                                                                    </li>
                                                                ))}
                                                                {(viz.data_items?.length ?? 0) > 20 && !(viz.data_items ?? []).some((d: Record<string, unknown>) => "_truncated" in d) && (
                                                                    <li className="text-muted-foreground">… +{(viz.data_items?.length ?? 0) - 20} more</li>
                                                                )}
                                                            </ul>
                                                        </div>
                                                    )}
                                                </li>
                                            ))}
                                        </ul>
                                    </CollapsibleContent>
                                </Collapsible>
                            )}

                            <ItemList
                                items={dashboard.calculated_fields ?? []}
                                title="Calculated fields"
                                icon={Calculator}
                                renderExtra={(item) => (
                                    <div className="mt-1 text-muted-foreground space-y-0.5">
                                        {item.calculation_type && (
                                            <div className="text-xs">Type: {item.calculation_type}</div>
                                        )}
                                        {item.expression && (
                                            <div className="text-xs font-mono truncate max-w-full" title={item.expression}>
                                                {item.expression}
                                            </div>
                                        )}
                                        {item.complexity && (
                                            <Badge variant={complexityBadgeVariant(item.complexity)} className="text-xs">
                                                {item.complexity}
                                            </Badge>
                                        )}
                                    </div>
                                )}
                            />

                            <ItemList
                                items={dashboard.measures ?? []}
                                title="Measures"
                                icon={Ruler}
                                renderExtra={(item) => (
                                    <div className="mt-1 text-muted-foreground space-y-0.5 text-xs">
                                        {item.aggregation && <div>Aggregation: {item.aggregation}</div>}
                                        {item.parent_module_name && <div>Module: {item.parent_module_name}</div>}
                                        {item.complexity && (
                                            <Badge variant={complexityBadgeVariant(item.complexity)} className="text-xs">
                                                {item.complexity}
                                            </Badge>
                                        )}
                                    </div>
                                )}
                            />

                            <ItemList
                                items={dashboard.dimensions ?? []}
                                title="Dimensions"
                                icon={Ruler}
                                renderExtra={(item) => (
                                    <div className="mt-1 text-muted-foreground space-y-0.5 text-xs">
                                        {item.usage && <div>Usage: {item.usage}</div>}
                                        {item.parent_module_name && <div>Module: {item.parent_module_name}</div>}
                                        {item.complexity && (
                                            <Badge variant={complexityBadgeVariant(item.complexity)} className="text-xs">
                                                {item.complexity}
                                            </Badge>
                                        )}
                                    </div>
                                )}
                            />

                            <ItemList
                                items={dashboard.filters ?? []}
                                title="Filters"
                                icon={Filter}
                                renderExtra={(item) => (
                                    <div className="mt-1 text-muted-foreground space-y-0.5 text-xs">
                                        {item.filter_type && <div>Type: {item.filter_type}</div>}
                                        {item.filter_scope && <div>Scope: {item.filter_scope}</div>}
                                        {item.expression && (
                                            <div className="font-mono truncate max-w-full" title={item.expression}>
                                                {item.expression}
                                            </div>
                                        )}
                                        {item.complexity && (
                                            <Badge variant={complexityBadgeVariant(item.complexity)} className="text-xs">
                                                {item.complexity}
                                            </Badge>
                                        )}
                                    </div>
                                )}
                            />

                            <ItemList
                                items={dashboard.queries ?? []}
                                title="Queries"
                                icon={Database}
                            />

                            <ItemList
                                items={dashboard.columns ?? []}
                                title="Columns"
                                icon={Columns}
                            />

                            <ItemList items={dashboard.packages ?? []} title="Packages" icon={Package} />
                            {dashboard.data_modules?.length > 0 && (() => {
                                const primary = dashboard.data_modules!.length === 1
                                    ? dashboard.data_modules![0]
                                    : dashboard.data_modules!.find(
                                        (m) => dataModuleLabel(m) !== "Embedded module" && !/-SemanticInfo$/i.test(m.name)
                                    ) ?? dashboard.data_modules![0];
                                return (
                                    <div className="rounded border bg-muted/30 px-3 py-2 text-sm">
                                        <span className="font-medium text-muted-foreground">
                                            {dashboard.data_modules!.length === 1 ? "Data module: " : "Data module (referenced): "}
                                        </span>
                                        <span className="font-medium">{dataModuleLabel(primary)}</span>
                                        {primary.id && dataModuleLabel(primary) !== primary.id && (
                                            <span className="ml-2 text-xs text-muted-foreground">({primary.id})</span>
                                        )}
                                    </div>
                                );
                            })()}
                            {(dashboard.data_modules?.length ?? 0) > 0 && (
                                <Collapsible defaultOpen={dashboard.data_modules!.length <= 3} className="group">
                                    <CollapsibleTrigger className="flex w-full items-center gap-2 rounded-md py-2 text-left text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
                                        <ChevronRight className="h-4 w-4 shrink-0 transition-transform group-data-[state=open]:rotate-90" />
                                        <Box className="h-4 w-4 shrink-0" />
                                        <span>Data modules</span>
                                        <Badge variant="secondary" className="ml-auto">{dashboard.data_modules!.length}</Badge>
                                    </CollapsibleTrigger>
                                    <CollapsibleContent>
                                        <ul className="mt-2 space-y-4 pl-6 text-sm">
                                            {dashboard.data_modules!.map((mod) => {
                                                const modMeasures = (dashboard.measures ?? []).filter(
                                                    (item) => (item as { parent_module_id?: string }).parent_module_id === mod.id
                                                );
                                                const modDimensions = (dashboard.dimensions ?? []).filter(
                                                    (item) => (item as { parent_module_id?: string }).parent_module_id === mod.id
                                                );
                                                const label = dataModuleLabel(mod);
                                                return (
                                                    <li key={mod.id} className="rounded border bg-muted/30 px-3 py-3">
                                                        <div className="font-medium">{label}</div>
                                                        {(modMeasures.length > 0 || modDimensions.length > 0) && (
                                                            <div className="mt-2 space-y-2 pl-2 border-l-2 border-muted">
                                                                {modMeasures.length > 0 && (
                                                                    <div>
                                                                        <div className="text-xs font-medium text-muted-foreground mt-1">Measures ({modMeasures.length})</div>
                                                                        <ul className="mt-1 space-y-1">
                                                                            {modMeasures.slice(0, 15).map((item: { id: string; name: string; aggregation?: string }) => (
                                                                                <li key={item.id} className="text-xs rounded px-2 py-1 bg-background">
                                                                                    {item.name}
                                                                                    {item.aggregation && <span className="text-muted-foreground ml-1">({item.aggregation})</span>}
                                                                                </li>
                                                                            ))}
                                                                            {modMeasures.length > 15 && <li className="text-xs text-muted-foreground">+{modMeasures.length - 15} more</li>}
                                                                        </ul>
                                                                    </div>
                                                                )}
                                                                {modDimensions.length > 0 && (
                                                                    <div>
                                                                        <div className="text-xs font-medium text-muted-foreground mt-1">Dimensions ({modDimensions.length})</div>
                                                                        <ul className="mt-1 space-y-1">
                                                                            {modDimensions.slice(0, 15).map((item: { id: string; name: string; usage?: string }) => (
                                                                                <li key={item.id} className="text-xs rounded px-2 py-1 bg-background">
                                                                                    {item.name}
                                                                                    {item.usage && <span className="text-muted-foreground ml-1">({item.usage})</span>}
                                                                                </li>
                                                                            ))}
                                                                            {modDimensions.length > 15 && <li className="text-xs text-muted-foreground">+{modDimensions.length - 15} more</li>}
                                                                        </ul>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    </CollapsibleContent>
                                </Collapsible>
                            )}
                            <ItemList items={dashboard.data_sources ?? []} title="Data sources" icon={Plug} />
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
