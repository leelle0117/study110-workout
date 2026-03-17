'use client';

import { useState } from 'react';
import { User } from '@/lib/types';
import { joinGroup } from '@/lib/store';

const avatars = ['🧑‍💻', '👩‍🎓', '🧑‍🔬', '👩‍💼', '🧑‍🎨', '👨‍🏫', '👩‍⚕️', '🧑‍🚀', '🦸', '🦹', '🧙', '🐱'];

interface OnboardingModalProps {
  onComplete: (user: User) => void;
}

export default function OnboardingModal({ onComplete }: OnboardingModalProps) {
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('🧑‍💻');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim() || !code.trim()) return;
    setError('');
    setLoading(true);

    const user = await joinGroup(name.trim(), avatar, code.trim().toLowerCase());

    if (!user) {
      setError('참여 코드가 올바르지 않습니다');
      setLoading(false);
      return;
    }

    onComplete(user);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-8 w-full max-w-sm animate-slide-up">
        <h2 className="text-2xl font-bold text-center mb-1">AI Study 110</h2>
        <p className="text-lg font-semibold text-center text-primary mb-6">
          우리 같이 운동해요!
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">참여 코드</label>
            <input
              type="text"
              value={code}
              onChange={e => { setCode(e.target.value); setError(''); }}
              placeholder="스터디 참여 코드를 입력하세요"
              className="w-full px-4 py-3 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">닉네임</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="이름을 입력하세요"
              className="w-full px-4 py-3 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              maxLength={10}
            />
            <p className="text-xs text-muted mt-1">같은 닉네임으로 다시 접속할 수 있어요</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">아바타</label>
            <div className="grid grid-cols-6 gap-2">
              {avatars.map(a => (
                <button
                  key={a}
                  onClick={() => setAvatar(a)}
                  className={`text-2xl p-2 rounded-xl transition-all ${
                    avatar === a
                      ? 'bg-primary/10 ring-2 ring-primary scale-110'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={!name.trim() || !code.trim() || loading}
            className="w-full py-3.5 bg-primary text-white rounded-xl font-semibold hover:bg-primary-light transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? '접속 중...' : '시작하기'}
          </button>
        </div>
      </div>
    </div>
  );
}
