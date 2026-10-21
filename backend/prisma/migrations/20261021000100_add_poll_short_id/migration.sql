ALTER TABLE "Poll" ADD COLUMN "shortId" TEXT;

UPDATE "Poll"
SET "shortId" = md5("id" || random()::text || clock_timestamp()::text);

ALTER TABLE "Poll" ALTER COLUMN "shortId" SET NOT NULL;

CREATE UNIQUE INDEX "Poll_shortId_key" ON "Poll"("shortId");
