import { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback } from 'react';
import { companies, jobs, jobSeekers } from '../data/mockData';
import { Video, Job, Company, JobSeeker } from '../types';

interface UserPreferences {
  industryInterests: string[];
  salaryRange: string;
  commutePreference: 'walk' | 'bike' | 'bus' | null;
  preferredLocations: string[];
}

interface InteractionState {
  likedVideos: string[];
  bookmarkedVideos: string[];
  watchedVideos: string[];
  completedVideos: string[];
  sharedVideos: string[];
  viewedJobs: string[];
  appliedJobs: string[];
  followedCompanies: string[];
  viewedSeekers: string[];
}

interface UserActivity {
  videoId: string;
  action: 'like' | 'bookmark' | 'watch' | 'complete' | 'share';
  timestamp: number;
}

interface AppState {
  preferences: UserPreferences;
  interactions: InteractionState;
  activityHistory: UserActivity[];
  toggleLikeVideo: (videoId: string) => boolean;
  toggleBookmarkVideo: (videoId: string) => boolean;
  markVideoWatched: (videoId: string) => void;
  markVideoCompleted: (videoId: string) => void;
  shareVideo: (videoId: string) => void;
  toggleFollowCompany: (companyId: string) => boolean;
  viewJob: (jobId: string) => void;
  addIndustryInterest: (industry: string) => void;
  removeIndustryInterest: (industry: string) => void;
  setSalaryRange: (range: string) => void;
  setCommutePreference: (pref: 'walk' | 'bike' | 'bus' | null) => void;
  getRecommendedVideos: () => Array<Video & { companyId: string; companyName: string; companyLogo: string; score: number }>;
  getRecommendedJobs: () => Array<Job & { score: number }>;
  getDiscoveryVideos: () => Array<Video & { companyId: string; companyName: string; companyLogo: string }>;
  isVideoLiked: (videoId: string) => boolean;
  isVideoBookmarked: (videoId: string) => boolean;
  isCompanyFollowed: (companyId: string) => boolean;
}

const AppContext = createContext<AppState | null>(null);

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};

const STORAGE_KEY = 'zhiying_app_state';

const defaultPreferences: UserPreferences = {
  industryInterests: [],
  salaryRange: '全部',
  commutePreference: null,
  preferredLocations: [],
};

const defaultInteractions: InteractionState = {
  likedVideos: [],
  bookmarkedVideos: [],
  watchedVideos: [],
  completedVideos: [],
  sharedVideos: [],
  viewedJobs: [],
  appliedJobs: [],
  followedCompanies: [],
  viewedSeekers: [],
};

const loadFromStorage = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch {}
  return null;
};

