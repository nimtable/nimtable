{{/* Expand the chart name. */}}
{{- define "nimtable.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/* Create a release-qualified name. */}}
{{- define "nimtable.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/* Common labels. */}}
{{- define "nimtable.labels" -}}
helm.sh/chart: {{ printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" }}
app.kubernetes.io/name: {{ include "nimtable.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/* Selector labels for a component. Expects a dict with root and component. */}}
{{- define "nimtable.selectorLabels" -}}
app.kubernetes.io/name: {{ include "nimtable.name" .root }}
app.kubernetes.io/instance: {{ .root.Release.Name }}
app.kubernetes.io/component: {{ .component }}
{{- end }}

{{- define "nimtable.webName" -}}
{{- printf "%s-web" (include "nimtable.fullname" .) | trunc 63 | trimSuffix "-" }}
{{- end }}

{{- define "nimtable.backendName" -}}
{{- printf "%s-backend" (include "nimtable.fullname" .) | trunc 63 | trimSuffix "-" }}
{{- end }}

{{- define "nimtable.postgresqlName" -}}
{{- printf "%s-postgresql" (include "nimtable.fullname" .) | trunc 63 | trimSuffix "-" }}
{{- end }}

{{- define "nimtable.secretName" -}}
{{- printf "%s-config" (include "nimtable.fullname" .) | trunc 63 | trimSuffix "-" }}
{{- end }}

{{- define "nimtable.imageTag" -}}
{{- default .Chart.AppVersion .tag }}
{{- end }}

{{- define "nimtable.databaseHost" -}}
{{- if .Values.postgresql.enabled }}
{{- include "nimtable.postgresqlName" . }}
{{- else }}
{{- required "externalDatabase.host is required when postgresql.enabled is false" .Values.externalDatabase.host }}
{{- end }}
{{- end }}

{{- define "nimtable.databasePort" -}}
{{- if .Values.postgresql.enabled }}
{{- .Values.postgresql.service.port }}
{{- else }}
{{- .Values.externalDatabase.port }}
{{- end }}
{{- end }}

{{- define "nimtable.databaseUsername" -}}
{{- if .Values.postgresql.enabled }}
{{- .Values.postgresql.auth.username }}
{{- else }}
{{- .Values.externalDatabase.username }}
{{- end }}
{{- end }}

{{- define "nimtable.databasePassword" -}}
{{- if .Values.postgresql.enabled }}
{{- .Values.postgresql.auth.password }}
{{- else }}
{{- .Values.externalDatabase.password }}
{{- end }}
{{- end }}

{{- define "nimtable.databaseName" -}}
{{- if .Values.postgresql.enabled }}
{{- .Values.postgresql.auth.database }}
{{- else }}
{{- .Values.externalDatabase.database }}
{{- end }}
{{- end }}

{{- define "nimtable.databaseUrl" -}}
{{- printf "postgresql://%s:%s@%s:%v/%s" (include "nimtable.databaseUsername" . | urlquery) (include "nimtable.databasePassword" . | urlquery) (include "nimtable.databaseHost" .) (include "nimtable.databasePort" .) (include "nimtable.databaseName" . | urlquery) }}
{{- end }}

{{- define "nimtable.databaseJdbcUrl" -}}
{{- printf "jdbc:postgresql://%s:%v/%s" (include "nimtable.databaseHost" .) (include "nimtable.databasePort" .) (include "nimtable.databaseName" .) }}
{{- end }}
