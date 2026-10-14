/* ──────────────────────────────────────────────────────────────────────────────
   The app's UI kit — ONE import site for every primitive.

     import { Button, Input, Dialog, DialogContent, Card, GoogleButton } from "@/ui";

   Everything below `GoogleButton` is re-exported from `@/components/ui/*`, which
   is shadcn/ui source THIS APP OWNS — edit those files freely to change how a
   primitive looks or behaves. To restyle the whole app at once, edit the design
   tokens in `src/index.css` instead; every component reads them.

   Do NOT hand-roll raw <button>/<input>/<dialog> markup in pages. That is what
   produces an app with no consistent design language.
   ────────────────────────────────────────────────────────────────────────────── */

type GoogleButtonProps = {
  label?: string;
  href?: string;
  className?: string;
};

export function GoogleButton({
  label = "Sign in with Google",
  href = "/api/auth/google/login",
  className = "",
}: GoogleButtonProps) {
  return (
    // Sign-in must reach a TOP-LEVEL context: framed in the builder's embedded preview
    // the app runs cross-site, where the OAuth session cookie is third-party (blocked)
    // and Google's consent screen refuses to load (X-Frame-Options: DENY) — so there
    // the anchor's _blank target breaks out and keeps the builder session open behind it.
    //
    // Standalone (the app open in its own tab) neither applies: the click below keeps
    // the flow in THIS tab, because spawning a second tab from a tab the user already
    // owns is pointless. That _blank target stays as the no-JS fallback, so the worst
    // case is the old behaviour rather than a dead button.
    <a
      className={`btn-google ${className}`.trim()}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => {
        // Never hijack a click that ASKED for a new tab/window (cmd/ctrl/shift/alt, or a
        // non-primary button) — those keep the anchor's own _blank behaviour.
        const plainClick =
          e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey;

        if (plainClick && window.top === window.self) {
          e.preventDefault();
          window.location.href = href;
        }
      }}
    >
      <svg className="btn-google-mark" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          fill="#4285F4"
        />
        <path
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          fill="#34A853"
        />
        <path
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
          fill="#FBBC05"
        />
        <path
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          fill="#EA4335"
        />
      </svg>
      <span>{label}</span>
    </a>
  );
}

/* ── shadcn/ui primitives (source in src/components/ui/) ─────────────────────── */

export { PageHeader, EmptyState, Spinner } from "@/components/ui/layout";
export { Button, buttonVariants } from "@/components/ui/button";
export { Input } from "@/components/ui/input";
export { Textarea } from "@/components/ui/textarea";
export { Label } from "@/components/ui/label";
export { Badge, badgeVariants } from "@/components/ui/badge";
export { Separator } from "@/components/ui/separator";
export { Skeleton } from "@/components/ui/skeleton";
export { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
} from "@/components/ui/card";

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  useFormField,
} from "@/components/ui/form";

export {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
export { Toaster } from "@/components/ui/sonner";

export {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  ChartStyle,
  type ChartConfig,
} from "@/components/ui/chart";

export { AppShell, AppContent, BrandLockup, AuthShell } from "@/components/ui/app-shell";
export {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarInset,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
export {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
export { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export {
  MessageScrollerProvider,
  MessageScroller,
  MessageScrollerViewport,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerButton,
  useMessageScroller,
  useMessageScrollerScrollable,
  useMessageScrollerVisibility,
} from "@/components/ui/message-scroller";
export {
  MessageGroup,
  Message,
  MessageAvatar,
  MessageContent,
  MessageFooter,
  MessageHeader,
} from "@/components/ui/message";
export {
  BubbleGroup,
  Bubble,
  BubbleContent,
  BubbleReactions,
} from "@/components/ui/bubble";
export {
  Attachment,
  AttachmentGroup,
  AttachmentMedia,
  AttachmentContent,
  AttachmentTitle,
  AttachmentDescription,
  AttachmentActions,
  AttachmentAction,
  AttachmentTrigger,
} from "@/components/ui/attachment";
export {
  Marker,
  MarkerIcon,
  MarkerContent,
  markerVariants,
} from "@/components/ui/marker";
export {
  ListPage,
  DetailPage,
  SettingsPage,
  SettingsSection,
  StatsRow,
} from "@/components/ui/page-blocks";
