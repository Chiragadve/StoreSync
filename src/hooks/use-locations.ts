import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { graphqlRequest } from '@/lib/graphql';
import type { Location } from '@/types';

const LOCATIONS_QUERY = `
  query Locations {
    locationsCollection(filter: { is_active: { eq: true } }) {
      edges {
        node {
          id
          name
          type
          city
          isActive: is_active
        }
      }
    }
  }
`;

const INSERT_LOCATION_MUTATION = `
  mutation InsertLocation($name: String!, $type: location_type!, $city: String!, $isActive: Boolean!) {
    insertIntolocationsCollection(
      objects: [{ name: $name, type: $type, city: $city, is_active: $isActive }]
    ) {
      records {
        id
      }
    }
  }
`;

const UPDATE_LOCATION_MUTATION = `
  mutation UpdateLocation($id: UUID!, $name: String!, $type: location_type!, $city: String!, $isActive: Boolean!) {
    updatelocationsCollection(
      set: { name: $name, type: $type, city: $city, is_active: $isActive }
      filter: { id: { eq: $id } }
      atMost: 1
    ) {
      records {
        id
      }
    }
  }
`;

type LocationRow = {
  id: string;
  name: string;
  type: 'warehouse' | 'store' | 'online';
  city: string;
  isActive: boolean;
};

type LocationCollectionResponse = {
  locationsCollection: {
    edges?: Array<{ node?: LocationRow | null }>;
  } | null;
};

function toLocation(row: LocationRow): Location {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    city: row.city,
    isActive: row.isActive ?? true,
  };
}

export function useLocations(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['locations'],
    enabled: options?.enabled ?? true,
    queryFn: async () => {
      const data = await graphqlRequest<LocationCollectionResponse>(LOCATIONS_QUERY);
      const edges = data.locationsCollection?.edges ?? [];
      return edges
        .map((edge) => edge.node)
        .filter(Boolean)
        .map((node) => toLocation(node as LocationRow));
    },
  });
}

export function useAddLocationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (location: Pick<Location, 'name' | 'type' | 'city'>) => {
      await graphqlRequest(INSERT_LOCATION_MUTATION, {
        name: location.name,
        type: location.type,
        city: location.city,
        isActive: true,
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['locations'] });
    },
  });
}

export function useUpdateLocationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (location: Location) => {
      await graphqlRequest(UPDATE_LOCATION_MUTATION, {
        id: location.id,
        name: location.name,
        type: location.type,
        city: location.city,
        isActive: location.isActive ?? true,
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['locations'] });
    },
  });
}
