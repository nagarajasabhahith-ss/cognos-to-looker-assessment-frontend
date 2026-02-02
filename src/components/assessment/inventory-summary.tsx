"use client";

import { useCallback, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";
import { ExtractedObject, ObjectRelationship } from "@/lib/api";

interface InventorySummaryProps {
    objects: ExtractedObject[];
    relationships?: ObjectRelationship[];
}

// CSV mapping data for visualization types
const visualizationMapping: Record<string, { complexity: string; feasibility: string }> = {
    "area": { complexity: "Low", feasibility: "Yes" },
    "bar": { complexity: "Low", feasibility: "Yes" },
    "box plot": { complexity: "High", feasibility: "Yes" },
    "bubble": { complexity: "High", feasibility: "Partial" },
    "bullet": { complexity: "Critical", feasibility: "No" },
    "conditional formatting column": { complexity: "Critical", feasibility: "No" },
    "crosstab": { complexity: "High", feasibility: "Partial" },
    "data player": { complexity: "Critical", feasibility: "No" },
    "decision tree": { complexity: "Critical", feasibility: "No" },
    "driver analysis": { complexity: "Critical", feasibility: "No" },
    "drop-down list": { complexity: "Critical", feasibility: "No" },
    "heatmap": { complexity: "Critical", feasibility: "No" },
    "hierarchy bubble": { complexity: "Critical", feasibility: "No" },
    "kpi": { complexity: "Low", feasibility: "Partial" },
    "legacy map": { complexity: "Critical", feasibility: "No" },
    "line": { complexity: "Low", feasibility: "Yes" },
    "line and column": { complexity: "Low", feasibility: "Yes" },
    "list": { complexity: "Low", feasibility: "No" },
    "map": { complexity: "High", feasibility: "Yes" },
    "marimekko": { complexity: "Critical", feasibility: "No" },
    "network": { complexity: "Critical", feasibility: "No" },
    "packed bubble": { complexity: "Critical", feasibility: "No" },
    "pie": { complexity: "Low", feasibility: "Yes" },
    "point": { complexity: "High", feasibility: "Partial" },
    "radar": { complexity: "Critical", feasibility: "No" },
    "radial": { complexity: "Critical", feasibility: "No" },
    "scatter": { complexity: "Low", feasibility: "Yes" },
    "spiral": { complexity: "Critical", feasibility: "No" },
    "stacked bar": { complexity: "Low", feasibility: "Yes" },
    "stacked column": { complexity: "Low", feasibility: "Yes" },
    "summary": { complexity: "Medium", feasibility: "Partial" },
    "sunburst": { complexity: "Critical", feasibility: "No" },
    "table": { complexity: "Low", feasibility: "Yes" },
    "tornado": { complexity: "High", feasibility: "Partial" },
    "treemap": { complexity: "Critical", feasibility: "No" },
    "waterfall": { complexity: "Medium", feasibility: "Yes" },
    "word cloud": { complexity: "Medium", feasibility: "Yes" },
    "custom viz": { complexity: "High", feasibility: "Yes" },
    "stepped area": { complexity: "High", feasibility: "Yes" },
    "stepped line": { complexity: "High", feasibility: "Yes" },
    "stacked combination": { complexity: "Medium", feasibility: "Yes" },
    "smooth line": { complexity: "Medium", feasibility: "Yes" },
    "smooth area": { complexity: "Medium", feasibility: "Yes" },
    "gantt": { complexity: "Critical", feasibility: "No" },
    "floating bar": { complexity: "Critical", feasibility: "No" },
    "floating column": { complexity: "Critical", feasibility: "No" },
    "donut": { complexity: "Medium", feasibility: "Yes" },
    "clustered column": { complexity: "Low", feasibility: "Yes" },
    "clustered combination": { complexity: "Low", feasibility: "Yes" },
    "clustered bar": { complexity: "Low", feasibility: "Yes" },
    "list, crosstab": { complexity: "Low", feasibility: "Yes" },
    "repeater table": { complexity: "Critical", feasibility: "No" },
    "data table": { complexity: "Critical", feasibility: "No" },
    "repeater": { complexity: "Critical", feasibility: "No" },
    "singleton": { complexity: "Medium", feasibility: "Yes" },
};

// Normalize visualization type name for matching
const normalizeTypeName = (type: string): string => {
    return type.toLowerCase().trim();
};

// Get complexity and feasibility for a visualization type
const getVisualizationMetadata = (type: string): { complexity: string; feasibility: string } => {
    const normalized = normalizeTypeName(type);
    
    // Direct match
    if (visualizationMapping[normalized]) {
        return visualizationMapping[normalized];
    }
    
    // Try partial matches (e.g., "bar chart" -> "bar")
    for (const [key, value] of Object.entries(visualizationMapping)) {
        if (normalized.includes(key) || key.includes(normalized)) {
            return value;
        }
    }
    
    // Default for unknown types
    return { complexity: "Unknown", feasibility: "Unknown" };
};

const getComplexityBadgeVariant = (complexity: string) => {
    switch (complexity.toLowerCase()) {
        case "low":
            return "default";
        case "medium":
            return "secondary";
        case "high":
            return "outline";
        case "critical":
            return "destructive";
        default:
            return "outline";
    }
};

const getFeasibilityBadgeVariant = (feasibility: string) => {
    switch (feasibility.toLowerCase()) {
        case "yes":
            return "default";
        case "partial":
            return "secondary";
        case "no":
            return "destructive";
        default:
            return "outline";
    }
};

interface DashboardSummaryTableProps {
    objects: ExtractedObject[];
    relationships: ObjectRelationship[];
}

function DashboardSummaryTable({ objects, relationships }: DashboardSummaryTableProps) {
    const [isTableOpen, setIsTableOpen] = useState(false);

    // Build object map for quick lookup
    const objectsMap = useMemo(() => {
        const map = new Map<string, ExtractedObject>();
        objects.forEach(obj => map.set(obj.id, obj));
        return map;
    }, [objects]);

    // Build relationship maps
    const relationshipsBySource = useMemo(() => {
        const map = new Map<string, ObjectRelationship[]>();
        relationships.forEach(rel => {
            if (!map.has(rel.source_object_id)) {
                map.set(rel.source_object_id, []);
            }
            map.get(rel.source_object_id)!.push(rel);
        });
        return map;
    }, [relationships]);

    // Get dashboard summary data
    const dashboardData = useMemo(() => {
        const dashboards = objects.filter(obj => obj.object_type === "dashboard");
        
        return dashboards.map(dashboard => {
            const outgoingRels = relationshipsBySource.get(dashboard.id) || [];
            
            // Count tabs (direct contains relationships to tabs)
            const tabs = outgoingRels.filter(rel => {
                if (rel.relationship_type === "contains") {
                    const targetObj = objectsMap.get(rel.target_object_id);
                    return targetObj?.object_type === "tab";
                }
                return false;
            });
            const tabCount = tabs.length;
            
            // Get tab IDs
            const tabIds = tabs.map(rel => rel.target_object_id);
            
            // Count visualizations (direct or through tabs)
            const directVisualizations = outgoingRels.filter(rel => {
                if (rel.relationship_type === "contains") {
                    const targetObj = objectsMap.get(rel.target_object_id);
                    return targetObj?.object_type === "visualization";
                }
                return false;
            });
            
            // Count visualizations in tabs
            let tabVisualizations = 0;
            tabIds.forEach(tabId => {
                const tabRels = relationshipsBySource.get(tabId) || [];
                tabVisualizations += tabRels.filter(rel => {
                    if (rel.relationship_type === "contains") {
                        const targetObj = objectsMap.get(rel.target_object_id);
                        return targetObj?.object_type === "visualization";
                    }
                    return false;
                }).length;
            });
            
            const visualizationCount = directVisualizations.length + tabVisualizations;

            // Collect all contained object IDs (direct + through tabs) for type counts
            const containedIds = new Set<string>();
            outgoingRels.filter(rel => rel.relationship_type === "contains").forEach(rel => containedIds.add(rel.target_object_id));
            tabIds.forEach(tabId => {
                (relationshipsBySource.get(tabId) || []).filter(rel => rel.relationship_type === "contains").forEach(rel => containedIds.add(rel.target_object_id));
            });
            const countTypes = ["measure", "dimension", "filter", "calculated_field", "parameter", "prompt", "hierarchy", "sort", "page", "output"] as const;
            const typeCounts: Record<string, number> = {};
            countTypes.forEach(t => { typeCounts[t] = 0; });
            containedIds.forEach(id => {
                const obj = objectsMap.get(id);
                if (obj?.object_type && typeCounts[obj.object_type] !== undefined) {
                    typeCounts[obj.object_type]++;
                }
            });
            
            // Count data modules (via uses or connects_to relationships)
            const dataModules = outgoingRels.filter(rel => {
                if (rel.relationship_type === "uses" || rel.relationship_type === "connects_to") {
                    const targetObj = objectsMap.get(rel.target_object_id);
                    return targetObj?.object_type === "data_module";
                }
                return false;
            });
            const dataModuleCount = dataModules.length;

            {/* Count data sources (connects_to relationships) */}
            const dataSources = outgoingRels.filter(rel => {
                if (rel.relationship_type === "connects_to") {
                    const targetObj = objectsMap.get(rel.target_object_id);
                    return targetObj?.object_type === "data_source";
                }
                return false;
            });
            const dataSourceCount = dataSources.length;

            {/* Count packages (connects_to relationships) */}
            const packages = outgoingRels.filter(rel => {
                if (rel.relationship_type === "connects_to") {
                    const targetObj = objectsMap.get(rel.target_object_id);
                    return targetObj?.object_type === "package";
                }
                return false;
            });
            const packageCount = packages.length;

            {/* Count reports (uses relationships) */}
            const reports = outgoingRels.filter(rel => {
                if (rel.relationship_type === "uses") {
                    const targetObj = objectsMap.get(rel.target_object_id);
                    return targetObj?.object_type === "report";
                }
                return false;
            });
            const reportCount = reports.length;

            {/* complexity low/medium/high/critical */}

            // Complexity is assigned as follows:
            // - "low" if tab count <= 1 and visualization count <= 1
            // - "medium" if tab count is between 2 and 4 (inclusive) or visualization count is between 2 and 4 (inclusive)
            // - "high" if tab count is between 5 and 9 (inclusive) or visualization count is between 5 and 9 (inclusive)
            // - "critical" if tab count >= 10 or visualization count >= 10
            let complexity = "low";
            if ((tabCount >= 2 && tabCount <= 4) || (visualizationCount >= 2 && visualizationCount <= 4)) {
                complexity = "medium";
            } else if ((tabCount >= 5 && tabCount <= 9) ||( visualizationCount >= 5 && visualizationCount <= 9)) {
                complexity = "high";
            } else if (tabCount >= 10 || visualizationCount >= 10) {
                complexity = "critical";
            }
            
            return {
                name: dashboard.name,
                tabCount,
                visualizationCount,
                measure: typeCounts.measure ?? 0,
                dimension: typeCounts.dimension ?? 0,
                filter: typeCounts.filter ?? 0,
                calculated_field: typeCounts.calculated_field ?? 0,
                parameter: typeCounts.parameter ?? 0,
                prompt: typeCounts.prompt ?? 0,
                hierarchy: typeCounts.hierarchy ?? 0,
                sort: typeCounts.sort ?? 0,
                page: typeCounts.page ?? 0,
                output: typeCounts.output ?? 0,
                dataModuleCount,
                dataSourceCount,
                packageCount,
                reportCount,
                complexity: complexity
            };
        }).sort((a, b) => a.name.localeCompare(b.name));
    }, [objects, relationships, objectsMap, relationshipsBySource]);

    if (dashboardData.length === 0) {
        return (
            <div className="text-center py-8 text-muted-foreground">
                No dashboards found
            </div>
        );
    }

    // Calculate complexity stats
    const complexityStats = useMemo(() => {
        const stats = {
            low: 0,
            medium: 0,
            high: 0,
            critical: 0
        };
        dashboardData.forEach(dashboard => {
            const complexity = dashboard.complexity.toLowerCase();
            if (complexity === "low") stats.low++;
            else if (complexity === "medium") stats.medium++;
            else if (complexity === "high") stats.high++;
            else if (complexity === "critical") stats.critical++;
        });
        return stats;
    }, [dashboardData]);

    return (
        <div className="space-y-6">
            {/* Dashboard Complexity Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-lg border bg-card">
                    <div className="text-2xl font-bold">{complexityStats.low}</div>
                    <div className="text-sm text-muted-foreground">Low Complexity</div>
                </div>
                <div className="p-4 rounded-lg border bg-card">
                    <div className="text-2xl font-bold">{complexityStats.medium}</div>
                    <div className="text-sm text-muted-foreground">Medium Complexity</div>
                </div>
                <div className="p-4 rounded-lg border bg-card">
                    <div className="text-2xl font-bold">{complexityStats.high}</div>
                    <div className="text-sm text-muted-foreground">High Complexity</div>
                </div>
                <div className="p-4 rounded-lg border bg-card">
                    <div className="text-2xl font-bold">{complexityStats.critical}</div>
                    <div className="text-sm text-muted-foreground">Critical Complexity</div>
                </div>
            </div>

            <div className="space-y-2">
                <Button
                    variant="ghost"
                    onClick={() => setIsTableOpen(!isTableOpen)}
                    className="w-full justify-between"
                >
                    <span className="font-medium">Dashboard Details</span>
                    {isTableOpen ? (
                        <ChevronUp className="h-4 w-4" />
                    ) : (
                        <ChevronDown className="h-4 w-4" />
                    )}
                </Button>
                
                {isTableOpen && (
                    <div className="rounded-md border overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Dashboard Name</TableHead>
                                    <TableHead className="text-right">Tabs</TableHead>
                                    <TableHead className="text-right">Viz</TableHead>
                                    <TableHead className="text-right">Measure</TableHead>
                                    <TableHead className="text-right">Dimension</TableHead>
                                    <TableHead className="text-right">Filter</TableHead>
                                    <TableHead className="text-right">Calc Field</TableHead>
                                    <TableHead className="text-right">Parameter</TableHead>
                                    <TableHead className="text-right">Prompt</TableHead>
                                    <TableHead className="text-right">Hierarchy</TableHead>
                                    <TableHead className="text-right">Sort</TableHead>
                                    <TableHead className="text-right">Page</TableHead>
                                    <TableHead className="text-right">Output</TableHead>
                                    <TableHead className="text-right">Complexity</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {dashboardData.map((dashboard, index) => (
                                    <TableRow key={index}>
                                        <TableCell className="font-medium">{dashboard.name}</TableCell>
                                        <TableCell className="text-right">{dashboard.tabCount}</TableCell>
                                        <TableCell className="text-right">{dashboard.visualizationCount}</TableCell>
                                        <TableCell className="text-right">{dashboard.measure}</TableCell>
                                        <TableCell className="text-right">{dashboard.dimension}</TableCell>
                                        <TableCell className="text-right">{dashboard.filter}</TableCell>
                                        <TableCell className="text-right">{dashboard.calculated_field}</TableCell>
                                        <TableCell className="text-right">{dashboard.parameter}</TableCell>
                                        <TableCell className="text-right">{dashboard.prompt}</TableCell>
                                        <TableCell className="text-right">{dashboard.hierarchy}</TableCell>
                                        <TableCell className="text-right">{dashboard.sort}</TableCell>
                                        <TableCell className="text-right">{dashboard.page}</TableCell>
                                        <TableCell className="text-right">{dashboard.output}</TableCell>
                                        <TableCell className="text-right">
                                            <Badge variant={getComplexityBadgeVariant(dashboard.complexity)}>
                                                {dashboard.complexity}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </div>
        </div>
        
    );
}

export function InventorySummary({ objects, relationships = [] }: InventorySummaryProps) {
    const [isVisualizationTableOpen, setIsVisualizationTableOpen] = useState(false);
    const [isCalculatedFieldTableOpen, setIsCalculatedFieldTableOpen] = useState(false);
    const [isFilterTableOpen, setIsFilterTableOpen] = useState(false);
    const [isPromptTableOpen, setIsPromptTableOpen] = useState(false);

    // Filter visualization objects
    const visualizations = useMemo(() => {
        return objects.filter(obj => obj.object_type === "visualization");
    }, [objects]);

    // Filter calculated field objects
    const calculatedFields = useMemo(() => {
        return objects.filter(obj => obj.object_type === "calculated_field");
    }, [objects]);

    // Filter filter objects
    const filters = useMemo(() => {
        return objects.filter(obj => obj.object_type === "filter");
    }, [objects]);

    // Filter prompt objects
    const prompts = useMemo(() => {
        return objects.filter(obj => obj.object_type === "prompt");
    }, [objects]);

    // Create maps for quick lookup
    const objectMap = useMemo(() => {
        const map = new Map<string, ExtractedObject>();
        objects.forEach(obj => map.set(obj.id, obj));
        return map;
    }, [objects]);

    // Build relationship maps: source -> targets, target -> sources
    const relationshipsBySource = useMemo(() => {
        const map = new Map<string, ObjectRelationship[]>();
        relationships.forEach(rel => {
            if (!map.has(rel.source_object_id)) {
                map.set(rel.source_object_id, []);
            }
            map.get(rel.source_object_id)!.push(rel);
        });
        return map;
    }, [relationships]);

    const relationshipsByTarget = useMemo(() => {
        const map = new Map<string, ObjectRelationship[]>();
        relationships.forEach(rel => {
            if (!map.has(rel.target_object_id)) {
                map.set(rel.target_object_id, []);
            }
            map.get(rel.target_object_id)!.push(rel);
        });
        return map;
    }, [relationships]);

    // Find dashboard for a visualization (direct or through tabs)
    const findDashboardForVisualization = (vizId: string): string | null => {
        // Check direct relationships (dashboard -> visualization)
        const incomingRels = relationshipsByTarget.get(vizId) || [];
        for (const rel of incomingRels) {
            if (rel.relationship_type === "contains") {
                const sourceObj = objectMap.get(rel.source_object_id);
                if (sourceObj?.object_type === "dashboard") {
                    return sourceObj.id;
                }
                // If it's a tab, find the dashboard that contains the tab
                if (sourceObj?.object_type === "tab") {
                    const tabIncomingRels = relationshipsByTarget.get(sourceObj.id) || [];
                    for (const tabRel of tabIncomingRels) {
                        if (tabRel.relationship_type === "contains") {
                            const dashboardObj = objectMap.get(tabRel.source_object_id);
                            if (dashboardObj?.object_type === "dashboard") {
                                return dashboardObj.id;
                            }
                        }
                    }
                }
            }
        }
        return null;
    };

    // Aggregate by visualization type with complexity, feasibility, and dashboard count
    const aggregatedByType = useMemo(() => {
        const grouped = new Map<string, {
            type: string;
            count: number;
            complexity: string;
            feasibility: string;
            dashboards: Set<string>;
        }>();

        visualizations.forEach(viz => {
            const vizType = (viz.properties?.visualization_type as string) || "Unknown";
            const normalizedType = vizType.trim() || "Unknown";
            const metadata = getVisualizationMetadata(normalizedType);
            
            if (!grouped.has(normalizedType)) {
                grouped.set(normalizedType, {
                    type: normalizedType,
                    count: 0,
                    complexity: metadata.complexity,
                    feasibility: metadata.feasibility,
                    dashboards: new Set<string>()
                });
            }
            
            const group = grouped.get(normalizedType)!;
            group.count++;
            
            // Find dashboard for this visualization
            const dashboardId = findDashboardForVisualization(viz.id);
            if (dashboardId) {
                group.dashboards.add(dashboardId);
            }
        });

        return Array.from(grouped.values()).map(group => ({
            type: group.type,
            count: group.count,
            complexity: group.complexity,
            feasibility: group.feasibility,
            dashboardsAffected: group.dashboards.size
        })).sort((a, b) => b.count - a.count);
    }, [visualizations, objectMap, relationshipsByTarget]);

    // Aggregate calculated fields by calculation type
    const aggregatedCalculatedFields = useMemo(() => {
        const grouped = new Map<string, {
            calculationType: string;
            count: number;
            complexity: string;
            fields: Array<{
                name: string;
                expression: string;
                calculationType: string;
                complexity: string;
            }>;
        }>();

        calculatedFields.forEach(field => {
            const calcType = (field.properties?.calculation_type as string) || 
                            (field.properties?.cognosClass as string) || 
                            "Unknown";
            const expression = (field.properties?.expression as string) || "";
            
            // Assign complexity based on calculation type
            let complexity: "low" | "medium" | "high" | "critical" = "low";
            switch (calcType) {
                case "expression":
                    complexity = "low";
                    break;
                case "case_expression":
                case "if_expression":
                    complexity = "medium";
                    break;
                case "aggregate_function":
                case "function":
                    complexity = "high";
                    break;
                default:
                    complexity = "low";
                    break;
            }
            
            if (!grouped.has(calcType)) {
                grouped.set(calcType, {
                    calculationType: calcType,
                    count: 0,
                    complexity: complexity.charAt(0).toUpperCase() + complexity.slice(1),
                    fields: []
                });
            }
            
            const group = grouped.get(calcType)!;
            group.count++;
            group.fields.push({
                name: field.name,
                expression: expression,
                calculationType: calcType,
                complexity: complexity.charAt(0).toUpperCase() + complexity.slice(1)
            });
        });

        return Array.from(grouped.values())
            .map(group => ({
                calculationType: group.calculationType,
                count: group.count,
                complexity: group.complexity,
                fields: group.fields
            }))
            .sort((a, b) => b.count - a.count);
    }, [calculatedFields]);

    // Aggregate filters by filter type
    const aggregatedFilters = useMemo(() => {
        const grouped = new Map<string, {
            filterType: string;
            count: number;
            complexity: string;
            filters: Array<{
                name: string;
                expression: string;
                filterType: string;
                complexity: string;
                referencedColumns: string[];
                parameterReferences: string[];
            }>;
        }>();

        filters.forEach(filter => {
            const filterType = (filter.properties?.filter_type as string) || "Unknown";
            const expression = (filter.properties?.expression as string) || "";
            const referencedColumns = (filter.properties?.referenced_columns as string[]) || [];
            const parameterReferences = (filter.properties?.parameter_references as string[]) || [];
            
            // Assign complexity based on filter type and expression complexity
            let complexity: "low" | "medium" | "high" | "critical" = "low";
            if (filterType === "detail") {
                complexity = "low";
            } else if (filterType === "summary") {
                complexity = "medium";
            } else {
                complexity = "high";
            }
            
            // Increase complexity if has parameter references or multiple columns
            if (parameterReferences.length > 0) {
                complexity = complexity === "low" ? "medium" : complexity === "medium" ? "high" : "critical";
            }
            if (referencedColumns.length > 3) {
                complexity = complexity === "low" ? "medium" : complexity === "medium" ? "high" : "critical";
            }
            
            if (!grouped.has(filterType)) {
                grouped.set(filterType, {
                    filterType: filterType,
                    count: 0,
                    complexity: complexity.charAt(0).toUpperCase() + complexity.slice(1),
                    filters: []
                });
            }
            
            const group = grouped.get(filterType)!;
            group.count++;
            group.filters.push({
                name: filter.name,
                expression: expression,
                filterType: filterType,
                complexity: complexity.charAt(0).toUpperCase() + complexity.slice(1),
                referencedColumns: referencedColumns,
                parameterReferences: parameterReferences
            });
        });

        return Array.from(grouped.values())
            .map(group => ({
                filterType: group.filterType,
                count: group.count,
                complexity: group.complexity,
                filters: group.filters
            }))
            .sort((a, b) => b.count - a.count);
    }, [filters]);

    // Aggregate prompts by prompt type
    const aggregatedPrompts = useMemo(() => {
        const grouped = new Map<string, {
            promptType: string;
            count: number;
            complexity: string;
            prompts: Array<{
                name: string;
                promptType: string;
                value: string | null;
                complexity: string;
            }>;
        }>();

        prompts.forEach(prompt => {
            const promptType = (prompt.properties?.prompt_type as string) || "Unknown";
            const value = (prompt.properties?.value as string) || null;
            
            // Assign complexity based on prompt type
            let complexity: "low" | "medium" | "high" | "critical" = "low";
            switch (promptType) {
                case "text":
                case "value":
                    complexity = "low";
                    break;
                case "page":
                    complexity = "medium";
                    break;
                default:
                    complexity = "high";
                    break;
            }
            
            if (!grouped.has(promptType)) {
                grouped.set(promptType, {
                    promptType: promptType,
                    count: 0,
                    complexity: complexity.charAt(0).toUpperCase() + complexity.slice(1),
                    prompts: []
                });
            }
            
            const group = grouped.get(promptType)!;
            group.count++;
            group.prompts.push({
                name: prompt.name,
                promptType: promptType,
                value: value,
                complexity: complexity.charAt(0).toUpperCase() + complexity.slice(1)
            });
        });

        return Array.from(grouped.values())
            .map(group => ({
                promptType: group.promptType,
                count: group.count,
                complexity: group.complexity,
                prompts: group.prompts
            }))
            .sort((a, b) => b.count - a.count);
    }, [prompts]);

    if (visualizations.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Inventory Summary</CardTitle>
                    <CardDescription>Visualization objects aggregated by type</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8 text-muted-foreground">
                        No visualization objects found
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Visualization Summary</CardTitle>
                    <CardDescription>
                        {visualizations.length} visualization{visualizations.length !== 1 ? "s" : ""} found
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {/* Visualization Complexity Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">

                        <div className="p-4 rounded-lg border bg-card">
                            <div className="text-2xl font-bold">
                                {aggregatedByType.filter(g => g.complexity === "Low").reduce((sum, g) => sum + g.count, 0)}
                            </div>
                            <div className="text-sm text-muted-foreground">Low Complexity</div>
                        </div>
                        <div className="p-4 rounded-lg border bg-card">
                            <div className="text-2xl font-bold">
                                {aggregatedByType.filter(g => g.complexity === "Medium").reduce((sum, g) => sum + g.count, 0)}
                            </div>
                            <div className="text-sm text-muted-foreground">Medium Complexity</div>
                        </div>
                        <div className="p-4 rounded-lg border bg-card">
                            <div className="text-2xl font-bold">
                                {aggregatedByType.filter(g => g.complexity === "High").reduce((sum, g) => sum + g.count, 0)}
                            </div>
                            <div className="text-sm text-muted-foreground">High</div>
                        </div>
                        <div className="p-4 rounded-lg border bg-card">
                            <div className="text-2xl font-bold">
                                {aggregatedByType.filter(g => g.complexity === "Critical").reduce((sum, g) => sum + g.count, 0)}
                            </div>
                            <div className="text-sm text-muted-foreground">Critical</div>
                        </div>
                </div>

                {/* Visualization Summary Table */}
                <div className="space-y-2">
                    <Button
                        variant="ghost"
                        onClick={() => setIsVisualizationTableOpen(!isVisualizationTableOpen)}
                        className="w-full justify-between"
                    >
                        <span className="font-medium">Visualization Details</span>
                        {isVisualizationTableOpen ? (
                            <ChevronUp className="h-4 w-4" />
                        ) : (
                            <ChevronDown className="h-4 w-4" />
                        )}
                    </Button>
                    
                    {isVisualizationTableOpen && (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Visualization Type</TableHead>
                                    <TableHead>Complexity</TableHead>
                                    {/* <TableHead>Feasibility</TableHead> */}
                                    <TableHead className="text-right">Dashboards Affected</TableHead>
                                    <TableHead className="text-right">Count</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {aggregatedByType.map((group) => (
                                    <TableRow key={group.type}>
                                        <TableCell className="font-medium">{group.type}</TableCell>
                                        <TableCell>
                                            <Badge variant={getComplexityBadgeVariant(group.complexity)}>
                                                {group.complexity}
                                            </Badge>
                                        </TableCell>
                                        {/* <TableCell>
                                            <Badge variant={getFeasibilityBadgeVariant(group.feasibility)}>
                                                {group.feasibility}
                                            </Badge> */}
                                        {/* </TableCell> */}
                                        <TableCell className="text-right">{group.dashboardsAffected}</TableCell>
                                        <TableCell className="text-right">{group.count}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </div>
                </CardContent>
            </Card>

            {/* Dashboards Summary */}
            {objects.length > 0 && relationships.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Dashboards Summary</CardTitle>
                        <CardDescription>
                            Overview of dashboards with their tabs, visualizations, and data modules
                        </CardDescription>
                    </CardHeader>
                    <CardContent>

                        <DashboardSummaryTable objects={objects} relationships={relationships} />
                    </CardContent>
                </Card>
            )}

            {/* Reports Summary */}
            {objects.length > 0 && relationships.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Reports Summary</CardTitle>
                        <CardDescription>
                            Overview of reports with their pages, visualizations, and queries
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ReportsSummaryTable objects={objects} relationships={relationships} />
                    </CardContent>
                </Card>
            )}

            {/* Calculated Fields Summary */}
            {calculatedFields.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Calculated Fields Summary</CardTitle>
                        <CardDescription>
                            {calculatedFields.length} calculated field{calculatedFields.length !== 1 ? "s" : ""} found
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {/* Calculated Fields Complexity Stats */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                            <div className="p-4 rounded-lg border bg-card">
                                <div className="text-2xl font-bold">
                                    {aggregatedCalculatedFields.filter(g => g.complexity === "Low").reduce((sum, g) => sum + g.count, 0)}
                                </div>
                                <div className="text-sm text-muted-foreground">Low Complexity</div>
                            </div>
                            <div className="p-4 rounded-lg border bg-card">
                                <div className="text-2xl font-bold">
                                    {aggregatedCalculatedFields.filter(g => g.complexity === "Medium").reduce((sum, g) => sum + g.count, 0)}
                                </div>
                                <div className="text-sm text-muted-foreground">Medium Complexity</div>
                            </div>
                            <div className="p-4 rounded-lg border bg-card">
                                <div className="text-2xl font-bold">
                                    {aggregatedCalculatedFields.filter(g => g.complexity === "High").reduce((sum, g) => sum + g.count, 0)}
                                </div>
                                <div className="text-sm text-muted-foreground">High Complexity</div>
                            </div>
                            <div className="p-4 rounded-lg border bg-card">
                                <div className="text-2xl font-bold">
                                    {aggregatedCalculatedFields.filter(g => g.complexity === "Critical").reduce((sum, g) => sum + g.count, 0)}
                                </div>
                                <div className="text-sm text-muted-foreground">Critical Complexity</div>
                            </div>
                        </div>

                        {/* Calculated Fields Summary by Type */}
                        <div className="space-y-2 mb-6">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Calculation Type</TableHead>
                                        <TableHead>Complexity</TableHead>
                                        <TableHead className="text-right">Count</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {aggregatedCalculatedFields.map((group) => (
                                        <TableRow key={group.calculationType}>
                                            <TableCell className="font-medium">{group.calculationType}</TableCell>
                                            <TableCell>
                                                <Badge variant={getComplexityBadgeVariant(group.complexity)}>
                                                    {group.complexity}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">{group.count}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Calculated Fields Summary Table */}
                        <div className="space-y-2">
                            <Button
                                variant="ghost"
                                onClick={() => setIsCalculatedFieldTableOpen(!isCalculatedFieldTableOpen)}
                                className="w-full justify-between"
                            >
                                <span className="font-medium">Calculated Field Details</span>
                                {isCalculatedFieldTableOpen ? (
                                    <ChevronUp className="h-4 w-4" />
                                ) : (
                                    <ChevronDown className="h-4 w-4" />
                                )}
                            </Button>
                            
                            {isCalculatedFieldTableOpen && (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Field Name</TableHead>
                                            <TableHead>Calculation Type</TableHead>
                                            <TableHead>Complexity</TableHead>
                                            <TableHead>Expression</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {calculatedFields.map((field) => {
                                            const expression = (field.properties?.expression as string) || "";
                                            const calcType = (field.properties?.calculation_type as string) || 
                                                           (field.properties?.cognosClass as string) || 
                                                           "Unknown";
                                            
                                            // Calculate complexity for this field
                                            let complexity: "low" | "medium" | "high" | "critical" = "low";
                                            switch (calcType) {
                                                case "expression":
                                                    complexity = "low";
                                                    break;
                                                case "case_expression":
                                                case "if_expression":
                                                    complexity = "medium";
                                                    break;
                                                case "aggregate_function":
                                                case "function":
                                                    complexity = "high";
                                                    break;
                                                default:
                                                    complexity = "critical";
                                                    break;
                                            }
                                            
                                            return (
                                                <TableRow key={field.id}>
                                                    <TableCell className="font-medium">{field.name}</TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline">{calcType}</Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant={getComplexityBadgeVariant(complexity)}>
                                                            {complexity.charAt(0).toUpperCase() + complexity.slice(1)}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <code className="text-xs bg-muted px-2 py-1 rounded break-all max-w-md block">
                                                            {expression || "N/A"}
                                                        </code>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Filters Summary */}
            {filters.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Filters Summary</CardTitle>
                        <CardDescription>
                            {filters.length} filter{filters.length !== 1 ? "s" : ""} found
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {/* Filters Complexity Stats */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                            <div className="p-4 rounded-lg border bg-card">
                                <div className="text-2xl font-bold">
                                    {aggregatedFilters.filter(g => g.complexity === "Low").reduce((sum, g) => sum + g.count, 0)}
                                </div>
                                <div className="text-sm text-muted-foreground">Low Complexity</div>
                            </div>
                            <div className="p-4 rounded-lg border bg-card">
                                <div className="text-2xl font-bold">
                                    {aggregatedFilters.filter(g => g.complexity === "Medium").reduce((sum, g) => sum + g.count, 0)}
                                </div>
                                <div className="text-sm text-muted-foreground">Medium Complexity</div>
                            </div>
                            <div className="p-4 rounded-lg border bg-card">
                                <div className="text-2xl font-bold">
                                    {aggregatedFilters.filter(g => g.complexity === "High").reduce((sum, g) => sum + g.count, 0)}
                                </div>
                                <div className="text-sm text-muted-foreground">High Complexity</div>
                            </div>
                            <div className="p-4 rounded-lg border bg-card">
                                <div className="text-2xl font-bold">
                                    {aggregatedFilters.filter(g => g.complexity === "Critical").reduce((sum, g) => sum + g.count, 0)}
                                </div>
                                <div className="text-sm text-muted-foreground">Critical Complexity</div>
                            </div>
                        </div>

                        {/* Filters Summary by Type */}
                        <div className="space-y-2 mb-6">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Filter Type</TableHead>
                                        <TableHead>Complexity</TableHead>
                                        <TableHead className="text-right">Count</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {aggregatedFilters.map((group) => (
                                        <TableRow key={group.filterType}>
                                            <TableCell className="font-medium">{group.filterType}</TableCell>
                                            <TableCell>
                                                <Badge variant={getComplexityBadgeVariant(group.complexity)}>
                                                    {group.complexity}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">{group.count}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Filters Summary Table */}
                        <div className="space-y-2">
                            <Button
                                variant="ghost"
                                onClick={() => setIsFilterTableOpen(!isFilterTableOpen)}
                                className="w-full justify-between"
                            >
                                <span className="font-medium">Filter Details</span>
                                {isFilterTableOpen ? (
                                    <ChevronUp className="h-4 w-4" />
                                ) : (
                                    <ChevronDown className="h-4 w-4" />
                                )}
                            </Button>
                            
                            {isFilterTableOpen && (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Filter Name</TableHead>
                                            <TableHead>Filter Type</TableHead>
                                            <TableHead>Complexity</TableHead>
                                            <TableHead>Expression</TableHead>
                                            <TableHead>Referenced Columns</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filters.map((filter) => {
                                            const expression = (filter.properties?.expression as string) || "";
                                            const filterType = (filter.properties?.filter_type as string) || "Unknown";
                                            const referencedColumns = (filter.properties?.referenced_columns as string[]) || [];
                                            const parameterReferences = (filter.properties?.parameter_references as string[]) || [];
                                            
                                            // Calculate complexity for this filter
                                            let complexity: "low" | "medium" | "high" | "critical" = "low";
                                            if (filterType === "detail") {
                                                complexity = "low";
                                            } else if (filterType === "summary") {
                                                complexity = "medium";
                                            } else {
                                                complexity = "high";
                                            }
                                            
                                            if (parameterReferences.length > 0) {
                                                complexity = complexity === "low" ? "medium" : complexity === "medium" ? "high" : "critical";
                                            }
                                            if (referencedColumns.length > 3) {
                                                complexity = complexity === "low" ? "medium" : complexity === "medium" ? "high" : "critical";
                                            }
                                            
                                            return (
                                                <TableRow key={filter.id}>
                                                    <TableCell className="font-medium">{filter.name}</TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline">{filterType}</Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant={getComplexityBadgeVariant(complexity)}>
                                                            {complexity.charAt(0).toUpperCase() + complexity.slice(1)}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <code className="text-xs bg-muted px-2 py-1 rounded break-all max-w-md block">
                                                            {expression || "N/A"}
                                                        </code>
                                                    </TableCell>
                                                    <TableCell>
                                                        {referencedColumns.length > 0 ? (
                                                            <div className="flex flex-wrap gap-1">
                                                                {referencedColumns.slice(0, 3).map((col, idx) => (
                                                                    <Badge key={idx} variant="secondary" className="text-xs">
                                                                        {col}
                                                                    </Badge>
                                                                ))}
                                                                {referencedColumns.length > 3 && (
                                                                    <Badge variant="secondary" className="text-xs">
                                                                        +{referencedColumns.length - 3} more
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <span className="text-muted-foreground text-sm">None</span>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Prompts Summary */}
            {prompts.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Prompts Summary</CardTitle>
                        <CardDescription>
                            {prompts.length} prompt{prompts.length !== 1 ? "s" : ""} found
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {/* Prompts Complexity Stats */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                            <div className="p-4 rounded-lg border bg-card">
                                <div className="text-2xl font-bold">
                                    {aggregatedPrompts.filter(g => g.complexity === "Low").reduce((sum, g) => sum + g.count, 0)}
                                </div>
                                <div className="text-sm text-muted-foreground">Low Complexity</div>
                            </div>
                            <div className="p-4 rounded-lg border bg-card">
                                <div className="text-2xl font-bold">
                                    {aggregatedPrompts.filter(g => g.complexity === "Medium").reduce((sum, g) => sum + g.count, 0)}
                                </div>
                                <div className="text-sm text-muted-foreground">Medium Complexity</div>
                            </div>
                            <div className="p-4 rounded-lg border bg-card">
                                <div className="text-2xl font-bold">
                                    {aggregatedPrompts.filter(g => g.complexity === "High").reduce((sum, g) => sum + g.count, 0)}
                                </div>
                                <div className="text-sm text-muted-foreground">High Complexity</div>
                            </div>
                            <div className="p-4 rounded-lg border bg-card">
                                <div className="text-2xl font-bold">
                                    {aggregatedPrompts.filter(g => g.complexity === "Critical").reduce((sum, g) => sum + g.count, 0)}
                                </div>
                                <div className="text-sm text-muted-foreground">Critical Complexity</div>
                            </div>
                        </div>

                        {/* Prompts Summary by Type */}
                        <div className="space-y-2 mb-6">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Prompt Type</TableHead>
                                        <TableHead>Complexity</TableHead>
                                        <TableHead className="text-right">Count</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {aggregatedPrompts.map((group) => (
                                        <TableRow key={group.promptType}>
                                            <TableCell className="font-medium">{group.promptType}</TableCell>
                                            <TableCell>
                                                <Badge variant={getComplexityBadgeVariant(group.complexity)}>
                                                    {group.complexity}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">{group.count}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Prompts Summary Table */}
                        <div className="space-y-2">
                            <Button
                                variant="ghost"
                                onClick={() => setIsPromptTableOpen(!isPromptTableOpen)}
                                className="w-full justify-between"
                            >
                                <span className="font-medium">Prompt Details</span>
                                {isPromptTableOpen ? (
                                    <ChevronUp className="h-4 w-4" />
                                ) : (
                                    <ChevronDown className="h-4 w-4" />
                                )}
                            </Button>
                            
                            {isPromptTableOpen && (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Prompt Name</TableHead>
                                            <TableHead>Prompt Type</TableHead>
                                            <TableHead>Complexity</TableHead>
                                            <TableHead>Value</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {prompts.map((prompt) => {
                                            const promptType = (prompt.properties?.prompt_type as string) || "Unknown";
                                            const value = (prompt.properties?.value as string) || null;
                                            
                                            // Calculate complexity for this prompt
                                            let complexity: "low" | "medium" | "high" | "critical" = "low";
                                            switch (promptType) {
                                                case "text":
                                                case "value":
                                                    complexity = "low";
                                                    break;
                                                case "page":
                                                    complexity = "medium";
                                                    break;
                                                default:
                                                    complexity = "high";
                                                    break;
                                            }
                                            
                                            return (
                                                <TableRow key={prompt.id}>
                                                    <TableCell className="font-medium">{prompt.name}</TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline">{promptType}</Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant={getComplexityBadgeVariant(complexity)}>
                                                            {complexity.charAt(0).toUpperCase() + complexity.slice(1)}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        {value ? (
                                                            <code className="text-xs bg-muted px-2 py-1 rounded break-all max-w-md block">
                                                                {value}
                                                            </code>
                                                        ) : (
                                                            <span className="text-muted-foreground text-sm">N/A</span>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}


        </div>
    );
}

interface ReportsSummaryTableProps {
    objects: ExtractedObject[];
    relationships: ObjectRelationship[];
}

function ReportsSummaryTable({ objects, relationships }: ReportsSummaryTableProps) {
    const [isTableOpen, setIsTableOpen] = useState(false);

    // Build object map for quick lookup
    const objectsMap = useMemo(() => {
        const map = new Map<string, ExtractedObject>();
        objects.forEach(obj => map.set(obj.id, obj));
        return map;
    }, [objects]);

    // Build relationship maps
    const relationshipsBySource = useMemo(() => {
        const map = new Map<string, ObjectRelationship[]>();
        relationships.forEach(rel => {
            if (!map.has(rel.source_object_id)) {
                map.set(rel.source_object_id, []);
            }
            map.get(rel.source_object_id)!.push(rel);
        });
        return map;
    }, [relationships]);

    // Transitive related IDs from report (uses, references, contains, connects_to)
    const getReportRelatedIds = useCallback((reportId: string) => {
        const relTypes = ["uses", "references", "contains", "connects_to"];
        const seen = new Set<string>([reportId]);
        const frontier: string[] = [reportId];
        while (frontier.length > 0) {
            const current = frontier.pop()!;
            const outRels = relationshipsBySource.get(current) || [];
            for (const rel of outRels) {
                if (!relTypes.includes(rel.relationship_type)) continue;
                const tid = rel.target_object_id;
                if (tid && !seen.has(tid)) {
                    seen.add(tid);
                    frontier.push(tid);
                }
            }
        }
        seen.delete(reportId);
        return seen;
    }, [relationshipsBySource]);

    // Get report summary data
    const reportData = useMemo(() => {
        const reports = objects.filter(obj => obj.object_type === "report");
        const countTypes = ["package", "data_module", "data_source", "data_source_connection", "table", "calculated_field", "column", "measure", "dimension", "filter", "parameter", "sort", "prompt", "hierarchy", "output"] as const;

        return reports.map(report => {
            const outgoingRels = relationshipsBySource.get(report.id) || [];

            // Count pages (direct contains relationships to pages)
            const pages = outgoingRels.filter(rel => {
                if (rel.relationship_type === "contains") {
                    const targetObj = objectsMap.get(rel.target_object_id);
                    return targetObj?.object_type === "page";
                }
                return false;
            });
            const pageCount = pages.length;

            // Get page IDs
            const pageIds = pages.map(rel => rel.target_object_id);

            // Count visualizations (direct or through pages)
            const directVisualizations = outgoingRels.filter(rel => {
                if (rel.relationship_type === "contains") {
                    const targetObj = objectsMap.get(rel.target_object_id);
                    return targetObj?.object_type === "visualization";
                }
                return false;
            });

            // Count visualizations in pages
            let pageVisualizations = 0;
            pageIds.forEach(pageId => {
                const pageRels = relationshipsBySource.get(pageId) || [];
                pageVisualizations += pageRels.filter(rel => {
                    if (rel.relationship_type === "contains") {
                        const targetObj = objectsMap.get(rel.target_object_id);
                        return targetObj?.object_type === "visualization";
                    }
                    return false;
                }).length;
            });

            const visualizationCount = directVisualizations.length + pageVisualizations;

            // Derive report type from contained visualizations (list, crosstab, chart, etc.)
            const vizTypeSet = new Set<string>();
            directVisualizations.forEach(rel => {
                const viz = objectsMap.get(rel.target_object_id);
                const t = (viz?.properties?.visualization_type as string) || (viz?.properties?.raw_type as string) || (viz?.properties?.cognosClass as string);
                if (t) vizTypeSet.add(t);
            });
            pageIds.forEach(pageId => {
                const pageRels = relationshipsBySource.get(pageId) || [];
                pageRels.forEach(rel => {
                    if (rel.relationship_type === "contains") {
                        const viz = objectsMap.get(rel.target_object_id);
                        if (viz?.object_type === "visualization") {
                            const t = (viz?.properties?.visualization_type as string) || (viz?.properties?.raw_type as string) || (viz?.properties?.cognosClass as string);
                            if (t) vizTypeSet.add(t);
                        }
                    }
                });
            });
            let reportType = "—";
            if (vizTypeSet.size === 1) reportType = Array.from(vizTypeSet)[0];
            else if (vizTypeSet.size > 1) reportType = "Mixed";
            else if ((report.properties?.reportType as string) || (report.properties?.report_type as string)) {
                reportType = (report.properties?.reportType as string) || (report.properties?.report_type as string);
            }

            // Count queries (via contains or uses relationships)
            const queries = outgoingRels.filter(rel => {
                if (rel.relationship_type === "contains" || rel.relationship_type === "uses") {
                    const targetObj = objectsMap.get(rel.target_object_id);
                    return targetObj?.object_type === "query";
                }
                return false;
            });
            const queryCount = queries.length;

            // Related object counts (transitive: packages, data modules, data sources, tables, calculated_fields, etc.)
            const relatedIds = getReportRelatedIds(report.id);
            const typeCounts: Record<string, number> = {};
            countTypes.forEach(t => { typeCounts[t] = 0; });
            relatedIds.forEach((rid: string) => {
                const obj = objectsMap.get(rid);
                if (obj?.object_type && typeCounts[obj.object_type] !== undefined) {
                    typeCounts[obj.object_type]++;
                }
            });

            // Calculate complexity (similar to dashboards)
            let complexity = "low";
            if ((pageCount >= 2 && pageCount <= 4) || (visualizationCount >= 2 && visualizationCount <= 4)) {
                complexity = "medium";
            } else if ((pageCount >= 5 && pageCount <= 9) || (visualizationCount >= 5 && visualizationCount <= 9)) {
                complexity = "high";
            } else if (pageCount >= 10 || visualizationCount >= 10) {
                complexity = "critical";
            }

            return {
                name: report.name,
                type: reportType,
                pageCount,
                visualizationCount,
                queryCount,
                packages: typeCounts.package ?? 0,
                data_modules: typeCounts.data_module ?? 0,
                data_sources: (typeCounts.data_source ?? 0) + (typeCounts.data_source_connection ?? 0),
                data_source_connections: typeCounts.data_source_connection ?? 0,
                tables: typeCounts.table ?? 0,
                calculated_fields: typeCounts.calculated_field ?? 0,
                column: typeCounts.column ?? 0,
                measure: typeCounts.measure ?? 0,
                dimension: typeCounts.dimension ?? 0,
                filter: typeCounts.filter ?? 0,
                parameter: typeCounts.parameter ?? 0,
                sort: typeCounts.sort ?? 0,
                prompt: typeCounts.prompt ?? 0,
                hierarchy: typeCounts.hierarchy ?? 0,
                output: typeCounts.output ?? 0,
                complexity,
            };
        }).sort((a, b) => a.name.localeCompare(b.name));
    }, [objects, relationships, objectsMap, relationshipsBySource, getReportRelatedIds]);

    // Calculate complexity stats
    const complexityStats = useMemo(() => {
        const stats = {
            low: 0,
            medium: 0,
            high: 0,
            critical: 0
        };
        reportData.forEach(report => {
            const complexity = report.complexity.toLowerCase();
            if (complexity === "low") stats.low++;
            else if (complexity === "medium") stats.medium++;
            else if (complexity === "high") stats.high++;
            else if (complexity === "critical") stats.critical++;
        });
        return stats;
    }, [reportData]);

    if (reportData.length === 0) {
        return (
            <div className="text-center py-8 text-muted-foreground">
                No reports found
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Report Complexity Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-lg border bg-card">
                    <div className="text-2xl font-bold">{complexityStats.low}</div>
                    <div className="text-sm text-muted-foreground">Low Complexity</div>
                </div>
                <div className="p-4 rounded-lg border bg-card">
                    <div className="text-2xl font-bold">{complexityStats.medium}</div>
                    <div className="text-sm text-muted-foreground">Medium Complexity</div>
                </div>
                <div className="p-4 rounded-lg border bg-card">
                    <div className="text-2xl font-bold">{complexityStats.high}</div>
                    <div className="text-sm text-muted-foreground">High Complexity</div>
                </div>
                <div className="p-4 rounded-lg border bg-card">
                    <div className="text-2xl font-bold">{complexityStats.critical}</div>
                    <div className="text-sm text-muted-foreground">Critical Complexity</div>
                </div>
            </div>

            <div className="space-y-2">
                <Button
                    variant="ghost"
                    onClick={() => setIsTableOpen(!isTableOpen)}
                    className="w-full justify-between"
                >
                    <span className="font-medium">Report Details</span>
                    {isTableOpen ? (
                        <ChevronUp className="h-4 w-4" />
                    ) : (
                        <ChevronDown className="h-4 w-4" />
                    )}
                </Button>
                
                {isTableOpen && (
                    <div className="rounded-md border overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Report Name</TableHead>
                                    <TableHead className="text-right">Type</TableHead>
                                    <TableHead className="text-right">Pages</TableHead>
                                    <TableHead className="text-right">Viz</TableHead>
                                    <TableHead className="text-right">Queries</TableHead>
                                    <TableHead className="text-right">Packages</TableHead>
                                    <TableHead className="text-right">Data Modules</TableHead>
                                    <TableHead className="text-right">Data Sources</TableHead>
                                    <TableHead className="text-right">DS Conn</TableHead>
                                    <TableHead className="text-right">Tables</TableHead>
                                    <TableHead className="text-right">Calc Fields</TableHead>
                                    <TableHead className="text-right">Column</TableHead>
                                    <TableHead className="text-right">Measure</TableHead>
                                    <TableHead className="text-right">Dimension</TableHead>
                                    <TableHead className="text-right">Filter</TableHead>
                                    <TableHead className="text-right">Parameter</TableHead>
                                    <TableHead className="text-right">Sort</TableHead>
                                    <TableHead className="text-right">Prompt</TableHead>
                                    <TableHead className="text-right">Hierarchy</TableHead>
                                    <TableHead className="text-right">Output</TableHead>
                                    <TableHead className="text-right">Complexity</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {reportData.map((report, index) => (
                                    <TableRow key={index}>
                                        <TableCell className="font-medium">{report.name}</TableCell>
                                        <TableCell className="text-right">{report.type}</TableCell>
                                        <TableCell className="text-right">{report.pageCount}</TableCell>
                                        <TableCell className="text-right">{report.visualizationCount}</TableCell>
                                        <TableCell className="text-right">{report.queryCount}</TableCell>
                                        <TableCell className="text-right">{report.packages}</TableCell>
                                        <TableCell className="text-right">{report.data_modules}</TableCell>
                                        <TableCell className="text-right">{report.data_sources}</TableCell>
                                        <TableCell className="text-right">{report.data_source_connections}</TableCell>
                                        <TableCell className="text-right">{report.tables}</TableCell>
                                        <TableCell className="text-right">{report.calculated_fields}</TableCell>
                                        <TableCell className="text-right">{report.column}</TableCell>
                                        <TableCell className="text-right">{report.measure}</TableCell>
                                        <TableCell className="text-right">{report.dimension}</TableCell>
                                        <TableCell className="text-right">{report.filter}</TableCell>
                                        <TableCell className="text-right">{report.parameter}</TableCell>
                                        <TableCell className="text-right">{report.sort}</TableCell>
                                        <TableCell className="text-right">{report.prompt}</TableCell>
                                        <TableCell className="text-right">{report.hierarchy}</TableCell>
                                        <TableCell className="text-right">{report.output}</TableCell>
                                        <TableCell className="text-right">
                                            <Badge variant={getComplexityBadgeVariant(report.complexity)}>
                                                {report.complexity}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </div>
        </div>
    );
}

interface UnifiedDataSourceSummaryTableProps {
    objects: ExtractedObject[];
    relationships: ObjectRelationship[];
}

/**
 * Unified Data Source Summary Table
 * 
 * Combines Package, Data Module, and Data Source summaries into a single comprehensive view.
 * Properly traverses the relationship hierarchy considering all parent-child relationships:
 * 
 * Parent-Child Relationships (via PARENT_CHILD):
 * - Package can be child of Data Source
 * - Data Module can be child of: Data Module (self-referential), Package, or Data Source
 * - Tables can be children of Data Modules
 * 
 * Other Relationships:
 * - Package → CONTAINS/PARENT_CHILD → Data Module → CONNECTS_TO → Data Source
 * - Data Module → CONNECTS_TO → Data Source (connection relationship)
 * - Reports/Dashboards → USES/CONNECTS_TO → Data Sources/Data Modules
 * - Handles nested relationships through tabs/pages/visualizations/queries
 */
function UnifiedDataSourceSummaryTable({ objects, relationships }: UnifiedDataSourceSummaryTableProps) {
    const [activeTab, setActiveTab] = useState<"packages" | "dataModules" | "dataSources">("packages");
    const [isTableOpen, setIsTableOpen] = useState(true);

    // Build object map for quick lookup
    const objectsMap = useMemo(() => {
        const map = new Map<string, ExtractedObject>();
        objects.forEach(obj => map.set(obj.id, obj));
        return map;
    }, [objects]);

    // Build relationship maps
    const relationshipsBySource = useMemo(() => {
        const map = new Map<string, ObjectRelationship[]>();
        relationships.forEach(rel => {
            if (!map.has(rel.source_object_id)) {
                map.set(rel.source_object_id, []);
            }
            map.get(rel.source_object_id)!.push(rel);
        });
        return map;
    }, [relationships]);

    const relationshipsByTarget = useMemo(() => {
        const map = new Map<string, ObjectRelationship[]>();
        relationships.forEach(rel => {
            if (!map.has(rel.target_object_id)) {
                map.set(rel.target_object_id, []);
            }
            map.get(rel.target_object_id)!.push(rel);
        });
        return map;
    }, [relationships]);

    /**
     * Helper function to find all reports and dashboards that use a given object
     * Traverses relationships through queries, visualizations, tabs, and pages
     */
    const findUsageByReportsAndDashboards = useMemo(() => {
        return (targetId: string): { reportIds: Set<string>; dashboardIds: Set<string> } => {
            const reportIds = new Set<string>();
            const dashboardIds = new Set<string>();

            // Direct relationships: report/dashboard -> target
            const incomingRels = relationshipsByTarget.get(targetId) || [];
            incomingRels.forEach(rel => {
                const sourceObj = objectsMap.get(rel.source_object_id);
                if (sourceObj?.object_type === "report" && 
                    (rel.relationship_type === "uses" || rel.relationship_type === "connects_to" || rel.relationship_type === "references")) {
                    reportIds.add(rel.source_object_id);
                }
                if (sourceObj?.object_type === "dashboard" && 
                    (rel.relationship_type === "uses" || rel.relationship_type === "references")) {
                    dashboardIds.add(rel.source_object_id);
                }
            });

            // Indirect through queries: report -> query -> target
            const queryIds = new Set<string>();
            incomingRels.forEach(rel => {
                const sourceObj = objectsMap.get(rel.source_object_id);
                if (sourceObj?.object_type === "query" && 
                    (rel.relationship_type === "uses" || rel.relationship_type === "references")) {
                    queryIds.add(rel.source_object_id);
                }
            });

            queryIds.forEach(queryId => {
                const queryIncoming = relationshipsByTarget.get(queryId) || [];
                queryIncoming.forEach(rel => {
                    if (rel.relationship_type === "contains") {
                        const sourceObj = objectsMap.get(rel.source_object_id);
                        if (sourceObj?.object_type === "report") {
                            reportIds.add(rel.source_object_id);
                        }
                    }
                });
            });

            // Indirect through visualizations: dashboard/report -> visualization -> target
            const vizIds = new Set<string>();
            incomingRels.forEach(rel => {
                const sourceObj = objectsMap.get(rel.source_object_id);
                if (sourceObj?.object_type === "visualization") {
                    vizIds.add(rel.source_object_id);
                }
            });

            vizIds.forEach(vizId => {
                const vizIncoming = relationshipsByTarget.get(vizId) || [];
                vizIncoming.forEach(rel => {
                    if (rel.relationship_type === "contains") {
                        const sourceObj = objectsMap.get(rel.source_object_id);
                        if (sourceObj?.object_type === "dashboard") {
                            dashboardIds.add(rel.source_object_id);
                        }
                        if (sourceObj?.object_type === "report") {
                            reportIds.add(rel.source_object_id);
                        }
                        // Also check if visualization is in a tab/page
                        if (sourceObj?.object_type === "tab" || sourceObj?.object_type === "page") {
                            const tabPageIncoming = relationshipsByTarget.get(sourceObj.id) || [];
                            tabPageIncoming.forEach(tabRel => {
                                if (tabRel.relationship_type === "contains") {
                                    const parentObj = objectsMap.get(tabRel.source_object_id);
                                    if (parentObj?.object_type === "dashboard") {
                                        dashboardIds.add(tabRel.source_object_id);
                                    }
                                    if (parentObj?.object_type === "report") {
                                        reportIds.add(tabRel.source_object_id);
                                    }
                                }
                            });
                        }
                    }
                });
            });

            // Traverse from reports/dashboards to find visualizations/queries that use target
            objects.filter(obj => obj.object_type === "report" || obj.object_type === "dashboard").forEach(parent => {
                const parentRels = relationshipsBySource.get(parent.id) || [];
                
                // Check direct visualizations/queries
                parentRels.forEach(rel => {
                    if (rel.relationship_type === "contains") {
                        const targetObj = objectsMap.get(rel.target_object_id);
                        if (targetObj?.object_type === "visualization" || targetObj?.object_type === "query") {
                            const childRels = relationshipsBySource.get(targetObj.id) || [];
                            childRels.forEach(childRel => {
                                if (childRel.target_object_id === targetId) {
                                    if (parent.object_type === "report") {
                                        reportIds.add(parent.id);
                                    } else if (parent.object_type === "dashboard") {
                                        dashboardIds.add(parent.id);
                                    }
                                }
                            });
                        }
                    }
                });
                
                // Check through tabs/pages
                parentRels.forEach(rel => {
                    if (rel.relationship_type === "contains") {
                        const targetObj = objectsMap.get(rel.target_object_id);
                        if (targetObj?.object_type === "tab" || targetObj?.object_type === "page") {
                            const tabPageRels = relationshipsBySource.get(targetObj.id) || [];
                            tabPageRels.forEach(tabRel => {
                                if (tabRel.relationship_type === "contains") {
                                    const grandChildObj = objectsMap.get(tabRel.target_object_id);
                                    if (grandChildObj?.object_type === "visualization" || grandChildObj?.object_type === "query") {
                                        const grandChildRels = relationshipsBySource.get(grandChildObj.id) || [];
                                        grandChildRels.forEach(grandChildRel => {
                                            if (grandChildRel.target_object_id === targetId) {
                                                if (parent.object_type === "report") {
                                                    reportIds.add(parent.id);
                                                } else if (parent.object_type === "dashboard") {
                                                    dashboardIds.add(parent.id);
                                                }
                                            }
                                        });
                                    }
                                }
                            });
                        }
                    }
                });
            });

            return { reportIds, dashboardIds };
        };
    }, [objects, relationships, objectsMap, relationshipsBySource, relationshipsByTarget]);

    // Package data with full hierarchy traversal
    // Packages can be children of Data Sources, and can contain Data Modules via PARENT_CHILD or CONTAINS
    const packageData = useMemo(() => {
        const packages = objects.filter(obj => obj.object_type === "package");
        
        return packages.map(pkg => {
            const outgoingRels = relationshipsBySource.get(pkg.id) || [];
            
            // Find data modules that are children of this package
            // Can be via PARENT_CHILD (parent_id points to package) or CONTAINS
            const dataModuleIds = new Set<string>();
            
            // Method 1: CONTAINS relationship
            outgoingRels.forEach(rel => {
                if (rel.relationship_type === "contains") {
                    const targetObj = objectsMap.get(rel.target_object_id);
                    if (targetObj?.object_type === "data_module") {
                        dataModuleIds.add(rel.target_object_id);
                    }
                }
            });
            
            // Method 2: PARENT_CHILD relationship (data module has parent = package.id)
            const incomingParentRels = relationshipsByTarget.get(pkg.id) || [];
            incomingParentRels.forEach(rel => {
                if (rel.relationship_type === "parent_child") {
                    const sourceObj = objectsMap.get(rel.source_object_id);
                    if (sourceObj?.object_type === "data_module") {
                        dataModuleIds.add(rel.source_object_id);
                    }
                }
            });
            
            const dataModuleCount = dataModuleIds.size;
            
            // Aggregate data sources from nested data modules (traverse: package -> data_module -> data_source)
            const dataSourceSet = new Set<string>();
            dataModuleIds.forEach(moduleId => {
                const moduleRels = relationshipsBySource.get(moduleId) || [];
                moduleRels.forEach(rel => {
                    if (rel.relationship_type === "connects_to") {
                        const targetObj = objectsMap.get(rel.target_object_id);
                        if (targetObj?.object_type === "data_source" || targetObj?.object_type === "package") {
                            dataSourceSet.add(rel.target_object_id);
                        }
                    }
                });
            });
            const dataSourceCount = dataSourceSet.size;
            
            // Find usage by reports and dashboards (direct and indirect through data modules)
            const { reportIds, dashboardIds } = findUsageByReportsAndDashboards(pkg.id);
            
            // Also check indirect usage through data modules
            dataModuleIds.forEach(moduleId => {
                const moduleUsage = findUsageByReportsAndDashboards(moduleId);
                moduleUsage.reportIds.forEach(id => reportIds.add(id));
                moduleUsage.dashboardIds.forEach(id => dashboardIds.add(id));
            });
            
            return {
                name: pkg.name,
                dataModuleCount,
                dataSourceCount,
                reportCount: reportIds.size,
                dashboardCount: dashboardIds.size,
                totalUsage: reportIds.size + dashboardIds.size
            };
        }).sort((a, b) => b.totalUsage - a.totalUsage);
    }, [objects, relationships, objectsMap, relationshipsBySource, findUsageByReportsAndDashboards]);

    // Data Module data with full hierarchy traversal
    // Data Modules can be children of: Data Module (self-referential), Package, or Data Source
    // Data Modules can contain: Tables (via CONTAINS or PARENT_CHILD)
    const dataModuleData = useMemo(() => {
        const dataModules = objects.filter(obj => obj.object_type === "data_module");
        
        return dataModules.map(module => {
            const outgoingRels = relationshipsBySource.get(module.id) || [];
            
            // Count tables contained in module
            // Can be via CONTAINS or PARENT_CHILD (table has parent_id = module.id)
            const tableIds = new Set<string>();
            
            // Method 1: CONTAINS relationship
            outgoingRels.forEach(rel => {
                if (rel.relationship_type === "contains") {
                    const targetObj = objectsMap.get(rel.target_object_id);
                    if (targetObj?.object_type === "table") {
                        tableIds.add(rel.target_object_id);
                    }
                }
            });
            
            // Method 2: PARENT_CHILD relationship (table has parent = module.id)
            const incomingParentRels = relationshipsByTarget.get(module.id) || [];
            incomingParentRels.forEach(rel => {
                if (rel.relationship_type === "parent_child") {
                    const sourceObj = objectsMap.get(rel.source_object_id);
                    if (sourceObj?.object_type === "table") {
                        tableIds.add(rel.source_object_id);
                    }
                }
            });
            
            const tableCount = tableIds.size;
            
            // Count data sources connected (via CONNECTS_TO)
            const dataSourceSet = new Set<string>();
            outgoingRels.forEach(rel => {
                if (rel.relationship_type === "connects_to") {
                    const targetObj = objectsMap.get(rel.target_object_id);
                    if (targetObj?.object_type === "data_source" || targetObj?.object_type === "package") {
                        dataSourceSet.add(rel.target_object_id);
                    }
                }
            });
            const dataSourceCount = dataSourceSet.size;
            
            // Find parent information (can be Data Module, Package, or Data Source)
            // Check PARENT_CHILD relationships where this module is the target
            const parentRels = relationshipsByTarget.get(module.id) || [];
            let parentType: string | null = null;
            parentRels.forEach(rel => {
                if (rel.relationship_type === "parent_child") {
                    const parentObj = objectsMap.get(rel.source_object_id);
                    if (parentObj && (parentObj.object_type === "data_module" || 
                                     parentObj.object_type === "package" || 
                                     parentObj.object_type === "data_source")) {
                        parentType = parentObj.object_type;
                    }
                }
            });
            
            // Find usage by reports and dashboards
            const { reportIds, dashboardIds } = findUsageByReportsAndDashboards(module.id);
            
            const moduleType = (module.properties?.cognosClass as string) || "dataModule";
            
            return {
                name: module.name,
                type: moduleType,
                parentType: parentType, // Track parent type for reference
                tableCount,
                dataSourceCount,
                reportCount: reportIds.size,
                dashboardCount: dashboardIds.size,
                totalUsage: reportIds.size + dashboardIds.size
            };
        }).sort((a, b) => b.totalUsage - a.totalUsage);
    }, [objects, relationships, objectsMap, relationshipsBySource, findUsageByReportsAndDashboards]);

    // Data Source data with full hierarchy traversal
    // Data Sources can be parents of: Packages (via PARENT_CHILD), Data Modules (via PARENT_CHILD)
    // Data Sources are connected to by: Data Modules (via CONNECTS_TO)
    const dataSourceData = useMemo(() => {
        const dataSources = objects.filter(obj => obj.object_type === "data_source");
        
        return dataSources.map(dataSource => {
            // Find usage by reports and dashboards
            const { reportIds, dashboardIds } = findUsageByReportsAndDashboards(dataSource.id);
            
            // Count data modules that connect to this data source (via CONNECTS_TO)
            const incomingRels = relationshipsByTarget.get(dataSource.id) || [];
            const connectedModuleIds = new Set<string>();
            incomingRels.forEach(rel => {
                const sourceObj = objectsMap.get(rel.source_object_id);
                if (sourceObj?.object_type === "data_module" && rel.relationship_type === "connects_to") {
                    connectedModuleIds.add(rel.source_object_id);
                }
            });
            
            // Count data modules that are children of this data source (via PARENT_CHILD)
            const childModuleIds = new Set<string>();
            const childPackageIds = new Set<string>();
            const outgoingParentRels = relationshipsBySource.get(dataSource.id) || [];
            outgoingParentRels.forEach(rel => {
                if (rel.relationship_type === "parent_child") {
                    const targetObj = objectsMap.get(rel.target_object_id);
                    if (targetObj?.object_type === "data_module") {
                        childModuleIds.add(rel.target_object_id);
                    } else if (targetObj?.object_type === "package") {
                        childPackageIds.add(rel.target_object_id);
                    }
                }
            });
            
            // Combine all data modules (connected + children)
            const allModuleIds = new Set([...connectedModuleIds, ...childModuleIds]);
            const dataModuleCount = allModuleIds.size;
            const packageCount = childPackageIds.size;
            
            const dataSourceType = (dataSource.properties?.data_source_type as string) || "Unknown";
            
            return {
                name: dataSource.name,
                type: dataSourceType,
                dashboardCount: dashboardIds.size,
                reportCount: reportIds.size,
                dataModuleCount,
                packageCount,
                totalUsage: dashboardIds.size + reportIds.size + dataModuleCount
            };
        }).sort((a, b) => b.totalUsage - a.totalUsage);
    }, [objects, relationships, objectsMap, relationshipsByTarget, findUsageByReportsAndDashboards]);

    // Calculate total stats
    const totalStats = useMemo(() => {
        return {
            totalPackages: packageData.length,
            totalDataModules: dataModuleData.length,
            totalDataSources: dataSourceData.length,
            totalReports: Math.max(
                packageData.reduce((sum, pkg) => sum + pkg.reportCount, 0),
                dataModuleData.reduce((sum, mod) => sum + mod.reportCount, 0),
                dataSourceData.reduce((sum, ds) => sum + ds.reportCount, 0)
            ),
            totalDashboards: Math.max(
                packageData.reduce((sum, pkg) => sum + pkg.dashboardCount, 0),
                dataModuleData.reduce((sum, mod) => sum + mod.dashboardCount, 0),
                dataSourceData.reduce((sum, ds) => sum + ds.dashboardCount, 0)
            )
        };
    }, [packageData, dataModuleData, dataSourceData]);

    return (
        <div className="space-y-6">
            {/* Overall Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="p-4 rounded-lg border bg-card">
                    <div className="text-2xl font-bold">{totalStats.totalPackages}</div>
                    <div className="text-sm text-muted-foreground">Packages</div>
                </div>
                <div className="p-4 rounded-lg border bg-card">
                    <div className="text-2xl font-bold">{totalStats.totalDataModules}</div>
                    <div className="text-sm text-muted-foreground">Data Modules</div>
                </div>
                <div className="p-4 rounded-lg border bg-card">
                    <div className="text-2xl font-bold">{totalStats.totalDataSources}</div>
                    <div className="text-sm text-muted-foreground">Data Sources</div>
                </div>
                <div className="p-4 rounded-lg border bg-card">
                    <div className="text-2xl font-bold">{totalStats.totalReports}</div>
                    <div className="text-sm text-muted-foreground">Report Usage</div>
                </div>
                <div className="p-4 rounded-lg border bg-card">
                    <div className="text-2xl font-bold">{totalStats.totalDashboards}</div>
                    <div className="text-sm text-muted-foreground">Dashboard Usage</div>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-2 border-b">
                <Button
                    variant={activeTab === "packages" ? "default" : "ghost"}
                    onClick={() => setActiveTab("packages")}
                    className="rounded-b-none"
                >
                    Packages ({packageData.length})
                </Button>
                <Button
                    variant={activeTab === "dataModules" ? "default" : "ghost"}
                    onClick={() => setActiveTab("dataModules")}
                    className="rounded-b-none"
                >
                    Data Modules ({dataModuleData.length})
                </Button>
                <Button
                    variant={activeTab === "dataSources" ? "default" : "ghost"}
                    onClick={() => setActiveTab("dataSources")}
                    className="rounded-b-none"
                >
                    Data Sources ({dataSourceData.length})
                </Button>
            </div>

            {/* Tab Content */}
            <div className="space-y-2">
                <Button
                    variant="ghost"
                    onClick={() => setIsTableOpen(!isTableOpen)}
                    className="w-full justify-between"
                >
                    <span className="font-medium">
                        {activeTab === "packages" && "Package Details"}
                        {activeTab === "dataModules" && "Data Module Details"}
                        {activeTab === "dataSources" && "Data Source Details"}
                    </span>
                    {isTableOpen ? (
                        <ChevronUp className="h-4 w-4" />
                    ) : (
                        <ChevronDown className="h-4 w-4" />
                    )}
                </Button>
                
                {isTableOpen && (
                    <>
                        {activeTab === "packages" && (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Package Name</TableHead>
                                        <TableHead className="text-right">Data Modules</TableHead>
                                        <TableHead className="text-right">Data Sources</TableHead>
                                        <TableHead className="text-right">Reports</TableHead>
                                        <TableHead className="text-right">Dashboards</TableHead>
                                        <TableHead className="text-right">Total Usage</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {packageData.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                                                No packages found
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        packageData.map((pkg, index) => (
                                            <TableRow key={index}>
                                                <TableCell className="font-medium">{pkg.name}</TableCell>
                                                <TableCell className="text-right">{pkg.dataModuleCount}</TableCell>
                                                <TableCell className="text-right">{pkg.dataSourceCount}</TableCell>
                                                <TableCell className="text-right">{pkg.reportCount}</TableCell>
                                                <TableCell className="text-right">{pkg.dashboardCount}</TableCell>
                                                <TableCell className="text-right font-medium">{pkg.totalUsage}</TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        )}

                        {activeTab === "dataModules" && (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Module Name</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Parent</TableHead>
                                        <TableHead className="text-right">Tables</TableHead>
                                        <TableHead className="text-right">Data Sources</TableHead>
                                        <TableHead className="text-right">Reports</TableHead>
                                        <TableHead className="text-right">Dashboards</TableHead>
                                        <TableHead className="text-right">Total Usage</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {dataModuleData.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                                                No data modules found
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        dataModuleData.map((module, index) => (
                                            <TableRow key={index}>
                                                <TableCell className="font-medium">{module.name}</TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">{module.type}</Badge>
                                                </TableCell>
                                                <TableCell>
                                                    {module.parentType ? (
                                                        <Badge variant="secondary" className="text-xs">
                                                            {module.parentType}
                                                        </Badge>
                                                    ) : (
                                                        <span className="text-muted-foreground text-sm">—</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right">{module.tableCount}</TableCell>
                                                <TableCell className="text-right">{module.dataSourceCount}</TableCell>
                                                <TableCell className="text-right">{module.reportCount}</TableCell>
                                                <TableCell className="text-right">{module.dashboardCount}</TableCell>
                                                <TableCell className="text-right font-medium">{module.totalUsage}</TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        )}

                        {activeTab === "dataSources" && (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Data Source Name</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead className="text-right">Packages</TableHead>
                                        <TableHead className="text-right">Data Modules</TableHead>
                                        <TableHead className="text-right">Dashboards</TableHead>
                                        <TableHead className="text-right">Reports</TableHead>
                                        <TableHead className="text-right">Total Usage</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {dataSourceData.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                                                No data sources found
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        dataSourceData.map((dataSource, index) => (
                                            <TableRow key={index}>
                                                <TableCell className="font-medium">{dataSource.name}</TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">{dataSource.type}</Badge>
                                                </TableCell>
                                                <TableCell className="text-right">{dataSource.packageCount}</TableCell>
                                                <TableCell className="text-right">{dataSource.dataModuleCount}</TableCell>
                                                <TableCell className="text-right">{dataSource.dashboardCount}</TableCell>
                                                <TableCell className="text-right">{dataSource.reportCount}</TableCell>
                                                <TableCell className="text-right font-medium">{dataSource.totalUsage}</TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

interface DataSourceSummaryTableProps {
    objects: ExtractedObject[];
    relationships: ObjectRelationship[];
}

function DataSourceSummaryTable({ objects, relationships }: DataSourceSummaryTableProps) {
    const [isTableOpen, setIsTableOpen] = useState(true);

    // Build object map for quick lookup
    const objectsMap = useMemo(() => {
        const map = new Map<string, ExtractedObject>();
        objects.forEach(obj => map.set(obj.id, obj));
        return map;
    }, [objects]);

    // Build relationship maps
    const relationshipsBySource = useMemo(() => {
        const map = new Map<string, ObjectRelationship[]>();
        relationships.forEach(rel => {
            if (!map.has(rel.source_object_id)) {
                map.set(rel.source_object_id, []);
            }
            map.get(rel.source_object_id)!.push(rel);
        });
        return map;
    }, [relationships]);

    const relationshipsByTarget = useMemo(() => {
        const map = new Map<string, ObjectRelationship[]>();
        relationships.forEach(rel => {
            if (!map.has(rel.target_object_id)) {
                map.set(rel.target_object_id, []);
            }
            map.get(rel.target_object_id)!.push(rel);
        });
        return map;
    }, [relationships]);

    // Get data source summary data
    const dataSourceData = useMemo(() => {
        const dataSources = objects.filter(obj => obj.object_type === "data_source");
        
        return dataSources.map(dataSource => {
            const incomingRels = relationshipsByTarget.get(dataSource.id) || [];
            
            // Count dashboards that use this data source (direct and nested)
            const dashboardIds = new Set<string>();
            
            // Direct: dashboard -> data_source
            incomingRels.forEach(rel => {
                const sourceObj = objectsMap.get(rel.source_object_id);
                if (sourceObj?.object_type === "dashboard" && rel.relationship_type === "uses") {
                    dashboardIds.add(rel.source_object_id);
                }
            });
            
            // Nested: dashboard -> tab -> visualization -> data_source
            // Also: dashboard -> visualization -> data_source
            // Follow hierarchy page pattern: visualizations use data sources via 'uses' relationship
            objects.filter(obj => obj.object_type === "dashboard").forEach(dashboard => {
                const dashboardRels = relationshipsBySource.get(dashboard.id) || [];
                
                // Check direct visualizations
                dashboardRels.forEach(rel => {
                    if (rel.relationship_type === "contains") {
                        const targetObj = objectsMap.get(rel.target_object_id);
                        if (targetObj?.object_type === "visualization") {
                            const vizRels = relationshipsBySource.get(targetObj.id) || [];
                            vizRels.forEach(vizRel => {
                                // Check all relationships from visualization - if target is this data source
                                const vizTarget = objectsMap.get(vizRel.target_object_id);
                                if ((vizTarget?.object_type === "data_source" || vizTarget?.object_type === "package") && 
                                    vizRel.target_object_id === dataSource.id) {
                                    dashboardIds.add(dashboard.id);
                                }
                            });
                        }
                    }
                });
                
                // Check through tabs
                dashboardRels.forEach(rel => {
                    if (rel.relationship_type === "contains") {
                        const targetObj = objectsMap.get(rel.target_object_id);
                        if (targetObj?.object_type === "tab") {
                            const tabRels = relationshipsBySource.get(targetObj.id) || [];
                            tabRels.forEach(tabRel => {
                                if (tabRel.relationship_type === "contains") {
                                    const vizObj = objectsMap.get(tabRel.target_object_id);
                                    if (vizObj?.object_type === "visualization") {
                                        const vizRels = relationshipsBySource.get(vizObj.id) || [];
                                        vizRels.forEach(vizRel => {
                                            // Check all relationships from visualization - if target is this data source
                                            const vizTarget = objectsMap.get(vizRel.target_object_id);
                                            if ((vizTarget?.object_type === "data_source" || vizTarget?.object_type === "package") && 
                                                vizRel.target_object_id === dataSource.id) {
                                                dashboardIds.add(dashboard.id);
                                            }
                                        });
                                    }
                                }
                            });
                        }
                    }
                });
            });
            
            const dashboardCount = dashboardIds.size;
            
            // Count reports that use this data source (direct and nested)
            const reportIds = new Set<string>();
            
            // Direct: report -> data_source
            incomingRels.forEach(rel => {
                const sourceObj = objectsMap.get(rel.source_object_id);
                if (sourceObj?.object_type === "report" && 
                    (rel.relationship_type === "connects_to" || rel.relationship_type === "uses")) {
                    reportIds.add(rel.source_object_id);
                }
            });
            
            // Nested: report -> page -> visualization -> data_source
            // Also: report -> query -> data_source
            // Also: report -> visualization -> data_source
            // Follow hierarchy page pattern: visualizations/queries use data sources via 'uses' relationship
            objects.filter(obj => obj.object_type === "report").forEach(report => {
                const reportRels = relationshipsBySource.get(report.id) || [];
                
                // Check direct queries and visualizations
                reportRels.forEach(rel => {
                    if (rel.relationship_type === "contains" || rel.relationship_type === "uses") {
                        const targetObj = objectsMap.get(rel.target_object_id);
                        if (targetObj?.object_type === "query" || targetObj?.object_type === "visualization") {
                            const childRels = relationshipsBySource.get(targetObj.id) || [];
                            childRels.forEach(childRel => {
                                // Check all relationships from query/visualization - if target is this data source
                                const childTarget = objectsMap.get(childRel.target_object_id);
                                if ((childTarget?.object_type === "data_source" || childTarget?.object_type === "package") && 
                                    childRel.target_object_id === dataSource.id) {
                                    reportIds.add(report.id);
                                }
                            });
                        }
                    }
                });
                
                // Check through pages
                reportRels.forEach(rel => {
                    if (rel.relationship_type === "contains") {
                        const targetObj = objectsMap.get(rel.target_object_id);
                        if (targetObj?.object_type === "page") {
                            const pageRels = relationshipsBySource.get(targetObj.id) || [];
                            pageRels.forEach(pageRel => {
                                if (pageRel.relationship_type === "contains") {
                                    const childObj = objectsMap.get(pageRel.target_object_id);
                                    if (childObj?.object_type === "visualization" || childObj?.object_type === "query") {
                                        const childRels = relationshipsBySource.get(childObj.id) || [];
                                        childRels.forEach(childRel => {
                                            // Check all relationships from query/visualization - if target is this data source
                                            const childTarget = objectsMap.get(childRel.target_object_id);
                                            if ((childTarget?.object_type === "data_source" || childTarget?.object_type === "package") && 
                                                childRel.target_object_id === dataSource.id) {
                                                reportIds.add(report.id);
                                            }
                                        });
                                    }
                                }
                            });
                        }
                    }
                });
            });
            
            const reportCount = reportIds.size;
            
            // Count data modules that use this data source
            // Based on parser: Data modules use CONNECTS_TO relationship
            const dataModuleIds = new Set<string>();
            incomingRels.forEach(rel => {
                const sourceObj = objectsMap.get(rel.source_object_id);
                if (sourceObj?.object_type === "data_module" && rel.relationship_type === "connects_to") {
                    dataModuleIds.add(rel.source_object_id);
                }
            });
            const dataModuleCount = dataModuleIds.size;
            
            const totalUsage = dashboardCount + reportCount + dataModuleCount;
            
            // Get data source type from properties
            const dataSourceType = (dataSource.properties?.data_source_type as string) || "Unknown";
            
            return {
                name: dataSource.name,
                type: dataSourceType,
                dashboardCount,
                reportCount,
                dataModuleCount,
                totalUsage
            };
        }).sort((a, b) => b.totalUsage - a.totalUsage);
    }, [objects, relationships, objectsMap, relationshipsBySource, relationshipsByTarget]);

    if (dataSourceData.length === 0) {
        return (
            <div className="text-center py-8 text-muted-foreground">
                No data sources found
            </div>
        );
    }

    // Calculate total stats
    const totalStats = useMemo(() => {
        return {
            totalDataSources: dataSourceData.length,
            totalDashboards: dataSourceData.reduce((sum, ds) => sum + ds.dashboardCount, 0),
            totalReports: dataSourceData.reduce((sum, ds) => sum + ds.reportCount, 0),
            totalDataModules: dataSourceData.reduce((sum, ds) => sum + ds.dataModuleCount, 0)
        };
    }, [dataSourceData]);

    return (
        <div className="space-y-6">
            {/* Data Source Usage Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-lg border bg-card">
                    <div className="text-2xl font-bold">{totalStats.totalDataSources}</div>
                    <div className="text-sm text-muted-foreground">Total Data Sources</div>
                </div>
                <div className="p-4 rounded-lg border bg-card">
                    <div className="text-2xl font-bold">{totalStats.totalDashboards}</div>
                    <div className="text-sm text-muted-foreground">Dashboard Connections</div>
                </div>
                <div className="p-4 rounded-lg border bg-card">
                    <div className="text-2xl font-bold">{totalStats.totalReports}</div>
                    <div className="text-sm text-muted-foreground">Report Connections</div>
                </div>
                <div className="p-4 rounded-lg border bg-card">
                    <div className="text-2xl font-bold">{totalStats.totalDataModules}</div>
                    <div className="text-sm text-muted-foreground">Data Module Connections</div>
                </div>
            </div>

            <div className="space-y-2">
                <Button
                    variant="ghost"
                    onClick={() => setIsTableOpen(!isTableOpen)}
                    className="w-full justify-between"
                >
                    <span className="font-medium">Data Source Details</span>
                    {isTableOpen ? (
                        <ChevronUp className="h-4 w-4" />
                    ) : (
                        <ChevronDown className="h-4 w-4" />
                    )}
                </Button>
                
                {isTableOpen && (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Data Source Name</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead className="text-right">Dashboards</TableHead>
                                <TableHead className="text-right">Reports</TableHead>
                                <TableHead className="text-right">Data Modules</TableHead>
                                <TableHead className="text-right">Total Usage</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {dataSourceData.map((dataSource, index) => (
                                <TableRow key={index}>
                                    <TableCell className="font-medium">{dataSource.name}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{dataSource.type}</Badge>
                                    </TableCell>
                                    <TableCell className="text-right">{dataSource.dashboardCount}</TableCell>
                                    <TableCell className="text-right">{dataSource.reportCount}</TableCell>
                                    <TableCell className="text-right">{dataSource.dataModuleCount}</TableCell>
                                    <TableCell className="text-right font-medium">{dataSource.totalUsage}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </div>
        </div>
    );
}

interface PackageSummaryTableProps {
    objects: ExtractedObject[];
    relationships: ObjectRelationship[];
}

function PackageSummaryTable({ objects, relationships }: PackageSummaryTableProps) {
    const [isTableOpen, setIsTableOpen] = useState(true);

    // Build object map for quick lookup
    const objectsMap = useMemo(() => {
        const map = new Map<string, ExtractedObject>();
        objects.forEach(obj => map.set(obj.id, obj));
        return map;
    }, [objects]);

    // Build relationship maps
    const relationshipsBySource = useMemo(() => {
        const map = new Map<string, ObjectRelationship[]>();
        relationships.forEach(rel => {
            if (!map.has(rel.source_object_id)) {
                map.set(rel.source_object_id, []);
            }
            map.get(rel.source_object_id)!.push(rel);
        });
        return map;
    }, [relationships]);

    const relationshipsByTarget = useMemo(() => {
        const map = new Map<string, ObjectRelationship[]>();
        relationships.forEach(rel => {
            if (!map.has(rel.target_object_id)) {
                map.set(rel.target_object_id, []);
            }
            map.get(rel.target_object_id)!.push(rel);
        });
        return map;
    }, [relationships]);

    // Get package summary data
    const packageData = useMemo(() => {
        const packages = objects.filter(obj => obj.object_type === "package");
        
        return packages.map(pkg => {
            const outgoingRels = relationshipsBySource.get(pkg.id) || [];
            
            // Count data modules contained in package (via CONTAINS)
            const dataModuleRels = outgoingRels.filter(rel => {
                if (rel.relationship_type === "contains") {
                    const targetObj = objectsMap.get(rel.target_object_id);
                    return targetObj?.object_type === "data_module";
                }
                return false;
            });
            const dataModuleCount = dataModuleRels.length;
            
            // Get data module IDs
            const dataModuleIds = dataModuleRels.map(rel => rel.target_object_id);
            
            // Aggregate data sources from nested data modules (nested relationship)
            const dataSourceSet = new Set<string>();
            dataModuleIds.forEach(moduleId => {
                const moduleRels = relationshipsBySource.get(moduleId) || [];
                moduleRels.forEach(rel => {
                    if (rel.relationship_type === "connects_to") {
                        const targetObj = objectsMap.get(rel.target_object_id);
                        if (targetObj?.object_type === "data_source" || targetObj?.object_type === "package") {
                            dataSourceSet.add(rel.target_object_id);
                        }
                    }
                });
            });
            const dataSourceCount = dataSourceSet.size;
            
            // Count usage by reports and dashboards (direct and indirect)
            const incomingRels = relationshipsByTarget.get(pkg.id) || [];
            
            // Direct usage
            const reportIds = new Set<string>();
            const dashboardIds = new Set<string>();
            
            incomingRels.forEach(rel => {
                const sourceObj = objectsMap.get(rel.source_object_id);
                if (sourceObj?.object_type === "report" && 
                    (rel.relationship_type === "uses" || rel.relationship_type === "connects_to")) {
                    reportIds.add(rel.source_object_id);
                }
                if (sourceObj?.object_type === "dashboard" && rel.relationship_type === "uses") {
                    dashboardIds.add(rel.source_object_id);
                }
            });
            
            // Indirect usage through data modules: reports/dashboards -> queries/visualizations -> data modules -> package
            // Traverse nested relationships like hierarchy page does
            dataModuleIds.forEach(moduleId => {
                // Direct usage of data module
                const moduleIncoming = relationshipsByTarget.get(moduleId) || [];
                moduleIncoming.forEach(rel => {
                    const sourceObj = objectsMap.get(rel.source_object_id);
                    if (sourceObj?.object_type === "report" && 
                        (rel.relationship_type === "uses" || rel.relationship_type === "references")) {
                        reportIds.add(rel.source_object_id);
                    }
                    if (sourceObj?.object_type === "dashboard" && 
                        (rel.relationship_type === "uses" || rel.relationship_type === "references")) {
                        dashboardIds.add(rel.source_object_id);
                    }
                });
                
                // Nested: report -> page -> visualization/query -> data_module
                // Nested: dashboard -> tab -> visualization -> data_module
                objects.filter(obj => obj.object_type === "report" || obj.object_type === "dashboard").forEach(parent => {
                    const parentRels = relationshipsBySource.get(parent.id) || [];
                    const childIds: string[] = [];
                    
                    // Get tabs/pages
                    parentRels.forEach(rel => {
                        if (rel.relationship_type === "contains") {
                            const targetObj = objectsMap.get(rel.target_object_id);
                            if (targetObj?.object_type === "tab" || targetObj?.object_type === "page") {
                                childIds.push(targetObj.id);
                            } else if (targetObj?.object_type === "visualization" || targetObj?.object_type === "query") {
                                childIds.push(targetObj.id);
                            }
                        }
                    });
                    
                    // Check if any child connects to this module
                    childIds.forEach(childId => {
                        const childRels = relationshipsBySource.get(childId) || [];
                        childRels.forEach(childRel => {
                            if (childRel.target_object_id === moduleId) {
                                if (parent.object_type === "report") {
                                    reportIds.add(parent.id);
                                } else if (parent.object_type === "dashboard") {
                                    dashboardIds.add(parent.id);
                                }
                            }
                        });
                    });
                    
                    // Also check nested: tab/page -> visualization/query -> module
                    parentRels.forEach(rel => {
                        if (rel.relationship_type === "contains") {
                            const targetObj = objectsMap.get(rel.target_object_id);
                            if (targetObj?.object_type === "tab" || targetObj?.object_type === "page") {
                                const tabPageRels = relationshipsBySource.get(targetObj.id) || [];
                                tabPageRels.forEach(tabRel => {
                                    if (tabRel.relationship_type === "contains") {
                                        const grandChildObj = objectsMap.get(tabRel.target_object_id);
                                        if (grandChildObj?.object_type === "visualization" || grandChildObj?.object_type === "query") {
                                            const grandChildRels = relationshipsBySource.get(grandChildObj.id) || [];
                                            grandChildRels.forEach(grandChildRel => {
                                                if (grandChildRel.target_object_id === moduleId) {
                                                    if (parent.object_type === "report") {
                                                        reportIds.add(parent.id);
                                                    } else if (parent.object_type === "dashboard") {
                                                        dashboardIds.add(parent.id);
                                                    }
                                                }
                                            });
                                        }
                                    }
                                });
                            }
                        }
                    });
                });
            });
            
            const reportCount = reportIds.size;
            const dashboardCount = dashboardIds.size;
            
            return {
                name: pkg.name,
                dataModuleCount,
                dataSourceCount,
                reportCount,
                dashboardCount
            };
        }).sort((a, b) => a.name.localeCompare(b.name));
    }, [objects, relationships, objectsMap, relationshipsBySource, relationshipsByTarget]);

    if (packageData.length === 0) {
        return (
            <div className="text-center py-8 text-muted-foreground">
                No packages found
            </div>
        );
    }

    // Calculate total stats
    const totalStats = useMemo(() => {
        return {
            totalPackages: packageData.length,
            totalDataModules: packageData.reduce((sum, pkg) => sum + pkg.dataModuleCount, 0),
            totalDataSources: packageData.reduce((sum, pkg) => sum + pkg.dataSourceCount, 0),
            totalReports: packageData.reduce((sum, pkg) => sum + pkg.reportCount, 0),
            totalDashboards: packageData.reduce((sum, pkg) => sum + pkg.dashboardCount, 0)
        };
    }, [packageData]);

    return (
        <div className="space-y-6">
            {/* Package Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="p-4 rounded-lg border bg-card">
                    <div className="text-2xl font-bold">{totalStats.totalPackages}</div>
                    <div className="text-sm text-muted-foreground">Total Packages</div>
                </div>
                <div className="p-4 rounded-lg border bg-card">
                    <div className="text-2xl font-bold">{totalStats.totalDataModules}</div>
                    <div className="text-sm text-muted-foreground">Data Modules</div>
                </div>
                <div className="p-4 rounded-lg border bg-card">
                    <div className="text-2xl font-bold">{totalStats.totalDataSources}</div>
                    <div className="text-sm text-muted-foreground">Data Sources</div>
                </div>
                <div className="p-4 rounded-lg border bg-card">
                    <div className="text-2xl font-bold">{totalStats.totalReports}</div>
                    <div className="text-sm text-muted-foreground">Reports</div>
                </div>
                <div className="p-4 rounded-lg border bg-card">
                    <div className="text-2xl font-bold">{totalStats.totalDashboards}</div>
                    <div className="text-sm text-muted-foreground">Dashboards</div>
                </div>
            </div>

            <div className="space-y-2">
                <Button
                    variant="ghost"
                    onClick={() => setIsTableOpen(!isTableOpen)}
                    className="w-full justify-between"
                >
                    <span className="font-medium">Package Details</span>
                    {isTableOpen ? (
                        <ChevronUp className="h-4 w-4" />
                    ) : (
                        <ChevronDown className="h-4 w-4" />
                    )}
                </Button>
                
                {isTableOpen && (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Package Name</TableHead>
                                <TableHead className="text-right">Data Modules</TableHead>
                                <TableHead className="text-right">Data Sources</TableHead>
                                <TableHead className="text-right">Reports</TableHead>
                                <TableHead className="text-right">Dashboards</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {packageData.map((pkg, index) => (
                                <TableRow key={index}>
                                    <TableCell className="font-medium">{pkg.name}</TableCell>
                                    <TableCell className="text-right">{pkg.dataModuleCount}</TableCell>
                                    <TableCell className="text-right">{pkg.dataSourceCount}</TableCell>
                                    <TableCell className="text-right">{pkg.reportCount}</TableCell>
                                    <TableCell className="text-right">{pkg.dashboardCount}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </div>
        </div>
    );
}

interface DataModuleSummaryTableProps {
    objects: ExtractedObject[];
    relationships: ObjectRelationship[];
}

function DataModuleSummaryTable({ objects, relationships }: DataModuleSummaryTableProps) {
    const [isTableOpen, setIsTableOpen] = useState(true);

    // Build object map for quick lookup
    const objectsMap = useMemo(() => {
        const map = new Map<string, ExtractedObject>();
        objects.forEach(obj => map.set(obj.id, obj));
        return map;
    }, [objects]);

    // Build relationship maps
    const relationshipsBySource = useMemo(() => {
        const map = new Map<string, ObjectRelationship[]>();
        relationships.forEach(rel => {
            if (!map.has(rel.source_object_id)) {
                map.set(rel.source_object_id, []);
            }
            map.get(rel.source_object_id)!.push(rel);
        });
        return map;
    }, [relationships]);

    const relationshipsByTarget = useMemo(() => {
        const map = new Map<string, ObjectRelationship[]>();
        relationships.forEach(rel => {
            if (!map.has(rel.target_object_id)) {
                map.set(rel.target_object_id, []);
            }
            map.get(rel.target_object_id)!.push(rel);
        });
        return map;
    }, [relationships]);

    // Get data module summary data
    const dataModuleData = useMemo(() => {
        const dataModules = objects.filter(obj => obj.object_type === "data_module");
        
        return dataModules.map(module => {
            const outgoingRels = relationshipsBySource.get(module.id) || [];
            const incomingRels = relationshipsByTarget.get(module.id) || [];
            
            // Count tables contained in module (via CONTAINS)
            const tableRels = outgoingRels.filter(rel => {
                if (rel.relationship_type === "contains") {
                    const targetObj = objectsMap.get(rel.target_object_id);
                    return targetObj?.object_type === "table";
                }
                return false;
            });
            const tableCount = tableRels.length;
            const tableIds = tableRels.map(rel => rel.target_object_id);

            // Count columns (has_column from each table)
            let columnCount = 0;
            tableIds.forEach(tableId => {
                const tableOut = relationshipsBySource.get(tableId) || [];
                columnCount += tableOut.filter(rel => rel.relationship_type === "has_column").length;
            });

            // Count data sources and packages connected (via CONNECTS_TO)
            const dataSourceSet = new Set<string>();
            let packageCount = 0;
            outgoingRels.forEach(rel => {
                if (rel.relationship_type === "connects_to") {
                    const targetObj = objectsMap.get(rel.target_object_id);
                    if (targetObj?.object_type === "data_source" || targetObj?.object_type === "data_source_connection") {
                        dataSourceSet.add(rel.target_object_id);
                    } else if (targetObj?.object_type === "package") {
                        packageCount++;
                    }
                }
            });
            const dataSourceCount = dataSourceSet.size;

            // Nested in package or data source (incoming contains/uses)
            let nestedInPackage = false;
            let nestedInDataSource = false;
            incomingRels.forEach(rel => {
                if (rel.relationship_type !== "contains" && rel.relationship_type !== "uses") return;
                const sourceObj = objectsMap.get(rel.source_object_id);
                if (sourceObj?.object_type === "package") nestedInPackage = true;
                if (sourceObj?.object_type === "data_source" || sourceObj?.object_type === "data_source_connection") nestedInDataSource = true;
            });
            
            // Count usage by reports and dashboards (direct and indirect through queries/visualizations)
            const reportIds = new Set<string>();
            const dashboardIds = new Set<string>();
            
            // Direct usage: report/dashboard -> data_module
            incomingRels.forEach(rel => {
                const sourceObj = objectsMap.get(rel.source_object_id);
                if (sourceObj?.object_type === "report" && 
                    (rel.relationship_type === "uses" || rel.relationship_type === "references")) {
                    reportIds.add(rel.source_object_id);
                }
                if (sourceObj?.object_type === "dashboard" && 
                    (rel.relationship_type === "uses" || rel.relationship_type === "references")) {
                    dashboardIds.add(rel.source_object_id);
                }
            });
            
            // Indirect usage through queries: report -> query -> data_module
            // Find all queries that use this module
            const queryIds = new Set<string>();
            incomingRels.forEach(rel => {
                const sourceObj = objectsMap.get(rel.source_object_id);
                if (sourceObj?.object_type === "query" && 
                    (rel.relationship_type === "uses" || rel.relationship_type === "references")) {
                    queryIds.add(rel.source_object_id);
                }
            });
            
            // Find reports that contain these queries
            queryIds.forEach(queryId => {
                const queryIncoming = relationshipsByTarget.get(queryId) || [];
                queryIncoming.forEach(rel => {
                    if (rel.relationship_type === "contains") {
                        const sourceObj = objectsMap.get(rel.source_object_id);
                        if (sourceObj?.object_type === "report") {
                            reportIds.add(rel.source_object_id);
                        }
                    }
                });
            });
            
            // Indirect usage through visualizations: dashboard/report -> visualization -> data_module
            // Find all visualizations that use this module (check ALL relationship types from visualization)
            const vizIds = new Set<string>();
            incomingRels.forEach(rel => {
                const sourceObj = objectsMap.get(rel.source_object_id);
                if (sourceObj?.object_type === "visualization") {
                    // Check if visualization connects to this module via any relationship
                    vizIds.add(rel.source_object_id);
                }
            });
            
            // Find dashboards and reports that contain these visualizations
            // Follow the same pattern as hierarchy page: check direct and through tabs/pages
            vizIds.forEach(vizId => {
                const vizIncoming = relationshipsByTarget.get(vizId) || [];
                vizIncoming.forEach(rel => {
                    if (rel.relationship_type === "contains") {
                        const sourceObj = objectsMap.get(rel.source_object_id);
                        if (sourceObj?.object_type === "dashboard") {
                            dashboardIds.add(rel.source_object_id);
                        }
                        if (sourceObj?.object_type === "report") {
                            reportIds.add(rel.source_object_id);
                        }
                        // Also check if visualization is in a tab/page
                        if (sourceObj?.object_type === "tab" || sourceObj?.object_type === "page") {
                            // Find the dashboard/report that contains this tab/page
                            const tabPageIncoming = relationshipsByTarget.get(sourceObj.id) || [];
                            tabPageIncoming.forEach(tabRel => {
                                if (tabRel.relationship_type === "contains") {
                                    const parentObj = objectsMap.get(tabRel.source_object_id);
                                    if (parentObj?.object_type === "dashboard") {
                                        dashboardIds.add(tabRel.source_object_id);
                                    }
                                    if (parentObj?.object_type === "report") {
                                        reportIds.add(tabRel.source_object_id);
                                    }
                                }
                            });
                        }
                    }
                });
            });
            
            // Also traverse from reports/dashboards to find visualizations that use this module
            // This matches the hierarchy page pattern: check all relationships from visualizations
            objects.filter(obj => obj.object_type === "report" || obj.object_type === "dashboard").forEach(parent => {
                const parentRels = relationshipsBySource.get(parent.id) || [];
                
                // Check direct visualizations/queries
                parentRels.forEach(rel => {
                    if (rel.relationship_type === "contains") {
                        const targetObj = objectsMap.get(rel.target_object_id);
                        if (targetObj?.object_type === "visualization" || targetObj?.object_type === "query") {
                            const childRels = relationshipsBySource.get(targetObj.id) || [];
                            childRels.forEach(childRel => {
                                // Check if visualization/query connects to this module (check target object type)
                                const childTarget = objectsMap.get(childRel.target_object_id);
                                if (childTarget?.object_type === "data_module" && childRel.target_object_id === module.id) {
                                    if (parent.object_type === "report") {
                                        reportIds.add(parent.id);
                                    } else if (parent.object_type === "dashboard") {
                                        dashboardIds.add(parent.id);
                                    }
                                }
                            });
                        }
                    }
                });
                
                // Check through tabs/pages
                parentRels.forEach(rel => {
                    if (rel.relationship_type === "contains") {
                        const targetObj = objectsMap.get(rel.target_object_id);
                        if (targetObj?.object_type === "tab" || targetObj?.object_type === "page") {
                            const tabPageRels = relationshipsBySource.get(targetObj.id) || [];
                            tabPageRels.forEach(tabRel => {
                                if (tabRel.relationship_type === "contains") {
                                    const grandChildObj = objectsMap.get(tabRel.target_object_id);
                                    if (grandChildObj?.object_type === "visualization" || grandChildObj?.object_type === "query") {
                                        const grandChildRels = relationshipsBySource.get(grandChildObj.id) || [];
                                        grandChildRels.forEach(grandChildRel => {
                                            // Check if visualization/query connects to this module (check target object type)
                                            const grandChildTarget = objectsMap.get(grandChildRel.target_object_id);
                                            if (grandChildTarget?.object_type === "data_module" && grandChildRel.target_object_id === module.id) {
                                                if (parent.object_type === "report") {
                                                    reportIds.add(parent.id);
                                                } else if (parent.object_type === "dashboard") {
                                                    dashboardIds.add(parent.id);
                                                }
                                            }
                                        });
                                    }
                                }
                            });
                        }
                    }
                });
            });
            
            const reportCount = reportIds.size;
            const dashboardCount = dashboardIds.size;
            
            // Get module type from properties
            const moduleType = (module.properties?.cognosClass as string) || "dataModule";
            
            return {
                name: module.name,
                type: moduleType,
                tableCount,
                columnCount,
                packageCount,
                dataSourceCount,
                nestedInPackage,
                nestedInDataSource,
                reportCount,
                dashboardCount
            };
        }).sort((a, b) => b.reportCount + b.dashboardCount - (a.reportCount + a.dashboardCount));
    }, [objects, relationships, objectsMap, relationshipsBySource, relationshipsByTarget]);

    if (dataModuleData.length === 0) {
        return (
            <div className="text-center py-8 text-muted-foreground">
                No data modules found
            </div>
        );
    }

    // Calculate total stats
    const totalStats = useMemo(() => {
        return {
            totalDataModules: dataModuleData.length,
            totalTables: dataModuleData.reduce((sum, module) => sum + module.tableCount, 0),
            totalColumns: dataModuleData.reduce((sum, module) => sum + module.columnCount, 0),
            totalDataSources: dataModuleData.reduce((sum, module) => sum + module.dataSourceCount, 0),
            totalReports: dataModuleData.reduce((sum, module) => sum + module.reportCount, 0),
            totalDashboards: dataModuleData.reduce((sum, module) => sum + module.dashboardCount, 0)
        };
    }, [dataModuleData]);

    return (
        <div className="space-y-6">
            {/* Data Module Stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <div className="p-4 rounded-lg border bg-card">
                    <div className="text-2xl font-bold">{totalStats.totalDataModules}</div>
                    <div className="text-sm text-muted-foreground">Total Modules</div>
                </div>
                <div className="p-4 rounded-lg border bg-card">
                    <div className="text-2xl font-bold">{totalStats.totalTables}</div>
                    <div className="text-sm text-muted-foreground">Tables</div>
                </div>
                <div className="p-4 rounded-lg border bg-card">
                    <div className="text-2xl font-bold">{totalStats.totalColumns}</div>
                    <div className="text-sm text-muted-foreground">Columns</div>
                </div>
                <div className="p-4 rounded-lg border bg-card">
                    <div className="text-2xl font-bold">{totalStats.totalDataSources}</div>
                    <div className="text-sm text-muted-foreground">Data Sources</div>
                </div>
                <div className="p-4 rounded-lg border bg-card">
                    <div className="text-2xl font-bold">{totalStats.totalReports}</div>
                    <div className="text-sm text-muted-foreground">Reports</div>
                </div>
                <div className="p-4 rounded-lg border bg-card">
                    <div className="text-2xl font-bold">{totalStats.totalDashboards}</div>
                    <div className="text-sm text-muted-foreground">Dashboards</div>
                </div>
            </div>

            <div className="space-y-2">
                <Button
                    variant="ghost"
                    onClick={() => setIsTableOpen(!isTableOpen)}
                    className="w-full justify-between"
                >
                    <span className="font-medium">Data Module Details</span>
                    {isTableOpen ? (
                        <ChevronUp className="h-4 w-4" />
                    ) : (
                        <ChevronDown className="h-4 w-4" />
                    )}
                </Button>
                
                {isTableOpen && (
                    <div className="rounded-md border overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Module Name</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead className="text-right">Tables</TableHead>
                                    <TableHead className="text-right">Columns</TableHead>
                                    <TableHead className="text-right">Packages</TableHead>
                                    <TableHead className="text-right">Data Sources</TableHead>
                                    <TableHead className="text-right">Nested in Pkg</TableHead>
                                    <TableHead className="text-right">Nested in DS</TableHead>
                                    <TableHead className="text-right">Reports</TableHead>
                                    <TableHead className="text-right">Dashboards</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {dataModuleData.map((module, index) => (
                                    <TableRow key={index}>
                                        <TableCell className="font-medium">{module.name}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{module.type}</Badge>
                                        </TableCell>
                                        <TableCell className="text-right">{module.tableCount}</TableCell>
                                        <TableCell className="text-right">{module.columnCount}</TableCell>
                                        <TableCell className="text-right">{module.packageCount}</TableCell>
                                        <TableCell className="text-right">{module.dataSourceCount}</TableCell>
                                        <TableCell className="text-right">{module.nestedInPackage ? "Yes" : "No"}</TableCell>
                                        <TableCell className="text-right">{module.nestedInDataSource ? "Yes" : "No"}</TableCell>
                                        <TableCell className="text-right">{module.reportCount}</TableCell>
                                        <TableCell className="text-right">{module.dashboardCount}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </div>
        </div>
    );
}
