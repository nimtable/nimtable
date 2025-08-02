-- Add AI settings table for user-configurable AI endpoints and API keys
CREATE TABLE ai_settings (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    endpoint VARCHAR(1024) NOT NULL DEFAULT 'https://api.openai.com/v1',
    api_key VARCHAR(255),
    model_name VARCHAR(100) NOT NULL DEFAULT 'gpt-4',
    is_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT ai_settings_user_id_unique UNIQUE (user_id)
);

-- Create index for faster lookups
CREATE INDEX idx_ai_settings_user_id ON ai_settings(user_id);

-- Add comment
COMMENT ON TABLE ai_settings IS 'User-configurable AI endpoint and API key settings'; 