import { create } from 'zustand';
import type { Circle, Activity, User } from '../types';
import { mockCircles } from '../data/mockCircles';
import { mockActivities } from '../data/mockActivities';
import { mockUsers } from '../data/mockUsers';
import { getStorage, setStorage } from '../utils/storage';

const getCurrentUser = (): User => {
  const stored = getStorage<{ user: User | null }>('user_store', { user: null });
  return stored.user || mockUsers[0];
};

const updateUserPoints = (amount: number): void => {
  const stored = getStorage<{ user: User | null; token: string | null }>('user_store', { user: null, token: null });
  if (!stored.user) return;
  const updatedUser = {
    ...stored.user,
    points: stored.user.points + amount,
  };
  setStorage('user_store', { user: updatedUser, token: stored.token });
};

interface CircleStoreState {
  circles: Circle[];
  currentCircle: Circle | null;
  activities: Activity[];
  currentActivity: Activity | null;
}

interface CircleStoreActions {
  fetchCircles: (category?: string) => Promise<void>;
  fetchCircleById: (id: string) => Promise<Circle | null>;
  joinCircle: (circleId: string) => Promise<boolean>;
  leaveCircle: (circleId: string) => Promise<boolean>;
  fetchActivities: (circleId?: string) => Promise<void>;
  publishActivity: (data: Partial<Activity>) => Promise<Activity>;
  registerActivity: (activityId: string) => Promise<boolean>;
  unregisterActivity: (activityId: string) => Promise<boolean>;
  updateParticipantStatus: (activityId: string, userId: string, status: 'registered' | 'checked_in' | 'cancelled') => Promise<boolean>;
}

type CircleStore = CircleStoreState & CircleStoreActions;

