# AI Agent 문서

> Biogram MINI 헬스케어 장비 교육 키오스크 — AI 에이전트 상호작용 및 개발 가이드

---

## 1. 에이전트 개요

### 1.1 프로젝트에서 AI가 수행하는 역할

본 프로젝트에서 AI 에이전트는 개발 전 주기에 걸쳐 다음 역할을 수행합니다.

| 역할            | 설명                                                                 | 주요 산출물                         |
| --------------- | -------------------------------------------------------------------- | ----------------------------------- |
| 이미지 생성     | 키오스크 화면에 사용될 일러스트·배경 이미지를 AI로 생성              | `/public/kiosk-images/*.png`        |
| 콘텐츠 작성     | TTS 재생용 텍스트, UI 라벨, 안내 문구를 한국어로 자동 작성           | `src/lib/tts-texts.ts`, API payload |
| TTS 텍스트 작성 | 화면 진입 요약(intro)과 상세 설명(full)을 분리하여 작성               | `src/lib/tts-texts.ts`              |
| 코드 생성/리뷰  | Next.js 16 + TypeScript 컴포넌트·스토어·API를 프롬프트 기반으로 생성  | `src/components/kiosk/screens/*.tsx` |
| E2E 테스트      | agent-browser CLI를 사용하여 자동화된 브라우저 테스트 실행            | 테스트 결과 리포트                  |

### 1.2 사용 가능한 스킬

모든 에이전트는 **z-ai-web-dev-sdk**를 통해 다음 스킬에 접근할 수 있습니다.

| 스킬             | 용도                                               | 호출 방식            |
| ---------------- | -------------------------------------------------- | -------------------- |
| LLM              | 자연어 처리, 코드 생성, 콘텐츠 작성                | `z-ai-web-dev-sdk`   |
| VLM              | 이미지 분석, 화면 스크린샷 검증                    | `z-ai-web-dev-sdk`   |
| TTS              | 서버 사이드 음성 합성(오프라인 시 browser API 대체) | `z-ai-web-dev-sdk`   |
| ASR              | 음성 명령 인식 (향후 확장)                          | `z-ai-web-dev-sdk`   |
| Image Generation | 키오스크 일러스트·배경 이미지 생성                  | `z-ai-web-dev-sdk`   |
| Web Search       | 최신 장비 정보·보건소 동향 검색                     | `z-ai-web-dev-sdk`   |
| Web Reader       | 외부 문서·가이드라인 웹 페이지 읽기                 | `z-ai-web-dev-sdk`   |

---

## 2. 이미지 생성 에이전트

### 2.1 사용 스킬

- **image-generation** (z-ai-web-dev-sdk 내장)

### 2.2 생성 이미지

| 파일 경로                               | 용도                 | 적용 컴포넌트          |
| --------------------------------------- | -------------------- | ---------------------- |
| `/public/kiosk-images/equipment.png`    | 헬스케어 키오스크 장비 소개 화면 | `EquipmentIntro.tsx`   |
| `/public/kiosk-images/location.png`     | 보건소 로비 내부 안내 화면     | `LocationGuide.tsx`    |

### 2.3 프롬프트 전략

이미지 생성 시 다음 프롬프트 원칙을 준수합니다.

- **한국어 보건소 환경**: 한국 보건소·건강센터 실제 환경을 반영 (밝은 형광등, 깨끗한 바닥, 안내 표지판 한글)
- **밝고 깨끗한**: 채도 높은 백색 톤, 정돈된 실내, 자연채광
- **노인 친화적**: 큰 글씨 안내판, 낮은 위치 장비, 굵은 손잡이, 휠체어 접근성 반영
- **사람 포함**: 노인 사용자가 장비를 조작하는 자연스러운 자세

```
프롬프트 예시:
"A bright, clean Korean public health center lobby with a Biogram MINI
healthcare kiosk. Elderly-friendly design with large Korean text signs,
low-positioned equipment, wheelchair-accessible layout. Warm fluorescent
lighting, organized interior, natural daylight from windows. An elderly
person is gently using the equipment. Realistic style, 1024x1024."
```

