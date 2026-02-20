import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useApp, useDerivedData } from '@/context/AppContext';
import { isLowStock, timeAgo } from '@/lib/helpers';
import Badge from '@/components/Badge';
import SkeletonCard from '@/components/SkeletonCard';
import UpdateStockModal from '@/components/UpdateStockModal';
import ChatPanel from '@/components/ChatPanel';

export default function DashboardPage() {
  const { state, isLoading } = useApp();
  const derived = useDerivedData();
  const [loading, setLoading] = useState(true);
  const [locationFilter, setLocationFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [editingItem, setEditingItem] = useState<{ productId: string; locationId: string } | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(t);
  }, []);

  const categories = [...new Set(state.products.map((p) => p.category))];

  const filteredInventory = state.inventory.filter((item) => {
    if (locationFilter !== 'all' && item.locationId !== locationFilter) return false;
    const product = state.products.find((p) => p.id === item.productId);
    if (categoryFilter !== 'all' && product?.category !== categoryFilter) return false;
    return true;
  });

  const stats = [
    { label: 'Total SKUs', value: derived.totalSKUs, icon: '▣', color: 'text-primary' },
    { label: 'Total Stock', value: derived.totalStock.toLocaleString(), icon: '◫', color: 'text-foreground' },
    { label: 'Low Stock Alerts', value: derived.lowStockCount, icon: '⚠', color: derived.lowStockCount > 0 ? 'text-destructive' : 'text-success' },
    { label: 'Orders Today', value: derived.todaysOrderCount, icon: '↗', color: 'text-primary' },
  ];

  const uiLoading = loading || isLoading;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-card border border-border rounded-xl p-5 card-hover border-t-2 border-t-primary/30">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-muted-foreground uppercase tracking-wider">{s.label}</span>
              <span className="text-lg">{s.icon}</span>
            </div>
            <div className={`font-mono font-bold text-3xl tabular-nums animate-fade-up ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Inventory Snapshot */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-mono font-bold text-foreground">Inventory Overview</h2>
            <Link to="/inventory" className="text-primary text-sm hover:underline">View All →</Link>
          </div>

          <div className="flex flex-wrap gap-3 mb-4">
            <select value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)} className="px-3 py-2 bg-elevated border border-border rounded-lg text-foreground text-sm focus:border-primary focus:outline-none">
              <option value="all">All Locations</option>
              {state.locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="px-3 py-2 bg-elevated border border-border rounded-lg text-foreground text-sm focus:border-primary focus:outline-none">
              <option value="all">All Categories</option>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {uiLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}</div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredInventory.slice(0, 6).map((item) => {
                  const product = state.products.find((p) => p.id === item.productId);
                  const location = state.locations.find((l) => l.id === item.locationId);
                  if (!product || !location) return null;
                  const low = isLowStock(item.quantity, item.threshold);
                  const pct = Math.min((item.quantity / (item.threshold * 5)) * 100, 100);

                  return (
                    <div key={`${item.productId}-${item.locationId}`} className="relative bg-card border border-border rounded-xl p-5 card-hover">
                      {low && <div className="absolute top-3 right-3"><Badge type="low" pulse>LOW STOCK</Badge></div>}
                      <div className="mb-1 font-semibold text-foreground text-sm">{product.name}</div>
                      <div className="font-mono text-xs text-muted-foreground mb-3">{product.sku}</div>
                      <div className="mb-3"><Badge type={location.type}>{location.name}</Badge></div>
                      <div className={`font-mono font-bold text-2xl tabular-nums mb-2 ${low ? 'text-destructive' : 'text-success'}`}>{item.quantity}</div>
                      <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden mb-3">
                        <div className={`h-full rounded-full transition-all ${low ? 'bg-destructive' : 'bg-primary'}`} style={{ width: `${pct}%` }} />
                      </div>
                      <button onClick={() => setEditingItem({ productId: item.productId, locationId: item.locationId })} className="w-full py-2 border border-border rounded-lg text-sm text-muted-foreground hover:text-foreground hover:border-muted transition-colors">
                        Update Stock
                      </button>
                    </div>
                  );
                })}
              </div>
              {filteredInventory.length > 6 && (
                <Link to="/inventory" className="block text-center text-primary text-sm mt-4 hover:underline">
                  View all {filteredInventory.length} items →
                </Link>
              )}
            </>
          )}
        </div>

        {/* Activity Feed */}
        <div className="w-full lg:w-80 shrink-0">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-mono font-bold text-foreground">Activity Feed</h2>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-xs text-primary font-mono">LIVE</span>
            </div>
          </div>
          <div className="space-y-2 max-h-[600px] overflow-y-auto custom-scrollbar">
            {state.orders.slice(0, 12).map((order, i) => {
              const product = state.products.find((p) => p.id === order.productId);
              const location = state.locations.find((l) => l.id === order.locationId);
              return (
                <div key={order.id} className={`bg-card border border-border rounded-lg p-3 animate-slide-in-top ${i === 0 ? 'border-l-2 border-l-primary' : ''}`} style={{ animationDelay: `${i * 50}ms` }}>
                  <div className="flex items-start justify-between mb-1.5">
                    <span className="text-sm font-semibold text-foreground truncate mr-2">{product?.name}</span>
                    <Badge type={order.type}>{order.type}</Badge>
                  </div>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge type={order.source}>{order.source}</Badge>
                    <span className="font-mono text-sm tabular-nums text-foreground">
                      {order.type === 'sale' ? '↓' : order.type === 'restock' ? '↑' : '↔'} {order.quantity}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground truncate">{location?.name}</span>
                    <span className="text-xs text-muted-foreground font-mono tabular-nums">{timeAgo(order.timestamp)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {editingItem && (
        <UpdateStockModal
          open={!!editingItem}
          onClose={() => setEditingItem(null)}
          productId={editingItem.productId}
          locationId={editingItem.locationId}
        />
      )}

      <ChatPanel />
    </div>
  );
}
