"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
    Table, 
    TableBody, 
    TableCell, 
    TableHead, 
    TableHeader, 
    TableRow 
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { 
    BarChart3, 
    TrendingUp, 
    AlertTriangle, 
    CheckCircle, 
    Loader2,
    Download,
    Filter,
    Search,
    ArrowUpDown,
    FileBarChart,
    PieChart as PieChartIcon
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { ExtractedObject } from "@/lib/api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ComplexityViewProps {
    assessmentId: string;
    objects: ExtractedObject[];
}

interface ComplexitySummary {
    looker: {
        distribution: Record<string, number>;
        average_score: number | null;
    };
    custom: {
        distribution: Record<string, number>;
        average_score: number | null;
    };
}

const COMPLEXITY_COLORS = {
    low: "#22c55e",      // green
    medium: "#eab308",    // yellow
    high: "#f97316",      // orange
    critical: "#ef4444",  // red
};

const COMPLEXITY_LABELS = {
    low: "Low",
    medium: "Medium",
    high: "High",
    critical: "Critical",
};

export function ComplexityView({ assessmentId, objects }: ComplexityViewProps) {
    const [complexitySummary, setComplexitySummary] = useState<ComplexitySummary | null>(null);
    const [isLoadingSummary, setIsLoadingSummary] = useState(false);
    const [mode, setMode] = useState<"looker" | "custom" | "both">("both");
    const [filterLevel, setFilterLevel] = useState<string>("all");
    const [searchTerm, setSearchTerm] = useState("");
    const [sortBy, setSortBy] = useState<"name" | "score" | "type">("score");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

    // Filter and sort objects
    const filteredAndSortedObjects = useMemo(() => {
        if (!objects || !Array.isArray(objects)) {
            return [];
        }
        
        let filtered = objects.filter(obj => {
            // Filter by complexity level
            if (filterLevel !== "all") {
                const level = mode === "looker" 
                    ? obj.complexity_level_looker 
                    : mode === "custom"
                    ? obj.complexity_level_custom
                    : obj.complexity_level_looker || obj.complexity_level_custom;
                
                if (level !== filterLevel) return false;
            }

            // Filter by search term
            if (searchTerm) {
                const searchLower = searchTerm.toLowerCase();
                return (
                    obj.name.toLowerCase().includes(searchLower) ||
                    obj.object_type.toLowerCase().includes(searchLower) ||
                    obj.path?.toLowerCase().includes(searchLower)
                );
            }

            return true;
        });

        // Sort
        filtered.sort((a, b) => {
            let aValue: any;
            let bValue: any;

            switch (sortBy) {
                case "name":
                    aValue = a.name.toLowerCase();
                    bValue = b.name.toLowerCase();
                    break;
                case "type":
                    aValue = a.object_type.toLowerCase();
                    bValue = b.object_type.toLowerCase();
                    break;
                case "score":
                    aValue = mode === "looker"
                        ? a.complexity_score_looker || 0
                        : mode === "custom"
                        ? a.complexity_score_custom || 0
                        : Math.max(a.complexity_score_looker || 0, a.complexity_score_custom || 0);
                    bValue = mode === "looker"
                        ? b.complexity_score_looker || 0
                        : mode === "custom"
                        ? b.complexity_score_custom || 0
                        : Math.max(b.complexity_score_looker || 0, b.complexity_score_custom || 0);
                    break;
            }

            if (sortOrder === "asc") {
                return aValue > bValue ? 1 : -1;
            } else {
                return aValue < bValue ? 1 : -1;
            }
        });

        return filtered;
    }, [objects, filterLevel, searchTerm, sortBy, sortOrder, mode]);

    // Prepare chart data
    const distributionData = useMemo(() => {
        if (!complexitySummary) return [];

        const dist = mode === "looker" 
            ? complexitySummary.looker.distribution 
            : mode === "custom"
            ? complexitySummary.custom.distribution
            : { ...complexitySummary.looker.distribution, ...complexitySummary.custom.distribution };

        return Object.entries(dist).map(([level, count]) => ({
            name: COMPLEXITY_LABELS[level as keyof typeof COMPLEXITY_LABELS] || level,
            value: count,
            level,
        }));
    }, [complexitySummary, mode]);

    // Top complex objects
    const topComplexObjects = useMemo(() => {
        return filteredAndSortedObjects
            .filter(obj => {
                const score = mode === "looker"
                    ? obj.complexity_score_looker
                    : mode === "custom"
                    ? obj.complexity_score_custom
                    : Math.max(obj.complexity_score_looker || 0, obj.complexity_score_custom || 0);
                return score !== null && score !== undefined;
            })
            .slice(0, 10);
    }, [filteredAndSortedObjects, mode]);

    // Complexity by object type
    const complexityByType = useMemo(() => {
        const typeMap = new Map<string, { count: number; totalScore: number; avgScore: number }>();

        filteredAndSortedObjects.forEach(obj => {
            const score = mode === "looker"
                ? obj.complexity_score_looker
                : mode === "custom"
                ? obj.complexity_score_custom
                : Math.max(obj.complexity_score_looker || 0, obj.complexity_score_custom || 0);

            if (score !== null && score !== undefined) {
                const existing = typeMap.get(obj.object_type) || { count: 0, totalScore: 0, avgScore: 0 };
                existing.count++;
                existing.totalScore += score;
                existing.avgScore = existing.totalScore / existing.count;
                typeMap.set(obj.object_type, existing);
            }
        });

        return Array.from(typeMap.entries())
            .map(([type, data]) => ({
                type,
                count: data.count,
                avgScore: data.avgScore,
            }))
            .sort((a, b) => b.avgScore - a.avgScore)
            .slice(0, 10);
    }, [filteredAndSortedObjects, mode]);

    const getComplexityBadge = (level: string | null | undefined) => {
        if (!level) return null;
        const color = COMPLEXITY_COLORS[level as keyof typeof COMPLEXITY_COLORS] || "#gray";
        return (
            <Badge 
                style={{ backgroundColor: color, color: "white" }}
                className="text-xs"
            >
                {COMPLEXITY_LABELS[level as keyof typeof COMPLEXITY_LABELS] || level}
            </Badge>
        );
    };

    const getComplexityScore = (obj: ExtractedObject) => {
        if (mode === "looker") return obj.complexity_score_looker;
        if (mode === "custom") return obj.complexity_score_custom;
        return Math.max(obj.complexity_score_looker || 0, obj.complexity_score_custom || 0);
    };

    const getComplexityLevel = (obj: ExtractedObject) => {
        if (mode === "looker") return obj.complexity_level_looker;
        if (mode === "custom") return obj.complexity_level_custom;
        return obj.complexity_level_looker || obj.complexity_level_custom;
    };

    const handleExport = () => {
        const csv = [
            ["Name", "Type", "Path", "Looker Score", "Looker Level", "Custom Score", "Custom Level", "Hierarchy Depth", "Hierarchy Path"].join(","),
            ...filteredAndSortedObjects.map(obj => [
                `"${obj.name}"`,
                obj.object_type,
                `"${obj.path || ""}"`,
                obj.complexity_score_looker || "",
                obj.complexity_level_looker || "",
                obj.complexity_score_custom || "",
                obj.complexity_level_custom || "",
                (obj as any).hierarchy_depth || "",
                `"${(obj as any).hierarchy_path || ""}"`,
            ].join(","))
        ].join("\n");

        const blob = new Blob([csv], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `complexity-report-${assessmentId}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    return (
        <div className="space-y-6">
            {/* Mode Selector */}
            <div className="flex items-center justify-between">
                <Tabs value={mode} onValueChange={(v) => setMode(v as any)}>
                    <TabsList>
                        <TabsTrigger value="both">Both Modes</TabsTrigger>
                        <TabsTrigger value="looker">Looker Perspective</TabsTrigger>
                        <TabsTrigger value="custom">Custom Mapping</TabsTrigger>
                    </TabsList>
                </Tabs>
                <Button onClick={handleExport} variant="outline" size="sm">
                    <Download className="mr-2 h-4 w-4" />
                    Export CSV
                </Button>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {isLoadingSummary ? (
                    <div className="col-span-4 flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : complexitySummary ? (
                    <>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Average Complexity</CardTitle>
                                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {mode === "looker"
                                        ? complexitySummary.looker.average_score?.toFixed(1) || "-"
                                        : mode === "custom"
                                        ? complexitySummary.custom.average_score?.toFixed(1) || "-"
                                        : ((complexitySummary.looker.average_score || 0) + (complexitySummary.custom.average_score || 0)) / 2}
                                </div>
                                <p className="text-xs text-muted-foreground">Out of 100</p>
                            </CardContent>
                        </Card>

                        {Object.entries(COMPLEXITY_LABELS).map(([level, label]) => {
                            const dist = mode === "looker"
                                ? complexitySummary.looker.distribution
                                : mode === "custom"
                                ? complexitySummary.custom.distribution
                                : { ...complexitySummary.looker.distribution, ...complexitySummary.custom.distribution };
                            const count = dist[level] || 0;
                            const total = Object.values(dist).reduce((a, b) => a + b, 0);
                            const percentage = total > 0 ? (count / total) * 100 : 0;

                            return (
                                <Card key={level}>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">{label}</CardTitle>
                                        <div 
                                            className="h-4 w-4 rounded-full"
                                            style={{ backgroundColor: COMPLEXITY_COLORS[level as keyof typeof COMPLEXITY_COLORS] }}
                                        />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">{count}</div>
                                        <p className="text-xs text-muted-foreground">
                                            {percentage.toFixed(1)}% of objects
                                        </p>
                                        <Progress 
                                            value={percentage} 
                                            className="h-1.5 mt-2"
                                            style={{ 
                                                backgroundColor: `${COMPLEXITY_COLORS[level as keyof typeof COMPLEXITY_COLORS]}20`,
                                            }}
                                        />
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </>
                ) : (
                    <div className="col-span-4">
                        <Card>
                            <CardContent className="py-12">
                                <div className="flex flex-col items-center justify-center text-center space-y-4">
                                    <FileBarChart className="h-12 w-12 text-muted-foreground" />
                                    <div>
                                        <h3 className="text-lg font-semibold">No Complexity Data Available</h3>
                                        <p className="text-sm text-muted-foreground mt-2">
                                            Generate complexity report to view analysis.
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>

            {/* Charts */}
            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <PieChartIcon className="h-4 w-4" />
                            Complexity Distribution
                        </CardTitle>
                        <CardDescription>Distribution of objects by complexity level</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {distributionData.length > 0 ? (
                            <div className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={distributionData}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            outerRadius={80}
                                            fill="#8884d8"
                                            dataKey="value"
                                            label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                                        >
                                            {distributionData.map((entry, index) => (
                                                <Cell 
                                                    key={`cell-${index}`} 
                                                    fill={COMPLEXITY_COLORS[entry.level as keyof typeof COMPLEXITY_COLORS] || "#8884d8"} 
                                                />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                                No complexity data available
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BarChart3 className="h-4 w-4" />
                            Complexity by Object Type
                        </CardTitle>
                        <CardDescription>Average complexity score by object type</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {complexityByType.length > 0 ? (
                            <div className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={complexityByType}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis 
                                            dataKey="type" 
                                            angle={-45}
                                            textAnchor="end"
                                            height={100}
                                            tick={{ fontSize: 12 }}
                                        />
                                        <YAxis />
                                        <Tooltip />
                                        <Bar 
                                            dataKey="avgScore" 
                                            fill="#8884d8"
                                            name="Avg Complexity"
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                                No complexity data available
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Filters and Search */}
            <Card>
                <CardHeader>
                    <CardTitle>Objects with Complexity Scores</CardTitle>
                    <CardDescription>
                        {filteredAndSortedObjects.length} object{filteredAndSortedObjects.length !== 1 ? 's' : ''} found
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-4 mb-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search objects..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <Select value={filterLevel} onValueChange={setFilterLevel}>
                            <SelectTrigger className="w-[180px]">
                                <Filter className="mr-2 h-4 w-4" />
                                <SelectValue placeholder="Filter by level" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Levels</SelectItem>
                                <SelectItem value="low">Low</SelectItem>
                                <SelectItem value="medium">Medium</SelectItem>
                                <SelectItem value="high">High</SelectItem>
                                <SelectItem value="critical">Critical</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
                            <SelectTrigger className="w-[180px]">
                                <ArrowUpDown className="mr-2 h-4 w-4" />
                                <SelectValue placeholder="Sort by" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="score">Complexity Score</SelectItem>
                                <SelectItem value="name">Name</SelectItem>
                                <SelectItem value="type">Type</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                        >
                            {sortOrder === "asc" ? "↑" : "↓"}
                        </Button>
                    </div>

                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Complexity Score</TableHead>
                                    <TableHead>Level</TableHead>
                                    {mode === "both" && (
                                        <>
                                            <TableHead>Looker Score</TableHead>
                                            <TableHead>Custom Score</TableHead>
                                        </>
                                    )}
                                    <TableHead>Hierarchy Depth</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredAndSortedObjects.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={mode === "both" ? 7 : 5} className="text-center py-8 text-muted-foreground">
                                            No objects found
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredAndSortedObjects.map((obj) => {
                                        const score = getComplexityScore(obj);
                                        const level = getComplexityLevel(obj);
                                        
                                        return (
                                            <TableRow key={obj.id}>
                                                <TableCell className="font-medium">{obj.name}</TableCell>
                                                <TableCell className="capitalize">{obj.object_type.replace(/_/g, ' ')}</TableCell>
                                                <TableCell>
                                                    {score !== null && score !== undefined ? (
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-bold">{score.toFixed(1)}</span>
                                                            <Progress 
                                                                value={score} 
                                                                className="h-2 w-20"
                                                            />
                                                        </div>
                                                    ) : (
                                                        <span className="text-muted-foreground">-</span>
                                                    )}
                                                </TableCell>
                                                <TableCell>{getComplexityBadge(level)}</TableCell>
                                                {mode === "both" && (
                                                    <>
                                                        <TableCell>
                                                            {obj.complexity_score_looker !== null && obj.complexity_score_looker !== undefined ? (
                                                                <span>{obj.complexity_score_looker.toFixed(1)}</span>
                                                            ) : (
                                                                <span className="text-muted-foreground">-</span>
                                                            )}
                                                        </TableCell>
                                                        <TableCell>
                                                            {obj.complexity_score_custom !== null && obj.complexity_score_custom !== undefined ? (
                                                                <span>{obj.complexity_score_custom.toFixed(1)}</span>
                                                            ) : (
                                                                <span className="text-muted-foreground">-</span>
                                                            )}
                                                        </TableCell>
                                                    </>
                                                )}
                                                <TableCell>
                                                    {(obj as any).hierarchy_depth !== null && (obj as any).hierarchy_depth !== undefined
                                                        ? (obj as any).hierarchy_depth
                                                        : "-"}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* Top Complex Objects */}
            {topComplexObjects.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4" />
                            Top 10 Most Complex Objects
                        </CardTitle>
                        <CardDescription>Objects requiring the most migration effort</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {topComplexObjects.map((obj, index) => {
                                const score = getComplexityScore(obj);
                                const level = getComplexityLevel(obj);
                                
                                return (
                                    <div key={obj.id} className="flex items-center justify-between p-3 border rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted font-bold text-sm">
                                                {index + 1}
                                            </div>
                                            <div>
                                                <div className="font-medium">{obj.name}</div>
                                                <div className="text-sm text-muted-foreground capitalize">
                                                    {obj.object_type.replace(/_/g, ' ')}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="text-right">
                                                <div className="font-bold text-lg">{score?.toFixed(1)}</div>
                                                <div className="text-xs text-muted-foreground">Score</div>
                                            </div>
                                            {getComplexityBadge(level)}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
