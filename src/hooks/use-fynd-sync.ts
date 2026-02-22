import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export function useFyndSync() {
    const [syncingIds, setSyncingIds] = useState<Set<string>>(new Set());

    const syncToFynd = async (productId: string) => {
        setSyncingIds((prev) => new Set(prev).add(productId));
        try {
            const { data: sessionData } = await supabase.auth.getSession();
            const token = sessionData?.session?.access_token;
            const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

            const res = await fetch(
                `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/boltic-sync-to-fynd`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token || anonKey}`,
                        apikey: anonKey,
                    },
                    body: JSON.stringify({ product_id: productId }),
                }
            );

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Sync failed');
            }

            return { success: true };
        } catch (err) {
            throw err;
        } finally {
            setSyncingIds((prev) => {
                const next = new Set(prev);
                next.delete(productId);
                return next;
            });
        }
    };

    const isSyncing = (productId: string) => syncingIds.has(productId);

    return { syncToFynd, isSyncing };
}
