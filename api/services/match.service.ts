import type { MatchResult } from '@shared/types';
import { mockMatchResults, mockJobs, mockTalents, calculateMatchScore } from '@shared/mock/data';

export class MatchService {
  static async matchJobToTalents(jobId: string): Promise<MatchResult[]> {
    await new Promise(resolve => setTimeout(resolve, 400));

    const existingMatches = mockMatchResults.filter(m => m.jobId === jobId);

    if (existingMatches.length > 0) {
      return existingMatches.sort((a, b) => b.overallScore - a.overallScore);
    }

    const job = mockJobs.find(j => j.id === jobId);
    if (!job) return [];

    const newMatches: MatchResult[] = mockTalents.map(talent => calculateMatchScore(job, talent));
    return newMatches.sort((a, b) => b.overallScore - a.overallScore);
  }

  static async matchTalentToJobs(talentId: string): Promise<MatchResult[]> {
    await new Promise(resolve => setTimeout(resolve, 400));

    const existingMatches = mockMatchResults.filter(m => m.talentId === talentId);

    if (existingMatches.length > 0) {
      return existingMatches.sort((a, b) => b.overallScore - a.overallScore);
    }

    const talent = mockTalents.find(t => t.id === talentId);
    if (!talent) return [];

    const newMatches: MatchResult[] = mockJobs.map(job => calculateMatchScore(job, talent));
    return newMatches.sort((a, b) => b.overallScore - a.overallScore);
  }

  static async getMatchDetail(jobId: string, talentId: string): Promise<MatchResult | null> {
    await new Promise(resolve => setTimeout(resolve, 200));

    const match = mockMatchResults.find(m => m.jobId === jobId && m.talentId === talentId);

    if (match) {
      return match;
    }

    const job = mockJobs.find(j => j.id === jobId);
    const talent = mockTalents.find(t => t.id === talentId);

    if (!job || !talent) return null;

    return calculateMatchScore(job, talent);
  }

  static async calculateMatch(jobId: string, talentId: string): Promise<MatchResult | null> {
    await new Promise(resolve => setTimeout(resolve, 500));

    const job = mockJobs.find(j => j.id === jobId);
    const talent = mockTalents.find(t => t.id === talentId);

    if (!job || !talent) return null;

    const result = calculateMatchScore(job, talent);

    const existingIndex = mockMatchResults.findIndex(
      m => m.jobId === jobId && m.talentId === talentId
    );

    if (existingIndex >= 0) {
      mockMatchResults[existingIndex] = result;
    } else {
      mockMatchResults.push(result);
    }

    return result;
  }
}
