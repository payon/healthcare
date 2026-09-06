# Biogram MINI 헬스케어 장비 이용 교육 키오스크 — UI/UX 디자인 문서

> 버전: 1.0.0  
> 최종 수정: 2026-03-05  
> 작성자: Biogram MINI 개발팀

---

## 1. 디자인 철학

### 핵심 철학: **"터치 한 번으로 이해하기"**

본 키오스크의 사용자는 디지털 친숙도가 낮은 어르신들이다. 모든 UI 결정은 다음 세 가지 원칙에 기반한다.

| 원칙 | 의미 | 구현 지침 |
|------|------|-----------|
| **노인 친화적** | 시각·운동·인지 저하를 고려한 설계 | 큰 글씨, 큰 터치 영역, 높은 대비, 느린 애니메이션, 단순한 내비게이션 |
| **직관적** | 설명 없이도 조작법을 이해할 수 있는 설계 | 명확한 아이콘, 일관된 레이아웃, 예측 가능한 동작, 최소 단계 |
| **여유로운** | 조급함·불안을 유발하지 않는 설계 | 충분한 여백, 부드러운 전환, 되돌리기 가능, 실수 방지 가드 |

### 디자인 원칙 세부

1. **64px 최소 터치 타겟**: 모든 버튼·링크·인터랙티브 요소는 64×64px 이상. WCAG 2.5.8 Target Size Enhanced 준수
2. **3단계 심화**: 각 교육 화면은 한눈에 요약 → 단계별 상세 → 전체 음성 안내로 심화. 사용자가 원하는 깊이까지 탐색
3. **되돌리기 보장**: 모든 화면에서 뒤로가기·홈 이동 가능. "잘못 누르면 어떡하지?" 불안 해소
4. **피드백 즉각성**: 터치 시 시각·촉각(active:scale-95)·음성(TTS) 즉각 피드백
5. **일관성**: 모든 화면이 동일한 ContentLayout 구조. 헤더·푸터·접근성 툴바 위치 고정

---

## 2. 컬러 시스템

### 2.1 기본 테마: Teal/Emerald oklch 기반

oklch 색상 공간을 사용하여 균일한 지각 밝기와 채도를 유지한다.

| 용도 | CSS 변수 | oklch 값 | 시각 |
|------|----------|----------|------|
| **Primary** | `--primary` | `oklch(0.52 0.14 165)` | 중간 명도 틸/에메랄드 |
| **Primary Foreground** | `--primary-foreground` | `oklch(0.99 0.002 155)` | 거의 백색 |
| **Background** | `--background` | `oklch(0.985 0.002 155)` | 미세 �른트 백색 |
| **Foreground** | `--foreground` | `oklch(0.175 0.015 160)` | 짙은 �른트 흑색 |
| **Card** | `--card` | `oklch(1 0 0)` | 순백색 |
| **Muted** | `--muted` | `oklch(0.96 0.01 160)` | 연한 회색 |
| **Muted Foreground** | `--muted-foreground` | `oklch(0.45 0.02 160)` | 중간 회색 |
| **Border** | `--border` | `oklch(0.91 0.015 160)` | 연한 보더 |
| **Destructive** | `--destructive` | `oklch(0.577 0.245 27.325)` | 경고 빨강 |

### 2.2 고대비 모드: 블랙 앤 화이트 최대 대비

`.high-contrast` CSS 클래스 적용 시 oklch 변수를 오버라이드.

| 용도 | CSS 변수 | oklch 값 | 시각 |
|------|----------|----------|------|
| **Background** | `--background` | `oklch(0.08 0 0)` | 거의 검정 |
| **Foreground** | `--foreground` | `oklch(1 0 0)` | 순백색 |
| **Card** | `--card` | `oklch(0.12 0 0)` | 짙은 회색 |
| **Primary** | `--primary` | `oklch(0.85 0.18 145)` | 밝은 녹색 (고대비에서도 식별 가능) |
| **Border** | `--border` | `oklch(0.5 0 0)` | 강화 회색 보더 |
| **Muted Foreground** | `--muted-foreground` | `oklch(0.75 0 0)` | 밝은 회색 텍스트 |

