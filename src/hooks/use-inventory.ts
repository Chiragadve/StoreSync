import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { graphqlRequest } from '@/lib/graphql';
import type { InventoryItem } from '@/types';

const INVENTORY_QUERY = `
  query Inventory {
    inventory_itemsCollection {
      edges {
        node {
          id
          productId: product_id
          locationId: location_id
          quantity
          threshold
          lastUpdated: last_updated
        }
      }
    }
  }
`;

const INSERT_INVENTORY_MUTATION = `
  mutation InsertInventory(
    $productId: UUID!,
    $locationId: UUID!,
    $quantity: Int!
  ) {
    insertIntoinventory_itemsCollection(
      objects: [{
        product_id: $productId,
        location_id: $locationId,
        quantity: $quantity
      }]
    ) {
      records {
        id
      }
    }
  }
`;

const UPDATE_INVENTORY_MUTATION = `
  mutation UpdateInventory(
    $productId: UUID!,
    $locationId: UUID!,
    $quantity: Int!
  ) {
    updateinventory_itemsCollection(
      set: { quantity: $quantity }
      filter: { product_id: { eq: $productId }, location_id: { eq: $locationId } }
      atMost: 1
    ) {
      records {
        id
      }
    }
  }
`;

type InventoryRow = {
  id: string;
  productId: string;
  locationId: string;
  quantity: number;
  threshold: number;
  lastUpdated: string;
};

type InventoryCollectionResponse = {
  inventory_itemsCollection: {
    edges?: Array<{ node?: InventoryRow | null }>;
  } | null;
};

function toInventoryItem(row: InventoryRow): InventoryItem {
  return {
    id: row.id,
    productId: row.productId,
    locationId: row.locationId,
    quantity: row.quantity,
    threshold: row.threshold,
    lastUpdated: row.lastUpdated,
  };
}

export function useInventory(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['inventory'],
    enabled: options?.enabled ?? true,
    queryFn: async () => {
      const data = await graphqlRequest<InventoryCollectionResponse>(INVENTORY_QUERY);
      const edges = data.inventory_itemsCollection?.edges ?? [];
      return edges
        .map((edge) => edge.node)
        .filter(Boolean)
        .map((node) => toInventoryItem(node as InventoryRow));
    },
  });
}

export function useAddInventoryMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (item: InventoryItem) => {
      await graphqlRequest(INSERT_INVENTORY_MUTATION, {
        productId: item.productId,
        locationId: item.locationId,
        quantity: item.quantity,
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
  });
}

export function useUpdateInventoryMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      productId,
      locationId,
      quantity,
    }: {
      productId: string;
      locationId: string;
      quantity: number;
    }) => {
      await graphqlRequest(UPDATE_INVENTORY_MUTATION, {
        productId,
        locationId,
        quantity,
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
  });
}
