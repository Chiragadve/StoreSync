import { useState, useMemo, useEffect } from 'react';
import { useApp, useDerivedData } from '@/context/AppContext';
import { timeAgo, formatDate } from '@/lib/helpers';
import Badge from '@/components/Badge';
import EmptyState from '@/components/EmptyState';
import Modal from '@/components/Modal';

export default function OrdersPage() {
  const { state, dispatch, addToast, isLoading } = useApp();
  const derived = useDerivedData();
  const [typeFilter, setTypeFilter] = useState('all');
  const [productFilter, setProductFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [createOpen, setCreateOpen] = useState(false);
  const [viewOrder, setViewOrder] = useState<string | null>(null);
  const productById = useMemo(
    () => new Map(state.products.map((product) => [product.id, product])),
    [state.products]
  );
  const locationNameById = useMemo(
    () => new Map(state.locations.map((location) => [location.id, location.name])),
    [state.locations]
  );
  const productFilterOptions = useMemo(() => {
    const optionById = new Map<string, { id: string; label: string }>();

    state.products.forEach((product) => {
      optionById.set(product.id, {
        id: product.id,
        label: `${product.name} (${product.sku})`,
      });
    });

    state.orders.forEach((order) => {
      if (optionById.has(order.productId)) return;

      const fallbackName = order.product?.name?.trim() || `Product ${order.productId.slice(0, 8)}`;
      const fallbackSku = order.product?.sku?.trim();
      optionById.set(order.productId, {
        id: order.productId,
        label: fallbackSku ? `${fallbackName} (${fallbackSku})` : fallbackName,
      });
    });

    return Array.from(optionById.values()).sort((a, b) => a.label.localeCompare(b.label));
  }, [state.products, state.orders]);

  const filtered = useMemo(() => {
    const now = Date.now();
    const normalizedSearch = search.trim().toLowerCase();

    return state.orders.filter((order) => {
      if (typeFilter !== 'all' && order.type !== typeFilter) return false;
      if (productFilter !== 'all' && order.productId !== productFilter) return false;

      const catalogProduct = productById.get(order.productId);
      const resolvedName = (order.product?.name ?? catalogProduct?.name ?? '').toLowerCase();
      const resolvedSku = (order.product?.sku ?? catalogProduct?.sku ?? '').toLowerCase();

      if (
        normalizedSearch &&
        !resolvedName.includes(normalizedSearch) &&
        !resolvedSku.includes(normalizedSearch)
      ) {
        return false;
      }

      const orderTs = new Date(order.timestamp).getTime();
      if (dateFilter === 'today') return now - orderTs < 86400000;
      if (dateFilter === '7d') return now - orderTs < 604800000;
      if (dateFilter === '30d') return now - orderTs < 2592000000;
      return true;
    });
  }, [state.orders, typeFilter, productFilter, search, dateFilter, productById]);

  const stats = [
    { label: 'Total Orders', value: state.orders.length },
    { label: 'Sales Today', value: derived.salesToday },
    { label: 'Restocks Today', value: derived.restocksToday },
  ];

  const selectedOrder = viewOrder ? state.orders.find((o) => o.id === viewOrder) : null;
  const selectedOrderProduct = selectedOrder ? productById.get(selectedOrder.productId) : null;

  if (isLoading && state.orders.length === 0) {
    return (
      <div className="bg-card border border-border rounded-xl p-6 text-sm text-muted-foreground">
        Loading orders...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-mono font-bold text-xl text-foreground">Orders</h2>
        <button onClick={() => setCreateOpen(true)} className="px-4 py-2 bg-primary text-primary-foreground font-semibold rounded-lg hover:opacity-90 transition-opacity text-sm">Create Order</button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-card border border-border rounded-xl p-4">
            <span className="text-xs text-muted-foreground uppercase tracking-wider">{s.label}</span>
            <div className="font-mono font-bold text-2xl text-foreground tabular-nums mt-1">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="bg-card border border-border rounded-xl p-4 flex flex-wrap gap-3">
        <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="px-3 py-2 bg-elevated border border-border rounded-lg text-foreground text-sm focus:border-primary focus:outline-none">
          <option value="all">All Time</option>
          <option value="today">Today</option>
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
        </select>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="px-3 py-2 bg-elevated border border-border rounded-lg text-foreground text-sm focus:border-primary focus:outline-none">
          <option value="all">All Types</option>
          <option value="sale">Sale</option>
          <option value="restock">Restock</option>
          <option value="transfer">Transfer</option>
        </select>
        <select value={productFilter} onChange={(e) => setProductFilter(e.target.value)} className="px-3 py-2 bg-elevated border border-border rounded-lg text-foreground text-sm focus:border-primary focus:outline-none">
          <option value="all">All Products</option>
          {productFilterOptions.map((productOption) => (
            <option key={productOption.id} value={productOption.id}>
              {productOption.label}
            </option>
          ))}
        </select>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search product or SKU..." className="flex-1 min-w-[160px] px-3 py-2 bg-elevated border border-border rounded-lg text-foreground text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none" />
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon="↗" title="No orders found" subtitle="Try adjusting your filters or create a new order" action={{ label: 'Create Order', onClick: () => setCreateOpen(true) }} />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                {['Order ID', 'Product', 'Location', 'Type', 'Qty', 'Source', 'Note', 'Time', 'Actions'].map((h) => (
                  <th key={h} className="text-left py-3 px-3 text-xs text-muted-foreground uppercase tracking-wider font-mono">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((order) => {
                const catalogProduct = productById.get(order.productId);
                const productName = order.product?.name ?? catalogProduct?.name ?? '-';
                const fromLocationName = locationNameById.get(order.locationId) ?? '-';
                const toLocationName = order.toLocationId
                  ? locationNameById.get(order.toLocationId) ?? '-'
                  : '-';
                const locationLabel =
                  order.type === 'transfer'
                    ? order.toLocationId
                      ? `${fromLocationName} -> ${toLocationName}`
                      : fromLocationName
                    : fromLocationName;

                return (
                  <tr key={order.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                    <td className="py-3 px-3 font-mono text-xs text-muted-foreground">{order.id.slice(0, 10)}</td>
                    <td className="py-3 px-3 text-sm text-foreground">{productName}</td>
                    <td className="py-3 px-3 text-sm text-muted-foreground">{locationLabel}</td>
                    <td className="py-3 px-3"><Badge type={order.type}>{order.type}</Badge></td>
                    <td className="py-3 px-3 font-mono text-sm tabular-nums text-foreground">
                      {order.type === 'sale' ? '↓' : order.type === 'restock' ? '↑' : '↔'} {order.quantity}
                    </td>
                    <td className="py-3 px-3"><Badge type={order.source}>{order.source}</Badge></td>
                    <td className="py-3 px-3 text-xs text-muted-foreground max-w-[150px] truncate" title={order.note}>{order.note}</td>
                    <td className="py-3 px-3 text-xs text-muted-foreground font-mono" title={formatDate(order.timestamp)}>{timeAgo(order.timestamp)}</td>
                    <td className="py-3 px-3">
                      <button onClick={() => setViewOrder(order.id)} className="text-xs px-2.5 py-1.5 border border-border rounded-md text-muted-foreground hover:text-foreground transition-colors">View</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* View Order Modal */}
      {selectedOrder && (
        <Modal open={!!selectedOrder} onClose={() => setViewOrder(null)} title="Order Details">
          <div className="space-y-4">
            {(() => {
              const fromLocationName = locationNameById.get(selectedOrder.locationId) ?? '-';
              const toLocationName = selectedOrder.toLocationId
                ? locationNameById.get(selectedOrder.toLocationId) ?? '-'
                : '-';

              return (
                <>
                  <Row label="Order ID" value={selectedOrder.id} mono />
                  <Row label="Product" value={selectedOrder.product?.name ?? selectedOrderProduct?.name ?? '-'} />
                  <Row label="SKU" value={selectedOrder.product?.sku ?? selectedOrderProduct?.sku ?? '-'} />
                  {selectedOrder.type === 'transfer' ? (
                    <>
                      <Row label="From Location" value={fromLocationName} />
                      {selectedOrder.toLocationId ? <Row label="To Location" value={toLocationName} /> : null}
                    </>
                  ) : (
                    <Row label="Location" value={fromLocationName} />
                  )}
                  <Row label="Type"><Badge type={selectedOrder.type}>{selectedOrder.type}</Badge></Row>
                  <Row label="Quantity" value={`${selectedOrder.quantity}`} mono />
                  <Row label="Source"><Badge type={selectedOrder.source}>{selectedOrder.source}</Badge></Row>
                  <Row label="Note" value={selectedOrder.note} />
                  <Row label="Time" value={formatDate(selectedOrder.timestamp)} mono />
                </>
              );
            })()}
          </div>
        </Modal>
      )}

      <CreateOrderModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  );
}

function Row({ label, value, mono, children }: { label: string; value?: string; mono?: boolean; children?: React.ReactNode }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-border/50">
      <span className="text-sm text-muted-foreground">{label}</span>
      {children || <span className={`text-sm text-foreground ${mono ? 'font-mono' : ''}`}>{value}</span>}
    </div>
  );
}

function CreateOrderModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { state, dispatch, addToast } = useApp();
  const [productId, setProductId] = useState('');
  const [locationId, setLocationId] = useState('');
  const [toLocationId, setToLocationId] = useState('');
  const [type, setType] = useState<'sale' | 'restock' | 'transfer'>('sale');
  const [qty, setQty] = useState('');
  const [note, setNote] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [formError, setFormError] = useState('');
  const isTransfer = type === 'transfer';

  const toLocationOptions = useMemo(
    () => state.locations.filter((location) => location.id !== locationId),
    [state.locations, locationId]
  );

  const transferBlockReason = useMemo(() => {
    if (!isTransfer) return '';
    if (state.locations.length < 2) return 'Transfer order requires at least two locations.';
    if (!locationId) return '';
    if (toLocationOptions.length === 0) return 'No destination location available for transfer.';
    return '';
  }, [isTransfer, state.locations.length, locationId, toLocationOptions.length]);

  useEffect(() => {
    if (!isTransfer && toLocationId) {
      setToLocationId('');
    }
  }, [isTransfer, toLocationId]);

  useEffect(() => {
    if (toLocationId && toLocationId === locationId) {
      setToLocationId('');
    }
  }, [locationId, toLocationId]);

  const handleSubmit = () => {
    setFormError('');
    const errs: string[] = [];
    if (!productId) errs.push('productId');
    if (!locationId) errs.push(isTransfer ? 'fromLocationId' : 'locationId');
    if (isTransfer && !toLocationId) errs.push('toLocationId');
    if (!qty || parseInt(qty, 10) <= 0) errs.push('qty');
    setErrors(errs);
    if (errs.length) return;

    if (isTransfer && transferBlockReason) {
      setFormError(transferBlockReason);
      addToast('error', transferBlockReason);
      return;
    }

    if (isTransfer && locationId === toLocationId) {
      const message = 'From location and to location must be different for transfer orders.';
      setFormError(message);
      addToast('error', message);
      return;
    }

    const amount = parseInt(qty, 10);
    if (type === 'sale' || type === 'transfer') {
      const sourceInventory = state.inventory.find(
        (item) => item.productId === productId && item.locationId === locationId
      );
      const currentQty = sourceInventory?.quantity ?? 0;

      if (currentQty < amount) {
        const orderLabel = type === 'sale' ? 'Sale' : 'Transfer';
        const message = `Current QTY is ${currentQty} and order is ${amount}. ${orderLabel} order can't be created.`;
        setFormError(message);
        addToast('error', message);
        return;
      }
    }

    dispatch({
      type: 'CREATE_ORDER',
      order: {
        id: '',
        productId,
        locationId,
        toLocationId: isTransfer ? toLocationId : null,
        type,
        quantity: amount,
        source: 'manual',
        note,
        timestamp: new Date().toISOString(),
      },
    });

    onClose();
    setProductId('');
    setLocationId('');
    setToLocationId('');
    setQty('');
    setNote('');
    setErrors([]);
    setFormError('');
  };

  return (
    <Modal open={open} onClose={onClose} title="Create Order">
      <div className="space-y-3">
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Product</label>
          <select value={productId} onChange={(e) => setProductId(e.target.value)} className={`w-full px-3 py-2 bg-elevated border rounded-lg text-foreground text-sm focus:border-primary focus:outline-none ${errors.includes('productId') ? 'border-destructive' : 'border-border'}`}>
            <option value="">Select product</option>
            {state.products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">{isTransfer ? 'From Location' : 'Location'}</label>
          <select value={locationId} onChange={(e) => setLocationId(e.target.value)} className={`w-full px-3 py-2 bg-elevated border rounded-lg text-foreground text-sm focus:border-primary focus:outline-none ${(errors.includes('locationId') || errors.includes('fromLocationId')) ? 'border-destructive' : 'border-border'}`}>
            <option value="">Select location</option>
            {state.locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
        </div>
        {isTransfer ? (
          <div>
            <label className="block text-xs text-muted-foreground mb-1">To Location</label>
            <select value={toLocationId} onChange={(e) => setToLocationId(e.target.value)} className={`w-full px-3 py-2 bg-elevated border rounded-lg text-foreground text-sm focus:border-primary focus:outline-none ${errors.includes('toLocationId') ? 'border-destructive' : 'border-border'}`}>
              <option value="">Select destination location</option>
              {toLocationOptions.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}
            </select>
            {transferBlockReason ? (
              <p className="mt-1 text-xs text-destructive">{transferBlockReason}</p>
            ) : null}
          </div>
        ) : null}
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Type</label>
          <div className="flex border border-border rounded-lg overflow-hidden">
            {(['sale', 'restock', 'transfer'] as const).map((t) => (
              <button key={t} onClick={() => { setType(t); setFormError(''); }} className={`flex-1 py-2 text-sm font-semibold capitalize transition-colors ${type === t ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}>{t}</button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Quantity</label>
          <input type="number" min="1" value={qty} onChange={(e) => setQty(e.target.value)} className={`w-full px-3 py-2 bg-elevated border rounded-lg text-foreground text-sm font-mono focus:border-primary focus:outline-none ${errors.includes('qty') ? 'border-destructive' : 'border-border'}`} placeholder="0" />
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Note</label>
          <input value={note} onChange={(e) => setNote(e.target.value)} className="w-full px-3 py-2 bg-elevated border border-border rounded-lg text-foreground text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none" placeholder="Optional note" />
        </div>
        {formError ? <p className="text-xs text-destructive">{formError}</p> : null}
        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 border border-border rounded-lg text-muted-foreground hover:text-foreground transition-colors">Cancel</button>
          <button onClick={handleSubmit} disabled={Boolean(isTransfer && transferBlockReason)} className="flex-1 px-4 py-2.5 bg-primary text-primary-foreground font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:cursor-not-allowed disabled:opacity-50">Create</button>
        </div>
      </div>
    </Modal>
  );
}
