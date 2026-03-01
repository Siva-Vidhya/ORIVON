import React from 'react';
import { 
  LayoutDashboard, 
  Search, 
  Mic, 
  Zap, 
  Database, 
  Settings as SettingsIcon,
  Menu,
  X,
  Moon,
  Sun,
  LogOut
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  onSignOut: () => void;
}

export function Layout({ children, activeTab, setActiveTab, theme, toggleTheme, onSignOut }: LayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'research', label: 'Research', icon: Search },
    { id: 'meeting', label: 'Assistant', icon: Mic },
    { id: 'automation', label: 'Automation', icon: Zap },
    { id: 'knowledge', label: 'Knowledge', icon: Database },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[var(--color-bg-main)] dark:bg-[#0F172A] transition-colors duration-500">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-72 flex-col border-r border-[var(--color-border-subtle)] dark:border-white/5 bg-white dark:bg-[#1E293B] p-8 sticky top-0 h-screen">
        <div className="flex items-center gap-3 mb-12">
          <div className="w-10 h-10 bg-[var(--color-brand)] dark:bg-[#7FA4E8] rounded-2xl flex items-center justify-center text-white dark:text-[#0F172A] font-bold text-xl shadow-lg shadow-brand/20">O</div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)] dark:text-[#E2E8F0]">Orivon</h1>
        </div>
        
        <nav className="flex-1 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                "w-full flex items-center gap-4 px-5 py-3.5 rounded-2xl transition-all duration-300 group",
                activeTab === item.id 
                  ? "bg-[var(--color-brand-light)] dark:bg-[#7FA4E8]/10 text-[var(--color-brand)] dark:text-[#7FA4E8] font-semibold shadow-sm" 
                  : "text-[var(--color-text-secondary)] dark:text-[#CBD5E1] hover:bg-[var(--color-bg-section)] dark:hover:bg-white/5"
              )}
            >
              <item.icon className={cn("w-5 h-5 transition-transform duration-300 group-hover:scale-110", activeTab === item.id ? "text-[var(--color-brand)] dark:text-[#7FA4E8]" : "text-neutral-400 dark:text-neutral-500")} />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="mt-auto pt-8 border-t border-[var(--color-border-subtle)] dark:border-white/5 space-y-2">
          <button 
            onClick={toggleTheme}
            className="w-full flex items-center gap-4 px-5 py-3.5 rounded-2xl text-[var(--color-text-secondary)] dark:text-[#CBD5E1] hover:bg-[var(--color-bg-section)] dark:hover:bg-white/5 transition-all duration-300"
          >
            {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            <span className="font-medium">{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
          </button>
          <button 
            onClick={onSignOut}
            className="w-full flex items-center gap-4 px-5 py-3.5 rounded-2xl text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all duration-300"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between p-5 border-b border-[var(--color-border-subtle)] dark:border-white/5 bg-white dark:bg-[#1E293B] sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-[var(--color-brand)] dark:bg-[#7FA4E8] rounded-xl flex items-center justify-center text-white dark:text-[#0F172A] font-bold text-lg">O</div>
          <h1 className="text-xl font-bold tracking-tight text-[var(--color-text-primary)] dark:text-[#E2E8F0]">Orivon</h1>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-[var(--color-text-secondary)] dark:text-[#CBD5E1]">
          {isMobileMenuOpen ? <X /> : <Menu />}
        </button>
      </header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="md:hidden fixed inset-0 z-40 bg-[var(--color-bg-main)] dark:bg-[#0F172A] pt-24 p-8"
          >
            <nav className="space-y-3">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center gap-5 px-6 py-4 rounded-2xl text-xl transition-all",
                    activeTab === item.id 
                      ? "bg-[var(--color-brand-light)] dark:bg-[#7FA4E8]/10 text-[var(--color-brand)] dark:text-[#7FA4E8] font-bold" 
                      : "text-[var(--color-text-secondary)] dark:text-[#CBD5E1]"
                  )}
                >
                  <item.icon className="w-6 h-6" />
                  {item.label}
                </button>
              ))}
            </nav>
            <div className="mt-12 pt-8 border-t border-[var(--color-border-subtle)] dark:border-white/5 space-y-3">
              <button 
                onClick={toggleTheme}
                className="w-full flex items-center gap-5 px-6 py-4 rounded-2xl text-[var(--color-text-secondary)] dark:text-[#CBD5E1]"
              >
                {theme === 'light' ? <Moon className="w-6 h-6" /> : <Sun className="w-6 h-6" />}
                <span className="text-xl font-medium">{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
              </button>
              <button 
                onClick={onSignOut}
                className="w-full flex items-center gap-5 px-6 py-4 rounded-2xl text-red-500"
              >
                <LogOut className="w-6 h-6" />
                <span className="text-xl font-medium">Sign Out</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-12 overflow-y-auto max-w-7xl mx-auto w-full">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
        >
          {children}
        </motion.div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-6 left-6 right-6 bg-white/90 dark:bg-[#1E293B]/90 backdrop-blur-xl border border-[var(--color-border-subtle)] dark:border-white/5 px-6 py-4 flex justify-between items-center z-50 rounded-[24px] shadow-xl">
        {navItems.slice(0, 5).map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={cn(
              "p-2.5 rounded-xl transition-all duration-300",
              activeTab === item.id 
                ? "text-[var(--color-brand)] dark:text-[#7FA4E8] bg-[var(--color-brand-light)] dark:bg-[#7FA4E8]/10 scale-110" 
                : "text-neutral-400 dark:text-neutral-500"
            )}
          >
            <item.icon className="w-6 h-6" />
          </button>
        ))}
      </nav>
    </div>
  );
}
