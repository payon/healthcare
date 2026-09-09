# Biogram MINI 관리자 대시보드 — UI/UX 디자인 문서

> 버전: 1.0.0  
> 최종 수정: 2026-03-06  
> 작성자: Biogram MINI 개발팀

---

## 1. 디자인 철학

### 핵심 철학: **"효율적이고 데이터 밀집된 전문 도구"**

관리자 대시보드는 비개발자도 직관적으로 사용할 수 있으면서, 전문 관리자에게는 효율적인 작업 흐름을 제공해야 한다.

| 원칙 | 의미 | 구현 지침 |
|------|------|-----------|
| **효율성** | 최소 클릭으로 작업 완료 | 사이드바 즉시 네비게이션, 인라인 편집, 키보드 단축키 |
| **데이터 밀집** | 한 화면에 많은 정보를 효율적으로 배치 | 테이블 뷰, 통계 카드, 컴팩트 간격 |
| **전문성** | 관리 도구에 걸맞은 신뢰감 | 일관된 색상 체계, 정돈된 레이아웃, 명확한 상태 표시 |
| **안전성** | 실수 방지와 복구 보장 | 확인 다이얼로그, 비활성화(삭제 아님), 감사 로그 |
| **반응형** | 모든 기기에서 사용 가능 | 데스크톱 사이드바 → 모바일 드로어, 테이블 → 카드 뷰 |

### 디자인 원칙 세부

1. **240px 고정 사이드바**: 모든 페이지에서 즉각적 네비게이션. RBAC로 권한 없는 메뉴 자동 숨김
2. **인라인 피드백**: 저장 성공/실패 토스트, 로딩 스켈레톤, 폼 필드 실시간 검증
3. **낙관적 업데이트**: TanStack Query 낙관적 업데이트로 체감 응답성 향상
4. **44px 최소 터치 타겟**: 모바일 환경에서 충분한 터치 영역 보장
5. **역할 뱃지 색상 코딩**: 4가지 역할을 직관적 색상으로 구분

---

## 2. 컬러 시스템

### 2.1 기본 테마: Teal/Emerald oklch 기반 (키오스크와 동일)

관리자 대시보드는 키오스크와 동일한 Teal/Emerald 기반 색상 체계를 사용하여 브랜드 일관성을 유지한다.

| 용도 | CSS 변수 | oklch 값 | 시각 |
|------|----------|----------|------|
| **Primary** | `--primary` | `oklch(0.52 0.14 165)` | 중간 명도 틸/에메랄드 |
| **Primary Foreground** | `--primary-foreground` | `oklch(0.99 0.002 155)` | 거의 백색 |
| **Background** | `--background` | `oklch(0.985 0.002 155)` | 미세 틴트 백색 |
| **Foreground** | `--foreground` | `oklch(0.175 0.015 160)` | 짙은 틴트 흑색 |
| **Card** | `--card` | `oklch(1 0 0)` | 순백색 |
| **Muted** | `--muted` | `oklch(0.96 0.01 160)` | 연한 회색 |
| **Muted Foreground** | `--muted-foreground` | `oklch(0.45 0.02 160)` | 중간 회색 |
| **Border** | `--border` | `oklch(0.91 0.015 160)` | 연한 보더 |
| **Destructive** | `--destructive` | `oklch(0.577 0.245 27.325)` | 경고 빨강 |

### 2.2 역할 뱃지 색상

4가지 관리자 역할을 직관적인 색상으로 구분합니다.

| 역할 | 배경색 | 텍스트색 | Tailwind 클래스 | 의미 |
|------|--------|----------|-----------------|------|
| **superadmin** | 빨강 (red) | 백색 | `bg-red-500 text-white` | 최고 권한, 위험도 높음 |
| **admin** | 주황 (amber) | 흑색 | `bg-amber-500 text-black` | 관리 권한, 주의 |
| **editor** | 틸 (teal) | 백색 | `bg-teal-500 text-white` | 편집 권한, 안전 |
| **viewer** | 회색 (gray) | 백색 | `bg-gray-500 text-white` | 읽기 전용, 중립 |

