"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Info } from "lucide-react";
import { PaginationControls } from "./PaginationControls";
import type { PageNumber } from "./types";
import type { AppendixItem } from "@/lib/api";

interface AppendixTabProps {
    biTool?: string;
    appendixDashboardsList: AppendixItem[];
    appendixReportsList: AppendixItem[];
    paginatedAppendixDashboards: AppendixItem[];
    paginatedAppendixReports: AppendixItem[];
    appendixDashPage: number;
    setAppendixDashPage: (page: number | ((p: number) => number)) => void;
    appendixReportPage: number;
    setAppendixReportPage: (page: number | ((p: number) => number)) => void;
    appendixDashTotalPages: number;
    appendixReportTotalPages: number;
    appendixDashPageNumbers: PageNumber[];
    appendixReportPageNumbers: PageNumber[];
    appendixItemsPerPage: number;
}

export function AppendixTab({
    biTool = "Cognos",
    appendixDashboardsList,
    appendixReportsList,
    paginatedAppendixDashboards,
    paginatedAppendixReports,
    appendixDashPage,
    setAppendixDashPage,
    appendixReportPage,
    setAppendixReportPage,
    appendixDashTotalPages,
    appendixReportTotalPages,
    appendixDashPageNumbers,
    appendixReportPageNumbers,
    appendixItemsPerPage,
}: AppendixTabProps) {
    const hasData = appendixDashboardsList.length > 0 || appendixReportsList.length > 0;

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-[2.6em] font-bold text-[var(--deep-green)] mb-[35px]">
                    <span className="border-b-4 border-[var(--royal-gold)]">Appendix:</span> Detailed Inventory
                </h2>
                <div className="bg-[var(--light-cream)] border-l-4 border-[var(--royal-gold)] rounded-lg shadow-sm text-[1.12em] mb-[35px] py-[24px] px-[28px] flex items-start gap-3">
                    <Info className="h-5 w-5 text-[var(--deep-green)] mt-0.5 flex-shrink-0" />
                    <p className="text-[#333333]">
                        This appendix provides comprehensive details about the current {biTool} environment, including complete dashboard and report inventory, data source catalog.
                    </p>
                </div>
            </div>

            {hasData ? (
                <>
                    {appendixDashboardsList.length > 0 && (
                        <div className="space-y-4">
                            <h3 className="text-xl font-bold text-[var(--deep-green)]">Dashboards</h3>
                            <div className="mb-8 rounded-lg shadow-md overflow-hidden border border-[var(--light-cream)] [font-family:var(--font-roboto-condensed)]">
                                <div className="rounded-lg overflow-hidden">
                                    <Table className="text-lg">
                                        <TableHeader>
                                            <TableRow className="bg-[var(--deep-green)] hover:bg-[var(--deep-green)] border-b-2 border-[var(--light-cream)]">
                                                <TableHead className="text-white font-bold rounded-tl-lg py-4 px-5 h-auto">NAME</TableHead>
                                                <TableHead className="text-white font-bold py-4 px-5 h-auto">PACKAGE</TableHead>
                                                <TableHead className="text-white font-bold py-4 px-5 h-auto">DATA MODULE</TableHead>
                                                <TableHead className="text-white font-bold rounded-tr-lg py-4 px-5 h-auto">OWNER</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {paginatedAppendixDashboards.map((item, idx) => {
                                                const isLast = idx === paginatedAppendixDashboards.length - 1;
                                                return (
                                                    <TableRow
                                                        key={(appendixDashPage - 1) * appendixItemsPerPage + idx}
                                                        className={`${idx % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-[var(--light-cream)]`}
                                                    >
                                                        <TableCell className={`text-gray-900 font-medium py-4 px-5 ${isLast ? "rounded-bl-lg" : ""}`}>{item.name ?? "—"}</TableCell>
                                                        <TableCell className="text-gray-900 py-4 px-5 max-w-[240px]">{(item.package?.length ? item.package.join(", ") : "—")}</TableCell>
                                                        <TableCell className="text-gray-900 py-4 px-5 max-w-[240px]">{(item.data_module?.length ? item.data_module.join(", ") : "—")}</TableCell>
                                                        <TableCell className={`text-gray-900 py-4 px-5 ${isLast ? "rounded-br-lg" : ""}`}>{item.owner ?? "—"}</TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                            <PaginationControls
                                currentPage={appendixDashPage}
                                totalPages={appendixDashTotalPages}
                                pageNumbers={appendixDashPageNumbers}
                                itemsPerPage={appendixItemsPerPage}
                                totalItems={appendixDashboardsList.length}
                                onPageChange={setAppendixDashPage}
                                label="entries"
                                ellipsisKeyPrefix="ellipsis-dash"
                            />
                        </div>
                    )}
                    {appendixReportsList.length > 0 && (
                        <div className="space-y-4">
                            <h3 className="text-xl font-bold text-[var(--deep-green)]">Reports</h3>
                            <div className="mb-8 rounded-lg shadow-md overflow-hidden border border-[var(--light-cream)] [font-family:var(--font-roboto-condensed)]">
                                <div className="rounded-lg overflow-hidden">
                                    <Table className="text-lg">
                                        <TableHeader>
                                            <TableRow className="bg-[var(--deep-green)] hover:bg-[var(--deep-green)] border-b-2 border-[var(--light-cream)]">
                                                <TableHead className="text-white font-bold rounded-tl-lg py-4 px-5 h-auto">NAME</TableHead>
                                                <TableHead className="text-white font-bold py-4 px-5 h-auto">PACKAGE</TableHead>
                                                <TableHead className="text-white font-bold py-4 px-5 h-auto">DATA MODULE</TableHead>
                                                <TableHead className="text-white font-bold rounded-tr-lg py-4 px-5 h-auto">OWNER</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {paginatedAppendixReports.map((item, idx) => {
                                                const isLast = idx === paginatedAppendixReports.length - 1;
                                                return (
                                                    <TableRow
                                                        key={(appendixReportPage - 1) * appendixItemsPerPage + idx}
                                                        className={`${idx % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-[var(--light-cream)]`}
                                                    >
                                                        <TableCell className={`text-gray-900 font-medium py-4 px-5 ${isLast ? "rounded-bl-lg" : ""}`}>{item.name ?? "—"}</TableCell>
                                                        <TableCell className="text-gray-900 py-4 px-5 max-w-[240px]">{(item.package?.length ? item.package.join(", ") : "—")}</TableCell>
                                                        <TableCell className="text-gray-900 py-4 px-5 max-w-[240px]">{(item.data_module?.length ? item.data_module.join(", ") : "—")}</TableCell>
                                                        <TableCell className={`text-gray-900 py-4 px-5 ${isLast ? "rounded-br-lg" : ""}`}>{item.owner ?? "—"}</TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                            <PaginationControls
                                currentPage={appendixReportPage}
                                totalPages={appendixReportTotalPages}
                                pageNumbers={appendixReportPageNumbers}
                                itemsPerPage={appendixItemsPerPage}
                                totalItems={appendixReportsList.length}
                                onPageChange={setAppendixReportPage}
                                label="entries"
                                ellipsisKeyPrefix="ellipsis-report"
                            />
                        </div>
                    )}
                </>
            ) : (
                <div className="text-center py-8 text-muted-foreground">
                    No appendix data available for this assessment.
                </div>
            )}
        </div>
    );
}
