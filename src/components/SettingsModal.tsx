import React from 'react';
import { AppSettings } from '../types';
import { X, Key, Cpu, Trash2, CheckCircle2, Mic, Volume2 } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
  serverStatus: { connected: boolean; geminiConfigured: boolean };
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  serverStatus,
}) => {
  if (!isOpen) return null;

  const handleClearLocalStorage = () => {
    if (confirm('Clear all local conversations and preferences?')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-lg bg-indigo-600/20 text-indigo-400">
              <Key className="w-4 h-4" />
            </span>
            <h2 className="font-bold text-sm text-slate-100">Platform Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs">
          {/* Server status alert */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between font-semibold">
              <span className="text-slate-300">Backend Server Status</span>
              <span className="flex items-center gap-1.5 text-emerald-400 text-[11px]">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Connected (Port 3000)
              </span>
            </div>
            <div className="text-[11px] text-slate-400">
              {serverStatus.geminiConfigured ? (
                <span className="text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Environment GEMINI_API_KEY detected and active.
                </span>
              ) : (
                <span className="text-amber-400">
                  No server GEMINI_API_KEY detected. Running with built-in reasoning engine. You can provide a key below.
                </span>
              )}
            </div>
          </div>

          {/* Voice Language Preference */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1.5">
              <Mic className="w-3.5 h-3.5 text-indigo-400" />
              Default Voice Recognition Language
            </label>
            <select
              value={settings.voiceLanguage || 'ur-PK'}
              onChange={(e) => onUpdateSettings({ ...settings, voiceLanguage: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-indigo-500 text-xs"
            >
              <option value="ur-PK">Urdu (اردو / Roman Urdu)</option>
              <option value="hi-IN">Hindi (हिन्दी / Hinglish)</option>
              <option value="en-US">English (United States)</option>
            </select>
          </div>

          {/* Auto Speak Toggle */}
          <div className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800">
            <div className="flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-indigo-400" />
              <div>
                <div className="text-slate-200 font-semibold">Voice Auto-Reply (TTS)</div>
                <div className="text-[10px] text-slate-400">Speak AI responses automatically out loud</div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.autoSpeak ?? true}
              onChange={(e) => onUpdateSettings({ ...settings, autoSpeak: e.target.checked })}
              className="w-4 h-4 accent-indigo-600 rounded"
            />
          </div>

          {/* Custom API Key input */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Custom Gemini API Key (Optional)
            </label>
            <input
              type="password"
              placeholder="AIzaSy..."
              value={settings.apiKey}
              onChange={(e) => onUpdateSettings({ ...settings, apiKey: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-mono text-xs"
            />
            <p className="text-[10px] text-slate-500 mt-1">
              Key is stored client-side in your browser for testing and requests.
            </p>
          </div>

          {/* Default Model */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Default Model</label>
            <select
              value={settings.defaultModel}
              onChange={(e) => onUpdateSettings({ ...settings, defaultModel: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-indigo-500 text-xs"
            >
              <option value="gemini-2.5-flash">Gemini 2.5 Flash (Recommended - Low Latency)</option>
              <option value="gemini-2.5-pro">Gemini 2.5 Pro (Deep Code & Reasoning)</option>
            </select>
          </div>

          {/* Reset Storage */}
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
            <span className="text-slate-400">Clear Cache & Chats</span>
            <button
              onClick={handleClearLocalStorage}
              className="px-2.5 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Reset All
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-950/80 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
