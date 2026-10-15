#!/usr/bin/env node
/**
 * SoftDealz asset generator.
 *
 * Produces a coherent, brand-consistent visual system for the catalog and for
 * category tiles — as lightweight SVG, so it scales to 4K without blurring and
 * costs almost nothing to serve.
 *
 *   node scripts/generate-assets.mjs
 *
 * Every product gets: a category-specific pictogram, a deterministic gradient
 * derived from its slug, a subtle grid + radial shine, a whisper-quiet
 * watermark, and the product name set in the artwork (like a real catalogue
 * shot). Replace with photography any time — drop files in
 * `public/images/products/` and update the `images` column.
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const PRODUCT_DIR = path.join(ROOT, "public", "images", "products");
const CATEGORY_DIR = path.join(ROOT, "public", "images", "categories");
const BRAND_DIR = path.join(ROOT, "public", "images", "brands");

const BRAND_GREEN = "#0c800f";
const BRAND_BLUE = "#0a57a0";

/* ------------------------------------------------------------------ */
/* Palettes — each category gets its own duotone so the grid looks rich */
/* ------------------------------------------------------------------ */

const PALETTES = {
  electronics: ["#0a57a0", "#3b82f6"],
  computers: ["#1e3a8a", "#0ea5e9"],
  mobiles: ["#0c4a6e", "#38bdf8"],
  audio: ["#4c1d95", "#a78bfa"],
  gaming: ["#312e81", "#818cf8"],
  fashion: ["#9d174d", "#fb7185"],
  footwear: ["#7c2d12", "#fb923c"],
  beauty: ["#831843", "#f472b6"],
  home: ["#134e4a", "#2dd4bf"],
  kitchen: ["#7c2d12", "#f59e0b"],
  furniture: ["#3f3f46", "#a1a1aa"],
  grocery: ["#14532d", "#4ade80"],
  health: ["#065f46", "#34d399"],
  sports: ["#0369a1", "#22d3ee"],
  outdoors: ["#166534", "#84cc16"],
  toys: ["#b45309", "#fbbf24"],
  baby: ["#0e7490", "#67e8f9"],
  automotive: ["#1f2937", "#64748b"],
  tools: ["#78350f", "#f59e0b"],
  books: ["#3730a3", "#a5b4fc"],
  jewellery: ["#115e59", "#5eead4"],
  pets: ["#3f6212", "#a3e635"],
  default: [BRAND_GREEN, BRAND_BLUE],
};

/* ------------------------------------------------------------------ */
/* Pictograms — one 24x24 line-icon path set per product archetype      */
/* Paths are drawn on a 0 0 24 24 viewBox, stroke-based.                */
/* ------------------------------------------------------------------ */

