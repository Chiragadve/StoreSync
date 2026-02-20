export type AssistantRunStatus =
  | 'needs_clarification'
  | 'needs_confirmation'
  | 'executed'
  | 'failed'
  | 'read_only_response';

export interface AssistantActionPreview {
  kind: string;
  summary: string;
  warnings: string[];
}

export interface AssistantClarificationOption {
  label: string;
  value: string;
}

export interface AssistantReadChart {
  type: 'bar' | 'pie';
  label?: string;
  data: Array<Record<string, string | number | boolean | null>>;
}

export interface AssistantReadResult {
  rows: Array<Record<string, string | number | boolean | null>>;
  chartData?: AssistantReadChart;
}

export interface AssistantExecutionResult {
  succeeded: boolean;
  kind?: string;
  message?: string;
  affected?: Record<string, string | number | boolean | null>;
}

export interface AssistantCommandResponse {
  runId?: string;
  status: AssistantRunStatus;
  code?: string;
  assistantMessage: string;
  actionPreview?: AssistantActionPreview;
  clarification?: {
    reason: string;
    options?: AssistantClarificationOption[];
  };
  readResult?: AssistantReadResult;
  execution?: AssistantExecutionResult;
}

export interface AssistantPlanRequest {
  mode: 'plan';
  message: string;
  conversationId?: string;
}

export interface AssistantExecuteRequest {
  mode: 'execute';
  runId: string;
}
