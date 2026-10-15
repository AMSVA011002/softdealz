import bcrypt from "bcryptjs";
import { z } from "zod";
import { get, newId, run, tx } from "../lib/db/index";

const inputSchema = z.object({
  email: z.string().trim().email().max(254),
  name: z.string().trim().min(2).max(80),
  password: z
    .string()
    .min(12, "Use at least 12 characters")
    .refine((password) => Buffer.byteLength(password, "utf8") <= 72, "Password must be at most 72 UTF-8 bytes"),
});

const parsed = inputSchema.safeParse({
  email: process.env.ADMIN_EMAIL,
  name: process.env.ADMIN_NAME,
  password: process.env.ADMIN_PASSWORD,
});

if (!parsed.success) {
  throw new Error(
    `Invalid administrator configuration: ${parsed.error.issues
      .map((issue) => `${String(issue.path[0] ?? "form")}: ${issue.message}`)
      .join("; ")}`,
  );
}

if (process.env.NODE_ENV === "production" && (process.env.AUTH_SECRET?.trim().length ?? 0) < 32) {
  throw new Error("Set a strong AUTH_SECRET (at least 32 characters) before creating the production administrator.");
}

const { email, name, password } = parsed.data;
const passwordHash = bcrypt.hashSync(password, 12);

tx(() => {
  const admin = get<{ id: string }>("SELECT id FROM users WHERE role = 'ADMIN' LIMIT 1");
  if (admin) throw new Error("An administrator already exists; bootstrap is only allowed once.");

  const existing = get<{ id: string }>("SELECT id FROM users WHERE LOWER(email) = LOWER(?)", [email]);
  if (existing) throw new Error("That email already belongs to an account; use a different address.");

  run(
    `INSERT INTO users (id, email, password_hash, name, role, status, avatar_color)
     VALUES (?, ?, ?, ?, 'ADMIN', 'ACTIVE', '#0c800f')`,
    [newId("usr"), email.toLowerCase(), passwordHash, name],
  );
});

console.log(`Created the initial administrator account for ${email.toLowerCase()}.`);
