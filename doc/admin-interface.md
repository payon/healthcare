# Biogram MINI 관리자 대시보드 — 인터페이스 사양 문서

> 버전: 1.0.0  
> 최종 수정: 2026-03-06  
> 작성자: Biogram MINI 개발팀

---

## 1. 관리자 페이지 개요

관리자 대시보드는 총 8개 페이지로 구성되며, 각 페이지는 공통 레이아웃(AdminSidebar, AdminHeader, main)을 따른다.

| # | 페이지 | 경로 | 설명 | 최소 역할 |
|---|--------|------|------|-----------|
| 1 | 로그인 | `/admin/login` | 이메일/비밀번호 인증 | — |
| 2 | 대시보드 | `/admin` | 통계 카드, 최근 변경, 화면 방문 | viewer |
| 3 | 콘텐츠 관리 | `/admin/content` | 13개 화면 콘텐츠 목록 | viewer |
| 4 | 콘텐츠 상세 | `/admin/content/:screenId` | 개별 화면 편집 폼 | viewer |
| 5 | 측정 항목 | `/admin/measurements` | 6가지 측정 항목 그리드 | viewer |
| 6 | 측정 항목 상세 | `/admin/measurements/:id` | 항목 편집 + 장비 CRUD | viewer |
| 7 | 사용자 관리 | `/admin/users` | 관리자 계정 데이터 테이블 | admin |
| 8 | 이미지 관리 | `/admin/images` | 업로드 + 갤러리 그리드 | editor |
| 9 | 감사 로그 | `/admin/audit-logs` | 변경 이력 테이블 | admin |
| 10 | 설정 | `/admin/settings` | 시스템 설정 | superadmin |

> **참고**: 최소 역할은 페이지 접근 권한이며, 읽기/쓰기 권한은 RBAC에 따라 개별 적용됩니다.

---

## 2. 각 페이지의 인터페이스

### 2.1 로그인 페이지

**경로**: `/admin/login`  
**파일**: `src/app/admin/login/page.tsx`

```
┌───────────────────────────────────────┐
│              Biogram MINI              │
│            관리자 대시보드              │
│                                        │
│  이메일                                │
│  ┌───────────────────────────────────┐ │
│  │ admin@biogram.co.kr              │ │
│  └───────────────────────────────────┘ │
│                                        │
│  비밀번호                              │
│  ┌───────────────────────────────────┐ │
│  │ ••••••••••••           [👁 보기]  │ │
│  └───────────────────────────────────┘ │
│                                        │
│  ┌───────────────────────────────────┐ │
│  │           로그인                  │ │
│  └───────────────────────────────────┘ │
│                                        │
│  ⚠️ 계정이 잠겼습니다. 15분 후...     │  ← 잠금 시 표시
└───────────────────────────────────────┘
```

| 요소 | 타입 | 설명 |
|------|------|------|
| 브랜딩 | 텍스트 | "Biogram MINI" + "관리자 대시보드" |
| 이메일 입력 | `Input` | `type="email"`, Zod: `z.string().email()` |
| 비밀번호 입력 | `Input` | `type="password"`, Zod: `z.string().min(8).max(64)` |
| 비밀번호 보기 | `Button` | 토글 `type="password"` ↔ `type="text"` |
| 로그인 버튼 | `Button` | `type="submit"`, 로딩 시 스피너 |
| 에러 메시지 | `FormMessage` | 필드별 인라인 검증 에러 |
| 잠금 메시지 | `Alert` | 423 응답 시 경고 박스 |

---

### 2.2 대시보드 페이지

**경로**: `/admin`  
**파일**: `src/app/admin/page.tsx`

```
┌──────────────────────────────────────────────────┐
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐│
│  │📊 세션  │ │✅ 완료  │ │⏱ 체류  │ │📝 변경  ││
│  │   342   │ │  71.6%  │ │  312초  │ │  12건   ││
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘│
│                                                    │
│  최근 변경 이력                                    │
│  ┌──────────────────────────────────────────────┐ │
│  │ 이운영 │ update │ 혈압     │ 2026-03-06     │ │
│  │ 박수정 │ update │ 장비소개 │ 2026-03-05     │ │
│  │ ...    │ ...    │ ...     │ ...            │ │
│  └──────────────────────────────────────────────┘ │
│                                                    │
│  화면 방문 통계                                    │
│  ┌──────────────────────────────────────────────┐ │
│  │ main            ████████████████  342        │ │
│  │ equipment-intro ██████████████    280        │ │
│  │ signup          ███████████       220        │ │
│  │ ...                                           │ │
│  └──────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────┘
```

| 섹션 | 요소 | 데이터 소스 |
|------|------|-----------|
| **통계 카드** | 4개 카드 (세션 수, 완료율, 평균 체류, 변경 수) | `GET /api/admin/stats` → `sessions.*`, `contentChanges.last7d` |
| **최근 변경** | 테이블 (사용자, 액션, 엔티티명, 날짜) | `GET /api/admin/stats` → `contentChanges.recent` |
| **화면 방문** | 수평 바 차트 (화면명, 방문수) | `GET /api/admin/stats` → `screens.mostVisited` |

