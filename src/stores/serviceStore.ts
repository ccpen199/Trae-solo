import { create } from 'zustand';
import type { ServiceDomain, ServiceItem } from '@/types';
import { serviceDomains, serviceItems } from '@/mock/data';

interface ServiceState {
  domains: ServiceDomain[];
  services: ServiceItem[];
  selectedDomain: string | null;
  searchQuery: string;
  setSelectedDomain: (domainId: string | null) => void;
  setSearchQuery: (query: string) => void;
  getServicesByDomain: (domainId: string) => ServiceItem[];
  getServiceById: (serviceId: string) => ServiceItem | undefined;
  getFilteredServices: () => ServiceItem[];
}

export const useServiceStore = create<ServiceState>((set, get) => ({
  domains: serviceDomains,
  services: serviceItems,
  selectedDomain: null,
  searchQuery: '',
  setSelectedDomain: (domainId) => set({ selectedDomain: domainId }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  getServicesByDomain: (domainId) => get().services.filter((s) => s.domainId === domainId),
  getServiceById: (serviceId) => get().services.find((s) => s.id === serviceId),
  getFilteredServices: () => {
    const { services, selectedDomain, searchQuery } = get();
    let filtered = services;
    if (selectedDomain) {
      filtered = filtered.filter((s) => s.domainId === selectedDomain);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (s) => s.name.toLowerCase().includes(q) || s.department.toLowerCase().includes(q) || s.tags.some((t) => t.includes(q))
      );
    }
    return filtered;
  },
}));
