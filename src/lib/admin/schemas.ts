import { z } from 'zod';

function isHttpUrl(v: string): boolean {
  try {
    const u = new URL(v);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

function isRootRelativePath(v: string): boolean {
  return v.startsWith('/') && !v.includes(' ') && !v.includes('\\') && !v.includes('..');
}

// 이미지/링크 필드 공용 검증: http(s) 절대 URL 또는 / 로 시작하는 상대경로 허용.
// 업로드 직후 자동 입력되는 /admin-uploads/... 경로가 기존 .url() 검증을
// 통과하지 못해 저장이 막히던 버그 수정. 빈 문자열도 허용(미설정).
export const linkOrPathField = (
  message = '유효한 URL 또는 / 로 시작하는 경로를 입력하세요'
) => z.string().max(2048).refine((v) => v === '' || isHttpUrl(v) || isRootRelativePath(v), message);

export const loginSchema = z.object({
  email: z.string().email('유효한 이메일을 입력하세요'),
  password: z.string().min(1, '비밀번호를 입력하세요'),
});

export const createUserSchema = z.object({
  email: z.string().email('유효한 이메일을 입력하세요').max(254),
  password: z
    .string()
    .min(12, '비밀번호는 12자 이상이어야 합니다')
    .max(128)
    .regex(/[a-z]/, '소문자를 포함하세요')
    .regex(/[A-Z]/, '대문자를 포함하세요')
    .regex(/[0-9]/, '숫자를 포함하세요')
    .regex(/[^a-zA-Z0-9]/, '특수문자를 포함하세요'),
  name: z.string().min(1, '이름을 입력하세요').max(50, '이름은 50자 이하여야 합니다'),
  role: z.enum(['superadmin', 'admin', 'editor', 'viewer']).default('editor'),
});

export const updateUserSchema = z.object({
  name: z.string().min(1, '이름을 입력하세요').max(50).optional(),
  email: z.string().email('유효한 이메일을 입력하세요').max(254).optional(),
  role: z.enum(['superadmin', 'admin', 'editor', 'viewer']).optional(),
  isActive: z.boolean().optional(),
  password: z
    .string()
    .min(12, '비밀번호는 12자 이상이어야 합니다')
    .max(128)
    .regex(/[a-z]/, '소문자를 포함하세요')
    .regex(/[A-Z]/, '대문자를 포함하세요')
    .regex(/[0-9]/, '숫자를 포함하세요')
    .regex(/[^a-zA-Z0-9]/, '특수문자를 포함하세요')
    .optional(),
});

export const contentUpdateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  body: z.string().max(20000).optional(),
  imageUrl: linkOrPathField().optional().nullable(),
  qrCodeUrl: linkOrPathField().optional().nullable(),
  backgroundColor: z
    .string()
    .max(16)
    .regex(/^$|^#(?:[0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/, 'HEX 색상(#RGB/#RRGGBB) 형식이어야 합니다')
    .optional()
    .nullable(),
  backgroundImageUrl: linkOrPathField().optional().nullable(),
  mapImageUrl: linkOrPathField().optional().nullable(),
});

export const sectionUpdateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  body: z.string().max(20000).optional(),
  imageUrl: linkOrPathField().optional().nullable(),
  order: z.number().int().min(0).optional(),
});

export const kioskLogSchema = z.object({
  sessionId: z.string().min(1).max(64),
  eventType: z.enum(['navigate', 'back', 'home', 'session_start', 'session_end', 'idle_timeout', 'error']),
  screen: z.string().max(64).optional().nullable(),
  detail: z.string().max(500).optional().nullable(),
});

export const createSectionSchema = z.object({
  sectionKey: z.string().min(1).max(64).regex(/^[a-z0-9-]+$/, '영문 소문자/숫자/하이픈만 사용하세요'),
  title: z.string().min(1, '제목을 입력하세요').max(200),
  body: z.string().max(20000).default(''),
  imageUrl: linkOrPathField().optional().nullable(),
  order: z.number().int().min(0).default(0),
});

export const measurementSchema = z.object({  key: z.string().min(1, '키를 입력하세요').max(50),
  name: z.string().min(1, '이름을 입력하세요').max(100),
  description: z.string().default(''),
  icon: z.string().default(''),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, '유효한 색상 코드를 입력하세요').default('#3B82F6'),
  order: z.number().int().min(0).default(0),
  imageUrl: linkOrPathField().optional().nullable(),
  estimatedTime: z.number().int().min(1).default(5),
  isActive: z.boolean().default(true),
});

export const equipmentSchema = z.object({
  name: z.string().min(1, '장비명을 입력하세요').max(100),
  description: z.string().default(''),
  preparationSteps: z.array(z.string()).default([]),
  precautions: z.array(z.string()).default([]),
  imageUrl: linkOrPathField().optional().nullable(),
  order: z.number().int().min(0).default(0),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type ContentUpdateInput = z.infer<typeof contentUpdateSchema>;
export type SectionUpdateInput = z.infer<typeof sectionUpdateSchema>;
export type MeasurementInput = z.infer<typeof measurementSchema>;
export type EquipmentInput = z.infer<typeof equipmentSchema>;
