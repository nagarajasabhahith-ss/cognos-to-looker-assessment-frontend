"use client";

import { useMemo } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { ExtractedObject } from "@/lib/api";
import { ObjectsTable } from "./objects-table";

interface DetailedObjectsTableProps {
    data: ExtractedObject[];
    type: "data_module" | "report" | "dashboard" | "visualization";
    onObjectClick: (object: ExtractedObject) => void;
}

export function DetailedObjectsTable({ data, type, onObjectClick }: DetailedObjectsTableProps) {
    const filteredData = useMemo(() => {
        return data.filter((obj) => obj.object_type === type);
    }, [data, type]);

    const customColumns = useMemo<ColumnDef<ExtractedObject>[]>(() => {
        switch (type) {
            case "data_module":
                return [
                    {
                        header: "Tables",
                        accessorFn: (row) => Array.isArray(row.properties?.tables) ? row.properties.tables.length : 0,
                    },
                    {
                        header: "Relationships",
                        accessorFn: (row) => Array.isArray(row.properties?.relationships) ? row.properties.relationships.length : 0,
                    },
                ];
            case "report":
                return [
                    {
                        header: "Pages",
                        accessorFn: (row) => row.properties?.page_count || 0,
                    },
                    {
                        header: "Queries",
                        accessorFn: (row) => Array.isArray(row.properties?.queries) ? row.properties.queries.length : 0,
                    },
                ];
            case "dashboard":
                return [
                    {
                        header: "Widgets",
                        accessorFn: (row) => Array.isArray(row.properties?.widgets) ? row.properties.widgets.length : 0,
                    },
                    {
                        header: "Tabs",
                        accessorFn: (row) => Array.isArray(row.properties?.tabs) ? row.properties.tabs.length : 0,
                    },
                ];
            case "visualization":
                return [
                    {
                        header: "Viz Type",
                        accessorFn: (row) => row.properties?.visualization_type || "-",
                    },
                    {
                        header: "Query",
                        accessorFn: (row) => row.properties?.query_path || "-",
                    },
                ];
            default:
                return [];
        }
    }, [type]);

    return (
        <ObjectsTable
            data={filteredData}
            onObjectClick={onObjectClick}
            customColumns={customColumns}
        />
    );
}
