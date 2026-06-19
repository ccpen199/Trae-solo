export default defineAppConfig({
  pages: [
    'pages/home/index',
    'pages/service/index',
    'pages/ticket/index',
    'pages/mine/index',
    'pages/access-detail/index',
    'pages/ticket-detail/index',
    'pages/service-detail/index',
    'pages/house-manage/index',
    'pages/access-log/index',
    'pages/ticket-create/index',
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#10B981',
    navigationBarTitleText: '社区服务',
    navigationBarTextStyle: 'white',
    backgroundColor: '#F8FAFC',
  },
  tabBar: {
    color: '#94A3B8',
    selectedColor: '#10B981',
    backgroundColor: '#FFFFFF',
    borderStyle: 'white',
    list: [
      { pagePath: 'pages/home/index', text: '首页' },
      { pagePath: 'pages/service/index', text: '服务' },
      { pagePath: 'pages/ticket/index', text: '工单' },
      { pagePath: 'pages/mine/index', text: '我的' },
    ],
  },
});
