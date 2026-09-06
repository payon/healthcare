# Biogram MINI 키오스크 API 문서

> Healthcare Equipment Education Kiosk — API Reference (한국어)

---

## 1. API 개요

본 프로젝트는 **Next.js 16 App Router** 기반의 API Routes를 사용하여 키오스크 클라이언트와 데이터베이스 사이의 통신을 처리합니다.

### 엔드포인트 목록

| 엔드포인트        | 메서드      | 설명                      |
|-------------------|------------|---------------------------|
| `/api/logs`       | `POST`     | 익명 이벤트 로그 생성       |
| `/api/logs`       | `GET`      | 최근 100개 로그 조회        |
| `/api/content`    | `GET`      | 전체 콘텐츠 조회            |
| `/api/content`    | `PUT`      | 콘텐츠 upsert (section 기준) |
| `/api`            | `GET`      | 헬스 체크                   |

### 아키텍처 개요

```
[키오스크 클라이언트]
       │
       │  fetch('/api/…')
       ▼
[Next.js API Route Handler]  ←  src/app/api/*/route.ts
       │
       │  db.$query / db.$mutation
       ▼
[Prisma Client]  ←  @prisma/client
       │
       ▼
[SQLite]  ←  db/custom.db
```

---

## 2. POST /api/logs — 익명 이벤트 로그 생성

키오스크에서 발생하는 사용자 이벤트(화면 전환, 세션 시작/종료, 유휴 타임아웃 등)를 익명으로 기록합니다.

### Request

```http
POST /api/logs
Content-Type: application/json
```

```json
{
  "sessionId": "string (필수)",
  "eventType": "string (필수)",
  "screen": "string (선택)",
  "detail": "string (선택)"
}
```

| 필드         | 타입     | 필수 | 설명                                    |
|-------------|----------|------|-----------------------------------------|
| `sessionId` | `string` | ✅   | 세션 고유 식별자 (Zustand에서 자동 생성)   |
| `eventType` | `string` | ✅   | 이벤트 유형 (아래 eventType 참조)          |
| `screen`    | `string` | ❌   | 이벤트가 발생한 화면 식별자                |
| `detail`    | `string` | ❌   | 부가 정보 (예: 이전 화면명)               |

### eventType 종류

| eventType         | 설명                                                    |
|-------------------|---------------------------------------------------------|
| `navigate`        | 화면 전환 — `navigateTo(screen)` 호출 시                |
| `back`            | 뒤로가기 — `goBack()` 호출 시                           |
| `home`            | 홈 이동 — `goHome()` 호출 시                            |
| `session_start`   | 세션 시작 — `startSession()` 호출 시 (standby → main)   |
| `session_end`     | 세션 종료 — `endSession()` 호출 시                      |
| `idle_timeout`    | 유휴 타임아웃 — 120초 무조작 후 자동 종료 시             |

### Response

**200 OK** — 로그 저장 성공

```json
{ "success": true }
```

**400 Bad Request** — 필수 필드 누락

```json
{ "error": "Missing required fields" }
```

**500 Internal Server Error** — 서버 내부 오류

```json
{ "error": "Internal error" }
```

### 구현 코드

```typescript
// src/app/api/logs/route.ts
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, eventType, screen, detail } = body;

    if (!sessionId || !eventType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await db.kioskLog.create({
      data: {
        sessionId,
        eventType,
        screen: screen || null,
        detail: detail || null,
      },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
```

---

## 3. GET /api/logs — 최근 100개 로그 조회

키오스크 이벤트 로그를 최신순으로 최대 100개까지 조회합니다.

### Request

```http
GET /api/logs
```

### Response

**200 OK**

```json
[
  {
    "id": "clx…",
    "sessionId": "abc123",
    "eventType": "navigate",
    "screen": "equipment-intro",
    "detail": "main",
    "createdAt": "2025-01-15T09:30:00.000Z"
  }
]
```

### KioskLog 스키마

| 필드         | 타입     | 설명                    |
|-------------|----------|-------------------------|
| `id`        | `string` | CUID 자동 생성 기본키    |
| `sessionId` | `string` | 세션 식별자              |
| `eventType` | `string` | 이벤트 유형              |
| `screen`    | `string` | 화면 식별자 (nullable)   |
| `detail`    | `string` | 부가 정보 (nullable)     |
| `createdAt` | `string` | 생성 일시 (ISO 8601)     |

### 구현 코드

```typescript
export async function GET() {
  try {
    const logs = await db.kioskLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return NextResponse.json(logs);
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
```

---

## 4. GET /api/content — 전체 콘텐츠 조회

키오스크에 표시되는 교육 콘텐츠를 section 오름차순으로 전체 조회합니다.

### Request

```http
GET /api/content
```

### Response

**200 OK**

```json
[
  {
    "id": "clx…",
    "section": "equipment-intro",
    "title": "장비 소개",
    "body": "Biogram MINI는…",
    "imageUrl": "/kiosk-images/equipment.png",
    "qrCodeUrl": null,
    "updatedAt": "2025-01-15T09:00:00.000Z",
    "createdAt": "2025-01-15T08:00:00.000Z"
  }
]
```

