import React, { useState, useRef, useEffect } from 'react';
import { Conversation, ChatMessage, AppSettings } from '../types';
import { Send, Bot, User, Copy, Check, Sparkles, Download, RotateCcw, Sliders, Shield } from 'lucide-react';
import { sendChatMessage } from '../lib/api';

interface ChatViewProps {
  conversation: Conversation;
  onUpdateConversation: (updated: Conversation) => void;
  settings: AppSettings;
}

const PERSONAS = [
  { id: 'architect', name: 'Software Architect', prompt: 'You are a Principal Software Architect. Provide robust, clean, type-safe architecture advice, modular patterns, and performance considerations.' },
  { id: 'prompt_engineer', name: 'Prompt Specialist', prompt: 'You are a master Prompt Engineer. Analyze prompts, optimize instructions with role framing, chain-of-thought, input delimiters, and output formatting.' },
  { id: 'copywriter', name: 'Elite Copywriter', prompt: 'You are a top-tier copywriter and growth marketer. Craft compelling, conversion-focused, punchy copy with high-impact hooks.' },
  { id: 'data_analyst', name: 'Data Scientist', prompt: 'You are an expert Data Scientist. Focus on statistical rigor, data pipeline design, actionable metrics, and predictive insights.' },
  { id: 'general', name: 'General AI Assistant', prompt: 'You are Hammad AI, a helpful, intelligent, precise, and polite AI assistant.' }
];

