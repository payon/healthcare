# Biogram MINI 관리자 대시보드 — API 참조 문서

> 버전: 1.0.0  
> 최종 수정: 2026-03-06  
> 작성자: Biogram MINI 개발팀

---

## 1. API 개요

모든 관리자 API는 `/api/admin/*` 경로에 배치되며, **JWT httpOnly 쿠키** 기반 인증을 요구합니다 (로그인 엔드포인트 제외).

### 공통 헤더

| 헤더 | 값 | 설명 |
|------|-----|------|
| `Content-Type` | `application/json` | 요청 본문 (POST/PUT/PATCH) |
| `Cookie` | `admin_session=<JWT>` | 인증 세션 토큰 (httpOnly, 자동 첨부) |

### 공통 에러 응답

| 상태 코드 | 에러 코드 | 설명 |
|-----------|-----------|------|
| `401` | `AUTH_REQUIRED` | 인증 필요 (쿠키 없음/무효) |
| `401` | `SESSION_EXPIRED` | 세션 만료 |
| `403` | `RBAC_DENIED` | 권한 부족 |
| `400` | `VALIDATION_ERROR` | 요청 본문 검증 실패 |
| `404` | `NOT_FOUND` | 리소스 없음 |
| `409` | `CONFLICT` | 충돌 (예: 이메일 중복) |
| `429` | `RATE_LIMITED` | 요청 한도 초과 |
| `500` | `INTERNAL_ERROR` | 서버 내부 오류 |

### 엔드포인트 목록

| 그룹 | 엔드포인트 | 메서드 | 설명 | 최소 역할 |
|------|-----------|--------|------|-----------|
| 인증 | `/api/admin/auth/login` | POST | 로그인 | — |
| 인증 | `/api/admin/auth/logout` | POST | 로그아웃 | viewer |
| 인증 | `/api/admin/auth/me` | GET | 현재 사용자 정보 | viewer |
| 사용자 | `/api/admin/users` | GET | 사용자 목록 | admin |
| 사용자 | `/api/admin/users` | POST | 사용자 생성 | admin |
| 사용자 | `/api/admin/users/:id` | GET | 사용자 상세 | admin |
| 사용자 | `/api/admin/users/:id` | PUT | 사용자 수정 | admin |
| 사용자 | `/api/admin/users/:id` | DELETE | 사용자 비활성화 | superadmin |
| 콘텐츠 | `/api/admin/content` | GET | 전체 콘텐츠 목록 | viewer |
| 콘텐츠 | `/api/admin/content/:screenId` | GET | 화면별 콘텐츠 | viewer |
| 콘텐츠 | `/api/admin/content/:screenId` | PUT | 콘텐츠 수정 | editor |
| 콘텐츠 | `/api/admin/content/:screenId/sections` | GET | 화면 섹션 목록 | viewer |
| 콘텐츠 | `/api/admin/content/:screenId/sections/:key` | PUT | 섹션 수정 | editor |
| 측정항목 | `/api/admin/measurements` | GET | 측정 항목 목록 | viewer |
| 측정항목 | `/api/admin/measurements` | POST | 측정 항목 생성 | editor |
| 측정항목 | `/api/admin/measurements/:id` | GET | 측정 항목 상세 | viewer |
| 측정항목 | `/api/admin/measurements/:id` | PUT | 측정 항목 수정 | editor |
| 측정항목 | `/api/admin/measurements/:id` | DELETE | 측정 항목 삭제 | admin |
| 장비 | `/api/admin/measurements/:id/equipment` | GET | 장비 목록 | viewer |
| 장비 | `/api/admin/measurements/:id/equipment` | POST | 장비 생성 | editor |
| 장비 | `/api/admin/measurements/:id/equipment/:eqId` | PUT | 장비 수정 | editor |
| 장비 | `/api/admin/measurements/:id/equipment/:eqId` | DELETE | 장비 삭제 | admin |
| 이미지 | `/api/admin/images/upload` | POST | 이미지 업로드 | editor |
| 역할 | `/api/admin/roles` | GET | 역할 목록 | viewer |
| 통계 | `/api/admin/stats` | GET | 대시보드 통계 | viewer |
| 감사 | `/api/admin/audit-logs` | GET | 감사 로그 | admin |

