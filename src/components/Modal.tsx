import { ReactNode } from 'react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export default function Modal({ open, onClose, title, children }: ModalProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-xl p-6 w-full max-w-md animate-modal-enter max-h-[90vh] overflow-y-auto custom-scrollbar">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-mono font-bold text-lg text-foreground">{title}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors text-xl leading-none">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}
