# Biogram MINI 관리자 대시보드 — 기술 설계 문서 (TDD)

> 버전: 1.0.0  
> 최종 수정: 2026-03-06  
> 작성자: Biogram MINI 개발팀

---

## 1. 기술 스택

| 계층 | 기술 | 버전 | 용도 |
|------|------|------|------|
| **프레임워크** | Next.js (App Router) | 16 | SSR, 라우팅, API Routes |
| **언어** | TypeScript | 5 | 정적 타입, 컴파일 타임 오류 검출 |
| **스타일링** | Tailwind CSS | 4 | 유틸리티 퍼스트 CSS, 반응형 |
| **UI 컴포넌트** | shadcn/ui (New York) | — | Card, Button, Table, Form, Dialog 등 |
| **상태 관리** | Zustand | 5 | 클라이언트 전역 상태 (인증, UI) |
| **데이터 패칭** | TanStack Query (SWR) | 5 | 서버 상태, 캐시, 재검증 |
| **폼 관리** | React Hook Form | 7 | 폼 상태, 검증, 제출 |
| **스키마 검증** | Zod | 3 | 런타임 타입 검증, API 요청/응답 |
| **애니메이션** | Framer Motion | 12 | 화면 전환, 마이크로 인터랙션 |
| **ORM** | Prisma | — | SQLite 데이터베이스 클라이언트 |
| **데이터베이스** | SQLite | — | 로컬 파일 DB |
| **비밀번호 해싱** | bcryptjs | 2 | 비밀번호 해싱 (cost=12) |
| **JWT** | jose | 5 | JWT 서명/검증 (Edge Runtime 호환) |
| **아이콘** | Lucide React | — | 시스템 아이콘 셋 |
| **폰트** | Noto Sans KR | — | 한국어 가변 웹폰트 |
| **이미지 처리** | Sharp | — | 업로드 이미지 리사이징, 메타데이터 제거 |
| **날짜** | date-fns | 3 | 날짜 포맷, 계산 |

---

## 2. 인증 구현

### 2.1 JWT 세션 전략

`jose` 라이브러리를 사용하여 Edge Runtime 호환 JWT를 생성합니다.

```typescript
// src/lib/admin/auth.ts
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);
const COOKIE_NAME = 'admin_session';
const EXPIRES_IN = '8h';

export async function createSession(userId: string, role: string): Promise<string> {
  const token = await new SignJWT({ sub: userId, role })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(EXPIRES_IN)
    .sign(SECRET);
  
  // 세션을 DB에도 저장 (이중 검증)
  await db.adminSession.create({
    data: { userId, token, expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000) },
  });
  
  return token;
}

export async function verifySession(token: string): Promise<{ sub: string; role: string } | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    
    // DB에서 세션 존재 확인 (로그아웃된 세션 차단)
    const session = await db.adminSession.findUnique({ where: { token } });
    if (!session || session.expiresAt < new Date()) return null;
    
    return payload as { sub: string; role: string };
  } catch {
    return null;
  }
}

export async function getSessionUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  
  const payload = await verifySession(token);
  if (!payload) return null;
  
  return db.adminUser.findUnique({ where: { id: payload.sub } });
}
```

### 2.2 비밀번호 해싱

```typescript
// src/lib/admin/password.ts
import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
```

### 2.3 계정 잠금 메커니즘

