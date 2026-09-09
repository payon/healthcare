# Biogram MINI 관리자 대시보드 — 데이터베이스 설계 문서

> 버전: 1.0.0  
> 최종 수정: 2026-03-06  
> 작성자: Biogram MINI 개발팀

---

## 1. 데이터베이스 개요

| 항목 | 내용 |
|------|------|
| **DBMS** | SQLite (로컬 파일) |
| **파일 위치** | `db/custom.db` |
| **ORM** | Prisma Client |
| **관리자 관련 모델 수** | 3개 (AdminUser, AdminSession, AuditLog) |
| **총 모델 수** | 9개 (키오스크 6개 + 관리자 3개) |
| **관리 방식** | `prisma db push` (마이그레이션 미사용) |

---

## 2. 관리자 모델 ER 다이어그램

```
┌─────────────────────┐       ┌──────────────────────┐
│     AdminUser       │       │    AdminSession      │
│─────────────────────│       │──────────────────────│
│ id (PK, CUID)       │◀──────│ userId (FK)          │
│ email (UQ)          │       │ token (UQ)           │
│ passwordHash        │       │ expiresAt            │
│ name                │       │ createdAt            │
│ role                │       └──────────────────────┘
│ isActive            │              │ onDelete: Cascade
│ failedAttempts      │
│ lockedUntil         │       ┌──────────────────────┐
│ lastLoginAt         │◀──────│      AuditLog        │
│ createdAt           │       │──────────────────────│
│ updatedAt           │       │ userId (FK, nullable)│
└─────────────────────┘       │ action               │
       │                       │ entity               │
       │                       │ entityId             │
       │                       │ changes (JSON)       │
       │                       │ createdAt            │
       │                       └──────────────────────┘
       │
       │    (키오스크 모델 — 기존)
       │
       ├────── KioskContent (1:N) ──── ContentSection
       ├────── MeasurementItem (1:N) ── MeasurementEquipment
       ├────── KioskLog
       └────── KioskSession
```

---

## 3. 관리자 모델 상세

### 3.1 AdminUser — 관리자 계정

| 필드 | 타입 | 제약 | 설명 |
|------|------|------|------|
| `id` | String | PK, CUID | 고유 식별자 (`@id @default(cuid())`) |
| `email` | String | UNIQUE, NOT NULL | 로그인 이메일 (`@unique`) |
| `passwordHash` | String | NOT NULL | bcrypt 해시 (cost=12) |
| `name` | String | NOT NULL | 표시 이름 |
| `role` | String | DEFAULT 'editor' | 역할: `superadmin` / `admin` / `editor` / `viewer` |
| `isActive` | Boolean | DEFAULT true | 계정 활성 여부 |
| `failedAttempts` | Int | DEFAULT 0 | 연속 로그인 실패 횟수 |
| `lockedUntil` | DateTime | nullable | 계정 잠금 만료 시간 |
| `lastLoginAt` | DateTime | nullable | 마지막 로그인 시간 |
| `createdAt` | DateTime | `@default(now())` | 생성 시간 |
| `updatedAt` | DateTime | `@updatedAt` | 수정 시간 |

**관계**:
- `sessions` → `AdminSession[]` (1:N)
- `auditLogs` → `AuditLog[]` (1:N)

**비즈니스 규칙**:
- `email`은 시스템 전체에서 고유해야 함
- `role`은 4가지 값만 허용: `superadmin`, `admin`, `editor`, `viewer`
- `isActive = false`인 계정은 로그인 불가 (물리 삭제 대신 비활성화)
- `failedAttempts` ≥ 5 → `lockedUntil` = 현재 + 15분
- superadmin 계정은 자기 자신을 비활성화할 수 없음

**Prisma 스키마**:
```prisma
model AdminUser {
  id              String    @id @default(cuid())
  email           String    @unique
  passwordHash    String
  name            String
  role            String    @default("editor")
  isActive        Boolean   @default(true)
  failedAttempts  Int       @default(0)
  lockedUntil     DateTime?
  lastLoginAt     DateTime?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  sessions        AdminSession[]
  auditLogs       AuditLog[]
}
```

