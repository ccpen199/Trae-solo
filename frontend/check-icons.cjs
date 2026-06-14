const icons = require('@ant-design/icons');
const missing = [
  'BriefcaseOutlined','PrinterOutlined','AlertOutlined','CreditCardOutlined',
  'BankOutlined','ShopOutlined','SolutionOutlined','IdcardOutlined',
  'DashboardOutlined','SafetyOutlined','ProfileOutlined','ScheduleOutlined',
  'ContainerOutlined','ToolOutlined','DatabaseOutlined','AuditOutlined',
  'ReconciliationOutlined','FileProtectOutlined','ApartmentOutlined',
  'GoldOutlined','RobotOutlined','MedicineBoxOutlined','InsuranceOutlined',
  'CalendarTwoTone','ImportOutlined','RiseOutlined','FallOutlined',
  'PieChartOutlined','MoneyCollectOutlined','FireOutlined','StarOutlined',
  'StarFilled','LikeOutlined','SendOutlined','PictureOutlined',
  'TagOutlined','TrophyOutlined','FlagOutlined','ArrowRightOutlined',
  'CheckOutlined','CloseOutlined','EnvironmentOutlined','DownloadOutlined',
  'ExclamationCircleOutlined','CheckCircleOutlined','CloseCircleOutlined',
  'ThunderboltOutlined','DashboardFilled'
];
missing.forEach(n => {
  if (!icons[n]) console.log('MISSING: ' + n);
  else console.log('OK: ' + n);
});