const saveToStorage = (state: { preferences: UserPreferences; interactions: InteractionState; activityHistory: UserActivity[] }) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
};

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const saved = loadFromStorage();

  const [preferences, setPreferences] = useState<UserPreferences>(saved?.preferences || defaultPreferences);
  const [interactions, setInteractions] = useState<InteractionState>(saved?.interactions || defaultInteractions);
  const [activityHistory, setActivityHistory] = useState<UserActivity[]>(saved?.activityHistory || []);

  useEffect(() => {
    saveToStorage({ preferences, interactions, activityHistory });
  }, [preferences, interactions, activityHistory]);

  const addActivity = useCallback((videoId: string, action: UserActivity['action']) => {
    setActivityHistory(prev => [
      { videoId, action, timestamp: Date.now() },
      ...prev.slice(0, 499),
    ]);
  }, []);

  const toggleLikeVideo = useCallback((videoId: string) => {
    let liked = false;
    setInteractions(prev => {
      const isLiked = prev.likedVideos.includes(videoId);
      liked = !isLiked;
      return {
        ...prev,
        likedVideos: isLiked
          ? prev.likedVideos.filter(id => id !== videoId)
          : [...prev.likedVideos, videoId],
      };
    });
    if (liked) addActivity(videoId, 'like');
    return liked;
  }, [addActivity]);

  const toggleBookmarkVideo = useCallback((videoId: string) => {
    let bookmarked = false;
    setInteractions(prev => {
      const isBookmarked = prev.bookmarkedVideos.includes(videoId);
      bookmarked = !isBookmarked;
      return {
        ...prev,
        bookmarkedVideos: isBookmarked
          ? prev.bookmarkedVideos.filter(id => id !== videoId)
          : [...prev.bookmarkedVideos, videoId],
      };
    });
    if (bookmarked) addActivity(videoId, 'bookmark');
    return bookmarked;
  }, [addActivity]);

  const markVideoWatched = useCallback((videoId: string) => {
    setInteractions(prev =>
      prev.watchedVideos.includes(videoId)
        ? prev
        : { ...prev, watchedVideos: [...prev.watchedVideos, videoId] }
    );
    addActivity(videoId, 'watch');
  }, [addActivity]);

  const markVideoCompleted = useCallback((videoId: string) => {
    setInteractions(prev =>
      prev.completedVideos.includes(videoId)
        ? prev
        : { ...prev, completedVideos: [...prev.completedVideos, videoId] }
    );
    addActivity(videoId, 'complete');
  }, [addActivity]);

  const shareVideo = useCallback((videoId: string) => {
    setInteractions(prev =>
      prev.sharedVideos.includes(videoId)
        ? prev
        : { ...prev, sharedVideos: [...prev.sharedVideos, videoId] }
    );
    addActivity(videoId, 'share');
  }, [addActivity]);

  const toggleFollowCompany = useCallback((companyId: string) => {
    let followed = false;
    setInteractions(prev => {
      const isFollowed = prev.followedCompanies.includes(companyId);
      followed = !isFollowed;
      return {
        ...prev,
        followedCompanies: isFollowed
          ? prev.followedCompanies.filter(id => id !== companyId)
          : [...prev.followedCompanies, companyId],
      };
    });
    return followed;
  }, []);

  const viewJob = useCallback((jobId: string) => {
    setInteractions(prev =>
      prev.viewedJobs.includes(jobId)
        ? prev
        : { ...prev, viewedJobs: [...prev.viewedJobs, jobId] }
    );
  }, []);

  const addIndustryInterest = useCallback((industry: string) => {
    setPreferences(prev =>
      prev.industryInterests.includes(industry)
        ? prev
        : { ...prev, industryInterests: [...prev.industryInterests, industry] }
    );
  }, []);

  const removeIndustryInterest = useCallback((industry: string) => {
    setPreferences(prev => ({
      ...prev,
      industryInterests: prev.industryInterests.filter(i => i !== industry),
    }));
  }, []);

  const setSalaryRange = useCallback((range: string) => {
    setPreferences(prev => ({ ...prev, salaryRange: range }));
  }, []);

  const setCommutePreference = useCallback((pref: 'walk' | 'bike' | 'bus' | null) => {
    setPreferences(prev => ({ ...prev, commutePreference: pref }));
  }, []);

  const allVideosWithCompany = useMemo(() => {
    return companies.flatMap(company =>
      company.videos.map(video => ({
        ...video,
        companyId: company.id,
        companyName: company.name,
        companyLogo: company.logo,
        companyIndustry: company.industry,
        companyLocation: company.location,
      }))
    );
  }, []);

  const calculateVideoScore = useCallback((video: typeof allVideosWithCompany[0]): number => {
    let score = 0;

    const industryMatch = preferences.industryInterests.some(interest =>
      video.companyIndustry.includes(interest) || interest.includes(video.companyIndustry) ||
      video.tags.some(tag => tag.includes(interest) || interest.includes(tag)) ||
      video.aiKeywords?.some(kw => kw.includes(interest) || interest.includes(kw))
    );
    if (industryMatch) score += 30;

    if (interactions.likedVideos.includes(video.id)) score += 15;
    if (interactions.bookmarkedVideos.includes(video.id)) score += 20;
    if (interactions.completedVideos.includes(video.id)) score += 25;
    if (interactions.watchedVideos.includes(video.id)) score += 5;
    if (interactions.sharedVideos.includes(video.id)) score += 18;

    if (interactions.followedCompanies.includes(video.companyId)) score += 25;

    score += Math.log10(video.views + 1) * 3;
    score += Math.log10(video.likes + 1) * 2;

    if (preferences.preferredLocations.length > 0) {
      const locMatch = preferences.preferredLocations.some(loc => video.companyLocation.includes(loc));
      if (locMatch) score += 15;
    }

    score += Math.random() * 8;

    return score;
  }, [preferences, interactions]);

  const getRecommendedVideos = useCallback(() => {
    const scored = allVideosWithCompany.map(v => ({
      ...v,
      score: calculateVideoScore(v),
    }));

    scored.sort((a, b) => b.score - a.score);

    return scored;
  }, [allVideosWithCompany, calculateVideoScore]);

  const calculateJobScore = useCallback((job: Job): number => {
    let score = 0;

    if (preferences.industryInterests.length > 0) {
      const industryMatch = preferences.industryInterests.some(interest =>
        job.tags.some(tag => tag.includes(interest) || interest.includes(tag)) ||
        job.title.includes(interest)
      );
      if (industryMatch) score += 25;
    }

    if (preferences.salaryRange !== '全部') {
      const parseRange = (range: string): [number, number] | null => {
        if (range === '5k以下') return [0, 5000];
        if (range === '5k-10k') return [5000, 10000];
        if (range === '10k-20k') return [10000, 20000];
        if (range === '20k-30k') return [20000, 30000];
        if (range === '30k以上') return [30000, Infinity];
        return null;
      };
      const range = parseRange(preferences.salaryRange);
      if (range) {
        const [min, max] = range;
        if (job.salaryMax >= min && job.salaryMin <= max) score += 30;
      }
    }

    if (preferences.preferredLocations.length > 0) {
      const locMatch = preferences.preferredLocations.some(loc => job.location.includes(loc));
      if (locMatch) score += 20;
    }

    if (interactions.viewedJobs.includes(job.id)) score -= 5;

    score += Math.log10(job.applications + 1) * 2;
    if (job.videoId) score += 10;
    if (job.verified) score += 8;

    score += Math.random() * 5;
    return score;
  }, [preferences, interactions]);

  const getRecommendedJobs = useCallback(() => {
    const scored = jobs.map(j => ({
      ...j,
      score: calculateJobScore(j),
    }));
    scored.sort((a, b) => b.score - a.score);
    return scored;
  }, [calculateJobScore]);

  const getDiscoveryVideos = useCallback(() => {
    const seen = new Set([
      ...interactions.watchedVideos,
      ...interactions.likedVideos,
      ...interactions.bookmarkedVideos,
    ]);

    let discoveryPool = allVideosWithCompany.filter(v => !seen.has(v.id));

    if (discoveryPool.length < 6) {
      discoveryPool = allVideosWithCompany;
    }

    const byIndustry: Record<string, typeof discoveryPool> = {};
    discoveryPool.forEach(v => {
      const industry = v.companyIndustry;
      if (!byIndustry[industry]) byIndustry[industry] = [];
      byIndustry[industry].push(v);
    });

    const result: typeof discoveryPool = [];
    const industries = Object.keys(byIndustry);
    let index = 0;
    while (result.length < Math.min(12, discoveryPool.length)) {
      const industry = industries[index % industries.length];
      if (byIndustry[industry] && byIndustry[industry].length > 0) {
        const pick = byIndustry[industry].shift()!;
        if (!result.find(r => r.id === pick.id)) {
          result.push(pick);
        }
      }
      index++;
      if (index > industries.length * 5) break;
    }

    return result.sort(() => Math.random() - 0.5);
  }, [allVideosWithCompany, interactions]);

  const isVideoLiked = useCallback((videoId: string) => {
    return interactions.likedVideos.includes(videoId);
  }, [interactions.likedVideos]);

  const isVideoBookmarked = useCallback((videoId: string) => {
    return interactions.bookmarkedVideos.includes(videoId);
  }, [interactions.bookmarkedVideos]);

  const isCompanyFollowed = useCallback((companyId: string) => {
    return interactions.followedCompanies.includes(companyId);
  }, [interactions.followedCompanies]);

  return (
    <AppContext.Provider
      value={{
        preferences,
        interactions,
        activityHistory,
        toggleLikeVideo,
        toggleBookmarkVideo,
        markVideoWatched,
        markVideoCompleted,
        shareVideo,
        toggleFollowCompany,
        viewJob,
        addIndustryInterest,
        removeIndustryInterest,
        setSalaryRange,
        setCommutePreference,
        getRecommendedVideos,
        getRecommendedJobs,
        getDiscoveryVideos,
        isVideoLiked,
        isVideoBookmarked,
        isCompanyFollowed,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
