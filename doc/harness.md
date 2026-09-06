# Biogram MINI 키오스크 테스트 하네스 문서

> Healthcare Equipment Education Kiosk — Test Harness & QA Strategy (한국어)

---

## 1. 테스트 전략 개요

본 프로젝트는 다음 3가지 축으로 테스트를 수행합니다.

| 축                    | 도구/방식                                    | 목적                                      |
|-----------------------|----------------------------------------------|-------------------------------------------|
| **E2E 브라우저 테스트** | `agent-browser` (headed 모드)                | 사용자 시나리오 기반 화면 렌더링·상호작용 검증 |
| **정적 분석**          | ESLint (`bun run lint`)                      | 코드 품질, Next.js 규칙 준수 확인          |
| **빌드 타임 타입 체크** | TypeScript 컴파일러                          | 타입 안정성, 런타임 에러 사전 방지           |

> **참고**: 단위 테스트 프레임워크(Jest, Vitest 등)는 본 프로젝트에서 사용하지 않습니다. 키오스크 애플리케이션의 특성상 브라우저 렌더링과 사용자 상호작용에 중점을 둡니다.

---

## 2. E2E 테스트 (agent-browser)

### 2.1 테스트 환경

| 항목           | 값                                       |
|----------------|------------------------------------------|
| 프레임워크      | Next.js 16 (App Router)                  |
| 개발 서버      | `http://localhost:3000` (bun run dev)    |
| 프록시         | Caddy (`http://localhost:81`)            |
| 브라우저       | Chromium (Playwright 기반)               |
| 실행 모드      | `--headed` (화면 표시 모드)              |
| 테스트 도구    | `agent-browser` CLI                      |

### 2.2 테스트 케이스

---

#### TC-01: 대기 화면 렌더링

**목적**: 키오스크 초기 대기 화면이 올바르게 렌더링되는지 확인

**단계**:
1. `agent-browser open http://localhost:3000`
2. `snapshot -i` (접근성 스냅샷 캡처)

**기대 결과**:
- ✅ "Biogram MINI" 제목 텍스트가 표시됨
- ✅ "시작하려면 화면을 터치하세요" 또는 시작 버튼이 표시됨
- ✅ 대기 화면 애니메이션 동작 중

---

#### TC-02: 세션 시작

**목적**: 대기 화면에서 터치 시 세션이 시작되고 메인 메뉴가 표시되는지 확인

**단계**:
1. 대기 화면에서 시작 버튼/화면 터치 — `click "시작"`
2. `snapshot -i`

**기대 결과**:
- ✅ 메인 메뉴 화면으로 전환됨
- ✅ 11개 메뉴 항목 표시:
  - 장비 소개
  - 측정 위치 안내
  - 앱 설치 안내
  - 회원가입 안내
  - 정맥(지정맥) 등록
  - 로그인 안내
  - 비회원 안내
  - 측정 모드
  - 측정 장비
  - 결과 안내
  - 이용 완료
- ✅ 진행률 바 (0/10) 표시

---

#### TC-03: 화면 전환

**목적**: 메인 메뉴에서 각 콘텐츠 화면으로 정상 전환되는지 확인

**단계**:
1. `click "장비 소개"` → `snapshot -i`
2. `goBack()` → 메인 메뉴
3. `click "측정 모드"` → `snapshot -i`
4. `goBack()` → 메인 메뉴
5. `click "정맥 등록"` → `snapshot -i`

**기대 결과**:
- ✅ 장비 소개 화면: Biogram MINI 설명, 이미지, QR 코드 표시
- ✅ 측정 모드 화면: 일반/심화 측정 모드 안내 표시
- ✅ 정맥 등록 화면: 지정맥 등록 절차 안내 표시
- ✅ 각 화면에서 뒤로가기 시 메인 메뉴 복귀

---

#### TC-04: 뒤로가기 / 홈 이동

**목적**: 네비게이션 내비게이션(뒤로가기, 홈)이 정상 동작하는지 확인

**단계**:
1. 메인 메뉴 → 장비 소개 → 측정 위치 안내 (2단계 이동)
2. `click "뒤로가기"` → `snapshot -i`
3. `click "홈"` → `snapshot -i`

**기대 결과**:
- ✅ 뒤로가기: 이전 화면(장비 소개)으로 복귀
- ✅ 홈 버튼: 메인 메뉴로 즉시 이동, history 초기화

---

