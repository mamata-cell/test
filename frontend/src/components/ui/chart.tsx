import * as React from "react";
import * as RechartsPrimitive from "recharts";

import { cn } from "@/lib/utils";

/**
 * Recharts wrapper that themes every series off the app's CSS variables.
 *
 * Give each series a key in `config` with a `color`, and reference it in the
 * Recharts child as `fill="var(--color-<key>)"`. Default the colors to
 * `var(--chart-1..5)` (defined in index.css) so a dashboard inherits the app's
 * palette instead of Recharts' stock blues.
 *
 *   const config = { revenue: { label: "Revenue", color: "var(--chart-1)" } }
 *   <ChartContainer config={config}>
 *     <BarChart data={data}>
 *       <Bar dataKey="revenue" fill="var(--color-revenue)" radius={4} />
 *       <ChartTooltip content={<ChartTooltipContent />} />
 *     </BarChart>
 *   </ChartContainer>
 */
export type ChartConfig = Record<
  string,
  { label?: React.ReactNode; icon?: React.ComponentType } & { color?: string }
>;

type ChartContextProps = { config: ChartConfig };

const ChartContext = React.createContext<ChartContextProps | null>(null);

function useChart() {
  const context = React.useContext(ChartContext);
  if (!context) {
    throw new Error("useChart must be used within a <ChartContainer />");
  }
  return context;
}

function ChartContainer({
  id,
  className,
  children,
  config,
  ...props
}: React.ComponentProps<"div"> & {
  config: ChartConfig;
  children: React.ComponentProps<typeof RechartsPrimitive.ResponsiveContainer>["children"];
}) {
  const uniqueId = React.useId();
  const chartId = `chart-${id || uniqueId.replace(/:/g, "")}`;

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-slot="chart"
        data-chart={chartId}
        className={cn(
          "[&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border/50 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-border [&_.recharts-polar-grid_[stroke='#ccc']]:stroke-border [&_.recharts-radial-bar-background-sector]:fill-muted [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-muted [&_.recharts-reference-line_[stroke='#ccc']]:stroke-border flex aspect-video justify-center text-xs [&_.recharts-dot[stroke='#fff']]:stroke-transparent [&_.recharts-sector]:outline-hidden [&_.recharts-sector[stroke='#fff']]:stroke-transparent [&_.recharts-surface]:outline-hidden",
          className,
        )}
        {...props}
      >
        <ChartStyle id={chartId} config={config} />
        <RechartsPrimitive.ResponsiveContainer>{children}</RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  );
}

/** Emits `--color-<key>` custom properties scoped to this chart instance. */
function ChartStyle({ id, config }: { id: string; config: ChartConfig }) {
  const colorConfig = Object.entries(config).filter(([, item]) => item.color);
  if (!colorConfig.length) return null;

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `[data-chart=${id}] {\n${colorConfig
          .map(([key, item]) => `  --color-${key}: ${item.color};`)
          .join("\n")}\n}`,
      }}
    />
  );
}

const ChartTooltip = RechartsPrimitive.Tooltip;

function ChartTooltipContent({
  active,
  payload,
  className,
  label,
  hideLabel = false,
  hideIndicator = false,
}: {
  active?: boolean;
  payload?: Array<Record<string, unknown>>;
  className?: string;
  label?: React.ReactNode;
  hideLabel?: boolean;
  hideIndicator?: boolean;
}) {
  const { config } = useChart();

  if (!active || !payload?.length) return null;

  return (
    <div
      className={cn(
        "border-border/50 bg-background grid min-w-[8rem] items-start gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs shadow-xl",
        className,
      )}
    >
      {!hideLabel && label ? <div className="font-medium">{label}</div> : null}
      <div className="grid gap-1.5">
        {payload.map((item, index) => {
          const key = String(item.dataKey ?? item.name ?? index);
          const itemConfig = config[key];
          return (
            <div key={key} className="flex w-full items-center gap-2">
              {!hideIndicator && (
                <div
                  className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
                  style={{ backgroundColor: `var(--color-${key})` }}
                />
              )}
              <div className="flex flex-1 justify-between leading-none">
                <span className="text-muted-foreground">{itemConfig?.label ?? key}</span>
                <span className="text-foreground font-mono font-medium tabular-nums">
                  {String(item.value ?? "")}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const ChartLegend = RechartsPrimitive.Legend;

function ChartLegendContent({
  className,
  payload,
}: {
  className?: string;
  payload?: Array<Record<string, unknown>>;
}) {
  const { config } = useChart();
  if (!payload?.length) return null;

  return (
    <div className={cn("flex items-center justify-center gap-4 pt-3", className)}>
      {payload.map((item, index) => {
        const key = String(item.dataKey ?? item.value ?? index);
        return (
          <div key={key} className="flex items-center gap-1.5">
            <div
              className="h-2 w-2 shrink-0 rounded-[2px]"
              style={{ backgroundColor: `var(--color-${key})` }}
            />
            {config[key]?.label ?? key}
          </div>
        );
      })}
    </div>
  );
}

export {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  ChartStyle,
};
