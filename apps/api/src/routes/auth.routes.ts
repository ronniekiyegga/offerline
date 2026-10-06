import { Router, type Request, type Response } from "express";
import { signIn, signUp } from "../controllers/auth.controllers.js";

const authRouter = Router();

authRouter.get("/", (_req: Request, res: Response) =>
  res.json({
    message: "Auth API",
    endpoints: ["POST /sign-in", "POST /sign-up"],
  }),
);

authRouter.post("/sign-in", signIn);

authRouter.post("/sign-up", signUp);

export default authRouter;