### 2.4 이미지 크기

- **1024 × 1024** px (정방형 — 반응형 CSS `object-fit: contain` 적용)

### 2.5 적용 위치

```tsx
// EquipmentIntro.tsx
<Image
  src="/kiosk-images/equipment.png"
  alt="바이오그램 MINI 헬스케어 장비"
  width={400}
  height={400}
  className="object-contain"
/>

// LocationGuide.tsx
<Image
  src="/kiosk-images/location.png"
  alt="보건소 로비 내부 안내"
  width={400}
  height={400}
  className="object-contain"
/>
```

---

## 3. TTS 에이전트

### 3.1 구현 방식: 브라우저 Web Speech API

| 항목     | 브라우저 Web Speech API           | z-ai-web-dev-sdk TTS           |
| -------- | ---------------------------------- | ------------------------------ |
| 오프라인 | ✅ 네트워크 없이 동작              | ❌ API 서버 필요               |
| 비용     | ✅ 무료                             | ❌ 호출당 과금                 |
| 응답 속도 | ✅ 즉각 (로컬 엔진)                | ⚠️ 네트워크 지연               |
| PWA 호환 | ✅ Service Worker와 충돌 없음       | ⚠️ 오프라인 시 사용 불가       |
| 음성 품질 | ⚠️ 브라우저·OS 종속                | ✅ 고품질 신경망 음성           |

**선택 이유**: 키오스크는 보건소 네트워크 불안정 시에도 음성 안내가 필수이므로 **브라우저 Web Speech API**를 기본으로 채택합니다. 향후 네트워크 안정 시 z-ai-web-dev-sdk TTS를 고급 음성으로 교체할 수 있는 fallback 구조를 유지합니다.

### 3.2 텍스트 작성 전략

각 화면마다 두 가지 텍스트 레벨을 정의합니다.

| 레벨   | 키      | 용도                              | 작성 원칙                                       |
| ------ | ------- | --------------------------------- | ------------------------------------------------ |
| 요약   | `intro` | 화면 진입 시 자동 재생 (1~2문장)  | 핵심 정보만 간결히, 행동 유도 문장              |
| 상세   | `full`  | "다시 듣기" 버튼 클릭 시 재생     | 단계별 설명, 주의사항 포함, 천천히 말하는 톤    |

**말하기 속도**: `rate: 0.85` — 노인층 청취에 맞춘 느린 속도

**한국어 음성 자동 탐지**:
```ts
const koreanVoice = speechSynthesis
  .getVoices()
  .find(v => v.lang.startsWith('ko'));
```

### 3.3 13개 화면별 텍스트 정의

파일 위치: `src/lib/tts-texts.ts`

```ts
export const ttsTexts: Record<ScreenId, { intro: string; full: string }> = {
  standby:       { intro: "화면을 터치하면 측정을 시작할 수 있습니다.", full: "…" },
  mainMenu:      { intro: "원하는 서비스를 선택해 주세요.", full: "…" },
  nonMember:     { intro: "비회원으로 진행합니다.", full: "…" },
  loginGuide:    { intro: "회원 로그인 안내입니다.", full: "…" },
  signup:        { intro: "신규 회원 가입 안내입니다.", full: "…" },
  measurementMode: { intro: "측정 방식을 선택해 주세요.", full: "…" },
  equipmentIntro:  { intro: "바이오그램 MINI 장비 소개입니다.", full: "…" },
  measurementEquipment: { intro: "장비 사용 방법 안내입니다.", full: "…" },
  veinRegister:   { intro: "정맥 등록 안내입니다.", full: "…" },
  location:       { intro: "측정실 위치 안내입니다.", full: "…" },
  resultsGuide:   { intro: "결과 확인 방법 안내입니다.", full: "…" },
  appInstall:     { intro: "모바일 앱 설치 안내입니다.", full: "…" },
  completion:     { intro: "모든 안내가 완료되었습니다.", full: "…" },
};
```

