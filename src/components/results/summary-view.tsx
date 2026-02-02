"use client";

import { useMemo, useCallback } from "react";
import { ExtractedObject, ObjectRelationship } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { FileText, LayoutDashboard, Database } from "lucide-react";

interface SummaryViewProps {
    objects: ExtractedObject[];
    relationships: ObjectRelationship[];
}

export function SummaryView({ objects, relationships }: SummaryViewProps) {
    // Helper to get children count by type
    const getChildrenStats = useCallback((parentId: string, targetType: string | string[]) => {
        const types = Array.isArray(targetType) ? new Set(targetType) : new Set([targetType]);
        return relationships.filter(r => {
            if (r.source_object_id !== parentId) return false;
            const target = objects.find(o => o.id === r.target_object_id);
            return target && types.has(target.object_type);
        }).length;
    }, [objects, relationships]);

    const dashboards = useMemo(() => {
        return objects.filter(o => o.object_type === 'dashboard').map(d => ({
            obj: d,
            visualizations: getChildrenStats(d.id, 'visualization'),
            modules: getChildrenStats(d.id, 'data_module')
        }));
    }, [objects, getChildrenStats]);

    const reports = useMemo(() => {
        return objects.filter(o => o.object_type === 'report').map(r => ({
            obj: r,
            queries: getChildrenStats(r.id, 'query'),
            containers: getChildrenStats(r.id, ['list', 'crosstab', 'visualization'])
        }));
    }, [objects, getChildrenStats]);

    const dataModules = useMemo(() => {
        return objects.filter(o => o.object_type === 'data_module').map(m => ({
            obj: m,
            tables: getChildrenStats(m.id, 'table'),
            filters: getChildrenStats(m.id, 'filter'),
            calculations: getChildrenStats(m.id, 'calculated_field')
        }));
    }, [objects, getChildrenStats]);

    const packages = useMemo(() => {
        return objects.filter(o => o.object_type === 'package').map(p => ({
            obj: p,
            queries: getChildrenStats(p.id, 'query'),
        }));
    }, [objects, getChildrenStats]);

    return (
        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
            <Card className="col-span-full lg:col-span-1">
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <LayoutDashboard className="h-5 w-5 text-purple-500" />
                        <CardTitle>Dashboards</CardTitle>
                    </div>
                    <CardDescription>Complexity analysis of extracted dashboards</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead className="text-right">Visualizations</TableHead>
                                <TableHead className="text-right">Data Sources</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {dashboards.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center text-muted-foreground">No dashboards found</TableCell>
                                </TableRow>
                            ) : (
                                dashboards.map(item => (
                                    <TableRow key={item.obj.id}>
                                        <TableCell className="font-medium">{item.obj.name}</TableCell>
                                        <TableCell className="text-right">{item.visualizations}</TableCell>
                                        <TableCell className="text-right">{item.modules}</TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Card className="col-span-full lg:col-span-1">
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-blue-500" />
                        <CardTitle>Reports</CardTitle>
                    </div>
                    <CardDescription>Structure analysis of reports</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead className="text-right">Queries</TableHead>
                                <TableHead className="text-right">Containers</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {reports.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center text-muted-foreground">No reports found</TableCell>
                                </TableRow>
                            ) : (
                                reports.map(item => (
                                    <TableRow key={item.obj.id}>
                                        <TableCell className="font-medium">{item.obj.name}</TableCell>
                                        <TableCell className="text-right">{item.queries}</TableCell>
                                        <TableCell className="text-right">{item.containers}</TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Card className="col-span-full">
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Database className="h-5 w-5 text-green-500" />
                        <CardTitle>Data Modules & Packages</CardTitle>
                    </div>
                    <CardDescription>Semantic layer definition details</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead className="text-right">Tables/Subjects</TableHead>
                                <TableHead className="text-right">Filters</TableHead>
                                <TableHead className="text-right">Calculations</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {[...dataModules, ...packages].length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center text-muted-foreground">No semantic models found</TableCell>
                                </TableRow>
                            ) : (
                                <>
                                    {dataModules.map(item => (
                                        <TableRow key={item.obj.id}>
                                            <TableCell className="font-medium">{item.obj.name}</TableCell>
                                            <TableCell><Badge variant="outline">Data Module</Badge></TableCell>
                                            <TableCell className="text-right">{item.tables}</TableCell>
                                            <TableCell className="text-right">{item.filters}</TableCell>
                                            <TableCell className="text-right">{item.calculations}</TableCell>
                                        </TableRow>
                                    ))}
                                    {packages.map(item => (
                                        <TableRow key={item.obj.id}>
                                            <TableCell className="font-medium">{item.obj.name}</TableCell>
                                            <TableCell><Badge variant="outline">Package</Badge></TableCell>
                                            <TableCell className="text-right">-</TableCell>
                                            <TableCell className="text-right">-</TableCell>
                                            <TableCell className="text-right">-</TableCell>
                                        </TableRow>
                                    ))}
                                </>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
