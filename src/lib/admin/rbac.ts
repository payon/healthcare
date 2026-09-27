export type Role = 'superadmin' | 'admin' | 'editor' | 'viewer';

export type Permission =
  | 'content:read'
  | 'content:write'
  | 'users:read'
  | 'users:write'
  | 'users:role'
  | 'measurements:read'
  | 'measurements:write'
  | 'images:upload'
  | 'settings:read'
  | 'settings:write'
  | 'audit:read';

const ALL_PERMISSIONS: Permission[] = [
  'content:read',
  'content:write',
  'users:read',
  'users:write',
  'users:role',
  'measurements:read',
  'measurements:write',
  'images:upload',
  'settings:read',
  'settings:write',
  'audit:read',
];

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  superadmin: [...ALL_PERMISSIONS],
  admin: [
    'content:read',
    'content:write',
    'users:read',
    'users:write',
    'measurements:read',
    'measurements:write',
    'images:upload',
    'settings:read',
    'audit:read',
  ],
  editor: [
    'content:read',
    'content:write',
    'measurements:read',
    'measurements:write',
    'images:upload',
  ],
  viewer: [
    'content:read',
    'measurements:read',
  ],
};

export function hasPermission(role: Role, permission: Permission): boolean {
  const permissions = ROLE_PERMISSIONS[role];
  if (!permissions) return false;
  return permissions.includes(permission);
}

export function requirePermission(role: Role, permission: Permission): void {
  if (!hasPermission(role, permission)) {
    throw new Error(`Permission denied: ${permission} required for role ${role}`);
  }
}

export function getRolePermissions(role: Role): Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}
