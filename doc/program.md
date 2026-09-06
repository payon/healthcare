# Biogram MINI 헬스케어 장비 이용 교육 키오스크 — 프로그래밍/구현 문서

## 1. 프로젝트 설정

| 항목 | 내용 |
|------|------|
| 프레임워크 | Next.js 16 (App Router) |
| 언어 | TypeScript 5 (strict 모드) |
| 패키지 매니저 | bun |
| 번들러 | Turbopack (Next.js 16 내장) |
| 스�일링 | Tailwind CSS 4 + shadcn/ui (New York 스타일) |
| 상태 관리 | Zustand 5 (클라이언트 상태) |
| 애니메이션 | Framer Motion 12 |
| 아이콘 | Lucide React |
| 데이터베이스 | Prisma ORM + SQLite (`db/custom.db`) |
| PWA | manifest.json + sw.js (cache-first 전략) |
| 폰트 | Noto Sans KR (Google Fonts, 가변 폰트) |

### 실행 스크립트

```json
{
  "dev": "next dev -p 3000 2>&1 | tee dev.log",
  "lint": "eslint .",
  "db:push": "prisma db push --accept-data-loss",
  "db:generate": "prisma generate"
}
```

---

## 2. 디렉토리 구조

```
prisma/
  schema.prisma              # DB 스키마 (3 모델)
public/
  manifest.json              # PWA 매니페스트
  sw.js                      # 서비스 워커
  pwa-icon-192.png           # PWA 아이콘 192
  pwa-icon-512.png           # PWA 아이콘 512
  apple-touch-icon.png       # iOS 홈 화면 아이콘
  kiosk-images/
    equipment.png            # 장비 이미지
    location.png             # 위치 이미지
src/
  app/
    layout.tsx               # 루트 레이아웃 (폰트, SW, Toaster)
    page.tsx                 # 메인 페이지 (AnimatePresence 화면 전환)
    globals.css              # 글로벌 스타일 (oklch 테마, 키오스크 클래스)
    api/
      logs/route.ts          # POST 로그 기록, GET 로그 조회
      content/route.ts       # GET 콘텐츠 조회, PUT 콘텐츠 갱신
  components/
    kiosk/
      KioskHeader.tsx        # 화면 헤더 (뒤로가기, 홈, 타이틀)
      KioskFooter.tsx        # 화면 푸터
      ContentLayout.tsx      # 공통 레이아웃 래퍼
      AccessibilityToolbar.tsx # 접근성 툴바 (모바일/데스크톱/TTS 인디케이터)
      MobileBottomNav.tsx    # 모바일 하단 네비게이션 (5탭)
      MainMenu.tsx           # 메인 메뉴 (데스크톱 그리드 + 모바일 스크롤)
      StandbyScreen.tsx      # 대기 화면
      ServiceWorkerRegistrar.tsx # PWA 설치 버튼
      screens/
        EquipmentIntro.tsx   # 장비 소개
        LocationGuide.tsx    # 설치 위치 안내
        AppInstall.tsx       # 앱 설치 안내
        Signup.tsx           # 회원가입 안내
        VeinRegister.tsx     # 지정맥 등록 안내
        LoginGuide.tsx       # 로그인 안내
        NonMember.tsx        # 비회원 이용 안내
        MeasurementMode.tsx  # 측정 모드 안내
        MeasurementEquipment.tsx # 측정 장비 안내
        ResultsGuide.tsx     # 결과 확인 안내
        CompletionScreen.tsx # 교육 완료
    ui/                      # shadcn/ui 컴포넌트 (Card, Button, Progress 등)
  hooks/
    use-tts.ts               # TTS (음성 안내) 커스텀 훅
    use-mobile.ts            # 모바일 감지 훅
    use-toast.ts             # 토스트 알림 훅
  lib/
    tts-texts.ts             # 화면별 TTS 한국어 텍스트
    db.ts                    # Prisma 클라이언트 싱글톤
    utils.ts                 # cn() 유틸리티
  store/
    kiosk-store.ts           # Zustand 키오스크 상태 스토어
db/
  custom.db                  # SQLite 데이터베이스 파일
doc/
  program.md                 # 본 문서
  interface.md               # 인터페이스 사양 문서
```

---

## 3. 핵심 구현 상세

