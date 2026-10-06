import { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../database/neondb.js";
import { AppError } from "../lib/httpErrors.js";
import {
  calculateRenewalDate,
  resolveSubscriptionStatusByRenewal,
  subscribeCreateSchema,
  subscribeUpdateSchema,
  billingRecordIdParamSchema,
  toPrismaJsonMetrics,
} from "../models/billing.models.js";

const planInclude = { plan: true } as const;

type SubscriptionRow = Prisma.SubscriptionGetPayload<{
  include: typeof planInclude;
}>;

export type PublicBillingRecord = {
  id: number;
  userId: number;
  planId: number;
  plan: {
    id: number;
    name: string;
    price: number;
    currency: string;
    frequency: string;
    category: string | null;
  };
  usageMetrics: Prisma.JsonValue;
  status: string;
  startDate: Date;
  renewalDate: Date;
  createdAt: Date;
  updatedAt: Date;
};

function toPublicBillingRecord(row: SubscriptionRow): PublicBillingRecord {
  return {
    id: row.id,
    userId: row.userId,
    planId: row.planId,
    plan: {
      id: row.plan.id,
      name: row.plan.name,
      price: row.plan.price,
      currency: row.plan.currency,
      frequency: row.plan.frequency,
      category: row.plan.category,
    },
    usageMetrics: row.usageMetrics,
    status: resolveSubscriptionStatusByRenewal(row.renewalDate, row.status),
    startDate: row.startDate,
    renewalDate: row.renewalDate,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function parseBillingRecordId(raw: string | string[] | undefined): number {
  const s = Array.isArray(raw) ? raw[0] : raw;
  return billingRecordIdParamSchema.parse(s);
}

export async function subscribe(
  body: unknown,
  ownerUserId: number,
): Promise<{ record: PublicBillingRecord }> {
  const input = subscribeCreateSchema.parse(body);
  const plan = await prisma.plan.findUnique({ where: { id: input.planId } });
  if (!plan) {
    throw new AppError(404, "NOT_FOUND", "Plan not found.");
  }

  const renewalDate =
    input.renewalDate ??
    calculateRenewalDate(input.startDate, plan.frequency);
  const status = resolveSubscriptionStatusByRenewal(
    renewalDate,
    input.status,
  );

  try {
    const row = await prisma.subscription.create({
      data: {
        userId: ownerUserId,
        planId: input.planId,
        usageMetrics: toPrismaJsonMetrics(input.usageMetrics),
        status,
        startDate: input.startDate,
        renewalDate,
      },
      include: planInclude,
    });
    return { record: toPublicBillingRecord(row) };
  } catch (e) {
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === "P2003"
    ) {
      throw new AppError(
        404,
        "NOT_FOUND",
        "User or plan not found.",
      );
    }
    throw e;
  }
}

export async function listSubscriptionsForOwner(
  ownerUserId: number,
): Promise<{ records: PublicBillingRecord[] }> {
  const rows = await prisma.subscription.findMany({
    where: { userId: ownerUserId },
    orderBy: { renewalDate: "asc" },
    include: planInclude,
  });
  return { records: rows.map(toPublicBillingRecord) };
}

export async function listUpcomingRenewals(
  ownerUserId: number,
): Promise<{ records: PublicBillingRecord[] }> {
  const now = new Date();
  const rows = await prisma.subscription.findMany({
    where: {
      userId: ownerUserId,
      status: "ACTIVE",
      renewalDate: { gte: now },
    },
    orderBy: { renewalDate: "asc" },
    take: 100,
    include: planInclude,
  });
  return { records: rows.map(toPublicBillingRecord) };
}

export async function getSubscriptionForOwner(
  billingIdRaw: string | string[] | undefined,
  ownerUserId: number,
): Promise<{ record: PublicBillingRecord }> {
  const id = parseBillingRecordId(billingIdRaw);
  const row = await prisma.subscription.findFirst({
    where: { id, userId: ownerUserId },
    include: planInclude,
  });
  if (!row) {
    throw new AppError(404, "NOT_FOUND", "Billing record not found.");
  }
  return { record: toPublicBillingRecord(row) };
}

export async function updateSubscription(
  billingIdRaw: string | string[] | undefined,
  body: unknown,
  ownerUserId: number,
): Promise<{ record: PublicBillingRecord }> {
  const id = parseBillingRecordId(billingIdRaw);
  const patch = subscribeUpdateSchema.parse(body);

  const existing = await prisma.subscription.findFirst({
    where: { id, userId: ownerUserId },
    include: planInclude,
  });
  if (!existing) {
    throw new AppError(404, "NOT_FOUND", "Billing record not found.");
  }

  if (patch.planId !== undefined) {
    const p = await prisma.plan.findUnique({ where: { id: patch.planId } });
    if (!p) {
      throw new AppError(404, "NOT_FOUND", "Plan not found.");
    }
  }

  const startDate = patch.startDate ?? existing.startDate;
  const renewalDate = patch.renewalDate ?? existing.renewalDate;
  if (renewalDate.getTime() <= startDate.getTime()) {
    throw new AppError(
      400,
      "BAD_REQUEST",
      "Renewal date must be after the start date.",
    );
  }

  const statusBase = patch.status ?? existing.status;
  const status = resolveSubscriptionStatusByRenewal(renewalDate, statusBase);

  const data: Prisma.SubscriptionUpdateInput = {
    status,
  };
  if (patch.planId !== undefined) {
    data.plan = { connect: { id: patch.planId } };
  }
  if (patch.startDate !== undefined) data.startDate = patch.startDate;
  if (patch.renewalDate !== undefined) data.renewalDate = patch.renewalDate;
  if (patch.usageMetrics !== undefined) {
    data.usageMetrics = toPrismaJsonMetrics(patch.usageMetrics);
  }

  const row = await prisma.subscription.update({
    where: { id, userId: ownerUserId },
    data,
    include: planInclude,
  });
  return { record: toPublicBillingRecord(row) };
}

export async function cancelSubscriptionForOwner(
  billingIdRaw: string | string[] | undefined,
  ownerUserId: number,
): Promise<{ record: PublicBillingRecord }> {
  const id = parseBillingRecordId(billingIdRaw);
  const existing = await prisma.subscription.findFirst({
    where: { id, userId: ownerUserId },
  });
  if (!existing) {
    throw new AppError(404, "NOT_FOUND", "Billing record not found.");
  }
  const row = await prisma.subscription.update({
    where: { id, userId: ownerUserId },
    data: { status: "CANCELLED" },
    include: planInclude,
  });
  return { record: toPublicBillingRecord(row) };
}

export async function deleteSubscriptionForOwner(
  billingIdRaw: string | string[] | undefined,
  ownerUserId: number,
): Promise<void> {
  const id = parseBillingRecordId(billingIdRaw);
  const result = await prisma.subscription.deleteMany({
    where: { id, userId: ownerUserId },
  });
  if (result.count === 0) {
    throw new AppError(404, "NOT_FOUND", "Billing record not found.");
  }
}
