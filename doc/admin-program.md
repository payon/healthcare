# Biogram MINI 관리자 대시보드 — 프로그래밍/구현 문서

> 버전: 1.0.0  
> 최종 수정: 2026-03-06  
> 작성자: Biogram MINI 개발팀

---

## 1. 프로젝트 설정

| 항목 | 내용 |
|------|------|
| 프레임워크 | Next.js 16 (App Router) |
| 언어 | TypeScript 5 (strict 모드) |
| 패키지 매니저 | bun |
| 번들러 | Turbopack (Next.js 16 내장) |
| 스타일링 | Tailwind CSS 4 + shadcn/ui (New York 스타일) |
| 상태 관리 | Zustand 5 (클라이언트 전역) + TanStack Query 5 (서버 상태) |
| 폼 관리 | React Hook Form 7 + Zod 3 |
| 애니메이션 | Framer Motion 12 |
| 인증 | jose 5 (JWT) + bcryptjs 2 (해싱) |
| 데이터베이스 | Prisma ORM + SQLite (`db/custom.db`) |
| 이미지 처리 | Sharp |
| 아이콘 | Lucide React |
| 폰트 | Noto Sans KR (Google Fonts, 가변 폰트) |

### 실행 스크립트

```json
{
  "dev": "next dev -p 3000 2>&1 | tee dev.log",
  "build": "next build",
  "lint": "eslint .",
  "db:push": "prisma db push --accept-data-loss",
  "db:generate": "prisma generate",
  "db:seed": "tsx prisma/seed-admin.ts"
}
```

---

## 2. 디렉토리 구조