### KioskContent 스키마

| 필드         | 타입     | 설명                              |
|-------------|----------|-----------------------------------|
| `id`        | `string` | CUID 자동 생성 기본키              |
| `section`   | `string` | 섹션 식별자 (unique)               |
| `title`     | `string` | 콘텐츠 제목                        |
| `body`      | `string` | 콘텐츠 본문                        |
| `imageUrl`  | `string` | 이미지 URL (nullable)              |
| `qrCodeUrl` | `string` | QR 코드 URL (nullable)             |
| `updatedAt` | `string` | 최종 수정 일시 (ISO 8601, 자동)    |
| `createdAt` | `string` | 생성 일시 (ISO 8601, 자동)         |

### 구현 코드

```typescript
export async function GET() {
  try {
    const contents = await db.kioskContent.findMany({
      orderBy: { section: 'asc' },
    });
    return NextResponse.json(contents);
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
```

---

## 5. PUT /api/content — 콘텐츠 Upsert

`section` 필드를 기준으로 콘텐츠를 생성하거나 업데이트합니다. 동일한 `section`이 존재하면 업데이트, 없으면 새로 생성합니다.

### Request

```http
PUT /api/content
Content-Type: application/json
```

```json
{
  "section": "string (필수)",
  "title": "string (필수)",
  "body": "string (선택)",
  "imageUrl": "string (선택)",
  "qrCodeUrl": "string (선택)"
}
```

| 필드         | 타입     | 필수 | 설명                |
|-------------|----------|------|---------------------|
| `section`   | `string` | ✅   | 섹션 식별자 (unique) |
| `title`     | `string` | ✅   | 콘텐츠 제목          |
| `body`      | `string` | ❌   | 콘텐츠 본문          |
| `imageUrl`  | `string` | ❌   | 이미지 URL           |
| `qrCodeUrl` | `string` | ❌   | QR 코드 URL          |

### Response

**200 OK** — upsert된 콘텐츠 객체 반환

```json
{
  "id": "clx…",
  "section": "equipment-intro",
  "title": "장비 소개",
  "body": "Biogram MINI는…",
  "imageUrl": "/kiosk-images/equipment.png",
  "qrCodeUrl": null,
  "updatedAt": "2025-01-15T09:30:00.000Z",
  "createdAt": "2025-01-15T08:00:00.000Z"
}
```

**400 Bad Request** — 필수 필드 누락

```json
{ "error": "Missing required fields" }
```

**500 Internal Server Error** — 서버 내부 오류

```json
{ "error": "Internal error" }
```

### 구현 코드

```typescript
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { section, title, body: content, imageUrl, qrCodeUrl } = body;

    if (!section || !title) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const upserted = await db.kioskContent.upsert({
      where: { section },
      update: {
        title,
        body: content || '',
        imageUrl: imageUrl || null,
        qrCodeUrl: qrCodeUrl || null,
      },
      create: {
        section,
        title,
        body: content || '',
        imageUrl: imageUrl || null,
        qrCodeUrl: qrCodeUrl || null,
      },
    });

    return NextResponse.json(upserted);
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
```

---

## 6. GET /api — 헬스 체크

서버가 정상적으로 응답하는지 확인하는 헬스 체크 엔드포인트입니다.

### Request

```http
GET /api
```

### Response

**200 OK**

```json
{ "status": "ok" }
```

---

## 7. 에러 처리

모든 API Route 핸들러는 동일한 에러 처리 패턴을 따릅니다.

### 패턴

```typescript
export async function HANDLER(request: NextRequest) {
  try {
    // 1. 요청 파싱 및 유효성 검사
    const body = await request.json();
    if (!requiredField) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 2. 데이터베이스 조작
    const result = await db.model.operation({ data: ... });

    // 3. 성공 응답
    return NextResponse.json(result);
  } catch {
    // 4. 내부 서버 오류 응답
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
```

### 에러 응답 형식

| 상태 코드 | 상황                 | 응답 본문                            |
|----------|----------------------|--------------------------------------|
| `400`    | 필수 필드 누락       | `{ "error": "Missing required fields" }` |
| `500`    | 서버 내부 오류       | `{ "error": "Internal error" }`      |

### 클라이언트 측 에러 처리

클라이언트(`logEvent` 함수)에서는 API 호출 실패 시 **조용히 무시(silent fail)**하여 키오스크 사용자 경험에 영향을 주지 않습니다.

```typescript
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
    // Silently fail — 키오스크 UI에 영향 없음
  }
}
```

---

## 8. 데이터베이스

### 기술 스택

| 항목          | 기술                                         |
|--------------|----------------------------------------------|
| ORM          | Prisma Client (`@prisma/client`)             |
| 데이터베이스  | SQLite                                       |
| DB 파일 위치 | `db/custom.db`                               |
| 스키마 파일  | `prisma/schema.prisma`                       |
| 클라이언트   | `import { db } from '@/lib/db'`              |

