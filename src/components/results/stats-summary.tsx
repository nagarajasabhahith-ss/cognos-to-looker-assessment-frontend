"use client";

import React, { useMemo, useState } from "react";
import { AssessmentStats, ExtractedObject, ObjectRelationship } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Database, GitGraph, AlertTriangle, CheckCircle, Calculator, Layers, Link2, ChevronRight, ChevronDown } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { Badge } from "@/components/ui/badge";

interface StatsSummaryProps {
    stats: AssessmentStats;
    assessmentId?: string;
    objects?: ExtractedObject[];
    relationships?: ObjectRelationship[];
}

const OBJECT_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#a4de6c'];
const RELATIONSHIP_COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899'];

// Normalize type name for matching
const normalizeTypeName = (name: string): string => {
    return name
        .replace(/ObjectType\./g, '')
        .replace(/_/g, ' ')
        .toLowerCase()
        .trim();
};

const getTypeIcon = (type: string) => {
    const typeLower = type.toLowerCase();
    if (typeLower.includes('folder')) return Database;
    if (typeLower.includes('report')) return GitGraph;
    if (typeLower.includes('dashboard')) return GitGraph;
    if (typeLower.includes('data') || typeLower.includes('module')) return Database;
    if (typeLower.includes('visualization')) return GitGraph;
    return Database;
};

interface NestedRelationshipHierarchyProps {
    objects: ExtractedObject[];
    relationships: ObjectRelationship[];
    objectTypeData: Array<{ name: string; value: number }>;
}

