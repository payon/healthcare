# Biogram MINI 헬스케어 장비 이용 교육 키오스크 — 아키텍처 문서

> 버전: 1.0.0  
> 최종 수정: 2026-03-05  
> 작성자: Biogram MINI 개발팀

---

## 1. 시스템 아키텍처 개요

본 시스템은 **클라이언트 단일 페이지 애플리케이션(SPA) · 서버 API Routes · SQLite 데이터베이스** 3계층 아키텍처로 구성된다.

```
┌─────────────────────────────────────────────────────────────────┐
│                     계층 1: 클라이언트 (SPA)                      │
│                                                                   │
│  Next.js App Router 단일 라우트(/) 기반 SPA                       │
│  Zustand 전역 상태 ── AnimatePresence 화면 전환 ── 13 Screen     │
│  Web Speech API TTS · CSS zoom 글꼴 확대 · 고대비 모드            │
│  Service Worker 캐시(cache-first) → 오프라인 동작 보장            │
└───────────────────────────────┬─────────────────────────────────┘
                                │ fetch POST /api/logs
                                │ fetch GET  /api/content
┌───────────────────────────────▼─────────────────────────────────┐
│                     계층 2: 서버 (API Routes)                     │
│                                                                   │
│  Next.js API Routes (App Router)                                 │
│  /api/logs   ── POST: 세션 이벤트 로깅, GET: 최근 100건 조회       │
│  /api/content── GET: 콘텐츠 섹션 조회                             │
│  Prisma Client로 SQLite 접근                                     │
└───────────────────────────────┬─────────────────────────────────┘
                                │ Prisma Client
┌───────────────────────────────▼─────────────────────────────────┐
│                     계층 3: 데이터베이스 (SQLite)                  │
│                                                                   │
│  KioskContent  ── 교육 콘텐츠 (section, title, body, imageUrl)   │
│  KioskLog      ── 세션 이벤트 로그 (sessionId, eventType, screen) │
│  KioskSession  ── 세션 메타 (startedAt, endedAt)                 │
│  로컬 파일 DB (db/custom.db) · 임베디드 · 무설정                   │
└─────────────────────────────────────────────────────────────────┘
```

### 계층 간 통신

| 출발 | 도착 | 프로토콜 | 용도 |
|------|------|----------|------|
| 클라이언트 → 서버 | `fetch POST /api/logs` | HTTP JSON | 화면 전환·세션 이벤트 로깅 |
| 클라이언트 → 서버 | `fetch GET /api/content` | HTTP JSON | 콘텐츠 섹션 동적 조회 |
| 서버 → SQLite | Prisma `db.kioskLog.create()` | SQLite 쿼리 | 로그 영속화 |
| 서버 → SQLite | Prisma `db.kioskContent.findUnique()` | SQLite 쿼리 | 콘텐츠 조회 |

---

## 2. 아키텍처 결정 기록 (ADR)

### ADR-001: Zustand 상태 관리 선택

| 항목 | 내용 |
|------|------|
| **결정** | 클라이언트 전역 상태 관리를 Zustand v5로 채택 |
| **대안** | React Context API, Redux Toolkit, Jotai |
| **근거** | ① **번들 크기**: Zustand ~1.1KB vs Redux ~7.4KB. 키오스크 초기 로딩 최적화에 유리. ② **보일러플레이트**: Context API는 Provider 중첩·useCallback 재렌더링 이슈 존재. Zustand는 `create()` 한 번으로 스토어 생성. ③ **선택적 구독**: `useKioskStore(s => s.currentScreen)` 형태로 필요 필드만 구독하여 불필요 재렌더링 방지. Context API는 value 객체 전체 구독. ④ **미들웨어**: `persist`, `devtools` 등 체이닝 가능. ⑤ **키오스크 특성**: 화면 전환·접근성 설정 등 전역 상태가 단일 스토어에서 관리되는 구조에 적합. |

**스토어 구조** (`src/store/kiosk-store.ts`):

