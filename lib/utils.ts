import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Replace port 9000 with 9002 for development environment URLs
 * This is used for MinIO URLs that need to be accessed from the frontend
 */
export function replaceMinioPort(url: string): string {
  if (!url) return url;
  return url.replace(":9000", ":9002");
}
