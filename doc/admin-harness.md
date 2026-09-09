# Biogram MINI 관리자 대시보드 — 테스트 하네스 문서

> 버전: 1.0.0  
> 최종 수정: 2026-03-06  
> 작성자: Biogram MINI 개발팀

---

## 1. 테스트 전략 개요

본 관리자 대시보드는 다음 3가지 축으로 테스트를 수행합니다.

| 축 | 도구/방식 | 목적 |
|----|-----------|------|
| **E2E 브라우저 테스트** | `agent-browser` (headed 모드) | 관리자 화면 렌더링·상호작용·RBAC 강제 검증 |
| **정적 분석** | ESLint (`bun run lint`) | 코드 품질, Next.js 규칙 준수 확인 |
| **빌드 타임 타입 체크** | TypeScript 컴파일러 | 타입 안정성, 런타임 에러 사전 방지 |

> **참고**: 단위 테스트 프레임워크(Jest, Vitest 등)는 본 프로젝트에서 사용하지 않습니다. 관리자 대시보드의 특성상 브라우저 렌더링, RBAC 권한 강제, 사용자 상호작용에 중점을 둡니다.

---

## 2. E2E 테스트 (agent-browser)

### 2.1 테스트 환경

| 항목 | 값 |
|------|-----|
| 프레임워크 | Next.js 16 (App Router) |
| 개발 서버 | `http://localhost:3000` (bun run dev) |
| 프록시 | Caddy (`http://localhost:81`) |
| 브라우저 | Chromium (Playwright 기반) |
| 실행 모드 | `--headed` (화면 표시 모드) |
| 테스트 도구 | `agent-browser` CLI |
| 관리자 베이스 경로 | `/admin` |

### 2.2 테스트 케이스

---

#### TC-A01: 로그인 페이지 렌더링

**목적**: 관리자 로그인 페이지가 올바르게 렌더링되는지 확인

**단계**:
1. `agent-browser open http://localhost:3000/admin/login`
2. `snapshot -i` (접근성 스냅샷 캡처)

**기대 결과**:
- ✅ "Biogram MINI" 브랜딩 텍스트가 표시됨
- ✅ 이메일 입력 필드가 표시됨
- ✅ 비밀번호 입력 필드가 표시됨
- ✅ "로그인" 버튼이 표시됨
- ✅ 입력 필드에 적절한 `placeholder` 또는 `label` 존재
- ✅ 비밀번호 필드가 `type="password"` 속성 보유

---

#### TC-A02: 유효한 자격 증명으로 로그인

**목적**: 올바른 이메일/비밀번호로 로그인 시 대시보드로 이동하는지 확인

**단계**:
1. `agent-browser open http://localhost:3000/admin/login`
2. 이메일 필드에 `admin@biogram.co.kr` 입력
3. 비밀번호 필드에 `Admin@1234` 입력
4. `click "로그인"`
5. `snapshot -i`

**기대 결과**:
- ✅ 로그인 API `POST /api/admin/auth/login` 200 응답
- ✅ `admin_session` httpOnly 쿠키가 설정됨
- ✅ `/admin` 대시보드 페이지로 리다이렉트
- ✅ AdminHeader에 사용자 이름 표시
- ✅ AdminHeader에 역할 뱃지 표시

---

#### TC-A03: 무효한 자격 증명으로 로그인 (계정 잠금)

**목적**: 잘못된 비밀번호 5회 연속 입력 시 계정 잠금 메커니즘이 동작하는지 확인

**단계**:
1. `agent-browser open http://localhost:3000/admin/login`
2. 이메일 필드에 `editor@biogram.co.kr` 입력
3. 비밀번호 필드에 `WrongPass1` 입력 — `click "로그인"` (1회)
4. 동일하게 2회~5회 반복
5. 5회 실패 후 `snapshot -i`
6. 올바른 비밀번호 `Demo@1234` 입력 — `click "로그인"`
7. `snapshot -i`

