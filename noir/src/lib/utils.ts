export function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function formatPrice(price: number): string {
  return `$${price.toFixed(2)}`;
}

export function lerp(start: number, end: number, factor: number): number {
  return start + (end - start) * factor;
}
