"use client";

import { use, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, FileText } from "lucide-react";
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
import { MigrationAssessmentReport } from "@/components/assessment/migration-assessment-report";
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

    const { report, isLoading: isLoadingReport } = useAssessmentReport(id, hasResults);

    const [isRunning, setIsRunning] = useState(false);

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
            <Tabs defaultValue="overview" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="overview">Overview & Files</TabsTrigger>
                    <TabsTrigger value="migration-report" disabled={!hasResults}>
                        <FileText className="mr-2 h-4 w-4" />
                        Migration Assessment Report
                    </TabsTrigger>
                    <TabsTrigger value="inventory-summary" disabled={!hasResults}>
                        <Package className="mr-2 h-4 w-4" />
                        Inventory Summary
                    </TabsTrigger>
                    <TabsTrigger value="results" disabled={!hasResults}>
                        Results & Visualization
                    </TabsTrigger>

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
                    />
                </TabsContent>

                <TabsContent value="results">
                    {hasResults && <ResultsTab assessmentId={id} />}
                </TabsContent>

                <TabsContent value="inventory-summary">
                    {hasResults && (
                        <div className="space-y-6">
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
                </TabsContent>

                <TabsContent value="migration-report">
                    {hasResults && (
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
                        />
                    )}
                </TabsContent>
                
            </Tabs>
        </div>
    );
}
