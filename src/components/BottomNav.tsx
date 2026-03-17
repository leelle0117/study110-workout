'use client';

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const tabs = [
  { id: 'home', label: '홈', icon: '🏠' },
  { id: 'workout', label: '운동', icon: '💪' },
  { id: 'feed', label: '피드', icon: '📱' },
  { id: 'profile', label: '프로필', icon: '👤' },
];

export default function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t border-border z-50">
      <div className="flex justify-around py-2">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-lg transition-all ${
              activeTab === tab.id
                ? 'text-primary scale-105'
                : 'text-muted hover:text-foreground'
            }`}
          >
            <span className="text-xl">{tab.icon}</span>
            <span className="text-xs font-medium">{tab.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