### 2.3 측정 항목 색상 코딩

6가지 측정 항목을 색상으로 구분하여 시각적 식별 용이.

| 항목 | CSS 클래스 | 보더 색상 | 의미 |
|------|-----------|-----------|------|
| 스트레스 | `.measure-stress` | `border-l-rose-400` | 장애/긴장 (빨강) |
| 신장 | `.measure-height` | `border-l-sky-400` | 신장 (하늘) |
| 혈압 | `.measure-bp` | `border-l-amber-400` | 혈압 (주황) |
| 악력 | `.measure-grip` | `border-l-violet-400` | 악력 (보라) |
| 체성분 | `.measure-body` | `border-l-emerald-400` | 체성분 (녹색) |
| 피부 | `.measure-skin` | `border-l-pink-400` | 피부 (분홍) |

고대비 모드에서는 보더 두께 6px, oklch 고대비 색상으로 강화.

---

## 3. 타이포그래피

### 3.1 폰트 패밀리

| 항목 | 값 |
|------|-----|
| **주 폰트** | Noto Sans KR (Google Fonts, 가변 다이나믹 서브셋) |
| **웨이트** | 300 (Light), 400 (Regular), 500 (Medium), 600 (SemiBold), 700 (Bold), 800 (ExtraBold) |
| **폴백** | 시스템 sans-serif |
| **적용** | `next/font/google`로 로드, CSS 변수 `--font-noto-sans-kr`로 참조 |
| **display** | `swap` (폰트 로딩 전 시스템 폰트로 렌더, FOIT 방지) |

### 3.2 타이포그래피 계층

| 계층 | 요소 | 크기 (Tailwind) | 행간격 | 웨이트 | 용도 |
|------|------|-----------------|--------|--------|------|
| **H1** | `<h1>` | `text-5xl` (3rem) / `md:text-7xl` (4.5rem) | `leading-tight` | 800 | 대기 화면 타이틀 |
| **H2** | `<h2>` | `text-2xl` (1.5rem) / `md:text-3xl` (1.875rem) | `leading-tight` | 700 | 화면 제목 (ContentLayout) |
| **H3** | `<h3>` | `text-xl` (1.25rem) | `leading-snug` | 600 | 섹션 제목 |
| **Body** | `<p>` | `text-lg` (1.125rem) | `leading-relaxed` | 400 | 본문 텍스트 |
| **Button** | `.kiosk-btn` | `text-lg` (1.125rem) | — | 600 | 버튼 텍스트 |
| **Caption** | `<small>` | `text-sm` (0.875rem) | `leading-relaxed` | 400 | 보조 텍스트, 안내 |
| **Overline** | — | `text-xs uppercase tracking-wider` | — | 600 | 접근성 패널 라벨 |

### 3.3 글꼴 확대 (CSS zoom)

| 단계 | 레이블 | zoom 값 | 효과 |
|------|--------|---------|------|
| 보통 | `A` (text-sm) | 1.0 | 기본 크기 |
| 크게 | `A` (text-lg) | 1.15 | 전체 15% 확대 |
| 아주 크게 | `A` (text-2xl) | 1.3 | 전체 30% 확대 |

`zoom` 속성은 텍스트·패딩·마진·이미지·보더를 일관되게 비례 확대하여 레이아웃 붕괴를 방지.

---

## 4. 레이아웃 시스템

### 4.1 데스크톱 레이아웃 (≥768px)