```typescript
// src/lib/admin/lockout.ts
const MAX_ATTEMPTS = 5;
const LOCK_DURATION = 15 * 60 * 1000; // 15분

export async function checkLockout(email: string): Promise<{ locked: boolean; remainingMs?: number }> {
  const user = await db.adminUser.findUnique({ where: { email } });
  if (!user) return { locked: false };
  
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    return { locked: true, remainingMs: user.lockedUntil.getTime() - Date.now() };
  }
  return { locked: false };
}

export async function recordFailedAttempt(email: string): Promise<void> {
  const user = await db.adminUser.findUnique({ where: { email } });
  if (!user) return;
  
  const attempts = (user.failedAttempts || 0) + 1;
  const lockedUntil = attempts >= MAX_ATTEMPTS ? new Date(Date.now() + LOCK_DURATION) : null;
  
  await db.adminUser.update({
    where: { email },
    data: { failedAttempts: attempts, lockedUntil },
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

## 3. RBAC 미들웨어

### 3.1 권한 정의

```typescript
// src/lib/admin/rbac.ts
export type Role = 'superadmin' | 'admin' | 'editor' | 'viewer';
export type Permission =
  | 'content:read' | 'content:write'
  | 'users:read' | 'users:write' | 'users:role'
  | 'measurements:read' | 'measurements:write'
  | 'images:upload'
  | 'settings:read' | 'settings:write'
  | 'audit:read';

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  superadmin: [
    'content:read', 'content:write',
    'users:read', 'users:write', 'users:role',
    'measurements:read', 'measurements:write',
    'images:upload',
    'settings:read', 'settings:write',
    'audit:read',
  ],
  admin: [
    'content:read', 'content:write',
    'users:read', 'users:write',
    'measurements:read', 'measurements:write',
    'images:upload',
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

export function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function requirePermission(role: Role, permission: Permission): void {
  if (!hasPermission(role, permission)) {
    throw new RbacDeniedError(`역할 '${role}'에 권한 '${permission}'이 없습니다`);
  }
}
```

### 3.2 API Route 미들웨어

```typescript
// src/lib/admin/middleware.ts
import { NextRequest, NextResponse } from 'next/server';

type Handler = (req: NextRequest, ctx: { userId: string; role: Role }) => Promise<NextResponse>;

export function withAuth(permission: Permission, handler: Handler) {
  return async (req: NextRequest) => {
    // 1. 세션 검증
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: '인증이 필요합니다', code: 'AUTH_REQUIRED' }, { status: 401 });
    }
    
    // 2. 권한 확인
    try {
      requirePermission(user.role as Role, permission);
    } catch {
      return NextResponse.json({ error: '권한이 부족합니다', code: 'RBAC_DENIED' }, { status: 403 });
    }
    
    // 3. 핸들러 실행
    return handler(req, { userId: user.id, role: user.role as Role });
  };
}
```

### 3.3 사용 예

```typescript
// src/app/api/admin/content/route.ts
export const PUT = withAuth('content:write', async (req, { userId }) => {
  const body = await req.json();
  const validated = contentUpdateSchema.parse(body);
  
  const before = await db.kioskContent.findUnique({ where: { section: validated.section } });
  const result = await db.kioskContent.update({ where: { section: validated.section }, data: validated });
  
  // 감사 로그
  await db.auditLog.create({
    data: {
      userId,
      action: 'update',
      entity: 'KioskContent',
      entityId: result.id,
      changes: { before, after: result },
    },
  });
  
  return NextResponse.json(result);
});
```

---

## 4. 데이터 패칭 (TanStack Query)

### 4.1 클라이언트 설정

```typescript
// src/lib/admin/query-client.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000,        // 30초간 데이터를 fresh로 간주
      gcTime: 5 * 60 * 1000,        // 5분간 캐시 보관
      retry: 2,                      // 실패 시 2회 재시도
      refetchOnWindowFocus: true,   9    // 창 포커스 시 재검증
    },
    mutations: {
      retry: 1,
    },
  },
});
```

### 4.2 쿼리 훅 패턴

```typescript
// src/hooks/admin/use-content.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// 목록 조회
export function useContentList() {
  return useQuery({
    queryKey: ['admin', 'content'],
    queryFn: async () => {
      const res = await fetch('/api/admin/content');
      if (!res.ok) throw new Error('콘텐츠 로딩 실패');
      return res.json();
    },
  });
}

