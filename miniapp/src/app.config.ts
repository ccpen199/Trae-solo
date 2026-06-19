export default defineAppConfig({
  pages: [
    'pages/home/index',
    'pages/wallet/index',
    'pages/scan/index',
    'pages/mall/index',
    'pages/mine/index',
    'pages/coupon-detail/index',
    'pages/merchant-detail/index',
    'pages/history/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#1E40AF',
    navigationBarTitleText: '沈阳惠民券',
    navigationBarTextStyle: 'white',
    backgroundColor: '#F0F5FF'
  },
  tabBar: {
    color: '#86909C',
    selectedColor: '#1E40AF',
    backgroundColor: '#FFFFFF',
    borderStyle: 'white',
    list: [
      {
        pagePath: 'pages/home/index',
        text: '首页'
      },
      {
        pagePath: 'pages/wallet/index',
        text: '券包'
      },
      {
        pagePath: 'pages/scan/index',
        text: '扫码'
      },
      {
        pagePath: 'pages/mall/index',
        text: '商圈'
      },
      {
        pagePath: 'pages/mine/index',
        text: '我的'
      }
    ]
  }
})
