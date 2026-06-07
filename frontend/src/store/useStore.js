import { create } from 'zustand';

const useStore = create((set) => ({
  currentUser: {
    id: 1,
    name: '测试用户',
    role: 'admin',
    phone: '13800000000'
  },
  currentView: 'home',
  
  setCurrentView: (view) => set({ currentView: view }),
  setCurrentUser: (user) => set({ currentUser: user }),

  orderStatusMap: {
    0: { text: '待接单', color: 'orange' },
    1: { text: '已接单', color: 'blue' },
    2: { text: '维修中', color: 'processing' },
    3: { text: '待确认', color: 'purple' },
    4: { text: '已完成', color: 'green' },
    5: { text: '已评价', color: 'gray' }
  },

  deviceTypeOptions: [
    { value: 'smartphone', label: '智能手机' },
    { value: 'laptop', label: '笔记本电脑' },
    { value: 'tablet', label: '平板电脑' },
    { value: 'watch', label: '智能手表' },
    { value: 'other', label: '其他设备' }
  ]
}));

export default useStore;
