<template>
  <div class="mobile-container">
    <div class="header">
      <div class="flex-between">
        <el-icon :size="24" @click="goBack"><ArrowLeft /></el-icon>
        <h2 style="font-size: 18px; margin: 0;">12345政务服务便民热线</h2>
        <span style="width: 24px;"></span>
      </div>
    </div>

    <div style="padding: 16px;">
      <div class="quick-actions">
        <div class="action-item" @click="switchTab('submit')" :class="{ active: activeTab === 'submit' }">
          <el-icon :size="28" color="#1e5cb8"><Document /></el-icon>
          <span>提交诉求</span>
        </div>
        <div class="action-item" @click="switchTab('my')" :class="{ active: activeTab === 'my' }">
          <el-icon :size="28" color="#1e5cb8"><Document /></el-icon>
          <span>我的诉求</span>
          <el-tag v-if="pendingCount > 0" type="danger" size="small">{{ pendingCount }}</el-tag>
        </div>
        <div class="action-item" @click="switchTab('progress')" :class="{ active: activeTab === 'progress' }">
          <el-icon :size="28" color="#1e5cb8"><OfficeBuilding /></el-icon>
          <span>进度查询</span>
        </div>
        <div class="action-item" @click="switchTab('review')" :class="{ active: activeTab === 'review' }">
          <el-icon :size="28" color="#1e5cb8"><UserFilled /></el-icon>
          <span>评价复查</span>
        </div>
      </div>

      <div v-if="activeTab === 'submit'" class="section-card">
        <div class="section-title">
          <span class="title-bar"></span>
          <h3>提交诉求</h3>
        </div>
        <el-form :model="form" label-width="90px">
          <el-form-item label="诉求类型">
            <el-select v-model="form.type" placeholder="请选择诉求类型" style="width: 100%;">
              <el-option label="咨询" value="咨询" />
              <el-option label="投诉" value="投诉" />
              <el-option label="建议" value="建议" />
              <el-option label="求助" value="求助" />
              <el-option label="举报" value="举报" />
            </el-select>
          </el-form-item>
          <el-form-item label="问题类别">
            <el-select v-model="form.category" placeholder="请选择问题类别" style="width: 100%;">
              <el-option label="社会保障" value="社会保障" />
              <el-option label="医疗卫生" value="医疗卫生" />
              <el-option label="住房城乡建设" value="住房城乡建设" />
              <el-option label="交通运输" value="交通运输" />
              <el-option label="市场监管" value="市场监管" />
              <el-option label="教育服务" value="教育服务" />
              <el-option label="其他" value="其他" />
            </el-select>
          </el-form-item>
          <el-form-item label="诉求标题">
            <el-input v-model="form.title" placeholder="请简要描述您的诉求" />
          </el-form-item>
          <el-form-item label="诉求内容">
            <el-input 
              v-model="form.content" 
              type="textarea" 
              :rows="6" 
              placeholder="请详细描述您遇到的问题和需求"
              maxlength="500"
              show-word-limit
            />
          </el-form-item>
          <el-form-item label="联系人">
            <el-input v-model="form.contactName" placeholder="请输入您的姓名" />
          </el-form-item>
          <el-form-item label="联系电话">
            <el-input v-model="form.phone" placeholder="请输入您的手机号码" />
          </el-form-item>
          <el-form-item label="是否公开">
            <el-switch v-model="form.isPublic" />
            <span style="margin-left: 8px; font-size: 12px; color: #999;">
              公开后其他用户可查看同类问题处理结果
            </span>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" style="width: 100%;" :loading="submitting" @click="submitWorkOrder">
              提交诉求
            </el-button>
          </el-form-item>
        </el-form>
      </div>

      <div v-if="activeTab === 'my'" class="section-card">
        <div class="section-title">
          <span class="title-bar"></span>
          <h3>我的诉求</h3>
        </div>
        <div class="order-tabs">
          <div 
            v-for="tab in orderTabs" 
            :key="tab.value" 
            class="order-tab"
            :class="{ active: orderStatus === tab.value }"
            @click="orderStatus = tab.value"
          >
            {{ tab.label }}
          </div>
        </div>
        <div class="order-list" v-if="filteredOrders.length > 0">
          <div class="order-item" v-for="order in filteredOrders" :key="order.id" @click="viewOrderDetail(order)">
            <div class="order-header">
              <span class="order-no">{{ order.no }}</span>
              <el-tag :type="getStatusType(order.status)">{{ getStatusText(order.status) }}</el-tag>
            </div>
            <p class="order-title">{{ order.title }}</p>
            <div class="order-footer">
              <span class="order-type">{{ order.type }} · {{ order.category }}</span>
              <span class="order-time">{{ order.time }}</span>
            </div>
            <div v-if="order.status === 'processing'" class="order-progress">
              <div class="progress-steps">
                <div class="step done">
                  <div class="step-dot"></div>
                  <span>已受理</span>
                </div>
                <div class="step-line done"></div>
                <div class="step active">
                  <div class="step-dot"></div>
                  <span>处理中</span>
                </div>
                <div class="step-line"></div>
                <div class="step">
                  <div class="step-dot"></div>
                  <span>已办结</span>
                </div>
              </div>
            </div>
            <div class="order-actions">
              <el-button 
                v-if="order.status === 'processing' && isOverdue(order)" 
                type="warning" 
                size="small" 
                text 
                @click.stop="urgeOrder(order)"
              >
                催办
              </el-button>
              <el-button 
                v-if="order.status === 'completed' && !order.reviewed" 
                type="primary" 
                size="small" 
                text 
                @click.stop="openReviewDialog(order)"
              >
                评价复查
              </el-button>
              <el-button 
                v-if="order.status === 'completed' && order.reviewed" 
                type="info" 
                size="small" 
                text 
                @click.stop="viewReview(order)"
              >
                查看评价
              </el-button>
            </div>
          </div>
        </div>
        <div v-else class="empty-state">
          <el-icon :size="48" color="#ccc"><Document /></el-icon>
          <p>暂无诉求记录</p>
          <el-button type="primary" style="margin-top: 12px;" @click="activeTab = 'submit'">提交诉求</el-button>
        </div>
      </div>

      <div v-if="activeTab === 'progress'" class="section-card">
        <div class="section-title">
          <span class="title-bar"></span>
          <h3>办理进度查询</h3>
        </div>
        <el-input v-model="queryNo" placeholder="请输入工单号或手机号" style="margin-bottom: 16px;">
          <template #prefix>
            <el-icon><Document /></el-icon>
          </template>
          <template #append>
            <el-button @click="queryProgress">查询</el-button>
          </template>
        </el-input>
        <div class="timeline" v-if="progressData.length > 0">
          <div class="timeline-item" v-for="(item, index) in progressData" :key="index">
            <div class="timeline-dot" :class="{ active: index === 0 }"></div>
            <div class="timeline-content">
              <p class="timeline-title">{{ item.title }}</p>
              <p class="timeline-desc">{{ item.desc }}</p>
              <p class="timeline-operator">处理人：{{ item.operator }}</p>
              <p class="timeline-time">{{ item.time }}</p>
            </div>
          </div>
        </div>
        <div v-if="queryResult" class="query-result-card">
          <div class="query-result-header">
            <span class="query-result-title">分拨信息</span>
            <el-tag :type="queryResult.allocationStatus === '已分派' ? 'success' : 'warning'">
              {{ queryResult.allocationStatus }}
            </el-tag>
          </div>
          <div class="query-result-info">
            <div class="query-result-row">
              <span class="label">承办部门</span>
              <span class="value">{{ queryResult.department }}</span>
            </div>
            <div class="query-result-row">
              <span class="label">承办人</span>
              <span class="value">{{ queryResult.handler }}</span>
            </div>
            <div class="query-result-row">
              <span class="label">预计办结时限</span>
              <span class="value">{{ queryResult.deadline }}</span>
            </div>
            <div class="query-result-row">
              <span class="label">分拨时间</span>
              <span class="value">{{ queryResult.allocationTime }}</span>
            </div>
          </div>
        </div>
        <div v-else-if="!queryNo && progressData.length === 0" class="empty-state" style="padding: 40px 0;">
          <p>请输入工单号查询办理进度</p>
        </div>
      </div>

      <div v-if="activeTab === 'review'" class="section-card">
        <div class="section-title">
          <span class="title-bar"></span>
          <h3>评价复查</h3>
        </div>
        <div class="review-tabs">
          <div 
            v-for="tab in reviewTabs" 
            :key="tab.value" 
            class="review-tab"
            :class="{ active: reviewStatus === tab.value }"
            @click="reviewStatus = tab.value"
          >
            {{ tab.label }}
          </div>
        </div>
        <div class="review-list" v-if="filteredReviews.length > 0">
          <div class="review-item" v-for="item in filteredReviews" :key="item.id">
            <div class="review-header">
              <span class="review-order-no">{{ item.orderNo }}</span>
              <el-rate 
                v-model="item.rating" 
                disabled 
                show-score 
                text-color="#ff9900"
                size="small"
              />
            </div>
            <p class="review-title">{{ item.title }}</p>
            <div class="review-content">
              <p class="review-text">{{ item.content }}</p>
              <div class="review-meta">
                <span>处理速度：{{ item.speedScore }}分</span>
                <span>服务态度：{{ item.attitudeScore }}分</span>
              </div>
            </div>
            <div class="review-footer">
              <span class="review-time">{{ item.time }}</span>
              <el-button v-if="!item.reapplied" type="danger" text size="small" @click="reapplyReview(item)">
                申请复查
              </el-button>
              <el-tag v-else type="warning" size="small">复查中</el-tag>
            </div>
          </div>
        </div>
        <div v-else class="empty-state">
          <el-icon :size="48" color="#ccc"><Document /></el-icon>
          <p>暂无评价记录</p>
        </div>
      </div>
    </div>

    <el-dialog v-model="showAllocationDialog" title="诉求分拨结果" width="90%" :close-on-click-modal="false">
      <div class="allocation-content">
        <div class="allocation-status">
          <el-icon :size="48" color="#67c23a"><Document /></el-icon>
          <div class="allocation-status-text">已成功分派</div>
        </div>
        <div class="allocation-info">
          <div class="allocation-row">
            <span class="label">工单号</span>
            <span class="value order-no">{{ newOrderNo }}</span>
          </div>
          <div class="allocation-row">
            <span class="label">分拨状态</span>
            <el-tag type="success" size="small">智能分拨完成</el-tag>
          </div>
          <div class="allocation-row">
            <span class="label">承办部门</span>
            <span class="value">{{ newOrderDepartment }}</span>
          </div>
          <div class="allocation-row">
            <span class="label">预计办理时限</span>
            <span class="value">{{ newOrderDeadline }}</span>
          </div>
          <div class="allocation-row">
            <span class="label">分拨时间</span>
            <span class="value">{{ newOrderTime }}</span>
          </div>
        </div>
        <div class="allocation-tip">
          您将在办理进度中实时看到处理状态，办结后会有短信通知
        </div>
      </div>
      <template #footer>
        <el-button type="primary" style="width: 100%;" @click="showAllocationDialog = false">
          确认
        </el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showDetailDialog" title="诉求详情" width="90%">
      <div v-if="currentOrder" class="detail-content">
        <div class="detail-header">
          <span class="detail-order-no">{{ currentOrder.no }}</span>
          <el-tag :type="getStatusType(currentOrder.status)">
            {{ getStatusText(currentOrder.status) }}
          </el-tag>
        </div>
        <div class="detail-info">
          <div class="detail-row">
            <span class="label">诉求标题</span>
            <span class="value">{{ currentOrder.title }}</span>
          </div>
          <div class="detail-row">
            <span class="label">诉求类型</span>
            <span class="value">{{ currentOrder.type }} · {{ currentOrder.category }}</span>
          </div>
          <div class="detail-row">
            <span class="label">提交时间</span>
            <span class="value">{{ currentOrder.time }}</span>
          </div>
        </div>
        <div class="detail-section-title">状态流转时间线</div>
        <div class="detail-timeline">
          <div class="detail-timeline-item" v-for="(item, idx) in currentOrderTimeline" :key="idx">
            <div class="detail-timeline-dot" :class="{ active: idx === 0 }"></div>
            <div class="detail-timeline-content">
              <p class="detail-timeline-title">{{ item.title }}</p>
              <p class="detail-timeline-desc">{{ item.desc }}</p>
              <p class="detail-timeline-time">{{ item.time }}</p>
            </div>
          </div>
        </div>
        <div v-if="currentOrder.status === 'completed'" class="detail-result">
          <div class="detail-section-title">处理结果</div>
          <div class="result-content">
            {{ currentOrder.result || '感谢您的反馈，相关部门已处理完毕。如有其他问题，欢迎再次提交诉求。' }}
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="showDetailDialog = false">关闭</el-button>
        <el-button 
          v-if="currentOrder?.status === 'completed' && !currentOrder?.reviewed" 
          type="primary" 
          @click="openReviewFromDetail"
        >
          去评价
        </el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showReviewDialog" title="服务评价" width="90%" :close-on-click-modal="false">
      <div class="review-dialog-content">
        <div class="review-dialog-header">
          工单：{{ reviewingOrder?.no }}
        </div>
        <el-form label-width="100px">
          <el-form-item label="整体满意度">
            <el-rate v-model="reviewForm.rating" show-score text-color="#ff9900" />
          </el-form-item>
          <el-form-item label="处理速度">
            <el-slider v-model="reviewForm.speedScore" :min="1" :max="5" show-input :step="1" />
          </el-form-item>
          <el-form-item label="服务态度">
            <el-slider v-model="reviewForm.attitudeScore" :min="1" :max="5" show-input :step="1" />
          </el-form-item>
          <el-form-item label="评价内容">
            <el-input 
              v-model="reviewForm.content" 
              type="textarea" 
              :rows="4" 
              placeholder="请输入您的评价意见"
            />
          </el-form-item>
          <el-form-item label="是否公开">
            <el-switch v-model="reviewForm.isPublic" />
            <span style="margin-left: 8px; font-size: 12px; color: #999;">
              公开后可帮助其他用户了解服务质量
            </span>
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <el-button @click="showReviewDialog = false">取消</el-button>
        <el-button type="primary" @click="submitReview">提交评价</el-button>
      </template>
    </el-dialog>

    <BottomNav />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import BottomNav from '@/components/BottomNav.vue'
