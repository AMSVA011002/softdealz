import { z } from "zod";
import { isSafeLocalImagePath, normalizeGoogleDriveImageUrl } from "@/lib/image-url";

const heroImageSchema = z
  .string()
  .trim()
  .min(1)
  .max(500)
  .transform((value) => normalizeGoogleDriveImageUrl(value) ?? value)
  .refine(
    (value) => isSafeLocalImagePath(value) || normalizeGoogleDriveImageUrl(value) !== null,
    "Use a safe /public image path or a public Google Drive image link",
  );

export const heroSlideSchema = z.object({
  id: z.string().trim().min(1).max(64),
  eyebrow: z.string().trim().min(1).max(80),
  title: z.string().trim().min(1).max(120),
  highlight: z.string().trim().min(1).max(120),
  description: z.string().trim().min(1).max(500),
  image: heroImageSchema,
  ctaLabel: z.string().trim().min(1).max(60),
  ctaHref: z.string().trim().min(1).max(500).refine(isSafeLocalImagePath, "Use an internal site path"),
  secondaryLabel: z.string().trim().min(1).max(60),
  secondaryHref: z.string().trim().min(1).max(500).refine(isSafeLocalImagePath, "Use an internal site path"),
  theme: z.enum(["green", "blue", "light"]),
});

export const heroSlidesSchema = z
  .array(heroSlideSchema)
  .min(1, "Keep at least one hero slide")
  .max(10, "You can add up to 10 hero slides")
  .superRefine((slides, context) => {
    const ids = new Set<string>();
    slides.forEach((slide, index) => {
      if (ids.has(slide.id)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: [index, "id"],
          message: "Each slide needs a unique id",
        });
      }
      ids.add(slide.id);
    });
  });

export type HeroSlide = z.infer<typeof heroSlideSchema>;

export const DEFAULT_HERO_SLIDES: HeroSlide[] = [
  {
    id: "mega-sale",
    eyebrow: "Mega deal week",
    title: "Everything you need,",
    highlight: "for less.",
    description:
      "Over 12,000 products across 20 categories — electronics, fashion, home, grocery and more. Free island-wide delivery on orders over LKR 25,000.",
    image: "/images/hero/hero-sale.jpg",
    ctaLabel: "Shop all deals",
    ctaHref: "/deals",
    secondaryLabel: "Browse categories",
    secondaryHref: "/products",
    theme: "green",
  },
  {
    id: "fast-delivery",
    eyebrow: "2–4 day delivery",
    title: "From our warehouse",
    highlight: "to your door.",
    description:
      "Live tracking on every parcel, cash on delivery in all districts, and a 7 day easy-return promise if something isn't right.",
    image: "/images/hero/hero-delivery.jpg",
    ctaLabel: "Track my order",
    ctaHref: "/track",
    secondaryLabel: "Delivery info",
    secondaryHref: "/shipping",
    theme: "blue",
  },
  {
    id: "tech-week",
    eyebrow: "Tech week",
    title: "Upgrade your setup",
    highlight: "save up to 40%.",
    description:
      "Laptops, monitors, audio and smart home gear from vetted brands — all with official local warranty and instalment-friendly pricing.",
    image: "/images/hero/hero-tech.jpg",
    ctaLabel: "Shop electronics",
    ctaHref: "/category/electronics",
    secondaryLabel: "See new arrivals",
    secondaryHref: "/products?sort=newest",
    theme: "light",
  },
];

export function readHeroSlides(value: string | undefined): HeroSlide[] {
  if (!value) return DEFAULT_HERO_SLIDES;

  try {
    const parsed = heroSlidesSchema.safeParse(JSON.parse(value));
    return parsed.success ? parsed.data : DEFAULT_HERO_SLIDES;
  } catch {
    return DEFAULT_HERO_SLIDES;
  }
}
