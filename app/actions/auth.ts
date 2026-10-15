"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  createSession,
  createUser,
  destroySession,
  findUserByEmail,
  passwordExceedsBcryptLimit,
  verifyPassword,
} from "@/lib/auth";
import { pushNotification, createAddress } from "@/lib/data/account";
import { RATE_LIMITS, rateLimitFromRequest } from "@/lib/rate-limit";
import { safeRedirectPath } from "@/lib/params";

export interface AuthState {
  error?: string;
  fieldErrors?: Record<string, string>;
  /** Echoed back so a failed submit never wipes what the shopper typed. */
  values?: Record<string, string | undefined>;
}

const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address"),
  password: z
    .string()
    .min(1, "Enter your password")
    .max(200, "That password is too long")
    .refine((password) => !passwordExceedsBcryptLimit(password), "Password must be at most 72 UTF-8 bytes"),
  next: z.string().optional(),
});

const DUMMY_PASSWORD_HASH = "$2b$12$AYI7nbkawzgy5rXTtYEysORXFmiBHPogXgWqwVGPJEi3aAGROvYaC";

const registerSchema = z
  .object({
    name: z.string().trim().min(2, "Tell us your name").max(80, "That name is too long"),
    email: z.string().trim().email("Enter a valid email address").max(254),
    phone: z
      .string()
      .trim()
      .min(9, "Enter a valid phone number")
      .max(20, "That phone number is too long")
      .regex(/^[0-9+\s()-]+$/, "Phone numbers can contain digits, spaces and + only"),
    password: z
      .string()
      .min(8, "Use at least 8 characters")
      .max(200, "That password is too long")
      .refine((password) => !passwordExceedsBcryptLimit(password), "Password must be at most 72 UTF-8 bytes"),
    confirmPassword: z.string(),
    next: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

function fieldErrorsFrom(error: z.ZodError): Record<string, string> {
  const output: Record<string, string> = {};
  error.issues.forEach((issue) => {
    const key = String(issue.path[0] ?? "form");
    if (!output[key]) output[key] = issue.message;
  });
  return output;
}

export async function loginAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const payload = {
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
    next: formData.get("next") ? String(formData.get("next")) : undefined,
  };

  const parsed = loginSchema.safeParse(payload);
  if (!parsed.success) {
    return { fieldErrors: fieldErrorsFrom(parsed.error), values: { email: payload.email } };
  }

  // Throttle per IP *and* per account so neither a single address nor a single
  // account can be hammered with password guesses.
  const ipLimit = await rateLimitFromRequest(
    "login",
    RATE_LIMITS.login.limit,
    RATE_LIMITS.login.windowSeconds * 1000,
  );
  const accountLimit = await rateLimitFromRequest(
    "login-account",
    RATE_LIMITS.login.limit * 2,
    RATE_LIMITS.login.windowSeconds * 1000,
    parsed.data.email,
  );
  if (!ipLimit.ok || !accountLimit.ok) {
    const retryAfter = Math.max(ipLimit.retryAfterSeconds, accountLimit.retryAfterSeconds);
    return {
      error: `Too many sign-in attempts. Please wait ${retryAfter} seconds and try again.`,
      values: { email: payload.email },
    };
  }

  const user = findUserByEmail(parsed.data.email);
  const valid = await verifyPassword(
    parsed.data.password,
    user ? String(user.password_hash) : DUMMY_PASSWORD_HASH,
  );
  if (!user || user.status !== "ACTIVE" || !valid) {
    return { error: "Email or password is incorrect", values: { email: payload.email } };
  }

  await createSession(String(user.id));
  revalidatePath("/", "layout");

  const fallback = user.role === "ADMIN" ? "/admin" : "/account";
  redirect(safeRedirectPath(parsed.data.next, fallback));
}

export async function registerAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const payload = {
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    password: String(formData.get("password") ?? ""),
    confirmPassword: String(formData.get("confirmPassword") ?? ""),
    next: formData.get("next") ? String(formData.get("next")) : undefined,
  };

  const parsed = registerSchema.safeParse(payload);
  if (!parsed.success) {
    return { fieldErrors: fieldErrorsFrom(parsed.error), values: payload };
  }

  const limit = await rateLimitFromRequest(
    "register",
    RATE_LIMITS.register.limit,
    RATE_LIMITS.register.windowSeconds * 1000,
  );
  if (!limit.ok) {
    return {
      error: `Too many sign-ups from this network. Try again in ${limit.retryAfterSeconds} seconds.`,
      values: payload,
    };
  }

  if (findUserByEmail(parsed.data.email)) {
    return { fieldErrors: { email: "An account with this email already exists" }, values: payload };
  }

  let user;
  try {
    user = await createUser({
      email: parsed.data.email,
      password: parsed.data.password,
      name: parsed.data.name,
      phone: parsed.data.phone,
      role: "CUSTOMER",
    });
  } catch {
    // Unique index race: another request created the account a millisecond ago.
    return { fieldErrors: { email: "An account with this email already exists" }, values: payload };
  }

  // Give the new shopper a welcome notification so the account area isn't empty.
  pushNotification(
    user.id,
    "Welcome to SoftDealz 🎉",
    "Your account is ready. Use code WELCOME10 for 10% off your first order.",
    "PROMO",
  );

  // Optional: first delivery address captured at sign-up.
  const line1 = formData.get("line1") ? String(formData.get("line1")) : "";
  if (line1.trim().length > 3) {
    createAddress(user.id, {
      label: "Home",
      fullName: user.name,
      phone: user.phone ?? parsed.data.phone,
      line1,
      city: String(formData.get("city") ?? "Colombo"),
      state: String(formData.get("state") ?? "Western"),
      postalCode: String(formData.get("postalCode") ?? "00100"),
      country: "Sri Lanka",
      isDefault: true,
    });
  }

  await createSession(user.id);
  revalidatePath("/", "layout");
  redirect(safeRedirectPath(parsed.data.next, "/account"));
}

export async function logoutAction() {
  await destroySession();
  revalidatePath("/", "layout");
  redirect("/");
}