import { ArrowLeft, Document, OfficeBuilding, UserFilled } from '@element-plus/icons-vue'

const router = useRouter()
const activeTab = ref('submit')
const orderStatus = ref('all')
const reviewStatus = ref('all')
const queryNo = ref('')
const submitting = ref(false)
const queryResult = ref(null)

const showAllocationDialog = ref(false)
const showDetailDialog = ref(false)
const showReviewDialog = ref(false)

const currentOrder = ref(null)
const reviewingOrder = ref(null)
const newOrderNo = ref('')
const newOrderDepartment = ref('')
const newOrderDeadline = ref('')
const newOrderTime = ref('')

const form = ref({
  type: '',
  category: '',
  title: '',
  content: '',
  contactName: '',
  phone: '',
  isPublic: true
})

const reviewForm = ref({
  rating: 5,
  speedScore: 5,
  attitudeScore: 5,
  content: '',
  isPublic: true
})

const orderTabs = [
  { label: '全部', value: 'all' },
  { label: '待受理', value: 'pending' },
  { label: '处理中', value: 'processing' },
  { label: '已办结', value: 'completed' }
]

const reviewTabs = [
  { label: '全部', value: 'all' },
  { label: '已评价', value: 'reviewed' },
  { label: '待评价', value: 'pending' }
]

