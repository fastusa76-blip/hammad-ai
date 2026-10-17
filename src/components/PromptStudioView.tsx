import React, { useState } from 'react';
import { Sparkles, ArrowRight, Copy, Check, Send, CheckCircle2, Sliders, BookOpen, Layers, Code } from 'lucide-react';
import { enhancePrompt } from '../lib/api';
import { AppSettings, PromptTemplate } from '../types';

interface PromptStudioViewProps {
  settings: AppSettings;
  onSendToChat: (prompt: string) => void;
}

const TEMPLATES: PromptTemplate[] = [
  {
    id: '1',
    title: 'Strict Type-Safe TypeScript Architect',
    category: 'Engineering',
    description: 'Enforces zero `any` types, comprehensive error boundaries, and idiomatic FP patterns.',
    prompt: `You are a Principal Software Engineer. Write clean, production-ready TypeScript code for {{task_description}}.
Constraints:
- Strictly no 'any' types; define explicit interfaces.
- Handle failure scenarios with exhaustive type unions.
- Include JSDoc comments explaining architectural rationale.
Input specifications: {{input_specs}}`,
    variables: ['task_description', 'input_specs'],
  },
  {
    id: '2',
    title: 'High-Converting SaaS Landing Page Copy',
    category: 'Marketing',
    description: 'Generates irresistible hero headlines, benefit pillars, and objection-killing social proof.',
    prompt: `Act as a world-class Direct Response Copywriter. Create high-converting website copy for {{product_name}}, an innovative product that helps {{target_audience}} achieve {{core_benefit}}.
Include:
1. Irresistible Hero Headline & Sub-headline
2. 3 Benefit-driven feature breakdown with emotional hooks
3. 2 High-urgency Call-to-Action buttons
4. Objection-killing FAQ addressing {{top_objection}}`,
    variables: ['product_name', 'target_audience', 'core_benefit', 'top_objection'],
  },
  {
    id: '3',
    title: 'API Security & Vulnerability Auditor',
    category: 'Engineering',
    description: 'Performs OWASP Top 10 security audit on endpoints and server-side logic.',
    prompt: `Act as an expert Application Security Penetration Tester. Audit the following backend endpoint for OWASP Top 10 vulnerabilities:
"""
{{code_snippet}}
"""
Output Format:
1. Vulnerability Matrix (Severity: Critical/High/Medium/Low, CWE classification)
2. Threat Vector Explanation
3. Remediated Code Block with defense-in-depth principles applied`,
    variables: ['code_snippet'],
  },
  {
    id: '4',
    title: 'C-Suite Executive Briefing & Decision Memo',
    category: 'Business',
    description: 'Distills complex technical projects into strategic ROI, risks, and resource requirements.',
    prompt: `Act as a Chief Technology Officer preparing an executive briefing for the CEO and Board.
Topic: {{strategic_initiative}}
Deliverables:
- Executive Summary (Max 3 sentences)
- Financial & ROI Projections (Short-term vs Long-term)
- Critical Risks & Mitigation Matrix
- Clear Go / No-Go Decision Criteria`,
    variables: ['strategic_initiative'],
  },
  {
    id: '5',
    title: 'Few-Shot Synthetic Data Generator',
    category: 'Research',
    description: 'Generates calibrated JSON datasets formatted with exact schema validation.',
    prompt: `Generate 5 realistic, high-entropy synthetic data records for {{domain_entity}}.
Format strictly as a valid JSON array complying with this schema:
{{json_schema}}
Ensure realistic edge cases (nullables, special characters, unicode, boundaries).`,
    variables: ['domain_entity', 'json_schema'],
  },
];

