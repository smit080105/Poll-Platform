CREATE TABLE "Participation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "pollId" TEXT NOT NULL,

    CONSTRAINT "Participation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Ballot" (
    "id" TEXT NOT NULL,
    "pollId" TEXT NOT NULL,
    "optionId" TEXT NOT NULL,

    CONSTRAINT "Ballot_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Participation_userId_pollId_key"
    ON "Participation"("userId", "pollId");
CREATE INDEX "Ballot_pollId_idx" ON "Ballot"("pollId");

ALTER TABLE "Participation"
    ADD CONSTRAINT "Participation_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Participation"
    ADD CONSTRAINT "Participation_pollId_fkey"
    FOREIGN KEY ("pollId") REFERENCES "Poll"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Ballot"
    ADD CONSTRAINT "Ballot_pollId_fkey"
    FOREIGN KEY ("pollId") REFERENCES "Poll"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Ballot"
    ADD CONSTRAINT "Ballot_optionId_pollId_fkey"
    FOREIGN KEY ("optionId", "pollId") REFERENCES "Option"("id", "pollId")
    ON DELETE RESTRICT ON UPDATE CASCADE;

INSERT INTO "Participation" ("id", "userId", "pollId")
SELECT "id", "userId", "pollId" FROM "Vote";

INSERT INTO "Ballot" ("id", "pollId", "optionId")
SELECT gen_random_uuid()::TEXT, "pollId", "optionId" FROM "Vote";

DROP TABLE "Vote";
