DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM "User" WHERE "role" NOT IN ('PARTICIPANT', 'ORGANIZER')
  ) THEN
    RAISE EXCEPTION 'Unsupported User.role values exist; reconcile them before applying this migration.';
  END IF;

  IF EXISTS (
    SELECT 1 FROM "Poll"
    WHERE "type" NOT IN ('SINGLE_CHOICE') OR "status" NOT IN ('DRAFT', 'ACTIVE')
  ) THEN
    RAISE EXCEPTION 'Unsupported Poll.type or Poll.status values exist; reconcile them before applying this migration.';
  END IF;
END;
$$;

CREATE TYPE "UserRole" AS ENUM ('PARTICIPANT', 'ORGANIZER');
CREATE TYPE "PollType" AS ENUM ('SINGLE_CHOICE');
CREATE TYPE "PollStatus" AS ENUM ('DRAFT', 'ACTIVE');

ALTER TABLE "User"
  ALTER COLUMN "role" DROP DEFAULT,
  ALTER COLUMN "role" TYPE "UserRole" USING ("role"::"UserRole"),
  ALTER COLUMN "role" SET DEFAULT 'PARTICIPANT';

ALTER TABLE "Poll"
  ALTER COLUMN "type" DROP DEFAULT,
  ALTER COLUMN "type" TYPE "PollType" USING ("type"::"PollType"),
  ALTER COLUMN "type" SET DEFAULT 'SINGLE_CHOICE',
  ALTER COLUMN "status" DROP DEFAULT,
  ALTER COLUMN "status" TYPE "PollStatus" USING ("status"::"PollStatus"),
  ALTER COLUMN "status" SET DEFAULT 'DRAFT';

CREATE UNIQUE INDEX "Option_id_pollId_key" ON "Option"("id", "pollId");

ALTER TABLE "Vote"
  DROP CONSTRAINT "Vote_optionId_fkey",
  ADD CONSTRAINT "Vote_optionId_pollId_fkey"
    FOREIGN KEY ("optionId", "pollId")
    REFERENCES "Option"("id", "pollId")
    ON DELETE RESTRICT ON UPDATE CASCADE;
