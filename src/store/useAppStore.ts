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
  const initialSpot = fishingSpots[0];
  const initialSpecies = fishSpecies[0];
  const initialMethod = fishingMethods[0];
  const envData = generate14DayEnvironmentData(initialSpot.id, new Date(), initialSpot.waterType === 'sea');
  const currentEnv = getCurrentEnvironmentData(initialSpot.id, initialSpot.waterType === 'sea');
  const currentIdx = calculateFishingIndex(currentEnv, initialSpecies, initialMethod);
  const heatmap = generateHeatmapData(envData, initialSpecies, initialMethod);
  
  return {
    selectedSpot: initialSpot,
    selectedSpecies: initialSpecies,
    selectedMethod: initialMethod,
    spots: fishingSpots,
    species: fishSpecies,
    methods: fishingMethods,
    environmentData: envData,
    currentEnvironment: currentEnv,
    currentIndex: currentIdx,
    heatmapData: heatmap,
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
      const envData = generate14DayEnvironmentData(spot.id, new Date(), spot.waterType === 'sea');
      const currentEnv = getCurrentEnvironmentData(spot.id, spot.waterType === 'sea');
      const currentIdx = calculateFishingIndex(currentEnv, selectedSpecies!, selectedMethod!);
      const heatmap = generateHeatmapData(envData, selectedSpecies!, selectedMethod!);
      
      set({
        selectedSpot: spot,
        environmentData: envData,
        currentEnvironment: currentEnv,
        currentIndex: currentIdx,
        heatmapData: heatmap,
      });
    },
    
    setSelectedSpecies: (species: FishSpecies) => {
      const { selectedSpot, selectedMethod, environmentData } = get();
      const currentEnv = getCurrentEnvironmentData(selectedSpot!.id, selectedSpot!.waterType === 'sea');
      const currentIdx = calculateFishingIndex(currentEnv, species, selectedMethod!);
      const heatmap = generateHeatmapData(environmentData, species, selectedMethod!);
      
      set({
        selectedSpecies: species,
        currentIndex: currentIdx,
        heatmapData: heatmap,
      });
    },
    
    setSelectedMethod: (method: FishingMethod) => {
      const { selectedSpot, selectedSpecies, environmentData } = get();
      const currentEnv = getCurrentEnvironmentData(selectedSpot!.id, selectedSpot!.waterType === 'sea');
      const currentIdx = calculateFishingIndex(currentEnv, selectedSpecies!, method);
      const heatmap = generateHeatmapData(environmentData, selectedSpecies!, method);
      
      set({
        selectedMethod: method,
        currentIndex: currentIdx,
        heatmapData: heatmap,
      });
    },
    
    recalculateIndex: () => {
      const { selectedSpot, selectedSpecies, selectedMethod } = get();
      if (selectedSpot && selectedSpecies && selectedMethod) {
        const envData = generate14DayEnvironmentData(selectedSpot.id, new Date(), selectedSpot.waterType === 'sea');
        const currentEnv = getCurrentEnvironmentData(selectedSpot.id, selectedSpot.waterType === 'sea');
        const currentIdx = calculateFishingIndex(currentEnv, selectedSpecies, selectedMethod);
        const heatmap = generateHeatmapData(envData, selectedSpecies, selectedMethod);
        
        set({
          environmentData: envData,
          currentEnvironment: currentEnv,
          currentIndex: currentIdx,
          heatmapData: heatmap,
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
