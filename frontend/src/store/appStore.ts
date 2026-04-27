import { create } from 'zustand';
import { AppStore } from '../types';

const initialState = {
  sensorData: [],
  doTrends: [],
  aerationPlans: [],
  powerStatus: {
    isPowered: true,
    lastPowerTime: Date.now(),
    backupPowerStatus: 'idle' as const,
    operator: '',
    nextAction: ''
  },
  feedingPlans: [],
  alerts: [],
  devices: [],
  ponds: [],
  businessNodes: [],
  powerSwitchPlans: [],
  waterQualityReports: [],
  isConnected: false,
  currentTime: Date.now()
};

export const useAppStore = create<AppStore>((set, get) => ({
  ...initialState,

  setSensorData: (data) => set({ sensorData: data }),
  
  addSensorData: (data) => set((state) => {
    const updated = [...state.sensorData, data];
    if (updated.length > 100) {
      updated.shift();
    }
    return { sensorData: updated };
  }),

  setDOTrends: (trends) => set({ doTrends: trends }),

  setAerationPlans: (plans) => set({ aerationPlans: plans }),

  updateAerationPlan: (plan) => set((state) => ({
    aerationPlans: state.aerationPlans.map(p => 
      p.id === plan.id ? plan : p
    )
  })),

  setPowerStatus: (status) => set({ powerStatus: status }),

  setFeedingPlans: (plans) => set({ feedingPlans: plans }),

  setAlerts: (alerts) => set({ alerts }),

  addAlert: (alert) => set((state) => ({
    alerts: [alert, ...state.alerts]
  })),

  acknowledgeAlert: (alertId, operator) => set((state) => ({
    alerts: state.alerts.map(alert => 
      alert.id === alertId 
        ? { ...alert, status: 'acknowledged' as const, acknowledgedAt: Date.now(), acknowledgedBy: operator }
        : alert
    )
  })),

  resolveAlert: (alertId) => set((state) => ({
    alerts: state.alerts.map(alert => 
      alert.id === alertId 
        ? { ...alert, status: 'resolved' as const }
        : alert
    )
  })),

  setDevices: (devices) => set({ devices }),

  setPonds: (ponds) => set({ ponds }),

  setBusinessNodes: (nodes) => set({ businessNodes: nodes }),

  updateBusinessNode: (node) => set((state) => ({
    businessNodes: state.businessNodes.map(n => 
      n.id === node.id ? node : n
    )
  })),

  setPowerSwitchPlans: (plans) => set({ powerSwitchPlans: plans }),

  setWaterQualityReports: (reports) => set({ waterQualityReports: reports }),

  setIsConnected: (connected) => set({ isConnected: connected }),

  updateTime: () => set({ currentTime: Date.now() })
}));

export default useAppStore;