```
prisma/
  schema.prisma                  # DB 스키마 (확장: 9 모델)
  seed-admin.ts                  # 초기 관리자 계정 시드
src/
  app/
    layout.tsx                   # 루트 레이아웃 (키오스크 + 관리자 공유)
    page.tsx                     # 키오스크 메인 페이지
    globals.css                  # 글로벌 스타일
    
    # ── 관리자 대시보드 라우트 ──
    admin/
      layout.tsx                 # 관리자 레이아웃 (사이드바, 인증 가드)
      page.tsx                   # 대시보드 홈 (통계 카드)
      login/
        page.tsx                 # 로그인 페이지
      content/
        page.tsx                 # 콘텐츠 목록 (13개 화면 카드)
        [screenId]/
          page.tsx               # 화면별 콘텐츠 편집
      measurements/
        page.tsx                 # 측정 항목 목록 (6개)
        [id]/
          page.tsx               # 측정 항목 편집
          equipment/
            page.tsx             # 장비 관리 (CRUD)
      images/
        page.tsx                 # 이미지 갤러리/업로드
      users/
        page.tsx                 # 사용자 목록
        [id]/
          page.tsx               # 사용자 편집/생성
      audit-logs/
        page.tsx                 # 감사 로그 열람
      settings/
        page.tsx                 # 시스템 설정 (superadmin)
    
    # ── 관리자 API Routes ──
    api/admin/
      auth/
        login/route.ts           # POST 로그인
        logout/route.ts          # POST 로그아웃
        me/route.ts              # GET 현재 사용자
      users/
        route.ts                 # GET 목록, POST 생성
        [id]/route.ts            # GET 상세, PUT 수정, DELETE 비활성화
      content/
        route.ts                 # GET 전체 목록
        [screenId]/
          route.ts               # GET 화면별, PUT 수정
          sections/
            route.ts             # GET 섹션 목록
            [key]/route.ts       # PUT 섹션 수정
      measurements/
        route.ts                 # GET 목록, POST 생성
        [id]/
          route.ts               # GET 상세, PUT 수정, DELETE 삭제
          equipment/
            route.ts             # GET 장비 목록, POST 생성
            [eqId]/route.ts      # PUT 장비 수정, DELETE 삭제
      images/
        upload/route.ts          # POST 이미지 업로드
      roles/
        route.ts                 # GET 역할 목록
      stats/
        route.ts                 # GET 대시보드 통계
      audit-logs/
        route.ts                 # GET 감사 로그
  
  # ── 관리자 라이브러리 ──
  lib/
    db.ts                        # Prisma 클라이언트 (기존)
    admin/
      auth.ts                    # JWT 세션 생성/검증
      password.ts                # bcrypt 해싱/검증
      lockout.ts                 # 계정 잠금 메커니즘
      rbac.ts                    # 역할-권한 매핑
      middleware.ts              # 인증+RBAC 미들웨어
      upload.ts                  # 이미지 업로드 처리
      schemas.ts                 # Zod 검증 스키마
      audit.ts                   # 감사 로그 헬퍼
  
  # ── 관리자 훅 ──
  hooks/
    admin/
      use-auth.ts                # 인증 상태 훅
      use-content.ts             # 콘텐츠 쿼리/뮤테이션
      use-measurements.ts        # 측정 항목 쿼리/뮤테이션
      use-equipment.ts           # 장비 쿼리/뮤테이션
      use-users.ts               # 사용자 쿼리/뮤테이션
      use-stats.ts               # 통계 쿼리
      use-audit-logs.ts          # 감사 로그 쿼리
  
  # ── 관리자 컴포넌트 ──
  components/
    admin/
      layout/
        AdminSidebar.tsx         # 사이드바 내비게이션
        AdminHeader.tsx          # 상단 헤더 (사용자 정보, 로그아웃)
        AdminAuthGuard.tsx       # 인증 가드 (미인증 시 리다이렉트)
        AdminRbacGuard.tsx       # RBAC 가드 (권한 없을 시 403)
      
      dashboard/
        StatsCard.tsx            # 통계 카드 (세션 수, 완료율 등)
        RecentChanges.tsx        # 최근 변경 이력 테이블
        SessionChart.tsx         # 세션 추이 차트
      
      content/
        ContentList.tsx          # 콘텐츠 목록 (13개 화면 카드)
        ContentEditForm.tsx      # 콘텐츠 편집 폼
        SectionEditor.tsx        # 섹션 편집기
        ContentPreview.tsx       # 키오스크 미리보기
      
      measurements/
        MeasurementList.tsx      # 측정 항목 목록
        MeasurementForm.tsx      # 측정 항목 편집 폼
        MeasurementCard.tsx      # 측정 항목 카드
      
      equipment/
        EquipmentList.tsx        # 장비 목록
        EquipmentForm.tsx        # 장비 편집 폼
        StepEditor.tsx           # 준비 단계 편집 (드래그앤드롭)
        PrecautionEditor.tsx     # 주의사항 편집
      
      images/
        ImageUploader.tsx        # 이미지 업로드 (드래그앤드롭)
        ImageGallery.tsx         # 이미지 갤러리
      
      users/
        UserList.tsx             # 사용자 목록 테이블
        UserForm.tsx             # 사용자 생성/수정 폼
        RoleBadge.tsx            # 역할 표시 배지
      
      audit/
        AuditLogTable.tsx        # 감사 로그 테이블
        AuditEntryDetail.tsx     # 변경 상세 다이얼로그
        AuditFilter.tsx          # 감사 로그 필터
      
      common/
        DataTable.tsx            # 공통 데이터 테이블 (정렬, 필터, 페이지네이션)
        ConfirmDialog.tsx        # 확인 다이얼로그 (삭제 등)
        EmptyState.tsx           # 빈 상태 표시
        LoadingSkeleton.tsx      # 로딩 스켈레톤
        FormField.tsx            # 공통 폼 필드
    
    ui/                          # shadcn/ui 컴포넌트 (기존 + 추가)
      ...
```

---

## 3. 핵심 컴포넌트 사양

### 3.1 AdminLayout

