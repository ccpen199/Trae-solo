import { create } from 'zustand';
import { FishingSpot, FishSpecies, FishingMethod, EnvironmentData, HeatmapDataPoint, FishingIndex, SocialPost, UserProfile, Achievement, DataSource, IndexModelVersion, UserBehaviorMetric, CatchRecord } from '@/types';
import { fishingSpots } from '@/data/spots';
import { fishSpecies } from '@/data/species';
import { fishingMethods } from '@/data/methods';
import { generate14DayEnvironmentData, getCurrentEnvironmentData } from '@/data/environment';
import { calculateFishingIndex, generateHeatmapData } from '@/engine/fishingIndex';
import { currentUser, socialPosts, catchRecords, achievements, dataSources, modelVersions, behaviorMetrics } from '@/data/user';

interface AppState {
  selectedSpot: FishingSpot | null;
  selectedSpecies: FishSpecies | null;
  selectedMethod: FishingMethod | null;
  spots: FishingSpot[];
  species: FishSpecies[];
  methods: FishingMethod[];
  environmentData: EnvironmentData[];
  currentEnvironment: EnvironmentData | null;
  currentIndex: FishingIndex | null;
  heatmapData: HeatmapDataPoint[];
  user: UserProfile;
  posts: SocialPost[];
  catchRecords: CatchRecord[];
  achievements: Achievement[];
  dataSources: DataSource[];
  modelVersions: IndexModelVersion[];
  userBehaviorData: UserBehaviorMetric[];
  theme: 'light' | 'dark';
  currentPage: string;
  
  setSelectedSpot: (spot: FishingSpot) => void;
  setSelectedSpecies: (species: FishSpecies) => void;
  setSelectedMethod: (method: FishingMethod) => void;
  recalculateIndex: () => void;
  toggleTheme: () => void;
  setCurrentPage: (page: string) => void;
  toggleLike: (postId: string) => void;
  toggleBookmark: (postId: string) => void;
}

