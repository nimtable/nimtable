import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react"
import { createCatalog } from "@/lib/client/sdk.gen"
import { errorToString } from "@/lib/utils"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { ChevronDown, Plus, Trash2 } from "lucide-react"
import * as yaml from "js-yaml"
import { useCatalogs } from "@/app/data/hooks/useCatalogs"

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
`

const SPARK_DEFAULTS_EXAMPLE = `spark.jars.packages                                  org.apache.iceberg:iceberg-spark-runtime-4.0_2.13:1.10.0
spark.sql.extensions                                 org.apache.iceberg.spark.extensions.IcebergSparkSessionExtensions
spark.sql.catalog.spark_catalog                      org.apache.iceberg.spark.SparkSessionCatalog
spark.sql.catalog.spark_catalog.type                 hive
spark.sql.catalog.local                              org.apache.iceberg.spark.SparkCatalog
spark.sql.catalog.local.type                         hadoop
spark.sql.catalog.local.warehouse                    /path/to/warehouse
spark.sql.defaultCatalog                             local
`

const CONNECTION_PRESETS: Record<string, CatalogTemplate> = {
  "local-hadoop": {
    name: "Local (Hadoop)",
    type: "hadoop",
    uri: "",
    warehouse: "/tmp/warehouse",
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
  "glue-s3": {
    name: "Glue + S3",
    type: "glue",
    uri: "",
    warehouse: "s3://your-bucket/test",
    properties: [],
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
  custom: {
    name: "Custom",
    type: "",
    uri: "",
    warehouse: "",
    properties: [],
    inputType: "form",
  },
}

const IMPORT_SOURCES: Record<string, CatalogTemplate> = {
  yaml: {
    name: "nimtable config.yaml",
    inputPlaceholder: YAML_EXAMPLE,
    inputType: "yaml",
  },
  "spark-cli": {
    name: "Spark CLI parameters",
    inputPlaceholder: SPARK_CLI_EXAMPLE,
    inputType: "spark-cli",
  },
  "spark-defaults": {
    name: "spark-defaults.conf",
    inputPlaceholder: SPARK_DEFAULTS_EXAMPLE,
    inputType: "spark-defaults",
  },
}

export type CreateCatalogFormData = {
  name: string
  type: string
  uri: string
  warehouse: string
  properties: {
    key: string
    value: string
  }[]
}

function suggestNameForPreset(presetKey: string) {
  switch (presetKey) {
    case "local-hadoop":
      return "local"
    case "rest-s3":
      return "rest_catalog"
    case "jdbc-s3":
      return "jdbc_catalog"
    case "glue-s3":
      return "glue_catalog"
    case "s3-tables":
      return "s3tables_catalog"
    default:
      return "my_catalog"
  }
}

function isSensitiveKey(key: string) {
  const k = key.toLowerCase()
  return k.includes("secret") || k.includes("password") || k.includes("token")
}

const BASIC_PROPERTY_KEYS = new Set([
  "s3.endpoint",
  "s3.region",
  "s3.access-key-id",
  "s3.secret-access-key",
  "s3.path-style-access",
])

export function CreateCatalogForm({
  onSuccess,
  renderSubmitButton,
}: {
  onSuccess?: () => void
  renderSubmitButton?: ({
    isSubmitting,
    isInputPhase,
    formData,
  }: {
    isSubmitting: boolean
    isInputPhase: boolean
    formData: CreateCatalogFormData
  }) => React.ReactNode
}) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [mode, setMode] = useState<"connect" | "import">("connect")
  const [selectedPresetKey, setSelectedPresetKey] = useState<string>("rest-s3")
  const [selectedImportKey, setSelectedImportKey] = useState<string>("yaml")
  const [importText, setImportText] = useState<string>("")
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const [isNameAuto, setIsNameAuto] = useState(true)
  const [nameError, setNameError] = useState<string>("")
  const [customTypeMode, setCustomTypeMode] = useState<"known" | "other">(
    "known"
  )
  const [customTypeOther, setCustomTypeOther] = useState("")
  const [bodyMinHeight, setBodyMinHeight] = useState<number | null>(null)
  const tabBodyRef = useRef<HTMLDivElement | null>(null)

  const { catalogs } = useCatalogs()
  const { toast } = useToast()

  const existingCatalogNames = useMemo(
    () => new Set((catalogs || []).map((c) => c.toLowerCase())),
    [catalogs]
  )

  const ensureUniqueCatalogName = useCallback(
    (base: string) => {
      if (!base) return ""
      let candidate = base
      let i = 2
      while (existingCatalogNames.has(candidate.toLowerCase())) {
        candidate = `${base}_${i}`
        i += 1
      }
      return candidate
    },
    [existingCatalogNames]
  )

  const validateCatalogName = useCallback(
    (name: string) => {
      if (!name.trim()) return "Catalog name is required."
      if (name.includes("/")) return "Catalog name cannot contain '/'."
      if (existingCatalogNames.has(name.toLowerCase())) {
        return "This catalog name already exists. Choose another name."
      }
      return ""
    },
    [existingCatalogNames]
  )

  const [formData, setFormData] = useState<CreateCatalogFormData>(() => {
    const preset = CONNECTION_PRESETS["rest-s3"]
    const suggested = ensureUniqueCatalogName(suggestNameForPreset("rest-s3"))
    return {
      name: suggested,
      type: preset.type ?? "",
      uri: preset.uri ?? "",
      warehouse: preset.warehouse ?? "",
      properties: preset.properties ?? [],
    }
  })

  const parseSpark = (
    input: string,
    separator: string | RegExp
  ): Partial<CreateCatalogFormData> => {
    const lines = input.split("\n")
    const configs: Array<[string, string]> = []
    lines.forEach((line) => {
      const trimmedLine = line.trim()
      if (trimmedLine && !trimmedLine.startsWith("#")) {
        let [, rest] = trimmedLine.split("spark.sql.catalog.", 2)
        if (rest) {
          if (rest.startsWith("spark_catalog")) return
          if (rest.endsWith("\\")) {
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

  const parseSparkCli = (input: string): Partial<CreateCatalogFormData> => {
    return parseSpark(input, "=")
  }

  const parseSparkDefaults = (
    input: string
  ): Partial<CreateCatalogFormData> => {
    return parseSpark(input, /\s+/)
  }

  const mapSparkConfigsToFormData = (
    configs: Array<[string, string]>
  ): Partial<CreateCatalogFormData> => {
    let catalogName
    for (const [key] of configs) {
      if (key.split(".")) {
        catalogName = key.split(".")[0]
        break
      }
    }

    if (!catalogName) {
      throw new Error(
        "Cannot determine catalog name. Expected keys like spark.sql.catalog.my_catalog=..."
      )
    }

    const specificCatalogPrefix = `${catalogName}.`
    const extractedData: Partial<CreateCatalogFormData> & {
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

    return extractedData
  }

  const parseYaml = (input: string): Partial<CreateCatalogFormData> => {
    const parsedYaml = yaml.load(input) as any
    if (
      !parsedYaml ||
      typeof parsedYaml !== "object" ||
      !Array.isArray(parsedYaml.catalogs) ||
      parsedYaml.catalogs.length === 0
    ) {
      throw new Error(
        "Invalid YAML format. Expected a 'catalogs' list with at least one catalog."
      )
    }

    const catalogFromYaml = parsedYaml.catalogs[0]
    if (
      !catalogFromYaml ||
      typeof catalogFromYaml !== "object" ||
      !catalogFromYaml.name
    ) {
      throw new Error("Invalid catalog YAML. 'name' is required.")
    }

    const { name, type, uri, warehouse, ...rest } = catalogFromYaml
    const properties = Object.entries(rest).map(([key, value]) => ({
      key,
      value: String(value),
    }))
    return { name, type, uri, warehouse, properties }
  }

  const applyPreset = useCallback(
    (presetKey: string) => {
      const preset =
        CONNECTION_PRESETS[presetKey as keyof typeof CONNECTION_PRESETS]
      if (!preset) return
      const suggested = ensureUniqueCatalogName(suggestNameForPreset(presetKey))
      setSelectedPresetKey(presetKey)
      // Selecting Custom should reveal the required advanced fields, but we should not
      // auto-close advanced settings when switching away.
      if (presetKey === "custom") setAdvancedOpen(true)
      if (presetKey !== "custom") {
        setCustomTypeMode("known")
        setCustomTypeOther("")
      }
      setFormData((prev) => ({
        name: isNameAuto || !prev.name ? suggested : prev.name,
        type: preset.type ?? "",
        uri: preset.uri ?? "",
        warehouse: preset.warehouse ?? "",
        properties: preset.properties ?? [],
      }))
      if (isNameAuto) setNameError("")
    },
    [ensureUniqueCatalogName, isNameAuto]
  )

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

  const getProperty = (key: string) => {
    const found = formData.properties.find((p) => p.key === key)
    return found?.value ?? ""
  }

  const setProperty = (key: string, value: string) => {
    setFormData((prev) => {
      const idx = prev.properties.findIndex((p) => p.key === key)
      const next = [...prev.properties]
      if (!value.trim()) {
        if (idx >= 0) next.splice(idx, 1)
        return { ...prev, properties: next }
      }
      if (idx >= 0) next[idx] = { ...next[idx], value }
      else next.push({ key, value })
      return { ...prev, properties: next }
    })
  }

  const hasS3Settings = useMemo(() => {
    if (formData.warehouse?.startsWith("s3://")) return true
    return formData.properties.some((p) => p.key.startsWith("s3."))
  }, [formData.properties, formData.warehouse])

  const advancedProperties = useMemo(() => {
    return formData.properties.filter((p) => !BASIC_PROPERTY_KEYS.has(p.key))
  }, [formData.properties])

  const handleParseImport = () => {
    let parsedData: Partial<CreateCatalogFormData> | null = null
    try {
      const importSource =
        IMPORT_SOURCES[selectedImportKey as keyof typeof IMPORT_SOURCES]
      if (!importSource) throw new Error("Unknown import source.")

      switch (importSource.inputType) {
        case "yaml":
          parsedData = parseYaml(importText)
          break
        case "spark-cli":
          parsedData = parseSparkCli(importText)
          break
        case "spark-defaults":
          parsedData = parseSparkDefaults(importText)
          break
      }

      if (parsedData) {
        setSelectedPresetKey("custom")
        setMode("connect")
        setAdvancedOpen(true)
        setIsNameAuto(false)
        const requestedName = (parsedData.name || "").trim()
        const unique = ensureUniqueCatalogName(requestedName || "my_catalog")
        if (requestedName && unique !== requestedName) {
          toast({
            title: "Catalog name adjusted",
            description: `Name '${requestedName}' already exists. Using '${unique}'.`,
          })
        }
        setFormData({
          name: unique,
          type: parsedData.type || "",
          uri: parsedData.uri || "",
          warehouse: parsedData.warehouse || "",
          properties: parsedData.properties || [],
        })
        setNameError(validateCatalogName(unique))
      }
    } catch (error) {
      const message = errorToString(error)
      toast({
        variant: "destructive",
        title: "Failed to parse configuration",
        description: message,
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const err = validateCatalogName(formData.name)
    setNameError(err)
    if (err) return

    if (!formData.type.trim()) {
      toast({
        variant: "destructive",
        title: "Catalog type is required",
        description:
          "Choose a preset, or set a type in Advanced settings for Custom.",
      })
      return
    }

    setIsSubmitting(true)
    try {
      const properties = formData.properties.reduce(
        (acc, { key, value }) => {
          if (key && value) acc[key] = value
          return acc
        },
        {} as Record<string, string>
      )

      const result = await createCatalog({
        body: {
          name: formData.name.trim(),
          type: formData.type,
          uri: formData.uri,
          warehouse: formData.warehouse,
          properties,
        },
        throwOnError: false,
      })

      if (result.error) {
        const status = result.response?.status
        const statusText = result.response?.statusText
        const message = errorToString(result.error)
        throw new Error(
          status
            ? `HTTP ${status}${statusText ? ` ${statusText}` : ""}: ${message}`
            : message
        )
      }

      toast({
        title: "Catalog connected",
        description: "Your catalog was saved and validated successfully.",
      })
      onSuccess?.()
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to connect catalog",
        description: errorToString(error),
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Avoid "jumping" when switching Connect/Import without adding an inner scrollbar:
  // keep a min-height equal to the tallest tab content we've seen.
  useLayoutEffect(() => {
    const el = tabBodyRef.current
    if (!el) return

    const update = () => {
      // When Radix hides inactive TabsContent, scrollHeight reflects the active panel only.
      const next = el.scrollHeight
      setBodyMinHeight((prev) => Math.max(prev ?? 0, next))
    }

    update()

    if (typeof ResizeObserver === "undefined") return
    const ro = new ResizeObserver(() => update())
    ro.observe(el)
    return () => ro.disconnect()
  }, [mode, selectedPresetKey, selectedImportKey, advancedOpen, customTypeMode])

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Tabs value={mode} onValueChange={(v) => setMode(v as typeof mode)}>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="text-base font-medium">Connect a catalog</h3>
            <p className="text-sm text-muted-foreground">
              Choose a guided setup, or paste an existing Iceberg catalog
              config.
            </p>
          </div>
          <TabsList>
            <TabsTrigger value="connect">Connect</TabsTrigger>
            <TabsTrigger value="import">Import</TabsTrigger>
          </TabsList>
        </div>

        {/* Keep a stable frame height when switching tabs (prevents layout jump). */}
        <div
          ref={tabBodyRef}
          className="pl-1 pr-2"
          style={
            bodyMinHeight ? { minHeight: `${bodyMinHeight}px` } : undefined
          }
        >
          <TabsContent value="import" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="importSource">Import source</Label>
              <Select
                value={selectedImportKey}
                onValueChange={setSelectedImportKey}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a source" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(IMPORT_SOURCES).map(([key, source]) => (
                    <SelectItem key={key} value={key}>
                      {source.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="importText">
                Paste configuration ({IMPORT_SOURCES[selectedImportKey]?.name})
              </Label>
              <Textarea
                id="importText"
                name="importText"
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder={
                  IMPORT_SOURCES[selectedImportKey]?.inputPlaceholder ??
                  "Paste configuration here..."
                }
                rows={15}
                className="font-mono text-sm"
              />
              <p className="text-sm text-muted-foreground">
                Only the first parsed catalog will be used.
              </p>
              <div className="flex justify-end">
                <Button
                  type="button"
                  onClick={handleParseImport}
                  disabled={!importText.trim()}
                >
                  Parse and continue
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="connect" className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="preset">Connection method</Label>
              <Select
                value={selectedPresetKey}
                onValueChange={(v) => {
                  setIsNameAuto(true)
                  applyPreset(v)
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a preset" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CONNECTION_PRESETS).map(([key, preset]) => (
                    <SelectItem key={key} value={key}>
                      {preset.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Choose how you want Nimtable to connect to your Iceberg catalog.
              </p>
              {selectedPresetKey === "custom" && !formData.type.trim() && (
                <p className="text-xs text-muted-foreground">
                  Custom requires a catalog type in{" "}
                  <span className="font-medium">Advanced settings</span>.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Catalog name</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={(e) => {
                  setIsNameAuto(false)
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                  setNameError(validateCatalogName(e.target.value))
                }}
                onBlur={() => {
                  setNameError(validateCatalogName(formData.name))
                }}
                placeholder="Any unique name (we provide a default)"
                aria-invalid={!!nameError}
              />
              {nameError ? (
                <p className="text-xs text-red-500">{nameError}</p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Pick any name you like. It just needs to be unique.
                </p>
              )}
            </div>

            <Separator />

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="uri">Catalog endpoint (URI)</Label>
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
                        : "Leave empty if not applicable"
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
            </div>

            {formData.type === "glue" && (
              <div className="rounded-md border border-yellow-200 bg-yellow-50 p-4">
                <h3 className="text-sm font-medium text-yellow-900">
                  AWS credentials required
                </h3>
                <p className="mt-1 text-sm text-yellow-800">
                  Ensure AWS credentials (AWS_REGION, AWS_ACCESS_KEY_ID,
                  AWS_SECRET_ACCESS_KEY) are configured in your environment.
                </p>
              </div>
            )}

            {(selectedPresetKey === "s3-tables" ||
              (formData.type === "rest" &&
                formData.uri.includes("s3tables"))) && (
              <div className="rounded-md border border-blue-200 bg-blue-50 p-4">
                <h3 className="text-sm font-medium text-blue-900">
                  AWS S3 Tables preset
                </h3>
                <p className="mt-1 text-sm text-blue-800">
                  S3 Tables uses the Iceberg REST endpoint with SigV4
                  authentication. Make sure the warehouse ARN and region are
                  correct.
                </p>
                <p className="mt-2 text-sm">
                  <a
                    href="https://docs.aws.amazon.com/AmazonS3/latest/userguide/s3-tables-integrating-open-source.html"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-700 hover:text-blue-900 underline"
                  >
                    AWS documentation →
                  </a>
                </p>
              </div>
            )}

            {hasS3Settings && (
              <div className="space-y-3">
                <div className="space-y-1">
                  <h4 className="text-sm font-medium">S3 settings</h4>
                  <p className="text-xs text-muted-foreground">
                    These map to Iceberg catalog properties (s3.*).
                  </p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="s3.endpoint">S3 endpoint</Label>
                    <Input
                      id="s3.endpoint"
                      value={getProperty("s3.endpoint")}
                      onChange={(e) =>
                        setProperty("s3.endpoint", e.target.value)
                      }
                      placeholder="e.g., http://localhost:9000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="s3.region">S3 region</Label>
                    <Input
                      id="s3.region"
                      value={getProperty("s3.region")}
                      onChange={(e) => setProperty("s3.region", e.target.value)}
                      placeholder="e.g., us-east-1"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="s3.access-key-id">Access key ID</Label>
                    <Input
                      id="s3.access-key-id"
                      value={getProperty("s3.access-key-id")}
                      onChange={(e) =>
                        setProperty("s3.access-key-id", e.target.value)
                      }
                      placeholder="e.g., AKIA..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="s3.secret-access-key">
                      Secret access key
                    </Label>
                    <Input
                      id="s3.secret-access-key"
                      type="password"
                      value={getProperty("s3.secret-access-key")}
                      onChange={(e) =>
                        setProperty("s3.secret-access-key", e.target.value)
                      }
                      placeholder="••••••••"
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="s3.path-style-access">
                      Path-style access
                    </Label>
                    <Input
                      id="s3.path-style-access"
                      value={getProperty("s3.path-style-access")}
                      onChange={(e) =>
                        setProperty("s3.path-style-access", e.target.value)
                      }
                      placeholder="true or false"
                    />
                  </div>
                </div>
              </div>
            )}

            <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">Advanced settings</h4>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8">
                    <ChevronDown className="mr-2 h-4 w-4" />
                    {advancedOpen ? "Hide" : "Show"}
                  </Button>
                </CollapsibleTrigger>
              </div>
              <CollapsibleContent className="mt-3 space-y-3">
                {selectedPresetKey === "custom" && (
                  <div className="space-y-2">
                    <Label htmlFor="type">Catalog type (required)</Label>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <Select
                        value={
                          customTypeMode === "other" ? "other" : formData.type
                        }
                        onValueChange={(v) => {
                          if (v === "other") {
                            setCustomTypeMode("other")
                            setFormData((prev) => ({ ...prev, type: "" }))
                            return
                          }
                          setCustomTypeMode("known")
                          setCustomTypeOther("")
                          setFormData((prev) => ({ ...prev, type: v }))
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a catalog type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="rest">REST</SelectItem>
                          <SelectItem value="jdbc">JDBC</SelectItem>
                          <SelectItem value="glue">Glue</SelectItem>
                          <SelectItem value="hadoop">Hadoop</SelectItem>
                          <SelectItem value="hive">Hive</SelectItem>
                          <SelectItem value="nessie">Nessie</SelectItem>
                          <SelectItem value="other">Other…</SelectItem>
                        </SelectContent>
                      </Select>

                      {customTypeMode === "other" && (
                        <Input
                          id="type"
                          name="type"
                          value={customTypeOther}
                          onChange={(e) => {
                            const v = e.target.value.trim()
                            setCustomTypeOther(v)
                            setFormData((prev) => ({ ...prev, type: v }))
                          }}
                          placeholder="Enter catalog type"
                          required
                        />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      This is the Iceberg catalog type used for validation and
                      runtime configuration.
                    </p>
                  </div>
                )}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Properties (raw)</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addProperty}
                      className="h-8"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add property
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {advancedProperties.map((property, index) => {
                      const idx = formData.properties.findIndex(
                        (p) =>
                          p.key === property.key && p.value === property.value
                      )
                      const realIndex = idx >= 0 ? idx : index
                      return (
                        <div
                          key={`${property.key}-${index}`}
                          className="flex items-center gap-2"
                        >
                          <Input
                            placeholder="Key"
                            value={property.key}
                            onChange={(e) =>
                              handlePropertyChange(
                                realIndex,
                                "key",
                                e.target.value
                              )
                            }
                            className="flex-1"
                          />
                          <Input
                            placeholder="Value"
                            type={
                              isSensitiveKey(property.key) ? "password" : "text"
                            }
                            value={property.value}
                            onChange={(e) =>
                              handlePropertyChange(
                                realIndex,
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
                            onClick={() => removeProperty(realIndex)}
                            className="h-9 w-9"
                          >
                            <Trash2 className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </div>
                      )
                    })}
                  </div>
                  {advancedProperties.length === 0 && (
                    <p className="text-xs text-muted-foreground">
                      No advanced properties. Use “Add property” to add custom
                      keys.
                    </p>
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>
          </TabsContent>
        </div>
      </Tabs>

      {renderSubmitButton?.({
        isSubmitting,
        isInputPhase: mode === "import",
        formData,
      })}
    </form>
  )
}