```
KioskState
├── currentScreen: Screen          // 현재 화면 (13개 리터럴 유니온)
├── history: Screen[]              // 뒤로가기 히스토리 스택
├── sessionId: string              // 익명 세션 ID (개인식별정보 불포함)
├── sessionStarted: boolean        // 세션 활성 여부
├── isMobile: boolean              // 768px 미만 여부
├── visitedScreens: Set<Screen>    // 방문 완료 화면 집합
├── fontSize: 'normal'|'large'|'xlarge'  // 글꼴 크기 단계
├── idleTimer: timeout|null        // 유휴 타이머 핸들
├── ttsEnabled: boolean            // TTS 활성 여부
├── highContrast: boolean          // 고대비 모드 여부
├── navigateTo(screen)             // 화면 전환 + 히스토리 push + 로깅
├── goBack()                       // 히스토리 스택 기반 뒤로가기
├── goHome()                       // 메인 화면 즉시 이동
├── startSession()                 // 세션 시작 (ID 생성, main 진입)
├── endSession()                   // 세션 종료 (standby 복귀)
├── resetIdleTimer()               // 120초 타이머 리셋
├── setFontSize / setTtsEnabled / setHighContrast  // 접근성 설정
└── setMobile / resetToStandby     // 플랫폼·상태 유틸리티
```

---

### ADR-002: Web Speech API TTS 선택

| 항목 | 내용 |
|------|------|
| **결정** | TTS 음성 안내를 브라우저 내장 Web Speech API로 구현 |
| **대안** | 서버 TTS SDK (z-ai-web-dev-sdk TTS, Google Cloud TTS, AWS Polly) |
| **근거** | ① **오프라인 동작**: Web Speech API는 브라우저 내장 음성 엔진 사용. 네트워크 단절 시에도 음성 안내 가능. 서버 TTS는 API 호출 필수 → 오프라인 불가. ② **비용**: Web Speech API 무료. 서버 TTS는 건당 과금 (Google $4/1M 문자, AWS $4/1M 문자). 보건소 예산 제약. ③ **지연**: Web Speech API는 로컬 엔진 직접 호출 → <50ms 시작. 서버 TTS는 네트워크 RTT + 서버 처리 → 300~1000ms. 키오스크 즉각적 응답 요구. ④ **구현 단순성**: `SpeechSynthesisUtterance` 객체 생성 후 `speak()` 호출만으로 완료. ⑤ **제약 수용**: 음성 품질·언어 지원은 브라우저 의존. 한국어 음성은 Chrome·Samsung Internet 기본 탑재. 타겟 브라우저(Chrome 90+, Samsung Internet 17+)에서 한국어 음성 사용 가능. |

**구현** (`src/hooks/use-tts.ts`):

```
useTTS({ autoSpeak?: boolean })
├── speak(text)           // 임의 텍스트 읽기
├── speakIntro()          // 현재 화면 intro 텍스트 읽기
├── speakFull()           // 현재 화면 full 텍스트 읽기
├── stop()                // 음성 정지
└── useEffect: currentScreen 변경 시 autoSpeak=true && ttsEnabled=true면 speakIntro() 자동 호출
```

음성 파라미터: rate=0.85 (어르신 배려 느린 속도), pitch=1.0, volume=1.0, lang=ko-KR

---

### ADR-003: CSS zoom 글꼴 확대 선택

| 항목 | 내용 |
|------|------|
| **결정** | 글꼴 크기 확대를 CSS `zoom` 속성으로 구현 |
| **대안** | Tailwind `text-*` 유틸리티 클래스 교체, CSS `font-size` 변수, `rem` 기반 `font-size` 조절 |
| **근거** | ① **전체 비례 확대**: `zoom`은 요소와 모든 자손의 시각 렌더링을 비례 확대. 텍스트·패딩·마진·이미지·보더가 일관되게 확대되어 레이아웃 붕괴 없음. ② **Tailwind text-* 한계**: `text-lg`→`text-xl` 교체는 텍스트만 커지고 패딩·간격은 그대로 → 레이아웃 깨짐. 모든 컴포넌트의 모든 요소에 반응형 크기 적용 필요 → 유지보수 비용 과다. ③ **CSS 변수 한계**: `font-size` 변수는 텍스트만 확대. `padding`·`gap` 등은 별도 변수 필요. ④ **구현 단순성**: `el.style.zoom = '1.15'` 한 줄로 전체 확대. 3단계 (1.0, 1.15, 1.3) 전환 간단. ⑤ **브라우저 지원**: Chrome·Safari·Edge·Samsung Internet 완전 지원. Firefox 126+ 지원(2024년 6월). 타겟 브라우저 범위 내. |

**구현** (`src/app/page.tsx`):