### 3.1 kiosk-store.ts — Zustand 상태 관리

```typescript
export type Screen =
  | 'standby' | 'main' | 'equipment-intro' | 'location' | 'app-install'
  | 'signup' | 'vein-register' | 'login' | 'non-member'
  | 'measurement-mode' | 'measurement-equipment' | 'results' | 'completion';
```

**상태 필드:**

| 필드 | 타입 | 설명 |
|------|------|------|
| `currentScreen` | `Screen` | 현재 활성 화면 |
| `history` | `Screen[]` | 화면 이동 히스토리 (뒤로가기용) |
| `sessionId` | `string` | 현재 세션 고유 ID |
| `sessionStarted` | `boolean` | 세션 활성 여부 |
| `isMobile` | `boolean` | 모바일 기기 여부 (768px 기준) |
| `visitedScreens` | `Set<Screen>` | 방문한 콘텐츠 화면 집합 |
| `fontSize` | `'normal' \| 'large' \| 'xlarge'` | 글꼴 크기 설정 |
| `idleTimer` | `ReturnType<typeof setTimeout> \| null` | 유휴 타이머 핸들 |
| `ttsEnabled` | `boolean` | TTS 음성 안내 활성 여부 |
| `highContrast` | `boolean` | 고대비 모드 활성 여부 |

**액션 로직:**

- **`navigateTo(screen)`** — `currentScreen`을 `history`에 push → 새 화면으로 전환 → `visitedScreens`에 추가 → `sessionStarted`인 경우 `logEvent(screen, 'navigate', from)` 호출 → `resetIdleTimer()`
- **`goBack()`** — `history`가 비면 `main`으로 이동, 아니면 마지막 화면으로 pop → `logEvent` + `resetIdleTimer()`
- **`goHome()`** — `currentScreen`을 `main`으로, `history`를 빈 배열로 초기화 → `logEvent('main', 'home', from)` + `resetIdleTimer()`
- **`startSession()`** — `generateId()`로 sessionId 생성 → 상태 초기화 후 `main` 화면으로 → `logEvent('main', 'session_start', 'standby')` + `resetIdleTimer()`
- **`endSession()`** — `logEvent('standby', 'session_end', from)` → idleTimer 해제 → 모든 상태 초기화 후 `standby` 화면으로
- **`resetIdleTimer()`** — `sessionStarted`가 아니면 무시 → 기존 타이머 해제 → **120초(`IDLE_TIMEOUT_MS = 120_000`)** 후 `endSession()` 자동 호출
- **`setFontSize(s)`** / **`setTtsEnabled(v)`** / **`setHighContrast(v)`** — 해당 상태 직접 설정

**useProgress 훅:**

```typescript
export function useProgress() {
  const visited = useKioskStore((s) => s.visitedScreens);
  const visitedCount = TOTAL_CONTENT_SCREENS.filter((s) => visited.has(s)).length;
  return {
    visitedCount,       // 방문한 콘텐츠 화면 수 (최대 10)
    total: 10,          // 전체 콘텐츠 화면 수
    percent,            // 퍼센트 (0~100)
  };
}
```

`TOTAL_CONTENT_SCREENS`는 `equipment-intro`, `location`, `app-install`, `signup`, `vein-register`, `login`, `non-member`, `measurement-mode`, `measurement-equipment`, `results`의 10개 화면.

**logEvent 비동기 함수:**

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

실패 시 조용히 무시 (try/catch with empty catch).

---

### 3.2 page.tsx — 메인 페이지 엔트리포인트

```typescript
'use client';
```

**핵심 구조:**

1. **AnimatePresence + motion.div**
   - `key={currentScreen}`으로 화면 전환 시 자동 마운트/언마운트 트리거
   - `pageVariants`: `{ initial: {opacity:0, y:20}, animate: {opacity:1, y:0}, exit: {opacity:0, y:-20} }`
   - `transition={{ duration: 0.25, ease: 'easeInOut' }}`
   - `mode="wait"`로 이전 화면 exit 완료 후 새 화면 진입

2. **ScreenRenderer** — `switch(currentScreen)`으로 13개 화면 컴포넌트 렌더링

3. **useTTS({ autoSpeak: true })** — page.tsx에서만 `autoSpeak: true` 설정 (이중 재생 방지)

