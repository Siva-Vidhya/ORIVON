import React, { useState } from 'react';
import { AppState, UserSettings } from '../types';
import { 
  User, Shield, Bell, Database, Download, Trash2, 
  Moon, Sun, Globe, Cpu, Eye, Lock, Mail, 
  CheckCircle2, AlertCircle, Save, LogOut, Smartphone,
  Monitor, Palette, Layout as LayoutIcon, HardDrive,
  Share2, Key, Fingerprint, History, Camera
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SettingsProps {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
}

export function Settings({ state, setState }: SettingsProps) {
  const [activeSection, setActiveSection] = useState<'profile' | 'security' | 'notifications' | 'ai' | 'appearance' | 'privacy'>('profile');
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  
  // Local form states
  const [profileForm, setProfileForm] = useState(state.userSettings.profile);
  const [passwordForm, setPasswordForm] = useState({ current: '', new: '', confirm: '' });

  const handleSaveProfile = () => {
    setState(prev => ({
      ...prev,
      userSettings: {
        ...prev.userSettings,
        profile: profileForm
      }
    }));
    showSuccess('Profile updated successfully');
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setProfileForm(prev => ({ ...prev, avatar: base64String }));
        setState(prev => ({
          ...prev,
          userSettings: {
            ...prev.userSettings,
            profile: { ...prev.userSettings.profile, avatar: base64String }
          }
        }));
        showSuccess('Avatar updated');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleToggleSetting = (category: keyof UserSettings, setting: string, value: any) => {
    setState(prev => ({
      ...prev,
      userSettings: {
        ...prev.userSettings,
        [category]: {
          ...(prev.userSettings[category] as any),
          [setting]: value
        }
      }
    }));
    showSuccess('Setting updated');
  };

  const showSuccess = (message: string) => {
    setSaveStatus(message);
    setTimeout(() => setSaveStatus(null), 3000);
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(state, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = 'flowstate_os_data.json';
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const handleClearData = () => {
    if (confirm('Are you sure you want to delete your account and all data? This action is permanent and cannot be undone.')) {
      localStorage.removeItem('orivon_state');
      localStorage.removeItem('orivon_user');
      window.location.reload();
    }
  };

  const sections = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'ai', label: 'AI Preferences', icon: Cpu },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'privacy', label: 'Privacy', icon: Lock },
  ];

  const Toggle = ({ enabled, onToggle, label, description }: { enabled: boolean, onToggle: (val: boolean) => void, label: string, description?: string }) => (
    <div className="flex items-center justify-between py-4">
      <div className="space-y-1 pr-4">
        <h4 className="font-semibold text-[var(--color-text-primary)] dark:text-white">{label}</h4>
        {description && <p className="text-sm text-[var(--color-text-secondary)] dark:text-gray-400">{description}</p>}
      </div>
      <button 
        onClick={() => onToggle(!enabled)}
        className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)] focus:ring-offset-2 ${
          enabled ? 'bg-[var(--color-brand)]' : 'bg-gray-200 dark:bg-gray-700'
        }`}
      >
        <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
          enabled ? 'translate-x-6' : 'translate-x-1'
        }`} />
      </button>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto pb-24 md:pb-12">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Navigation */}
        <aside className="w-full md:w-64 space-y-2">
          <div className="mb-8 px-4">
            <h2 className="text-3xl font-bold tracking-tight text-[var(--color-text-primary)] dark:text-white">Settings</h2>
            <p className="text-sm text-[var(--color-text-secondary)] dark:text-gray-400 mt-1">Manage your OS preferences</p>
          </div>
          <nav className="space-y-1">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id as any)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  activeSection === section.id
                    ? 'bg-[var(--color-brand)] text-white shadow-lg shadow-brand/20'
                    : 'text-[var(--color-text-secondary)] dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5'
                }`}
              >
                <section.icon className="w-5 h-5" />
                {section.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="glass-card bg-white dark:bg-[#1E293B] rounded-3xl border border-[var(--color-border-subtle)] dark:border-white/5 overflow-hidden"
            >
              {/* Profile Section */}
              {activeSection === 'profile' && (
                <div className="p-8 space-y-8">
                  <div className="flex items-center gap-6 pb-8 border-b border-gray-100 dark:border-white/5">
                    <div className="relative group">
                      <div className="w-24 h-24 bg-gradient-to-br from-[var(--color-brand)] to-indigo-600 rounded-3xl flex items-center justify-center text-white text-4xl font-bold shadow-xl overflow-hidden">
                        {profileForm.avatar ? (
                          <img src={profileForm.avatar} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          profileForm.fullName.split(' ').map(n => n[0]).join('')
                        )}
                      </div>
                      <label className="absolute -bottom-2 -right-2 p-2 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-white/10 text-[var(--color-brand)] hover:scale-110 transition-transform cursor-pointer">
                        <Camera className="w-4 h-4" />
                        <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} />
                      </label>
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-[var(--color-text-primary)] dark:text-white">{profileForm.fullName}</h3>
                      <p className="text-[var(--color-text-secondary)] dark:text-gray-400">{profileForm.email}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-[var(--color-text-secondary)] dark:text-gray-400 uppercase tracking-wider">Full Name</label>
                      <input 
                        type="text" 
                        value={profileForm.fullName}
                        onChange={(e) => setProfileForm({...profileForm, fullName: e.target.value})}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-[var(--color-text-primary)] dark:text-white focus:ring-2 focus:ring-[var(--color-brand)] outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-[var(--color-text-secondary)] dark:text-gray-400 uppercase tracking-wider">Email Address</label>
                      <input 
                        type="email" 
                        value={profileForm.email}
                        onChange={(e) => setProfileForm({...profileForm, email: e.target.value})}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-[var(--color-text-primary)] dark:text-white focus:ring-2 focus:ring-[var(--color-brand)] outline-none transition-all"
                      />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                      <label className="text-sm font-bold text-[var(--color-text-secondary)] dark:text-gray-400 uppercase tracking-wider">Bio</label>
                      <textarea 
                        rows={3}
                        value={profileForm.bio}
                        onChange={(e) => setProfileForm({...profileForm, bio: e.target.value})}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-[var(--color-text-primary)] dark:text-white focus:ring-2 focus:ring-[var(--color-brand)] outline-none transition-all resize-none"
                        placeholder="Tell us about yourself..."
                      />
                    </div>
                  </div>

                  <div className="pt-4">
                    <button 
                      onClick={handleSaveProfile}
                      className="flex items-center gap-2 px-8 py-3 bg-[var(--color-brand)] text-white rounded-xl font-bold shadow-lg shadow-brand/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                      <Save className="w-5 h-5" />
                      Save Changes
                    </button>
                  </div>
                </div>
              )}

              {/* Security Section */}
              {activeSection === 'security' && (
                <div className="p-8 space-y-10">
                  <div className="space-y-6">
                    <h3 className="text-xl font-bold text-[var(--color-text-primary)] dark:text-white flex items-center gap-2">
                      <Lock className="w-5 h-5 text-[var(--color-brand)]" />
                      Password Management
                    </h3>
                    <div className="grid grid-cols-1 gap-4">
                      <input 
                        type="password" 
                        placeholder="Current Password"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-[var(--color-text-primary)] dark:text-white focus:ring-2 focus:ring-[var(--color-brand)] outline-none transition-all"
                      />
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input 
                          type="password" 
                          placeholder="New Password"
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-[var(--color-text-primary)] dark:text-white focus:ring-2 focus:ring-[var(--color-brand)] outline-none transition-all"
                        />
                        <input 
                          type="password" 
                          placeholder="Confirm New Password"
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-[var(--color-text-primary)] dark:text-white focus:ring-2 focus:ring-[var(--color-brand)] outline-none transition-all"
                        />
                      </div>
                      <button className="w-fit px-6 py-2 bg-gray-100 dark:bg-white/5 text-[var(--color-text-primary)] dark:text-white rounded-xl font-bold hover:bg-gray-200 dark:hover:bg-white/10 transition-all">
                        Update Password
                      </button>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-gray-100 dark:border-white/5">
                    <Toggle 
                      enabled={state.userSettings.security.twoFactorEnabled}
                      onToggle={(val) => handleToggleSetting('security', 'twoFactorEnabled', val)}
                      label="Two-Factor Authentication"
                      description="Add an extra layer of security to your account."
                    />
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-[var(--color-text-primary)] dark:text-white flex items-center gap-2">
                      <History className="w-5 h-5 text-[var(--color-brand)]" />
                      Active Sessions
                    </h3>
                    <div className="space-y-3">
                      {state.userSettings.security.activeSessions.map(session => (
                        <div key={session.id} className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5">
                          <div className="flex items-center gap-4">
                            <div className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                              {session.device.includes('Mac') || session.device.includes('PC') ? <Monitor className="w-5 h-5 text-gray-400" /> : <Smartphone className="w-5 h-5 text-gray-400" />}
                            </div>
                            <div>
                              <p className="font-bold text-sm text-[var(--color-text-primary)] dark:text-white">{session.device}</p>
                              <p className="text-xs text-[var(--color-text-secondary)] dark:text-gray-400">{session.location} • {session.lastActive}</p>
                            </div>
                          </div>
                          <button className="text-xs font-bold text-red-500 hover:underline">Revoke</button>
                        </div>
                      ))}
                    </div>
                    <button className="text-sm font-bold text-[var(--color-brand)] hover:underline">Log out of all other sessions</button>
                  </div>
                </div>
              )}

              {/* Notifications Section */}
              {activeSection === 'notifications' && (
                <div className="p-8 divide-y divide-gray-100 dark:divide-white/5">
                  <Toggle 
                    enabled={state.userSettings.notifications.taskReminders}
                    onToggle={(val) => handleToggleSetting('notifications', 'taskReminders', val)}
                    label="Task Reminders"
                    description="Get notified when tasks are due or approaching."
                  />
                  <Toggle 
                    enabled={state.userSettings.notifications.emailNotifications}
                    onToggle={(val) => handleToggleSetting('notifications', 'emailNotifications', val)}
                    label="Email Notifications"
                    description="Receive weekly summaries and important account updates."
                  />
                  <Toggle 
                    enabled={state.userSettings.notifications.automationAlerts}
                    onToggle={(val) => handleToggleSetting('notifications', 'automationAlerts', val)}
                    label="Automation Alerts"
                    description="Notifications for successful or failed automation runs."
                  />
                  <Toggle 
                    enabled={state.userSettings.notifications.researchUpdates}
                    onToggle={(val) => handleToggleSetting('notifications', 'researchUpdates', val)}
                    label="Research Updates"
                    description="Alerts when new sources are found for your research topics."
                  />
                  <Toggle 
                    enabled={state.userSettings.notifications.knowledgeUpdates}
                    onToggle={(val) => handleToggleSetting('notifications', 'knowledgeUpdates', val)}
                    label="Knowledge Base Alerts"
                    description="Notifications when shared knowledge entries are updated."
                  />
                </div>
              )}

              {/* AI Preferences Section */}
              {activeSection === 'ai' && (
                <div className="p-8 space-y-10">
                  <div className="space-y-4">
                    <label className="text-sm font-bold text-[var(--color-text-secondary)] dark:text-gray-400 uppercase tracking-wider">AI Assistance Level</label>
                    <div className="grid grid-cols-3 gap-4">
                      {(['minimal', 'balanced', 'proactive'] as const).map((level) => (
                        <button
                          key={level}
                          onClick={() => handleToggleSetting('ai', 'assistanceLevel', level)}
                          className={`p-4 rounded-2xl border-2 transition-all text-center ${
                            state.userSettings.ai.assistanceLevel === level
                              ? 'border-[var(--color-brand)] bg-[var(--color-brand)]/5 text-[var(--color-brand)]'
                              : 'border-gray-100 dark:border-white/5 text-gray-400 hover:border-gray-200'
                          }`}
                        >
                          <p className="font-bold capitalize">{level}</p>
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-gray-400 italic">
                      {state.userSettings.ai.assistanceLevel === 'minimal' && "AI only responds when explicitly called."}
                      {state.userSettings.ai.assistanceLevel === 'balanced' && "AI suggests improvements and helps with organization."}
                      {state.userSettings.ai.assistanceLevel === 'proactive' && "AI anticipates needs, drafts content, and manages schedules."}
                    </p>
                  </div>

                  <div className="divide-y divide-gray-100 dark:divide-white/5">
                    <Toggle 
                      enabled={state.userSettings.ai.autoSuggestions}
                      onToggle={(val) => handleToggleSetting('ai', 'autoSuggestions', val)}
                      label="Auto-Suggestions"
                      description="Show AI-powered suggestions while typing or browsing."
                    />
                    <Toggle 
                      enabled={state.userSettings.ai.autoScheduling}
                      onToggle={(val) => handleToggleSetting('ai', 'autoScheduling', val)}
                      label="Auto-Scheduling"
                      description="Allow AI to propose optimal times for your tasks."
                    />
                    <Toggle 
                      enabled={state.userSettings.ai.draftAutoGeneration}
                      onToggle={(val) => handleToggleSetting('ai', 'draftAutoGeneration', val)}
                      label="Draft Auto-Generation"
                      description="Automatically generate initial drafts for research notes."
                    />
                  </div>
                </div>
              )}

              {/* Appearance Section */}
              {activeSection === 'appearance' && (
                <div className="p-8 space-y-10">
                  <div className="space-y-4">
                    <label className="text-sm font-bold text-[var(--color-text-secondary)] dark:text-gray-400 uppercase tracking-wider">Theme Mode</label>
                    <div className="grid grid-cols-3 gap-4">
                      {[
                        { id: 'light', icon: Sun, label: 'Light' },
                        { id: 'dark', icon: Moon, label: 'Dark' },
                        { id: 'system', icon: Globe, label: 'System' },
                      ].map((theme) => (
                        <button
                          key={theme.id}
                          onClick={() => {
                            handleToggleSetting('appearance', 'theme', theme.id);
                            if (theme.id !== 'system') {
                              setState(prev => ({ ...prev, theme: theme.id as any }));
                            }
                          }}
                          className={`flex flex-col items-center gap-3 p-6 rounded-2xl border-2 transition-all ${
                            state.userSettings.appearance.theme === theme.id
                              ? 'border-[var(--color-brand)] bg-[var(--color-brand)]/5 text-[var(--color-brand)]'
                              : 'border-gray-100 dark:border-white/5 text-gray-400 hover:border-gray-200'
                          }`}
                        >
                          <theme.icon className="w-6 h-6" />
                          <span className="font-bold text-sm">{theme.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-sm font-bold text-[var(--color-text-secondary)] dark:text-gray-400 uppercase tracking-wider">Accent Color</label>
                    <div className="flex gap-4">
                      {['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#EC4899'].map((color) => (
                        <button
                          key={color}
                          onClick={() => handleToggleSetting('appearance', 'accentColor', color)}
                          className={`w-10 h-10 rounded-full border-4 transition-all ${
                            state.userSettings.appearance.accentColor === color
                              ? 'border-white dark:border-gray-800 ring-2 ring-[var(--color-brand)]'
                              : 'border-transparent scale-90 hover:scale-100'
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="pt-6 border-t border-gray-100 dark:border-white/5">
                    <Toggle 
                      enabled={state.userSettings.appearance.compactMode}
                      onToggle={(val) => handleToggleSetting('appearance', 'compactMode', val)}
                      label="Compact Mode"
                      description="Reduce spacing and font sizes to fit more content."
                    />
                  </div>
                </div>
              )}

              {/* Privacy Section */}
              {activeSection === 'privacy' && (
                <div className="p-8 space-y-10">
                  <div className="divide-y divide-gray-100 dark:divide-white/5">
                    <Toggle 
                      enabled={state.userSettings.privacy.localProcessingOnly}
                      onToggle={(val) => handleToggleSetting('privacy', 'localProcessingOnly', val)}
                      label="Local Processing Mode"
                      description="Keep all AI computations on your device. May reduce speed."
                    />
                    <Toggle 
                      enabled={state.userSettings.privacy.privateByDefault}
                      onToggle={(val) => handleToggleSetting('privacy', 'privateByDefault', val)}
                      label="Private-by-Default"
                      description="New entries are hidden from shared views until manually exposed."
                    />
                  </div>

                  <div className="space-y-4">
                    <label className="text-sm font-bold text-[var(--color-text-secondary)] dark:text-gray-400 uppercase tracking-wider">Data Retention</label>
                    <select 
                      value={state.userSettings.privacy.dataRetentionDays}
                      onChange={(e) => handleToggleSetting('privacy', 'dataRetentionDays', parseInt(e.target.value))}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-[var(--color-text-primary)] dark:text-white focus:ring-2 focus:ring-[var(--color-brand)] outline-none transition-all"
                    >
                      <option value={30}>30 Days</option>
                      <option value={90}>90 Days</option>
                      <option value={365}>1 Year</option>
                      <option value={0}>Forever</option>
                    </select>
                  </div>

                  <div className="pt-8 border-t border-gray-100 dark:border-white/5 space-y-4">
                    <h4 className="text-sm font-bold text-red-500 uppercase tracking-widest">Danger Zone</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <button 
                        onClick={handleExport}
                        className="flex items-center justify-center gap-2 p-4 rounded-2xl border border-gray-200 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/5 transition-all font-bold text-[var(--color-text-primary)] dark:text-white"
                      >
                        <Download className="w-5 h-5" />
                        Export Data
                      </button>
                      <button 
                        onClick={handleClearData}
                        className="flex items-center justify-center gap-2 p-4 rounded-2xl border border-red-100 dark:border-red-900/20 hover:bg-red-50 dark:hover:bg-red-900/10 transition-all font-bold text-red-600 dark:text-red-400"
                      >
                        <Trash2 className="w-5 h-5" />
                        Delete Account
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Success Toast */}
      <AnimatePresence>
        {saveStatus && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-3 px-6 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-2xl shadow-2xl z-50"
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span className="font-bold">{saveStatus}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="text-center pt-16 space-y-2">
        <p className="text-xs text-neutral-400 dark:text-neutral-600 font-medium">FlowState OS — Version 2.4.0-stable</p>
        <p className="text-[10px] text-neutral-300 dark:text-neutral-700 uppercase tracking-[0.3em] font-bold">The future of cognitive workflow</p>
      </div>
    </div>
  );
}
