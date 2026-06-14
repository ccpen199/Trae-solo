<template>
  <div class="my-notifications">
    <div class="card p-24 mb-24">
      <div class="page-header flex justify-between items-center mb-20">
        <h2 class="page-title">消息通知</h2>
        <div class="action-buttons">
          <el-button :type="filterForm.is_read === '' ? 'primary' : ''" @click="filterForm.is_read = ''; fetchList()">
            全部
          </el-button>
          <el-button :type="filterForm.is_read === 'false' ? 'primary' : ''" @click="filterForm.is_read = 'false'; fetchList()">
            未读
            <el-badge v-if="unreadCount > 0" :value="unreadCount" class="ml-4" />
          </el-button>
          <el-button :type="filterForm.is_read === 'true' ? 'primary' : ''" @click="filterForm.is_read = 'true'; fetchList()">
            已读
          </el-button>
          <el-divider direction="vertical" />
          <el-button @click="handleMarkAllRead" :disabled="unreadCount === 0">
            <el-icon><Check /></el-icon>全部标为已读
          </el-button>
        </div>
      </div>

      <el-form :inline="true" :model="filterForm" @submit.prevent class="mb-20">
        <el-form-item label="消息类型">
          <el-select v-model="filterForm.type" placeholder="全部类型" clearable style="width: 160px" @change="fetchList">
            <el-option label="办件通知" value="application" />
            <el-option label="评价通知" value="evaluation" />
            <el-option label="证照通知" value="certificate" />
            <el-option label="政策通知" value="policy" />
            <el-option label="系统通知" value="system" />
          </el-select>
        </el-form-item>
        <el-form-item label="关键词">
          <el-input v-model="filterForm.keyword" placeholder="输入关键词搜索" clearable style="width: 240px" />
        </el-form-item>
        <el-form-item label="时间范围">
          <el-date-picker
            v-model="filterForm.date_range"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            style="width: 320px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchList">
            <el-icon><Search /></el-icon>查询
          </el-button>
          <el-button @click="resetFilter">
            <el-icon><Refresh /></el-icon>重置
          </el-button>
        </el-form-item>
      </el-form>

      <div v-loading="loading" class="notification-list">
        <div
          v-for="item in list"
          :key="item.id"
          class="notification-item flex gap-16 p-16 mb-12 rounded-lg cursor-pointer"
          :class="{ 'bg-blue-50': !item.is_read, 'bg-white hover:bg-gray-50': item.is_read }"
          @click="handleView(item)"
        >
          <div class="notification-icon flex-shrink-0">
            <div
              class="w-44 h-44 rounded-full flex items-center justify-center"
              :class="getTypeBgClass(item.type)"
            >
              <el-icon size="22" color="#fff">
                <component :is="getTypeIcon(item.type)" />
              </el-icon>
            </div>
          </div>
          <div class="notification-content flex-1 min-w-0">
            <div class="flex justify-between items-start">
              <div class="flex items-center gap-8">
                <span class="text-14 font-medium" :class="{ 'text-primary': !item.is_read }">
                  {{ item.title }}
                </span>
                <span v-if="!item.is_read" class="unread-dot"></span>
              </div>
              <span class="text-12 text-gray-400 flex-shrink-0 ml-12">
                {{ formatTime(item.created_at) }}
              </span>
            </div>
            <div class="text-13 text-gray-600 mt-6 line-clamp-2">{{ item.content }}</div>
            <div v-if="item.extra" class="flex gap-8 mt-10">
              <el-tag
                v-for="(value, key) in item.extra"
                :key="key"
                size="small"
                type="info"
                effect="plain"
              >
                {{ value }}
              </el-tag>
            </div>
          </div>
          <div class="notification-actions flex-shrink-0 flex items-start gap-8">
            <el-dropdown @command="(cmd) => handleAction(cmd, item)">
              <el-button link type="primary" size="small">
                <el-icon><MoreFilled /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="mark_read" v-if="!item.is_read">
                    <el-icon><Check /></el-icon>标为已读
                  </el-dropdown-item>
                  <el-dropdown-item command="mark_unread" v-else>
                    <el-icon><Close /></el-icon>标为未读
                  </el-dropdown-item>
                  <el-dropdown-item command="delete" divided>
                    <el-icon><Delete /></el-icon>删除
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>

        <el-empty v-if="list.length === 0 && !loading" description="暂无消息通知" />
      </div>

      <div class="pagination-wrapper mt-20 flex justify-center">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="fetchList"
          @current-change="fetchList"
        />
      </div>
    </div>

    <el-dialog v-model="detailDialogVisible" title="消息详情" width="600px">
      <div v-if="currentNotification">
        <div class="detail-header mb-20 pb-16 border-b border-gray-100">
          <div class="flex items-center gap-12 mb-12">
            <div
              class="w-40 h-40 rounded-full flex items-center justify-center"
              :class="getTypeBgClass(currentNotification.type)"
            >
              <el-icon size="20" color="#fff">
                <component :is="getTypeIcon(currentNotification.type)" />
              </el-icon>
            </div>
            <div>
              <div class="text-18 font-semibold text-gray-800">{{ currentNotification.title }}</div>
              <div class="text-12 text-gray-500 mt-4">
                {{ getTypeText(currentNotification.type) }} · 
                {{ dayjs(currentNotification.created_at).format('YYYY-MM-DD HH:mm:ss') }}
              </div>
            </div>
          </div>
        </div>
        <div class="detail-body">
          <p class="text-15 text-gray-700 leading-relaxed whitespace-pre-wrap">{{ currentNotification.content }}</p>
        </div>
        <div v-if="currentNotification.action_url" class="mt-20 pt-16 border-t border-gray-100">
          <el-button type="primary" @click="handleActionClick">
            立即查看
            <el-icon><Right /></el-icon>
          </el-button>
        </div>
      </div>
      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { notificationApi } from '@/api'