```
┌─────────────────────────────────────────────────────────────┐
│                        KioskHeader                           │
│  [← 뒤로가기]    화면 제목    [🏠 홈]                        │
├─────────────────────────────────────────────────────────────┤
│                                    ┌──────────────────────┐ │
│                                    │  AccessibilityToolbar│ │
│                                    │  (우측 상단 플로팅)   │ │
│                                    └──────────────────────┘ │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                     main                               │  │
│  │              max-w-4xl (896px) 중앙 정렬                │  │
│  │              px-8 py-6                                 │  │
│  │                                                        │  │
│  │  ┌──────────────────────────────────────────────────┐ │  │
│  │  │              화면별 콘텐츠                         │ │  │
│  │  └──────────────────────────────────────────────────┘ │  │
│  │                                                        │  │
│  │  ┌──────────────────────────────────────────────────┐ │  │
│  │  │  notice-box (선택)                                │ │  │
│  │  └──────────────────────────────────────────────────┘ │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                        KioskFooter                           │
│  "Biogram MINI 교육 키오스크" · mt-auto (스티키 푸터)      │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 모바일 레이아웃 (<768px)

```
┌─────────────────────────────────┐
│       KioskHeader (축소)         │
│  [←] 제목 [🏠]                  │
├─────────────────────────────────┤
│  AccessibilityToolbar (인라인)   │
│  [A][A][A] │ 🔊 👁              │
├─────────────────────────────────┤
│            main                  │
│    px-4 py-6                    │
│    pb-bottom-nav                │
│    (safe area 패딩 포함)         │
│                                  │
│  ┌───────────────────────────┐  │
│  │    화면별 콘텐츠            │  │
│  └───────────────────────────┘  │
│                                  │
│  ┌───────────────────────────┐  │
│  │  fixed CTA 버튼            │  │
│  │  "실제 장비로 이동"         │  │
│  └───────────────────────────┘  │
├─────────────────────────────────┤
│       MobileBottomNav (5탭)      │
│  [홈][장비][안내][측정][더보기]  │
│  + safe-area-inset-bottom       │
└─────────────────────────────────┘
```

### 4.3 ContentLayout 공통 래퍼

모든 콘텐츠 화면이 공유하는 레이아웃 컴포넌트.

```tsx
<ContentLayout title="화면 제목" notice="선택적 안내 텍스트">
  {/* 화면별 콘텐츠 */}
</ContentLayout>
```

| 구조 | 설명 |
|------|------|
| `KioskHeader` | sticky top-0, 뒤로가기 + 제목 + 홈. standby·main에서는 미렌더링 |
| `AccessibilityToolbar` | 모바일: 상단 인라인, 데스크톱: 우측 고정 플로팅 |
| `main` | `flex-1 overflow-y-auto kiosk-scroll px-4 md:px-8 py-6 pb-bottom-nav md:pb-6` |
| `max-w-4xl` | 콘텐츠 최대 너비 896px, 중앙 정렬 |
| `KioskFooter` | `mt-auto` 스티키 푸터 (데스크톱만) |
| `MobileBottomNav` | fixed 하단 5탭 (모바일만) |
| `pb-bottom-nav` | `calc(4.5rem + env(safe-area-inset-bottom))` 모바일 safe area 패딩 |

---

## 5. 컴포넌트 라이브러리

### 5.1 버튼 컴포넌트

#### kiosk-btn-primary

```css
.kiosk-btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  border-radius: 0.75rem;          /* rounded-xl */
  padding: 1rem 1.5rem;            /* px-6 py-4 */
  font-size: 1.125rem;             /* text-lg */
  font-weight: 600;                /* font-semibold */
  min-height: 64px;                /* 최소 터치 타겟 */
  background: var(--primary);
  color: var(--primary-foreground);
  transition: all 0.2s;
}
.kiosk-btn-primary:active { transform: scale(0.95); }
.kiosk-btn-primary:hover { opacity: 0.9; }
```

고대비 모드: `background: oklch(0.85 0.18 145)`, `border: 3px solid oklch(1 0 0)`, `font-weight: 800`

#### kiosk-btn-secondary

```css
.kiosk-btn-secondary {
  /* 기본 구조 동일 */
  background: var(--secondary);
  color: var(--secondary-foreground);
}
.kiosk-btn-secondary:hover { background: var(--secondary) / 80%; }
```

#### kiosk-btn-outline

```css
.kiosk-btn-outline {
  /* 기본 구조 동일 */
  border: 2px solid var(--primary);
  background: transparent;
  color: var(--primary);
}
.kiosk-btn-outline:hover {
  background: var(--primary);
  color: var(--primary-foreground);
}
```

고대비 모드: `border-width: 3px`, `font-weight: 800`

### 5.2 카드 컴포넌트

#### kiosk-card

```css
.kiosk-card {
  border-radius: 1rem;             /* rounded-2xl */
  padding: 1.5rem;                 /* p-6 */
  border: 1px solid var(--border);
  background: var(--card);
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
  transition: all 0.2s;
}
.kiosk-card:hover {
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);  /* shadow-md */
}
```

고대비 모드: `border-width: 3px`, `border-color: oklch(0.7 0 0)`, `background: oklch(0.15 0 0)`

### 5.3 경고·안내 박스

#### warning-box

```css
.warning-box {
  border-radius: 0.75rem;
  border: 2px solid oklch(0.85 0.18 90);   /* amber-400 */
  background: oklch(0.98 0.02 90);          /* amber-50 */
  padding: 1.25rem;
  color: oklch(0.35 0.08 60);               /* amber-900 */
}
```

용도: 주의사항, 경고성 안내 (예: "측정 전 30분간 금식해 주세요")

고대비 모드: `border-width: 3px`, 고대비 oklch 색상

#### notice-box

```css
.notice-box {
  border-radius: 0.75rem;
  border: 2px solid var(--primary) / 30%;
  background: var(--primary) / 5%;
  padding: 1.25rem;
  color: var(--foreground);
}
```

용도: 일반 안내, 참고 사항 (예: "실제 측정은 현장 장비에서 진행됩니다")

### 5.4 단계 표시 컴포넌트

#### step-dot / step-indicator

```css
.step-dot {
  width: 0.75rem;                  /* h-3 w-3 */
  border-radius: 50%;
  background: var(--muted-foreground) / 30%;
  transition: all 0.3s;
}

