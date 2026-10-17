import React from 'react';
import { NavTab } from '../types';
import { MessageSquare, Sparkles, Workflow, FileText, Settings, Cpu, CheckCircle2, AlertCircle } from 'lucide-react';

interface HeaderProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  openSettings: () => void;
  serverStatus: { connected: boolean; geminiConfigured: boolean };
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  openSettings,
  serverStatus,
}) => {
  const tabs = [
    { id: 'chat' as NavTab, label: 'AI Chat', icon: MessageSquare },
    { id: 'prompts' as NavTab, label: 'Prompt Studio', icon: Sparkles },
    { id: 'flows' as NavTab, label: 'Flow Builder', icon: Workflow },
    { id: 'scripts' as NavTab, label: 'Script Studio', icon: FileText },
  ];

  return (
    <header className="h-16 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between z-30 sticky top-0">
      <div className="flex items-center gap-6">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white font-black text-lg tracking-wider">
            H
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                Hammad AI
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
                Studio
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">Intelligent AI Engineering Platform</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-950/60 p-1 rounded-xl border border-slate-800/80">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-3">
        {/* Server status pill */}
        <div
          title={
            serverStatus.geminiConfigured
              ? 'Gemini 2.5 API is connected & ready'
              : 'Server connected (Local engine active, add API key for Gemini 2.5)'
          }
          className="flex items-center gap-2 px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-800/70 border border-slate-700/60 text-slate-300 cursor-pointer"
          onClick={openSettings}
        >
          {serverStatus.geminiConfigured ? (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-emerald-400 hidden sm:inline">Gemini 2.5 Live</span>
            </>
          ) : (
            <>
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              <span className="text-amber-300 hidden sm:inline">Local Engine</span>
            </>
          )}
          <Cpu className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
        </div>

        {/* Settings button */}
        <button
          onClick={openSettings}
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-700"
          title="Platform Settings & API Keys"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
