export type Priority = 'low' | 'medium' | 'high';
export type ReminderTiming = 'at_due_time' | '5_min_before' | '15_min_before' | '1_hour_before' | 'custom';

export interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  dueDate?: string;
  dueTime?: string;
  priority: Priority;
  category: string;
  reminder?: boolean;
  reminderTiming?: ReminderTiming;
  customReminderTime?: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  updatedAt: string;
  tags: string[];
}

export interface Project {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'completed' | 'on-hold';
}

export interface ResearchSource {
  id: string;
  title: string;
  authors: string[];
  year: string;
  abstract: string;
  url?: string;
  type: 'journal' | 'book' | 'conference' | 'other';
}

export interface ResearchSession {
  id: string;
  topic: string;
  sources: ResearchSource[];
  notes: string;
  draft: string;
  updatedAt: string;
}

export type KnowledgeCategory = 'Research' | 'Notes' | 'Decisions' | 'Logs';

export interface KnowledgeVersion {
  id: string;
  content: string;
  updatedAt: string;
}

export interface KnowledgeEntry {
  id: string;
  title: string;
  content: string;
  category: KnowledgeCategory;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  history: KnowledgeVersion[];
  isLegacy?: boolean;
  source?: 'Research' | 'Automation';
}

export interface UserSettings {
  profile: {
    fullName: string;
    email: string;
    avatar?: string;
    bio?: string;
  };
  security: {
    twoFactorEnabled: boolean;
    activeSessions: { id: string; device: string; lastActive: string; location: string }[];
  };
  notifications: {
    taskReminders: boolean;
    emailNotifications: boolean;
    automationAlerts: boolean;
    researchUpdates: boolean;
    knowledgeUpdates: boolean;
  };
  ai: {
    assistanceLevel: 'minimal' | 'balanced' | 'proactive';
    autoSuggestions: boolean;
    autoScheduling: boolean;
    draftAutoGeneration: boolean;
  };
  appearance: {
    theme: 'light' | 'dark' | 'system';
    accentColor: string;
    compactMode: boolean;
  };
  privacy: {
    localProcessingOnly: boolean;
    dataRetentionDays: number;
    privateByDefault: boolean;
  };
}

export interface AppState {
  tasks: Task[];
  notes: Note[];
  projects: Project[];
  researchSessions: ResearchSession[];
  knowledgeEntries: KnowledgeEntry[];
  theme: 'light' | 'dark';
  userSettings: UserSettings;
}
