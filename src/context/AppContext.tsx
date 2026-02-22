import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  AppAction,
  AppState,
  Location,
  Product,
  Settings,
  Toast,
  User,
} from '@/types';
import { useAuthSession } from '@/hooks/use-auth-session';
import { useProducts, useAddProductMutation, useUpdateProductMutation, useArchiveProductMutation } from '@/hooks/use-products';
import { useLocations, useAddLocationMutation, useUpdateLocationMutation } from '@/hooks/use-locations';
import { useInventory, useAddInventoryMutation, useUpdateInventoryMutation } from '@/hooks/use-inventory';
import { useOrders, useCreateOrderMutation } from '@/hooks/use-orders';
import { useProfile, useUpdateProfileMutation } from '@/hooks/use-profile';
import { useSettings, useUpdateSettingsMutation } from '@/hooks/use-settings';
import { supabase } from '@/lib/supabase';

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

interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  addToast: (type: Toast['type'], message: string) => void;
  isLoading: boolean;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

function normalizeMutationError(error: unknown, fallbackMessage: string): string {
  if (!(error instanceof Error)) return fallbackMessage;

  let message = error.message.trim();
  if (!message) return fallbackMessage;

  message = message.replace(/^\[GraphQL:[^\]]+\]\s*/, '');

  const requestFailedMatch = /^request failed \([^)]*\):\s*(.+)$/i.exec(message);
  if (requestFailedMatch?.[1]) {
    message = requestFailedMatch[1].trim();
  }

  return message || fallbackMessage;
}