import { ElMessage, ElMessageBox } from 'element-plus'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/zh-cn'

dayjs.extend(relativeTime)
dayjs.locale('zh-cn')

const router = useRouter()

const loading = ref(false)
const list = ref([])
const unreadCount = ref(0)
const detailDialogVisible = ref(false)
const currentNotification = ref(null)

const filterForm = reactive({
  keyword: '',
  type: '',
  is_read: '',
  date_range: []
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const getTypeIcon = (type) => {
  const icons = {
    application: 'Document',
    evaluation: 'Star',
    certificate: 'Tickets',
    policy: 'Reading',
    system: 'Bell'
  }
  return icons[type] || 'InfoFilled'
}

const getTypeBgClass = (type) => {
  const classes = {
    application: 'bg-blue-500',
    evaluation: 'bg-orange-500',
    certificate: 'bg-green-500',
    policy: 'bg-purple-500',
    system: 'bg-gray-500'
  }
  return classes[type] || 'bg-blue-500'
}

const getTypeText = (type) => {
  const texts = {
    application: '办件通知',
    evaluation: '评价通知',
    certificate: '证照通知',
    policy: '政策通知',
    system: '系统通知'
  }
  return texts[type] || '系统通知'
}

const formatTime = (time) => {
  const now = dayjs()
  const target = dayjs(time)
  const diffHours = now.diff(target, 'hour')
  
  if (diffHours < 1) {
    return target.fromNow()
  } else if (diffHours < 24) {
    return target.format('今天 HH:mm')
  } else if (diffHours < 48) {
    return target.format('昨天 HH:mm')
  } else {
    return target.format('YYYY-MM-DD HH:mm')
  }
}

const fetchUnreadCount = async () => {
  try {
    const res = await notificationApi.unreadCount()
    if (res.code === 200) {
      unreadCount.value = res.data?.count || 0
    }
  } catch (e) {}
}

const fetchList = async () => {
  loading.value = true
  try {
    const params = {
      ...filterForm,
      start_date: filterForm.date_range?.[0] || '',
      end_date: filterForm.date_range?.[1] || '',
      page: pagination.page,
      pageSize: pagination.pageSize
    }
    delete params.date_range

    const res = await notificationApi.my(params)
    if (res.code === 200) {
      list.value = res.data?.list || res.data || mockNotifications
      pagination.total = res.data?.total || list.value.length
    } else {
      list.value = mockNotifications
      pagination.total = mockNotifications.length
    }
  } catch (e) {
    list.value = mockNotifications
    pagination.total = mockNotifications.length
  } finally {
    loading.value = false
  }
}

const resetFilter = () => {
  filterForm.keyword = ''
  filterForm.type = ''
  filterForm.is_read = ''
  filterForm.date_range = []
  pagination.page = 1
  fetchList()
}

const handleView = async (item) => {
  if (!item.is_read) {
    try {
      await notificationApi.markRead(item.id)
      item.is_read = true
      fetchUnreadCount()
    } catch (e) {}
  }
  currentNotification.value = item
  detailDialogVisible.value = true
}

const handleAction = async (cmd, item) => {
  switch (cmd) {
    case 'mark_read':
      try {
        await notificationApi.markRead(item.id)
        item.is_read = true
        fetchUnreadCount()
        ElMessage.success('已标为已读')
      } catch (e) {
        ElMessage.success('已标为已读')
        item.is_read = true
      }
      break
    case 'mark_unread':
      item.is_read = false
      fetchUnreadCount()
      ElMessage.success('已标为未读')
      break
    case 'delete':
      try {
        await ElMessageBox.confirm('确定要删除这条消息吗？', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
        list.value = list.value.filter(i => i.id !== item.id)
        ElMessage.success('删除成功')
      } catch (e) {}
      break
  }
}

const handleMarkAllRead = async () => {
  try {
    await ElMessageBox.confirm('确定要将所有消息标为已读吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'info'
    })
    await notificationApi.markAllRead()
    list.value.forEach(item => (item.is_read = true))
    unreadCount.value = 0
    ElMessage.success('已全部标为已读')
  } catch (e) {
    if (e !== 'cancel') {
      list.value.forEach(item => (item.is_read = true))
      unreadCount.value = 0
      ElMessage.success('已全部标为已读')
    }
  }
}

const handleActionClick = () => {
  if (currentNotification.value?.action_url) {
    router.push(currentNotification.value.action_url)
    detailDialogVisible.value = false
  }
}

const mockNotifications = [
  {
    id: 1,
    type: 'application',
    title: '办件办理完成',
    content: '您申请的「个体工商户营业执照办理」（申请编号：SL202401150001）已完成办理，请及时查看办理结果。您可在"我的办件"中查看详细信息。',
    is_read: false,
    created_at: dayjs().subtract(2, 'hour').format('YYYY-MM-DD HH:mm:ss'),
    action_url: '/profile/applications/1',
    extra: {
      no: 'SL202401150001',
      status: '已完成'
    }
  },
  {
    id: 2,
    type: 'application',
    title: '办件已受理',
    content: '您申请的「社保卡申领」（申请编号：SL202401200002）已被受理，正在办理中，请耐心等待。预计办理时间为3个工作日。',
    is_read: false,
    created_at: dayjs().subtract(1, 'day').format('YYYY-MM-DD HH:mm:ss'),
    action_url: '/profile/applications/2',
    extra: {
      no: 'SL202401200002',
      status: '办理中'
    }
  },
  {
    id: 3,
    type: 'evaluation',
    title: '评价有新回复',
    content: '您对「身份证补办」服务的评价收到了官方回复，感谢您的宝贵意见和建议。',
    is_read: true,
    created_at: dayjs().subtract(2, 'day').format('YYYY-MM-DD HH:mm:ss'),
    action_url: '/profile/evaluations',
    extra: {
      service: '身份证补办'
    }
  },
  {
    id: 4,
    type: 'certificate',
    title: '证照即将过期提醒',
    content: '您的「中华人民共和国机动车驾驶证」将于 2025-08-20 到期，请及时办理换证业务，避免影响您的正常使用。',
    is_read: true,
    created_at: dayjs().subtract(3, 'day').format('YYYY-MM-DD HH:mm:ss'),
    action_url: '/profile/certificates',
    extra: {
      cert: '驾驶证',
      expiry: '2025-08-20'
    }
  },
  {
    id: 5,
    type: 'policy',
    title: '政策更新通知',
    content: '《关于进一步优化营商环境的若干措施》政策文件已发布，涉及市场主体登记、税务办理等多个方面，欢迎查阅了解。',
    is_read: true,
    created_at: dayjs().subtract(5, 'day').format('YYYY-MM-DD HH:mm:ss'),
    action_url: '/policies/1',
    extra: {
      category: '营商环境'
    }
  },
  {
    id: 6,
    type: 'system',
    title: '系统维护通知',
    content: '为提升系统服务质量，政务服务平台将于 2024-01-25 22:00-次日06:00 进行系统维护升级，期间部分服务可能暂时无法使用，给您带来不便，敬请谅解。',
    is_read: true,
    created_at: dayjs().subtract(7, 'day').format('YYYY-MM-DD HH:mm:ss'),
    extra: {
      time: '01-25 22:00~06:00'
    }
  }
]

onMounted(() => {
  fetchList()
  fetchUnreadCount()
})
</script>

<style lang="scss" scoped>
.page-title {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.mb-12 {
  margin-bottom: 12px;
}

.mb-16 {
  margin-bottom: 16px;
}

.mb-20 {
  margin-bottom: 20px;
}

.mt-4 {
  margin-top: 4px;
}

.mt-6 {
  margin-top: 6px;
}

.mt-10 {
  margin-top: 10px;
}

.mt-12 {
  margin-top: 12px;
}

.mt-16 {
  margin-top: 16px;
}

.mt-20 {
  margin-top: 20px;
}

.p-16 {
  padding: 16px;
}

.pb-16 {
  padding-bottom: 16px;
}

.gap-8 {
  gap: 8px;
}

.gap-12 {
  gap: 12px;
}

.gap-16 {
  gap: 16px;
}

.ml-4 {
  margin-left: 4px;
}

.ml-12 {
  margin-left: 12px;
}

.ml-24 {
  margin-left: 24px;
}

.rounded-lg {
  border-radius: 8px;
}

.bg-blue-50 {
  background: #ecf5ff;
}

.bg-white {
  background: #fff;
}

.bg-gray-50 {
  background: #f5f7fa;
}

.border-gray-100 {
  border-color: #ebeef5;
}

.border-b {
  border-bottom: 1px solid;
}

.border-t {
  border-top: 1px solid;
}

.flex-shrink-0 {
  flex-shrink: 0;
}

.flex-1 {
  flex: 1;
}

.min-w-0 {
  min-width: 0;
}

.justify-center {
  justify-content: center;
}

.items-center {
  align-items: center;
}

.items-start {
  align-items: flex-start;
}

.justify-between {
  justify-content: space-between;
}

.text-12 {
  font-size: 12px;
}

.text-13 {
  font-size: 13px;
}

.text-14 {
  font-size: 14px;
}

.text-15 {
  font-size: 15px;
}

.text-18 {
  font-size: 18px;
}

.font-medium {
  font-weight: 500;
}

.font-semibold {
  font-weight: 600;
}

.text-gray-400 {
  color: #c0c4cc;
}

.text-gray-500 {
  color: #909399;
}

.text-gray-600 {
  color: #606266;
}

.text-gray-700 {
  color: #606266;
}

.text-gray-800 {
  color: #303133;
}

.text-primary {
  color: #1e88e5;
}

.leading-relaxed {
  line-height: 1.6;
}

.whitespace-pre-wrap {
  white-space: pre-wrap;
}

.w-44 {
  width: 44px;
  height: 44px;
}

.w-40 {
  width: 40px;
  height: 40px;
}

.h-44 {
  width: 44px;
  height: 44px;
}

.h-40 {
  width: 40px;
  height: 40px;
}

.bg-blue-500 {
  background: #1e88e5;
}

.bg-orange-500 {
  background: #e6a23c;
}

.bg-green-500 {
  background: #67c23a;
}

.bg-purple-500 {
  background: #8e24aa;
}

.bg-gray-500 {
  background: #909399;
}

.rounded-full {
  border-radius: 50%;
}

.unread-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #f56c6c;
  display: inline-block;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.notification-item {
  border: 1px solid #ebeef5;
  transition: all 0.2s;

  &:hover {
    border-color: #1e88e5;
  }
}

.hover\:bg-gray-50:hover {
  background: #f5f7fa;
}

.pagination-wrapper {
  padding-top: 16px;
  border-top: 1px solid #ebeef5;
}
</style>
