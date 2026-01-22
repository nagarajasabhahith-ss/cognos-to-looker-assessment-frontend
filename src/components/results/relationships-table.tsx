"use client";

import { useState } from "react";
import {
    ColumnDef,
    ColumnFiltersState,
    SortingState,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
} from "@tanstack/react-table";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ObjectRelationship, ExtractedObject } from "@/lib/api";
import { ArrowRight, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface RelationshipsTableProps {
    data: ObjectRelationship[];
    objects: ExtractedObject[];
}

export function RelationshipsTable({ data, objects }: RelationshipsTableProps) {
    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

    // Create a lookup map for object names
    const objectMap = new Map(objects.map(obj => [obj.id, obj]));

    const columns: ColumnDef<ObjectRelationship>[] = [
        {
            accessorKey: "source_object_id",
            header: "Source",
            cell: ({ row }) => {
                const sourceObj = objectMap.get(row.getValue("source_object_id"));
                return (
                    <div className="font-medium">
                        {sourceObj?.name || "Unknown"}
                        {sourceObj && (
                            <span className="ml-2 text-xs text-muted-foreground">
                                ({sourceObj.object_type})
                            </span>
                        )}
                    </div>
                );
            },
        },
        {
            id: "arrow",
            header: "",
            cell: () => <ArrowRight className="h-4 w-4 text-muted-foreground" />,
        },
        {
            accessorKey: "target_object_id",
            header: "Target",
            cell: ({ row }) => {
                const targetObj = objectMap.get(row.getValue("target_object_id"));
                return (
                    <div className="font-medium">
                        {targetObj?.name || "Unknown"}
                        {targetObj && (
                            <span className="ml-2 text-xs text-muted-foreground">
                                ({targetObj.object_type})
                            </span>
                        )}
                    </div>
                );
            },
        },
        {
            accessorKey: "relationship_type",
            header: "Type",
            cell: ({ row }) => (
                <Badge variant="outline" className="capitalize">
                    {row.getValue("relationship_type")}
                </Badge>
            ),
        },
    ];

    const table = useReactTable({
        data,
        columns,
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        state: {
            sorting,
            columnFilters,
        },
    });

    return (
        <div className="w-full space-y-4">
            <div className="flex items-center py-4">
                <div className="relative w-full max-w-sm">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Filter by type..."
                        value={(table.getColumn("relationship_type")?.getFilterValue() as string) ?? ""}
                        onChange={(event) =>
                            table.getColumn("relationship_type")?.setFilterValue(event.target.value)
                        }
                        className="pl-8"
                    />
                </div>
            </div>
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => (
                                    <TableHead key={header.id}>
                                        {header.isPlaceholder
                                            ? null
                                            : flexRender(
                                                header.column.columnDef.header,
                                                header.getContext()
                                            )}
                                    </TableHead>
                                ))}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow key={row.id}>
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id}>
                                            {flexRender(
                                                cell.column.columnDef.cell,
                                                cell.getContext()
                                            )}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell
                                    colSpan={columns.length}
                                    className="h-24 text-center"
                                >
                                    No relationships found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
            <div className="flex items-center justify-end space-x-2 py-4">
                <div className="flex-1 text-sm text-muted-foreground">
                    {table.getFilteredRowModel().rows.length} relationship(s)
                </div>
                <div className="space-x-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.previousPage()}
                        disabled={!table.getCanPreviousPage()}
                    >
                        Previous
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.nextPage()}
                        disabled={!table.getCanNextPage()}
                    >
                        Next
                    </Button>
                </div>
            </div>
        </div>
    );
}
