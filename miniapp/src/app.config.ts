export default defineAppConfig({
  pages: [
    'pages/home/index',
    'pages/service-hall/index',
    'pages/knowledge/index',
    'pages/mine/index',
    'pages/service-detail/index',
    'pages/application-detail/index',
    'pages/certificate-list/index',
    'pages/feedback/index',
    'pages/policy-detail/index',
    'pages/chat-qa/index',
    'pages/profile-setting/index',
    'pages/accessibility/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#1E4FA5',
    navigationBarTitleText: '郑好办',
    navigationBarTextStyle: 'white',
    backgroundColor: '#F0F4FA',
    enablePullDownRefresh: true,
    backgroundTextStyle: 'light'
  },
  tabBar: {
    color: '#86909C',
    selectedColor: '#1E4FA5',
    backgroundColor: '#FFFFFF',
    borderStyle: 'white',
    list: [
      {
        pagePath: 'pages/home/index',
        text: '首页'
      },
      {
        pagePath: 'pages/service-hall/index',
        text: '办事'
      },
      {
        pagePath: 'pages/knowledge/index',
        text: '知识库'
      },
      {
        pagePath: 'pages/mine/index',
        text: '我的'
      }
    ]
  },
  permission: {
    'scope.userLocation': {
      desc: '用于提供所在区精准政务服务推荐'
    }
  }
})