**기대 결과**:
- ✅ 1~4회 실패: 401 응답, "이메일 또는 비밀번호가 올바르지 않습니다" 에러 메시지
- ✅ 5회 실패: 423 응답, "계정이 잠겼습니다. 15분 후 다시 시도하세요" 메시지
- ✅ 잠금 상태에서 올바른 비밀번호 입력 시에도 로그인 불가 (423)
- ✅ DB `AdminUser.failedAttempts` = 5, `lockedUntil` = 현재 + 15분

---

#### TC-A04: 로그인 후 대시보드 페이지

**목적**: 로그인 후 대시보드 페이지가 올바르게 렌더링되는지 확인

**단계**:
1. 로그인 성공 후 `/admin` 페이지
2. `snapshot -i`

**기대 결과**:
- ✅ 4개 통계 카드 표시: 세션 수, 완료율, 평균 체류 시간, 콘텐츠 변경 수
- ✅ 최근 변경 이력 테이블 표시
- ✅ 화면 방문 차트/목록 표시
- ✅ AdminSidebar에 7개 네비게이션 항목 표시 (역할에 따라 필터링됨)
- ✅ AdminHeader에 사용자 정보 표시

---

#### TC-A05: 콘텐츠 관리 — 목록, 편집, 저장

**목적**: 콘텐츠 관리 페이지의 목록 → 편집 → 저장 흐름이 정상 동작하는지 확인

**단계**:
1. `click "콘텐츠 관리"` (사이드바) → `/admin/content`
2. `snapshot -i` — 13개 화면 카드 목록 확인
3. `click "장비 소개"` → `/admin/content/equipment-intro`
4. `snapshot -i` — 편집 폼 확인
5. 제목 필드 값을 "장비 소개 (테스트 수정)"으로 변경
6. `click "저장"`
7. `snapshot -i`

**기대 결과**:
- ✅ 콘텐츠 목록: 13개 화면 카드가 section 라벨과 함께 표시
- ✅ 편집 폼: 제목, 본문, 이미지 URL, QR 코드 URL 필드 표시
- ✅ 저장 성공: "콘텐츠가 저장되었습니다" 토스트 메시지
- ✅ 감사 로그에 update 액션 자동 기록
- ✅ TanStack Query 캐시 무효화로 즉시 반영

---

#### TC-A06: 측정 항목 관리 — 목록, 편집, 장비 CRUD

**목적**: 측정 항목 관리 페이지의 CRUD와 장비 관리가 정상 동작하는지 확인

**단계**:
1. `click "측정 항목"` → `/admin/measurements`
2. `snapshot -i` — 6개 측정 항목 카드 그리드 확인
3. `click "혈압"` → `/admin/measurements/:id`
4. `snapshot -i` — 편집 폼 + 장비 목록 확인
5. 장비 "자동혈압계" 편집 — 준비 단계 수정
6. `click "저장"`
7. `snapshot -i`

**기대 결과**:
- ✅ 측정 항목 목록: 6개 카드가 색상 스와치와 함께 표시
- ✅ 장비 수 뱃지 표시
- ✅ 편집 폼: 이름, 설명, 아이콘, 색상, 순서, 예상 소요 시간, 활성 여부
- ✅ 장비 CRUD: 장비 추가/수정/삭제 정상 동작
- ✅ 준비 단계 편집기: 단계 추가/삭제/순서 변경
- ✅ 주의사항 편집기: 경고(info/warning) 수준 설정

---

#### TC-A07: 사용자 관리 — 목록, 생성, 편집, 삭제, 역할 필터

**목적**: 사용자 관리 페이지의 CRUD와 역할 필터가 정상 동작하는지 확인

**단계**:
1. `click "사용자 관리"` → `/admin/users`
2. `snapshot -i` — 사용자 데이터 테이블 확인
3. 역할 필터 드롭다운에서 "editor" 선택
4. `snapshot -i`
5. `click "사용자 추가"` — 생성 다이얼로그 열기
6. 폼 입력: 이메일, 이름, 역할, 비밀번호
7. `click "생성"`
8. `snapshot -i`

