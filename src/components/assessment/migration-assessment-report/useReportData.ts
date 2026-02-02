"use client";

import { useMemo, useState } from "react";
import type { ExtractedObject, ObjectRelationship } from "@/lib/api";
import type { MigrationAssessmentReportProps } from "./types";
import { calculateOverallComplexity } from "./utils";
import { buildPageNumbers } from "./utils";
import type { PageNumber } from "./types";

const ITEMS_PER_PAGE = 10;
const CHALLENGES_ITEMS_PER_PAGE = 10;
const APPENDIX_ITEMS_PER_PAGE = 10;

export function useReportData(props: MigrationAssessmentReportProps) {
    const {
        objects,
        relationships,
        challenges,
        appendix,
        createdAt,
    } = props;

    const [currentPage, setCurrentPage] = useState(1);
    const [challengesPage, setChallengesPage] = useState(1);
    const [appendixDashPage, setAppendixDashPage] = useState(1);
    const [appendixReportPage, setAppendixReportPage] = useState(1);

    const objectsMap = useMemo(() => {
        const map = new Map<string, ExtractedObject>();
        objects.forEach(obj => map.set(obj.id, obj));
        return map;
    }, [objects]);

    const relationshipsBySource = useMemo(() => {
        const map = new Map<string, ObjectRelationship[]>();
        relationships.forEach(rel => {
            if (!map.has(rel.source_object_id)) {
                map.set(rel.source_object_id, []);
            }
            map.get(rel.source_object_id)!.push(rel);
        });
        return map;
    }, [relationships]);

    const relationshipsByTarget = useMemo(() => {
        const map = new Map<string, ObjectRelationship[]>();
        relationships.forEach(rel => {
            if (!map.has(rel.target_object_id)) {
                map.set(rel.target_object_id, []);
            }
            map.get(rel.target_object_id)!.push(rel);
        });
        return map;
    }, [relationships]);

    const inventorySummary = useMemo(() => {
        const dashboards = objects.filter(obj => obj.object_type === "dashboard");
        const reports = objects.filter(obj => obj.object_type === "report");
        const views = objects.filter(obj => obj.object_type === "visualization");
        const pagesAndTabs = objects.filter(obj => obj.object_type === "page" || obj.object_type === "tab");
        const packages = objects.filter(obj => obj.object_type === "package");
        const dataSources = objects.filter(obj => obj.object_type === "data_source");
        const dataModules = objects.filter(obj => obj.object_type === "data_module");

        return {
            totalDashboardsAndReports: dashboards.length + reports.length,
            totalDashboards: dashboards.length,
            totalReports: reports.length,
            totalViews: views.length,
            totalPagesAndTabs: pagesAndTabs.length,
            totalPackages: packages.length,
            totalDataSources: dataSources.length,
            totalDataModules: dataModules.length,
        };
    }, [objects]);

    const detailedInventory = useMemo(() => {
        const dashboardsAndReports = objects.filter(obj => obj.object_type === "report" || obj.object_type === "dashboard");

        return dashboardsAndReports.map(item => {
            const outgoingRels = relationshipsBySource.get(item.id) || [];
            const dashboardNames: string[] = [];
            const datasets: string[] = [];

            if (item.object_type === "dashboard") {
                dashboardNames.push(item.name);
            } else {
                const relatedDashboards = outgoingRels
                    .filter(rel => {
                        const targetObj = objectsMap.get(rel.target_object_id);
                        return targetObj?.object_type === "dashboard";
                    })
                    .map(rel => {
                        const targetObj = objectsMap.get(rel.target_object_id);
                        return targetObj?.name || "";
                    })
                    .filter(Boolean);
                dashboardNames.push(...relatedDashboards);
            }

            const dataItems = outgoingRels
                .filter(rel => {
                    const targetObj = objectsMap.get(rel.target_object_id);
                    return targetObj?.object_type === "package" ||
                        targetObj?.object_type === "data_source" ||
                        targetObj?.object_type === "data_module";
                })
                .map(rel => {
                    const targetObj = objectsMap.get(rel.target_object_id);
                    return targetObj?.name || "";
                })
                .filter(Boolean);
            datasets.push(...dataItems);

            return {
                dashboardOrReportName: item.name,
                dashboardNames: dashboardNames.length > 0 ? dashboardNames : ["N/A"],
                datasetsUsed: datasets.length > 0 ? datasets : ["N/A"],
                ownerId: (item.properties?.owner as string) || "Unknown",
            };
        });
    }, [objects, relationshipsBySource, objectsMap]);

    const paginatedInventory = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        const end = start + ITEMS_PER_PAGE;
        return detailedInventory.slice(start, end);
    }, [detailedInventory, currentPage]);

    const totalPages = Math.ceil(detailedInventory.length / ITEMS_PER_PAGE);

    const challengesList = challenges?.visualization ?? [];
    const challengesTotalPages = Math.ceil(challengesList.length / CHALLENGES_ITEMS_PER_PAGE) || 1;
    const paginatedChallenges = useMemo(() => {
        const page = Math.min(challengesPage, challengesTotalPages) || 1;
        const start = (page - 1) * CHALLENGES_ITEMS_PER_PAGE;
        return challengesList.slice(start, start + CHALLENGES_ITEMS_PER_PAGE);
    }, [challengesList, challengesPage, challengesTotalPages]);

    const challengesPageNumbers = useMemo(
        () => buildPageNumbers(challengesTotalPages, challengesPage) as PageNumber[],
        [challengesTotalPages, challengesPage]
    );

    const appendixDashboardsList = appendix?.dashboards ?? [];
    const appendixReportsList = appendix?.reports ?? [];
    const appendixDashTotalPages = Math.ceil(appendixDashboardsList.length / APPENDIX_ITEMS_PER_PAGE) || 1;
    const appendixReportTotalPages = Math.ceil(appendixReportsList.length / APPENDIX_ITEMS_PER_PAGE) || 1;
    const paginatedAppendixDashboards = useMemo(() => {
        const page = Math.min(appendixDashPage, appendixDashTotalPages) || 1;
        const start = (page - 1) * APPENDIX_ITEMS_PER_PAGE;
        return appendixDashboardsList.slice(start, start + APPENDIX_ITEMS_PER_PAGE);
    }, [appendixDashboardsList, appendixDashPage, appendixDashTotalPages]);
    const paginatedAppendixReports = useMemo(() => {
        const page = Math.min(appendixReportPage, appendixReportTotalPages) || 1;
        const start = (page - 1) * APPENDIX_ITEMS_PER_PAGE;
        return appendixReportsList.slice(start, start + APPENDIX_ITEMS_PER_PAGE);
    }, [appendixReportsList, appendixReportPage, appendixReportTotalPages]);
    const appendixDashPageNumbers = useMemo(
        () => buildPageNumbers(appendixDashTotalPages, appendixDashPage) as PageNumber[],
        [appendixDashTotalPages, appendixDashPage]
    );
    const appendixReportPageNumbers = useMemo(
        () => buildPageNumbers(appendixReportTotalPages, appendixReportPage) as PageNumber[],
        [appendixReportTotalPages, appendixReportPage]
    );

    const overallComplexity = useMemo(
        () => calculateOverallComplexity(objects, relationships),
        [objects, relationships]
    );

    const formattedDate = createdAt
        ? new Date(createdAt).toLocaleString("en-US", {
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
        // props pass-through
        ...props,
        // maps
        objectsMap,
        relationshipsBySource,
        relationshipsByTarget,
        // inventory
        inventorySummary,
        detailedInventory,
        paginatedInventory,
        totalPages,
        itemsPerPage: ITEMS_PER_PAGE,
        currentPage,
        setCurrentPage,
        // challenges
        challengesList,
        challengesTotalPages,
        paginatedChallenges,
        challengesPageNumbers,
        challengesItemsPerPage: CHALLENGES_ITEMS_PER_PAGE,
        challengesPage,
        setChallengesPage,
        // appendix
        appendixDashboardsList,
        appendixReportsList,
        appendixDashTotalPages,
        appendixReportTotalPages,
        paginatedAppendixDashboards,
        paginatedAppendixReports,
        appendixDashPageNumbers,
        appendixReportPageNumbers,
        appendixItemsPerPage: APPENDIX_ITEMS_PER_PAGE,
        appendixDashPage,
        setAppendixDashPage,
        appendixReportPage,
        setAppendixReportPage,
        // computed
        overallComplexity,
        formattedDate,
    };
}