const myOrders = ref([
  {
    id: 1,
    no: 'GD20260601001234',
    title: '关于社保卡丢失补办的咨询',
    type: '咨询',
    category: '社会保障',
    status: 'processing',
    time: '2026-06-01 10:30',
    reviewed: false,
    result: ''
  },
  {
    id: 2,
    no: 'GD20260528000987',
    title: '建议增加社区养老服务设施',
    type: '建议',
    category: '其他',
    status: 'completed',
    time: '2026-05-28 14:20',
    reviewed: true,
    result: '感谢您的建议，民政部门已将您的建议纳入社区养老服务提升计划。'
  },
  {
    id: 3,
    no: 'GD20260525000654',
    title: '医保报销申请进度查询',
    type: '求助',
    category: '医疗卫生',
    status: 'completed',
    time: '2026-05-25 09:15',
    reviewed: false,
    result: '您的医保报销申请已审核通过，报销金额将于3个工作日内到账。'
  }
])

const reviews = ref([
  {
    id: 1,
    orderNo: 'GD20260528000987',
    title: '建议增加社区养老服务设施',
    rating: 5,
    speedScore: 4,
    attitudeScore: 5,
    content: '响应速度很快，工作人员态度很好，希望能尽快落实建议。',
    time: '2026-05-30 16:30',
    reapplied: false
  }
])

