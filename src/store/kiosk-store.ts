import { create } from 'zustand';

export type Screen =
  | 'standby'
  | 'main'
  | 'equipment-intro'
  | 'location'
  | 'app-install'
  | 'signup'
  | 'vein-register'
  | 'login'
  | 'non-member'
  | 'measurement-mode'
  | 'measurement-equipment'
  | 'results'
  | 'completion';

interface KioskState {
  currentScreen: Screen;
  history: Screen[];
  sessionId: string;
  sessionStarted: boolean;
  isMobile: boolean;
  visitedScreens: Set<Screen>;
  fontSize: 'normal' | 'large' | 'xlarge';
  idleTimer: ReturnType<typeof setTimeout> | null;
  ttsEnabled: boolean;
  highContrast: boolean;

  navigateTo: (screen: Screen) => void;
  goBack: () => void;
  goHome: () => void;
  startSession: () => void;
  endSession: () => void;
  resetToStandby: () => void;
  setMobile: (v: boolean) => void;
  setFontSize: (s: 'normal' | 'large' | 'xlarge') => void;
  resetIdleTimer: () => void;
  setTtsEnabled: (v: boolean) => void;
  setHighContrast: (v: boolean) => void;
}

const IDLE_TIMEOUT_MS = 120_000;

const generateId = () => {
  return Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
};

const TOTAL_CONTENT_SCREENS: Screen[] = [
  'equipment-intro', 'location', 'app-install', 'signup',
  'vein-register', 'login', 'non-member', 'measurement-mode',
  'measurement-equipment', 'results',
];

export const useKioskStore = create<KioskState>((set, get) => ({
  currentScreen: 'standby',
  history: [],
  sessionId: '',
  sessionStarted: false,
  isMobile: false,
  visitedScreens: new Set<Screen>(),
  fontSize: 'normal',
  idleTimer: null,
  ttsEnabled: false,
  highContrast: false,

  navigateTo: (screen: Screen) => {
    const { currentScreen, history, visitedScreens, sessionStarted } = get();
    const updated = new Set(visitedScreens);
    updated.add(screen);
    set({
      currentScreen: screen,
      history: [...history, currentScreen],
      visitedScreens: updated,
    });
    if (sessionStarted) {
      logEvent(screen, 'navigate', currentScreen);
    }
    get().resetIdleTimer();
  },

  goBack: () => {
    const { history, visitedScreens } = get();
    if (history.length === 0) {
      set({ currentScreen: 'main' });
      return;
    }
    const previous = history[history.length - 1];
    set({
      currentScreen: previous,
      history: history.slice(0, -1),
    });
    logEvent(previous, 'back', get().currentScreen);
    get().resetIdleTimer();
  },

  goHome: () => {
    set({ currentScreen: 'main', history: [] });
    logEvent('main', 'home', get().currentScreen);
    get().resetIdleTimer();
  },

  startSession: () => {
    const sessionId = generateId();
    set({
      sessionId,
      sessionStarted: true,
      currentScreen: 'main',
      history: [],
      visitedScreens: new Set<Screen>(),
    });
    logEvent('main', 'session_start', 'standby');
    get().resetIdleTimer();
  },

  endSession: () => {
    const state = get();
    logEvent('standby', 'session_end', state.currentScreen);
    if (state.idleTimer) clearTimeout(state.idleTimer);
    set({
      currentScreen: 'standby',
      history: [],
      sessionId: '',
      sessionStarted: false,
      visitedScreens: new Set<Screen>(),
      idleTimer: null,
    });
  },

  resetToStandby: () => {
    const state = get();
    if (state.idleTimer) clearTimeout(state.idleTimer);
    set({
      currentScreen: 'standby',
      history: [],
      sessionId: '',
      sessionStarted: false,
      visitedScreens: new Set<Screen>(),
      idleTimer: null,
    });
  },

  setMobile: (v: boolean) => set({ isMobile: v }),

  setFontSize: (s) => set({ fontSize: s }),

  setTtsEnabled: (v) => set({ ttsEnabled: v }),

  setHighContrast: (v) => set({ highContrast: v }),

  resetIdleTimer: () => {
    const { idleTimer, sessionStarted } = get();
    if (!sessionStarted) return;
    if (idleTimer) clearTimeout(idleTimer);
    const timer = setTimeout(() => {
      const state = useKioskStore.getState();
      if (state.sessionStarted && state.currentScreen !== 'standby') {
        logEvent('standby', 'idle_timeout', state.currentScreen);
        state.endSession();
      }
    }, IDLE_TIMEOUT_MS);
    set({ idleTimer: timer });
  },
}));

export function useProgress() {
  const visited = useKioskStore((s) => s.visitedScreens);
  const visitedCount = TOTAL_CONTENT_SCREENS.filter((s) => visited.has(s)).length;
  return {
    visitedCount,
    total: TOTAL_CONTENT_SCREENS.length,
    percent: Math.round((visitedCount / TOTAL_CONTENT_SCREENS.length) * 100),
  };
}

async function logEvent(screen: string, eventType: string, from?: string) {
  const state = useKioskStore.getState();
  try {
    await fetch('/api/logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: state.sessionId || 'standby',
        eventType,
        screen,
        detail: from || '',
      }),
    });
  } catch {
    // Silently fail
  }
}