export const useCircleStore = create<CircleStore>((set, get) => ({
  circles: [],
  currentCircle: null,
  activities: [],
  currentActivity: null,

  fetchCircles: async (category?: string): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 400));

    let filtered = [...mockCircles];
    if (category) {
      filtered = filtered.filter(c => c.category === category);
    }

    set({ circles: filtered });
  },

  fetchCircleById: async (id: string): Promise<Circle | null> => {
    await new Promise(resolve => setTimeout(resolve, 300));

    const circle = mockCircles.find(c => c.id === id) || null;
    set({ currentCircle: circle });
    return circle;
  },

  joinCircle: async (circleId: string): Promise<boolean> => {
    await new Promise(resolve => setTimeout(resolve, 300));

    let success = false;

    set(state => {
      const circles = state.circles.map(c => {
        if (c.id === circleId && !c.isJoined) {
          success = true;
          return {
            ...c,
            isJoined: true,
            memberCount: c.memberCount + 1,
          };
        }
        return c;
      });

      const currentCircle = state.currentCircle?.id === circleId && !state.currentCircle.isJoined
        ? {
            ...state.currentCircle,
            isJoined: true,
            memberCount: state.currentCircle.memberCount + 1,
          }
        : state.currentCircle;

      return { circles, currentCircle };
    });

    return success;
  },

  leaveCircle: async (circleId: string): Promise<boolean> => {
    await new Promise(resolve => setTimeout(resolve, 300));

    let success = false;

    set(state => {
      const circles = state.circles.map(c => {
        if (c.id === circleId && c.isJoined) {
          success = true;
          return {
            ...c,
            isJoined: false,
            memberCount: c.memberCount - 1,
          };
        }
        return c;
      });

      const currentCircle = state.currentCircle?.id === circleId && state.currentCircle.isJoined
        ? {
            ...state.currentCircle,
            isJoined: false,
            memberCount: state.currentCircle.memberCount - 1,
          }
        : state.currentCircle;

      return { circles, currentCircle };
    });

    return success;
  },

  fetchActivities: async (circleId?: string): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 400));

    let filtered = [...mockActivities];
    if (circleId) {
      filtered = filtered.filter(a => a.circleId === circleId);
    }

    set({ activities: filtered });
  },

  publishActivity: async (data: Partial<Activity>): Promise<Activity> => {
    await new Promise(resolve => setTimeout(resolve, 600));

    const currentUser = getCurrentUser();
    const circle = mockCircles.find(c => c.id === data.circleId) || mockCircles[0];

    const newActivity: Activity = {
      id: 'a' + Date.now(),
      circleId: data.circleId || 'c001',
      circle,
      organizerId: currentUser.id,
      organizer: currentUser,
      title: data.title || '',
      description: data.description || '',
      coverImage: data.coverImage || 'https://picsum.photos/seed/activity-new/800/400',
      location: data.location || '',
      address: data.address || '',
      lat: data.lat,
      lng: data.lng,
      startTime: data.startTime || new Date(),
      endTime: data.endTime || new Date(),
      maxParticipants: data.maxParticipants || 50,
      currentParticipants: 1,
      participants: [currentUser],
      status: 'upcoming',
      isRegistered: true,
      images: data.images || [],
      createdAt: new Date(),
    };

    set(state => ({
      activities: [newActivity, ...state.activities],
    }));

    return newActivity;
  },

  registerActivity: async (activityId: string): Promise<boolean> => {
    await new Promise(resolve => setTimeout(resolve, 300));

    let success = false;
    const currentUser = getCurrentUser();

    set(state => {
      const activities = state.activities.map(a => {
        if (a.id === activityId && !a.isRegistered && a.currentParticipants < a.maxParticipants) {
          success = true;
          return {
            ...a,
            isRegistered: true,
            currentParticipants: a.currentParticipants + 1,
            participants: [...a.participants, currentUser],
          };
        }
        return a;
      });

      const currentActivity = state.currentActivity?.id === activityId
        && !state.currentActivity.isRegistered
        && state.currentActivity.currentParticipants < state.currentActivity.maxParticipants
        ? {
            ...state.currentActivity,
            isRegistered: true,
            currentParticipants: state.currentActivity.currentParticipants + 1,
            participants: [...state.currentActivity.participants, currentUser],
          }
        : state.currentActivity;

      return { activities, currentActivity };
    });

    if (success) {
      updateUserPoints(15);
    }

    return success;
  },

  unregisterActivity: async (activityId: string): Promise<boolean> => {
    await new Promise(resolve => setTimeout(resolve, 300));

    let success = false;
    const currentUser = getCurrentUser();

    set(state => {
      const activities = state.activities.map(a => {
        if (a.id === activityId && a.isRegistered) {
          success = true;
          return {
            ...a,
            isRegistered: false,
            currentParticipants: a.currentParticipants - 1,
            participants: a.participants.filter(p => p.id !== currentUser.id),
          };
        }
        return a;
      });

      const currentActivity = state.currentActivity?.id === activityId && state.currentActivity.isRegistered
        ? {
            ...state.currentActivity,
            isRegistered: false,
            currentParticipants: state.currentActivity.currentParticipants - 1,
            participants: state.currentActivity.participants.filter(p => p.id !== currentUser.id),
          }
        : state.currentActivity;

      return { activities, currentActivity };
    });

    if (success) {
      updateUserPoints(-15);
    }

    return success;
  },

  updateParticipantStatus: async (activityId: string, userId: string, status: 'registered' | 'checked_in' | 'cancelled'): Promise<boolean> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    const success = true;

    set(state => {
      const activities = state.activities.map(a => {
        if (a.id === activityId) {
          const updatedParticipants = a.participants.map(p => {
            if (p.id === userId) {
              return { ...p, status };
            }
            return p;
          });
          return { ...a, participants: updatedParticipants };
        }
        return a;
      });

      const currentActivity = state.currentActivity?.id === activityId
        ? {
            ...state.currentActivity,
            participants: state.currentActivity.participants.map(p =>
              p.id === userId ? { ...p, status } : p
            )
          }
        : state.currentActivity;

      return { activities, currentActivity };
    });

    return success;
  },
}));
