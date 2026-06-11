export default defineAppConfig({
  pages: [
    'pages/home/index',
    'pages/service/index',
    'pages/license/index',
    'pages/message/index',
    'pages/mine/index',
    'pages/ecard-apply/index',
    'pages/pension-cert/index',
    'pages/unemployment-reg/index',
    'pages/title-declare/index',
    'pages/matter-detail/index',
    'pages/license-detail/index',
    'pages/cross-province/index',
    'pages/recommend/index',
    'pages/auth/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#1890FF',
    navigationBarTitleText: '江苏人社',
    navigationBarTextStyle: 'white',
    backgroundColor: '#F5F7FA'
  },
  tabBar: {
    color: '#86909C',
    selectedColor: '#1890FF',
    backgroundColor: '#FFFFFF',
    borderStyle: 'black',
    list: [
      {
        pagePath: 'pages/home/index',
        text: '首页'
      },
      {
        pagePath: 'pages/service/index',
        text: '办事'
      },
      {
        pagePath: 'pages/license/index',
        text: '证照'
      },
      {
        pagePath: 'pages/message/index',
        text: '消息'
      },
      {
        pagePath: 'pages/mine/index',
        text: '我的'
      }
    ]
  }
})
