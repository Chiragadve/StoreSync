import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface FyndCredentials {
    client_id: string;
    client_secret: string;
    company_id: string;
}

export function useFyndCredentials() {
    const [credentials, setCredentials] = useState<FyndCredentials | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [hasCredentials, setHasCredentials] = useState(false);

    useEffect(() => {
        async function load() {
            const { data: session } = await supabase.auth.getSession();
            if (!session?.session?.user?.id) {
                setIsLoading(false);
                return;
            }

            const { data } = await supabase
                .from('fynd_credentials')
                .select('client_id, client_secret, company_id')
                .eq('user_id', session.session.user.id)
                .single();

            if (data && data.client_id && data.client_secret && data.company_id) {
                setCredentials(data);
                setHasCredentials(true);
            }
            setIsLoading(false);
        }
        load();
    }, []);

    return { credentials, hasCredentials, isLoading };
}
