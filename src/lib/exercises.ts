import { Exercise, WorkoutRoutine } from './types';

export const exercises: Exercise[] = [
  // Cardio
  { id: 'jumping-jacks', name: '점핑잭', duration: 30, icon: '⭐', description: '팔과 다리를 동시에 벌리며 점프', category: 'cardio' },
  { id: 'high-knees', name: '하이니즈', duration: 30, icon: '🦵', description: '무릎을 높이 올리며 제자리 달리기', category: 'cardio' },
  { id: 'burpees', name: '버피', duration: 30, icon: '💥', description: '스쿼트-플랭크-점프 반복', category: 'cardio' },
  { id: 'mountain-climbers', name: '마운틴클라이머', duration: 30, icon: '🏔️', description: '플랭크 자세에서 무릎 교차 당기기', category: 'cardio' },
  { id: 'jump-rope', name: '줄넘기 동작', duration: 45, icon: '🪢', description: '줄 없이 줄넘기 동작 수행', category: 'cardio' },

  // Strength
  { id: 'pushups', name: '푸쉬업', duration: 30, icon: '💪', description: '가슴과 팔 근력 운동', category: 'strength' },
  { id: 'squats', name: '스쿼트', duration: 30, icon: '🏋️', description: '하체 근력의 기본', category: 'strength' },
  { id: 'lunges', name: '런지', duration: 30, icon: '🦿', description: '한 발씩 앞으로 내딛기', category: 'strength' },
  { id: 'wall-sit', name: '월싯', duration: 30, icon: '🧱', description: '벽에 기대어 앉은 자세 유지', category: 'strength' },
  { id: 'tricep-dips', name: '트라이셉딥스', duration: 30, icon: '🪑', description: '의자를 이용한 삼두근 운동', category: 'strength' },

  // Core
  { id: 'plank', name: '플랭크', duration: 30, icon: '🧘', description: '코어 안정성 운동의 기본', category: 'core' },
  { id: 'crunches', name: '크런치', duration: 30, icon: '🔥', description: '복부 상부 집중 운동', category: 'core' },
  { id: 'bicycle-crunch', name: '바이시클크런치', duration: 30, icon: '🚴', description: '교차하며 복부 전체 자극', category: 'core' },
  { id: 'leg-raises', name: '레그레이즈', duration: 30, icon: '🦶', description: '누워서 다리 들어올리기', category: 'core' },
  { id: 'russian-twist', name: '러시안트위스트', duration: 30, icon: '🌀', description: '앉아서 상체 비틀기', category: 'core' },

  // Stretch
  { id: 'neck-stretch', name: '목 스트레칭', duration: 20, icon: '🙆', description: '좌우 목 늘리기', category: 'stretch' },
  { id: 'shoulder-stretch', name: '어깨 스트레칭', duration: 20, icon: '🤸', description: '어깨 돌리기 및 늘리기', category: 'stretch' },
  { id: 'hamstring-stretch', name: '햄스트링 스트레칭', duration: 20, icon: '🧎', description: '앞으로 숙여 뒷다리 늘리기', category: 'stretch' },
  { id: 'hip-opener', name: '고관절 스트레칭', duration: 20, icon: '🦋', description: '나비자세로 고관절 풀기', category: 'stretch' },
  { id: 'cat-cow', name: '캣카우', duration: 20, icon: '🐱', description: '네발 자세에서 등 굽히고 펴기', category: 'stretch' },
];

export const routines: WorkoutRoutine[] = [
  {
    id: 'morning-boost',
    name: '모닝 부스트',
    description: '하루를 활기차게 시작하는 10분 루틴',
    totalDuration: 10,
    difficulty: 'beginner',
    exercises: [
      exercises[0],  // 점핑잭
      exercises[5],  // 푸쉬업
      exercises[7],  // 스쿼트
      exercises[10], // 플랭크
      exercises[1],  // 하이니즈
      exercises[11], // 크런치
      exercises[15], // 목 스트레칭
      exercises[16], // 어깨 스트레칭
    ],
  },
  {
    id: 'desk-break',
    name: '공부 중 리프레시',
    description: '책상 앞에서 지친 몸을 풀어주는 10분',
    totalDuration: 10,
    difficulty: 'beginner',
    exercises: [
      exercises[15], // 목 스트레칭
      exercises[16], // 어깨 스트레칭
      exercises[0],  // 점핑잭
      exercises[7],  // 스쿼트
      exercises[8],  // 월싯
      exercises[17], // 햄스트링
      exercises[18], // 고관절
      exercises[19], // 캣카우
    ],
  },
  {
    id: 'full-body-burn',
    name: '전신 불태우기',
    description: '전신을 자극하는 15분 중급 루틴',
    totalDuration: 15,
    difficulty: 'intermediate',
    exercises: [
      exercises[0],  // 점핑잭
      exercises[2],  // 버피
      exercises[5],  // 푸쉬업
      exercises[7],  // 스쿼트
      exercises[6],  // 런지
      exercises[3],  // 마운틴클라이머
      exercises[10], // 플랭크
      exercises[12], // 바이시클크런치
      exercises[14], // 러시안트위스트
      exercises[17], // 햄스트링
    ],
  },
  {
    id: 'core-crusher',
    name: '코어 집중',
    description: '복근과 코어를 탄탄하게! 12분',
    totalDuration: 12,
    difficulty: 'intermediate',
    exercises: [
      exercises[0],  // 점핑잭 (웜업)
      exercises[10], // 플랭크
      exercises[11], // 크런치
      exercises[12], // 바이시클크런치
      exercises[13], // 레그레이즈
      exercises[14], // 러시안트위스트
      exercises[3],  // 마운틴클라이머
      exercises[19], // 캣카우
    ],
  },
  {
    id: 'hiit-blast',
    name: 'HIIT 블래스트',
    description: '고강도 인터벌로 칼로리 소모! 15분',
    totalDuration: 15,
    difficulty: 'advanced',
    exercises: [
      exercises[1],  // 하이니즈
      exercises[2],  // 버피
      exercises[3],  // 마운틴클라이머
      exercises[4],  // 줄넘기
      exercises[5],  // 푸쉬업
      exercises[7],  // 스쿼트
      exercises[6],  // 런지
      exercises[9],  // 트라이셉딥스
      exercises[10], // 플랭크
      exercises[16], // 어깨 스트레칭
    ],
  },
];
