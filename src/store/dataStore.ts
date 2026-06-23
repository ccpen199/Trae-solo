import { create } from "zustand";
import type {
  WeatherData,
  CalendarData,
  Recipe,
  Exercise,
  MedicineReminder,
  FamilyBind,
  Alert,
  ContentItem,
  ContentStatus,
} from "@/types";

interface DataState {
  weatherData: WeatherData | null;
  calendarData: CalendarData | null;
  recipes: Recipe[];
  exercises: Exercise[];
  medicines: MedicineReminder[];
  familyBinds: FamilyBind[];
  alerts: Alert[];
  contentItems: ContentItem[];

  setWeatherData: (data: WeatherData | null) => void;
  setCalendarData: (data: CalendarData | null) => void;
  setRecipes: (recipes: Recipe[]) => void;
  setExercises: (exercises: Exercise[]) => void;
  setMedicines: (medicines: MedicineReminder[]) => void;
  setFamilyBinds: (binds: FamilyBind[]) => void;
  setAlerts: (alerts: Alert[]) => void;
  setContentItems: (items: ContentItem[]) => void;

  toggleMedicineTaken: (medicineId: string, timeIndex: number) => void;
  toggleMedicineEnabled: (medicineId: string) => void;
  acknowledgeAlert: (alertId: string) => void;
  reviewContent: (contentId: string, status: ContentStatus, comment?: string) => void;
  toggleFamilyAlert: (bindId: string) => void;
  addMedicine: (medicine: MedicineReminder) => void;
  removeMedicine: (medicineId: string) => void;
  addAlert: (alert: Alert) => void;
  removeAlert: (alertId: string) => void;
}

export const useDataStore = create<DataState>((set) => ({
  weatherData: null,
  calendarData: null,
  recipes: [],
  exercises: [],
  medicines: [],
  familyBinds: [],
  alerts: [],
  contentItems: [],

  setWeatherData: (data) => set({ weatherData: data }),
  setCalendarData: (data) => set({ calendarData: data }),
  setRecipes: (recipes) => set({ recipes }),
  setExercises: (exercises) => set({ exercises }),
  setMedicines: (medicines) => set({ medicines }),
  setFamilyBinds: (familyBinds) => set({ familyBinds }),
  setAlerts: (alerts) => set({ alerts }),
  setContentItems: (contentItems) => set({ contentItems }),

  toggleMedicineTaken: (medicineId, timeIndex) =>
    set((state) => ({
      medicines: state.medicines.map((m) =>
        m.id === medicineId
          ? {
              ...m,
              takenToday: m.takenToday.map((taken, idx) =>
                idx === timeIndex ? !taken : taken
              ),
            }
          : m
      ),
    })),

  toggleMedicineEnabled: (medicineId) =>
    set((state) => ({
      medicines: state.medicines.map((m) =>
        m.id === medicineId ? { ...m, enabled: !m.enabled } : m
      ),
    })),

  acknowledgeAlert: (alertId) =>
    set((state) => ({
      alerts: state.alerts.map((a) =>
        a.id === alertId ? { ...a, acknowledged: true } : a
      ),
    })),

  reviewContent: (contentId, status, comment) =>
    set((state) => ({
      contentItems: state.contentItems.map((c) =>
        c.id === contentId ? { ...c, status, reviewComment: comment } : c
      ),
    })),

  toggleFamilyAlert: (bindId) =>
    set((state) => ({
      familyBinds: state.familyBinds.map((b) =>
        b.id === bindId ? { ...b, receiveAlerts: !b.receiveAlerts } : b
      ),
    })),

  addMedicine: (medicine) =>
    set((state) => ({ medicines: [...state.medicines, medicine] })),

  removeMedicine: (medicineId) =>
    set((state) => ({
      medicines: state.medicines.filter((m) => m.id !== medicineId),
    })),

  addAlert: (alert) =>
    set((state) => ({ alerts: [...state.alerts, alert] })),

  removeAlert: (alertId) =>
    set((state) => ({
      alerts: state.alerts.filter((a) => a.id !== alertId),
    })),
}));
