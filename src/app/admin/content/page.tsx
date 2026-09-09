'use client';

import { useContentList } from '@/hooks/admin/use-content';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Edit, FileText } from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

const sectionLabel: Record<string, string> = {
  'equipment-intro': '장비 소개',
  location: '위치 안내',
  'app-install': '앱 설치',
  signup: '회원가입',
  'vein-register': '지정맥 등록',
  login: '로그인 안내',
  'non-member': '비회원 안내',
  'measurement-mode': '측정 모드 안내',
  'measurement-equipment': '측정 장비 안내',
  results: '결과 확인 안내',
  completion: '완료',
  standby: '대기',
  main: '메인 메뉴',
};

export default function ContentListPage() {
  const { data: contents, isLoading } = useContentList();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          콘텐츠 관리
        </h2>
        <Badge variant="secondary">{contents?.length ?? 0}개 화면</Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {contents?.map((content) => (
          <Card key={content.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-slate-400 shrink-0" />
                  <CardTitle className="text-base">
                    {sectionLabel[content.section] ?? content.section}
                  </CardTitle>
                </div>
                <Badge variant="outline" className="text-xs shrink-0">
                  {content.sections.length} 섹션
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 mb-3">
                {content.title}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  {formatDistanceToNow(new Date(content.updatedAt), {
                    addSuffix: true,
                    locale: ko,
                  })}
                </span>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/admin/content/${content.section}`}>
                    <Edit className="h-3.5 w-3.5 mr-1" />
                    편집
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {contents?.length === 0 && (
        <div className="text-center py-12 text-slate-500">
          <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>등록된 콘텐츠가 없습니다</p>
        </div>
      )}
    </div>
  );
}
