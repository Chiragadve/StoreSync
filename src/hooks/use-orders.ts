import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { graphqlRequest } from '@/lib/graphql';
import type { Order } from '@/types';

const ORDERS_QUERY = `
  query Orders {
    ordersCollection {
      edges {
        node {
          id
          productId: product_id
          locationId: location_id
          toLocationId: to_location_id
          type
          quantity
          source
          note
          timestamp
          product: products {
            name
            sku
          }
        }
      }
    }
  }
`;

const CREATE_ORDER_AND_APPLY_INVENTORY_MUTATION = `
  mutation CreateOrderAndApplyInventory(
    $productId: UUID!
    $locationId: UUID!
    $type: String!
    $quantity: Int!
    $source: String!
    $note: String!
  ) {
    create_order_and_apply_inventory_graphql(
      p_product_id: $productId
      p_location_id: $locationId
      p_type: $type
      p_quantity: $quantity
      p_source: $source
      p_note: $note
    )
  }
`;

const CREATE_TRANSFER_ORDER_AND_MOVE_INVENTORY_MUTATION = `
  mutation CreateTransferOrderAndMoveInventory(
    $productId: UUID!
    $fromLocationId: UUID!
    $toLocationId: UUID!
    $quantity: Int!
    $note: String!
    $source: String!
  ) {
    create_transfer_order_and_move_inventory_graphql(
      p_product_id: $productId
      p_from_location_id: $fromLocationId
      p_to_location_id: $toLocationId
      p_quantity: $quantity
      p_note: $note
      p_source: $source
    )
  }
`;

const INSERT_INVENTORY_ITEM_MUTATION = `
  mutation InsertInventoryItem(
    $productId: UUID!
    $locationId: UUID!
    $quantity: Int!
    $threshold: Int!
  ) {
    insertIntoinventory_itemsCollection(
      objects: [{
        product_id: $productId
        location_id: $locationId
        quantity: $quantity
        threshold: $threshold
      }]
    ) {
      records {
        id
      }
    }
  }
`;

type OrderRow = {
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
};

type OrdersCollectionResponse = {
  ordersCollection: {
    edges?: Array<{ node?: OrderRow | null }>;
  } | null;
};

function toOrder(row: OrderRow): Order {
  return {
    id: row.id,
    productId: row.productId,
    locationId: row.locationId,
    toLocationId: row.toLocationId ?? null,
    type: row.type,
    quantity: row.quantity,
    source: row.source,
    note: row.note,
    timestamp: row.timestamp,
    product: row.product ?? null,
  };
}

export function useOrders(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['orders'],
    enabled: options?.enabled ?? true,
    queryFn: async () => {
      const data = await graphqlRequest<OrdersCollectionResponse>(ORDERS_QUERY);
      const edges = data.ordersCollection?.edges ?? [];
      return edges
        .map((edge) => edge.node)
        .filter(Boolean)
        .map((node) => toOrder(node as OrderRow))
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    },
  });
}

export function useCreateOrderMutation() {
  const queryClient = useQueryClient();

  const getErrorMessage = (error: unknown) =>
    error instanceof Error ? error.message.toLowerCase() : '';

  const isMissingInventoryError = (error: unknown) => {
    return getErrorMessage(error).includes('inventory item not found');
  };

  const isDuplicateInventoryError = (error: unknown) => {
    const message = getErrorMessage(error);
    return message.includes('duplicate key value violates unique constraint');
  };

  return useMutation({
    mutationFn: async (order: Omit<Order, 'id' | 'timestamp' | 'product' | 'location'> & { productThreshold: number }) => {
      const note = order.note ?? '';

      const runCreateOrderMutation = async () => {
        await graphqlRequest(CREATE_ORDER_AND_APPLY_INVENTORY_MUTATION, {
          productId: order.productId,
          locationId: order.locationId,
          type: order.type,
          quantity: order.quantity,
          source: order.source,
          note,
        });
      };

      if (order.type === 'transfer') {
        if (!order.toLocationId) {
          throw new Error('To location is required for transfer orders.');
        }

        await graphqlRequest(CREATE_TRANSFER_ORDER_AND_MOVE_INVENTORY_MUTATION, {
          productId: order.productId,
          fromLocationId: order.locationId,
          toLocationId: order.toLocationId,
          quantity: order.quantity,
          note,
          source: order.source,
        });
        return;
      }

      try {
        await runCreateOrderMutation();
      } catch (error) {
        if (order.type !== 'restock' || !isMissingInventoryError(error)) throw error;

        const threshold =
          Number.isFinite(order.productThreshold) && order.productThreshold >= 0
            ? order.productThreshold
            : 20;

        try {
          await graphqlRequest(INSERT_INVENTORY_ITEM_MUTATION, {
            productId: order.productId,
            locationId: order.locationId,
            quantity: 0,
            threshold,
          });
        } catch (inventoryError) {
          if (!isDuplicateInventoryError(inventoryError)) {
            throw inventoryError;
          }
        }

        await runCreateOrderMutation();
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['orders'] });
      void queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
  });
}