| 속성 | 값 |
|------|-----|
| 라우트 | `/admin/*` (login 제외) |
| 레이아웃 | 사이드바(240px) + 메인 콘텐츠 영역 |
| 모바일 | 사이드바 숨김, 햄버거 버튼 → Sheet 드로어 |
| 인증 | `AdminAuthGuard`로 미인증 시 `/admin/login` 리다이렉트 |

```tsx
// src/app/admin/layout.tsx
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminAuthGuard>
      <div className="flex h-screen">
        <AdminSidebar />          {/* 데스크톱: 고정, 모바일: Sheet */}
        <main className="flex-1 overflow-y-auto p-6">
          <AdminHeader />
          {children}
        </main>
      </div>
    </AdminAuthGuard>
  );
}
```

### 3.2 AdminSidebar

| 항목 | 내용 |
|------|------|
| 항목 수 | 7개 (대시보드, 콘텐츠, 측정항목, 이미지, 사용자, 감사로그, 설정) |
| 활성 표시 | 현재 경로 기반 하이라이트 |
| 권한 제어 | 역할에 따라 항목 숨김 (예: viewer는 설정 숨김) |
| 모바일 | Sheet 컴포넌트로 드로어 전환 (< 768px) |

### 3.3 ContentEditForm

| 항목 | 내용 |
|------|------|
| 필드 | 제목(text), 본문(textarea/Markdown), 이미지(ImageUploader), QR코드 URL |
| 검증 | Zod `contentUpdateSchema` |
| 저장 | PUT `/api/admin/content/:screenId` |
| 미리보기 | ContentPreview 패널 (우측 또는 탭 전환) |
| 자동 저장 | debounce 3초 (초안 자동 저장, 선택 사항) |

### 3.4 MeasurementForm

| 항목 | 내용 |
|------|------|
| 필드 | key, name, description, icon, color, order, imageUrl, estimatedTime, isActive |
| 하위 | 장비 목록 (EquipmentList), 장비 편집 (EquipmentForm) |
| 순서 변경 | 드래그앤드롭 (dnd-kit)로 order 값 갱신 |
| 색상 선택 | 컬러 피커 (HEX 입력 + 프리셋 8색) |

### 3.5 EquipmentForm

| 항목 | 내용 |
|------|------|
| 필드 | name, description, imageUrl, order |
| 준비 단계 | StepEditor (추가/삭제/순서 변경) |
| 주의사항 | PrecautionEditor (level: warning/info, text) |
| 미리보기 | 키오스크 measurement-equipment 화면 스타일로 미리보기 |

### 3.6 ImageUploader

| 항목 | 내용 |
|------|------|
| 입력 | 드래그앤드롭 + 클릭 파일 선택 |
| 제한 | PNG, JPG, WebP, SVG / 최대 5MB |
| 미리보기 | 업로드 전 썸네일 미리보기 |
| 진행 | 업로드 진행률 표시 |
| 에러 | 파일 형식/크기 에러 즉시 표시 |

### 3.7 DataTable (공통)

| 항목 | 내용 |
|------|------|
| 기능 | 정렬, 필터, 페이지네이션, 검색 |
| 컬럼 | 컬럼 정의 배열로 설정 |
| 액션 | 행별 액션 드롭다운 (편집, 삭제 등) |
| 빈 상태 | EmptyState 컴포넌트 |
| 로딩 | LoadingSkeleton 행 표시 |

---

## 4. 상태 관리

### 4.1 Zustand (클라이언트 전역 상태)

```typescript
// src/store/admin-store.ts
import { create } from 'zustand';

interface AdminState {
  // 인증 상태 (TanStack Query로 관리하므로 최소화)
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  
  // 편집 상태
  previewMode: boolean;
  togglePreview: () => void;
}

export const useAdminStore = create<AdminState>((set) => ({
  sidebarOpen: true,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  previewMode: false,
  togglePreview: () => set((s) => ({ previewMode: !s.previewMode })),
}));
```

### 4.2 TanStack Query (서버 상태)

