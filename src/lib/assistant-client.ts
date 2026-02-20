import { assertSupabaseConfigured, getSupabaseEnv, supabase } from '@/lib/supabase';
import type {
  AssistantCommandResponse,
  AssistantExecuteRequest,
  AssistantPlanRequest,
} from '@/types/assistant';

interface EdgeFailurePayload {
  code?: unknown;
  assistantMessage?: unknown;
  message?: unknown;
}

interface ParsedAssistantError {
  message: string;
  status?: number;
  code?: string;
}

function looksLikeJwtFailure(parsed: ParsedAssistantError): boolean {
  const normalized = parsed.message.toLowerCase();
  const code = parsed.code?.toUpperCase();

  return (
    normalized.includes('invalid jwt') ||
    normalized.includes('jwt expired') ||
    normalized.includes('token is expired') ||
    normalized.includes('auth_user_unresolved') ||
    code === 'AUTH_USER_UNRESOLVED'
  );
}

function isLikelyJwt(accessToken: string): boolean {
  return /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/.test(accessToken);
}

function parseUnknownError(error: unknown): ParsedAssistantError {
  if (!(error instanceof Error)) {
    return { message: 'Assistant request failed.' };
  }
  const message = error.message.trim();
  return { message: message || 'Assistant request failed.' };
}

async function parseEdgeErrorResponse(response: Response): Promise<ParsedAssistantError> {
  let parsedPayload: EdgeFailurePayload | null = null;
  let rawBody = '';

  try {
    parsedPayload = (await response.clone().json()) as EdgeFailurePayload;
  } catch {
    try {
      rawBody = (await response.clone().text()).trim();
    } catch {
      rawBody = '';
    }
  }

  const code = typeof parsedPayload?.code === 'string'
    ? parsedPayload.code
    : undefined;

  if (
    typeof parsedPayload?.assistantMessage === 'string' &&
    parsedPayload.assistantMessage.trim()
  ) {
    return {
      message: parsedPayload.assistantMessage.trim(),
      status: response.status,
      code,
    };
  }

  if (
    typeof parsedPayload?.message === 'string' &&
    parsedPayload.message.trim()
  ) {
    return {
      message: parsedPayload.message.trim(),
      status: response.status,
      code,
    };
  }

  if (rawBody) {
    return {
      message: rawBody,
      status: response.status,
      code,
    };
  }

  return {
    message: `Edge function request failed (HTTP ${response.status}).`,
    status: response.status,
    code,
  };
}

async function getValidatedAccessToken() {
  const sessionResult = await supabase.auth.getSession();
  const accessToken = sessionResult.data.session?.access_token?.trim() ?? '';

  if (!accessToken || !isLikelyJwt(accessToken)) {
    throw new Error('Session invalid or expired. Please sign in again.');
  }

  return accessToken;
}

async function invokeEdgeFunction(
  payload: AssistantPlanRequest | AssistantExecuteRequest,
  accessToken: string,
): Promise<{
  data: AssistantCommandResponse | null;
  error: ParsedAssistantError | null;
}> {
  assertSupabaseConfigured();
  const { supabaseUrl, supabaseAnonKey } = getSupabaseEnv();
  const endpoint = `${supabaseUrl.replace(/\/$/, '')}/functions/v1/assistant-command`;

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      return {
        data: null,
        error: await parseEdgeErrorResponse(response),
      };
    }

    const body = (await response.json()) as AssistantCommandResponse;
    return {
      data: body,
      error: null,
    };
  } catch (error) {
    return {
      data: null,
      error: parseUnknownError(error),
    };
  }
}

function logInvokeFailure(parsed: ParsedAssistantError, hasSession: boolean) {
  if (!import.meta.env.DEV) return;
  // Keep logs minimal for local diagnosis.
  console.error('[assistant] invoke failed', {
    status: parsed.status,
    code: parsed.code,
    message: parsed.message,
    hasSession,
  });
}

function assertValidResponse(data: AssistantCommandResponse | null): AssistantCommandResponse {
  if (!data || !data.status) {
    throw new Error('Assistant returned an invalid response.');
  }
  return data;
}

async function invokeAssistant(
  payload: AssistantPlanRequest | AssistantExecuteRequest
): Promise<AssistantCommandResponse> {
  const initialToken = await getValidatedAccessToken();
  const initialAttempt = await invokeEdgeFunction(payload, initialToken);
  const { data, error } = initialAttempt;

  if (error) {
    const parsed = error;
    logInvokeFailure(parsed, true);
    const shouldRetryJwt =
      parsed.status === 401 &&
      looksLikeJwtFailure(parsed);

    if (shouldRetryJwt) {
      const sessionResult = await supabase.auth.refreshSession();
      const currentToken = sessionResult.data.session?.access_token?.trim() ?? '';
      if (!currentToken || !isLikelyJwt(currentToken)) {
        throw new Error('Session invalid or expired. Please sign in again.');
      }

      if (currentToken === initialToken) {
        throw new Error('Session invalid or expired. Please sign in again.');
      }

      const retryAttempt = await invokeEdgeFunction(payload, currentToken);
      if (!retryAttempt.error) {
        return assertValidResponse(retryAttempt.data);
      }

      const retryParsed = retryAttempt.error;
      logInvokeFailure(retryParsed, true);
      if (looksLikeJwtFailure(retryParsed)) {
        throw new Error('Session invalid or expired. Please sign in again.');
      }

      throw new Error(retryParsed.message);
    }

    throw new Error(parsed.message);
  }

  return assertValidResponse(data);
}

export async function planAssistantCommand(message: string, conversationId?: string) {
  return invokeAssistant({
    mode: 'plan',
    message,
    conversationId,
  });
}

export async function executeAssistantCommand(runId: string) {
  return invokeAssistant({
    mode: 'execute',
    runId,
  });
}
