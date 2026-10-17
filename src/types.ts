export type NavTab = 'chat' | 'prompts' | 'flows' | 'scripts';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  model?: string;
  source?: 'gemini' | 'offline-agent';
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: ChatMessage[];
  systemInstruction?: string;
  model: string;
  temperature: number;
}

export interface PromptTemplate {
  id: string;
  title: string;
  category: 'Engineering' | 'Writing' | 'Marketing' | 'Business' | 'Research' | 'Design';
  description: string;
  prompt: string;
  variables: string[];
}

export interface FlowStep {
  id: string;
  title: string;
  description: string;
  promptTemplate: string;
  outputKey: string;
  output?: string;
  status: 'idle' | 'running' | 'completed' | 'error';
}

export interface Workflow {
  id: string;
  title: string;
  description: string;
  steps: FlowStep[];
}

export interface AppSettings {
  apiKey: string;
  defaultModel: string;
  defaultTemperature: number;
  userName: string;
}
