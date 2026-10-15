"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { formatCompactPrice, formatNumber, formatPrice } from "@/lib/format";

/**
 * Hand-rolled SVG charts — no charting dependency, fully responsive, and they
 * stay crisp on 4K displays because everything is vector.
 */

export interface SeriesPoint {
  label: string;
  value: number;
  secondary?: number;
}

/**
 * Charts are client components, so they can only receive serializable props.
 * Formatting is therefore selected with a string key instead of a callback.
 */
export type ValueFormat = "number" | "price" | "compactPrice";

function formatValue(value: number, format: ValueFormat = "number"): string {
  if (format === "price") return formatPrice(value);
  if (format === "compactPrice") return formatCompactPrice(value);
  return formatNumber(value);
}

/* ------------------------------------------------------------------ */
/* Area + line chart                                                   */
/* ------------------------------------------------------------------ */

export function AreaChart({
  data,
  height = 240,
  format = "number",
  showSecondary = false,
  className,
  color = "#0c800f",
  secondaryColor = "#0a57a0",
}: {
  data: SeriesPoint[];
  height?: number;
  format?: ValueFormat;
  showSecondary?: boolean;
  className?: string;
  color?: string;
  secondaryColor?: string;
}) {
  const [hover, setHover] = React.useState<number | null>(null);
  const gradientId = React.useId();
  const secondaryGradientId = React.useId();

  if (data.length === 0) {
    return <div className="grid h-40 place-items-center text-[0.82rem] text-ink-400">No data in this period</div>;
  }

  const width = 1000;
  const padding = { top: 16, right: 8, bottom: 28, left: 8 };
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;

  const max = Math.max(...data.map((point) => Math.max(point.value, point.secondary ?? 0)), 1);
  const stepX = data.length > 1 ? innerWidth / (data.length - 1) : innerWidth;

  const toXY = (value: number, index: number) => [
    padding.left + index * stepX,
    padding.top + innerHeight - (value / max) * innerHeight,
  ] as const;

  const linePath = (key: "value" | "secondary") =>
    data
      .map((point, index) => {
        const [x, y] = toXY(key === "value" ? point.value : (point.secondary ?? 0), index);
        return `${index === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");

  const areaPath = `${linePath("value")} L${padding.left + (data.length - 1) * stepX},${
    padding.top + innerHeight
  } L${padding.left},${padding.top + innerHeight} Z`;

  // Show ~6 x-axis labels regardless of range length.
  const labelEvery = Math.max(1, Math.ceil(data.length / 6));
  const active = hover === null ? null : data[hover];

  return (
    <div className={cn("relative w-full", className)}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full"
        style={{ height }}
        preserveAspectRatio="none"
        role="img"
        aria-label="Trend chart"
        onMouseLeave={() => setHover(null)}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.28" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
          <linearGradient id={secondaryGradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={secondaryColor} stopOpacity="0.18" />
            <stop offset="100%" stopColor={secondaryColor} stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {/* horizontal gridlines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
          <line
            key={ratio}
            x1={padding.left}
            x2={width - padding.right}
            y1={padding.top + innerHeight * ratio}
            y2={padding.top + innerHeight * ratio}
            stroke="#e2e8f0"
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
          />
        ))}

        {showSecondary && (
          <>
            <path d={areaPath} fill={`url(#${secondaryGradientId})`} />
            <path
              d={linePath("secondary")}
              fill="none"
              stroke={secondaryColor}
              strokeWidth="2"
              strokeDasharray="5 4"
              vectorEffect="non-scaling-stroke"
            />
          </>
        )}

        <path d={areaPath} fill={`url(#${gradientId})`} />
        <path
          d={linePath("value")}
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />

        {/* hover targets */}
        {data.map((point, index) => {
          const [x] = toXY(point.value, index);
          return (
            <rect
              key={`hit-${point.label}-${index}`}
              x={x - stepX / 2}
              y={padding.top}
              width={stepX}
              height={innerHeight}
              fill="transparent"
              onMouseEnter={() => setHover(index)}
              style={{ cursor: "crosshair" }}
            />
          );
        })}

        {active && hover !== null && (
          <>
            <line
              x1={toXY(active.value, hover)[0]}
              x2={toXY(active.value, hover)[0]}
              y1={padding.top}
              y2={padding.top + innerHeight}
              stroke="#94a3b8"
              strokeWidth="1"
              strokeDasharray="3 3"
              vectorEffect="non-scaling-stroke"
            />
            <circle
              cx={toXY(active.value, hover)[0]}
              cy={toXY(active.value, hover)[1]}
              r="4"
              fill="white"
              stroke={color}
              strokeWidth="2.5"
              vectorEffect="non-scaling-stroke"
            />
          </>
        )}

        {/* x labels */}
        {data.map((point, index) =>
          index % labelEvery === 0 || index === data.length - 1 ? (
            <text
              key={`label-${point.label}-${index}`}
              x={padding.left + index * stepX}
              y={height - 8}
              textAnchor={index === 0 ? "start" : index === data.length - 1 ? "end" : "middle"}
              className="fill-ink-400"
              style={{ fontSize: 20 }}
            >
              {point.label}
            </text>
          ) : null,
        )}
      </svg>

      {active && (
        <div
          className="pointer-events-none absolute top-2 rounded-xl border border-ink-200 bg-white/97 px-3 py-2 shadow-lift backdrop-blur"
          style={{
            left: `${Math.min(78, Math.max(2, (hover! / Math.max(1, data.length - 1)) * 100))}%`,
          }}
        >
          <p className="text-[0.7rem] font-semibold uppercase tracking-wide text-ink-400">{active.label}</p>
          <p className="text-[0.9rem] font-extrabold text-ink-900">{formatValue(active.value, format)}</p>
          {showSecondary && typeof active.secondary === "number" && (
            <p className="text-[0.75rem] font-medium text-ocean-600">{formatNumber(active.secondary)} orders</p>
          )}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Bar chart                                                           */
/* ------------------------------------------------------------------ */

export function BarChart({
  data,
  height = 220,
  format = "number",
  className,
  color = "#0a57a0",
}: {
  data: SeriesPoint[];
  height?: number;
  format?: ValueFormat;
  className?: string;
  color?: string;
}) {
  const [hover, setHover] = React.useState<number | null>(null);

  if (data.length === 0) {
    return <div className="grid h-40 place-items-center text-[0.82rem] text-ink-400">No data yet</div>;
  }

  const max = Math.max(...data.map((point) => point.value), 1);
  const labelEvery = Math.max(1, Math.ceil(data.length / 8));

  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-end gap-1.5" style={{ height }}>
        {data.map((point, index) => {
          const percent = (point.value / max) * 100;
          return (
            <div
              key={`${point.label}-${index}`}
              className="group relative flex h-full min-w-0 flex-1 flex-col justify-end"
              onMouseEnter={() => setHover(index)}
              onMouseLeave={() => setHover(null)}
            >
              {hover === index && (
                <div className="pointer-events-none absolute -top-1 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-lg border border-ink-200 bg-white px-2.5 py-1.5 shadow-lift">
                  <p className="text-[0.7rem] font-semibold text-ink-500">{point.label}</p>
                  <p className="text-[0.82rem] font-bold text-ink-900">{formatValue(point.value, format)}</p>
                </div>
              )}
              <div
                className="w-full rounded-t-md transition-all duration-300"
                style={{
                  height: `${Math.max(2, percent)}%`,
                  backgroundColor: hover === index ? "#0c800f" : color,
                  opacity: hover === null || hover === index ? 1 : 0.55,
                }}
              />
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex gap-1.5">
        {data.map((point, index) => (
          <span key={`${point.label}-label-${index}`} className="min-w-0 flex-1 truncate text-center text-[0.66rem] text-ink-400">
            {index % labelEvery === 0 ? point.label : ""}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Donut chart                                                         */
/* ------------------------------------------------------------------ */

export function DonutChart({
  data,
  size = 200,
  thickness = 26,
  centreLabel,
  centreValue,
  className,
}: {
  data: Array<{ label: string; value: number; color: string }>;
  size?: number;
  thickness?: number;
  centreLabel?: string;
  centreValue?: string;
  className?: string;
}) {
  const total = data.reduce((sum, entry) => sum + entry.value, 0);
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;

  let offset = 0;

  return (
    <div className={cn("flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:gap-6", className)}>
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} role="img" aria-label="Distribution chart">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#f1f5f9"
            strokeWidth={thickness}
          />
          {total > 0 &&
            data.map((entry) => {
              const fraction = entry.value / total;
              const dash = fraction * circumference;
              const element = (
                <circle
                  key={entry.label}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="none"
                  stroke={entry.color}
                  strokeWidth={thickness}
                  strokeDasharray={`${dash} ${circumference - dash}`}
                  strokeDashoffset={-offset}
                  transform={`rotate(-90 ${size / 2} ${size / 2})`}
                  strokeLinecap="butt"
                />
              );
              offset += dash;
              return element;
            })}
        </svg>

        {(centreValue || centreLabel) && (
          <div className="pointer-events-none absolute inset-0 grid place-content-center text-center">
            {centreValue && <p className="text-fluid-xl font-extrabold text-ink-900">{centreValue}</p>}
            {centreLabel && <p className="text-[0.72rem] text-ink-500">{centreLabel}</p>}
          </div>
        )}
      </div>

      <ul className="w-full space-y-2">
        {data.map((entry) => (
          <li key={entry.label} className="flex items-center gap-2.5">
            <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="min-w-0 flex-1 truncate text-[0.82rem] text-ink-700">{entry.label}</span>
            <span className="shrink-0 text-[0.82rem] font-semibold text-ink-900">
              {formatCompactPrice(entry.value)}
            </span>
            <span className="w-10 shrink-0 text-right text-[0.74rem] text-ink-400">
              {total > 0 ? `${Math.round((entry.value / total) * 100)}%` : "0%"}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Sparkline                                                           */
/* ------------------------------------------------------------------ */

export function Sparkline({
  values,
  color = "#0c800f",
  className,
}: {
  values: number[];
  color?: string;
  className?: string;
}) {
  if (values.length < 2) return null;

  const width = 120;
  const height = 34;
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;

  const points = values.map((value, index) => {
    const x = (index / (values.length - 1)) * width;
    const y = height - ((value - min) / range) * (height - 4) - 2;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={cn("h-8 w-[7.5rem]", className)}
      preserveAspectRatio="none"
      aria-hidden
    >
      <polyline
        points={points.join(" ")}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
