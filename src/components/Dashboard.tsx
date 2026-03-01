import React, { useState } from 'react';
import { AppState, Task, Priority, ReminderTiming } from '../types';
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  Plus, 
  Sparkles, 
  TrendingUp, 
  Calendar,
  ArrowRight,
  Search,
  Mic,
  Zap,
  Database,
  X,
  Send,
  Loader2,
  FileText,
  BookOpen,
  Quote,
  Shield,
  Square,
  Play,
  Upload,
  List,
  ChevronRight,
  LayoutGrid,
  Bell,
  MoreVertical,
  ExternalLink,
  Folder
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { suggestPriorities } from '../services/ai';
import { ResearchCopilot } from './ResearchCopilot';
import { MeetingAssistant } from './MeetingAssistant';
import { AutomationHub } from './AutomationHub';
import { KnowledgeHub } from './KnowledgeHub';

interface DashboardProps {
  state: AppState;
  toggleTask: (id: string) => void;
  addTask: (task: Omit<Task, 'id'>) => void;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
}

type ModalType = 'research' | 'meeting' | 'automation' | 'knowledge' | 'addTask' | null;

export function Dashboard({ state, toggleTask, addTask, setState }: DashboardProps) {
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskDate, setNewTaskDate] = useState('');
  const [newTaskTime, setNewTaskTime] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<Priority>('medium');
  const [newTaskReminder, setNewTaskReminder] = useState(false);
  const [newTaskReminderTiming, setNewTaskReminderTiming] = useState<ReminderTiming>('at_due_time');
  const [newTaskCustomReminderTime, setNewTaskCustomReminderTime] = useState('');
  
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [activeModal, setActiveModal] = useState<ModalType>(null);

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    addTask({
      title: newTaskTitle,
      description: newTaskDesc,
      completed: false,
      priority: newTaskPriority,
      category: 'General',
      dueDate: newTaskDate || undefined,
      dueTime: newTaskTime || undefined,
      reminder: newTaskReminder,
      reminderTiming: newTaskReminderTiming,
      customReminderTime: newTaskCustomReminderTime || undefined
    });
    setNewTaskTitle('');
    setNewTaskDesc('');
    setNewTaskDate('');
    setNewTaskTime('');
    setNewTaskPriority('medium');
    setNewTaskReminder(false);
    setNewTaskReminderTiming('at_due_time');
    setNewTaskCustomReminderTime('');
    setActiveModal(null);
  };

  const getAiPriorities = async () => {
    setIsLoadingAi(true);
    try {
      const suggestion = await suggestPriorities(state.tasks);
      setAiSuggestion(suggestion);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingAi(false);
    }
  };

  const pendingTasks = state.tasks.filter(t => !t.completed);

  const quickActions = [
    { id: 'addTask', label: 'Add Task', icon: Plus, color: 'bg-blue-500' },
    { id: 'research', label: 'Start Research', icon: Search, color: 'bg-indigo-500' },
    { id: 'meeting', label: 'Capture Notes', icon: Mic, color: 'bg-emerald-500' },
    { id: 'automation', label: 'Run Automation', icon: Zap, color: 'bg-amber-500' },
    { id: 'knowledge', label: 'Knowledge Hub', icon: Database, color: 'bg-slate-500' },
  ];

  const renderModalContent = () => {
    switch (activeModal) {
      case 'research': return <div className="p-4"><ResearchCopilot state={state} setState={setState} /></div>;
      case 'meeting': return <div className="p-4"><MeetingAssistant /></div>;
      case 'automation': return <div className="p-4"><AutomationHub /></div>;
      case 'knowledge': return <div className="p-4"><KnowledgeHub state={state} setState={setState} /></div>;
      case 'addTask': return (
        <div className="p-8 space-y-8">
          <div className="space-y-2">
            <h3 className="text-3xl font-bold tracking-tight text-[var(--color-text-primary)] dark:text-[#E2E8F0]">Create New Task</h3>
            <p className="text-sm text-[var(--color-text-secondary)] dark:text-[#CBD5E1]">Plan your next achievement with precision.</p>
          </div>
          
          <form onSubmit={handleAddTask} className="space-y-8">
            <div className="space-y-6">
              {/* Title & Description */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400 dark:text-neutral-500">Task Title</label>
                  <input
                    autoFocus
                    required
                    type="text"
                    placeholder="e.g., 'Finalize Thesis Draft'"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    className="w-full bg-neutral-50 dark:bg-white/5 border border-neutral-100 dark:border-white/10 focus:border-[var(--color-brand)] rounded-2xl px-6 py-4 text-lg focus:outline-none transition-all placeholder:text-neutral-300 dark:placeholder:text-neutral-600"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400 dark:text-neutral-500">Description (Optional)</label>
                  <textarea
                    placeholder="Add more details about this task..."
                    value={newTaskDesc}
                    onChange={(e) => setNewTaskDesc(e.target.value)}
                    className="w-full bg-neutral-50 dark:bg-white/5 border border-neutral-100 dark:border-white/10 focus:border-[var(--color-brand)] rounded-2xl px-6 py-4 text-sm focus:outline-none transition-all min-h-[100px] resize-none placeholder:text-neutral-300 dark:placeholder:text-neutral-600"
                  />
                </div>
              </div>

              {/* Date & Time Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400 dark:text-neutral-500">Due Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <input
                      type="date"
                      value={newTaskDate}
                      onChange={(e) => setNewTaskDate(e.target.value)}
                      className="w-full bg-neutral-50 dark:bg-white/5 border border-neutral-100 dark:border-white/10 focus:border-[var(--color-brand)] rounded-2xl pl-12 pr-6 py-4 text-sm focus:outline-none transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400 dark:text-neutral-500">Due Time</label>
                  <div className="relative">
                    <Clock className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <input
                      type="time"
                      value={newTaskTime}
                      onChange={(e) => setNewTaskTime(e.target.value)}
                      className="w-full bg-neutral-50 dark:bg-white/5 border border-neutral-100 dark:border-white/10 focus:border-[var(--color-brand)] rounded-2xl pl-12 pr-6 py-4 text-sm focus:outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Priority Selection */}
              <div className="space-y-3">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400 dark:text-neutral-500">Priority Level</label>
                <div className="flex gap-3">
                  {(['low', 'medium', 'high'] as Priority[]).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setNewTaskPriority(p)}
                      className={cn(
                        "flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-widest border transition-all",
                        newTaskPriority === p 
                          ? p === 'high' ? "bg-red-50 border-red-200 text-red-600 dark:bg-red-500/20 dark:border-red-500/30 dark:text-red-400" 
                            : p === 'medium' ? "bg-amber-50 border-amber-200 text-amber-600 dark:bg-amber-500/20 dark:border-amber-500/30 dark:text-amber-400"
                            : "bg-emerald-50 border-emerald-200 text-emerald-600 dark:bg-emerald-500/20 dark:border-emerald-500/30 dark:text-emerald-400"
                          : "bg-neutral-50 dark:bg-white/5 border-neutral-100 dark:border-white/10 text-neutral-400 hover:border-neutral-200 dark:hover:border-white/20"
                      )}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reminder Settings */}
              <div className="space-y-4 p-6 rounded-2xl bg-neutral-50 dark:bg-white/5 border border-neutral-100 dark:border-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                      newTaskReminder ? "bg-[var(--color-brand)] text-white" : "bg-neutral-200 dark:bg-neutral-800 text-neutral-400"
                    )}>
                      <Bell className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold">Smart Reminders</p>
                      <p className="text-[10px] text-neutral-400 font-medium uppercase tracking-wider">Get notified before the deadline</p>
                    </div>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setNewTaskReminder(!newTaskReminder)}
                    className={cn(
                      "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                      newTaskReminder ? "bg-[var(--color-brand)]" : "bg-neutral-200 dark:bg-neutral-700"
                    )}
                  >
                    <span className={cn(
                      "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                      newTaskReminder ? "translate-x-5" : "translate-x-0"
                    )} />
                  </button>
                </div>

                <AnimatePresence>
                  {newTaskReminder && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden pt-4 space-y-4"
                    >
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {[
                          { id: 'at_due_time', label: 'At due time' },
                          { id: '5_min_before', label: '5 min before' },
                          { id: '15_min_before', label: '15 min before' },
                          { id: '1_hour_before', label: '1 hour before' },
                          { id: 'custom', label: 'Custom' },
                        ].map((t) => (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => setNewTaskReminderTiming(t.id as ReminderTiming)}
                            className={cn(
                              "px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition-all",
                              newTaskReminderTiming === t.id 
                                ? "bg-[var(--color-brand)] border-[var(--color-brand)] text-white"
                                : "bg-white dark:bg-white/5 border-neutral-100 dark:border-white/10 text-neutral-400 hover:border-neutral-200 dark:hover:border-white/20"
                            )}
                          >
                            {t.label}
                          </button>
                        ))}
                      </div>
                      
                      {newTaskReminderTiming === 'custom' && (
                        <div className="pt-2 space-y-2">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Custom Reminder Time</label>
                          <input 
                            type="time"
                            value={newTaskCustomReminderTime}
                            onChange={(e) => setNewTaskCustomReminderTime(e.target.value)}
                            className="w-full bg-white dark:bg-white/5 border border-neutral-100 dark:border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)]/20 transition-all"
                          />
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <button type="button" onClick={() => setActiveModal(null)} className="flex-1 py-4 rounded-2xl font-bold bg-neutral-100 dark:bg-white/5 text-neutral-500 hover:bg-neutral-200 dark:hover:bg-white/10 transition-all">Cancel</button>
              <button type="submit" className="accent-button flex-[2] shadow-xl shadow-[var(--color-brand)]/20">Create Task</button>
            </div>
          </form>
        </div>
      );
      default: return null;
    }
  };

  return (
    <div className="space-y-10 pb-24 md:pb-0">
      {/* Header & Quick Actions */}
      <div className="space-y-8">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-1">
            <p className="text-[var(--color-text-secondary)] dark:text-[#CBD5E1] font-medium tracking-wide">Welcome back,</p>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-[var(--color-text-primary)] dark:text-[#E2E8F0]">Command Center</h2>
          </div>
          <div className="flex items-center gap-3 bg-white dark:bg-[#1E293B] px-5 py-3 rounded-2xl border border-[var(--color-border-subtle)] dark:border-white/5 shadow-sm">
            <Calendar className="w-5 h-5 text-[var(--color-brand)] dark:text-[#7FA4E8]" />
            <span className="font-semibold text-[var(--color-text-primary)] dark:text-[#E2E8F0]">
              {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
        </header>

        {/* Quick Actions Bar */}
        <div className="flex flex-wrap gap-4">
          {quickActions.map((action) => (
            <button
              key={action.id}
              onClick={() => setActiveModal(action.id as ModalType)}
              className="flex-1 min-w-[140px] glass-card p-4 flex flex-col items-center gap-3 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group"
            >
              <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg transition-transform group-hover:scale-110", action.color)}>
                <action.icon className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-[var(--color-text-secondary)] dark:text-[#CBD5E1] uppercase tracking-widest">{action.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {/* Today's Tasks Widget */}
        <section className="glass-card p-8 bg-white dark:bg-[#1E293B] flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold flex items-center gap-3 text-[var(--color-text-primary)] dark:text-[#E2E8F0]">
              <Clock className="w-6 h-6 text-[var(--color-brand)] dark:text-[#7FA4E8]" />
              Today's Tasks
            </h3>
            <button onClick={() => setActiveModal('addTask')} className="p-2 bg-[var(--color-brand-light)] dark:bg-[#7FA4E8]/10 text-[var(--color-brand)] dark:text-[#7FA4E8] rounded-xl hover:scale-110 transition-transform">
              <Plus className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4 flex-1">
            {pendingTasks.slice(0, 5).map((task) => {
              const isOverdue = task.dueDate && new Date(task.dueDate) < new Date(new Date().setHours(0,0,0,0)) && !task.completed;
              return (
                <motion.div
                  layout
                  key={task.id}
                  className={cn(
                    "flex items-center gap-4 p-4 rounded-2xl hover:bg-[var(--color-bg-section)] dark:hover:bg-white/5 transition-all duration-300 group border border-transparent",
                    isOverdue ? "bg-red-50/30 dark:bg-red-500/5 border-red-100 dark:border-red-500/10" : "hover:border-[var(--color-border-subtle)] dark:hover:border-white/5"
                  )}
                >
                  <button onClick={() => toggleTask(task.id)} className="text-neutral-300 dark:text-neutral-600 hover:text-[var(--color-brand)] transition-colors">
                    <Circle className="w-6 h-6" />
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-[var(--color-text-primary)] dark:text-[#E2E8F0] truncate">{task.title}</span>
                      {task.reminder && <Bell className="w-3 h-3 text-[var(--color-brand)]" />}
                    </div>
                    {(task.dueDate || task.dueTime) && (
                      <div className={cn(
                        "flex items-center gap-2 mt-0.5 text-[10px] font-bold uppercase tracking-widest",
                        isOverdue ? "text-red-500" : "text-neutral-400"
                      )}>
                        <Clock className="w-3 h-3" />
                        {task.dueDate && new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        {task.dueTime && ` • ${task.dueTime}`}
                        {isOverdue && <span className="ml-1 text-red-600 dark:text-red-400">(Overdue)</span>}
                      </div>
                    )}
                  </div>
                  <div className={cn(
                    "text-[10px] uppercase tracking-widest font-bold px-3 py-1 rounded-lg",
                    task.priority === 'high' ? "bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400" :
                    task.priority === 'medium' ? "bg-amber-50 text-amber-500 dark:bg-amber-500/10 dark:text-amber-400" :
                    "bg-[var(--color-brand-light)] text-[var(--color-brand)] dark:bg-[#7FA4E8]/10 dark:text-[#7FA4E8]"
                  )}>
                    {task.priority}
                  </div>
                </motion.div>
              );
            })}
            {pendingTasks.length === 0 && (
              <div className="text-center py-12">
                <CheckCircle2 className="w-10 h-10 text-neutral-200 mx-auto mb-3" />
                <p className="text-sm text-neutral-400">All tasks completed!</p>
              </div>
            )}
          </div>
          {pendingTasks.length > 5 && (
            <button className="mt-6 text-sm font-bold text-[var(--color-brand)] dark:text-[#7FA4E8] flex items-center gap-2 hover:underline">
              View all {pendingTasks.length} tasks <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </section>

        {/* AI Suggestions Widget */}
        <section className="glass-card p-8 bg-[var(--color-brand-light)] dark:bg-[#7FA4E8]/5 border-[var(--color-brand)]/10 flex flex-col">
          <div className="flex items-center gap-3 mb-6">
            <Sparkles className="w-6 h-6 text-[var(--color-brand)] dark:text-[#7FA4E8]" />
            <h3 className="font-bold text-lg text-[var(--color-text-primary)] dark:text-[#E2E8F0]">AI Intelligence</h3>
          </div>
          
          <div className="flex-1 space-y-6">
            {aiSuggestion ? (
              <div className="text-sm text-[var(--color-text-secondary)] dark:text-[#CBD5E1] space-y-6">
                <div className="whitespace-pre-wrap leading-relaxed bg-white/50 dark:bg-white/5 p-5 rounded-2xl border border-white/20">{aiSuggestion}</div>
                <button 
                  onClick={() => setAiSuggestion(null)}
                  className="text-[var(--color-brand)] dark:text-[#7FA4E8] font-bold hover:underline flex items-center gap-2"
                >
                  Refresh insights
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="p-5 bg-white/50 dark:bg-white/5 rounded-2xl border border-white/20 space-y-3">
                  <div className="flex items-center gap-2 text-amber-500">
                    <Bell className="w-4 h-4" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Workload Alert</span>
                  </div>
                  <p className="text-sm text-[var(--color-text-secondary)] dark:text-[#CBD5E1]">You have 3 high-priority tasks due tomorrow. Consider starting "Thesis Draft" now.</p>
                </div>
                <button 
                  onClick={getAiPriorities}
                  disabled={isLoadingAi}
                  className="accent-button w-full flex items-center justify-center gap-3"
                >
                  {isLoadingAi ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Optimize My Day</>}
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Upcoming Deadlines Widget */}
        <section className="glass-card p-8 flex flex-col">
          <h3 className="font-bold text-lg mb-6 text-[var(--color-text-primary)] dark:text-[#E2E8F0] flex items-center gap-3">
            <Calendar className="w-6 h-6 text-[var(--color-brand)]" />
            Upcoming
          </h3>
          <div className="space-y-6 flex-1">
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
              {[
                { day: 'Fri', date: '27', active: true },
                { day: 'Sat', date: '28', active: false },
                { day: 'Sun', date: '01', active: false },
                { day: 'Mon', date: '02', active: false },
                { day: 'Tue', date: '03', active: false },
              ].map((d, i) => (
                <div key={i} className={cn(
                  "flex-shrink-0 w-14 h-20 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all",
                  d.active ? "bg-[var(--color-brand)] text-white shadow-lg" : "bg-[var(--color-bg-section)] dark:bg-white/5 text-neutral-400"
                )}>
                  <span className="text-[10px] font-bold uppercase tracking-widest">{d.day}</span>
                  <span className="text-xl font-bold">{d.date}</span>
                </div>
              ))}
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-[var(--color-bg-section)] dark:bg-white/5 border border-transparent hover:border-[var(--color-border-subtle)] transition-all">
                <div className="w-2 h-2 rounded-full bg-red-400" />
                <div className="flex-1">
                  <p className="text-sm font-bold">Thesis Draft v1</p>
                  <p className="text-[10px] text-neutral-400 uppercase font-bold tracking-widest">14:00 • Tomorrow</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-[var(--color-bg-section)] dark:bg-white/5 border border-transparent hover:border-[var(--color-border-subtle)] transition-all">
                <div className="w-2 h-2 rounded-full bg-amber-400" />
                <div className="flex-1">
                  <p className="text-sm font-bold">Project Presentation</p>
                  <p className="text-[10px] text-neutral-400 uppercase font-bold tracking-widest">10:00 • In 3 days</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Research Snapshot Widget */}
        <section className="glass-card p-8 flex flex-col group cursor-pointer hover:shadow-xl transition-all" onClick={() => setActiveModal('research')}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-lg text-[var(--color-text-primary)] dark:text-[#E2E8F0] flex items-center gap-3">
              <Search className="w-6 h-6 text-indigo-500" />
              Research
            </h3>
            <ArrowRight className="w-5 h-5 text-neutral-300 group-hover:translate-x-1 transition-transform" />
          </div>
          <div className="space-y-4 flex-1">
            <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-500/5 border border-indigo-100 dark:border-indigo-500/10">
              <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400">Neural Radiance Fields</p>
              <p className="text-[10px] text-indigo-400/70 uppercase font-bold tracking-widest mt-1">Draft • 2 pages</p>
            </div>
            <div className="flex items-center gap-3 px-2">
              <Quote className="w-4 h-4 text-neutral-300" />
              <span className="text-xs text-neutral-500 italic">"Vaswani et al. (2017) Attention is all..."</span>
            </div>
          </div>
        </section>

        {/* Meeting Assistant Widget */}
        <section className="glass-card p-8 flex flex-col group cursor-pointer hover:shadow-xl transition-all" onClick={() => setActiveModal('meeting')}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-lg text-[var(--color-text-primary)] dark:text-[#E2E8F0] flex items-center gap-3">
              <Mic className="w-6 h-6 text-emerald-500" />
              Recent Assistant
            </h3>
            <ArrowRight className="w-5 h-5 text-neutral-300 group-hover:translate-x-1 transition-transform" />
          </div>
          <div className="space-y-4 flex-1">
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-500/5 border border-emerald-100 dark:border-emerald-500/10">
              <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">Project Sync Q3</p>
              <p className="text-[10px] text-emerald-400/70 uppercase font-bold tracking-widest mt-1">Summary Generated</p>
            </div>
            <div className="space-y-2 px-2">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span className="text-[10px] text-neutral-500 font-medium">Finalize API docs by Friday</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span className="text-[10px] text-neutral-500 font-medium">Schedule next sync</span>
              </div>
            </div>
          </div>
        </section>

        {/* Knowledge Hub Activity Widget */}
        <section className="glass-card p-8 flex flex-col group cursor-pointer hover:shadow-xl transition-all" onClick={() => setActiveModal('knowledge')}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-lg text-[var(--color-text-primary)] dark:text-[#E2E8F0] flex items-center gap-3">
              <Database className="w-6 h-6 text-slate-500" />
              Knowledge Hub
            </h3>
            <ArrowRight className="w-5 h-5 text-neutral-300 group-hover:translate-x-1 transition-transform" />
          </div>
          <div className="space-y-4 flex-1">
            {state.projects.slice(0, 2).map((project) => (
              <div key={project.id} className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-500/10 flex items-center justify-center text-slate-400">
                  <Folder className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold">{project.name}</p>
                  <p className="text-[10px] text-neutral-400 uppercase font-bold tracking-widest">{project.status}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Modals / Side Panels */}
      <AnimatePresence>
        {activeModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveModal(null)}
              className="absolute inset-0 bg-neutral-900/40 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-6xl max-h-[90vh] bg-[var(--color-bg-main)] dark:bg-[#0F172A] rounded-[32px] shadow-2xl overflow-hidden border border-[var(--color-border-subtle)] dark:border-white/5 flex flex-col"
            >
              <div className="p-6 border-b border-[var(--color-border-subtle)] dark:border-white/5 flex items-center justify-between bg-white dark:bg-[#1E293B]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[var(--color-brand)] rounded-2xl flex items-center justify-center text-white">
                    {activeModal === 'research' && <Search className="w-5 h-5" />}
                    {activeModal === 'meeting' && <Mic className="w-5 h-5" />}
                    {activeModal === 'automation' && <Zap className="w-5 h-5" />}
                    {activeModal === 'knowledge' && <Database className="w-5 h-5" />}
                    {activeModal === 'addTask' && <Plus className="w-5 h-5" />}
                  </div>
                  <h2 className="text-xl font-bold capitalize">{activeModal === 'addTask' ? 'Add Task' : activeModal}</h2>
                </div>
                <button 
                  onClick={() => setActiveModal(null)}
                  className="p-3 hover:bg-neutral-100 dark:hover:bg-white/5 rounded-2xl transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                {renderModalContent()}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