export const ChatView: React.FC<ChatViewProps> = ({
  conversation,
  onUpdateConversation,
  settings,
}) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedPersona, setSelectedPersona] = useState(conversation.systemInstruction || PERSONAS[0].prompt);
  const [model, setModel] = useState(conversation.model || 'gemini-2.5-flash');
  const [temperature, setTemperature] = useState(conversation.temperature ?? 0.7);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation.messages, isLoading]);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSend = async (textToSend?: string) => {
    const messageContent = (textToSend ?? input).trim();
    if (!messageContent || isLoading) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: messageContent,
      timestamp: Date.now(),
    };

    const updatedMessages = [...conversation.messages, userMsg];
    let newTitle = conversation.title;
    if (conversation.messages.length === 0) {
      newTitle = messageContent.slice(0, 30) + (messageContent.length > 30 ? '...' : '');
    }

    onUpdateConversation({
      ...conversation,
      title: newTitle,
      messages: updatedMessages,
      systemInstruction: selectedPersona,
      model,
      temperature,
      updatedAt: Date.now(),
    });

    setInput('');
    setIsLoading(true);

    try {
      const response = await sendChatMessage({
        messages: updatedMessages.map((m) => ({ role: m.role, content: m.content })),
        systemInstruction: selectedPersona,
        model,
        temperature,
        apiKey: settings.apiKey,
      });

      const assistantMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: response.text,
        timestamp: Date.now(),
        model: response.model,
        source: response.source,
      };

      onUpdateConversation({
        ...conversation,
        title: newTitle,
        messages: [...updatedMessages, assistantMsg],
        systemInstruction: selectedPersona,
        model,
        temperature,
        updatedAt: Date.now(),
      });
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `Error: ${err.message || 'Failed to generate response. Please check connection.'}`,
        timestamp: Date.now(),
      };
      onUpdateConversation({
        ...conversation,
        messages: [...updatedMessages, errorMsg],
        updatedAt: Date.now(),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClearHistory = () => {
    if (confirm('Are you sure you want to clear this conversation?')) {
      onUpdateConversation({
        ...conversation,
        messages: [],
        updatedAt: Date.now(),
      });
    }
  };

  const handleExportMarkdown = () => {
    const md = conversation.messages
      .map((m) => `### ${m.role === 'user' ? 'User' : 'Hammad AI'}\n\n${m.content}\n\n---`)
      .join('\n\n');
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${conversation.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.md`;
    a.click();
  };

  const starterPrompts = [
    { title: 'Architectural Review', text: 'Review this microservices architecture and suggest optimal caching and resilience strategies.' },
    { title: 'Prompt Optimization', text: 'Enhance this prompt for a code generator to prevent hallucinated imports.' },
    { title: 'Marketing Hook', text: 'Write 5 high-converting headlines for an AI-powered developer tool.' },
    { title: 'TypeScript Utility', text: 'Write an asynchronous retry wrapper with exponential backoff and jitter in TypeScript.' },
  ];

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-4rem)] bg-slate-950">
      {/* Conversation Topbar */}
      <div className="h-13 border-b border-slate-800/80 px-4 flex items-center justify-between bg-slate-900/60 shrink-0">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-xs sm:text-sm text-slate-200 truncate max-w-[200px] sm:max-w-xs">
            {conversation.title}
          </span>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-indigo-300 font-mono border border-slate-700">
            {model}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Persona selector */}
          <select
            value={PERSONAS.find((p) => p.prompt === selectedPersona)?.id || 'custom'}
            onChange={(e) => {
              const matched = PERSONAS.find((p) => p.id === e.target.value);
              if (matched) setSelectedPersona(matched.prompt);
            }}
            className="text-[11px] bg-slate-800 text-slate-300 border border-slate-700 rounded-lg px-2 py-1 focus:outline-none focus:border-indigo-500 hidden sm:block"
          >
            {PERSONAS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          {/* Model selector toggle */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-1.5 rounded-lg border text-xs flex items-center gap-1.5 transition-colors ${
              showSettings
                ? 'bg-indigo-600 text-white border-indigo-500'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
            }`}
            title="Model & Tuning Parameters"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Parameters</span>
          </button>

          {/* Export */}
          <button
            onClick={handleExportMarkdown}
            disabled={conversation.messages.length === 0}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors disabled:opacity-40"
            title="Export Markdown"
          >
            <Download className="w-3.5 h-3.5" />
          </button>

          {/* Clear */}
          <button
            onClick={handleClearHistory}
            disabled={conversation.messages.length === 0}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/40 text-slate-300 hover:text-rose-300 border border-slate-700 transition-colors disabled:opacity-40"
            title="Clear Chat"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Settings drawer / popover */}
      {showSettings && (
        <div className="bg-slate-900 border-b border-slate-800 p-4 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs shrink-0">
          <div>
            <label className="block text-slate-400 font-medium mb-1">Model Selection</label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="gemini-2.5-flash">Gemini 2.5 Flash (Ultra Fast & Adaptive)</option>
              <option value="gemini-2.5-pro">Gemini 2.5 Pro (Deep Reasoning & Architecture)</option>
            </select>
          </div>
          <div>
            <div className="flex justify-between text-slate-400 font-medium mb-1">
              <span>Temperature</span>
              <span>{temperature.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
              className="w-full accent-indigo-500"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-0.5">
              <span>Precise (0.0)</span>
              <span>Balanced (0.7)</span>
              <span>Creative (1.0)</span>
            </div>
          </div>
          <div>
            <label className="block text-slate-400 font-medium mb-1">Active Persona</label>
            <select
              value={PERSONAS.find((p) => p.prompt === selectedPersona)?.id || 'custom'}
              onChange={(e) => {
                const matched = PERSONAS.find((p) => p.id === e.target.value);
                if (matched) setSelectedPersona(matched.prompt);
              }}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              {PERSONAS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
        {conversation.messages.length === 0 ? (
          <div className="max-w-2xl mx-auto py-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-bold text-slate-100 mb-2">Welcome to Hammad AI Hub</h2>
            <p className="text-xs sm:text-sm text-slate-400 mb-8 max-w-md mx-auto">
              Your high-fidelity workspace for prompt optimization, code generation, and multi-step AI reasoning.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
              {starterPrompts.map((starter, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(starter.text)}
                  className="p-3.5 rounded-xl bg-slate-900/80 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 text-left transition-all group"
                >
                  <div className="text-xs font-semibold text-indigo-400 group-hover:text-indigo-300 flex items-center gap-1.5 mb-1">
                    <Sparkles className="w-3 h-3" />
                    {starter.title}
                  </div>
                  <div className="text-xs text-slate-400 group-hover:text-slate-300 line-clamp-2">
                    {starter.text}
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          conversation.messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-4xl mx-auto ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`relative group rounded-2xl p-4 text-xs sm:text-sm leading-relaxed max-w-[85%] ${
                    isUser
                      ? 'bg-indigo-600 text-white rounded-tr-sm shadow-md shadow-indigo-600/20'
                      : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-sm shadow-sm'
                  }`}
                >
                  {/* Top info badge for assistant */}
                  {!isUser && (
                    <div className="flex items-center justify-between gap-3 text-[10px] text-slate-400 mb-2 pb-1.5 border-b border-slate-800">
                      <span className="font-semibold text-indigo-400 flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> Hammad AI
                        {msg.model && <span className="text-slate-500">({msg.model})</span>}
                      </span>
                      <button
                        onClick={() => handleCopy(msg.id, msg.content)}
                        className="opacity-70 hover:opacity-100 flex items-center gap-1 text-slate-400 hover:text-slate-200 transition-opacity"
                        title="Copy content"
                      >
                        {copiedId === msg.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-400">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {/* Render content */}
                  <div className="whitespace-pre-wrap break-words">{msg.content}</div>

                  {/* Message timestamp */}
                  <div
                    className={`text-[9px] mt-2 font-mono ${
                      isUser ? 'text-indigo-200/70 text-right' : 'text-slate-500'
                    }`}
                  >
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>

                {isUser && (
                  <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 flex items-center justify-center shrink-0 mt-0.5">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })
        )}

        {isLoading && (
          <div className="flex gap-3 max-w-4xl mx-auto">
            <div className="w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 animate-spin" />
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl rounded-tl-sm p-4 text-xs text-slate-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></span>
              <span>Hammad AI is synthesizing solution...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-900/80 backdrop-blur shrink-0">
        <div className="max-w-4xl mx-auto">
          <div className="relative rounded-2xl bg-slate-950 border border-slate-800 focus-within:border-indigo-500 transition-colors shadow-inner">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything, design an architecture, optimize a prompt... (Press Enter to send)"
              rows={3}
              className="w-full bg-transparent p-3.5 pr-14 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none resize-none"
            />
            <div className="absolute right-3 bottom-3 flex items-center gap-2">
              <button
                onClick={() => handleSend()}
                disabled={!input.trim() || isLoading}
                className="w-9 h-9 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center transition-all disabled:opacity-40 disabled:hover:bg-indigo-600 shadow-md shadow-indigo-600/20"
                title="Send message"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="flex justify-between items-center text-[10px] text-slate-500 px-2 mt-2">
            <span>Powered by Google Gemini 2.5 on Node.js 22</span>
            <span>Shift + Enter for new line</span>
          </div>
        </div>
      </div>
    </div>
  );
};
