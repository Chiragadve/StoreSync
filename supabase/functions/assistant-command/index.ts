import { createClient, type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

type AssistantRunStatus =
  | 'needs_clarification'
  | 'needs_confirmation'
  | 'executed'
  | 'failed'
  | 'read_only_response';

type AssistantFailureCode =
  | 'SUPABASE_ENV_MISSING'
  | 'AUTH_HEADER_MISSING'
  | 'AUTH_USER_UNRESOLVED'
  | 'WORKSPACE_UNAVAILABLE'
  | 'INVALID_JSON'
  | 'UNSUPPORTED_MODE'
  | 'RUN_INIT_FAILED';

type ReadQueryIntent = 'low_stock' | 'inventory_summary' | 'stock_by_product' | 'location_snapshot';

type AssistantAction =
  | {
    kind: 'product.create';
    name: string;
    sku?: string;
    category: string;
    threshold?: number;
  }
  | {
    kind: 'product.update';
    product_ref: string;
    name?: string;
    sku?: string;
    category?: string;
    threshold?: number;
    is_active?: boolean;
  }
  | { kind: 'product.archive'; product_ref: string }
  | {
    kind: 'location.create';
    name: string;
    type: 'warehouse' | 'store' | 'online';
    city: string;
  }
  | {
    kind: 'location.update';
    location_ref: string;
    name?: string;
    type?: 'warehouse' | 'store' | 'online';
    city?: string;
    is_active?: boolean;
  }
  | { kind: 'location.deactivate'; location_ref: string }
  | {
    kind: 'inventory.create_entry';
    product_ref: string;
    location_ref: string;
    quantity: number;
  }
  | {
    kind: 'inventory.set_quantity';
    product_ref: string;
    location_ref: string;
    quantity: number;
  }
  | {
    kind: 'order.create_sale';
    product_ref: string;
    location_ref: string;
    quantity: number;
    note?: string;
  }
  | {
    kind: 'order.create_restock';
    product_ref: string;
    location_ref: string;
    quantity: number;
    note?: string;
  }
  | {
    kind: 'order.create_transfer';
    product_ref: string;
    from_location_ref: string;
    to_location_ref: string;
    quantity: number;
    note?: string;
  }
  | {
    kind: 'read.query';
    intent: ReadQueryIntent;
    product_ref?: string;
    location_ref?: string;
  };

type ResolvedAction =
  | {
    kind: 'product.create';
    name: string;
    sku?: string;
    category: string;
    threshold: number;
    summary: string;
    warnings: string[];
  }
  | {
    kind: 'product.update';
    product_id: string;
    name?: string;
    sku?: string;
    category?: string;
    threshold?: number;
    is_active?: boolean;
    summary: string;
    warnings: string[];
  }
  | { kind: 'product.archive'; product_id: string; summary: string; warnings: string[] }
  | {
    kind: 'location.create';
    name: string;
    type: 'warehouse' | 'store' | 'online';
    city: string;
    summary: string;
    warnings: string[];
  }
  | {
    kind: 'location.update';
    location_id: string;
    name?: string;
    type?: 'warehouse' | 'store' | 'online';
    city?: string;
    is_active?: boolean;
    summary: string;
    warnings: string[];
  }
  | { kind: 'location.deactivate'; location_id: string; summary: string; warnings: string[] }
  | {
    kind: 'inventory.create_entry';
    product_id: string;
    location_id: string;
    quantity: number;
    summary: string;
    warnings: string[];
  }
  | {
    kind: 'inventory.set_quantity';
    product_id: string;
    location_id: string;
    quantity: number;
    summary: string;
    warnings: string[];
  }
  | {
    kind: 'order.create_sale';
    product_id: string;
    location_id: string;
    quantity: number;
    note: string;
    summary: string;
    warnings: string[];
  }
  | {
    kind: 'order.create_restock';
    product_id: string;
    location_id: string;
    quantity: number;
    note: string;
    summary: string;
    warnings: string[];
  }
  | {
    kind: 'order.create_transfer';
    product_id: string;
    from_location_id: string;
    to_location_id: string;
    quantity: number;
    note: string;
    summary: string;
    warnings: string[];
  }
  | {
    kind: 'read.query';
    intent: ReadQueryIntent;
    product_id?: string;
    location_id?: string;
    summary: string;
    warnings: string[];
  };

interface PlanRequestBody {
  mode: 'plan';
  message: string;
  conversationId?: string;
}

interface ExecuteRequestBody {
  mode: 'execute';
  runId: string;
}

interface CatalogProduct {
  id: string;
  name: string;
  sku: string;
  category: string;
  threshold: number;
  is_active: boolean;
}

interface CatalogLocation {
  id: string;
  name: string;
  type: 'warehouse' | 'store' | 'online';
  city: string;
  is_active: boolean;
}

interface CatalogData {
  products: CatalogProduct[];
  locations: CatalogLocation[];
}

interface AssistantResponse {
  runId?: string;
  status: AssistantRunStatus;
  code?: AssistantFailureCode | string;
  assistantMessage: string;
  actionPreview?: {
    kind: string;
    summary: string;
    warnings: string[];
  };
  clarification?: {
    reason: string;
    options?: Array<{ label: string; value: string }>;
  };
  readResult?: {
    rows: Array<Record<string, JsonValue>>;
    chartData?: {
      type: 'bar' | 'pie';
      label?: string;
      data: Array<Record<string, JsonValue>>;
    };
  };
  execution?: {
    succeeded: boolean;
    kind?: string;
    message?: string;
    affected?: Record<string, JsonValue>;
  };
}

const CORS_HEADERS: HeadersInit = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');
const GROK_API_KEY = Deno.env.get('GROK_API_KEY');
const GROK_MODEL = Deno.env.get('GROK_MODEL') ?? 'grok-3-mini';
const GROK_API_URL = Deno.env.get('GROK_API_URL') ?? 'https://api.x.ai/v1/chat/completions';
const AI_ASSISTANT_WRITES_ENABLED =
  (Deno.env.get('AI_ASSISTANT_WRITES_ENABLED') ?? 'false').toLowerCase() === 'true';

const MAX_PROMPT_LENGTH = 1200;
const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 20;

const MUTATING_KINDS = new Set<string>([
  'product.create',
  'product.update',
  'product.archive',
  'location.create',
  'location.update',
  'location.deactivate',
  'inventory.create_entry',
  'inventory.set_quantity',
  'order.create_sale',
  'order.create_restock',
  'order.create_transfer',
]);

const PRODUCTS_QUERY = `
  query AssistantProducts {
    productsCollection {
      edges {
        node {
          id
          name
          sku
          category
          threshold
          is_active
        }
      }
    }
  }
`;

const LOCATIONS_QUERY = `
  query AssistantLocations {
    locationsCollection {
      edges {
        node {
          id
          name
          type
          city
          is_active
        }
      }
    }
  }
`;

const INVENTORY_ITEM_QUERY = `
  query AssistantInventoryItem($productId: UUID!, $locationId: UUID!) {
    inventory_itemsCollection(
      filter: {
        product_id: { eq: $productId }
        location_id: { eq: $locationId }
      }
      first: 1
    ) {
      edges {
        node {
          id
          quantity
          threshold
        }
      }
    }
  }
`;

const INVENTORY_WITH_RELATIONS_QUERY = `
  query AssistantInventoryWithRelations {
    inventory_itemsCollection {
      edges {
        node {
          id
          product_id
          location_id
          quantity
          threshold
          products {
            id
            name
            sku
            category
          }
          locations {
            id
            name
            type
            city
          }
        }
      }
    }
  }
`;

const INSERT_PRODUCT_MUTATION = `
  mutation AssistantInsertProduct($name: String!, $sku: String!, $category: String!, $threshold: Int!, $isActive: Boolean!) {
    insertIntoproductsCollection(
      objects: [{ name: $name, sku: $sku, category: $category, threshold: $threshold, is_active: $isActive }]
    ) {
      records {
        id
        name
        sku
      }
    }
  }
`;

const UPDATE_PRODUCT_MUTATION = `
  mutation AssistantUpdateProduct($id: UUID!, $name: String!, $sku: String!, $category: String!, $threshold: Int!, $isActive: Boolean!) {
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

const ARCHIVE_PRODUCT_MUTATION = `
  mutation AssistantArchiveProduct($productId: UUID!) {
    archive_product_and_remove_inventory_graphql(target_product_id: $productId)
  }
`;

const INSERT_LOCATION_MUTATION = `
  mutation AssistantInsertLocation($name: String!, $type: location_type!, $city: String!, $isActive: Boolean!) {
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
  mutation AssistantUpdateLocation($id: UUID!, $name: String!, $type: location_type!, $city: String!, $isActive: Boolean!) {
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

const INSERT_INVENTORY_MUTATION = `
  mutation AssistantInsertInventory($productId: UUID!, $locationId: UUID!, $quantity: Int!) {
    insertIntoinventory_itemsCollection(
      objects: [{ product_id: $productId, location_id: $locationId, quantity: $quantity }]
    ) {
      records {
        id
      }
    }
  }
`;

const UPDATE_INVENTORY_MUTATION = `
  mutation AssistantUpdateInventory($productId: UUID!, $locationId: UUID!, $quantity: Int!) {
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

const CREATE_ORDER_MUTATION = `
  mutation AssistantCreateOrder($productId: UUID!, $locationId: UUID!, $type: String!, $quantity: Int!, $source: String!, $note: String!) {
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

const CREATE_TRANSFER_ORDER_MUTATION = `
  mutation AssistantCreateTransferOrder($productId: UUID!, $fromLocationId: UUID!, $toLocationId: UUID!, $quantity: Int!, $note: String!, $source: String!) {
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
Deno.serve(async (request: Request): Promise<Response> => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('[assistant-command] missing Supabase env vars');
    return failedResponse(
      'SUPABASE_ENV_MISSING',
      'Supabase environment is not configured for assistant execution.',
      500
    );
  }

  const authHeader = request.headers.get('Authorization') ?? '';
  if (!authHeader.startsWith('Bearer ')) {
    console.error('[assistant-command] missing bearer auth header');
    return failedResponse('AUTH_HEADER_MISSING', 'Missing authenticated session.', 401);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });

  const userResult = await supabase.auth.getUser();
  const userId = userResult.data.user?.id;
  if (!userId || userResult.error) {
    console.error('[assistant-command] failed to resolve auth user', {
      hasUser: Boolean(userResult.data.user?.id),
      error: userResult.error?.message ?? null,
    });
    return failedResponse(
      'AUTH_USER_UNRESOLVED',
      'Unable to resolve authenticated user session.',
      401
    );
  }

  const workspaceResult = await supabase.rpc('current_workspace_id');
  const workspaceId = normalizeRpcScalar(workspaceResult.data);
  if (!workspaceId || workspaceResult.error) {
    console.error('[assistant-command] missing workspace context', {
      userId,
      workspaceRaw: workspaceResult.data ?? null,
      error: workspaceResult.error?.message ?? null,
    });
    return failedResponse(
      'WORKSPACE_UNAVAILABLE',
      'Workspace context is not available for this user.',
      403
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    console.error('[assistant-command] invalid json payload');
    return failedResponse('INVALID_JSON', 'Invalid JSON payload.', 400);
  }

  if (isPlanRequest(body)) {
    return handlePlanRequest({
      supabase,
      authHeader,
      userId,
      workspaceId,
      body,
    });
  }

  if (isExecuteRequest(body)) {
    return handleExecuteRequest({
      supabase,
      authHeader,
      body,
    });
  }

  return failedResponse(
    'UNSUPPORTED_MODE',
    'Unsupported mode. Use "plan" or "execute".',
    400
  );
});

async function handlePlanRequest(params: {
  supabase: SupabaseClient;
  authHeader: string;
  userId: string;
  workspaceId: string;
  body: PlanRequestBody;
}): Promise<Response> {
  const { supabase, authHeader, userId, workspaceId, body } = params;
  const prompt = body.message.trim();

  if (!prompt) {
    return jsonResponse({ status: 'failed', assistantMessage: 'Please enter a prompt.' }, 400);
  }

  if (prompt.length > MAX_PROMPT_LENGTH) {
    return jsonResponse(
      {
        status: 'failed',
        assistantMessage: `Prompt is too long. Keep it within ${MAX_PROMPT_LENGTH} characters.`,
      },
      400
    );
  }

  const rateLimitMessage = await checkRateLimit(supabase, userId);
  if (rateLimitMessage) {
    return jsonResponse({ status: 'failed', assistantMessage: rateLimitMessage }, 429);
  }

  const runInsert = await supabase
    .from('ai_command_runs')
    .insert({
      workspace_id: workspaceId,
      user_id: userId,
      conversation_id: body.conversationId ?? null,
      prompt,
      model: GROK_MODEL,
      status: 'processing',
    })
    .select('id')
    .single();

  if (runInsert.error || !runInsert.data?.id) {
    console.error('[assistant-command] failed to initialize ai_command_run', {
      userId,
      workspaceId,
      error: runInsert.error?.message ?? null,
    });
    return failedResponse('RUN_INIT_FAILED', 'Unable to initialize assistant run.', 500);
  }

  const runId = String(runInsert.data.id);

  try {
    if (looksLikeOrderEditOrDelete(prompt)) {
      const message =
        'Orders are immutable. I can create compensating orders (sale/restock/transfer), but I cannot edit or delete existing orders.';
      await finalizeRun(supabase, runId, {
        status: 'needs_clarification',
        assistant_message: message,
        clarification: {
          reason: message,
        },
      });

      return jsonResponse({
        runId,
        status: 'needs_clarification',
        assistantMessage: message,
        clarification: {
          reason: message,
          options: [
            { label: 'Compensating restock', value: 'Create restock order for [qty] [product] at [location]' },
            { label: 'Transfer stock', value: 'Create transfer order for [qty] [product] from [A] to [B]' },
          ],
        },
      });
    }

    if (!GROK_API_KEY) {
      const message = 'Set GROK_API_KEY in Supabase Edge Function secrets before using the AI assistant.';
      await finalizeRun(supabase, runId, {
        status: 'failed',
        assistant_message: message,
        error: message,
      });
      return jsonResponse({ runId, status: 'failed', assistantMessage: message });
    }

    const catalog = await fetchCatalog(authHeader);
    const modelPlan = await generateModelPlan(prompt, catalog);
    const actions = parseActions(modelPlan.actions ?? []);

    if (!actions.length) {
      const message =
        modelPlan.assistant_message?.trim() ||
        'I could not map that request to a supported action. Try including product/location/quantity details.';
      await finalizeRun(supabase, runId, {
        status: 'needs_clarification',
        assistant_message: message,
        clarification: { reason: message },
        normalized_intent: { raw: modelPlan },
      });
      return jsonResponse({
        runId,
        status: 'needs_clarification',
        assistantMessage: message,
        clarification: { reason: message },
      });
    }

    const mutatingCount = actions.filter((action) => MUTATING_KINDS.has(action.kind)).length;
    if (mutatingCount > 1) {
      const message = 'Please request only one write action per prompt. I can safely execute one mutating action at a time.';
      await finalizeRun(supabase, runId, {
        status: 'needs_clarification',
        assistant_message: message,
        clarification: { reason: message },
        normalized_intent: { actions: actions as unknown as JsonValue },
      });
      await insertActionRows(supabase, runId, workspaceId, userId, actions, [], 'planned');
      return jsonResponse({
        runId,
        status: 'needs_clarification',
        assistantMessage: message,
        clarification: { reason: message },
      });
    }

    const resolution = resolveAction(actions[0], catalog);
    if (resolution.status === 'needs_clarification') {
      await finalizeRun(supabase, runId, {
        status: 'needs_clarification',
        assistant_message: resolution.message,
        clarification: {
          reason: resolution.message,
          options: resolution.options as unknown as JsonValue,
        },
        normalized_intent: { actions: actions as unknown as JsonValue },
      });
      await insertActionRows(supabase, runId, workspaceId, userId, actions, [], 'planned');
      return jsonResponse({
        runId,
        status: 'needs_clarification',
        assistantMessage: resolution.message,
        clarification: { reason: resolution.message, options: resolution.options },
      });
    }

    const resolvedAction = resolution.action;
    const validation = await preflightValidateAction(authHeader, resolvedAction, catalog);
    if (!validation.ok) {
      const validationMessage =
        'message' in validation ? validation.message : 'Preflight validation failed.';
      await finalizeRun(supabase, runId, {
        status: 'failed',
        assistant_message: validationMessage,
        error: validationMessage,
        normalized_intent: {
          actions: actions as unknown as JsonValue,
          resolved_action: resolvedAction as unknown as JsonValue,
        },
      });
      await insertActionRows(
        supabase,
        runId,
        workspaceId,
        userId,
        actions,
        [resolvedAction],
        'failed',
        validationMessage
      );
      return jsonResponse({ runId, status: 'failed', assistantMessage: validationMessage });
    }

    if (resolvedAction.kind === 'read.query') {
      const read = await executeReadAction(authHeader, resolvedAction);
      await finalizeRun(supabase, runId, {
        status: 'read_only_response',
        assistant_message: read.message,
        execution_result: read.payload as unknown as JsonValue,
        normalized_intent: {
          actions: actions as unknown as JsonValue,
          resolved_action: resolvedAction as unknown as JsonValue,
        },
      });
      await insertActionRows(supabase, runId, workspaceId, userId, actions, [resolvedAction], 'executed', null, read.payload);
      return jsonResponse({
        runId,
        status: 'read_only_response',
        assistantMessage: read.message,
        readResult: read.payload,
      });
    }

    if (!AI_ASSISTANT_WRITES_ENABLED) {
      const message =
        'AI write execution is disabled. Set AI_ASSISTANT_WRITES_ENABLED=true in edge function secrets to enable writes.';
      await finalizeRun(supabase, runId, {
        status: 'failed',
        assistant_message: message,
        error: message,
      });
      await insertActionRows(supabase, runId, workspaceId, userId, actions, [resolvedAction], 'failed', message);
      return jsonResponse({ runId, status: 'failed', assistantMessage: message });
    }

    const assistantMessage =
      modelPlan.assistant_message?.trim() || `Prepared one action: ${resolvedAction.summary}. Confirm to execute.`;

    await finalizeRun(supabase, runId, {
      status: 'needs_confirmation',
      assistant_message: assistantMessage,
      normalized_intent: {
        actions: actions as unknown as JsonValue,
        resolved_action: resolvedAction as unknown as JsonValue,
      },
    });
    await insertActionRows(supabase, runId, workspaceId, userId, actions, [resolvedAction], 'validated');

    return jsonResponse({
      runId,
      status: 'needs_confirmation',
      assistantMessage,
      actionPreview: {
        kind: resolvedAction.kind,
        summary: resolvedAction.summary,
        warnings: resolvedAction.warnings,
      },
    });
  } catch (error) {
    const message = toErrorMessage(error, 'Assistant planning failed.');
    await finalizeRun(supabase, runId, {
      status: 'failed',
      assistant_message: message,
      error: message,
    });
    return jsonResponse({ runId, status: 'failed', assistantMessage: message });
  }
}

async function handleExecuteRequest(params: {
  supabase: SupabaseClient;
  authHeader: string;
  body: ExecuteRequestBody;
}): Promise<Response> {
  const { supabase, authHeader, body } = params;
  const runId = body.runId.trim();

  if (!runId) {
    return jsonResponse({ status: 'failed', assistantMessage: 'Missing runId.' }, 400);
  }

  const runResult = await supabase
    .from('ai_command_runs')
    .select('id,status,execution_result')
    .eq('id', runId)
    .single();

  if (runResult.error || !runResult.data) {
    return jsonResponse({ status: 'failed', assistantMessage: 'Assistant run not found.' }, 404);
  }

  const status = String(runResult.data.status);
  if (status === 'executed') {
    return jsonResponse({
      runId,
      status: 'executed',
      assistantMessage: 'This run was already executed.',
      execution: {
        succeeded: true,
        message: 'Already executed.',
        affected: (runResult.data.execution_result as Record<string, JsonValue>) ?? {},
      },
    });
  }

  if (status !== 'needs_confirmation') {
    return jsonResponse({
      runId,
      status: 'failed',
      assistantMessage: `Run is not executable in status "${status}".`,
    }, 400);
  }

  const actionRowResult = await supabase
    .from('ai_command_actions')
    .select('id,resolved_payload')
    .eq('run_id', runId)
    .order('action_index', { ascending: true })
    .limit(1)
    .single();

  if (actionRowResult.error || !actionRowResult.data) {
    await finalizeRun(supabase, runId, {
      status: 'failed',
      assistant_message: 'No executable action found for this run.',
      error: 'Missing action row.',
    });
    return jsonResponse({
      runId,
      status: 'failed',
      assistantMessage: 'No executable action found for this run.',
    }, 400);
  }

  const resolvedAction = decodeResolvedAction(actionRowResult.data.resolved_payload);
  if (!resolvedAction || resolvedAction.kind === 'read.query') {
    await finalizeRun(supabase, runId, {
      status: 'failed',
      assistant_message: 'Run does not contain a valid mutating action.',
      error: 'Invalid resolved action payload.',
    });
    await finalizeActionRow(supabase, String(actionRowResult.data.id), {
      status: 'failed',
      error: 'Invalid resolved action payload.',
    });
    return jsonResponse({
      runId,
      status: 'failed',
      assistantMessage: 'Run does not contain a valid mutating action.',
    }, 400);
  }

  if (!AI_ASSISTANT_WRITES_ENABLED) {
    const message =
      'AI write execution is disabled. Set AI_ASSISTANT_WRITES_ENABLED=true in edge function secrets.';
    await finalizeRun(supabase, runId, { status: 'failed', assistant_message: message, error: message });
    await finalizeActionRow(supabase, String(actionRowResult.data.id), {
      status: 'failed',
      error: message,
    });
    return jsonResponse({ runId, status: 'failed', assistantMessage: message });
  }

  try {
    const catalog = await fetchCatalog(authHeader);
    const validation = await preflightValidateAction(authHeader, resolvedAction, catalog);
    if (!validation.ok) {
      const validationMessage =
        'message' in validation ? validation.message : 'Preflight validation failed.';
      await finalizeRun(supabase, runId, {
        status: 'failed',
        assistant_message: validationMessage,
        error: validationMessage,
      });
      await finalizeActionRow(supabase, String(actionRowResult.data.id), {
        status: 'failed',
        error: validationMessage,
      });
      return jsonResponse({ runId, status: 'failed', assistantMessage: validationMessage });
    }

    const execution = await executeMutatingAction(authHeader, resolvedAction, catalog);

    await finalizeActionRow(supabase, String(actionRowResult.data.id), {
      status: 'executed',
      result: execution as unknown as JsonValue,
    });
    await finalizeRun(supabase, runId, {
      status: 'executed',
      assistant_message: execution.message,
      confirmed_at: new Date().toISOString(),
      executed_at: new Date().toISOString(),
      execution_result: execution as unknown as JsonValue,
    });

    return jsonResponse({
      runId,
      status: 'executed',
      assistantMessage: execution.message,
      execution: {
        succeeded: true,
        kind: resolvedAction.kind,
        message: execution.message,
        affected: execution.affected,
      },
    });
  } catch (error) {
    const message = toErrorMessage(error, 'Execution failed.');
    await finalizeRun(supabase, runId, { status: 'failed', assistant_message: message, error: message });
    await finalizeActionRow(supabase, String(actionRowResult.data.id), {
      status: 'failed',
      error: message,
    });
    return jsonResponse({
      runId,
      status: 'failed',
      assistantMessage: message,
      execution: {
        succeeded: false,
        kind: resolvedAction.kind,
        message,
      },
    });
  }
}
async function checkRateLimit(supabase: SupabaseClient, userId: string): Promise<string | null> {
  const sinceIso = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString();
  const result = await supabase
    .from('ai_command_runs')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', sinceIso);

  if (result.error) return null;
  if ((result.count ?? 0) >= RATE_LIMIT_MAX_REQUESTS) {
    return `Rate limit reached. Try again in a few minutes (max ${RATE_LIMIT_MAX_REQUESTS} prompts per 5 minutes).`;
  }
  return null;
}

async function fetchCatalog(authHeader: string): Promise<CatalogData> {
  const productsResponse = await graphqlRequest<{
    productsCollection: { edges?: Array<{ node?: CatalogProduct | null }> } | null;
  }>(authHeader, PRODUCTS_QUERY);

  const locationsResponse = await graphqlRequest<{
    locationsCollection: { edges?: Array<{ node?: CatalogLocation | null }> } | null;
  }>(authHeader, LOCATIONS_QUERY);

  return {
    products: readCollection(productsResponse.productsCollection).map((product) => ({
      ...product,
      threshold: Number.isFinite(product.threshold) ? Number(product.threshold) : 20,
    })),
    locations: readCollection(locationsResponse.locationsCollection),
  };
}

async function generateModelPlan(prompt: string, catalog: CatalogData): Promise<{ assistant_message?: string; actions?: unknown[] }> {
  const productHints = catalog.products
    .slice(0, 50)
    .map((product) => `${product.name} [${product.sku}]`)
    .join(', ');

  const locationHints = catalog.locations
    .slice(0, 50)
    .map((location) => `${location.name} (${location.type})`)
    .join(', ');

  const systemPrompt = `
You are an operations intent parser for StoreSync.
Return strict JSON only with this shape:
{
  "assistant_message": "short message",
  "actions": [ ... ]
}

Allowed kinds:
product.create, product.update, product.archive,
location.create, location.update, location.deactivate,
inventory.create_entry, inventory.set_quantity,
order.create_sale, order.create_restock, order.create_transfer,
read.query

read.query intent must be one of:
low_stock, inventory_summary, stock_by_product, location_snapshot

Rules:
1) Return at most one mutating action.
2) Use product_ref/location_ref names or sku references only.
3) Never output SQL, GraphQL, markdown, or IDs.

Catalog products: ${productHints || 'none'}
Catalog locations: ${locationHints || 'none'}
`.trim();

  const response = await fetch(GROK_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${GROK_API_KEY}`,
    },
    body: JSON.stringify({
      model: GROK_MODEL,
      temperature: 0.1,
      max_tokens: 700,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
    }),
  });

  const payload = await response.json();
  if (!response.ok) {
    const message =
      typeof payload?.error?.message === 'string' ? payload.error.message : response.statusText;
    throw new Error(`LLM request failed: ${message}`);
  }

  const text = String(payload?.choices?.[0]?.message?.content ?? '').trim();
  if (!text) {
    throw new Error('LLM returned an empty response.');
  }

  const parsed = parseJsonFromModel(text);
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('LLM response could not be parsed as JSON.');
  }

  return parsed as { assistant_message?: string; actions?: unknown[] };
}

