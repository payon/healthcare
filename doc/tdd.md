# Biogram MINI 헬스케어 장비 이용 교육 키오스크 — 기술 설계 문서 (TDD)

> 버전: 1.0.0  
> 최종 수정: 2026-03-05  
> 작성자: Biogram MINI 개발팀

---

## 1. 기술 스택

| 계층 | 기술 | 버전 | 용도 |
|------|------|------|------|
| **프레임워크** | Next.js (App Router) | 16 | SSR/SSG, 라우팅, API Routes |
| **언어** | TypeScript | 5 | 정적 타입, 컴파일 타임 오류 검출 |
| **스타일링** | Tailwind CSS | 4 | 유틸리티 퍼스트 CSS, 반응형, oklch 색상 |
| **UI 컴포넌트** | shadcn/ui (New York) | — | Card, Button, Progress, Badge 등 |
| **상태 관리** | Zustand | 5 | 클라이언트 전역 상태 (화면, 세션, 접근성) |
| **애니메이션** | Framer Motion | 12 | 화면 전환 트랜지션, 마이크로 인터랙션 |
| **ORM** | Prisma | — | SQLite 데이터베이스 클라이언트 |
| **데이터베이스** | SQLite | — | 로컬 파일 DB (kiosk 로그, 콘텐츠) |
| **음성** | Web Speech API | — | TTS 음성 안내 (브라우저 내장, 오프라인 가능) |
| **폰트** | Noto Sans KR | — | 한국어 가변 웹폰트 (next/font/google) |
| **아이콘** | Lucide React | — | 시스템 아이콘 셋 |
| **PWA** | Service Worker + manifest.json | — | 오프라인 캐시, 설치 유도 |

---

## 2. 아키텍처 개요

```
┌─────────────────────────────────────────────────┐
│                  브라우저 (Client)                │
│                                                   │
│  ┌──────────┐  ┌──────────────┐  ┌─────────────┐ │
│  │ page.tsx │  │ kiosk-store  │  │  useTTS     │ │
│  │ (렌더러) │◀─│  (Zustand)   │◀─│  (Hook)     │ │
│  └────┬─────┘  └──────┬───────┘  └─────────────┘ │
│       │               │                           │
│  ┌────▼─────┐  ┌──────▼───────┐                   │
│  │ Screens  │  │ Accessibility│                   │
│  │ (13개)   │  │ Toolbar      │                   │
│  └──────────┘  └──────────────┘                   │
│                                                   │
│  ┌──────────────────────────────────────────────┐ │
│  │           Service Worker (sw.js)             │ │
│  │     Cache-first 정적 자산 / Network API      │ │
│  └──────────────────────────────────────────────┘ │
└──────────────────────┬──────────────────────────┘
                       │ fetch /api/*
┌──────────────────────▼──────────────────────────┐
│              Next.js Server (API Routes)         │
│                                                   │
│  ┌──────────────┐  ┌──────────────────────────┐  │
│  │ /api/logs    │  │ /api/content             │  │
│  │ POST: 로그   │  │ GET: 콘텐츠 조회        │  │
│  │ GET: 로그    │  │ PUT: 콘텐츠 upsert      │  │
│  │   조회(100) │  │                          │  │
│  └──────┬───────┘  └──────────┬───────────────┘  │
│         │                     │                   │
│  ┌──────▼─────────────────────▼───────────────┐  │
│  │          Prisma Client (SQLite)            │  │
│  │   KioskContent | KioskLog | KioskSession   │  │
│  └────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────┘
```

---

## 3. 상태 관리 설계

### 3.1 Zustand Store: `kiosk-store.ts`

파일 경로: `src/store/kiosk-store.ts`

#### Screen 타입 유니언

```typescript
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
```

#### Store 인터페이스

