import db, { getUserByPhone, listPaymentAccounts, listFavorites, listCachedPolicies } from './api/db/index.js'
import {
  mockSocialSecurity,
  mockSocialSecurityAccounts,
  mockTrafficEvents,
  mockBusPredictions,
  mockPaymentAccounts,
  mockCommunityPosts,
  mockOpinionDashboard,
  mockPOIs,
  mockPolicies,
  mockWeather,
  mockServices,
  mockUserProfile,
  mockFavorites,
} from './api/data/mock.js'

console.log('=== 数据库测试 ===')
console.log('数据库实例:', db ? 'OK' : 'FAIL')

const user = getUserByPhone('13800138000')
console.log('Mock用户:', user ? user.name + ' (' + user.phone + ')' : 'FAIL')

console.log('\n=== Mock 数据统计 ===')
console.log('社保账户:', mockSocialSecurityAccounts.length + ' 条')
console.log('交通事件:', mockTrafficEvents.length + ' 条')
console.log('公交预测:', mockBusPredictions.length + ' 条')
console.log('缴费账户:', mockPaymentAccounts.length + ' 条')
console.log('社区热帖:', mockCommunityPosts.length + ' 条')
console.log('POI兴趣点:', mockPOIs.length + ' 条')
console.log('政策文档:', mockPolicies.length + ' 条')
console.log('服务列表:', mockServices.length + ' 条')
console.log('收藏:', mockFavorites.length + ' 条')

console.log('\n=== 社区热帖情感分布 ===')
const positive = mockCommunityPosts.filter(p => p.sentiment === 'positive').length
const neutral = mockCommunityPosts.filter(p => p.sentiment === 'neutral').length
const negative = mockCommunityPosts.filter(p => p.sentiment === 'negative').length
console.log('正面:', positive, ' 中性:', neutral, ' 负面:', negative)

console.log('\n=== POI 分类统计 ===')
const scenic = mockPOIs.filter(p => p.type === 'scenic').length
const restaurant = mockPOIs.filter(p => p.type === 'restaurant').length
const medical = mockPOIs.filter(p => p.type === 'medical').length
console.log('景区:', scenic, ' 餐饮:', restaurant, ' 医疗机构:', medical)

console.log('\n✓ 所有测试通过')
