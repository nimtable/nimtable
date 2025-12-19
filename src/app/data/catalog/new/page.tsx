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

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TopNavbar } from "@/components/shared/top-navbar"
import { useState, useEffect, useCallback } from "react"
import { Database, Plus, Trash2 } from "lucide-react"
import { createCatalog } from "@/lib/client/sdk.gen"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import * as yaml from "js-yaml"

interface CatalogTemplate {
  name: string
  type?: string
  uri?: string
  warehouse?: string
  properties?: Array<{ key: string; value: string }>
  inputPlaceholder?: string
  inputType: "yaml" | "spark-cli" | "spark-defaults" | "form"
}

const YAML_EXAMPLE = `catalogs:
 - name: my-yaml-catalog
   type: rest
   uri: http://localhost:8181
   warehouse: s3://warehouse/wh/
   io-impl: org.apache.iceberg.aws.s3.S3FileIO
   s3.endpoint: http://localhost:9000
   s3.access-key-id: admin
   s3.secret-access-key: password
   s3.region: us-east-1
   s3.path-style-access: true
`

const SPARK_CLI_EXAMPLE = `spark-sql --packages org.apache.iceberg:iceberg-spark-runtime-4.0_2.13:1.10.0,org.apache.iceberg:iceberg-aws-bundle:1.10.0 \\
    --conf spark.sql.catalog.my_catalog=org.apache.iceberg.spark.SparkCatalog \\
    --conf spark.sql.catalog.my_catalog.warehouse=s3://my-bucket/my/key/prefix \\    
    --conf spark.sql.catalog.my_catalog.type=glue \\
    --conf spark.sql.catalog.my_catalog.client.factory=org.apache.iceberg.aws.AssumeRoleAwsClientFactory \\
    --conf spark.sql.catalog.my_catalog.client.assume-role.arn=arn:aws:iam::123456789:role/myRoleToAssume \\
    --conf spark.sql.catalog.my_catalog.client.assume-role.region=ap-northeast-1

# Or just relevant parameters:

spark.sql.catalog.rest_prod = org.apache.iceberg.spark.SparkCatalog
spark.sql.catalog.rest_prod.type = rest
spark.sql.catalog.rest_prod.uri = http://localhost:8080
`

const SPARK_DEFAULTS_EXAMPLE = `spark.jars.packages                                  org.apache.iceberg:iceberg-spark-runtime-4.0_2.13:1.10.0
spark.sql.extensions                                 org.apache.iceberg.spark.extensions.IcebergSparkSessionExtensions
spark.sql.catalog.spark_catalog                      org.apache.iceberg.spark.SparkSessionCatalog
spark.sql.catalog.spark_catalog.type                 hive
spark.sql.catalog.local                              org.apache.iceberg.spark.SparkCatalog
spark.sql.catalog.local.type                         hadoop
spark.sql.catalog.local.warehouse                    /path/to/warehouse
spark.sql.defaultCatalog                             local

# Or just relevant parameters:

spark.sql.catalog.local                              org.apache.iceberg.spark.SparkCatalog
spark.sql.catalog.local.type                         hadoop
spark.sql.catalog.local.warehouse                    /path/to/warehouse
`

const CATALOG_TEMPLATES: Record<string, CatalogTemplate> = {
  custom: {
    name: "Custom",
    type: "",
    uri: "",
    warehouse: "",
    properties: [],
    inputType: "form",
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
      { key: "s3.path-style-access", value: "true" },
    ],
    inputType: "form",
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
      { key: "client.region", value: "us-east-1" },
    ],
    inputType: "form",
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
      { key: "client.region", value: "us-east-1" },
    ],
    inputType: "form",
  },
  "glue-s3": {
    name: "Glue + S3",
    type: "glue",
    uri: "",
    warehouse: "s3://your-bucket/test",
    properties: [],
    inputType: "form",
  },
  "load-from-yaml": {
    name: "Load from nimtable config.yaml",
    inputPlaceholder: YAML_EXAMPLE,
    inputType: "yaml",
  },
  "load-from-spark-cli": {
    name: "Load from Spark CLI parameters",
    inputPlaceholder: SPARK_CLI_EXAMPLE,
    inputType: "spark-cli",
  },
  "load-from-spark-defaults": {
    name: "Load from spark-defaults.conf",
    inputPlaceholder: SPARK_DEFAULTS_EXAMPLE,
    inputType: "spark-defaults",
  },
}

