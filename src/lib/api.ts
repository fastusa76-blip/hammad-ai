import { ChatMessage } from '../types';

export async function checkServerHealth() {
  try {
    const res = await fetch('/api/health');
    return await res.json();
  } catch (err) {
    return { status: 'error', geminiConfigured: false };
  }
}

export async function testGeminiDiagnostic(apiKey?: string): Promise<{
  configured: boolean;
  status: 'connected' | 'error' | 'missing_key';
  model?: string;
  latencyMs?: number;
  errorMessage?: string;
  errorCode?: string;
  message?: string;
  response?: string;
}> {
  try {
    const res = await fetch('/api/gemini/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(apiKey ? { apiKey } : {}),
    });
    return await res.json();
  } catch (err: any) {
    return {
      configured: false,
      status: 'error',
      errorMessage: err.message || 'Network error reaching server',
    };
  }
}

export async function sendChatMessage(params: {
  messages: Array<{ role: string; content: string }>;
  systemInstruction?: string;
  model?: string;
  temperature?: number;
  apiKey?: string;
}): Promise<{
  text: string;
  model?: string;
  source?: 'gemini' | 'offline-agent';
  note?: string;
  geminiError?: { message: string; code?: string };
}> {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Server responded with ${res.status}`);
  }

  return await res.json();
}

export async function enhancePrompt(params: {
  prompt: string;
  focus: string;
  targetModel?: string;
  apiKey?: string;
}): Promise<{
  enhancedPrompt: string;
  improvements: string[];
  focusApplied: string;
  variablesFound: string[];
  recommendedSettings?: { temperature: number; topP: number };
}> {
  const res = await fetch('/api/enhance-prompt', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Server responded with ${res.status}`);
  }

  return await res.json();
}

export async function runFlowStep(params: {
  stepTitle: string;
  prompt: string;
  inputs: Record<string, string>;
  apiKey?: string;
}): Promise<{ stepTitle: string; output: string; source: string }> {
  const res = await fetch('/api/run-flow-step', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Step failed with ${res.status}`);
  }

  return await res.json();
}

export async function generateScript(params: {
  scriptType: string;
  topic: string;
  tone?: string;
  length?: string;
  audience?: string;
  apiKey?: string;
}): Promise<{ script: string; source: string }> {
  const res = await fetch('/api/generate-script', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Script generation failed: ${res.status}`);
  }

  return await res.json();
}
