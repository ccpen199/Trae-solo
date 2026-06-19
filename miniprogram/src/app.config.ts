export default defineAppConfig({
  pages: [
    'pages/index/index',
    'pages/scan/scan',
    'pages/bluetooth/bluetooth',
    'pages/recharge/recharge',
    'pages/bills/bills',
    'pages/billDetail/billDetail',
    'pages/profile/profile'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#1890ff',
    navigationBarTitleText: '智慧取水',
    navigationBarTextStyle: 'white'
  },
  tabBar: {
    color: '#999999',
    selectedColor: '#1890ff',
    backgroundColor: '#ffffff',
    borderStyle: 'black',
    list: [
      {
        pagePath: 'pages/index/index',
        text: '首页',
        iconPath: 'assets/tabbar/home.png',
        selectedIconPath: 'assets/tabbar/home-active.png'
      },
      {
        pagePath: 'pages/bills/bills',
        text: '账单',
        iconPath: 'assets/tabbar/bill.png',
        selectedIconPath: 'assets/tabbar/bill-active.png'
      },
      {
        pagePath: 'pages/profile/profile',
        text: '我的',
        iconPath: 'assets/tabbar/profile.png',
        selectedIconPath: 'assets/tabbar/profile-active.png'
      }
    ]
  }
})