export default function NewCatalogPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedTemplateKey, setSelectedTemplateKey] =
    useState<string>("rest-s3")
  const [currentInputType, setCurrentInputType] =
    useState<CatalogTemplate["inputType"]>("form")
  const [isInputPhase, setIsInputPhase] = useState(false)
  const [textInput, setTextInput] = useState<string>("")
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
      { key: "s3.path-style-access", value: "true" },
    ],
  })

  const applyTemplate = useCallback((templateKey: string) => {
    const template =
      CATALOG_TEMPLATES[templateKey as keyof typeof CATALOG_TEMPLATES]
    if (template) {
      setSelectedTemplateKey(templateKey)
      setCurrentInputType(template.inputType)

      if (template.inputType === "form") {
        setIsInputPhase(false)
        setTextInput("")
        setFormData({
          name: "",
          type: template.type ?? "",
          uri: template.uri ?? "",
          warehouse: template.warehouse ?? "",
          properties: template.properties ?? [],
        })
      } else {
        setIsInputPhase(true)
        setTextInput("")
        setFormData({
          name: "",
          type: "",
          uri: "",
          warehouse: "",
          properties: [],
        })
      }
    }
  }, [])

  useEffect(() => {
    applyTemplate("rest-s3")
  }, [applyTemplate])

  const handleTemplateChange = (value: string) => {
    applyTemplate(value)
  }

  const handleTextInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTextInput(e.target.value)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handlePropertyChange = (
    index: number,
    field: "key" | "value",
    value: string
  ) => {
    setFormData((prev) => {
      const newProperties = [...prev.properties]
      newProperties[index] = { ...newProperties[index], [field]: value }
      return { ...prev, properties: newProperties }
    })
  }

  const addProperty = () => {
    setFormData((prev) => ({
      ...prev,
      properties: [...prev.properties, { key: "", value: "" }],
    }))
  }

  const removeProperty = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      properties: prev.properties.filter((_, i) => i !== index),
    }))
  }

  // (ignored)spark.sql.catalog.<catalog-name>.<key>(separator)<value>
  const parseSpark = (
    input: string,
    separator: string | RegExp
  ): Partial<typeof formData> => {
    const lines = input.split("\n")
    const configs: Array<[string, string]> = []
    lines.forEach((line) => {
      const trimmedLine = line.trim()
      console.log("parseSpark: %o", trimmedLine)
      if (trimmedLine && !trimmedLine.startsWith("#")) {
        let [, rest] = trimmedLine.split("spark.sql.catalog.", 2)
        console.log("parseSpark rest: %o", rest)
        if (rest) {
          if (rest.startsWith("spark_catalog")) return
          if (rest.endsWith("\\")) {
            // bash newlines
            // --conf spark.sql.catalog.local.type=hadoop \
            rest = rest.slice(0, -1).trim()
          }

          const [key, value] = rest
            .split(separator, 2)
            .map((part) => part.trim())
          configs.push([key, value])
        }
      }
    })
    return mapSparkConfigsToFormData(configs)
  }

  const parseSparkCli = (input: string): Partial<typeof formData> => {
    return parseSpark(input, "=")
  }

  const parseSparkDefaults = (input: string): Partial<typeof formData> => {
    return parseSpark(input, /\s+/)
  }

  const mapSparkConfigsToFormData = (
    configs: Array<[string, string]>
  ): Partial<typeof formData> => {
    console.log("mapSparkConfigsToFormData: %o", configs)
    let catalogName
    for (const [key] of configs) {
      if (key.split(".")) {
        catalogName = key.split(".")[0]
        break
      }
    }

    if (!catalogName) {
      throw new Error(
        "Cannot determine catalog name. Please check format (e.g., spark.sql.catalog.my_catalog=...)."
      )
    }

    const specificCatalogPrefix = `${catalogName}.`
    const extractedData: Partial<typeof formData> & {
      properties: Array<{ key: string; value: string }>
    } = {
      name: catalogName,
      type: "",
      uri: "",
      warehouse: "",
      properties: [],
    }

    for (const [key, value] of configs) {
      if (key.startsWith(specificCatalogPrefix)) {
        const subKey = key.substring(specificCatalogPrefix.length)
        switch (subKey) {
          case "type":
            extractedData.type = value
            break
          case "uri":
            extractedData.uri = value
            break
          case "warehouse":
            extractedData.warehouse = value
            break
          default:
            extractedData.properties.push({ key: subKey, value })
        }
      }
    }

    if (!extractedData.type) {
      console.warn(
        `Catalog type for '${catalogName}' not found in Spark config.`
      )
    }

    return extractedData
  }

  const parseYaml = (input: string): Partial<typeof formData> => {
    const parsedYaml = yaml.load(input) as any
    if (
      !parsedYaml ||
      typeof parsedYaml !== "object" ||
      !Array.isArray(parsedYaml.catalogs) ||
      parsedYaml.catalogs.length === 0
    ) {
      throw new Error(
        "Invalid YAML format. Expected 'catalogs' list with at least one catalog definition."
      )
    }
    const catalogFromYaml = parsedYaml.catalogs[0]
    if (
      !catalogFromYaml ||
      typeof catalogFromYaml !== "object" ||
      !catalogFromYaml.name
    ) {
      throw new Error("Invalid catalog structure in YAML. 'name' is required.")
    }
    const { name, type, uri, warehouse, ...rest } = catalogFromYaml
    const properties = Object.entries(rest).map(([key, value]) => ({
      key,
      value: String(value),
    }))
    return { name, type, uri, warehouse, properties }
  }

  const handleParseInput = () => {
    let parsedData: Partial<typeof formData> | null = null
    try {
      switch (currentInputType) {
        case "yaml":
          parsedData = parseYaml(textInput)
          break
        case "spark-cli":
          parsedData = parseSparkCli(textInput)
          break
        case "spark-defaults":
          parsedData = parseSparkDefaults(textInput)
          break
        default:
          throw new Error("Cannot parse this input type.")
      }

      if (parsedData) {
        setFormData({
          name: parsedData.name || "",
          type: parsedData.type || "",
          uri: parsedData.uri || "",
          warehouse: parsedData.warehouse || "",
          properties: parsedData.properties || [],
        })
        setIsInputPhase(false)
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "An unknown error occurred"
      console.error("Input Parsing Error:", error)
      toast({
        variant: "destructive",
        title: "Failed to parse input",
        description: errorMessage,
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isInputPhase) {
      toast({ variant: "destructive", title: "Please parse the input first." })
      return
    }
    setIsSubmitting(true)

    try {
      const properties = formData.properties.reduce(
        (acc, { key, value }) => {
          if (key && value) {
            acc[key] = value
          }
          return acc
        },
        {} as Record<string, string>
      )

      const catalogData = {
        name: formData.name,
        type: formData.type,
        uri: formData.uri,
        warehouse: formData.warehouse,
        properties,
      }

      if (!catalogData.name) {
        throw new Error("Catalog name is required.")
      }

      await createCatalog({
        body: catalogData,
      })

      toast({
        title: "Catalog created successfully",
        description: "The catalog has been added to the database.",
      })

      router.push("/data/catalog?catalog=" + catalogData.name)
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "An unknown error occurred"
      console.error("Submission Error:", error)
      toast({
        variant: "destructive",
        title: "Failed to create catalog",
        description: errorMessage,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex h-full w-full flex-col overflow-auto bg-muted/5">
      <TopNavbar />
      <div className="flex flex-1 justify-center">
        <div className="w-full max-w-5xl px-6 py-8">
          {/* Header */}
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-blue-600/20 bg-blue-600/10">
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
                  <Label htmlFor="template">
                    Catalog Template / Input Format
                  </Label>
                  <Select
                    value={selectedTemplateKey}
                    onValueChange={handleTemplateChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a template or input format" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(CATALOG_TEMPLATES).map(
                        ([key, template]) => (
                          <SelectItem key={key} value={key}>
                            {template.name}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {isInputPhase ? (
                  <div className="space-y-2">
                    <Label htmlFor="textInput">
                      Paste Configuration (
                      {CATALOG_TEMPLATES[selectedTemplateKey]?.name})
                    </Label>
                    <Textarea
                      id="textInput"
                      name="textInput"
                      value={textInput}
                      onChange={handleTextInputChange}
                      placeholder={
                        CATALOG_TEMPLATES[selectedTemplateKey]
                          ?.inputPlaceholder ?? "Paste configuration here..."
                      }
                      required
                      rows={15}
                      className="font-mono text-sm"
                    />
                    <p className="text-sm text-muted-foreground">
                      {(currentInputType === "yaml" ||
                        currentInputType === "spark-cli" ||
                        currentInputType === "spark-defaults") &&
                        "Only the first parsed catalog will be used."}
                    </p>
                    <div className="flex justify-end">
                      <Button
                        type="button"
                        onClick={handleParseInput}
                        className="mt-2"
                        disabled={!textInput.trim()}
                      >
                        Parse Input
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
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
                        placeholder="e.g., rest, jdbc, hadoop, glue"
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
                            ? "jdbc:postgresql://..."
                            : formData.type === "rest"
                              ? "http://..."
                              : "Enter catalog URI (if applicable)"
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
                        placeholder="e.g., s3://bucket/path, /path/to/warehouse"
                        required
                      />
                    </div>

                    {formData.type === "glue" && (
                      <div className="rounded-md bg-yellow-50 p-4">
                        <div className="flex">
                          <div className="flex-shrink-0">
                            <svg
                              className="h-5 w-5 text-yellow-400"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path
                                fillRule="evenodd"
                                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </div>
                          <div className="ml-3">
                            <h3 className="text-sm font-medium text-yellow-800">
                              AWS Credentials Required
                            </h3>
                            <div className="mt-2 text-sm text-yellow-700">
                              <p>
                                For Glue catalog, ensure AWS credentials
                                (AWS_REGION, AWS_ACCESS_KEY_ID,
                                AWS_SECRET_ACCESS_KEY) are configured in the
                                environment or Docker setup.
                              </p>
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
                          <Plus className="mr-2 h-4 w-4" />
                          Add Property
                        </Button>
                      </div>
                      <div className="space-y-3">
                        {formData.properties.map((property, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <Input
                              placeholder="Key"
                              value={property.key}
                              onChange={(e) =>
                                handlePropertyChange(
                                  index,
                                  "key",
                                  e.target.value
                                )
                              }
                              className="flex-1"
                            />
                            <Input
                              placeholder="Value"
                              value={property.value}
                              onChange={(e) =>
                                handlePropertyChange(
                                  index,
                                  "value",
                                  e.target.value
                                )
                              }
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
                  </>
                )}

                <div className="flex justify-end gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                  >
                    Cancel
                  </Button>
                  {!isInputPhase && (
                    <Button
                      type="submit"
                      disabled={
                        isSubmitting ||
                        !formData.name ||
                        !formData.type ||
                        !formData.warehouse
                      }
                    >
                      {isSubmitting ? "Creating..." : "Create Catalog"}
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