> 각 `full` 텍스트는 3~5문장으로 구성하며, 줄바꿈(`\n`)으로 단계를 구분합니다.

---

## 4. 콘텐츠 관리 에이전트

### 4.1 API 기반 콘텐츠 Upsert

CMS 없이 **직접 API 호출**로 콘텐츠를 관리합니다.

```
PUT /api/content
Content-Type: application/json

{
  "section": "equipment-intro",
  "title": "바이오그램 MINI 소개",
  "body": "바이오그램 MINI는 …",
  "imageUrl": "/kiosk-images/equipment.png"
}
```

### 4.2 섹션별 업데이트

| 섹션 ID                | 화면                  | 업데이트 대상                     |
| ---------------------- | --------------------- | ---------------------------------- |
| `equipment-intro`      | EquipmentIntro        | 장비 소개 텍스트, 이미지          |
| `location`             | LocationGuide         | 측정실 위치 텍스트, 이미지        |
| `app-install`          | AppInstall            | 앱 설치 안내, QR 코드 URL         |
| `results-guide`        | ResultsGuide          | 결과 확인 절차, 주의사항          |
| `measurement-mode`     | MeasurementMode       | 측정 방식 설명                    |
| `vein-register`        | VeinRegister          | 정맥 등록 절차                    |
| `measurement-equipment`| MeasurementEquipment  | 장비 조작법, 단계별 안내          |

### 4.3 CMS 없이 API로 직접 관리하는 이유

- **단일 키오스크 환경**: 다중 편집자가 없으므로 CMS 오버헤드 불필요
- **AI 에이전트가 유일한 편집자**: API PUT만으로 충분
- **버전 관리는 Git으로**: 콘텐츠 변경 이력은 커밋 로그로 추적

---

## 5. 코드 생성 에이전트

### 5.1 프롬프트 → Next.js 16 + TypeScript 코드 생성

에이전트는 자연어 프롬프트를 받아 다음을 자동 생성합니다.

| 생성 대상            | 기술 스택                                  | 산출 경로                            |
| -------------------- | ------------------------------------------ | ------------------------------------ |
| 13개 화면 컴포넌트   | Next.js 16, React 19, TypeScript, Tailwind | `src/components/kiosk/screens/*.tsx` |
| Zustand 스토어       | Zustand v5                                 | `src/store/kiosk-store.ts`           |
| CSS 테마             | Tailwind CSS 4 + CSS Variables             | `src/app/globals.css`                |
| API 라우트           | Next.js App Router                         | `src/app/api/**/*.ts`               |
| 훅                   | React Hooks                                | `src/hooks/*.ts`                     |

### 5.2 13개 화면 컴포넌트 자동 생성

화면 ID 목록 (스토어 `screenId` 유니온 타입):

```
standby | mainMenu | nonMember | loginGuide | signup |
measurementMode | equipmentIntro | measurementEquipment |
veinRegister | location | resultsGuide | appInstall | completion
```

각 컴포넌트는 다음 구조를 따릅니다.

```tsx
'use client';

import { useKioskStore } from '@/store/kiosk-store';
import { useTTS } from '@/hooks/use-tts';

export default function ScreenName() {
  const { screen, setScreen } = useKioskStore();
  const { speak } = useTTS('screenId');

  return (
    <div className="flex flex-col items-center gap-6 p-6">
      {/* 화면 내용 */}
    </div>
  );
}
```

### 5.3 Zustand 스토어 자동 생성

