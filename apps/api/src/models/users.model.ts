import { z } from "zod";

export const userCreateSchema = z
  .object({
    name: z
      .string({ required_error: "User Name is required" })
      .trim()
      .min(2, "User Name must be at least 2 characters")
      .max(50, "User Name must be at most 50 characters"),
    email: z
      .string({ required_error: "User Email is required" })
      .trim()
      .toLowerCase()
      .email("Please fill a valid email address")
      .max(255, "User Email must be at most 255 characters"),
    password: z
      .string({ required_error: "Password is required" })
      .min(12, "Password must be at least 12 characters")
      .refine((value) => Buffer.byteLength(value, "utf8") <= 72, {
        message: "Password must be at most 72 UTF-8 bytes",
      }),
  })
  .strict();

export type UserCreateInput = z.infer<typeof userCreateSchema>;

export const userSignInSchema = z
  .object({
    email: userCreateSchema.shape.email,
    password: z
      .string({ required_error: "Password is required" })
      .min(1, "Password is required"),
  })
  .strict();

export type UserSignInInput = z.infer<typeof userSignInSchema>;