---

### 3.2 AdminSession — 관리자 세션

| 필드 | 타입 | 제약 | 설명 |
|------|------|------|------|
| `id` | String | PK, CUID | 고유 식별자 |
| `userId` | String | FK → AdminUser.id | 세션 소유자 |
| `token` | String | UNIQUE, NOT NULL | JWT 토큰 |
| `expiresAt` | DateTime | NOT NULL | 세션 만료 시간 (8시간) |
| `createdAt` | DateTime | `@default(now())` | 생성 시간 |

**관계**:
- `user` → `AdminUser` (`@relation(fields: [userId], references: [id], onDelete: Cascade)`)

**비즈니스 규칙**:
- `token`은 JWT 서명된 문자열이며 시스템 전체에서 고유
- `expiresAt` = `createdAt` + 8시간
- AdminUser 삭제 시 연관 세션 모두 자동 삭제 (Cascade)
- 세션 만료 또는 로그아웃 시 DB에서 레코드 삭제
- 동일 사용자의 다중 세션 허용 (다중 기기 로그인)

**Prisma 스키마**:
```prisma
model AdminSession {
  id        String   @id @default(cuid())
  userId    String
  token     String   @unique
  expiresAt DateTime
  createdAt DateTime @default(now())
  user      AdminUser @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

---

### 3.3 AuditLog — 감사 로그

| 필드 | 타입 | 제약 | 설명 |
|------|------|------|------|
| `id` | String | PK, CUID | 고유 식별자 |
| `userId` | String | FK → AdminUser.id (nullable) | 작업자 (시스템 작업 시 null) |
| `action` | String | NOT NULL | 액션: `create` / `update` / `delete` |
| `entity` | String | NOT NULL | 엔티티명 (예: `KioskContent`, `MeasurementItem`, `AdminUser`) |
| `entityId` | String | nullable | 엔티티 인스턴스 ID |
| `changes` | String | DEFAULT '{}' | 변경 내용 (JSON 문자열) |
| `createdAt` | DateTime | `@default(now())` | 생성 시간 |

**관계**:
- `user` → `AdminUser?` (nullable, `@relation(fields: [userId], references: [id])`)

**특성**: **append-only** (삭제·수정 불가)

**Prisma 스키마**:
```prisma
model AuditLog {
  id        String   @id @default(cuid())
  userId    String?
  action    String
  entity    String
  entityId  String?
  changes   String   @default("{}")
  createdAt DateTime @default(now())
  user      AdminUser? @relation(fields: [userId], references: [id])
}
```

---

## 4. 인증 흐름 (데이터베이스 관점)

### 4.1 로그인 흐름

```
1. 클라이언트 → POST /api/admin/auth/login { email, password }
                     │
                     ▼
2. AdminUser 조회   │  db.adminUser.findUnique({ where: { email } })
                     │
                     ├── 계정 없음 → 401 AUTH_INVALID
                     ├── isActive = false → 401 AUTH_INVALID
                     ├── 잠금 확인     │  checkLockout(email)
                     │   ├── lockedUntil > now → 423 ACCOUNT_LOCKED
                     │   └── lockedUntil ≤ now → 잠금 만료, 진행
                     │
3. 비밀번호 검증    │  bcrypt.compare(password, passwordHash)
                     │
                     ├── 불일치 → recordFailedAttempt(email)
                     │            ├── failedAttempts < 5 → 401 AUTH_INVALID
                     │            └── failedAttempts ≥ 5 → lockedUntil 설정 → 423 ACCOUNT_LOCKED
                     │
                     └── 일치 → resetFailedAttempts(userId)
                               → failedAttempts = 0, lockedUntil = null, lastLoginAt = now
                               │