**기대 결과**:
- ✅ 사용자 테이블: 이메일, 이름, 역할 뱃지, 마지막 로그인, 활성 상태 표시
- ✅ 역할 필터: 선택 시 해당 역할만 필터링
- ✅ 검색: 이름/이메일로 검색 가능
- ✅ 생성 다이얼로그: Zod 검증 동작 (이메일 형식, 비밀번호 복잡도)
- ✅ 편집 다이얼로그: 이름, 역할, 활성 상태 수정
- ✅ 삭제: 비활성화 확인 다이얼로그 → 비활성화 처리 (물리 삭제 아님)

---

#### TC-A08: 이미지 관리 — 업로드, 갤러리

**목적**: 이미지 업로드와 갤러리 관리가 정상 동작하는지 확인

**단계**:
1. `click "이미지 관리"` → `/admin/images`
2. `snapshot -i` — 업로드 영역 + 갤러리 그리드 확인
3. 드래그앤드롭 영역에 테스트 이미지 파일 드롭
4. `snapshot -i` — 업로드 진행 상태 → 완료
5. 갤러리에서 업로드된 이미지 확인

**기대 결과**:
- ✅ 드래그앤드롭 영역: "이미지를 드래그하여 업로드" 안내 표시
- ✅ 업로드 성공: 새 이미지가 갤러리에 표시
- ✅ 업로드 실패 (5MB 초과): "파일 크기가 5MB를 초과합니다" 에러
- ✅ 업로드 실패 (미지원 형식): "지원하지 않는 파일 형식입니다" 에러
- ✅ 갤러리: 이미지 썸네일, 파일명, 크기, 업로드 날짜 표시
- ✅ Sharp 처리: EXIF 회전, 최대 1920×1080 리사이징, 메타데이터 제거

---

#### TC-A09: 감사 로그 — 목록, 필터, 확장

**목적**: 감사 로그 페이지의 조회, 필터, 행 확장이 정상 동작하는지 확인

**단계**:
1. `click "감사 로그"` → `/admin/audit-logs`
2. `snapshot -i` — 감사 로그 테이블 확인
3. 액션 필터에서 "update" 선택
4. `snapshot -i` — 필터링 결과 확인
5. 첫 번째 행 확장 버튼 클릭
6. `snapshot -i` — 변경 전/후 상세 표시

**기대 결과**:
- ✅ 감사 로그 테이블: 사용자, 액션, 엔티티, 엔티티 ID, 날짜 표시
- ✅ 필터: 액션(create/update/delete), 엔티티, 날짜 범위
- ✅ 페이지네이션: 50건/page, 페이지 이동
- ✅ 행 확장: 변경 전/후 JSON 차이 표시
- ✅ append-only: 삭제 버튼 없음

---

#### TC-A10: 설정 페이지

**목적**: 설정 페이지가 올바르게 렌더링되고 기능하는지 확인

**단계**:
1. `click "설정"` → `/admin/settings`
2. `snapshot -i`

**기대 결과**:
- ✅ 시스템 정보 섹션: 버전, DB 크기, 마지막 백업
- ✅ 보안 설정 섹션: 세션 만료 시간, 잠금 임계값, 잠금 기간
- ✅ 키오스크 설정 섹션: 유휴 타임아웃, 폴링 간격
- ✅ 역할 권한 매트릭스: 4역할 × 11권한 표시
- ✅ superadmin 전용: 설정 수정 가능
- ✅ 비-superadmin: 설정 읽기 전용

---

#### TC-A11: RBAC 권한 강제

**목적**: 역할별 권한 제한이 UI와 API 양쪽에서 강제되는지 확인

**단계**:
1. **viewer 계정**으로 로그인 (`viewer@biogram.co.kr` / `Demo@1234`)
2. `snapshot -i` — 사이드바 확인
3. 콘텐츠 편집 페이지에서 저장 버튼 클릭 시도
4. 사용자 관리 페이지 접근 시도
5. **editor 계정**으로 재로그인 (`editor@biogram.co.kr` / `Demo@1234`)
6. 사용자 관리 페이지 접근 시도
7. `snapshot -i`

