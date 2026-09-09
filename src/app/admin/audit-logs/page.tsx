'use client';

import { useState, Fragment } from 'react';
import { useAuditLogs } from '@/hooks/admin/use-audit-logs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ScrollText,
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { ko } from 'date-fns/locale';

const actionLabel: Record<string, string> = {
  create: '생성',
  update: '수정',
  delete: '삭제',
  login: '로그인',
  logout: '로그아웃',
  upload: '업로드',
  deactivate: '비활성화',
};

const actionVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  create: 'default',
  update: 'secondary',
  delete: 'destructive',
  login: 'outline',
  logout: 'outline',
  upload: 'default',
  deactivate: 'destructive',
};

export default function AuditLogsPage() {
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState<string>('');
  const [entityFilter, setEntityFilter] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const { data, isLoading } = useAuditLogs({
    page,
    limit: 20,
    action: actionFilter || undefined,
    entity: entityFilter || undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  });

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
        감사 로그
      </h2>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-end">
        <div className="space-y-1">
          <Label className="text-xs">액션</Label>
          <Select value={actionFilter} onValueChange={(v) => { setActionFilter(v === 'all' ? '' : v); setPage(1); }}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="전체" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              <SelectItem value="create">생성</SelectItem>
              <SelectItem value="update">수정</SelectItem>
              <SelectItem value="delete">삭제</SelectItem>
              <SelectItem value="login">로그인</SelectItem>
              <SelectItem value="logout">로그아웃</SelectItem>
              <SelectItem value="upload">업로드</SelectItem>
              <SelectItem value="deactivate">비활성화</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label className="text-xs">엔티티</Label>
          <Select value={entityFilter} onValueChange={(v) => { setEntityFilter(v === 'all' ? '' : v); setPage(1); }}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="전체" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              <SelectItem value="AdminUser">AdminUser</SelectItem>
              <SelectItem value="AdminSession">AdminSession</SelectItem>
              <SelectItem value="KioskContent">KioskContent</SelectItem>
              <SelectItem value="MeasurementItem">MeasurementItem</SelectItem>
              <SelectItem value="MeasurementEquipment">MeasurementEquipment</SelectItem>
              <SelectItem value="Image">Image</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label className="text-xs">시작일</Label>
          <Input
            type="date"
            value={startDate}
            onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
            className="w-36"
          />
        </div>

        <div className="space-y-1">
          <Label className="text-xs">종료일</Label>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
            className="w-36"
          />
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setActionFilter('');
            setEntityFilter('');
            setStartDate('');
            setEndDate('');
            setPage(1);
          }}
        >
          필터 초기화
        </Button>
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
                    <th className="w-8 py-3 px-3" />
                    <th className="text-left py-3 px-3 font-medium text-slate-500">사용자</th>
                    <th className="text-left py-3 px-3 font-medium text-slate-500">액션</th>
                    <th className="text-left py-3 px-3 font-medium text-slate-500">엔티티</th>
                    <th className="text-left py-3 px-3 font-medium text-slate-500">대상</th>
                    <th className="text-left py-3 px-3 font-medium text-slate-500">시간</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.logs.map((log) => {
                    const isExpanded = expandedRow === log.id;
                    const hasChanges = log.changes && Object.keys(log.changes).length > 0;

                    return (
                      <Fragment key={log.id}>
                        <tr
                          className="border-b border-slate-100 dark:border-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900"
                          onClick={() => setExpandedRow(isExpanded ? null : log.id)}
                        >
                          <td className="py-3 px-3">
                            {hasChanges ? (
                              isExpanded ? (
                                <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                              ) : (
                                <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                              )
                            ) : null}
                          </td>
                          <td className="py-3 px-3 text-slate-700 dark:text-slate-300">
                            {log.user?.name ?? '시스템'}
                          </td>
                          <td className="py-3 px-3">
                            <Badge variant={actionVariant[log.action] ?? 'outline'} className="text-xs">
                              {actionLabel[log.action] ?? log.action}
                            </Badge>
                          </td>
                          <td className="py-3 px-3 text-slate-600 dark:text-slate-400">
                            {log.entity}
                          </td>
                          <td className="py-3 px-3 text-slate-500 text-xs font-mono">
                            {log.entityId ? log.entityId.slice(0, 8) + '...' : '-'}
                          </td>
                          <td className="py-3 px-3 text-slate-500 text-xs">
                            {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true, locale: ko })}
                          </td>
                        </tr>
                        {isExpanded && hasChanges && (
                          <tr className="border-b border-slate-100 dark:border-slate-800">
                            <td colSpan={6} className="py-3 px-6 bg-slate-50 dark:bg-slate-900">
                              <div className="space-y-1">
                                <p className="text-xs font-medium text-slate-500 mb-2">변경 내용</p>
                                <pre className="text-xs text-slate-600 dark:text-slate-400 whitespace-pre-wrap bg-white dark:bg-slate-950 rounded-lg p-3 border border-slate-200 dark:border-slate-700 max-h-48 overflow-y-auto">
                                  {JSON.stringify(log.changes, null, 2)}
                                </pre>
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {data?.logs.length === 0 && (
            <div className="text-center py-12 text-slate-500">
              <ScrollText className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>감사 로그가 없습니다</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {data && data.pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">
            전체 {data.pagination.total}건 중 {((page - 1) * 20 + 1)}-{Math.min(page * 20, data.pagination.total)}건
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
    </div>
  );
}
