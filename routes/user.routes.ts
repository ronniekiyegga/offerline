import { Router } from "express";

import {
  getMe,
  getUser,
} from "../controllers/users.controllers.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const userRouter = Router();

userRouter.get("/me", requireAuth, getMe);

userRouter.get("/:id", requireAuth, getUser);

export default userRouter;