.step-dot.active {
  width: 1rem;                     /* h-4 w-4 */
  height: 1rem;
  background: var(--primary);
  transform: scale(1.1);
}

.step-dot.completed {
  background: var(--primary) / 60%;
}
```

고대비 모드: `border: 2px solid oklch(0.7 0 0)`, active 시 `border-color: oklch(1 0 0)`

### 5.5 측정 항목 카드

6가지 측정 항목을 색상 코딩된 좌측 보더로 구분.

```css
.measure-stress { border-left: 4px solid oklch(0.7 0.18 10); }    /* rose-400 */
.measure-height { border-left: 4px solid oklch(0.7 0.15 200); }   /* sky-400 */
.measure-bp     { border-left: 4px solid oklch(0.8 0.15 85); }    /* amber-400 */
.measure-grip   { border-left: 4px solid oklch(0.65 0.2 290); }   /* violet-400 */
.measure-body   { border-left: 4px solid oklch(0.7 0.15 160); }   /* emerald-400 */
.measure-skin   { border-left: 4px solid oklch(0.7 0.15 350); }   /* pink-400 */
```

고대비 모드: `border-left-width: 6px`, 고대비 oklch 색상으로 강화

---

## 6. 애니메이션

### 6.1 화면 전환

**AnimatePresence fade + slide (0.25초)**

```tsx
const pageVariants = {
  initial: { opacity: 0, y: 20 },     // 아래에서 페이드인
  animate: { opacity: 1, y: 0 },      // 정위치
  exit:    { opacity: 0, y: -20 },     // 위로 페이드아웃
};

<AnimatePresence mode="wait">
  <motion.div
    key={currentScreen}
    variants={pageVariants}
    transition={{ duration: 0.25, ease: 'easeInOut' }}
  >
```

- 진입: 아래→위 슬라이드 + 페이드인 (0.25초)
- 퇴장: 위→아래 슬라이드 + 페이드아웃 (0.25초)
- `mode="wait"`: 이전 화면 완전 퇴장 후 새 화면 진입

### 6.2 메뉴 등장

**Staggered container (0.04초 stagger)**

```tsx
const containerVariants = {
  animate: {
    transition: { staggerChildren: 0.04 }
  }
};

const itemVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.2 } }
};
```

메인 메뉴 10개 카드가 순차적으로 등장. 0.04초 간격으로 stagger.

### 6.3 대기 화면

**pulse-glow (3초)**

```css
@keyframes pulse-glow {
  0%, 100% { opacity: 1; transform: scale(1); }
  50%      { opacity: 0.8; transform: scale(1.02); }
}
.animate-pulse-glow { animation: pulse-glow 3s ease-in-out infinite; }
```

대기 화면 메인 타이틀에 적용. 은은한 크기·투명 변화로 "살아 있음" 표현.

**float-up (4초)**

```css
@keyframes float-up {
  0%, 100% { transform: translateY(0); }
  50%      { transform: translateY(-8px); }
}
.animate-float-up { animation: float-up 4s ease-in-out infinite; }
```

대기 화면 서브 텍스트·아이콘에 적용. 위로 떠오르는 듯한 부드러운 움직임.

### 6.4 버튼 인터랙션

**whileHover scale 1.03, whileTap scale 0.97**

```tsx
<motion.button
  whileHover={{ scale: 1.03 }}
  whileTap={{ scale: 0.97 }}
  transition={{ duration: 0.15 }}
>
```

- Hover: 3% 확대 (데스크톱 마우스)
- Tap: 3% 축소 (모바일 터치, 촉각 피드백 감)
- `.kiosk-btn:active { transform: scale(0.95) }` CSS 폴백 (Framer Motion 외)

### 6.5 TTS 재생 표시

**tts-pulse (1.5초)**

```css
@keyframes tts-pulse {
  0%, 100% { opacity: 1; }
  50%      { opacity: 0.5; }
}
.tts-speaking { animation: tts-pulse 1.5s ease-in-out infinite; }
```

TTSIndicator 컴포넌트에 적용. "음성 안내 중..." 텍스트 투명도 깜빡임.

### 6.6 진행 바

**progress-fill (0.6초)**

```css
@keyframes progress-fill {
  from { width: 0%; }
}
.progress-bar-animated { animation: progress-fill 0.6s ease-out; }
```

세션 진행률 바에 적용. 0%에서 현재 비율까지 채워지는 애니메이션.

---

## 7. 접근성 UI

### 7.1 글꼴 크기 조절

**A / A / A 버튼 (3단계)**

| 모바일 | 데스크톱 |
|--------|----------|
| 상단 인라인 툴바 내 3개 pill 버튼 | 우측 상단 플로팅 버튼 → 확장 패널 내 3개 버튼 |

```
┌──────────────────────────────────────┐
│  모바일: [A 보통] [A 크게] [A 아주크게] │  ← rounded-full pill
├──────────────────────────────────────┤
│  데스크톱:                           │
│  ┌── 접근성 패널 ──────────────────┐ │
│  │  글꼴 크기                       │ │
│  │  [A 보통] [A 크게] [A 아주 크게]  │ │  ← rounded-xl, flex-1
│  └──────────────────────────────────┘ │
└──────────────────────────────────────┘
```

- 선택된 단계: `bg-primary text-primary-foreground`
- 미선택 단계: `bg-secondary text-secondary-foreground hover:bg-secondary/80`
- `aria-pressed={fontSize === opt.value}` 로 스크린 리더에 상태 전달

### 7.2 TTS 음성 안내

**Volume2 / VolumeX 토글 + 요약/전체 듣기 + 재생 중 인디케이터**

```
┌─────────────────────────────────────────────────────────────────┐
│  모바일: [🔊 TTS 토글]                                            │
│  데스크톱: 패널 내                                                │
│    음성 안내 (TTS)                                                │
│    [🔊 음성 안내 켜짐/꺼짐]                                       │
│    ┌─ TTS 활성 시 ─────────────┐                                 │
│    │  [↻ 요약 듣기] [↻ 전체 듣기] │                                 │
│    └────────────────────────────┘                                 │
├─────────────────────────────────────────────────────────────────┤
│  TTSIndicator (재생 중 하단 고정)                                  │
│  ┌──────────────────────────────────────────────────────┐        │
│  │  🔊 음성 안내 중...  [↻ 요약]  [↻ 전체]              │        │
│  │  tts-pulse 애니메이션                                │        │
│  └──────────────────────────────────────────────────────┘        │
└─────────────────────────────────────────────────────────────────┘
```

- TTS 켜짐: `Volume2` 아이콘, `bg-primary text-primary-foreground`
- TTS 꺼짐: `VolumeX` 아이콘, 기본 스타일
- TTSIndicator: `speechSynthesis.speaking` 300ms 폴링 → `true` 시 렌더링
- 자동 읽기: 화면 전환 시 `useTTS({ autoSpeak: true })` → `speakIntro()` 자동 호출

### 7.3 고대비 모드

**Eye 토글**

| 모바일 | 데스크톱 |
|--------|----------|
| 상단 인라인 툴바 내 `👁` 버튼 | 패널 내 "화면 표시" 섹션 → `👁 고대비 켜짐/꺼짐` |

```
모바일: [... │ 👁 고대비]
데스크톱:
  화면 표시
  [👁 고대비 켜짐/꺼짐]
