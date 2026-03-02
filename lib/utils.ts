import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatText(text: string): string {
  if (!text) return text;
  return text.trim().toUpperCase();
}
