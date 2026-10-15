export function normalizeGoogleDriveImageUrl(value: string): string | null {
  try {
    const url = new URL(value);
    const isDriveHost =
      url.hostname === "drive.google.com" || url.hostname === "drive.usercontent.google.com";
    if (url.protocol !== "https:" || !isDriveHost || url.port || url.username || url.password) {
      return null;
    }

    const filePath =
      url.hostname === "drive.google.com"
        ? url.pathname.match(/^\/file\/d\/([A-Za-z0-9_-]+)(?:\/|$)/)
        : null;
    const fileId =
      filePath?.[1] ??
      (["/open", "/uc"].includes(url.pathname) ||
      (url.hostname === "drive.usercontent.google.com" && url.pathname === "/download")
        ? url.searchParams.get("id")
        : null);
    if (!fileId || !/^[A-Za-z0-9_-]{10,200}$/.test(fileId)) return null;

    return `/api/images/google-drive/${encodeURIComponent(fileId)}`;
  } catch {
    return null;
  }
}

export function resolveImageUrl(value: string): string {
  return normalizeGoogleDriveImageUrl(value) ?? value;
}

export function normalizeImageInput(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return "";
  const driveUrl = normalizeGoogleDriveImageUrl(trimmed);
  if (driveUrl) return driveUrl;
  if (/^https:\/\/drive(?:\.usercontent)?\.google\.com(?:[/:?#]|$)/i.test(trimmed)) return null;
  if (isSafeLocalImagePath(trimmed)) return trimmed;

  try {
    const url = new URL(trimmed);
    return url.protocol === "https:" && !url.username && !url.password ? trimmed : null;
  } catch {
    return null;
  }
}

export function isSafeLocalImagePath(value: string): boolean {
  return (
    value.startsWith("/") &&
    !value.startsWith("//") &&
    !value.includes("\\") &&
    !value.split(/[?#]/, 1)[0].split("/").includes("..")
  );
}
