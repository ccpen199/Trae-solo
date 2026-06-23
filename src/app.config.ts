export default defineAppConfig({
  pages: [
    'pages/home/index',
    'pages/message/index',
    'pages/contacts/index',
    'pages/apps/index',
    'pages/mine/index',
    'pages/chat/index',
    'pages/approval-detail/index',
    'pages/approval-create/index',
    'pages/document-detail/index',
    'pages/plugin-detail/index',
    'pages/organization-detail/index',
    'pages/admin/index',
    'pages/security/index',
    'pages/offline/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#1E5AA8',
    navigationBarTitleText: '移动办公中台',
    navigationBarTextStyle: 'white',
    backgroundColor: '#F5F7FA'
  },
  tabBar: {
    color: '#86909C',
    selectedColor: '#1E5AA8',
    backgroundColor: '#FFFFFF',
    borderStyle: 'white',
    list: [
      {
        pagePath: 'pages/home/index',
        text: '工作台'
      },
      {
        pagePath: 'pages/message/index',
        text: '消息'
      },
      {
        pagePath: 'pages/contacts/index',
        text: '通讯录'
      },
      {
        pagePath: 'pages/apps/index',
        text: '应用'
      },
      {
        pagePath: 'pages/mine/index',
        text: '我的'
      }
    ]
  }
})
