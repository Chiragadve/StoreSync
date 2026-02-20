import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

export function useAuthSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const cleanupAuthParams = () => {
      const url = new URL(window.location.href);
      const before = url.toString();

      url.searchParams.delete('code');
      url.searchParams.delete('error');
      url.searchParams.delete('error_description');
      url.searchParams.delete('state');

      let hashChanged = false;
      if (
        window.location.hash.includes('access_token=') ||
        window.location.hash.includes('refresh_token=') ||
        window.location.hash.includes('expires_in=')
      ) {
        url.hash = '';
        hashChanged = true;
      }

      const after = url.toString();
      if (before !== after || hashChanged) {
        window.history.replaceState({}, document.title, `${url.pathname}${url.search}${url.hash}`);
      }
    };

    const hydrateSession = async () => {
      const url = new URL(window.location.href);
      const code = url.searchParams.get('code');
      const hasAuthError =
        url.searchParams.has('error') || url.searchParams.has('error_description');
      const hasLegacyHashTokens =
        window.location.hash.includes('access_token=') ||
        window.location.hash.includes('refresh_token=');

      try {
        const { data: initialData } = await supabase.auth.getSession();
        let nextSession = initialData.session;

        if (!nextSession && code && !hasAuthError) {
          const { data: exchangedData, error } = await supabase.auth.exchangeCodeForSession(code);
          if (error && import.meta.env.DEV) {
            console.error('[auth] exchangeCodeForSession failed', error.message);
          }
          nextSession = exchangedData.session ?? null;
        }

        if (code || hasAuthError || hasLegacyHashTokens) {
          cleanupAuthParams();
        }

        if (!mounted) return;
        setSession(nextSession);
      } finally {
        if (!mounted) return;
        setIsLoading(false);
      }
    };

    void hydrateSession();

    const { data: listener } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (import.meta.env.DEV && ['TOKEN_REFRESHED', 'SIGNED_IN', 'SIGNED_OUT'].includes(event)) {
        console.info(`[auth] ${event.toLowerCase()}`);
      }
      setSession(nextSession);
      setIsLoading(false);
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  return { session, isLoading };
}
