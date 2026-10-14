import { Toaster as Sonner, type ToasterProps } from "sonner";

/**
 * Toasts. Mount `<Toaster />` ONCE, near the app root, then call `toast(...)`
 * from anywhere: `import { toast } from "sonner"`.
 */
function Toaster({ ...props }: ToasterProps) {
  return (
    <Sonner
      className="toaster group"
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
        } as React.CSSProperties
      }
      {...props}
    />
  );
}

export { Toaster };
