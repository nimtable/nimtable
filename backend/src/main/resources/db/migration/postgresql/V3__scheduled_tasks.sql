-- V3 Scheduled Tasks
CREATE TABLE scheduled_tasks (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    task_name varchar(255) NOT NULL,
    catalog_name varchar(255) NOT NULL,
    namespace varchar(255) NOT NULL,
    table_name varchar(255) NOT NULL,
    cron_expression varchar(255) NOT NULL,
    task_type varchar(50) NOT NULL DEFAULT 'COMPACTION',
    is_enabled boolean NOT NULL DEFAULT true,
    
    -- Compaction parameters
    snapshot_retention boolean NOT NULL DEFAULT false,
    retention_period bigint NOT NULL DEFAULT 432000000, -- 5 days in ms
    min_snapshots_to_keep integer NOT NULL DEFAULT 1,
    orphan_file_deletion boolean NOT NULL DEFAULT false,
    orphan_file_retention bigint NOT NULL DEFAULT 86400000, -- 1 day in ms
    compaction boolean NOT NULL DEFAULT true,
    target_file_size_bytes bigint NOT NULL DEFAULT 536870912, -- 512MB
    strategy varchar(50),
    sort_order varchar(500),
    where_clause varchar(1000),
    
    -- Task metadata
    last_run_at timestamp with time zone,
    last_run_status varchar(50),
    last_run_message text,
    next_run_at timestamp with time zone,
    created_by varchar(255),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    
    UNIQUE(task_name)
);

-- Create indexes
CREATE INDEX idx_scheduled_tasks_catalog_namespace_table ON scheduled_tasks(catalog_name, namespace, table_name);
CREATE INDEX idx_scheduled_tasks_enabled ON scheduled_tasks(is_enabled);
CREATE INDEX idx_scheduled_tasks_next_run ON scheduled_tasks(next_run_at) WHERE is_enabled = true;
CREATE INDEX idx_scheduled_tasks_type ON scheduled_tasks(task_type); 