function parseActions(rawActions: unknown[]): AssistantAction[] {
  const actions: AssistantAction[] = [];
  for (const rawAction of rawActions) {
    const parsed = parseAction(rawAction);
    if (parsed) actions.push(parsed);
  }
  return actions;
}

function parseAction(value: unknown): AssistantAction | null {
  if (!value || typeof value !== 'object') return null;
  const record = value as Record<string, unknown>;
  const kind = asString(record.kind);
  if (!kind) return null;

  switch (kind) {
    case 'product.create': {
      const name = asString(record.name);
      const category = asString(record.category);
      if (!name || !category) return null;
      return {
        kind,
        name,
        category,
        sku: asString(record.sku) || undefined,
        threshold: asNumber(record.threshold) ?? undefined,
      };
    }
    case 'product.update': {
      const productRef = asString(record.product_ref);
      if (!productRef) return null;
      return {
        kind,
        product_ref: productRef,
        name: asString(record.name) || undefined,
        sku: asString(record.sku) || undefined,
        category: asString(record.category) || undefined,
        threshold: asNumber(record.threshold) ?? undefined,
        is_active: asBoolean(record.is_active) ?? undefined,
      };
    }
    case 'product.archive': {
      const productRef = asString(record.product_ref);
      if (!productRef) return null;
      return { kind, product_ref: productRef };
    }
    case 'location.create': {
      const name = asString(record.name);
      const city = asString(record.city);
      const type = asLocationType(record.type);
      if (!name || !city || !type) return null;
      return { kind, name, city, type };
    }
    case 'location.update': {
      const locationRef = asString(record.location_ref);
      if (!locationRef) return null;
      return {
        kind,
        location_ref: locationRef,
        name: asString(record.name) || undefined,
        type: asLocationType(record.type) || undefined,
        city: asString(record.city) || undefined,
        is_active: asBoolean(record.is_active) ?? undefined,
      };
    }
    case 'location.deactivate': {
      const locationRef = asString(record.location_ref);
      if (!locationRef) return null;
      return { kind, location_ref: locationRef };
    }
    case 'inventory.create_entry':
    case 'inventory.set_quantity': {
      const productRef = asString(record.product_ref);
      const locationRef = asString(record.location_ref);
      const quantity = asNumber(record.quantity);
      if (!productRef || !locationRef || quantity === null) return null;
      return { kind, product_ref: productRef, location_ref: locationRef, quantity };
    }
    case 'order.create_sale':
    case 'order.create_restock': {
      const productRef = asString(record.product_ref);
      const locationRef = asString(record.location_ref);
      const quantity = asNumber(record.quantity);
      if (!productRef || !locationRef || quantity === null) return null;
      return {
        kind,
        product_ref: productRef,
        location_ref: locationRef,
        quantity,
        note: asString(record.note) || undefined,
      };
    }
    case 'order.create_transfer': {
      const productRef = asString(record.product_ref);
      const fromLocationRef = asString(record.from_location_ref);
      const toLocationRef = asString(record.to_location_ref);
      const quantity = asNumber(record.quantity);
      if (!productRef || !fromLocationRef || !toLocationRef || quantity === null) return null;
      return {
        kind,
        product_ref: productRef,
        from_location_ref: fromLocationRef,
        to_location_ref: toLocationRef,
        quantity,
        note: asString(record.note) || undefined,
      };
    }
    case 'read.query': {
      const intent = asReadIntent(record.intent);
      if (!intent) return null;
      return {
        kind,
        intent,
        product_ref: asString(record.product_ref) || undefined,
        location_ref: asString(record.location_ref) || undefined,
      };
    }
    default:
      return null;
  }
}

