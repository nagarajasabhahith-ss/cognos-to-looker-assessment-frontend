"use client";

import { useEffect, useState, useCallback, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { api, Assessment, AssessmentStatus, UploadedFile } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Play, FileText, Database, GitGraph, Loader2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileUpload } from "@/components/assessment/file-upload";
import { FileList } from "@/components/assessment/file-list";
import { ResultsLayout } from "@/components/results";

export default function AssessmentDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { user, isLoading: isAuthLoading } = useAuth();
    const router = useRouter();
    const [assessment, setAssessment] = useState<Assessment | null>(null);
    const [files, setFiles] = useState<UploadedFile[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRunning, setIsRunning] = useState(false);

    // Unwrap params using React.use()
    const resolvedParams = use(params);
    const id = resolvedParams.id;

    const fetchAssessment = useCallback(async () => {
        try {
            const [assessmentRes, filesRes] = await Promise.all([
                api.get<Assessment>(`/assessments/${id}`),
                api.get<UploadedFile[]>(`/assessments/${id}/files`)
            ]);
            setAssessment(assessmentRes.data);
            setFiles(filesRes.data);
        } catch (error) {
            console.error("Failed to fetch assessment data", error);
            // router.push("/dashboard"); 
        } finally {
            setIsLoading(false);
        }
    }, [id]);

    useEffect(() => {
        if (!isAuthLoading && !user) {
            router.push("/");
        }
    }, [isAuthLoading, user, router]);

    useEffect(() => {
        if (user && id) {
            fetchAssessment();
        }
    }, [user, id, fetchAssessment]);

    const handleAssessmentUpdate = () => {
        fetchAssessment();
    }

    const handleRunAnalysis = async () => {
        if (!assessment) return;
        setIsRunning(true);
        try {
            await api.post(`/assessments/${assessment.id}/run`);
            // Poll for updates or just reload for MVP 
            fetchAssessment();
        } catch (error) {
            console.error("Failed to run analysis", error);
        } finally {
            setIsRunning(false);
        }
    }

    if (isAuthLoading || isLoading) {
        return (
            <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    if (!assessment) {
        return (
            <div className="container py-8">
                <div className="flex flex-col items-center justify-center space-y-4">
                    <h1 className="text-2xl font-bold">Assessment Not Found</h1>
                    <Button asChild>
                        <Link href="/dashboard">Return to Dashboard</Link>
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div className="container py-8 space-y-8">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-muted-foreground mb-2">
                        <Link href="/dashboard" className="hover:text-foreground">Dashboard</Link>
                        <span>/</span>
                        <span>Assessment Details</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-bold tracking-tight">{assessment.name}</h1>
                        <Badge variant={assessment.status === AssessmentStatus.COMPLETED ? "default" : "secondary"}>
                            {assessment.status}
                        </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="capitalize">Source: {assessment.bi_tool}</span>
                        <span>•</span>
                        <span>Created: {new Date(assessment.created_at).toLocaleDateString()}</span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={fetchAssessment} title="Refresh">
                        Refresh
                    </Button>
                    {assessment.status !== AssessmentStatus.COMPLETED && assessment.status !== AssessmentStatus.PROCESSING && (
                        <Button onClick={handleRunAnalysis} disabled={isRunning || assessment.files_count === 0}>
                            {isRunning && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {!isRunning && <Play className="mr-2 h-4 w-4" />}
                            Run Analysis
                        </Button>
                    )}
                </div>
            </div>

            <Separator />

            <Tabs defaultValue="overview" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="overview">Overview & Files</TabsTrigger>
                    <TabsTrigger value="results" disabled={assessment.status !== AssessmentStatus.COMPLETED}>Results & Visualization</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Files</CardTitle>
                                <FileText className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{assessment.files_count}</div>
                                <p className="text-xs text-muted-foreground">Uploaded source files</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Objects Detected</CardTitle>
                                <Database className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{assessment.objects_count}</div>
                                <p className="text-xs text-muted-foreground">Reports, Tables, etc.</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Relationships</CardTitle>
                                <GitGraph className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{assessment.relationships_count}</div>
                                <p className="text-xs text-muted-foreground">Lineage connections</p>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Source Files</CardTitle>
                                <CardDescription>Upload your Cognos export files (.zip, .xml) here.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <FileUpload assessmentId={assessment.id} onUploadComplete={handleAssessmentUpdate} />
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle>Uploaded Files</CardTitle>
                                <CardDescription>Files currently attached to this assessment.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <FileList files={files.map(f => f.filename)} />
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="results">
                    <ResultsLayout assessmentId={assessment.id} />
                </TabsContent>
            </Tabs>
        </div>
    );
}
