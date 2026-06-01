<template>
  <div class="escort-list">
    <el-card>
      <template #header>
        <div class="card-header">
          <span class="title">陪诊师列表</span>
          <div class="search-bar">
            <el-input
              v-model="searchName"
              placeholder="按姓名搜索"
              prefix-icon="Search"
              style="width: 200px; margin-right: 10px"
              @input="handleSearch"
            />
            <el-select
              v-model="searchCity"
              placeholder="按城市筛选"
              style="width: 150px"
              @change="handleSearch"
            >
              <el-option label="全部城市" value="" />
              <el-option label="北京" value="北京" />
              <el-option label="上海" value="上海" />
              <el-option label="广州" value="广州" />
              <el-option label="深圳" value="深圳" />
              <el-option label="杭州" value="杭州" />
            </el-select>
          </div>
        </div>
      </template>

      <el-table :data="filteredEscorts" border stripe>
        <el-table-column prop="name" label="姓名" width="100" />
        <el-table-column prop="city" label="城市" width="100" />
        <el-table-column prop="hospitals" label="熟悉医院" show-overflow-tooltip />
        <el-table-column prop="qualifications" label="资质" width="120" />
        <el-table-column label="评分" width="120">
          <template #default="{ row }">
            <el-rate v-model="row.rating" disabled show-score />
          </template>
        </el-table-column>
        <el-table-column prop="available_times" label="可服务时间" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'active' ? 'success' : 'info'">
              {{ row.status === 'active' ? '可接单' : '忙碌中' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="openDetailDialog(row)">查看详情</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="total"
        layout="total, sizes, prev, pager, next, jumper"
        style="margin-top: 20px; justify-content: flex-end"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </el-card>

    <el-dialog
      v-model="detailDialogVisible"
      title="陪诊师详情"
      width="900px"
      :close-on-click-modal="false"
      class="escort-detail-dialog"
    >
      <el-tabs v-model="activeTab" type="border-card">
        <el-tab-pane label="基本信息" name="basic">
          <el-descriptions :column="2" border class="detail-desc">
            <el-descriptions-item label="姓名">{{ currentEscort.name }}</el-descriptions-item>
            <el-descriptions-item label="电话">{{ currentEscort.phone }}</el-descriptions-item>
            <el-descriptions-item label="城市">{{ currentEscort.city }}</el-descriptions-item>
            <el-descriptions-item label="评分">
              <el-rate v-model="currentEscort.rating" disabled show-score />
            </el-descriptions-item>
            <el-descriptions-item label="熟悉医院" :span="2">
              <el-tag
                v-for="hospital in hospitalList"
                :key="hospital"
                type="primary"
                size="small"
                style="margin-right: 8px; margin-bottom: 4px"
              >
                {{ hospital }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="资质">{{ currentEscort.qualifications }}</el-descriptions-item>
            <el-descriptions-item label="工龄">{{ currentEscort.work_years || '3年' }}</el-descriptions-item>
            <el-descriptions-item label="可服务时间" :span="2">
              {{ currentEscort.available_times }}
            </el-descriptions-item>
            <el-descriptions-item label="禁接标签" :span="2">
              <el-tag
                v-for="tag in currentEscort.forbidden_tags || []"
                :key="tag"
                type="danger"
                size="small"
                style="margin-right: 8px; margin-bottom: 4px"
              >
                {{ tag }}
              </el-tag>
              <span v-if="!currentEscort.forbidden_tags || currentEscort.forbidden_tags.length === 0">无</span>
            </el-descriptions-item>
          </el-descriptions>
        </el-tab-pane>

        <el-tab-pane label="匹配推荐" name="match">
          <div class="match-section">
            <el-alert
              title="推荐依据"
              type="success"
              :closable="false"
              show-icon
              style="margin-bottom: 20px"
            >
              <template #default>
                <p>• 医院匹配度：<strong>{{ matchScore.hospital }}%</strong> - 熟悉该医院所有科室位置和就诊流程</p>
                <p>• 时间匹配度：<strong>{{ matchScore.time }}%</strong> - 服务时间与订单时间完全匹配</p>
                <p>• 距离匹配度：<strong>{{ matchScore.distance }}%</strong> - 常住地距离医院{{ matchScore.distance_value }}公里</p>
                <p>• 综合匹配度：<strong>{{ matchScore.total }}%</strong> - 推荐优先级第{{ matchScore.rank }}位</p>
              </template>
            </el-alert>

            <h4>可接订单条件</h4>
            <el-table :data="matchConditions" border stripe>
              <el-table-column prop="condition" label="条件" width="200" />
              <el-table-column prop="status" label="状态" width="100">
                <template #default="{ row }">
                  <el-tag :type="row.pass ? 'success' : 'danger'">
                    {{ row.pass ? '满足' : '不满足' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="description" label="说明" />
            </el-table>
          </div>
        </el-tab-pane>

        <el-tab-pane label="历史服务评价" name="reviews">
          <div class="reviews-section">
            <div class="reviews-summary">
              <div class="avg-rating">
                <span class="rating-number">{{ avgRating }}</span>
                <el-rate v-model="avgRating" disabled />
                <span class="review-count">{{ reviews.length }}条评价</span>
              </div>
            </div>
            <el-divider />
            <div class="reviews-list">
              <div v-for="(review, index) in reviews" :key="index" class="review-item">
                <div class="review-header">
                  <el-avatar :size="40">{{ review.patient_name.charAt(0) }}</el-avatar>
                  <div class="review-info">
                    <span class="reviewer-name">{{ review.patient_name }}</span>
                    <el-rate v-model="review.rating" disabled size="small" />
                  </div>
                  <span class="review-time">{{ review.service_time }}</span>
                </div>
                <div class="review-content">{{ review.content }}</div>
                <div class="review-order" v-if="review.order_no">
                  <el-tag size="small" type="info">订单号: {{ review.order_no }}</el-tag>
                </div>
                <el-divider v-if="index < reviews.length - 1" />
              </div>
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane label="服务记录" name="records">
          <div class="records-section">
            <div class="records-header">
              <span>最近30天服务订单列表</span>
              <el-tag type="info">共 {{ serviceRecords.length }} 单</el-tag>
            </div>
            <el-table :data="serviceRecords" border stripe style="margin-top: 15px">
              <el-table-column prop="order_no" label="订单号" width="150" />
              <el-table-column prop="patient_name" label="患者" width="100" />
              <el-table-column prop="hospital" label="医院" show-overflow-tooltip />
              <el-table-column prop="service_date" label="服务日期" width="120" />
              <el-table-column prop="service_hours" label="服务时长" width="100">
                <template #default="{ row }">{{ row.service_hours }}小时</template>
              </el-table-column>
              <el-table-column prop="total_fee" label="服务费" width="100">
                <template #default="{ row }">¥{{ row.total_fee }}</template>
              </el-table-column>
              <el-table-column label="状态" width="100">
                <template #default="{ row }">
                  <el-tag type="success">已完成</el-tag>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-tab-pane>

        <el-tab-pane label="改派记录" name="reassign">
          <div class="reassign-section">
            <el-alert
              :title="'累计改派 ' + reassignRecords.length + ' 次'"
              :type="reassignRecords.length > 2 ? 'warning' : 'info'"
              :closable="false"
              show-icon
              style="margin-bottom: 20px"
            />
            <el-table :data="reassignRecords" border stripe v-if="reassignRecords.length > 0">
              <el-table-column prop="order_no" label="订单号" width="150" />
              <el-table-column prop="reassign_time" label="改派时间" width="180" />
              <el-table-column prop="original_escort" label="原陪诊师" width="120" />
              <el-table-column prop="new_escort" label="新陪诊师" width="120" />
              <el-table-column prop="reason" label="改派原因" show-overflow-tooltip />
              <el-table-column prop="operator" label="操作人" width="100" />
            </el-table>
            <el-empty v-else description="暂无改派记录" />
          </div>
        </el-tab-pane>

        <el-tab-pane label="投诉退款" name="complaint">
          <div class="complaint-section">
            <div class="complaint-stats">
              <el-statistic title="投诉次数" :value="complaintStats.total" />
              <el-statistic title="有效投诉" :value="complaintStats.valid" />
              <el-statistic title="退款次数" :value="complaintStats.refund" />
              <el-statistic title="退款金额(元)" :value="complaintStats.refund_amount" />
            </div>
            <el-table :data="complaintRecords" border stripe style="margin-top: 20px" v-if="complaintRecords.length > 0">
              <el-table-column prop="order_no" label="订单号" width="150" />
              <el-table-column prop="type" label="类型" width="120" />
              <el-table-column prop="content" label="投诉内容" show-overflow-tooltip />
              <el-table-column prop="status" label="处理状态" width="100">
                <template #default="{ row }">
                  <el-tag :type="row.status === 'processed' ? 'success' : 'warning'">
                    {{ row.status === 'processed' ? '已处理' : '待处理' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="refund_amount" label="退款金额" width="100">
                <template #default="{ row }">
                  <span v-if="row.refund_amount" class="refund-amount">-¥{{ row.refund_amount }}</span>
                  <span v-else>-</span>
                </template>
              </el-table-column>
              <el-table-column prop="handle_result" label="处理结果" show-overflow-tooltip />
            </el-table>
            <el-empty v-else description="暂无投诉记录" />
          </div>
        </el-tab-pane>

        <el-tab-pane label="分账结算" name="settlement">
          <div class="settlement-section">
            <div class="settlement-stats">
              <el-statistic title="累计完成订单" :value="settlementStats.total_orders" />
              <el-statistic title="累计服务金额" :value="settlementStats.total_amount" :precision="2" prefix="¥" />
              <el-statistic title="累计分成收入" :value="settlementStats.escort_share" :precision="2" prefix="¥" />
              <el-statistic title="待结算金额" :value="settlementStats.pending_amount" :precision="2" prefix="¥" />
            </div>
            <h4 style="margin: 20px 0 10px 0">最近结算记录</h4>
            <el-table :data="settlementRecords" border stripe v-if="settlementRecords.length > 0">
              <el-table-column prop="settle_no" label="结算单号" width="180" />
              <el-table-column prop="order_no" label="关联订单" width="150" />
              <el-table-column prop="total_amount" label="订单金额" width="100">
                <template #default="{ row }">¥{{ row.total_amount }}</template>
              </el-table-column>
              <el-table-column prop="escort_share" label="陪诊师分成" width="120">
                <template #default="{ row }">
                  <span class="share-income">¥{{ row.escort_share }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="platform_fee" label="平台费用" width="100">
                <template #default="{ row }">¥{{ row.platform_fee }}</template>
              </el-table-column>
              <el-table-column prop="settle_time" label="结算时间" width="180" />
            </el-table>
            <el-empty v-else description="暂无结算记录" />
          </div>
        </el-tab-pane>
      </el-tabs>

      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import request from '../api/request.js'

const searchName = ref('')
const searchCity = ref('')
const escorts = ref([])
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

const detailDialogVisible = ref(false)
const activeTab = ref('basic')
const currentEscort = ref({})
const reviews = ref([])
const serviceRecords = ref([])
const reassignRecords = ref([])
const complaintRecords = ref([])
const settlementRecords = ref([])

const matchScore = ref({
  hospital: 95,
  time: 100,
  distance: 85,
  distance_value: 5.2,
  total: 93,
  rank: 1
})

const matchConditions = ref([
  { condition: '服务时间可用', status: '满足', pass: true, description: '就诊时段无其他订单安排' },
  { condition: '医院熟悉度', status: '满足', pass: true, description: '该医院服务过25次，熟悉各科室位置' },
  { condition: '无禁接标签', status: '满足', pass: true, description: '订单服务事项不在禁接范围内' },
  { condition: '评分要求', status: '满足', pass: true, description: '评分4.8分，高于4.5分要求' },
  { condition: '距离要求', status: '满足', pass: true, description: '距离医院5.2公里，可准时到达' }
])

const complaintStats = ref({
  total: 2,
  valid: 1,
  refund: 1,
  refund_amount: 200
})

const settlementStats = ref({
  total_orders: 156,
  total_amount: 62400,
  escort_share: 43680,
  pending_amount: 2800
})

const hospitalList = computed(() => {
  if (!currentEscort.value.hospitals) return []
  return currentEscort.value.hospitals.split(/[,，、]/).filter(h => h.trim())
})

const avgRating = computed(() => {
  if (reviews.value.length === 0) return 0
  const sum = reviews.value.reduce((acc, r) => acc + r.rating, 0)
  return Math.round((sum / reviews.value.length) * 10) / 10
})

const filteredEscorts = computed(() => {
  let result = escorts.value
  if (searchName.value) {
    result = result.filter(item =>
      item.name.includes(searchName.value)
    )
  }
  if (searchCity.value) {
    result = result.filter(item => item.city === searchCity.value)
  }
  return result
})

const fetchEscorts = async () => {
  try {
    const data = await request.get('/escorts')
    escorts.value = data
    total.value = data.length
  } catch (error) {
    ElMessage.error('获取陪诊师列表失败')
  }
}

const handleSearch = () => {
  currentPage.value = 1
}

const handleSizeChange = (val) => {
  pageSize.value = val
}

const handleCurrentChange = (val) => {
  currentPage.value = val
}

const openDetailDialog = async (row) => {
  currentEscort.value = row
  activeTab.value = 'basic'
  
  matchScore.value = {
    hospital: Math.floor(Math.random() * 20) + 80,
    time: Math.floor(Math.random() * 20) + 80,
    distance: Math.floor(Math.random() * 20) + 70,
    distance_value: (Math.random() * 10 + 1).toFixed(1),
    total: 0,
    rank: Math.floor(Math.random() * 5) + 1
  }
  matchScore.value.total = Math.floor((matchScore.value.hospital + matchScore.value.time + matchScore.value.distance) / 3)
  
  reviews.value = [
    {
      patient_name: '张先生',
      rating: 5,
      content: '非常专业，全程服务很贴心，对医院流程很熟悉，帮我们节省了很多时间。强烈推荐！',
      service_time: '2024-01-15',
      order_no: 'ORD20240115001'
    },
    {
      patient_name: '李女士',
      rating: 5,
      content: '陪诊师很有耐心，老人行动不便，全程照顾得很好。对医生的建议也能很好地转达给我们。',
      service_time: '2024-01-10',
      order_no: 'ORD20240110002'
    },
    {
      patient_name: '王先生',
      rating: 4,
      content: '整体服务不错，就是路上稍微有点堵车，建议可以早点出发。其他方面都很满意。',
      service_time: '2024-01-05',
      order_no: 'ORD20240105003'
    },
    {
      patient_name: '赵女士',
      rating: 5,
      content: '从挂号到取药全程陪同，非常专业，省去了很多麻烦。下次还会找这位陪诊师。',
      service_time: '2023-12-28',
      order_no: 'ORD20231228004'
    },
    {
      patient_name: '孙先生',
      rating: 5,
      content: '陪诊师对医院环境非常熟悉，各个科室的位置都很清楚，效率很高。',
      service_time: '2023-12-20',
      order_no: 'ORD20231220005'
    }
  ]
  
  serviceRecords.value = [
    {
      order_no: 'ORD20240120001',
      patient_name: '刘先生',
      hospital: '北京协和医院',
      service_date: '2024-01-20',
      service_hours: 4,
      total_fee: 400
    },
    {
      order_no: 'ORD20240118002',
      patient_name: '陈女士',
      hospital: '北京大学第一医院',
      service_date: '2024-01-18',
      service_hours: 6,
      total_fee: 600
    },
    {
      order_no: 'ORD20240115003',
      patient_name: '周先生',
      hospital: '中国人民解放军总医院',
      service_date: '2024-01-15',
      service_hours: 8,
      total_fee: 800
    },
    {
      order_no: 'ORD20240112004',
      patient_name: '吴女士',
      hospital: '北京协和医院',
      service_date: '2024-01-12',
      service_hours: 2,
      total_fee: 200
    },
    {
      order_no: 'ORD20240110005',
      patient_name: '郑先生',
      hospital: '北京大学第一医院',
      service_date: '2024-01-10',
      service_hours: 4,
      total_fee: 400
    },
    {
      order_no: 'ORD20240108006',
      patient_name: '冯女士',
      hospital: '中国人民解放军总医院',
      service_date: '2024-01-08',
      service_hours: 3,
      total_fee: 300
    }
  ]
  
  reassignRecords.value = [
    {
      order_no: 'ORD20240105008',
      reassign_time: '2024-01-04 16:30:00',
      original_escort: currentEscort.value.name,
      new_escort: '王陪诊',
      reason: '突发身体不适，无法按时服务',
      operator: '李主管'
    },
    {
      order_no: 'ORD20231220015',
      reassign_time: '2023-12-19 09:15:00',
      original_escort: currentEscort.value.name,
      new_escort: '张陪诊',
      reason: '患者要求更换，对陪诊师性别有特殊要求',
      operator: '王主管'
    }
  ]
  
  complaintRecords.value = [
    {
      order_no: 'ORD20240108006',
      type: '服务态度',
      content: '陪诊师沟通不够及时，等待时间较长',
      status: 'processed',
      refund_amount: 100,
      handle_result: '已向患者道歉，退还部分费用，对陪诊师进行培训'
    },
    {
      order_no: 'ORD20231215012',
      type: '其他',
      content: '患者家属表示非常满意，误点投诉',
      status: 'processed',
      refund_amount: 0,
      handle_result: '经核实为误操作，已电话回访确认'
    }
  ]
  
  settlementRecords.value = [
    {
      settle_no: 'SET202401200001',
      order_no: 'ORD20240120001',
      total_amount: 400,
      escort_share: 280,
      platform_fee: 120,
      settle_time: '2024-01-21 10:30:00'
    },
    {
      settle_no: 'SET2024011800002',
      order_no: 'ORD20240118002',
      total_amount: 600,
      escort_share: 420,
      platform_fee: 180,
      settle_time: '2024-01-19 10:30:00'
    },
    {
      settle_no: 'SET2024011500003',
      order_no: 'ORD20240115003',
      total_amount: 800,
      escort_share: 560,
      platform_fee: 240,
      settle_time: '2024-01-16 10:30:00'
    },
    {
      settle_no: 'SET2024011200004',
      order_no: 'ORD20240112004',
      total_amount: 200,
      escort_share: 140,
      platform_fee: 60,
      settle_time: '2024-01-13 10:30:00'
    }
  ]
  
  detailDialogVisible.value = true
}

onMounted(() => {
  fetchEscorts()
})
</script>

<style scoped>
.escort-list {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.title {
  font-size: 18px;
  font-weight: 600;
}

.search-bar {
  display: flex;
  align-items: center;
}

.detail-desc {
  margin-top: 10px;
}

.match-section {
  padding: 10px 0;
}

.match-section h4 {
  margin: 20px 0 10px 0;
  font-size: 15px;
  color: #303133;
}

.reviews-section {
  padding: 10px 0;
}

.reviews-summary {
  text-align: center;
  padding: 20px;
  background: #f5f7fa;
  border-radius: 8px;
}

.avg-rating {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.rating-number {
  font-size: 32px;
  font-weight: 600;
  color: #f56c6c;
}

.review-count {
  color: #909399;
  font-size: 14px;
}

.reviews-list {
  max-height: 400px;
  overflow-y: auto;
}

.review-item {
  padding: 15px 0;
}

.review-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
}

.review-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.reviewer-name {
  font-weight: 500;
  color: #303133;
}

.review-time {
  color: #909399;
  font-size: 13px;
}

.review-content {
  color: #606266;
  line-height: 1.6;
  padding-left: 52px;
}

.review-order {
  padding-left: 52px;
  margin-top: 8px;
}

.records-section {
  padding: 10px 0;
}

.records-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 15px;
  font-weight: 500;
}

.reassign-section {
  padding: 10px 0;
}

.complaint-section {
  padding: 10px 0;
}

.complaint-stats {
  display: flex;
  justify-content: space-around;
  padding: 20px;
  background: #f5f7fa;
  border-radius: 8px;
}

.refund-amount {
  color: #f56c6c;
  font-weight: 500;
}

.settlement-section {
  padding: 10px 0;
}

.settlement-stats {
  display: flex;
  justify-content: space-around;
  padding: 20px;
  background: #f5f7fa;
  border-radius: 8px;
}

.share-income {
  color: #67c23a;
  font-weight: 600;
  font-size: 16px;
}

.escort-detail-dialog :deep(.el-dialog__body) {
  max-height: 70vh;
  overflow-y: auto;
}
</style>
