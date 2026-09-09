'use client';

import { useAdminStats } from '@/hooks/admin/use-stats';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Activity,
  CheckCircle2,
  Clock,
  FileText,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

function formatDuration(ms: number): string {
  if (ms === 0) return '0분';
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  if (minutes === 0) return `${seconds}초`;
  return `${minutes}분 ${seconds}초`;
}

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

export default function AdminDashboardPage() {
  const { data: stats, isLoading } = useAdminStats();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-40 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!stats) return null;

  const statCards = [
    {
      title: '오늘 세션 수',
      value: stats.sessions.today.toLocaleString(),
      icon: Activity,
      description: `이번 주 ${stats.sessions.week}건`,
    },
    {
      title: '완료율',
      value: `${stats.sessions.completionRate}%`,
      icon: CheckCircle2,
      description: `전체 ${stats.sessions.total}건 중`,
    },
    {
      title: '평균 체류 시간',
      value: formatDuration(stats.sessions.avgDurationMs),
      icon: Clock,
      description: '최근 30일 기준',
    },
    {
      title: '최근 변경 수',
      value: stats.recentChanges.length.toLocaleString(),
      icon: FileText,
      description: `활성 관리자 ${stats.admin.activeUsers}명`,
    },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">대시보드</h2>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  {card.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-slate-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {card.value}
                </div>
                <p className="text-xs text-slate-500 mt-1">{card.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent changes table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">최근 변경 사항</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.recentChanges.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-8">
              최근 변경 사항이 없습니다
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    <th className="text-left py-2 px-3 font-medium text-slate-500">사용자</th>
                    <th className="text-left py-2 px-3 font-medium text-slate-500">액션</th>
                    <th className="text-left py-2 px-3 font-medium text-slate-500">엔티티</th>
                    <th className="text-left py-2 px-3 font-medium text-slate-500">시간</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentChanges.slice(0, 10).map((change) => (
                    <tr
                      key={change.id}
                      className="border-b border-slate-100 dark:border-slate-800"
                    >
                      <td className="py-2 px-3 text-slate-700 dark:text-slate-300">
                        {change.user?.name ?? '시스템'}
                      </td>
                      <td className="py-2 px-3">
                        <Badge variant={actionVariant[change.action] ?? 'outline'} className="text-xs">
                          {actionLabel[change.action] ?? change.action}
                        </Badge>
                      </td>
                      <td className="py-2 px-3 text-slate-600 dark:text-slate-400">
                        {change.entity}
                      </td>
                      <td className="py-2 px-3 text-slate-500 text-xs">
                        {formatDistanceToNow(new Date(change.createdAt), {
                          addSuffix: true,
                          locale: ko,
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Screen visits */}
      {Object.keys(stats.screenVisits).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">화면 방문 통계 (최근 7일)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {Object.entries(stats.screenVisits)
                .sort(([, a], [, b]) => b - a)
                .map(([screen, count]) => (
                  <div
                    key={screen}
                    className="flex items-center justify-between rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2"
                  >
                    <span className="text-sm text-slate-600 dark:text-slate-400 truncate">
                      {screen}
                    </span>
                    <Badge variant="secondary" className="ml-2 text-xs shrink-0">
                      {count}
                    </Badge>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