### Prisma 스키마

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

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

### 마이그레이션

```bash
# 스키마 변경 후 DB에 반영
bun run db:push
```

---

## 9. 시퀀스 다이어그램

### 9.1 세션 시작

```
사용자          키오스크 클라이언트         API 서버           Prisma          SQLite
 │                  │                      │                 │               │
 │  화면 터치       │                      │                 │               │
 │─────────────────▶│                      │                 │               │
 │                  │  startSession()      │                 │               │
 │                  │  sessionId 생성      │                 │               │
 │                  │                      │                 │               │
 │                  │  POST /api/logs      │                 │               │
 │                  │  { sessionId,        │                 │               │
 │                  │    eventType:        │                 │               │
 │                  │    "session_start",  │                 │               │
 │                  │    screen: "main",   │                 │               │
 │                  │    detail: "standby"}│                 │               │
 │                  │─────────────────────▶│                 │               │
 │                  │                      │  db.kioskLog    │               │
 │                  │                      │    .create()    │               │
 │                  │                      │────────────────▶│               │
 │                  │                      │                 │  INSERT INTO  │
 │                  │                      │                 │  KioskLog     │
 │                  │                      │                 │──────────────▶│
 │                  │                      │                 │               │
 │                  │  { success: true }   │                 │               │
 │                  │◀─────────────────────│                 │               │
 │                  │                      │                 │               │
 │  메인 메뉴 표시  │                      │                 │               │
 │◀─────────────────│                      │                 │               │
```

### 9.2 화면 전환 (navigate)

```
사용자          키오스크 클라이언트         API 서버           Prisma          SQLite
 │                  │                      │                 │               │
 │  메뉴 항목 터치  │                      │                 │               │
 │─────────────────▶│                      │                 │               │
 │                  │  navigateTo(screen)  │                 │               │
 │                  │  history 업데이트    │                 │               │
 │                  │                      │                 │               │
 │                  │  POST /api/logs      │                 │               │
 │                  │  { sessionId,        │                 │               │
 │                  │    eventType:        │                 │               │
 │                  │    "navigate",       │                 │               │
 │                  │    screen,           │                 │               │
 │                  │    detail: fromScreen}│                │               │
 │                  │─────────────────────▶│                 │               │
 │                  │                      │  db.kioskLog    │               │
 │                  │                      │    .create()    │               │
 │                  │                      │────────────────▶│               │
 │                  │                      │                 │  INSERT INTO  │
 │                  │                      │                 │  KioskLog     │
 │                  │                      │                 │──────────────▶│
 │                  │                      │                 │               │
 │                  │  { success: true }   │                 │               │
 │                  │◀─────────────────────│                 │               │
 │                  │                      │                 │               │
 │  새 화면 렌더링  │                      │                 │               │
 │◀─────────────────│                      │                 │               │
```

### 9.3 유휴 타임아웃 (120초)

```
타이머          키오스크 클라이언트         API 서버           Prisma          SQLite
 │                  │                      │                 │               │
 │  120초 경과      │                      │                 │               │
 │─────────────────▶│                      │                 │               │
 │                  │  idle_timeout 감지   │                 │               │
 │                  │                      │                 │               │
 │                  │  POST /api/logs      │                 │               │
 │                  │  { sessionId,        │                 │               │
 │                  │    eventType:        │                 │               │
 │                  │    "idle_timeout",   │                 │               │
 │                  │    screen: "standby",│                 │               │
 │                  │    detail: currentScreen}│             │               │
 │                  │─────────────────────▶│                 │               │
 │                  │                      │  db.kioskLog    │               │
 │                  │                      │    .create()    │               │
 │                  │                      │────────────────▶│               │
 │                  │                      │                 │  INSERT INTO  │
 │                  │                      │                 │  KioskLog     │
 │                  │                      │                 │──────────────▶│
 │                  │                      │                 │               │
 │                  │  { success: true }   │                 │               │
 │                  │◀─────────────────────│                 │               │
 │                  │                      │                 │               │
 │                  │  endSession()        │                 │               │
 │                  │  → standby 화면 복귀 │                 │               │
 │                  │                      │                 │               │
```

---

## 10. 부록: 화면 식별자 목록

키오스크에서 사용하는 `screen` 값의 전체 목록입니다.

| screen                  | 설명              |
|------------------------|-------------------|
| `standby`              | 대기 화면         |
| `main`                 | 메인 메뉴         |
| `equipment-intro`      | 장비 소개         |
| `location`             | 측정 위치 안내    |
| `app-install`          | 앱 설치 안내      |
| `signup`               | 회원가입 안내     |
| `vein-register`        | 정맥(지정맥) 등록 |
| `login`                | 로그인 안내       |
| `non-member`           | 비회원 안내       |
| `measurement-mode`     | 측정 모드         |
| `measurement-equipment`| 측정 장비         |
| `results`              | 결과 안내         |
| `completion`           | 완료 화면         |
