/*
 * Copyright 2025 Nimtable
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

"use client"

import { Database, Plus, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { TopNavbar } from "@/components/shared/top-navbar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState, useEffect, useCallback } from "react"

interface CatalogTemplate {
    name: string;
    type: string;
    uri: string;
    warehouse: string;
    properties: Array<{ key: string; value: string }>;
}

const CATALOG_TEMPLATES: Record<string, CatalogTemplate> = {
    "custom": {
        name: "Custom",
        type: "",
        uri: "",
        warehouse: "",
        properties: []
    },
    "rest-s3": {
        name: "REST + S3",
        type: "rest",
        uri: "http://localhost:8181",
        warehouse: "s3://warehouse/wh/",
        properties: [
            { key: "io-impl", value: "org.apache.iceberg.aws.s3.S3FileIO" },
            { key: "s3.endpoint", value: "http://localhost:9000" },
            { key: "s3.access-key-id", value: "admin" },
            { key: "s3.secret-access-key", value: "password" },
            { key: "s3.region", value: "us-east-1" },
            { key: "s3.path-style-access", value: "true" }
        ]
    },
    "jdbc-s3": {
        name: "JDBC + S3",
        type: "jdbc",
        uri: "jdbc:postgresql://localhost:5432/db",
        warehouse: "s3://warehouse/wh/",
        properties: [
            { key: "jdbc.schema-version", value: "V1" },
            { key: "io-impl", value: "org.apache.iceberg.aws.s3.S3FileIO" },
            { key: "s3.endpoint", value: "http://localhost:9000" },
            { key: "s3.access-key-id", value: "admin" },
            { key: "s3.secret-access-key", value: "password" },
            { key: "s3.region", value: "us-east-1" },
            { key: "s3.path-style-access", value: "true" },
            { key: "jdbc.user", value: "admin" },
            { key: "jdbc.password", value: "password" },
            { key: "client.region", value: "us-east-1" }
        ]
    },
    "s3-tables": {
        name: "S3 Tables",
        type: "rest",
        uri: "https://s3tables.us-east-1.amazonaws.com/iceberg",
        warehouse: "arn:aws:s3tables:us-east-1:xxxxx:bucket/your-bucket",
        properties: [
            { key: "io-impl", value: "org.apache.iceberg.aws.s3.S3FileIO" },
            { key: "s3.access-key-id", value: "admin" },
            { key: "s3.secret-access-key", value: "password" },
            { key: "s3.region", value: "us-east-1" },
            { key: "s3.path-style-access", value: "true" },
            { key: "rest.sigv4-enabled", value: "true" },
            { key: "rest.signing-name", value: "s3tables" },
            { key: "rest.signing-region", value: "us-east-1" },
            { key: "rest.access-key-id", value: "admin" },
            { key: "rest.secret-access-key", value: "password" },
            { key: "client.region", value: "us-east-1" }
        ]
    },
    "glue-s3": {
        name: "Glue + S3",
        type: "glue",
        uri: "",
        warehouse: "s3://your-bucket/test",
        properties: []
    }
}

export default function NewCatalogPage() {
    const router = useRouter()
    const { toast } = useToast()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [selectedTemplate, setSelectedTemplate] = useState<string>("rest-s3")
    const [formData, setFormData] = useState({
        name: "",
        type: "rest",
        uri: "http://localhost:8181",
        warehouse: "s3://warehouse/wh/",
        properties: [
            { key: "io-impl", value: "org.apache.iceberg.aws.s3.S3FileIO" },
            { key: "s3.endpoint", value: "http://localhost:9000" },
            { key: "s3.access-key-id", value: "admin" },
            { key: "s3.secret-access-key", value: "password" },
            { key: "s3.region", value: "us-east-1" },
            { key: "s3.path-style-access", value: "true" }
        ]
    })

    const applyTemplate = useCallback((templateKey: string) => {
        const template = CATALOG_TEMPLATES[templateKey as keyof typeof CATALOG_TEMPLATES]
        if (template) {
            setFormData(prevData => ({
                ...prevData,
                type: template.type,
                uri: template.uri,
                warehouse: template.warehouse,
                properties: template.properties
            }))
        }
    }, [])

    // Apply the default template on mount
    useEffect(() => {
        applyTemplate("rest-s3")
    }, [applyTemplate])

    const handleTemplateChange = (value: string) => {
        setSelectedTemplate(value)
        if (value === "custom") {
            setFormData({
                name: "",
                type: "",
                uri: "",
                warehouse: "",
                properties: []
            })
        } else {
            applyTemplate(value)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)

        try {
            // Convert properties array to object
            const properties = formData.properties.reduce((acc, { key, value }) => {
                if (key && value) {
                    acc[key] = value
                }
                return acc
            }, {} as Record<string, string>)

            const response = await fetch("/api/catalogs", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    ...formData,
                    properties
                }),
            })

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || errorData.error || "Failed to create catalog");
            }

            toast({
                title: "Catalog created successfully",
                description: "The catalog has been added to the database.",
            })

            router.push("/catalog?catalog=" + formData.name)
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
            toast({
                variant: "destructive",
                title: "Failed to create catalog",
                description: errorMessage,
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handlePropertyChange = (index: number, field: 'key' | 'value', value: string) => {
        setFormData(prev => {
            const newProperties = [...prev.properties]
            newProperties[index] = { ...newProperties[index], [field]: value }
            return { ...prev, properties: newProperties }
        })
    }

    const addProperty = () => {
        setFormData(prev => ({
            ...prev,
            properties: [...prev.properties, { key: "", value: "" }]
        }))
    }

    const removeProperty = (index: number) => {
        setFormData(prev => ({
            ...prev,
            properties: prev.properties.filter((_, i) => i !== index)
        }))
    }

    return (
        <div className="h-full w-full overflow-auto bg-muted/5 flex flex-col">
            <TopNavbar />

            <div className="flex-1 flex justify-center">
                <div className="w-full max-w-5xl px-6 py-8">
                    {/* Header */}
                    <div className="flex items-center gap-3 mb-8">
                        <div className="h-12 w-12 rounded-lg bg-blue-600/10 border border-blue-600/20 flex items-center justify-center">
                            <Database className="h-6 w-6 text-blue-600" />
                        </div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-3xl font-bold">Create New Catalog</h1>
                        </div>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Catalog Configuration</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="template">Catalog Template</Label>
                                    <Select value={selectedTemplate} onValueChange={handleTemplateChange}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a template" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Object.entries(CATALOG_TEMPLATES).map(([key, template]) => (
                                                <SelectItem key={key} value={key}>
                                                    {template.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="name">Catalog Name</Label>
                                    <Input
                                        id="name"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        placeholder="Enter catalog name"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="type">Catalog Type</Label>
                                    <Input
                                        id="type"
                                        name="type"
                                        value={formData.type}
                                        onChange={handleChange}
                                        placeholder="jdbc"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="uri">URI</Label>
                                    <Input
                                        id="uri"
                                        name="uri"
                                        value={formData.uri}
                                        onChange={handleChange}
                                        placeholder={
                                            formData.type === "jdbc" 
                                                ? "jdbc:postgresql://localhost:5432/db" 
                                                : "Enter catalog URI"
                                        }
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="warehouse">Warehouse</Label>
                                    <Input
                                        id="warehouse"
                                        name="warehouse"
                                        value={formData.warehouse}
                                        onChange={handleChange}
                                        placeholder="Enter warehouse"
                                    />
                                </div>

                                {formData.type === "glue" && (
                                    <div className="rounded-md bg-yellow-50 p-4">
                                        <div className="flex">
                                            <div className="flex-shrink-0">
                                                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                            <div className="ml-3">
                                                <h3 className="text-sm font-medium text-yellow-800">AWS Credentials Required</h3>
                                                <div className="mt-2 text-sm text-yellow-700">
                                                    <p>For Glue catalog, you need to provide AWS credentials either through environment variables (AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY) or in your Docker configuration.</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Label>Properties</Label>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={addProperty}
                                            className="h-8"
                                        >
                                            <Plus className="h-4 w-4 mr-2" />
                                            Add Property
                                        </Button>
                                    </div>
                                    <div className="space-y-3">
                                        {formData.properties.map((property, index) => (
                                            <div key={index} className="flex items-center gap-2">
                                                <Input
                                                    placeholder="Key"
                                                    value={property.key}
                                                    onChange={(e) => handlePropertyChange(index, 'key', e.target.value)}
                                                    className="flex-1"
                                                />
                                                <Input
                                                    placeholder="Value"
                                                    value={property.value}
                                                    onChange={(e) => handlePropertyChange(index, 'value', e.target.value)}
                                                    className="flex-1"
                                                />
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => removeProperty(index)}
                                                    className="h-9 w-9"
                                                >
                                                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex justify-end gap-4">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => router.back()}
                                    >
                                        Cancel
                                    </Button>
                                    <Button type="submit" disabled={isSubmitting}>
                                        {isSubmitting ? "Creating..." : "Create Catalog"}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
} 