function resolveAction(action: AssistantAction, catalog: CatalogData):
  | { status: 'resolved'; action: ResolvedAction }
  | { status: 'needs_clarification'; message: string; options: Array<{ label: string; value: string }> } {
  switch (action.kind) {
    case 'product.create': {
      const threshold = Number.isFinite(action.threshold) ? Math.max(0, Math.floor(action.threshold ?? 20)) : 20;
      return {
        status: 'resolved',
        action: {
          kind: 'product.create',
          name: action.name.trim(),
          sku: action.sku?.trim() || undefined,
          category: action.category.trim(),
          threshold,
          summary: `Create product "${action.name.trim()}" in "${action.category.trim()}" with threshold ${threshold}.`,
          warnings: action.sku ? [] : ['SKU missing: an SKU will be generated.'],
        },
      };
    }

    case 'product.update': {
      const resolved = resolveProductRef(action.product_ref, catalog.products);
      if (resolved.status !== 'resolved' || !resolved.value) {
        return toClarification(resolved, 'I could not uniquely identify the product to update.');
      }
      return {
        status: 'resolved',
        action: {
          kind: 'product.update',
          product_id: resolved.value.id,
          name: action.name?.trim(),
          sku: action.sku?.trim(),
          category: action.category?.trim(),
          threshold: action.threshold === undefined ? undefined : Math.max(0, Math.floor(action.threshold)),
          is_active: action.is_active,
          summary: `Update product "${resolved.value.name}".`,
          warnings: [],
        },
      };
    }

    case 'product.archive': {
      const resolved = resolveProductRef(action.product_ref, catalog.products);
      if (resolved.status !== 'resolved' || !resolved.value) {
        return toClarification(resolved, 'I could not uniquely identify the product to archive.');
      }
      return {
        status: 'resolved',
        action: {
          kind: 'product.archive',
          product_id: resolved.value.id,
          summary: `Archive product "${resolved.value.name}" (soft-delete).`,
          warnings: ['Product archive is a soft-delete operation.'],
        },
      };
    }

    case 'location.create': {
      return {
        status: 'resolved',
        action: {
          kind: 'location.create',
          name: action.name.trim(),
          type: action.type,
          city: action.city.trim(),
          summary: `Create ${action.type} location "${action.name.trim()}" in ${action.city.trim()}.`,
          warnings: [],
        },
      };
    }

    case 'location.update': {
      const resolved = resolveLocationRef(action.location_ref, catalog.locations);
      if (resolved.status !== 'resolved' || !resolved.value) {
        return toClarification(resolved, 'I could not uniquely identify the location to update.');
      }
      return {
        status: 'resolved',
        action: {
          kind: 'location.update',
          location_id: resolved.value.id,
          name: action.name?.trim(),
          type: action.type,
          city: action.city?.trim(),
          is_active: action.is_active,
          summary: `Update location "${resolved.value.name}".`,
          warnings: [],
        },
      };
    }

    case 'location.deactivate': {
      const resolved = resolveLocationRef(action.location_ref, catalog.locations);
      if (resolved.status !== 'resolved' || !resolved.value) {
        return toClarification(resolved, 'I could not uniquely identify the location to deactivate.');
      }
      return {
        status: 'resolved',
        action: {
          kind: 'location.deactivate',
          location_id: resolved.value.id,
          summary: `Deactivate location "${resolved.value.name}" (soft-delete).`,
          warnings: ['Location deactivation is a soft-delete operation.'],
        },
      };
    }

    case 'inventory.create_entry':
    case 'inventory.set_quantity': {
      const product = resolveProductRef(action.product_ref, catalog.products);
      if (product.status !== 'resolved' || !product.value) {
        return toClarification(product, 'I could not uniquely identify the inventory product.');
      }
      const location = resolveLocationRef(action.location_ref, catalog.locations);
      if (location.status !== 'resolved' || !location.value) {
        return toClarification(location, 'I could not uniquely identify the inventory location.');
      }
      const quantity = Math.floor(action.quantity);
      return {
        status: 'resolved',
        action: {
          kind: action.kind,
          product_id: product.value.id,
          location_id: location.value.id,
          quantity,
          summary:
            action.kind === 'inventory.create_entry'
              ? `Create inventory entry for "${product.value.name}" at "${location.value.name}" with quantity ${quantity}.`
              : `Set inventory for "${product.value.name}" at "${location.value.name}" to ${quantity}.`,
          warnings: [],
        },
      };
    }

    case 'order.create_sale':
    case 'order.create_restock': {
      const product = resolveProductRef(action.product_ref, catalog.products);
      if (product.status !== 'resolved' || !product.value) {
        return toClarification(product, 'I could not uniquely identify the order product.');
      }
      const location = resolveLocationRef(action.location_ref, catalog.locations);
      if (location.status !== 'resolved' || !location.value) {
        return toClarification(location, 'I could not uniquely identify the order location.');
      }
      return {
        status: 'resolved',
        action: {
          kind: action.kind,
          product_id: product.value.id,
          location_id: location.value.id,
          quantity: Math.floor(action.quantity),
          note: action.note?.trim() || 'Created via AI assistant',
          summary: `${action.kind === 'order.create_sale' ? 'Create sale' : 'Create restock'} order for ${Math.floor(action.quantity)} units of "${product.value.name}" at "${location.value.name}".`,
          warnings: [],
        },
      };
    }

    case 'order.create_transfer': {
      const product = resolveProductRef(action.product_ref, catalog.products);
      if (product.status !== 'resolved' || !product.value) {
        return toClarification(product, 'I could not uniquely identify the transfer product.');
      }
      const fromLocation = resolveLocationRef(action.from_location_ref, catalog.locations);
      if (fromLocation.status !== 'resolved' || !fromLocation.value) {
        return toClarification(fromLocation, 'I could not uniquely identify the source location.');
      }
      const toLocation = resolveLocationRef(action.to_location_ref, catalog.locations);
      if (toLocation.status !== 'resolved' || !toLocation.value) {
        return toClarification(toLocation, 'I could not uniquely identify the destination location.');
      }

      return {
        status: 'resolved',
        action: {
          kind: 'order.create_transfer',
          product_id: product.value.id,
          from_location_id: fromLocation.value.id,
          to_location_id: toLocation.value.id,
          quantity: Math.floor(action.quantity),
          note: action.note?.trim() || 'Created via AI assistant',
          summary: `Create transfer order for ${Math.floor(action.quantity)} units of "${product.value.name}" from "${fromLocation.value.name}" to "${toLocation.value.name}".`,
          warnings: [],
        },
      };
    }

    case 'read.query': {
      if (action.intent === 'stock_by_product') {
        const product = resolveProductRef(action.product_ref ?? '', catalog.products);
        if (product.status !== 'resolved' || !product.value) {
          return toClarification(product, 'I could not uniquely identify the product for stock lookup.');
        }

        return {
          status: 'resolved',
          action: {
            kind: 'read.query',
            intent: action.intent,
            product_id: product.value.id,
            summary: `Show stock by location for "${product.value.name}".`,
            warnings: [],
          },
        };
      }

      if (action.intent === 'location_snapshot') {
        const location = resolveLocationRef(action.location_ref ?? '', catalog.locations);
        if (location.status !== 'resolved' || !location.value) {
          return toClarification(location, 'I could not uniquely identify the location snapshot target.');
        }

        return {
          status: 'resolved',
          action: {
            kind: 'read.query',
            intent: action.intent,
            location_id: location.value.id,
            summary: `Show inventory snapshot for "${location.value.name}".`,
            warnings: [],
          },
        };
      }

      return {
        status: 'resolved',
        action: {
          kind: 'read.query',
          intent: action.intent,
          summary: action.intent === 'low_stock' ? 'Show low-stock items.' : 'Show overall inventory summary.',
          warnings: [],
        },
      };
    }
  }
}

