import { useEffect, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { supabase } from '@/lib/supabase';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'profile' | 'integrations'>('profile');

  return (
    <div className="space-y-6 max-w-3xl">
      <h2 className="font-mono font-bold text-xl text-foreground">Settings</h2>

      {/* Tabs */}
      <div className="flex gap-1 bg-secondary/50 p-1 rounded-lg w-fit">
        {(['profile', 'integrations'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === tab
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
              }`}
          >
            {tab === 'profile' ? '👤 Profile' : '🔗 Integrations'}
          </button>
        ))}
      </div>

      {activeTab === 'profile' && <ProfileTab />}
      {activeTab === 'integrations' && <IntegrationsTab />}
    </div>
  );
}

function ProfileTab() {
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
  );
}

function IntegrationsTab() {
  const { addToast } = useApp();
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [showSecret, setShowSecret] = useState(false);

  // Load existing credentials
  useEffect(() => {
    async function load() {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user?.id) return;

      const { data } = await supabase
        .from('fynd_credentials')
        .select('*')
        .eq('user_id', session.session.user.id)
        .single();

      if (data) {
        setClientId(data.client_id || '');
        setClientSecret(data.client_secret || '');
        setCompanyId(data.company_id || '');
      }
      setIsLoaded(true);
    }
    load();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user?.id) {
        addToast('error', 'Not authenticated');
        return;
      }

      const { error } = await supabase
        .from('fynd_credentials')
        .upsert({
          user_id: session.session.user.id,
          client_id: clientId,
          client_secret: clientSecret,
          company_id: companyId,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });

      if (error) throw error;
      addToast('success', 'Fynd credentials saved');
    } catch (err) {
      addToast('error', `Failed to save: ${(err as Error).message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Fynd Commerce Card */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border bg-gradient-to-r from-violet-600/10 to-indigo-600/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
              Fy
            </div>
            <div>
              <h3 className="text-foreground font-semibold">Fynd Commerce</h3>
              <p className="text-xs text-muted-foreground">Connect your Fynd Platform account to sync products</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {!isLoaded ? (
            <p className="text-sm text-muted-foreground">Loading credentials...</p>
          ) : (
            <>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Company ID</label>
                <input
                  value={companyId}
                  onChange={(e) => setCompanyId(e.target.value)}
                  placeholder="e.g. 13901"
                  className="w-full px-3 py-2 bg-elevated border border-border rounded-lg text-foreground text-sm focus:border-violet-500 focus:outline-none font-mono"
                />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Client ID</label>
                <input
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  placeholder="Your Fynd Platform Client ID"
                  className="w-full px-3 py-2 bg-elevated border border-border rounded-lg text-foreground text-sm focus:border-violet-500 focus:outline-none font-mono"
                />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Client Secret</label>
                <div className="relative">
                  <input
                    type={showSecret ? 'text' : 'password'}
                    value={clientSecret}
                    onChange={(e) => setClientSecret(e.target.value)}
                    placeholder="Your Fynd Platform Client Secret"
                    className="w-full px-3 py-2 pr-16 bg-elevated border border-border rounded-lg text-foreground text-sm focus:border-violet-500 focus:outline-none font-mono"
                  />
                  <button
                    onClick={() => setShowSecret(!showSecret)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground px-2 py-1"
                  >
                    {showSecret ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={handleSave}
                  disabled={isSaving || !clientId || !clientSecret}
                  className="px-6 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold rounded-lg hover:opacity-90 transition-opacity text-sm disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : 'Save Credentials'}
                </button>
                {clientId && clientSecret && (
                  <span className="inline-flex items-center gap-1 text-xs text-emerald-400">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    Connected
                  </span>
                )}
              </div>
            </>
          )}

          <div className="pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground mb-2">
              Don't have a Fynd Platform account?
            </p>
            <a
              href="https://platform.fynd.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-violet-400 hover:text-violet-300 transition-colors"
            >
              🔗 Create one at platform.fynd.com
              <span className="text-xs">↗</span>
            </a>
          </div>
        </div>
      </div>

      {/* Boltic Card */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border bg-gradient-to-r from-amber-600/10 to-orange-600/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white font-bold text-sm">
              B
            </div>
            <div>
              <h3 className="text-foreground font-semibold">Boltic</h3>
              <p className="text-xs text-muted-foreground">Workflow automation connecting StoreSync to Fynd Commerce</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-sm text-emerald-400">Active</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Boltic workflow is configured to sync products from StoreSync to Fynd Commerce.
            Manage your workflow at{' '}
            <a
              href="https://boltic.io"
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-400 hover:underline"
            >
              boltic.io ↗
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
