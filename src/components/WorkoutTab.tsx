'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { WorkoutRoutine, Exercise, User } from '@/lib/types';
import { routines } from '@/lib/exercises';
import { addLog } from '@/lib/store';

interface WorkoutTabProps {
  user: User;
  onComplete: () => void;
}

type Phase = 'select' | 'ready' | 'exercise' | 'rest' | 'complete';

export default function WorkoutTab({ user, onComplete }: WorkoutTabProps) {
  const [phase, setPhase] = useState<Phase>('select');
  const [selectedRoutine, setSelectedRoutine] = useState<WorkoutRoutine | null>(null);
  const [exerciseIndex, setExerciseIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [totalElapsed, setTotalElapsed] = useState(0);
  const [message, setMessage] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('🔥');
  const [saving, setSaving] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentExercise: Exercise | null =
    selectedRoutine && exerciseIndex < selectedRoutine.exercises.length
      ? selectedRoutine.exercises[exerciseIndex]
      : null;

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startExercise = useCallback((routine: WorkoutRoutine) => {
    setSelectedRoutine(routine);
    setExerciseIndex(0);
    setTotalElapsed(0);
    setPhase('ready');
    setTimeLeft(3);
  }, []);

  // Timer logic
  useEffect(() => {
    if (phase === 'ready' || phase === 'exercise' || phase === 'rest') {
      clearTimer();
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearTimer();
            if (phase === 'ready') {
              setPhase('exercise');
              return currentExercise?.duration ?? 30;
            }
            if (phase === 'exercise') {
              if (selectedRoutine && exerciseIndex < selectedRoutine.exercises.length - 1) {
                setExerciseIndex(i => i + 1);
                setPhase('rest');
                return 10;
              }
              setPhase('complete');
              return 0;
            }
            if (phase === 'rest') {
              setPhase('exercise');
              const nextEx = selectedRoutine?.exercises[exerciseIndex + 1];
              return nextEx?.duration ?? 30;
            }
            return 0;
          }
          return prev - 1;
        });
        if (phase === 'exercise') {
          setTotalElapsed(e => e + 1);
        }
      }, 1000);
    }
    return clearTimer;
  }, [phase, exerciseIndex, currentExercise, selectedRoutine, clearTimer]);

  const handleSave = async () => {
    if (!selectedRoutine || saving) return;
    setSaving(true);

    await addLog({
      userId: user.id,
      routineId: selectedRoutine.id,
      routineName: selectedRoutine.name,
      duration: totalElapsed,
      message: message || '오늘도 운동 완료!',
      emoji: selectedEmoji,
    });

    setSaving(false);
    setPhase('select');
    setSelectedRoutine(null);
    onComplete();
  };

  // Select routine
  if (phase === 'select') {
    return (
      <div className="animate-slide-up space-y-4">
        <h2 className="text-xl font-bold">운동 루틴 선택</h2>
        <p className="text-muted text-sm">오늘의 컨디션에 맞는 루틴을 골라보세요</p>
        {routines.map(routine => (
          <button
            key={routine.id}
            onClick={() => startExercise(routine)}
            className="w-full bg-card rounded-2xl p-5 border border-border text-left hover:border-primary/40 hover:shadow-md transition-all active:scale-[0.99]"
          >
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-bold text-lg">{routine.name}</h3>
              <DifficultyBadge difficulty={routine.difficulty} />
            </div>
            <p className="text-sm text-muted mb-3">{routine.description}</p>
            <div className="flex items-center gap-4 text-sm">
              <span className="flex items-center gap-1">
                <span>⏱️</span> {routine.totalDuration}분
              </span>
              <span className="flex items-center gap-1">
                <span>🏋️</span> {routine.exercises.length}개 동작
              </span>
            </div>
            <div className="flex gap-1 mt-3">
              {routine.exercises.map(ex => (
                <span key={ex.id} className="text-lg" title={ex.name}>{ex.icon}</span>
              ))}
            </div>
          </button>
        ))}
      </div>
    );
  }

  // Countdown
  if (phase === 'ready') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] animate-slide-up">
        <p className="text-muted mb-4">준비하세요!</p>
        <div className="relative">
          <div className="w-32 h-32 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-6xl font-bold text-primary animate-count-bounce">{timeLeft}</span>
          </div>
          <div className="absolute inset-0 w-32 h-32 rounded-full border-4 border-primary animate-pulse-ring" />
        </div>
        <p className="mt-6 text-lg font-semibold">
          다음: {currentExercise?.icon} {currentExercise?.name}
        </p>
      </div>
    );
  }

  // Exercise in progress
  if (phase === 'exercise' && currentExercise) {
    const progress = currentExercise.duration > 0
      ? ((currentExercise.duration - timeLeft) / currentExercise.duration) * 100
      : 0;

    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] animate-slide-up">
        <div className="text-sm text-muted mb-1">
          {exerciseIndex + 1} / {selectedRoutine?.exercises.length}
        </div>
        <p className="text-5xl mb-2">{currentExercise.icon}</p>
        <h3 className="text-2xl font-bold mb-1">{currentExercise.name}</h3>
        <p className="text-sm text-muted mb-6">{currentExercise.description}</p>

        <div className="relative w-44 h-44 mb-6">
          <svg className="w-44 h-44 -rotate-90" viewBox="0 0 176 176">
            <circle cx="88" cy="88" r="80" fill="none" stroke="#e2e8f0" strokeWidth="8" />
            <circle
              cx="88" cy="88" r="80" fill="none"
              stroke="#6366f1" strokeWidth="8" strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 80}
              strokeDashoffset={2 * Math.PI * 80 * (1 - progress / 100)}
              className="timer-circle"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-4xl font-bold">{timeLeft}s</span>
          </div>
        </div>

        <button
          onClick={() => {
            clearTimer();
            if (selectedRoutine && exerciseIndex < selectedRoutine.exercises.length - 1) {
              setExerciseIndex(i => i + 1);
              setPhase('rest');
              setTimeLeft(10);
            } else {
              setPhase('complete');
            }
          }}
          className="text-muted text-sm underline"
        >
          건너뛰기
        </button>
      </div>
    );
  }

  // Rest between exercises
  if (phase === 'rest') {
    const nextEx = selectedRoutine?.exercises[exerciseIndex];
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] animate-slide-up">
        <p className="text-success font-semibold mb-2">잘했어요!</p>
        <div className="w-24 h-24 rounded-full bg-success/10 flex items-center justify-center mb-4">
          <span className="text-3xl font-bold text-success">{timeLeft}s</span>
        </div>
        <p className="text-muted text-sm mb-2">잠시 휴식</p>
        <p className="text-lg font-semibold">
          다음: {nextEx?.icon} {nextEx?.name}
        </p>
      </div>
    );
  }

  // Complete
  if (phase === 'complete') {
    const emojis = ['🔥', '💪', '⭐', '🎯', '✅', '🏆', '👏', '😤'];
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] animate-slide-up">
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-2xl font-bold mb-2">운동 완료!</h2>
        <p className="text-muted mb-1">{selectedRoutine?.name}</p>
        <p className="text-lg font-semibold text-primary mb-6">
          {Math.floor(totalElapsed / 60)}분 {totalElapsed % 60}초
        </p>

        <div className="w-full max-w-xs space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">오늘의 한마디</label>
            <input
              type="text"
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="운동 소감을 남겨보세요!"
              className="w-full px-4 py-3 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary/30"
              maxLength={50}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">기분 이모지</label>
            <div className="flex gap-2 flex-wrap">
              {emojis.map(e => (
                <button
                  key={e}
                  onClick={() => setSelectedEmoji(e)}
                  className={`text-2xl p-2 rounded-lg transition-all ${
                    selectedEmoji === e ? 'bg-primary/10 ring-2 ring-primary' : 'hover:bg-gray-100'
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-3.5 bg-primary text-white rounded-xl font-semibold hover:bg-primary-light transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {saving ? '저장 중...' : '인증 공유하기'}
          </button>
        </div>
      </div>
    );
  }

  return null;
}

function DifficultyBadge({ difficulty }: { difficulty: string }) {
  const styles = {
    beginner: 'bg-green-100 text-green-700',
    intermediate: 'bg-amber-100 text-amber-700',
    advanced: 'bg-red-100 text-red-700',
  };
  const labels = {
    beginner: '초급',
    intermediate: '중급',
    advanced: '고급',
  };
  return (
    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${styles[difficulty as keyof typeof styles]}`}>
      {labels[difficulty as keyof typeof labels]}
    </span>
  );
}
