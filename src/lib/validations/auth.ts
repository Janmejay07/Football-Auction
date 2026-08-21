import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const signupSchema = z
  .object({
    fullName: z.string().min(2, "Full name is required"),
    username: z
      .string()
      .min(3, "Username must be at least 3 characters")
      .regex(/^[a-zA-Z0-9_]+$/, "Only letters, numbers, and underscores"),
    email: z.string().email("Enter a valid email"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
    favoriteClub: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const createAuctionBasicSchema = z.object({
  name: z.string().min(3, "Auction name is required"),
  description: z.string().min(10, "Add a short description"),
  visibility: z.enum(["public", "private"]),
});

export const joinAuctionSchema = z.object({
  code: z
    .string()
    .min(4, "Enter auction code")
    .max(8)
    .transform((v) => v.toUpperCase()),
  teamId: z.string().min(1, "Select a team"),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
export type SignupFormValues = z.infer<typeof signupSchema>;
export type CreateAuctionBasicValues = z.infer<typeof createAuctionBasicSchema>;
export type JoinAuctionFormValues = z.infer<typeof joinAuctionSchema>;