export const PromptStudioView: React.FC<PromptStudioViewProps> = ({
  settings,
  onSendToChat,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'enhancer' | 'templates'>('enhancer');
  const [rawPrompt, setRawPrompt] = useState('');
  const [focus, setFocus] = useState('Clarity & Structured Guardrails');
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [enhancedResult, setEnhancedResult] = useState<{
    enhancedPrompt: string;
    improvements: string[];
    variablesFound: string[];
    recommendedSettings?: { temperature: number; topP: number };
  } | null>(null);

  const [variableValues, setVariableValues] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState(false);

  const handleEnhance = async () => {
    if (!rawPrompt.trim() || isEnhancing) return;
    setIsEnhancing(true);

    try {
      const res = await enhancePrompt({
        prompt: rawPrompt,
        focus,
        apiKey: settings.apiKey,
      });

      setEnhancedResult(res);
      // Initialize detected variables
      const initVars: Record<string, string> = {};
      res.variablesFound?.forEach((v) => {
        initVars[v] = '';
      });
      setVariableValues(initVars);
    } catch (err: any) {
      alert(`Error enhancing prompt: ${err.message}`);
    } finally {
      setIsEnhancing(false);
    }
  };

  const getPopulatedPrompt = () => {
    if (!enhancedResult) return '';
    let text = enhancedResult.enhancedPrompt;
    Object.entries(variableValues).forEach(([k, v]) => {
      const regex = new RegExp(`{{${k}}}`, 'g');
      text = text.replace(regex, v || `[${k}]`);
    });
    return text;
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-4rem)] overflow-y-auto bg-slate-950 p-4 sm:p-8">
      <div className="max-w-5xl mx-auto w-full space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-1.5 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
                <Sparkles className="w-4 h-4" />
              </span>
              <h1 className="text-xl font-bold text-slate-100">Hammad AI Prompt Studio</h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-400">
              Transform basic instructions into deterministic, high-performance prompts optimized for Gemini 2.5.
            </p>
          </div>

          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveSubTab('enhancer')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeSubTab === 'enhancer'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Prompt Enhancer
            </button>
            <button
              onClick={() => setActiveSubTab('templates')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeSubTab === 'templates'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              Production Templates ({TEMPLATES.length})
            </button>
          </div>
        </div>

        {activeSubTab === 'enhancer' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column: Input Prompt */}
            <div className="space-y-4">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-indigo-400" />
                    Raw User Prompt
                  </h3>
                  <button
                    onClick={() =>
                      setRawPrompt(
                        'Write a script that scrapes website data and summarizes it into a clean daily email digest.'
                      )
                    }
                    className="text-[11px] text-indigo-400 hover:text-indigo-300 font-medium underline"
                  >
                    Load Sample
                  </button>
                </div>

                <textarea
                  value={rawPrompt}
                  onChange={(e) => setRawPrompt(e.target.value)}
                  placeholder="Paste or type your initial rough prompt here..."
                  rows={6}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono resize-none"
                />

                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-300">Optimization Focus</label>
                  <select
                    value={focus}
                    onChange={(e) => setFocus(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Clarity & Structured Guardrails">Clarity & Structured Guardrails</option>
                    <option value="Strict JSON & Schema Output">Strict JSON & Schema Output</option>
                    <option value="Chain-of-Thought (Step-by-step reasoning)">Chain-of-Thought (Step-by-step reasoning)</option>
                    <option value="Role Persona & Authority Framing">Role Persona & Authority Framing</option>
                    <option value="Few-Shot Demonstrations">Few-Shot Demonstrations</option>
                  </select>
                </div>

                <button
                  onClick={handleEnhance}
                  disabled={!rawPrompt.trim() || isEnhancing}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-semibold text-xs transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 disabled:opacity-40"
                >
                  {isEnhancing ? (
                    <>
                      <Sparkles className="w-4 h-4 animate-spin" />
                      <span>Optimizing Architecture...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Enhance with Hammad AI</span>
                    </>
                  )}
                </button>
              </div>

              {/* Tips Card */}
              <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-4 text-xs text-slate-400 space-y-2">
                <div className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  Hammad AI Prompt Principles
                </div>
                <p>
                  High-performing LLM instructions isolate <strong>Role</strong>, <strong>Context</strong>, <strong>Explicit Constraints</strong>, and <strong>Output Schemas</strong>. Using dynamic variables like <code className="text-indigo-300 font-mono">{`{{var}}`}</code> maximizes prompt reusability.
                </p>
              </div>
            </div>

            {/* Right Column: Enhanced Output */}
            <div className="space-y-4">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4 flex flex-col min-h-[460px]">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                    Engineered Prompt
                  </h3>

                  {enhancedResult && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleCopy(getPopulatedPrompt())}
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
                        onClick={() => onSendToChat(getPopulatedPrompt())}
                        className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium flex items-center gap-1 shadow-sm transition-colors"
                      >
                        <Send className="w-3 h-3" />
                        <span>Run in Chat</span>
                      </button>
                    </div>
                  )}
                </div>

                {!enhancedResult ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-slate-500 space-y-2">
                    <Sparkles className="w-8 h-8 text-slate-700" />
                    <p className="text-xs">
                      Enter a prompt on the left and click "Enhance with Hammad AI" to see the upgraded prompt architecture here.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4 flex-1 flex flex-col">
                    {/* Improvements list */}
                    {enhancedResult.improvements?.length > 0 && (
                      <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 space-y-1.5">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">
                          Improvements Applied:
                        </div>
                        <ul className="text-xs text-slate-300 space-y-1">
                          {enhancedResult.improvements.map((imp, idx) => (
                            <li key={idx} className="flex items-start gap-1.5">
                              <span className="text-emerald-400 font-bold">✓</span>
                              <span>{imp}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Variable inputs if found */}
                    {enhancedResult.variablesFound?.length > 0 && (
                      <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 space-y-2">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                          Test Variables:
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {enhancedResult.variablesFound.map((v) => (
                            <div key={v}>
                              <label className="block text-[11px] text-slate-400 font-mono mb-0.5">{`{{${v}}}`}</label>
                              <input
                                type="text"
                                placeholder={`Value for ${v}`}
                                value={variableValues[v] || ''}
                                onChange={(e) =>
                                  setVariableValues({ ...variableValues, [v]: e.target.value })
                                }
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Output textarea */}
                    <div className="flex-1 flex flex-col">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                        Preview (Ready to Deploy):
                      </div>
                      <textarea
                        readOnly
                        value={getPopulatedPrompt()}
                        rows={10}
                        className="flex-1 w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 font-mono resize-none focus:outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Templates Subtab */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {TEMPLATES.map((tmpl) => (
              <div
                key={tmpl.id}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 flex flex-col justify-between transition-all group"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                      {tmpl.category}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {tmpl.variables.length} vars
                    </span>
                  </div>
                  <h3 className="font-bold text-sm text-slate-200 group-hover:text-indigo-300 transition-colors mb-1.5">
                    {tmpl.title}
                  </h3>
                  <p className="text-xs text-slate-400 mb-4">{tmpl.description}</p>
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <button
                    onClick={() => {
                      setRawPrompt(tmpl.prompt);
                      setActiveSubTab('enhancer');
                    }}
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1"
                  >
                    <span>Customize</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>

                  <button
                    onClick={() => onSendToChat(tmpl.prompt)}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white text-xs font-medium transition-colors"
                  >
                    Run in Chat
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