---

### 2.3 콘텐츠 목록 페이지

**경로**: `/admin/content`  
**파일**: `src/app/admin/content/page.tsx`

```
┌──────────────────────────────────────────────────┐
│  콘텐츠 관리                                      │
│                                                    │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐      │
│  │ 장비 소개  │ │ 측정 위치 │ │ 앱 설치   │      │
│  │ equipment │ │ location  │ │ app-install│      │
│  │ 2 섹션    │ │ 1 섹션    │ │ 1 섹션    │      │
│  └───────────┘ └───────────┘ └───────────┘      │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐      │
│  │ 회원가입  │ │ 정맥등록  │ │ 로그인    │      │
│  │ signup    │ │ vein-reg  │ │ login     │      │
│  │ 3 섹션    │ │ 2 섹션    │ │ 1 섹션    │      │
│  └───────────┘ └───────────┘ └───────────┘      │
│  ... (13개 화면 카드)                              │
└──────────────────────────────────────────────────┘
```

| 요소 | 설명 |
|------|------|
| 화면 카드 | 13개, `Card` 컴포넌트, 클릭 시 상세 페이지 이동 |
| 섹션 라벨 | 화면 식별자 (예: `equipment-intro`) |
| 섹션 수 | 하위 ContentSection 개수 뱃지 |
| 업데이트 시간 | `updatedAt` 표시 |

---

### 2.4 콘텐츠 상세 편집 페이지

**경로**: `/admin/content/:screenId`  
**파일**: `src/app/admin/content/[screenId]/page.tsx`

```
┌──────────────────────────────────────────────────┐
│  ← 콘텐츠 관리    장비 소개                       │
│                                                    │
│  제목                                              │
│  ┌──────────────────────────────────────────────┐ │
│  │ 장비 소개                                    │ │
│  └──────────────────────────────────────────────┘ │
│                                                    │
│  본문                                              │
│  ┌──────────────────────────────────────────────┐ │
│  │ Biogram MINI는 7가지 건강 지표를 측정하는... │ │
│  │                                              │ │
│  └──────────────────────────────────────────────┘ │
│                                                    │
│  대표 이미지                                       │
│  ┌──────────────────────────────────────────────┐ │
│  │ [드래그앤드롭 또는 클릭하여 업로드]           │ │
│  │ /kiosk-images/equipment.png                  │ │
│  └──────────────────────────────────────────────┘ │
│                                                    │
│  QR 코드 이미지                                    │
│  ┌──────────────────────────────────────────────┐ │
│  │ [선택사항]                                   │ │
│  └──────────────────────────────────────────────┘ │
│                                                    │
│  ── 하위 섹션 ──                                   │
│  ┌──────────────────────────────────────────────┐ │
│  │ 개요 (overview)         [편집]               │ │
│  │ 특징 (features)         [편집]               │ │
│  └──────────────────────────────────────────────┘ │
│                                                    │
│  [저장]                          [취소]            │
└──────────────────────────────────────────────────┘
```

| 요소 | 타입 | 설명 |
|------|------|------|
| 제목 | `Input` | 필수, 최대 200자 |
| 본문 | `Textarea` | 선택, 최대 5000자 |
| 대표 이미지 | `ImageUploader` | 드래그앤드롭, 미리보기 |
| QR 코드 이미지 | `ImageUploader` | 선택사항 |
| 하위 섹션 목록 | `ContentSection[]` | 섹션 키, 제목, 편집 버튼 |
| 저장 버튼 | `Button` | `content:write` 권한 필요, viewer는 비활성화 |
| 취소 버튼 | `Button` | 목록으로 이동 |

---

### 2.5 측정 항목 목록 페이지

**경로**: `/admin/measurements`  
**파일**: `src/app/admin/measurements/page.tsx`

```
┌──────────────────────────────────────────────────┐
│  측정 항목                                        │
│                                                    │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐   │
│  │ 🎨 신장    │ │ 🎨 스트레스│ │ 🎨 혈압    │   │
│  │ #38BDF8    │ │ #FB7185    │ │ #FBBF24    │   │
│  │ 장비 1개   │ │ 장비 1개   │ │ 장비 1개   │   │
│  │ 1분        │ │ 2분        │ │ 2분        │   │
│  └────────────┘ └────────────┘ └────────────┘   │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐   │
│  │ 🎨 악력    │ │ 🎨 체성분  │ │ 🎨 피부    │   │
│  │ #A78BFA    │ │ #34D399    │ │ #F472B6    │   │
│  │ 장비 1개   │ │ 장비 1개   │ │ 장비 1개   │   │
│  │ 1분        │ │ 2분        │ │ 1분        │   │
│  └────────────┘ └────────────┘ └────────────┘   │
└──────────────────────────────────────────────────┘
```

