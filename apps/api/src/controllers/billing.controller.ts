import { type Request, type Response, type NextFunction } from "express";
import { AppError } from "../lib/httpErrors.js";
import {
  cancelSubscriptionForOwner,
  subscribe,
  deleteSubscriptionForOwner,
  getSubscriptionForOwner,
  listSubscriptionsForOwner,
  listUpcomingRenewals,
  updateSubscription,
} from "../services/billing.service.js";

function requireAuthUserId(req: Request): number {
  const id = req.authUserId;
  if (id === undefined) {
    throw new AppError(
      500,
      "INTERNAL_ERROR",
      "Authentication context was not set.",
    );
  }
  return id;
}

export const getBillingList = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const ownerId = requireAuthUserId(req);
    const { records } = await listSubscriptionsForOwner(ownerId);
    res.status(200).json({ data: records });
  } catch (e) {
    next(e);
  }
};

export const getUpcomingRenewals = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const ownerId = requireAuthUserId(req);
    const { records } = await listUpcomingRenewals(ownerId);
    res.status(200).json({ data: records });
  } catch (e) {
    next(e);
  }
};

export const postSubscribe = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const ownerId = requireAuthUserId(req);
    const { record } = await subscribe(req.body, ownerId);
    res.status(201).json({ data: record });
  } catch (e) {
    next(e);
  }
};

export const getBillingById = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const ownerId = requireAuthUserId(req);
    const { record } = await getSubscriptionForOwner(req.params.id, ownerId);
    res.status(200).json({ data: record });
  } catch (e) {
    next(e);
  }
};

export const putBillingById = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const ownerId = requireAuthUserId(req);
    const { record } = await updateSubscription(
      req.params.id,
      req.body,
      ownerId,
    );
    res.status(200).json({ data: record });
  } catch (e) {
    next(e);
  }
};

export const putBillingCancel = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const ownerId = requireAuthUserId(req);
    const { record } = await cancelSubscriptionForOwner(
      req.params.id,
      ownerId,
    );
    res.status(200).json({ data: record });
  } catch (e) {
    next(e);
  }
};

export const deleteBilling = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const ownerId = requireAuthUserId(req);
    await deleteSubscriptionForOwner(req.params.id, ownerId);
    res.status(204).send();
  } catch (e) {
    next(e);
  }
};
