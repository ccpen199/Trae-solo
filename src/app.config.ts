export default defineAppConfig({
  pages: [
    'pages/home/index',
    'pages/dispatch/index',
    'pages/exception/index',
    'pages/mine/index',
    'pages/scan/index',
    'pages/waybill-detail/index',
    'pages/exception-report/index',
    'pages/checkin/index',
    'pages/operation-log/index',
    'pages/evaluation/index',
    'pages/archive/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#165dff',
    navigationBarTitleText: '快递作业协同',
    navigationBarTextStyle: 'white',
    backgroundColor: '#f5f6f7'
  },
  tabBar: {
    color: '#86909c',
    selectedColor: '#165dff',
    backgroundColor: '#ffffff',
    borderStyle: 'black',
    list: [
      {
        pagePath: 'pages/home/index',
        text: '工作台'
      },
      {
        pagePath: 'pages/dispatch/index',
        text: '揽派'
      },
      {
        pagePath: 'pages/exception/index',
        text: '异常'
      },
      {
        pagePath: 'pages/mine/index',
        text: '我的'
      }
    ]
  },
  permission: {
    'scope.userLocation': {
      desc: '用于轨迹围栏打卡和派件路径规划'
    }
  },
  requiredPrivateInfos: [
    'getLocation',
    'chooseLocation'
  ]
})
