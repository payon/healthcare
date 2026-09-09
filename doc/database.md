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
| **총 모델 수** | 9개 |
| **관리 방식** | `prisma db push` (마이그레이션 미사용) |

---

## 2. ER 다이어그램

```
┌─────────────────┐       ┌──────────────────────┐
│   AdminUser     │       │    AdminSession      │
│─────────────────│       │──────────────────────│
│ id (PK)         │◀──────│ userId (FK)          │
│ email (UQ)      │       │ token (UQ)           │
│ passwordHash    │       │ expiresAt            │
│ name            │       └──────────────────────┘
│ role            │
│ isActive        │       ┌──────────────────────┐
│ failedAttempts  │       │     AuditLog         │
│ lockedUntil     │◀──────│ userId (FK)          │
│ lastLoginAt     │       │ action               │
└─────────────────┘       │ entity               │
       │                   │ entityId             │
       │                   │ changes (JSON)       │
       │                   └──────────────────────┘
       │
┌─────────────────┐       ┌──────────────────────┐
│  KioskContent   │       │   ContentSection     │
│─────────────────│       │──────────────────────│
│ id (PK)         │◀──────│ contentId (FK)       │
│ section (UQ)    │       │ sectionKey           │
│ title           │       │ title                │
│ body            │       │ body                 │
│ imageUrl        │       │ imageUrl             │
│ qrCodeUrl       │       │ order                │
└─────────────────┘       └──────────────────────┘
       │                   (UQ: contentId + sectionKey)
       │
┌─────────────────┐       ┌──────────────────────┐
│ MeasurementItem │       │ MeasurementEquipment │
│─────────────────│       │──────────────────────│
│ id (PK)         │◀──────│ measurementId (FK)   │
│ key (UQ)        │       │ name                 │
│ name            │       │ description           │
│ description     │       │ preparationSteps(JSON)│
│ icon            │       │ precautions (JSON)    │
│ color           │       │ imageUrl             │
│ order           │       │ order                │
│ imageUrl        │       └──────────────────────┘
│ estimatedTime   │
│ isActive        │
└─────────────────┘

┌─────────────────┐       ┌──────────────────────┐
│    KioskLog     │       │   KioskSession      │
│─────────────────│       │──────────────────────│
│ id (PK)         │       │ id (PK)              │
│ sessionId       │       │ startedAt            │
│ eventType       │       │ endedAt              │
│ screen          │       └──────────────────────┘
│ detail          │
└─────────────────┘
```

---

## 3. 모델 상세

### 3.1 AdminUser — 관리자 계정

| 필드 | 타입 | 제약 | 설명 |
|------|------|------|------|
| `id` | String | PK, CUID | 고유 식별자 |
| `email` | String | UNIQUE, NOT NULL | 로그인 이메일 |
| `passwordHash` | String | NOT NULL | bcrypt 해시 (cost=12) |
| `name` | String | NOT NULL | 표시 이름 |
| `role` | String | DEFAULT 'editor' | 역할: superadmin/admin/editor/viewer |
| `isActive` | Boolean | DEFAULT true | 계정 활성 여부 |
| `failedAttempts` | Int | DEFAULT 0 | 연속 로그인 실패 횟수 |
| `lockedUntil` | DateTime | nullable | 계정 잠금 만료 시간 |
| `lastLoginAt` | DateTime | nullable | 마지막 로그인 시간 |
| `createdAt` | DateTime | auto | 생성 시간 |
| `updatedAt` | DateTime | auto | 수정 시간 |

**관계**: sessions(1:N AdminSession), auditLogs(1:N AuditLog)

### 3.2 AdminSession — 관리자 세션

| 필드 | 타입 | 제약 | 설명 |
|------|------|------|------|
| `id` | String | PK, CUID | 고유 식별자 |
| `userId` | String | FK → AdminUser.id | 세션 소유자 |
| `token` | String | UNIQUE, NOT NULL | JWT 토큰 |
| `expiresAt` | DateTime | NOT NULL | 세션 만료 시간 (8시간) |
| `createdAt` | DateTime | auto | 생성 시간 |

**삭제 정책**: AdminUser 삭제 시 Cascade

### 3.3 KioskContent — 키오스크 화면 콘텐츠

| 필드 | 타입 | 제약 | 설명 |
|------|------|------|------|
| `id` | String | PK, CUID | 고유 식별자 |
| `section` | String | UNIQUE, NOT NULL | 화면 식별자 (예: 'equipment-intro') |
| `title` | String | NOT NULL | 화면 제목 |
| `body` | String | NOT NULL | 화면 본문 |
| `imageUrl` | String | nullable | 대표 이미지 URL |
| `qrCodeUrl` | String | nullable | QR 코드 이미지 URL |
| `updatedAt` | DateTime | auto | 수정 시간 |
| `createdAt` | DateTime | auto | 생성 시간 |

**관계**: sections(1:N ContentSection)

**13개 화면 section 값**:
standby, main, equipment-intro, location, app-install, signup, vein-register, login, non-member, measurement-mode, measurement-equipment, results, completion

