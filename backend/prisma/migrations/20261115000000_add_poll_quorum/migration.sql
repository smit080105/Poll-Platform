ALTER TABLE "Poll"
ADD COLUMN "minimumVotes" INTEGER;

ALTER TABLE "Poll"
ADD CONSTRAINT "Poll_minimumVotes_check"
CHECK ("minimumVotes" IS NULL OR "minimumVotes" > 0);

ALTER TABLE "Poll"
ADD CONSTRAINT "Poll_minimumVotes_maxVotes_check"
CHECK (
  "minimumVotes" IS NULL
  OR "maxVotes" IS NULL
  OR "minimumVotes" <= "maxVotes"
);
