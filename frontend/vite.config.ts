import { fileURLToPath, URL } from "node:url";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// PREVIEW front door: the Vite dev server is the port Logen routes to. It serves
// React with HMR and proxies /api to the Go backend, which listens only on
// loopback. One container, two processes.
//
// PUBLISHED is different: the boot script runs `npm run build` and hands the front
// door to Caddy (docker/Caddyfile.spa), which serves the build output and proxies
// /api itself. Nothing in this file runs in published mode — do not put production
// concerns here.
const FRONTEND_PORT = Number(process.env.FRONTEND_PORT || 4000);
const API_PORT = process.env.API_PORT || "8080";

// The Logen preview embeds this app in an iframe. Vite is the front door, so IT
// must send a CSP that allows framing (mirrors the Phoenix IframeCsp plug).
// DO NOT REMOVE — without it the in-product preview renders blank.
//
// It also sets the preview's CACHE FLOOR. This middleware registers ahead of Vite's
// own, so anything Vite has an opinion about overwrites it — `no-cache` on transformed
// source, `immutable` on the content-hashed deps under /node_modules/.vite/deps — and
// that is exactly what we want. What Vite leaves BLANK is CSS-as-a-module and
// everything under public/ (images, fonts, media). A response that states no freshness
// gets cached anyway: heuristically by the browser, and for 4h by Cloudflare's Browser
// Cache TTL. That is what made a deployed design/image change keep serving the OLD
// asset while the .tsx logic updated normally. `private` keeps it out of shared caches;
// `no-cache` still permits a cheap ETag 304 instead of a re-download.
function logenIframeCsp(): Plugin {
  const csp = "base-uri 'self'; frame-ancestors *;";
  const cacheControl = "private, no-cache";
  return {
    name: "logen-iframe-csp",
    configureServer(server) {
      server.middlewares.use((_req, res, next) => {
        res.setHeader("Content-Security-Policy", csp);
        res.setHeader("Cache-Control", cacheControl);
        next();
      });
    },
    configurePreviewServer(server) {
      server.middlewares.use((_req, res, next) => {
        res.setHeader("Content-Security-Policy", csp);
        res.setHeader("Cache-Control", cacheControl);
        next();
      });
    },
  };
}

// Takes the preview key back OUT of a published bundle.
//
// `data-lg-key` is minted into the app's SOURCE — that is what makes a reference survive the
// agent restructuring the file around it (docs/preview-element-identity.md). But source is what
// ships, so without this every visitor to the published app would receive Logen's editing
// metadata in their DOM. Minting and stripping are two halves of one contract; neither is
// correct alone.
//
// A Babel visitor, not a regex, for the same reason minting uses Babel: `data-lg-key` has a
// known shape, but a textual strip cannot tell a real attribute from a string literal that
// happens to contain one.
//
// Structurally typed on purpose — see the note on logenIframeCsp: no `@babel/types` import, so
// this keeps compiling if the agent removes an unused import.
type LgAttr = { type: string; name?: { name?: string } };
type LgJSXPath = { node: { attributes: LgAttr[] } };

function logenStripLgKeys() {
  return {
    name: "logen-strip-lg-keys",
    visitor: {
      JSXOpeningElement(path: LgJSXPath) {
        // Gated HERE rather than at the call site so the whole plugin stays a
        // self-contained block the guard can re-insert verbatim. Vite sets
        // NODE_ENV=production for `vite build` and development for the dev server,
        // and dev MUST keep the keys — the preview resolves a click through them.
        if (process.env.NODE_ENV !== "production") return;
        path.node.attributes = path.node.attributes.filter(
          (a) => !(a.type === "JSXAttribute" && a.name && a.name.name === "data-lg-key"),
        );
      },
    },
  };
}

// Loads the Logen preview inspector — the in-page half of click-an-element-to-edit.
//
// `apply: "serve"` is load-bearing: the dev server IS the preview, and a published build must
// never carry this. The script itself is inert on arrival (it does nothing until the parent
// completes a postMessage handshake), so the worst case of a stray injection is one wasted
// request, but the right place to enforce "preview only" is here.
//
// LOGEN_BASE_URL is the brain's public origin, already injected into every container by
// ProjectEnv. Absent it (a container started outside Logen), inject nothing.
// DO NOT REMOVE — without it the preview cannot map a click back to source.
function logenPreviewInspector(): Plugin {
  const base = (process.env.LOGEN_BASE_URL || "").replace(/\/+$/, "");
  return {
    name: "logen-preview-inspector",
    apply: "serve",
    transformIndexHtml() {
      if (!base) return [];
      return [
        {
          tag: "script",
          attrs: { src: base + "/preview/inspector.js", defer: true },
          injectTo: "head" as const,
        },
      ];
    },
  };
}

export default defineConfig({
  // tailwindcss() is Tailwind v4's Vite plugin — it replaces the v3
  // postcss.config.js + tailwind.config.js pair. Theme lives in src/index.css
  // under `@theme`, which is also where the shadcn token contract is defined.
  plugins: [
    react({ babel: { plugins: [logenStripLgKeys()] } }),
    tailwindcss(),
    logenIframeCsp(),
    logenPreviewInspector(),
  ],
  resolve: {
    // `@/` -> src/. shadcn components are authored against this alias; keep it in
    // sync with the `paths` entry in tsconfig.json or `tsc --noEmit` will fail.
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  server: {
    host: true, // 0.0.0.0 — reachable from outside the container
    port: FRONTEND_PORT,
    strictPort: true,
    // Behind Logen's reverse proxy the Host header is the preview domain, not
    // localhost — accept it. (Tighten to the preview host in real integration.)
    allowedHosts: true,
    proxy: {
      "/api": {
        target: `http://127.0.0.1:${API_PORT}`,
        changeOrigin: true,
        // Forward X-Forwarded-* so the Go API can learn the public origin
        // (needed to build the OAuth callback URL — see http.go/publicOrigin).
        xfwd: true,
      },
    },
    // HMR over websocket. Hitting the container directly, it works on the same
    // port. Behind a reverse proxy on :443 the browser must open the WS to the
    // PUBLIC origin, so clientPort/protocol get injected by the platform.
    hmr: process.env.HMR_CLIENT_PORT
      ? {
          clientPort: Number(process.env.HMR_CLIENT_PORT),
          protocol: process.env.HMR_PROTOCOL || "wss",
        }
      : true,
  },
});