4. **모바일 감지** — `useEffect`에서 `window.innerWidth < 768`로 `setMobile()` 호출, `resize` 이벤트 리스너 등록

5. **유휴 타이머 리셋** — `sessionStarted`인 경우 `touchstart`, `mousedown`, `keydown`, `scroll` 이벤트에서 `resetIdleTimer()` 호출 (passive: true)

6. **zoom / 고대비 / 배경색 적용 (ref 방식)**
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
   - `useEffect` 내에서 DOM 직접 조작하여 **hydration mismatch 방지**
   - `zoom` CSS 속성으로 글꼴 크기 확대 (large: 1.15배, xlarge: 1.3배)

---

### 3.3 use-tts.ts — TTS 커스텀 훅

```typescript
interface UseTTSOptions {
  autoSpeak?: boolean;  // 화면 전환 시 자동 읽기 여부
}

export function useTTS(options?: UseTTSOptions): { speak, speakIntro, speakFull, stop }
```

**TTS 파라미터:**

| 파라미터 | 값 |
|----------|-----|
| `SPEECH_RATE` | 0.85 (느린 속도) |
| `SPEECH_PITCH` | 1.0 |
| `SPEECH_VOLUME` | 1.0 |

**getKoreanVoice():**
1. `speechSynthesis.getVoices()`에서 `lang.startsWith('ko')`인 음성 검색
2. 없으면 `lang.includes('KO')` 또는 `lang.includes('kr')` 또는 `name.includes('Korean')` 검색
3. 모두 없으면 기본 음성(`voices[0]`) 또는 `null`

**speak(text):**
- `speechSynthesis.cancel()`로 기존 음성 정지 → `SpeechSynthesisUtterance` 생성 → 한국어 음성 설정 또는 `lang='ko-KR'` 대체 → `speechSynthesis.speak()`

**speakIntro() / speakFull():**
- `ttsTexts[currentScreen]`에서 `intro` / `full` 텍스트 가져와 `speak()` 호출
- `full`이 없으면 `intro`로 대체

**autoSpeak 가드 (화면 전환 자동 읽기):**
```typescript
useEffect(() => {
  if (!options?.autoSpeak) return;
  if (currentScreen === prevScreenRef.current) return;
  prevScreenRef.current = currentScreen;
  if (!ttsEnabled) return;
  if (currentScreen === 'standby') return;

  // voiceschanged 대기: 음성 목록이 아직 로드되지 않은 경우
  const voices = window.speechSynthesis.getVoices();
  if (voices.length > 0) {
    trySpeak();
  } else {
    window.speechSynthesis.addEventListener('voiceschanged', handler);
    setTimeout(trySpeak, 500);  // 폴백 타임아웃
  }
}, [currentScreen, ttsEnabled, speakIntro, options?.autoSpeak]);
```

**정리 로직:**
- 컴포넌트 언마운트 시 `speechSynthesis.cancel()`
- `ttsEnabled`가 `false`로 변경되면 즉시 `stop()`

---

### 3.4 tts-texts.ts — 화면별 TTS 텍스트

```typescript
export interface TTSContent {
  intro: string;   // 화면 진입 시 자동 읽기 텍스트
  full?: string;   // "다시 듣기" 전체 읽기 텍스트
}

export const ttsTexts: Record<Screen, TTSContent> = { ... };
```

**13개 화면별 텍스트 요약:**

| 화면 | intro 요약 | full 제공 |
|------|-----------|-----------|
| standby | 키오스크 소개, 터치 안내 | ❌ |
| main | 메인 메뉴, 10개 교육 항목 나열 | ✅ (상세 설명) |
| equipment-intro | 장비 소개, 7가지 측정 항목 | ✅ (항목별 상세) |
| location | 1층 로비 설치 안내 | ✅ (경로, 이용시간) |
| app-install | 앱 설치 안내 | ✅ (앱스토어/QR 2가지 방법) |
| signup | 회원가입 4단계 | ✅ (단계별 상세) |
| vein-register | 지정맥 등록 안내 | ✅ (4단계 + 주의사항 5가지) |
| login | 로그인 2가지 방법 | ✅ (지정맥/QR + 주의사항) |
| non-member | 비회원 이용 안내 | ✅ (4단계 + 주의사항) |
| measurement-mode | 측정 진행 순서 | ✅ (6단계 상세) |
| measurement-equipment | 측정 장비별 사용법 | ✅ (6가지 장비 상세) |
| results | 결과 확인 3가지 방법 | ✅ (방법별 상세) |
| completion | 교육 완료 축하 | ✅ (학습 내용 정리) |