const ICONS = {
  headphone: "M4 15v-3a8 8 0 0 1 16 0v3M4 15a2 2 0 0 1 2-2h1v6H6a2 2 0 0 1-2-2v-2Zm16 0a2 2 0 0 0-2-2h-1v6h1a2 2 0 0 0 2-2v-2Z",
  smartphone: "M7 3h10a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Zm4 15h2M8 6h8v10H8Z",
  laptop: "M4 6h16v10H4zM2 19h20M9 19h6",
  watch: "M9 3h6l1 4H8l1-4Zm0 18h6l1-4H8l1 4ZM7 7h10v10H7zM12 10v3l2 1",
  camera: "M3 8h4l2-2h6l2 2h4v11H3V8Zm9 3.5a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z",
  tv: "M3 5h18v12H3zM8 21h8M12 17v4",
  tablet: "M5 4h14v16H5zM11 17h2",
  speaker: "M6 4h12v16H6zM12 9a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5ZM12 6.5h.01",
  keyboard: "M3 7h18v10H3zM7 11h.01M11 11h.01M15 11h.01M17 14h-10",
  mouse: "M12 3a5 5 0 0 0-5 5v8a5 5 0 0 0 10 0V8a5 5 0 0 0-5-5Zm0 3v3",
  printer: "M7 8V3h10v5M6 18H4V9h16v9h-2M7 14h10v7H7z",
  router: "M5 12h14v8H5zM8 16h.01M12 8V6M8.5 9.5a5 5 0 0 1 7 0M6 7a8 8 0 0 1 12 0",
  bulb: "M9 18h6M10 21h4M12 3a6 6 0 0 1 3.5 10.9V16h-7v-2.1A6 6 0 0 1 12 3Z",
  plug: "M9 3v5M15 3v5M6 8h12v3a6 6 0 0 1-12 0V8Zm6 9v4",
  shirt: "M8 3 4 6l2 4 2-1v11h8V9l2 1 2-4-4-3-2 2H10L8 3Z",
  dress: "M9 3l3 3 3-3 1 5-2 3 3 10H7l3-10-2-3 1-5Z",
  jacket: "M8 3 4 6v5l2 1v9h12v-9l2-1V6l-4-3-4 3-4-3Zm4 3v15",
  trousers: "M7 3h10l1 18h-5l-1-9-1 9H6L7 3Z",
  shoe: "M3 17h14l4-3-2-4-3 1-4-3-3 2-6 1v6Zm0 3h18",
  bag: "M5 8h14l1 12H4L5 8Zm4 0V6a3 3 0 0 1 6 0v2",
  glasses: "M3 12a3 3 0 1 0 6 0 3 3 0 0 0-6 0Zm12 0a3 3 0 1 0 6 0 3 3 0 0 0-6 0ZM9 12h6",
  ring: "M12 8a6 6 0 1 0 0 12 6 6 0 0 0 0-12Zm0 0 3-4h-6l3 4Z",
  watchband: "M12 6a6 6 0 1 0 0 12 6 6 0 0 0 0-12ZM9 6V3h6v3M9 18v3h6v-3",
  bottle: "M10 3h4v3l2 3v12H8V9l2-3V3Zm-2 9h8",
  cup: "M5 5h11v11a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4V5Zm11 3h2a2 2 0 0 1 0 5h-2",
  pan: "M4 12h14v2a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5v-2Zm14 1h3M8 5v3M12 4v4",
  blender: "M8 3h8l-1 8H9L8 3Zm1 8h6l-1 10H10L9 11Zm-1 10h8",
  kettle: "M6 9h11v9a3 3 0 0 1-3 3H9a3 3 0 0 1-3-3V9Zm11 2 3-2M9 6l1 3",
  pot: "M5 9h14v7a4 4 0 0 1-4 4h-6a4 4 0 0 1-4-4V9Zm3-3h8M3 11h2m14 0h2",
  sofa: "M5 11V8a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v3M3 12a2 2 0 0 1 4 0v3h10v-3a2 2 0 0 1 4 0v5H3v-5Zm3 5v2m12-2v2",
  bed: "M3 11h18v8H3zM3 11V7h7v4M10 11h11V8a3 3 0 0 0-3-3h-8",
  lamp: "M12 3 7 12h10L12 3Zm0 9v6M8 21h8",
  chair: "M7 3h10v9H7zM5 12h14v4H5zM8 16v5m8-5v5",
  plant: "M12 21V11M12 11c0-4 3-6 6-6 0 4-3 6-6 6Zm0 0c0-4-3-6-6-6 0 4 3 6 6 6ZM8 21h8",
  basket: "M4 9h16l-2 11H6L4 9Zm4 0 4-6 4 6M9 13v4m6-4v4",
  carrot: "M14 4a5 5 0 0 1 4 8l-7 9-4-4 7-9a5 5 0 0 1 0-4ZM6 15l3 3M9 5l2-2M5 9 3 7",
  apple: "M12 7c-4 0-6 3-6 6.5S8 21 12 21s6-4 6-7.5S16 7 12 7Zm0 0V4m0 0 3-1M8 4c1.5 0 3 1 4 3",
  dumbbell: "M3 10v4M6 8v8M18 8v8M21 10v4M6 12h12",
  ball: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm-6 6c4 1 8 1 12 0M9 20c1-3 1-6-1-9m7 9c-1-3-1-6 1-9",
  bike: "M6 18a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm12 0a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-8-2 3-8h4l1 4M9 8h4",
  tent: "M12 4 3 20h18L12 4Zm0 6v10",
  book: "M5 4h6a3 3 0 0 1 3 3v13a3 3 0 0 0-3-3H5V4Zm14 0h-6v13a3 3 0 0 1 3-3h3V4Z",
  pencil: "M4 20l1-4L16 5l3 3L8 19l-4 1ZM14 7l3 3",
  toy: "M9 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm6 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM6 21h12a6 6 0 0 0-6-6 6 6 0 0 0-6 6Z",
  puzzle: "M10 3h4v2a2 2 0 1 0 4 0h2v4a2 2 0 1 0 0 4h-2v4H4v-4a2 2 0 1 0 0-4V5h4a2 2 0 1 0 4 0V3Z",
  baby: "M12 3a5 5 0 1 0 0 10 5 5 0 0 0 0-10Zm0 10v8m-4-4h8",
  stroller: "M4 5h3l3 8h7l3-6M10 13a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm4-6 4 6",
  car: "M4 12l2-6h12l2 6v6h-3M4 18H3v-6h18M6 18a2 2 0 1 0 4 0 2 2 0 0 0-4 0Zm8 0a2 2 0 1 0 4 0 2 2 0 0 0-4 0Z",
  wheel: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm0 5a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm0 12v-4m0-12v4M3 12h5m8 0h5",
  wrench: "M14 4a5 5 0 0 0-4 8L4 18l2 2 6-6a5 5 0 0 0 8-4l-3 2-3-3 2-3a5 5 0 0 0-2-2Z",
  drill: "M4 6h9v6H4zM13 8h5l2-2v6l-2-2h-5M7 12v8h4v-8",
  helmet: "M4 15a8 8 0 0 1 16 0v3H4v-3Zm4 3v-6m8 6v-6",
  bottleCare: "M9 3h6v4l2 3v11H7V10l2-3V3Zm3 8v6",
  paw: "M8 6a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm8 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4ZM5 12a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm14 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm-7 1c-2.5 0-5 3-5 5s2 2 5 2 5 0 5-2-2.5-5-5-5Z",
  fish: "M3 12s4-5 9-5 9 5 9 5-4 5-9 5-9-5-9-5Zm13-1h.01M17 8l3-3M17 16l3 3",
  birdhouse: "M5 10 12 4l7 6v10H5V10Zm4 10v-5h6v5M12 4V2",
  grain: "M12 21V9M12 9c-2 0-4-2-4-4 2 0 4 2 4 4Zm0 0c2 0 4-2 4-4-2 0-4 2-4 4Zm-4 6c-2 0-4-2-4-4 2 0 4 2 4 4Zm8 0c2 0 4-2 4-4-2 0-4 2-4 4Z",
  cheese: "M3 15 15 4l6 4v7H3Zm0 0v3h18v-3M9 15v-4l4-3",
  meat: "M6 8a5 5 0 1 1 10 0c0 4-4 5-4 8a3 3 0 0 1-6 0c0-3-4-4-4-8Zm2 8h8",
  sachet: "M7 4h10v16H7zM9 8h6M9 12h6M9 16h4",
  cosmetics: "M9 3h6v5l1 2v11H8V10l1-2V3Zm-1 8h8",
  perfume: "M10 3h4v3h-4zM8 8h8v13H8zM12 11v6",
  scissors: "M6 4l12 12M18 4 6 16M6 20a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Zm12 0a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z",
  shirt_hanger: "M12 6a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Zm0 0v2L3 14v3h18v-3l-9-6",
  socks: "M8 3v9l-3 3a3 3 0 0 0 4 4l5-5V3H8Zm8 0v8",
  hat: "M5 14a7 7 0 0 1 14 0v4H5v-4Zm-2 4h18M12 7V4",
  wallet: "M4 7h14a2 2 0 0 1 2 2v9H4a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1Zm12 6h.01M4 7l10-4v4",
  clock: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm0 5v4l3 2",
  speaker_small: "M10 3h4v9l4 2v3l-6-3-2 1v-9l4 2",
  monitor: "M3 4h18v12H3zM8 20h8M12 16v4",
};