| 요소 | 설명 |
|------|------|
| 항목 카드 | 6개, `Card` 컴포넌트, 3열 그리드 (데스크톅), 2열 (태블릿) |
| 색상 스와치 | 좌측 `border-l-4` 또는 원형 색상 표시 |
| 장비 수 뱃지 | "장비 N개" 텍스트 |
| 예상 소요 시간 | "N분" 텍스트 |
| 활성/비활성 | `isActive` 상태 뱃지 |

---

### 2.6 측정 항목 상세 편집 페이지

**경로**: `/admin/measurements/:id`  
**파일**: `src/app/admin/measurements/[id]/page.tsx`

```
┌──────────────────────────────────────────────────┐
│  ← 측정 항목    혈압                              │
│                                                    │
│  기본 정보                                         │
│  식별자: blood-pressure                            │
│  이름:   [혈압           ]                         │
│  설명:   [혈압을 측정합니다                      ] │
│  아이콘: [heart          ]                         │
│  색상:   [🎨 #FBBF24    ]                         │
│  순서:   [3              ]                         │
│  소요:   [2분            ]                         │
│  활성:   [✅ 활성        ]                         │
│                                                    │
│  장비 정보                                         │
│  ┌──────────────────────────────────────────────┐ │
│  │ 자동혈압계                    [편집] [삭제] │ │
│  │ 팔에 커프를 감아 자동 측정                  │ │
│  └──────────────────────────────────────────────┘ │
│  [+ 장비 추가]                                     │
│                                                    │
│  [저장]                          [취소]            │
└──────────────────────────────────────────────────┘
```

| 요소 | 타입 | 설명 |
|------|------|------|
| 식별자 | `Input` | `key` 필드, kebab-case, 생성 후 수정 불가 |
| 이름 | `Input` | 2~20자 |
| 설명 | `Textarea` | 최대 500자 |
| 아이콘 | `Input` | Lucide 아이콘명 |
| 색상 | `ColorPicker` | HEX 색상 코드 + 컬러 피커 |
| 순서 | `Input` | 숫자, 1~100 |
| 예상 소요 | `Input` | 숫자, 1~30 (분) |
| 활성 | `Switch` | `isActive` 토글 |
| 장비 목록 | `MeasurementEquipment[]` | 장비 카드 + 편집/삭제 버튼 |
| 장비 추가 | `Button` | 장비 생성 다이얼로그 열기 |

**장비 편집 다이얼로그**:

| 요소 | 타입 | 설명 |
|------|------|------|
| 장비명 | `Input` | 2~50자 |
| 설명 | `Textarea` | 최대 1000자 |
| 준비 단계 | `StepEditor` | 동적 목록, 최대 10개 |
| 주의사항 | `PrecautionEditor` | 동적 목록, level + text |
| 이미지 | `ImageUploader` | 장비 이미지 |
| 순서 | `Input` | 정렬 순서 |

---

### 2.7 사용자 관리 페이지

**경로**: `/admin/users`  
**파일**: `src/app/admin/users/page.tsx`

```
┌──────────────────────────────────────────────────┐
│  사용자 관리                      [+ 사용자 추가] │
│                                                    │
│  검색: [                    ]  역할: [전체 ▾]     │
│                                                    │
│  ┌──────────────────────────────────────────────┐ │
│  │ 이메일         │ 이름   │ 역할    │ 상태  │  │ │
│  │────────────────│────────│─────────│───────│──│ │
│  │ admin@bio...   │ 최관리 │ super.. │ 활성  │⋯│ │
│  │ operator@bio.. │ 이운영 │ admin   │ 활성  │⋯│ │
│  │ editor@bio...  │ 박수정 │ editor  │ 활성  │⋯│ │
│  │ viewer@bio...  │ 김조회 │ viewer  │ 활성  │⋯│ │
│  └──────────────────────────────────────────────┘ │
│                                                    │
│  ◀ 1 ▶  전체 4건                                  │
└──────────────────────────────────────────────────┘
```

| 요소 | 설명 |
|------|------|
| 데이터 테이블 | TanStack Table, 정렬 가능, 행 클릭 시 편집 다이얼로그 |
| 검색 입력 | 이름/이메일 검색 (`Search` 아이콘) |
| 역할 필터 | `Select` 드롭다운: 전체/superadmin/admin/editor/viewer |
| 추가 버튼 | "+ 사용자 추가" → 생성 다이얼로그 |
| 행 액션 | ⋯ 메뉴: 편집, 비활성화 |
| 페이지네이션 | 하단 페이지 바 |

**사용자 생성/편집 다이얼로그**:

| 필드 | 타입 | 검증 | 설명 |
|------|------|------|------|
| 이메일 | `Input` | `z.string().email()` | 고유, 생성 후 수정 불가 |
| 비밀번호 | `Input` | 8~64자, 영문+숫자+특수문자 | 생성 시 필수, 편집 시 선택 |
| 이름 | `Input` | 2~50자 | 표시 이름 |
| 역할 | `Select` | enum: 4가지 | superadmin만 역할 변경 가능 |

