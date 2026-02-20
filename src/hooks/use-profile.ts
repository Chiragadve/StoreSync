import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { graphqlRequest } from '@/lib/graphql';
import { supabase } from '@/lib/supabase';
import type { User } from '@/types';

const PROFILE_QUERY = `
  query Profile($id: UUID!) {
    profilesCollection(filter: { id: { eq: $id } }, first: 1) {
      edges {
        node {
          id
          name
          email
          role
        }
      }
    }
  }
`;

const UPDATE_PROFILE_MUTATION = `
  mutation UpdateProfile($id: UUID!, $name: String!, $email: String!) {
    updateprofilesCollection(
      set: { name: $name, email: $email }
      filter: { id: { eq: $id } }
      atMost: 1
    ) {
      records {
        id
      }
    }
  }
`;

type ProfileRow = {
  id: string;
  name: string;
  email: string;
  role: string;
};

type ProfileResponse = {
  profilesCollection: {
    edges?: Array<{ node?: ProfileRow | null }>;
  } | null;
};

function toUser(row: ProfileRow): User {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
  };
}

export function useProfile(userId?: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['profile', userId],
    enabled: Boolean(userId) && (options?.enabled ?? true),
    queryFn: async () => {
      const data = await graphqlRequest<ProfileResponse>(PROFILE_QUERY, { id: userId });
      const node = data.profilesCollection?.edges?.[0]?.node;
      return node ? toUser(node) : null;
    },
  });
}

export function useUpdateProfileMutation(userId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: Pick<User, 'name' | 'email'>) => {
      if (!userId) throw new Error('No authenticated user found.');

      try {
        await graphqlRequest(UPDATE_PROFILE_MUTATION, {
          id: userId,
          name: profile.name,
          email: profile.email,
        });
      } catch {
        const { error } = await supabase.from('profiles').upsert({
          id: userId,
          name: profile.name,
          email: profile.email,
          role: 'Store Manager',
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['profile', userId] });
    },
  });
}