#### TC-05: 완료 화면 → 대기 복귀

**목적**: 이용 완료 후 대기 화면으로 정상 복귀하는지 확인

**단계**:
1. 메인 메뉴 → `click "이용 완료"` → 완료 화면
2. `snapshot -i`
3. 대기 시간 경과 또는 터치 → 대기 화면

**기대 결과**:
- ✅ 완료 화면: 감사 메시지, 진행률 요약 표시
- ✅ 일정 시간 후 자동으로 대기 화면 복귀
- ✅ 세션 종료 이벤트(`session_end`) 로그 기록

---

#### TC-06: 글꼴 크기 조절

**목적**: 접근성 도구 모음의 글꼴 크기 조절이 정상 동작하는지 확인

**단계**:
1. 접근성 도구 모음 열기
2. `click "보통"` → `eval "getComputedStyle(document.documentElement).fontSize"`
3. `click "크게"` → `eval "document.documentElement.style.zoom"`
4. `click "아주 크게"` → `eval "document.documentElement.style.zoom"`

**기대 결과**:

| 글꼴 크기    | CSS zoom 값 | 설명            |
|-------------|-------------|-----------------|
| 보통        | `1`         | 기본 크기       |
| 크게        | `1.15`      | 15% 확대        |
| 아주 크게   | `1.3`       | 30% 확대        |

- ✅ 글꼴 크기 변경 시 전체 UI 비율 유지
- ✅ Zustand store에 상태 반영

---

#### TC-07: 고대비 모드

**목적**: 고대비 모드 토글이 정상 동작하는지 확인

**단계**:
1. 접근성 도구 모음에서 `click "고대비"`
2. `eval "document.documentElement.classList.contains('high-contrast')"`
3. `snapshot -i`
4. `click "고대비"` (다시 토글)
5. `eval "document.documentElement.classList.contains('high-contrast')"`

**기대 결과**:
- ✅ ON: `html` 요소에 `.high-contrast` 클래스 추가
- ✅ ON: 검은 배경, 흰 텍스트, 보더 강화, 포커스 표시 강화
- ✅ OFF: `.high-contrast` 클래스 제거, 일반 모드 복귀

---

#### TC-08: TTS 토글

**목적**: 음성 읽기(TTS) 토글이 정상 동작하는지 확인

**단계**:
1. 접근성 도구 모음에서 TTS 버튼 확인 — `Volume2` 아이콘 (OFF 상태)
2. `click "TTS"` → `VolumeX` 아이콘 (ON 상태) 확인
3. 화면 전환 시 음성 출력 발생 여부 확인
4. `click "TTS"` → `Volume2` 아이콘 (OFF 상태) 복귀

**기대 결과**:
- ✅ OFF → ON: `Volume2` 아이콘 → `VolumeX` 아이콘 전환
- ✅ ON 상태에서 화면 전환 시 한국어 음성 자동 출력
- ✅ ON → OFF: 음성 즉시 정지, 아이콘 복귀

---

#### TC-09: 모바일 뷰

**목적**: 모바일 해상도에서 바텀 네비게이션과 레이아웃이 정상 표시되는지 확인

**단계**:
1. 뷰포트 크기 변경 — `390 x 844` (iPhone 14 기준)
2. `agent-browser open http://localhost:3000 --viewport 390x844`
3. 세션 시작 → `snapshot -i`

**기대 결과**:
- ✅ 바텀 네비게이션 바 표시 (5개 탭)
- ✅ 메뉴 항목 그리드 레이아웃 모바일 최적화
- ✅ 헤더/푸터 모바일 적응형 렌더링
- ✅ 터치 타겟 최소 44px

---

#### TC-10: 하이드레이션 에러 없음

**목적**: React 하이드레이션 불일치 에러가 없는지 확인

**단계**:
1. `agent-browser open http://localhost:3000`
2. `errors` 커맨드 실행 — 콘솔 에러 수집

**기대 결과**:
- ✅ 하이드레이션 미스매치 에러 0건
- ✅ React 에러 0건
- ✅ Unhandled Promise Rejection 0건

---

### 2.3 실행 방법

`agent-browser` CLI를 사용한 단계별 E2E 테스트 실행 흐름입니다.

