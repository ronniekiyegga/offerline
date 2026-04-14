import { Prisma } from "../generated/prisma/client.js";
import { prisma } from "../database/neondb.js";
import { AppError } from "../lib/httpErrors.js";
import {
  resolveSubscriptionStatusByRenewal,
  subscriptionCreateSchema,
  subscriptionIdParamSchema,
  subscriptionUpdateSchema,
} from "../models/subscription.models.js";
import { userIdParamSchema } from "./user.service.js";

export type PublicSubscription = {
  id: number;
  name: string;
  price: number;
  currency: string;
  frequency: string;
  category: string;
  status: string;
  startDate: Date;
  renewalDate: Date;
  userId: number;
  createdAt: Date;
  updatedAt: Date;
};

function toPublicSubscription(row: {
  id: number;
  name: string;
  price: number;
  currency: string;
  frequency: string;
  category: string;
  status: string;
  startDate: Date;
  renewalDate: Date;
  userId: number;
  createdAt: Date;
  updatedAt: Date;
}): PublicSubscription {
  return { ...row };
}

function parseSubscriptionId(raw: string | string[] | undefined): number {
  const s = Array.isArray(raw) ? raw[0] : raw;
  return subscriptionIdParamSchema.parse(s);
}

export async function createSubscription(
  body: unknown,
  ownerUserId: number,
): Promise<{ subscription: PublicSubscription }> {
  const parsedBody =
    typeof body === "object" && body !== null && !Array.isArray(body)
      ? (body as Record<string, unknown>)
      : {};
  const input = subscriptionCreateSchema.parse({
    ...parsedBody,
    userId: ownerUserId,
  });
  try {
    const row = await prisma.subscription.create({
      data: {
        userId: input.userId,
        name: input.name,
        price: input.price,
        currency: input.currency,
        frequency: input.frequency,
        category: input.category,
        status: input.status,
        startDate: input.startDate,
        renewalDate: input.renewalDate,
      },
    });
    return { subscription: toPublicSubscription(row) };
  } catch (e) {
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === "P2003"
    ) {
      throw new AppError(
        404,
        "NOT_FOUND",
        "User not found for this subscription.",
      );
    }
    throw e;
  }
}

export async function listSubscriptionsForOwner(
  ownerUserId: number,
): Promise<{ subscriptions: PublicSubscription[] }> {
  const rows = await prisma.subscription.findMany({
    where: { userId: ownerUserId },
    orderBy: { renewalDate: "asc" },
  });
  return { subscriptions: rows.map(toPublicSubscription) };
}

export async function listSubscriptionsForUserParam(
  paramUserIdRaw: string | undefined,
  authUserId: number,
): Promise<{ subscriptions: PublicSubscription[] }> {
  const paramUserId = userIdParamSchema.parse(paramUserIdRaw);
  if (paramUserId !== authUserId) {
    throw new AppError(
      403,
      "FORBIDDEN",
      "You can only list subscriptions for your own account.",
    );
  }
  return listSubscriptionsForOwner(authUserId);
}

export async function listUpcomingRenewals(
  ownerUserId: number,
): Promise<{ subscriptions: PublicSubscription[] }> {
  const now = new Date();
  const rows = await prisma.subscription.findMany({
    where: {
      userId: ownerUserId,
      status: "ACTIVE",
      renewalDate: { gte: now },
    },
    orderBy: { renewalDate: "asc" },
    take: 100,
  });
  return { subscriptions: rows.map(toPublicSubscription) };
}

export async function getSubscriptionForOwner(
  subscriptionIdRaw: string | string[] | undefined,
  ownerUserId: number,
): Promise<{ subscription: PublicSubscription }> {
  const id = parseSubscriptionId(subscriptionIdRaw);
  const row = await prisma.subscription.findFirst({
    where: { id, userId: ownerUserId },
  });
  if (!row) {
    throw new AppError(404, "NOT_FOUND", "Subscription not found.");
  }
  return { subscription: toPublicSubscription(row) };
}

export async function updateSubscription(
  subscriptionIdRaw: string | string[] | undefined,
  body: unknown,
  ownerUserId: number,
): Promise<{ subscription: PublicSubscription }> {
  const id = parseSubscriptionId(subscriptionIdRaw);
  const patch = subscriptionUpdateSchema.parse(body);

  const existing = await prisma.subscription.findFirst({
    where: { id, userId: ownerUserId },
  });
  if (!existing) {
    throw new AppError(404, "NOT_FOUND", "Subscription not found.");
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

  const row = await prisma.subscription.update({
    where: { id },
    data: {
      ...patch,
      status,
    },
  });
  return { subscription: toPublicSubscription(row) };
}

export async function cancelSubscriptionForOwner(
  subscriptionIdRaw: string | string[] | undefined,
  ownerUserId: number,
): Promise<{ subscription: PublicSubscription }> {
  const id = parseSubscriptionId(subscriptionIdRaw);
  const existing = await prisma.subscription.findFirst({
    where: { id, userId: ownerUserId },
  });
  if (!existing) {
    throw new AppError(404, "NOT_FOUND", "Subscription not found.");
  }
  const row = await prisma.subscription.update({
    where: { id },
    data: { status: "CANCELLED" },
  });
  return { subscription: toPublicSubscription(row) };
}

export async function deleteSubscriptionForOwner(
  subscriptionIdRaw: string | string[] | undefined,
  ownerUserId: number,
): Promise<void> {
  const id = parseSubscriptionId(subscriptionIdRaw);
  const result = await prisma.subscription.deleteMany({
    where: { id, userId: ownerUserId },
  });
  if (result.count === 0) {
    throw new AppError(404, "NOT_FOUND", "Subscription not found.");
  }
}