```typescript
useEffect(() => {
  const el = containerRef.current;
  if (!el) return;
  const zoomValue = fontSize === 'normal' ? 1 : fontSize === 'large' ? 1.15 : 1.3;
  el.style.zoom = fontSize === 'normal' ? '' : String(zoomValue);
}, [fontSize]);
```

---

### ADR-004: useEffect + ref hydration 대응

| 항목 | 내용 |
|------|------|
| **결정** | `zoom`·`high-contrast`·`bg-background`를 `useEffect`에서 `ref.current.style` / `ref.current.classList.toggle`로 적용 |
| **대안** | 조건부 `className`·`style` prop 직접 사용 |
| **근거** | ① **Hydration mismatch 문제**: `fontSize`·`highContrast` 등 Zustand 상태는 클라이언트 전용. 서버 사이드 렌더링 시 초기값(normal, false)으로 HTML 생성. 클라이언트에서 이전 세션 상태(persisted)가 복원되면 서버 HTML과 불일치 → hydration mismatch 경고·버그. ② **useEffect 해결**: `useEffect`는 클라이언트 마운트 후 실행 → 서버 HTML과 무관하게 DOM 조작. hydration 완료 후 안전하게 상태 반영. ③ **ref 직접 조작**: `classList.toggle`·`style.zoom` 직접 조작은 React 렌더링 사이클과 무관 → hydration 충돌 없음. ④ **일관성**: 동일 패턴으로 zoom·highContrast·bgBackground 세 가지를 통일 적용. |

**구현** (`src/app/page.tsx`):

```typescript
const containerRef = useRef<HTMLDivElement>(null);
useEffect(() => {
  const el = containerRef.current;
  if (!el) return;
  const zoomValue = fontSize === 'normal' ? 1 : fontSize === 'large' ? 1.15 : 1.3;
  el.style.zoom = fontSize === 'normal' ? '' : String(zoomValue);
  el.classList.toggle('high-contrast', highContrast);
  el.classList.toggle('bg-background', currentScreen !== 'standby');
}, [fontSize, highContrast, currentScreen]);
```

---

### ADR-005: AnimatePresence 화면 전환 선택

| 항목 | 내용 |
|------|------|
| **결정** | Framer Motion `AnimatePresence` + `motion.div`로 화면 전환 구현 |
| **대안** | React Router (next-router), CSS transition, View Transitions API |
| **근거** | ① **SPA 단순성**: 본 앱은 단일 라우트(/) 기반 SPA. URL 변경 없이 Zustand `currentScreen` 상태로 화면 전환. React Router는 URL 기반 라우팅 → 불필요한 복잡성. ② **자연스러운 exit 애니메이션**: `AnimatePresence`는 언마운팅 컴포넌트의 exit 애니메이션을 보장. CSS transition은 언마운트 즉시 DOM 제거 → exit 애니메이션 불가. ③ **선언적 API**: `initial`·`animate`·`exit` variants로 진입·유지·퇴장 정의. 코드 가독성 높음. ④ **성능**: Framer Motion은 `will-change: transform` 자동 적용, GPU 가속. 0.25초 트랜지션 성능 목표 충족. ⑤ **제어**: `mode="wait"`으로 이전 화면 퇴장 후 새 화면 진입 보장. 동시 전환 방지. |

**구현** (`src/app/page.tsx`):

```tsx
const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

<AnimatePresence mode="wait">
  <motion.div
    key={currentScreen}
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

---

### ADR-006: SQLite 선택

| 항목 | 내용 |
|------|------|
| **결정** | 데이터베이스를 SQLite (로컬 파일 DB)로 채택 |
| **대안** | PostgreSQL, MySQL, MongoDB |
| **근거** | ① **임베디드**: SQLite는 서버 프로세스 없이 애플리케이션에 임베디드. 별도 DB 서버 설치·구성·운영 불필요. 보건소 키오스크 환경에서 인프라 최소화. ② **무설정**: `DATABASE_URL="file:./db/custom.db"` 하나로 완료. PostgreSQL은 호스트·포트·사용자·비밀번호·SSL 설정 필요. ③ **성능**: 읽기·쓰기 모두 로컬 파일 I/O → 네트워크 RTT 없음. 키오스크 로깅(건당 <1ms)에 충분. ④ **Prisma 호환**: Prisma SQLite 클라이언트 완전 지원. 스키마 마이그레이션 `db:push`로 간단. ⑤ **배포 단순성**: DB 파일이 프로젝트 디렉토리 내 존재 → 별도 백업 인프라 없이 파일 복사로 백업. ⑥ **트레이드오프 수용**: 동시 쓰기 제한(단일 라이터), 클러스터링 불가. 키오스크 단일 인스턴스 환경에서는 문제없음. |

**Prisma 스키마** (`prisma/schema.prisma`):

```prisma
model KioskContent {
  id        String   @id @default(cuid())
  section   String   @unique
  title     String
  body      String
  imageUrl  String?
  qrCodeUrl String?
  updatedAt DateTime @updatedAt
  createdAt DateTime @default(now())
}

