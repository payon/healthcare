# Biogram MINI 헬스케어 장비 이용 교육 키오스크 — 인터페이스 사양 문서

## 1. 사용자 인터페이스 사양

### 1.1 화면 개요

키오스크는 총 13개 화면으로 구성되며, 각 화면은 공통 레이아웃(KioskHeader, AccessibilityToolbar, main, KioskFooter/MobileBottomNav)을 따른다.

| # | 화면 ID | 화면명 | 입력 | 출력 |
|---|---------|--------|------|------|
| 1 | `standby` | 대기 화면 | 터치/클릭 (시작 버튼), 접근성 토글 | 세션 시작 → `main` 화면 전환, TTS/고대비 상태 변경 |
| 2 | `main` | 메인 메뉴 | 메뉴 아이템 터치/클릭 | 해당 화면으로 전환, TTS intro 재생 |
| 3 | `equipment-intro` | 장비 소개 | 뒤로가기/홈/다음 터치 | 화면 전환, TTS 재생 |
| 4 | `location` | 설치 위치 안내 | 뒤로가기/홈 터치 | 화면 전환, TTS 재생 |
| 5 | `app-install` | 앱 설치 안내 | 뒤로가기/홈 터치 | 화면 전환, TTS 재생 |
| 6 | `signup` | 회원가입 안내 | 뒤로가기/홈/단계 터치 | 화면 전환, TTS 재생 |
| 7 | `vein-register` | 지정맥 등록 안내 | 뒤로가기/홈 터치 | 화면 전환, TTS 재생 |
| 8 | `login` | 로그인 안내 | 뒤로가기/홈 터치 | 화면 전환, TTS 재생 |
| 9 | `non-member` | 비회원 이용 안내 | 뒤로가기/홈 터치 | 화면 전환, TTS 재생 |
| 10 | `measurement-mode` | 측정 모드 안내 | 뒤로가기/홈 터치 | 화면 전환, TTS 재생 |
| 11 | `measurement-equipment` | 측정 장비 안내 | 뒤로가기/홈 터치 | 화면 전환, TTS 재생 |
| 12 | `results` | 결과 확인 안내 | 뒤로가기/홈 터치 | 화면 전환, TTS 재생 |
| 13 | `completion` | 교육 완료 | CTA 버튼 터치 | 세션 종료 → `standby` 화면 전환 |

### 1.2 각 화면의 구성 요소

#### 공통 구성 (모든 콘텐츠 화면)

```
┌──────────────────────────────────────────────┐
│ KioskHeader (뒤로가기 | 타이틀 | 홈)         │
├──────────────────────────────────────────────┤
│ AccessibilityToolbar                         │
│  모바일: 인라인 (글꼴/TTS/고대비 토글)        │
│  데스크톱: 우측 상단 플로팅 버튼 + 패널      │
├──────────────────────────────────────────────┤
│ main (스크롤 영역)                            │
│  ├── 제목 (h2, 선택적)                       │
│  ├── 본문 콘텐츠                             │
│  └── 안내 박스 (선택적)                       │
├──────────────────────────────────────────────┤
│ 데스크톱: KioskFooter                         │
│ 모바일: MobileBottomNav (5탭)                 │
└──────────────────────────────────────────────┘
```

#### standby 화면

| 요소 | 설명 |
|------|------|
| 배경 | 틸→에메랄드→그린 그라디언트 |
| 장식 | 3개 반투명 원형 |
| 접근성 토글 | 우측 상단 TTS/고대비 버튼 |
| Activity 아이콘 | fade-in + slide-up 애니메이션 |
| 제목 | "Biogram MINI" |
| 부제목 | "헬스케어 장비 이용 교육" |
| 시작 버튼 | "터치하여 시작하기" (펄스 애니메이션) |
| 하단 안내 | "화면을 터치하면 교육이 시작됩니다" |

#### main 화면

| 요소 | 설명 |
|------|------|
| 데스크톱 메뉴 | 3칼럼 그리드, 11개 아이템 (마지막 CTA: col-span-3) |
| 모바일 메뉴 | 수평 스크롤 카드 9개 + 하단 고정 CTA |
| ProgressBar | 학습 진행률 (방문수/10, 퍼센트) |
| NoticeBox | 안내 목적임을 표시 |

