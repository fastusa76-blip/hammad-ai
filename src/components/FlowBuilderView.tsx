import React, { useState } from 'react';
import { Workflow, FlowStep, AppSettings } from '../types';
import { Play, CheckCircle2, Clock, AlertCircle, ArrowDown, Copy, Download, RefreshCw, Workflow as WorkflowIcon, Sparkles } from 'lucide-react';
import { runFlowStep } from '../lib/api';

interface FlowBuilderViewProps {
  settings: AppSettings;
}

const PRESET_WORKFLOWS: Workflow[] = [
  {
    id: 'wf-1',
    title: 'Full Technical Article & Code Deep-Dive',
    description: 'Autonomous 4-step pipeline that conducts research, outlines architecture, writes detailed explanations, and produces production code.',
    steps: [
      {
        id: 's1',
        title: 'Step 1: Domain Analysis & Key Takeaways',
        description: 'Extracts core insights, target reader challenges, and solution architecture.',
        promptTemplate: 'Analyze {{topic}}. Identify the 3 most critical pain points developers face and articulate how modern architecture solves them. Be concise and technical.',
        outputKey: 'analysis',
        status: 'idle',
      },
      {
        id: 's2',
        title: 'Step 2: Structured Article Outline',
        description: 'Creates a hierarchical table of contents based on the research analysis.',
        promptTemplate: 'Based on this analysis:\n{{analysis}}\n\nCreate a 5-section technical article outline with bullet points detailing what will be covered in each section.',
        outputKey: 'outline',
        status: 'idle',
      },
      {
        id: 's3',
        title: 'Step 3: Core Implementation Code & Walkthrough',
        description: 'Generates robust, commented TypeScript code implementing the pattern.',
        promptTemplate: 'Given this outline:\n{{outline}}\n\nWrite a complete, production-grade TypeScript implementation for the core pattern described. Explain key edge cases handled.',
        outputKey: 'code',
        status: 'idle',
      },
      {
        id: 's4',
        title: 'Step 4: Executive Summary & Performance Takeaways',
        description: 'Wraps up the article with benchmark metrics, pitfalls to avoid, and conclusions.',
        promptTemplate: 'Synthesize the implementation:\n{{code}}\n\nProvide a high-impact executive summary, 3 performance takeaways, and common production pitfalls to avoid.',
        outputKey: 'summary',
        status: 'idle',
      },
    ],
  },
  {
    id: 'wf-2',
    title: 'Full-Stack Code Refactoring & Security Hardening',
    description: 'Analyzes messy or legacy code, identifies security flaws, refactors to idiomatic TypeScript, and creates unit tests.',
    steps: [
      {
        id: 's2-1',
        title: 'Step 1: Code Smell & Vulnerability Scan',
        description: 'Scans for race conditions, SQL/NoSQL injections, memory leaks, and anti-patterns.',
        promptTemplate: 'Audit the following code for security risks, type safety issues, and performance bottlenecks:\n"""\n{{topic}}\n"""\nList each flaw with severity rating.',
        outputKey: 'audit',
        status: 'idle',
      },
      {
        id: 's2-2',
        title: 'Step 2: Modern Refactored Architecture',
        description: 'Rewrites the code with pure functions, type guards, and zero dependencies.',
        promptTemplate: 'Based on this audit:\n{{audit}}\n\nRewrite the code completely in clean, modern TypeScript following SOLID principles. Ensure complete input validation.',
        outputKey: 'refactored_code',
        status: 'idle',
      },
      {
        id: 's2-3',
        title: 'Step 3: Comprehensive Unit Test Suite',
        description: 'Generates test cases covering happy path, failure boundaries, and security edge cases.',
        promptTemplate: 'Write exhaustive unit tests (using Vitest or Jest) for this refactored code:\n{{refactored_code}}\nInclude mock assertions and edge case tests.',
        outputKey: 'tests',
        status: 'idle',
      },
    ],
  },
];