```tsx
// 역할 뱃지 컴포넌트
function RoleBadge({ role }: { role: Role }) {
  const config: Record<Role, { label: string; className: string }> = {
    superadmin: { label: '최고관리자', className: 'bg-red-500 text-white' },
    admin:      { label: '관리자',     className: 'bg-amber-500 text-black' },
    editor:     { label: '편집자',     className: 'bg-teal-500 text-white' },
    viewer:     { label: '열람자',     className: 'bg-gray-500 text-white' },
  };
  const { label, className } = config[role];
  return <Badge className={className}>{label}</Badge>;
}
```

### 2.3 상태 색상

| 상태 | 색상 | 용도 |
|------|------|------|
| **성공** | `text-emerald-500` | 저장 성공, 활성 상태 |
| **경고** | `text-amber-500` | 비활성 계정, 잠금 임박 |
| **오류** | `text-red-500` | 저장 실패, 검증 에러 |
| **정보** | `text-sky-500` | 안내, 도움말 |

---

## 3. 타이포그래피

### 3.1 폰트 패밀리

| 항목 | 값 |
|------|-----|
| **주 폰트** | Noto Sans KR (Google Fonts, 가변 다이나믹 서브셋) |
| **웨이트** | 400 (Regular), 500 (Medium), 600 (SemiBold), 700 (Bold) |
| **폴백** | 시스템 sans-serif |
| **적용** | `next/font/google`로 로드, CSS 변수 `--font-noto-sans-kr`로 참조 |
| **display** | `swap` (폰트 로딩 전 시스템 폰트로 렌더) |

### 3.2 관리자 타이포그래피 계층

| 계층 | 요소 | 크기 (Tailwind) | 웨이트 | 용도 |
|------|------|-----------------|--------|------|
| **H1** | `<h1>` | `text-2xl` (1.5rem) | 700 | 페이지 제목 |
| **H2** | `<h2>` | `text-xl` (1.25rem) | 600 | 섹션 제목 |
| **H3** | `<h3>` | `text-lg` (1.125rem) | 600 | 카드 제목, 다이얼로그 제목 |
| **Body** | `<p>` | `text-sm` (0.875rem) | 400 | 일반 텍스트, 테이블 셀 |
| **Caption** | `<small>` | `text-xs` (0.75rem) | 400 | 보조 텍스트, 시간 표시 |
| **Label** | `<label>` | `text-sm` (0.875rem) | 500 | 폼 라벨 |
| **Overline** | — | `text-xs uppercase tracking-wider` | 600 | 섹션 라벨 |

> **참고**: 키오스크(노인 친화적 대형 텍스트)와 달리, 관리자 대시보드는 전문 도구에 적합한 표준 크기를 사용합니다.

---

## 4. 레이아웃 시스템

### 4.1 데스크톱 레이아웃 (≥768px)

```
┌──────────────────────────────────────────────────────────────────┐
│                         AdminHeader                              │
│  [☰]  Biogram MINI 관리자             [이운영] [admin] [로그아웃]│
├────────────┬─────────────────────────────────────────────────────┤
│            │                                                      │
│  AdminSidebar│              메인 콘텐츠 영역                     │
│  (240px 고정)│                                                      │
│             │  ┌────────────────────────────────────────────┐    │
│  📊 대시보드│  │                                            │    │
│  📄 콘텐츠 │  │         페이지별 콘텐츠                     │    │
│  🩺 측정항목│  │         p-6                                │    │
│  👥 사용자  │  │                                            │    │
│  🖼 이미지  │  │                                            │    │
│  📋 감사로그│  │                                            │    │
│  ⚙ 설정    │  │                                            │    │
│             │  └────────────────────────────────────────────┘    │
│             │                                                      │
│  ─────────  │                                                      │
│  v1.0.0     │                                                      │
└────────────┴─────────────────────────────────────────────────────┘
```

**특징**:
- AdminSidebar: `w-60` (240px) 고정, `sticky top-0 h-screen`
- 메인 콘텐츠: `flex-1 overflow-y-auto`
- AdminHeader: `sticky top-0 z-10`, 사이드바 위에 위치
- 최소 너비: 768px 이하 시 모바일 레이아웃 전환

