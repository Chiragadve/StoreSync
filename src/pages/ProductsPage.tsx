import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { isLowStock, generateId } from '@/lib/helpers';
import Badge from '@/components/Badge';
import EmptyState from '@/components/EmptyState';
import Modal from '@/components/Modal';
import ConfirmDialog from '@/components/ConfirmDialog';

export default function ProductsPage() {
  const { state, dispatch, addToast, isLoading } = useApp();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [view, setView] = useState<'grid' | 'table'>('grid');
  const [addOpen, setAddOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<string | null>(null);
  const [deleteProduct, setDeleteProduct] = useState<string | null>(null);

  const categories = [...new Set(state.products.map((p) => p.category))];

  const filtered = useMemo(() => {
    return state.products.filter((p) => {
      if (search) {
        const q = search.toLowerCase();
        if (!p.name.toLowerCase().includes(q) && !p.sku.toLowerCase().includes(q)) return false;
      }
      if (categoryFilter !== 'all' && p.category !== categoryFilter) return false;
      return true;
    });
  }, [state.products, search, categoryFilter]);

  const getProductStats = (productId: string) => {
    const items = state.inventory.filter((i) => i.productId === productId);
    const totalStock = items.reduce((s, i) => s + i.quantity, 0);
    const locations = items.length;
    const hasLowStock = items.some((i) => isLowStock(i.quantity, i.threshold));
    return { totalStock, locations, hasLowStock };
  };

  if (isLoading && state.products.length === 0) {
    return (
      <div className="bg-card border border-border rounded-xl p-6 text-sm text-muted-foreground">
        Loading products...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-mono font-bold text-xl text-foreground">Products</h2>
        <button onClick={() => setAddOpen(true)} className="px-4 py-2 bg-primary text-primary-foreground font-semibold rounded-lg hover:opacity-90 transition-opacity text-sm">Add Product</button>
      </div>

      <div className="bg-card border border-border rounded-xl p-4 flex flex-wrap gap-3 items-center">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or SKU..." className="flex-1 min-w-[200px] px-3 py-2 bg-elevated border border-border rounded-lg text-foreground text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none" />
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="px-3 py-2 bg-elevated border border-border rounded-lg text-foreground text-sm focus:border-primary focus:outline-none">
          <option value="all">All Categories</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <div className="flex border border-border rounded-lg overflow-hidden">
          <button onClick={() => setView('grid')} className={`px-3 py-2 text-sm transition-colors ${view === 'grid' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}>Grid</button>
          <button onClick={() => setView('table')} className={`px-3 py-2 text-sm transition-colors ${view === 'table' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}>Table</button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon="▣" title="No products found" subtitle="Try adjusting your filters or add a new product" action={{ label: 'Add Product', onClick: () => setAddOpen(true) }} />
      ) : view === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {filtered.map((product) => {
            const stats = getProductStats(product.id);
            return (
              <div key={product.id} className="bg-card border border-border rounded-xl p-5 card-hover">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-foreground text-sm">{product.name}</h3>
                  {stats.hasLowStock && <Badge type="low" pulse>LOW</Badge>}
                </div>
                <div className="font-mono text-xs text-muted-foreground mb-3">{product.sku}</div>
                <Badge type="category">{product.category}</Badge>
                <div className="mt-4 space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Stock</span>
                    <span className="font-mono font-bold text-foreground tabular-nums">{stats.totalStock}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Threshold</span>
                    <span className="font-mono text-foreground tabular-nums">{product.threshold}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Locations</span>
                    <span className="text-foreground">{stats.locations}</span>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <button onClick={() => navigate(`/inventory?product=${product.id}`)} className="flex-1 py-2 border border-border rounded-lg text-xs text-muted-foreground hover:text-foreground transition-colors">View Stock</button>
                  <button onClick={() => setEditProduct(product.id)} className="py-2 px-2.5 border border-border rounded-lg text-xs text-muted-foreground hover:text-foreground transition-colors">✎</button>
                  <button onClick={() => setDeleteProduct(product.id)} className="py-2 px-2.5 border border-border rounded-lg text-xs text-destructive hover:bg-destructive/10 transition-colors">✕</button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                {['Product', 'SKU', 'Category', 'Threshold', 'Total Stock', 'Locations', 'Status', 'Actions'].map((h) => (
                  <th key={h} className="text-left py-3 px-3 text-xs text-muted-foreground uppercase tracking-wider font-mono">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((product) => {
                const stats = getProductStats(product.id);
                return (
                  <tr key={product.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                    <td className="py-3 px-3 text-sm text-foreground font-medium">{product.name}</td>
                    <td className="py-3 px-3 font-mono text-xs text-muted-foreground">{product.sku}</td>
                    <td className="py-3 px-3"><Badge type="category">{product.category}</Badge></td>
                    <td className="py-3 px-3 font-mono text-sm text-muted-foreground">{product.threshold}</td>
                    <td className="py-3 px-3 font-mono font-bold tabular-nums text-foreground">{stats.totalStock}</td>
                    <td className="py-3 px-3 text-sm text-muted-foreground">{stats.locations}</td>
                    <td className="py-3 px-3">{stats.hasLowStock ? <Badge type="low" pulse>LOW STOCK</Badge> : <Badge type="healthy">HEALTHY</Badge>}</td>
                    <td className="py-3 px-3 flex gap-2">
                      <button onClick={() => setEditProduct(product.id)} className="text-xs px-2.5 py-1.5 border border-border rounded-md text-muted-foreground hover:text-foreground transition-colors">Edit</button>
                      <button onClick={() => setDeleteProduct(product.id)} className="text-xs px-2.5 py-1.5 border border-border rounded-md text-destructive hover:bg-destructive/10 transition-colors">Delete</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <ProductModal open={addOpen} onClose={() => setAddOpen(false)} />
      {editProduct && <ProductModal open={!!editProduct} onClose={() => setEditProduct(null)} productId={editProduct} />}
      <ConfirmDialog
        open={!!deleteProduct}
        onClose={() => setDeleteProduct(null)}
        onConfirm={() => {
          if (deleteProduct) {
            dispatch({ type: 'DELETE_PRODUCT', productId: deleteProduct });
            addToast('success', 'Product deleted');
          }
        }}
        title="Delete Product"
        message="This will permanently remove the product and all its inventory data. Are you sure?"
      />
    </div>
  );
}

function ProductModal({ open, onClose, productId }: { open: boolean; onClose: () => void; productId?: string }) {
  const { state, dispatch, addToast } = useApp();
  const existing = productId ? state.products.find((p) => p.id === productId) : null;
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [threshold, setThreshold] = useState('20');
  const [errors, setErrors] = useState<string[]>([]);
  const categories = [...new Set(state.products.map((p) => p.category))].filter((c) => c && c !== '__new');
  const isCustomCategory = selectedCategory === '__new';

  useEffect(() => {
    if (!open) return;

    setName(existing?.name ?? '');
    setSku(existing?.sku ?? '');
    setSelectedCategory(existing?.category === '__new' ? '' : (existing?.category ?? ''));
    setCustomCategory('');
    setThreshold(`${existing?.threshold ?? 20}`);
    setErrors([]);
  }, [open, existing?.id, existing?.name, existing?.sku, existing?.category, existing?.threshold]);

  const handleSubmit = () => {
    const resolvedCategory = isCustomCategory ? customCategory.trim() : selectedCategory.trim();
    const parsedThreshold = Number(threshold.trim());
    const resolvedThreshold = threshold.trim() === '' || !Number.isFinite(parsedThreshold) ? 20 : parsedThreshold;
    const errs: string[] = [];
    if (!name.trim()) errs.push('name');
    if (!sku.trim()) errs.push('sku');
    if (!resolvedCategory || resolvedCategory === '__new') errs.push('category');
    if (!Number.isInteger(resolvedThreshold) || resolvedThreshold < 0) errs.push('threshold');
    setErrors(errs);
    if (errs.length) return;

    if (existing) {
      dispatch({
        type: 'UPDATE_PRODUCT',
        product: { ...existing, name, sku, category: resolvedCategory, threshold: resolvedThreshold },
      });
      addToast('success', 'Product updated');
    } else {
      dispatch({
        type: 'ADD_PRODUCT',
        product: {
          id: generateId('p'),
          name,
          sku,
          category: resolvedCategory,
          threshold: resolvedThreshold,
          isActive: true,
        },
      });
      addToast('success', 'Product added');
    }
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={existing ? 'Edit Product' : 'Add Product'}>
      <div className="space-y-3">
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className={`w-full px-3 py-2 bg-elevated border rounded-lg text-foreground text-sm focus:border-primary focus:outline-none ${errors.includes('name') ? 'border-destructive' : 'border-border'}`} placeholder="Product name" />
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">SKU</label>
          <input value={sku} onChange={(e) => setSku(e.target.value)} className={`w-full px-3 py-2 bg-elevated border rounded-lg text-foreground text-sm font-mono focus:border-primary focus:outline-none ${errors.includes('sku') ? 'border-destructive' : 'border-border'}`} placeholder="XX-XX-XXX" />
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Category</label>
          <select
            value={selectedCategory}
            onChange={(e) => {
              const nextValue = e.target.value;
              setSelectedCategory(nextValue);
              if (nextValue !== '__new') setCustomCategory('');
            }}
            className={`w-full px-3 py-2 bg-elevated border rounded-lg text-foreground text-sm focus:border-primary focus:outline-none ${errors.includes('category') ? 'border-destructive' : 'border-border'}`}
          >
            <option value="">Select category</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            <option value="__new">+ Add new category</option>
          </select>
          {isCustomCategory && (
            <input
              value={customCategory}
              onChange={(e) => setCustomCategory(e.target.value)}
              className={`w-full mt-2 px-3 py-2 bg-elevated border rounded-lg text-foreground text-sm focus:border-primary focus:outline-none ${errors.includes('category') ? 'border-destructive' : 'border-border'}`}
              placeholder="New category name"
            />
          )}
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Threshold</label>
          <input
            type="number"
            min="0"
            value={threshold}
            onChange={(e) => setThreshold(e.target.value)}
            className={`w-full px-3 py-2 bg-elevated border rounded-lg text-foreground text-sm font-mono focus:border-primary focus:outline-none ${errors.includes('threshold') ? 'border-destructive' : 'border-border'}`}
            placeholder="20"
          />
        </div>
        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 border border-border rounded-lg text-muted-foreground hover:text-foreground transition-colors">Cancel</button>
          <button onClick={handleSubmit} className="flex-1 px-4 py-2.5 bg-primary text-primary-foreground font-semibold rounded-lg hover:opacity-90 transition-opacity">{existing ? 'Save' : 'Add'}</button>
        </div>
      </div>
    </Modal>
  );
}