**기대 결과**:
- ✅ **viewer**: 사이드바에 "사용자 관리", "설정" 메뉴 미표시
- ✅ **viewer**: 편집 폼의 저장 버튼 비활성화 또는 미표시
- ✅ **viewer**: 쓰기 API 호출 시 403 (RBAC_DENIED) 응답
- ✅ **editor**: "사용자 관리" 메뉴 미표시
- ✅ **editor**: 사용자 API 호출 시 403 (RBAC_DENIED) 응답
- ✅ **editor**: 콘텐츠 편집/저장은 정상 동작

---

#### TC-A12: 로그아웃 및 세션 관리

**목적**: 로그아웃 시 세션이 올바르게 무효화되는지 확인

**단계**:
1. 로그인 상태에서 `click "로그아웃"` (AdminHeader)
2. `snapshot -i` — 로그인 페이지로 이동
3. 브라우저에서 `/admin` 직접 접근 시도
4. `snapshot -i`

**기대 결과**:
- ✅ 로그아웃 API `POST /api/admin/auth/logout` 200 응답
- ✅ `admin_session` 쿠키 삭제
- ✅ DB에서 AdminSession 레코드 삭제
- ✅ 로그인 페이지로 리다이렉트
- ✅ 이전 세션 토큰으로 API 호출 시 401 응답
- ✅ 세션 만료(8시간) 후 자동 로그인 페이지 리다이렉트

---

#### TC-A13: 모바일 반응형 관리자 레이아웃

**목적**: 모바일 해상도에서 관리자 레이아웃이 반응형으로 동작하는지 확인

**단계**:
1. 뷰포트 크기 변경 — `390 x 844` (iPhone 14 기준)
2. `agent-browser open http://localhost:3000/admin/login --viewport 390x844`
3. 로그인 → 대시보드 → `snapshot -i`
4. 햄버거 메뉴 버튼 클릭
5. `snapshot -i` — Sheet 드로어 사이드바 확인
6. 콘텐츠 관리 페이지 이동 → `snapshot -i`

**기대 결과**:
- ✅ 로그인 페이지: 중앙 정렬 카드 레이아웃 유지
- ✅ AdminSidebar: 고정 사이드바 대신 햄버거 메뉴로 전환
- ✅ Sheet 드로어: 사이드바 항목 표시, 외부 클릭 시 닫힘
- ✅ 데이터 테이블: 모바일 카드 뷰 또는 수평 스크롤
- ✅ 폼 다이얼로그: 전체 화면 또는 하단 시트
- ✅ 터치 타겟 최소 44px

---

### 2.3 실행 방법

`agent-browser` CLI를 사용한 단계별 E2E 테스트 실행 흐름입니다.

```bash
# 1. 브라우저 열기 (관리자 로그인 페이지)
agent-browser open http://localhost:3000/admin/login

# 2. 접근성 스냅샷 캡처
agent-browser snapshot -i

# 3. 폼 입력
agent-browser click "이메일"
agent-browser type "admin@biogram.co.kr"
agent-browser click "비밀번호"
agent-browser type "Admin@1234"
agent-browser click "로그인"

# 4. 페이지 이동 확인
agent-browser snapshot -i

# 5. JavaScript 평가 (세션 쿠키 확인)
agent-browser eval "document.cookie.includes('admin_session')"

# 6. 에러 확인
agent-browser errors
```

#### 전체 시나리오 스크립트

