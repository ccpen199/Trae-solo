import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return `¥${amount.toFixed(2)}`;
}

export function getInitials(name: string): string {
  return name.charAt(0).toUpperCase();
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}