model KioskLog {
  id        String   @id @default(cuid())
  sessionId String?
  eventType String
  screen    String?
  detail    String?
  createdAt DateTime @default(now())
}

model KioskSession {
  id        String   @id @default(cuid())
  startedAt DateTime @default(now())
  endedAt   DateTime?
}
```

---

## 3. 컴포넌트 아키텍처

### 3.1 페이지 계층

```
page.tsx (Home)
├── AnimatePresence(mode="wait")
│   └── motion.div(key={currentScreen})
│       └── ScreenRenderer(screen)
│           ├── standby      → StandbyScreen
│           ├── main         → MainMenu
│           ├── equipment-intro      → EquipmentIntro
│           ├── location             → LocationGuide
│           ├── app-install          → AppInstall
│           ├── signup               → Signup
│           ├── vein-register        → VeinRegister
│           ├── login                → LoginGuide
│           ├── non-member           → NonMember
│           ├── measurement-mode     → MeasurementMode
│           ├── measurement-equipment→ MeasurementEquipment
│           ├── results              → ResultsGuide
│           └── completion           → CompletionScreen
├── useTTS({ autoSpeak: true })
├── useEffect: mobile detection (resize listener)
├── useEffect: idle timer reset (touchstart, mousedown, keydown, scroll)
└── useEffect + ref: zoom, high-contrast, bg-background 적용
```

**ScreenRenderer**는 순수 `switch` 문으로 13개 `Screen` 리터럴에 대응하는 컴포넌트를 반환. 라우팅·비동기 로딩 없이 즉시 렌더링.

### 3.2 공통 컴포넌트: ContentLayout

모든 콘텐츠 화면(standby, main 제외)이 공유하는 레이아웃 래퍼.

```
ContentLayout({ title, children, notice })
├── KioskHeader (뒤로가기 + 화면 제목 + 홈)
├── AccessibilityToolbar
│   ├── MobileToolbar  (md:hidden, 상단 인라인)
│   ├── DesktopToolbar (hidden md:block, 우측 고정 플로팅)
│   └── TTSIndicator   (재생 중 하단 고정 인디케이터)
├── main.flex-1.overflow-y-auto.kiosk-scroll
│   └── div.max-w-4xl (콘텐츠 최대 너비 제한)
│       ├── h2 (화면 제목)
│       ├── children (화면별 콘텐츠)
│       └── notice-box (선택적 안내)
├── KioskFooter (hidden md:block, mt-auto 스티키 푸터)
└── MobileBottomNav (md:hidden, fixed 하단 5탭)
```

### 3.3 접근성 컴포넌트: AccessibilityToolbar

```
AccessibilityToolbar({ onReplay, onReplayFull })
├── MobileToolbar
│   ├── 글꼴 크기 3버튼 (A/A/A, rounded-full pill)
│   ├── 구분선
│   ├── TTS 토글 (Volume2/VolumeX)
│   └── 고대비 토글 (Eye)
├── DesktopToolbar
│   ├── 플로팅 버튼 (Type 아이콘, 우측 상단)
│   ├── 상태 뱃지 (활성 기능 수, destructive)
│   └── 확장 패널 (AnimatePresence 스케일 트랜지션)
│       ├── 글꼴 크기 3버튼
│       ├── TTS 켜짐/꺼짐 + 요약 듣기 + 전체 듣기
│       └── 고대비 켜짐/꺼짐
└── TTSIndicator
    ├── "음성 안내 중..." (tts-pulse 애니메이션)
    ├── 요약 다시 듣기 버튼
    └── 전체 다시 듣기 버튼
