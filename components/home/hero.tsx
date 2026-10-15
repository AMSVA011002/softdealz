"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { HeroSlide } from "@/lib/home/hero-slides";

export type { HeroSlide } from "@/lib/home/hero-slides";

const THEMES: Record<HeroSlide["theme"], { wrapper: string; eyebrow: string; title: string; body: string }> = {
  green: {
    wrapper: "from-brand-800 via-brand-700 to-brand-600",
    eyebrow: "bg-white/15 text-white",
    title: "text-white",
    body: "text-white/80",
  },
  blue: {
    wrapper: "from-ocean-900 via-ocean-700 to-ocean-600",
    eyebrow: "bg-white/15 text-white",
    title: "text-white",
    body: "text-white/80",
  },
  light: {
    wrapper: "from-ink-50 via-white to-brand-50",
    eyebrow: "bg-brand-600/10 text-brand-700",
    title: "text-ink-900",
    body: "text-ink-600",
  },
};

export function Hero({ slides }: { slides: HeroSlide[] }) {
  const [index, setIndex] = React.useState(0);
  const [paused, setPaused] = React.useState(false);

  React.useEffect(() => {
    if (paused || slides.length <= 1) return;
    const timer = window.setInterval(() => setIndex((value) => (value + 1) % slides.length), 7000);
    return () => window.clearInterval(timer);
  }, [paused, slides.length]);

  const go = (next: number) => setIndex((next + slides.length) % slides.length);
  const slide = slides[index];
  const theme = THEMES[slide.theme];

  return (
    <section
      className="relative isolate overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-roledescription="carousel"
      aria-label="Featured promotions"
    >
      <div className={cn("bg-gradient-to-br transition-colors duration-700", theme.wrapper)}>
        <div className="container-page">
          <div className="grid items-center gap-8 py-10 sm:py-14 lg:grid-cols-2 lg:gap-12 lg:py-20 3xl:py-24">
            {/* copy */}
            <div key={slide.id} className="animate-[fade-up_0.5s_cubic-bezier(0.22,1,0.36,1)]">
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[0.72rem] font-bold uppercase tracking-wider backdrop-blur",
                  theme.eyebrow,
                )}
              >
                <Sparkles className="size-3.5" />
                {slide.eyebrow}
              </span>

              <h1
                className={cn(
                  "mt-4 text-fluid-4xl font-extrabold leading-[1.05] and-3xl:text-5xl",
                  theme.title,
                )}
              >
                {slide.title} <span className="text-brand-300">{slide.highlight}</span>
              </h1>

              <p className={cn("mt-4 max-w-lg text-fluid-base leading-relaxed", theme.body)}>
                {slide.description}
              </p>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Link
                  href={slide.ctaHref}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-brand-600 px-6 text-[0.92rem] font-semibold text-white shadow-brand transition-all hover:bg-brand-700 active:scale-[0.98] sm:h-13 sm:px-7"
                >
                  {slide.ctaLabel}
                  <ArrowRight className="size-4" />
                </Link>
                <Link
                  href={slide.secondaryHref}
                  className={cn(
                    "inline-flex h-12 items-center justify-center rounded-xl border px-6 text-[0.92rem] font-semibold backdrop-blur transition-all active:scale-[0.98] sm:h-13 sm:px-7",
                    slide.theme === "light"
                      ? "border-ink-300 bg-white text-ink-800 hover:border-brand-500 hover:text-brand-700"
                      : "border-white/25 bg-white/10 text-white hover:bg-white/20",
                  )}
                >
                  {slide.secondaryLabel}
                </Link>
              </div>

              <dl className="mt-8 grid max-w-md grid-cols-3 gap-4">
                {[
                  { label: "Products", value: "12k+" },
                  { label: "Happy buyers", value: "48k+" },
                  { label: "Avg. rating", value: "4.8★" },
                ].map((stat) => (
                  <div key={stat.label}>
                    <dt
                      className={cn(
                        "text-[0.68rem] font-bold uppercase tracking-wider",
                        slide.theme === "light" ? "text-ink-400" : "text-white/60",
                      )}
                    >
                      {stat.label}
                    </dt>
                    <dd className={cn("text-fluid-lg font-extrabold", theme.title)}>{stat.value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            {/* artwork */}
            <div className="relative order-first lg:order-last">
              <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl shadow-2xl ring-1 ring-black/5 sm:aspect-[16/9] lg:aspect-[4/3] 3xl:aspect-[16/9]">
                <Image
                  src={slide.image}
                  alt=""
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                  unoptimized={slide.image.startsWith("https://drive.google.com/")}
                />
              </div>

              {/* floating deal card */}
              <div className="absolute -bottom-4 left-4 hidden rounded-2xl bg-white p-3.5 shadow-lift sm:block lg:-left-6 lg:p-4">
                <p className="text-[0.68rem] font-bold uppercase tracking-wider text-ink-400">Today only</p>
                <p className="text-fluid-lg font-extrabold text-brand-700">Up to 60% off</p>
                <p className="text-[0.72rem] text-ink-500">Electronics & home essentials</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* controls */}
      {slides.length > 1 && (
        <div className="container-page pointer-events-none absolute inset-x-0 bottom-4 flex items-center justify-between gap-4">
          <div className="pointer-events-auto flex items-center gap-2">
            {slides.map((entry, dotIndex) => (
              <button
                key={entry.id}
                type="button"
                onClick={() => go(dotIndex)}
                aria-label={`Go to slide ${dotIndex + 1}: ${entry.title}`}
                aria-current={dotIndex === index}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  dotIndex === index
                    ? "w-8 bg-white"
                    : slide.theme === "light"
                      ? "w-3 bg-ink-300 hover:bg-ink-400"
                      : "w-3 bg-white/45 hover:bg-white/70",
                )}
              />
            ))}
          </div>

          <div className="pointer-events-auto hidden items-center gap-2 sm:flex">
            <button
              type="button"
              onClick={() => go(index - 1)}
              aria-label="Previous slide"
              className={cn(
                "grid size-10 place-items-center rounded-full backdrop-blur transition-colors",
                slide.theme === "light"
                  ? "bg-white/80 text-ink-700 hover:bg-white"
                  : "bg-white/15 text-white hover:bg-white/25",
              )}
            >
              <ChevronLeft className="size-4.5" />
            </button>
            <button
              type="button"
              onClick={() => go(index + 1)}
              aria-label="Next slide"
              className={cn(
                "grid size-10 place-items-center rounded-full backdrop-blur transition-colors",
                slide.theme === "light"
                  ? "bg-white/80 text-ink-700 hover:bg-white"
                  : "bg-white/15 text-white hover:bg-white/25",
              )}
            >
              <ChevronRight className="size-4.5" />
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