async function preflightValidateAction(
  authHeader: string,
  action: ResolvedAction,
  catalog: CatalogData
): Promise<{ ok: true } | { ok: false; message: string }> {
  switch (action.kind) {
    case 'product.create': {
      if (!action.name.trim() || !action.category.trim()) {
        return { ok: false, message: 'Product name and category are required.' };
      }
      if (!Number.isInteger(action.threshold) || action.threshold < 0) {
        return { ok: false, message: 'Product threshold must be a non-negative integer.' };
      }
      if (action.sku) {
        const duplicate = catalog.products.find((product) => normalize(product.sku) === normalize(action.sku ?? ''));
        if (duplicate) {
          return { ok: false, message: `SKU "${action.sku}" already exists in your workspace.` };
        }
      }
      return { ok: true };
    }

    case 'product.update': {
      if (
        action.name === undefined &&
        action.sku === undefined &&
        action.category === undefined &&
        action.threshold === undefined &&
        action.is_active === undefined
      ) {
        return { ok: false, message: 'No product fields were provided for update.' };
      }
      if (action.threshold !== undefined && (!Number.isInteger(action.threshold) || action.threshold < 0)) {
        return { ok: false, message: 'Product threshold must be a non-negative integer.' };
      }
      if (action.sku) {
        const duplicate = catalog.products.find((product) => normalize(product.sku) === normalize(action.sku ?? '') && product.id !== action.product_id);
        if (duplicate) {
          return { ok: false, message: `SKU "${action.sku}" already exists in your workspace.` };
        }
      }
      return { ok: true };
    }

    case 'location.create': {
      if (!action.name.trim() || !action.city.trim()) {
        return { ok: false, message: 'Location name and city are required.' };
      }
      return { ok: true };
    }

    case 'location.update': {
      if (
        action.name === undefined &&
        action.type === undefined &&
        action.city === undefined &&
        action.is_active === undefined
      ) {
        return { ok: false, message: 'No location fields were provided for update.' };
      }
      return { ok: true };
    }

    case 'inventory.create_entry':
      if (!Number.isInteger(action.quantity) || action.quantity <= 0) {
        return { ok: false, message: 'Inventory entry quantity must be greater than zero.' };
      }
      return { ok: true };

    case 'inventory.set_quantity':
      if (!Number.isInteger(action.quantity) || action.quantity < 0) {
        return { ok: false, message: 'Inventory quantity must be a non-negative integer.' };
      }
      return { ok: true };

    case 'order.create_sale':
    case 'order.create_transfer': {
      if (!Number.isInteger(action.quantity) || action.quantity <= 0) {
        return { ok: false, message: 'Order quantity must be greater than zero.' };
      }

      const sourceLocationId = action.kind === 'order.create_transfer' ? action.from_location_id : action.location_id;
      const source = await findInventoryItem(authHeader, action.product_id, sourceLocationId);
      const available = source?.quantity ?? 0;
      if (available < action.quantity) {
        const label = action.kind === 'order.create_sale' ? 'Sale' : 'Transfer';
        return { ok: false, message: `Current QTY is ${available} and order is ${action.quantity}. ${label} order can't be created.` };
      }

      if (action.kind === 'order.create_transfer' && action.from_location_id === action.to_location_id) {
        return { ok: false, message: 'From location and to location must be different for transfer orders.' };
      }

      return { ok: true };
    }

    case 'order.create_restock':
      if (!Number.isInteger(action.quantity) || action.quantity <= 0) {
        return { ok: false, message: 'Order quantity must be greater than zero.' };
      }
      return { ok: true };

    default:
      return { ok: true };
  }
}