```

### 3.4 PWA 컴포넌트: ServiceWorkerRegistrar

```
ServiceWorkerRegistrar
├── navigator.serviceWorker.register('/sw.js')
├── beforeinstallprompt 이벤트 캡처
├── 앱 설치 버튼 (fixed, 하단 우측)
│   └── prompt() → userChoice outcome 추적
└── appinstalled 이벤트 → 설치 완료 처리
```

### 3.5 전체 컴포넌트 의존 그래프

```
layout.tsx
├── Noto_Sans_KR (next/font/google)
├── ServiceWorkerRegistrar
└── Toaster

page.tsx
├── useKioskStore (Zustand)
├── useTTS (Hook)
├── AnimatePresence + motion (Framer Motion)
└── ScreenRenderer
    └── 13 Screen Components
        └── 각 화면 공통 사용
            ├── ContentLayout
            │   ├── KioskHeader
            │   ├── AccessibilityToolbar
            │   │   ├── MobileToolbar
            │   │   ├── DesktopToolbar
            │   │   └── TTSIndicator
            │   ├── KioskFooter
            │   └── MobileBottomNav
            └── shadcn/ui (Button, Card, Progress, Badge...)
```

---

## 4. 상태 흐름 다이어그램

### 4.1 화면 전환 상태 흐름

```
┌──────────┐    navigateTo(screen)    ┌──────────────┐
│ 사용자   │ ──────────────────────▶  │ useKioskStore │
│ 터치/클릭│                          │              │
└──────────┘                          │ ① currentScreen = screen
                                      │ ② history.push(prevScreen)
                                      │ ③ visitedScreens.add(screen)
                                      └──────┬───────┘
                                             │
                                    ┌────────▼────────┐
                                    │  logEvent()     │
                                    │  POST /api/logs │
                                    └────────┬───────┘
                                             │
                                    ┌────────▼────────┐
                                    │  API Route      │
                                    │  db.kioskLog    │
                                    │    .create()    │
                                    └────────┬───────┘
                                             │
                                    ┌────────▼────────┐
                                    │  SQLite DB      │
                                    │  kiosk_log 테이블│
                                    └─────────────────┘
```

### 4.2 세션 생명주기 상태 흐름

```
[standby] ──(터치)──▶ startSession()
                         │ sessionId = random + timestamp
                         │ sessionStarted = true
                         │ currentScreen = 'main'
                         │ logEvent('main', 'session_start', 'standby')
                         ▼
[세션 활성] ──(navigateTo)──▶ 화면 전환 + 로깅
              │
              ├──(goBack)──▶ history.pop() → 이전 화면
              ├──(goHome)──▶ history = [] → main
              ├──(120s 무조작)──▶ idle_timeout → endSession()
              └──(completion 도달)──▶ endSession()
                         │
                         ▼
               endSession()
                         │ logEvent('standby', 'session_end', currentScreen)
                         │ clearTimeout(idleTimer)
                         │ currentScreen = 'standby'
                         │ sessionStarted = false
                         │ sessionId = ''
                         ▼
                    [standby]
```

### 4.3 진행률 계산 흐름

```
visitedScreens: Set<Screen>
        │
        ▼
TOTAL_CONTENT_SCREENS = [
  'equipment-intro', 'location', 'app-install', 'signup',
  'vein-register', 'login', 'non-member', 'measurement-mode',
  'measurement-equipment', 'results'
]  // 10개
        │
        ▼
visitedCount = TOTAL_CONTENT_SCREENS.filter(s => visited.has(s)).length
percent = Math.round((visitedCount / 10) × 100)
```

---

## 5. 이벤트 흐름

### 5.1 사용자 조작 → 유휴 타이머 리셋

```
┌─────────────────────────────────────┐
│          사용자 조작 이벤트           │
│  touchstart | mousedown | keydown   │
│              | scroll               │
└──────────────┬──────────────────────┘
               │ window.addEventListener (passive: true)
               ▼
       handleInteraction()
               │
               ▼
       resetIdleTimer()
               │
               ├── if (!sessionStarted) → return (세션 외 무시)
               ├── clearTimeout(prevTimer)
               └── setTimeout(() => {
                     if (sessionStarted && currentScreen !== 'standby') {
                       logEvent('standby', 'idle_timeout', currentScreen)
                       endSession()
                     }
                   }, 120_000)  // 120초
