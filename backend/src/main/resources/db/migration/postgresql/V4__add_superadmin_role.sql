-- V3 Add Superadmin Role (PostgreSQL)

-- Add superadmin role to the roles table
INSERT INTO
    roles (name, description)
VALUES (
        'superadmin',
        'Super administrator with highest privileges and system-wide access'
    ) ON CONFLICT (name) DO NOTHING;