#### equipment-intro 화면

| 요소 | 설명 |
|------|------|
| 장비 이미지 | `/kiosk-images/equipment.png` |
| 측정 항목 카드 | 7개 (스트레스/혈압/악력/체성분/피부/신장/종합), 2칼럼 그리드 |

#### location 화면

| 요소 | 설명 |
|------|------|
| 위치 이미지 | `/kiosk-images/location.png` |
| 경로 안내 | 건물 내 장비 위치, 이용 시간 |

#### app-install 화면

| 요소 | 설명 |
|------|------|
| 설치 방법 카드 | 앱스토어 검색, QR 코드 스캔 (2칼럼) |

#### signup 화면

| 요소 | 설명 |
|------|------|
| 단계 표시기 | 4단계 (step-dot) |
| 단계별 상세 | 각 단계 설명 카드 |

#### vein-register 화면

| 요소 | 설명 |
|------|------|
| 단계 표시기 | 4단계 |
| 주의사항 | warning-box (5가지) |

#### login 화면

| 요소 | 설명 |
|------|------|
| 로그인 방법 | 지정맥 로그인, QR 코드 로그인 (2칼럼) |

#### non-member 화면

| 요소 | 설명 |
|------|------|
| 이용 절차 | 4단계 |
| 주의사항 | 결과 미저장 안내 |

#### measurement-mode 화면

| 요소 | 설명 |
|------|------|
| 전체측정 카드 | 6단계 플로우 다이어그램 + 소요 시간 |
| 선택측정 카드 | 4가지 특징 목록 |

#### measurement-equipment 화면

| 요소 | 설명 |
|------|------|
| 장비 카드 | 6개 (스트레스/신장/혈압/악력/체성분/피부), measure-* 컬러 보더 |

#### results 화면

| 요소 | 설명 |
|------|------|
| 결과 확인 방법 | 3가지 (장비 화면, 앱, 문자) |

#### completion 화면

| 요소 | 설명 |
|------|------|
| 성공 아이콘 | CheckCircle (24×24) |
| 학습 요약 | 6가지 항목 체크리스트 |
| CTA 버튼 | "실제 장비에서 측정 시작하기" (primary) |
| 보조 버튼 | "처음으로 돌아가기" (secondary) |
| 위치 리마인더 | "장비 위치: 1층 로비 헬스케어 존" |

---

## 2. 화면 전환 인터페이스

### 2.1 Screen 타입

