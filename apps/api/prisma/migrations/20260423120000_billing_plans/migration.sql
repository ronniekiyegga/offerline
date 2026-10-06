-- CreateTable: generic plan catalog; Subscription rows now reference planId + usageMetrics.
CREATE TABLE "Plan" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "price" INTEGER NOT NULL,
    "currency" "Currency" NOT NULL DEFAULT 'GBP',
    "frequency" "BillingFrequency" NOT NULL,
    "category" "SubscriptionCategory",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);

-- Seed small generic catalog (names only — no business-vertical taxonomy).
INSERT INTO "Plan" ("id", "name", "price", "currency", "frequency", "category", "createdAt", "updatedAt")
VALUES
  (1, 'Starter', 0, 'GBP', 'MONTHLY', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (2, 'Professional', 2900, 'GBP', 'MONTHLY', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (3, 'Enterprise', 9900, 'GBP', 'MONTHLY', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Preserve every distinct legacy offering as a reusable plan before removing
-- the duplicated columns from Subscription.
INSERT INTO "Plan" ("name", "price", "currency", "frequency", "category", "createdAt", "updatedAt")
SELECT DISTINCT "name", "price", "currency", "frequency", "category", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "Subscription";

SELECT setval(pg_get_serial_sequence('"Plan"', 'id'), (SELECT MAX("id") FROM "Plan"));

-- AlterTable Subscription
ALTER TABLE "Subscription" ADD COLUMN "planId" INTEGER,
ADD COLUMN "usageMetrics" JSONB NOT NULL DEFAULT '{}';

UPDATE "Subscription" AS subscription
SET "planId" = (
  SELECT MIN(plan."id")
  FROM "Plan" AS plan
  WHERE plan."name" = subscription."name"
    AND plan."price" = subscription."price"
    AND plan."currency" = subscription."currency"
    AND plan."frequency" = subscription."frequency"
    AND plan."category" = subscription."category"
);

ALTER TABLE "Subscription" ALTER COLUMN "planId" SET NOT NULL;

ALTER TABLE "Subscription" DROP COLUMN "name",
DROP COLUMN "price",
DROP COLUMN "currency",
DROP COLUMN "frequency",
DROP COLUMN "category";

ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "Subscription_planId_idx" ON "Subscription"("planId");
