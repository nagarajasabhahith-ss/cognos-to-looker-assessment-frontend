"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, ArrowLeft } from "lucide-react";

import { api, AssessmentCreate, AssessmentStatus } from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const formSchema = z.object({
    name: z.string().min(2, {
        message: "Assessment name must be at least 2 characters.",
    }),
    bi_tool: z.enum(["cognos", "tableau", "powerbi"], {
        required_error: "Please select a BI tool.",
    }),
});

export default function CreateAssessmentPage() {
    const router = useRouter();
    const { user } = useAuth();
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            bi_tool: "cognos",
        },
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsLoading(true);
        try {
            const response = await api.post("/assessments", values);
            // Wait a moment for UX
            setTimeout(() => {
                router.push(`/dashboard/assessment/${response.data.id}`);
            }, 500);
        } catch (error) {
            console.error("Failed to create assessment", error);
            // form.setError("root", { message: "Failed to create assessment" });
        } finally {
            // setIsLoading(false); // Kept loading until redirect
        }
    }

    return (
        <div className="container max-w-2xl py-8 space-y-8">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/dashboard">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <h1 className="text-2xl font-bold tracking-tight">Create New Assessment</h1>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Assessment Details</CardTitle>
                    <CardDescription>
                        Choose the source BI tool and name your assessment project.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Assessment Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g. Q1 Sales Migration" {...field} />
                                        </FormControl>
                                        <FormDescription>
                                            This is the display name for your migration project.
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="bi_tool"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Source BI Tool</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select a BI tool" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="cognos">IBM Cognos Analytics</SelectItem>
                                                <SelectItem value="tableau" disabled>
                                                    Tableau (Coming Soon)
                                                </SelectItem>
                                                <SelectItem value="powerbi" disabled>
                                                    Power BI (Coming Soon)
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormDescription>
                                            Select the BI platform you are migrating from.
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="flex justify-end gap-2">
                                <Button variant="outline" asChild type="button">
                                    <Link href="/dashboard">Cancel</Link>
                                </Button>
                                <Button type="submit" disabled={isLoading}>
                                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Create Assessment
                                </Button>
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}
