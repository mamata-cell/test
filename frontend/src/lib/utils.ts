import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge class names, letting later Tailwind utilities win over earlier ones.
 *
 * `clsx` handles conditionals/arrays; `twMerge` resolves CONFLICTS — without it
 * `cn("p-2", "p-4")` would emit both and the winner would depend on stylesheet
 * order rather than call order. Every shipped component funnels its `className`
 * prop through this, which is what makes `<Button className="w-full" />` work.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
