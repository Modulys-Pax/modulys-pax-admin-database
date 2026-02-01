import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Re-export dos utilitários de UX
export * from './utils/error-handler';
export * from './utils/toast';
export * from './utils/currency';
