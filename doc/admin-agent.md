# AI Agent 문서 — 관리자 대시보드

> Biogram MINI 헬스케어 장비 교육 키오스크 관리자 대시보드 — AI 에이전트 상호작용 및 개발 가이드

---

## 1. 에이전트 개요

### 1.1 관리자 대시보드에서 AI가 수행하는 역할

| 역할 | 설명 | 주요 산출물 |
|------|------|------------|
| 코드 생성 | Next.js 16 + TypeScript 관리자 컴포넌트·API·스키마 생성 | `src/app/admin/*`, `src/app/api/admin/*` |
| 스키마 설계 | Prisma 스키마 확장, Zod 검증 스키마 작성 | `prisma/schema.prisma`, `src/lib/admin/schemas.ts` |
| 보안 구현 | 인증/권한 미들웨어, 비밀번호 해싱, JWT 로직 | `src/lib/admin/auth.ts`, `rbac.ts`, `middleware.ts` |
| 폼 자동 생성 | Zod 스키마로부터 React Hook Form + shadcn/ui 폼 자동 생성 | `src/components/admin/*/Form.tsx` |
| 콘텐츠 시드 | 초기 콘텐츠·측정 항목·관리자 계정 SQL/TS 시드 | `prisma/seed-admin.ts` |
| E2E 테스트 | agent-browser로 관리자 대시보드 로그인·CRUD·권한 테스트 | 테스트 결과 리포트 |
| 문서 생성 | API 문서, 스키마 문서, 아키텍처 다이어그램 | `doc/admin-*.md` |

### 1.2 사용 가능한 스킬

| 스킬 | 용도 | 호출 방식 |
|------|------|-----------|
| LLM | 코드 생성, 스키마 설계, 보안 로직, 콘텐츠 작성 | `z-ai-web-dev-sdk` |
| VLM | 관리자 UI 스크린샷 검증, 반응형 레이아웃 확인 | `z-ai-web-dev-sdk` |
| Image Generation | 측정 항목 아이콘, 장비 일러스트 생성 | `z-ai-web-dev-sdk` |
| Web Search | 보안 베스트 프랙티스, 라이브러리 업데이트 검색 | `z-ai-web-dev-sdk` |
| agent-browser | 관리자 대시보드 E2E 테스트 | `z-ai-web-dev-sdk` |

---

## 2. 개발 워크플로우

### 2.1 전체 개발 순서

```
Phase 1: 기반 인프라          Phase 2: 핵심 CRUD           Phase 3: 고급 기능
┌─────────────────────┐    ┌─────────────────────┐    ┌─────────────────────┐
│ 1. Prisma 스키마 확장 │    │ 5. 콘텐츠 관리 CRUD  │    │ 9. 대시보드 통계     │
│ 2. DB 마이그레이션    │    │ 6. 측정 항목 CRUD    │    │ 10. 감사 로그 열람   │
│ 3. 인증 시스템       │    │ 7. 장비 정보 CRUD    │    │ 11. 이미지 갤러리    │
│ 4. RBAC 미들웨어     │    │ 8. 사용자 관리 CRUD  │    │ 12. 미리보기 기능    │
└─────────────────────┘    └─────────────────────┘    └─────────────────────┘
```

### 2.2 Phase 1: 기반 인프라

**Step 1: Prisma 스키마 확장**

프롬프트:
```
기존 prisma/schema.prisma에 다음 모델을 추가하세요:
- AdminUser (이메일, 비밀번호 해시, 이름, 역할, 활성 여부, 잠금 필드, 타임스탬프)
- AdminSession (사용자 ID, 토큰, 만료 시간)
- MeasurementItem (키, 이름, 설명, 아이콘, 색상, 순서, 이미지, 예상 시간, 활성 여부)
- MeasurementEquipment (측정 ID, 이름, 설명, 준비 단계(JSON), 주의사항(JSON), 이미지, 순서)
- ContentSection (화면 ID, 섹션 키, 제목, 본문, 이미지, 순서)
- AuditLog (사용자 ID, 액션, 엔티티, 엔티티 ID, 변경 내용 JSON)
SQLite 호환 타입을 사용하고, 관계를 정의하세요.
```

**Step 2: 인증 시스템**