```bash
#!/bin/bash
# TC-A01 ~ TC-A13 순차 실행 예시

echo "=== TC-A01: 로그인 페이지 렌더링 ==="
agent-browser open http://localhost:3000/admin/login
agent-browser snapshot -i

echo "=== TC-A02: 유효한 자격 증명으로 로그인 ==="
agent-browser click "이메일"
agent-browser type "admin@biogram.co.kr"
agent-browser click "비밀번호"
agent-browser type "Admin@1234"
agent-browser click "로그인"
agent-browser snapshot -i

echo "=== TC-A04: 대시보드 페이지 ==="
agent-browser snapshot -i

echo "=== TC-A05: 콘텐츠 관리 ==="
agent-browser click "콘텐츠 관리"
agent-browser snapshot -i

echo "=== TC-A12: 로그아웃 ==="
agent-browser click "로그아웃"
agent-browser snapshot -i

echo "=== TC-A13: 모바일 뷰 ==="
agent-browser open http://localhost:3000/admin/login --viewport 390x844
agent-browser snapshot -i
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

TypeScript 컴파일러를 통한 타입 안정성 검증입니다.

```bash
# 타입 체크만 수행 (빌드 없이)
npx tsc --noEmit
```

**검사 항목**:
- TanStack Query 훅 타입 안정성 (`useContentList`, `useUpdateContent` 등)
- Prisma Client 생성 타입 (`AdminUser`, `AdminSession`, `AuditLog`)
- API Route 핸들러 타입 (`NextRequest`, `NextResponse`)
- React Hook Form + Zod 리졸버 타입
- RBAC `Role`, `Permission` 유니언 타입

---

## 4. API 테스트

`curl`을 사용한 관리자 API 엔드포인트 수동 테스트 방법입니다.

### 4.1 POST /api/admin/auth/login — 관리자 로그인

```bash
curl -X POST http://localhost:3000/api/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@biogram.co.kr",
    "password": "Admin@1234"
  }' \
  -c cookies.txt -v
```

**기대 응답**:
```json
{
  "user": {
    "id": "clx...",
    "email": "admin@biogram.co.kr",
    "name": "최관리",
    "role": "superadmin",
    "lastLoginAt": "2026-03-06T10:00:00.000Z"
  }
}
```

**Set-Cookie:** `admin_session=<JWT>; HttpOnly; Secure; SameSite=Strict; Path=/api/admin; Max-Age=28800`

#### 로그인 에러 케이스

```bash
# 잘못된 비밀번호 (401)
curl -X POST http://localhost:3000/api/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@biogram.co.kr","password":"wrong"}'
# → { "error": "이메일 또는 비밀번호가 올바르지 않습니다", "code": "AUTH_INVALID" }

# 계정 잠금 (423)
curl -X POST http://localhost:3000/api/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"locked@biogram.co.kr","password":"any"}'
# → { "error": "계정이 잠겼습니다", "code": "ACCOUNT_LOCKED" }

# 검증 에러 (400)
curl -X POST http://localhost:3000/api/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"not-an-email","password":"short"}'
# → { "error": "검증 에러", "code": "VALIDATION_ERROR", "details": {...} }
```

### 4.2 GET /api/admin/auth/me — 현재 사용자 정보

```bash
curl http://localhost:3000/api/admin/auth/me \
  -b cookies.txt
```

**기대 응답**:
```json
{
  "id": "clx...",
  "email": "admin@biogram.co.kr",
  "name": "최관리",
  "role": "superadmin",
  "isActive": true,
  "lastLoginAt": "2026-03-06T10:00:00.000Z"
}
```

### 4.3 POST /api/admin/auth/logout — 로그아웃

```bash
curl -X POST http://localhost:3000/api/admin/auth/logout \
  -b cookies.txt
```

**기대 응답**:
```json
{ "success": true }
```

### 4.4 GET /api/admin/content — 콘텐츠 목록

```bash
curl http://localhost:3000/api/admin/content \
  -b cookies.txt
```

**기대 응답**: 13개 화면 콘텐츠 배열 (sections 포함)

### 4.5 PUT /api/admin/content/:screenId — 콘텐츠 수정

```bash
curl -X PUT http://localhost:3000/api/admin/content/equipment-intro \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "title": "장비 소개 (수정)",
    "body": "업데이트된 본문 내용"
  }'
```

**기대 응답**: 수정된 콘텐츠 객체 + 감사 로그 자동 기록

### 4.6 GET /api/admin/users — 사용자 목록

```bash
curl "http://localhost:3000/api/admin/users?page=1&limit=20&role=admin" \
  -b cookies.txt
```

**기대 응답**: 페이지네이션된 사용자 목록

### 4.7 POST /api/admin/users — 사용자 생성

```bash
curl -X POST http://localhost:3000/api/admin/users \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "email": "new@biogram.co.kr",
    "password": "NewP@ss123",
    "name": "신규관리",
    "role": "editor"
  }'
