"use client";

import { use, useState } from "react";
import { pdf } from "@react-pdf/renderer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, FileText, LayoutDashboard } from "lucide-react";
import { useAssessment, useAssessmentObjects, useAssessmentReport } from "@/hooks/use-assessment";
import { OverviewTab } from "@/components/assessment/overview-tab";
import { ResultsTab } from "@/components/assessment/results-tab";
import { VisualizationSummary } from "@/components/assessment/visualization-summary";
import { DashboardsBreakdownSummary } from "@/components/assessment/dashboards-breakdown-summary";
import { ReportsBreakdownSummary } from "@/components/assessment/reports-breakdown-summary";
import { PackagesBreakdownSummary } from "@/components/assessment/packages-breakdown-summary";
import { DataSourceConnectionsSummary } from "@/components/assessment/data-source-connections-summary";
import { DataModulesBreakdownSummary } from "@/components/assessment/data-modules-breakdown-summary";
import { CalculatedFieldsBreakdownSummary } from "@/components/assessment/calculated-fields-breakdown-summary";
import { FiltersBreakdownSummary } from "@/components/assessment/filters-breakdown-summary";
import { ParametersBreakdownSummary } from "@/components/assessment/parameters-breakdown-summary";
import { SortsBreakdownSummary } from "@/components/assessment/sorts-breakdown-summary";
import { PromptsBreakdownSummary } from "@/components/assessment/prompts-breakdown-summary";
import { QueriesBreakdownSummary } from "@/components/assessment/queries-breakdown-summary";
import { MeasuresBreakdownSummary } from "@/components/assessment/measures-breakdown-summary";
import { DimensionsBreakdownSummary } from "@/components/assessment/dimensions-breakdown-summary";
import { FullDetailsByDashboard } from "@/components/assessment/full-details-by-dashboard";
import {
    MigrationAssessmentReport,
    buildReportPdfDataFromApi,
} from "@/components/assessment/migration-assessment-report";
import { AssessmentReportPdf } from "@/components/assessment/migration-assessment-report/AssessmentReportPdf";
import { Skeleton } from "@/components/ui/skeleton";

