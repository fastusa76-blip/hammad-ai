import React, { useState } from 'react';
import { Conversation, NavTab } from '../types';
import { Plus, MessageSquare, Trash2, Search, Mic, Sparkles, Workflow, FileText } from 'lucide-react';

interface SidebarProps {
  conversations: Conversation[];
  activeConversationId: string;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  onDeleteConversation: (id: string) => void;
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  activeTab,
  setActiveTab,
}) => {
  const [search, setSearch] = useState('');

  const filteredConversations = conversations.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-[calc(100vh-4rem)] shrink-0">
      {/* Mobile nav switcher */}
      <div className="p-3 border-b border-slate-800 md:hidden flex flex-col gap-1">
        <div className="grid grid-cols-2 gap-1">
          <button
            onClick={() => setActiveTab('voice')}
            className={`px-2 py-1.5 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 ${
              activeTab === 'voice' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300'
            }`}
          >
            <Mic className="w-3.5 h-3.5 text-rose-400" />
            Voice AI
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`px-2 py-1.5 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 ${
              activeTab === 'chat' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Chat
          </button>
          <button
            onClick={() => setActiveTab('prompts')}
            className={`px-2 py-1.5 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 ${
              activeTab === 'prompts' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Prompts
          </button>
          <button
            onClick={() => setActiveTab('flows')}
            className={`px-2 py-1.5 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 ${
              activeTab === 'flows' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300'
            }`}
          >
            <Workflow className="w-3.5 h-3.5" />
            Flows
          </button>
        </div>
      </div>

      {/* New chat action */}
      <div className="p-3 border-b border-slate-800">
        <button
          onClick={() => {
            setActiveTab('chat');
            onNewConversation();
          }}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition-all shadow-md shadow-indigo-600/20 active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          <span>New AI Session</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="px-3 pt-3 pb-2">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search history..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950/80 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto px-2 py-1 space-y-1">
        <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
          Recent Conversations ({conversations.length})
        </div>

        {filteredConversations.length === 0 ? (
          <div className="text-center py-8 px-4 text-xs text-slate-500">
            No conversations found
          </div>
        ) : (
          filteredConversations.map((c) => {
            const isActive = c.id === activeConversationId;
            return (
              <div
                key={c.id}
                onClick={() => {
                  setActiveTab('chat');
                  onSelectConversation(c.id);
                }}
                className={`group flex items-center justify-between px-2.5 py-2 rounded-lg text-xs cursor-pointer transition-colors ${
                  isActive
                    ? 'bg-slate-800 text-indigo-300 font-medium border border-slate-700/80'
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-indigo-400' : 'text-slate-500'}`} />
                  <span className="truncate">{c.title}</span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteConversation(c.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 hover:text-rose-400 text-slate-500 p-1 transition-opacity"
                  title="Delete chat"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/40 text-[11px] text-slate-500 flex items-center justify-between">
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          Hammad Voice AI
        </span>
        <span className="text-slate-400">v2.5</span>
      </div>
    </aside>
  );
};