모든 텍스트는 한국어로 작성됨.

---

### 3.5 AccessibilityToolbar.tsx — 접근성 툴바

**3개 하위 컴포넌트로 구성:**

#### MobileToolbar (인라인)
- 상단에 `flex flex-wrap`으로 인라인 배치
- 글꼴 크기: 3개 버튼 (보통/크게/아주 크게) — `aria-pressed`로 활성 상태 표시
- TTS 토글: `Volume2`/`VolumeX` 아이콘 전환
- 고대비 토글: `Eye` 아이콘
- 구분선: `bg-border` 세로선
- 반응형: `md:hidden` (모바일에서만 표시)

#### DesktopToolbar (플로팅 패널)
- `fixed right-4 top-4 z-40` 위치, `hidden md:block` (데스크톱에서만 표시)
- 메인 버튼: `Type` 아이콘 원형 버튼 → 클릭 시 패널 토글
- 패널: `AnimatePresence` + `motion.div`로 확장/축소 애니메이션
  - 글꼴 크기 섹션: 3개 선택 버튼
  - TTS 섹션: 켜기/끄기 + 활성 시 "요약 듣기"/"전체 듣기" 버튼
  - 고대비 섹션: 켜기/끄기
- 상태 뱃지: 활성 기능 수 표시 (빨간 원형, `bg-destructive`)

#### TTSIndicator (재생 중 표시)
- `speechSynthesis.speaking`을 300ms 폴링으로 추적
- 재생 중일 때만 `fixed bottom-[4.5rem]` (모바일) / `bottom-6` (데스크톱)에 표시
- "음성 안내 중..." 텍스트 + "요약" / "전체" 다시 듣기 버튼
- `tts-speaking` 클래스로 1.5초 펄스 애니메이션 적용

---

### 3.6 ContentLayout.tsx — 공통 레이아웃 래퍼

```typescript
interface ContentLayoutProps {
  title?: string;
  children: ReactNode;
  notice?: string;
}
```

**구조:**
```
div (min-h-screen flex flex-col bg-background)
├── KioskHeader
├── AccessibilityToolbar
├── main (flex-1 overflow-y-auto kiosk-scroll pb-bottom-nav md:pb-6)
│   └── div (max-w-4xl mx-auto)
│       ├── h2 (title, 선택적)
│       ├── children
│       └── notice-box (notice, 선택적)
├── KioskFooter (hidden md:block)
└── MobileBottomNav (md:hidden)
```

- `useTTS()` 호출 시 `autoSpeak` 미지정 → 자동 읽기 안 함, 수동 재생만 지원
- `pb-bottom-nav`: 모바일 하단 네비게이션 높이만큼 하단 패딩 (`4.5rem + safe-area-inset-bottom`)

---

### 3.7 MobileBottomNav.tsx — 모바일 하단 네비게이션

**5개 탭 정의:**

| 키 | 라벨 | 아이콘 | 기본 화면 | 매칭 화면 |
|----|------|--------|-----------|-----------|
| home | 홈 | Home | main | main, standby |
| equipment | 장비 | Activity | equipment-intro | equipment-intro |
| guide | 안내 | BookOpen | signup | signup, vein-register, login |
| measure | 측정 | Stethoscope | measurement-mode | measurement-mode, measurement-equipment, results |
| more | 더보기 | Menu | main | location, app-install, non-member, completion |

**구현:**
- `role="tablist"`, 각 버튼 `role="tab"` + `aria-selected`
- `fixed inset-x-0 bottom-0 z-50` 고정 위치
- `pb-[env(safe-area-inset-bottom)]`로 iOS safe area 대응
- 활성 탭: `text-primary`, 점 표시 (`bg-primary`), 아이콘 `strokeWidth: 2.5`
- 비활성 탭: `text-muted-foreground`, `strokeWidth: 2`
- 최소 높이 56px 터치 타겟 보장
- `active:scale-95` 탭 피드백

