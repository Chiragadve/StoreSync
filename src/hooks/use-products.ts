import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { graphqlRequest } from '@/lib/graphql';
import { supabase } from '@/lib/supabase';
import type { Product } from '@/types';

const PRODUCTS_QUERY = `
  query Products {
    productsCollection(filter: { is_active: { eq: true } }) {
      edges {
        node {
          id
          name
          sku
          category
          threshold
          isActive: is_active
        }
      }
    }
  }
`;

const INSERT_PRODUCT_MUTATION = `
  mutation InsertProduct($name: String!, $sku: String!, $category: String!, $threshold: Int!, $isActive: Boolean!) {
    insertIntoproductsCollection(
      objects: [{ name: $name, sku: $sku, category: $category, threshold: $threshold, is_active: $isActive }]
    ) {
      records {
        id
      }
    }
  }
`;

const UPDATE_PRODUCT_MUTATION = `
  mutation UpdateProduct($id: UUID!, $name: String!, $sku: String!, $category: String!, $threshold: Int!, $isActive: Boolean!) {
    updateproductsCollection(
      set: { name: $name, sku: $sku, category: $category, threshold: $threshold, is_active: $isActive }
      filter: { id: { eq: $id } }
      atMost: 1
    ) {
      records {
        id
      }
    }
  }
`;

type ProductRow = {
  id: string;
  name: string;
  sku: string;
  category: string;
  threshold: number;
  isActive: boolean;
};

type ProductCollectionResponse = {
  productsCollection: {
    edges?: Array<{ node?: ProductRow | null }>;
  } | null;
};

function toProduct(row: ProductRow): Product {
  return {
    id: row.id,
    name: row.name,
    sku: row.sku,
    category: row.category,
    threshold: row.threshold ?? 20,
    isActive: row.isActive ?? true,
  };
}

export function useProducts(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['products'],
    enabled: options?.enabled ?? true,
    queryFn: async () => {
      const data = await graphqlRequest<ProductCollectionResponse>(PRODUCTS_QUERY);
      const edges = data.productsCollection?.edges ?? [];
      return edges
        .map((edge) => edge.node)
        .filter(Boolean)
        .map((node) => toProduct(node as ProductRow));
    },
  });
}

export function useAddProductMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (product: Pick<Product, 'name' | 'sku' | 'category' | 'threshold'>) => {
      await graphqlRequest(INSERT_PRODUCT_MUTATION, {
        name: product.name,
        sku: product.sku,
        category: product.category,
        threshold: product.threshold,
        isActive: true,
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

export function useUpdateProductMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (product: Product) => {
      await graphqlRequest(UPDATE_PRODUCT_MUTATION, {
        id: product.id,
        name: product.name,
        sku: product.sku,
        category: product.category,
        threshold: product.threshold,
        isActive: product.isActive ?? true,
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

export function useArchiveProductMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (productId: string) => {
      const { error } = await supabase.rpc('archive_product_and_remove_inventory', {
        target_product_id: productId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['products'] });
      void queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
  });
}