```typescript
type Screen =
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

총 13개 유니언 값.

### 2.2 navigateTo(screen: Screen) → void

**의미:** 지정한 화면으로 전환

**부수 효과:**
1. `history` 배열에 현재 `currentScreen`을 push
2. `currentScreen`을 `screen`으로 변경
3. `visitedScreens`에 `screen`을 추가 (Set)
4. `sessionStarted`가 `true`인 경우 `logEvent(screen, 'navigate', currentScreen)` 비동기 호출
5. `resetIdleTimer()` 호출 (120초 타이머 리셋)

**화면 전환 애니메이션:**
- AnimatePresence `mode="wait"`: 현재 화면 exit 완료 후 새 화면 진입
- exit: `{ opacity: 0, y: -20 }` (위로 사라짐)
- initial: `{ opacity: 0, y: 20 }` (아래에서 나타남)
- animate: `{ opacity: 1, y: 0 }`
- duration: 0.25초, easeInOut

### 2.3 goBack() → void

**의미:** 이전 화면으로 돌아가기

**로직:**
1. `history`가 빈 배열 → `currentScreen`을 `'main'`으로 설정
2. `history`가 비어 있지 않음 → 마지막 요소를 `currentScreen`으로, `history`에서 pop
3. `logEvent(previous, 'back', currentScreen)` 호출
4. `resetIdleTimer()` 호출

### 2.4 goHome() → void

**의미:** 메인 메뉴로 돌아가기

**로직:**
1. `currentScreen`을 `'main'`으로 설정
2. `history`를 빈 배열로 초기화
3. `logEvent('main', 'home', currentScreen)` 호출
4. `resetIdleTimer()` 호출

### 2.5 startSession() → void

**의미:** 새 세션 시작

**로직:**
1. `sessionId` = `Math.random().toString(36).substring(2, 15) + Date.now().toString(36)` 생성
2. `sessionStarted` = `true`
3. `currentScreen` = `'main'`
4. `history` = `[]`
5. `visitedScreens` = `new Set<Screen>()`
6. `logEvent('main', 'session_start', 'standby')` 호출
7. `resetIdleTimer()` 호출

### 2.6 endSession() → void

**의미:** 세션 종료 및 대기 화면 복귀

**로직:**
1. `logEvent('standby', 'session_end', currentScreen)` 호출
2. `idleTimer` 해제 (`clearTimeout`)
3. 모든 상태 초기화:
   - `currentScreen` = `'standby'`
   - `history` = `[]`
   - `sessionId` = `''`
   - `sessionStarted` = `false`
   - `visitedScreens` = `new Set<Screen>()`
   - `idleTimer` = `null`

---

## 3. 접근성 인터페이스

### 3.1 setFontSize(size: 'normal' | 'large' | 'xlarge') → void

**의미:** 글꼴 크기 설정

**부수 효과:**
- Zustand 스토어 `fontSize` 상태 변경
- `page.tsx`의 `useEffect`에서 컨테이너 `ref`의 `style.zoom` 속성 적용:

| size | zoom 값 | 비율 |
|------|---------|------|
| `'normal'` | `''` (제거) | 100% |
| `'large'` | `'1.15'` | 115% |
| `'xlarge'` | `'1.3'` | 130% |

- CSS `zoom` 속성 사용 → 모든 자식 요소가 비례 확대/축소
- `useEffect` 내에서 DOM 조작하여 hydration mismatch 방지

### 3.2 setTtsEnabled(enabled: boolean) → void

**의미:** TTS 음성 안내 활성/비활성 전환

**부수 효과:**
- Zustand 스토어 `ttsEnabled` 상태 변경
- `false`로 설정 시 `speechSynthesis.cancel()` 즉시 호출 (재생 중인 음성 정지)
- `true`로 설정 + 화면 전환 시 → 자동으로 `speakIntro()` 호출 (autoSpeak 가드)

**TTS 동작 흐름:**
```
화면 전환 발생
  → autoSpeak === true?
    → ttsEnabled === true?
      → currentScreen !== 'standby'?
        → voices 로드 완료?
          → 즉시 speakIntro()
          → 아니면 voiceschanged 대기 + 500ms 폴백
