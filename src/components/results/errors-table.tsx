"use client";

import { useState } from "react";
import {
    ColumnDef,
    ColumnFiltersState,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
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
import { ParseError } from "@/lib/api";
import { AlertTriangle, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ErrorsTableProps {
    data: ParseError[];
}

export function ErrorsTable({ data }: ErrorsTableProps) {
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

    const columns: ColumnDef<ParseError>[] = [
        {
            accessorKey: "filename",
            header: "File",
            cell: ({ row }) => (
                <div className="font-medium truncate max-w-[200px]" title={row.getValue("filename")}>
                    {row.getValue("filename")}
                </div>
            ),
        },
        {
            accessorKey: "error_type",
            header: "Type",
            cell: ({ row }) => (
                <Badge variant="destructive" className="capitalize">
                    {row.getValue("error_type")}
                </Badge>
            ),
        },
        {
            accessorKey: "error_message",
            header: "Message",
            cell: ({ row }) => (
                <div className="max-w-[400px] truncate" title={row.getValue("error_message")}>
                    {row.getValue("error_message")}
                </div>
            ),
        },
        {
            accessorKey: "location",
            header: "Location",
            cell: ({ row }) => {
                const location = row.getValue("location") as string;
                return (
                    <div className="text-sm text-muted-foreground font-mono">
                        {location || "-"}
                    </div>
                );
            },
        },
    ];

    const table = useReactTable({
        data,
        columns,
        onColumnFiltersChange: setColumnFilters,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        state: {
            columnFilters,
        },
    });

    if (data.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <AlertTriangle className="h-12 w-12 mb-4 opacity-50" />
                <p className="text-lg font-medium">No Parse Errors</p>
                <p className="text-sm">All files were parsed successfully.</p>
            </div>
        );
    }

    return (
        <div className="w-full space-y-4">
            <div className="flex items-center py-4">
                <div className="relative w-full max-w-sm">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Filter by file..."
                        value={(table.getColumn("filename")?.getFilterValue() as string) ?? ""}
                        onChange={(event) =>
                            table.getColumn("filename")?.setFilterValue(event.target.value)
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
                        {table.getRowModel().rows.map((row) => (
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
                        ))}
                    </TableBody>
                </Table>
            </div>
            <div className="flex items-center justify-end space-x-2 py-4">
                <div className="flex-1 text-sm text-muted-foreground">
                    {table.getFilteredRowModel().rows.length} error(s)
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
