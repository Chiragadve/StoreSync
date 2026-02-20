import { useApp } from '@/context/AppContext';
import { useEffect, useState } from 'react';

export default function ToastContainer() {
  const { state } = useApp();

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm">
      {state.toasts.map((toast) => (
        <ToastItem key={toast.id} type={toast.type} message={toast.message} />
      ))}
    </div>
  );
}

function ToastItem({ type, message }: { type: string; message: string }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => { requestAnimationFrame(() => setVisible(true)); }, []);

  const colors: Record<string, string> = {
    success: 'border-l-4 border-l-success',
    error: 'border-l-4 border-l-destructive',
    warning: 'border-l-4 border-l-warning',
    info: 'border-l-4 border-l-info',
  };

  const icons: Record<string, string> = {
    success: '✓', error: '✕', warning: '⚠', info: 'ℹ',
  };

  return (
    <div
      className={`bg-card border border-border rounded-lg px-4 py-3 shadow-2xl flex items-center gap-3 transition-all duration-300 ${colors[type]} ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}
    >
      <span className="font-mono text-sm">{icons[type]}</span>
      <span className="text-sm text-foreground">{message}</span>
    </div>
  );
}