function mapSessionUser(sessionUser: {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
}): User {
  const guessedName =
    typeof sessionUser.user_metadata?.name === 'string'
      ? sessionUser.user_metadata.name
      : (sessionUser.email?.split('@')[0] ?? 'Store User');

  return {
    id: sessionUser.id,
    name: guessedName,
    email: sessionUser.email ?? '',
    role: 'Store Manager',
  };
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { session, isLoading: isAuthLoading } = useAuthSession();
  const [toasts, setToasts] = useState<Toast[]>([]);

  const isAuthenticated = Boolean(session);

  const productsQuery = useProducts({ enabled: isAuthenticated });
  const locationsQuery = useLocations({ enabled: isAuthenticated });
  const inventoryQuery = useInventory({ enabled: isAuthenticated });
  const ordersQuery = useOrders({ enabled: isAuthenticated });
  const profileQuery = useProfile(session?.user.id, { enabled: isAuthenticated });
  const settingsQuery = useSettings(session?.user.id, { enabled: isAuthenticated });

  const addProductMutation = useAddProductMutation();
  const updateProductMutation = useUpdateProductMutation();
  const archiveProductMutation = useArchiveProductMutation();
  const addLocationMutation = useAddLocationMutation();
  const updateLocationMutation = useUpdateLocationMutation();
  const addInventoryMutation = useAddInventoryMutation();
  const updateInventoryMutation = useUpdateInventoryMutation();
  const createOrderMutation = useCreateOrderMutation();
  const updateProfileMutation = useUpdateProfileMutation(session?.user.id);
  const updateSettingsMutation = useUpdateSettingsMutation(session?.user.id);

  const currentUser = useMemo<User>(() => {
    if (profileQuery.data) return profileQuery.data;
    if (session?.user) return mapSessionUser(session.user);
    return {
      id: 'anonymous',
      name: 'Guest',
      email: '',
      role: 'Guest',
    };
  }, [profileQuery.data, session?.user]);

  const settings = settingsQuery.data ?? defaultSettings;

  const state = useMemo<AppState>(
    () => ({
      inventory: inventoryQuery.data ?? [],
      orders: ordersQuery.data ?? [],
      products: productsQuery.data ?? [],
      locations: locationsQuery.data ?? [],
      isAuthenticated,
      currentUser,
      toasts,
      settings,
    }),
    [
      inventoryQuery.data,
      ordersQuery.data,
      productsQuery.data,
      locationsQuery.data,
      isAuthenticated,
      currentUser,
      toasts,
      settings,
    ]
  );

  const addToast = useCallback((type: Toast['type'], message: string) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const toast = { id, type, message };
    setToasts((prev) => [...prev, toast]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  const notifyMutationError = useCallback(
    (error: unknown, fallbackMessage: string) => {
      const message = normalizeMutationError(error, fallbackMessage);
      addToast('error', message);
    },
    [addToast]
  );

  useEffect(() => {
    if (productsQuery.error) notifyMutationError(productsQuery.error, 'Failed to load products.');
  }, [productsQuery.error, notifyMutationError]);

  useEffect(() => {
    if (locationsQuery.error) notifyMutationError(locationsQuery.error, 'Failed to load locations.');
  }, [locationsQuery.error, notifyMutationError]);

  useEffect(() => {
    if (inventoryQuery.error) notifyMutationError(inventoryQuery.error, 'Failed to load inventory.');
  }, [inventoryQuery.error, notifyMutationError]);

  useEffect(() => {
    if (ordersQuery.error) notifyMutationError(ordersQuery.error, 'Failed to load orders.');
  }, [ordersQuery.error, notifyMutationError]);

  useEffect(() => {
    if (profileQuery.error) notifyMutationError(profileQuery.error, 'Failed to load profile.');
  }, [profileQuery.error, notifyMutationError]);

  useEffect(() => {
    if (settingsQuery.error) notifyMutationError(settingsQuery.error, 'Failed to load settings.');
  }, [settingsQuery.error, notifyMutationError]);

  const dispatch = useCallback<React.Dispatch<AppAction>>(
    (action) => {
      switch (action.type) {
        case 'UPDATE_INVENTORY':
          updateInventoryMutation.mutate(
            {
              productId: action.productId,
              locationId: action.locationId,
              quantity: action.quantity,
            },
            {
              onError: (error) => notifyMutationError(error, 'Failed to update inventory.'),
            }
          );
          return;

        case 'ADD_INVENTORY':
          addInventoryMutation.mutate(action.item, {
            onError: (error) => notifyMutationError(error, 'Failed to add inventory entry.'),
          });
          return;

        case 'CREATE_ORDER': {
          const productThreshold =
            state.products.find((product) => product.id === action.order.productId)?.threshold ?? 20;

          createOrderMutation.mutate(
            {
              productId: action.order.productId,
              locationId: action.order.locationId,
              toLocationId: action.order.toLocationId ?? null,
              type: action.order.type,
              quantity: action.order.quantity,
              source: action.order.source,
              note: action.order.note,
              productThreshold,
            },
            {
              onSuccess: () => addToast('success', 'Order created'),
              onError: (error) => notifyMutationError(error, 'Failed to create order.'),
            }
          );
          return;
        }

        case 'ADD_PRODUCT':
          addProductMutation.mutate(
            {
              name: action.product.name,
              sku: action.product.sku,
              category: action.product.category,
              threshold: action.product.threshold,
              image_url: action.product.image_url ?? null,
            },
            {
              onError: (error) => notifyMutationError(error, 'Failed to add product.'),
            }
          );
          return;

        case 'UPDATE_PRODUCT':
          updateProductMutation.mutate(
            {
              ...action.product,
              isActive: action.product.isActive ?? true,
              image_url: action.product.image_url ?? null,
            },
            {
              onError: (error) => notifyMutationError(error, 'Failed to update product.'),
            }
          );
          return;

        case 'DELETE_PRODUCT':
          archiveProductMutation.mutate(action.productId, {
            onError: (error) => notifyMutationError(error, 'Failed to delete product.'),
          });
          return;

        case 'ADD_LOCATION':
          addLocationMutation.mutate(
            {
              name: action.location.name,
              type: action.location.type,
              city: action.location.city,
            },
            {
              onError: (error) => notifyMutationError(error, 'Failed to add location.'),
            }
          );
          return;

        case 'UPDATE_LOCATION':
          updateLocationMutation.mutate(
            {
              ...action.location,
              isActive: action.location.isActive ?? true,
            },
            {
              onError: (error) => notifyMutationError(error, 'Failed to update location.'),
            }
          );
          return;

        case 'ADD_TOAST':
          setToasts((prev) => [...prev, action.toast]);
          return;

        case 'REMOVE_TOAST':
          setToasts((prev) => prev.filter((toast) => toast.id !== action.id));
          return;

        case 'UPDATE_PROFILE':
          updateProfileMutation.mutate(
            {
              name: action.profile.name,
              email: action.profile.email,
            },
            {
              onError: (error) => notifyMutationError(error, 'Failed to update profile.'),
            }
          );
          return;

        case 'LOGIN':
          return;

        case 'LOGOUT':
          void supabase.auth.signOut().catch((error) => {
            notifyMutationError(error, 'Failed to sign out.');
          });
          return;

        case 'UPDATE_SETTINGS': {
          const mergedSettings: Settings = {
            ...settings,
            ...action.settings,
            notifications: {
              ...settings.notifications,
              ...(action.settings.notifications ?? {}),
            },
          };

          updateSettingsMutation.mutate(mergedSettings, {
            onError: (error) => notifyMutationError(error, 'Failed to update settings.'),
          });
          return;
        }

        default:
          return;
      }
    },
    [
      addToast,
      addInventoryMutation,
      addLocationMutation,
      addProductMutation,
      archiveProductMutation,
      createOrderMutation,
      notifyMutationError,
      state.products,
      settings,
      updateInventoryMutation,
      updateLocationMutation,
      updateProductMutation,
      updateProfileMutation,
      updateSettingsMutation,
    ]
  );

  const isDataLoading = isAuthenticated
    ? productsQuery.isPending ||
    locationsQuery.isPending ||
    inventoryQuery.isPending ||
    ordersQuery.isPending ||
    profileQuery.isPending ||
    settingsQuery.isPending
    : false;

  const value = useMemo(
    () => ({
      state,
      dispatch,
      addToast,
      isLoading: isAuthLoading || isDataLoading,
    }),
    [state, dispatch, addToast, isAuthLoading, isDataLoading]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}

export function useDerivedData() {
  const { state } = useApp();

  return useMemo(() => {
    const lowStockItems = state.inventory.filter((item) => item.quantity <= item.threshold);
    const totalStock = state.inventory.reduce((sum, item) => sum + item.quantity, 0);
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const todaysOrders = state.orders.filter(
      (order) => new Date(order.timestamp).getTime() >= todayStart
    );

    return {
      lowStockItems,
      totalStock,
      todaysOrders,
      totalSKUs: state.products.length,
      lowStockCount: lowStockItems.length,
      todaysOrderCount: todaysOrders.length,
      salesToday: todaysOrders.filter((order) => order.type === 'sale').length,
      restocksToday: todaysOrders.filter((order) => order.type === 'restock').length,
    };
  }, [state.inventory, state.orders, state.products]);
}

export function useCatalogMap() {
  const { state } = useApp();

  return useMemo(() => {
    const productById = new Map<string, Product>();
    const locationById = new Map<string, Location>();

    state.products.forEach((product) => productById.set(product.id, product));
    state.locations.forEach((location) => locationById.set(location.id, location));

    return { productById, locationById };
  }, [state.products, state.locations]);
}
