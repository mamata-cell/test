import * as React from "react";
import { Loader2Icon } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * App-level compositions (not shadcn primitives). Kept because pages need them
 * constantly and hand-rolling a page header in every route is exactly how an app
 * ends up with six different heading treatments.
 */

function PageHeader({
  title,
  subtitle,
  actions,
  className,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div data-lg-key="154cc9862c"
      data-slot="page-header"
      className={cn("flex flex-wrap items-start justify-between gap-4 pb-6", className)}
    >
      <div data-lg-key="d4c66cb2a2" className="grid gap-1">
        <h1 data-lg-key="c68ad7a351" className="text-2xl font-semibold tracking-tight">{title}</h1>
        {subtitle && <p data-lg-key="75058c5537" className="text-muted-foreground text-sm">{subtitle}</p>}
      </div>
      {actions && <div data-lg-key="554e3a7835" className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div data-lg-key="e570bad9ee"
      data-slot="empty-state"
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed px-6 py-14 text-center",
        className,
      )}
    >
      {icon && <div data-lg-key="c55d3c904e" className="text-muted-foreground [&_svg]:size-8">{icon}</div>}
      <h3 data-lg-key="7edeb26fd9" className="font-semibold">{title}</h3>
      {description && (
        <p data-lg-key="0b09f33300" className="text-muted-foreground max-w-sm text-sm">{description}</p>
      )}
      {action && <div data-lg-key="1bfc6690e8" className="pt-1">{action}</div>}
    </div>
  );
}

function Spinner({ className }: { className?: string }) {
  return (
    <Loader2Icon
      role="status"
      aria-label="Loading"
      className={cn("text-muted-foreground size-4 animate-spin", className)}
    />
  );
}

export { PageHeader, EmptyState, Spinner };