```ts
// src/store/kiosk-store.ts
import { create } from 'zustand';

type ScreenId =
  | 'standby' | 'mainMenu' | 'nonMember' | 'loginGuide' | 'signup'
  | 'measurementMode' | 'equipmentIntro' | 'measurementEquipment'
  | 'veinRegister' | 'location' | 'resultsGuide' | 'appInstall' | 'completion';

interface KioskState {
  screen: ScreenId;
  setScreen: (s: ScreenId) => void;
  fontSize: number;
  setFontSize: (n: number) => void;
  highContrast: boolean;
  toggleHighContrast: () => void;
}

export const useKioskStore = create<KioskState>((set) => ({
  screen: 'standby',
  setScreen: (screen) => set({ screen }),
  fontSize: 16,
  setFontSize: (fontSize) => set({ fontSize }),
  highContrast: false,
  toggleHighContrast: () => set((s) => ({ highContrast: !s.highContrast })),
}));
```

### 5.4 CSS 테마 자동 생성

Tailwind CSS 4의 CSS 변수 기반 테마를 생성합니다.

```css
/* src/app/globals.css — 테마 변수 */
:root {
  --kiosk-primary: #16a34a;       /* 그린 600 — 보건 브랜드 */
  --kiosk-accent: #f59e0b;        /* 앰버 500 — 주의/하이라이트 */
  --kiosk-bg: #ffffff;
  --kiosk-text: #1f2937;
  --kiosk-radius: 1rem;           /* 대형 라운드 — 노인 친화적 */
}

.high-contrast {
  --kiosk-bg: #000000;
  --kiosk-text: #ffffff;
  --kiosk-primary: #4ade80;
}
```

### 5.5 하이드레이션 이슈 자동 감지/수정

코드 생성 시 다음 패턴을 자동 적용하여 하이드레이션 불일치를 방지합니다.

```tsx
// 클라이언트 전용 값은 mount 후 렌더링
const [mounted, setMounted] = useState(false);
useEffect(() => { setMounted(true); }, []);
if (!mounted) return <Skeleton />;

// localStorage 접근은 useEffect 내에서만
useEffect(() => {
  const saved = localStorage.getItem('kiosk-font-size');
  if (saved) setFontSize(Number(saved));
}, []);
```

---

## 6. 테스트 에이전트

### 6.1 agent-browser CLI로 E2E 테스트 자동화

[agent-browser](../) 스킬을 사용하여 헤드리스 브라우저에서 키오스크 흐름을 종단 간 테스트합니다.

### 6.2 테스트 흐름

```
open(url) → snapshot() → click(selector) → eval(expression) → errors() → close()
```

| 단계        | 설명                                          |
| ----------- | --------------------------------------------- |
| `open`      | `http://localhost:3000` 접속                  |
| `snapshot`  | 현재 DOM 스냅샷 촬영, 시각적 상태 확인        |
| `click`     | 버튼/카드 클릭으로 화면 전환                  |
| `eval`      | JavaScript 식 평가 (예: 화면 ID 확인)         |
| `errors`    | 콘솔 에러 수집 (하이드레이션 에러 포함)       |
| `close`     | 브라우저 세션 종료                            |

### 6.3 10개 테스트 케이스

| #  | 테스트 케이스                            | 검증 내용                                      |
| -- | ---------------------------------------- | ---------------------------------------------- |
| 1  | 대기 화면 렌더링                         | "화면을 터치하세요" 텍스트 표시               |
| 2  | 대기 → 메인 메뉴 전환                    | 터치 후 6개 메뉴 카드 렌더링                   |
| 3  | 메인 메뉴 → 비회원 진행                  | 비회원 버튼 클릭 후 화면 전환                  |
| 4  | 장비 소개 화면 렌더링                    | 이미지·텍스트·TTS 버튼 존재                    |
| 5  | 위치 안내 화면 렌더링                    | 로비 이미지·텍스트 표시                        |
| 6  | 앱 설치 화면 렌더링                      | QR 코드 영역·설치 버튼 존재                    |
| 7  | 접근성 툴바 동작                         | 글자 크기 증가/감소, 고대비 토글               |
| 8  | TTS "다시 듣기" 버튼                     | 클릭 시 음성 재생 트리거                       |
| 9  | 전체 흐름 완주                           | standby → completion 까지 순차 진행             |
| 10 | 하이드레이션 에러 부재                    | `errors()` 결과에 hydration 경고 없음          |