---

### 3.8 StandbyScreen.tsx — 대기 화면

**구조:**
- 배경: `bg-gradient-to-br from-teal-500 via-emerald-600 to-green-800` 그라디언트
- 장식 원: 3개 `bg-white/5` 원형 (포인터 이벤트 없음)
- 접근성 토글: 우측 상단 TTS/고대비 버튼 (반투명 원형)
- Activity 아이콘: `motion.div` fade-in + slide-up 애니메이션
- 제목: "Biogram MINI" (text-5xl/md:text-7xl, font-extrabold)
- 부제목: "헬스케어 장비 이용 교육" (text-white/80)
- 시작 버튼: `startSession()` 호출, `whileHover`/`whileTap` 스케일 애니메이션, 내부 텍스트 opacity 펄스 (2초 반복)
- 하단 안내: "화면을 터치하면 교육이 시작됩니다" (text-white/50)

---

### 3.9 MainMenu.tsx — 메인 메뉴

**데스크톱 (md 이상):**
- 3칼럼 그리드 (`grid-cols-3 gap-4`)
- 11개 메뉴 아이템 (마지막 "실제 장비로 이동"은 `col-span-3` CTA)
- 각 아이템: 아이콘 + 라벨 + 설명, `whileHover`/`whileTap` 애니메이션
- staggerChildren: 0.04초 순차 등장

**모바일 (md 미만):**
- 수평 스크롤 카드 (`snap-x snap-mandatory`)
- 9개 카드 (최소 너비 140px, `snap-start`)
- 하단 고정 CTA 버튼: "실제 장비로 이동" (`fixed bottom-[60px]`)

**공통:**
- ProgressBar: `useProgress()` 훅으로 학습 진행률 표시 (방문/전체, 퍼센트, 애니메이션 바)
- NoticeBox: "본 교육 키오스크는 안내 목적이며, 실제 측정은 현장 Biogram MINI 장비에서 진행됩니다."

---

### 3.10 화면 컴포넌트 (10개)

모든 화면은 `ContentLayout` 래퍼를 사용하며, Framer Motion으로 등장 애니메이션을 적용한다.

#### EquipmentIntro
- 장비 이미지 (`/kiosk-images/equipment.png`, Next.js Image 최적화)
- 7개 측정 항목 카드: 스트레스, 혈압, 악력, 체성분, 피부, 신장, 종합 점수
- 각 카드: `measure-*` CSS 클래스로 좌측 컬러 보더
- 2칼럼 그리드 (md)

#### LocationGuide
- 위치 이미지 + 건물 내 경로 안내
- 이용 가능 시간, 접근성 정보

#### AppInstall
- 앱스토어 검색 방법 + QR 코드 스캔 방법
- 2칼럼 카드 레이아웃

#### Signup
- 4단계 회원가입 절차
- 단계 표시기 (step-dot/active/completed)

#### VeinRegister
- 4단계 지정맥 등록 절차
- 주의사항 5가지 (warning-box)

#### LoginGuide
- 지정맥 로그인 + QR 코드 로그인 2가지 방법
- 주의사항 안내

#### NonMember
- 비회원 4단계 이용 절차
- 주의사항 (결과 미저장 등)

#### MeasurementMode
- 전체측정 카드: 6단계 플로우 다이어그램 (순서 번호 + ChevronRight 화살표)
- 선택측정 카드: 4가지 특징 목록
- 소요 시간 표시

#### MeasurementEquipment
- 6가지 장비별 상세 사용법 카드
- 각 카드: `measure-*` 클래스 + 준비사항 + 주의사항

#### ResultsGuide
- 3가지 결과 확인 방법: 장비 화면, 앱, 문자
- 각 방법별 상세 안내

#### CompletionScreen
- CheckCircle 성공 아이콘
- 6가지 학습 내용 요약
- CTA: "실제 장비에서 측정 시작하기" → `endSession()`
- 보조: "처음으로 돌아가기" → `endSession()`
- 장비 위치 리마인더

---

## 4. CSS 구현 — globals.css

### 4.1 oklch 테마

`:root`에서 oklch 색상 공간으로 모든 디자인 토큰 정의:

| 토큰 | oklch 값 | 용도 |
|------|----------|------|
| `--primary` | `oklch(0.52 0.14 165)` | 주 색상 (틸/에메랄드) |
| `--background` | `oklch(0.985 0.002 155)` | 배경 (밝은 녹색 톤) |
| `--foreground` | `oklch(0.175 0.015 160)` | 전경 (어두운 녹색 톤) |
| `--destructive` | `oklch(0.577 0.245 27.325)` | 위험/오류 (빨간색) |

### 4.2 키오스크 유틸리티 클래스

| 클래스 | 설명 |
|--------|------|
| `.kiosk-touch-target` | `min-height: 64px; min-width: 64px` |
| `.kiosk-btn` | 기본 버튼 (64px 최소 높이, rounded-xl, text-lg) |
| `.kiosk-btn-primary` | 주 버튼 (bg-primary, 64px 최소 높이) |
| `.kiosk-btn-secondary` | 보조 버튼 (bg-secondary) |
| `.kiosk-btn-outline` | 아웃라인 버튼 (border-2) |
| `.kiosk-card` | 카드 (rounded-2xl, shadow-sm, hover:shadow-md) |
| `.warning-box` | 경고 박스 (border-amber-400, bg-amber-50) |
| `.notice-box` | 안내 박스 (border-primary/30, bg-primary/5) |
| `.step-dot` | 단계 점 표시기 |
| `.step-dot.active` | 활성 단계 (bg-primary, scale-110) |
| `.step-dot.completed` | 완료 단계 (bg-primary/60) |

### 4.3 측정 카드 컬러 클래스

| 클래스 | 보더 색상 |
|--------|-----------|
| `.measure-stress` | `border-l-rose-400` |
| `.measure-height` | `border-l-sky-400` |
| `.measure-bp` | `border-l-amber-400` |
| `.measure-grip` | `border-l-violet-400` |
| `.measure-body` | `border-l-emerald-400` |
| `.measure-skin` | `border-l-pink-400` |

### 4.4 고대비 오버라이드

`.high-contrast` 클래스 적용 시:
- 배경/전경: 블랙 앤 화이트 최대 대비 (`oklch(0.08 0 0)` / `oklch(1 0 0)`)
- primary: 밝은 녹색 (`oklch(0.85 0.18 145)`)
- 카드/버튼/박스: 보더 두께 3px 강화, 고대비 색상 오버라이드
- 측정 카드: 보더 두께 6px로 강화, 채도 높은 색상
- 이미지: 2px 보더 추가
- 스크롤바: 고대비 색상

### 4.5 애니메이션

| 이름 | 정의 |
|------|------|
| `pulse-glow` | 3초 ease-in-out 무한 펄스 (opacity + scale) |
| `float-up` | 4초 ease-in-out 무한 부동 (translateY) |
| `progress-fill` | 0.6초 ease-out 너비 증가 |
| `tap-pulse` | 0.15초 ease-out 탭 피드백 |
| `tts-pulse` | 1.5초 ease-in-out 무한 펄스 (opacity) |

### 4.6 스냅 스크롤

- `.snap-x-mandatory`: `scroll-snap-type: x mandatory; -webkit-overflow-scrolling: touch`
- `.snap-start`: `scroll-snap-align: start`
- `.scrollbar-hide`: 스크롤바 숨김

### 4.7 Safe Area

- `.pb-safe`: `padding-bottom: env(safe-area-inset-bottom, 0px)`
- `.pb-bottom-nav`: `padding-bottom: calc(4.5rem + env(safe-area-inset-bottom, 0px))`

### 4.8 커스텀 스크롤바

`.kiosk-scroll`: 8px 너비, `bg-primary/20` 썸, `bg-primary/40` hover

---

## 5. PWA 구현

### 5.1 manifest.json

```json
{
  "name": "Biogram MINI 헬스케어 장비 이용 교육",
  "short_name": "바이오그램 교육",
  "display": "standalone",
  "orientation": "any",
  "background_color": "#f0fdfa",
  "theme_color": "#0d9488",
  "lang": "ko",
  "icons": [
    { "src": "/pwa-icon-512.png", "sizes": "512x512", "purpose": "any maskable" },
    { "src": "/pwa-icon-192.png", "sizes": "192x192", "purpose": "any maskable" }
  ]
}
```

### 5.2 sw.js — 서비스 워커

