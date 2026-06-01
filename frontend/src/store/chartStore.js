import { create } from 'zustand'

const COLORS = [
  '#667eea', '#764ba2', '#f093fb', '#f5576c',
  '#4facfe', '#00f2fe', '#43e97b', '#38f9d7',
  '#fa709a', '#fee140', '#a8edea', '#fed6e3',
  '#ff9a9e', '#fecfef', '#ffecd2', '#fcb69f'
]

const useChartStore = create((set, get) => ({
  charts: [],
  loading: false,
  error: null,
  currentChart: null,
  currentPanel: 'data',
  colorPicker: { visible: false, index: -1 },

  COLORS,

  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setCurrentChart: (chart) => set({ currentChart: chart }),
  setCurrentPanel: (panel) => set({ currentPanel: panel }),
  setCharts: (charts) => set({ charts }),
  
  showColorPicker: (index) => set({ colorPicker: { visible: true, index } }),
  hideColorPicker: () => set({ colorPicker: { visible: false, index: -1 } }),

  updateDataPoint: (index, updates) => {
    const { currentChart } = get()
    if (!currentChart?.data_points) return
    
    const newDataPoints = [...currentChart.data_points]
    newDataPoints[index] = { ...newDataPoints[index], ...updates }
    
    set({
      currentChart: {
        ...currentChart,
        data_points: newDataPoints
      }
    })
  },

  updateAxisSettings: (updates) => {
    const { currentChart } = get()
    if (!currentChart) return
    
    set({
      currentChart: {
        ...currentChart,
        axis_settings: {
          ...currentChart.axis_settings,
          ...updates
        }
      }
    })
  },

  updateSettings: (updates) => {
    const { currentChart } = get()
    if (!currentChart) return
    
    set({
      currentChart: {
        ...currentChart,
        settings: {
          ...(currentChart.settings || {}),
          ...updates
        }
      }
    })
  },

  validateValue: (value, yMin, yMax) => {
    const num = parseFloat(value)
    if (isNaN(num)) {
      return { valid: false, message: '请输入有效数字' }
    }
    if (num < yMin || num > yMax) {
      return { valid: false, message: `数值应在 ${yMin} - ${yMax} 之间` }
    }
    return { valid: true, value: num }
  }
}))

export default useChartStore
