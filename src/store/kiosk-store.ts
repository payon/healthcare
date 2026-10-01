import { create } from 'zustand';

export type Screen =
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
  | 'completion'
  | 'more';

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
  helpOpen: boolean;

  navigateTo: (screen: Screen) => void;
  goHome: () => void;
  startSession: () => void;
  endSession: () => void;
  resetToStandby: () => void;
  setMobile: (v: boolean) => void;
  setFontSize: (s: 'normal' | 'large' | 'xlarge') => void;
  resetIdleTimer: () => void;
  setTtsEnabled: (v: boolean) => void;
  setHighContrast: (v: boolean) => void;
  setHelpOpen: (v: boolean) => void;
}

const IDLE_TIMEOUT_MS = 120_000;

/** 기기에서 돌고 있는 번들을 식별하는 빌드 태그 (diag 로그용 — 수정 시 갱신) */
export const KIOSK_BUILD = '20260930g';

const generateId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
};

const TOTAL_CONTENT_SCREENS: Screen[] = [
  'equipment-intro', 'location', 'app-install', 'signup',
  'vein-register', 'login', 'non-member', 'measurement-mode',
  'measurement-equipment', 'results',
];

export const useKioskStore = create<KioskState>((set, get) => ({
  // 대기 화면 없음: 부팅 직후 메인 메뉴에서 시작 (세션은 boot effect에서 시작)
  currentScreen: 'main',
  history: [],
  sessionId: '',
  sessionStarted: false,
  isMobile: false,
  visitedScreens: new Set<Screen>(),
  fontSize: 'normal',
  idleTimer: null,
  // 시니어 키오스크: 음성 안내 기본 ON (첫 터치 이후 화면마다 자동 낭독)
  ttsEnabled: true,
  highContrast: false,
  helpOpen: false,

  navigateTo: (screen: Screen) => {
    const { currentScreen, history, visitedScreens, sessionStarted } = get();
    // 같은 화면 연타/중복 탭은 히스토리에 쌓지 않는다.
    // (중복 푸시되면 뒤로가기가 같은 화면에 머물러 "안 먹히는" 것처럼 보인다)
    if (screen === currentScreen) return;
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
    logEvent('main', 'session_start', 'boot');
    get().resetIdleTimer();
  },

  endSession: () => {
    const state = get();
    logEvent('main', 'session_end', state.currentScreen);
    if (state.idleTimer) clearTimeout(state.idleTimer);
    set({
      currentScreen: 'main',
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
      currentScreen: 'main',
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

  setHelpOpen: (v) => set({ helpOpen: v }),

  resetIdleTimer: () => {
    const { idleTimer, sessionStarted } = get();
    if (!sessionStarted) return;
    if (idleTimer) clearTimeout(idleTimer);
    const timer = setTimeout(() => {
      const state = useKioskStore.getState();
      // 대기 화면 없음: 유휴 시 메인 메뉴로 복귀
      if (state.sessionStarted && state.currentScreen !== 'main') {
        logEvent('main', 'idle_timeout', state.currentScreen);
        state.goHome();
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

export async function logEvent(screen: string, eventType: string, from?: string) {
  const state = useKioskStore.getState();
  try {
    await fetch('/api/logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: state.sessionId || 'main',
        eventType,
        screen,
        detail: from || '',
      }),
    });
  } catch {
    // Silently fail
  }
}
