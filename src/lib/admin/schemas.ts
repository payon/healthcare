import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('유효한 이메일을 입력하세요'),
  password: z.string().min(1, '비밀번호를 입력하세요'),
});

export const createUserSchema = z.object({
  email: z.string().email('유효한 이메일을 입력하세요'),
  password: z.string().min(8, '비밀번호는 8자 이상이어야 합니다'),
  name: z.string().min(1, '이름을 입력하세요').max(50, '이름은 50자 이하여야 합니다'),
  role: z.enum(['superadmin', 'admin', 'editor', 'viewer']).default('editor'),
});

export const updateUserSchema = z.object({
  name: z.string().min(1, '이름을 입력하세요').max(50).optional(),
  email: z.string().email('유효한 이메일을 입력하세요').optional(),
  role: z.enum(['superadmin', 'admin', 'editor', 'viewer']).optional(),
  isActive: z.boolean().optional(),
  password: z.string().min(8, '비밀번호는 8자 이상이어야 합니다').optional(),
});

export const contentUpdateSchema = z.object({
  title: z.string().min(1).optional(),
  body: z.string().optional(),
  imageUrl: z.string().url().optional().nullable(),
  qrCodeUrl: z.string().url().optional().nullable(),
});

export const sectionUpdateSchema = z.object({
  title: z.string().min(1).optional(),
  body: z.string().optional(),
  imageUrl: z.string().url().optional().nullable(),
  order: z.number().int().min(0).optional(),
});

export const measurementSchema = z.object({
  key: z.string().min(1, '키를 입력하세요').max(50),
  name: z.string().min(1, '이름을 입력하세요').max(100),
  description: z.string().default(''),
  icon: z.string().default(''),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, '유효한 색상 코드를 입력하세요').default('#3B82F6'),
  order: z.number().int().min(0).default(0),
  imageUrl: z.string().url().optional().nullable(),
  estimatedTime: z.number().int().min(1).default(5),
  isActive: z.boolean().default(true),
});

export const equipmentSchema = z.object({
  name: z.string().min(1, '장비명을 입력하세요').max(100),
  description: z.string().default(''),
  preparationSteps: z.array(z.string()).default([]),
  precautions: z.array(z.string()).default([]),
  imageUrl: z.string().url().optional().nullable(),
  order: z.number().int().min(0).default(0),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type ContentUpdateInput = z.infer<typeof contentUpdateSchema>;
export type SectionUpdateInput = z.infer<typeof sectionUpdateSchema>;
export type MeasurementInput = z.infer<typeof measurementSchema>;
export type EquipmentInput = z.infer<typeof equipmentSchema>;