```

### 5.2 이벤트 타임라인

```
t=0s     세션 시작 (startSession)
t=5s     화면 전환 (navigateTo: 'equipment-intro')
t=30s    화면 전환 (navigateTo: 'measurement-mode')
t=60s    사용자 조작 (touchstart) → 타이머 리셋
t=180s   120초 무조작 → idle_timeout → endSession → standby

또는:

t=0s     세션 시작
t=...    화면 탐색
t=N      completion 도달 → endSession → standby
```

---

## 6. TTS 흐름

```
┌──────────────────────────────────────────────────┐
│                  화면 전환 발생                    │
│  currentScreen 변경 (Zustand 상태 업데이트)       │
└──────────────────────┬───────────────────────────┘
                       │
              ┌────────▼────────┐
              │   useTTS Hook   │
              │  autoSpeak=true │
              └────────┬────────┘
                       │
         ┌─────────────▼──────────────┐
         │  currentScreen !== prev?   │
         │  ttsEnabled === true?      │
         │  currentScreen !== standby?│
         └─────────────┬──────────────┘
                       │ 모두 참
              ┌────────▼────────┐
              │   speakIntro()  │
              └────────┬────────┘
                       │
         ┌─────────────▼──────────────┐
         │  ttsTexts[currentScreen]   │
         │  → intro 텍스트 조회       │
         └─────────────┬──────────────┘
                       │
              ┌────────▼────────┐
              │    speak(text)   │
              └────────┬────────┘
                       │
         ┌─────────────▼──────────────────┐
         │  window.speechSynthesis.cancel()│  // 기존 음성 정지
         │  new SpeechSynthesisUtterance   │
         │    .rate = 0.85                │  // 느린 속도
         │    .pitch = 1.0                │
         │    .volume = 1.0               │
         │    .voice = koreanVoice        │  // 한국어 음성 엔진
         │    .lang = 'ko-KR'             │
         │  speechSynthesis.speak(utt)    │
         └─────────────┬──────────────────┘
                       │
              ┌────────▼────────┐
              │   오디오 출력    │
              │  (브라우저 내장) │
              └────────┬────────┘
                       │
              ┌────────▼────────┐
              │  TTSIndicator   │
              │  speechSynthesis│
              │  .speaking 폴링 │  // 300ms 간격
              │  → tts-pulse    │
              │    애니메이션    │
              └─────────────────┘
```

### 한국어 음성 엔진 탐지 순서

1. `voices.find(v => v.lang.startsWith('ko'))` — 정확한 한국어 코드
2. `voices.find(v => v.lang.includes('KO') || v.lang.includes('kr') || v.name.includes('Korean'))` — 유사 코드
3. `voices[0]` — 폴백: 첫 번째 사용 가능 음성
4. `utterance.lang = 'ko-KR'` — 최종 폴백: 언어 코드만 지정

---

## 7. 고대비 흐름

```
┌──────────────────────┐
│  사용자 고대비 토글    │
│  setHighContrast(true)│
└──────────┬───────────┘
           │
  ┌────────▼────────┐
  │  Zustand 상태    │
  │  highContrast    │
  │    = true        │
  └────────┬────────┘
           │
  ┌────────▼────────────────────────────┐
  │  useEffect([highContrast])          │
  │  containerRef.current.classList     │
  │    .toggle('high-contrast', true)   │
  └────────┬────────────────────────────┘
           │
  ┌────────▼────────────────────────────┐
  │  CSS .high-contrast 클래스 적용      │
  │                                      │
  │  ┌─────────────────────────────────┐ │
  │  │  oklch 변수 오버라이드           │ │
  │  │  --background: oklch(0.08 0 0) │ │  // 검정 배경
  │  │  --foreground: oklch(1 0 0)    │ │  // 백색 전경
  │  │  --card: oklch(0.12 0 0)      │ │
  │  │  --primary: oklch(0.85 .18 145)│ │  // 밝은 녹색
  │  │  --border: oklch(0.5 0 0)     │ │  // 강화 보더
  │  └─────────────────────────────────┘ │
  │                                      │
  │  ┌─────────────────────────────────┐ │
  │  │  컴포넌트별 강화                 │ │
  │  │  .kiosk-card → border: 3px     │ │
  │  │  .kiosk-btn → font-weight: 800 │ │
  │  │  .warning-box → border: 3px    │ │
  │  │  .measure-* → border-left: 6px │ │
  │  │  img → border: 2px solid       │ │
  │  └─────────────────────────────────┘ │
  └──────────────────────────────────────┘