### 6.4 검증 항목

- **하이드레이션 에러**: 콘솔에 `Hydration` 관련 경고/에러가 없는지 확인
- **렌더링 검증**: 각 화면 진입 시 예상 텍스트·이미지·버튼이 DOM에 존재하는지 확인
- **접근성 기능 검증**: 글자 크기 변경, 고대비 모드, TTS 재생이 정상 동작하는지 확인

---

## 7. 에이전트 협업 흐름

### 7.1 전체 흐름

```
기획 → 이미지 생성 → 코드 생성 → 테스트 → 수정 반복
```

### 7.2 각 단계별 에이전트 역할과 산출물

| 단계        | 에이전트          | 입력                            | 산출물                                          |
| ----------- | ----------------- | ------------------------------- | ------------------------------------------------ |
| 기획        | LLM               | PRD, 요구사항                   | 화면 명세, TTS 텍스트 초안                      |
| 이미지 생성 | Image Generation  | 프롬프트 (한국어 보건소 환경)   | `/public/kiosk-images/*.png`                     |
| 코드 생성   | LLM + Code Gen    | 화면 명세, 이미지 경로          | 13개 컴포넌트, 스토어, 훅, API                   |
| 테스트      | agent-browser     | 구현된 키오스크 URL             | 테스트 결과 리포트 (pass/fail)                   |
| 수정 반복   | LLM + Code Gen    | 실패한 테스트 케이스            | 수정된 컴포넌트, 재테스트                       |

### 7.3 에이전트 간 통신

에이전트 간 직접 통신 채널이 없으므로 **파일 시스템**을 매개로 간접 통신합니다.

| 매개체         | 경로                        | 용도                                          |
| -------------- | --------------------------- | --------------------------------------------- |
| 워크로그       | `/home/z/my-project/worklog.md` | 각 에이전트의 작업 이력·산출물 요약          |
| 에이전트 컨텍스트 | `/agent-ctx/*.md`          | 이전 에이전트의 상세 작업 기록               |
| 산출물 파일    | `src/`, `public/`           | 생성된 코드·이미지·설정                       |
| 테스트 결과    | 표준 출력 (stdout)          | agent-browser 실행 결과                       |

**통신 흐름**:
1. 에이전트 A가 작업 완료 후 `worklog.md`에 기록
2. 에이전트 B가 `worklog.md`와 `/agent-ctx/`를 읽어 A의 산출물 확인
3. 에이전트 B가 자신의 작업 시작, 완료 후 동일하게 기록

---

## 8. 워크로그

### 8.1 위치 및 형식

- **경로**: `/home/z/my-project/worklog.md`
- **포맷**: Markdown 테이블 + 자유 형식 설명

### 8.2 기록 항목

| 항목          | 설명                                            |
| ------------- | ----------------------------------------------- |
| Task ID       | 작업 고유 식별자 (예: `1-image-gen`)            |
| Agent         | 수행 에이전트명 (예: `Image Generation Agent`)   |
| Task          | 수행 작업 요약                                  |
| Work Log      | 상세 작업 내용 (프롬프트, 파라미터, 결과)        |
| Stage Summary | 해당 단계의 전체 산출물 요약                    |

### 8.3 기록 예시

```markdown
## Task: 1-image-gen

| 항목          | 값                                                              |
| ------------- | --------------------------------------------------------------- |
| Task ID       | 1-image-gen                                                     |
| Agent         | Image Generation Agent                                          |
| Task          | 장비 소개·로비 위치 이미지 생성                                 |
| Work Log      | 프롬프트: "A bright Korean health center lobby…" → 1024x1024 PNG |
| Stage Summary | equipment.png, location.png 생성 완료                           |

## Task: 2-code-gen

| 항목          | 값                                                              |
| ------------- | --------------------------------------------------------------- |
| Task ID       | 2-code-gen                                                      |
| Agent         | Code Generation Agent                                           |
| Task          | 13개 화면 컴포넌트 + Zustand 스토어 + TTS 훅 생성               |
| Work Log      | EquipmentIntro.tsx, LocationGuide.tsx … CompletionScreen.tsx    |
| Stage Summary | 전체 화면 컴포넌트·스토어·훅 생성 완료                         |
```