```typescript
interface KioskState {
  // ── 내비게이션 ──
  currentScreen: Screen;         // 현재 화면
  history: Screen[];             // 뒤로가기용 히스토리 스택

  // ── 세션 ──
  sessionId: string;             // 익명 세션 ID (랜덤 문자열)
  sessionStarted: boolean;       // 세션 활성 여부

  // ── 디바이스 ──
  isMobile: boolean;             // 768px 미만 여부

  // ── 진행 추적 ──
  visitedScreens: Set<Screen>;   // 방문 완료 화면 집합

  // ── 접근성 ──
  fontSize: 'normal' | 'large' | 'xlarge';  // 글꼴 크기
  ttsEnabled: boolean;           // TTS 음성 안내 활성 여부
  highContrast: boolean;         // 고대비 모드 활성 여부

  // ── 타이머 ──
  idleTimer: ReturnType<typeof setTimeout> | null;  // 유휴 타임아웃 핸들

  // ── 액션 ──
  navigateTo: (screen: Screen) => void;   // 화면 이동
  goBack: () => void;                     // 뒤로가기
  goHome: () => void;                     // 홈 이동
  startSession: () => void;               // 세션 시작
  endSession: () => void;                 // 세션 종료
  resetToStandby: () => void;             // 강제 대기 복귀
  setMobile: (v: boolean) => void;        // 모바일 여부 설정
  setFontSize: (s: ...) => void;          // 글꼴 크기 설정
  setTtsEnabled: (v: boolean) => void;    // TTS 토글
  setHighContrast: (v: boolean) => void;  // 고대비 토글
  resetIdleTimer: () => void;             // 유휴 타이머 리셋
}
```

#### 핵심 로직

| 액션 | 동작 |
|------|------|
| `navigateTo(screen)` | `history`에 `currentScreen` 푸시 → `currentScreen` 변경 → `visitedScreens`에 추가 → `logEvent(screen, 'navigate', from)` → `resetIdleTimer()` |
| `goBack()` | `history` 팝 → 이전 화면 복원 → `logEvent` → `resetIdleTimer()` |
| `goHome()` | `currentScreen = 'main'`, `history = []` → `logEvent` → `resetIdleTimer()` |
| `startSession()` | 랜덤 `sessionId` 생성 → `currentScreen = 'main'` → `logEvent('main', 'session_start')` → `resetIdleTimer()` |
| `endSession()` | `logEvent('standby', 'session_end')` → `idleTimer` 해제 → 상태 초기화 → `currentScreen = 'standby'` |
| `resetIdleTimer()` | 기존 타이머 해제 → 120초 후 `endSession()` 예약 (세션 활성 시만) |

#### 진행률 계산

```typescript
const TOTAL_CONTENT_SCREENS: Screen[] = [
  'equipment-intro', 'location', 'app-install', 'signup',
  'vein-register', 'login', 'non-member', 'measurement-mode',
  'measurement-equipment', 'results',
]; // 10개

export function useProgress() {
  const visited = useKioskStore((s) => s.visitedScreens);
  const visitedCount = TOTAL_CONTENT_SCREENS.filter((s) => visited.has(s)).length;
  return {
    visitedCount,         // 방문 완료 화면 수
    total: 10,            // 전체 콘텐츠 화면 수
    percent: Math.round((visitedCount / 10) * 100),  // 백분율
  };
}
```

#### 익명 로깅 함수

```typescript
async function logEvent(screen: string, eventType: string, from?: string) {
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
}
```

- 개인식별정보 불포함 (세션 ID는 랜덤 문자열)
- `fetch` 실패 시 무시 (Silent fail)

---

## 4. 화면 전환 메커니즘

### 4.1 AnimatePresence + motion.div

`src/app/page.tsx`에서 Framer Motion의 `AnimatePresence`와 `motion.div`를 사용하여 화면 전환 애니메이션 구현:

```typescript
const pageVariants = {
  initial: { opacity: 0, y: 20 },   // 아래에서 페이드인
  animate: { opacity: 1, y: 0 },     // 정지
  exit:    { opacity: 0, y: -20 },   // 위로 페이드아웃
};

<AnimatePresence mode="wait">
  <motion.div
    key={currentScreen}           // 화면 변경 시 리마운트 트리거
    variants={pageVariants}
    initial="initial"
    animate="animate"
    exit="exit"
    transition={{ duration: 0.25, ease: 'easeInOut' }}
  >
    <ScreenRenderer screen={currentScreen} />
  </motion.div>
</AnimatePresence>
```

- `mode="wait"`: 퇴장(exit) 애니메이션 완료 후 입장(initial) 애니메이션 시작
- `key={currentScreen}`: 화면 ID가 변경되면 React가 컴포넌트를 리마운트하여 전환 트리거
- 전환 시간: **0.25초** (NFR-05: 3초 이내 만족)

### 4.2 ScreenRenderer

`currentScreen` 값에 따른 switch 문으로 13개 화면 컴포넌트를 렌더링:

```typescript
function ScreenRenderer({ screen }: { screen: Screen }) {
  switch (screen) {
    case 'standby':              return <StandbyScreen />;
    case 'main':                 return <MainMenu />;
    case 'equipment-intro':      return <EquipmentIntro />;
    case 'location':             return <LocationGuide />;
    case 'app-install':          return <AppInstall />;
    case 'signup':               return <Signup />;
    case 'vein-register':        return <VeinRegister />;
    case 'login':                return <LoginGuide />;
    case 'non-member':           return <NonMember />;
    case 'measurement-mode':     return <MeasurementMode />;
    case 'measurement-equipment': return <MeasurementEquipment />;
    case 'results':              return <ResultsGuide />;
    case 'completion':           return <CompletionScreen />;
    default:                     return <MainMenu />;
  }
}
```

### 4.3 Zustand 내비게이션

화면 전환은 Zustand store의 액션을 통해서만 수행:

```
사용자 터치/클릭
    → navigateTo('equipment-intro')
        → history.push(currentScreen)
        → currentScreen = 'equipment-intro'
        → visitedScreens.add('equipment-intro')
        → logEvent(...)
        → resetIdleTimer()
    → React 리렌더: ScreenRenderer 교체
    → Framer Motion: exit → initial → animate
```

---

## 5. TTS 아키텍처

### 5.1 useTTS 훅

파일 경로: `src/hooks/use-tts.ts`

```typescript
const SPEECH_RATE = 0.85;   // 어르신 배려 느린 속도
const SPEECH_PITCH = 1.0;
const SPEECH_VOLUME = 1.0;
```

#### 인터페이스

```typescript
interface UseTTSOptions {
  autoSpeak?: boolean;  // 화면 전환 시 자동 읽기 여부
}

function useTTS(options?: UseTTSOptions): {
  speak: (text: string) => void;      // 임의 텍스트 읽기
  speakIntro: () => void;             // 현재 화면 intro 읽기
  speakFull: () => void;              // 현재 화면 full 읽기
  stop: () => void;                   // 음성 정지
}
```

#### 한국어 음성 엔진 자동 탐지

```typescript
const getKoreanVoice = (): SpeechSynthesisVoice | null => {
  const voices = window.speechSynthesis.getVoices();
  // 1순위: lang이 'ko'로 시작하는 음성
  const krVoice = voices.find((v) => v.lang.startsWith('ko'));
  if (krVoice) return krVoice;
  // 2순위: 'KO', 'kr', 'Korean' 포함 음성
  const krLike = voices.find((v) =>
    v.lang.includes('KO') || v.lang.includes('kr') || v.name.includes('Korean')
  );
  return krLike || voices[0] || null;
};
```

#### 자동 읽기 흐름

```
화면 전환 (currentScreen 변경)
    → ttsEnabled === true ?
        → prevScreenRef !== currentScreen ?
            → voices 로드 대기 (voiceschanged 이벤트)
            → speakIntro() 호출
                → ttsTexts[currentScreen].intro 텍스트
                → SpeechSynthesisUtterance 생성
                → rate=0.85, voice=한국어음성
                → speechSynthesis.speak()
```

- `autoSpeak: true`는 `page.tsx`에서만 설정 → 이중 재생 방지
- `ttsEnabled === false` 전환 시 `speechSynthesis.cancel()` 즉시 정지
- 언마운트 시 `cancel()` 정리

### 5.2 tts-texts.ts: 화면별 음성 안내 텍스트

파일 경로: `src/lib/tts-texts.ts`

```typescript
export interface TTSContent {
  intro: string;   // 화면 진입 시 자동 읽기 (요약)
  full?: string;   // "다시 듣기" 버튼으로 전체 읽기
}

export const ttsTexts: Record<Screen, TTSContent> = {
  standby:   { intro: '바이오그램 미니…화면을 터치하시면…' },
  main:      { intro: '메인 메뉴입니다…', full: '총 10개의 교육 항목이…' },
  // ... 13개 화면별 intro/full 정의
};
```

- `intro`: 간결한 요약 (화면 진입 시 자동 재생)
- `full`: 상세 설명 ("전체 듣기" 버튼 재생)
- standby 화면은 `full` 없음 (intro만)

### 5.3 TTSIndicator 컴포넌트

`AccessibilityToolbar.tsx` 내부:

- `speechSynthesis.speaking` 상태를 300ms 폴링으로 추적
- 음성 재생 중 하단 고정 인디케이터 표시: "음성 안내 중…"
- "요약" / "전체" 다시 듣기 버튼
- tts-pulse 애니메이션 (1.5초 주기 opacity 변화)

---

