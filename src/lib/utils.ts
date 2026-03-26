import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, isValid } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Safe date formatter — never throws on invalid/null dates */
export function safeFormat(dateInput: string | Date | undefined | null, fmt: string, fallback = "—"): string {
  if (!dateInput) return fallback;
  try {
    const d = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
    return isValid(d) ? format(d, fmt) : fallback;
  } catch {
    return fallback;
  }
}

/** Safe string for search/filter — never throws on null/undefined */
export function safeStr(val: any): string {
  if (val == null) return "";
  return String(val);
}

/** Safe lowercase — never throws */
export function safeLower(val: any): string {
  if (val == null) return "";
  return String(val).toLowerCase();
}
