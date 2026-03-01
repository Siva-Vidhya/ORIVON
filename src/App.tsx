import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, CheckCircle2 } from 'lucide-react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { ResearchCopilot } from './components/ResearchCopilot';
import { MeetingAssistant } from './components/MeetingAssistant';
import { AutomationHub } from './components/AutomationHub';
import { KnowledgeHub } from './components/KnowledgeHub';
import { Settings } from './components/Settings';
import { SignIn } from './components/SignIn';
import { SplashScreen } from './components/SplashScreen';
import { AppState, Task, Note, Project } from './types';

const INITIAL_STATE: AppState = {
  tasks: [
    { id: '1', title: 'Research AI ethics for thesis', completed: false, priority: 'high', category: 'Academic' },
    { id: '2', title: 'Prepare presentation for project X', completed: true, priority: 'medium', category: 'Work' },
    { id: '3', title: 'Review lecture notes', completed: false, priority: 'low', category: 'Academic' },
  ],
  notes: [],
  projects: [
    { id: 'p1', name: 'Thesis 2026', description: 'Main research project for final year', status: 'active' },
    { id: 'p2', name: 'Internship Prep', description: 'Resources and tasks for summer internship', status: 'active' },
  ],
  researchSessions: [],
  knowledgeEntries: [
    {
      id: 'k1',
      title: 'Project Orivon Architecture',
      content: 'The application uses a centralized state management in App.tsx with local storage persistence. UI is built with React, Tailwind CSS, and Framer Motion.',
      category: 'Decisions',
      tags: ['architecture', 'tech-stack'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      history: []
    }
  ],
  theme: 'light',
  userSettings: {
    profile: {
      fullName: 'John Doe',
      email: 'john.doe@university.edu',
      bio: 'Research fellow focused on AI ethics and human-computer interaction.',
    },
    security: {
      twoFactorEnabled: false,
      activeSessions: [
        { id: 's1', device: 'MacBook Pro 16"', lastActive: 'Active now', location: 'San Francisco, CA' },
        { id: 's2', device: 'iPhone 15 Pro', lastActive: '2 hours ago', location: 'San Francisco, CA' },
      ],
    },
    notifications: {
      taskReminders: true,
      emailNotifications: true,
      automationAlerts: true,
      researchUpdates: true,
      knowledgeUpdates: false,
    },
    ai: {
      assistanceLevel: 'balanced',
      autoSuggestions: true,
      autoScheduling: false,
      draftAutoGeneration: true,
    },
    appearance: {
      theme: 'system',
      accentColor: '#4F46E5',
      compactMode: false,
    },
    privacy: {
      localProcessingOnly: false,
      dataRetentionDays: 30,
      privateByDefault: true,
    },
  },
};

export default function App() {
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem('orivon_state');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return { 
          ...INITIAL_STATE, 
          ...parsed,
          userSettings: {
            ...INITIAL_STATE.userSettings,
            ...(parsed.userSettings || {}),
            profile: { ...INITIAL_STATE.userSettings.profile, ...(parsed.userSettings?.profile || {}) },
            security: { ...INITIAL_STATE.userSettings.security, ...(parsed.userSettings?.security || {}) },
            notifications: { ...INITIAL_STATE.userSettings.notifications, ...(parsed.userSettings?.notifications || {}) },
            ai: { ...INITIAL_STATE.userSettings.ai, ...(parsed.userSettings?.ai || {}) },
            appearance: { ...INITIAL_STATE.userSettings.appearance, ...(parsed.userSettings?.appearance || {}) },
            privacy: { ...INITIAL_STATE.userSettings.privacy, ...(parsed.userSettings?.privacy || {}) },
          }
        };
      } catch (e) {
        console.error('Failed to parse saved state:', e);
        return INITIAL_STATE;
      }
    }
    return INITIAL_STATE;
  });
  const [user, setUser] = useState<{ email: string } | null>(() => {
    const saved = localStorage.getItem('orivon_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showOnboarding, setShowOnboarding] = useState(() => {
    return !localStorage.getItem('orivon_onboarded');
  });
  const [notifiedTasks, setNotifiedTasks] = useState<Set<string>>(new Set());
  const [activeReminder, setActiveReminder] = useState<Task | null>(null);
  const [showSplash, setShowSplash] = useState(() => {
    // Only show splash if user is NOT logged in
    const isUserLoggedIn = !!localStorage.getItem('orivon_user');
    return !isUserLoggedIn;
  });

  // Notification Permission Request
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Reminder Logic
  useEffect(() => {
    const checkReminders = () => {
      const now = new Date();
      (state.tasks || []).forEach(task => {
        if (task.completed || !task.reminder || !task.dueDate || notifiedTasks.has(task.id)) return;

        const [year, month, day] = task.dueDate.split('-').map(Number);
        const [hours, minutes] = (task.dueTime || '00:00').split(':').map(Number);
        const dueDateTime = new Date(year, month - 1, day, hours, minutes);

        let reminderTime = new Date(dueDateTime);
        switch (task.reminderTiming) {
          case '5_min_before': reminderTime.setMinutes(reminderTime.getMinutes() - 5); break;
          case '15_min_before': reminderTime.setMinutes(reminderTime.getMinutes() - 15); break;
          case '1_hour_before': reminderTime.setHours(reminderTime.getHours() - 1); break;
          case 'at_due_time': break;
          case 'custom': 
            if (task.customReminderTime) {
              const [ch, cm] = task.customReminderTime.split(':').map(Number);
              reminderTime.setHours(ch, cm);
            }
            break;
        }

        // Trigger if current time is past reminder time but within 5 minutes (to avoid old reminders)
        const diff = now.getTime() - reminderTime.getTime();
        if (diff >= 0 && diff < 300000) { // 5 minutes window
          showNotification(task);
          setActiveReminder(task);
          setNotifiedTasks(prev => new Set(prev).add(task.id));
        }
      });
    };

    const interval = setInterval(checkReminders, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, [state.tasks, notifiedTasks]);

  const showNotification = (task: Task) => {
    if (!('Notification' in window) || Notification.permission !== 'granted') {
      // Fallback: In-app alert if needed, but user asked for browser notification
      console.log('Notification permission not granted');
      return;
    }

    const notification = new Notification(`Orivon Reminder: ${task.title}`, {
      body: `Due at ${task.dueTime || 'scheduled time'}`,
      icon: '/favicon.ico', // Assuming there's a favicon
      tag: task.id,
      requireInteraction: true,
    });

    notification.onclick = () => {
      window.focus();
      setActiveTab('dashboard');
      notification.close();
    };
  };

  useEffect(() => {
    localStorage.setItem('orivon_state', JSON.stringify(state));
    
    // Theme Logic
    const theme = state.userSettings.appearance.theme;
    const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Accent Color Logic
    document.documentElement.style.setProperty('--color-brand', state.userSettings.appearance.accentColor);
    // Also update the shadow/glow colors if needed, but --color-brand is the primary one used in the app
  }, [state]);

  const handleSignIn = (email: string) => {
    const newUser = { email };
    setUser(newUser);
    localStorage.setItem('orivon_user', JSON.stringify(newUser));
  };

  const handleSignOut = () => {
    setUser(null);
    localStorage.removeItem('orivon_user');
  };

  const finishOnboarding = () => {
    setShowOnboarding(false);
    localStorage.setItem('orivon_onboarded', 'true');
  };

  const toggleTheme = () => {
    setState(prev => ({ ...prev, theme: prev.theme === 'light' ? 'dark' : 'light' }));
  };

  const addTask = (task: Omit<Task, 'id'>) => {
    const newTask = { ...task, id: Math.random().toString(36).substr(2, 9) };
    setState(prev => ({ ...prev, tasks: [newTask, ...(prev.tasks || [])] }));
  };

  const toggleTask = (id: string) => {
    setState(prev => ({
      ...prev,
      tasks: (prev.tasks || []).map(t => t.id === id ? { ...t, completed: !t.completed } : t)
    }));
    // Clear notification if completed
    setNotifiedTasks(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const snoozeTask = (id: string, minutes: number) => {
    setState(prev => ({
      ...prev,
      tasks: (prev.tasks || []).map(t => {
        if (t.id === id && t.dueTime) {
          const [h, m] = t.dueTime.split(':').map(Number);
          const date = new Date();
          date.setHours(h, m + minutes);
          return { ...t, dueTime: `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}` };
        }
        return t;
      })
    }));
    setNotifiedTasks(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  if (showSplash) {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key="splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
        >
          <SplashScreen onComplete={() => setShowSplash(false)} />
        </motion.div>
      </AnimatePresence>
    );
  }

  if (!user) {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key="signin"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          <SignIn onSignIn={handleSignIn} />
        </motion.div>
      </AnimatePresence>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard state={state} toggleTask={toggleTask} addTask={addTask} setState={setState} />;
      case 'research': return <ResearchCopilot state={state} setState={setState} />;
      case 'meeting': return <MeetingAssistant />;
      case 'automation': return <AutomationHub />;
      case 'knowledge': return <KnowledgeHub state={state} setState={setState} />;
      case 'settings': return <Settings state={state} setState={setState} />;
      default: return <Dashboard state={state} toggleTask={toggleTask} addTask={addTask} setState={setState} />;
    }
  };

  return (
    <Layout 
      activeTab={activeTab} 
      setActiveTab={setActiveTab} 
      theme={state.theme} 
      toggleTheme={toggleTheme}
      onSignOut={handleSignOut}
    >
      {renderContent()}

      {/* Reminder Modal */}
      <AnimatePresence>
        {activeReminder && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveReminder(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative glass-card max-w-sm w-full p-8 space-y-6 shadow-2xl border-white/20 dark:bg-[#1E293B]"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-lg shadow-amber-500/20">
                  <Bell className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">Task Reminder</h3>
                  <p className="text-xs text-slate-500 uppercase font-bold tracking-widest">Due at {activeReminder.dueTime || 'scheduled time'}</p>
                </div>
              </div>
              
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10">
                <p className="font-bold text-slate-800 dark:text-slate-200">{activeReminder.title}</p>
                {activeReminder.description && (
                  <p className="text-sm text-slate-500 mt-1 line-clamp-2">{activeReminder.description}</p>
                )}
              </div>

              <div className="space-y-3">
                <button 
                  onClick={() => {
                    toggleTask(activeReminder.id);
                    setActiveReminder(null);
                  }}
                  className="w-full py-4 bg-emerald-500 text-white rounded-2xl font-bold hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  Mark Complete
                </button>
                
                <div className="grid grid-cols-3 gap-2">
                  {[5, 10, 15].map(mins => (
                    <button 
                      key={mins}
                      onClick={() => {
                        snoozeTask(activeReminder.id, mins);
                        setActiveReminder(null);
                      }}
                      className="py-3 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 rounded-xl text-xs font-bold hover:bg-slate-200 dark:hover:bg-white/10 transition-all"
                    >
                      +{mins}m
                    </button>
                  ))}
                </div>
                
                <button 
                  onClick={() => setActiveReminder(null)}
                  className="w-full py-3 text-slate-400 text-xs font-bold uppercase tracking-widest hover:text-slate-600 transition-all"
                >
                  Dismiss
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Onboarding Modal */}
      {showOnboarding && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-md">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            className="glass-card max-w-md w-full p-10 text-center space-y-8 shadow-2xl border-slate-200/50"
          >
            <div className="w-20 h-20 bg-slate-900 dark:bg-slate-200 rounded-3xl flex items-center justify-center text-white dark:text-slate-900 text-4xl font-bold mx-auto shadow-xl shadow-slate-200 dark:shadow-none">
              O
            </div>
            <div className="space-y-3">
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Welcome to Orivon</h2>
              <p className="text-slate-500 leading-relaxed">
                Your AI-powered productivity OS. We've designed Orivon to help you focus, research, and automate your workflow with a minimal, soothing experience.
              </p>
            </div>
            <div className="space-y-4 pt-4">
              <button 
                onClick={finishOnboarding}
                className="w-full py-5 bg-slate-900 dark:bg-slate-200 text-white dark:text-slate-900 rounded-2xl font-bold hover:opacity-90 transition-all shadow-lg shadow-black/10"
              >
                Get Started
              </button>
              <div className="flex items-center justify-center gap-4 text-[10px] text-slate-400 uppercase font-bold tracking-[0.2em]">
                <span>Private</span>
                <span className="w-1 h-1 bg-slate-200 dark:bg-slate-700 rounded-full" />
                <span>AI-First</span>
                <span className="w-1 h-1 bg-slate-200 dark:bg-slate-700 rounded-full" />
                <span>Minimal</span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </Layout>
  );
}
