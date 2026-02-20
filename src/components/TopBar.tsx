import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/inventory': 'Inventory',
  '/orders': 'Orders',
  '/products': 'Products',
  '/locations': 'Locations',
  '/settings': 'Settings',
};

export default function TopBar() {
  const location = useLocation();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const title = pageTitles[location.pathname] || 'StoreSync';

  return (
    <header className="h-16 border-b border-border bg-background flex items-center justify-between px-6 md:pl-6">
      <h1 className="font-mono font-bold text-foreground text-lg md:ml-0 ml-10">{title}</h1>
      <div className="flex items-center gap-5">
        <span className="font-mono text-sm text-muted-foreground tabular-nums hidden sm:block">
          {time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
        </span>
        <button className="relative text-muted-foreground hover:text-foreground transition-colors">
          🔔
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full" />
        </button>
        <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-primary font-mono font-bold text-xs">AM</div>
      </div>
    </header>
  );
}