export const FlowBuilderView: React.FC<FlowBuilderViewProps> = ({ settings }) => {
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow>(PRESET_WORKFLOWS[0]);
  const [topicInput, setTopicInput] = useState(
    'Distributed Rate Limiting with Redis and Sliding Window in Node.js'
  );
  const [isRunning, setIsRunning] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState<number | null>(null);

  const handleSelectWorkflow = (wf: Workflow) => {
    setSelectedWorkflow({
      ...wf,
      steps: wf.steps.map((s) => ({ ...s, status: 'idle', output: undefined })),
    });
    if (wf.id === 'wf-2') {
      setTopicInput(`function getUser(id) {
  var sql = "SELECT * FROM users WHERE id = '" + id + "'";
  return db.query(sql);
}`);
    } else {
      setTopicInput('Distributed Rate Limiting with Redis and Sliding Window in Node.js');
    }
  };

  const executePipeline = async () => {
    if (!topicInput.trim() || isRunning) return;
    setIsRunning(true);

    const stepOutputs: Record<string, string> = {
      topic: topicInput,
    };

    const updatedSteps = [...selectedWorkflow.steps];

    for (let i = 0; i < updatedSteps.length; i++) {
      setCurrentStepIndex(i);
      updatedSteps[i].status = 'running';
      setSelectedWorkflow({ ...selectedWorkflow, steps: [...updatedSteps] });

      try {
        const result = await runFlowStep({
          stepTitle: updatedSteps[i].title,
          prompt: updatedSteps[i].promptTemplate,
          inputs: stepOutputs,
          apiKey: settings.apiKey,
        });

        updatedSteps[i].output = result.output;
        updatedSteps[i].status = 'completed';
        stepOutputs[updatedSteps[i].outputKey] = result.output;
        setSelectedWorkflow({ ...selectedWorkflow, steps: [...updatedSteps] });
      } catch (err: any) {
        updatedSteps[i].status = 'error';
        updatedSteps[i].output = `Error: ${err.message || 'Step execution failed'}`;
        setSelectedWorkflow({ ...selectedWorkflow, steps: [...updatedSteps] });
        break;
      }
    }

    setIsRunning(false);
    setCurrentStepIndex(null);
  };

  const handleReset = () => {
    setSelectedWorkflow({
      ...selectedWorkflow,
      steps: selectedWorkflow.steps.map((s) => ({ ...s, status: 'idle', output: undefined })),
    });
  };

  const handleExportFlow = () => {
    const fullReport = selectedWorkflow.steps
      .map(
        (s) => `## ${s.title}\n\n${s.output || '(No output recorded)'}\n\n---\n`
      )
      .join('\n');
    const blob = new Blob([`# ${selectedWorkflow.title}\nInitial Context:\n${topicInput}\n\n${fullReport}`], {
      type: 'text/markdown',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `flow_${selectedWorkflow.title.replace(/\s+/g, '_').toLowerCase()}.md`;
    a.click();
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-4rem)] overflow-y-auto bg-slate-950 p-4 sm:p-8">
      <div className="max-w-5xl mx-auto w-full space-y-6">
        {/* Header */}
        <div className="border-b border-slate-800 pb-5">
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <WorkflowIcon className="w-4 h-4" />
            </span>
            <h1 className="text-xl font-bold text-slate-100">Hammad AI Flow Builder</h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400">
            Chain multiple reasoning steps sequentially where each stage feeds enriched context to the next.
          </p>
        </div>

        {/* Workflow Selector & Initial Input */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {PRESET_WORKFLOWS.map((wf) => (
              <button
                key={wf.id}
                onClick={() => handleSelectWorkflow(wf)}
                className={`p-4 rounded-xl border text-left transition-all ${
                  selectedWorkflow.id === wf.id
                    ? 'bg-indigo-600/10 border-indigo-500/80 text-white'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <div className="text-xs font-bold text-slate-200 mb-1 flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  {wf.title}
                </div>
                <div className="text-xs text-slate-400 line-clamp-2">{wf.description}</div>
              </button>
            ))}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Pipeline Starting Subject / Input Payload:
            </label>
            <textarea
              value={topicInput}
              onChange={(e) => setTopicInput(e.target.value)}
              rows={3}
              placeholder="Provide the subject or input code to process through this flow..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono resize-none"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              onClick={handleReset}
              disabled={isRunning}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1.5 border border-slate-700 disabled:opacity-40"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reset Steps
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={handleExportFlow}
                disabled={!selectedWorkflow.steps.some((s) => s.output)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1.5 border border-slate-700 disabled:opacity-40"
              >
                <Download className="w-3.5 h-3.5" />
                Export Pipeline Results
              </button>

              <button
                onClick={executePipeline}
                disabled={isRunning || !topicInput.trim()}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-2 shadow-md shadow-indigo-600/20 disabled:opacity-40"
              >
                <Play className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : ''}`} />
                <span>{isRunning ? 'Processing Pipeline...' : 'Run Entire Pipeline'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Steps Pipeline Visualizer */}
        <div className="space-y-4">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Pipeline Execution Stages ({selectedWorkflow.steps.length} Steps)
          </div>

          {selectedWorkflow.steps.map((step, idx) => {
            const isCurrent = currentStepIndex === idx;
            const isCompleted = step.status === 'completed';
            const isError = step.status === 'error';

            return (
              <React.Fragment key={step.id}>
                <div
                  className={`bg-slate-900 border rounded-2xl p-5 transition-all ${
                    isCurrent
                      ? 'border-indigo-500 shadow-md shadow-indigo-500/10 ring-1 ring-indigo-500/30'
                      : isCompleted
                      ? 'border-emerald-500/40'
                      : isError
                      ? 'border-rose-500/40'
                      : 'border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold ${
                          isCompleted
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                            : isCurrent
                            ? 'bg-indigo-600 text-white animate-pulse'
                            : isError
                            ? 'bg-rose-500/20 text-rose-400'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                      </div>
                      <h3 className="font-bold text-xs sm:text-sm text-slate-200">{step.title}</h3>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          isCompleted
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : isCurrent
                            ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 animate-pulse'
                            : isError
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                            : 'bg-slate-800 text-slate-500'
                        }`}
                      >
                        {step.status}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 mb-3">{step.description}</p>

                  {/* Output block if generated */}
                  {step.output && (
                    <div className="mt-3 pt-3 border-t border-slate-800/80">
                      <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-1.5">
                        <span className="text-indigo-400 font-semibold">Generated Stage Output:</span>
                        <button
                          onClick={() => navigator.clipboard.writeText(step.output || '')}
                          className="hover:text-white flex items-center gap-1 text-[10px]"
                        >
                          <Copy className="w-3 h-3" /> Copy
                        </button>
                      </div>
                      <div className="bg-slate-950 border border-slate-800/90 rounded-xl p-3 text-xs text-slate-200 font-mono whitespace-pre-wrap max-h-60 overflow-y-auto">
                        {step.output}
                      </div>
                    </div>
                  )}
                </div>

                {idx < selectedWorkflow.steps.length - 1 && (
                  <div className="flex justify-center -my-2">
                    <div className="w-7 h-7 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 shadow-sm z-10">
                      <ArrowDown className="w-3.5 h-3.5" />
                    </div>
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
};
