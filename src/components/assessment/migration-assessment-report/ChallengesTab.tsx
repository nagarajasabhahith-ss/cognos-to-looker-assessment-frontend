"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Info } from "lucide-react";
import { PaginationControls } from "./PaginationControls";
import type { PageNumber } from "./types";
import type { ChallengeItem } from "@/lib/api";

interface ChallengesTabProps {
    challengesList: ChallengeItem[];
    paginatedChallenges: ChallengeItem[];
    challengesPage: number;
    setChallengesPage: (page: number | ((p: number) => number)) => void;
    challengesTotalPages: number;
    challengesPageNumbers: PageNumber[];
    challengesItemsPerPage: number;
}

export function ChallengesTab({
    challengesList,
    paginatedChallenges,
    challengesPage,
    setChallengesPage,
    challengesTotalPages,
    challengesPageNumbers,
    challengesItemsPerPage,
}: ChallengesTabProps) {
    const hasChallenges = challengesList.length > 0;

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-[2.6em] font-bold text-[var(--deep-green)] mb-[35px]">
                    <span className="border-b-4 border-[var(--royal-gold)]">Identified Challenges</span> & Recommendations
                </h2>
                <div className="bg-[var(--light-cream)] border-l-4 border-[var(--royal-gold)] rounded-lg shadow-sm text-[1.12em] mb-[35px] py-[24px] px-[28px] flex items-start gap-3">
                    <Info className="h-5 w-5 text-[var(--deep-green)] mt-0.5 flex-shrink-0" />
                    <p className="text-[#333333]">
                        Based on the assessment, several key challenges have been identified along with strategic recommendations to ensure a successful migration.
                    </p>
                </div>
            </div>

            {hasChallenges ? (
                <>
                    <div className="mb-8 rounded-lg shadow-md overflow-hidden border border-[var(--light-cream)] [font-family:var(--font-roboto-condensed)]">
                        <div className="rounded-lg overflow-hidden">
                            <Table className="text-lg">
                                <TableHeader>
                                    <TableRow className="bg-[var(--deep-green)] hover:bg-[var(--deep-green)] border-b-2 border-[var(--light-cream)]">
                                        <TableHead className="text-white font-bold rounded-tl-lg py-4 px-5 h-auto">VISUALIZATION</TableHead>
                                        <TableHead className="text-white font-bold py-4 px-5 h-auto">TYPE</TableHead>
                                        <TableHead className="text-white font-bold py-4 px-5 h-auto">COMPLEXITY</TableHead>
                                        <TableHead className="text-white font-bold py-4 px-5 h-auto">DESCRIPTION</TableHead>
                                        <TableHead className="text-white font-bold py-4 px-5 h-auto">RECOMMENDED</TableHead>
                                        <TableHead className="text-white font-bold rounded-tr-lg py-4 px-5 h-auto">DASHBOARD / REPORT</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {paginatedChallenges.map((item, idx) => {
                                        const isLast = idx === paginatedChallenges.length - 1;
                                        return (
                                            <TableRow
                                                key={(challengesPage - 1) * challengesItemsPerPage + idx}
                                                className={`${idx % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-[var(--light-cream)]`}
                                            >
                                                <TableCell className={`text-gray-900 font-medium py-4 px-5 ${isLast ? "rounded-bl-lg" : ""}`}>{item.visualization}</TableCell>
                                                <TableCell className="text-gray-900 py-4 px-5">{item.visualization_type}</TableCell>
                                                <TableCell className="text-gray-900 py-4 px-5">
                                                    {(item.complexity || "").charAt(0).toUpperCase() + (item.complexity || "").slice(1).toLowerCase()}
                                                </TableCell>
                                                <TableCell className="text-gray-900 py-4 px-5 max-w-[280px]">{item.description ?? "—"}</TableCell>
                                                <TableCell className="text-gray-900 py-4 px-5 max-w-[280px]">{item.recommended ?? "—"}</TableCell>
                                                <TableCell className={`text-gray-900 py-4 px-5 ${isLast ? "rounded-br-lg" : ""}`}>{item.dashboard_or_report_name ?? "—"}</TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                    <PaginationControls
                        currentPage={challengesPage}
                        totalPages={challengesTotalPages}
                        pageNumbers={challengesPageNumbers}
                        itemsPerPage={challengesItemsPerPage}
                        totalItems={challengesList.length}
                        onPageChange={setChallengesPage}
                        label="entries"
                        ellipsisKeyPrefix="ellipsis-challenges"
                    />
                </>
            ) : (
                <div className="text-center py-8 text-muted-foreground">
                    No challenges data available for this assessment.
                </div>
            )}
        </div>
    );
}