### 4.2 모바일 레이아웃 (<768px)

```
┌──────────────────────────────────────┐
│            AdminHeader               │
│  [☰]  Biogram MINI   [이운영] [↗]  │
├──────────────────────────────────────┤
│                                      │
│         메인 콘텐츠 영역             │
│         p-4                          │
│                                      │
│  ┌──────────────────────────────┐   │
│  │                              │   │
│  │    페이지별 콘텐츠            │   │
│  │    (카드 뷰 또는 축소 테이블) │   │
│  │                              │   │
│  └──────────────────────────────┘   │
│                                      │
└──────────────────────────────────────┘

[☰ 클릭 시] ──────────────────────────

┌──────────────────────────────────────┐
│  Sheet (사이드바 드로어)             │
│  ┌──────────────────────────────┐   │
│  │  [✕]                         │   │
│  │  Biogram MINI 관리자          │   │
│  │                               │   │
│  │  📊 대시보드                   │   │
│  │  📄 콘텐츠                    │   │
│  │  🩺 측정항목                  │   │
│  │  👥 사용자                    │   │
│  │  🖼 이미지                    │   │
│  │  📋 감사로그                  │   │
│  │  ⚙ 설정                      │   │
│  │                               │   │
│  │  ─────────────                │   │
│  │  [이운영] admin               │   │
│  │  [로그아웃]                   │   │
│  └──────────────────────────────┘   │
└──────────────────────────────────────┘
```

**특징**:
- AdminSidebar 숨김 → 햄버거 메뉴(☰)로 Sheet 드로어 열기
- Sheet: shadcn/ui `Sheet` 컴포넌트, `side="left"`, 오버레이 클릭 시 닫힘
- AdminHeader: 햄버거 아이콘 + 브랜딩 + 사용자 아바타
- 테이블: 모바일에서 카드 뷰 또는 수평 스크롤
- 폼 다이얼로그: 모바일에서 전체 화면 또는 하단 시트

### 4.3 로그인 페이지 레이아웃