```

**기대 응답**: 201 Created + 생성된 사용자 객체

### 4.8 GET /api/admin/measurements — 측정 항목 목록

```bash
curl http://localhost:3000/api/admin/measurements \
  -b cookies.txt
```

**기대 응답**: 6개 측정 항목 배열 (equipment 포함)

### 4.9 GET /api/admin/audit-logs — 감사 로그

```bash
curl "http://localhost:3000/api/admin/audit-logs?page=1&limit=50&action=update&entity=KioskContent" \
  -b cookies.txt
```

**기대 응답**: 페이지네이션된 감사 로그 배열

### 4.10 GET /api/admin/stats — 대시보드 통계

```bash
curl "http://localhost:3000/api/admin/stats?period=7d" \
  -b cookies.txt
```

**기대 응답**: 세션 통계, 화면 방문, 콘텐츠 변경 이력

---

## 5. 보안 테스트 체크리스트

### 5.1 JWT 세션 보안

| 검증 항목 | 기준 | 확인 방법 | 상태 |
|-----------|------|-----------|------|
| **httpOnly 쿠키** | JavaScript에서 쿠키 접근 불가 | `eval "document.cookie"`에 admin_session 미포함 | ✅ |
| **Secure 플래그** | HTTPS 연결에서만 전송 | Set-Cookie 헤더 확인 | ✅ |
| **SameSite=Strict** | CSRF 방어 | Set-Cookie 헤더 확인 | ✅ |
| **세션 만료** | 8시간 후 만료 | 만료된 토큰으로 API 호출 → 401 | ✅ |
| **세션 DB 이중 검증** | 로그아웃된 토큰 차단 | 로그아웃 후 이전 토큰으로 호출 → 401 | ✅ |
| **HS256 서명** | 변조된 토큰 차단 | 변조된 JWT로 호출 → 401 | ✅ |

### 5.2 RBAC 권한 강제

| 검증 항목 | 기준 | 확인 방법 | 상태 |
|-----------|------|-----------|------|
| **viewer 쓰기 차단** | 모든 쓰기 API → 403 | viewer로 PUT/POST/DELETE 호출 | ✅ |
| **editor 사용자 관리 차단** | users:write 권한 없음 | editor로 POST /api/admin/users → 403 | ✅ |
| **admin 역할 변경 차단** | users:role 권한 없음 | admin으로 role 변경 → 403 | ✅ |
| **superadmin 전체 권한** | 모든 API 접근 가능 | superadmin으로 전체 API 호출 | ✅ |
| **UI 권한 반영** | 권한 없는 메뉴/버튼 미표시 | viewer 대시보드 스냅샷 | ✅ |

### 5.3 계정 잠금 메커니즘

| 검증 항목 | 기준 | 확인 방법 | 상태 |
|-----------|------|-----------|------|
| **5회 실패 잠금** | failedAttempts ≥ 5 → lockedUntil 설정 | 5회 연속 잘못된 비밀번호 | ✅ |
| **15분 잠금 기간** | LOCK_DURATION_MS = 900000 | lockedUntil - now ≈ 15분 | ✅ |
| **잠금 중 로그인 차단** | 올바른 비밀번호라도 차단 | 잠금 상태에서 올바른 비밀번호 → 423 | ✅ |
| **자동 잠금 해제** | 15분 경과 후 로그인 가능 | lockedUntil < now → locked: false | ✅ |
| **성공 시 카운터 리셋** | failedAttempts = 0, lockedUntil = null | 로그인 성공 후 DB 확인 | ✅ |

### 5.4 감사 로그 보안

| 검증 항목 | 기준 | 확인 방법 | 상태 |
|-----------|------|-----------|------|
| **append-only** | 감사 로그 삭제/수정 불가 | DELETE API 미존재, UI에 삭제 버튼 없음 | ✅ |
| **모든 쓰기 작업 기록** | create/update/delete 100% 로깅 | 쓰기 API 호출 후 audit-logs 확인 | ✅ |
| **변경 전/후 값** | before/after JSON 포함 | 감사 로그 확장 시 changes 필드 확인 | ✅ |
| **사용자 식별** | userId 자동 기록 | 감사 로그에 작업자 정보 포함 | ✅ |

---

## 6. 성능 기준

### 6.1 Core Web Vitals (관리자 대시보드)

| 지표 | 목표 | 측정 방법 |
|------|------|-----------|
| **LCP** (최대 콘텐츠 페인트) | < 2.5초 | Chrome DevTools Performance |
| **FID** (최초 입력 지연) | < 100ms | Chrome DevTools Performance |
| **CLS** (누적 레이아웃 이동) | < 0.1 | Chrome DevTools Performance |

### 6.2 관리자 대시보드 특화 성능

| 지표 | 목표 | 측정 방법 |
|------|------|-----------|
| **로그인 응답** | < 500ms | 로그인 API 호출 → 200 응답 시간 |
| **콘텐츠 목록 로딩** | < 300ms | GET /api/admin/content 응답 시간 |
| **콘텐츠 저장** | < 500ms | PUT /api/admin/content/:id 응답 시간 |
| **이미지 업로드** | < 3초 | POST /api/admin/images/upload 응답 시간 |
| **감사 로그 조회** | < 500ms | GET /api/admin/audit-logs 응답 시간 |
| **사이드바 전환** | < 200ms | 메뉴 클릭 → 페이지 렌더링 시간 |
| **폼 다이얼로그 열기** | < 150ms | 버튼 클릭 → 다이얼로그 렌더링 시간 |
| **RBAC 권한 확인** | < 50ms | 미들웨어 통과 시간 (서버 측) |

### 6.3 성능 측정 스크립트 예시

```bash
# 로그인 응답 시간 측정
agent-browser eval "
  const start = performance.now();
  await fetch('/api/admin/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@biogram.co.kr', password: 'Admin@1234' })
  });
  performance.now() - start;