## 6. 고대비 구현

### 6.1 CSS `.high-contrast` 클래스

`globals.css`에서 oklch CSS 변수를 오버라이드:

```css
.high-contrast {
  --background: oklch(0.08 0 0);         /* 거의 검정 */
  --foreground: oklch(1 0 0);            /* 순백 */
  --card: oklch(0.12 0 0);               /* 어두운 카드 */
  --primary: oklch(0.85 0.18 145);       /* 밝은 녹색 액센트 */
  --border: oklch(0.5 0 0);              /* 중간 회색 보더 */
  /* ... 모든 디자인 토큰 오버라이드 */
}
```

#### 강화 스타일

| 요소 | 일반 | 고대비 |
|------|------|--------|
| 카드 보더 | 1px | 3px, 명도 0.7 |
| 카드 hover 보더 | primary 자동 | 명도 0.85 녹색 |
| 주 버튼 | font-weight 600 | font-weight **800**, 3px 백색 보더 |
| 외곽 버튼 | 2px 보더 | 3px 보더, font-weight 800 |
| 경고 박스 | 2px amber | 3px 고대비 amber |
| 측정 카드 좌 보더 | 4px 컬러 | 6px 고대비 컬러 |
| 이미지 | 보더 없음 | 2px 회색 보더 |
| 스크롤바 thumb | primary/20 | 명도 0.7 |

### 6.2 Hydration Mismatch 방지

고대비 클래스 토글 시 서버-클라이언트 HTML 불일치(hydration mismatch)를 방지하기 위해 `useEffect` + `ref`로 DOM 직접 조작:

```typescript
const containerRef = useRef<HTMLDivElement>(null);

useEffect(() => {
  const el = containerRef.current;
  if (!el) return;
  el.classList.toggle('high-contrast', highContrast);
}, [highContrast, ...]);

return (
  <AnimatePresence mode="wait">
    <motion.div ref={containerRef} key={currentScreen} ...>
      <ScreenRenderer screen={currentScreen} />
    </motion.div>
  </AnimatePresence>
);
```

- 서버 렌더링 시에는 클래스 미적용 → HTML 일치
- 클라이언트 마운트 후 `useEffect`에서 클래스 토글 → hydration 충돌 없음

---

## 7. 글꼴 크기 구현

### 7.1 CSS zoom 속성

```typescript
const zoomValue = fontSize === 'normal' ? 1 : fontSize === 'large' ? 1.15 : 1.3;

useEffect(() => {
  const el = containerRef.current;
  if (!el) return;
  el.style.zoom = fontSize === 'normal' ? '' : String(zoomValue);
}, [fontSize, ...]);
```

| 설정 | zoom 값 | 효과 |
|------|---------|------|
| 보통 | 1 (빈 문자열) | 기본 크기 |
| 크게 | 1.15 | 15% 확대 |
| 아주 크게 | 1.3 | 30% 확대 |

- `zoom` 속성 사용 이유: `transform: scale()`과 달리 레이아웃 흐름에 반영되어 스크롤·레이아웃 깨짐 없음
- `useEffect` + `ref` 적용으로 hydration mismatch 방지 (고대비와 동일 패턴)

### 7.2 접근성 툴바 글꼴 크기 버튼

```typescript
const sizeOptions: SizeOption[] = [
  { value: 'normal', label: '보통',   display: 'A', textSize: 'text-sm'   },
  { value: 'large',  label: '크게',   display: 'A', textSize: 'text-lg'   },
  { value: 'xlarge', label: '아주 크게', display: 'A', textSize: 'text-2xl' },
];
```

- 버튼 내 글자 크기(`display`)로 시각적 크기 차이 표현
- `aria-pressed` 속성으로 현재 선택 상태 스크린 리더 전달

---

## 8. PWA 구현

### 8.1 manifest.json

파일 경로: `public/manifest.json`

```json
{
  "name": "Biogram MINI 헬스케어 장비 이용 교육",
  "short_name": "바이오그램 교육",
  "description": "Biogram MINI 헬스케어 장비 이용 교육 키오스크",
  "start_url": "/",
  "display": "standalone",
  "orientation": "any",
  "background_color": "#f0fdfa",
  "theme_color": "#0d9488",
  "categories": ["health", "education", "medical"],
  "lang": "ko",
  "icons": [
    { "src": "/pwa-icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any maskable" },
    { "src": "/pwa-icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any maskable" }
  ]
}
```

