-- This schema was previously pushed to some deployed databases without its
-- migration being committed. Keep the migration safe for both those databases
-- and databases that only have the initial migration.
BEGIN;

-- CreateTable
CREATE TABLE IF NOT EXISTS "Role" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "permissions" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Role_name_key" ON "Role"("name");

-- Add the column as nullable so existing users can be backfilled first.
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "roleId" TEXT;

-- Existing users receive the least-privileged role. The seed script can still
-- create the normal guest role on empty databases.
INSERT INTO "Role" (
    "id",
    "name",
    "description",
    "permissions",
    "createdAt",
    "updatedAt"
)
SELECT
    'migration-default-guest-role',
    'guest',
    'Default role assigned while adding role-based access',
    '{"create":false,"read":true,"update":false,"delete":false}'::JSONB,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
WHERE EXISTS (SELECT 1 FROM "User" WHERE "roleId" IS NULL)
  AND NOT EXISTS (SELECT 1 FROM "Role" WHERE "name" = 'guest');

UPDATE "User"
SET "roleId" = (SELECT "id" FROM "Role" WHERE "name" = 'guest')
WHERE "roleId" IS NULL;

ALTER TABLE "User" ALTER COLUMN "roleId" SET NOT NULL;

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'User_roleId_fkey'
          AND conrelid = '"User"'::regclass
    ) THEN
        ALTER TABLE "User"
            ADD CONSTRAINT "User_roleId_fkey"
            FOREIGN KEY ("roleId") REFERENCES "Role"("id")
            ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

COMMIT;