const ICON_ALIASES = {
  headphones: "headphone",
  earbuds: "headphone",
  smartwatch: "watchband",
  mobile: "smartphone",
  phone: "smartphone",
  monitor: "monitor",
  tv: "tv",
  speaker: "speaker",
  shoe: "shoe",
  sneaker: "shoe",
  sandal: "shoe",
  kitchen: "pan",
  cookware: "pan",
  mug: "cup",
  bottle: "bottle",
  furniture: "sofa",
  mattress: "bed",
  light: "lamp",
  lamp: "lamp",
  food: "carrot",
  spice: "grain",
  fruit: "apple",
  fitness: "dumbbell",
  cricket: "ball",
  football: "ball",
  outdoor: "tent",
  camping: "tent",
  cycle: "bike",
  book: "book",
  stationery: "pencil",
  notebook: "book",
  toy: "toy",
  lego: "puzzle",
  baby: "baby",
  pram: "stroller",
  automotive: "car",
  tyre: "wheel",
  car: "car",
  tool: "wrench",
  drill: "drill",
  helmet: "helmet",
  pet: "paw",
  aquarium: "fish",
  bird: "birdhouse",
  grain: "grain",
  dairy: "cheese",
  meat: "meat",
  beauty: "cosmetics",
  perfume: "perfume",
  makeup: "cosmetics",
  kitchenware: "pot",
  grooming: "scissors",
  apparel: "shirt",
  watch: "watchband",
  jewellery: "ring",
  glasses: "glasses",
  bag: "bag",
  purse: "wallet",
  clock: "clock",
  bluetooth: "speaker_small",
};

