export default defineAppConfig({
  pages: [
    'pages/home/index',
    'pages/transport/index',
    'pages/tourism/index',
    'pages/service/index',
    'pages/mine/index',
    'pages/auth/realname/index',
    'pages/auth/card-bind/index',
    'pages/tourism/detail/index',
    'pages/tourism/reservation-success/index',
    'pages/transport/recharge/index',
    'pages/transport/ride-code/index',
    'pages/transport/transactions/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#1E4D8C',
    navigationBarTitleText: '苏州城市服务',
    navigationBarTextStyle: 'white',
    backgroundColor: '#F5F7FA'
  },
  tabBar: {
    color: '#A0AEC0',
    selectedColor: '#1E4D8C',
    backgroundColor: '#FFFFFF',
    borderStyle: 'black',
    list: [
      {
        pagePath: 'pages/home/index',
        text: '首页'
      },
      {
        pagePath: 'pages/transport/index',
        text: '交通卡'
      },
      {
        pagePath: 'pages/tourism/index',
        text: '文旅'
      },
      {
        pagePath: 'pages/service/index',
        text: '服务'
      },
      {
        pagePath: 'pages/mine/index',
        text: '我的'
      }
    ]
  }
})
