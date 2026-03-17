export interface User {
  id: string;
  name: string;
  avatar: string;
  joinedAt: string;
}

export interface Exercise {
  id: string;
  name: string;
  duration: number; // seconds
  icon: string;
  description: string;
  category: 'cardio' | 'strength' | 'stretch' | 'core';
}

export interface WorkoutRoutine {
  id: string;
  name: string;
  description: string;
  totalDuration: number; // minutes
  exercises: Exercise[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

export interface WorkoutLog {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  routineId: string;
  routineName: string;
  completedAt: string;
  duration: number; // actual seconds
  message: string;
  emoji: string;
  cheers: string[]; // userIds who cheered
}

export interface UserStats {
  totalWorkouts: number;
  currentStreak: number;
  longestStreak: number;
  totalMinutes: number;
  thisWeekWorkouts: number;
}