async function executeReadAction(
  authHeader: string,
  action: Extract<ResolvedAction, { kind: 'read.query' }>
): Promise<{
  message: string;
  payload: {
    rows: Array<Record<string, JsonValue>>;
    chartData?: {
      type: 'bar' | 'pie';
      label?: string;
      data: Array<Record<string, JsonValue>>;
    };
  };
}> {
  const response = await graphqlRequest<{
    inventory_itemsCollection: {
      edges?: Array<{
        node?: {
          product_id: string;
          location_id: string;
          quantity: number;
          threshold: number;
          products?: { name: string; sku: string; category: string } | null;
          locations?: { name: string; city: string } | null;
        } | null;
      }>;
    } | null;
  }>(authHeader, INVENTORY_WITH_RELATIONS_QUERY);

  const rows = readCollection(response.inventory_itemsCollection);

  if (action.intent === 'low_stock') {
    const lowRows = rows
      .filter((row) => Number(row.quantity) <= Number(row.threshold))
      .map((row) => ({
        product: row.products?.name ?? '-',
        sku: row.products?.sku ?? '-',
        location: row.locations?.name ?? '-',
        quantity: Number(row.quantity),
        threshold: Number(row.threshold),
      }));

    return {
      message: lowRows.length ? `Found ${lowRows.length} low-stock item(s).` : 'No low-stock items found.',
      payload: {
        rows: lowRows as Array<Record<string, JsonValue>>,
        chartData: lowRows.length
          ? {
            type: 'bar',
            label: 'Low Stock Items',
            data: lowRows.slice(0, 10).map((row) => ({
              name: row.product,
              quantity: row.quantity,
              threshold: row.threshold,
            })),
          }
          : undefined,
      },
    };
  }

  if (action.intent === 'inventory_summary') {
    let totalStock = 0;
    const byCategory = new Map<string, number>();
    for (const row of rows) {
      const qty = Number(row.quantity);
      totalStock += qty;
      const category = row.products?.category ?? 'Uncategorized';
      byCategory.set(category, (byCategory.get(category) ?? 0) + qty);
    }

    const categoryRows = Array.from(byCategory.entries()).map(([category, quantity]) => ({
      category,
      quantity,
    }));

    return {
      message: `Inventory summary: ${rows.length} rows, ${totalStock} total units.`,
      payload: {
        rows: categoryRows as Array<Record<string, JsonValue>>,
        chartData: {
          type: 'pie',
          label: 'Stock by Category',
          data: categoryRows.map((row) => ({ name: row.category, value: row.quantity })),
        },
      },
    };
  }

  if (action.intent === 'stock_by_product') {
    const stockRows = rows
      .filter((row) => row.product_id === action.product_id)
      .map((row) => ({
        location: row.locations?.name ?? '-',
        product: row.products?.name ?? '-',
        sku: row.products?.sku ?? '-',
        quantity: Number(row.quantity),
        threshold: Number(row.threshold),
      }));

    return {
      message: `Stock-by-product returned ${stockRows.length} location row(s).`,
      payload: {
        rows: stockRows as Array<Record<string, JsonValue>>,
        chartData: {
          type: 'bar',
          label: `${stockRows[0]?.product ?? 'Product'} Stock`,
          data: stockRows.map((row) => ({
            name: row.location,
            quantity: row.quantity,
            threshold: row.threshold,
          })),
        },
      },
    };
  }

  const snapshotRows = rows
    .filter((row) => row.location_id === action.location_id)
    .map((row) => ({
      location: row.locations?.name ?? '-',
      product: row.products?.name ?? '-',
      sku: row.products?.sku ?? '-',
      quantity: Number(row.quantity),
      threshold: Number(row.threshold),
    }));

  return {
    message: `Location snapshot returned ${snapshotRows.length} product row(s).`,
    payload: {
      rows: snapshotRows as Array<Record<string, JsonValue>>,
      chartData: {
        type: 'bar',
        label: `${snapshotRows[0]?.location ?? 'Location'} Snapshot`,
        data: snapshotRows.slice(0, 12).map((row) => ({
          name: row.product,
          quantity: row.quantity,
          threshold: row.threshold,
        })),
      },
    },
  };
}

