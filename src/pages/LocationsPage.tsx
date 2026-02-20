import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { isLowStock, generateId } from '@/lib/helpers';
import Badge from '@/components/Badge';
import Modal from '@/components/Modal';

export default function LocationsPage() {
  const { state, dispatch, addToast, isLoading } = useApp();
  const navigate = useNavigate();
  const [addOpen, setAddOpen] = useState(false);
  const [editLocation, setEditLocation] = useState<string | null>(null);

  const getLocationStats = (locationId: string) => {
    const items = state.inventory.filter((i) => i.locationId === locationId);
    const totalStock = items.reduce((s, i) => s + i.quantity, 0);
    const lowStockCount = items.filter((i) => isLowStock(i.quantity, i.threshold)).length;
    return { totalSKUs: items.length, totalStock, lowStockCount };
  };

  if (isLoading && state.locations.length === 0) {
    return (
      <div className="bg-card border border-border rounded-xl p-6 text-sm text-muted-foreground">
        Loading locations...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-mono font-bold text-xl text-foreground">Locations</h2>
        <button onClick={() => setAddOpen(true)} className="px-4 py-2 bg-primary text-primary-foreground font-semibold rounded-lg hover:opacity-90 transition-opacity text-sm">Add Location</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {state.locations.map((location) => {
          const stats = getLocationStats(location.id);
          return (
            <div key={location.id} className="bg-card border border-border rounded-xl p-6 card-hover">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-mono font-bold text-lg text-foreground">{location.name}</h3>
                  <p className="text-sm text-muted-foreground">{location.city}</p>
                </div>
                <Badge type={location.type}>{location.type}</Badge>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-6">
                <div>
                  <div className="font-mono font-bold text-xl text-foreground tabular-nums">{stats.totalSKUs}</div>
                  <div className="text-xs text-muted-foreground">SKUs</div>
                </div>
                <div>
                  <div className="font-mono font-bold text-xl text-foreground tabular-nums">{stats.totalStock}</div>
                  <div className="text-xs text-muted-foreground">Stock</div>
                </div>
                <div>
                  <div className={`font-mono font-bold text-xl tabular-nums ${stats.lowStockCount > 0 ? 'text-destructive' : 'text-success'}`}>{stats.lowStockCount}</div>
                  <div className="text-xs text-muted-foreground">Low Stock</div>
                </div>
              </div>

              <div className="flex gap-2">
                <button onClick={() => navigate(`/inventory?location=${location.id}`)} className="flex-1 py-2.5 bg-primary text-primary-foreground font-semibold rounded-lg text-sm hover:opacity-90 transition-opacity">View Inventory</button>
                <button onClick={() => setEditLocation(location.id)} className="py-2.5 px-3 border border-border rounded-lg text-sm text-muted-foreground hover:text-foreground transition-colors">Edit</button>
              </div>
            </div>
          );
        })}
      </div>

      <LocationModal open={addOpen} onClose={() => setAddOpen(false)} />
      {editLocation && <LocationModal open={!!editLocation} onClose={() => setEditLocation(null)} locationId={editLocation} />}
    </div>
  );
}

function LocationModal({ open, onClose, locationId }: { open: boolean; onClose: () => void; locationId?: string }) {
  const { state, dispatch, addToast } = useApp();
  const existing = locationId ? state.locations.find((l) => l.id === locationId) : null;
  const [name, setName] = useState(existing?.name || '');
  const [type, setType] = useState<'warehouse' | 'store' | 'online'>(existing?.type || 'store');
  const [city, setCity] = useState(existing?.city || '');
  const [errors, setErrors] = useState<string[]>([]);

  const handleSubmit = () => {
    const errs: string[] = [];
    if (!name.trim()) errs.push('name');
    if (!city.trim()) errs.push('city');
    setErrors(errs);
    if (errs.length) return;

    if (existing) {
      dispatch({ type: 'UPDATE_LOCATION', location: { ...existing, name, type, city } });
      addToast('success', 'Location updated');
    } else {
      dispatch({ type: 'ADD_LOCATION', location: { id: generateId('loc'), name, type, city, isActive: true } });
      addToast('success', 'Location added');
    }
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={existing ? 'Edit Location' : 'Add Location'}>
      <div className="space-y-3">
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className={`w-full px-3 py-2 bg-elevated border rounded-lg text-foreground text-sm focus:border-primary focus:outline-none ${errors.includes('name') ? 'border-destructive' : 'border-border'}`} placeholder="Location name" />
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Type</label>
          <div className="flex border border-border rounded-lg overflow-hidden">
            {(['warehouse', 'store', 'online'] as const).map((t) => (
              <button key={t} onClick={() => setType(t)} className={`flex-1 py-2 text-sm font-semibold capitalize transition-colors ${type === t ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}>{t}</button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">City</label>
          <input value={city} onChange={(e) => setCity(e.target.value)} className={`w-full px-3 py-2 bg-elevated border rounded-lg text-foreground text-sm focus:border-primary focus:outline-none ${errors.includes('city') ? 'border-destructive' : 'border-border'}`} placeholder="City" />
        </div>
        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 border border-border rounded-lg text-muted-foreground hover:text-foreground transition-colors">Cancel</button>
          <button onClick={handleSubmit} className="flex-1 px-4 py-2.5 bg-primary text-primary-foreground font-semibold rounded-lg hover:opacity-90 transition-opacity">{existing ? 'Save' : 'Add'}</button>
        </div>
      </div>
    </Modal>
  );
}
