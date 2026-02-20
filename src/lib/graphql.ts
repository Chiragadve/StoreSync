import { assertSupabaseConfigured, getSupabaseEnv, supabase } from '@/lib/supabase';

interface GraphQLError {
  message: string;
}

interface GraphQLResponse<TData> {
  data?: TData;
  errors?: GraphQLError[];
}

type GraphQLCollection<TNode> = {
  edges?: Array<{ node?: TNode | null }>;
  nodes?: Array<TNode | null>;
} | null;

function getOperationName(query: string): string {
  const trimmed = query
    .split('\n')
    .map((line) => line.trim())
    .find((line) => line.length > 0);

  if (!trimmed) return 'anonymous';

  const match = /^(query|mutation|subscription)\s+([A-Za-z_][A-Za-z0-9_]*)/.exec(trimmed);
  return match?.[2] ?? 'anonymous';
}

export async function graphqlRequest<
  TData,
  TVariables extends Record<string, unknown> = Record<string, unknown>,
>(query: string, variables?: TVariables, accessToken?: string): Promise<TData> {
  const operationName = getOperationName(query);
  assertSupabaseConfigured();
  const { supabaseUrl, supabaseAnonKey } = getSupabaseEnv();
  const endpoint = `${supabaseUrl.replace(/\/$/, '')}/graphql/v1`;

  const token =
    accessToken ?? (await supabase.auth.getSession()).data.session?.access_token ?? null;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    apikey: supabaseAnonKey,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query, variables }),
  });

  const payload = (await response.json()) as GraphQLResponse<TData>;

  if (!response.ok) {
    const message = payload.errors?.map((e) => e.message).join('; ') || response.statusText;
    throw new Error(
      `[GraphQL:${operationName}] request failed (${response.status} ${response.statusText}): ${message}`
    );
  }

  if (payload.errors?.length) {
    throw new Error(`[GraphQL:${operationName}] ${payload.errors.map((e) => e.message).join('; ')}`);
  }

  if (!payload.data) {
    throw new Error(`[GraphQL:${operationName}] response did not include data.`);
  }

  return payload.data;
}

export function readCollection<TNode>(collection: GraphQLCollection<TNode>): TNode[] {
  if (!collection) return [];

  if (Array.isArray(collection.nodes)) {
    return collection.nodes.filter(Boolean) as TNode[];
  }

  if (Array.isArray(collection.edges)) {
    return collection.edges
      .map((edge) => edge.node)
      .filter(Boolean) as TNode[];
  }

  return [];
}