```bash
# 1. 브라우저 열기
agent-browser open http://localhost:3000

# 2. 접근성 스냅샷 캡처 (요소 식별용)
agent-browser snapshot -i

# 3. 요소 클릭
agent-browser click "시작"
agent-browser click "장비 소개"

# 4. JavaScript 평가 (상태 검증)
agent-browser eval "document.documentElement.classList.contains('high-contrast')"
agent-browser eval "document.documentElement.style.zoom"

# 5. 에러 확인
agent-browser errors
```

#### 전체 시나리오 스크립트

```bash
#!/bin/bash
# TC-01 ~ TC-10 순차 실행 예시

echo "=== TC-01: 대기 화면 렌더링 ==="
agent-browser open http://localhost:3000
agent-browser snapshot -i

echo "=== TC-02: 세션 시작 ==="
agent-browser click "시작"
agent-browser snapshot -i

echo "=== TC-03: 화면 전환 ==="
agent-browser click "장비 소개"
agent-browser snapshot -i
agent-browser click "뒤로가기"

echo "=== TC-06: 글꼴 크기 ==="
agent-browser eval "document.documentElement.style.zoom"

echo "=== TC-10: 하이드레이션 에러 ==="
agent-browser errors
```

---

## 3. 정적 분석

### 3.1 ESLint

Next.js 및 TypeScript 규칙에 따른 정적 분석을 수행합니다.

```bash
bun run lint
```

**검사 항목**:
- Next.js App Router 규칙 준수
- React Hooks 규칙 (exhaustive-deps, rules-of-hooks)
- TypeScript strict 모드 호환성
- 미사용 변수/임포트 감지
- 접근성 관련 권장 사항

**성공 기준**: 에러 0건, 경고는 검토 후 판단

### 3.2 TypeScript 빌드 타임 타입 체크

TypeScript 컴파일러를 통한 타입 안정성 검증입니다. `next build` 시 자동으로 수행됩니다.

```bash
# 타입 체크만 수행 (빌드 없이)
npx tsc --noEmit
```

**검사 항목**:
- Zustand store 타입 안정성 (`KioskState` 인터페이스)
- Prisma Client 생성 타입 (`KioskLog`, `KioskContent`)
- API Route 핸들러 타입 (`NextRequest`, `NextResponse`)
- React 컴포넌트 Props 타입

---

## 4. API 테스트

`curl`을 사용한 API 엔드포인트 수동 테스트 방법입니다.

### 4.1 POST /api/logs — 이벤트 로그 생성

```bash
curl -X POST http://localhost:3000/api/logs \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "test-session-001",
    "eventType": "navigate",
    "screen": "equipment-intro",
    "detail": "main"
  }'
```

**기대 응답**:
```json
{ "success": true }
```

#### eventType별 테스트

```bash
# 세션 시작
curl -X POST http://localhost:3000/api/logs \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"test","eventType":"session_start","screen":"main","detail":"standby"}'

# 화면 전환
curl -X POST http://localhost:3000/api/logs \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"test","eventType":"navigate","screen":"equipment-intro","detail":"main"}'

# 뒤로가기
curl -X POST http://localhost:3000/api/logs \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"test","eventType":"back","screen":"main","detail":"equipment-intro"}'

# 홈 이동
curl -X POST http://localhost:3000/api/logs \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"test","eventType":"home","screen":"main"}'

# 유휴 타임아웃
curl -X POST http://localhost:3000/api/logs \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"test","eventType":"idle_timeout","screen":"standby","detail":"equipment-intro"}'

# 세션 종료
curl -X POST http://localhost:3000/api/logs \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"test","eventType":"session_end","screen":"standby","detail":"main"}'
```

#### 에러 케이스

```bash
# 필수 필드 누락 (400)
curl -X POST http://localhost:3000/api/logs \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"test"}'
# → { "error": "Missing required fields" }
```

### 4.2 GET /api/logs — 로그 조회

```bash
curl http://localhost:3000/api/logs
```

**기대 응답**:
```json
[
  {
    "id": "clx…",
    "sessionId": "test-session-001",
    "eventType": "navigate",
    "screen": "equipment-intro",
    "detail": "main",
    "createdAt": "2025-01-15T09:30:00.000Z"
  }
]
```

> 최대 100건, 최신순(`createdAt desc`) 정렬

### 4.3 GET /api/content — 콘텐츠 조회

```bash
curl http://localhost:3000/api/content
```

