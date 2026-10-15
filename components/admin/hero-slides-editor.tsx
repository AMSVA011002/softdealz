"use client";

import * as React from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import type { HeroSlide } from "@/lib/home/hero-slides";

function createSlide(): HeroSlide {
  return {
    id: `custom-${crypto.randomUUID()}`,
    eyebrow: "New promotion",
    title: "Your headline",
    highlight: "highlight text",
    description: "Describe this promotion for your shoppers.",
    image: "/images/hero/hero-sale.jpg",
    ctaLabel: "Shop now",
    ctaHref: "/deals",
    secondaryLabel: "Browse products",
    secondaryHref: "/products",
    theme: "green",
  };
}

function isHeroTheme(value: string): value is HeroSlide["theme"] {
  return value === "green" || value === "blue" || value === "light";
}

export function HeroSlidesEditor({
  slides: initialSlides,
  error,
}: {
  slides: HeroSlide[];
  error?: string;
}) {
  const [slides, setSlides] = React.useState(initialSlides);

  const updateSlide = (index: number, patch: Partial<HeroSlide>) => {
    setSlides((current) => current.map((slide, i) => (i === index ? { ...slide, ...patch } : slide)));
  };

  return (
    <div className="space-y-4">
      <input type="hidden" name="hero_slides" value={JSON.stringify(slides)} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[0.8rem] text-ink-500">
          Add, edit, or remove slides shown in the storefront hero. Their order below is the order shown.
          Use image paths under /public.
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={slides.length >= 10}
          onClick={() => setSlides((current) => [...current, createSlide()])}
        >
          <Plus className="size-4" /> Add slide
        </Button>
      </div>

      {slides.map((slide, index) => (
        <fieldset key={slide.id} className="space-y-4 rounded-2xl border border-ink-200 p-4">
          <legend className="px-2 text-[0.85rem] font-bold text-ink-800">Slide {index + 1}</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Eyebrow" htmlFor={`hero-${index}-eyebrow`}>
              <Input
                id={`hero-${index}-eyebrow`}
                maxLength={80}
                value={slide.eyebrow}
                onChange={(event) => updateSlide(index, { eyebrow: event.currentTarget.value })}
              />
            </Field>
            <Field label="Theme" htmlFor={`hero-${index}-theme`}>
              <Select
                id={`hero-${index}-theme`}
                value={slide.theme}
                onChange={(event) => {
                  const theme = event.currentTarget.value;
                  if (isHeroTheme(theme)) updateSlide(index, { theme });
                }}
              >
                <option value="green">Green</option>
                <option value="blue">Blue</option>
                <option value="light">Light</option>
              </Select>
            </Field>
            <Field label="Headline" htmlFor={`hero-${index}-title`}>
              <Input
                id={`hero-${index}-title`}
                maxLength={120}
                value={slide.title}
                onChange={(event) => updateSlide(index, { title: event.currentTarget.value })}
              />
            </Field>
            <Field label="Headline highlight" htmlFor={`hero-${index}-highlight`}>
              <Input
                id={`hero-${index}-highlight`}
                maxLength={120}
                value={slide.highlight}
                onChange={(event) => updateSlide(index, { highlight: event.currentTarget.value })}
              />
            </Field>
          </div>
          <Field label="Description" htmlFor={`hero-${index}-description`}>
            <Textarea
              id={`hero-${index}-description`}
              rows={3}
              maxLength={500}
              value={slide.description}
              onChange={(event) => updateSlide(index, { description: event.currentTarget.value })}
            />
          </Field>
          <Field
            label="Image path or public Google Drive link"
            htmlFor={`hero-${index}-image`}
            hint="Use a /public image path or a Google Drive share link. Set the file's General access to Anyone with the link."
          >
            <Input
              id={`hero-${index}-image`}
              maxLength={500}
              value={slide.image}
              onChange={(event) => updateSlide(index, { image: event.currentTarget.value })}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Primary button label" htmlFor={`hero-${index}-cta-label`}>
              <Input
                id={`hero-${index}-cta-label`}
                maxLength={60}
                value={slide.ctaLabel}
                onChange={(event) => updateSlide(index, { ctaLabel: event.currentTarget.value })}
              />
            </Field>
            <Field label="Primary button path" htmlFor={`hero-${index}-cta-href`}>
              <Input
                id={`hero-${index}-cta-href`}
                maxLength={500}
                value={slide.ctaHref}
                onChange={(event) => updateSlide(index, { ctaHref: event.currentTarget.value })}
              />
            </Field>
            <Field label="Secondary button label" htmlFor={`hero-${index}-secondary-label`}>
              <Input
                id={`hero-${index}-secondary-label`}
                maxLength={60}
                value={slide.secondaryLabel}
                onChange={(event) => updateSlide(index, { secondaryLabel: event.currentTarget.value })}
              />
            </Field>
            <Field label="Secondary button path" htmlFor={`hero-${index}-secondary-href`}>
              <Input
                id={`hero-${index}-secondary-href`}
                maxLength={500}
                value={slide.secondaryHref}
                onChange={(event) => updateSlide(index, { secondaryHref: event.currentTarget.value })}
              />
            </Field>
          </div>
          <div className="flex justify-end">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={slides.length <= 1}
              onClick={() => setSlides((current) => current.filter((_, i) => i !== index))}
            >
              <Trash2 className="size-4" /> Remove slide
            </Button>
          </div>
        </fieldset>
      ))}

      {error && <p role="alert" className="text-[0.8rem] font-medium text-rose-brand">{error}</p>}
    </div>
  );
}
