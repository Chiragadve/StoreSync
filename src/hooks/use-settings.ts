import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { graphqlRequest } from '@/lib/graphql';
import { supabase } from '@/lib/supabase';
import type { Settings } from '@/types';

const SETTINGS_QUERY = `
  query Settings($userId: UUID!) {
    user_settingsCollection(filter: { user_id: { eq: $userId } }, first: 1) {
      edges {
        node {
          userId: user_id
          notifyLowStock: notify_low_stock
          notifyOrderConfirmations: notify_order_confirmations
          notifyDailySummary: notify_daily_summary
          notifyAiActions: notify_ai_actions
          accentColor: accent_color
          density
        }
      }
    }
  }
`;

const UPDATE_SETTINGS_MUTATION = `
  mutation UpdateSettings(
    $userId: UUID!,
    $notifyLowStock: Boolean!,
    $notifyOrderConfirmations: Boolean!,
    $notifyDailySummary: Boolean!,
    $notifyAiActions: Boolean!,
    $accentColor: String!,
    $density: String!
  ) {
    updateuser_settingsCollection(
      set: {
        notify_low_stock: $notifyLowStock,
        notify_order_confirmations: $notifyOrderConfirmations,
        notify_daily_summary: $notifyDailySummary,
        notify_ai_actions: $notifyAiActions,
        accent_color: $accentColor,
        density: $density
      },
      filter: { user_id: { eq: $userId } }
      atMost: 1
    ) {
      records {
        userId: user_id
      }
    }
  }
`;

type SettingsRow = {
  userId: string;
  notifyLowStock: boolean;
  notifyOrderConfirmations: boolean;
  notifyDailySummary: boolean;
  notifyAiActions: boolean;
  accentColor: string;
  density: 'comfortable' | 'compact';
};

type SettingsResponse = {
  user_settingsCollection: {
    edges?: Array<{ node?: SettingsRow | null }>;
  } | null;
};

const defaultSettings: Settings = {
  notifications: {
    lowStock: true,
    orderConfirmations: true,
    dailySummary: false,
    aiActions: true,
  },
  accentColor: 'amber',
  density: 'comfortable',
};

function toSettings(row?: SettingsRow | null): Settings {
  if (!row) return defaultSettings;

  return {
    notifications: {
      lowStock: row.notifyLowStock ?? true,
      orderConfirmations: row.notifyOrderConfirmations ?? true,
      dailySummary: row.notifyDailySummary ?? false,
      aiActions: row.notifyAiActions ?? true,
    },
    accentColor: row.accentColor ?? 'amber',
    density: row.density ?? 'comfortable',
  };
}

function toDbSettings(settings: Settings) {
  return {
    notify_low_stock: settings.notifications.lowStock,
    notify_order_confirmations: settings.notifications.orderConfirmations,
    notify_daily_summary: settings.notifications.dailySummary,
    notify_ai_actions: settings.notifications.aiActions,
    accent_color: settings.accentColor,
    density: settings.density,
  };
}

export function useSettings(userId?: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['settings', userId],
    enabled: Boolean(userId) && (options?.enabled ?? true),
    queryFn: async () => {
      const data = await graphqlRequest<SettingsResponse>(SETTINGS_QUERY, { userId });
      const node = data.user_settingsCollection?.edges?.[0]?.node;
      return toSettings(node);
    },
  });
}

export function useUpdateSettingsMutation(userId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (settings: Settings) => {
      if (!userId) throw new Error('No authenticated user found.');

      const variables = {
        userId,
        notifyLowStock: settings.notifications.lowStock,
        notifyOrderConfirmations: settings.notifications.orderConfirmations,
        notifyDailySummary: settings.notifications.dailySummary,
        notifyAiActions: settings.notifications.aiActions,
        accentColor: settings.accentColor,
        density: settings.density,
      };

      try {
        await graphqlRequest(UPDATE_SETTINGS_MUTATION, variables);
      } catch {
        const { error } = await supabase.from('user_settings').upsert({
          user_id: userId,
          ...toDbSettings(settings),
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['settings', userId] });
    },
  });
}