```

### 고대비 모드 해제 흐름

```
setHighContrast(false)
  → useEffect
  → classList.toggle('high-contrast', false)
  → .high-contrast 클래스 제거
  → :root oklch 변수 복원 (기본 Teal/Emerald 테마)
```

---

## 8. 보안 아키텍처

### 8.1 개인정보 미수집 원칙

| 항목 | 상세 |
|------|------|
| **입력 수집** | 이름, 주민등록번호, 전화번호, 이메일 등 어떠한 개인식별정보도 입력받지 않음 |
| **세션 ID** | `Math.random().toString(36) + Date.now().toString(36)` 생성 랜덤 문자열. 개인식별정보 불포함 |
| **로깅** | `sessionId`(익명), `eventType`, `screen`, `detail`만 기록. 사용자 식별 불가 |
| **쿠키** | 인증 쿠키·추적 쿠키 미사용 |
| **로컬 스토리지** | Zustand persist 미사용. 세션 종료 시 상태 초기화 |

### 8.2 장비 통신 차단

| 항목 | 상세 |
|------|------|
| **Bluetooth** | 미사용. Web Bluetooth API 미호출 |
| **Wi-Fi** | 미사용. 장비와의 네트워크 통신 없음 |
| **USB** | 미사용. WebUSB API 미호출 |
| **NFC** | 미사용. Web NFC API 미호출 |
| **의도** | 본 키오스크는 교육 전용. 실제 측정·장비 제어 수행 없음 |

### 8.3 콘텐츠 보안 정책 (CSP)

```
Content-Security-Policy:
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: blob:;
  font-src 'self' https://fonts.gstatic.com;
  connect-src 'self';
  frame-ancestors 'none';
```

- `frame-ancestors 'none'`: 클릭재킹 방지
- `connect-src 'self'`: 외부 데이터 전송 차단
- `img-src data: blob:`: 인라인 이미지 허용 (QR코드 등)

### 8.4 추가 보안 조치

| 항목 | 상세 |
|------|------|
| **HTTPS** | PWA 요구사항. Service Worker 등록에 HTTPS 필수 |
| **유휴 타임아웃** | 120초 무조작 시 세션 자동 종료 → 세션 데이터 노출 시간 최소화 |
| **세션 격리** | 세션 종료 시 모든 상태 초기화 (visitedScreens, history, sessionId) |
| **입력 검증** | API Route에서 필수 필드 누락 시 400 반환 |
| **silent fail** | 로깅 API 실패 시 예외 전파 없이 무시. 사용자 경험 영향 없음 |

---

## 9. 성능 아키텍처

### 9.1 빌드 타임 최적화

| 기법 | 상세 |
|------|------|
| **Turbopack** | Next.js 16 기본 번들러. 증분 컴파일, HMR <100ms |
| **Noto Sans KR 다이나믹 서브셋** | `next/font/google`으로 사용 글리프만 서브셋. 300~800 웨이트 중 실제 사용 분만 로드 |
| **font-display: swap** | 폰트 로딩 전 시스템 폰트로 렌더. FOIT 방지 |
| **Tree Shaking** | 사용하지 않는 shadcn/ui 컴포넌트·Lucide 아이콘 제외 |

### 9.2 런타임 최적화

| 기법 | 상세 |
|------|------|
| **Framer Motion will-change** | `motion.div`에 `will-change: transform` 자동 적용 → GPU 가속. transform·opacity만 애니메이션 → 페인트·레이아웃 미발생 |
| **AnimatePresence mode="wait"** | 동시 두 화면 렌더링 방지 → 메모리·GPU 절약 |
| **Zustand 선택적 구독** | `useKioskStore(s => s.currentScreen)` 형태로 필요 상태만 구독. 불필요 재렌더링 방지 |
| **passive: true 이벤트** | touchstart·scroll 리스너 `passive: true` → 브라우저 스크롤 차단 방지 |
| **이벤트 리스너 조건부** | `sessionStarted`일 때만 리스너 등록. 세션 외 불필요 리스너 제거 |

### 9.3 이미지 최적화

| 기법 | 상세 |
|------|------|
| **Lazy Loading** | 장비 이미지·위치 이미지는 화면 진입 시에만 렌더. `<img loading="lazy">` 적용 |
| **정적 에셋** | `/public/kiosk-images/` 하위 이미지. CDN 캐시 가능 |
| **SVG 아이콘** | Lucide React SVG 아이콘. 래스터 이미지 미사용 → 해상도 무관 선명 |

### 9.4 Service Worker 캐시 전략

```
┌─────────────────────────────────────────┐
│           Service Worker (sw.js)         │
│                                          │
│  ┌─────────────────────────────────────┐ │
│  │  정적 에셋: Cache-First             │ │
│  │  HTML, CSS, JS, Font, Image         │ │
│  │  → 캐시 hit 시 네트워크 요청 없음    │ │
│  │  → 캐시 miss 시 네트워크 fetch 후    │ │
│  │    캐시 저장                         │ │
│  └─────────────────────────────────────┘ │
│                                          │
│  ┌─────────────────────────────────────┐ │
│  │  API 요청: Network-First            │ │
│  │  /api/logs, /api/content            │ │
│  │  → 네트워크 요청 우선                │ │
│  │  → 네트워크 실패 시 캐시 폴백        │ │
│  └─────────────────────────────────────┘ │
│                                          │
│  ┌─────────────────────────────────────┐ │
│  │  오프라인 폴백                       │ │
│  │  네트워크 단절 시 캐시된 페이지 반환  │ │
│  │  → 핵심 교육 콘텐츠 열람 보장        │ │
│  └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