async function executeMutatingAction(
  authHeader: string,
  action: Exclude<ResolvedAction, { kind: 'read.query' }>,
  catalog: CatalogData
): Promise<{ message: string; affected: Record<string, JsonValue> }> {
  switch (action.kind) {
    case 'product.create': {
      const sku = action.sku?.trim() || generateSku(action.name, catalog.products);
      const response = await graphqlRequest<{
        insertIntoproductsCollection: { records?: Array<{ id: string }> } | null;
      }>(authHeader, INSERT_PRODUCT_MUTATION, {
        name: action.name,
        sku,
        category: action.category,
        threshold: action.threshold,
        isActive: true,
      });

      return {
        message: `Product "${action.name}" created successfully.`,
        affected: {
          productId: response.insertIntoproductsCollection?.records?.[0]?.id ?? null,
          sku,
        },
      };
    }

    case 'product.update': {
      const existing = catalog.products.find((product) => product.id === action.product_id);
      if (!existing) throw new Error('Product not found in current workspace.');

      await graphqlRequest(authHeader, UPDATE_PRODUCT_MUTATION, {
        id: action.product_id,
        name: action.name ?? existing.name,
        sku: action.sku ?? existing.sku,
        category: action.category ?? existing.category,
        threshold: action.threshold ?? existing.threshold,
        isActive: action.is_active ?? existing.is_active,
      });

      return {
        message: `Product "${existing.name}" updated successfully.`,
        affected: { productId: action.product_id },
      };
    }

    case 'product.archive': {
      const response = await graphqlRequest<{
        archive_product_and_remove_inventory_graphql: boolean;
      }>(authHeader, ARCHIVE_PRODUCT_MUTATION, {
        productId: action.product_id,
      });

      if (!response.archive_product_and_remove_inventory_graphql) {
        throw new Error('Product archive operation did not affect any records.');
      }

      return {
        message: 'Product archived successfully.',
        affected: { productId: action.product_id, archived: true },
      };
    }

    case 'location.create': {
      const response = await graphqlRequest<{
        insertIntolocationsCollection: { records?: Array<{ id: string }> } | null;
      }>(authHeader, INSERT_LOCATION_MUTATION, {
        name: action.name,
        type: action.type,
        city: action.city,
        isActive: true,
      });

      return {
        message: `Location "${action.name}" created successfully.`,
        affected: { locationId: response.insertIntolocationsCollection?.records?.[0]?.id ?? null },
      };
    }

    case 'location.update': {
      const existing = catalog.locations.find((location) => location.id === action.location_id);
      if (!existing) throw new Error('Location not found in current workspace.');

      await graphqlRequest(authHeader, UPDATE_LOCATION_MUTATION, {
        id: action.location_id,
        name: action.name ?? existing.name,
        type: action.type ?? existing.type,
        city: action.city ?? existing.city,
        isActive: action.is_active ?? existing.is_active,
      });

      return {
        message: `Location "${existing.name}" updated successfully.`,
        affected: { locationId: action.location_id },
      };
    }

    case 'location.deactivate': {
      const existing = catalog.locations.find((location) => location.id === action.location_id);
      if (!existing) throw new Error('Location not found in current workspace.');

      await graphqlRequest(authHeader, UPDATE_LOCATION_MUTATION, {
        id: action.location_id,
        name: existing.name,
        type: existing.type,
        city: existing.city,
        isActive: false,
      });

      return {
        message: `Location "${existing.name}" deactivated successfully.`,
        affected: { locationId: action.location_id, isActive: false },
      };
    }

    case 'inventory.create_entry': {
      await graphqlRequest(authHeader, INSERT_INVENTORY_MUTATION, {
        productId: action.product_id,
        locationId: action.location_id,
        quantity: action.quantity,
      });
      return {
        message: 'Inventory entry created successfully.',
        affected: {
          productId: action.product_id,
          locationId: action.location_id,
          quantity: action.quantity,
        },
      };
    }

    case 'inventory.set_quantity': {
      await graphqlRequest(authHeader, UPDATE_INVENTORY_MUTATION, {
        productId: action.product_id,
        locationId: action.location_id,
        quantity: action.quantity,
      });
      return {
        message: 'Inventory quantity updated successfully.',
        affected: {
          productId: action.product_id,
          locationId: action.location_id,
          quantity: action.quantity,
        },
      };
    }

    case 'order.create_sale':
    case 'order.create_restock': {
      if (action.kind === 'order.create_restock') {
        await ensureInventoryRowForRestock(authHeader, action.product_id, action.location_id);
      }

      const type = action.kind === 'order.create_sale' ? 'sale' : 'restock';
      const response = await graphqlRequest<{ create_order_and_apply_inventory_graphql: string }>(
        authHeader,
        CREATE_ORDER_MUTATION,
        {
          productId: action.product_id,
          locationId: action.location_id,
          type,
          quantity: action.quantity,
          source: 'ai',
          note: action.note,
        }
      );

      return {
        message: `${type === 'sale' ? 'Sale' : 'Restock'} order created successfully.`,
        affected: {
          orderId: response.create_order_and_apply_inventory_graphql,
          productId: action.product_id,
          locationId: action.location_id,
        },
      };
    }

    case 'order.create_transfer': {
      const response = await graphqlRequest<{ create_transfer_order_and_move_inventory_graphql: string }>(
        authHeader,
        CREATE_TRANSFER_ORDER_MUTATION,
        {
          productId: action.product_id,
          fromLocationId: action.from_location_id,
          toLocationId: action.to_location_id,
          quantity: action.quantity,
          note: action.note,
          source: 'ai',
        }
      );

      return {
        message: 'Transfer order created successfully.',
        affected: {
          orderId: response.create_transfer_order_and_move_inventory_graphql,
          productId: action.product_id,
          fromLocationId: action.from_location_id,
          toLocationId: action.to_location_id,
        },
      };
    }
  }
}

