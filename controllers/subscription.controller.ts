import { type Request, type Response, type NextFunction } from "express";
import { AppError } from "../lib/httpErrors.js";
import {
  cancelSubscriptionForOwner,
  createSubscription,
  deleteSubscriptionForOwner,
  getSubscriptionForOwner,
  listSubscriptionsForOwner,
  listSubscriptionsForUserParam,
  listUpcomingRenewals,
  updateSubscription,
} from "../services/subscription.service.js";

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

export const getSubscriptions = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const ownerId = requireAuthUserId(req);
    const { subscriptions } = await listSubscriptionsForOwner(ownerId);
    res.status(200).json({ data: subscriptions });
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
    const { subscriptions } = await listUpcomingRenewals(ownerId);
    res.status(200).json({ data: subscriptions });
  } catch (e) {
    next(e);
  }
};

export const getUserSubscriptions = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const ownerId = requireAuthUserId(req);
    const rawUserId = Array.isArray(req.params.id)
      ? req.params.id[0]
      : req.params.id;
    const { subscriptions } = await listSubscriptionsForUserParam(
      rawUserId,
      ownerId,
    );
    res.status(200).json({ data: subscriptions });
  } catch (e) {
    next(e);
  }
};

export const postSubscription = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const ownerId = requireAuthUserId(req);
    const { subscription } = await createSubscription(req.body, ownerId);
    res.status(201).json({ data: subscription });
  } catch (e) {
    next(e);
  }
};

export const getSubscription = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const ownerId = requireAuthUserId(req);
    const { subscription } = await getSubscriptionForOwner(
      req.params.id,
      ownerId,
    );
    res.status(200).json({ data: subscription });
  } catch (e) {
    next(e);
  }
};

export const putSubscription = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const ownerId = requireAuthUserId(req);
    const { subscription } = await updateSubscription(
      req.params.id,
      req.body,
      ownerId,
    );
    res.status(200).json({ data: subscription });
  } catch (e) {
    next(e);
  }
};

export const putSubscriptionCancel = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const ownerId = requireAuthUserId(req);
    const { subscription } = await cancelSubscriptionForOwner(
      req.params.id,
      ownerId,
    );
    res.status(200).json({ data: subscription });
  } catch (e) {
    next(e);
  }
};

export const deleteSubscription = async (
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