4. JWT 생성         │  jose.SignJWT({ sub: userId, role })
                     │  .setExpirationTime('8h')
                     │  .sign(SECRET)
                     │
5. 세션 저장        │  db.adminSession.create({
                     │    userId, token: jwt, expiresAt: now + 8h
                     │  })
                     │
6. 쿠키 설정        │  Set-Cookie: admin_session=<JWT>
                     │  HttpOnly; Secure; SameSite=Strict
                     │  Path=/api/admin; Max-Age=28800
                     │
7. 응답             │  200 OK { user: { id, email, name, role, lastLoginAt } }
```

### 4.2 세션 검증 흐름

```
1. API 요청 수신   │  Cookie: admin_session=<JWT>
                     │
2. JWT 검증        │  jose.jwtVerify(token, SECRET)
                     │
                     ├── 무효 (변조/만료) → 401 AUTH_REQUIRED
                     │
3. 세션 DB 확인    │  db.adminSession.findUnique({ where: { token } })
                     │
                     ├── 세션 없음 (로그아웃됨) → 401 SESSION_EXPIRED
                     ├── expiresAt < now → 401 SESSION_EXPIRED
                     │
4. 사용자 조회     │  db.adminUser.findUnique({ where: { id: payload.sub } })
                     │
                     ├── 사용자 없음 → 401 AUTH_REQUIRED
                     ├── isActive = false → 401 AUTH_REQUIRED
                     │
5. RBAC 확인       │  requirePermission(user.role, requiredPermission)
                     │
                     ├── 권한 없음 → 403 RBAC_DENIED
                     │
6. 핸들러 실행     │  handler(req, { userId, role })
```

### 4.3 로그아웃 흐름

```
1. 클라이언트 → POST /api/admin/auth/logout
                     │
2. 세션 삭제       │  db.adminSession.delete({ where: { token } })
                     │
3. 쿠키 삭제       │  Set-Cookie: admin_session=; Max-Age=0
                     │
4. 응답            │  200 OK { success: true }
```

---

## 5. RBAC 데이터 모델

### 5.1 역할 정의

| 역할 | 코드 | 수준 | 설명 |
|------|------|------|------|
| 최고 관리자 | `superadmin` | 4 | 시스템 전체 권한, 역할 변경 가능 |
| 운영 관리자 | `admin` | 3 | 콘텐츠·계정 관리, 역할 변경 불가 |
| 편집자 | `editor` | 2 | 콘텐츠·이미지·측정 항목 편집 |
| 열람자 | `viewer` | 1 | 읽기 전용, 감사 로그 열람 |

### 5.2 권한 정의 (11개)

| 권한 | 코드 | 설명 |
|------|------|------|
| 콘텐츠 열람 | `content:read` | 13개 화면 콘텐츠 조회 |
| 콘텐츠 수정 | `content:write` | 콘텐츠 생성/수정/삭제 |
| 사용자 열람 | `users:read` | 관리자 계정 목록 조회 |
| 사용자 관리 | `users:write` | 계정 생성/수정/비활성화 |
| 역할 변경 | `users:role` | 계정 역할 변경 (superadmin 전용) |
| 측정항목 열람 | `measurements:read` | 측정 항목/장비 조회 |
| 측정항목 관리 | `measurements:write` | 측정 항목/장비 생성/수정/삭제 |
| 이미지 업로드 | `images:upload` | 이미지 업로드/관리 |
| 설정 열람 | `settings:read` | 시스템 설정 조회 |
| 설정 변경 | `settings:write` | 시스템 설정 수정 (superadmin 전용) |
| 감사 로그 열람 | `audit:read` | 감사 로그 조회/필터 |

### 5.3 권한 매트릭스 (4역할 × 11권한)

| 권한 | superadmin | admin | editor | viewer |
|------|:----------:|:-----:|:------:|:------:|
| `content:read` | ✅ | ✅ | ✅ | ✅ |
| `content:write` | ✅ | ✅ | ✅ | ❌ |
| `users:read` | ✅ | ✅ | ❌ | ❌ |
| `users:write` | ✅ | ✅ | ❌ | ❌ |
| `users:role` | ✅ | ❌ | ❌ | ❌ |
| `measurements:read` | ✅ | ✅ | ✅ | ✅ |
| `measurements:write` | ✅ | ✅ | ✅ | ❌ |
| `images:upload` | ✅ | ✅ | ✅ | ❌ |
| `settings:read` | ✅ | ✅ | ❌ | ❌ |
| `settings:write` | ✅ | ❌ | ❌ | ❌ |
| `audit:read` | ✅ | ✅ | ❌ | ✅ |

**구현 코드**:
```typescript
// src/lib/admin/rbac.ts
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  superadmin: [/* 전체 11개 권한 */],
  admin: [
    'content:read', 'content:write',
    'users:read', 'users:write',
    'measurements:read', 'measurements:write',
    'images:upload',
    'settings:read',
    'audit:read',
  ],
  editor: [
    'content:read', 'content:write',
    'measurements:read', 'measurements:write',
    'images:upload',
  ],
  viewer: [
    'content:read',
    'measurements:read',
    'audit:read',
  ],
};
```

---

## 6. 계정 잠금 메커니즘

### 6.1 메커니즘 개요

```
로그인 실패              failedAttempts 증가              잠금 여부 판정
     │                         │                              │
     ▼                         ▼                              ▼