const filteredOrders = computed(() => {
  if (orderStatus.value === 'all') return myOrders.value
  return myOrders.value.filter(o => o.status === orderStatus.value)
})

const filteredReviews = computed(() => {
  if (reviewStatus.value === 'all') return reviews.value
  if (reviewStatus.value === 'reviewed') return reviews.value
  return myOrders.value.filter(o => o.status === 'completed' && !o.reviewed).map(o => ({
    id: o.id,
    orderNo: o.no,
    title: o.title,
    rating: 0,
    speedScore: 0,
    attitudeScore: 0,
    content: '待评价',
    time: o.time,
    reapplied: false,
    pending: true
  }))
})

const pendingCount = computed(() => myOrders.value.filter(o => o.status === 'pending' || o.status === 'processing').length)

const progressData = ref([])

const currentOrderTimeline = computed(() => {
  if (!currentOrder.value) return []
  return [
    { title: '部门处理中', desc: '相关部门正在处理您的诉求', time: '2026-06-01 15:30' },
    { title: '已分派', desc: `已分派至${getDepartmentByCategory(currentOrder.value.category)}`, time: '2026-06-01 11:00' },
    { title: '已受理', desc: '您的诉求已成功受理', time: currentOrder.value.time },
    { title: '提交成功', desc: `诉求已提交，工单号：${currentOrder.value.no}`, time: currentOrder.value.time }
  ]
})

