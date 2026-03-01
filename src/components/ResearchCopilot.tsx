import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  BookOpen, 
  FileText, 
  Quote, 
  Sparkles, 
  Send, 
  Loader2, 
  Plus, 
  Check, 
  Copy, 
  Download, 
  Save, 
  RefreshCw, 
  ChevronRight, 
  Trash2,
  ExternalLink,
  Library,
  PenTool,
  History,
  Filter,
  SortAsc,
  Type as TypeIcon,
  Calendar,
  FileDown,
  Share2,
  CheckCircle2,
  AlertCircle,
  Hash
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { 
  searchSources, 
  generateSourceSummary, 
  generateCitation, 
  generateResearchDraft, 
  generateStructuredNotes,
  generateSectionDraft,
  extractKeyInsights,
  generateBibliography,
  analyzeDocument,
  detectDocumentMetadata
} from '../services/ai';
import { AppState, ResearchSource, ResearchSession, Note } from '../types';
import { cn } from '../lib/utils';
import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';

// Set up PDF.js worker
// Using 3.11.174 as it is highly stable and avoids ES module worker issues in some environments
const PDFJS_VERSION = '3.11.174';
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.worker.min.js`;

interface ResearchCopilotProps {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
}

export function ResearchCopilot({ state, setState }: ResearchCopilotProps) {
  const [query, setQuery] = useState('');
  const [sources, setSources] = useState<ResearchSource[]>([]);
  const [savedSources, setSavedSources] = useState<ResearchSource[]>([]);
  const [selectedSource, setSelectedSource] = useState<ResearchSource | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [summaryDetail, setSummaryDetail] = useState<'short' | 'detailed'>('detailed');
  const [insights, setInsights] = useState<string | null>(null);
  const [bibliography, setBibliography] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [draft, setDraft] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [citationStyle, setCitationStyle] = useState<'APA' | 'MLA' | 'IEEE'>('APA');
  const [currentCitation, setCurrentCitation] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [searchFilters, setSearchFilters] = useState({ year: 'all', type: 'all' });
  const [sortBy, setSortBy] = useState<'relevance' | 'year'>('relevance');
  const [isSearching, setIsSearching] = useState(false);
  
  // Document Upload State
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [extractedText, setExtractedText] = useState<string>('');
  const [docMetadata, setDocMetadata] = useState<{title: string | null, authors: string[] | null, year: string | null} | null>(null);
  const [docAnalysis, setDocAnalysis] = useState<string | null>(null);
  const [isProcessingDoc, setIsProcessingDoc] = useState(false);
  const [docAnalysisType, setDocAnalysisType] = useState<'summary' | 'detailed' | 'insights' | 'statistics' | 'notes' | 'draft'>('summary');

  const workspaceRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-save session to global state
  useEffect(() => {
    if (query && (savedSources.length > 0 || notes || draft)) {
      const session: ResearchSession = {
        id: query.toLowerCase().replace(/\s+/g, '-'),
        topic: query,
        sources: savedSources,
        notes,
        draft,
        updatedAt: new Date().toISOString()
      };

      setState(prev => {
        const existing = prev.researchSessions.findIndex(s => s.topic === query);
        const newSessions = [...prev.researchSessions];
        if (existing >= 0) {
          newSessions[existing] = session;
        } else {
          newSessions.unshift(session);
        }
        return { ...prev, researchSessions: newSessions.slice(0, 10) };
      });
    }
  }, [savedSources, notes, draft, query]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
  };

  const processFile = async (file: File) => {
    const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword'];
    if (!validTypes.includes(file.type) && !file.name.endsWith('.docx') && !file.name.endsWith('.doc')) {
      alert("Unsupported file format. Please upload PDF or DOCX.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert("File is too large. Max 10MB.");
      return;
    }

    setIsProcessingDoc(true);
    setUploadedFile(file);
    setDocAnalysis(null);
    setDocMetadata(null);

    try {
      let text = '';
      if (file.type === 'application/pdf') {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let fullText = '';
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          const strings = content.items.map((item: any) => item.str);
          fullText += strings.join(' ') + '\n';
        }
        text = fullText;
      } else if (file.name.endsWith('.docx') || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        text = result.value;
      } else {
        alert("DOC format is limited. Please use DOCX or PDF for best results.");
        setIsProcessingDoc(false);
        return;
      }

      setExtractedText(text);
      const metadata = await detectDocumentMetadata(text);
      setDocMetadata(metadata);
    } catch (err) {
      console.error(err);
      alert("Error processing file.");
    } finally {
      setIsProcessingDoc(false);
    }
  };

  const handleAnalyzeDoc = async (type: typeof docAnalysisType = docAnalysisType) => {
    if (!extractedText) return;
    setIsProcessingDoc(true);
    setDocAnalysisType(type);
    try {
      const result = await analyzeDocument(extractedText, type);
      setDocAnalysis(result);
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessingDoc(false);
    }
  };

  const handleAddDocToDraft = () => {
    if (!docAnalysis) return;
    setDraft(prev => prev + `\n\n### Document Analysis (${docAnalysisType})\n${docAnalysis}`);
    alert("Analysis added to draft!");
  };

  const handleAddDocToNotes = () => {
    if (!docAnalysis) return;
    setNotes(prev => prev + `\n\n### Document Summary: ${uploadedFile?.name}\n${docAnalysis}`);
    alert("Analysis added to notes!");
  };

  const handleSaveDocAsSource = () => {
    if (!docMetadata || !uploadedFile) return;
    const newSource: ResearchSource = {
      id: `doc-${Date.now()}`,
      title: docMetadata.title || uploadedFile.name,
      authors: docMetadata.authors || ['Unknown Author'],
      year: docMetadata.year || new Date().getFullYear().toString(),
      abstract: extractedText.substring(0, 500) + '...',
      type: 'other'
    };
    saveSource(newSource);
    alert("Document saved to your research library!");
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    setIsSearching(true);
    try {
      const results = await searchSources(query);
      setSources(results);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSummarize = async (source: ResearchSource, detail: 'short' | 'detailed' = summaryDetail) => {
    setIsLoading(true);
    setSelectedSource(source);
    setSummaryDetail(detail);
    setInsights(null);
    try {
      const [summaryData, insightsData] = await Promise.all([
        generateSourceSummary(source, detail),
        extractKeyInsights(source)
      ]);
      setSummary(summaryData);
      setInsights(insightsData);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateBibliography = async () => {
    if (savedSources.length === 0) {
      alert("Please save some sources first.");
      return;
    }
    setIsLoading(true);
    try {
      const data = await generateBibliography(savedSources, citationStyle);
      setBibliography(data);
      setDraft(prev => prev + "\n\n## Bibliography\n" + data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateCitation = async (source: ResearchSource) => {
    setIsLoading(true);
    try {
      const cit = await generateCitation(source, citationStyle);
      setCurrentCitation(cit);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateDraft = async (section?: 'Introduction' | 'Body' | 'Conclusion') => {
    if (savedSources.length === 0) {
      alert("Please save some sources to your library first.");
      return;
    }
    
    setIsLoading(true);
    try {
      if (section) {
        const data = await generateSectionDraft(query || "Research Topic", savedSources, section);
        setDraft(prev => prev + `\n\n## ${section}\n${data}`);
      } else {
        const data = await generateResearchDraft(query || "Research Topic", savedSources);
        setDraft(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateNotes = async () => {
    if (savedSources.length === 0) {
      alert("Please save some sources to your library first.");
      return;
    }
    setIsLoading(true);
    try {
      const data = await generateStructuredNotes(query || "Research Topic", savedSources);
      setNotes(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSource = (source: ResearchSource) => {
    if (!savedSources.find(s => s.id === source.id)) {
      setSavedSources([...savedSources, source]);
    }
  };

  const removeSource = (id: string) => {
    setSavedSources(savedSources.filter(s => s.id !== id));
  };

  const syncToKnowledgeHub = () => {
    if (!notes && !draft) return;
    setIsSyncing(true);
    
    const newNote: Note = {
      id: Math.random().toString(36).substr(2, 9),
      title: `Research: ${query || 'Untitled Topic'}`,
      content: `## Topic: ${query}\n\n### Notes\n${notes}\n\n### Draft\n${draft}\n\n### Sources\n${savedSources.map(s => `- ${s.title} (${s.year})`).join('\n')}`,
      updatedAt: new Date().toISOString(),
      tags: ['research', (query || 'research').split(' ')[0].toLowerCase()]
    };

    setState(prev => ({
      ...prev,
      notes: [newNote, ...prev.notes]
    }));

    setTimeout(() => {
      setIsSyncing(false);
      alert("Synced to Knowledge Hub successfully!");
    }, 1000);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const exportSession = () => {
    const content = `Topic: ${query}\n\nNotes:\n${notes}\n\nDraft:\n${draft}\n\nSources:\n${savedSources.map(s => `${s.title} (${s.year})`).join('\n')}`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `research-${query || 'session'}.txt`;
    a.click();
  };

  const wordCount = draft.trim() ? draft.trim().split(/\s+/).length : 0;

  const filteredSources = sources
    .filter(s => searchFilters.year === 'all' || s.year === searchFilters.year)
    .filter(s => searchFilters.type === 'all' || s.type === searchFilters.type)
    .sort((a, b) => {
      if (sortBy === 'year') return parseInt(b.year) - parseInt(a.year);
      return 0; // Relevance is default from AI
    });

  return (
    <div className="max-w-5xl mx-auto space-y-12 pb-32" ref={workspaceRef}>
      {/* 1. Research Search Section */}
      <section className="space-y-6 pt-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-3xl font-bold tracking-tight text-[var(--color-text-primary)] dark:text-[#E2E8F0]">Research Workspace</h2>
            <p className="text-sm text-[var(--color-text-secondary)]">Search, analyze, and draft your research in one place.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={exportSession} className="p-2.5 rounded-xl bg-white dark:bg-white/5 border border-[var(--color-border-subtle)] hover:border-[var(--color-brand)] transition-all" title="Export Session">
              <FileDown className="w-5 h-5" />
            </button>
            <button onClick={syncToKnowledgeHub} className="p-2.5 rounded-xl bg-white dark:bg-white/5 border border-[var(--color-border-subtle)] hover:border-[var(--color-brand)] transition-all" title="Sync to Knowledge Hub">
              <Share2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="glass-card p-4 bg-white dark:bg-[#1E293B] shadow-2xl shadow-brand/5 border-brand/10">
          <form onSubmit={handleSearch} className="flex items-center gap-3 mb-4">
            <div className="flex-1 flex items-center gap-3 px-4 bg-[var(--color-bg-section)] dark:bg-white/5 rounded-2xl border border-transparent focus-within:border-[var(--color-brand)]/30 transition-all">
              <Search className="w-5 h-5 text-neutral-400" />
              <input 
                type="text" 
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Enter research topic or question..."
                className="w-full py-4 bg-transparent focus:outline-none text-lg"
              />
            </div>
            <button 
              type="submit"
              disabled={isSearching || !query.trim()}
              className="accent-button !p-4 rounded-2xl h-[60px] w-[60px] flex items-center justify-center"
            >
              {isSearching ? <Loader2 className="w-6 h-6 animate-spin" /> : <Send className="w-6 h-6" />}
            </button>
          </form>

          <div className="flex flex-wrap items-center gap-4 px-2">
            <div className="flex items-center gap-2 text-xs font-bold text-neutral-400 uppercase tracking-widest">
              <Filter className="w-3.5 h-3.5" /> Filters:
            </div>
            <select 
              value={searchFilters.type}
              onChange={(e) => setSearchFilters({...searchFilters, type: e.target.value})}
              className="bg-transparent text-xs font-semibold focus:outline-none cursor-pointer hover:text-[var(--color-brand)]"
            >
              <option value="all">All Types</option>
              <option value="journal">Journals</option>
              <option value="book">Books</option>
              <option value="conference">Conferences</option>
            </select>
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent text-xs font-semibold focus:outline-none cursor-pointer hover:text-[var(--color-brand)]"
            >
              <option value="relevance">Sort by Relevance</option>
              <option value="year">Sort by Year</option>
            </select>
          </div>
        </div>
      </section>

      {/* 1.5 Document Upload Section */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-xl flex items-center gap-3">
            <FileDown className="w-6 h-6 text-blue-500" />
            Upload & Summarize Document
          </h3>
        </div>

        <div className="glass-card p-8 bg-white dark:bg-[#1E293B] border-blue-500/10">
          {!uploadedFile ? (
            <div 
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const file = e.dataTransfer.files[0];
                if (file) processFile(file);
              }}
              className="border-2 border-dashed border-neutral-200 dark:border-white/10 rounded-3xl p-12 text-center space-y-4 hover:border-blue-500/50 transition-all cursor-pointer group"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="w-16 h-16 bg-blue-50 dark:bg-blue-500/10 rounded-2xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                <FileText className="w-8 h-8 text-blue-500" />
              </div>
              <div className="space-y-1">
                <p className="font-bold text-lg">Click or drag document here</p>
                <p className="text-sm text-neutral-400">Supports PDF, DOCX (Max 10MB)</p>
              </div>
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".pdf,.docx,.doc"
                className="hidden"
              />
            </div>
          ) : (
            <div className="space-y-8">
              <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-500/5 rounded-2xl border border-blue-100 dark:border-blue-500/20">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white dark:bg-white/5 rounded-xl">
                    <FileText className="w-6 h-6 text-blue-500" />
                  </div>
                  <div>
                    <p className="font-bold text-sm">{uploadedFile.name}</p>
                    <p className="text-[10px] text-neutral-400 uppercase font-bold tracking-widest">{(uploadedFile.size / 1024 / 1024).toFixed(2)} MB • {extractedText.length} characters</p>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    setUploadedFile(null);
                    setExtractedText('');
                    setDocAnalysis(null);
                    setDocMetadata(null);
                  }}
                  className="p-2 text-neutral-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>

              {isProcessingDoc && !docAnalysis && (
                <div className="py-12 flex flex-col items-center justify-center space-y-4">
                  <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
                  <p className="text-sm font-bold text-neutral-400 animate-pulse">Processing document contents...</p>
                </div>
              )}

              {extractedText && !isProcessingDoc && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                  <div className="flex flex-wrap gap-2">
                    <button 
                      onClick={() => handleAnalyzeDoc('summary')}
                      className={cn("px-4 py-2 rounded-xl text-xs font-bold transition-all", docAnalysisType === 'summary' && docAnalysis ? "bg-blue-500 text-white" : "bg-neutral-100 dark:bg-white/5 hover:bg-blue-500 hover:text-white")}
                    >Short Summary</button>
                    <button 
                      onClick={() => handleAnalyzeDoc('detailed')}
                      className={cn("px-4 py-2 rounded-xl text-xs font-bold transition-all", docAnalysisType === 'detailed' && docAnalysis ? "bg-blue-500 text-white" : "bg-neutral-100 dark:bg-white/5 hover:bg-blue-500 hover:text-white")}
                    >Detailed Summary</button>
                    <button 
                      onClick={() => handleAnalyzeDoc('insights')}
                      className={cn("px-4 py-2 rounded-xl text-xs font-bold transition-all", docAnalysisType === 'insights' && docAnalysis ? "bg-blue-500 text-white" : "bg-neutral-100 dark:bg-white/5 hover:bg-blue-500 hover:text-white")}
                    >Key Insights</button>
                    <button 
                      onClick={() => handleAnalyzeDoc('statistics')}
                      className={cn("px-4 py-2 rounded-xl text-xs font-bold transition-all", docAnalysisType === 'statistics' && docAnalysis ? "bg-blue-500 text-white" : "bg-neutral-100 dark:bg-white/5 hover:bg-blue-500 hover:text-white")}
                    >Key Statistics</button>
                    <button 
                      onClick={() => handleAnalyzeDoc('notes')}
                      className={cn("px-4 py-2 rounded-xl text-xs font-bold transition-all", docAnalysisType === 'notes' && docAnalysis ? "bg-blue-500 text-white" : "bg-neutral-100 dark:bg-white/5 hover:bg-blue-500 hover:text-white")}
                    >Research Notes</button>
                    <button 
                      onClick={() => handleAnalyzeDoc('draft')}
                      className={cn("px-4 py-2 rounded-xl text-xs font-bold transition-all", docAnalysisType === 'draft' && docAnalysis ? "bg-blue-500 text-white" : "bg-neutral-100 dark:bg-white/5 hover:bg-blue-500 hover:text-white")}
                    >Generate Draft</button>
                  </div>

                  {docAnalysis && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold uppercase tracking-widest text-neutral-400">Analysis Result</h4>
                        <div className="flex gap-2">
                          <button onClick={() => copyToClipboard(docAnalysis)} className="p-2 text-neutral-300 hover:text-blue-500"><Copy className="w-4 h-4" /></button>
                          <button onClick={handleAddDocToDraft} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500 text-white text-[10px] font-bold uppercase tracking-widest hover:scale-105 transition-all"><Plus className="w-3 h-3" /> Add to Draft</button>
                          <button onClick={handleAddDocToNotes} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-500 text-white text-[10px] font-bold uppercase tracking-widest hover:scale-105 transition-all"><Save className="w-3 h-3" /> Save to Notes</button>
                        </div>
                      </div>
                      <div className="p-6 bg-[var(--color-bg-section)] dark:bg-white/5 rounded-2xl border border-neutral-100 dark:border-white/5 max-h-96 overflow-y-auto custom-scrollbar">
                        <div className="prose prose-sm dark:prose-invert max-w-none">
                          <ReactMarkdown>{docAnalysis}</ReactMarkdown>
                        </div>
                      </div>
                    </div>
                  )}

                  {docMetadata && (
                    <div className="p-6 bg-neutral-50 dark:bg-white/5 rounded-2xl border border-neutral-100 dark:border-white/5 space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold uppercase tracking-widest text-neutral-400">Document Metadata</h4>
                        <button onClick={handleSaveDocAsSource} className="text-[10px] font-bold text-blue-500 hover:underline">Add to Library</button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="text-[10px] font-bold text-neutral-400 uppercase">Title</label>
                          <input 
                            type="text" 
                            value={docMetadata.title || ''} 
                            onChange={(e) => setDocMetadata({...docMetadata, title: e.target.value})}
                            className="w-full bg-transparent border-b border-neutral-200 dark:border-white/10 py-1 text-sm focus:outline-none focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-neutral-400 uppercase">Author(s)</label>
                          <input 
                            type="text" 
                            value={docMetadata.authors?.join(', ') || ''} 
                            onChange={(e) => setDocMetadata({...docMetadata, authors: e.target.value.split(', ')})}
                            className="w-full bg-transparent border-b border-neutral-200 dark:border-white/10 py-1 text-sm focus:outline-none focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-neutral-400 uppercase">Year</label>
                          <input 
                            type="text" 
                            value={docMetadata.year || ''} 
                            onChange={(e) => setDocMetadata({...docMetadata, year: e.target.value})}
                            className="w-full bg-transparent border-b border-neutral-200 dark:border-white/10 py-1 text-sm focus:outline-none focus:border-blue-500"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* 2. Search Results Section */}
      <AnimatePresence>
        {sources.length > 0 && (
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-xl flex items-center gap-3">
                <Library className="w-6 h-6 text-indigo-500" />
                Search Results
              </h3>
              <span className="text-xs font-bold text-neutral-400">{filteredSources.length} sources found</span>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {filteredSources.map((source) => (
                <motion.div 
                  layout
                  key={source.id}
                  className="glass-card p-6 bg-white dark:bg-[#1E293B] hover:shadow-xl transition-all border border-transparent hover:border-[var(--color-brand)]/20 group"
                >
                  <div className="flex justify-between gap-6">
                    <div className="space-y-3 flex-1">
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500">{source.type}</span>
                        <span className="text-[10px] font-bold text-neutral-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> {source.year}
                        </span>
                      </div>
                      <h4 className="font-bold text-xl leading-tight group-hover:text-[var(--color-brand)] transition-colors">{source.title}</h4>
                      <p className="text-xs text-neutral-500 font-medium">{source.authors.join(', ')}</p>
                      
                      <details className="group/abstract">
                        <summary className="text-xs font-bold text-[var(--color-brand)] cursor-pointer list-none flex items-center gap-1 hover:underline">
                          View Abstract <ChevronRight className="w-3 h-3 group-open/abstract:rotate-90 transition-transform" />
                        </summary>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-3 leading-relaxed bg-[var(--color-bg-section)] dark:bg-white/5 p-4 rounded-xl border border-neutral-100 dark:border-white/5">
                          {source.abstract}
                        </p>
                      </details>
                    </div>

                    <div className="flex flex-col gap-2">
                      <button 
                        onClick={() => handleSummarize(source)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-neutral-50 dark:bg-white/5 text-neutral-600 dark:text-neutral-400 text-xs font-bold hover:bg-[var(--color-brand)] hover:text-white transition-all"
                      >
                        <Sparkles className="w-4 h-4" /> Summarize
                      </button>
                      <button 
                        onClick={() => {
                          setSelectedSource(source);
                          handleGenerateCitation(source);
                        }}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-neutral-50 dark:bg-white/5 text-neutral-600 dark:text-neutral-400 text-xs font-bold hover:bg-[var(--color-brand)] hover:text-white transition-all"
                      >
                        <Quote className="w-4 h-4" /> Cite
                      </button>
                      <button 
                        onClick={() => saveSource(source)}
                        className={cn(
                          "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all",
                          savedSources.find(s => s.id === source.id) 
                            ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" 
                            : "bg-neutral-50 dark:bg-white/5 text-neutral-600 dark:text-neutral-400 hover:bg-emerald-500 hover:text-white"
                        )}
                      >
                        {savedSources.find(s => s.id === source.id) ? <CheckCircle2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                        {savedSources.find(s => s.id === source.id) ? 'Saved' : 'Save Source'}
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* 3. AI Summary Section (Inline) */}
      <AnimatePresence>
        {selectedSource && (
          <motion.section 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-xl flex items-center gap-3">
                <Sparkles className="w-6 h-6 text-amber-500" />
                AI Analysis: {selectedSource.title.length > 40 ? selectedSource.title.substring(0, 40) + '...' : selectedSource.title}
              </h3>
              <button onClick={() => setSelectedSource(null)} className="p-2 text-neutral-400 hover:text-red-500">
                <Trash2 className="w-5 h-5" />
              </button>
            </div>

            <div className="glass-card p-8 bg-white dark:bg-[#1E293B] space-y-6 border-amber-500/10">
              <div className="flex items-center justify-between border-b border-neutral-100 dark:border-white/5 pb-6">
                <div className="flex items-center gap-4">
                  <div className="flex bg-neutral-100 dark:bg-white/5 p-1 rounded-xl">
                    <button 
                      onClick={() => handleSummarize(selectedSource, 'short')}
                      className={cn("px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all", summaryDetail === 'short' ? "bg-white dark:bg-white/10 shadow-sm text-[var(--color-brand)]" : "text-neutral-400")}
                    >Short</button>
                    <button 
                      onClick={() => handleSummarize(selectedSource, 'detailed')}
                      className={cn("px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all", summaryDetail === 'detailed' ? "bg-white dark:bg-white/10 shadow-sm text-[var(--color-brand)]" : "text-neutral-400")}
                    >Detailed</button>
                  </div>
                  <button 
                    onClick={() => handleSummarize(selectedSource)}
                    className="p-2 text-neutral-400 hover:text-[var(--color-brand)] transition-colors"
                    title="Regenerate"
                  >
                    <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  <select 
                    value={citationStyle}
                    onChange={(e) => setCitationStyle(e.target.value as any)}
                    className="bg-transparent text-[10px] font-bold uppercase tracking-widest focus:outline-none cursor-pointer text-neutral-500"
                  >
                    <option value="APA">APA</option>
                    <option value="MLA">MLA</option>
                    <option value="IEEE">IEEE</option>
                  </select>
                  <button 
                    onClick={() => handleGenerateCitation(selectedSource)}
                    className="text-[10px] font-bold text-[var(--color-brand)] hover:underline"
                  >
                    Update Citation
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-neutral-400">AI Summary</h4>
                    <button onClick={() => copyToClipboard(summary || '')} className="p-1.5 text-neutral-300 hover:text-[var(--color-brand)]">
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="relative">
                    <textarea 
                      value={summary || ''}
                      onChange={(e) => setSummary(e.target.value)}
                      placeholder="AI Summary will appear here..."
                      className="w-full h-64 bg-[var(--color-bg-section)] dark:bg-white/5 p-6 rounded-2xl border border-neutral-100 dark:border-white/5 text-sm leading-relaxed focus:outline-none resize-none custom-scrollbar"
                    />
                    {isLoading && (
                      <div className="absolute inset-0 bg-white/50 dark:bg-black/20 backdrop-blur-[1px] flex items-center justify-center rounded-2xl">
                        <Loader2 className="w-8 h-8 animate-spin text-[var(--color-brand)]" />
                      </div>
                    )}
                  </div>
                  
                  {insights && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-6 bg-amber-50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/20 rounded-2xl"
                    >
                      <h5 className="text-[10px] font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400 mb-3 flex items-center gap-2">
                        <Sparkles className="w-3 h-3" /> Key Insights
                      </h5>
                      <div className="text-sm prose prose-sm dark:prose-invert max-w-none">
                        <ReactMarkdown>{insights}</ReactMarkdown>
                      </div>
                    </motion.div>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-neutral-400">Citation ({citationStyle})</h4>
                    <button onClick={() => copyToClipboard(currentCitation || '')} className="p-1.5 text-neutral-300 hover:text-[var(--color-brand)]">
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="p-6 bg-[var(--color-bg-section)] dark:bg-white/5 rounded-2xl border border-neutral-100 dark:border-white/5 h-32 flex items-center justify-center">
                    {currentCitation ? (
                      <p className="text-sm font-mono text-center leading-relaxed">{currentCitation}</p>
                    ) : (
                      <p className="text-xs text-neutral-400 italic">Generate a citation to see it here.</p>
                    )}
                  </div>
                  <div className="flex gap-3">
                    <button 
                      onClick={() => {
                        if (currentCitation) {
                          setDraft(prev => prev + "\n\n" + currentCitation);
                          alert("Citation inserted into draft!");
                        }
                      }}
                      className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-500/20 hover:scale-105 transition-all"
                    >
                      <Plus className="w-4 h-4" /> Insert into Draft
                    </button>
                    <button 
                      onClick={() => saveSource(selectedSource)}
                      className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-500/20 hover:scale-105 transition-all"
                    >
                      <Save className="w-4 h-4" /> Save Source
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* 4. Draft Workspace Section */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-xl flex items-center gap-3">
            <PenTool className="w-6 h-6 text-emerald-500" />
            Research Draft
          </h3>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-neutral-100 dark:bg-white/5 text-[10px] font-bold text-neutral-500 uppercase tracking-widest">
              <Hash className="w-3 h-3" /> {wordCount} Words
            </div>
            <div className="flex bg-neutral-100 dark:bg-white/5 p-1 rounded-xl">
              <button onClick={() => handleGenerateDraft('Introduction')} className="px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-white dark:hover:bg-white/10 transition-all">Intro</button>
              <button onClick={() => handleGenerateDraft('Body')} className="px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-white dark:hover:bg-white/10 transition-all">Body</button>
              <button onClick={() => handleGenerateDraft('Conclusion')} className="px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-white dark:hover:bg-white/10 transition-all">Conclusion</button>
            </div>
          </div>
        </div>

        <div className="glass-card p-8 bg-white dark:bg-[#1E293B] space-y-6">
          <div className="flex items-center justify-between border-b border-neutral-100 dark:border-white/5 pb-6">
            <div className="flex gap-2">
              <button 
                onClick={() => handleGenerateDraft()}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--color-brand)] text-white text-xs font-bold shadow-lg shadow-brand/20 hover:scale-105 transition-all"
              >
                <Sparkles className="w-4 h-4" /> Generate Full Draft
              </button>
              <button 
                onClick={handleGenerateBibliography}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-500/20 hover:scale-105 transition-all"
              >
                <Quote className="w-4 h-4" /> Generate Bibliography
              </button>
              <button 
                onClick={() => setDraft('')}
                className="p-2 text-neutral-300 hover:text-red-500 transition-colors"
                title="Clear Draft"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
            <button onClick={() => copyToClipboard(draft)} className="p-2.5 rounded-xl bg-neutral-50 dark:bg-white/5 text-neutral-400 hover:text-[var(--color-brand)] transition-all">
              <Copy className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-widest text-neutral-400">Editor</h4>
              <textarea 
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Start writing or generate a draft..."
                className="w-full h-[500px] bg-[var(--color-bg-section)] dark:bg-white/5 p-8 rounded-2xl border border-neutral-100 dark:border-white/5 text-base leading-relaxed focus:outline-none resize-none custom-scrollbar font-serif"
              />
            </div>
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-widest text-neutral-400">Preview</h4>
              <div className="w-full h-[500px] bg-neutral-50 dark:bg-white/5 p-8 rounded-2xl border border-neutral-100 dark:border-white/5 overflow-y-auto custom-scrollbar markdown-body">
                <ReactMarkdown>{draft || "*Draft preview will appear here...*"}</ReactMarkdown>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Notes & Library Section */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <h3 className="font-bold text-xl flex items-center gap-3">
            <FileText className="w-6 h-6 text-blue-500" />
            Research Notes
          </h3>
          <div className="glass-card p-8 bg-white dark:bg-[#1E293B] space-y-6">
            <div className="flex items-center justify-between">
              <button 
                onClick={handleGenerateNotes}
                className="text-xs font-bold text-[var(--color-brand)] hover:underline flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" /> Generate Structured Notes
              </button>
              <button onClick={() => copyToClipboard(notes)} className="p-2 text-neutral-300 hover:text-[var(--color-brand)]">
                <Copy className="w-4 h-4" />
              </button>
            </div>
            <textarea 
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Jot down quick thoughts or generate structured notes..."
              className="w-full h-80 bg-[var(--color-bg-section)] dark:bg-white/5 p-6 rounded-2xl border border-neutral-100 dark:border-white/5 text-sm leading-relaxed focus:outline-none resize-none custom-scrollbar"
            />
          </div>
        </div>

        <div className="space-y-6">
          <h3 className="font-bold text-xl flex items-center gap-3">
            <Library className="w-6 h-6 text-indigo-500" />
            Saved Sources
          </h3>
          <div className="glass-card p-8 bg-white dark:bg-[#1E293B] space-y-4 h-[400px] overflow-y-auto custom-scrollbar">
            {savedSources.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-50">
                <Library className="w-12 h-12 text-neutral-200" />
                <p className="text-sm font-medium">No sources saved yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {savedSources.map((source) => (
                  <div key={source.id} className="p-4 rounded-2xl bg-[var(--color-bg-section)] dark:bg-white/5 border border-neutral-100 dark:border-white/5 flex items-center justify-between group">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate">{source.title}</p>
                      <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest">{source.authors[0]} • {source.year}</p>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleSummarize(source)} className="p-2 text-neutral-300 hover:text-[var(--color-brand)]" title="Summarize">
                        <Sparkles className="w-4 h-4" />
                      </button>
                      <button onClick={() => removeSource(source.id)} className="p-2 text-neutral-300 hover:text-red-500" title="Remove">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 6. History Section */}
      <section className="space-y-6">
        <h3 className="font-bold text-xl flex items-center gap-3">
          <History className="w-6 h-6 text-neutral-400" />
          Recent Sessions
        </h3>
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
          {state.researchSessions.map(session => (
            <button 
              key={session.id} 
              onClick={() => {
                setQuery(session.topic);
                setSavedSources(session.sources);
                setNotes(session.notes);
                setDraft(session.draft);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="flex-shrink-0 w-64 glass-card p-6 bg-white dark:bg-[#1E293B] text-left hover:border-[var(--color-brand)]/30 transition-all group"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-500 group-hover:scale-110 transition-transform">
                  <BookOpen className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
                  {new Date(session.updatedAt).toLocaleDateString()}
                </span>
              </div>
              <p className="font-bold text-sm truncate mb-1">{session.topic}</p>
              <p className="text-[10px] text-neutral-400 font-medium uppercase tracking-widest">{session.sources.length} Sources • {session.draft.length > 0 ? 'Drafted' : 'No Draft'}</p>
            </button>
          ))}
          {state.researchSessions.length === 0 && (
            <div className="w-full py-12 text-center glass-card bg-white dark:bg-[#1E293B] opacity-50">
              <p className="text-sm font-medium">No recent sessions found.</p>
            </div>
          )}
        </div>
      </section>

      {/* Floating Action Bar (Mobile/Tablet) */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 md:hidden">
        <div className="bg-white dark:bg-[#1E293B] border border-[var(--color-border-subtle)] dark:border-white/10 shadow-2xl rounded-2xl p-2 flex items-center gap-2">
          <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="p-3 rounded-xl hover:bg-neutral-100 dark:hover:bg-white/5 text-neutral-400">
            <ChevronRight className="w-5 h-5 -rotate-90" />
          </button>
          <div className="w-px h-6 bg-neutral-100 dark:bg-white/10" />
          <button onClick={() => workspaceRef.current?.scrollIntoView({ behavior: 'smooth' })} className="p-3 rounded-xl hover:bg-neutral-100 dark:hover:bg-white/5 text-[var(--color-brand)]">
            <Search className="w-5 h-5" />
          </button>
          <div className="w-px h-6 bg-neutral-100 dark:bg-white/10" />
          <button onClick={() => syncToKnowledgeHub()} className="p-3 rounded-xl hover:bg-neutral-100 dark:hover:bg-white/5 text-emerald-500">
            <Save className="w-5 h-5" />
          </button>
          <button onClick={exportSession} className="p-3 rounded-xl hover:bg-neutral-100 dark:hover:bg-white/5 text-blue-500">
            <Download className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
