import { cn } from '@/lib/helpers';

type BadgeType = 'sale' | 'restock' | 'transfer' | 'ai' | 'manual' | 'warehouse' | 'store' | 'online' | 'healthy' | 'low' | 'category';

const styles: Record<BadgeType, string> = {
  sale: 'bg-destructive/15 text-destructive',
  restock: 'bg-success/15 text-success',
  transfer: 'bg-info/15 text-info',
  ai: 'bg-primary/15 text-primary',
  manual: 'bg-muted text-muted-foreground',
  warehouse: 'bg-purple-500/15 text-purple-400',
  store: 'bg-info/15 text-info',
  online: 'bg-success/15 text-success',
  healthy: 'bg-success/15 text-success',
  low: 'bg-destructive/15 text-destructive',
  category: 'bg-muted text-muted-foreground',
};

export default function Badge({ type, children, pulse }: { type: BadgeType; children: React.ReactNode; pulse?: boolean }) {
  return (
    <span className={cn(
      'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold font-mono uppercase tracking-wider',
      styles[type],
      pulse && 'animate-pulse-badge'
    )}>
      {children}
    </span>
  );
}
