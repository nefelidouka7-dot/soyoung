import { formatPrice } from "@/lib/utils";
import { cn } from "@/lib/utils";

export type RevenuePoint = {
  /** Short axis label, e.g. "12 Sep" */
  label: string;
  /** Tooltip heading, e.g. "Fri, 12 Sep" */
  fullLabel: string;
  value: number;
  orders: number;
  previous?: number;
};

const VIEW_W = 1000;
const VIEW_H = 300;

function niceCeil(value: number) {
  if (value <= 0) return 100;
  const exp = 10 ** Math.floor(Math.log10(value));
  const f = value / exp;
  const nice = f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10;
  return nice * exp;
}

function compactEuro(value: number) {
  if (value >= 1000) {
    const k = value / 1000;
    return `€${k % 1 === 0 ? k.toFixed(0) : k.toFixed(1)}k`;
  }
  return `€${Math.round(value)}`;
}

/** Monotone cubic interpolation (Fritsch–Carlson): smooth without overshooting below zero. */
function smoothPath(points: [number, number][]) {
  const n = points.length;
  if (n === 0) return "";
  if (n === 1) return `M${points[0][0]},${points[0][1]}`;

  const slopes: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    const dx = points[i + 1][0] - points[i][0];
    slopes.push(dx === 0 ? 0 : (points[i + 1][1] - points[i][1]) / dx);
  }

  const tangents: number[] = new Array(n);
  tangents[0] = slopes[0];
  tangents[n - 1] = slopes[n - 2];
  for (let i = 1; i < n - 1; i++) {
    tangents[i] =
      slopes[i - 1] * slopes[i] <= 0 ? 0 : (slopes[i - 1] + slopes[i]) / 2;
  }
  for (let i = 0; i < n - 1; i++) {
    if (slopes[i] === 0) {
      tangents[i] = 0;
      tangents[i + 1] = 0;
      continue;
    }
    const a = tangents[i] / slopes[i];
    const b = tangents[i + 1] / slopes[i];
    const s = a * a + b * b;
    if (s > 9) {
      const tau = 3 / Math.sqrt(s);
      tangents[i] = tau * a * slopes[i];
      tangents[i + 1] = tau * b * slopes[i];
    }
  }

  let d = `M${points[0][0]},${points[0][1]}`;
  for (let i = 0; i < n - 1; i++) {
    const [x0, y0] = points[i];
    const [x1, y1] = points[i + 1];
    const dx = (x1 - x0) / 3;
    d += ` C${x0 + dx},${y0 + tangents[i] * dx} ${x1 - dx},${y1 - tangents[i + 1] * dx} ${x1},${y1}`;
  }
  return d;
}

