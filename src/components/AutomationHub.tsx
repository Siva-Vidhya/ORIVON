import React, { useState, useEffect, useMemo } from 'react';
import { 
  Zap, FileText, Bell, Calendar, Clock, ArrowRight, Sparkles, 
  CheckCircle2, XCircle, Play, Edit3, Trash2, Plus, 
  ChevronDown, ChevronUp, History, Settings2, Activity,
  Search, Filter, MoreVertical, AlertCircle, Loader2,
  Check, X, Save, RefreshCw, Layers, Sliders, Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Types ---

type TriggerType = 'manual' | 'schedule' | 'event';
type StatusType = 'success' | 'failed' | 'running' | 'idle';

interface Automation {
  id: string;
  title: string;
  description: string;
  icon: any;
  color: string;
  bg: string;
  enabled: boolean;
  lastRun?: string;
  trigger: TriggerType;
  inputs?: { label: string; type: 'text' | 'number' | 'date'; placeholder: string; value?: string }[];
}

interface HistoryEntry {
  id: string;
  automationId: string;
  automationTitle: string;
  timestamp: string;
  status: StatusType;
  output?: string;
  duration?: string;
}

// --- Constants & Mock Data ---

const TEMPLATES: Automation[] = [
  { 
    id: 't1', 
    title: 'Internship Weekly Log Generator', 
    description: 'Auto-generate a summary of your completed tasks and upcoming goals for your internship supervisor.', 
    icon: FileText, 
    color: 'text-blue-500', 
    bg: 'bg-blue-50 dark:bg-blue-500/10',
    enabled: true,
    trigger: 'schedule',
    inputs: [
      { label: 'Week Number', type: 'number', placeholder: 'e.g. 5' },
      { label: 'Key Achievements', type: 'text', placeholder: 'What did you accomplish?' }
    ]
  },
  { 
    id: 't2', 
    title: 'Lab Report Formatter', 
    description: 'Standardize your raw lab notes into a professional report format with citations.', 
    icon: Layers, 
    color: 'text-amber-500', 
    bg: 'bg-amber-50 dark:bg-amber-500/10',
    enabled: true,
    trigger: 'manual',
    inputs: [
      { label: 'Experiment Title', type: 'text', placeholder: 'e.g. Acid-Base Titration' },
      { label: 'Raw Data', type: 'text', placeholder: 'Paste your observations here...' }
    ]
  },
  { 
    id: 't3', 
    title: 'Expense Tracker Automation', 
    description: 'Automatically categorize and log expenses from your digital receipts.', 
    icon: Sliders, 
    color: 'text-emerald-500', 
    bg: 'bg-emerald-50 dark:bg-emerald-500/10',
    enabled: false,
    trigger: 'event'
  },
  { 
    id: 't4', 
    title: 'Recurring Reminder Setup', 
    description: 'Set up smart notifications based on your energy levels and deadlines.', 
    icon: Bell, 
    color: 'text-brand', 
    bg: 'bg-[var(--color-brand-light)] dark:bg-[#7FA4E8]/10',
    enabled: true,
    trigger: 'schedule'
  },
  { 
    id: 't5', 
    title: 'Hackathon Submission Formatter', 
    description: 'Format your project details for Devpost or GitHub submissions automatically.', 
    icon: Zap, 
    color: 'text-purple-500', 
    bg: 'bg-purple-50 dark:bg-purple-500/10',
    enabled: true,
    trigger: 'manual',
    inputs: [
      { label: 'Project Name', type: 'text', placeholder: 'e.g. Orivon' },
      { label: 'Tech Stack', type: 'text', placeholder: 'React, Tailwind, Gemini...' }
    ]
  }
];

// --- Components ---

export function AutomationHub() {
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [isAutoMode, setIsAutoMode] = useState(true);
  const [activeTab, setActiveTab] = useState<'templates' | 'builder' | 'history'>('templates');
  const [runningAutomation, setRunningAutomation] = useState<Automation | null>(null);
  const [runInputs, setRunInputs] = useState<Record<string, string>>({});
  const [runStep, setRunStep] = useState<'input' | 'preview' | 'executing' | 'result'>('input');
  const [runResult, setRunResult] = useState<{ status: StatusType; message: string } | null>(null);

  // Load state from localStorage
  useEffect(() => {
    const savedAutomations = localStorage.getItem('orivon_automations');
    const savedHistory = localStorage.getItem('orivon_history');
    const savedAutoMode = localStorage.getItem('orivon_automode');

    if (savedAutomations) setAutomations(JSON.parse(savedAutomations));
    else setAutomations(TEMPLATES);

    if (savedHistory) setHistory(JSON.parse(savedHistory));
    if (savedAutoMode) setIsAutoMode(JSON.parse(savedAutoMode));
  }, []);

  // Save state to localStorage
  useEffect(() => {
    localStorage.setItem('orivon_automations', JSON.stringify(automations));
    localStorage.setItem('orivon_history', JSON.stringify(history));
    localStorage.setItem('orivon_automode', JSON.stringify(isAutoMode));
  }, [automations, history, isAutoMode]);

  const stats = useMemo(() => {
    const activeCount = automations.filter(a => a.enabled).length;
    const successRate = history.length > 0 
      ? Math.round((history.filter(h => h.status === 'success').length / history.length) * 100) 
      : 100;
    const recentRuns = history.slice(0, 5);
    return { activeCount, successRate, recentRuns };
  }, [automations, history]);

  const toggleAutomation = (id: string) => {
    setAutomations(prev => prev.map(a => a.id === id ? { ...a, enabled: !a.enabled } : a));
  };

  const deleteAutomation = (id: string) => {
    if (confirm('Are you sure you want to delete this automation?')) {
      setAutomations(prev => prev.filter(a => a.id !== id));
    }
  };

  const handleRunClick = (automation: Automation) => {
    setRunningAutomation(automation);
    setRunInputs({});
    setRunStep(automation.inputs && automation.inputs.length > 0 ? 'input' : 'preview');
    setRunResult(null);
  };

  const executeAutomation = async () => {
    setRunStep('executing');
    
    // Simulate execution delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const isSuccess = Math.random() > 0.1; // 90% success rate
    const status: StatusType = isSuccess ? 'success' : 'failed';
    const message = isSuccess 
      ? 'Automation completed successfully. Output generated.' 
      : 'Automation failed due to a connection timeout. Please try again.';

    const newEntry: HistoryEntry = {
      id: Math.random().toString(36).substr(2, 9),
      automationId: runningAutomation!.id,
      automationTitle: runningAutomation!.title,
      timestamp: new Date().toISOString(),
      status,
      output: isSuccess ? `Generated output for ${runningAutomation!.title} with inputs: ${JSON.stringify(runInputs)}` : undefined,
      duration: '1.2s'
    };

    setHistory(prev => [newEntry, ...prev]);
    setRunResult({ status, message });
    setRunStep('result');

    // Update last run timestamp
    setAutomations(prev => prev.map(a => a.id === runningAutomation!.id ? { ...a, lastRun: new Date().toISOString() } : a));
  };

  const retryAutomation = (entry: HistoryEntry) => {
    const automation = automations.find(a => a.id === entry.automationId);
    if (automation) {
      handleRunClick(automation);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-24 md:pb-12 px-4 md:px-0">
      {/* --- Header & Overview --- */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <h2 className="text-4xl font-bold tracking-tight text-[var(--color-text-primary)] dark:text-[#E2E8F0]">Automation Dashboard</h2>
          <p className="text-[var(--color-text-secondary)] dark:text-[#CBD5E1] leading-relaxed">Smart workflow engine to automate your academic and research tasks.</p>
        </div>
        
        <div className="flex items-center gap-4 bg-white dark:bg-[#1E293B] p-2 rounded-2xl shadow-sm border border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-2 px-4 py-2">
            <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Auto Mode</span>
            <button 
              onClick={() => setIsAutoMode(!isAutoMode)}
              className={cn(
                "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                isAutoMode ? "bg-[var(--color-brand)]" : "bg-neutral-200 dark:bg-neutral-700"
              )}
            >
              <span className={cn(
                "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                isAutoMode ? "translate-x-5" : "translate-x-0"
              )} />
            </button>
          </div>
        </div>
      </header>

      {/* --- Stats Grid --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="glass-card p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-500">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Active Automations</p>
            <p className="text-2xl font-bold text-[var(--color-text-primary)] dark:text-[#E2E8F0]">{stats.activeCount}</p>
          </div>
        </div>
        <div className="glass-card p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-500">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Success Rate</p>
            <p className="text-2xl font-bold text-[var(--color-text-primary)] dark:text-[#E2E8F0]">{stats.successRate}%</p>
          </div>
        </div>
        <div className="glass-card p-6 flex items-center gap-4 sm:col-span-2 lg:col-span-1">
          <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center text-amber-500">
            <History className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Recent Activity</p>
            <div className="flex -space-x-2 mt-1">
              {stats.recentRuns.length > 0 ? stats.recentRuns.map((run, i) => (
                <div key={run.id} className={cn(
                  "w-6 h-6 rounded-full border-2 border-white dark:border-[#1E293B] flex items-center justify-center",
                  run.status === 'success' ? 'bg-emerald-500' : 'bg-red-500'
                )}>
                  {run.status === 'success' ? <Check className="w-3 h-3 text-white" /> : <X className="w-3 h-3 text-white" />}
                </div>
              )) : <span className="text-sm text-neutral-400 italic">No recent runs</span>}
            </div>
          </div>
        </div>
      </div>

      {/* --- Tabs --- */}
      <div className="flex border-b border-neutral-100 dark:border-neutral-800">
        <button 
          onClick={() => setActiveTab('templates')}
          className={cn(
            "px-6 py-4 text-sm font-bold uppercase tracking-widest transition-all relative",
            activeTab === 'templates' ? "text-[var(--color-brand)]" : "text-neutral-400 hover:text-neutral-600"
          )}
        >
          Templates
          {activeTab === 'templates' && <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-1 bg-[var(--color-brand)] rounded-t-full" />}
        </button>
        <button 
          onClick={() => setActiveTab('builder')}
          className={cn(
            "px-6 py-4 text-sm font-bold uppercase tracking-widest transition-all relative",
            activeTab === 'builder' ? "text-[var(--color-brand)]" : "text-neutral-400 hover:text-neutral-600"
          )}
        >
          Custom Builder
          {activeTab === 'builder' && <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-1 bg-[var(--color-brand)] rounded-t-full" />}
        </button>
        <button 
          onClick={() => setActiveTab('history')}
          className={cn(
            "px-6 py-4 text-sm font-bold uppercase tracking-widest transition-all relative",
            activeTab === 'history' ? "text-[var(--color-brand)]" : "text-neutral-400 hover:text-neutral-600"
          )}
        >
          History
          {activeTab === 'history' && <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-1 bg-[var(--color-brand)] rounded-t-full" />}
        </button>
      </div>

      {/* --- Content Area --- */}
      <div className="min-h-[400px]">
        <AnimatePresence mode="wait">
          {activeTab === 'templates' && (
            <motion.div 
              key="templates"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              {automations.map((template) => (
                <div key={template.id} className="glass-card p-6 group flex flex-col justify-between hover:shadow-lg transition-all border-l-4 border-l-transparent hover:border-l-[var(--color-brand)]">
                  <div className="flex gap-6">
                    <div className={cn("w-14 h-14 shrink-0 rounded-2xl flex items-center justify-center transition-transform duration-500 group-hover:scale-110", template.bg, template.color)}>
                      <template.icon className="w-7 h-7" />
                    </div>
                    <div className="space-y-2 flex-1">
                      <div className="flex items-start justify-between">
                        <h3 className="font-bold text-lg text-[var(--color-text-primary)] dark:text-[#E2E8F0] group-hover:text-[var(--color-brand)] transition-colors">{template.title}</h3>
                        <button 
                          onClick={() => toggleAutomation(template.id)}
                          className={cn(
                            "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                            template.enabled ? "bg-emerald-500" : "bg-neutral-200 dark:bg-neutral-700"
                          )}
                        >
                          <span className={cn(
                            "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                            template.enabled ? "translate-x-4" : "translate-x-0"
                          )} />
                        </button>
                      </div>
                      <p className="text-[var(--color-text-secondary)] dark:text-[#CBD5E1] text-sm leading-relaxed line-clamp-2">{template.description}</p>
                    </div>
                  </div>
                  
                  <div className="mt-6 pt-6 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                      <Clock className="w-3 h-3" />
                      {template.lastRun ? `Last run: ${new Date(template.lastRun).toLocaleDateString()}` : 'Never run'}
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleRunClick(template)}
                        className="p-2 rounded-xl bg-neutral-50 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-[var(--color-brand)] hover:text-white transition-all"
                        title="Run Now"
                      >
                        <Play className="w-4 h-4" />
                      </button>
                      <button className="p-2 rounded-xl bg-neutral-50 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-blue-500 hover:text-white transition-all" title="Edit">
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => deleteAutomation(template.id)}
                        className="p-2 rounded-xl bg-neutral-50 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-red-500 hover:text-white transition-all" 
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              
              <button 
                onClick={() => setActiveTab('builder')}
                className="glass-card p-6 border-2 border-dashed border-neutral-200 dark:border-neutral-800 flex flex-col items-center justify-center gap-4 text-neutral-400 hover:text-[var(--color-brand)] hover:border-[var(--color-brand)] hover:bg-[var(--color-brand)]/5 transition-all group"
              >
                <div className="w-12 h-12 rounded-full bg-neutral-50 dark:bg-neutral-800 flex items-center justify-center group-hover:bg-[var(--color-brand)] group-hover:text-white transition-all">
                  <Plus className="w-6 h-6" />
                </div>
                <span className="text-sm font-bold uppercase tracking-widest">Create Custom Automation</span>
              </button>
            </motion.div>
          )}

          {activeTab === 'builder' && (
            <motion.div 
              key="builder"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="glass-card p-8 space-y-8"
            >
              <div className="flex items-center gap-4 pb-6 border-b border-neutral-100 dark:border-neutral-800">
                <div className="w-12 h-12 rounded-xl bg-[var(--color-brand-light)] dark:bg-[#7FA4E8]/10 flex items-center justify-center text-[var(--color-brand)]">
                  <Settings2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-[var(--color-text-primary)] dark:text-[#E2E8F0]">Custom Workflow Builder</h3>
                  <p className="text-sm text-[var(--color-text-secondary)] dark:text-[#CBD5E1]">Build powerful automations with simple logic.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-neutral-400">
                    <span className="w-6 h-6 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-[var(--color-brand)]">1</span>
                    Trigger
                  </div>
                  <div className="space-y-2">
                    {['Manual Trigger', 'Scheduled (Daily/Weekly)', 'Event (File Upload/Update)'].map((t, i) => (
                      <button key={i} className="w-full p-4 text-left rounded-2xl border border-neutral-100 dark:border-neutral-800 hover:border-[var(--color-brand)] hover:bg-[var(--color-brand)]/5 transition-all text-sm font-medium">
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-neutral-400">
                    <span className="w-6 h-6 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-[var(--color-brand)]">2</span>
                    Action
                  </div>
                  <div className="space-y-2">
                    {['Generate Report', 'Send Notification', 'Sync Calendar', 'Format Document'].map((a, i) => (
                      <button key={i} className="w-full p-4 text-left rounded-2xl border border-neutral-100 dark:border-neutral-800 hover:border-[var(--color-brand)] hover:bg-[var(--color-brand)]/5 transition-all text-sm font-medium">
                        {a}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-neutral-400">
                    <span className="w-6 h-6 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-[var(--color-brand)]">3</span>
                    Logic (Optional)
                  </div>
                  <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-dashed border-neutral-200 dark:border-neutral-800 flex flex-col items-center justify-center gap-2 text-neutral-400">
                    <Plus className="w-5 h-5" />
                    <span className="text-xs font-medium">Add Condition (If/Then)</span>
                  </div>
                </div>
              </div>

              <div className="pt-8 border-t border-neutral-100 dark:border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-amber-500 bg-amber-50 dark:bg-amber-500/10 px-4 py-2 rounded-xl text-xs font-medium">
                  <Info className="w-4 h-4" />
                  Your automation will be saved to your library.
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <button className="flex-1 sm:flex-none px-6 py-3 rounded-2xl border border-neutral-200 dark:border-neutral-800 font-bold text-sm hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all">
                    Cancel
                  </button>
                  <button className="flex-1 sm:flex-none px-8 py-3 rounded-2xl bg-[var(--color-brand)] text-white font-bold text-sm hover:shadow-lg hover:-translate-y-0.5 transition-all active:scale-95">
                    Save Automation
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'history' && (
            <motion.div 
              key="history"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {history.length > 0 ? history.map((entry) => (
                <div key={entry.id} className="glass-card p-4 flex items-center justify-between gap-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-all">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center",
                      entry.status === 'success' ? 'bg-emerald-50 text-emerald-500 dark:bg-emerald-500/10' : 'bg-red-50 text-red-500 dark:bg-red-500/10'
                    )}>
                      {entry.status === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-[var(--color-text-primary)] dark:text-[#E2E8F0]">{entry.automationTitle}</h4>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[10px] text-neutral-400 font-medium uppercase tracking-wider">{new Date(entry.timestamp).toLocaleString()}</span>
                        <span className="w-1 h-1 rounded-full bg-neutral-300 dark:bg-neutral-700" />
                        <span className="text-[10px] text-neutral-400 font-medium uppercase tracking-wider">Duration: {entry.duration}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => retryAutomation(entry)}
                      className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-[var(--color-brand)] transition-all"
                      title="Retry"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                    <button className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 transition-all" title="View Output">
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )) : (
                <div className="glass-card p-12 flex flex-col items-center justify-center text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-neutral-50 dark:bg-neutral-800 flex items-center justify-center text-neutral-300">
                    <History className="w-8 h-8" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-lg text-[var(--color-text-primary)] dark:text-[#E2E8F0]">No history yet</h4>
                    <p className="text-sm text-neutral-400">Your automation runs will appear here.</p>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* --- AI Suggestions Section --- */}
      <section className="glass-card p-8 bg-gradient-to-br from-[var(--color-brand)] to-indigo-600 text-white overflow-hidden relative shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
          <div className="w-20 h-20 shrink-0 rounded-3xl bg-white/20 backdrop-blur-xl flex items-center justify-center border border-white/20">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
          <div className="space-y-4 flex-1 text-center md:text-left">
            <h3 className="text-2xl font-bold tracking-tight">AI Optimization Suggestion</h3>
            <p className="text-white/80 text-sm leading-relaxed max-w-2xl">
              I've noticed you manually format lab reports every Tuesday. Would you like me to create an automated workflow that detects your new notes and formats them instantly?
            </p>
            <div className="flex flex-wrap justify-center md:justify-start gap-3 pt-2">
              <button className="bg-white text-[var(--color-text-primary)] px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-neutral-100 transition-all shadow-lg active:scale-95">
                Enable Suggestion
              </button>
              <button className="bg-white/10 backdrop-blur-md text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-white/20 transition-all border border-white/10">
                Dismiss
              </button>
            </div>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 blur-[100px] rounded-full -mr-24 -mt-24" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-400/20 blur-[80px] rounded-full -ml-24 -mb-24" />
      </section>

      {/* --- Run Automation Modal --- */}
      <AnimatePresence>
        {runningAutomation && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setRunningAutomation(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white dark:bg-[#0F172A] rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", runningAutomation.bg, runningAutomation.color)}>
                    <runningAutomation.icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-lg text-[var(--color-text-primary)] dark:text-[#E2E8F0]">{runningAutomation.title}</h3>
                </div>
                <button 
                  onClick={() => setRunningAutomation(null)}
                  className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-8">
                {runStep === 'input' && (
                  <div className="space-y-6">
                    <div className="space-y-4">
                      {runningAutomation.inputs?.map((input, i) => (
                        <div key={i} className="space-y-2">
                          <label className="text-xs font-bold uppercase tracking-widest text-neutral-500 dark:text-neutral-400">{input.label}</label>
                          <input 
                            type={input.type}
                            placeholder={input.placeholder}
                            value={runInputs[input.label] || ''}
                            onChange={(e) => setRunInputs(prev => ({ ...prev, [input.label]: e.target.value }))}
                            className="w-full bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-800 rounded-2xl px-5 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)]/20 transition-all"
                          />
                        </div>
                      ))}
                    </div>
                    <button 
                      onClick={() => setRunStep('preview')}
                      className="w-full bg-[var(--color-brand)] text-white py-4 rounded-2xl font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all active:scale-95"
                    >
                      Continue to Preview
                    </button>
                  </div>
                )}

                {runStep === 'preview' && (
                  <div className="space-y-6">
                    <div className="p-5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-800 space-y-3">
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-neutral-400">
                        <FileText className="w-3.5 h-3.5" />
                        Execution Preview
                      </div>
                      <div className="text-sm text-[var(--color-text-secondary)] dark:text-[#CBD5E1] leading-relaxed">
                        This automation will process your inputs and generate a formatted document. 
                        {Object.keys(runInputs).length > 0 && (
                          <div className="mt-3 pt-3 border-t border-neutral-200 dark:border-neutral-800 grid grid-cols-2 gap-2">
                            {Object.entries(runInputs).map(([k, v]) => (
                              <div key={k}>
                                <span className="text-[10px] font-bold text-neutral-400 uppercase">{k}:</span>
                                <p className="text-xs font-medium truncate">{v}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-3">
                      {runningAutomation.inputs && runningAutomation.inputs.length > 0 && (
                        <button 
                          onClick={() => setRunStep('input')}
                          className="flex-1 py-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 font-bold text-sm hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all"
                        >
                          Back
                        </button>
                      )}
                      <button 
                        onClick={executeAutomation}
                        className="flex-[2] bg-[var(--color-brand)] text-white py-4 rounded-2xl font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all active:scale-95"
                      >
                        Confirm & Run
                      </button>
                    </div>
                  </div>
                )}

                {runStep === 'executing' && (
                  <div className="py-12 flex flex-col items-center justify-center space-y-6 text-center">
                    <div className="relative">
                      <div className="w-20 h-20 rounded-full border-4 border-neutral-100 dark:border-neutral-800" />
                      <motion.div 
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-0 w-20 h-20 rounded-full border-4 border-t-[var(--color-brand)] border-transparent"
                      />
                      <Zap className="absolute inset-0 m-auto w-8 h-8 text-[var(--color-brand)] animate-pulse" />
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-xl font-bold text-[var(--color-text-primary)] dark:text-[#E2E8F0]">Executing Automation</h4>
                      <p className="text-sm text-neutral-400">Please wait while Orivon processes your request...</p>
                    </div>
                  </div>
                )}

                {runStep === 'result' && runResult && (
                  <div className="space-y-6 text-center">
                    <div className={cn(
                      "w-20 h-20 rounded-full mx-auto flex items-center justify-center",
                      runResult.status === 'success' ? 'bg-emerald-50 text-emerald-500 dark:bg-emerald-500/10' : 'bg-red-50 text-red-500 dark:bg-red-500/10'
                    )}>
                      {runResult.status === 'success' ? <CheckCircle2 className="w-10 h-10" /> : <XCircle className="w-10 h-10" />}
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-xl font-bold text-[var(--color-text-primary)] dark:text-[#E2E8F0]">
                        {runResult.status === 'success' ? 'Success!' : 'Execution Failed'}
                      </h4>
                      <p className="text-sm text-neutral-400 leading-relaxed">{runResult.message}</p>
                    </div>
                    <button 
                      onClick={() => setRunningAutomation(null)}
                      className="w-full bg-neutral-900 dark:bg-white dark:text-neutral-900 text-white py-4 rounded-2xl font-bold shadow-lg hover:opacity-90 transition-all active:scale-95"
                    >
                      Close
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