**기대 응답**:
```json
[
  {
    "id": "clx…",
    "section": "equipment-intro",
    "title": "장비 소개",
    "body": "…",
    "imageUrl": "/kiosk-images/equipment.png",
    "qrCodeUrl": null,
    "updatedAt": "2025-01-15T09:00:00.000Z",
    "createdAt": "2025-01-15T08:00:00.000Z"
  }
]
```

### 4.4 PUT /api/content — 콘텐츠 Upsert

```bash
# 신규 생성
curl -X PUT http://localhost:3000/api/content \
  -H "Content-Type: application/json" \
  -d '{
    "section": "equipment-intro",
    "title": "장비 소개",
    "body": "Biogram MINI는 체내 전용 측정 장비입니다.",
    "imageUrl": "/kiosk-images/equipment.png"
  }'

# 동일 section으로 업데이트
curl -X PUT http://localhost:3000/api/content \
  -H "Content-Type: application/json" \
  -d '{
    "section": "equipment-intro",
    "title": "장비 소개 (수정)",
    "body": "업데이트된 내용입니다."
  }'
```

#### 에러 케이스

```bash
# 필수 필드 누락 (400)
curl -X PUT http://localhost:3000/api/content \
  -H "Content-Type: application/json" \
  -d '{"section":"test"}'
# → { "error": "Missing required fields" }
```

### 4.5 GET /api — 헬스 체크

```bash
curl http://localhost:3000/api
```

**기대 응답**:
```json
{ "status": "ok" }
```

---

## 5. 접근성 테스트 체크리스트

### 5.1 WCAG 2.1 AA 준수

| 검증 항목              | 기준                                        | 확인 방법                          |
|-----------------------|---------------------------------------------|------------------------------------|
| **색 대비**           | 일반 텍스트 4.5:1 이상, 대형 텍스트 3:1 이상 | 브라우저 개발자도구 + 대비 분석기   |
| **터치 타겟**         | 최소 44×44px                                | `eval`로 요소 크기 측정            |
| **스크린 리더**       | 시맨틱 HTML, ARIA 속성, 라이브 리전         | VoiceOver/NVDA 실기 테스트         |
| **키보드 탐색**       | Tab 포커스 이동, Enter/Space 활성화         | 키보드만으로 전체 흐름 수행         |
| **포커스 표시**       | 모든 대화형 요소에 포커스 링 표시           | 시각적 확인 + `:focus-visible`     |
| **의미 있는 마크업**  | `<main>`, `<nav>`, `<header>`, `<section>`  | DOM 구조 검사                      |
| **이미지 대체 텍스트** | 모든 `<img>`에 `alt` 속성                   | `eval`로 `img.alt` 빈 값 확인      |

### 5.2 TTS (음성 읽기)

| 검증 항목              | 기준                                        | 상태    |
|-----------------------|---------------------------------------------|---------|
| **한국어 음성 출력**  | `lang="ko-KR"` 음성 엔진 사용               | ✅ 구현 |
| **음성 속도**         | `rate: 0.85` (기본 속도의 85%)               | ✅ 구현 |
| **화면 전환 자동 읽기** | `autoSpeak` 옵션 활성 시 화면 진입마다 자동  | ✅ 구현 |
| **TTS 토글**          | ON/OFF 전환, OFF 시 즉시 정지                | ✅ 구현 |
| **음성 엔진 폴백**    | 한국어 음성 없을 시 `ko-KR` lang 설정        | ✅ 구현 |

**관련 코드**:
```typescript
// src/hooks/use-tts.ts
const SPEECH_RATE = 0.85;      // 음성 속도
const SPEECH_PITCH = 1.0;      // 피치
const SPEECH_VOLUME = 1.0;     // 볼륨
```

### 5.3 고대비 모드

| 검증 항목              | 기준                                        | 상태    |
|-----------------------|---------------------------------------------|---------|
| **전 대비 전환**      | 검은 배경 + 흰 텍스트                       | ✅ 구현 |
| **보더 강화**         | 카드/버튼 보더 가시성 증가                   | ✅ 구현 |
| **포커스 표시**       | 포커스 링 색상/두께 강화                     | ✅ 구현 |
| **클래스 토글**       | `html.high-contrast` 클래스 추가/제거        | ✅ 구현 |

---

## 6. 성능 테스트

### 6.1 Core Web Vitals