function NestedRelationshipHierarchy({ objects, relationships, objectTypeData }: NestedRelationshipHierarchyProps) {
    const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

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

    // Build nested hierarchy structure
    const hierarchyTree = useMemo(() => {
        // Build hierarchy: find root objects (objects that are not targets of CONTAINS relationships)
        const containedObjects = new Set<string>();
        relationships.forEach(rel => {
            if (rel.relationship_type === "contains" || rel.relationship_type === "parent_child") {
                containedObjects.add(rel.target_object_id);
            }
        });

        const rootObjects = objects.filter(obj => !containedObjects.has(obj.id));

        // Build tree structure recursively
        const buildNode = (obj: ExtractedObject, level: number = 0): any => {
            if (level > 5) return null; // Prevent infinite recursion

            const children: any[] = [];
            const outgoingRels = relationshipsBySource.get(obj.id) || [];
            
            outgoingRels.forEach(rel => {
                if (rel.relationship_type === "contains" || rel.relationship_type === "parent_child") {
                    const childObj = objectsMap.get(rel.target_object_id);
                    if (childObj) {
                        const childNode = buildNode(childObj, level + 1);
                        if (childNode) {
                            children.push({
                                ...childNode,
                                relationshipType: rel.relationship_type,
                                relationshipId: rel.id
                            });
                        }
                    }
                }
            });

            return {
                id: obj.id,
                name: obj.name,
                type: obj.object_type,
                typeNormalized: normalizeTypeName(obj.object_type),
                children: children.sort((a, b) => {
                    // Sort by type, then by name
                    if (a.typeNormalized !== b.typeNormalized) {
                        return a.typeNormalized.localeCompare(b.typeNormalized);
                    }
                    return a.name.localeCompare(b.name);
                }),
                level
            };
        };

        // Group root objects by type
        const rootsByType = new Map<string, any[]>();
        rootObjects.forEach(root => {
            const node = buildNode(root);
            if (node && node.children.length > 0) {
                const type = normalizeTypeName(root.object_type);
                if (!rootsByType.has(type)) {
                    rootsByType.set(type, []);
                }
                rootsByType.get(type)!.push(node);
            }
        });

        // Convert to array and sort by type
        return Array.from(rootsByType.entries())
            .map(([type, nodes]) => ({
                type,
                displayName: objectTypeData.find(d => normalizeTypeName(d.name) === type)?.name || type,
                count: nodes.length,
                nodes: nodes.slice(0, 10) // Limit to 10 nodes per type for performance
            }))
            .sort((a, b) => b.count - a.count);
    }, [objects, relationships, objectsMap, relationshipsBySource, objectTypeData]);

    const toggleNode = (nodeId: string) => {
        const newExpanded = new Set(expandedNodes);
        if (newExpanded.has(nodeId)) {
            newExpanded.delete(nodeId);
        } else {
            newExpanded.add(nodeId);
        }
        setExpandedNodes(newExpanded);
    };

    const renderNode = (node: any, depth: number = 0): React.ReactElement => {
        const isExpanded = expandedNodes.has(node.id);
        const hasChildren = node.children && node.children.length > 0;
        const Icon = getTypeIcon(node.type);
        const indent = depth * 24;

        return (
            <div key={node.id} className="select-none">
                <div
                    className="flex items-center gap-2 py-1.5 px-2 hover:bg-muted/50 rounded cursor-pointer group"
                    style={{ marginLeft: `${indent}px` }}
                    onClick={() => hasChildren && toggleNode(node.id)}
                >
                    {hasChildren ? (
                        <div className="w-4 h-4 flex items-center justify-center flex-shrink-0">
                            {isExpanded ? (
                                <ChevronDown className="h-3 w-3 text-muted-foreground" />
                            ) : (
                                <ChevronRight className="h-3 w-3 text-muted-foreground" />
                            )}
                        </div>
                    ) : (
                        <div className="w-4 h-4" />
                    )}
                    <Icon className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                    <span className="text-sm flex-1 truncate" title={node.name}>
                        {node.name}
                    </span>
                    <Badge variant="outline" className="text-xs">
                        {normalizeTypeName(node.type).replace(/\b\w/g, (l: string) => l.toUpperCase())}
                    </Badge>
                    {hasChildren && (
                        <Badge variant="secondary" className="text-xs ml-2">
                            {node.children.length}
                        </Badge>
                    )}
                </div>
                {hasChildren && isExpanded && (
                    <div className="ml-4 border-l-2 border-muted/30">
                        {node.children.map((child: any) => renderNode(child, depth + 1))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="border rounded-md p-4 max-h-[600px] overflow-y-auto bg-muted/20">
            {hierarchyTree.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                    No nested relationships found
                </div>
            ) : (
                <div className="space-y-4">
                    {hierarchyTree.map((typeGroup) => (
                        <div key={typeGroup.type} className="space-y-2">
                            <div className="flex items-center gap-2 pb-2 border-b">
                                <Database className="h-4 w-4 text-muted-foreground" />
                                <span className="font-semibold text-sm capitalize">
                                    {typeGroup.displayName}
                                </span>
                                <Badge variant="secondary" className="text-xs">
                                    {typeGroup.count} {typeGroup.count === 1 ? 'root' : 'roots'}
                                </Badge>
                            </div>
                            <div className="space-y-1">
                                {typeGroup.nodes.map((node: any) => renderNode(node, 0))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export function StatsSummary({ stats, assessmentId, objects = [], relationships = [] }: StatsSummaryProps) {
    const objectTypeData = useMemo(() => {
        return Object.entries(stats.objects_by_type).map(([name, value]) => ({
            name: name.replace(/_/g, ' ').replace('ObjectType.', ''),
            value
        })).sort((a, b) => b.value - a.value);
    }, [stats.objects_by_type]);

    const relationshipTypeData = useMemo(() => {
        return Object.entries(stats.relationships_by_type || {}).map(([name, value]) => ({
            name: name.replace(/_/g, ' '),
            value
        })).sort((a, b) => b.value - a.value);
    }, [stats.relationships_by_type]);

    // Extract semantic layer counts
    const measureCount = stats.objects_by_type['measure'] || stats.objects_by_type['ObjectType.MEASURE'] || 0;
    const dimensionCount = stats.objects_by_type['dimension'] || stats.objects_by_type['ObjectType.DIMENSION'] || 0;
    const calcFieldCount = stats.objects_by_type['calculated_field'] || stats.objects_by_type['ObjectType.CALCULATED_FIELD'] || 0;
    const joinsCount = stats.relationships_by_type?.['joins_to'] || 0;

    return (
        <div className="space-y-6">
            {/* Primary Stats Row */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Objects</CardTitle>
                        <Database className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.total_objects.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">Extracted from {stats.total_files} files</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Relationships</CardTitle>
                        <GitGraph className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.total_relationships.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">Dependencies mapped</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Parse Success</CardTitle>
                        <CheckCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.parse_success_rate}%</div>
                        <p className="text-xs text-muted-foreground">File processing rate</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Parse Errors</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.total_errors}</div>
                        <p className="text-xs text-muted-foreground">Issues encountered</p>
                    </CardContent>
                </Card>
            </div>

            {/* Semantic Layer Stats Row */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="border-blue-200 dark:border-blue-900">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Measures</CardTitle>
                        <Calculator className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{measureCount}</div>
                        <p className="text-xs text-muted-foreground">Aggregated metrics</p>
                    </CardContent>
                </Card>
                <Card className="border-green-200 dark:border-green-900">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Dimensions</CardTitle>
                        <Layers className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600 dark:text-green-400">{dimensionCount}</div>
                        <p className="text-xs text-muted-foreground">Categorical attributes</p>
                    </CardContent>
                </Card>
                <Card className="border-amber-200 dark:border-amber-900">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Calculated Fields</CardTitle>
                        <Calculator className="h-4 w-4 text-amber-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{calcFieldCount}</div>
                        <p className="text-xs text-muted-foreground">Custom expressions</p>
                    </CardContent>
                </Card>
                <Card className="border-purple-200 dark:border-purple-900">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Table Joins</CardTitle>
                        <Link2 className="h-4 w-4 text-purple-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{joinsCount}</div>
                        <p className="text-xs text-muted-foreground">Join relationships</p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Row */}
            <div className="grid gap-4 md:grid-cols-2">
                {/* Object Types Pie Chart */}
                <Card className="col-span-1">
                    <CardHeader>
                        <CardTitle>Object Types Distribution</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={objectTypeData.slice(0, 8)}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                >
                                    {objectTypeData.slice(0, 8).map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={OBJECT_COLORS[index % OBJECT_COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Relationship Types Bar Chart */}
                <Card className="col-span-1">
                    <CardHeader>
                        <CardTitle>Relationships by Type</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        {relationshipTypeData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={relationshipTypeData} layout="vertical" margin={{ left: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis type="number" />
                                    <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
                                    <Tooltip />
                                    <Bar dataKey="value" fill="#6366f1" radius={[0, 4, 4, 0]}>
                                        {relationshipTypeData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={RELATIONSHIP_COLORS[index % RELATIONSHIP_COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-full text-muted-foreground">
                                No relationship data available
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Object Types Breakdown List */}
            <Card>
                <CardHeader>
                    <CardTitle>Extracted Objects by Type</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                        {objectTypeData.length > 0 ? (
                            objectTypeData.map((item, index) => (
                                <div key={item.name} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="w-3 h-3 rounded-sm flex-shrink-0"
                                            style={{ backgroundColor: OBJECT_COLORS[index % OBJECT_COLORS.length] }}
                                        />
                                        <span className="capitalize text-sm font-medium">{item.name}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-bold">{item.value.toLocaleString()}</span>
                                        <span className="text-xs text-muted-foreground">
                                            ({((item.value / stats.total_objects) * 100).toFixed(1)}%)
                                        </span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="col-span-full flex items-center justify-center h-24 text-muted-foreground">
                                No objects extracted yet
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Extracted Objects by Type relationships hierarchy */}
            {objects.length > 0 && relationships.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Object Types Relationship Hierarchy</CardTitle>
                        <CardDescription>
                            Tree view showing how object types relate to each other through relationships
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ObjectTypeHierarchyTree 
                            objects={objects} 
                            relationships={relationships}
                            objectTypeData={objectTypeData}
                        />
                    </CardContent>
                </Card>
            )}
            
            {/* Extracted Objects by Type relationships nested hierarchy */}
            {objects.length > 0 && relationships.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Nested Relationship Hierarchy</CardTitle>
                        <CardDescription>
                            Deep hierarchical view showing multi-level relationships between objects
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <NestedRelationshipHierarchy 
                            objects={objects} 
                            relationships={relationships}
                            objectTypeData={objectTypeData}
                        />
                    </CardContent>
                </Card>
            )}

            {/* Extracted Objects by Type relationships nested hierarchy (by source and target) for each object type */}
            {objects.length > 0 && relationships.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Relationships by Type (Source &amp; Target)</CardTitle>
                        <CardDescription>
                            For each object type, view outgoing relationships (as source) and incoming relationships (as target)
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <SourceTargetHierarchyByType
                            objects={objects}
                            relationships={relationships}
                            objectTypeData={objectTypeData}
                        />
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

interface ObjectTypeHierarchyTreeProps {
    objects: ExtractedObject[];
    relationships: ObjectRelationship[];
    objectTypeData: Array<{ name: string; value: number }>;
}

function ObjectTypeHierarchyTree({ objects, relationships, objectTypeData }: ObjectTypeHierarchyTreeProps) {
    const [expandedTypes, setExpandedTypes] = useState<Set<string>>(new Set());

    // Build object map for quick lookup
    const objectsMap = useMemo(() => {
        const map = new Map<string, ExtractedObject>();
        objects.forEach(obj => map.set(obj.id, obj));
        return map;
    }, [objects]);

    // Build relationships map: type -> related types
    // This includes all relationship types including has_column (table -> column)
    const typeRelationships = useMemo(() => {
        const typeMap = new Map<string, Map<string, number>>(); // sourceType -> { targetType -> count }

        relationships.forEach(rel => {
            const sourceObj = objectsMap.get(rel.source_object_id);
            const targetObj = objectsMap.get(rel.target_object_id);
            
            if (sourceObj && targetObj) {
                const sourceType = normalizeTypeName(sourceObj.object_type);
                const targetType = normalizeTypeName(targetObj.object_type);
                
                // Skip self-references (same type to same type)
                if (sourceType === targetType) return;
                
                if (!typeMap.has(sourceType)) {
                    typeMap.set(sourceType, new Map());
                }
                
                const targetMap = typeMap.get(sourceType)!;
                targetMap.set(targetType, (targetMap.get(targetType) || 0) + 1);
            }
        });

        return typeMap;
    }, [relationships, objectsMap]);

    // Build tree structure: group by object type, then show relationships
    const typeTree = useMemo(() => {
        const tree: Array<{
            type: string;
            count: number;
            relatedTypes: Array<{ type: string; count: number; relCount: number }>;
        }> = [];

        objectTypeData.forEach(({ name, value }) => {
            const typeKey = normalizeTypeName(name);
            const relatedTypesMap = typeRelationships.get(typeKey) || new Map();
            
            const relatedTypes = Array.from(relatedTypesMap.entries())
                .map(([relatedTypeKey, relCount]): { type: string; count: number; relCount: number } => {
                    // Find the display name and count for this related type
                    const relatedTypeData = objectTypeData.find(
                        dt => normalizeTypeName(dt.name) === relatedTypeKey
                    );
                    // If not found in objectTypeData, try to find a display name from objects
                    let displayName = relatedTypeData?.name;
                    if (!displayName && objects.length > 0) {
                        const sampleObj = objects.find(
                            obj => normalizeTypeName(obj.object_type) === relatedTypeKey
                        );
                        if (sampleObj) {
                            displayName = sampleObj.object_type.replace(/_/g, ' ').replace(/ObjectType\./g, '');
                        }
                    }
                    // Fallback: format the key as a readable name
                    const finalDisplayName: string = displayName ?? relatedTypeKey
                        .replace(/_/g, ' ')
                        .replace(/\b\w/g, (l: string) => l.toUpperCase());
                    
                    return {
                        type: finalDisplayName,
                        count: relatedTypeData?.value || 0,
                        relCount: Number(relCount)
                    };
                })
                .sort((a, b) => b.relCount - a.relCount);

            tree.push({
                type: name,
                count: value,
                relatedTypes
            });
        });

        return tree.sort((a, b) => b.count - a.count);
    }, [objectTypeData, typeRelationships, objects]);

    const toggleType = (type: string) => {
        const newExpanded = new Set(expandedTypes);
        if (newExpanded.has(type)) {
            newExpanded.delete(type);
        } else {
            newExpanded.add(type);
        }
        setExpandedTypes(newExpanded);
    };

    const getTypeIcon = (type: string) => {
        const typeLower = type.toLowerCase();
        if (typeLower.includes('folder')) return Database;
        if (typeLower.includes('report')) return GitGraph;
        if (typeLower.includes('dashboard')) return GitGraph;
        if (typeLower.includes('data') || typeLower.includes('module')) return Database;
        if (typeLower.includes('visualization')) return GitGraph;
        return Database;
    };

    return (
        <div className="border rounded-md p-4 max-h-[600px] overflow-y-auto bg-muted/20">
            {typeTree.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                    No object type relationships found
                </div>
            ) : (
                <div className="space-y-1">
                    {typeTree.map((typeNode) => {
                        const Icon = getTypeIcon(typeNode.type);
                        const isExpanded = expandedTypes.has(typeNode.type);
                        const hasRelations = typeNode.relatedTypes.length > 0;

                        return (
                            <div key={typeNode.type} className="select-none">
                                <div
                                    className="flex items-center gap-2 py-2 px-3 hover:bg-muted/50 rounded cursor-pointer group"
                                    onClick={() => hasRelations && toggleType(typeNode.type)}
                                >
                                    {hasRelations ? (
                                        <div className="w-4 h-4 flex items-center justify-center flex-shrink-0">
                                            {isExpanded ? (
                                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                            ) : (
                                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                            )}
                                        </div>
                                    ) : (
                                        <div className="w-4 h-4" />
                                    )}
                                    <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                    <span className="font-medium text-sm flex-1 capitalize">
                                        {typeNode.type}
                                    </span>
                                    <Badge variant="secondary" className="text-xs">
                                        {typeNode.count}
                                    </Badge>
                                    {hasRelations && (
                                        <Badge variant="outline" className="text-xs ml-2">
                                            {typeNode.relatedTypes.length} related
                                        </Badge>
                                    )}
                                </div>
                                {hasRelations && isExpanded && (
                                    <div className="ml-8 space-y-1 border-l-2 border-muted pl-4 mt-1">
                                        {typeNode.relatedTypes.map((related) => {
                                            const RelatedIcon = getTypeIcon(related.type);
                                            return (
                                                <div
                                                    key={related.type}
                                                    className="flex items-center gap-2 py-1.5 px-2 hover:bg-muted/30 rounded text-sm"
                                                >
                                                    <Link2 className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                                                    <RelatedIcon className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                                                    <span className="flex-1 capitalize text-muted-foreground">
                                                        {related.type}
                                                    </span>
                                                    <span className="text-xs text-muted-foreground">
                                                        {related.relCount} {related.relCount === 1 ? 'link' : 'links'}
                                                    </span>
                                                    <Badge variant="outline" className="text-xs ml-2">
                                                        {related.count}
                                                    </Badge>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

interface SourceTargetHierarchyByTypeProps {
    objects: ExtractedObject[];
    relationships: ObjectRelationship[];
    objectTypeData: Array<{ name: string; value: number }>;
}

function SourceTargetHierarchyByType({ objects, relationships, objectTypeData }: SourceTargetHierarchyByTypeProps) {
    const [expandedTypes, setExpandedTypes] = useState<Set<string>>(new Set());

    const objectsMap = useMemo(() => {
        const map = new Map<string, ExtractedObject>();
        objects.forEach(obj => map.set(obj.id, obj));
        return map;
    }, [objects]);

    // For each object type: { asSource: [{ relationshipType, targetType, count }], asTarget: [{ relationshipType, sourceType, count }] }
    const typeBreakdown = useMemo(() => {
        const byType = new Map<string, {
            asSource: Array<{ relationshipType: string; targetType: string; count: number }>;
            asTarget: Array<{ relationshipType: string; sourceType: string; count: number }>;
        }>();

        const ensureType = (typeKey: string) => {
            if (!byType.has(typeKey)) {
                byType.set(typeKey, { asSource: [], asTarget: [] });
            }
            return byType.get(typeKey)!;
        };

        const mergeAsSource = (typeKey: string, relationshipType: string, targetType: string) => {
            const entry = ensureType(typeKey);
            const existing = entry.asSource.find(
                (r) => r.relationshipType === relationshipType && r.targetType === targetType
            );
            if (existing) existing.count++;
            else entry.asSource.push({ relationshipType, targetType, count: 1 });
        };

        const mergeAsTarget = (typeKey: string, relationshipType: string, sourceType: string) => {
            const entry = ensureType(typeKey);
            const existing = entry.asTarget.find(
                (r) => r.relationshipType === relationshipType && r.sourceType === sourceType
            );
            if (existing) existing.count++;
            else entry.asTarget.push({ relationshipType, sourceType, count: 1 });
        };

        relationships.forEach((rel) => {
            const sourceObj = objectsMap.get(rel.source_object_id);
            const targetObj = objectsMap.get(rel.target_object_id);
            if (!sourceObj || !targetObj) return;

            const sourceTypeKey = normalizeTypeName(sourceObj.object_type);
            const targetTypeKey = normalizeTypeName(targetObj.object_type);

            const targetDisplay = objectTypeData.find((d) => normalizeTypeName(d.name) === targetTypeKey)?.name
                ?? targetTypeKey.replace(/\b\w/g, (l: string) => l.toUpperCase());
            const sourceDisplay = objectTypeData.find((d) => normalizeTypeName(d.name) === sourceTypeKey)?.name
                ?? sourceTypeKey.replace(/\b\w/g, (l: string) => l.toUpperCase());

            mergeAsSource(sourceTypeKey, rel.relationship_type, targetDisplay);
            mergeAsTarget(targetTypeKey, rel.relationship_type, sourceDisplay);
        });

        // Sort and return array aligned with objectTypeData
        return objectTypeData.map(({ name, value }) => {
            const typeKey = normalizeTypeName(name);
            const data = byType.get(typeKey) ?? { asSource: [], asTarget: [] };
            return {
                type: name,
                count: value,
                asSource: data.asSource.sort((a, b) => b.count - a.count),
                asTarget: data.asTarget.sort((a, b) => b.count - a.count),
            };
        }).filter((row) => row.asSource.length > 0 || row.asTarget.length > 0);
    }, [objectsMap, relationships, objectTypeData]);

    const toggleType = (type: string) => {
        setExpandedTypes((prev) => {
            const next = new Set(prev);
            if (next.has(type)) next.delete(type);
            else next.add(type);
            return next;
        });
    };

    if (typeBreakdown.length === 0) {
        return (
            <div className="border rounded-md p-4 max-h-[600px] overflow-y-auto bg-muted/20">
                <div className="text-center py-8 text-muted-foreground">
                    No source/target relationship breakdown by type
                </div>
            </div>
        );
    }

    return (
        <div className="border rounded-md p-4 max-h-[600px] overflow-y-auto bg-muted/20">
            <div className="space-y-1">
                {typeBreakdown.map((row) => {
                    const Icon = getTypeIcon(row.type);
                    const isExpanded = expandedTypes.has(row.type);
                    const hasAny = row.asSource.length > 0 || row.asTarget.length > 0;

                    return (
                        <div key={row.type} className="select-none">
                            <div
                                className="flex items-center gap-2 py-2 px-3 hover:bg-muted/50 rounded cursor-pointer group"
                                onClick={() => hasAny && toggleType(row.type)}
                            >
                                {hasAny ? (
                                    <div className="w-4 h-4 flex items-center justify-center flex-shrink-0">
                                        {isExpanded ? (
                                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                        ) : (
                                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                        )}
                                    </div>
                                ) : (
                                    <div className="w-4 h-4" />
                                )}
                                <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                <span className="font-medium text-sm flex-1 capitalize">{row.type}</span>
                                <Badge variant="secondary" className="text-xs">
                                    {row.count}
                                </Badge>
                                {hasAny && (
                                    <Badge variant="outline" className="text-xs ml-2">
                                        {row.asSource.length} out · {row.asTarget.length} in
                                    </Badge>
                                )}
                            </div>
                            {hasAny && isExpanded && (
                                <div className="ml-8 space-y-4 border-l-2 border-muted pl-4 mt-1 pb-2">
                                    {row.asSource.length > 0 && (
                                        <div>
                                            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-2">
                                                <span>As source</span>
                                                <Badge variant="outline" className="text-xs">{row.asSource.length}</Badge>
                                            </div>
                                            <div className="space-y-1">
                                                {row.asSource.map((r, i) => (
                                                    <div
                                                        key={`src-${i}`}
                                                        className="flex items-center gap-2 py-1.5 px-2 hover:bg-muted/30 rounded text-sm"
                                                    >
                                                        <Link2 className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                                                        <span className="text-xs font-mono text-muted-foreground">{r.relationshipType}</span>
                                                        <ChevronRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                                                        <span className="flex-1 capitalize">{r.targetType}</span>
                                                        <Badge variant="outline" className="text-xs">{r.count}</Badge>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {row.asTarget.length > 0 && (
                                        <div>
                                            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-2">
                                                <span>As target</span>
                                                <Badge variant="outline" className="text-xs">{row.asTarget.length}</Badge>
                                            </div>
                                            <div className="space-y-1">
                                                {row.asTarget.map((r, i) => (
                                                    <div
                                                        key={`tgt-${i}`}
                                                        className="flex items-center gap-2 py-1.5 px-2 hover:bg-muted/30 rounded text-sm"
                                                    >
                                                        <Link2 className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                                                        <span className="text-xs font-mono text-muted-foreground">{r.relationshipType}</span>
                                                        <ChevronRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                                                        <span className="flex-1 capitalize">{r.sourceType}</span>
                                                        <Badge variant="outline" className="text-xs">{r.count}</Badge>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

