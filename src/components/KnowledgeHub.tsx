import React, { useState, useMemo } from 'react';
import { 
  Database, 
  Folder, 
  Search, 
  Plus, 
  MoreVertical, 
  ExternalLink, 
  FileText, 
  Tag, 
  Clock, 
  Trash2, 
  Edit3, 
  Save, 
  X, 
  ChevronRight, 
  History, 
  Filter,
  BookOpen,
  Zap,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { AppState, KnowledgeEntry, KnowledgeCategory, KnowledgeVersion } from '../types';
import { cn } from '../lib/utils';

interface KnowledgeHubProps {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
}

export function KnowledgeHub({ state, setState }: KnowledgeHubProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<KnowledgeCategory | 'All'>('All');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isAddingEntry, setIsAddingEntry] = useState(false);
  const [editingEntry, setEditingEntry] = useState<KnowledgeEntry | null>(null);
  const [viewingEntry, setViewingEntry] = useState<KnowledgeEntry | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  
  // New Entry State
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState<KnowledgeCategory>('Notes');
  const [newTags, setNewTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  // Categories
  const categories: (KnowledgeCategory | 'All')[] = ['All', 'Research', 'Notes', 'Decisions', 'Logs'];

  // All Tags from all entries
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    (state.knowledgeEntries || []).forEach(e => e.tags?.forEach(t => tags.add(t)));
    (state.notes || []).forEach(n => n.tags?.forEach(t => tags.add(t)));
    return Array.from(tags);
  }, [state.knowledgeEntries, state.notes]);

  // Filtered Entries
  const filteredEntries = useMemo(() => {
    // Load automation history from localStorage for sync
    const savedHistory = localStorage.getItem('orivon_history');
    const automationLogs = savedHistory ? JSON.parse(savedHistory) : [];

    // Combine knowledgeEntries, notes, and automation logs
    const combined: (KnowledgeEntry | any)[] = [
      ...(state.knowledgeEntries || []),
      ...(state.notes || []).map(n => ({
        id: n.id,
        title: n.title,
        content: n.content,
        category: 'Notes' as KnowledgeCategory,
        tags: n.tags || [],
        createdAt: n.updatedAt,
        updatedAt: n.updatedAt,
        history: [],
        isLegacy: true,
        source: 'Research'
      })),
      ...automationLogs.filter((h: any) => h.status === 'success').map((h: any) => ({
        id: h.id,
        title: `Automation: ${h.automationTitle}`,
        content: h.output || `Automation run completed successfully at ${new Date(h.timestamp).toLocaleString()}.`,
        category: 'Logs' as KnowledgeCategory,
        tags: ['automation', h.automationTitle.toLowerCase().replace(/\s+/g, '-')],
        createdAt: h.timestamp,
        updatedAt: h.timestamp,
        history: [],
        isLegacy: true,
        source: 'Automation'
      }))
    ];

    return combined.filter(entry => {
      const matchesSearch = 
        entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.tags.some((t: string) => t.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesCategory = selectedCategory === 'All' || entry.category === selectedCategory;
      
      const matchesTags = selectedTags.length === 0 || selectedTags.every(t => entry.tags.includes(t));

      return matchesSearch && matchesCategory && matchesTags;
    }).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [state.knowledgeEntries, state.notes, searchQuery, selectedCategory, selectedTags]);

  const handleAddEntry = () => {
    if (!newTitle.trim() || !newContent.trim()) return;

    const entry: KnowledgeEntry = {
      id: Math.random().toString(36).substr(2, 9),
      title: newTitle,
      content: newContent,
      category: newCategory,
      tags: newTags,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      history: []
    };

    setState(prev => ({
      ...prev,
      knowledgeEntries: [entry, ...prev.knowledgeEntries]
    }));

    resetNewEntryForm();
    setIsAddingEntry(false);
  };

  const resetNewEntryForm = () => {
    setNewTitle('');
    setNewContent('');
    setNewCategory('Notes');
    setNewTags([]);
    setTagInput('');
  };

  const handleUpdateEntry = () => {
    if (!editingEntry) return;

    const updatedEntry: KnowledgeEntry = {
      ...editingEntry,
      updatedAt: new Date().toISOString(),
      history: [
        {
          id: Math.random().toString(36).substr(2, 9),
          content: editingEntry.content,
          updatedAt: editingEntry.updatedAt
        },
        ...editingEntry.history
      ].slice(0, 10) // Keep last 10 versions
    };

    setState(prev => ({
      ...prev,
      knowledgeEntries: prev.knowledgeEntries.map(e => e.id === updatedEntry.id ? updatedEntry : e)
    }));

    setEditingEntry(null);
    setViewingEntry(updatedEntry);
  };

  const handleDeleteEntry = (id: string) => {
    if (window.confirm('Are you sure you want to delete this entry? This action cannot be undone.')) {
      setState(prev => ({
        ...prev,
        knowledgeEntries: prev.knowledgeEntries.filter(e => e.id !== id),
        notes: prev.notes.filter(n => n.id !== id)
      }));
      setViewingEntry(null);
      setEditingEntry(null);
    }
  };

  const handleRestoreVersion = (version: KnowledgeVersion) => {
    if (!viewingEntry) return;

    const updatedEntry: KnowledgeEntry = {
      ...viewingEntry,
      content: version.content,
      updatedAt: new Date().toISOString(),
      history: [
        {
          id: Math.random().toString(36).substr(2, 9),
          content: viewingEntry.content,
          updatedAt: viewingEntry.updatedAt
        },
        ...viewingEntry.history
      ].slice(0, 10)
    };

    setState(prev => ({
      ...prev,
      knowledgeEntries: prev.knowledgeEntries.map(e => e.id === updatedEntry.id ? updatedEntry : e)
    }));

    setViewingEntry(updatedEntry);
    setShowHistory(false);
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const addTagToNewEntry = () => {
    if (tagInput.trim() && !newTags.includes(tagInput.trim())) {
      setNewTags([...newTags, tagInput.trim()]);
      setTagInput('');
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-24 md:pb-12 px-4 md:px-0">
      {/* --- Header --- */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h2 className="text-4xl font-bold tracking-tight text-[var(--color-text-primary)] dark:text-[#E2E8F0]">Knowledge Hub</h2>
          <p className="text-[var(--color-text-secondary)] dark:text-[#CBD5E1] leading-relaxed">Your centralized brain for research, decisions, and project logs.</p>
        </div>
        <button 
          onClick={() => setIsAddingEntry(true)}
          className="accent-button flex items-center gap-3"
        >
          <Plus className="w-5 h-5" />
          Create Entry
        </button>
      </header>

      {/* --- Search & Filters --- */}
      <div className="space-y-6">
        <div className="glass-card p-3 flex items-center gap-4 px-6 bg-white dark:bg-[#1E293B] shadow-lg shadow-brand/5">
          <Search className="w-6 h-6 text-neutral-300 dark:text-neutral-600" />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search titles, content, or tags..."
            className="w-full py-4 bg-transparent focus:outline-none text-lg text-[var(--color-text-primary)] dark:text-[#E2E8F0] placeholder:text-neutral-400"
          />
          <div className="hidden sm:flex items-center gap-1.5 text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest bg-[var(--color-bg-section)] dark:bg-white/5 px-3 py-1.5 rounded-xl border border-[var(--color-border-subtle)] dark:border-white/5">
            <kbd>CMD</kbd> + <kbd>K</kbd>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all border",
                  selectedCategory === cat 
                    ? "bg-[var(--color-brand)] border-[var(--color-brand)] text-white shadow-lg shadow-brand/20"
                    : "bg-white dark:bg-white/5 border-neutral-100 dark:border-white/10 text-neutral-400 hover:border-neutral-200 dark:hover:border-white/20"
                )}
              >
                {cat}
              </button>
            ))}
          </div>

          {allTags.length > 0 && (
            <div className="flex flex-wrap gap-2 max-w-md justify-end">
              {allTags.slice(0, 8).map(tag => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border flex items-center gap-1.5",
                    selectedTags.includes(tag)
                      ? "bg-indigo-500 border-indigo-500 text-white"
                      : "bg-neutral-50 dark:bg-white/5 border-neutral-100 dark:border-white/10 text-neutral-400"
                  )}
                >
                  <Tag className="w-3 h-3" />
                  {tag}
                </button>
              ))}
              {allTags.length > 8 && (
                <span className="text-[10px] font-bold text-neutral-400 self-center">+{allTags.length - 8} more</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* --- Entries Grid --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredEntries.length > 0 ? filteredEntries.map((entry) => (
          <motion.div 
            layout
            key={entry.id} 
            onClick={() => setViewingEntry(entry)}
            className="glass-card p-8 flex flex-col group hover:shadow-xl hover:-translate-y-1 transition-all duration-500 bg-white dark:bg-[#1E293B] cursor-pointer border border-transparent hover:border-brand/20"
          >
            <div className="flex items-start justify-between mb-6">
              <div className={cn(
                "w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:scale-110",
                entry.category === 'Research' ? "bg-blue-50 dark:bg-blue-500/10 text-blue-500" :
                entry.category === 'Decisions' ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500" :
                entry.category === 'Logs' ? "bg-amber-50 dark:bg-amber-500/10 text-amber-500" :
                "bg-purple-50 dark:bg-purple-500/10 text-purple-500"
              )}>
                {entry.category === 'Research' ? <BookOpen className="w-7 h-7" /> :
                 entry.category === 'Decisions' ? <CheckCircle2 className="w-7 h-7" /> :
                 entry.category === 'Logs' ? <Zap className="w-7 h-7" /> :
                 <FileText className="w-7 h-7" />}
              </div>
              <div className="flex items-center gap-2">
                {entry.isLegacy && (
                  <span className="text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 bg-neutral-100 dark:bg-white/10 text-neutral-400 rounded">Synced</span>
                )}
                <button className="text-neutral-300 dark:text-neutral-600 hover:text-[var(--color-text-primary)] dark:hover:text-[#E2E8F0] transition-colors">
                  <MoreVertical className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            <h3 className="font-bold text-xl mb-2 text-[var(--color-text-primary)] dark:text-[#E2E8F0] group-hover:text-brand transition-colors line-clamp-1">{entry.title}</h3>
            <div className="text-[var(--color-text-secondary)] dark:text-[#CBD5E1] text-sm flex-1 mb-8 leading-relaxed line-clamp-3 prose prose-sm dark:prose-invert">
              <ReactMarkdown>{entry.content}</ReactMarkdown>
            </div>
            
            <div className="flex flex-wrap gap-1.5 mb-6">
              {entry.tags.slice(0, 3).map((tag: string) => (
                <span key={tag} className="text-[9px] font-bold uppercase tracking-wider px-2 py-1 bg-neutral-50 dark:bg-white/5 text-neutral-400 rounded-lg border border-neutral-100 dark:border-white/5">
                  #{tag}
                </span>
              ))}
              {entry.tags.length > 3 && (
                <span className="text-[9px] font-bold text-neutral-300">+{entry.tags.length - 3}</span>
              )}
            </div>

            <div className="flex items-center justify-between pt-6 border-t border-[var(--color-border-subtle)] dark:border-white/5">
              <div className="flex items-center gap-2 text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
                <Clock className="w-3 h-3" />
                {new Date(entry.updatedAt).toLocaleDateString()}
              </div>
              <span className={cn(
                "text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-lg",
                entry.category === 'Research' ? "bg-blue-50 dark:bg-blue-500/10 text-blue-600" :
                entry.category === 'Decisions' ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600" :
                entry.category === 'Logs' ? "bg-amber-50 dark:bg-amber-500/10 text-amber-600" :
                "bg-purple-50 dark:bg-purple-500/10 text-purple-600"
              )}>
                {entry.category}
              </span>
            </div>
          </motion.div>
        )) : (
          <div className="col-span-full py-24 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-20 h-20 rounded-full bg-neutral-50 dark:bg-white/5 flex items-center justify-center text-neutral-200 dark:text-neutral-700">
              <Database className="w-10 h-10" />
            </div>
            <div className="space-y-1">
              <h4 className="text-xl font-bold text-neutral-400">No entries found</h4>
              <p className="text-sm text-neutral-300">Try adjusting your search or filters, or create a new entry.</p>
            </div>
          </div>
        )}
      </div>

      {/* --- Modals --- */}
      <AnimatePresence>
        {/* Create Entry Modal */}
        {isAddingEntry && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddingEntry(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-white dark:bg-[#0F172A] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <h3 className="font-bold text-xl text-[var(--color-text-primary)] dark:text-[#E2E8F0]">Create Knowledge Entry</h3>
                  <div className="flex bg-neutral-100 dark:bg-white/5 p-1 rounded-xl">
                    <button 
                      onClick={() => setIsPreviewMode(false)}
                      className={cn("px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all", !isPreviewMode ? "bg-white dark:bg-white/10 shadow-sm text-brand" : "text-neutral-400")}
                    >Edit</button>
                    <button 
                      onClick={() => setIsPreviewMode(true)}
                      className={cn("px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all", isPreviewMode ? "bg-white dark:bg-white/10 shadow-sm text-brand" : "text-neutral-400")}
                    >Preview</button>
                  </div>
                </div>
                <button onClick={() => setIsAddingEntry(false)} className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-all">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-8 space-y-6 overflow-y-auto custom-scrollbar">
                {!isPreviewMode ? (
                  <>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-neutral-400">Title</label>
                      <input 
                        type="text" 
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        placeholder="e.g. Project Architecture Decisions"
                        className="w-full bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-800 rounded-2xl px-6 py-4 text-lg font-bold focus:outline-none focus:ring-2 focus:ring-brand/20 transition-all"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-neutral-400">Category</label>
                        <select 
                          value={newCategory}
                          onChange={(e) => setNewCategory(e.target.value as KnowledgeCategory)}
                          className="w-full bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-800 rounded-2xl px-6 py-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand/20 transition-all appearance-none cursor-pointer"
                        >
                          {categories.filter(c => c !== 'All').map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-neutral-400">Tags</label>
                        <div className="flex items-center gap-2">
                          <input 
                            type="text" 
                            value={tagInput}
                            onChange={(e) => setTagInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && addTagToNewEntry()}
                            placeholder="Add tag..."
                            className="flex-1 bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-800 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 transition-all"
                          />
                          <button 
                            onClick={addTagToNewEntry}
                            className="p-4 rounded-2xl bg-neutral-100 dark:bg-neutral-800 text-neutral-400 hover:text-brand transition-all"
                          >
                            <Plus className="w-5 h-5" />
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {newTags.map(tag => (
                            <span key={tag} className="flex items-center gap-2 px-3 py-1.5 bg-brand/10 text-brand text-[10px] font-bold uppercase tracking-widest rounded-lg">
                              {tag}
                              <button onClick={() => setNewTags(newTags.filter(t => t !== tag))}><X className="w-3 h-3" /></button>
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-neutral-400">Content (Markdown Supported)</label>
                      <textarea 
                        value={newContent}
                        onChange={(e) => setNewContent(e.target.value)}
                        placeholder="Share your knowledge, decisions, or research insights..."
                        className="w-full h-64 bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-800 rounded-2xl px-6 py-4 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-brand/20 transition-all resize-none custom-scrollbar"
                      />
                    </div>
                  </>
                ) : (
                  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                    <div className="space-y-2">
                      <h1 className="text-3xl font-bold">{newTitle || 'Untitled Entry'}</h1>
                      <div className="flex items-center gap-3">
                        <span className="px-3 py-1 bg-brand/10 text-brand text-[10px] font-bold uppercase tracking-widest rounded-lg">{newCategory}</span>
                        <div className="flex gap-2">
                          {newTags.map(tag => (
                            <span key={tag} className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest">#{tag}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="prose prose-lg dark:prose-invert max-w-none">
                      <ReactMarkdown>{newContent || '*No content yet*'}</ReactMarkdown>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-end gap-4">
                <button 
                  onClick={() => setIsAddingEntry(false)}
                  className="px-6 py-3 rounded-2xl font-bold text-sm text-neutral-400 hover:text-neutral-600 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleAddEntry}
                  disabled={!newTitle.trim() || !newContent.trim()}
                  className="px-10 py-3 rounded-2xl bg-brand text-white font-bold text-sm shadow-lg shadow-brand/20 hover:scale-105 transition-all active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
                >
                  Save Entry
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Entry Viewer / Editor Modal */}
        {(viewingEntry || editingEntry) && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { setViewingEntry(null); setEditingEntry(null); setShowHistory(false); }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-4xl bg-white dark:bg-[#0F172A] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center",
                    (editingEntry || viewingEntry)?.category === 'Research' ? "bg-blue-50 text-blue-500" :
                    (editingEntry || viewingEntry)?.category === 'Decisions' ? "bg-emerald-50 text-emerald-500" :
                    (editingEntry || viewingEntry)?.category === 'Logs' ? "bg-amber-50 text-amber-500" :
                    "bg-purple-50 text-purple-500"
                  )}>
                    {(editingEntry || viewingEntry)?.category === 'Research' ? <BookOpen className="w-5 h-5" /> :
                     (editingEntry || viewingEntry)?.category === 'Decisions' ? <CheckCircle2 className="w-5 h-5" /> :
                     (editingEntry || viewingEntry)?.category === 'Logs' ? <Zap className="w-5 h-5" /> :
                     <FileText className="w-5 h-5" />}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-[var(--color-text-primary)] dark:text-[#E2E8F0]">
                      {editingEntry ? 'Edit Entry' : viewingEntry?.title}
                    </h3>
                    {!editingEntry && (
                      <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
                        Last Modified: {new Date(viewingEntry!.updatedAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!editingEntry && !viewingEntry?.isLegacy && (
                    <>
                      <button 
                        onClick={() => setEditingEntry(viewingEntry)}
                        className="p-2.5 rounded-xl bg-neutral-50 dark:bg-white/5 text-neutral-400 hover:text-brand transition-all"
                        title="Edit"
                      >
                        <Edit3 className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => setShowHistory(!showHistory)}
                        className={cn(
                          "p-2.5 rounded-xl transition-all",
                          showHistory ? "bg-brand text-white" : "bg-neutral-50 dark:bg-white/5 text-neutral-400 hover:text-brand"
                        )}
                        title="Version History"
                      >
                        <History className="w-5 h-5" />
                      </button>
                    </>
                  )}
                  <button 
                    onClick={() => handleDeleteEntry((editingEntry || viewingEntry)!.id)}
                    className="p-2.5 rounded-xl bg-neutral-50 dark:bg-white/5 text-neutral-400 hover:text-red-500 transition-all"
                    title="Delete"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                  <button onClick={() => { setViewingEntry(null); setEditingEntry(null); setShowHistory(false); }} className="p-2.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-all">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="flex-1 flex overflow-hidden">
                <div className="flex-1 p-10 overflow-y-auto custom-scrollbar">
                  {editingEntry ? (
                    <div className="space-y-8">
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-neutral-400">Title</label>
                        <input 
                          type="text" 
                          value={editingEntry.title}
                          onChange={(e) => setEditingEntry({ ...editingEntry, title: e.target.value })}
                          className="w-full bg-transparent border-b border-neutral-200 dark:border-white/10 py-2 text-2xl font-bold focus:outline-none focus:border-brand transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-neutral-400">Content</label>
                        <textarea 
                          value={editingEntry.content}
                          onChange={(e) => setEditingEntry({ ...editingEntry, content: e.target.value })}
                          className="w-full h-[500px] bg-neutral-50 dark:bg-white/5 border border-neutral-100 dark:border-white/10 rounded-3xl p-8 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-brand/20 transition-all resize-none custom-scrollbar"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                      <div className="flex flex-wrap gap-2">
                        {viewingEntry?.tags.map(tag => (
                          <span key={tag} className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500 text-[10px] font-bold uppercase tracking-widest rounded-lg border border-indigo-100 dark:border-indigo-500/20">
                            #{tag}
                          </span>
                        ))}
                      </div>
                      <div className="prose prose-lg dark:prose-invert max-w-none">
                        <ReactMarkdown>{viewingEntry!.content}</ReactMarkdown>
                      </div>

                      {/* Related Entries Placeholder */}
                      <div className="pt-12 border-t border-neutral-100 dark:border-neutral-800 space-y-6">
                        <h4 className="text-xs font-bold uppercase tracking-widest text-neutral-400 flex items-center gap-2">
                          <AlertCircle className="w-4 h-4" /> Related Knowledge
                        </h4>
                        <div className="grid grid-cols-2 gap-4">
                          {(state.knowledgeEntries || []).filter(e => e.id !== viewingEntry?.id && e.category === viewingEntry?.category).slice(0, 2).map(related => (
                            <div 
                              key={related.id}
                              onClick={() => setViewingEntry(related)}
                              className="p-4 rounded-2xl bg-neutral-50 dark:bg-white/5 border border-neutral-100 dark:border-white/10 hover:border-brand/30 transition-all cursor-pointer group"
                            >
                              <p className="text-xs font-bold text-neutral-500 group-hover:text-brand transition-colors line-clamp-1">{related.title}</p>
                              <p className="text-[10px] text-neutral-400 uppercase mt-1">{related.category}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* History Sidebar */}
                <AnimatePresence>
                  {showHistory && (
                    <motion.div 
                      initial={{ width: 0, opacity: 0 }}
                      animate={{ width: 320, opacity: 1 }}
                      exit={{ width: 0, opacity: 0 }}
                      className="border-l border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-white/5 overflow-y-auto custom-scrollbar"
                    >
                      <div className="p-6 space-y-6">
                        <h4 className="text-xs font-bold uppercase tracking-widest text-neutral-400">Version History</h4>
                        <div className="space-y-4">
                          {viewingEntry?.history.length === 0 ? (
                            <p className="text-xs text-neutral-400 italic">No previous versions available.</p>
                          ) : (
                            viewingEntry?.history.map((version, i) => (
                              <div key={version.id} className="p-4 rounded-2xl bg-white dark:bg-white/5 border border-neutral-100 dark:border-white/10 space-y-3">
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] font-bold text-neutral-400 uppercase">v{viewingEntry.history.length - i}</span>
                                  <span className="text-[10px] text-neutral-400">{new Date(version.updatedAt).toLocaleDateString()}</span>
                                </div>
                                <p className="text-[10px] text-neutral-500 line-clamp-2 italic">"{version.content.substring(0, 60)}..."</p>
                                <button 
                                  onClick={() => handleRestoreVersion(version)}
                                  className="w-full py-2 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500 text-[10px] font-bold uppercase tracking-widest hover:bg-indigo-500 hover:text-white transition-all"
                                >
                                  Restore
                                </button>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="p-6 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-end gap-4">
                {editingEntry ? (
                  <>
                    <button 
                      onClick={() => setEditingEntry(null)}
                      className="px-6 py-3 rounded-2xl font-bold text-sm text-neutral-400 hover:text-neutral-600 transition-all"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleUpdateEntry}
                      className="px-10 py-3 rounded-2xl bg-brand text-white font-bold text-sm shadow-lg shadow-brand/20 hover:scale-105 transition-all active:scale-95"
                    >
                      Save Changes
                    </button>
                  </>
                ) : (
                  <button 
                    onClick={() => { setViewingEntry(null); setShowHistory(false); }}
                    className="px-10 py-3 rounded-2xl bg-neutral-900 dark:bg-white dark:text-neutral-900 text-white font-bold text-sm shadow-lg hover:opacity-90 transition-all active:scale-95"
                  >
                    Close
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