async function ensureInventoryRowForRestock(authHeader: string, productId: string, locationId: string): Promise<void> {
  const existing = await findInventoryItem(authHeader, productId, locationId);
  if (existing) return;

  try {
    await graphqlRequest(authHeader, INSERT_INVENTORY_MUTATION, {
      productId,
      locationId,
      quantity: 0,
    });
  } catch (error) {
    const message = toErrorMessage(error, 'Failed to initialize inventory row.');
    if (!message.toLowerCase().includes('duplicate key value violates unique constraint')) {
      throw error;
    }
  }
}

async function findInventoryItem(
  authHeader: string,
  productId: string,
  locationId: string
): Promise<{ quantity: number; threshold: number } | null> {
  const response = await graphqlRequest<{
    inventory_itemsCollection: {
      edges?: Array<{ node?: { quantity: number; threshold: number } | null }>;
    } | null;
  }>(authHeader, INVENTORY_ITEM_QUERY, {
    productId,
    locationId,
  });

  const node = readCollection(response.inventory_itemsCollection)[0];
  if (!node) return null;
  return {
    quantity: Number(node.quantity),
    threshold: Number(node.threshold),
  };
}

async function graphqlRequest<TData>(
  authHeader: string,
  query: string,
  variables?: Record<string, unknown>
): Promise<TData> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Supabase GraphQL endpoint is not configured.');
  }

  const response = await fetch(`${SUPABASE_URL.replace(/\/$/, '')}/graphql/v1`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_ANON_KEY,
      Authorization: authHeader,
    },
    body: JSON.stringify({ query, variables: variables ?? {} }),
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(extractGraphqlMessage(payload) || response.statusText);
  }

  if (Array.isArray(payload?.errors) && payload.errors.length > 0) {
    throw new Error(extractGraphqlMessage(payload) || 'GraphQL request failed.');
  }

  if (!payload?.data) {
    throw new Error('GraphQL response did not include data.');
  }

  return payload.data as TData;
}

async function finalizeRun(supabase: SupabaseClient, runId: string, payload: Record<string, unknown>): Promise<void> {
  await supabase.from('ai_command_runs').update(payload).eq('id', runId);
}

async function finalizeActionRow(
  supabase: SupabaseClient,
  actionRowId: string,
  payload: Record<string, unknown>
): Promise<void> {
  await supabase.from('ai_command_actions').update(payload).eq('id', actionRowId);
}

async function insertActionRows(
  supabase: SupabaseClient,
  runId: string,
  workspaceId: string,
  userId: string,
  actions: AssistantAction[],
  resolvedActions: ResolvedAction[],
  status: 'planned' | 'validated' | 'executed' | 'failed',
  error: string | null = null,
  result: Record<string, unknown> | null = null
): Promise<void> {
  const rows = actions.map((action, index) => ({
    run_id: runId,
    workspace_id: workspaceId,
    user_id: userId,
    action_index: index,
    kind: action.kind,
    action_payload: action as unknown as JsonValue,
    resolved_payload: (resolvedActions[index] ?? {}) as unknown as JsonValue,
    status,
    error,
    result: (result ?? null) as JsonValue,
  }));

  if (!rows.length) return;
  await supabase.from('ai_command_actions').insert(rows);
}