┌──────────┐  +1  ┌──────────────┐  ≥5?  ┌──────────────────────┐
│ 실패 1회 │─────▶│ failedAttempts│──────▶│ lockedUntil =        │
└──────────┘      │     = 1      │  Yes  │   now + 15min        │
                  └──────────────┘       └──────────────────────┘
                                               │
                  ┌──────────────┐  No         │
                  │ 잠금 없음     │◀────────────┘
                  │ 다음 시도 가능│
                  └──────────────┘
```

### 6.2 파라미터

| 파라미터 | 값 | 변수명 | 정의 위치 |
|----------|-----|--------|-----------|
| 최대 실패 횟수 | 5 | `MAX_ATTEMPTS` | `src/lib/admin/lockout.ts` |
| 잠금 기간 | 15분 (900,000ms) | `LOCK_DURATION_MS` | `src/lib/admin/lockout.ts` |

### 6.3 잠금 상태 전이

| 상태 | 조건 | 동작 |
|------|------|------|
| **미잠금** | `lockedUntil IS NULL` 또는 `lockedUntil ≤ now` | 로그인 시도 가능 |
| **잠금 중** | `lockedUntil > now` | 올바른 비밀번호라도 로그인 차단 (423) |
| **잠금 만료** | `lockedUntil ≤ now` | 자동으로 미잠금 상태로 복귀 (DB 업데이트 없이) |
| **성공 시 리셋** | 로그인 성공 | `failedAttempts = 0`, `lockedUntil = null`, `lastLoginAt = now` |

### 6.4 구현 코드

```typescript
// src/lib/admin/lockout.ts
export const MAX_ATTEMPTS = 5;
export const LOCK_DURATION_MS = 15 * 60 * 1000; // 15분

export async function checkLockout(email: string): Promise<LockoutStatus> {
  const user = await db.adminUser.findUnique({
    where: { email },
    select: { lockedUntil: true },
  });
  if (!user || !user.lockedUntil) return { locked: false };
  if (user.lockedUntil > new Date()) {
    return { locked: true, remainingMs: user.lockedUntil.getTime() - Date.now() };
  }
  return { locked: false }; // 잠금 만료
}

export async function recordFailedAttempt(email: string): Promise<void> {
  const user = await db.adminUser.findUnique({
    where: { email },
    select: { id: true, failedAttempts: true },
  });
  if (!user) return;
  const newAttempts = user.failedAttempts + 1;
  const lockUntil = newAttempts >= MAX_ATTEMPTS
    ? new Date(Date.now() + LOCK_DURATION_MS)
    : null;
  await db.adminUser.update({
    where: { id: user.id },
    data: { failedAttempts: newAttempts, lockedUntil: lockUntil },
  });
}