function iconFor(kind) {
  if (!kind) return ICONS.bulb;
  const key = String(kind).toLowerCase();
  if (ICONS[key]) return ICONS[key];
  if (ICON_ALIASES[key] && ICONS[ICON_ALIASES[key]]) return ICONS[ICON_ALIASES[key]];
  return ICONS.bulb;
}

/* ------------------------------------------------------------------ */
/* Deterministic per-item variation                                    */
/* ------------------------------------------------------------------ */

function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function mulberry(seed) {
  let a = seed >>> 0;
  return () => {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** Splits a title into balanced display lines. */
function wrap(text, maxChars, maxLines) {
  const words = String(text).split(/\s+/);
  const lines = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length <= maxChars || !current) {
      current = candidate;
    } else {
      lines.push(current);
      current = word;
      if (lines.length === maxLines) break;
    }
  }
  if (current && lines.length < maxLines) lines.push(current);
  return lines.slice(0, maxLines);
}

/* ------------------------------------------------------------------ */
/* Product image                                                       */
/* ------------------------------------------------------------------ */

function productSvg({ title, slug, kind, palette, width, height }) {
  const [c1, c2] = palette;
  const seed = hash(slug);
  const rand = mulberry(seed);

  // A stable, per-product rotation/spread so the grid never looks mechanical.
  const angle = 90 + (seed % 60) - 30;
  const glowX = 30 + Math.floor(rand() * 40);
  const glowY = 22 + Math.floor(rand() * 30);
  const iconScale = 3.6 + (seed % 12) / 20;

  const lines = wrap(title, 20, 3);
  const lineHeight = height * 0.062;
  const blockHeight = lines.length * lineHeight;
  const textTop = height * 0.885 - blockHeight;
  const iconCentreY = height * 0.42;

  const iconPaths = iconFor(kind)
    .split("M")
    .filter(Boolean)
    .map((segment) => `M${segment}`)
    .map((d) => `<path d="${d}" />`)
    .join("");

  const tile = width * 0.42;
  const rx = tile * 0.16;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img" aria-label="${escapeXml(title)}">
  <defs>
    <linearGradient id="bg" gradientTransform="rotate(${angle} 0.5 0.5)">
      <stop offset="0%" stop-color="${c1}" />
      <stop offset="100%" stop-color="${c2}" />
    </linearGradient>
    <radialGradient id="glow" cx="${glowX}%" cy="${glowY}%" r="62%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.34" />
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0" />
    </radialGradient>
    <linearGradient id="tile" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.20" />
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0.06" />
    </linearGradient>
    <filter id="soft" x="-25%" y="-25%" width="150%" height="150%">
      <feDropShadow dx="0" dy="${height * 0.018}" stdDeviation="${height * 0.02}" flood-color="#000000" flood-opacity="0.18" />
    </filter>
    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M40 0H0V40" fill="none" stroke="#ffffff" stroke-opacity="0.07" stroke-width="1" />
    </pattern>
  </defs>

  <rect width="${width}" height="${height}" fill="url(#bg)" />
  <rect width="${width}" height="${height}" fill="url(#grid)" />
  <rect width="${width}" height="${height}" fill="url(#glow)" />

  <circle cx="${width * 0.82}" cy="${height * 0.16}" r="${height * 0.22}" fill="#ffffff" fill-opacity="0.06" />
  <circle cx="${width * 0.12}" cy="${height * 0.86}" r="${height * 0.26}" fill="#000000" fill-opacity="0.06" />

  <g filter="url(#soft)" transform="translate(${width / 2 - tile / 2} ${iconCentreY - tile / 2})">
    <rect width="${tile}" height="${tile}" rx="${rx}" fill="url(#tile)" stroke="#ffffff" stroke-opacity="0.28" />
    <g transform="translate(${tile * 0.16} ${tile * 0.16}) scale(${(tile * 0.68 * iconScale) / 24 / 2.6})"
       fill="none" stroke="#ffffff" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"
       stroke-opacity="0.95">${iconPaths}</g>
  </g>

  <g font-family="Inter, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" text-anchor="middle">
    ${lines
      .map(
        (line, index) =>
          `<text x="${width / 2}" y="${textTop + index * lineHeight}" font-size="${height * 0.052}" font-weight="700" fill="#ffffff" fill-opacity="0.97">${escapeXml(line)}</text>`,
      )
      .join("\n    ")}
  </g>
</svg>
`;
}

/* ------------------------------------------------------------------ */
/* Category tile                                                       */
/* ------------------------------------------------------------------ */

function categorySvg({ name, slug, kind, palette, size = 400 }) {
  const [c1, c2] = palette;
  const seed = hash(slug);
  const iconPaths = iconFor(kind)
    .split("M")
    .filter(Boolean)
    .map((segment) => `M${segment}`)
    .map((d) => `<path d="${d}" />`)
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" role="img" aria-label="${escapeXml(name)}">
  <defs>
    <linearGradient id="bg" gradientTransform="rotate(${120 + (seed % 40)} 0.5 0.5)">
      <stop offset="0%" stop-color="${c1}" />
      <stop offset="100%" stop-color="${c2}" />
    </linearGradient>
    <radialGradient id="glow" cx="30%" cy="24%" r="70%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.32" />
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0" />
    </radialGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${size * 0.14}" fill="url(#bg)" />
  <rect width="${size}" height="${size}" rx="${size * 0.14}" fill="url(#glow)" />
  <circle cx="${size * 0.8}" cy="${size * 0.78}" r="${size * 0.3}" fill="#000000" fill-opacity="0.07" />
  <g transform="translate(${size * 0.28} ${size * 0.26}) scale(${(size * 0.44) / 24}) scale(1)"
     fill="none" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"
     stroke-opacity="0.95">${iconPaths}</g>
</svg>
`;
}