---

### 2.8 이미지 관리 페이지

**경로**: `/admin/images`  
**파일**: `src/app/admin/images/page.tsx`

```
┌──────────────────────────────────────────────────┐
│  이미지 관리                                      │
│                                                    │
│  ┌──────────────────────────────────────────────┐ │
│  │                                              │ │
│  │    📤 이미지를 드래그하여 업로드               │ │
│  │       또는 클릭하여 파일 선택                  │ │
│  │       PNG, JPG, WebP, SVG (최대 5MB)         │ │
│  │                                              │ │
│  └──────────────────────────────────────────────┘ │
│                                                    │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐           │
│  │ 🖼   │ │ 🖼   │ │ 🖼   │ │ 🖼   │           │
│  │ eq.png│ │ bp.png│ │ skin │ │ loc  │           │
│  │ 245KB │ │ 180KB │ │ 90KB │ │ 320KB│           │
│  │ 3/06  │ │ 3/05  │ │ 3/04 │ │ 3/03 │           │
│  └──────┘ └──────┘ └──────┘ └──────┘           │
│  ... (갤러리 그리드)                               │
└──────────────────────────────────────────────────┘
```

| 요소 | 설명 |
|------|------|
| 드롭존 | 점선 보더, 드래그앤드롭 + 클릭 업로드 |
| 갤러리 그리드 | 4열 (데스크톅), 3열 (태블릿), 2열 (모바일) |
| 이미지 카드 | 썸네일, 파일명, 크기, 업로드 날짜 |
| 업로드 진행 | 스피너 + 진행 바 |
| 에러 | 형식/크기 검증 에러 인라인 표시 |

---

### 2.9 감사 로그 페이지

**경로**: `/admin/audit-logs`  
**파일**: `src/app/admin/audit-logs/page.tsx`

```
┌──────────────────────────────────────────────────┐
│  감사 로그                                        │
│                                                    │
│  액션: [전체 ▾]  엔티티: [전체 ▾]  기간: [날짜]  │
│                                                    │
│  ┌──────────────────────────────────────────────┐ │
│  │ 사용자  │ 액션   │ 엔티티       │ 날짜      │ │
│  │─────────│────────│──────────────│───────────│ │
│  │ 이운영  │ [수정] │ MeasureItem  │ 2026-03-06│▼│
│  │  ┌────────────────────────────────────────┐ │ │
│  │  │ 변경 전: { "name": "혈압", ... }       │ │ │
│  │  │ 변경 후: { "name": "혈압", ... }       │ │ │
│  │  └────────────────────────────────────────┘ │ │
│  │ 박수정  │ [수정] │ KioskContent │ 2026-03-05│▼│
│  │ 최관리  │ [생성] │ AdminUser    │ 2026-03-04│▼│
│  └──────────────────────────────────────────────┘ │
│                                                    │
│  ◀ 1 2 3 ▶  전체 128건                            │
└──────────────────────────────────────────────────┘
```

| 요소 | 설명 |
|------|------|
| 데이터 테이블 | 사용자, 액션 뱃지, 엔티티, 날짜, 확장 버튼 |
| 액션 필터 | `Select`: 전체/create/update/delete |
| 엔티티 필터 | `Select`: 전체/KioskContent/MeasurementItem/... |
| 날짜 범위 | `from` ~ `to` 날짜 선택기 |
| 확장 행 | 클릭 시 변경 전/후 JSON 표시 |
| 페이지네이션 | 50건/page |

---

### 2.10 설정 페이지

**경로**: `/admin/settings`  
**파일**: `src/app/admin/settings/page.tsx`

```
┌──────────────────────────────────────────────────┐
│  설정                                              │
│                                                    │
│  시스템 정보                                       │
│  버전:     v1.0.0                                  │
│  DB 크기:  3.2 MB                                  │
│  마지막 백업: 2026-03-05                           │
│                                                    │
│  보안 설정                                         │
│  세션 만료:  [8시간        ]                       │
│  잠금 임계값: [5회          ]                      │
│  잠금 기간:  [15분         ]                       │
│                                                    │
│  키오스크 설정                                     │
│  유휴 타임아웃: [120초       ]                     │
│  폴링 간격:    [5초         ]                      │
│                                                    │
│  역할 권한 매트릭스                                 │
│  ┌──────────────────────────────────────────────┐ │
│  │ 권한          │ super │ admin │ editor │ viewer│ │
│  │ content:read  │  ✅   │  ✅   │  ✅    │  ✅  │ │
│  │ content:write │  ✅   │  ✅   │  ✅    │  ❌  │ │
│  │ ...           │  ...  │  ...  │  ...   │  ... │ │
│  └──────────────────────────────────────────────┘ │
│                                                    │
│  [저장] (superadmin 전용)                          │
└──────────────────────────────────────────────────┘
```

