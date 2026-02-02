"use client";

import { useState } from "react";
import { Assessment, AssessmentStatus, UploadedFile } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { FileUpload } from "@/components/assessment/file-upload";
import { FileList } from "@/components/assessment/file-list";
import { Play, Loader2, RefreshCw, CheckCircle, AlertTriangle, Clock } from "lucide-react";

interface OverviewTabProps {
    assessment: Assessment;
    files: UploadedFile[];
    isRunning: boolean;
    isRefreshing: boolean;
    onRunAnalysis: () => void;
    onRefresh: () => void;
    onFileUpdate: () => void;
}

export function OverviewTab({
    assessment,
    files,
    isRunning,
    isRefreshing,
    onRunAnalysis,
    onRefresh,
    onFileUpdate,
}: OverviewTabProps) {
    const getStatusBadge = (status: AssessmentStatus) => {
        switch (status) {
            case AssessmentStatus.COMPLETED:
                return (
                    <Badge variant="default" className="bg-green-500">
                        <CheckCircle className="mr-1 h-3 w-3" />
                        Completed
                    </Badge>
                );
            case AssessmentStatus.RUNNING:
                return (
                    <Badge variant="default" className="bg-blue-500">
                        <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                        Running
                    </Badge>
                );
            case AssessmentStatus.FAILED:
                return (
                    <Badge variant="destructive">
                        <AlertTriangle className="mr-1 h-3 w-3" />
                        Failed
                    </Badge>
                );
            default:
                return (
                    <Badge variant="secondary">
                        <Clock className="mr-1 h-3 w-3" />
                        Pending
                    </Badge>
                );
        }
    };

    return (
        <div className="space-y-6">
            {/* Assessment Info */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>{assessment.name}</CardTitle>
                            <CardDescription className="mt-1">
                                Created {new Date(assessment.created_at).toLocaleDateString()}
                            </CardDescription>
                        </div>
                        {getStatusBadge(assessment.status)}
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {assessment.description && (
                            <div>
                                <p className="text-sm text-muted-foreground">{assessment.description}</p>
                            </div>
                        )}
                        
                        <Separator />
                        
                        <div className="flex items-center gap-4">
                            <Button
                                onClick={onRunAnalysis}
                                disabled={isRunning || assessment.status === AssessmentStatus.RUNNING || files.length === 0}
                                className="flex items-center gap-2"
                            >
                                {isRunning ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Running...
                                    </>
                                ) : (
                                    <>
                                        <Play className="h-4 w-4" />
                                        Run Analysis
                                    </>
                                )}
                            </Button>
                            
                            <Button
                                variant="outline"
                                onClick={onRefresh}
                                disabled={isRefreshing}
                                className="flex items-center gap-2"
                            >
                                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                                Refresh
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* File Upload */}
            <Card>
                <CardHeader>
                    <CardTitle>Upload Files</CardTitle>
                    <CardDescription>
                        Upload your Cognos export files to begin analysis
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <FileUpload assessmentId={assessment.id} onUploadComplete={onFileUpdate} />
                </CardContent>
            </Card>

            {/* File List */}
            <Card>
                <CardHeader>
                    <CardTitle>Uploaded Files</CardTitle>
                    <CardDescription>
                        {files.length === 0 
                            ? "No files uploaded yet"
                            : `${files.length} file${files.length > 1 ? 's' : ''} uploaded`
                        }
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <FileList 
                        files={files} 
                        assessmentId={assessment.id} 
                        onUpdate={onFileUpdate}
                    />
                </CardContent>
            </Card>
        </div>
    );
}
