import { NextResponse } from "next/server";

export function ok<T extends object>(data: T = {} as T, init?: ResponseInit) {
  return NextResponse.json({ ok: true, ...data }, init);
}

export function fail(error: string, status = 400) {
  return NextResponse.json({ ok: false, error }, { status });
}

export function unauthorized(message = "You need to sign in to continue") {
  return fail(message, 401);
}

export function forbidden(message = "You do not have access to this resource") {
  return fail(message, 403);
}

export function notFound(message = "Not found") {
  return fail(message, 404);
}

export function serverError(message = "Something went wrong on our side") {
  return fail(message, 500);
}

/** Parse a JSON body without throwing on malformed input. */
export async function readJson<T>(request: Request): Promise<T | null> {
  try {
    return (await request.json()) as T;
  } catch {
    return null;
  }
}

export function toInt(value: string | null, fallback: number) {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function toNumber(value: string | null, fallback: number) {
  const parsed = Number.parseFloat(value ?? "");
  return Number.isFinite(parsed) ? parsed : fallback;
}