| 섹션 | 요소 | 편집 권한 |
|------|------|-----------|
| 시스템 정보 | 읽기 전용 | — |
| 보안 설정 | 입력 필드 | `settings:write` (superadmin) |
| 키오스크 설정 | 입력 필드 | `settings:write` (superadmin) |
| 역할 권한 매트릭스 | 읽기 전용 테이블 | — |

---

## 3. API 인터페이스

### 3.1 인증 API

#### POST /api/admin/auth/login

```typescript
// 요청
interface LoginRequest {
  email: string;      // 이메일 형식
  password: string;   // 8~64자
}

// 응답 200
interface LoginResponse {
  user: {
    id: string;
    email: string;
    name: string;
    role: Role;
    lastLoginAt: string;
  };
}

// 에러
// 400: VALIDATION_ERROR
// 401: AUTH_INVALID
// 423: ACCOUNT_LOCKED
```

#### POST /api/admin/auth/logout

```typescript
// 요청: 없음 (쿠키 기반)
// 응답 200
interface LogoutResponse {
  success: boolean;
}
```

#### GET /api/admin/auth/me

```typescript
// 응답 200
interface CurrentUserResponse {
  id: string;
  email: string;
  name: string;
  role: Role;
  isActive: boolean;
  lastLoginAt: string | null;
}
// 에러: 401 AUTH_REQUIRED
```

---

### 3.2 사용자 관리 API

#### GET /api/admin/users

```typescript
// 쿼리 파라미터
interface UsersQuery {
  page?: number;     // 기본: 1
  limit?: number;    // 기본: 20, 최대: 100
  role?: Role;       // 역할 필터
  search?: string;   // 이름/이메일 검색
}

// 응답 200
interface UsersResponse {
  data: Array<{
    id: string;
    email: string;
    name: string;
    role: Role;
    isActive: boolean;
    lastLoginAt: string | null;
    createdAt: string;
  }>;
  pagination: Pagination;
}
```

#### POST /api/admin/users

```typescript
// 요청
interface CreateUserRequest {
  email: string;     // 이메일 형식, 고유
  password: string;  // 8~64자, 영문+숫자+특수문자
  name: string;      // 2~50자
  role: Role;
}

// 응답 201
interface CreateUserResponse {
  id: string;
  email: string;
  name: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
}

// 에러: 400 VALIDATION_ERROR, 409 CONFLICT (이메일 중복)
```

#### PUT /api/admin/users/:id

```typescript
// 요청 (모든 필드 선택적)
interface UpdateUserRequest {
  name?: string;
  role?: Role;        // superadmin만 변경 가능
  isActive?: boolean;
  password?: string;  // 포함 시 비밀번호 변경
}

// 응답 200: 수정된 사용자 객체
```

#### DELETE /api/admin/users/:id

```typescript
// 응답 200
interface DeleteUserResponse {
  success: boolean;
  id: string;
}
// 비활성화 (물리 삭제 아님)
// superadmin 본인 계정 비활성화 불가
```

---

### 3.3 콘텐츠 관리 API

#### GET /api/admin/content

```typescript
// 응답 200
type ContentListResponse = Array<{
  id: string;
  section: string;
  title: string;
  body: string;
  imageUrl: string | null;
  qrCodeUrl: string | null;
  sections: ContentSection[];
  updatedAt: string;
}>;
```

#### PUT /api/admin/content/:screenId

```typescript
// 요청
interface UpdateContentRequest {
  title: string;           // 필수, 최대 200자
  body?: string;           // 최대 5000자
  imageUrl?: string | null;
  qrCodeUrl?: string | null;
}

// 응답 200: 수정된 콘텐츠 객체
```

#### PUT /api/admin/content/:screenId/sections/:key

```typescript
// 요청
interface UpdateSectionRequest {
  title: string;
  body?: string;
  imageUrl?: string | null;
  order?: number;
}

// 응답 200: 수정된 섹션 객체
```

---

### 3.4 측정 항목 관리 API

#### GET /api/admin/measurements

```typescript
// 응답 200
type MeasurementListResponse = Array<{
  id: string;
  key: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  order: number;
  imageUrl: string | null;
  estimatedTime: number;
  isActive: boolean;
  equipment: Array<{
    id: string;
    name: string;
    description: string;
    order: number;
  }>;
}>;
```

#### POST /api/admin/measurements

```typescript
// 요청
interface CreateMeasurementRequest {
  key: string;            // kebab-case, 고유
  name: string;           // 2~20자
  description?: string;   // 최대 500자
  icon?: string;
  color?: string;         // HEX 색상
  order: number;          // 1~100
  imageUrl?: string | null;
  estimatedTime?: number; // 1~30 (분)
  isActive?: boolean;
}

// 응답 201: 생성된 측정 항목 객체
```

#### PUT /api/admin/measurements/:id

```typescript
// 요청: 모든 필드 선택적
// 응답 200: 수정된 객체
```

#### DELETE /api/admin/measurements/:id

```typescript
// 응답 200: { success: boolean; id: string }
// 연관 장비 정보도 함께 삭제 (Cascade)
```

