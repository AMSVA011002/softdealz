import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/env";

/** Keep private areas and APIs out of search engines. */
export default function robots(): MetadataRoute.Robots {
  const base = siteUrl();

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/admin/",
          "/account",
          "/account/",
          "/api/",
          "/cart",
          "/checkout",
          "/login",
          "/register",
          "/forgot-password",
        ],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