/* ------------------------------------------------------------------ */
/* Brand wordmark                                                      */
/* ------------------------------------------------------------------ */

function brandSvg(name, slug) {
  const seed = hash(slug);
  const palettes = [
    [BRAND_GREEN, "#22c55e"],
    [BRAND_BLUE, "#3b82f6"],
    ["#111827", "#4b5563"],
    ["#7c3aed", "#a78bfa"],
    ["#be123c", "#fb7185"],
  ];
  const [c1, c2] = palettes[seed % palettes.length];

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 80" width="200" height="80" role="img" aria-label="${escapeXml(name)}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${c1}" />
      <stop offset="100%" stop-color="${c2}" />
    </linearGradient>
  </defs>
  <rect width="200" height="80" rx="14" fill="url(#bg)" />
  <text x="100" y="48" text-anchor="middle" font-family="Inter, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
        font-size="24" font-weight="800" fill="#ffffff" letter-spacing="-0.5">${escapeXml(name)}</text>
</svg>
`;
}

/* ------------------------------------------------------------------ */
/* Runner                                                              */
/* ------------------------------------------------------------------ */

function readCatalog() {
  const dir = path.join(ROOT, "db", "catalog");
  if (!fs.existsSync(dir)) {
    console.error("✖ No catalog found. Expected JSON files in db/catalog/.");
    process.exit(1);
  }

  const catalog = { categories: [], brands: [] };
  for (const file of fs.readdirSync(dir).filter((f) => f.endsWith(".json")).sort()) {
    const parsed = JSON.parse(fs.readFileSync(path.join(dir, file), "utf8"));
    if (parsed.categories) catalog.categories.push(...parsed.categories);
    if (parsed.brands) catalog.brands.push(...parsed.brands);
  }
  return catalog;
}

function toSlug(value) {
  return String(value)
    .toLowerCase()
    .replace(/["']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70);
}

function main() {
  const catalog = readCatalog();
  fs.mkdirSync(PRODUCT_DIR, { recursive: true });
  fs.mkdirSync(CATEGORY_DIR, { recursive: true });
  fs.mkdirSync(BRAND_DIR, { recursive: true });

  let productCount = 0;
  let categoryCount = 0;

  for (const category of catalog.categories) {
    const palette = PALETTES[category.slug] ?? PALETTES.default;

    for (const child of category.children ?? []) {
      for (const product of child.products ?? []) {
        const slug = toSlug(product.t);
        const icon = product.i ?? child.icon ?? category.icon;
        // Two angles per product so the gallery has a second frame.
        fs.writeFileSync(
          path.join(PRODUCT_DIR, `${slug}.svg`),
          productSvg({ title: product.t, slug, kind: icon, palette, width: 1200, height: 1200 }),
        );
        fs.writeFileSync(
          path.join(PRODUCT_DIR, `${slug}-alt.svg`),
          productSvg({ title: product.t, slug: `${slug}-alt`, kind: icon, palette, width: 1200, height: 1200 }),
        );
        productCount += 2;
      }
    }

    fs.writeFileSync(
      path.join(CATEGORY_DIR, `${category.slug}.svg`),
      categorySvg({ name: category.name, slug: category.slug, kind: category.icon, palette, size: 400 }),
    );
    categoryCount += 1;
  }

  for (const brand of catalog.brands ?? []) {
    fs.writeFileSync(path.join(BRAND_DIR, `${brand.slug}.svg`), brandSvg(brand.name, brand.slug));
  }

  // Generic placeholder + softdealz logo mark
  fs.writeFileSync(
    path.join(PRODUCT_DIR, "placeholder.svg"),
    productSvg({
      title: "Product image",
      slug: "placeholder",
      kind: "bag",
      palette: PALETTES.default,
      width: 1200,
      height: 1200,
    }),
  );

  console.log(
    `✔ assets generated: ${productCount} product images, ${categoryCount} category tiles, ${
      (catalog.brands ?? []).length
    } brand marks`,
  );
}

main();
