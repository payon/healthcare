'use client';

import { useCurrentUser, useLogout } from '@/hooks/admin/use-auth';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Menu, LogOut, User } from 'lucide-react';
import { AdminSidebarContent } from './AdminSidebar';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

const roleBadgeVariant: Record<string, 'destructive' | 'default' | 'secondary' | 'outline'> = {
  superadmin: 'destructive',
  admin: 'default',
  editor: 'secondary',
  viewer: 'outline',
};

const roleLabel: Record<string, string> = {
  superadmin: '최고관리자',
  admin: '관리자',
  editor: '편집자',
  viewer: '조회자',
};

export function AdminHeader() {
  const { data: user } = useCurrentUser();
  const logoutMutation = useLogout();
  const router = useRouter();
  const [sheetOpen, setSheetOpen] = useState(false);

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    router.replace('/admin/login');
  };

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 md:px-6">
      {/* Mobile menu */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetTrigger asChild className="md:hidden">
          <Button variant="ghost" size="icon">
            <Menu className="h-5 w-5" />
            <span className="sr-only">메뉴</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <AdminSidebarContent onNavigate={() => setSheetOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="md:hidden" />

      {/* User info */}
      <div className="flex items-center gap-3">
        {user && (
          <>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-slate-500" />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {user.name}
              </span>
              <Badge variant={roleBadgeVariant[user.role] ?? 'outline'} className="text-xs">
                {roleLabel[user.role] ?? user.role}
              </Badge>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              disabled={logoutMutation.isPending}
              className="text-slate-500 hover:text-slate-700"
            >
              <LogOut className="h-4 w-4 mr-1" />
              <span className="text-xs">로그아웃</span>
            </Button>
          </>
        )}
      </div>
    </header>
  );
}
