import type {
  TalentPoolEntry,
  PotentialLevel,
  FollowUpReminder,
  FollowUpType,
} from '../../shared/types/index.js';
import { talentPoolEntries, followUpReminders } from '../data/mockData.js';

export class TalentPoolService {
  static getList(params: {
    keyword?: string;
    potential?: PotentialLevel | 'all';
    status?: TalentPoolEntry['status'] | 'all';
    page?: number;
    pageSize?: number;
  } = {}) {
    const { keyword = '', potential = 'all', status = 'all', page = 1, pageSize = 20 } = params;
    let list = talentPoolEntries.filter(t => {
      const matchKw = !keyword || t.userSummary.name.includes(keyword) || t.userSummary.keySkills.some(s => s.includes(keyword));
      const matchPotential = potential === 'all' || t.potentialLevel === potential;
      const matchStatus = status === 'all' || t.status === status;
      return matchKw && matchPotential && matchStatus;
    });
    const total = list.length;
    const start = (page - 1) * pageSize;
    const data = list.slice(start, start + pageSize);
    return { data, total, page, pageSize };
  }

  static getById(talentId: string): TalentPoolEntry | undefined {
    return talentPoolEntries.find(t => t.id === talentId);
  }

  static tagPotential(talentId: string, level: PotentialLevel): TalentPoolEntry | null {
    const talent = talentPoolEntries.find(t => t.id === talentId);
    if (!talent) return null;
    talent.potentialLevel = level;
    return talent;
  }

  static createFollowUp(params: {
    talentId: string;
    scheduledAt: string;
    type: FollowUpType;
    note: string;
  }): FollowUpReminder {
    const reminder: FollowUpReminder = {
      id: `fu-${Date.now()}`,
      talentId: params.talentId,
      scheduledAt: params.scheduledAt,
      type: params.type,
      note: params.note,
      completed: false,
    };
    followUpReminders.push(reminder);
    const talent = talentPoolEntries.find(t => t.id === params.talentId);
    if (talent) talent.nextFollowUpAt = params.scheduledAt;
    return reminder;
  }

  static getFollowUps(talentId?: string): FollowUpReminder[] {
    if (!talentId) return followUpReminders;
    return followUpReminders.filter(f => f.talentId === talentId);
  }

  static getDashboardStats() {
    const total = talentPoolEntries.length;
    const byStatus = talentPoolEntries.reduce((acc, t) => {
      acc[t.status] = (acc[t.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const byPotential = talentPoolEntries.reduce((acc, t) => {
      acc[t.potentialLevel] = (acc[t.potentialLevel] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const avgMatch = Math.round(
      (talentPoolEntries.reduce((s, t) => s + t.userSummary.matchScore, 0) / total) * 10
    ) / 10;
    const pendingFollowUps = followUpReminders.filter(f => !f.completed).length;
    const addedThisMonth = talentPoolEntries.filter(t =>
      new Date(t.addedAt) > new Date(Date.now() - 30 * 86400000)
    ).length;
    return {
      total,
      byStatus,
      byPotential,
      avgMatch,
      pendingFollowUps,
      addedThisMonth,
      matchDistribution: {
        '90+': talentPoolEntries.filter(t => t.userSummary.matchScore >= 90).length,
        '80-89': talentPoolEntries.filter(t => t.userSummary.matchScore >= 80 && t.userSummary.matchScore < 90).length,
        '70-79': talentPoolEntries.filter(t => t.userSummary.matchScore >= 70 && t.userSummary.matchScore < 80).length,
        '60-69': talentPoolEntries.filter(t => t.userSummary.matchScore >= 60 && t.userSummary.matchScore < 70).length,
        '<60': talentPoolEntries.filter(t => t.userSummary.matchScore < 60).length,
      },
    };
  }
}