export const useAppStore = create<AppState>((set, get) => {
  const envCache = new Map<string, { envData: EnvironmentData[]; currentEnv: EnvironmentData }>();
  const calcCache = new Map<string, { currentIdx: FishingIndex; heatmap: HeatmapDataPoint[] }>();
  
  const getEnvCacheKey = (spotId: string, isSea: boolean) => `${spotId}|${isSea}|${new Date().toDateString()}`;
  const getCalcCacheKey = (spotId: string, speciesId: string, methodId: string) => `${spotId}|${speciesId}|${methodId}`;
  
  const getCachedEnvData = (spotId: string, isSea: boolean) => {
    const key = getEnvCacheKey(spotId, isSea);
    let cached = envCache.get(key);
    if (!cached) {
      const envData = generate14DayEnvironmentData(spotId, new Date(), isSea);
      const currentEnv = getCurrentEnvironmentData(spotId, isSea);
      cached = { envData, currentEnv };
      envCache.set(key, cached);
    }
    return cached;
  };
  
  const getCachedCalcData = (
    spotId: string,
    speciesId: string,
    methodId: string,
    envData: EnvironmentData[],
    currentEnv: EnvironmentData,
    species: FishSpecies,
    method: FishingMethod,
    spot: FishingSpot
  ) => {
    const key = getCalcCacheKey(spotId, speciesId, methodId);
    let cached = calcCache.get(key);
    if (!cached) {
      const currentIdx = calculateFishingIndex(currentEnv, species, method, { avgDepth: spot.avgDepth, maxDepth: spot.maxDepth });
      const heatmap = generateHeatmapData(envData, species, method);
      cached = { currentIdx, heatmap };
      calcCache.set(key, cached);
    }
    return cached;
  };

  const initialSpot = fishingSpots[0];
  const initialSpecies = fishSpecies[0];
  const initialMethod = fishingMethods[0];
  const initialEnv = getCachedEnvData(initialSpot.id, initialSpot.waterType === 'sea');
  const initialCalc = getCachedCalcData(
    initialSpot.id, initialSpecies.id, initialMethod.id,
    initialEnv.envData, initialEnv.currentEnv, initialSpecies, initialMethod, initialSpot
  );
  
  return {
    selectedSpot: initialSpot,
    selectedSpecies: initialSpecies,
    selectedMethod: initialMethod,
    spots: fishingSpots,
    species: fishSpecies,
    methods: fishingMethods,
    environmentData: initialEnv.envData,
    currentEnvironment: initialEnv.currentEnv,
    currentIndex: initialCalc.currentIdx,
    heatmapData: initialCalc.heatmap,
    user: currentUser,
    posts: socialPosts,
    catchRecords,
    achievements,
    dataSources,
    modelVersions,
    userBehaviorData: behaviorMetrics,
    theme: 'dark',
    currentPage: 'dashboard',
    
    setSelectedSpot: (spot: FishingSpot) => {
      const { selectedSpecies, selectedMethod } = get();
      const env = getCachedEnvData(spot.id, spot.waterType === 'sea');
      const calc = getCachedCalcData(
        spot.id, selectedSpecies!.id, selectedMethod!.id,
        env.envData, env.currentEnv, selectedSpecies!, selectedMethod!, spot
      );
      
      set({
        selectedSpot: spot,
        environmentData: env.envData,
        currentEnvironment: env.currentEnv,
        currentIndex: calc.currentIdx,
        heatmapData: calc.heatmap,
      });
    },
    
    setSelectedSpecies: (species: FishSpecies) => {
      const { selectedSpot, selectedMethod, environmentData, currentEnvironment } = get();
      const calc = getCachedCalcData(
        selectedSpot!.id, species.id, selectedMethod!.id,
        environmentData, currentEnvironment!, species, selectedMethod!, selectedSpot!
      );
      
      set({
        selectedSpecies: species,
        currentIndex: calc.currentIdx,
        heatmapData: calc.heatmap,
      });
    },
    
    setSelectedMethod: (method: FishingMethod) => {
      const { selectedSpot, selectedSpecies, environmentData, currentEnvironment } = get();
      const calc = getCachedCalcData(
        selectedSpot!.id, selectedSpecies!.id, method.id,
        environmentData, currentEnvironment!, selectedSpecies!, method, selectedSpot!
      );
      
      set({
        selectedMethod: method,
        currentIndex: calc.currentIdx,
        heatmapData: calc.heatmap,
      });
    },
    
    recalculateIndex: () => {
      const { selectedSpot, selectedSpecies, selectedMethod } = get();
      if (selectedSpot && selectedSpecies && selectedMethod) {
        const env = getCachedEnvData(selectedSpot.id, selectedSpot.waterType === 'sea');
        const calc = getCachedCalcData(
          selectedSpot.id, selectedSpecies.id, selectedMethod.id,
          env.envData, env.currentEnv, selectedSpecies, selectedMethod, selectedSpot
        );
        
        set({
          environmentData: env.envData,
          currentEnvironment: env.currentEnv,
          currentIndex: calc.currentIdx,
          heatmapData: calc.heatmap,
        });
      }
    },
    
    toggleTheme: () => {
      const { theme } = get();
      set({ theme: theme === 'light' ? 'dark' : 'light' });
    },
    
    setCurrentPage: (page: string) => {
      set({ currentPage: page });
    },
    
    toggleLike: (postId: string) => {
      const { posts } = get();
      const updatedPosts = posts.map(post => {
        if (post.id === postId) {
          return {
            ...post,
            isLiked: !post.isLiked,
            likes: post.isLiked ? post.likes - 1 : post.likes + 1,
          };
        }
        return post;
      });
      set({ posts: updatedPosts });
    },
    
    toggleBookmark: (postId: string) => {
      const { posts } = get();
      const updatedPosts = posts.map(post => {
        if (post.id === postId) {
          return {
            ...post,
            isBookmarked: !post.isBookmarked,
          };
        }
        return post;
      });
      set({ posts: updatedPosts });
    },
  };
});