### 3.4 ContentSection — 화면 내 섹션

| 필드 | 타입 | 제약 | 설명 |
|------|------|------|------|
| `id` | String | PK, CUID | 고유 식별자 |
| `contentId` | String | FK → KioskContent.id | 부모 콘텐츠 |
| `sectionKey` | String | NOT NULL | 섹션 키 (예: 'overview', 'step-1') |
| `title` | String | NOT NULL | 섹션 제목 |
| `body` | String | DEFAULT '' | 섹션 본문 |
| `imageUrl` | String | nullable | 섹션 이미지 |
| `order` | Int | DEFAULT 0 | 정렬 순서 |
| `createdAt` | DateTime | auto | 생성 시간 |
| `updatedAt` | DateTime | auto | 수정 시간 |

**복합 유니크**: (contentId, sectionKey)

**삭제 정책**: KioskContent 삭제 시 Cascade

### 3.5 MeasurementItem — 측정 항목

| 필드 | 타입 | 제약 | 설명 |
|------|------|------|------|
| `id` | String | PK, CUID | 고유 식별자 |
| `key` | String | UNIQUE, NOT NULL | 항목 식별자 (예: 'height', 'blood-pressure') |
| `name` | String | NOT NULL | 표시 이름 (예: '신장', '혈압') |
| `description` | String | DEFAULT '' | 설명 |
| `icon` | String | DEFAULT '' | Lucide 아이콘명 |
| `color` | String | DEFAULT '#3B82F6' | HEX 테마 색상 |
| `order` | Int | DEFAULT 0 | 정렬 순서 |
| `imageUrl` | String | nullable | 항목 이미지 URL |
| `estimatedTime` | Int | DEFAULT 5 | 예상 소요 시간 (분) |
| `isActive` | Boolean | DEFAULT true | 활성 여부 |
| `createdAt` | DateTime | auto | 생성 시간 |
| `updatedAt` | DateTime | auto | 수정 시간 |

**관계**: equipment(1:N MeasurementEquipment)

**6개 기본 측정 항목**:

| key | name | color | order | estimatedTime(분) |
|-----|------|-------|-------|-------------------|
| height | 신장 | #38BDF8 | 1 | 1 |
| stress | 스트레스 | #FB7185 | 2 | 2 |
| blood-pressure | 혈압 | #FBBF24 | 3 | 2 |
| grip-strength | 악력 | #A78BFA | 4 | 1 |
| body-composition | 체성분 | #34D399 | 5 | 2 |
| skin | 피부 | #F472B6 | 6 | 1 |

**총 예상 소요 시간**: 약 9분 (1+2+2+1+2+1), 실제 5~8분 가이드

### 3.6 MeasurementEquipment — 측정 장비

| 필드 | 타입 | 제약 | 설명 |
|------|------|------|------|
| `id` | String | PK, CUID | 고유 식별자 |
| `measurementId` | String | FK → MeasurementItem.id | 부모 측정 항목 |
| `name` | String | NOT NULL | 장비명 |
| `description` | String | DEFAULT '' | 장비 설명 |
| `preparationSteps` | String | DEFAULT '[]' | 준비 단계 (JSON 배열) |
| `precautions` | String | DEFAULT '[]' | 주의사항 (JSON 배열) |
| `imageUrl` | String | nullable | 장비 이미지 URL |
| `order` | Int | DEFAULT 0 | 정렬 순서 |
| `createdAt` | DateTime | auto | 생성 시간 |
| `updatedAt` | DateTime | auto | 수정 시간 |

**JSON 필드 형식**:

```json
// preparationSteps
["소매를 걷어 올립니다", "팔을 커프에 넣습니다", "시작 버튼을 누릅니다"]

// precautions
[
  {"level": "warning", "text": "측정 전 5분간 안정을 취하세요"},
  {"level": "info", "text": "커프는 심장 높이에 맞추세요"}
]
```

**삭제 정책**: MeasurementItem 삭제 시 Cascade

### 3.7 AuditLog — 감사 로그

| 필드 | 타입 | 제약 | 설명 |
|------|------|------|------|
| `id` | String | PK, CUID | 고유 식별자 |
| `userId` | String | FK → AdminUser.id (nullable) | 작업자 |
| `action` | String | NOT NULL | 액션: create/update/delete |
| `entity` | String | NOT NULL | 엔티티명 (예: 'KioskContent') |
| `entityId` | String | nullable | 엔티티 ID |
| `changes` | String | DEFAULT '{}' | 변경 내용 (JSON) |
| `createdAt` | DateTime | auto | 생성 시간 |

**특성**: append-only (삭제 불가)

**changes JSON 형식**:
```json
{
  "before": {"title": "기존 제목", "body": "기존 본문"},
  "after": {"title": "수정된 제목", "body": "수정된 본문"}
}
```

### 3.8 KioskLog — 키오스크 이벤트 로그 (기존)

