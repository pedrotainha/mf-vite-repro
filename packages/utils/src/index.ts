/**
 * @-label-/utils
 * Shared utilities across MFE apps.
 * Will be populated as needed.
 */

export const cn = (...classes: (string | undefined | null | false)[]): string => classes.filter(Boolean).join(' ');
