-- Add role column to user table
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "role" TEXT NOT NULL DEFAULT 'user';

-- Create index on role for efficient queries
CREATE INDEX IF NOT EXISTS "user_role_idx" ON "user" ("role");

-- Update existing adamfsh@gmail.com user to admin
UPDATE "user" SET "role" = 'admin' WHERE "email" = 'adamfsh@gmail.com';
