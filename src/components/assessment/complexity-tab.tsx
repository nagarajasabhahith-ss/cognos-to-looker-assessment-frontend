"use client";

import { useState } from "react";
import { Assessment, ExtractedObject } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ComplexityView } from "@/components/complexity/complexity-view";
import { FileBarChart, Loader2, CheckCircle, AlertTriangle } from "lucide-react";

interface ComplexityTabProps {
    assessment: Assessment;
    objects: ExtractedObject[];
    onGenerate: () => Promise<void>;
}

export function ComplexityTab({ assessment, objects, onGenerate }: ComplexityTabProps) {
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const handleGenerate = async () => {
        setIsGenerating(true);
        setError(null);
        setSuccess(null);
        
        try {
            await onGenerate();
            setSuccess("Complexity report generated successfully!");
            setTimeout(() => setSuccess(null), 5000);
        } catch (err: any) {
            const errorMessage = err.response?.data?.detail || err.message || "Failed to generate complexity report";
            setError(errorMessage);
            setTimeout(() => setError(null), 5000);
        } finally {
            setIsGenerating(false);
        }
    };

    const hasComplexityData = objects.some(
        o => o.complexity_score_looker !== null || o.complexity_score_custom !== null
    );

    return (
        <div className="space-y-6">
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    <span>{error}</span>
                </div>
            )}
            
            {success && (
                <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-md flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    <span>{success}</span>
                </div>
            )}

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Complexity Analysis</CardTitle>
                            <CardDescription>
                                Analyze the complexity of your BI objects for migration planning
                            </CardDescription>
                        </div>
                        {!hasComplexityData && (
                            <Button
                                onClick={handleGenerate}
                                disabled={isGenerating}
                                className="flex items-center gap-2"
                            >
                                {isGenerating ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Generating...
                                    </>
                                ) : (
                                    <>
                                        <FileBarChart className="h-4 w-4" />
                                        Generate Report
                                    </>
                                )}
                            </Button>
                        )}
                    </div>
                </CardHeader>
                <CardContent>
                    {hasComplexityData ? (
                        <ComplexityView assessmentId={assessment.id} objects={objects} />
                    ) : (
                        <div className="text-center py-8 text-muted-foreground">
                            <FileBarChart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>No complexity data available. Generate a complexity report to get started.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