| 지표                     | 목표        | 측정 방법                     |
|-------------------------|-------------|-------------------------------|
| **LCP** (최대 콘텐츠 페인트) | < 2.5초    | Chrome DevTools Performance   |
| **FID** (최초 입력 지연)    | < 100ms    | Chrome DevTools Performance   |
| **CLS** (누적 레이아웃 이동) | < 0.1      | Chrome DevTools Performance   |

### 6.2 키오스크 특화 성능

| 지표                     | 목표        | 측정 방법                                   |
|-------------------------|-------------|---------------------------------------------|
| **화면 전환**            | < 0.5초    | `navigateTo()` → 렌더링 완료 시간 측정       |
| **TTS 응답**             | < 200ms    | `speak()` 호출 → 음성 출력 시작 시간 측정     |
| **유휴 타임아웃 정확도**  | 120초 ± 1초 | `resetIdleTimer()` → `endSession()` 시간 측정 |
| **세션 시작**            | < 0.3초    | 터치 → 메인 메뉴 렌더링 완료 시간 측정        |
| **API 응답**             | < 100ms    | `POST /api/logs` → `{ success: true }` 시간   |

### 6.3 성능 측정 스크립트 예시

```bash
# LCP 측정 (Chrome DevTools Protocol)
agent-browser eval "
  new Promise(resolve => {
    new PerformanceObserver(list => {
      const entries = list.getEntries();
      const last = entries[entries.length - 1];
      resolve(last.startTime);
    }).observe({type: 'largest-contentful-paint', buffered: true});
  })
"

# 화면 전환 시간 측정
agent-browser eval "
  const start = performance.now();
  document.querySelector('[data-testid=\"menu-item\"]').click();
  performance.now() - start;
"
```

---

## 7. CI/CD 파이프라인 (향후 계획)

현재는 로컬 개발 환경에서의 수동 테스트를 기준으로 하며, 향후 CI/CD 파이프라인 도입을 계획합니다.

### 7.1 파이프라인 단계

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   lint      │───▶│ type-check  │───▶│   build     │───▶│    E2E      │
│             │    │             │    │             │    │             │
│ bun run     │    │ tsc         │    │ next build  │    │ agent-      │
│ lint        │    │ --noEmit    │    │             │    │ browser     │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
```

### 7.2 단계별 상세

| 단계         | 명령어                 | 실패 시 동작     | 소요 시간 (예상) |
|-------------|------------------------|-----------------|------------------|
| **lint**    | `bun run lint`        | 파이프라인 중단  | ~5초             |
| **type-check** | `npx tsc --noEmit` | 파이프라인 중단  | ~10초            |
| **build**   | `bun run build`       | 파이프라인 중단  | ~30초            |
| **E2E**     | `agent-browser` 시나리오 실행 | 리포트 생성  | ~60초            |

### 7.3 향후 개선 사항

- [ ] GitHub Actions 워크플로우 구성
- [ ] PR 시 자동 lint + type-check 실행
- [ ] main 브랜치 머지 시 전체 파이프라인 실행
- [ ] E2E 테스트 결과 아티팩트 저장 (스크린샷, 로그)
- [ ] 성능 리그레션 감지 (LCP, 화면 전환 시간 기준선 설정)
- [ ] 접근성 자동 감사 (axe-core 통합)

---

## 8. 부록: 테스트 체크리스트 요약

| ID     | 테스트 항목             | 도구             | 우선순위 |
|--------|------------------------|------------------|----------|
| TC-01  | 대기 화면 렌더링       | agent-browser    | P0       |
| TC-02  | 세션 시작              | agent-browser    | P0       |
| TC-03  | 화면 전환              | agent-browser    | P0       |
| TC-04  | 뒤로가기/홈 이동       | agent-browser    | P0       |
| TC-05  | 완료 화면 → 대기 복귀  | agent-browser    | P1       |
| TC-06  | 글꼴 크기 조절         | agent-browser    | P1       |
| TC-07  | 고대비 모드            | agent-browser    | P1       |
| TC-08  | TTS 토글              | agent-browser    | P1       |
| TC-09  | 모바일 뷰             | agent-browser    | P2       |
| TC-10  | 하이드레이션 에러      | agent-browser    | P0       |
| —      | ESLint 정적 분석       | bun run lint     | P0       |
| —      | TypeScript 타입 체크   | tsc --noEmit     | P0       |
| —      | API 엔드포인트         | curl             | P1       |
| —      | WCAG 2.1 AA 접근성    | 수동 + axe-core  | P1       |
| —      | Core Web Vitals        | DevTools         | P2       |