```

- 켜짐: `.high-contrast` CSS 클래스 적용 → oklch 변수 오버라이드
- 꺼짐: `.high-contrast` 클래스 제거 → 기본 Teal/Emerald 테마 복원
- `aria-pressed={highContrast}` 로 스크린 리더에 상태 전달

### 7.4 대기 화면 토글

**우측 상단 반투명 토글**

대기 화면에서 접근성 툴바의 고대비·글꼴 크기 설정을 변경할 수 있도록, 반투명 배경의 미니 툴바를 우측 상단에 표시.

### 7.5 상태 뱃지

**활성 기능 수 표시**

데스크톱 접근성 플로팅 버튼 우측 상단에 destructive(빨강) 둥근 뱃지로 활성 기능 수 표시.

```tsx
{(ttsEnabled || highContrast || fontSize !== 'normal') && !expanded && (
  <div className="absolute -right-1 -top-1 h-5 w-5 rounded-full bg-destructive text-[10px] font-bold text-white">
    {[ttsEnabled, highContrast, fontSize !== 'normal'].filter(Boolean).length}
  </div>
)}
```

| 상태 | 뱃지 수 |
|------|---------|
| 기본 (모두 꺼짐) | 뱃지 미표시 |
| TTS만 켜짐 | 1 |
| TTS + 고대비 | 2 |
| TTS + 고대비 + 큰 글씨 | 3 |

---

## 8. 모바일 특화

### 8.1 바텀 네비게이션 5탭

```
┌──────┬──────┬──────┬──────┬──────┐
│  홈  │ 장비 │ 안내 │ 측정 │더보기│
│  🏠  │  ⚡  │  📖  │  🩺  │  ☰  │
│  ●   │  ○  │  ○  │  ○  │  ○  │  ← 활성 탭 점 표시
└──────┴──────┴──────┴──────┴──────┘
```

| 탭 | 아이콘 | 대상 화면 | 매칭 화면 |
|----|--------|-----------|-----------|
| 홈 | `Home` | main | main, standby |
| 장비 | `Activity` | equipment-intro | equipment-intro |
| 안내 | `BookOpen` | signup | signup, vein-register, login |
| 측정 | `Stethoscope` | measurement-mode | measurement-mode, measurement-equipment, results |
| 더보기 | `Menu` | main | location, app-install, non-member, completion |

- 활성 탭: `text-primary`, `strokeWidth={2.5}`, 파란 점 표시
- 비활성 탭: `text-muted-foreground`, `strokeWidth={2}`
- `role="tablist"`, `role="tab"`, `aria-selected` 접근성 속성
- `min-h-[56px]` 최소 높이 보장
- `active:scale-95` 터치 피드백

### 8.2 수평 스냅 스크롤 카드

모바일에서 측정 장비 목록 등 다수 카드를 수평 스냅 스크롤로 표시.

```css
.snap-x-mandatory {
  scroll-snap-type: x mandatory;
  -webkit-overflow-scrolling: touch;
}
.snap-start { scroll-snap-align: start; }
.scrollbar-hide::-webkit-scrollbar { display: none; }
```

- 카드가 스냅 포인트에 정렬되어 과스크롤 방지
- 스크롤바 숨김으로 모바일 자연스러움 확보
- 터치 관성 스크롤 지원

### 8.3 Fixed CTA 버튼

측정 관련 화면에서 하단에 "실제 장비로 이동" 고정 CTA 버튼.

```tsx
<button className="fixed bottom-20 right-4 z-50 ... md:bottom-4">
  실제 장비로 이동