```

### 3.3 setHighContrast(enabled: boolean) → void

**의미:** 고대비 모드 활성/비활성 전환

**부수 효과:**
- Zustand 스토어 `highContrast` 상태 변경
- `page.tsx`의 `useEffect`에서 컨테이너 `classList.toggle('high-contrast', enabled)` 적용

**고대비 모드 CSS 변경 사항:**

| 요소 | 일반 모드 | 고대비 모드 |
|------|-----------|-------------|
| 배경 | 밝은 녹색 톤 | 거의 검은색 (`oklch(0.08 0 0)`) |
| 전경 | 어두운 녹색 톤 | 흰색 (`oklch(1 0 0)`) |
| 카드 보더 | 1px | 3px, 고대비 색상 |
| 버튼 보더 | 기본 | 3px, 고대비 색상 |
| 측정 카드 보더 | 4px | 6px, 채도 높은 색상 |
| 이미지 | 보더 없음 | 2px 보더 |
| 폰트 굵기 | normal | bold (800) |

### 3.4 speakIntro() → void

**의미:** 현재 화면의 요약 음성 안내

**로직:**
1. `ttsTexts[currentScreen].intro` 텍스트 획득
2. `speak(intro)` 호출

**speak(text) 내부:**
1. `speechSynthesis.cancel()` (기존 음성 정지)
2. `SpeechSynthesisUtterance` 생성
3. `rate = 0.85`, `pitch = 1.0`, `volume = 1.0`
4. 한국어 음성 검색 (`getKoreanVoice()`) → 없으면 `lang = 'ko-KR'`
5. `speechSynthesis.speak(utterance)`

### 3.5 speakFull() → void

**의미:** 현재 화면의 전체 음성 안내

**로직:**
1. `ttsTexts[currentScreen].full` 텍스트 획득
2. `full`이 없으면 `intro`로 대체
3. `speak(full || intro)` 호출

### 3.6 stop() → void

**의미:** 음성 안내 즉시 정지

**로직:**
- `speechSynthesis.cancel()` 호출

---

## 4. 모바일 인터페이스

### 4.1 MobileBottomNav — 5탭 하단 네비게이션

**탭 정의:**

| 인덱스 | 키 | 라벨 | 아이콘 | 기본 이동 화면 |
|--------|-----|------|--------|---------------|
| 0 | `home` | 홈 | `Home` | `main` |
| 1 | `equipment` | 장비 | `Activity` | `equipment-intro` |
| 2 | `guide` | 안내 | `BookOpen` | `signup` |
| 3 | `measure` | 측정 | `Stethoscope` | `measurement-mode` |
| 4 | `more` | 더보기 | `Menu` | `main` |

**인터페이스 속성:**
- `role="tablist"` 시맨틱 역할
- 각 탭: `role="tab"`, `aria-selected={isActive}`, `aria-label={label}`
- 고정 위치: `fixed inset-x-0 bottom-0 z-50`
- Safe area: `pb-[env(safe-area-inset-bottom)]`
- 최소 터치 높이: 56px
- 활성 표시: `text-primary` + 하단 점 (`bg-primary`), `strokeWidth: 2.5`
- 비활성: `text-muted-foreground`, `strokeWidth: 2`
- 탭 피드백: `active:scale-95`

### 4.2 화면-탭 매핑

현재 화면에 따라 활성 탭이 결정됨:

| 화면 | 활성 탭 |
|------|---------|
| `standby` | 홈 |
| `main` | 홈 |
| `equipment-intro` | 장비 |
| `signup` | 안내 |
| `vein-register` | 안내 |
| `login` | 안내 |
| `measurement-mode` | 측정 |
| `measurement-equipment` | 측정 |
| `results` | 측정 |
| `location` | 더보기 |
| `app-install` | 더보기 |
| `non-member` | 더보기 |
| `completion` | 더보기 |

**탭 클릭 시 동작:**
- `navigateTo(tab.screen)` 호출
- 예: "장비" 탭 클릭 → `navigateTo('equipment-intro')`
- 예: "안내" 탭 클릭 → `navigateTo('signup')`

---

## 5. PWA 인터페이스

### 5.1 ServiceWorkerRegistrar

**beforeinstallprompt 처리:**

```
브라우저가 beforeinstallprompt 이벤트 발생
  → e.preventDefault() (자동 설치 프롬프트 방지)
  → 이벤트 객체를 상태에 저장
  → 설치 버튼 표시 (visible = true)
```

**설치 버튼:**
- 위치: `fixed bottom-20 right-4 z-50` (모바일), `bottom-4` (데스크톱)
- 라벨: "앱 설치" + 다운로드 아이콘
- 클릭 시: `installPrompt.prompt()` → `installPrompt.userChoice` 대기
- outcome이 `'accepted'` → 설치 완료 처리
- `appinstalled` 이벤트로도 설치 완료 감지

**이미 설치된 경우:**
- `window.matchMedia('(display-mode: standalone)').matches`가 `true` → 버튼 미표시

### 5.2 SW 캐시 전략

**전략: cache-first (네트워크 우선이 아님)**

```
요청 발생
  → /api/ 경로? → 네트워크만 (캐시 미사용)
  → GET 요청? 
    → 캐시 히트? → 캐시 응답 반환
    → 캐시 미스? → 네트워크 페치
      → 200 응답? → 캐시에 저장 후 응답 반환
      → 네트워크 실패? → 캐시 폴백 (있으면)
  → 비-GET 요청? → 네트워크만