export function RevenueChart({ points }: { points: RevenuePoint[] }) {
  const n = points.length;
  const hasPrevious = points.some((p) => p.previous !== undefined);
  const peak = Math.max(
    ...points.map((p) => Math.max(p.value, p.previous ?? 0)),
    0
  );
  const max = niceCeil(peak * 1.1);
  const ticks = [1, 0.75, 0.5, 0.25, 0].map((f) => max * f);

  const xAt = (i: number) => (n <= 1 ? VIEW_W / 2 : (i / (n - 1)) * VIEW_W);
  const yAt = (v: number) => VIEW_H - (v / max) * VIEW_H;

  const current = points.map((p, i) => [xAt(i), yAt(p.value)] as [number, number]);
  const linePath = smoothPath(current);
  const areaPath = `${linePath} L${VIEW_W},${VIEW_H} L0,${VIEW_H} Z`;
  const prevPath = hasPrevious
    ? smoothPath(points.map((p, i) => [xAt(i), yAt(p.previous ?? 0)]))
    : "";

  const step = n <= 1 ? 100 : 100 / (n - 1);
  const labelEvery = Math.max(1, Math.ceil(n / 7));

  const total = points.reduce((s, p) => s + p.value, 0);
  const best = points.reduce((a, b) => (b.value > a.value ? b : a), points[0]);

  return (
    <div
      className="flex gap-3"
      role="img"
      aria-label={`Revenue chart: ${formatPrice(total)} over ${n} days${
        best && best.value > 0 ? `, best day ${best.fullLabel} with ${formatPrice(best.value)}` : ""
      }.`}
    >
      <div
        className="relative h-64 w-10 shrink-0 text-right text-[11px] tabular-nums text-ink-muted"
        aria-hidden
      >
        {ticks.map((t, i) => (
          <span
            key={i}
            className="absolute right-0 -translate-y-1/2"
            style={{ top: `${(i / (ticks.length - 1)) * 100}%` }}
          >
            {compactEuro(t)}
          </span>
        ))}
      </div>

      <div className="min-w-0 flex-1" aria-hidden>
        <div className="relative h-64">
          {ticks.map((_, i) => (
            <div
              key={i}
              className={cn(
                "absolute inset-x-0 border-t",
                i === ticks.length - 1
                  ? "border-ink/[0.12]"
                  : "border-dashed border-ink/[0.07]"
              )}
              style={{ top: `${(i / (ticks.length - 1)) * 100}%` }}
              aria-hidden
            />
          ))}

          <svg
            viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
            preserveAspectRatio="none"
            className="absolute inset-0 h-full w-full overflow-visible"
            aria-hidden
          >
            <defs>
              <linearGradient id="revenue-fill" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="var(--sage)" stopOpacity="0.28" />
                <stop offset="100%" stopColor="var(--sage)" stopOpacity="0" />
              </linearGradient>
            </defs>
            {prevPath ? (
              <path
                d={prevPath}
                fill="none"
                stroke="rgb(43 41 39 / 0.22)"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                vectorEffect="non-scaling-stroke"
              />
            ) : null}
            <path d={areaPath} fill="url(#revenue-fill)" />
            <path
              d={linePath}
              fill="none"
              stroke="var(--sage-dark)"
              strokeWidth={2.25}
              strokeLinejoin="round"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          </svg>

          {points.map((p, i) => {
            const left = n <= 1 ? 50 : (i / (n - 1)) * 100;
            const top = (1 - p.value / max) * 100;
            const align =
              left < 15 ? "left-0" : left > 85 ? "right-0" : "left-1/2 -translate-x-1/2";
            return (
              <div
                key={i}
                className="group absolute inset-y-0"
                style={{ left: `${left - step / 2}%`, width: `${step}%` }}
              >
                <div className="absolute inset-y-0 left-1/2 w-px bg-ink/15 opacity-0 transition-opacity group-hover:opacity-100" />
                <div
                  className="absolute left-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-sage-dark opacity-0 shadow transition-opacity group-hover:opacity-100"
                  style={{ top: `${top}%` }}
                />
                <div
                  className={cn(
                    "pointer-events-none absolute -top-2 z-10 w-max -translate-y-full rounded-lg bg-ink px-3 py-2 text-xs text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100",
                    align
                  )}
                >
                  <p className="text-[11px] text-white/60">{p.fullLabel}</p>
                  <p className="mt-0.5 font-semibold tabular-nums">
                    {formatPrice(p.value)}
                  </p>
                  <p className="text-[11px] text-white/60">
                    {p.orders} order{p.orders === 1 ? "" : "s"}
                    {p.previous !== undefined
                      ? ` · prev ${formatPrice(p.previous)}`
                      : ""}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="relative mt-2 h-4 text-[11px] text-ink-muted">
          {points.map((p, i) =>
            i % labelEvery === 0 || i === n - 1 ? (
              <span
                key={i}
                className={cn(
                  "absolute whitespace-nowrap",
                  i === 0
                    ? "left-0"
                    : i === n - 1
                      ? "right-0"
                      : "-translate-x-1/2"
                )}
                style={
                  i === 0 || i === n - 1
                    ? undefined
                    : { left: `${(i / (n - 1)) * 100}%` }
                }
              >
                {p.label}
              </span>
            ) : null
          )}
        </div>
      </div>
    </div>
  );
}
