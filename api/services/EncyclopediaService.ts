import type {
  EncyclopediaEntry,
  Interview,
} from '../../shared/types/index.js';
import { encyclopediaEntries } from '../data/mockData.js';

export class EncyclopediaService {
  static getJobs(params: { keyword?: string; category?: string; page?: number; pageSize?: number } = {}) {
    const { keyword = '', category, page = 1, pageSize = 20 } = params;
    let entries = encyclopediaEntries.filter(e => {
      const matchKw = !keyword || e.jobName.includes(keyword) || e.overview.includes(keyword);
      const matchCat = !category || e.category === category;
      return matchKw && matchCat;
    });
    const total = entries.length;
    const start = (page - 1) * pageSize;
    const data = entries.slice(start, start + pageSize);
    return { data, total, page, pageSize };
  }

  static getJobDetail(jobId: string): EncyclopediaEntry | undefined {
    return encyclopediaEntries.find(e => e.jobId === jobId);
  }

  static getInterviews(params: { jobId?: string; page?: number; pageSize?: number } = {}) {
    const { jobId, page = 1, pageSize = 20 } = params;
    let interviews: (Interview & { jobId: string; jobName: string })[] = [];
    encyclopediaEntries.forEach(e => {
      if (jobId && e.jobId !== jobId) return;
      e.interviews.forEach(iv => interviews.push({ ...iv, jobId: e.jobId, jobName: e.jobName }));
    });
    const total = interviews.length;
    const start = (page - 1) * pageSize;
    const data = interviews.slice(start, start + pageSize);
    return { data, total, page, pageSize };
  }

  static getCategories(): { id: string; name: string; count: number }[] {
    const map = new Map<string, number>();
    encyclopediaEntries.forEach(e => {
      map.set(e.category, (map.get(e.category) || 0) + 1);
    });
    return Array.from(map.entries()).map(([name, count], i) => ({ id: `cat-${i}`, name, count }));
  }
}
