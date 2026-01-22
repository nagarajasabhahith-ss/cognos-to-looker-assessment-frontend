"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { api, Assessment, AssessmentListResponse, AssessmentStatus } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, MoreHorizontal, FileText, Loader2, Database } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function DashboardPage() {
    const { user, isLoading: isAuthLoading } = useAuth();
    const router = useRouter();
    const [assessments, setAssessments] = useState<Assessment[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!isAuthLoading && !user) {
            router.push("/");
        }
    }, [isAuthLoading, user, router]);

    useEffect(() => {
        if (user) {
            fetchAssessments();
        }
    }, [user]);

    const fetchAssessments = async () => {
        setIsLoading(true);
        try {
            const res = await api.get<AssessmentListResponse>("/assessments?page=1&page_size=50");
            setAssessments(res.data.assessments);
        } catch (error) {
            console.error("Failed to fetch assessments", error);
        } finally {
            setIsLoading(false);
        }
    };

    const getStatusBadge = (status: AssessmentStatus) => {
        switch (status) {
            case AssessmentStatus.COMPLETED:
                return <Badge variant="default" className="bg-green-600">Completed</Badge>;
            case AssessmentStatus.PROCESSING:
                return <Badge variant="secondary" className="bg-blue-100 text-blue-800 animate-pulse">Processing</Badge>;
            case AssessmentStatus.FAILED:
                return <Badge variant="destructive">Failed</Badge>;
            case AssessmentStatus.CREATED:
                return <Badge variant="outline">Created</Badge>;
            default:
                return <Badge variant="secondary">{status}</Badge>;
        }
    };

    if (isAuthLoading || (isLoading && !assessments.length)) {
        return (
            <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="container py-8 space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                    <p className="text-muted-foreground">
                        Manage your BI migration assessments and track progress.
                    </p>
                </div>
                <Button asChild>
                    <Link href="/dashboard/create">
                        <Plus className="mr-2 h-4 w-4" /> New Assessment
                    </Link>
                </Button>
            </div>

            {assessments.length === 0 ? (
                <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="rounded-full bg-primary/10 p-4 mb-4">
                            <FileText className="h-8 w-8 text-primary" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2">No assessments yet</h3>
                        <p className="text-muted-foreground max-w-sm mb-6">
                            Create your first assessment to analyze Cognos exports and generate migration insights.
                        </p>
                        <Button asChild>
                            <Link href="/dashboard/create">Create Assessment</Link>
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <Card>
                    <CardHeader>
                        <CardTitle>Recent Assessments</CardTitle>
                        <CardDescription>
                            A list of your migration projects.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Source</TableHead>
                                    <TableHead className="text-center">Files</TableHead>
                                    <TableHead className="text-center">Objects</TableHead>
                                    <TableHead className="text-right">Created</TableHead>
                                    <TableHead className="w-[50px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {assessments.map((assessment) => (
                                    <TableRow key={assessment.id}>
                                        <TableCell className="font-medium">
                                            <Link href={`/dashboard/assessment/${assessment.id}`} className="hover:underline">
                                                {assessment.name}
                                            </Link>
                                        </TableCell>
                                        <TableCell>{getStatusBadge(assessment.status)}</TableCell>
                                        <TableCell className="capitalize">{assessment.bi_tool}</TableCell>
                                        <TableCell className="text-center">
                                            {assessment.files_count > 0 ? (
                                                <Badge variant="secondary" className="font-normal">{assessment.files_count}</Badge>
                                            ) : <span className="text-muted-foreground">-</span>}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {assessment.objects_count > 0 ? (
                                                <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                                                    <Database className="h-3 w-3" /> {assessment.objects_count}
                                                </div>
                                            ) : <span className="text-muted-foreground">-</span>}
                                        </TableCell>
                                        <TableCell className="text-right text-muted-foreground text-sm">
                                            {new Date(assessment.created_at).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                                        <span className="sr-only">Open menu</span>
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem asChild>
                                                        <Link href={`/dashboard/assessment/${assessment.id}`}>View Details</Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem className="text-destructive">
                                                        Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