- `display: "standalone"`: 브라우저 UI 숨김 (앱 형태)
- `theme_color: "#0d9488"`: Teal-600 (바이오그램 브랜드 컬러)

### 8.2 Service Worker: sw.js

파일 경로: `public/sw.js`

```
┌────────────────────────────────────────────┐
│           Cache: biogram-mini-v1           │
│                                            │
│  정적 자산 (설치 시 프리캐시):              │
│    /                                       │
│    /manifest.json                          │
│    /pwa-icon-192.png                       │
│    /pwa-icon-512.png                       │
│    /kiosk-images/equipment.png             │
│    /kiosk-images/location.png              │
│                                            │
│  페치 전략:                                 │
│    GET /api/* → 네트워크만 (캐시 안 함)      │
│    GET 기타  → Cache-first                 │
│      캐시 hit → 즉시 반환                    │
│      캐시 miss → 네트워크 fetch → 캐시 갱신  │
│      네트워크 실패 → 캐시 fallback           │
│                                            │
│  POST/PUT/DELETE → SW 개입 안 함            │
└────────────────────────────────────────────┘
```

- **Cache-first + network fallback**: 오프라인 시에도 캐시된 콘텐츠 열람 가능
- **API 요청 제외**: `/api/` 경로는 항상 네트워크로 패스스루 (로깅·콘텐츠 동기화)
- **버전 관리**: 캐시 이름 `biogram-mini-v1` 변경으로 강제 갱신

### 8.3 ServiceWorkerRegistrar 컴포넌트

파일 경로: `src/components/kiosk/ServiceWorkerRegistrar.tsx`

```
마운트 시:
  1. navigator.serviceWorker.register('/sw.js')
  2. display-mode: standalone 체크 → 이미 설치됨 여부 판단
  3. beforeinstallprompt 이벤트 대기
     → e.preventDefault() (자동 설치 프롬프트 방지)
     → installPrompt 상태 저장
     → 설치 버튼 표시

사용자 "앱 설치" 버튼 클릭:
  1. installPrompt.prompt()
  2. userChoice 결과 처리
  3. appinstalled 이벤트 → 설치 완료 → 버튼 숨김
```

- 우측 하단 고정 FAB 버튼: "⬇ 앱 설치"
- 모바일: `bottom-20 right-4` (바텀 네비 위)
- 데스크톱: `bottom-4 right-4`

---

## 9. 데이터 모델

### 9.1 Prisma 스키마

파일 경로: `prisma/schema.prisma`

```prisma
model KioskContent {
  id        String   @id @default(cuid())
  section   String   @unique       // 화면 식별자 (예: 'equipment-intro')
  title     String                 // 화면 제목
  body      String                 // 화면 본문 (Markdown 가능)
  imageUrl  String?               // 이미지 URL
  qrCodeUrl String?               // QR코드 이미지 URL
  updatedAt DateTime @updatedAt
  createdAt DateTime @default(now())
}

model KioskLog {
  id        String   @id @default(cuid())
  sessionId String?               // 익명 세션 ID
  eventType String                 // navigate | back | home | session_start | session_end | idle_timeout
  screen    String?               // 이벤트 발생 화면
  detail    String?               // 부가 정보 (from 화면 등)
  createdAt DateTime @default(now())
}

model KioskSession {
  id        String   @id @default(cuid())
  startedAt DateTime @default(now())
  endedAt   DateTime?             // 세션 종료 시각 (null = 진행 중)
}
```

### 9.2 ER 다이어그램

```
KioskContent          KioskLog              KioskSession
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ id (PK)      │    │ id (PK)      │    │ id (PK)      │
│ section (UQ) │    │ sessionId    │    │ startedAt    │
│ title        │    │ eventType    │    │ endedAt      │
│ body         │    │ screen       │    └──────────────┘
│ imageUrl     │    │ detail       │
│ qrCodeUrl    │    │ createdAt    │
│ updatedAt    │    └──────────────┘
│ createdAt    │
└──────────────┘
```

- **KioskContent**: 관리자가 편집 가능한 화면 콘텐츠 (CMS 역할)
- **KioskLog**: 익명 이벤트 로그 (개인식별정보 불포함)
- **KioskSession**: 세션 시간 추적 (현재 미사용, 향후 분석용)

---

## 10. API 설계

### 10.1 `/api/logs`

파일 경로: `src/app/api/logs/route.ts`

