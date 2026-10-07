import express, { type Request, type Response } from "express";
import helmet from "helmet";

import { errorMiddleware } from "./middleware/error.middleware.js";
import { AppError } from "./lib/httpErrors.js";
import {
  arcjetApiLimiter,
  arcjetAuthLimiter,
} from "./middleware/arcjet.middleware.js";
import authRouter from "./routes/auth.routes.js";
import billingRouter from "./routes/billing.routes.js";
import userRouter from "./routes/user.routes.js";

export function createApp() {
  const app = express();

  app.disable("x-powered-by");
  app.use(helmet());
  app.use(express.json({ limit: "100kb" }));

  app.get("/health", (_req: Request, res: Response) => {
    res.status(200).json({ ok: true });
  });

  app.get("/", (_req: Request, res: Response) => {
    res.type("text").send("Offerline API");
  });

  app.use("/api/v1/auth", arcjetAuthLimiter, authRouter);
  app.use("/api/v1/billing", arcjetApiLimiter, billingRouter);
  app.use("/api/v1/users", arcjetApiLimiter, userRouter);

  app.use((_req, _res, next) => {
    next(new AppError(404, "NOT_FOUND", "Route not found."));
  });

  app.use(errorMiddleware);

  return app;
}
