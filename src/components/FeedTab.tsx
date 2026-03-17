'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { User, WorkoutLog } from '@/lib/types';
import { getLogsPaginated, toggleCheer } from '@/lib/store';

const PAGE_SIZE = 20;

interface FeedTabProps {
  user: User;
  refreshKey: number;
}

export default function FeedTab({ user, refreshKey }: FeedTabProps) {
  const [visibleLogs, setVisibleLogs] = useState<WorkoutLog[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Load initial page
  useEffect(() => {
    setLoading(true);
    getLogsPaginated(0, PAGE_SIZE).then(result => {
      setVisibleLogs(result.logs);
      setHasMore(result.hasMore);
      setPage(0);
      setLoading(false);
    });
  }, [refreshKey]);

  const loadMore = useCallback(async () => {
    setLoadingMore(true);
    const nextPage = page + 1;
    const result = await getLogsPaginated(nextPage, PAGE_SIZE);
    setVisibleLogs(prev => [...prev, ...result.logs]);
    setHasMore(result.hasMore);
    setPage(nextPage);
    setLoadingMore(false);
  }, [page]);

  const handleCheer = useCallback(async (logId: string) => {
    const cheered = await toggleCheer(logId, user.id);
    setVisibleLogs(prev =>
      prev.map(log => {
        if (log.id !== logId) return log;
        return {
          ...log,
          cheers: cheered
            ? [...log.cheers, user.id]
            : log.cheers.filter(id => id !== user.id),
        };
      })
    );
  }, [user.id]);

  const groupedByDate = useMemo(() => {
    const groups: { date: string; logs: WorkoutLog[] }[] = [];
    let currentDate = '';
    for (const log of visibleLogs) {
      const d = new Date(log.completedAt);
      const key = d.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' });
      if (key !== currentDate) {
        currentDate = key;
        groups.push({ date: key, logs: [] });
      }
      groups[groups.length - 1].logs.push(log);
    }
    return groups;
  }, [visibleLogs]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="text-3xl mb-2 animate-bounce">📱</div>
          <p className="text-muted text-sm">피드 로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-slide-up space-y-4">
      <div>
        <h2 className="text-xl font-bold">멤버 피드</h2>
        <p className="text-muted text-sm">스터디 멤버들의 운동 기록</p>
      </div>

      {visibleLogs.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-4xl mb-3">🏃</div>
          <p className="text-muted">아직 운동 기록이 없어요</p>
          <p className="text-muted text-sm">첫 번째로 운동을 시작해보세요!</p>
        </div>
      ) : (
        <>
          {groupedByDate.map(group => (
            <div key={group.date}>
              <div className="sticky top-0 bg-background/80 backdrop-blur py-2 z-10">
                <span className="text-sm font-semibold text-muted">{group.date}</span>
              </div>
              <div className="space-y-3">
                {group.logs.map(log => (
                  <FeedCard
                    key={log.id}
                    log={log}
                    isMe={log.userId === user.id}
                    hasCheered={log.cheers.includes(user.id)}
                    onCheer={() => handleCheer(log.id)}
                  />
                ))}
              </div>
            </div>
          ))}

          {hasMore && (
            <button
              onClick={loadMore}
              disabled={loadingMore}
              className="w-full py-3 bg-gray-100 rounded-xl text-sm font-medium text-muted hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              {loadingMore ? '로딩 중...' : '더 보기'}
            </button>
          )}

          {!hasMore && (
            <p className="text-center text-xs text-muted py-3">모든 기록을 불러왔습니다</p>
          )}
        </>
      )}
    </div>
  );
}

function FeedCard({
  log,
  isMe,
  hasCheered,
  onCheer,
}: {
  log: WorkoutLog;
  isMe: boolean;
  hasCheered: boolean;
  onCheer: () => void;
}) {
  const time = new Date(log.completedAt).toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
  });
  const durationMin = Math.floor(log.duration / 60);

  return (
    <div className={`bg-card rounded-2xl p-4 border ${isMe ? 'border-primary/30 bg-primary/[0.02]' : 'border-border'}`}>
      <div className="flex items-center gap-3 mb-3">
        <span className="text-2xl">{log.userAvatar}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold truncate">{log.userName}</span>
            {isMe && <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full shrink-0">나</span>}
          </div>
          <span className="text-xs text-muted">{time}</span>
        </div>
        <span className="text-2xl">{log.emoji}</span>
      </div>

      <div className="bg-gray-50 rounded-xl px-4 py-2.5 mb-3">
        <div className="flex items-center justify-between">
          <span className="font-medium text-sm">{log.routineName}</span>
          <span className="text-xs text-muted">{durationMin}분</span>
        </div>
      </div>

      {log.message && (
        <p className="text-sm mb-3">&ldquo;{log.message}&rdquo;</p>
      )}

      <div className="flex items-center justify-between">
        <button
          onClick={onCheer}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-all active:scale-95 ${
            hasCheered
              ? 'bg-accent/10 text-accent'
              : 'bg-gray-100 text-muted hover:bg-gray-200'
          }`}
        >
          <span>👏</span>
          <span>{hasCheered ? '응원함' : '응원하기'}</span>
          {log.cheers.length > 0 && (
            <span className="font-semibold">{log.cheers.length}</span>
          )}
        </button>
      </div>
    </div>
  );
}
