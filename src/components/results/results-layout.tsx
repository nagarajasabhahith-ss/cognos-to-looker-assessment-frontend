"use client";

import { useState, useEffect, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Loader2, Table2, Network, Database, GitGraph, AlertTriangle } from "lucide-react";
import { assessmentApi, AssessmentStats, ExtractedObject, ObjectRelationship, ParseError } from "@/lib/api";

import { StatsSummary } from "./stats-summary";
import { ObjectsTable } from "./objects-table";
import { ObjectDetailsPanel } from "./object-details-panel";
import { RelationshipsTable } from "./relationships-table";
import { DependencyGraph } from "./dependency-graph";
import { ErrorsTable } from "./errors-table";
import { DataModelView } from "./data-model-view";

interface ResultsLayoutProps {
    assessmentId: string;
}

type ViewMode = "table" | "graph";

export function ResultsLayout({ assessmentId }: ResultsLayoutProps) {
    const [stats, setStats] = useState<AssessmentStats | null>(null);
    const [objects, setObjects] = useState<ExtractedObject[]>([]);
    const [relationships, setRelationships] = useState<ObjectRelationship[]>([]);
    const [errors, setErrors] = useState<ParseError[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [viewMode, setViewMode] = useState<ViewMode>("table");
    const [selectedObject, setSelectedObject] = useState<ExtractedObject | null>(null);
    const [detailsOpen, setDetailsOpen] = useState(false);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [statsRes, objectsRes, relationshipsRes, errorsRes] = await Promise.all([
                assessmentApi.getStats(assessmentId),
                assessmentApi.getObjects(assessmentId, { limit: 500 }),
                assessmentApi.getRelationships(assessmentId, { limit: 1000 }),
                assessmentApi.getErrors(assessmentId, { limit: 200 }),
            ]);
            setStats(statsRes.data);
            setObjects(objectsRes.data);
            setRelationships(relationshipsRes.data);
            setErrors(errorsRes.data);
        } catch (error) {
            console.error("Failed to fetch results data", error);
        } finally {
            setIsLoading(false);
        }
    }, [assessmentId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleObjectClick = (object: ExtractedObject) => {
        setSelectedObject(object);
        setDetailsOpen(true);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!stats) {
        return (
            <div className="text-center py-12 text-muted-foreground">
                Failed to load results data.
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <StatsSummary stats={stats} />

            <Tabs defaultValue="objects" className="space-y-4">
                <div className="flex items-center justify-between">
                    <TabsList>
                        <TabsTrigger value="objects" className="gap-2">
                            <Database className="h-4 w-4" />
                            Objects ({stats.total_objects})
                        </TabsTrigger>
                        <TabsTrigger value="data-model" className="gap-2">
                            <Table2 className="h-4 w-4" />
                            Data Model
                        </TabsTrigger>
                        <TabsTrigger value="relationships" className="gap-2">
                            <GitGraph className="h-4 w-4" />
                            Relationships ({stats.total_relationships})
                        </TabsTrigger>
                        <TabsTrigger value="errors" className="gap-2">
                            <AlertTriangle className="h-4 w-4" />
                            Errors ({stats.total_errors})
                        </TabsTrigger>
                    </TabsList>

                    <ToggleGroup
                        type="single"
                        value={viewMode}
                        onValueChange={(value) => value && setViewMode(value as ViewMode)}
                        className="border rounded-md"
                    >
                        <ToggleGroupItem value="table" aria-label="Table view">
                            <Table2 className="h-4 w-4" />
                        </ToggleGroupItem>
                        <ToggleGroupItem value="graph" aria-label="Graph view">
                            <Network className="h-4 w-4" />
                        </ToggleGroupItem>
                    </ToggleGroup>
                </div>

                <TabsContent value="objects">
                    <Card>
                        <CardHeader>
                            <CardTitle>Extracted Objects</CardTitle>
                            <CardDescription>
                                All objects parsed from the source files. Click on a row to view details.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {viewMode === "table" ? (
                                <ObjectsTable data={objects} onObjectClick={handleObjectClick} />
                            ) : (
                                <DependencyGraph
                                    objects={objects}
                                    relationships={relationships}
                                    onNodeClick={handleObjectClick}
                                />
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="relationships">
                    <Card>
                        <CardHeader>
                            <CardTitle>Object Relationships</CardTitle>
                            <CardDescription>
                                Dependencies and connections between extracted objects.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {viewMode === "table" ? (
                                <RelationshipsTable data={relationships} objects={objects} />
                            ) : (
                                <DependencyGraph
                                    objects={objects}
                                    relationships={relationships}
                                    onNodeClick={handleObjectClick}
                                />
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="data-model">
                    <Card>
                        <CardHeader>
                            <CardTitle>Data Model</CardTitle>
                            <CardDescription>
                                Explore the semantic layer extracted from Cognos, including tables, columns, calculated fields, and filters.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <DataModelView
                                objects={objects}
                                relationships={relationships}
                                onObjectClick={handleObjectClick}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="errors">
                    <Card>
                        <CardHeader>
                            <CardTitle>Parse Errors</CardTitle>
                            <CardDescription>
                                Issues encountered during file parsing.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ErrorsTable data={errors} />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            <ObjectDetailsPanel
                object={selectedObject}
                open={detailsOpen}
                onOpenChange={setDetailsOpen}
            />
        </div>
    );
}
