export interface Location {
  id: string;
  name: string;
  type: 'warehouse' | 'store' | 'online';
  city: string;
  isActive: boolean;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  threshold: number;
  isActive: boolean;
  image_url?: string | null;
  fynd_sync_status?: string | null;
  fynd_synced_at?: string | null;
}

export interface InventoryItem {
  id?: string;
  productId: string;
  locationId: string;
  quantity: number;
  threshold: number;
  lastUpdated: string;
}

export interface Order {
  id: string;
  productId: string;
  locationId: string;
  toLocationId?: string | null;
  type: 'sale' | 'restock' | 'transfer';
  quantity: number;
  source: 'manual' | 'ai';
  note: string;
  timestamp: string;
  product?: { name: string; sku: string } | null;
  location?: { name: string } | null;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
}

export interface Settings {
  notifications: {
    lowStock: boolean;
    orderConfirmations: boolean;
    dailySummary: boolean;
    aiActions: boolean;
  };
  accentColor: string;
  density: 'comfortable' | 'compact';
}

export interface AppState {
  inventory: InventoryItem[];
  orders: Order[];
  products: Product[];
  locations: Location[];
  isAuthenticated: boolean;
  currentUser: User;
  toasts: Toast[];
  settings: Settings;
}

export type AppAction =
  | { type: 'UPDATE_INVENTORY'; productId: string; locationId: string; quantity: number }
  | { type: 'ADD_INVENTORY'; item: InventoryItem }
  | { type: 'CREATE_ORDER'; order: Order }
  | { type: 'ADD_PRODUCT'; product: Product }
  | { type: 'UPDATE_PRODUCT'; product: Product }
  | { type: 'DELETE_PRODUCT'; productId: string }
  | { type: 'ADD_LOCATION'; location: Location }
  | { type: 'UPDATE_LOCATION'; location: Location }
  | { type: 'ADD_TOAST'; toast: Toast }
  | { type: 'REMOVE_TOAST'; id: string }
  | { type: 'UPDATE_PROFILE'; profile: Pick<User, 'name' | 'email'> }
  | { type: 'LOGIN' }
  | { type: 'LOGOUT' }
  | { type: 'UPDATE_SETTINGS'; settings: Partial<AppState['settings']> };