export async function resetFailedAttempts(userId: string): Promise<void> {
  await db.adminUser.update({
    where: { id: userId },
    data: { failedAttempts: 0, lockedUntil: null, lastLoginAt: new Date() },
  });
}
```

---

## 7. 감사 로그 시스템

### 7.1 시스템 개요

모든 쓰기 작업(생성/수정/삭제)에 대해 자동으로 감사 로그를 기록합니다.

```
API 핸들러              감사 로그 기록                  AuditLog 테이블
    │                        │                              │
    │  비즈니스 로직 실행     │                              │
    │──────────────────────▶│                              │
    │                        │  db.auditLog.create()        │
    │                        │─────────────────────────────▶│
    │                        │                              │
    │                        │  { userId, action, entity,   │
    │                        │    entityId, changes }        │
    │                        │                              │
    │  응답 반환              │                              │
    │◀──────────────────────│                              │
```

### 7.2 changes JSON 형식

감사 로그의 `changes` 필드는 JSON 문자열로 변경 전/후 값을 저장합니다.

**생성 (create)**:
```json
{
  "after": {
    "title": "장비 소개",
    "body": "Biogram MINI는 7가지 건강 지표를 측정하는..."
  }
}
```

**수정 (update)**:
```json
{
  "before": {
    "title": "장비 소개",
    "body": "기존 본문 내용"
  },
  "after": {
    "title": "장비 소개 (수정)",
    "body": "업데이트된 본문 내용"
  }
}
```

**삭제 (delete)**:
```json
{
  "before": {
    "id": "clx...",
    "name": "삭제된 항목",
    "key": "deleted-item"
  }
}
```

### 7.3 감사 로그 액션/엔티티 조합

| 액션 | 엔티티 | 설명 |
|------|--------|------|
| `create` | `AdminUser` | 관리자 계정 생성 |
| `update` | `AdminUser` | 관리자 계정 수정 (역할 변경 포함) |
| `update` | `AdminUser.isActive` | 계정 비활성화 |
| `update` | `KioskContent` | 키오스크 화면 콘텐츠 수정 |
| `update` | `ContentSection` | 화면 내 섹션 수정 |
| `create` | `MeasurementItem` | 측정 항목 생성 |
| `update` | `MeasurementItem` | 측정 항목 수정 |
| `delete` | `MeasurementItem` | 측정 항목 삭제 |
| `create` | `MeasurementEquipment` | 측정 장비 생성 |
| `update` | `MeasurementEquipment` | 측정 장비 수정 |
| `delete` | `MeasurementEquipment` | 측정 장비 삭제 |

### 7.4 구현 코드

```typescript
// src/lib/admin/audit.ts
export async function logAudit({
  userId, action, entity, entityId, before, after,
}: AuditParams): Promise<void> {
  const changes: Record<string, unknown> = {};
  if (before !== undefined) changes.before = before;
  if (after !== undefined) changes.after = after;

  await db.auditLog.create({
    data: {
      userId: userId ?? null,
      action,
      entity,
      entityId: entityId ?? null,
      changes: JSON.stringify(changes),
    },
  });
}
```

---

## 8. 데이터 수명 주기

### 8.1 세션 정리

| 작업 | 조건 | 동작 |
|------|------|------|
| **만료 세션 삭제** | `expiresAt < now` | `db.adminSession.deleteMany({ where: { expiresAt: { lt: now } } })` |
| **로그아웃 시 삭제** | 명시적 로그아웃 | `db.adminSession.delete({ where: { token } })` |
| **사용자 삭제 시** | AdminUser CASCADE | 연관 세션 자동 삭제 |

**권장 정리 주기**: 애플리케이션 시작 시 또는 1시간 간격 Cron

```typescript
// 만료 세션 정리 함수
async function cleanupExpiredSessions(): Promise<number> {
  const result = await db.adminSession.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });
  return result.count;
}
```

### 8.2 감사 로그 보존

| 정책 | 내용 |
|------|------|
| **보존 기간** | 무제한 (append-only) |
| **물리 삭제** | 불가 (DELETE API 미제공) |
| **소프트 정리** | 향후 옵션: N개월 이전 로그 아카이브 (v2) |
| **예상 증가량** | ~1,000건/월 × ~500B/건 = ~500KB/월 |
| **권장 용량** | 100,000건 이하 유지 (향후 아카이브 도입 시) |

### 8.3 관리자 계정 수명

| 이벤트 | 동작 |
|--------|------|
| **생성** | `db.adminUser.create({ data: { ... } })` + 감사 로그 |
| **비활성화** | `db.adminUser.update({ data: { isActive: false } })` (물리 삭제 아님) |
| **역할 변경** | superadmin만 가능 + 감사 로그에 이전/이후 역할 기록 |
| **비밀번호 변경** | `bcrypt.hash(newPassword, 12)` → `passwordHash` 업데이트 |

---

## 9. 인덱스 전략

관리자 관련 쿼리 최적화를 위한 인덱스 전략입니다.

### 9.1 자동 생성 인덱스

| 모델 | 필드 | 인덱스 유형 | 용도 |
|------|------|-------------|------|
| AdminUser | `id` | PK | 기본 식별자 |
| AdminUser | `email` | UNIQUE | 로그인 시 이메일 조회 (`findUnique`) |
| AdminSession | `id` | PK | 기본 식별자 |
| AdminSession | `token` | UNIQUE | 세션 검증 시 토큰 조회 (`findUnique`) |
| AuditLog | `id` | PK | 기본 식별자 |

### 9.2 쿼리 패턴별 인덱스 요구

| 쿼리 패턴 | Prisma 호출 | 현재 인덱스 | 성능 |
|-----------|-------------|-------------|------|
| 이메일로 사용자 조회 | `findUnique({ where: { email } })` | UNIQUE | ✅ O(log n) |
| 토큰으로 세션 조회 | `findUnique({ where: { token } })` | UNIQUE | ✅ O(log n) |
| 사용자별 감사 로그 | `findMany({ where: { userId } })` | 없음 (SQLite 스캔) | ⚠️ O(n) |
| 엔티티별 감사 로그 | `findMany({ where: { entity } })` | 없음 | ⚠️ O(n) |
| 날짜 범위 감사 로그 | `findMany({ where: { createdAt: { gte, lte } } })` | 없음 | ⚠️ O(n) |
| 만료 세션 정리 | `deleteMany({ where: { expiresAt: { lt } } })` | 없음 | ⚠️ O(n) |

### 9.3 향후 인덱스 추가 고려

> SQLite에서는 Prisma가 복합 인덱스를 `@@index`로 지원합니다. 향후 데이터 증가 시 다음 인덱스를 추가할 수 있습니다.

```prisma
model AuditLog {
  // ... 기존 필드 ...
  @@index([userId])
  @@index([entity, action])
  @@index([createdAt])
}

