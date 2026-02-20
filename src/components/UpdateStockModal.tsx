import { useState } from 'react';
import Modal from './Modal';
import { useApp } from '@/context/AppContext';

interface Props {
  open: boolean;
  onClose: () => void;
  productId: string;
  locationId: string;
}

export default function UpdateStockModal({ open, onClose, productId, locationId }: Props) {
  const { state, dispatch, addToast } = useApp();
  const item = state.inventory.find((i) => i.productId === productId && i.locationId === locationId);
  const product = state.products.find((p) => p.id === productId);

  const [mode, setMode] = useState<'add' | 'remove'>('add');
  const [qty, setQty] = useState('');
  const [note, setNote] = useState('');

  if (!item || !product) return null;

  const handleConfirm = () => {
    const amount = parseInt(qty, 10);
    if (!amount || amount <= 0) {
      addToast('error', 'Enter a valid quantity');
      return;
    }

    dispatch({
      type: 'CREATE_ORDER',
      order: {
        id: '',
        productId,
        locationId,
        type: mode === 'add' ? 'restock' : 'sale',
        quantity: amount,
        source: 'manual',
        note: note || `Stock ${mode === 'add' ? 'added' : 'removed'}`,
        timestamp: new Date().toISOString(),
      },
    });

    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={`Update Stock - ${product.name}`}>
      <div className="text-center mb-4">
        <span className="text-sm text-muted-foreground">Current quantity</span>
        <div className="font-mono font-bold text-3xl text-foreground tabular-nums">{item.quantity}</div>
      </div>

      <div className="flex border border-border rounded-lg overflow-hidden mb-4">
        <button
          onClick={() => setMode('add')}
          className={`flex-1 py-2 text-sm font-semibold transition-colors ${
            mode === 'add'
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Add Stock
        </button>
        <button
          onClick={() => setMode('remove')}
          className={`flex-1 py-2 text-sm font-semibold transition-colors ${
            mode === 'remove'
              ? 'bg-destructive text-destructive-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Remove Stock
        </button>
      </div>

      <input
        type="number"
        min="1"
        value={qty}
        onChange={(e) => setQty(e.target.value)}
        placeholder="Quantity"
        className="w-full px-4 py-3 bg-elevated border border-border rounded-lg text-foreground text-center font-mono text-xl placeholder:text-muted-foreground focus:border-primary focus:outline-none mb-3"
      />

      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Note (optional)"
        rows={2}
        className="w-full px-4 py-2 bg-elevated border border-border rounded-lg text-foreground text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none mb-3 resize-none"
      />

      <div className="flex gap-3">
        <button
          onClick={onClose}
          className="flex-1 px-4 py-2.5 border border-border rounded-lg text-muted-foreground hover:text-foreground transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleConfirm}
          className="flex-1 px-4 py-2.5 bg-primary text-primary-foreground font-semibold rounded-lg hover:opacity-90 transition-opacity"
        >
          Confirm
        </button>
      </div>
    </Modal>
  );
}
