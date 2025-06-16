-- Drop existing table if exists
DROP TABLE IF EXISTS "user_profiles";

-- Create user_profiles table
CREATE TABLE "user_profiles" (
    "id" BIGSERIAL PRIMARY KEY,
    "user_id" BIGINT NOT NULL UNIQUE,
    "first_name" VARCHAR(255) NOT NULL,
    "last_name" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL UNIQUE,
    "created_at" TIMESTAMPTZ (6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ (6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "user_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE
);

-- Create index
CREATE INDEX "idx_user_profiles_name" ON "user_profiles" ("first_name", "last_name");