- **캐시 이름**: `biogram-mini-v1`
- **정적 자산 프리캐시**: `/`, `/manifest.json`, `/pwa-icon-192.png`, `/pwa-icon-512.png`, `/kiosk-images/equipment.png`, `/kiosk-images/location.png`
- **install**: `cache.addAll(STATIC_ASSETS)` → `skipWaiting()`
- **activate**: 이전 캐시 삭제 → `clients.claim()`
- **fetch 전략**: cache-first (`/api/` 요청은 제외)
  - 캐시 히트 시 캐시 반환
  - 캐시 미스 시 네트워크 페치 → 200 응답 시 캐시에 저장
  - 네트워크 실패 시 캐시 폴백

### 5.3 ServiceWorkerRegistrar.tsx

- `navigator.serviceWorker.register('/sw.js')` 등록
- `beforeinstallprompt` 이벤트 가로채기 → `e.preventDefault()` → 상태 저장
- `window.matchMedia('(display-mode: standalone)')`로 이미 설치 여부 확인
- 설치 버튼: `fixed bottom-20 right-4 z-50` (모바일) / `bottom-4` (데스크톱)
- `appinstalled` 이벤트로 설치 완료 감지 → 버튼 숨김

---

## 6. DB/Prisma

### 6.1 schema.prisma — 3개 모델

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

- DB 파일: `db/custom.db` (SQLite)
- 클라이언트: `import { db } from '@/lib/db'`

### 6.2 /api/logs

- **POST**: `{ sessionId, eventType, screen, detail }` → `KioskLog.create()` → `{ success: true }`
- **GET**: 최근 100개 로그 조회 (`orderBy: createdAt desc`)

### 6.3 /api/content

- **GET**: 모든 콘텐츠 조회 (`orderBy: section asc`)
- **PUT**: `{ section, title, body, imageUrl, qrCodeUrl }` → `KioskContent.upsert()` (section 기준)

---

## 7. 코딩 컨벤션

### 7.1 클라이언트 컴포넌트

모든 키오스크 컴포넌트 파일 최상단에 `'use client'` 지시어 필수 (Zustand, Framer Motion, Web Speech API 등 브라우저 API 사용).

### 7.2 TypeScript

- strict 모드 활성화
- 모든 함수 매개변수 및 반환값에 타입 명시
- `interface`로 props 타입 정의
- 제네릭 타입 적극 활용 (`Record<Screen, T>`, `Set<Screen>` 등)

### 7.3 Tailwind 유틸리티 클래스

- 인라인 클래스 우선 (별도 CSS 파일 최소화)
- 반응형 접두사: `md:` (768px), `sm:` (640px)
- shadcn/ui CSS 변수 사용: `bg-primary`, `text-foreground`, `bg-card` 등
- 커스텀 클래스: `kiosk-btn`, `kiosk-card`, `warning-box`, `notice-box`, `measure-*`

### 7.4 한국어 문자열

- 모든 사용자 표시 텍스트는 한국어로 하드코딩
- TTS 텍스트는 `tts-texts.ts`에 중앙 집중 관리
- 화면 제목, 버튼 라벨, 안내 문구 등 모두 한국어

### 7.5 64px 터치 타겟

- 모든 인터랙티브 요소: `min-height: 64px` (WCAG 2.5.8)
- `kiosk-btn*` 클래스에 기본 적용
- 버튼/탭: 추가로 `min-h-12`~`min-h-20` 지정
- 모바일 하단 네비게이션 탭: `min-h-[56px]`

### 7.6 애니메이션

- 화면 전환: `AnimatePresence` + `motion.div` (fade + slide)
- 카드 등장: `staggerChildren` 순차 애니메이션
- 버튼: `whileHover={{ scale: 1.03 }}`, `whileTap={{ scale: 0.97 }}`
- 조건부 렌더링: `AnimatePresence`로 마운트/언마운트 애니메이션

### 7.7 접근성

- `aria-label` 모든 인터랙티브 요소에 필수
- `aria-pressed` 토글 버튼에 필수
- `aria-selected` 탭에 필수
- `role="tablist"`, `role="tab"`, `role="toolbar"`, `role="dialog"` 시맨틱 역할
- `sr-only` 클래스로 스크린 리더 전용 콘텐츠
