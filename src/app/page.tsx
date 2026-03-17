'use client';

import { useState, useEffect } from 'react';
import { User } from '@/lib/types';
import { getLocalUser } from '@/lib/store';
import BottomNav from '@/components/BottomNav';
import OnboardingModal from '@/components/OnboardingModal';
import HomeTab from '@/components/HomeTab';
import WorkoutTab from '@/components/WorkoutTab';
import FeedTab from '@/components/FeedTab';
import ProfileTab from '@/components/ProfileTab';

export default function Home() {
  const [user, setUserState] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('home');
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    setUserState(getLocalUser());
    setLoading(false);
  }, []);

  const handleWorkoutComplete = () => {
    setRefreshKey(k => k + 1);
    setActiveTab('feed');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-5xl mb-4 animate-bounce">💪</div>
          <p className="text-muted">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <OnboardingModal onComplete={u => setUserState(u)} />;
  }

  return (
    <div className="pb-24 pt-6 px-4">
      {activeTab === 'home' && (
        <HomeTab
          key={refreshKey}
          user={user}
          onStartWorkout={() => setActiveTab('workout')}
        />
      )}
      {activeTab === 'workout' && (
        <WorkoutTab user={user} onComplete={handleWorkoutComplete} />
      )}
      {activeTab === 'feed' && (
        <FeedTab user={user} refreshKey={refreshKey} />
      )}
      {activeTab === 'profile' && (
        <ProfileTab user={user} />
      )}
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}