function resolveProductRef(ref: string, products: CatalogProduct[]) {
  const normalized = normalize(ref);
  if (!normalized) {
    return { status: 'not_found' as const, message: 'Product reference is missing.' };
  }

  const exactSku = products.filter((product) => normalize(product.sku) === normalized);
  if (exactSku.length === 1) {
    return { status: 'resolved' as const, value: exactSku[0], message: '' };
  }
  if (exactSku.length > 1) {
    return {
      status: 'ambiguous' as const,
      message: `Multiple products match SKU "${ref}".`,
      options: exactSku,
    };
  }

  const exactName = products.filter((product) => normalize(product.name) === normalized);
  if (exactName.length === 1) {
    return { status: 'resolved' as const, value: exactName[0], message: '' };
  }
  if (exactName.length > 1) {
    return {
      status: 'ambiguous' as const,
      message: `Multiple products match "${ref}".`,
      options: exactName,
    };
  }

  const contains = products.filter((product) => {
    const productName = normalize(product.name);
    const productSku = normalize(product.sku);
    return productName.includes(normalized) || productSku.includes(normalized);
  });

  if (contains.length === 1) {
    return { status: 'resolved' as const, value: contains[0], message: '' };
  }
  if (contains.length > 1) {
    return {
      status: 'ambiguous' as const,
      message: `Multiple products match "${ref}". Please be more specific.`,
      options: contains,
    };
  }

  return {
    status: 'not_found' as const,
    message: `No product matched "${ref}".`,
  };
}

function resolveLocationRef(ref: string, locations: CatalogLocation[]) {
  const normalized = normalize(ref);
  if (!normalized) {
    return { status: 'not_found' as const, message: 'Location reference is missing.' };
  }

  const exactName = locations.filter((location) => normalize(location.name) === normalized);
  if (exactName.length === 1) {
    return { status: 'resolved' as const, value: exactName[0], message: '' };
  }
  if (exactName.length > 1) {
    return {
      status: 'ambiguous' as const,
      message: `Multiple locations match "${ref}".`,
      options: exactName,
    };
  }

  const contains = locations.filter((location) => {
    return normalize(location.name).includes(normalized) || normalize(location.city).includes(normalized);
  });

  if (contains.length === 1) {
    return { status: 'resolved' as const, value: contains[0], message: '' };
  }
  if (contains.length > 1) {
    return {
      status: 'ambiguous' as const,
      message: `Multiple locations match "${ref}". Please be more specific.`,
      options: contains,
    };
  }

  return {
    status: 'not_found' as const,
    message: `No location matched "${ref}".`,
  };
}

function toClarification(
  resolution: {
    status: string;
    message: string;
    options?: Array<CatalogProduct | CatalogLocation>;
  },
  fallback: string
): { status: 'needs_clarification'; message: string; options: Array<{ label: string; value: string }> } {
  const message = resolution.message || fallback;
  const options = Array.isArray(resolution.options)
    ? resolution.options.slice(0, 8).map((item) => ({
      label:
        'sku' in item
          ? `${item.name} (${item.sku})`
          : `${item.name}${item.city ? `, ${item.city}` : ''}`,
      value:
        'sku' in item
          ? `Use product "${item.sku}" in this request.`
          : `Use location "${item.name}" in this request.`,
    }))
    : [];

  return { status: 'needs_clarification', message, options };
}

function parseJsonFromModel(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    const fenced = raw.match(/```json\s*([\s\S]*?)\s*```/i) ?? raw.match(/```\s*([\s\S]*?)\s*```/i);
    if (fenced?.[1]) {
      try {
        return JSON.parse(fenced[1]);
      } catch {
        return null;
      }
    }

    const firstBrace = raw.indexOf('{');
    const lastBrace = raw.lastIndexOf('}');
    if (firstBrace >= 0 && lastBrace > firstBrace) {
      try {
        return JSON.parse(raw.slice(firstBrace, lastBrace + 1));
      } catch {
        return null;
      }
    }

    return null;
  }
}

function extractGraphqlMessage(payload: unknown): string {
  if (!payload || typeof payload !== 'object') return '';
  const errors = (payload as Record<string, unknown>).errors;
  if (!Array.isArray(errors)) return '';
  return errors
    .map((error) =>
      typeof error === 'object' && error
        ? asString((error as Record<string, unknown>).message)
        : null
    )
    .filter(Boolean)
    .join('; ');
}

function readCollection<TNode>(
  collection: { edges?: Array<{ node?: TNode | null }> } | null | undefined
): TNode[] {
  if (!collection?.edges) return [];
  return collection.edges.map((edge) => edge.node).filter(Boolean) as TNode[];
}

function decodeResolvedAction(value: unknown): ResolvedAction | null {
  if (!value || typeof value !== 'object') return null;
  const kind = asString((value as Record<string, unknown>).kind);
  if (!kind) return null;
  return value as ResolvedAction;
}

function isPlanRequest(value: unknown): value is PlanRequestBody {
  if (!value || typeof value !== 'object') return false;
  const record = value as Record<string, unknown>;
  return record.mode === 'plan' && typeof record.message === 'string';
}

function isExecuteRequest(value: unknown): value is ExecuteRequestBody {
  if (!value || typeof value !== 'object') return false;
  const record = value as Record<string, unknown>;
  return record.mode === 'execute' && typeof record.runId === 'string';
}

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function normalizeRpcScalar(value: unknown): string | null {
  if (typeof value === 'string') return value;
  if (Array.isArray(value) && typeof value[0] === 'string') return value[0];
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    for (const key of Object.keys(record)) {
      if (typeof record[key] === 'string') return record[key] as string;
    }
  }
  return null;
}

function generateSku(name: string, products: CatalogProduct[]): string {
  const base =
    name
      .trim()
      .split(/\s+/)
      .map((chunk) => chunk[0]?.toUpperCase() ?? '')
      .join('')
      .slice(0, 4) || 'SKU';

  let candidate = `${base}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  while (products.some((product) => normalize(product.sku) === normalize(candidate))) {
    candidate = `${base}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  }
  return candidate;
}

function looksLikeOrderEditOrDelete(prompt: string): boolean {
  const normalizedPrompt = prompt.toLowerCase();
  const hasOrder = /\border\b/.test(normalizedPrompt);
  const hasForbiddenVerb = /\b(delete|remove|edit|update|modify|change)\b/.test(normalizedPrompt);
  const hasCreateVerb = /\b(create|make|record|new)\b/.test(normalizedPrompt);
  return hasOrder && hasForbiddenVerb && !hasCreateVerb;
}

function asString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

function asNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function asBoolean(value: unknown): boolean | null {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const normalizedValue = value.trim().toLowerCase();
    if (normalizedValue === 'true') return true;
    if (normalizedValue === 'false') return false;
  }
  return null;
}

function asLocationType(value: unknown): 'warehouse' | 'store' | 'online' | null {
  const parsed = asString(value)?.toLowerCase();
  if (parsed === 'warehouse' || parsed === 'store' || parsed === 'online') return parsed;
  return null;
}

function asReadIntent(value: unknown): ReadQueryIntent | null {
  const parsed = asString(value)?.toLowerCase();
  if (
    parsed === 'low_stock' ||
    parsed === 'inventory_summary' ||
    parsed === 'stock_by_product' ||
    parsed === 'location_snapshot'
  ) {
    return parsed;
  }
  return null;
}

function toErrorMessage(error: unknown, fallback: string): string {
  if (!(error instanceof Error)) return fallback;
  const message = error.message.trim();
  return message || fallback;
}

function failedResponse(code: AssistantFailureCode, assistantMessage: string, status = 400): Response {
  return jsonResponse(
    {
      status: 'failed',
      code,
      assistantMessage,
    },
    status
  );
}

function jsonResponse(body: AssistantResponse, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...CORS_HEADERS,
      'Content-Type': 'application/json',
    },
  });
}
