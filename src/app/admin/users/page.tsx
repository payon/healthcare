'use client';

import { useState } from 'react';
import { useUserList, useCreateUser, useUpdateUser, useDeleteUser } from '@/hooks/admin/use-users';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Edit, Trash2, Loader2, Users, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

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

const createUserSchema = z.object({
  name: z.string().min(1, '이름을 입력하세요').max(50),
  email: z.string().email('유효한 이메일을 입력하세요'),
  password: z.string().min(12, '비밀번호는 12자 이상이어야 합니다'),
  role: z.enum(['superadmin', 'admin', 'editor', 'viewer']).default('editor'),
});

type CreateUserForm = z.infer<typeof createUserSchema>;

const editUserSchema = z.object({
  name: z.string().min(1, '이름을 입력하세요').max(50),
  email: z.string().email('유효한 이메일을 입력하세요'),
  role: z.enum(['superadmin', 'admin', 'editor', 'viewer']),
  isActive: z.boolean(),
  password: z.string().min(12, '비밀번호는 12자 이상이어야 합니다').or(z.literal('')).optional(),
});

type EditUserForm = z.infer<typeof editUserSchema>;

export default function UsersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('');

  const { data, isLoading } = useUserList({
    page,
    limit: 20,
    search: search || undefined,
    role: roleFilter || undefined,
  });

  const createMutation = useCreateUser();
  const [editUserId, setEditUserId] = useState<string | null>(null);
  const updateMutation = useUpdateUser(editUserId ?? '');
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [deleteUserName, setDeleteUserName] = useState('');
  const deleteMutation = useDeleteUser(deleteUserId ?? '');

  // Create dialog
  const [createOpen, setCreateOpen] = useState(false);
  const {
    register: registerC,
    handleSubmit: handleSubmitC,
    reset: resetC,
    formState: { errors: errorsC },
  } = useForm<CreateUserForm>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(createUserSchema as any),
    defaultValues: { name: '', email: '', password: '', role: 'editor' },
  });

  const onCreateSubmit = (formData: CreateUserForm) => {
    createMutation.mutate(formData, {
      onSuccess: () => {
        toast.success('사용자가 생성되었습니다');
        setCreateOpen(false);
        resetC();
      },
      onError: (err) => toast.error(err.message),
    });
  };

  // Edit dialog
  const [editOpen, setEditOpen] = useState(false);
  const {
    register: registerE,
    handleSubmit: handleSubmitE,
    reset: resetE,
    watch: watchE,
    formState: { errors: errorsE },
  } = useForm<EditUserForm>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(editUserSchema as any),
  });

  const isActiveWatch = watchE('isActive');

  const openEdit = (user: { id: string; name: string; email: string; role: string; isActive: boolean }) => {
    setEditUserId(user.id);
    resetE({
      name: user.name,
      email: user.email,
      role: user.role as EditUserForm['role'],
      isActive: user.isActive,
      password: '',
    });
    setEditOpen(true);
  };

  const onEditSubmit = (formData: EditUserForm) => {
    const payload: Record<string, unknown> = {
      name: formData.name,
      email: formData.email,
      role: formData.role,
      isActive: formData.isActive,
    };
    if (formData.password && formData.password.length >= 12) {
      payload.password = formData.password;
    }
    updateMutation.mutate(payload, {
      onSuccess: () => {
        toast.success('사용자 정보가 수정되었습니다');
        setEditOpen(false);
      },
      onError: (err) => toast.error(err.message),
    });
  };

  const handleDelete = async () => {
    if (!deleteUserId) return;
    try {
      await deleteMutation.mutateAsync();
      toast.success('사용자가 비활성화되었습니다');
      setDeleteUserId(null);
    } catch {
      toast.error('비활성화에 실패했습니다');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          사용자 관리
        </h2>
        <Button onClick={() => setCreateOpen(true)} className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="h-4 w-4 mr-2" />
          새 사용자
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 items-center">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="이름 또는 이메일 검색"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9"
          />
        </div>
        <Select value={roleFilter} onValueChange={(v) => { setRoleFilter(v === 'all' ? '' : v); setPage(1); }}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="역할 필터" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체</SelectItem>
            <SelectItem value="superadmin">최고관리자</SelectItem>
            <SelectItem value="admin">관리자</SelectItem>
            <SelectItem value="editor">편집자</SelectItem>
            <SelectItem value="viewer">조회자</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    <th className="text-left py-3 px-4 font-medium text-slate-500">이름</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-500">이메일</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-500">역할</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-500">상태</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-500">마지막 로그인</th>
                    <th className="text-right py-3 px-4 font-medium text-slate-500">작업</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.users.map((user) => (
                    <tr key={user.id} className="border-b border-slate-100 dark:border-slate-800">
                      <td className="py-3 px-4 font-medium text-slate-900 dark:text-slate-100">
                        {user.name}
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                        {user.email}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={roleBadgeVariant[user.role] ?? 'outline'} className="text-xs">
                          {roleLabel[user.role] ?? user.role}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={user.isActive ? 'default' : 'outline'} className="text-xs">
                          {user.isActive ? '활성' : '비활성'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-slate-500 text-xs">
                        {user.lastLoginAt
                          ? formatDistanceToNow(new Date(user.lastLoginAt), { addSuffix: true, locale: ko })
                          : '-'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => openEdit(user)}
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                onClick={() => {
                                  setDeleteUserId(user.id);
                                  setDeleteUserName(user.name);
                                }}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>사용자 비활성화</AlertDialogTitle>
                                <AlertDialogDescription>
                                  &quot;{deleteUserName}&quot; 사용자를 비활성화하시겠습니까?
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel onClick={() => setDeleteUserId(null)}>취소</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                  비활성화
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {data?.users.length === 0 && (
            <div className="text-center py-12 text-slate-500">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>사용자가 없습니다</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {data && data.pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">
            전체 {data.pagination.total}명 중 {(page - 1) * 20 + 1}-{Math.min(page * 20, data.pagination.total)}명
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-slate-500 py-1">
              {page} / {data.pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= data.pagination.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>새 사용자</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmitC(onCreateSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label>이름</Label>
              <Input {...registerC('name')} />
              {errorsC.name && <p className="text-sm text-destructive">{errorsC.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>이메일</Label>
              <Input type="email" {...registerC('email')} />
              {errorsC.email && <p className="text-sm text-destructive">{errorsC.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>비밀번호</Label>
              <Input type="password" {...registerC('password')} />
              {errorsC.password && <p className="text-sm text-destructive">{errorsC.password.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>역할</Label>
              <Select
                defaultValue="editor"
                onValueChange={(v) => registerC('role').onChange({ target: { value: v } } as React.ChangeEvent<HTMLSelectElement>)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="editor">편집자</SelectItem>
                  <SelectItem value="admin">관리자</SelectItem>
                  <SelectItem value="superadmin">최고관리자</SelectItem>
                  <SelectItem value="viewer">조회자</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>취소</Button>
              <Button type="submit" disabled={createMutation.isPending} className="bg-emerald-600 hover:bg-emerald-700">
                {createMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                생성
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>사용자 편집</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmitE(onEditSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label>이름</Label>
              <Input {...registerE('name')} />
              {errorsE.name && <p className="text-sm text-destructive">{errorsE.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>이메일</Label>
              <Input type="email" {...registerE('email')} />
              {errorsE.email && <p className="text-sm text-destructive">{errorsE.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>역할</Label>
              <Select
                defaultValue={watchE('role')}
                onValueChange={(v) => registerE('role').onChange({ target: { value: v } } as React.ChangeEvent<HTMLSelectElement>)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="editor">편집자</SelectItem>
                  <SelectItem value="admin">관리자</SelectItem>
                  <SelectItem value="superadmin">최고관리자</SelectItem>
                  <SelectItem value="viewer">조회자</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-3">
              <Label htmlFor="edit-active">활성</Label>
              <input
                type="checkbox"
                id="edit-active"
                checked={isActiveWatch}
                onChange={(e) => registerE('isActive').onChange({ target: { value: e.target.checked } } as unknown as React.ChangeEvent<HTMLInputElement>)}
                className="h-4 w-4 rounded border-slate-300"
              />
            </div>
            <div className="space-y-2">
              <Label>새 비밀번호 (변경 시에만)</Label>
              <Input type="password" placeholder="8자 이상" {...registerE('password')} />
              {errorsE.password && <p className="text-sm text-destructive">{errorsE.password.message}</p>}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>취소</Button>
              <Button type="submit" disabled={updateMutation.isPending} className="bg-emerald-600 hover:bg-emerald-700">
                {updateMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                저장
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
