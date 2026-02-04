"use client";

import { useState, useCallback } from "react";
import { pdf } from "@react-pdf/renderer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { AssessmentReport, ExtractedObject } from "@/lib/api";
import { useReportData } from "./useReportData";
import { ReportHeader } from "./ReportHeader";
import { SummaryTab } from "./SummaryTab";
import { ComplexityTabContent } from "./ComplexityTabContent";
import { UsageStatsTab } from "./UsageStatsTab";
import { ChallengesTab } from "./ChallengesTab";
import { AppendixTab } from "./AppendixTab";
import { AssessmentReportPdf, type ReportPdfData } from "./AssessmentReportPdf";
import type { MigrationAssessmentReportProps } from "./types";

const TAB_TRIGGER_CLASS =
    "flex-1 bg-white py-[20px] px-[28px] rounded-none border-b-4 border-transparent text-[#4f4f4f] data-[state=active]:border-b-4 data-[state=active]:border-[var(--royal-gold)] data-[state=active]:bg-white data-[state=active]:text-[var(--deep-green)] font-semibold uppercase";

function buildPdfData(data: ReturnType<typeof useReportData>): ReportPdfData {
    return {
        formattedDate: data.formattedDate,
        assessmentName: data.assessmentName,
        biTool: data.biTool,
        summary: data.summary ?? null,
        complex_analysis: data.complex_analysis ?? null,
        inventorySummary: data.inventorySummary,
        overallComplexity: data.overallComplexity,
        usage_stats: data.usage_stats ?? null,
        challengesList: data.challengesList,
        appendixDashboardsList: data.appendixDashboardsList,
        appendixReportsList: data.appendixReportsList,
    };
}

/** Build ReportPdfData from fresh API data (used when exporting PDF after refetch to avoid stale data). */
export function buildReportPdfDataFromApi(
    assessmentInfo: { assessmentName?: string; biTool?: string; createdAt?: string },
    report: AssessmentReport,
    objects: ExtractedObject[]
): ReportPdfData {
    const totalDashboards = objects.filter((o) => o.object_type === "dashboard").length;
    const totalReports = objects.filter((o) => o.object_type === "report").length;
    const formattedDate = assessmentInfo.createdAt
        ? new Date(assessmentInfo.createdAt).toLocaleString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
          })
        : new Date().toLocaleString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
          });
    return {
        formattedDate,
        assessmentName: assessmentInfo.assessmentName ?? "Assessment",
        biTool: assessmentInfo.biTool ?? "Cognos",
        summary: report.summary ?? null,
        complex_analysis: report.complex_analysis ?? null,
        inventorySummary: { totalDashboards, totalReports },
        overallComplexity: report.summary?.overall_complexity ?? "",
        usage_stats: report.usage_stats ?? null,
        challengesList: report.challenges?.visualization ?? [],
        appendixDashboardsList: report.appendix?.dashboards ?? [],
        appendixReportsList: report.appendix?.reports ?? [],
    };
}

export function MigrationAssessmentReport(props: MigrationAssessmentReportProps) {
    const data = useReportData(props);
    const [internalExporting, setInternalExporting] = useState(false);

    const handleExportPdf = useCallback(async () => {
        setInternalExporting(true);
        try {
            const pdfData = buildPdfData(data);
            const blob = await pdf(<AssessmentReportPdf data={pdfData} />).toBlob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `migration-assessment-report-${(data.assessmentName ?? "assessment").replace(/[^a-zA-Z0-9]/g, "-")}.pdf`;
            a.click();
            URL.revokeObjectURL(url);
        } finally {
            setInternalExporting(false);
        }
    }, [data]);

    const onExportPdf = props.onExportPdf ?? handleExportPdf;
    const isExportingPdf = props.isExportingPdf ?? internalExporting;

    return (
        <div className="w-full">
            <ReportHeader
                formattedDate={data.formattedDate}
                assessmentName={data.assessmentName}
                biTool={data.biTool}
                onExportPdf={onExportPdf}
                isExportingPdf={isExportingPdf}
            />

            <div className="bg-[#f5f5dc] rounded-b-lg">
                <Tabs defaultValue="summary" className="w-full">
                    <TabsList className="w-full flex bg-[#f5f5dc] border-b border-gray-300 rounded-none h-auto p-0">
                        <TabsTrigger value="summary" className={TAB_TRIGGER_CLASS}>
                            SUMMARY
                        </TabsTrigger>
                        <TabsTrigger value="complexity" className={TAB_TRIGGER_CLASS}>
                            COMPLEXITY ANALYSIS
                        </TabsTrigger>
                        <TabsTrigger value="usage" className={TAB_TRIGGER_CLASS}>
                            USAGE STATS
                        </TabsTrigger>
                        <TabsTrigger value="challenges" className={TAB_TRIGGER_CLASS}>
                            CHALLENGES
                        </TabsTrigger>
                        <TabsTrigger value="appendix" className={TAB_TRIGGER_CLASS}>
                            APPENDIX
                        </TabsTrigger>
                    </TabsList>

                    <div className="p-6 bg-white">
                        <TabsContent value="summary" className="mt-0 space-y-6">
                            <SummaryTab
                                summary={data.summary}
                                complex_analysis={data.complex_analysis}
                                inventorySummary={data.inventorySummary}
                                overallComplexity={data.overallComplexity}
                                biTool={data.biTool}
                            />
                        </TabsContent>

                        <TabsContent value="complexity" className="mt-0 space-y-6">
                            <ComplexityTabContent complex_analysis={data.complex_analysis} />
                        </TabsContent>

                        <TabsContent value="usage" className="mt-0 space-y-6">
                            <UsageStatsTab usage_stats={data.usage_stats} />
                        </TabsContent>

                        <TabsContent value="challenges" className="mt-0 space-y-6">
                            <ChallengesTab
                                challengesList={data.challengesList}
                                paginatedChallenges={data.paginatedChallenges}
                                challengesPage={data.challengesPage}
                                setChallengesPage={data.setChallengesPage}
                                challengesTotalPages={data.challengesTotalPages}
                                challengesPageNumbers={data.challengesPageNumbers}
                                challengesItemsPerPage={data.challengesItemsPerPage}
                            />
                        </TabsContent>

                        <TabsContent value="appendix" className="mt-0 space-y-6">
                            <AppendixTab
                                biTool={data.biTool}
                                appendixDashboardsList={data.appendixDashboardsList}
                                appendixReportsList={data.appendixReportsList}
                                paginatedAppendixDashboards={data.paginatedAppendixDashboards}
                                paginatedAppendixReports={data.paginatedAppendixReports}
                                appendixDashPage={data.appendixDashPage}
                                setAppendixDashPage={data.setAppendixDashPage}
                                appendixReportPage={data.appendixReportPage}
                                setAppendixReportPage={data.setAppendixReportPage}
                                appendixDashTotalPages={data.appendixDashTotalPages}
                                appendixReportTotalPages={data.appendixReportTotalPages}
                                appendixDashPageNumbers={data.appendixDashPageNumbers}
                                appendixReportPageNumbers={data.appendixReportPageNumbers}
                                appendixItemsPerPage={data.appendixItemsPerPage}
                            />
                        </TabsContent>
                    </div>
                </Tabs>
            </div>
        </div>
    );
}

export type { MigrationAssessmentReportProps } from "./types";
