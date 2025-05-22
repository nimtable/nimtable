CREATE TABLE "table_summaries" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
	"catalog_name" varchar(255) NOT NULL,
	"namespace" varchar(255) NOT NULL,
	"table_name" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"created_by" varchar(255) NOT NULL,
	"summary" text NOT NULL
);
CREATE INDEX "idx_table_summaries_catalog_name_namespace_table" ON table_summaries(catalog_name, namespace, table_name, created_at DESC);
