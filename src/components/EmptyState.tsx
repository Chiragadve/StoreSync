interface EmptyStateProps {
  icon?: string;
  title: string;
  subtitle?: string;
  action?: { label: string; onClick: () => void };
}

export default function EmptyState({ icon = '◇', title, subtitle, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="text-4xl mb-4 text-muted-foreground">{icon}</div>
      <h3 className="font-mono font-bold text-foreground mb-1">{title}</h3>
      {subtitle && <p className="text-sm text-muted-foreground mb-4">{subtitle}</p>}
      {action && (
        <button onClick={action.onClick} className="px-4 py-2 bg-primary text-primary-foreground font-semibold rounded-lg hover:opacity-90 transition-opacity text-sm">{action.label}</button>
      )}
    </div>
  );
}
