import React, { useState, useEffect } from 'react';
import { NavTab, Conversation, AppSettings } from './types';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { VoiceAssistantView } from './components/VoiceAssistantView';
import { ChatView } from './components/ChatView';
import { PromptStudioView } from './components/PromptStudioView';
import { FlowBuilderView } from './components/FlowBuilderView';
import { ScriptStudioView } from './components/ScriptStudioView';
import { SettingsModal } from './components/SettingsModal';
import { DesktopBridgeModal } from './components/DesktopBridgeModal';
import { checkServerHealth } from './lib/api';

const DEFAULT_CONVERSATION: Conversation = {
  id: 'default-conv-1',
  title: 'Welcome to Hammad AI',
  createdAt: Date.now(),
  updatedAt: Date.now(),
  messages: [
    {
      id: 'welcome-msg',
      role: 'assistant',
      content: `# Welcome to Hammad AI Studio

I am your unified AI voice assistant and engineering workspace.

### Key Capabilities:
- **Voice AI Assistant**: Real-time voice listening, Urdu/Hindi/English speech synthesis, local laptop application launcher (Chrome, Android Studio, VS Code), and YouTube playback!
- **AI Chat Hub**: Context-aware dialogue powered by Google Gemini.
- **Prompt Studio**: Optimize and benchmark prompt architectures with variables.
- **Flow Builder**: Run multi-step automated execution pipelines.
- **Script Studio**: Generate high-impact media and video scripts.`,
      timestamp: Date.now(),
      model: 'gemini-2.5-flash',
      source: 'offline-agent',
    },
  ],
  model: 'gemini-2.5-flash',
  temperature: 0.7,
};

const DEFAULT_SETTINGS: AppSettings = {
  apiKey: '',
  defaultModel: 'gemini-2.5-flash',
  defaultTemperature: 0.7,
  userName: 'Engineer',
  voiceLanguage: 'ur-PK',
  autoSpeak: true,
  bridgePort: 8765,
};

export function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('voice');

  // Load conversations from localStorage or fallback
  const [conversations, setConversations] = useState<Conversation[]>(() => {
    try {
      const saved = localStorage.getItem('hammad_ai_conversations');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to parse conversations from local storage');
    }
    return [DEFAULT_CONVERSATION];
  });

  const [activeConversationId, setActiveConversationId] = useState<string>(
    conversations[0]?.id || DEFAULT_CONVERSATION.id
  );

  // Settings
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem('hammad_ai_settings');
      if (saved) return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
    } catch (e) {
      console.warn('Failed to parse settings');
    }
    return DEFAULT_SETTINGS;
  });

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isBridgeModalOpen, setIsBridgeModalOpen] = useState(false);
  const [serverStatus, setServerStatus] = useState({ connected: false, geminiConfigured: false });

  // Persist conversations
  useEffect(() => {
    try {
      localStorage.setItem('hammad_ai_conversations', JSON.stringify(conversations));
    } catch (e) {
      console.warn('LocalStorage save error:', e);
    }
  }, [conversations]);

  // Persist settings
  useEffect(() => {
    try {
      localStorage.setItem('hammad_ai_settings', JSON.stringify(settings));
    } catch (e) {
      console.warn('LocalStorage settings save error:', e);
    }
  }, [settings]);

  // Check health on mount
  useEffect(() => {
    checkServerHealth().then((res) => {
      if (res && res.status === 'ok') {
        setServerStatus({
          connected: true,
          geminiConfigured: Boolean(res.geminiConfigured),
        });
      }
    });
  }, []);

  const activeConversation =
    conversations.find((c) => c.id === activeConversationId) || conversations[0] || DEFAULT_CONVERSATION;

  const handleNewConversation = () => {
    const newConv: Conversation = {
      id: crypto.randomUUID(),
      title: 'New Session',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [],
      model: settings.defaultModel,
      temperature: settings.defaultTemperature,
    };
    setConversations([newConv, ...conversations]);
    setActiveConversationId(newConv.id);
    setActiveTab('chat');
  };

  const handleDeleteConversation = (id: string) => {
    const remaining = conversations.filter((c) => c.id !== id);
    if (remaining.length === 0) {
      const fresh = { ...DEFAULT_CONVERSATION, id: crypto.randomUUID() };
      setConversations([fresh]);
      setActiveConversationId(fresh.id);
    } else {
      setConversations(remaining);
      if (activeConversationId === id) {
        setActiveConversationId(remaining[0].id);
      }
    }
  };

  const handleUpdateConversation = (updated: Conversation) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === updated.id ? updated : c))
    );
  };

  const handleSendPromptToChat = (promptText: string) => {
    const newConv: Conversation = {
      id: crypto.randomUUID(),
      title: promptText.slice(0, 30) + '...',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [],
      model: settings.defaultModel,
      temperature: settings.defaultTemperature,
    };
    setConversations([newConv, ...conversations]);
    setActiveConversationId(newConv.id);
    setActiveTab('chat');

    setTimeout(() => {
      const textarea = document.querySelector('textarea');
      if (textarea) {
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
          window.HTMLTextAreaElement.prototype,
          'value'
        )?.set;
        nativeInputValueSetter?.call(textarea, promptText);
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }, 100);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        openSettings={() => setIsSettingsOpen(true)}
        openBridgeModal={() => setIsBridgeModalOpen(true)}
        serverStatus={serverStatus}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Show sidebar on chat tab */}
        {activeTab === 'chat' && (
          <Sidebar
            conversations={conversations}
            activeConversationId={activeConversationId}
            onSelectConversation={setActiveConversationId}
            onNewConversation={handleNewConversation}
            onDeleteConversation={handleDeleteConversation}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
          />
        )}

        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {activeTab === 'voice' && (
            <VoiceAssistantView
              settings={settings}
              openBridgeModal={() => setIsBridgeModalOpen(true)}
            />
          )}

          {activeTab === 'chat' && (
            <ChatView
              conversation={activeConversation}
              onUpdateConversation={handleUpdateConversation}
              settings={settings}
            />
          )}

          {activeTab === 'prompts' && (
            <PromptStudioView
              settings={settings}
              onSendToChat={handleSendPromptToChat}
            />
          )}

          {activeTab === 'flows' && <FlowBuilderView settings={settings} />}

          {activeTab === 'scripts' && <ScriptStudioView settings={settings} />}
        </main>
      </div>

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={setSettings}
        serverStatus={serverStatus}
      />

      <DesktopBridgeModal
        isOpen={isBridgeModalOpen}
        onClose={() => setIsBridgeModalOpen(false)}
      />
    </div>
  );
}

export default App;
