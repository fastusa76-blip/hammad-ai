import React, { useState } from 'react';
import { AppSettings } from '../types';
import { X, Key, Cpu, Trash2, CheckCircle2, Mic, Volume2, Sparkles, AlertTriangle, RefreshCw } from 'lucide-react';
import { testGeminiDiagnostic } from '../lib/api';

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
  const [testingGemini, setTestingGemini] = useState(false);
  const [geminiTestResult, setGeminiTestResult] = useState<{
    status: 'connected' | 'error' | 'missing_key';
    message?: string;
    errorMessage?: string;
    latencyMs?: number;
    model?: string;
  } | null>(null);

  if (!isOpen) return null;

  const handleTestGemini = async () => {
    setTestingGemini(true);
    setGeminiTestResult(null);
    try {
      const result = await testGeminiDiagnostic(settings.apiKey);
      setGeminiTestResult(result);
    } catch (err: any) {
      setGeminiTestResult({
        status: 'error',
        errorMessage: err.message || 'Diagnostic request failed',
      });
    } finally {
      setTestingGemini(false);
    }
  };

  const handleClearLocalStorage = () => {
    if (confirm('تمام گفتگو اور سیٹنگز کو ری سیٹ کریں؟ (Clear all local conversations and preferences?)')) {
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
            <span className="p-1.5 rounded-lg bg-indigo-600/20 text-indigo-400">
              <Key className="w-4 h-4" />
            </span>
            <h2 className="font-bold text-sm text-slate-100">Platform & API Diagnostics</h2>
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
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between font-semibold">
              <span className="text-slate-300">Backend Server Status</span>
              <span className="flex items-center gap-1.5 text-emerald-400 text-[11px]">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Connected (Port 3000)
              </span>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-slate-400 text-[11px]">Gemini 2.5 API Connection:</span>
              <button
                onClick={handleTestGemini}
                disabled={testingGemini}
                className="px-2.5 py-1 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/40 text-[11px] font-medium flex items-center gap-1 transition-colors disabled:opacity-40"
              >
                <RefreshCw className={`w-3 h-3 ${testingGemini ? 'animate-spin' : ''}`} />
                <span>{testingGemini ? 'Testing...' : 'Test Connection'}</span>
              </button>
            </div>

            {/* Test result diagnosis */}
            {geminiTestResult && (
              <div
                className={`p-2.5 rounded-lg border text-[11px] mt-2 ${
                  geminiTestResult.status === 'connected'
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                }`}
              >
                {geminiTestResult.status === 'connected' ? (
                  <div className="flex items-center gap-1.5 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>
                      Gemini API Active! ({geminiTestResult.model}, {geminiTestResult.latencyMs}ms)
                    </span>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 font-bold">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                      <span>Gemini API Error:</span>
                    </div>
                    <div className="text-[10px] text-rose-200 font-mono break-all">
                      {geminiTestResult.errorMessage || geminiTestResult.message}
                    </div>
                  </div>
                )}
              </div>
            )}
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
              Custom Gemini API Key Override (Optional)
            </label>
            <input
              type="password"
              placeholder="AIzaSy..."
              value={settings.apiKey}
              onChange={(e) => onUpdateSettings({ ...settings, apiKey: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-mono text-xs"
            />
            <p className="text-[10px] text-slate-500 mt-1">
              Never exposed to the public. Stored only in your local browser storage.
            </p>
          </div>

          {/* Reset Storage */}
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
            <span className="text-slate-400">Clear Cache & Reset</span>
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
