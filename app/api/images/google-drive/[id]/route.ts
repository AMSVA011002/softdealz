import { NextResponse } from "next/server";

export const runtime = "nodejs";

const MAX_IMAGE_BYTES = 20 * 1024 * 1024;
const ALLOWED_HOSTS = new Set(["drive.google.com", "drive.usercontent.google.com"]);
const ALLOWED_IMAGE_TYPES = new Set([
  "image/avif",
  "image/bmp",
  "image/gif",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status, headers: { "Cache-Control": "no-store" } });
}

function isAllowedGoogleUrl(url: URL) {
  return url.protocol === "https:" && !url.port && ALLOWED_HOSTS.has(url.hostname);
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!/^[A-Za-z0-9_-]{10,200}$/.test(id)) {
    return errorResponse("Invalid Google Drive image ID", 400);
  }

  let upstreamUrl = new URL("https://drive.usercontent.google.com/download");
  upstreamUrl.searchParams.set("id", id);
  upstreamUrl.searchParams.set("export", "view");
  upstreamUrl.searchParams.set("authuser", "0");

  try {
    let upstream: Response | undefined;
    for (let redirectCount = 0; redirectCount < 5; redirectCount += 1) {
      if (!isAllowedGoogleUrl(upstreamUrl)) {
        return errorResponse("Google Drive returned an unsupported image URL", 502);
      }

      upstream = await fetch(upstreamUrl, {
        cache: "no-store",
        redirect: "manual",
        signal: AbortSignal.timeout(15_000),
      });

      if (upstream.status < 300 || upstream.status >= 400) break;
      const location = upstream.headers.get("location");
      if (!location) return errorResponse("Google Drive returned an invalid redirect", 502);
      await upstream.body?.cancel();
      upstreamUrl = new URL(location, upstreamUrl);
    }

    if (!upstream || upstream.status < 200 || upstream.status >= 300) {
      return errorResponse("Google Drive could not provide this image", 502);
    }

    const contentType = (upstream.headers.get("content-type") ?? "").split(";")[0].trim().toLowerCase();
    if (!ALLOWED_IMAGE_TYPES.has(contentType)) {
      return errorResponse("The shared Google Drive file is not an accessible image", 415);
    }

    const contentLength = Number(upstream.headers.get("content-length"));
    if (Number.isFinite(contentLength) && contentLength > MAX_IMAGE_BYTES) {
      return errorResponse("The image exceeds the 20 MB limit", 413);
    }

    if (!upstream.body) return errorResponse("Google Drive returned an empty image", 502);

    const reader = upstream.body.getReader();
    const chunks: Uint8Array[] = [];
    let totalBytes = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > MAX_IMAGE_BYTES) {
        await reader.cancel();
        return errorResponse("The image exceeds the 20 MB limit", 413);
      }
      chunks.push(value);
    }

    const image = new Uint8Array(totalBytes);
    let offset = 0;
    for (const chunk of chunks) {
      image.set(chunk, offset);
      offset += chunk.byteLength;
    }

    return new NextResponse(image, {
      headers: {
        "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400",
        "Content-Length": String(totalBytes),
        "Content-Type": contentType,
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("Could not retrieve Google Drive image", error);
    return errorResponse("Could not retrieve the Google Drive image", 502);
  }
}