const getDepartmentByCategory = (category) => {
  const map = {
    '社会保障': '广东省人力资源和社会保障厅',
    '医疗卫生': '广东省医疗保障局',
    '住房城乡建设': '广东省住房和城乡建设厅',
    '交通运输': '广东省交通运输厅',
    '市场监管': '广东省市场监督管理局',
    '教育服务': '广东省教育厅'
  }
  return map[category] || '相关部门'
}

const goBack = () => {
  router.back()
}

const switchTab = (tab) => {
  activeTab.value = tab
}

const isOverdue = (order) => {
  const orderDate = new Date(order.time.replace(/-/g, '/'))
  const now = new Date()
  const diffDays = Math.floor((now - orderDate) / (1000 * 60 * 60 * 24))
  return diffDays > 3
}

const submitWorkOrder = async () => {
  if (!form.value.type || !form.value.category || !form.value.title || !form.value.content) {
    ElMessage.warning('请填写完整信息')
    return
  }
  if (!form.value.phone) {
    ElMessage.warning('请输入联系电话')
    return
  }
  submitting.value = true
  
  const department = getDepartmentByCategory(form.value.category)
  const now = new Date()
  const deadline = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  
  newOrderNo.value = 'GD' + now.getFullYear() + 
    String(now.getMonth() + 1).padStart(2, '0') + 
    String(now.getDate()).padStart(2, '0') + 
    String(Math.floor(Math.random() * 10000)).padStart(4, '0')
  newOrderDepartment.value = department
  newOrderDeadline.value = deadline.toLocaleDateString('zh-CN')
  newOrderTime.value = now.toLocaleString('zh-CN')
  
  setTimeout(() => {
    submitting.value = false
    showAllocationDialog.value = true
    
    myOrders.value.unshift({
      id: Date.now(),
      no: newOrderNo.value,
      title: form.value.title,
      type: form.value.type,
      category: form.value.category,
      status: 'processing',
      time: newOrderTime.value,
      reviewed: false,
      result: ''
    })
    
    form.value = {
      type: '',
      category: '',
      title: '',
      content: '',
      contactName: '',
      phone: '',
      isPublic: true
    }
  }, 1000)
}

