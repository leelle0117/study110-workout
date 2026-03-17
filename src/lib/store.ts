import { supabase, GROUP_CODE } from './supabase';
import { User, WorkoutLog, UserStats } from './types';

const LOCAL_USER_KEY = 'study110_user';

// ─── User / Auth ────────────────────────────────────────

export function getLocalUser(): User | null {
  if (typeof window === 'undefined') return null;
  const data = localStorage.getItem(LOCAL_USER_KEY);
  return data ? JSON.parse(data) : null;
}

export function setLocalUser(user: User): void {
  localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(user));
}

export function clearLocalUser(): void {
  localStorage.removeItem(LOCAL_USER_KEY);
}

/** Join with group code. Returns the user or null if code is wrong. */
export async function joinGroup(
  name: string,
  avatar: string,
  code: string
): Promise<User | null> {
  if (code !== GROUP_CODE) return null;

  // Check if name already exists in this group
  const { data: existing } = await supabase
    .from('members')
    .select('*')
    .eq('group_code', GROUP_CODE)
    .eq('name', name)
    .single();

  if (existing) {
    // Return existing member (re-login)
    const user: User = {
      id: existing.id,
      name: existing.name,
      avatar: existing.avatar,
      joinedAt: existing.joined_at,
    };
    setLocalUser(user);
    return user;
  }

  // Create new member
  const { data, error } = await supabase
    .from('members')
    .insert({ name, avatar, group_code: GROUP_CODE })
    .select()
    .single();

  if (error || !data) return null;

  const user: User = {
    id: data.id,
    name: data.name,
    avatar: data.avatar,
    joinedAt: data.joined_at,
  };
  setLocalUser(user);
  return user;
}

// ─── Members ────────────────────────────────────────────

export async function getMembers(): Promise<User[]> {
  const { data } = await supabase
    .from('members')
    .select('*')
    .eq('group_code', GROUP_CODE)
    .order('joined_at', { ascending: true });

  return (data ?? []).map(m => ({
    id: m.id,
    name: m.name,
    avatar: m.avatar,
    joinedAt: m.joined_at,
  }));
}

export async function getMemberCount(): Promise<number> {
  const { count } = await supabase
    .from('members')
    .select('*', { count: 'exact', head: true })
    .eq('group_code', GROUP_CODE);

  return count ?? 0;
}

// ─── Workout Logs ───────────────────────────────────────

interface LogRow {
  id: string;
  user_id: string;
  routine_id: string;
  routine_name: string;
  completed_at: string;
  duration: number;
  message: string;
  emoji: string;
  members: { name: string; avatar: string };
  cheers: { user_id: string }[];
}

function rowToLog(row: LogRow): WorkoutLog {
  return {
    id: row.id,
    userId: row.user_id,
    userName: row.members?.name ?? '',
    userAvatar: row.members?.avatar ?? '🧑‍💻',
    routineId: row.routine_id,
    routineName: row.routine_name,
    completedAt: row.completed_at,
    duration: row.duration,
    message: row.message ?? '',
    emoji: row.emoji ?? '🔥',
    cheers: (row.cheers ?? []).map(c => c.user_id),
  };
}

const LOG_SELECT = `*, members!inner(name, avatar), cheers(user_id)`;

export async function getLogsPaginated(
  page: number,
  pageSize: number
): Promise<{ logs: WorkoutLog[]; hasMore: boolean }> {
  const from = page * pageSize;
  const to = from + pageSize - 1;

  const { data, count } = await supabase
    .from('workout_logs')
    .select(LOG_SELECT, { count: 'exact' })
    .order('completed_at', { ascending: false })
    .range(from, to);

  return {
    logs: (data ?? []).map(r => rowToLog(r as unknown as LogRow)),
    hasMore: (count ?? 0) > to + 1,
  };
}

export async function addLog(params: {
  userId: string;
  routineId: string;
  routineName: string;
  duration: number;
  message: string;
  emoji: string;
}): Promise<WorkoutLog | null> {
  const { data, error } = await supabase
    .from('workout_logs')
    .insert({
      user_id: params.userId,
      routine_id: params.routineId,
      routine_name: params.routineName,
      duration: params.duration,
      message: params.message,
      emoji: params.emoji,
    })
    .select(LOG_SELECT)
    .single();

  if (error || !data) return null;
  return rowToLog(data as unknown as LogRow);
}

// ─── Cheers ─────────────────────────────────────────────

export async function toggleCheer(logId: string, userId: string): Promise<boolean> {
  // Check if already cheered
  const { data: existing } = await supabase
    .from('cheers')
    .select('id')
    .eq('log_id', logId)
    .eq('user_id', userId)
    .single();

  if (existing) {
    await supabase.from('cheers').delete().eq('id', existing.id);
    return false; // uncheered
  } else {
    await supabase.from('cheers').insert({ log_id: logId, user_id: userId });
    return true; // cheered
  }
}

export async function getCheerCount(logId: string): Promise<number> {
  const { count } = await supabase
    .from('cheers')
    .select('*', { count: 'exact', head: true })
    .eq('log_id', logId);
  return count ?? 0;
}

// ─── Today's Data ───────────────────────────────────────

export async function getTodayCompletions(): Promise<{ logs: WorkoutLog[]; total: number }> {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const { data, count } = await supabase
    .from('workout_logs')
    .select(LOG_SELECT, { count: 'exact' })
    .gte('completed_at', todayStart.toISOString())
    .order('completed_at', { ascending: false });

  return {
    logs: (data ?? []).map(r => rowToLog(r as unknown as LogRow)),
    total: count ?? 0,
  };
}

export async function hasCompletedToday(userId: string): Promise<boolean> {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const { count } = await supabase
    .from('workout_logs')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('completed_at', todayStart.toISOString());

  return (count ?? 0) > 0;
}

// ─── Stats ──────────────────────────────────────────────

export async function getUserStats(userId: string): Promise<UserStats> {
  const { data: logs } = await supabase
    .from('workout_logs')
    .select('completed_at, duration')
    .eq('user_id', userId)
    .order('completed_at', { ascending: false });

  const allLogs = logs ?? [];
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  // Build day set
  const daySet = new Set(
    allLogs.map(l => {
      const d = new Date(l.completed_at);
      return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    })
  );

  // Calculate streak
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;

  for (let i = 0; i < 365; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    if (daySet.has(key)) {
      tempStreak++;
      if (i === 0 || tempStreak > 1 || currentStreak > 0) {
        currentStreak = tempStreak;
      }
      longestStreak = Math.max(longestStreak, tempStreak);
    } else {
      if (i === 0) continue;
      if (currentStreak === 0) currentStreak = tempStreak;
      tempStreak = 0;
    }
  }

  return {
    totalWorkouts: allLogs.length,
    currentStreak,
    longestStreak,
    totalMinutes: Math.round(allLogs.reduce((sum, l) => sum + l.duration, 0) / 60),
    thisWeekWorkouts: allLogs.filter(l => new Date(l.completed_at) >= startOfWeek).length,
  };
}

/** Get top N members sorted by streak */
export async function getTopMembers(
  limit: number
): Promise<{ member: User; stats: UserStats }[]> {
  const members = await getMembers();

  // Compute stats in parallel
  const results = await Promise.all(
    members.map(async m => ({
      member: m,
      stats: await getUserStats(m.id),
    }))
  );

  results.sort((a, b) => b.stats.currentStreak - a.stats.currentStreak);
  return results.slice(0, limit);
}