model AdminSession {
  // ... 기존 필드 ...
  @@index([expiresAt])
}
```

현재는 레코드 수가 적어(~1,000/월) 추가 인덱스 없이도 충분한 성능을 확보합니다.

---

## 10. 초기 시드 데이터

### 10.1 관리자 계정

| 이메일 | 역할 | 이름 | 비밀번호 (평문) | 비밀번호 (해시) |
|--------|------|------|-----------------|-----------------|
| admin@biogram.co.kr | superadmin | 최관리 | Admin@1234 | bcrypt($2a$12$...) |
| operator@biogram.co.kr | admin | 이운영 | Demo@1234 | bcrypt($2a$12$...) |
| editor@biogram.co.kr | editor | 박수정 | Demo@1234 | bcrypt($2a$12$...) |
| viewer@biogram.co.kr | viewer | 김조회 | Demo@1234 | bcrypt($2a$12$...) |

**시드 실행**:
```bash
bun run db:push   # 스키마 푸시 + 시드
```

### 10.2 측정 항목 (6개)

| key | name | color | order | estimatedTime(분) |
|-----|------|-------|-------|-------------------|
| height | 신장 | #38BDF8 | 1 | 1 |
| stress | 스트레스 | #FB7185 | 2 | 2 |
| blood-pressure | 혈압 | #FBBF24 | 3 | 2 |
| grip-strength | 악력 | #A78BFA | 4 | 1 |
| body-composition | 체성분 | #34D399 | 5 | 2 |
| skin | 피부 | #F472B6 | 6 | 1 |

### 10.3 키오스크 화면 콘텐츠 (13개)

standby, main, equipment-intro, location, app-install, signup, vein-register, login, non-member, measurement-mode, measurement-equipment, results, completion

---

## 11. 마이그레이션 전략

### 11.1 prisma db push

본 프로젝트는 `prisma migrate` 대신 `prisma db push`를 사용합니다.

| 항목 | 설명 |
|------|------|
| **명령어** | `bun run db:push` |
| **동작** | 스키마 변경을 DB에 직접 반영 (마이그레이션 파일 생성 없음) |
| **데이터 보존** | 기존 데이터 유지 (호환 가능한 변경만) |
| **적합 상황** | 프로토타입/소규모 프로젝트, 단일 개발자 환경 |
| **주의점** | 파괴적 변경(컬럼 삭제/타입 변경) 시 데이터 손실 가능 |

### 11.2 스키마 변경 절차

```
1. prisma/schema.prisma 편집
          │