| 필드 | 타입 | 제약 | 설명 |
|------|------|------|------|
| `id` | String | PK, CUID | 고유 식별자 |
| `sessionId` | String | nullable | 세션 식별자 |
| `eventType` | String | NOT NULL | 이벤트 유형 |
| `screen` | String | nullable | 화면 식별자 |
| `detail` | String | nullable | 부가 정보 |
| `createdAt` | DateTime | auto | 생성 시간 |

### 3.9 KioskSession — 키오스크 세션 (기존)

| 필드 | 타입 | 제약 | 설명 |
|------|------|------|------|
| `id` | String | PK, CUID | 고유 식별자 |
| `startedAt` | DateTime | auto | 세션 시작 시간 |
| `endedAt` | DateTime | nullable | 세션 종료 시간 |

---

## 4. 인덱스 전략

SQLite의 기본 인덱스 외에 다음이 자동 생성됩니다:

| 모델 | 필드 | 인덱스 유형 | 용도 |
|------|------|-------------|------|
| AdminUser | email | UNIQUE | 로그인 조회 |
| AdminSession | token | UNIQUE | 세션 검증 |
| KioskContent | section | UNIQUE | 화면별 콘텐츠 조회 |
| ContentSection | (contentId, sectionKey) | UNIQUE | 섹션 중복 방지 |
| MeasurementItem | key | UNIQUE | 측정 항목 식별 |

---

## 5. 데이터 흐름

### 5.1 관리자 변경 → 키오스크 반영

```
관리자 대시보드                API                    SQLite              키오스크
     │                         │                       │                    │
     │  콘텐츠 수정             │                       │                    │
     │────────────────────────▶│                       │                    │
     │                         │  db.kioskContent      │                    │
     │                         │    .update()          │                    │
     │                         │──────────────────────▶│                    │
     │                         │                       │                    │
     │                         │  db.auditLog.create() │                    │
     │                         │──────────────────────▶│                    │
     │                         │                       │                    │
     │  200 OK                 │                       │                    │
     │◀────────────────────────│                       │                    │
     │                         │                       │                    │
     │                         │                       │  5초 폴링          │
     │                         │                       │  GET /api/content  │
     │                         │◀──────────────────────────────────────────│
     │                         │  최신 데이터           │                    │
     │                         │──────────────────────────────────────────▶│
     │                         │                       │                    │
     │                         │                       │  화면 리렌더       │
```

### 5.2 실시간 동기화 메커니즘

| 방식 | 주체 | 간격 | 설명 |
|------|------|------|------|
| TanStack Query refetchInterval | 키오스크 클라이언트 | 5초 | 정기적 콘텐츠 재검증 |
| refetchOnWindowFocus | 키오스크 클라이언트 | - | 창 포커스 시 재검증 |
| 캐시 무효화 | 관리자 대시보드 | 즉시 | 수정 후 관련 쿼리 무효화 |

---

## 6. 초기 시드 데이터

### 6.1 관리자 계정

| 이메일 | 역할 | 이름 | 비밀번호 |
|--------|------|------|----------|
| admin@biogram.co.kr | superadmin | 최관리 | Admin@1234 |
| operator@biogram.co.kr | admin | 이운영 | Demo@1234 |
| editor@biogram.co.kr | editor | 박수정 | Demo@1234 |
| viewer@biogram.co.kr | viewer | 김조회 | Demo@1234 |

### 6.2 측정 항목 (6개)

1. 신장 (height) — 초음파 신장계
2. 스트레스 (stress) — 스트레스 측정기
3. 혈압 (blood-pressure) — 자동혈압계
4. 악력 (grip-strength) — 디지털 악력계
5. 체성분 (body-composition) — 체성분 분석기
6. 피부 (skin) — 피부 분석기

### 6.3 키오스크 화면 콘텐츠 (13개)

standby, main, equipment-intro, location, app-install, signup, vein-register, login, non-member, measurement-mode, measurement-equipment, results, completion

---

## 7. 백업 및 복원

### 백업

```bash
# SQLite 파일 복사
cp db/custom.db db/backup/custom-$(date +%Y%m%d).db
```

### 복원

```bash
# 백업 파일로 복원
cp db/backup/custom-20260306.db db/custom.db
```

---

## 8. 용량 추정

| 모델 | 예상 레코드 수 | 레코드당 크기 | 총 크기 추정 |
|------|----------------|---------------|-------------|
| AdminUser | ~10 | ~500B | ~5KB |
| AdminSession | ~50 | ~300B | ~15KB |
| KioskContent | ~13 | ~2KB | ~26KB |
| ContentSection | ~50 | ~1KB | ~50KB |
| MeasurementItem | ~6 | ~200B | ~1.2KB |
| MeasurementEquipment | ~6 | ~1KB | ~6KB |
| AuditLog | ~1,000/월 | ~500B | ~500KB/월 |
| KioskLog | ~10,000/월 | ~200B | ~2MB/월 |
| KioskSession | ~5,000/월 | ~100B | ~500KB/월 |

**예상 DB 크기**: ~3MB/월 (로그 정리 시 ~500KB 유지 가능)
