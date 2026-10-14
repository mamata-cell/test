# UI kit reference — every component this app ships

Import EVERYTHING from the barrel: `import { Button, Dialog, ... } from "@/ui"`.
Source lives in this directory and THIS APP OWNS IT — but restyle through the
tokens in `src/index.css`, not by editing components. `theme.css` is plumbing:
never touch it. Class merging: `cn()` from `@/lib/utils` resolves conflicts
left-to-right — `cn("p-4", className)` lets callers override, `cn(className,
"p-4")` forces yours.

## Simple primitives

- **Button** — `<Button variant size>`; variants: `default | secondary |
  destructive | outline | ghost | link`; sizes: `default | xs | sm | lg | icon | icon-xs`.
  `default` is the ONE accent action per view; everything else is `secondary`,
  `outline` or `ghost`. Never dim a default button — muted fill reads as
  disabled.
- **Input / Textarea / Label** — pair every field with a `<Label htmlFor>`.
- **Badge** — `variant: default | secondary | destructive | outline`; statuses
  and counts, never buttons.
- **Separator**, **Skeleton** (loading placeholders — never ship as content),
  **Avatar** (`Avatar > AvatarImage + AvatarFallback` — always give the
  fallback initials).

## Composed components (use ALL the parts — partial composition breaks a11y)

- **Card** — `Card > CardHeader (CardTitle, CardDescription, CardAction) >
  CardContent > CardFooter`.
- **Dialog** — `Dialog > DialogTrigger + DialogContent > (DialogHeader >
  DialogTitle + DialogDescription) … DialogFooter > DialogClose`. Use for
  create/edit/confirm flows instead of hand-rolled overlays; it owns focus
  trap + escape + backdrop. Route-addressable modals render the Dialog open
  over the parent surface.
- **Select** — `Select > SelectTrigger > SelectValue` + `SelectContent >
  SelectGroup > SelectItem` (+ `SelectLabel`, `SelectSeparator`).
- **Tabs** — `Tabs defaultValue > TabsList > TabsTrigger*` + `TabsContent`
  per value.
- **Table** — `Table > TableHeader > TableRow > TableHead*` then `TableBody >
  TableRow > TableCell*` (+ `TableCaption`, `TableFooter`). Prefer it over
  div-grids for any columnar data.
- **Form** — react-hook-form wiring: `Form {...form} > FormField control
  name render={({field}) => <FormItem> <FormLabel/> <FormControl><Input
  {...field}/></FormControl> <FormDescription/> <FormMessage/>}`.
  `FormMessage` is where validation errors render — never a bare red `<p>`.
- **Chart** — Recharts through `ChartContainer config` +
  `ChartTooltip content={<ChartTooltipContent/>}` (+ `ChartLegend`,
  `ChartLegendContent`); colors come from the config/tokens, never
  hard-coded hexes.
- **Toaster** (sonner) — mount ONE `<Toaster/>` in the shell; fire with
  `toast(...)`. Every mutation the user triggers confirms with a toast.

## Shell blocks (compose the app frame from these — never hand-roll it)

- **AppShell** `{pattern, variant?, collapse?, rail?, sidebar?, topbar?, children}` —
  the full-viewport product frame, built on the shadcn Sidebar primitive.
  `pattern: rail-sidebar-main | sidebar-main | topbar-main` (match the design
  plan's `app_shell.pattern`); `variant: sidebar | floating | inset` and
  `collapse: offcanvas | icon` pass through to the primitive. It owns the
  grid, 100svh, `min-width:0` on main, the mobile drawer (sheet, trigger,
  scrim) and desktop collapse. Product routes render INSIDE AppShell, never
  inside the marketing `Layout`. The topbar slot already gets a
  `SidebarTrigger`; navigation lives in the shell — no second navbar.
- **Sidebar family** — compose the `sidebar` slot from `SidebarHeader` /
  `SidebarContent` / `SidebarGroup` (+`SidebarGroupLabel`) / `SidebarMenu` >
  `SidebarMenuItem` > `SidebarMenuButton` (+`SidebarMenuBadge`,
  `SidebarMenuAction`, nested `SidebarMenuSub`) / `SidebarFooter` /
  `SidebarSeparator` / `SidebarInput`. `useSidebar()` for custom toggles.
- **AppContent** — the standard screen container (max-width + padding)
  inside the shell.
- **BrandLockup** `{mark?, name, subtitle?}` — mark + name + subtitle,
  stacked and truncation-safe; use it for the brand block (hand-built
  lockups are how wordmarks collide with their subtitles).
- **AuthShell** `{brand?, ornament?, children, footer?}` — the sign-in frame:
  token ground, centered card; `ornament: none (default) | gradient | mark`.
  Never invent an auth backdrop.
- **Sheet** (side panels/drawers) and **Tooltip** are also in the kit —
  compose them from their parts like Dialog.

## Conversation surfaces (chat, feeds, AI assistants)

- **MessageScroller** — the conversation scroll container; it OWNS the hard
  parts: bottom-anchored turns, streamed replies, saved-thread restore,
  prepended history, jump-to-message, the scroll-to-latest button. Compose
  `MessageScrollerProvider > MessageScroller > MessageScrollerViewport >
  MessageScrollerContent > MessageScrollerItem*` (+ `MessageScrollerButton`;
  `useMessageScroller` for custom controls). NEVER hand-roll a chat scroll
  region — a lone message at the top with dead space above the composer is
  the exact defect this block retires.
- **Message family** — `MessageGroup > Message > MessageAvatar +
  (MessageHeader / MessageContent / MessageFooter)` for conversation rows.
- **Bubble** — `BubbleGroup > Bubble > BubbleContent (+ BubbleReactions)`
  for chat-bubble surfaces.
- **Attachment** — `AttachmentGroup > Attachment > AttachmentMedia +
  AttachmentContent (Title/Description) + AttachmentActions` for files and
  images in a thread, upload state included.
- **Marker** — `Marker > MarkerIcon + MarkerContent` for status rows,
  system notes and streaming/tool-activity indicators (pairs with the
  `shimmer` utility for live status text).
- Utilities: `scroll-fade-b`/`scroll-fade-x` (edge fades on scroll
  containers) and `shimmer` (live-status text) ship in the kit's CSS.

## Screen scaffolds (start every product screen from one of these)

- **ListPage** `{title, description?, actions?, toolbar?, loading, empty,
  emptyProps, pagination?, children}` — list/table screens with the
  three-states rule built in: `loading` renders skeletons, `empty` renders
  the EmptyState from `emptyProps`, otherwise children (usually a `Table`).
- **DetailPage** `{title, backTo?, actions?, aside?, children}` — back link +
  header + responsive main/aside two-column (aside stacks below lg). A
  product detail page is this with a gallery in children and a buy/meta box
  in aside.
- **SettingsPage** + **SettingsSection** `{title, description?, children}` —
  the sectioned settings shape; put `Form` fields in each section's slot.
- **StatsRow** `{items: [{label, value, delta?, tone?}]}` — the stat-tile
  row (tabular numerals, responsive 2/4 columns) every dashboard opens with.

## App-specific pieces

- **PageHeader** `{title, subtitle?, actions?}` — the standard screen
  header (18–28px title). Use it instead of hand-rolled `<h1>` blocks.
- **EmptyState** `{icon?, title, description?, action?}` — every list/stream
  screen's zero state, with a directive action. Also the correct body for a
  not-found route.
- **Spinner** — inline loading; pair with Skeleton for layout-shaped loads.
- **GoogleButton** — the ONLY way to render Google sign-in (wired to the
  proxy route). Never hand-write that button.
