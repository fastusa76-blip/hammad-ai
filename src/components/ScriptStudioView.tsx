import React, { useState } from 'react';
import { FileText, Sparkles, Copy, Check, Download, Video, Mic, Radio, Send, BookOpen } from 'lucide-react';
import { generateScript } from '../lib/api';
import { AppSettings } from '../types';

interface ScriptStudioViewProps {
  settings: AppSettings;
}

const SCRIPT_TYPES = [
  { id: 'YouTube Video Breakdown', label: 'YouTube Video Script', icon: Video, desc: 'Hook, visual cues, timestamps, structured content, and CTA.' },
  { id: 'Podcast Episode & Discussion', label: 'Podcast Discussion', icon: Mic, desc: 'Intro monologue, guest prompts, dynamic transitions, and outro.' },
  { id: 'Product Demo & Walkthrough', label: 'Product Demo Walkthrough', icon: Radio, desc: 'High-converting software demo script with feature highlights.' },
  { id: 'Technical Masterclass Mini-Lecture', label: 'Educational Mini-Lecture', icon: BookOpen, desc: 'Pedagogical clarity, analogies, syntax breakdown, and recap.' },
];

export const ScriptStudioView: React.FC<ScriptStudioViewProps> = ({ settings }) => {
  const [scriptType, setScriptType] = useState(SCRIPT_TYPES[0].id);
  const [topic, setTopic] = useState('How Modern AI Agents Work: From Prompting to Autonomous Loops');
  const [tone, setTone] = useState('Dynamic & High Energy');
  const [length, setLength] = useState('3-5 Minute Breakdown');
  const [audience, setAudience] = useState('Developers, Tech Founders, and AI Enthusiasts');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedScript, setGeneratedScript] = useState('');
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    if (!topic.trim() || isGenerating) return;
    setIsGenerating(true);

    try {
      const res = await generateScript({
        scriptType,
        topic,
        tone,
        length,
        audience,
        apiKey: settings.apiKey,
      });
      setGeneratedScript(res.script);
    } catch (err: any) {
      alert(`Script generation error: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([generatedScript], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${scriptType.replace(/\s+/g, '_').toLowerCase()}.md`;
    a.click();
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-4rem)] overflow-y-auto bg-slate-950 p-4 sm:p-8">
      <div className="max-w-5xl mx-auto w-full space-y-6">
        {/* Header */}
        <div className="border-b border-slate-800 pb-5">
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <FileText className="w-4 h-4" />
            </span>
            <h1 className="text-xl font-bold text-slate-100">Hammad AI Script Studio</h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400">
            Generate cinematic, ready-to-record scripts with visual markers, timing, and narrative pacing.
          </p>
        </div>

        {/* Script Config Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Controls Form */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">Script Format</label>
                <div className="space-y-2">
                  {SCRIPT_TYPES.map((t) => {
                    const Icon = t.icon;
                    const isSelected = scriptType === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setScriptType(t.id)}
                        className={`w-full p-2.5 rounded-xl border text-left transition-all flex items-start gap-2.5 ${
                          isSelected
                            ? 'bg-indigo-600/10 border-indigo-500 text-white'
                            : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                        }`}
                      >
                        <Icon className={`w-4 h-4 shrink-0 mt-0.5 ${isSelected ? 'text-indigo-400' : 'text-slate-500'}`} />
                        <div>
                          <div className="text-xs font-bold">{t.label}</div>
                          <div className="text-[11px] text-slate-400 leading-tight">{t.desc}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Script Subject / Topic</label>
                <textarea
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
                  placeholder="What is this script about?"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Tone</label>
                  <select
                    value={tone}
                    onChange={(e) => setTone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Dynamic & High Energy">Dynamic & High Energy</option>
                    <option value="Technical & Authoritative">Technical & Authoritative</option>
                    <option value="Conversational & Engaging">Conversational & Engaging</option>
                    <option value="Direct & Persuasive">Direct & Persuasive</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Length</label>
                  <select
                    value={length}
                    onChange={(e) => setLength(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="60s Short / Reel">60s Short / Reel</option>
                    <option value="3-5 Minute Breakdown">3-5 Minute Breakdown</option>
                    <option value="8-10 Minute In-Depth">8-10 Minute In-Depth</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Target Audience</label>
                <input
                  type="text"
                  value={audience}
                  onChange={(e) => setAudience(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <button
                onClick={handleGenerate}
                disabled={!topic.trim() || isGenerating}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-semibold text-xs transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 disabled:opacity-40"
              >
                {isGenerating ? (
                  <>
                    <Sparkles className="w-4 h-4 animate-spin" />
                    <span>Writing Production Script...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Generate Script</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Script Output Area */}
          <div className="lg:col-span-2">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col h-full min-h-[500px]">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 text-indigo-400" />
                  Generated Script Preview
                </div>

                {generatedScript && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopy}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1 border border-slate-700 transition-colors"
                    >
                      {copied ? (
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
                    <button
                      onClick={handleDownload}
                      className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium flex items-center gap-1 transition-colors"
                    >
                      <Download className="w-3 h-3" />
                      <span>Download .md</span>
                    </button>
                  </div>
                )}
              </div>

              {!generatedScript ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-slate-500 space-y-2">
                  <FileText className="w-8 h-8 text-slate-700" />
                  <p className="text-xs">
                    Configure your parameters on the left and click "Generate Script" to create an actionable production script.
                  </p>
                </div>
              ) : (
                <textarea
                  value={generatedScript}
                  onChange={(e) => setGeneratedScript(e.target.value)}
                  className="flex-1 w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs sm:text-sm text-slate-200 font-mono resize-none focus:outline-none focus:border-indigo-500 leading-relaxed"
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
