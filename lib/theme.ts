import type { CSSProperties } from "react";

export const DEFAULT_BRAND_COLOR = "#0c800f";
export const DEFAULT_OCEAN_COLOR = "#0a57a0";

type ThemeVariables = CSSProperties & {
  [key: `--color-${string}`]: string;
};

function parseHexColor(value: string): [number, number, number] {
  const hex = value.slice(1);
  return [
    Number.parseInt(hex.slice(0, 2), 16),
    Number.parseInt(hex.slice(2, 4), 16),
    Number.parseInt(hex.slice(4, 6), 16),
  ];
}

function toHexColor([red, green, blue]: [number, number, number]): string {
  return `#${[red, green, blue]
    .map((channel) => Math.round(channel).toString(16).padStart(2, "0"))
    .join("")}`;
}

function shade(color: string, amount: number): string {
  const rgb = parseHexColor(color);
  const target = amount > 0 ? 255 : 0;
  return toHexColor(rgb.map((channel) => channel + (target - channel) * Math.abs(amount)) as [
    number,
    number,
    number,
  ]);
}

function addPalette(
  variables: ThemeVariables,
  prefix: "brand" | "ocean",
  base: string,
) {
  const shades: Record<number, number> = {
    50: 0.92,
    100: 0.84,
    200: 0.68,
    300: 0.48,
    400: 0.26,
    500: 0.12,
    600: 0,
    700: -0.18,
    800: -0.34,
    900: -0.5,
  };

  Object.entries(shades).forEach(([level, amount]) => {
    variables[`--color-${prefix}-${level}`] = amount === 0 ? base : shade(base, amount);
  });
  variables[`--color-${prefix}`] = base;
}

export function isHexColor(value: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(value);
}

export function themeColors(settings: Record<string, string>) {
  const primary = isHexColor(settings.brand_primary ?? "")
    ? settings.brand_primary
    : DEFAULT_BRAND_COLOR;
  const secondary = isHexColor(settings.brand_secondary ?? "")
    ? settings.brand_secondary
    : DEFAULT_OCEAN_COLOR;

  return { primary, secondary };
}

export function themeVariables(settings: Record<string, string>): ThemeVariables {
  const { primary, secondary } = themeColors(settings);
  const variables = {} as ThemeVariables;
  addPalette(variables, "brand", primary);
  addPalette(variables, "ocean", secondary);
  return variables;
}
