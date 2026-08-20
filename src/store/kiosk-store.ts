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

  navigateTo: (screen: Screen) => void;
  goBack: () => void;
  goHome: () => void;
  startSession: () => void;
  endSession: () => void;
  resetToStandby: () => void;
}

const generateId = () => {
  return Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
};

export const useKioskStore = create<KioskState>((set, get) => ({
  currentScreen: 'standby',
  history: [],
  sessionId: '',
  sessionStarted: false,

  navigateTo: (screen: Screen) => {
    const { currentScreen, history } = get();
    set({
      currentScreen: screen,
      history: [...history, currentScreen],
    });
    logEvent(screen, 'navigate', currentScreen);
  },

  goBack: () => {
    const { history } = get();
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
  },

  goHome: () => {
    set({ currentScreen: 'main', history: [] });
    logEvent('main', 'home', get().currentScreen);
  },

  startSession: () => {
    const sessionId = generateId();
    set({
      sessionId,
      sessionStarted: true,
      currentScreen: 'main',
      history: [],
    });
    logEvent('main', 'session_start', 'standby');
  },

  endSession: () => {
    const state = get();
    logEvent('standby', 'session_end', state.currentScreen);
    set({
      currentScreen: 'standby',
      history: [],
      sessionId: '',
      sessionStarted: false,
    });
  },

  resetToStandby: () => {
    set({
      currentScreen: 'standby',
      history: [],
      sessionId: '',
      sessionStarted: false,
    });
  },
}));

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
