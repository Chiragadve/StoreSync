import Modal from './Modal';

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}

export default function ConfirmDialog({ open, onClose, onConfirm, title, message }: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <div className="text-center mb-6">
        <div className="text-4xl mb-3">⚠</div>
        <p className="text-muted-foreground">{message}</p>
      </div>
      <div className="flex gap-3">
        <button onClick={onClose} className="flex-1 px-4 py-2.5 border border-border rounded-lg text-muted-foreground hover:text-foreground hover:border-muted transition-colors">Cancel</button>
        <button onClick={() => { onConfirm(); onClose(); }} className="flex-1 px-4 py-2.5 bg-destructive text-destructive-foreground font-semibold rounded-lg hover:opacity-90 transition-opacity">Confirm</button>
      </div>
    </Modal>
  );
}
