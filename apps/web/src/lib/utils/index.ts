/**
 * Combina nomes de classes CSS, filtrando valores falsy.
 * Alternativa leve ao clsx/classnames.
 */
export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(" ");
}
