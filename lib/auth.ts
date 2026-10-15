import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { all, get, newId, run } from "@/lib/db";
import { mapUser } from "@/lib/data/mappers";
import { authSecret, isProduction } from "@/lib/env";
import type { Role, User } from "@/lib/types";

const COOKIE_NAME = "softdealz_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

/**
 * The signing key is resolved (and, when no `AUTH_SECRET` is configured, the
 * generated fallback is persisted) the first time any server module imports
 * this file — i.e. at boot, not halfway through a shopper's session. In
 * production a missing key throws here instead of silently accepting forged
 * cookies.
 */
const SESSION_SECRET = authSecret();

function secret(): Uint8Array {
  return SESSION_SECRET;
}

/* ------------------------------------------------------------------ */
/* Password hashing                                                    */
/* ------------------------------------------------------------------ */

export function passwordExceedsBcryptLimit(plain: string): boolean {
  return bcrypt.truncates(plain);
}

export async function hashPassword(plain: string): Promise<string> {
  if (passwordExceedsBcryptLimit(plain)) {
    throw new Error("Passwords must be at most 72 UTF-8 bytes when using bcrypt.");
  }
  return bcrypt.hash(plain, 12);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  if (passwordExceedsBcryptLimit(plain)) return false;
  try {
    return await bcrypt.compare(plain, hash);
  } catch {
    return false;
  }
}

/* ------------------------------------------------------------------ */
/* Sessions (stateless JWT in an httpOnly cookie)                      */
/* ------------------------------------------------------------------ */

export async function createSession(userId: string): Promise<void> {
  const token = await new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE_SECONDS}s`)
    .sign(secret());

  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: isProduction,
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export async function getCurrentUser(): Promise<User | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, secret());
    const userId = payload.sub;
    if (!userId) return null;

    const row = get("SELECT * FROM users WHERE id = ? AND status = 'ACTIVE'", [userId]);
    return row ? mapUser(row) : null;
  } catch {
    return null;
  }
}

export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireAdmin(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/admin");
  if (user.role !== "ADMIN") redirect("/account");
  return user;
}

/* ------------------------------------------------------------------ */
/* User CRUD                                                           */
/* ------------------------------------------------------------------ */

const AVATAR_COLORS = ["#0c800f", "#0a57a0", "#7c3aed", "#db2777", "#ea580c", "#0891b2"];

export function findUserByEmail(email: string) {
  return get<Record<string, any>>("SELECT * FROM users WHERE LOWER(email) = LOWER(?)", [
    email.trim(),
  ]);
}

export async function createUser(input: {
  email: string;
  password: string;
  name: string;
  phone?: string | null;
  role?: Role;
}): Promise<User> {
  const id = newId("usr");
  const passwordHash = await hashPassword(input.password);
  const avatarColor = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];

  run(
    `INSERT INTO users (id, email, password_hash, name, phone, role, avatar_color)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      input.email.trim().toLowerCase(),
      passwordHash,
      input.name.trim(),
      input.phone ?? null,
      input.role ?? "CUSTOMER",
      avatarColor,
    ],
  );

  const row = get("SELECT * FROM users WHERE id = ?", [id]);
  return mapUser(row!);
}

export function updateUserProfile(
  userId: string,
  input: { name?: string; phone?: string | null },
) {
  run(
    `UPDATE users SET name = COALESCE(?, name), phone = COALESCE(?, phone),
       updated_at = datetime('now') WHERE id = ?`,
    [input.name ?? null, input.phone ?? null, userId],
  );
}

export async function updateUserPassword(
  userId: string,
  currentPassword: string,
  nextPassword: string,
): Promise<{ ok: boolean; error?: string }> {
  const row = get<{ password_hash: string }>("SELECT password_hash FROM users WHERE id = ?", [
    userId,
  ]);
  if (!row) return { ok: false, error: "Account not found" };

  const valid = await verifyPassword(currentPassword, row.password_hash);
  if (!valid) return { ok: false, error: "Current password is incorrect" };

  run("UPDATE users SET password_hash = ?, updated_at = datetime('now') WHERE id = ?", [
    await hashPassword(nextPassword),
    userId,
  ]);
  return { ok: true };
}

export function listUsersAdmin(query?: string): User[] {
  const rows = query
    ? all(
        `SELECT * FROM users WHERE LOWER(name) LIKE ? OR LOWER(email) LIKE ?
          ORDER BY created_at DESC`,
        [`%${query.toLowerCase()}%`, `%${query.toLowerCase()}%`],
      )
    : all("SELECT * FROM users ORDER BY created_at DESC");
  return rows.map(mapUser);
}
