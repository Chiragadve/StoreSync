import { useEffect, useState } from 'react';
import { useApp } from '@/context/AppContext';

export default function SettingsPage() {
  const { state, dispatch, addToast, isLoading } = useApp();
  const [name, setName] = useState(state.currentUser.name);
  const [email, setEmail] = useState(state.currentUser.email);

  useEffect(() => {
    setName(state.currentUser.name);
    setEmail(state.currentUser.email);
  }, [state.currentUser.name, state.currentUser.email]);

  if (isLoading && !state.currentUser.email) {
    return (
      <div className="bg-card border border-border rounded-xl p-6 text-sm text-muted-foreground">
        Loading settings...
      </div>
    );
  }
  return (
    <div className="space-y-6 max-w-3xl">
      <h2 className="font-mono font-bold text-xl text-foreground">Settings</h2>

      <div className="bg-card border border-border rounded-xl p-6">
        <div className="space-y-4">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-primary/20 border-2 border-primary/40 flex items-center justify-center text-primary font-mono font-bold text-xl">
              AM
            </div>
            <div>
              <div className="text-foreground font-semibold">{state.currentUser.name}</div>
              <button className="text-xs text-primary hover:underline">Change Avatar</button>
            </div>
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-elevated border border-border rounded-lg text-foreground text-sm focus:border-primary focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Email</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 bg-elevated border border-border rounded-lg text-foreground text-sm focus:border-primary focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Role</label>
            <span className="inline-flex items-center px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-sm font-mono">
              {state.currentUser.role}
            </span>
          </div>
          <button
            onClick={() => {
              dispatch({ type: 'UPDATE_PROFILE', profile: { name, email } });
              addToast('success', 'Settings saved');
            }}
            className="px-6 py-2.5 bg-primary text-primary-foreground font-semibold rounded-lg hover:opacity-90 transition-opacity text-sm"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
