import { create } from 'zustand';
import type {
  BusSchedule,
  Movie,
  CinemaSchedule,
  Job,
  GovernmentService,
  BookingRecord,
} from '../types';
import {
  mockBusSchedules,
  mockMovies,
  mockCinemaSchedules,
  mockJobs,
  mockGovernmentServices,
} from '../data/mockServices';
import { mockUsers } from '../data/mockUsers';

interface ServiceStoreState {
  busSchedules: BusSchedule[];
  movies: Movie[];
  cinemaSchedules: CinemaSchedule[];
  jobs: Job[];
  governmentServices: GovernmentService[];
  bookingRecords: BookingRecord[];
}

interface ServiceStoreActions {
  fetchBusSchedules: (from?: string, to?: string, date?: string) => Promise<void>;
  fetchMovies: (nowShowing?: boolean) => Promise<void>;
  fetchCinemaSchedules: (movieId?: string, date?: string) => Promise<void>;
  fetchJobs: (keyword?: string, district?: string) => Promise<void>;
  fetchGovernmentServices: (category?: string) => Promise<void>;
  bookService: (serviceId: string, date: Date, time: string) => Promise<BookingRecord>;
  fetchBookingRecords: () => Promise<void>;
}

type ServiceStore = ServiceStoreState & ServiceStoreActions;

export const useServiceStore = create<ServiceStore>((set, get) => ({
  busSchedules: [],
  movies: [],
  cinemaSchedules: [],
  jobs: [],
  governmentServices: [],
  bookingRecords: [],

  fetchBusSchedules: async (from?: string, to?: string, date?: string): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 400));

    let filtered = [...mockBusSchedules];
    if (from) {
      filtered = filtered.filter(b => b.from.includes(from));
    }
    if (to) {
      filtered = filtered.filter(b => b.to.includes(to));
    }

    set({ busSchedules: filtered });
  },

  fetchMovies: async (nowShowing?: boolean): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 400));

    let filtered = [...mockMovies];
    if (nowShowing !== undefined) {
      filtered = filtered.filter(m => m.nowShowing === nowShowing);
    }

    set({ movies: filtered });
  },

  fetchCinemaSchedules: async (movieId?: string, date?: string): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 400));

    let filtered = [...mockCinemaSchedules];
    if (movieId) {
      filtered = filtered.filter(c => c.movieId === movieId);
    }

    set({ cinemaSchedules: filtered });
  },

  fetchJobs: async (keyword?: string, district?: string): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 400));

    let filtered = [...mockJobs];
    if (keyword) {
      filtered = filtered.filter(j =>
        j.title.includes(keyword) || j.company.includes(keyword) || j.tags.some(t => t.includes(keyword))
      );
    }
    if (district) {
      filtered = filtered.filter(j => j.district === district);
    }

    set({ jobs: filtered });
  },

  fetchGovernmentServices: async (category?: string): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 400));

    let filtered = [...mockGovernmentServices];
    if (category) {
      filtered = filtered.filter(g => g.category === category);
    }

    set({ governmentServices: filtered });
  },

  bookService: async (serviceId: string, date: Date, time: string): Promise<BookingRecord> => {
    await new Promise(resolve => setTimeout(resolve, 600));

    const service = get().governmentServices.find(s => s.id === serviceId) || mockGovernmentServices[0];
    const currentUser = mockUsers[0];

    const newBooking: BookingRecord = {
      id: 'bk' + Date.now(),
      serviceId,
      service,
      userId: currentUser.id,
      bookingDate: date,
      bookingTime: time,
      status: 'pending',
      createdAt: new Date(),
    };

    set(state => ({
      bookingRecords: [newBooking, ...state.bookingRecords],
    }));

    return newBooking;
  },

  fetchBookingRecords: async (): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 400));

    const currentUser = mockUsers[0];
    const records: BookingRecord[] = [
      {
        id: 'bk001',
        serviceId: 'gs001',
        service: mockGovernmentServices[0],
        userId: currentUser.id,
        bookingDate: new Date('2026-06-25'),
        bookingTime: '09:00',
        status: 'confirmed',
        createdAt: new Date('2026-06-20'),
      },
      {
        id: 'bk002',
        serviceId: 'gs004',
        service: mockGovernmentServices[3],
        userId: currentUser.id,
        bookingDate: new Date('2026-06-28'),
        bookingTime: '14:30',
        status: 'pending',
        createdAt: new Date('2026-06-21'),
      },
    ];

    set({ bookingRecords: records });
  },
}));