</button>
```

- 모바일: `bottom-20` (바텀 네비 위)
- 데스크톱: `bottom-4`
- `active:scale-95` 터치 피드백

### 8.4 Safe Area 패딩

iOS 등 safe area가 있는 기기에서 바텀 네비가 홈 인디케이터에 가려지지 않도록 패딩 적용.

```css
.pb-safe {
  padding-bottom: env(safe-area-inset-bottom, 0px);
}
.pb-bottom-nav {
  padding-bottom: calc(4.5rem + env(safe-area-inset-bottom, 0px));
}
```

- `pb-safe`: 일반 safe area 패딩
- `pb-bottom-nav`: 바텀 네비 높이(4.5rem) + safe area 패딩. main 콘텐츠가 바텀 네비에 가려지지 않도록

바텀 네비 자체:
```tsx
<div className="px-1 pb-[env(safe-area-inset-bottom)]">
```

---

## 9. 반응형 브레이크포인트

| 브레이크포인트 | 최소 너비 | 대상 | 주요 변화 |
|---------------|-----------|------|-----------|
| **sm** | 640px | 대형 모바일·소형 태블릿 | 접근성 툴바 라벨 표시 (`hidden sm:inline`) |
| **md** | 768px | 태블릿·데스크톱 | **분기점**: 모바일↔데스크톱 레이아웃 전환 |
| **lg** | 1024px | 데스크톱 | 카드 그리드 3~4열 |
| **xl** | 1280px | 대형 데스크톱 | 최대 너비 제한 (max-w-4xl) |

### md 분기점 변화 상세

| 요소 | 모바일 (<md) | 데스크톱 (≥md) |
|------|-------------|----------------|
| 접근성 툴바 | 상단 인라인 (`md:hidden`) | 우측 고정 플로팅 (`hidden md:block`) |
| 헤더 패딩 | `px-4` | `md:px-8` |
| 메인 패딩 | `px-4`, `pb-bottom-nav` | `md:px-8`, `md:pb-6` |
| 푸터 | 숨김 (바텀 네비 대체) | `hidden md:block` |
| 바텀 네비 | 표시 | `md:hidden` |
| 카드 그리드 | 1열 | 2~3열 |
| 제목 크기 | `text-2xl` | `md:text-3xl` |
| CTA 위치 | `bottom-20` | `md:bottom-4` |

---

## 10. 커스텀 스크롤바

`.kiosk-scroll` 클래스로 키오스크 전용 커스텀 스크롤바 정의.

```css
/* 트랙 */
.kiosk-scroll::-webkit-scrollbar-track {
  border-radius: 9999px;
  background: transparent;
}

/* Thumb */
.kiosk-scroll::-webkit-scrollbar-thumb {
  border-radius: 9999px;
  background: oklch(0.52 0.14 165) / 20%;    /* primary/20 */
}
.kiosk-scroll::-webkit-scrollbar-thumb:hover {
  background: oklch(0.52 0.14 165) / 40%;    /* primary/40 */
}

