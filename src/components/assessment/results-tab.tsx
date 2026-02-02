"use client";

import { ResultsLayout } from "@/components/results";

interface ResultsTabProps {
    assessmentId: string;
}

export function ResultsTab({ assessmentId }: ResultsTabProps) {
    return <ResultsLayout assessmentId={assessmentId} />;
}
