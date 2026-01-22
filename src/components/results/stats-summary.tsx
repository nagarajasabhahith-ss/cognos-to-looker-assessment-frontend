"use client";

import { useMemo } from "react";
import { AssessmentStats } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Database, GitGraph, AlertTriangle, CheckCircle } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

interface StatsSummaryProps {
    stats: AssessmentStats;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export function StatsSummary({ stats }: StatsSummaryProps) {
    const objectTypeData = useMemo(() => {
        return Object.entries(stats.objects_by_type).map(([name, value]) => ({
            name,
            value
        })).sort((a, b) => b.value - a.value);
    }, [stats.objects_by_type]);

    return (
        <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Objects</CardTitle>
                        <Database className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.total_objects}</div>
                        <p className="text-xs text-muted-foreground">Extracted from {stats.total_files} files</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Relationships</CardTitle>
                        <GitGraph className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.total_relationships}</div>
                        <p className="text-xs text-muted-foreground">Dependencies mapped</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Parse Success</CardTitle>
                        <CheckCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.parse_success_rate}%</div>
                        <p className="text-xs text-muted-foreground">File processing rate</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Parse Errors</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.total_errors}</div>
                        <p className="text-xs text-muted-foreground">Issues encountered</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <Card className="col-span-1">
                    <CardHeader>
                        <CardTitle>Object Types Distribution</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={objectTypeData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                >
                                    {objectTypeData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Object Types Breakdown with counts */}
                <Card className="col-span-1">
                    <CardHeader>
                        <CardTitle>Extracted Objects by Type</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px] overflow-auto">
                        <div className="space-y-3">
                            {objectTypeData.length > 0 ? (
                                objectTypeData.map((item, index) => (
                                    <div key={item.name} className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="w-3 h-3 rounded-sm flex-shrink-0"
                                                style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                            />
                                            <span className="capitalize text-sm">{item.name.replace(/_/g, ' ')}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-semibold">{item.value}</span>
                                            <span className="text-xs text-muted-foreground">
                                                ({((item.value / stats.total_objects) * 100).toFixed(1)}%)
                                            </span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="flex items-center justify-center h-full text-muted-foreground">
                                    No objects extracted yet
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