// 수정 (낙관적 업데이트)
export function useUpdateContent(screenId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: ContentUpdateInput) => {
      const res = await fetch(`/api/admin/content/${screenId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('콘텐츠 수정 실패');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'content'] });
      toast.success('콘텐츠가 저장되었습니다');
    },
    onError: () => {
      toast.error('저장에 실패했습니다');
    },
  });
}
```

### 4.3 키오스크 클라이언트 재검증

키오스크 클라이언트는 기존 SWR 전략에 `refreshInterval`을 추가하여 관리자 변경을 자동 감지합니다.

```typescript
// 키오스크에서 콘텐츠 패칭 (5초 폴링)
const { data: content } = useSWR('/api/content', fetcher, {
  refreshInterval: 5000,      // 5초마다 재검증
  revalidateOnFocus: true,    // 포커스 시 재검증
  dedupingInterval: 2000,     // 2초 내 중복 요청 방지
});
```

---

## 5. 파일 업로드 전략

### 5.1 업로드 파이프라인

```
클라이언트                API 서버                 파일 시스템
    │                      │                         │
    │  FormData (file)     │                         │
    │─────────────────────▶│                         │
    │                      │  1. 파일 크기 검증 (≤5MB) │
    │                      │  2. MIME 타입 화이트리스트 │
    │                      │  3. Sharp 리사이징        │
    │                      │     (max 1920×1080)      │
    │                      │  4. 메타데이터 제거       │
    │                      │  5. 파일명 생성           │
    │                      │     (hash + timestamp)   │
    │                      │────────────────────────▶│
    │                      │  6. 파일 저장             │
    │                      │     /public/admin-uploads │
    │                      │     /YYYY-MM/            │
    │                      │                         │
    │  { url, size, ... }  │                         │
    │◀─────────────────────│                         │
```

### 5.2 구현

```typescript
// src/lib/admin/upload.ts
import sharp from 'sharp';
import { writeFileSync, mkdirSync } from 'fs';
import path from 'path';

const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_DIMENSIONS = { width: 1920, height: 1080 };

export async function processUpload(file: File, category: string): Promise<UploadResult> {
  // 1. 검증
  if (!ALLOWED_TYPES.includes(file.type)) throw new UploadError('지원하지 않는 파일 형식입니다');
  if (file.size > MAX_SIZE) throw new UploadError('파일 크기가 5MB를 초과합니다');
  
  // 2. 처리 (SVG는 리사이징 생략)
  const buffer = Buffer.from(await file.arrayBuffer());
  
  let processed: Buffer;
  let width: number, height: number;
  
  if (file.type === 'image/svg+xml') {
    processed = buffer;
    width = 0; height = 0;
  } else {
    const image = sharp(buffer).rotate(); // EXIF 회전
    const metadata = await image.metadata();
    
    if (metadata.width! > MAX_DIMENSIONS.width || metadata.height! > MAX_DIMENSIONS.height) {
      image.resize(MAX_DIMENSIONS.width, MAX_DIMENSIONS.height, { fit: 'inside', withoutEnlargement: true });
    }
    
    processed = await image.toBuffer();
    const meta = await sharp(processed).metadata();
    width = meta.width!;
    height = meta.height!;
  }
  
  // 3. 저장
  const dateDir = new Date().toISOString().slice(0, 7); // YYYY-MM
  const hash = crypto.randomUUID().slice(0, 8);
  const ext = file.type.split('/')[1] === 'jpeg' ? 'jpg' : file.type.split('/')[1];
  const filename = `${path.parse(file.name).name}-${hash}.${ext}`;
  const dir = path.join(process.cwd(), 'public', 'admin-uploads', dateDir);
  
  mkdirSync(dir, { recursive: true });
  writeFileSync(path.join(dir, filename), processed);
  
  return {
    url: `/admin-uploads/${dateDir}/${filename}`,
    filename,
    size: processed.length,
    width,
    height,
    mimeType: file.type,
  };
}
```

---

## 6. 폼 검증 (Zod)

### 6.1 스키마 정의

```typescript
// src/lib/admin/schemas.ts
import { z } from 'zod';

// 로그인
export const loginSchema = z.object({
  email: z.string().email('유효한 이메일을 입력하세요'),
  password: z.string().min(8, '비밀번호는 8자 이상').max(64, '비밀번호는 64자 이하'),
});

// 사용자 생성
export const createUserSchema = z.object({
  email: z.string().email('유효한 이메일을 입력하세요'),
  password: z.string()
    .min(8, '8자 이상')
    .max(64, '64자 이하')
    .regex(/[A-Za-z]/, '영문 포함')
    .regex(/[0-9]/, '숫자 포함')
    .regex(/[^A-Za-z0-9]/, '특수문자 포함'),
  name: z.string().min(2, '이름은 2자 이상').max(50, '이름은 50자 이하'),
  role: z.enum(['superadmin', 'admin', 'editor', 'viewer']),
});

// 콘텐츠 수정
export const contentUpdateSchema = z.object({
  title: z.string().min(1, '제목을 입력하세요').max(200, '제목은 200자 이하'),
  body: z.string().max(5000, '본문은 5000자 이하').optional(),
  imageUrl: z.string().url('유효한 URL을 입력하세요').optional().nullable(),
  qrCodeUrl: z.string().url('유효한 URL을 입력하세요').optional().nullable(),
});

// 측정 항목
export const measurementSchema = z.object({
  key: z.string().regex(/^[a-z0-9-]+$/, '영문 소문자, 숫자, 하이픈만 가능'),
  name: z.string().min(2, '2자 이상').max(20, '20자 이하'),
  description: z.string().max(500, '500자 이하').optional(),
  icon: z.string().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'HEX 색상 코드').optional(),
  order: z.number().int().min(1).max(100),
  imageUrl: z.string().optional().nullable(),
  estimatedTime: z.number().int().min(1).max(30).optional(),
  isActive: z.boolean().optional(),
});

// 장비 정보
export const equipmentSchema = z.object({
  name: z.string().min(2, '2자 이상').max(50, '50자 이하'),
  description: z.string().max(1000, '1000자 이하').optional(),
  preparationSteps: z.array(z.string().max(200)).max(10, '최대 10단계').optional(),
  precautions: z.array(z.object({
    level: z.enum(['warning', 'info']),
    text: z.string().max(200),
  })).max(10, '최대 10개').optional(),
  imageUrl: z.string().optional().nullable(),
  order: z.number().int().min(1).max(100),
});
```

### 6.2 React Hook Form 연동

```typescript
// 폼 컴포넌트 예
function ContentEditForm({ screenId }: { screenId: string }) {
  const { data: content } = useContentDetail(screenId);
  const updateMutation = useUpdateContent(screenId);
  
  const form = useForm({
    resolver: zodResolver(contentUpdateSchema),
    defaultValues: content ?? { title: '', body: '', imageUrl: null },
  });
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((data) => updateMutation.mutate(data))}>
        <FormField name="title" render={({ field }) => (
          <FormItem>
            <FormLabel>제목</FormLabel>
            <Input {...field} />
            <FormMessage />
          </FormItem>
        )} />
        <Button type="submit" disabled={updateMutation.isPending}>
          {updateMutation.isPending ? '저장 중...' : '저장'}
        </Button>
      </form>
    </Form>
  );
}
```

---

## 7. 환경 변수

```env
# 관리자 인증
JWT_SECRET=<32자 이상 랜덤 문자열>
JWT_EXPIRES_IN=8h

# 데이터베이스
DATABASE_URL=file:./db/custom.db

# 파일 업로드
UPLOAD_MAX_SIZE=5242880          # 5MB
UPLOAD_DIR=public/admin-uploads

# 초기 관리자 계정 (최초 실행 시 시드)
SEED_ADMIN_EMAIL=admin@biogram.co.kr
SEED_ADMIN_PASSWORD=<초기 비밀번호>
SEED_ADMIN_NAME=최관리
```

---

## 8. 보안 체크리스트

| 항목 | 구현 | 상태 |
|------|------|------|
| HTTPS 강제 | Caddy 리버스 프록시 | ✅ |
| httpOnly 쿠키 | jose JWT + Set-Cookie | ✅ |
| SameSite=Strict | CSRF 방어 | ✅ |
| bcrypt 해싱 | cost=12 | ✅ |
| 입력 검증 | Zod 스키마 | ✅ |
| SQL 인젝션 방어 | Prisma 매개변수화 | ✅ |
| 파일 업로드 화이트리스트 | MIME + 확장자 | ✅ |
| 브루트 포스 방어 | 5회 잠금 | ✅ |
| 세션 만료 | 8시간 | ✅ |
| 감사 로그 | 모든 쓰기 작업 | ✅ |
