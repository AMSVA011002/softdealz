"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  getCurrentUser,
  passwordExceedsBcryptLimit,
  updateUserPassword,
  updateUserProfile,
} from "@/lib/auth";
import {
  createAddress,
  deleteAddress,
  toggleWishlist,
  updateAddress,
} from "@/lib/data/account";

export interface FormState {
  error?: string;
  success?: string;
  fieldErrors?: Record<string, string>;
}

/* ------------------------------------------------------------------ */
/* Profile                                                             */
/* ------------------------------------------------------------------ */

const profileSchema = z.object({
  name: z.string().min(2, "Enter your full name"),
  phone: z.string().min(9, "Enter a valid phone number").optional().or(z.literal("")),
});

export async function updateProfileAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Your session expired. Please sign in again." };

  const parsed = profileSchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone") ?? "",
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    parsed.error.issues.forEach((issue) => {
      fieldErrors[String(issue.path[0])] = issue.message;
    });
    return { fieldErrors, error: "Please check the highlighted fields" };
  }

  updateUserProfile(user.id, { name: parsed.data.name, phone: parsed.data.phone || null });
  revalidatePath("/account");
  revalidatePath("/account/settings");
  return { success: "Profile updated" };
}

export async function updatePasswordAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Your session expired. Please sign in again." };

  const current = String(formData.get("currentPassword") ?? "");
  const next = String(formData.get("newPassword") ?? "");
  const confirm = String(formData.get("confirmPassword") ?? "");

  if (next.length < 8) return { fieldErrors: { newPassword: "Use at least 8 characters" } };
  if (passwordExceedsBcryptLimit(next)) {
    return { fieldErrors: { newPassword: "Password must be at most 72 UTF-8 bytes" } };
  }
  if (next !== confirm) return { fieldErrors: { confirmPassword: "Passwords do not match" } };

  const result = await updateUserPassword(user.id, current, next);
  if (!result.ok) {
    return { fieldErrors: { currentPassword: result.error ?? "Could not update your password" } };
  }

  return { success: "Password changed" };
}

/* ------------------------------------------------------------------ */
/* Addresses                                                           */
/* ------------------------------------------------------------------ */

const addressSchema = z.object({
  label: z.string().min(1).default("Home"),
  fullName: z.string().min(2, "Enter the recipient's full name"),
  phone: z.string().min(9, "Enter a valid phone number"),
  line1: z.string().min(4, "Enter the street address"),
  line2: z.string().optional().or(z.literal("")),
  city: z.string().min(2, "Enter the city"),
  state: z.string().min(2, "Enter the province"),
  postalCode: z.string().min(3, "Enter the postal code"),
  country: z.string().default("Sri Lanka"),
});

export async function saveAddressAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Your session expired. Please sign in again." };

  const parsed = addressSchema.safeParse({
    label: formData.get("label") ?? "Home",
    fullName: formData.get("fullName"),
    phone: formData.get("phone"),
    line1: formData.get("line1"),
    line2: formData.get("line2") ?? "",
    city: formData.get("city"),
    state: formData.get("state"),
    postalCode: formData.get("postalCode"),
    country: formData.get("country") ?? "Sri Lanka",
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    parsed.error.issues.forEach((issue) => {
      fieldErrors[String(issue.path[0])] = issue.message;
    });
    return { fieldErrors, error: "Please check the highlighted fields" };
  }

  const isDefault = formData.get("isDefault") === "on";
  const id = formData.get("addressId") ? String(formData.get("addressId")) : null;

  const payload = { ...parsed.data, line2: parsed.data.line2 || null, isDefault };

  if (id) {
    updateAddress(user.id, id, payload);
  } else {
    createAddress(user.id, payload);
  }

  revalidatePath("/account/addresses");
  revalidatePath("/checkout");
  return { success: id ? "Address updated" : "Address saved" };
}

export async function deleteAddressAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return;
  const id = String(formData.get("addressId") ?? "");
  if (id) deleteAddress(user.id, id);
  revalidatePath("/account/addresses");
}

export async function toggleWishlistAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return;
  const productId = String(formData.get("productId") ?? "");
  if (productId) toggleWishlist(user.id, productId);
  revalidatePath("/account/wishlist");
}
