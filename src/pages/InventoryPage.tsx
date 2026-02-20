import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { isLowStock, timeAgo } from '@/lib/helpers';
import Badge from '@/components/Badge';
import EmptyState from '@/components/EmptyState';
import UpdateStockModal from '@/components/UpdateStockModal';
import Modal from '@/components/Modal';

export default function InventoryPage() {
  const { state, isLoading } = useApp();
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [locationFilter, setLocationFilter] = useState(searchParams.get('location') || 'all');
  const [productFilter, setProductFilter] = useState(searchParams.get('product') || 'all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [editItem, setEditItem] = useState<{ productId: string; locationId: string } | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const perPage = 10;

  const categories = [...new Set(state.products.map((p) => p.category))];

  const filtered = useMemo(() => {
    return state.inventory.filter((item) => {
      const product = state.products.find((p) => p.id === item.productId);
      if (!product) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!product.name.toLowerCase().includes(q) && !product.sku.toLowerCase().includes(q)) return false;
      }
      if (productFilter !== 'all' && item.productId !== productFilter) return false;
      if (locationFilter !== 'all' && item.locationId !== locationFilter) return false;
      if (categoryFilter !== 'all' && product.category !== categoryFilter) return false;
      if (stockFilter === 'low' && !isLowStock(item.quantity, item.threshold)) return false;
      if (stockFilter === 'healthy' && isLowStock(item.quantity, item.threshold)) return false;
      return true;
    });
  }, [state.inventory, state.products, search, productFilter, locationFilter, categoryFilter, stockFilter]);

  const totalPages = Math.ceil(filtered.length / perPage);
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  if (isLoading && state.inventory.length === 0) {
    return (
      <div className="bg-card border border-border rounded-xl p-6 text-sm text-muted-foreground">
        Loading inventory...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-mono font-bold text-xl text-foreground">Inventory</h2>
        <button onClick={() => setAddOpen(true)} className="px-4 py-2 bg-primary text-primary-foreground font-semibold rounded-lg hover:opacity-90 transition-opacity text-sm">
          Add Stock Entry
        </button>
      </div>

      {/* Filters */}
      <div className="bg-card border border-border rounded-xl p-4 flex flex-wrap gap-3 items-center">
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search product or SKU..."
          className="flex-1 min-w-[200px] px-3 py-2 bg-elevated border border-border rounded-lg text-foreground text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none"
        />
        <select value={locationFilter} onChange={(e) => { setLocationFilter(e.target.value); setPage(1); }} className="px-3 py-2 bg-elevated border border-border rounded-lg text-foreground text-sm focus:border-primary focus:outline-none">
          <option value="all">All Locations</option>
          {state.locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
        </select>
        <select value={productFilter} onChange={(e) => { setProductFilter(e.target.value); setPage(1); }} className="px-3 py-2 bg-elevated border border-border rounded-lg text-foreground text-sm focus:border-primary focus:outline-none">
          <option value="all">All Products</option>
          {state.products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <select value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }} className="px-3 py-2 bg-elevated border border-border rounded-lg text-foreground text-sm focus:border-primary focus:outline-none">
          <option value="all">All Categories</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={stockFilter} onChange={(e) => { setStockFilter(e.target.value); setPage(1); }} className="px-3 py-2 bg-elevated border border-border rounded-lg text-foreground text-sm focus:border-primary focus:outline-none">
          <option value="all">All Stock</option>
          <option value="low">Low Stock Only</option>
          <option value="healthy">Healthy Only</option>
        </select>
        <span className="text-xs text-muted-foreground">Showing {filtered.length} of {state.inventory.length} items</span>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <EmptyState icon="◇" title="No inventory items found" subtitle="Try adjusting your filters" />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                {['Product', 'SKU', 'Category', 'Location', 'Qty', 'Threshold', 'Status', 'Updated', 'Actions'].map((h) => (
                  <th key={h} className="text-left py-3 px-3 text-xs text-muted-foreground uppercase tracking-wider font-mono">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paged.map((item) => {
                const product = state.products.find((p) => p.id === item.productId);
                const location = state.locations.find((l) => l.id === item.locationId);
                if (!product || !location) return null;
                const low = isLowStock(item.quantity, item.threshold);
                return (
                  <tr key={`${item.productId}-${item.locationId}`} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                    <td className="py-3 px-3 text-sm text-foreground font-medium">{product.name}</td>
                    <td className="py-3 px-3 font-mono text-xs text-muted-foreground">{product.sku}</td>
                    <td className="py-3 px-3"><Badge type="category">{product.category}</Badge></td>
                    <td className="py-3 px-3"><Badge type={location.type}>{location.name}</Badge></td>
                    <td className={`py-3 px-3 font-mono font-bold tabular-nums ${low ? 'text-destructive' : 'text-success'}`}>{item.quantity}</td>
                    <td className="py-3 px-3 font-mono text-sm text-muted-foreground tabular-nums">{item.threshold}</td>
                    <td className="py-3 px-3">{low ? <Badge type="low" pulse>LOW STOCK</Badge> : <Badge type="healthy">HEALTHY</Badge>}</td>
                    <td className="py-3 px-3 text-xs text-muted-foreground font-mono">{timeAgo(item.lastUpdated)}</td>
                    <td className="py-3 px-3">
                      <button
                        onClick={() => setEditItem({ productId: item.productId, locationId: item.locationId })}
                        className="text-xs px-2.5 py-1.5 bg-primary text-primary-foreground font-semibold rounded-md hover:opacity-90 transition-opacity"
                      >
                        Restock
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="px-3 py-1.5 border border-border rounded-lg text-sm text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors">Prev</button>
          {Array.from({ length: totalPages }).map((_, i) => (
            <button key={i} onClick={() => setPage(i + 1)} className={`px-3 py-1.5 rounded-lg text-sm font-mono ${page === i + 1 ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}>{i + 1}</button>
          ))}
          <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages} className="px-3 py-1.5 border border-border rounded-lg text-sm text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors">Next</button>
        </div>
      )}

      {editItem && <UpdateStockModal open={!!editItem} onClose={() => setEditItem(null)} productId={editItem.productId} locationId={editItem.locationId} />}
      <AddInventoryModal open={addOpen} onClose={() => setAddOpen(false)} />
    </div>
  );
}

function AddInventoryModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { state, dispatch, addToast } = useApp();
  const [productId, setProductId] = useState('');
  const [locationId, setLocationId] = useState('');
  const [qty, setQty] = useState('');
  const [errors, setErrors] = useState<string[]>([]);

  const handleSubmit = () => {
    const errs: string[] = [];
    if (!productId) errs.push('productId');
    if (!locationId) errs.push('locationId');
    if (!qty || parseInt(qty) <= 0) errs.push('qty');
    setErrors(errs);
    if (errs.length) return;

    const exists = state.inventory.find((i) => i.productId === productId && i.locationId === locationId);
    if (exists) { addToast('error', 'This product+location combo already exists'); return; }

    const productThreshold =
      state.products.find((product) => product.id === productId)?.threshold ?? 20;

    dispatch({
      type: 'ADD_INVENTORY',
      item: {
        productId,
        locationId,
        quantity: parseInt(qty, 10),
        threshold: productThreshold,
        lastUpdated: new Date().toISOString(),
      },
    });
    addToast('success', 'Stock entry added');
    onClose();
    setProductId(''); setLocationId(''); setQty(''); setErrors([]);
  };

  return (
    <Modal open={open} onClose={onClose} title="Add Stock Entry">
      <div className="space-y-3">
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Product</label>
          <select value={productId} onChange={(e) => setProductId(e.target.value)} className={`w-full px-3 py-2 bg-elevated border rounded-lg text-foreground text-sm focus:border-primary focus:outline-none ${errors.includes('productId') ? 'border-destructive' : 'border-border'}`}>
            <option value="">Select product</option>
            {state.products.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Location</label>
          <select value={locationId} onChange={(e) => setLocationId(e.target.value)} className={`w-full px-3 py-2 bg-elevated border rounded-lg text-foreground text-sm focus:border-primary focus:outline-none ${errors.includes('locationId') ? 'border-destructive' : 'border-border'}`}>
            <option value="">Select location</option>
            {state.locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Quantity</label>
          <input type="number" min="1" value={qty} onChange={(e) => setQty(e.target.value)} className={`w-full px-3 py-2 bg-elevated border rounded-lg text-foreground text-sm font-mono focus:border-primary focus:outline-none ${errors.includes('qty') ? 'border-destructive' : 'border-border'}`} placeholder="0" />
        </div>
        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 border border-border rounded-lg text-muted-foreground hover:text-foreground transition-colors">Cancel</button>
          <button onClick={handleSubmit} className="flex-1 px-4 py-2.5 bg-primary text-primary-foreground font-semibold rounded-lg hover:opacity-90 transition-opacity">Add Entry</button>
        </div>
      </div>
    </Modal>
  );
}
