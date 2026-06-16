import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getInitials(name?: string) {
  if (!name) return "AD";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function splitName(name?: string) {
  const parts = (name || "").trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] || "",
    lastName: parts.slice(1).join(" "),
  };
}

export function pageItems<T>(items: T[], page: number, perPage: number) {
  const start = (page - 1) * perPage;
  return items.slice(start, start + perPage);
}

export function formatCount(value: number | undefined) {
  return new Intl.NumberFormat("en-US").format(value || 0);
}
