'use client';

import { useEffect, useState, useCallback } from 'react';
import { User, UserStats, WorkoutLog } from '@/lib/types';
import { getUserStats, getTopMembers, getMemberCount, getLogsPaginated } from '@/lib/store';
import { supabase } from '@/lib/supabase';

interface ProfileTabProps {
  user: User;
}

const RANKING_PAGE_SIZE = 10;

export default function ProfileTab({ user }: ProfileTabProps) {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [memberCount, setMemberCount] = useState(0);
  const [rankingLimit, setRankingLimit] = useState(RANKING_PAGE_SIZE);
  const [topMembers, setTopMembers] = useState<{ member: User; stats: UserStats }[]>([]);
  const [recentLogs, setRecentLogs] = useState<WorkoutLog[]>([]);
  const [heatmap, setHeatmap] = useState<{ date: Date; count: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [rankingLoading, setRankingLoading] = useState(false);

  useEffect(() => {
    async function load() {
      const [s, count, recent] = await Promise.all([
        getUserStats(user.id),
        getMemberCount(),
        loadRecentLogs(),
      ]);
      setStats(s);
      setMemberCount(count);
      setRecentLogs(recent);
      await loadHeatmap();
      await loadRanking(RANKING_PAGE_SIZE);
      setLoading(false);
    }

    async function loadRecentLogs(): Promise<WorkoutLog[]> {
      const { data } = await supabase
        .from('workout_logs')
        .select('*, members!inner(name, avatar), cheers(user_id)')
        .eq('user_id', user.id)
        .order('completed_at', { ascending: false })
        .limit(10);

      return (data ?? []).map((r: Record<string, unknown>) => ({
        id: r.id as string,
        userId: r.user_id as string,
        userName: ((r.members as Record<string, string>)?.name) ?? '',
        userAvatar: ((r.members as Record<string, string>)?.avatar) ?? '🧑‍💻',
        routineId: r.routine_id as string,
        routineName: r.routine_name as string,
        completedAt: r.completed_at as string,
        duration: r.duration as number,
        message: (r.message as string) ?? '',
        emoji: (r.emoji as string) ?? '🔥',
        cheers: ((r.cheers as { user_id: string }[]) ?? []).map(c => c.user_id),
      }));
    }

    async function loadHeatmap() {
      const now = new Date();
      const start = new Date(now);
      start.setDate(start.getDate() - 29);
      start.setHours(0, 0, 0, 0);

      const { data } = await supabase
        .from('workout_logs')
        .select('completed_at')
        .eq('user_id', user.id)
        .gte('completed_at', start.toISOString());

      const countMap: Record<string, number> = {};
      for (const l of data ?? []) {
        const d = new Date(l.completed_at);
        const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
        countMap[key] = (countMap[key] || 0) + 1;
      }

      const days = [];
      for (let i = 29; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
        days.push({ date: new Date(d), count: countMap[key] || 0 });
      }
      setHeatmap(days);
    }

    load();
  }, [user.id]);

  const loadRanking = useCallback(async (limit: number) => {
    setRankingLoading(true);
    const results = await getTopMembers(limit);
    setTopMembers(results);
    setRankingLimit(limit);
    setRankingLoading(false);
  }, []);

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="text-3xl mb-2 animate-bounce">👤</div>
          <p className="text-muted text-sm">프로필 로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-slide-up space-y-5">
      {/* Profile Header */}
      <div className="bg-card rounded-2xl p-6 border border-border text-center">
        <div className="text-5xl mb-2">{user.avatar}</div>
        <h2 className="text-xl font-bold">{user.name}</h2>
        <p className="text-sm text-muted">
          {new Date(user.joinedAt).toLocaleDateString('ko-KR')} 가입
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-4 gap-2">
        <MiniStat label="연속" value={`${stats.currentStreak}일`} />
        <MiniStat label="최장" value={`${stats.longestStreak}일`} />
        <MiniStat label="총 횟수" value={`${stats.totalWorkouts}`} />
        <MiniStat label="총 시간" value={`${stats.totalMinutes}분`} />
      </div>

      {/* 30-day Heatmap */}
      <div className="bg-card rounded-2xl p-5 border border-border">
        <h3 className="font-semibold mb-3">최근 30일</h3>
        <div className="grid grid-cols-10 gap-1.5">
          {heatmap.map((day, i) => (
            <div
              key={i}
              className={`w-full aspect-square rounded-sm ${
                day.count === 0
                  ? 'bg-gray-100'
                  : day.count === 1
                  ? 'bg-success/40'
                  : 'bg-success'
              }`}
              title={`${day.date.toLocaleDateString('ko-KR')}: ${day.count}회`}
            />
          ))}
        </div>
        <div className="flex items-center gap-2 mt-2 justify-end text-xs text-muted">
          <span>적음</span>
          <div className="w-3 h-3 rounded-sm bg-gray-100" />
          <div className="w-3 h-3 rounded-sm bg-success/40" />
          <div className="w-3 h-3 rounded-sm bg-success" />
          <span>많음</span>
        </div>
      </div>

      {/* Leaderboard */}
      <div className="bg-card rounded-2xl p-5 border border-border">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">멤버 랭킹 (연속 기록)</h3>
          <span className="text-xs text-muted">{memberCount}명</span>
        </div>
        <div className="space-y-2">
          {topMembers.map(({ member, stats: mStats }, i) => (
            <div
              key={member.id}
              className={`flex items-center gap-3 px-3 py-2 rounded-xl ${
                member.id === user.id ? 'bg-primary/5 border border-primary/20' : 'bg-gray-50'
              }`}
            >
              <span className="text-sm font-bold text-muted w-6 text-center shrink-0">
                {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`}
              </span>
              <span className="text-lg">{member.avatar}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-medium text-sm truncate">{member.name}</span>
                  {member.id === user.id && (
                    <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full shrink-0">나</span>
                  )}
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className="text-sm font-bold">{mStats.currentStreak}일</span>
                <span className="text-xs text-muted ml-1">연속</span>
              </div>
            </div>
          ))}
        </div>
        {rankingLimit < memberCount && (
          <button
            onClick={() => loadRanking(rankingLimit + RANKING_PAGE_SIZE)}
            disabled={rankingLoading}
            className="w-full mt-3 py-2.5 bg-gray-100 rounded-xl text-sm font-medium text-muted hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            {rankingLoading ? '로딩 중...' : `더 보기 (${rankingLimit}/${memberCount})`}
          </button>
        )}
      </div>

      {/* Recent History */}
      <div className="bg-card rounded-2xl p-5 border border-border">
        <h3 className="font-semibold mb-3">최근 운동 기록</h3>
        {recentLogs.length === 0 ? (
          <p className="text-muted text-sm text-center py-4">아직 운동 기록이 없어요</p>
        ) : (
          <div className="space-y-2">
            {recentLogs.map(log => (
              <div
                key={log.id}
                className="flex items-center justify-between py-2 border-b border-border last:border-0"
              >
                <div className="flex items-center gap-2">
                  <span>{log.emoji}</span>
                  <div>
                    <p className="text-sm font-medium">{log.routineName}</p>
                    <p className="text-xs text-muted">
                      {new Date(log.completedAt).toLocaleDateString('ko-KR', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
                <span className="text-sm text-muted">
                  {Math.floor(log.duration / 60)}분
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-card rounded-xl p-3 border border-border text-center">
      <p className="text-xs text-muted mb-0.5">{label}</p>
      <p className="text-sm font-bold">{value}</p>
    </div>
  );
}
