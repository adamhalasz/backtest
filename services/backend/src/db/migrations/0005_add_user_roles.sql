-- Add role column to user table
ALTER TABLE "user" ADD COLUMN "role" TEXT NOT NULL DEFAULT 'user';

-- Create index on role for efficient queries
CREATE INDEX "user_role_idx" ON "user" ("role");

-- Update existing adamfsh@gmail.com user to admin
UPDATE "user" SET "role" = 'admin' WHERE "email" = 'adamfsh@gmail.com';
