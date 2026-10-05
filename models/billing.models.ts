import { z } from "zod";
import {
  type BillingFrequency,
  BillingFrequency as BillingFrequencyValues,
  type SubscriptionStatus,
  SubscriptionStatus as SubscriptionStatusValues,
} from "../generated/prisma/enums.js";
import { Prisma } from "../generated/prisma/client.js";

function addUtcCalendarMonths(start: Date, months: number): Date {
  const result = new Date(start.getTime());
  const originalDay = result.getUTCDate();
  result.setUTCDate(1);
  result.setUTCMonth(result.getUTCMonth() + months);
  const lastDay = new Date(
    Date.UTC(result.getUTCFullYear(), result.getUTCMonth() + 1, 0),
  ).getUTCDate();
  result.setUTCDate(Math.min(originalDay, lastDay));
  return result;
}

export function calculateRenewalDate(
  start: Date,
  frequency: BillingFrequency,
): Date {
  if (frequency === BillingFrequencyValues.MONTHLY) {
    return addUtcCalendarMonths(start, 1);
  }
  if (frequency === BillingFrequencyValues.YEARLY) {
    return addUtcCalendarMonths(start, 12);
  }

  const result = new Date(start.getTime());
  const days = frequency === BillingFrequencyValues.DAILY ? 1 : 7;
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

export function resolveSubscriptionStatusByRenewal(
  renewalDate: Date,
  status: SubscriptionStatus,
): SubscriptionStatus {
  if (
    status === SubscriptionStatusValues.ACTIVE &&
    renewalDate.getTime() < Date.now()
  ) {
    return SubscriptionStatusValues.EXPIRED;
  }
  return status;
}

const zSubscriptionStatus = z.enum([
  SubscriptionStatusValues.ACTIVE,
  SubscriptionStatusValues.CANCELLED,
  SubscriptionStatusValues.EXPIRED,
]);

const usageMetricsSchema = z
  .record(
    z.string(),
    z.union([z.number(), z.string(), z.boolean()]),
  )
  .optional()
  .default({});

const subscribeCreateBase = z
  .object({
    planId: z
      .number({ required_error: "planId is required" })
      .int()
      .positive(),
    status: zSubscriptionStatus.default(SubscriptionStatusValues.ACTIVE),
    startDate: z.coerce.date(),
    renewalDate: z.coerce.date().optional(),
    usageMetrics: usageMetricsSchema,
  })
  .strict();

export const subscribeCreateSchema = subscribeCreateBase.superRefine(
  (data, ctx) => {
    const now = new Date();
    if (data.startDate.getTime() > now.getTime()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Start date must not be in the future.",
        path: ["startDate"],
      });
    }
    if (data.renewalDate !== undefined) {
      if (data.renewalDate.getTime() <= data.startDate.getTime()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Renewal date must be after the start date.",
          path: ["renewalDate"],
        });
      }
    }
  },
);

export type SubscribeCreateInput = z.infer<typeof subscribeCreateSchema>;

export const billingRecordIdParamSchema = z.coerce.number().int().positive();

export const subscribeUpdateSchema = z
  .object({
    planId: z.number().int().positive().optional(),
    status: zSubscriptionStatus.optional(),
    startDate: z.coerce.date().optional(),
    renewalDate: z.coerce.date().optional(),
    usageMetrics: z
      .record(
        z.string(),
        z.union([z.number(), z.string(), z.boolean()]),
      )
      .optional(),
  })
  .strict()
  .refine((v) => Object.keys(v).length > 0, {
    message: "Provide at least one field to update.",
  });

export function toPrismaJsonMetrics(
  m: Record<string, number | string | boolean>,
): Prisma.InputJsonValue {
  return m as Prisma.InputJsonValue;
}