"

# 콘텐츠 목록 로딩 시간 측정
agent-browser eval "
  const start = performance.now();
  await fetch('/api/admin/content');
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

| 단계 | 명령어 | 실패 시 동작 | 소요 시간 (예상) |
|------|--------|-------------|------------------|
| **lint** | `bun run lint` | 파이프라인 중단 | ~5초 |
| **type-check** | `npx tsc --noEmit` | 파이프라인 중단 | ~10초 |
| **build** | `bun run build` | 파이프라인 중단 | ~30초 |
| **E2E** | `agent-browser` 시나리오 실행 | 리포트 생성 | ~120초 |

---

## 부록: 테스트 체크리스트 요약

| ID | 테스트 항목 | 도구 | 우선순위 |
|----|-------------|------|----------|
| TC-A01 | 로그인 페이지 렌더링 | agent-browser | P0 |
| TC-A02 | 유효한 자격 증명 로그인 | agent-browser | P0 |
| TC-A03 | 무효한 자격 증명 로그인 (계정 잠금) | agent-browser | P0 |
| TC-A04 | 대시보드 페이지 | agent-browser | P0 |
| TC-A05 | 콘텐츠 관리 CRUD | agent-browser | P0 |
| TC-A06 | 측정 항목 관리 CRUD | agent-browser | P0 |
| TC-A07 | 사용자 관리 CRUD | agent-browser | P0 |
| TC-A08 | 이미지 업로드/갤러리 | agent-browser | P1 |
| TC-A09 | 감사 로그 조회/필터 | agent-browser | P1 |
| TC-A10 | 설정 페이지 | agent-browser | P1 |
| TC-A11 | RBAC 권한 강제 | agent-browser | P0 |
| TC-A12 | 로그아웃/세션 관리 | agent-browser | P0 |
| TC-A13 | 모바일 반응형 레이아웃 | agent-browser | P1 |
| — | ESLint 정적 분석 | bun run lint | P0 |
| — | TypeScript 타입 체크 | tsc --noEmit | P0 |
| — | API 엔드포인트 | curl | P1 |
| — | JWT/RBAC/잠금/감사 보안 | curl + agent-browser | P0 |
| — | Core Web Vitals | DevTools | P2 |