const viewOrderDetail = (order) => {
  currentOrder.value = order
  showDetailDialog.value = true
}

const urgeOrder = (order) => {
  ElMessage.success(`已对工单 ${order.no} 发送催办通知`)
}

const openReviewDialog = (order) => {
  reviewingOrder.value = order
  reviewForm.value = {
    rating: 5,
    speedScore: 5,
    attitudeScore: 5,
    content: '',
    isPublic: true
  }
  showReviewDialog.value = true
}

const openReviewFromDetail = () => {
  showDetailDialog.value = false
  openReviewDialog(currentOrder.value)
}

const viewReview = (order) => {
  const review = reviews.value.find(r => r.orderNo === order.no)
  if (review) {
    ElMessage.info(`评价分数：${review.rating}星`)
  }
}

const submitReview = () => {
  if (reviewingOrder.value) {
    reviews.value.unshift({
      id: Date.now(),
      orderNo: reviewingOrder.value.no,
      title: reviewingOrder.value.title,
      rating: reviewForm.value.rating,
      speedScore: reviewForm.value.speedScore,
      attitudeScore: reviewForm.value.attitudeScore,
      content: reviewForm.value.content || '用户未填写评价内容',
      time: new Date().toLocaleString('zh-CN'),
      reapplied: false
    })
    
    const order = myOrders.value.find(o => o.id === reviewingOrder.value.id)
    if (order) {
      order.reviewed = true
    }
  }
  showReviewDialog.value = false
  ElMessage.success('评价提交成功，感谢您的反馈！')
  activeTab.value = 'review'
}

const reapplyReview = (item) => {
  item.reapplied = true
  ElMessage.success('复查申请已提交，工作人员将在3个工作日内与您联系')
}

const queryProgress = () => {
  if (!queryNo.value) {
    ElMessage.warning('请输入工单号或手机号')
    return
  }
  
  progressData.value = [
    { title: '部门处理中', desc: '相关部门正在处理您的诉求', operator: '张某某', time: '2026-06-01 15:30' },
    { title: '已分派', desc: '已分派至广东省人力资源和社会保障厅', operator: '智能分拨系统', time: '2026-06-01 11:00' },
    { title: '已受理', desc: '您的诉求已成功受理', operator: '系统', time: '2026-06-01 10:30' },
    { title: '提交成功', desc: `诉求已提交，工单号：${queryNo.value}`, operator: '当前用户', time: '2026-06-01 10:30' }
  ]
  
  queryResult.value = {
    allocationStatus: '已分派',
    department: '广东省人力资源和社会保障厅',
    handler: '张某某',
    deadline: '2026-06-08',
    allocationTime: '2026-06-01 11:00'
  }
  
  ElMessage.success('查询成功')
}

const getStatusType = (status) => {
  const map = { pending: 'warning', processing: 'primary', completed: 'success' }
  return map[status] || 'info'
}

const getStatusText = (status) => {
  const map = { pending: '待受理', processing: '处理中', completed: '已办结' }
  return map[status] || status
}
</script>

<style scoped>
.quick-actions {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  background: white;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
}

.action-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #666;
  cursor: pointer;
  position: relative;
  padding: 8px;
  border-radius: 8px;
  transition: all 0.3s;
}

.action-item:hover,
.action-item.active {
  background: #f0f7ff;
  color: #1e5cb8;
}

.section-card {
  background: white;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
}

.section-title {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
}

