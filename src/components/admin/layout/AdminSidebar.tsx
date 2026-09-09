'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FileText,
  Activity,
  Image,
  Users,
  ScrollText,
  Settings,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCurrentUser } from '@/hooks/admin/use-auth';
import { hasPermission, type Role, type Permission } from '@/lib/admin/rbac';

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  requiredPermission?: Permission;
}

const navItems: NavItem[] = [
  {
    label: '대시보드',
    href: '/admin',
    icon: LayoutDashboard,
    requiredPermission: 'content:read',
  },
  {
    label: '콘텐츠 관리',
    href: '/admin/content',
    icon: FileText,
    requiredPermission: 'content:read',
  },
  {
    label: '측정 항목',
    href: '/admin/measurements',
    icon: Activity,
    requiredPermission: 'measurements:read',
  },
  {
    label: '이미지 관리',
    href: '/admin/images',
    icon: Image,
    requiredPermission: 'images:upload',
  },
  {
    label: '사용자 관리',
    href: '/admin/users',
    icon: Users,
    requiredPermission: 'users:read',
  },
  {
    label: '감사 로그',
    href: '/admin/audit-logs',
    icon: ScrollText,
    requiredPermission: 'audit:read',
  },
  {
    label: '설정',
    href: '/admin/settings',
    icon: Settings,
    requiredPermission: 'settings:read',
  },
];

export function AdminSidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { data: user } = useCurrentUser();
  const role = (user?.role ?? 'viewer') as Role;

  const visibleItems = navItems.filter((item) => {
    if (!item.requiredPermission) return true;
    return hasPermission(role, item.requiredPermission);
  });

  return (
    <nav className="flex flex-col gap-1 p-4">
      <div className="mb-6 px-2">
        <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">
          Biogram MINI
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          관리자 대시보드
        </p>
      </div>

      <div className="space-y-1">
        {visibleItems.map((item) => {
          const isActive =
            item.href === '/admin'
              ? pathname === '/admin'
              : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function AdminSidebar() {
  return (
    <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
      <AdminSidebarContent />
    </aside>
  );
}
