"use client";

import { useState, useEffect, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Database } from "lucide-react";
import { assessmentApi, AssessmentStats, ExtractedObject, ObjectRelationship } from "@/lib/api";

import { StatsSummary } from "./stats-summary";

interface ResultsLayoutProps {
    assessmentId: string;
}

export function ResultsLayout({ assessmentId }: ResultsLayoutProps) {
    const [stats, setStats] = useState<AssessmentStats | null>(null);
    const [objects, setObjects] = useState<ExtractedObject[]>([]);
    const [relationships, setRelationships] = useState<ObjectRelationship[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const statsRes = await assessmentApi.getStats(assessmentId);
            const stats = statsRes.data;
            setStats(stats);
            
            // Fetch all objects using pagination
            const allObjects: ExtractedObject[] = [];
            let skip = 0;
            const limit = 1000;
            const maxSkip = (stats.total_objects || 0) + limit * 2; // Safety: don't exceed expected total + buffer
            let hasMore = true;
            let iterations = 0;
            const maxIterations = 100; // Hard limit to prevent infinite loops

            while (hasMore && iterations < maxIterations && skip < maxSkip) {
                iterations++;
                const objectsRes = await assessmentApi.getObjects(assessmentId, { skip, limit });
                const fetchedObjects = objectsRes.data;
                
                // Safety check: if we get 0 results, stop
                if (fetchedObjects.length === 0) {
                    hasMore = false;
                    break;
                }
                
                allObjects.push(...fetchedObjects);
                
                // Stop if we've fetched all objects or got fewer than requested
                if (fetchedObjects.length < limit || allObjects.length >= (stats.total_objects || 0)) {
                    hasMore = false;
                } else {
                    skip += limit;
                }
            }
            setObjects(allObjects);

            // Fetch relationships - API has max limit of 5000 (backend validation)
            // If we need more, we'd need backend pagination support
            const relationshipsLimit = Math.min(stats.total_relationships || 5000, 5000);
            const relationshipsRes = await assessmentApi.getRelationships(assessmentId, { limit: relationshipsLimit });
            setRelationships(relationshipsRes.data);
        } catch (error) {
            console.error("Failed to fetch results data", error);
        } finally {
            setIsLoading(false);
        }
    }, [assessmentId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

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
            <Tabs defaultValue="overview" className="space-y-4">
                <div className="flex items-center justify-between">
                    <TabsList>
                        <TabsTrigger value="overview" className="gap-2">
                            <Database className="h-4 w-4" />
                            Overview & Files
                        </TabsTrigger>
                    </TabsList>
                </div>

                {/* TAB 1: OVERVIEW & FILES */}
                <TabsContent value="overview" className="space-y-6">
                    <StatsSummary 
                        stats={stats} 
                        assessmentId={assessmentId}
                        objects={objects}
                        relationships={relationships}
                    />
                </TabsContent>
            </Tabs>
        </div>
    );
}
