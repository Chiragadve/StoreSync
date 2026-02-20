function toDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value);
}

export function timeAgo(value: Date | string): string {
  const date = toDate(value);
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function formatDate(value: Date | string): string {
  const date = toDate(value);
  return date.toLocaleString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export function generateId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

export function isLowStock(quantity: number, threshold: number): boolean {
  return quantity <= threshold;
}

export function cn(...classes: (string | false | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}