### 8.4 이전 에이전트 기록을 읽고 다음 작업 결정

각 에이전트는 작업 시작 전 다음을 확인합니다.

1. `worklog.md`에서 이전 Task ID의 완료 상태 확인
2. `/agent-ctx/{task-id}-{agent-name}.md`에서 상세 산출물 확인
3. 이전 단계 산출물이 존재하고 유효한 경우에만 다음 단계 시작
4. 선행 단계 누락 시 선행 에이전트에게 작업을 요청하거나 자체 수행

---

## 9. 향후 AI 확장

현재 구현은 이미지 생성·콘텐츠 작성·코드 생성·테스트에 한정되어 있으나, z-ai-web-dev-sdk의 추가 스킬을 활용하여 다음과 같이 확장할 수 있습니다.

### 9.1 LLM 스킬 — 실시간 응답 챗봇

| 항목     | 설명                                                    |
| -------- | ------------------------------------------------------- |
| 용도     | 사용자 질문에 대한 실시간 자연어 응답                   |
| 예시     | "이 장비는 어떤 항목을 측정하나요?" → LLM 응답 생성     |
| 구현     | `/api/chat` 엔드포인트 → z-ai-web-dev-sdk LLM 호출       |
| UI       | 키오스크 화면 내 채팅 버블 또는 음성 응답 (TTS 연계)    |

### 9.2 VLM 스킬 — 이미지 분석

| 항목     | 설명                                                    |
| -------- | ------------------------------------------------------- |
| 용도 1   | 장비 사진 분석 — 사용자가 장비 사진을 찍으면 VLM이 상태 판별 |
| 용도 2   | 사용자 안면 인식 — 표정·피부색 분석으로 건강 상태 힌트  |
| 구현     | `<input type="file" accept="image/*">` → Base64 → VLM API |
| 예시     | "손가락이 센서에 올바르게 올려져 있는지 확인해 주세요"   |

### 9.3 ASR 스킬 — 음성 명령 인식

| 항목     | 설명                                                    |
| -------- | ------------------------------------------------------- |
| 용도     | 음성 명령으로 화면 전환·기능 실행                       |
| 예시     | "장비 소개 보여줘" → `setScreen('equipmentIntro')`       |
| 구현     | MediaRecorder → WAV → z-ai-web-dev-sdk ASR → 명령 매핑  |
| 대체     | 브라우저 Web Speech API (`SpeechRecognition`)도 가능      |

### 9.4 Web Search — 최신 장비 정보 검색

| 항목     | 설명                                                    |
| -------- | ------------------------------------------------------- |
| 용도     | 장비 소개 화면에 최신 사양·가이드라인 반영              |
| 예시     | "바이오그램 MINI 2025 사양" 검색 → 결과를 콘텐츠에 반영 |
| 구현     | `/api/web-search?q=…` → z-ai-web-dev-sdk Web Search      |
| 주의     | 검색 결과는 에이전트가 사실 확인 후 콘텐츠에 반영       |

### 9.5 확장 로드맵

```
Phase 1 (현재)  : 이미지 생성 + 콘텐츠 작성 + 코드 생성 + E2E 테스트
Phase 2 (단기)  : LLM 챗봇 + ASR 음성 명령
Phase 3 (중기)  : VLM 장비 사진 분석 + Web Search 최신 정보
Phase 4 (장기)  : VLM 안면 인식 + 멀티모달 대화 (음성+이미지+텍스트)
```

---

> **문서 버전**: v1.0  
> **최종 업데이트**: 2025-07-09  
> **프로젝트**: Biogram MINI Healthcare Equipment Education Kiosk