/* 너비 */
.kiosk-scroll::-webkit-scrollbar {
  width: 8px;
}
```

| 속성 | 값 | 설명 |
|------|-----|------|
| 너비 | 8px | 얇고 눈에 띄지 않는 스크롤바 |
| Thumb 색상 | `primary/20` (20% 투명) | 기본 상태: 은은한 �른트 |
| Thumb hover | `primary/40` (40% 투명) | 호버: 조금 더 진해짐 |
| Track | 투명 | 배경과 동화 |
| Border radius | 9999px (full) | 둥근 thumb |

고대비 모드:
```css
.high-contrast .kiosk-scroll::-webkit-scrollbar-thumb {
  background: oklch(0.7 0 0);    /* 밝은 회색, 100% 불투명 */
}
```

---

## 부록 A: UI 컴포넌트 전체 목록

| 분류 | 컴포넌트 | 경로 |
|------|----------|------|
| **레이아웃** | ContentLayout | `src/components/kiosk/ContentLayout.tsx` |
| **헤더** | KioskHeader | `src/components/kiosk/KioskHeader.tsx` |
| **푸터** | KioskFooter | `src/components/kiosk/KioskFooter.tsx` |
| **접근성** | AccessibilityToolbar | `src/components/kiosk/AccessibilityToolbar.tsx` |
| │ ├ MobileToolbar | (내부 컴포넌트) |
| │ ├ DesktopToolbar | (내부 컴포넌트) |
| │ └ TTSIndicator | (내부 컴포넌트) |
| **모바일** | MobileBottomNav | `src/components/kiosk/MobileBottomNav.tsx` |
| **PWA** | ServiceWorkerRegistrar | `src/components/kiosk/ServiceWorkerRegistrar.tsx` |
| **화면** | StandbyScreen | `src/components/kiosk/StandbyScreen.tsx` |
| │ MainMenu | `src/components/kiosk/MainMenu.tsx` |
| │ EquipmentIntro | `src/components/kiosk/screens/EquipmentIntro.tsx` |
| │ LocationGuide | `src/components/kiosk/screens/LocationGuide.tsx` |
| │ AppInstall | `src/components/kiosk/screens/AppInstall.tsx` |
| │ Signup | `src/components/kiosk/screens/Signup.tsx` |
| │ VeinRegister | `src/components/kiosk/screens/VeinRegister.tsx` |
| │ LoginGuide | `src/components/kiosk/screens/LoginGuide.tsx` |
| │ NonMember | `src/components/kiosk/screens/NonMember.tsx` |
| │ MeasurementMode | `src/components/kiosk/screens/MeasurementMode.tsx` |
| │ MeasurementEquipment | `src/components/kiosk/screens/MeasurementEquipment.tsx` |
| │ ResultsGuide | `src/components/kiosk/screens/ResultsGuide.tsx` |
| │ CompletionScreen | `src/components/kiosk/screens/CompletionScreen.tsx` |

---

## 부록 B: CSS 유틸리티 클래스 전체 목록

| 클래스 | 용도 |
|--------|------|
| `.kiosk-touch-target` | 최소 64×64px 터치 타겟 |
| `.kiosk-btn` | 기본 키오스크 버튼 |
| `.kiosk-btn-primary` | 주 버튼 (primary 배경) |
| `.kiosk-btn-secondary` | 보조 버튼 (secondary 배경) |
| `.kiosk-btn-outline` | 외곽 버튼 (primary 보더) |
| `.kiosk-card` | 카드 (rounded-2xl, hover shadow) |
| `.warning-box` | 경고 박스 (amber 보더) |
| `.notice-box` | 안내 박스 (primary 보더) |
| `.step-dot` | 단계 점 (기본) |
| `.step-dot.active` | 단계 점 (현재 단계) |
| `.step-dot.completed` | 단계 점 (완료 단계) |
| `.measure-stress` | 측정 카드 - 스트레스 |
| `.measure-height` | 측정 카드 - 신장 |
| `.measure-bp` | 측정 카드 - 혈압 |
| `.measure-grip` | 측정 카드 - 악력 |
| `.measure-body` | 측정 카드 - 체성분 |
| `.measure-skin` | 측정 카드 - 피부 |
| `.kiosk-scroll` | 커스텀 스크롤바 |
| `.animate-pulse-glow` | 대기 화면 pulse 애니메이션 |
| `.animate-float-up` | 대기 화면 float 애니메이션 |
| `.tts-indicator` | TTS 인디케이터 배경 |
| `.tts-speaking` | TTS 재생 중 pulse 애니메이션 |
| `.flow-arrow` | 흐름도 화살표 |
| `.pb-safe` | Safe area 하단 패딩 |
| `.pb-bottom-nav` | 바텀 네비 높이 + safe area 패딩 |
| `.snap-x-mandatory` | 수평 스냅 스크롤 |
| `.scrollbar-hide` | 스크롤바 숨김 |
| `.progress-bar-animated` | 진행 바 채움 애니메이션 |
| `.tap-feedback` | 터치 피드백 애니메이션 |
| `.high-contrast` | 고대비 모드 (oklch 변수 오버라이드) |
