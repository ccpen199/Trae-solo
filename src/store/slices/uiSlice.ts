import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Alert {
  id: number;
  type: string;
  message: string;
  level: string;
  status: string;
}

interface UIState {
  sidebarCollapsed: boolean;
  alerts: Alert[];
}

const initialState: UIState = {
  sidebarCollapsed: false,
  alerts: []
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarCollapsed = !state.sidebarCollapsed;
    },
    setSidebarCollapsed: (state, action: PayloadAction<boolean>) => {
      state.sidebarCollapsed = action.payload;
    },
    addAlert: (state, action: PayloadAction<Alert>) => {
      state.alerts.unshift(action.payload);
    },
    removeAlert: (state, action: PayloadAction<number>) => {
      state.alerts = state.alerts.filter(a => a.id !== action.payload);
    },
    clearAlerts: (state) => {
      state.alerts = [];
    }
  }
});

export const { toggleSidebar, setSidebarCollapsed, addAlert, removeAlert, clearAlerts } = uiSlice.actions;
export default uiSlice.reducer;