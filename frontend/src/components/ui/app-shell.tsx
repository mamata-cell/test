/**
 * App-shell blocks — the product frame, composed on the shadcn Sidebar
 * primitive (which owns the hard mechanics: collapse modes, the mobile sheet
 * drawer, keyboard shortcut, cookie-persisted state).
 *
 * Compose the app frame from these instead of hand-rolling grids, drawers and
 * brand lockups (every shell bug shipped so far — overlapping wordmarks,
 * drawer close buttons visible on desktop, app-in-a-webpage layouts — came
 * from hand-rolled shell code). Three patterns, matching the design plan's
 * `app_shell.pattern`:
 *
 *   <AppShell pattern="rail-sidebar-main" rail={…} sidebar={…} topbar={…}>
 *   <AppShell pattern="sidebar-main" sidebar={…} topbar={…}>
 *   <AppShell pattern="topbar-main" topbar={…}>
 *
 * `sidebar` content composes the Sidebar* components from `@/ui`
 * (SidebarHeader/Content/Group/Menu/Footer…). The shell already renders the
 * trigger in the topbar; navigation lives IN the shell — never add a second
 * website-style navbar around it. Restyle through tokens (--sidebar-*), not
 * by forking layout mechanics.
 */
import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";
import {
  Sidebar,
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

type ShellPattern = "rail-sidebar-main" | "sidebar-main" | "topbar-main";

export function AppShell({
  pattern = "sidebar-main",
  variant = "sidebar",
  collapse = "offcanvas",
  rail,
  sidebar,
  topbar,
  children,
  className,
}: {
  pattern?: ShellPattern;
  /** Passed to the Sidebar primitive — the plan's `app_shell.variant`. */
  variant?: "sidebar" | "floating" | "inset";
  /** Sidebar collapse mode — the plan's `app_shell.collapse`. */
  collapse?: "offcanvas" | "icon" | "none";
  rail?: ReactNode;
  sidebar?: ReactNode;
  topbar?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  if (pattern === "topbar-main" || !sidebar) {
    return (
      <div className={cn("bg-background text-foreground flex min-h-svh flex-col", className)}>
        {topbar && <ShellTopbar>{topbar}</ShellTopbar>}
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    );
  }

  const withRail = pattern === "rail-sidebar-main" && rail != null;

  return (
    <SidebarProvider
      className={className}
      style={withRail ? ({ "--sidebar-width": "20rem" } as CSSProperties) : undefined}
    >
      <Sidebar variant={variant} collapsible={withRail ? "offcanvas" : collapse}>
        {withRail ? (
          <div className="flex h-full min-h-0">
            <div className="border-sidebar-border flex w-14 shrink-0 flex-col items-center gap-3 overflow-y-auto border-r py-3">
              {rail}
            </div>
            <div className="flex min-w-0 flex-1 flex-col">{sidebar}</div>
          </div>
        ) : (
          sidebar
        )}
      </Sidebar>
      <SidebarInset className="min-w-0">
        {topbar && (
          <ShellTopbar>
            <SidebarTrigger className="-ml-1" />
            {topbar}
          </ShellTopbar>
        )}
        <main className="min-w-0 flex-1">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}

function ShellTopbar({ children }: { children: ReactNode }) {
  return (
    <header className="bg-background/95 sticky top-0 z-30 flex min-h-14 shrink-0 items-center gap-3 border-b px-4 backdrop-blur lg:px-6">
      {children}
    </header>
  );
}

/** Standard content container for screens inside the shell. */
export function AppContent({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mx-auto w-full max-w-[1480px] px-4 py-6 lg:px-8", className)}>
      {children}
    </div>
  );
}

/**
 * Brand lockup — mark + name + optional subtitle, stacked and truncation-safe.
 * (The hand-rolled version of this shipped a wordmark colliding with its
 * subtitle; the stack and min-width discipline here are the fix.)
 */
export function BrandLockup({
  mark,
  name,
  subtitle,
  className,
}: {
  mark?: ReactNode;
  name: string;
  subtitle?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex min-w-0 items-center gap-3 px-3 py-2", className)}>
      {mark && (
        <span className="bg-primary text-primary-foreground grid size-9 shrink-0 place-items-center rounded-lg">
          {mark}
        </span>
      )}
      <span className="grid min-w-0 leading-tight">
        <span className="truncate text-lg font-semibold tracking-tight">{name}</span>
        {subtitle && (
          <span className="text-muted-foreground truncate text-[10px] font-medium tracking-[0.12em] uppercase">
            {subtitle}
          </span>
        )}
      </span>
    </div>
  );
}

/**
 * Auth shell — the sign-in/register frame. Quiet token ground, centered card,
 * ornament from a closed set (default none). Never invent an auth backdrop
 * (orbit rings, floating dots): pass ornament="gradient" or "mark" if the
 * page needs presence, or nothing at all.
 */
export function AuthShell({
  brand,
  ornament = "none",
  children,
  footer,
  className,
}: {
  brand?: ReactNode;
  ornament?: "none" | "gradient" | "mark";
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "bg-background text-foreground relative grid min-h-svh place-items-center overflow-hidden px-4 py-10",
        className,
      )}
    >
      {ornament === "gradient" && (
        <div
          aria-hidden
          className="from-primary/10 pointer-events-none absolute inset-0 bg-gradient-to-b to-transparent"
        />
      )}
      {ornament === "mark" && brand && (
        <div
          aria-hidden
          className="text-primary/5 pointer-events-none absolute -right-16 -bottom-16 [&_svg]:size-64"
        >
          {brand}
        </div>
      )}
      <div className="relative z-10 w-full max-w-md">
        <div className="bg-card text-card-foreground rounded-xl border p-6 shadow-sm sm:p-8">
          {children}
        </div>
        {footer && (
          <div className="text-muted-foreground mt-4 text-center text-xs">{footer}</div>
        )}
      </div>
    </div>
  );
}