프롬프트:
```
src/lib/admin/auth.ts를 구현하세요:
- jose 라이브러리로 JWT 생성/검증 (HS256, 8시간 만료)
- httpOnly 쿠키로 세션 토큰 설정/제거
- DB 세션 이중 검증 (로그아웃된 세션 차단)
- bcryptjs로 비밀번호 해싱 (cost=12) 및 검증
- 5회 실패 시 15분 계정 잠금 메커니즘
```

### 2.3 Phase 2: 핵심 CRUD

**Step 5: 콘텐츠 관리**

프롬프트:
```
키오스크 13개 화면의 콘텐츠를 관리하는 CRUD를 구현하세요:

API Routes:
- GET /api/admin/content (전체 목록)
- GET /api/admin/content/:screenId (화면별)
- PUT /api/admin/content/:screenId (수정, editor 권한 필요)

프론트엔드:
- /admin/content 페이지: 13개 화면 카드 그리드
- /admin/content/[screenId] 페이지: 편집 폼 (제목, 본문, 이미지)
- ContentEditForm 컴포넌트: React Hook Form + Zod 검증
- TanStack Query로 데이터 패칭, 수정 후 캐시 무효화

모든 쓰기 작업에 감사 로그를 기록하세요.
```

**Step 6: 측정 항목 CRUD**

프롬프트:
```
6가지 측정 항목(신장, 스트레스, 혈압, 악력, 체성분, 피부)을 관리하세요:

API Routes:
- GET/POST /api/admin/measurements
- GET/PUT/DELETE /api/admin/measurements/:id

프론트엔드:
- /admin/measurements: 항목 목록 (카드 그리드, 드래그앤드롭 순서 변경)
- /admin/measurements/[id]: 편집 폼 (이름, 설명, 아이콘, 색상, 예상 시간, 활성 여부)

각 항목에 연관된 장비 정보도 함께 로딩하세요.
```

**Step 7: 장비 정보 CRUD**

프롬프트:
```
측정 항목별 장비 정보를 관리하세요:

API Routes:
- GET/POST /api/admin/measurements/:id/equipment
- PUT/DELETE /api/admin/measurements/:id/equipment/:eqId

장비 폼 필드:
- 이름, 설명, 이미지, 순서
- 준비 단계 (StepEditor: 추가/삭제/순서 변경)
- 주의사항 (PrecautionEditor: level=warning/info, text)

preparationSteps와 precautions는 JSON 문자열로 SQLite에 저장하세요.
```

### 2.4 Phase 3: 고급 기능

**Step 9: 대시보드 통계**

프롬프트:
```
관리자 대시보드 홈(/admin)에 통계 카드를 구현하세요:
- 오늘/7일/30일 세션 수, 완료율, 평균 체류 시간
- 최다 방문 화면 TOP 5
- 최근 콘텐츠 변경 이력 10건

GET /api/admin/stats API를 구현하고, TanStack Query로 30초 간격 자동 갱신하세요.
shadcn/ui Card 컴포넌트로 통계 카드를 만드세요.
```

---

## 3. 코드 생성 템플릿

### 3.1 API Route 템플릿

```typescript
// 템플릿: src/app/api/admin/{entity}/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/admin/middleware';
import { z } from 'zod';

const createSchema = z.object({
  // 필드 정의
});

export const GET = withAuth('{entity}:read', async (req, { role }) => {
  // 목록 조회 로직
  const items = await db.{entity}.findMany({ orderBy: { createdAt: 'desc' } });
  return NextResponse.json({ data: items });
});

export const POST = withAuth('{entity}:write', async (req, { userId }) => {
  const body = await req.json();
  const validated = createSchema.parse(body);
  
  const item = await db.{entity}.create({ data: validated });
  
  await db.auditLog.create({
    data: { userId, action: 'create', entity: '{Entity}', entityId: item.id, changes: { before: null, after: item } },
  });
  
  return NextResponse.json(item, { status: 201 });
});
```

### 3.2 관리자 페이지 템플릿

```tsx
// 템플릿: src/app/admin/{entity}/page.tsx
'use client';

import { AdminRbacGuard } from '@/components/admin/layout/AdminRbacGuard';
import { use{Entity}List } from '@/hooks/admin/use-{entity}';
import { DataTable } from '@/components/admin/common/DataTable';

export default function {Entity}Page() {
  const { data, isLoading } = use{Entity}List();
  
  return (
    <AdminRbacGuard permission="{entity}:read">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">{엔티티_한글명} 관리</h1>
          <Button>새 {엔티티_한글명}</Button>
        </div>
        {isLoading ? <LoadingSkeleton /> : <DataTable data={data} columns={columns} />}
      </div>
    </AdminRbacGuard>
  );
}
```

