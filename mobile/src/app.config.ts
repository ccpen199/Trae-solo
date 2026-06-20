export default defineAppConfig({
  pages: [
    'pages/home/index',
    'pages/apply/index',
    'pages/signing/index',
    'pages/tracking/index',
    'pages/login/index',
    'pages/apply-detail/index',
    'pages/sign-detail/index',
    'pages/verification/index',
    'pages/certificate/index',
    'pages/approval-detail/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#1E5DAB',
    navigationBarTitleText: '市场监管电子政务工作台',
    navigationBarTextStyle: 'white',
    backgroundColor: '#F0F5FF'
  },
  tabBar: {
    color: '#86909C',
    selectedColor: '#1E5DAB',
    backgroundColor: '#FFFFFF',
    borderStyle: 'black',
    list: [
      {
        pagePath: 'pages/home/index',
        text: '工作台'
      },
      {
        pagePath: 'pages/apply/index',
        text: '申办中心'
      },
      {
        pagePath: 'pages/signing/index',
        text: '签署中心'
      },
      {
        pagePath: 'pages/tracking/index',
        text: '进度追踪'
      }
    ]
  }
})
