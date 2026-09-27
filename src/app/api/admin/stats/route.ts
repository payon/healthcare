import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/admin/middleware';
import { db } from '@/lib/db';

// GET /api/admin/stats - Dashboard stats (admin-only: exposes session/user aggregates)
export const GET = withAuth('audit:read', async (_request, _context, _auth) => {
  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Session counts
    const [
      totalSessions,
      todaySessions,
      weekSessions,
      activeAdminSessions,
    ] = await Promise.all([
      db.kioskSession.count(),
      db.kioskSession.count({
        where: { startedAt: { gte: todayStart } },
      }),
      db.kioskSession.count({
        where: { startedAt: { gte: weekAgo } },
      }),
      db.adminSession.count({
        where: { expiresAt: { gt: now } },
      }),
    ]);

    // Completion rate (sessions with endedAt)
    const completedSessions = await db.kioskSession.count({
      where: { endedAt: { not: null } },
    });
    const completionRate = totalSessions > 0
      ? Math.round((completedSessions / totalSessions) * 100)
      : 0;

    // Screen visits (from KioskLog, group by screen)
    const screenLogs = await db.kioskLog.findMany({
      where: {
        eventType: 'navigate',
        createdAt: { gte: weekAgo },
        screen: { not: null },
      },
      select: { screen: true },
    });

    const screenVisits: Record<string, number> = {};
    for (const log of screenLogs) {
      if (log.screen) {
        screenVisits[log.screen] = (screenVisits[log.screen] ?? 0) + 1;
      }
    }

    // Recent changes (audit logs in last 7 days)
    const recentChanges = await db.auditLog.findMany({
      where: { createdAt: { gte: weekAgo } },
      select: {
        id: true,
        userId: true,
        action: true,
        entity: true,
        entityId: true,
        createdAt: true,
        user: {
          select: { name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    // Content stats
    const contentCount = await db.kioskContent.count();
    const measurementCount = await db.measurementItem.count({
      where: { isActive: true },
    });

    // Active users
    const activeUsers = await db.adminUser.count({
      where: { isActive: true },
    });

    // Today logs by type
    const todayLogs = await db.kioskLog.findMany({
      where: { createdAt: { gte: todayStart } },
      select: { eventType: true },
    });

    const logTypeCounts: Record<string, number> = {};
    for (const log of todayLogs) {
      logTypeCounts[log.eventType] = (logTypeCounts[log.eventType] ?? 0) + 1;
    }

    // Average session duration
    const completedSessionData = await db.kioskSession.findMany({
      where: {
        endedAt: { not: null },
        startedAt: { gte: monthAgo },
      },
      select: { startedAt: true, endedAt: true },
    });

    let avgDurationMs = 0;
    if (completedSessionData.length > 0) {
      const totalDuration = completedSessionData.reduce((sum, s) => {
        return sum + ((s.endedAt?.getTime() ?? 0) - s.startedAt.getTime());
      }, 0);
      avgDurationMs = Math.round(totalDuration / completedSessionData.length);
    }

    return NextResponse.json({
      sessions: {
        total: totalSessions,
        today: todaySessions,
        week: weekSessions,
        completionRate,
        avgDurationMs,
      },
      content: {
        screens: contentCount,
        measurements: measurementCount,
      },
      admin: {
        activeUsers,
        activeSessions: activeAdminSessions,
      },
      screenVisits,
      recentChanges,
      todayLogs: logTypeCounts,
    });
  } catch (error) {
    console.error('Get stats error:', error);
    return NextResponse.json(
      { error: '통계를 가져오는 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
});