| 쿼리 키 | 데이터 | 갱신 트리거 |
|---------|--------|-------------|
| `['admin', 'auth', 'me']` | 현재 사용자 | 로그인/로그아웃 시 |
| `['admin', 'content']` | 콘텐츠 목록 | 콘텐츠 수정 시 |
| `['admin', 'content', screenId]` | 화면별 콘텐츠 | 해당 화면 수정 시 |
| `['admin', 'measurements']` | 측정 항목 목록 | 측정 항목 CRUD 시 |
| `['admin', 'measurements', id]` | 측정 항목 상세 | 해당 항목 수정 시 |
| `['admin', 'measurements', id, 'equipment']` | 장비 목록 | 장비 CRUD 시 |
| `['admin', 'users']` | 사용자 목록 | 사용자 CRUD 시 |
| `['admin', 'stats']` | 대시보드 통계 | 30초 간격 |
| `['admin', 'audit-logs']` | 감사 로그 | 필터 변경 시 |

---

## 5. 폼 처리 패턴

### 5.1 기본 패턴

```
1. Zod 스키마 정의 (src/lib/admin/schemas.ts)
2. React Hook Form + zodResolver로 폼 초기화
3. shadcn/ui FormField 컴포넌트로 필드 렌더링
4. useMutation으로 API 호출
5. onSuccess에서 TanStack Query 캐시 무효화
6. onError에서 에러 토스트 표시
```

### 5.2 낙관적 업데이트 패턴

```typescript
const updateContent = useMutation({
  mutationFn: (data: ContentUpdate) => 
    fetch(`/api/admin/content/${screenId}`, { method: 'PUT', body: JSON.stringify(data) }),
  
  // 낙관적 업데이트: API 응답 전 캐시 선반영
  onMutate: async (newData) => {
    await queryClient.cancelQueries({ queryKey: ['admin', 'content', screenId] });
    const previous = queryClient.getQueryData(['admin', 'content', screenId]);
    queryClient.setQueryData(['admin', 'content', screenId], (old: any) => ({ ...old, ...newData }));
    return { previous };
  },
  
  // 실패 시 롤백
  onError: (err, newData, context) => {
    queryClient.setQueryData(['admin', 'content', screenId], context?.previous);
    toast.error('저장에 실패했습니다');
  },
  
  // 성공 시 서버 데이터로 재검증
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'content', screenId] });
  },
});
```

---

## 6. 반응형 디자인 브레이크포인트

| 브레이크포인트 | 너비 | 레이아웃 | 설명 |
|----------------|------|----------|------|
| `sm` | 640px~ | 모바일 가로 | 사이드바: Sheet 드로어 |
| `md` | 768px~ | 태블릿 | 사이드바: 축소(아이콘만 64px) |
| `lg` | 1024px~ | 데스크톱 | 사이드바: 확장(240px) |
| `xl` | 1280px~ | 대형 데스크톱 | 사이드바: 확장 + 미리보기 패널 |
| `2xl` | 1536px~ | 키오스크 관리용 | 전체 화면 활용 |

### 6.1 컴포넌트별 반응형 변환

| 컴포넌트 | 모바일 (<768px) | 태블릿 (768~1024px) | 데스크톱 (>1024px) |
|----------|-----------------|---------------------|---------------------|
| AdminSidebar | Sheet 드로어 | 축소 (아이콘만) | 확장 (텍스트+아이콘) |
| ContentList | 1열 카드 | 2열 카드 | 3열 카드 |
| ContentEditForm | 전체 폼 | 전체 폼 | 폼 + 미리보기 분할 |
| DataTable | 카드 뷰 | 테이블 (가로 스크롤) | 테이블 (전체 컬럼) |
| StatsCard | 1열 | 2열 | 4열 그리드 |
| ImageGallery | 2열 | 3열 | 4열 |

---

## 7. 이미지 관리 구현

### 7.1 업로드 폴더 구조

```
public/
  admin-uploads/
    2026-03/
      equipment-v2-abc123.png
      bp-device-def456.jpg
      height-icon-ghi789.webp
    2026-04/
      ...
```