```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│                     (중앙 정렬)                               │
│                                                              │
│              ┌───────────────────────────┐                   │
│              │     Biogram MINI          │                   │
│              │   관리자 대시보드          │                   │
│              │                           │                   │
│              │   ┌───────────────────┐   │                   │
│              │   │ 이메일            │   │                   │
│              │   └───────────────────┘   │                   │
│              │   ┌───────────────────┐   │                   │
│              │   │ 비밀번호          │   │                   │
│              │   └───────────────────┘   │                   │
│              │                           │                   │
│              │   [     로그인      ]      │                   │
│              │                           │                   │
│              └───────────────────────────┘                   │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

**특징**:
- `min-h-screen flex items-center justify-center`
- 카드: `w-full max-w-md p-8`
- Biogram MINI 로고/브랜딩 상단
- 이메일/비밀번호 입력 필드 + 로그인 버튼
- 에러 메시지: 필드 하단 인라인 표시
- 잠금 메시지: 카드 하단 경고 박스

---

## 5. 컴포넌트 사양

### 5.1 AdminSidebar

**파일**: `src/components/admin/layout/AdminSidebar.tsx`

| 항목 | 사양 |
|------|------|
| **네비게이션 항목** | 7개: 대시보드, 콘텐츠, 측정항목, 사용자, 이미지, 감사로그, 설정 |
| **RBAC 필터링** | 사용자 역할에 따라 접근 불가 메뉴 숨김 |
| **활성 상태** | 현재 경로와 일치하는 항목에 `bg-primary/10 text-primary` 스타일 |
| **비활성 상태** | `text-muted-foreground hover:bg-muted` |
| **아이콘** | Lucide 아이콘: `LayoutDashboard`, `FileText`, `Stethoscope`, `Users`, `Image`, `ClipboardList`, `Settings` |
| **모바일** | shadcn/ui `Sheet` 드로어로 전환 (`side="left"`) |
| **하단** | 버전 정보 표시 |

**RBAC 메뉴 필터링 매핑**:

| 메뉴 | 필요 권한 | superadmin | admin | editor | viewer |
|------|-----------|:----------:|:-----:|:------:|:------:|
| 대시보드 | (항상 표시) | ✅ | ✅ | ✅ | ✅ |
| 콘텐츠 | `content:read` | ✅ | ✅ | ✅ | ✅ |
| 측정항목 | `measurements:read` | ✅ | ✅ | ✅ | ✅ |
| 사용자 | `users:read` | ✅ | ✅ | ❌ | ❌ |
| 이미지 | `images:upload` | ✅ | ✅ | ✅ | ❌ |
| 감사로그 | `audit:read` | ✅ | ✅ | ❌ | ✅ |
| 설정 | `settings:read` | ✅ | ✅ | ❌ | ❌ |

```tsx
// AdminSidebar 네비게이션 항목
const NAV_ITEMS = [
  { label: '대시보드', href: '/admin', icon: LayoutDashboard, permission: null },
  { label: '콘텐츠', href: '/admin/content', icon: FileText, permission: 'content:read' },
  { label: '측정항목', href: '/admin/measurements', icon: Stethoscope, permission: 'measurements:read' },
  { label: '사용자', href: '/admin/users', icon: Users, permission: 'users:read' },
  { label: '이미지', href: '/admin/images', icon: Image, permission: 'images:upload' },
  { label: '감사로그', href: '/admin/audit-logs', icon: ClipboardList, permission: 'audit:read' },
  { label: '설정', href: '/admin/settings', icon: Settings, permission: 'settings:read' },
];
```

---

### 5.2 AdminHeader

**파일**: `src/components/admin/layout/AdminHeader.tsx`

| 항목 | 사양 |
|------|------|
| **좌측** | 모바일 햄버거 아이콘 (`Menu`, md:hidden) + 페이지 제목 |
| **우측** | 사용자 이름 + 역할 뱃지(`RoleBadge`) + 로그아웃 버튼(`LogOut` 아이콘) |
| **높이** | `h-14` (56px) |
| **스타일** | `sticky top-0 z-10 border-b bg-background/95 backdrop-blur` |
| **모바일 햄버거** | `md:hidden`, 클릭 시 Sheet 드로어 열기 |

---

### 5.3 데이터 테이블

**라이브러리**: TanStack Table v8 + shadcn/ui `Table` 컴포넌트

| 항목 | 사양 |
|------|------|
| **정렬** | 컬럼 헤더 클릭 시 정렬 (asc/desc/해제) |
| **페이지네이션** | 하단 페이지네이션 바 (`< 1 2 3 ... >`) |
| **검색** | 상단 검색 입력 (`Search` 아이콘 + Input) |
| **필터** | 드롭다운 필터 (예: 역할 필터, 액션 필터) |
| **로딩** | Skeleton 행 표시 (`animate-pulse`) |
| **빈 상태** | "데이터가 없습니다" 안내 + 아이콘 |
| **행 클릭** | 상세 페이지 이동 또는 다이얼로그 열기 |
| **반응형** | 모바일: 카드 뷰 또는 수평 스크롤 |

**열 정의 예 (사용자 테이블)**:
```tsx
const columns = [
  { accessorKey: 'email', header: '이메일' },
  { accessorKey: 'name', header: '이름' },
  { accessorKey: 'role', header: '역할', cell: RoleBadge },
  { accessorKey: 'isActive', header: '상태', cell: ActiveBadge },
  { accessorKey: 'lastLoginAt', header: '마지막 로그인', cell: DateCell },
  { id: 'actions', header: '', cell: RowActions },
];
```

---

### 5.4 폼 다이얼로그

**라이브러리**: React Hook Form + Zod + shadcn/ui `Dialog`

| 항목 | 사양 |
|------|------|
| **다이얼로그** | shadcn/ui `Dialog` (데스크톱), `Drawer` (모바일) |
| **폼 관리** | React Hook Form `useForm({ resolver: zodResolver(schema) })` |
| **검증** | Zod 스키마 기반 실시간 필드 검증 |
| **에러 표시** | 필드 하단 `FormMessage` (빨간 텍스트) |
| **제출** | `Button type="submit"` + `disabled={isPending}` + 로딩 스피너 |
| **성공** | 다이얼로그 닫기 + 성공 토스트 |
| **실패** | 다이얼로그 유지 + 에러 토스트 |
| **확인 다이얼로그** | 삭제/비활성화 시 `AlertDialog` 확인 |

**폼 패턴**:
```tsx
<Dialog>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>사용자 생성</DialogTitle>
    </DialogHeader>
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormField name="email" render={({ field }) => (
          <FormItem>
            <FormLabel>이메일</FormLabel>
            <FormControl><Input {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <Button type="submit" disabled={isPending}>
          {isPending ? '생성 중...' : '생성'}
        </Button>
      </form>
    </Form>
  </DialogContent>
</Dialog>
```

---

### 5.5 통계 카드

**용도**: 대시보드 페이지 상단 4개 통계 카드

| 항목 | 사양 |
|------|------|
| **배치** | 2×2 그리드 (모바일), 4열 (데스크톱) |
| **구성** | 아이콘 + 라벨 + 값 + 변화율(선택) |
| **카드** | shadcn/ui `Card`, `p-6` |
| **아이콘** | Lucide 아이콘 + `bg-primary/10` 원형 배경 |

**4개 통계 카드**:

| 카드 | 아이콘 | 값 | 설명 |
|------|--------|-----|------|
| 세션 수 | `Activity` | `sessions.total` | 기간 내 총 세션 수 |
| 완료율 | `CheckCircle` | `sessions.completionRate%` | 세션 완료율 |
| 평균 체류 | `Clock` | `sessions.avgDuration초` | 평균 세션 체류 시간 |
| 변경 수 | `FileEdit` | `contentChanges.last7d` | 최근 7일 콘텐츠 변경 수 |

---

### 5.6 이미지 업로드

**라이브러리**: 커스텀 드래그앤드롭 + Sharp (서버)

| 항목 | 사양 |
|------|------|
| **드롭존** | 점선 보더 영역, "이미지를 드래그하여 업로드" 안내 |
| **클릭 업로드** | 숨겨진 `<input type="file">` + 라벨 트리거 |
| **지원 형식** | PNG, JPG, WebP, SVG (화이트리스트) |
| **최대 크기** | 5MB |
| **미리보기** | 업로드 전 이미지 썸네일 미리보기 |
| **진행 상태** | 업로드 중 스피너 + 진행 바 |
| **서버 처리** | Sharp: EXIF 회전, 최대 1920×1080 리사이징, 메타데이터 제거 |
| **결과** | 업로드된 URL 반환 → 폼 필드에 자동 입력 |

```tsx
// 이미지 업로드 컴포넌트
function ImageUploader({ value, onChange, category }: ImageUploaderProps) {
  // 드래그앤드롭 핸들러
  // 파일 형식/크기 검증
  // FormData 생성 + POST /api/admin/images/upload
  // 미리보기 URL 관리
  return (
    <div className="border-2 border-dashed rounded-lg p-8 text-center">
      {preview ? <img src={preview} /> : <Upload 아이콘 + 안내 텍스트 />}
      <input type="file" accept="image/*" hidden />
    </div>
  );
}
```

---

### 5.7 감사 로그 확장 행

| 항목 | 사양 |
|------|------|
| **기본 행** | 사용자, 액션 뱃지, 엔티티, 엔티티 ID, 날짜 |
| **확장 버튼** | `ChevronDown` 아이콘, 클릭 시 확장/축소 토글 |
| **확장 내용** | JSON 형식 변경 전/후 값 표시 |
| **액션 뱃지** | create=초록, update=파랑, delete=빨강 |

**액션 뱃지 색상**:

| 액션 | 배경색 | 텍스트 |
|------|--------|--------|
| `create` | `bg-emerald-100 text-emerald-700` | 생성 |
| `update` | `bg-sky-100 text-sky-700` | 수정 |
| `delete` | `bg-red-100 text-red-700` | 삭제 |

---

### 5.8 색상 선택기

**용도**: 측정 항목의 `color` 필드 편집

| 항목 | 사양 |
|------|------|
| **입력 방식** | HEX 색상 코드 입력 + 컬러 피커 |
| **컬러 피커** | shadcn/ui `Popover` + HTML `<input type="color">` |
| **미리보기** | 선택한 색상의 원형 스와치 |
| **검증** | `/#^[0-9A-Fa-f]{6}$/` HEX 형식 |
| **기본값** | `#3B82F6` (파랑) |

```tsx
function ColorPicker({ value, onChange }: ColorPickerProps) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-8 h-8 rounded-full border" style={{ backgroundColor: value }} />
      <Input value={value} onChange={onChange} placeholder="#3B82F6" />
      <Popover>
        <PopoverTrigger><Button>선택</Button></PopoverTrigger>
        <PopoverContent>
          <input type="color" value={value} onChange={onChange} />
        </PopoverContent>
      </Popover>
    </div>
  );
}
```

---

### 5.9 동적 목록 편집기

**용도**: 장비의 `preparationSteps` (준비 단계) 및 `precautions` (주의사항) 편집

#### 준비 단계 편집기

| 항목 | 사양 |
|------|------|
| **항목 추가** | "+ 단계 추가" 버튼 → 빈 문자열 항목 추가 |
| **항목 삭제** | 각 항목 우측 `X` 버튼 |
| **순서 변경** | 드래그앤드롭 또는 ↑↓ 버튼 |
| **최대 항목** | 10개 |
| **입력** | `Input` 필드, 최대 200자 |

```tsx
function StepEditor({ steps, onChange }: StepEditorProps) {
  return (
    <div className="space-y-2">
      {steps.map((step, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="text-muted-foreground">{i + 1}.</span>
          <Input value={step} onChange={(e) => updateStep(i, e.target.value)} />
          <Button variant="ghost" size="icon" onClick={() => removeStep(i)}>
            <X />
          </Button>
        </div>
      ))}
      <Button variant="outline" onClick={addStep}>+ 단계 추가</Button>
    </div>
  );
}
```

#### 주의사항 편집기

| 항목 | 사양 |
|------|------|
| **항목 추가** | "+ 주의사항 추가" 버튼 |
| **수준 선택** | `Select` 드롭다운: `warning` (⚠️ 경고) / `info` (ℹ️ 정보) |
| **텍스트 입력** | `Input` 필드, 최대 200자 |
| **항목 삭제** | 각 항목 우측 `X` 버튼 |
| **최대 항목** | 10개 |

```tsx
interface Precaution { level: 'warning' | 'info'; text: string; }

function PrecautionEditor({ precautions, onChange }: PrecautionEditorProps) {
  return (
    <div className="space-y-2">
      {precautions.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <Select value={p.level} onChange={(v) => updateLevel(i, v)}>
            <SelectTrigger>⚠️ 경고 / ℹ️ 정보</SelectTrigger>
          </Select>
          <Input value={p.text} onChange={(e) => updateText(i, e.target.value)} />
          <Button variant="ghost" onClick={() => removePrecaution(i)}><X /></Button>
        </div>
      ))}
      <Button variant="outline" onClick={addPrecaution}>+ 주의사항 추가</Button>
    </div>
  );
}
```

---

## 6. 애니메이션

### 6.1 사이드바 전환

**메뉴 항목 hover**: `hover:bg-muted transition-colors duration-150`

**활성 항목**: 좌측 `border-l-2 border-primary` 인디케이터

### 6.2 다이얼로그

**열기/닫기**: shadcn/ui `Dialog` 기본 애니메이션 (fade + scale, 150ms)

### 6.3 토스트

**나타남**: slide-in from right (300ms)  
**사라짐**: fade-out (200ms)

### 6.4 로딩 스켈레톤

```tsx
// 테이블 로딩 스켈레톤
<Skeleton className="h-4 w-[250px]" />  // 텍스트
<Skeleton className="h-10 w-full" />     // 입력 필드
<Skeleton className="h-12 w-full" />     // 테이블 행
```

---

## 7. 반응형 브레이크포인트

| 브레이크포인트 | 최소 너비 | 대상 | 주요 변화 |
|---------------|-----------|------|-----------|
| **sm** | 640px | 대형 모바일 | 카드 2열 그리드 |
| **md** | 768px | 태블릿·데스크톱 | **분기점**: 모바일↔데스크톱 레이아웃 전환 |
| **lg** | 1024px | 데스크톱 | 테이블 전체 열 표시 |
| **xl** | 1280px | 대형 데스크톱 | 여유로운 간격 |

### md 분기점 변화 상세

| 요소 | 모바일 (<md) | 데스크톱 (≥md) |
|------|-------------|----------------|
| AdminSidebar | Sheet 드로어 | 고정 사이드바 (240px) |
| 햄버거 메뉴 | 표시 | 숨김 |
| 통계 카드 | 2×2 그리드 | 4열 그리드 |
| 데이터 테이블 | 카드 뷰/수평 스크롤 | 전체 테이블 |
| 폼 다이얼로그 | 전체 화면/하단 시트 | 중앙 다이얼로그 |
| 메인 패딩 | `p-4` | `md:p-6` |

---

## 8. 커스텀 스크롤바

관리자 대시보드에서도 키오스크와 동일한 커스텀 스크롤바 스타일을 사용합니다.

```css
.admin-scroll::-webkit-scrollbar {
  width: 6px;
}
.admin-scroll::-webkit-scrollbar-thumb {
  border-radius: 9999px;
  background: oklch(0.52 0.14 165) / 15%;
}
.admin-scroll::-webkit-scrollbar-thumb:hover {
  background: oklch(0.52 0.14 165) / 30%;
}
```

---

## 부록 A: 관리자 UI 컴포넌트 전체 목록

| 분류 | 컴포넌트 | 경로 |
|------|----------|------|
| **레이아웃** | AdminLayout | `src/app/admin/layout.tsx` |
| **레이아웃** | AdminSidebar | `src/components/admin/layout/AdminSidebar.tsx` |
| **레이아웃** | AdminHeader | `src/components/admin/layout/AdminHeader.tsx` |
| **레이아웃** | AdminAuthGuard | `src/components/admin/layout/AdminAuthGuard.tsx` |
| **프로바이더** | Providers | `src/components/admin/Providers.tsx` |
| **페이지** | LoginPage | `src/app/admin/login/page.tsx` |
| **페이지** | DashboardPage | `src/app/admin/page.tsx` |
| **페이지** | ContentListPage | `src/app/admin/content/page.tsx` |
| **페이지** | ContentDetailPage | `src/app/admin/content/[screenId]/page.tsx` |
| **페이지** | MeasurementListPage | `src/app/admin/measurements/page.tsx` |
| **페이지** | MeasurementDetailPage | `src/app/admin/measurements/[id]/page.tsx` |
| **페이지** | UsersPage | `src/app/admin/users/page.tsx` |
| **페이지** | ImagesPage | `src/app/admin/images/page.tsx` |
| **페이지** | AuditLogsPage | `src/app/admin/audit-logs/page.tsx` |
| **페이지** | SettingsPage | `src/app/admin/settings/page.tsx` |

---

## 부록 B: CSS 유틸리티 클래스 (관리자 전용)

| 클래스 | 용도 |
|--------|------|
| `.admin-scroll` | 관리자 커스텀 스크롤바 |
| `.role-superadmin` | 역할 뱃지 - 최고관리자 (빨강) |
| `.role-admin` | 역할 뱃지 - 관리자 (주황) |
| `.role-editor` | 역할 뱃지 - 편집자 (티얼) |
| `.role-viewer` | 역할 뱃지 - 열람자 (회색) |
| `.action-create` | 액션 뱃지 - 생성 (초록) |
| `.action-update` | 액션 뱃지 - 수정 (파랑) |
| `.action-delete` | 액션 뱃지 - 삭제 (빨강) |