```

**프리캐시 자산 (install 시점):**

| 자산 | 설명 |
|------|------|
| `/` | 앱 루트 |
| `/manifest.json` | PWA 매니페스트 |
| `/pwa-icon-192.png` | 소형 아이콘 |
| `/pwa-icon-512.png` | 대형 아이콘 |
| `/kiosk-images/equipment.png` | 장비 이미지 |
| `/kiosk-images/location.png` | 위치 이미지 |

**캐시 갱신:**
- SW 버전 업 → `CACHE_NAME` 변경 (예: `biogram-mini-v2`) → activate에서 이전 캐시 삭제

---

## 6. 세션 인터페이스

### 6.1 sessionId

- **타입:** `string`
- **생성 방식:** `Math.random().toString(36).substring(2, 15) + Date.now().toString(36)`
- **생성 시점:** `startSession()` 호출 시
- **특성:** 고유성 보장 (랜덤 13자리 + 타임스탬프 base36)
- **초깃값:** `''` (빈 문자열, 세션 미시작 상태)
- **종료 시:** `''`로 리셋

### 6.2 visitedScreens

- **타입:** `Set<Screen>`
- **초깃값:** `new Set<Screen>()` (빈 집합)
- **추가 시점:** `navigateTo(screen)` 호출 시마다 `screen`을 집합에 추가
- **용도:** 학습 진행률 계산, 중복 방문 방지 불필요 (Set 자체 중복 불가)
- **리셋 시점:** `startSession()`, `endSession()` 시 빈 집합으로 초기화

### 6.3 useProgress()

```typescript
function useProgress(): {
  visitedCount: number;   // 방문한 콘텐츠 화면 수 (0~10)
  total: number;          // 전체 콘텐츠 화면 수 (항상 10)
  percent: number;        // 진행률 퍼센트 (0~100)
}
```

**계산 로직:**
```typescript
const TOTAL_CONTENT_SCREENS: Screen[] = [
  'equipment-intro', 'location', 'app-install', 'signup',
  'vein-register', 'login', 'non-member', 'measurement-mode',
  'measurement-equipment', 'results',
];

const visitedCount = TOTAL_CONTENT_SCREENS.filter((s) => visitedScreens.has(s)).length;
const percent = Math.round((visitedCount / 10) * 100);
```

**특성:**
- `standby`, `main`, `completion`은 진행률에 포함되지 않음
- Zustand 셀렉터로 구독 → `visitedScreens` 변경 시에만 리렌더

### 6.4 idleTimer

- **타임아웃:** 120,000ms (120초 = 2분)
- **시작 시점:** `sessionStarted === true`인 동안 `resetIdleTimer()` 호출 시
- **리셋 트리거:**
  - `navigateTo()`, `goBack()`, `goHome()`, `startSession()` 호출 시
  - 사용자 인터랙션: `touchstart`, `mousedown`, `keydown`, `scroll` 이벤트 (passive: true)
- **타임아웃 시 동작:**
  ```
  120초 경과
    → sessionStarted === true && currentScreen !== 'standby'?
      → logEvent('standby', 'idle_timeout', currentScreen)
      → endSession()
      → standby 화면으로 자동 복귀
      → 모든 상태 초기화
  ```
- **세션 미시작 시:** `resetIdleTimer()` 내에서 `sessionStarted` 검사 후 무시
- **종료 시:** `clearTimeout(idleTimer)`로 타이머 해제

---

## 부록: 인터페이스 요약 다이어그램

```
┌─────────────────────────────────────────────────────────────────┐
│                     키오스크 인터페이스                          │
├─────────────┬─────────────┬─────────────┬──────────────────────┤
│ 화면 전환   │ 접근성      │ 모바일      │ 세션                 │
├─────────────┼─────────────┼─────────────┼──────────────────────┤
│ navigateTo  │ setFontSize │ BottomNav   │ startSession         │
│ goBack      │ setTtsEnabl│ 5탭         │ endSession           │
│ goHome      │ setHighCont│ 화면-탭매핑 │ sessionId            │
│ Screen(13)  │ speakIntro  │ safe-area   │ visitedScreens       │
│             │ speakFull   │             │ useProgress()        │
│             │ stop        │             │ idleTimer(120s)      │
├─────────────┴─────────────┴─────────────┴──────────────────────┤
│                        PWA 인터페이스                           │
├─────────────────────────┬──────────────────────────────────────┤
│ ServiceWorkerRegistrar  │ SW 캐시 전략                        │
│ beforeinstallprompt     │ cache-first                         │
│ 앱 설치 버튼            │ /api/ 제외                          │
│ standalone 감지         │ 프리캐시 6자산                      │
└─────────────────────────┴──────────────────────────────────────┘
```
