import React, { useState, useRef } from 'react';
import { Mic, Upload, FileText, List, Shield, Sparkles, Play, Square, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { generateSummary } from '../services/ai';

export function MeetingAssistant() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [summary, setSummary] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleRecord = () => {
    setIsRecording(!isRecording);
    if (!isRecording) {
      // Mock recording
      setTranscript("Recording in progress... (This is a simulation of a live lecture or meeting transcript being captured in real-time. In a real app, this would use the Web Speech API or a cloud transcription service.)");
    }
  };

  const handleUpload = () => {
    setUploading(true);
    setTimeout(() => {
      setUploading(false);
      setTranscript("Meeting Transcript: \n- Discussed the project timeline for Q3.\n- Sarah mentioned that the design phase is 80% complete.\n- We need to finalize the API documentation by next Friday.\n- John will handle the database migration.\n- Next meeting scheduled for Monday at 10 AM.");
    }, 1500);
  };

  const handleSummarize = async () => {
    if (!transcript) return;
    setIsLoading(true);
    try {
      const result = await generateSummary(transcript);
      setSummary(result);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-10 pb-24 md:pb-0">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h2 className="text-4xl font-bold tracking-tight text-[var(--color-text-primary)] dark:text-[#E2E8F0]">Meeting & Class Assistant</h2>
          <p className="text-[var(--color-text-secondary)] dark:text-[#CBD5E1] leading-relaxed">Capture audio, generate summaries, and extract action items instantly.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold uppercase tracking-[0.15em] shadow-sm">
          <Shield className="w-3.5 h-3.5" />
          Private-by-default
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="glass-card p-10 flex flex-col items-center justify-center text-center space-y-8 border-2 border-dashed border-[var(--color-border-subtle)] dark:border-white/5 hover:border-[var(--color-brand)]/50 transition-all duration-500 group">
          <div className={`w-24 h-24 rounded-full flex items-center justify-center transition-all duration-500 shadow-xl ${isRecording ? 'bg-red-50 text-red-500 animate-pulse shadow-red-200/50' : 'bg-[var(--color-brand-light)] text-[var(--color-brand)] dark:bg-[#7FA4E8]/10 dark:text-[#7FA4E8] shadow-brand/10'}`}>
            <Mic className="w-12 h-12" />
          </div>
          <div className="space-y-2">
            <h3 className="font-bold text-2xl text-[var(--color-text-primary)] dark:text-[#E2E8F0]">{isRecording ? 'Recording...' : 'Start Recording'}</h3>
            <p className="text-[var(--color-text-secondary)] dark:text-[#CBD5E1] text-sm max-w-[200px] mx-auto">Capture live audio from your lecture or meeting.</p>
          </div>
          <button 
            onClick={handleRecord}
            className={`px-10 py-4 rounded-2xl font-bold transition-all duration-300 flex items-center gap-3 shadow-lg active:scale-95 ${isRecording ? 'bg-red-500 text-white hover:bg-red-600 shadow-red-500/20' : 'bg-[var(--color-brand)] dark:bg-[#7FA4E8] text-white dark:text-[#0F172A] hover:bg-[var(--color-brand-hover)] dark:hover:bg-[#6D93DA] shadow-brand/20'}`}
          >
            {isRecording ? <><Square className="w-5 h-5" /> Stop Recording</> : <><Play className="w-5 h-5" /> Start Now</>}
          </button>
        </div>

        <div className="glass-card p-10 flex flex-col items-center justify-center text-center space-y-8 border-2 border-dashed border-[var(--color-border-subtle)] dark:border-white/5 hover:border-[var(--color-brand)]/50 transition-all duration-500 group">
          <div className="w-24 h-24 bg-[var(--color-bg-section)] dark:bg-white/5 rounded-full flex items-center justify-center text-neutral-300 dark:text-neutral-600 shadow-inner">
            <Upload className="w-12 h-12" />
          </div>
          <div className="space-y-2">
            <h3 className="font-bold text-2xl text-[var(--color-text-primary)] dark:text-[#E2E8F0]">Upload Audio</h3>
            <p className="text-[var(--color-text-secondary)] dark:text-[#CBD5E1] text-sm max-w-[200px] mx-auto">Upload an existing recording (MP3, WAV, M4A).</p>
          </div>
          <button 
            onClick={handleUpload}
            disabled={uploading}
            className="px-10 py-4 bg-[var(--color-text-primary)] dark:bg-white text-white dark:text-[#0F172A] rounded-2xl font-bold hover:opacity-90 transition-all duration-300 flex items-center gap-3 shadow-lg active:scale-95 disabled:opacity-50"
          >
            {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
            {uploading ? 'Uploading...' : 'Choose File'}
          </button>
        </div>
      </div>

      {transcript && (
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          <div className="glass-card p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-xl flex items-center gap-3 text-[var(--color-text-primary)] dark:text-[#E2E8F0]">
                <FileText className="w-6 h-6 text-[var(--color-brand)] dark:text-[#7FA4E8]" />
                Transcript
              </h3>
              <button 
                onClick={handleSummarize}
                disabled={isLoading}
                className="text-xs font-bold bg-[var(--color-brand-light)] dark:bg-[#7FA4E8]/10 text-[var(--color-brand)] dark:text-[#7FA4E8] px-4 py-2 rounded-xl hover:bg-[var(--color-brand)] hover:text-white dark:hover:bg-[#7FA4E8] dark:hover:text-[#0F172A] transition-all duration-300 flex items-center gap-2 border border-[var(--color-brand)]/10"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                AI Summarize
              </button>
            </div>
            <div className="bg-[var(--color-bg-section)] dark:bg-white/5 p-6 rounded-2xl text-sm text-[var(--color-text-secondary)] dark:text-[#CBD5E1] whitespace-pre-wrap font-mono leading-relaxed border border-[var(--color-border-subtle)] dark:border-white/5">
              {transcript}
            </div>
          </div>

          {summary && (
            <div className="glass-card p-8 bg-[var(--color-brand-light)] dark:bg-[#7FA4E8]/5 border-[var(--color-brand)]/10 dark:border-[#7FA4E8]/10 shadow-xl shadow-brand/5">
              <h3 className="font-bold text-xl flex items-center gap-3 mb-6 text-[var(--color-text-primary)] dark:text-[#E2E8F0]">
                <List className="w-6 h-6 text-[var(--color-brand)] dark:text-[#7FA4E8]" />
                AI Summary & Action Items
              </h3>
              <div className="prose dark:prose-invert prose-sm max-w-none">
                <div className="whitespace-pre-wrap leading-relaxed text-[var(--color-text-secondary)] dark:text-[#CBD5E1]">{summary}</div>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