---

### 3.5 측정 장비 관리 API

#### GET /api/admin/measurements/:id/equipment

```typescript
// 응답 200
type EquipmentListResponse = Array<{
  id: string;
  measurementId: string;
  name: string;
  description: string;
  preparationSteps: string[];
  precautions: Array<{ level: 'warning' | 'info'; text: string }>;
  imageUrl: string | null;
  order: number;
  updatedAt: string;
}>;
```

#### POST /api/admin/measurements/:id/equipment

```typescript
// 요청
interface CreateEquipmentRequest {
  name: string;           // 2~50자
  description?: string;   // 최대 1000자
  preparationSteps?: string[];   // 최대 10개
  precautions?: Array<{ level: 'warning' | 'info'; text: string }>;
  imageUrl?: string | null;
  order: number;
}

// 응답 201: 생성된 장비 객체
```

#### PUT /api/admin/measurements/:id/equipment/:eqId

```typescript
// 요청: 모든 필드 선택적
// 응답 200: 수정된 장비 객체
```

#### DELETE /api/admin/measurements/:id/equipment/:eqId

```typescript
// 응답 200: { success: boolean; id: string }
```

---

### 3.6 이미지 업로드 API

#### POST /api/admin/images/upload

```typescript
// 요청: multipart/form-data
// file: File (PNG/JPG/WebP/SVG, 최대 5MB)
// category?: string (kiosk/equipment/icon)

// 응답 201
interface UploadResponse {
  url: string;        // /admin-uploads/YYYY-MM/filename-hash.ext
  filename: string;
  size: number;       // 바이트
  width: number;      // 픽셀 (SVG는 0)
  height: number;     // 픽셀 (SVG는 0)
  mimeType: string;
}

// 에러: 400 (형식 오류), 413 (크기 초과)
```

---

### 3.7 통계 API

#### GET /api/admin/stats

```typescript
// 쿼리 파라미터
interface StatsQuery {
  period?: '1d' | '7d' | '30d' | '90d';  // 기본: 7d
}

// 응답 200
interface StatsResponse {
  sessions: {
    total: number;
    completed: number;
    completionRate: number;
    avgDuration: number;
    byDay: Array<{ date: string; count: number; completed: number }>;
  };
  screens: {
    mostVisited: Array<{ screen: string; visits: number; avgDuration: number }>;
    leastVisited: Array<{ screen: string; visits: number; avgDuration: number }>;
  };
  contentChanges: {
    last7d: number;
    recent: Array<{
      id: string;
      user: string;
      action: string;
      entity: string;
      entityName: string;
      createdAt: string;
    }>;
  };
}
```

---

### 3.8 감사 로그 API

#### GET /api/admin/audit-logs

```typescript
// 쿼리 파라미터
interface AuditLogsQuery {
  page?: number;      // 기본: 1
  limit?: number;     // 기본: 50
  userId?: string;    // 사용자 필터
  action?: string;    // create/update/delete
  entity?: string;    // 엔티티 필터
  from?: string;      // ISO 8601
  to?: string;        // ISO 8601
}

// 응답 200
interface AuditLogsResponse {
  data: Array<{
    id: string;
    userId: string | null;
    userName: string;
    action: string;
    entity: string;
    entityId: string | null;
    changes: {
      before?: Record<string, unknown>;
      after?: Record<string, unknown>;
    };
    createdAt: string;
  }>;
  pagination: Pagination;
}
```

---

### 3.9 역할 API

#### GET /api/admin/roles

```typescript
// 응답 200
type RolesResponse = Array<{
  id: string;
  name: Role;
  permissions: Permission[];
}>;
```

---

### 3.10 공통 타입

```typescript
type Role = 'superadmin' | 'admin' | 'editor' | 'viewer';

type Permission =
  | 'content:read' | 'content:write'
  | 'users:read' | 'users:write' | 'users:role'
  | 'measurements:read' | 'measurements:write'
  | 'images:upload'
  | 'settings:read' | 'settings:write'
  | 'audit:read';

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface ApiError {
  error: string;       // 에러 메시지 (한국어)
  code: string;        // AUTH_REQUIRED | RBAC_DENIED | VALIDATION_ERROR | ...
  details?: Record<string, string[]>;  // 필드별 검증 에러
}

interface ContentSection {
  id: string;
  sectionKey: string;
  title: string;
  body: string;
  imageUrl: string | null;
  order: number;
}
```

---

## 4. 인증 흐름 인터페이스

### 4.1 JWT 쿠키 기반 세션