2. bun run db:push 실행
          │
3. Prisma Client 자동 재생성
          │
4. 애플리케이션 재시작 (bun --hot)
          │
5. 시드 데이터 필요 시 재실행
```

### 11.3 백업 전략

```bash
# 스키마 변경 전 백업
cp db/custom.db db/backup/custom-$(date +%Y%m%d_%H%M).db

# 복원
cp db/backup/custom-20260306_1000.db db/custom.db
```

---

## 12. 용량 추정 (관리자 모델)

| 모델 | 예상 레코드 수 | 레코드당 크기 | 총 크기 추정 | 증가율 |
|------|----------------|---------------|-------------|--------|
| AdminUser | ~10 | ~500B | ~5KB | 거의 변동 없음 |
| AdminSession | ~50 (동시) | ~300B | ~15KB | 세션 생성/삭제 순환 |
| AuditLog | ~1,000/월 | ~500B | ~500KB/월 | 월별 선형 증가 |

**관리자 모델 총 예상 크기**: ~520KB/월 (감사 로그가 대부분)

**전체 DB 예상 크기** (키오스크 포함): ~3MB/월

---

## 부록: Prisma 스키마 전체 (관리자 부분)

```prisma
// ── 관리자 대시보드 모델 ──

model AdminUser {
  id              String    @id @default(cuid())
  email           String    @unique
  passwordHash    String
  name            String
  role            String    @default("editor") // superadmin, admin, editor, viewer
  isActive        Boolean   @default(true)
  failedAttempts  Int       @default(0)
  lockedUntil     DateTime?
  lastLoginAt     DateTime?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  sessions        AdminSession[]
  auditLogs       AuditLog[]
}

model AdminSession {
  id        String   @id @default(cuid())
  userId    String
  token     String   @unique
  expiresAt DateTime
  createdAt DateTime @default(now())
  user      AdminUser @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model AuditLog {
  id        String   @id @default(cuid())
  userId    String?
  action    String   // create, update, delete
  entity    String
  entityId  String?
  changes   String   @default("{}") // JSON string
  createdAt DateTime @default(now())
  user      AdminUser? @relation(fields: [userId], references: [id])
}
```