### 3.3 쿼리 훅 템플릿

```typescript
// 템플릿: src/hooks/admin/use-{entity}.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function use{Entity}List() {
  return useQuery({
    queryKey: ['admin', '{entity}'],
    queryFn: () => fetch('/api/admin/{entity}').then(r => r.json()),
  });
}

export function useCreate{Entity}() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => fetch('/api/admin/{entity}', { method: 'POST', body: JSON.stringify(data) }).then(r => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', '{entity}'] }),
  });
}
```

---

## 4. 테스트 시나리오

### 4.1 인증 테스트

```
TC-AUTH-01: 올바른 자격 증명으로 로그인 → 대시보드 이동
TC-AUTH-02: 잘못된 비밀번호 → 에러 메시지 표시
TC-AUTH-03: 5회 연속 실패 → 계정 잠금 메시지
TC-AUTH-04: 잠금 해제 후 로그인 가능
TC-AUTH-05: 세션 만료 후 → 로그인 페이지 리다이렉트
TC-AUTH-06: 로그아웃 → 세션 무효화, 로그인 페이지 이동
```

### 4.2 RBAC 테스트

```
TC-RBAC-01: viewer가 콘텐츠 열람 → 성공
TC-RBAC-02: viewer가 콘텐츠 수정 → 403 에러
TC-RBAC-03: editor가 콘텐츠 수정 → 성공
TC-RBAC-04: editor가 사용자 관리 → 403 에러
TC-RBAC-05: admin이 사용자 관리 → 성공
TC-RBAC-06: admin이 역할 변경 → 403 에러
TC-RBAC-07: superadmin이 역할 변경 → 성공
```

### 4.3 CRUD 테스트

```
TC-CRUD-01: 콘텐츠 수정 → 저장 성공, 키오스크에 반영
TC-CRUD-02: 측정 항목 생성 → 목록에 표시
TC-CRUD-03: 장비 정보 수정 → 주의사항 반영
TC-CRUD-04: 이미지 업로드 → 갤러리에 표시, 콘텐츠에서 참조 가능
TC-CRUD-05: 콘텐츠 수정 후 감사 로그에 기록됨
```

### 4.4 반응형 테스트

```
TC-RESP-01: 모바일(<768px) → 사이드바 드로어, 1열 카드
TC-RESP-02: 태블릿(768~1024px) → 축소 사이드바, 2열 카드
TC-RESP-03: 데스크톱(>1024px) → 확장 사이드바, 3열 카드
```

---

## 5. 에이전트 실행 가이드

### 5.1 로컬 개발 환경

```bash
# 1. 개발 서버 시작
bun run dev

# 2. DB 마이그레이션
bun run db:push

# 3. 초기 데이터 시드
bun run db:seed

# 4. 관리자 대시보드 접근
# http://localhost:3000/admin/login
# 이메일: admin@biogram.co.kr
# 비밀번호: (SEED_ADMIN_PASSWORD 값)
```

### 5.2 에이전트 브라우저 테스트

```bash
# 로그인 테스트
agent-browser open http://localhost:3000/admin/login
agent-browser type 'input[type="email"]' admin@biogram.co.kr
agent-browser type 'input[type="password"]' <password>
agent-browser click 'button[type="submit"]'
agent-browser snapshot -i

# 콘텐츠 관리 접근
agent-browser click 'a[href="/admin/content"]'
agent-browser snapshot -i
```

### 5.3 주의사항

| 항목 | 내용 |
|------|------|
| 세션 쿠키 | httpOnly이므로 JS에서 직접 읽기 불가 (브라우저 디버거로 확인) |
| 감사 로그 | append-only, 삭제 불가 |
| 비밀번호 | 평문 로깅 금지, 해시만 저장 |
| 파일 업로드 | public/ 디렉토리에 저장, .gitignore에 admin-uploads/ 추가 권장 |
| 마이그레이션 | `db:push` 사용 (prisma migrate 미사용, SQLite 단일 파일) |
