import { Router } from "express";

import {
  deleteBilling,
  getBillingById,
  getBillingList,
  getUpcomingRenewals,
  postSubscribe,
  putBillingById,
  putBillingCancel,
} from "../controllers/billing.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const billingRouter = Router();

billingRouter.use(requireAuth);

billingRouter.get("/", getBillingList);

billingRouter.get("/renewals", getUpcomingRenewals);

billingRouter.post("/subscribe", postSubscribe);

billingRouter.put("/:id/cancel", putBillingCancel);

billingRouter.get("/:id", getBillingById);

billingRouter.put("/:id", putBillingById);

billingRouter.delete("/:id", deleteBilling);

export default billingRouter;
