import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Conditional class merger. */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