| 메서드 | 용도 | 요청 | 응답 |
|--------|------|------|------|
| **POST** | 이벤트 로그 기록 | `{ sessionId, eventType, screen?, detail? }` | `{ success: true }` 또는 `{ error }` 400/500 |
| **GET** | 최근 로그 조회 (최대 100건) | — | `KioskLog[]` (createdAt DESC) |

#### POST 유효성 검증

- `sessionId`: 필수 (누락 시 400)
- `eventType`: 필수 (누락 시 400)
- `screen`, `detail`: 선택

#### GET 정렬

- `orderBy: { createdAt: 'desc' }`, `take: 100`

### 10.2 `/api/content`

파일 경로: `src/app/api/content/route.ts`

| 메서드 | 용도 | 요청 | 응답 |
|--------|------|------|------|
| **GET** | 전체 콘텐츠 조회 | — | `KioskContent[]` (section ASC) |
| **PUT** | 콘텐츠 upsert | `{ section, title, body?, imageUrl?, qrCodeUrl? }` | upsert 결과 `KioskContent` |

#### PUT Upsert 로직

```typescript
await db.kioskContent.upsert({
  where: { section },
  update: { title, body, imageUrl, qrCodeUrl },
  create: { section, title, body, imageUrl, qrCodeUrl },
});
```

- 동일 `section`이면 업데이트, 없으면 생성 → 관리자 CMS에서 안전한 편집

---

## 11. 파일 구조

```
my-project/
├── prisma/
│   └── schema.prisma                  # 데이터 모델 (KioskContent, KioskLog, KioskSession)
│
├── public/
│   ├── manifest.json                  # PWA 매니페스트
│   ├── sw.js                          # Service Worker (cache-first)
│   ├── pwa-icon-192.png              # PWA 아이콘 192×192
│   ├── pwa-icon-512.png              # PWA 아이콘 512×512
│   ├── apple-touch-icon.png          # iOS 홈 화면 아이콘
│   ├── logo.svg                       # 바이오그램 로고
│   ├── robots.txt
│   └── kiosk-images/
│       ├── equipment.png              # 장비 이미지
│       └── location.png              # 위치 안내 이미지
│
├── src/
│   ├── app/
│   │   ├── layout.tsx                 # 루트 레이아웃 (Noto Sans KR, SW, Toaster)
│   │   ├── page.tsx                   # 메인 페이지 (AnimatePresence, ScreenRenderer)
│   │   ├── globals.css                # 글로벌 스타일 + 고대비 + 키오스크 유틸리티
│   │   └── api/
│   │       ├── route.ts               # 헬스체크 API
│   │       ├── logs/
│   │       │   └── route.ts           # POST: 로그 기록, GET: 로그 조회
│   │       └── content/
│   │           └── route.ts           # GET: 콘텐츠 조회, PUT: 콘텐츠 upsert
│   │
│   ├── store/
│   │   └── kiosk-store.ts             # Zustand 전역 상태 (Screen, 세션, 접근성)
│   │
│   ├── hooks/
│   │   ├── use-tts.ts                 # TTS 훅 (Web Speech API)
│   │   ├── use-toast.ts              # 토스트 알림 훅
│   │   └── use-mobile.ts             # 모바일 감지 훅
│   │
│   ├── lib/
│   │   ├── tts-texts.ts              # 화면별 TTS 음성 안내 텍스트
│   │   ├── db.ts                      # Prisma 클라이언트 싱글톤
│   │   └── utils.ts                   # 공통 유틸리티 (cn 등)
│   │
│   └── components/
│       ├── ui/                        # shadcn/ui 컴포넌트 (Card, Button, Progress 등)
│       │
│       └── kiosk/
│           ├── StandbyScreen.tsx       # 대기 화면 (터치 유도 애니메이션)
│           ├── MainMenu.tsx            # 메인 메뉴 (10개 교육 항목 카드 그리드)
│           ├── KioskHeader.tsx         # 공통 헤더 (뒤로가기, 홈, 진행률)
│           ├── KioskFooter.tsx         # 공통 푸터 (저작권, 세션 ID)
│           ├── ContentLayout.tsx       # 콘텐츠 화면 공통 레이아웃
│           ├── AccessibilityToolbar.tsx # 접근성 툴바 (글꼴, TTS, 고대비)
│           ├── MobileBottomNav.tsx     # 모바일 하단 탭바
│           ├── ServiceWorkerRegistrar.tsx # SW 등록 + PWA 설치 버튼
│           │
│           └── screens/
│               ├── EquipmentIntro.tsx      # 장비 소개
│               ├── LocationGuide.tsx       # 설치 위치 안내
│               ├── AppInstall.tsx          # 앱 설치 안내
│               ├── Signup.tsx              # 회원가입 안내
│               ├── VeinRegister.tsx        # 지정맥 등록 안내
│               ├── LoginGuide.tsx          # 로그인 안내
│               ├── NonMember.tsx           # 비회원 이용 안내
│               ├── MeasurementMode.tsx     # 측정 모드 안내
│               ├── MeasurementEquipment.tsx # 측정 장비 안내
│               ├── ResultsGuide.tsx        # 결과 확인 안내
│               └── CompletionScreen.tsx    # 교육 완료
│
├── db/
│   └── custom.db                     # SQLite 데이터베이스 파일
│
├── doc/
│   ├── prd.md                         # 제품 요구사항 문서
│   └── tdd.md                         # 기술 설계 문서 (본 문서)
│
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.ts
├── postcss.config.mjs
├── eslint.config.mjs
├── components.json                    # shadcn/ui 설정
└── Caddyfile                         # 게이트웨이 설정
```

