'use client';

import { useState, useEffect, useCallback } from 'react';
import { User, UserStats, WorkoutLog } from '@/lib/types';
import { getUserStats, hasCompletedToday, getMemberCount, getTodayCompletions } from '@/lib/store';

interface HomeTabProps {
  user: User;
  onStartWorkout: () => void;
}

export default function HomeTab({ user, onStartWorkout }: HomeTabProps) {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [completedToday, setCompletedToday] = useState(false);
  const [memberCount, setMemberCount] = useState(0);
  const [todayLogs, setTodayLogs] = useState<WorkoutLog[]>([]);
  const [todayTotal, setTodayTotal] = useState(0);
  const [showAllToday, setShowAllToday] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    const [s, done, count, today] = await Promise.all([
      getUserStats(user.id),
      hasCompletedToday(user.id),
      getMemberCount(),
      getTodayCompletions(),
    ]);
    setStats(s);
    setCompletedToday(done);
    setMemberCount(count);
    setTodayLogs(today.logs);
    setTodayTotal(today.total);
    setLoading(false);
  }, [user.id]);

  useEffect(() => { loadData(); }, [loadData]);

  // Weekly days from user stats logs
  const [weekDays, setWeekDays] = useState<{ label: string; done: boolean; isToday: boolean }[]>([]);

  useEffect(() => {
    // Build weekly view from today's completions check
    // We need per-day data, so fetch from supabase
    async function loadWeek() {
      const { supabase } = await import('@/lib/supabase');
      const now = new Date();
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - 6);
      weekStart.setHours(0, 0, 0, 0);

      const { data } = await supabase
        .from('workout_logs')
        .select('completed_at')
        .eq('user_id', user.id)
        .gte('completed_at', weekStart.toISOString());

      const logDays = new Set(
        (data ?? []).map(l => {
          const d = new Date(l.completed_at);
          return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
        })
      );

      const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
      const days = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const dayStr = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
        days.push({
          label: dayNames[d.getDay()],
          done: logDays.has(dayStr),
          isToday: i === 0,
        });
      }
      setWeekDays(days);
    }
    loadWeek();
  }, [user.id]);

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="text-3xl mb-2 animate-bounce">💪</div>
          <p className="text-muted text-sm">로딩 중...</p>
        </div>
      </div>
    );
  }

  const visibleToday = showAllToday ? todayLogs : todayLogs.slice(0, 12);

  return (
    <div className="animate-slide-up space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">안녕하세요, {user.name}님!</h1>
          <p className="text-muted text-sm mt-0.5">오늘도 건강한 하루 보내세요</p>
        </div>
        <span className="text-4xl">{user.avatar}</span>
      </div>

      {/* Today's Status */}
      <div className={`rounded-2xl p-5 ${completedToday ? 'bg-success/10 border border-success/30' : 'bg-primary/5 border border-primary/20'}`}>
        <div className="flex items-center gap-3">
          <div className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl ${completedToday ? 'bg-success/20' : 'bg-primary/10'}`}>
            {completedToday ? '✅' : '🎯'}
          </div>
          <div className="flex-1">
            <p className="font-semibold text-lg">
              {completedToday ? '오늘 운동 완료!' : '오늘의 운동을 시작하세요'}
            </p>
            <p className="text-sm text-muted">
              {completedToday ? '대단해요! 내일도 화이팅!' : '10분이면 충분해요'}
            </p>
          </div>
        </div>
        {!completedToday && (
          <button
            onClick={onStartWorkout}
            className="w-full mt-4 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary-light transition-all active:scale-[0.98]"
          >
            운동 시작하기
          </button>
        )}
      </div>

      {/* Weekly Progress */}
      {weekDays.length > 0 && (
        <div className="bg-card rounded-2xl p-5 border border-border">
          <h3 className="font-semibold mb-3">이번 주 현황</h3>
          <div className="flex justify-between">
            {weekDays.map((day, i) => (
              <div key={i} className="flex flex-col items-center gap-1.5">
                <span className={`text-xs ${day.isToday ? 'font-bold text-primary' : 'text-muted'}`}>
                  {day.label}
                </span>
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-sm ${
                    day.done
                      ? 'bg-success text-white'
                      : day.isToday
                      ? 'border-2 border-primary bg-primary/5'
                      : 'bg-gray-100'
                  }`}
                >
                  {day.done ? '✓' : ''}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard icon="🔥" label="연속 기록" value={`${stats.currentStreak}일`} />
        <StatCard icon="🏆" label="최장 기록" value={`${stats.longestStreak}일`} />
        <StatCard icon="📊" label="총 운동" value={`${stats.totalWorkouts}회`} />
        <StatCard icon="⏱️" label="총 시간" value={`${stats.totalMinutes}분`} />
      </div>

      {/* Today's Activity */}
      <div className="bg-card rounded-2xl p-5 border border-border">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">오늘 운동한 멤버</h3>
          <span className="text-sm font-bold text-primary">
            {todayTotal}/{memberCount}명
          </span>
        </div>

        <div className="w-full h-2 bg-gray-100 rounded-full mb-3 overflow-hidden">
          <div
            className="h-full bg-success rounded-full transition-all"
            style={{ width: `${memberCount > 0 ? (todayTotal / memberCount) * 100 : 0}%` }}
          />
        </div>

        {todayTotal === 0 ? (
          <p className="text-muted text-sm text-center py-3">아직 아무도 운동하지 않았어요</p>
        ) : (
          <>
            <div className="flex flex-wrap gap-1.5">
              {visibleToday.map(log => (
                <div
                  key={log.id}
                  className="flex items-center gap-1 bg-gray-50 rounded-full px-2.5 py-1"
                >
                  <span className="text-sm">{log.userAvatar}</span>
                  <span className="text-xs font-medium">{log.userName}</span>
                </div>
              ))}
            </div>
            {todayTotal > 12 && (
              <button
                onClick={() => setShowAllToday(prev => !prev)}
                className="w-full mt-2 text-sm text-primary font-medium py-1.5"
              >
                {showAllToday ? '접기' : `+${todayTotal - 12}명 더보기`}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="bg-card rounded-xl p-4 border border-border">
      <div className="flex items-center gap-2 mb-1">
        <span>{icon}</span>
        <span className="text-xs text-muted">{label}</span>
      </div>
      <p className="text-xl font-bold">{value}</p>
    </div>
  );
}
