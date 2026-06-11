import type { EmotionTrend, LifeEventTag, Session, UserProfile } from '@/types';

export const DEMO_PROFILE: UserProfile = {
  id: 'demo-profile',
  anonymous_name: '温暖的海浪',
  phq9_score: 11,
  gad7_score: 9,
  life_event_tags: ['职场', '家庭', '成长'],
  counseling_goals: '缓解焦虑情绪、学会情绪管理、建立稳定作息',
  risk_level: 'medium',
  created_at: '2026-06-09T08:30:00.000Z',
};

export function buildDemoEmotionTrends(profileId: string, range: '7d' | '30d' | '90d'): EmotionTrend[] {
  const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;

  return Array.from({ length: days }, (_, i) => {
    const d = new Date('2026-06-09T12:00:00.000Z');
    d.setDate(d.getDate() - days + i + 1);

    return {
      id: `demo-trend-${range}-${i}`,
      profile_id: profileId,
      record_date: d.toISOString().split('T')[0],
      phq9_score: Math.max(0, Math.min(27, Math.round(10 + Math.sin(i * 0.35) * 4 + (i % 3)))),
      gad7_score: Math.max(0, Math.min(21, Math.round(8 + Math.cos(i * 0.28) * 3 + (i % 2)))),
      dominant_emotion: i % 3 === 0 ? '焦虑' : i % 3 === 1 ? '低落' : '平静',
    };
  });
}

export function buildDemoSessions(profileId: string): Session[] {
  const tagsA: LifeEventTag[] = ['职场', '家庭'];
  const tagsB: LifeEventTag[] = ['成长', '社交'];

  return [
    {
      id: 'demo-session-1',
      profile_id: profileId,
      counselor_id: 'demo-counselor-1',
      counselor_name: '暖阳咨询师',
      counselor_tags: tagsA,
      scheduled_at: '2026-06-08T10:30:00.000Z',
      duration: 50,
      status: 'completed',
      created_at: '2026-06-07T09:00:00.000Z',
    },
    {
      id: 'demo-session-2',
      profile_id: profileId,
      counselor_id: 'demo-counselor-2',
      counselor_name: '清风咨询师',
      counselor_tags: tagsB,
      scheduled_at: '2026-06-02T15:30:00.000Z',
      duration: 50,
      status: 'completed',
      created_at: '2026-06-01T11:00:00.000Z',
    },
    {
      id: 'demo-session-3',
      profile_id: profileId,
      counselor_id: 'demo-counselor-1',
      counselor_name: '暖阳咨询师',
      counselor_tags: tagsA,
      scheduled_at: '2026-06-15T14:00:00.000Z',
      duration: 0,
      status: 'scheduled',
      created_at: '2026-06-09T09:30:00.000Z',
    },
  ];
}
