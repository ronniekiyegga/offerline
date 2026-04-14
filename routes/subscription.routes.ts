import { Router } from "express";

import {
  deleteSubscription,
  getSubscription,
  getSubscriptions,
  getUpcomingRenewals,
  getUserSubscriptions,
  postSubscription,
  putSubscription,
  putSubscriptionCancel,
} from "../controllers/subscription.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const subscriptionRouter = Router();

subscriptionRouter.use(requireAuth);

subscriptionRouter.get("/", getSubscriptions);

subscriptionRouter.get("/upcoming-renewals", getUpcomingRenewals);

subscriptionRouter.get("/user/:id", getUserSubscriptions);

subscriptionRouter.post("/", postSubscription);

subscriptionRouter.put("/:id/cancel", putSubscriptionCancel);

subscriptionRouter.get("/:id", getSubscription);

subscriptionRouter.put("/:id", putSubscription);

subscriptionRouter.delete("/:id", deleteSubscription);

export default subscriptionRouter;
