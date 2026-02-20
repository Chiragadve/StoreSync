import { useCallback, useMemo, useRef, useState } from 'react';
import Badge from '@/components/Badge';
import { executeAssistantCommand, planAssistantCommand } from '@/lib/assistant-client';
import { generateId } from '@/lib/helpers';
import { useApp } from '@/context/AppContext';
import type { AssistantCommandResponse, AssistantReadResult } from '@/types/assistant';
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as ReTooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  status?: AssistantCommandResponse['status'];
  readResult?: AssistantReadResult;
  clarification?: AssistantCommandResponse['clarification'];
}

const SUGGESTIONS = [
  'Show low stock items',
  'What were my most recent orders?',
  'Where are my products located?',
  'Which product has the highest threshold?',
  'Show inventory summary',
];

const PIE_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--success))',
  'hsl(var(--info))',
  'hsl(var(--destructive))',
  'hsl(var(--warning))',
  'hsl(38 70% 40%)',
];

const INITIAL_MESSAGE: ChatMessage = {
  id: 'assistant-welcome',
  role: 'assistant',
  content:
    'I can analyze your products, locations, and order history. Try asking me conversational questions about your inventory.',
  timestamp: new Date(),
  status: 'read_only_response',
};

export default function ChatPanel() {
  const { addToast } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE]);
  const [isPlanning, setIsPlanning] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [pendingConfirmation, setPendingConfirmation] = useState<{
    runId: string;
    summary: string;
    warnings: string[];
  } | null>(null);
  const conversationIdRef = useRef(generateId('conv'));
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 40);
  }, []);

  const addMessage = useCallback((message: ChatMessage) => {
    setMessages((previous) => [...previous, message]);
    scrollToBottom();
  }, [scrollToBottom]);

  const submitPrompt = useCallback(
    async (value?: string) => {
      const prompt = (value ?? input).trim();
      if (!prompt || isPlanning || isExecuting) return;

      setInput('');
      addMessage({
        id: generateId('chat-user'),
        role: 'user',
        content: prompt,
        timestamp: new Date(),
      });

      setIsPlanning(true);
      try {
        const response = await planAssistantCommand(prompt, conversationIdRef.current);
        addMessage({
          id: generateId('chat-assistant'),
          role: 'assistant',
          content: response.assistantMessage,
          timestamp: new Date(),
          status: response.status,
          clarification: response.clarification,
          readResult: response.readResult,
        });

        if (response.status === 'needs_confirmation' && response.runId && response.actionPreview) {
          setPendingConfirmation({
            runId: response.runId,
            summary: response.actionPreview.summary,
            warnings: response.actionPreview.warnings,
          });
        } else {
          setPendingConfirmation(null);
        }

        if (response.status === 'failed') {
          addToast('error', response.assistantMessage);
        }
      } catch (error) {
        const message = withAuthRecoveryHint(
          error instanceof Error ? error.message : 'Assistant request failed.'
        );
        addToast('error', message);
        addMessage({
          id: generateId('chat-assistant'),
          role: 'assistant',
          content: message,
          timestamp: new Date(),
          status: 'failed',
        });
      } finally {
        setIsPlanning(false);
      }
    },
    [addMessage, addToast, input, isPlanning, isExecuting]
  );

  const confirmExecution = useCallback(async () => {
    if (!pendingConfirmation || isExecuting) return;
    setIsExecuting(true);
    try {
      const response = await executeAssistantCommand(pendingConfirmation.runId);
      addMessage({
        id: generateId('chat-assistant'),
        role: 'assistant',
        content: response.assistantMessage,
        timestamp: new Date(),
        status: response.status,
      });
      if (response.status === 'failed') {
        addToast('error', response.assistantMessage);
      } else {
        addToast('success', response.assistantMessage);
      }
      setPendingConfirmation(null);
    } catch (error) {
      const message = withAuthRecoveryHint(
        error instanceof Error ? error.message : 'Execution failed.'
      );
      addToast('error', message);
      addMessage({
        id: generateId('chat-assistant'),
        role: 'assistant',
        content: message,
        timestamp: new Date(),
        status: 'failed',
      });
    } finally {
      setIsExecuting(false);
    }
  }, [addMessage, addToast, isExecuting, pendingConfirmation]);

  const cancelExecution = useCallback(() => {
    if (!pendingConfirmation) return;
    setPendingConfirmation(null);
    addMessage({
      id: generateId('chat-assistant'),
      role: 'assistant',
      content: 'Execution cancelled. You can edit your prompt and try again.',
      timestamp: new Date(),
      status: 'needs_clarification',
    });
  }, [addMessage, pendingConfirmation]);

  const isBusy = isPlanning || isExecuting;

  const quickSuggestions = useMemo(() => SUGGESTIONS, []);

  if ((import.meta.env.VITE_AI_ASSISTANT_ENABLED ?? 'true').toLowerCase() === 'false') {
    return null;
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => {
          setIsOpen(true);
          setTimeout(() => inputRef.current?.focus(), 80);
        }}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-transform"
        aria-label="Open assistant"
      >
        <span className="text-xl">AI</span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-[430px] max-w-[calc(100vw-1.5rem)] h-[640px] max-h-[calc(100vh-2rem)] flex flex-col bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-background">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center font-mono text-primary">AI</div>
          <div>
            <div className="font-mono font-bold text-sm text-foreground">StoreSync Assistant</div>
            <div className="text-[10px] text-muted-foreground font-mono">
              {isBusy ? 'PROCESSING' : 'READY'}
            </div>
          </div>
        </div>
        <button onClick={() => setIsOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors">
          ✕
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`${message.role === 'user' ? 'bg-primary text-primary-foreground rounded-2xl rounded-br-md px-4 py-2.5 max-w-[85%]' : 'bg-elevated border border-border rounded-2xl rounded-bl-md px-4 py-3 max-w-[90%]'}`}>
              <div className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</div>
              {message.status === 'failed' ? (
                <div className="mt-2">
                  <Badge type="low">ERROR</Badge>
                </div>
              ) : null}
              {message.clarification?.options?.length ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {message.clarification.options.map((option) => (
                    <button
                      key={`${message.id}-${option.label}`}
                      onClick={() => void submitPrompt(option.value)}
                      className="text-[11px] px-2.5 py-1.5 bg-background border border-border rounded-lg text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              ) : null}
              {message.readResult ? <ReadResultView readResult={message.readResult} /> : null}
              <div className="text-[10px] mt-2 text-muted-foreground/70 font-mono tabular-nums">
                {message.timestamp.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}

        {isPlanning ? (
          <div className="flex justify-start">
            <div className="bg-elevated border border-border rounded-2xl rounded-bl-md px-4 py-3 text-xs text-muted-foreground font-mono">
              Planning action...
            </div>
          </div>
        ) : null}

        <div ref={bottomRef} />
      </div>

      {pendingConfirmation ? (
        <div className="mx-3 mb-3 p-3 border border-primary/40 bg-primary/10 rounded-xl">
          <div className="text-xs font-mono text-primary mb-1">CONFIRM ACTION</div>
          <div className="text-sm text-foreground">{pendingConfirmation.summary}</div>
          {pendingConfirmation.warnings.length ? (
            <ul className="mt-2 space-y-1">
              {pendingConfirmation.warnings.map((warning) => (
                <li key={warning} className="text-xs text-warning">- {warning}</li>
              ))}
            </ul>
          ) : null}
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              onClick={cancelExecution}
              className="px-3 py-2 border border-border rounded-lg text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => void confirmExecution()}
              disabled={isExecuting}
              className="px-3 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:opacity-90 disabled:opacity-60"
            >
              {isExecuting ? 'Executing...' : 'Confirm'}
            </button>
          </div>
        </div>
      ) : null}

      {messages.length <= 2 ? (
        <div className="px-3 pb-2">
          <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-2">
            Try these prompts
          </div>
          <div className="flex flex-wrap gap-1.5">
            {quickSuggestions.map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => void submitPrompt(suggestion)}
                className="text-[11px] px-2.5 py-1.5 bg-elevated border border-border rounded-lg text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="p-3 border-t border-border bg-background">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                void submitPrompt();
              }
            }}
            placeholder="Describe an action or question..."
            className="flex-1 bg-elevated border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none font-mono"
          />
          <button
            onClick={() => void submitPrompt()}
            disabled={!input.trim() || isBusy}
            className="px-4 py-2.5 bg-primary text-primary-foreground rounded-xl font-semibold text-sm hover:opacity-90 disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

function ReadResultView({ readResult }: { readResult: AssistantReadResult }) {
  const chart = readResult.chartData;
  const barDataKey = chart?.type === 'bar' ? getBarDataKey(chart.data) : null;

  return (
    <div className="mt-3">
      {readResult.rows.length ? (
        <div className="text-xs text-muted-foreground mb-2">
          {readResult.rows.slice(0, 3).map((row, index) => (
            <div key={`row-${index}`} className="truncate">
              {Object.entries(row)
                .map(([key, value]) => `${key}: ${String(value)}`)
                .join(' | ')}
            </div>
          ))}
          {readResult.rows.length > 3 ? (
            <div className="text-[10px] mt-1 text-muted-foreground/80">
              +{readResult.rows.length - 3} more row(s)
            </div>
          ) : null}
        </div>
      ) : null}

      {chart ? (
        <div className="bg-background/50 rounded-lg p-3 border border-border">
          <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-2">
            {chart.label ?? 'Result Chart'}
          </div>
          {chart.type === 'bar' ? (
            <ResponsiveContainer width="100%" height={150}>
              <BarChart data={chart.data}>
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <ReTooltip
                  contentStyle={{
                    background: 'hsl(var(--elevated))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey={barDataKey ?? 'value'} fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <ResponsiveContainer width="100%" height={170}>
              <PieChart>
                <Pie data={chart.data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} strokeWidth={2} stroke="hsl(var(--background))">
                  {chart.data.map((_, index) => (
                    <Cell key={`pie-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <ReTooltip
                  contentStyle={{
                    background: 'hsl(var(--elevated))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      ) : null}
    </div>
  );
}

function getBarDataKey(data: Array<Record<string, string | number | boolean | null>>): string | null {
  if (!data.length) return null;
  const first = data[0];
  const key = Object.keys(first).find((entryKey) => {
    if (entryKey === 'name') return false;
    const value = first[entryKey];
    return typeof value === 'number';
  });
  return key ?? null;
}

function withAuthRecoveryHint(message: string): string {
  const normalized = message.toLowerCase();
  const isAuthError =
    normalized.includes('session expired') ||
    normalized.includes('session invalid') ||
    normalized.includes('invalid jwt') ||
    normalized.includes('jwt expired') ||
    normalized.includes('auth_user_unresolved') ||
    normalized.includes('auth_header_missing') ||
    normalized.includes('missing authenticated session') ||
    normalized.includes('unable to resolve authenticated user session') ||
    normalized.includes('not authenticated');

  if (!isAuthError) return message;
  if (normalized.includes('sign in again')) return message;

  return `${message} Please sign out and sign in again.`;
}