---

## 2. 인증 API

### 2.1 POST /api/admin/auth/login

관리자 로그인. 성공 시 httpOnly 쿠키로 JWT 세션 토큰을 설정합니다.

**요청:**

```json
{
  "email": "admin@biogram.co.kr",
  "password": "secureP@ss123"
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `email` | `string` | ✅ | 관리자 이메일 |
| `password` | `string` | ✅ | 비밀번호 (8~64자) |

**응답 200 OK:**

```json
{
  "user": {
    "id": "clx...",
    "email": "admin@biogram.co.kr",
    "name": "이운영",
    "role": "admin",
    "lastLoginAt": "2026-03-06T10:00:00.000Z"
  }
}
```

**Set-Cookie:** `admin_session=<JWT>; HttpOnly; Secure; SameSite=Strict; Path=/api/admin; Max-Age=28800`

**에러:**

| 상태 | 조건 |
|------|------|
| 401 | 이메일/비밀번호 불일치 |
| 423 | 계정 잠금 (5회 실패) |
| 404 | 계정 없음 또는 비활성 |

### 2.2 POST /api/admin/auth/logout

현재 세션을 무효화하고 쿠키를 삭제합니다.

**요청:** 본문 없음

**응답 200 OK:**

```json
{ "success": true }
```

### 2.3 GET /api/admin/auth/me

현재 인증된 사용자 정보를 반환합니다. 프론트엔드에서 세션 복구에 사용합니다.

**응답 200 OK:**

```json
{
  "id": "clx...",
  "email": "admin@biogram.co.kr",
  "name": "이운영",
  "role": "admin",
  "isActive": true,
  "lastLoginAt": "2026-03-06T10:00:00.000Z"
}
```

**에러:** `401` — 인증되지 않음

---

## 3. 사용자 관리 API

### 3.1 GET /api/admin/users

관리자 계정 목록을 조회합니다.

**쿼리 파라미터:**

| 파라미터 | 타입 | 기본값 | 설명 |
|----------|------|--------|------|
| `page` | `number` | 1 | 페이지 번호 |
| `limit` | `number` | 20 | 페이지당 항목 수 (최대 100) |
| `role` | `string` | — | 역할 필터 |
| `search` | `string` | — | 이름/이메일 검색 |

**응답 200 OK:**

```json
{
  "data": [
    {
      "id": "clx...",
      "email": "admin@biogram.co.kr",
      "name": "이운영",
      "role": "admin",
      "isActive": true,
      "lastLoginAt": "2026-03-06T10:00:00.000Z",
      "createdAt": "2026-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 5,
    "totalPages": 1
  }
}
```

### 3.2 POST /api/admin/users

새 관리자 계정을 생성합니다.

**요청:**

```json
{
  "email": "editor@biogram.co.kr",
  "password": "newP@ss456",
  "name": "박수정",
  "role": "editor"
}
```

| 필드 | 타입 | 필수 | 검증 | 설명 |
|------|------|------|------|------|
| `email` | `string` | ✅ | 이메일 형식, 고유 | 관리자 이메일 |
| `password` | `string` | ✅ | 8~64자, 영문+숫자+특수문자 | 초기 비밀번호 |
| `name` | `string` | ✅ | 2~50자 | 표시 이름 |
| `role` | `string` | ✅ | enum: superadmin, admin, editor, viewer | 역할 |

**응답 201 Created:** 생성된 사용자 객체

**에러:** `409` — 이메일 중복

### 3.3 PUT /api/admin/users/:id

관리자 계정을 수정합니다. `role` 변경은 superadmin만 가능합니다.

**요청:**

```json
{
  "name": "박수정(업데이트)",
  "role": "editor",
  "isActive": true,
  "password": "newP@ss789"
}
```

모든 필드 선택적. `password` 포함 시 비밀번호 변경.

**응답 200 OK:** 수정된 사용자 객체

### 3.4 DELETE /api/admin/users/:id

관리자 계정을 **비활성화**합니다 (물리 삭제 아님). superadmin 본인 계정은 비활성화 불가.

**응답 200 OK:**

```json
{ "success": true, "id": "clx..." }
```

---

## 4. 콘텐츠 관리 API

### 4.1 GET /api/admin/content

13개 화면의 콘텐츠를 일괄 조회합니다.

**응답 200 OK:**

```json
[
  {
    "id": "clx...",
    "section": "equipment-intro",
    "title": "장비 소개",
    "body": "Biogram MINI는 7가지 건강 지표를 측정하는...",
    "imageUrl": "/kiosk-images/equipment.png",
    "qrCodeUrl": null,
    "sections": [
      {
        "id": "cls...",
        "sectionKey": "overview",
        "title": "개요",
        "body": "7가지 측정 항목을 한 번에...",
        "imageUrl": null,
        "order": 1
      }
    ],
    "updatedAt": "2026-03-06T10:00:00.000Z"
  }
]
```

### 4.2 PUT /api/admin/content/:screenId

화면 콘텐츠를 수정합니다.

**요청:**

```json
{
  "title": "장비 소개 (수정)",
  "body": "업데이트된 본문 내용...",
  "imageUrl": "/admin-uploads/equipment-v2.png",
  "qrCodeUrl": null
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `title` | `string` | ✅ | 화면 제목 |
| `body` | `string` | ❌ | 화면 본문 |
| `imageUrl` | `string` | ❌ | 대표 이미지 URL |
| `qrCodeUrl` | `string` | ❌ | QR 코드 이미지 URL |

**응답 200 OK:** 수정된 콘텐츠 객체

### 4.3 PUT /api/admin/content/:screenId/sections/:key

화면 내 개별 섹션을 수정합니다. 예: measurement-equipment 화면의 특정 장비 섹션.

**요청:**

```json
{
  "title": "혈압계 사용법",
  "body": "1. 팔을 커프에 넣습니다...",
  "imageUrl": "/admin-uploads/bp-device.png",
  "order": 2
}
```

**응답 200 OK:** 수정된 섹션 객체

---

## 5. 측정 항목 관리 API

### 5.1 GET /api/admin/measurements

6가지 측정 항목 목록을 조회합니다.

**응답 200 OK:**

```json
[
  {
    "id": "clx...",
    "key": "height",
    "name": "신장",
    "description": "키를 측정합니다",
    "icon": "ruler",
    "color": "#3B82F6",
    "order": 1,
    "imageUrl": "/admin-uploads/height-icon.png",
    "estimatedTime": 5,
    "isActive": true,
    "equipment": [
      {
        "id": "cls...",
        "name": "신장계",
        "description": "초음파 신장계",
        "order": 1
      }
    ]
  }
]
```

### 5.2 POST /api/admin/measurements

새 측정 항목을 생성합니다.

**요청:**

```json
{
  "key": "height",
  "name": "신장",
  "description": "키를 측정합니다",
  "icon": "ruler",
  "color": "#3B82F6",
  "order": 1,
  "imageUrl": "/admin-uploads/height-icon.png",
  "estimatedTime": 5,
  "isActive": true
}
```

| 필드 | 타입 | 필수 | 검증 | 설명 |
|------|------|------|------|------|
| `key` | `string` | ✅ | kebab-case, 고유 | 항목 식별자 |
| `name` | `string` | ✅ | 2~20자 | 표시 이름 |
| `description` | `string` | ❌ | 최대 500자 | 설명 |
| `icon` | `string` | ❌ | Lucide 아이콘명 | 아이콘 |
| `color` | `string` | ❌ | HEX 색상 | 테마 색상 |
| `order` | `number` | ✅ | 1~100 | 정렬 순서 |
| `imageUrl` | `string` | ❌ | URL | 아이콘 이미지 |
| `estimatedTime` | `number` | ❌ | 1~30 (분) | 예상 소요 시간 |
| `isActive` | `boolean` | ❌ | — | 활성 여부 (기본 true) |

**응답 201 Created:** 생성된 측정 항목 객체

### 5.3 PUT /api/admin/measurements/:id

측정 항목을 수정합니다. 모든 필드 선택적.

**응답 200 OK:** 수정된 객체

### 5.4 DELETE /api/admin/measurements/:id

측정 항목을 삭제합니다. 연관 장비 정보도 함께 삭제됩니다.

**응답 200 OK:**

```json
{ "success": true, "id": "clx..." }
```

---

## 6. 측정 장비 관리 API

### 6.1 GET /api/admin/measurements/:id/equipment

특정 측정 항목의 장비 목록을 조회합니다.

**응답 200 OK:**

```json
[
  {
    "id": "cls...",
    "measurementId": "clx...",
    "name": "자동혈압계",
    "description": "팔에 커프를 감아 자동 측정",
    "preparationSteps": [
      "소매를 걷어 올립니다",
      "팔을 커프에 넣습니다",
      "시작 버튼을 누릅니다"
    ],
    "precautions": [
      { "level": "warning", "text": "측정 전 5분간 안정을 취하세요" },
      { "level": "info", "text": "커프는 심장 높이에 맞추세요" }
    ],
    "imageUrl": "/admin-uploads/bp-device.png",
    "order": 1,
    "updatedAt": "2026-03-06T10:00:00.000Z"
  }
]
```

### 6.2 POST /api/admin/measurements/:id/equipment

새 장비 정보를 생성합니다.

**요청:**

```json
{
  "name": "자동혈압계",
  "description": "팔에 커프를 감아 자동 측정",
  "preparationSteps": ["소매를 걷어 올립니다", "팔을 커프에 넣습니다"],
  "precautions": [
    { "level": "warning", "text": "측정 전 5분간 안정을 취하세요" }
  ],
  "imageUrl": "/admin-uploads/bp-device.png",
  "order": 1
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `name` | `string` | ✅ | 장비명 (2~50자) |
| `description` | `string` | ❌ | 장비 설명 (최대 1000자) |
| `preparationSteps` | `string[]` | ❌ | 준비 단계 (최대 10개) |
| `precautions` | `object[]` | ❌ | 주의사항 ({level, text}) |
| `imageUrl` | `string` | ❌ | 장비 이미지 URL |
| `order` | `number` | ✅ | 정렬 순서 |

**응답 201 Created:** 생성된 장비 객체

### 6.3 PUT /api/admin/measurements/:id/equipment/:eqId

장비 정보를 수정합니다.

**응답 200 OK:** 수정된 장비 객체

### 6.4 DELETE /api/admin/measurements/:id/equipment/:eqId

장비 정보를 삭제합니다.

**응답 200 OK:**

```json
{ "success": true, "id": "cls..." }
```

---

## 7. 이미지 업로드 API

### 7.1 POST /api/admin/images/upload

이미지를 업로드합니다. `multipart/form-data` 형식.

**요청:**

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `file` | `File` | ✅ | 이미지 파일 (PNG/JPG/WebP/SVG, 최대 5MB) |
| `category` | `string` | ❌ | 카테고리 (kiosk/equipment/icon, 기본: kiosk) |

**응답 201 Created:**

```json
{
  "url": "/admin-uploads/2026-03/equipment-v2-abc123.png",
  "filename": "equipment-v2-abc123.png",
  "size": 245760,
  "width": 1920,
  ".height": 1080,
  "mimeType": "image/png"
}
```

**에러:**

| 상태 | 조건 |
|------|------|
| 400 | 지원하지 않는 파일 형식 |
| 413 | 파일 크기 초과 (5MB) |

---

## 8. 역할 API

### 8.1 GET /api/admin/roles

시스템 역할 목록과 권한을 조회합니다.

**응답 200 OK:**

```json
[
  {
    "id": "role-superadmin",
    "name": "superadmin",
    "permissions": ["content:read", "content:write", "users:read", "users:write", "users:role", "settings", "audit:read"]
  },
  {
    "id": "role-admin",
    "name": "admin",
    "permissions": ["content:read", "content:write", "users:read", "users:write", "audit:read"]
  },
  {
    "id": "role-editor",
    "name": "editor",
    "permissions": ["content:read", "content:write"]
  },
  {
    "id": "role-viewer",
    "name": "viewer",
    "permissions": ["content:read", "audit:read"]
  }
]
```

---

## 9. 대시보드 통계 API

### 9.1 GET /api/admin/stats

대시보드에 표시할 통계 데이터를 조회합니다.

**쿼리 파라미터:**

| 파라미터 | 타입 | 기본값 | 설명 |
|----------|------|--------|------|
| `period` | `string` | `7d` | 기간: 1d, 7d, 30d, 90d |

**응답 200 OK:**

```json
{
  "sessions": {
    "total": 342,
    "completed": 245,
    "completionRate": 71.6,
    "avgDuration": 312,
    "byDay": [
      { "date": "2026-03-05", "count": 48, "completed": 35 }
    ]
  },
  "screens": {
    "mostVisited": [
      { "screen": "main", "visits": 342, "avgDuration": 15 },
      { "screen": "equipment-intro", "visits": 280, "avgDuration": 45 }
    ],
    "leastVisited": [
      { "screen": "non-member", "visits": 42, "avgDuration": 30 }
    ]
  },
  "contentChanges": {
    "last7d": 12,
    "recent": [
      {
        "id": "clx...",
        "user": "이운영",
        "action": "update",
        "entity": "MeasurementItem",
        "entityName": "혈압",
        "createdAt": "2026-03-06T09:30:00.000Z"
      }
    ]
  }
}
```

---

## 10. 감사 로그 API

### 10.1 GET /api/admin/audit-logs

감사 로그를 필터 및 페이지네이션과 함께 조회합니다.

**쿼리 파라미터:**

| 파라미터 | 타입 | 기본값 | 설명 |
|----------|------|--------|------|
| `page` | `number` | 1 | 페이지 번호 |
| `limit` | `number` | 50 | 페이지당 항목 수 |
| `userId` | `string` | — | 사용자 ID 필터 |
| `action` | `string` | — | 액션 필터 (create/update/delete) |
| `entity` | `string` | — | 엔티티 필터 |
| `from` | `string` | — | 시작 일시 (ISO 8601) |
| `to` | `string` | — | 종료 일시 (ISO 8601) |

**응답 200 OK:**

```json
{
  "data": [
    {
      "id": "clx...",
      "userId": "cls...",
      "userName": "이운영",
      "action": "update",
      "entity": "MeasurementItem",
      "entityId": "clm...",
      "changes": {
        "before": { "name": "혈압", "description": "기존 설명" },
        "after": { "name": "혈압", "description": "수정된 설명" }
      },
      "createdAt": "2026-03-06T09:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 128,
    "totalPages": 3
  }
}
```

---

## 11. 공통 패턴

### 11.1 페이지네이션

모든 목록 API는 동일한 페이지네이션 형식을 사용합니다.

```typescript
interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

### 11.2 감사 로그 자동 기록

모든 쓰기 API 핸들러는 비즈니스 로직 실행 후 자동으로 감사 로그를 기록합니다.

```typescript
async function withAuditLog<T>(
  userId: string,
  action: 'create' | 'update' | 'delete',
  entity: string,
  entityId: string,
  before: T | null,
  after: T | null,
  operation: () => Promise<T>
): Promise<T> {
  const result = await operation();
  await db.auditLog.create({
    data: { userId, action, entity, entityId, changes: { before, after } }
  });
  return result;
}
```

### 11.3 Zod 검증

모든 요청 본문은 Zod 스키마로 검증됩니다.

```typescript
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email('유효한 이메일을 입력하세요'),
  password: z.string().min(8, '비밀번호는 8자 이상이어야 합니다'),
});
```