.title-bar {
  width: 4px;
  height: 16px;
  background: linear-gradient(135deg, #1e5cb8 0%, #2d7dd2 100%);
  border-radius: 2px;
  margin-right: 8px;
}

.section-title h3 {
  font-size: 16px;
  font-weight: 600;
  margin: 0;
}

.order-tabs,
.review-tabs {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.order-tab,
.review-tab {
  padding: 12px 0;
  font-size: 14px;
  color: #666;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
}

.order-tab.active,
.review-tab.active {
  color: #1e5cb8;
  border-bottom-color: #1e5cb8;
}

.order-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.order-item {
  padding: 16px;
  background: #f9f9f9;
  border-radius: 8px;
  cursor: pointer;
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.order-no {
  font-size: 12px;
  color: #999;
}

.order-title {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 8px;
}

.order-footer {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #999;
}

.order-progress {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #e8e8e8;
}

.progress-steps {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #999;
}

.step-dot {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #e8e8e8;
}

.step.active .step-dot,
.step.done .step-dot {
  background: #1e5cb8;
}

.step-line {
  flex: 1;
  height: 2px;
  background: #e8e8e8;
  margin: 0 8px;
}

.step-line.done {
  background: #1e5cb8;
}

.order-actions {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #e8e8e8;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.empty-state {
  text-align: center;
  padding: 40px 0;
  color: #999;
}

.timeline {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.timeline-item {
  display: flex;
  gap: 12px;
}

.timeline-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #e8e8e8;
  margin-top: 4px;
  flex-shrink: 0;
}

.timeline-dot.active {
  background: #1e5cb8;
}

.timeline-content {
  flex: 1;
}

.timeline-title {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
}

.timeline-desc {
  font-size: 13px;
  color: #666;
  margin-bottom: 4px;
}

.timeline-operator {
  font-size: 12px;
  color: #1e5cb8;
  margin-bottom: 2px;
}

.timeline-time {
  font-size: 12px;
  color: #999;
}

.query-result-card {
  margin-top: 16px;
  background: #f0f7ff;
  border-radius: 8px;
  padding: 16px;
}

.query-result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.query-result-title {
  font-size: 14px;
  font-weight: 600;
  color: #1e5cb8;
}

.query-result-info {
  background: white;
  border-radius: 6px;
  padding: 12px;
}

.query-result-row {
  display: flex;
  justify-content: space-between;
  padding: 6px 0;
}

.query-result-row .label {
  font-size: 13px;
  color: #999;
}

.query-result-row .value {
  font-size: 13px;
  color: #333;
}

.review-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.review-item {
  padding: 16px;
  background: #f9f9f9;
  border-radius: 8px;
}

.review-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.review-order-no {
  font-size: 12px;
  color: #999;
}

.review-title {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 8px;
}

.review-content {
  background: white;
  border-radius: 6px;
  padding: 12px;
  margin-bottom: 12px;
}

.review-text {
  font-size: 13px;
  color: #666;
  margin: 0 0 8px;
}

.review-meta {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: #999;
}

.review-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.review-time {
  font-size: 12px;
  color: #999;
}

.allocation-content {
  text-align: center;
  padding: 20px 0;
}

.allocation-status {
  margin-bottom: 24px;
}

.allocation-status-text {
  font-size: 18px;
  font-weight: 600;
  color: #67c23a;
  margin-top: 12px;
}

.allocation-info {
  background: #f0f7ff;
  border-radius: 8px;
  padding: 16px;
  text-align: left;
}

.allocation-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
}

.allocation-row .label {
  font-size: 14px;
  color: #999;
}

.allocation-row .value {
  font-size: 14px;
  color: #333;
}

.allocation-row .value.order-no {
  font-family: monospace;
  color: #1e5cb8;
  font-weight: 600;
}

.allocation-tip {
  margin-top: 20px;
  font-size: 13px;
  color: #999;
  padding: 12px;
  background: #f9f9f9;
  border-radius: 6px;
}

.detail-content {
  padding: 10px 0;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.detail-order-no {
  font-size: 14px;
  font-weight: 600;
  color: #1e5cb8;
}

.detail-info {
  background: #f9f9f9;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 16px;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  padding: 6px 0;
}

.detail-row .label {
  font-size: 13px;
  color: #999;
}

.detail-row .value {
  font-size: 13px;
  color: #333;
}

.detail-section-title {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin: 16px 0 12px;
}

.detail-timeline {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.detail-timeline-item {
  display: flex;
  gap: 12px;
}

.detail-timeline-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #e8e8e8;
  margin-top: 4px;
  flex