---

## 12. 렌더링 파이프라인

```
사용자 조작 (터치/클릭)
    │
    ▼
Zustand Store 액션 (navigateTo / goBack / goHome)
    │
    ├── currentScreen 갱신
    ├── history 스택 갱신
    ├── visitedScreens 갱신
    ├── logEvent() → fetch POST /api/logs
    └── resetIdleTimer() → 120초 타이머 (재)시작
    │
    ▼
React 리렌더 트리거
    │
    ▼
page.tsx: AnimatePresence 감지
    │
    ├── 이전 motion.div exit 애니메이션 (0.25초)
    └── 신규 motion.div initial → animate 애니메이션 (0.25초)
    │
    ▼
ScreenRenderer: switch(currentScreen) → 해당 화면 컴포넌트 마운트
    │
    ├── KioskHeader (뒤로가기, 홈, 진행률 바)
    ├── 화면 콘텐츠 (카드, 이미지, 단계 안내, QR코드 등)
    ├── KioskFooter
    ├── AccessibilityToolbar (글꼴, TTS, 고대비)
    ├── MobileBottomNav (모바일 only)
    └── TTSIndicator (음성 재생 중 only)
    │
    ▼
useTTS: autoSpeak && ttsEnabled → speakIntro()
    │
    ▼
Web Speech API: SpeechSynthesisUtterance → 오디오 출력
```

---

## 13. 유휴 타임아웃 상태 머신

```
              터치/클릭/키보드/스크롤
    ┌─────────────────────────────────────┐
    │                                     │
    ▼                                     │
 [STANDBY] ──터치──▶ [SESSION_ACTIVE] ────┘
                         │
                         │ 120초 무조작
                         ▼
                    [IDLE_TIMEOUT]
                         │
                         │ endSession()
                         ▼
                     [STANDBY]
```

- 이벤트 리스너: `touchstart`, `mousedown`, `keydown`, `scroll` (passive: true)
- 타이머 리셋: 모든 조작 이벤트 + `navigateTo`/`goBack`/`goHome` 액션
- 타임아웃 시: `logEvent('standby', 'idle_timeout', currentScreen)` → `endSession()`

---

## 14. 모바일 vs 데스크톱 분기

| 요소 | 모바일 (<768px) | 데스크톱 (≥768px) |
|------|-----------------|-------------------|
| **접근성 툴바** | 상단 인라인 (`MobileToolbar`) | 우측 상단 플로팅 버튼 → 확장 패널 (`DesktopToolbar`) |
| **하단 네비** | 고정 탭바 (`MobileBottomNav`, 5개 탭) | 숨김 |
| **카드 그리드** | 1열 | 2~4열 |
| **버튼 크기** | 전폭 (`w-full`) | 자동 폭 |
| **PWA 설치 버튼** | `bottom-20 right-4` (탭바 위) | `bottom-4 right-4` |
| **TTS 인디케이터** | `bottom-[4.5rem]` (탭바 위) | `bottom-6` |
| **Safe area** | `env(safe-area-inset-bottom)` 패딩 | 없음 |
| **글꼴 크기 라벨** | 아이콘만 (label 숨김) | 아이콘 + 텍스트 |

---

## 15. CSS 커스텀 클래스 요약