export default function AssessmentDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    const id = resolvedParams.id;
    
    const {
        assessment,
        files,
        stats,
        isLoading,
        isRefreshing,
        refresh,
        runAnalysis,
        hasResults,
    } = useAssessment(id);

    const {
        objects,
        relationships,
        isLoading: isLoadingObjects,
        refetch: refetchObjects,
    } = useAssessmentObjects(id, hasResults);

    const { report, isLoading: isLoadingReport, error: reportError, refetch: refetchReport } = useAssessmentReport(id, hasResults);

    const [isRunning, setIsRunning] = useState(false);
    const [activeTab, setActiveTab] = useState("overview");
    const [isExportingPdf, setIsExportingPdf] = useState(false);

    const handleExportPdf = async () => {
        setIsExportingPdf(true);
        try {
            const [freshReport, objectsResult] = await Promise.all([
                refetchReport(),
                refetchObjects(),
            ]);
            if (!freshReport || !assessment) {
                return;
            }
            const objects = objectsResult?.objects ?? [];
            const pdfData = buildReportPdfDataFromApi(
                {
                    assessmentName: assessment.name,
                    biTool: assessment.bi_tool,
                    createdAt: assessment.created_at,
                },
                freshReport,
                objects
            );
            const blob = await pdf(<AssessmentReportPdf data={pdfData} />).toBlob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `migration-assessment-report-${(assessment.name ?? "assessment").replace(/[^a-zA-Z0-9]/g, "-")}.pdf`;
            a.click();
            URL.revokeObjectURL(url);
        } finally {
            setIsExportingPdf(false);
        }
    };

    const handleRunAnalysis = async () => {
        setIsRunning(true);
        try {
            await runAnalysis();
        } finally {
            setIsRunning(false);
        }
    };

    if (isLoading) {
        return (
            <div className="container mx-auto py-8 space-y-6">
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-64 w-full" />
            </div>
        );
    }

    if (!assessment) {
        return (
            <div className="container mx-auto py-8">
                <div className="text-center text-muted-foreground">
                    Assessment not found
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-8">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList>
                    <TabsTrigger value="overview">Overview & Files</TabsTrigger>
                    <TabsTrigger value="migration-report" disabled={!hasResults}>
                        <FileText className="mr-2 h-4 w-4" />
                        Migration Assessment Report
                    </TabsTrigger>
                    {/* <TabsTrigger value="inventory-summary" disabled={!hasResults}>
                        <Package className="mr-2 h-4 w-4" />
                        Inventory Summary
                    </TabsTrigger>
                    <TabsTrigger value="results" disabled={!hasResults}>
                        Results & Visualization
                    </TabsTrigger>
                    <TabsTrigger value="full-details-dashboard" disabled={!hasResults}>
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        Full Details by Dashboard
                    </TabsTrigger> */}
                </TabsList>

                <TabsContent value="overview">
                    <OverviewTab
                        assessment={assessment}
                        files={files}
                        isRunning={isRunning}
                        isRefreshing={isRefreshing}
                        onRunAnalysis={handleRunAnalysis}
                        onRefresh={refresh}
                        onFileUpdate={refresh}
                        onViewReport={() => setActiveTab("migration-report")}
                    />
                </TabsContent>

                {/* <TabsContent value="results">
                    {hasResults && <ResultsTab assessmentId={id} />}
                </TabsContent> */}

                {/* <TabsContent value="inventory-summary">
                    {hasResults && (
                        <div className="space-y-6">
                            {reportError && (
                                <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30 p-4 text-sm text-amber-800 dark:text-amber-200">
                                    <p className="font-medium">Could not load report data</p>
                                    <p className="mt-1">{reportError}</p>
                                    <button
                                        type="button"
                                        onClick={() => refetchReport()}
                                        className="mt-3 rounded-md bg-amber-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-700"
                                    >
                                        Retry
                                    </button>
                                </div>
                            )}
                            <VisualizationSummary
                                data={report?.sections?.visualization_details ?? null}
                                isLoading={isLoadingReport}
                            />
                            <DashboardsBreakdownSummary
                                data={report?.sections?.dashboards_breakdown ?? null}
                                isLoading={isLoadingReport}
                            />
                            <ReportsBreakdownSummary
                                data={report?.sections?.reports_breakdown ?? null}
                                isLoading={isLoadingReport}
                            />
                            <PackagesBreakdownSummary
                                data={report?.sections?.packages_breakdown ?? null}
                                isLoading={isLoadingReport}
                            />
                            <DataSourceConnectionsSummary
                                data={report?.sections?.data_source_connections_breakdown ?? null}
                                isLoading={isLoadingReport}
                            />
                            <DataModulesBreakdownSummary
                                data={report?.sections?.data_modules_breakdown ?? null}
                                isLoading={isLoadingReport}
                            />
                            <CalculatedFieldsBreakdownSummary
                                data={report?.sections?.calculated_fields_breakdown ?? null}
                                isLoading={isLoadingReport}
                            />
                            <FiltersBreakdownSummary
                                data={report?.sections?.filters_breakdown ?? null}
                                isLoading={isLoadingReport}
                            />
                            <ParametersBreakdownSummary
                                data={report?.sections?.parameters_breakdown ?? null}
                                isLoading={isLoadingReport}
                            />
                            <SortsBreakdownSummary
                                data={report?.sections?.sorts_breakdown ?? null}
                                isLoading={isLoadingReport}
                            />
                            <PromptsBreakdownSummary
                                data={report?.sections?.prompts_breakdown ?? null}
                                isLoading={isLoadingReport}
                            />
                            <QueriesBreakdownSummary
                                data={report?.sections?.queries_breakdown ?? null}
                                isLoading={isLoadingReport}
                            />
                            <MeasuresBreakdownSummary
                                data={report?.sections?.measures_breakdown ?? null}
                                isLoading={isLoadingReport}
                            />
                            <DimensionsBreakdownSummary
                                data={report?.sections?.dimensions_breakdown ?? null}
                                isLoading={isLoadingReport}
                            />
                        </div>
                    )}
                </TabsContent> */}

                {/* <TabsContent value="full-details-dashboard">
                    {hasResults && (
                        <div className="space-y-6">
                            {reportError && (
                                <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30 p-4 text-sm text-amber-800 dark:text-amber-200">
                                    <p className="font-medium">Could not load report data</p>
                                    <p className="mt-1">{reportError}</p>
                                    <button
                                        type="button"
                                        onClick={() => refetchReport()}
                                        className="mt-3 rounded-md bg-amber-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-700"
                                    >
                                        Retry
                                    </button>
                                </div>
                            )}
                            <FullDetailsByDashboard
                                data={report?.full_details_by_dashboard ?? null}
                                isLoading={isLoadingReport}
                            />
                        </div>
                    )}
                </TabsContent> */}

                <TabsContent value="migration-report">
                    {hasResults && (
                        reportError ? (
                            <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30 p-4 text-sm text-amber-800 dark:text-amber-200">
                                <p className="font-medium">Could not load report</p>
                                <p className="mt-1">{reportError}</p>
                                <button
                                    type="button"
                                    onClick={() => refetchReport()}
                                    className="mt-3 rounded-md bg-amber-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-700"
                                >
                                    Retry
                                </button>
                            </div>
                        ) : isLoadingReport || isLoadingObjects ? (
                            <div className="w-full space-y-6">
                                <div className="flex flex-col gap-2">
                                    <Skeleton className="h-8 w-48" />
                                    <Skeleton className="h-5 w-64" />
                                </div>
                                <div className="bg-[#f5f5dc] rounded-b-lg p-6 space-y-6">
                                    <div className="flex gap-2 border-b border-gray-300 pb-2">
                                        <Skeleton className="h-12 flex-1 rounded-none" />
                                        <Skeleton className="h-12 flex-1 rounded-none" />
                                        <Skeleton className="h-12 flex-1 rounded-none" />
                                        <Skeleton className="h-12 flex-1 rounded-none" />
                                        <Skeleton className="h-12 flex-1 rounded-none" />
                                    </div>
                                    <div className="bg-white p-6 space-y-4">
                                        <Skeleton className="h-32 w-full" />
                                        <Skeleton className="h-24 w-full" />
                                        <Skeleton className="h-40 w-full" />
                                        <Skeleton className="h-24 w-full" />
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <MigrationAssessmentReport
                                objects={objects}
                                relationships={relationships}
                                complex_analysis={report?.complex_analysis ?? null}
                                summary={report?.summary ?? null}
                                challenges={report?.challenges ?? null}
                                appendix={report?.appendix ?? null}
                                usage_stats={report?.usage_stats ?? null}
                                assessmentName={assessment.name}
                                biTool={assessment.bi_tool}
                                createdAt={assessment.created_at}
                                onExportPdf={handleExportPdf}
                                isExportingPdf={isExportingPdf}
                            />
                        )
                    )}
                </TabsContent>
                
            </Tabs>
        </div>
    );
}
