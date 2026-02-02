"use client";

import { Button } from "@/components/ui/button";
import type { PageNumber } from "./types";

interface PaginationControlsProps {
    currentPage: number;
    totalPages: number;
    pageNumbers: PageNumber[];
    itemsPerPage: number;
    totalItems: number;
    onPageChange: (page: number) => void;
    label?: string;
    ellipsisKeyPrefix?: string;
}

export function PaginationControls({
    currentPage,
    totalPages,
    pageNumbers,
    itemsPerPage,
    totalItems,
    onPageChange,
    label = "entries",
    ellipsisKeyPrefix = "ellipsis",
}: PaginationControlsProps) {
    const start = (currentPage - 1) * itemsPerPage + 1;
    const end = Math.min(currentPage * itemsPerPage, totalItems);

    return (
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
            <div className="text-sm text-gray-600">
                Showing {start} to {end} of {totalItems} {label}
            </div>
            <div className="flex gap-2 items-center">
                <Button
                    variant="outline"
                    size="sm"
                    className="rounded-md text-[var(--deep-green)] border-gray-300 bg-[var(--light-cream)] hover:bg-gray-100"
                    onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                >
                    Previous
                </Button>
                {pageNumbers.map((page, i) =>
                    page === "ellipsis" ? (
                        <span
                            key={`${ellipsisKeyPrefix}-${i}`}
                            className="px-2 py-1.5 rounded-md bg-[var(--light-cream)] text-gray-500"
                            aria-hidden
                        >
                            …
                        </span>
                    ) : (
                        <Button
                            key={page}
                            variant="outline"
                            size="sm"
                            className={`rounded-md min-w-[2rem] ${
                                currentPage === page
                                    ? "bg-[var(--royal-gold)] text-[var(--deep-green)] hover:bg-[var(--royal-gold)] border-[var(--royal-gold)]"
                                    : "text-[var(--deep-green)] border-gray-300 bg-[var(--light-cream)] hover:bg-gray-100"
                            }`}
                            onClick={() => onPageChange(page)}
                        >
                            {page}
                        </Button>
                    )
                )}
                <Button
                    variant="outline"
                    size="sm"
                    className="rounded-md text-[var(--deep-green)] border-gray-300 bg-[var(--light-cream)] hover:bg-gray-100"
                    onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                >
                    Next
                </Button>
            </div>
        </div>
    );
}