### 7.2 이미지 참조 방식

- 콘텐츠/장비에서는 `/admin-uploads/YYYY-MM/filename` 절대 경로로 참조
- 키오스크 클라이언트는 동일 출처이므로 직접 접근 가능
- 기존 `/kiosk-images/` 경로도 유지 (하위 호환)

### 7.3 이미지 삭제 정책

- 콘텐츠에서 참조 해제 시 즉시 파일 삭제하지 않음 (참조 없는 이미지는 수동 정리)
- 이미지 관리 페이지에서 "미사용 이미지" 필터 제공
- superadmin이 "미사용 이미지 일괄 삭제" 실행 가능

---

## 8. 초기 데이터 시드

```typescript
// prisma/seed-admin.ts
import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/lib/admin/password';
import { createSession } from '../src/lib/admin/auth';

const prisma = new PrismaClient();

async function seed() {
  // 1. 최고 관리자 계정 생성
  const superadmin = await prisma.adminUser.upsert({
    where: { email: process.env.SEED_ADMIN_EMAIL! },
    update: {},
    create: {
      email: process.env.SEED_ADMIN_EMAIL!,
      passwordHash: await hashPassword(process.env.SEED_ADMIN_PASSWORD!),
      name: process.env.SEED_ADMIN_NAME!,
      role: 'superadmin',
      isActive: true,
    },
  });
  
  console.log(`✅ 최고 관리자 생성: ${superadmin.email}`);
  
  // 2. 6가지 측정 항목 시드
  const measurements = [
    { key: 'height', name: '신장', icon: 'ruler', color: '#3B82F6', order: 1, estimatedTime: 5 },
    { key: 'stress', name: '스트레스', icon: 'brain', color: '#EF4444', order: 2, estimatedTime: 7 },
    { key: 'blood-pressure', name: '혈압', icon: 'heart-pulse', color: '#F59E0B', order: 3, estimatedTime: 6 },
    { key: 'grip-strength', name: '악력', icon: 'hand', color: '#10B981', order: 4, estimatedTime: 5 },
    { key: 'body-composition', name: '체성분', icon: 'scale', color: '#8B5CF6', order: 5, estimatedTime: 8 },
    { key: 'skin', name: '피부', icon: 'scan-face', color: '#EC4899', order: 6, estimatedTime: 6 },
  ];
  
  for (const m of measurements) {
    await prisma.measurementItem.upsert({
      where: { key: m.key },
      update: {},
      create: { ...m, isActive: true },
    });
  }
  
  console.log(`✅ 측정 항목 6개 생성`);
  
  // 3. 13개 화면 콘텐츠 시드
  const screens = [
    { section: 'standby', title: '대기 화면' },
    { section: 'main', title: '메인 메뉴' },
    { section: 'equipment-intro', title: '장비 소개' },
    // ... 나머지 10개
  ];
  
  for (const s of screens) {
    await prisma.kioskContent.upsert({
      where: { section: s.section },
      update: {},
      create: { ...s, body: '' },
    });
  }
  
  console.log(`✅ 화면 콘텐츠 13개 생성`);
}

seed().catch(console.error);
```

---

## 9. 키오스크 클라이언트 변경 사항

관리자 대시보드 도입에 따른 키오스크 프론트엔드 변경 최소화:

| 변경 | 내용 | 영향 |
|------|------|------|
| SWR 재검증 추가 | `refreshInterval: 5000` 옵션 추가 | `useSWR` 호출 1곳 |
| 콘텐츠 소스 전환 | 하드코드 → `/api/content` 응답 데이터 사용 | 각 화면 컴포넌트 |
| 측정 항목 동적 로딩 | `/api/measurements`로 6가지 항목 로딩 | `MeasurementMode.tsx`, `MeasurementEquipment.tsx` |
| 이미지 경로 유연 | `/kiosk-images/` + `/admin-uploads/` 모두 지원 | 이미지 컴포넌트 |
