/**
 * Joins class names, dropping falsy entries.
 *
 * Deliberately dependency-free — the app does not use clsx/tailwind-merge, and
 * conditional `&&` class lists are the pattern already used throughout.
 */
export const cn = (...classes: Array<string | false | null | undefined>): string =>
  classes.filter(Boolean).join(' ');