```
┌──────────┐     POST /login      ┌──────────┐     Set-Cookie      ┌──────────┐
│  클라이언트 │ ──────────────────▶ │  API 서버  │ ──────────────────▶ │  클라이언트 │
│           │ ◀────────────────── │           │                    │           │
│           │   { user } + 쿠키   │           │                    │           │
└──────────┘                    A                    └──────────┘A           └──────────┘A
             │                                                     │             │
             │ 이후 모든 API 요청에                                │             │
             │ 쿠키 자동 첨부 (httpOnly)                          │             │
             │                                                     │             │
             ▼                                                     ▼             ▼
┌──────────┐     GET /api/admin/*  ┌──────────┐     미들웨어      ┌──────────┐
│  클라이언트 │ ──────────────────▶ │  미들웨어  │ ── 인증 ──▶     │  핸들러    │
│           │                     │           │ ── RBAC ──▶     │           │
│           │ ◀────────────────── │           │                  │           │
│           │   응답              │           │  401/403 시 차단  │           │
└──────────┘                     └──────────┘                    └──────────┘
```

### 4.2 세션 라이프사이클

| 단계 | 동작 | DB 변경 |
|------|------|---------|
| **로그인** | JWT 생성 + 쿠키 설정 | `AdminSession.create()` |
| **요청** | 쿠키에서 JWT 추출 → 검증 | `AdminSession.findUnique()` (읽기) |
| **로그아웃** | 쿠키 삭제 | `AdminSession.delete()` |
| **만료** | JWT exp 도달 → 401 | 만료 세션 정리 Cron |
| **변조** | JWT 서명 불일치 → 401 | 변경 없음 |

---

## 5. RBAC 인터페이스

### 5.1 권한 확인 흐름

```typescript
// src/lib/admin/middlewareD.ts
function withAuth(permission: Permission, handler: Handler) {
  return async (req: NextRequest) => {
    // 1. 세션 검증
    const user = await getSessionUser();  // JWT 쿠키 → DB 검증
    if (!user) return json({ error: '인증이 필요합니다' }, 401);

    // 2. 권한 확인
    requirePermission(user.role as Role, permission);
    // → 권한 없음 시 RbacDeniedError → 403

    // 3. 핸들러 실행 (userId, role 주입)
    return handler(req, { userId: user.id, role: user.role as Role });
  };
}
```

### 5.2 엔드포인트별 권한 매핑

| 엔드포인트 | 메서드 | 필요 권한 |
|-----------|--------|-----------|
| `/api/admin/auth/login` | POST | — (인증 불필요) |
| `/api/admin/auth/logout` | POST | (인증만 필요) |
| `/api/admin/auth/me` | GET | (인증만 필요) |
| `/api/admin/users` | GET | `users:read` |
| `/api/admin/users` | POST | `users:write` |
| `/api/admin/users/:id` | PUT | `users:write` (role 변경은 `users:role`) |
| `/api/admin/users/:id` | DELETE | `users:write` |
| `/api/admin/content` | GET | `content:read` |
| `/api/admin/content/:screenId` | GET | `content:read` |
| `/api/admin/content/:screenId` | PUT | `content:write` |
| `/api/admin/content/:screenId/sections/:key` | PUT | `content:write` |
| `/api/admin/measurements` | GET | `measurements:read` |
| `/api/admin/measurements` | POST | `measurements:write` |
| `/api/admin/measurements/:id` | GET | `measurements:read` |
| `/api/admin/measurements/:id` | PUT | `measurements:write` |
| `/api/admin/measurements/:id` | DELETE | `measurements:write` |
| `/api/admin/measurements/:id/equipment` | GET | `measurements:read` |
| `/api/admin/measurements/:id/equipment` | POST | `measurements:write` |
| `/api/admin/measurements/:id/equipment/:eqId` | PUT | `measurements:write` |
| `/api/admin/measurements/:id/equipment/:eqId` | DELETE | `measurements:write` |
| `/api/admin/images/upload` | POST | `images:upload` |
| `/api/admin/roles` | GET | `content:read` |
| `/api/admin/stats` | GET | `content:read` |
| `/api/admin/audit-logs` | GET | `audit:read` |

---

## 6. TanStack Query 훅 인터페이스

### 6.1 인증 훅

```typescript
// src/hooks/admin/use-auth.ts

function useCurrentUser(): UseQueryResult<CurrentUserResponse> {
  // queryKey: ['admin;, 'auth', 'me']
  // queryFn: GET /api/admin/auth/me
  // staleTime: 5분 (사용자 정보는 자주 변하지 않음)
}

function useLogin(): UseMutationResult<LoginResponse, Error, LoginRequest> {
  // mutationFn: POST /api/admin/auth/login
  // onSuccess: 쿠키 설정됨, useCurrentUser 무효화, /admin 리다이렉트
}

function useLogout(): UseMutationResult<LogoutResponse> {
  // mutationFn: POST /api/admin/auth/logout
  // onSuccess: 쿠키 삭제, queryClient.clear(), /admin/login 리다이렉트
}
```

### 6.2 콘텐츠 훅

