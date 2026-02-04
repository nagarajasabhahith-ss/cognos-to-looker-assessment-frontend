"use client";

import { Button } from "@/components/ui/button";

interface ReportHeaderProps {
    formattedDate: string;
    assessmentName?: string;
    biTool?: string;
    onExportPdf?: () => void | Promise<void>;
    isExportingPdf?: boolean;
}

export function ReportHeader({
    formattedDate,
    assessmentName = "Assessment",
    biTool = "Cognos",
    onExportPdf,
    isExportingPdf = false,
}: ReportHeaderProps) {
    return (
        <div className="bg-[var(--deep-green)] text-white p-6 rounded-t-lg mb-0">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <img
                        src="/squareshift-logo-white.avif"
                        alt="Squareshift"
                        className="h-auto w-auto max-h-10 object-contain"
                    />
                </div>
                <Button
                    className="bg-[var(--royal-gold)] text-[var(--deep-green)] hover:bg-[var(--royal-gold)] font-semibold rounded-md"
                    onClick={onExportPdf}
                    disabled={isExportingPdf || !onExportPdf}
                >
                    {isExportingPdf ? "Generating PDF…" : "ASSESSMENT REPORT"}
                </Button>
            </div>
            <div className="text-center">
                <h1 className="text-[54px] font-bold mb-6">Migration Assessment Report</h1>
                <p className="text-xl mb-4">{biTool} to Looker Strategic Migration Analysis</p>
                <div className="text-sm text-gray-200 space-x-4">
                    <span>Date Generated: {formattedDate}</span>
                    <span>•</span>
                    <span>Assessed Environment: {assessmentName}</span>
                </div>
            </div>
        </div>
    );
}