| 클래스 | 용도 |
|--------|------|
| `.kiosk-touch-target` | 최소 64×64px 터치 타겟 |
| `.kiosk-card` | 카드 기본 스타일 (rounded-2xl, shadow, hover) |
| `.kiosk-btn` | 버튼 기본 (64px 높이, rounded-xl, active:scale-95) |
| `.kiosk-btn-primary` | 주 버튼 (bg-primary) |
| `.kiosk-btn-secondary` | 보조 버튼 (bg-secondary) |
| `.kiosk-btn-outline` | 외곽 버튼 (border-2, hover 채움) |
| `.step-dot` / `.step-dot.active` / `.step-dot.completed` | 단계 인디케이터 |
| `.warning-box` | 경고 박스 (amber) |
| `.notice-box` | 안내 박스 (primary) |
| `.kiosk-scroll` | 커스텀 스크롤바 (8px 둥근) |
| `.animate-pulse-glow` | 대기 화면 펄스 글로우 |
| `.animate-float-up` | 부동 애니메이션 |
| `.flow-arrow` | 흐름도 화살표 |
| `.measure-*` | 측정 카드 좌 보더 컬러 (stress/height/bp/grip/body/skin) |
| `.pb-safe` / `.pb-bottom-nav` | Safe area / 바텀 네비 패딩 |
| `.snap-x-mandatory` / `.snap-center` / `.snap-start` | 스냅 스크롤 |
| `.scrollbar-hide` | 스크롤바 숨김 |
| `.progress-bar-animated` | 진행률 바 채움 애니메이션 |
| `.tap-feedback` | 터치 피드백 (scale 0.97) |
| `.tts-indicator` / `.tts-speaking` | TTS 인디케이터 스타일 |
| `.high-contrast` | 고대비 모드 오버라이드 |

---

## 16. 성능 고려사항

| 항목 | 전략 |
|------|------|
| **초기 로딩** | Next.js 자동 코드 분할, Noto Sans KR 다이나믹 서브셋 (`display: swap`) |
| **화면 전환** | Framer Motion 0.25초 트랜지션, `mode="wait"`으로 동시 마운트 방지 |
| **TTS** | Web Speech API는 브라우저 내장 (별도 다운로드 없음), 음성 엔진 OS 캐시 |
| **이미지** | 정적 이미지 SW 프리캐시, `<Image>` 컴포넌트 미사용 (키오스크 고정 해상도) |
| **로깅** | `fetch` 실패 시 무시 (UI 블로킹 없음), 비동기 fire-and-forget |
| **오프라인** | SW cache-first로 정적 자산 즉시 로드, API는 네트워크 전용 |
| **글꼴 크기** | CSS `zoom` 속성으로 reflow 최소화 (transform보다 레이아웃 비용 낮음) |
| **Zustand** | 단일 스토어로 상태 동결화, 불필요한 리렌더 방지 selector 사용 |

---

## 17. 보안 고려사항

| 항목 | 조치 |
|------|------|
| **개인정보** | 어떠한 개인식별정보도 수집하지 않음 (세션 ID는 랜덤 문자열) |
| **장비 통신** | Bluetooth, Wi-Fi, USB 등 모든 외부 통신 차단 |
| **API** | 입력 유효성 검증 (필수 필드 누락 시 400), 내부 오류 시 500 (세부 정보 노출 안 함) |
| **XSS** | React 기본 이스케이핑, `dangerouslySetInnerHTML` 미사용 |
| **SW** | API 경로(`/api/`)는 캐시하지 않아 민감 데이터 노출 방지 |
| **CSP** | Next.js 기본 CSP 정책 준수 |

---

## 18. 향후 확장 포인트

| 항목 | 현재 | 확장 방향 |
|------|------|-----------|
| **관리자 CMS** | `/api/content` PUT으로 수동 편집 | 관리자 대시보드 UI (별도 프로젝트) |
| **다국어** | 한국어만 | i18n 도입, tts-texts 다국어 확장 |
| **분석 대시보드** | `/api/logs` GET으로 수동 확인 | 대시보드 UI, 세션 분석, 히트맵 |
| **KioskSession 활용** | 모델만 정의 | 세션 시작/종료 시 KioskSession 레코드 생성, 체류 시간 분석 |
| **실제 측정 연동** | 교육만 제공 | 장비 Bluetooth/Wi-Fi API 연동 (별도 프로젝트) |
| **다크 모드** | 미지원 | next-themes 도입, 고대비와 독립 동작 |
| **음성 인식 (STT)** | 미지원 | Web Speech API SpeechRecognition으로 음성 명령 내비게이션 |