```typescript
// src/hooks/admin/use-content.ts

function useContentList(): UseQueryResult<ContentListResponse> {
  // queryKey: ['admin', 'content']
  // queryFn: GET /api/admin/content
}

function useContentDetail(screenId: string): UseQueryResult<ContentDetailResponse> {
  // queryKey: ['admin', 'content', screenId]
  // queryFn: GET /api/admin/content/:screenId
}

function useUpdateContent(screenId: string): UseMutationResult {
  // mutationFn: PUT /api/admin/content/:screenId
  // onSuccess: ['admin', 'content'] 무효화, 성공 토스트
}

function useUpdateSection(screenId: string, key: string): UseMutationResult {
  // mutationFn: PUT /api/admin/content/:screenId/sections/:key
  // onSuccess: ['admin', 'content', screenId] 무효화
}
```

### 6.3 측정 항목 훅

```typescript
// src/hooks/admin/use-measurements.ts

function useMeasurementList(): UseQueryResult>Result<MeasurementListResponse> {
  // queryKey: ['admin', 'measurements']
  // queryFn: GET /api/admin/measurements
}

function useMeasurementDetail(id: string): UseQueryResult<MeasurementDetailResponse> {
  // queryKey: ['admin', 'measurements', id]
  // queryFn: GET /api/admin/measurements/:id
}

function useCreateMeasurement(): UseMutationResult {
  // mutationFn: POST /api/admin/measurements
  // onSuccess: ['admin', 'measurements'] 무효화
}

function useUpdateMeasurement(id: string): UseMutationResult {
  // mutationFn: PUT /api/admin/measurements/:id
}

function useDeleteMeasurement(): UseMutationResult {
  // mutationFn: DELETE /api/admin/measurements/:id
}
```

### 6.4 장비 훅

```typescript
// src/hooks/admin/use-equipment.ts

function useEquipmentList(measurementId: string): UseQueryResult<EquipmentListResponse> {
  // queryKey: ['admin', 'measurements', measurementId, 'equipment']
  // queryFn: GET /api/admin/measurements/:id/equipment
}

function useCreateEquipment(measurementId: string): UseMutationResult {
  // mutationFn: POST /api/admin/measurements/:id/equipment
}

function useUpdateEquipment(measurementId: string, eqId: string): UseMutationResult {
  // mutationFn: PUT /api/admin/measurements/:id/equipment/:eqId
}

function useDeleteEquipment(measurementId: string): UseMutationResult {
  // mutationFn: DELETE /api/admin/measurements/:id/equipment/:eqId
}
```

### 6.5 사용자 훅

```typescript
// src/hooks/admin/use-users.ts

function useUserList(query: UsersQuery): UseQueryResult<UsersResponse> {
  // queryKey: ['admin', 'users', query]
  // queryFn: GET /api/admin/users?page=&limit=&role=&search=
}

function useCreateUser(): UseMutationResult {
  // mutationFn: POST /api/admin/users
  // onSuccess: ['admin', 'users'] 무효화
}

function useUpdateUser(id: string): UseMutationResult {
  // mutationFn: PUT /api/admin/users/:id
}

function useDeleteUser(): UseMutationResult {
  // mutationFn: DELETE /api/admin/users/:id (비활성화)
}
```

### 6.6 통계 훅

```typescript
// src/hooks/admin/use-stats.ts

function useDashboardStats(period?: string): UseQueryResult<StatsResponse> {
  // queryKey: ['admin', 'stats', period]
  // queryFn: GET /api/admin/stats?period=
  // staleTime: 1분 (통계는 자주 변하지 않음)
}
```

### 6.7 감사 로그 훅

```typescript
// src/hooks/admin/use-audit-logs.ts

function useAuditLogs(query: AuditLogsQuery): UseQueryResult<AuditLogsResponse> {
  // queryKey: ['admin', 'audit-logsD', query]
  // queryFn: GET /api/admin/audit-logs?page=&limit=&action=&entity=&from=&to=
}
```

---

## 부록: 인터페이스 요약 다이어그램

```
┌─────────────────────────────────────────────────────────────────────┐
│                     관리자 대시보드 인터페이스                        │
├──────────────┬──────────────┬──────────────┬────────────────────────┤
│ 페이지 (10)  │ API (20+)   │ TanStack     │ 인증/RBAC              │
├──────────────┼──────────────┼──────────────┼────────────────────────┤
│ Login        │ auth/login   │ useLogin     │ JWT httpOnly 쿠키      │
│ Dashboard    │ auth/logout  │ useLogout    │ 세션 DB 이중 검증      │
│ Content      │ auth/me      │ useCurrentUser│ RBAC 미들웨어          │
│ ContentDetail│ content/*    │ useContent*  │ withAuth(permission)   │
│ Measurements │ measurements │ useMeasurement*│ Role (4단계)          │
│ MeasDetail   │ measurements │ useEquipment*│ Permission (11개)      │
│ Users        │ users/*      │ useUser*     │ 계정 잠금 (5회/15분)   │
│ Images       │ images/upload│ —            │ 감사 로그 (append-only)│
│ AuditLogs    │ audit-logs   │ useAuditLogs │                        │
│ Settings     │ stats/roles  │ useStats     │                        │
└──────────────┴──────────────┴──────────────┴────────────────────────┘
```