### 9.5 성능 지표 목표

| 지표 | 목표 | 달성 방법 |
|------|------|-----------|
| **LCP** | ≤ 2.5초 (캐시 활용 시) | SW cache-first, 다이나믹 서브셋 폰트 |
| **FID** | ≤ 100ms | Zustand 동기 상태, passive 리스너 |
| **CLS** | ≤ 0.1 | AnimatePresence layout 안정, font-display:swap |
| **화면 전환** | ≤ 0.25초 (애니메이션) | Framer Motion GPU 가속 |
| **TTS 시작** | ≤ 50ms | Web Speech API 로컬 엔진 |
| **API 로깅** | ≤ 100ms | SQLite 로컬 I/O, silent fail |

---

## 부록 A: 주요 파일 경로

| 분류 | 경로 |
|------|------|
| **진입점** | `src/app/page.tsx`, `src/app/layout.tsx` |
| **상태 스토어** | `src/store/kiosk-store.ts` |
| **TTS 훅** | `src/hooks/use-tts.ts` |
| **TTS 텍스트** | `src/lib/tts-texts.ts` |
| **접근성 툴바** | `src/components/kiosk/AccessibilityToolbar.tsx` |
| **공통 레이아웃** | `src/components/kiosk/ContentLayout.tsx` |
| **헤더/푸터** | `src/components/kiosk/KioskHeader.tsx`, `KioskFooter.tsx` |
| **모바일 네비** | `src/components/kiosk/MobileBottomNav.tsx` |
| **대기 화면** | `src/components/kiosk/StandbyScreen.tsx` |
| **메인 메뉴** | `src/components/kiosk/MainMenu.tsx` |
| **화면 컴포넌트** | `src/components/kiosk/screens/*.tsx` (11개) |
| **PWA** | `src/components/kiosk/ServiceWorkerRegistrar.tsx`, `public/sw.js`, `public/manifest.json` |
| **API** | `src/app/api/logs/route.ts`, `src/app/api/content/route.ts` |
| **DB** | `prisma/schema.prisma`, `src/lib/db.ts` |
| **글로벌 CSS** | `src/app/globals.css` |

---

## 부록 B: 아키텍처 결정 요약

| ADR | 결정 | 대안 | 핵심 근거 |
|-----|------|------|-----------|
| ADR-001 | Zustand 상태 관리 | Context API, Redux | 1.1KB, 선택적 구독, 보일러플레이트 최소 |
| ADR-002 | Web Speech API TTS | 서버 TTS SDK | 오프라인, 무료, <50ms 지연 |
| ADR-003 | CSS zoom 글꼴 확대 | Tailwind text-* | 전체 비례 확대, 레이아웃 보존 |
| ADR-004 | useEffect+ref hydration 대응 | 조건부 className/style | hydration mismatch 방지 |
| ADR-005 | AnimatePresence 화면 전환 | React Router | SPA 단순성, exit 애니메이션 보장 |
| ADR-006 | SQLite DB | PostgreSQL | 임베디드, 무설정, 로컬 I/O |
