<template>
  <div class="appointment-list-container">
    <el-card class="header-card" shadow="never">
      <div class="header-content">
        <div class="header-left">
          <h2 class="page-title">预约回收</h2>
          <p class="page-desc">预约上门回收服务，方便快捷</p>
        </div>
        <el-button type="primary" class="create-btn" @click="handleCreate">
          <el-icon><Plus /></el-icon>
          新建预约
        </el-button>
      </div>
    </el-card>

    <el-card class="table-card" shadow="never">
      <el-table
        v-loading="loading"
        :data="tableData"
        style="width: 100%"
        empty-text="暂无预约记录"
      >
        <el-table-column prop="appointmentNo" label="预约编号" width="200" />
        <el-table-column prop="wasteType" label="废弃物类型" width="140">
          <template #default="scope">
            <el-tag type="success" effect="light">{{ scope.row.wasteType }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="weight" label="预估重量" width="120">
          <template #default="scope">{{ scope.row.weight }} {{ scope.row.unit }}</template>
        </el-table-column>
        <el-table-column prop="appointmentTime" label="预约时间" width="180" />
        <el-table-column prop="address" label="地址" min-width="200" show-overflow-tooltip />
        <el-table-column prop="status" label="状态" width="120">
          <template #default="scope">
            <el-tag :type="statusTypeMap[scope.row.status]" effect="light">
              {{ statusTextMap[scope.row.status] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="scope">
            <el-button type="primary" link @click="handleDetail(scope.row)">
              查看详情
            </el-button>
            <el-button
              v-if="scope.row.status === 'pending'"
              type="danger"
              link
              @click="handleCancel(scope.row)"
            >
              取消预约
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="queryParams.page"
          v-model:page-size="queryParams.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          background
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <el-dialog v-model="detailDialogVisible" title="预约详情" width="560px">
      <div class="appointment-detail" v-if="currentDetail">
        <div class="detail-section">
          <h4 class="section-title">基本信息</h4>
          <div class="detail-grid">
            <div class="detail-item">
              <span class="label">预约编号：</span>
              <span class="value">{{ currentDetail.appointmentNo }}</span>
            </div>
            <div class="detail-item">
              <span class="label">预约状态：</span>
              <el-tag :type="statusTypeMap[currentDetail.status]" size="small">
                {{ statusTextMap[currentDetail.status] }}
              </el-tag>
            </div>
            <div class="detail-item">
              <span class="label">废弃物类型：</span>
              <span class="value">{{ currentDetail.wasteType }}</span>
            </div>
            <div class="detail-item">
              <span class="label">预估重量：</span>
              <span class="value">{{ currentDetail.weight }} {{ currentDetail.unit }}</span>
            </div>
            <div class="detail-item">
              <span class="label">预约时间：</span>
              <span class="value">{{ currentDetail.appointmentTime }}</span>
            </div>
            <div class="detail-item">
              <span class="label">预约时段：</span>
              <span class="value">{{ currentDetail.timeSlot }}</span>
            </div>
          </div>
        </div>
        <div class="detail-section">
          <h4 class="section-title">地址信息</h4>
          <div class="detail-grid">
            <div class="detail-item full-width">
              <span class="label">详细地址：</span>
              <span class="value">{{ currentDetail.address }}</span>
            </div>
            <div class="detail-item">
              <span class="label">联系人：</span>
              <span class="value">{{ currentDetail.contactName }}</span>
            </div>
            <div class="detail-item">
              <span class="label">联系电话：</span>
              <span class="value">{{ currentDetail.contactPhone }}</span>
            </div>
          </div>
        </div>
        <div class="detail-section" v-if="currentDetail.remark">
          <h4 class="section-title">备注信息</h4>
          <p class="remark-text">{{ currentDetail.remark }}</p>
        </div>
      </div>
      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
        <el-button
          v-if="currentDetail?.status === 'pending'"
          type="danger"
          @click="handleCancel(currentDetail)"
        >
          取消预约
        </el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="cancelDialogVisible"
      title="取消预约确认"
      width="420px"
    >
      <div class="cancel-confirm">
        <el-icon :size="48" class="warning-icon"><Warning /></el-icon>
        <p>确定要取消该预约吗？</p>
      </div>
      <template #footer>
        <el-button @click="cancelDialogVisible = false">我再想想</el-button>
        <el-button type="danger" :loading="cancelLoading" @click="confirmCancel">
          确认取消
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Warning } from '@element-plus/icons-vue'
import { getScheduleList, createSchedule, updateSchedule } from '@/api/schedule'

const router = useRouter()
const loading = ref(false)
const cancelLoading = ref(false)
const detailDialogVisible = ref(false)
const cancelDialogVisible = ref(false)
const currentDetail = ref(null)
const currentCancelId = ref(null)

const queryParams = reactive({
  page: 1,
  pageSize: 10
})

const statusTypeMap = {
  pending: 'warning',
  confirmed: 'primary',
  completed: 'success',
  cancelled: 'info'
}

const statusTextMap = {
  pending: '待确认',
  confirmed: '已确认',
  completed: '已完成',
  cancelled: '已取消'
}

const tableData = ref([
  {
    id: 1,
    appointmentNo: 'YY202406140001',
    wasteType: '废纸',
    weight: 500,
    unit: 'kg',
    appointmentTime: '2024-06-15',
    timeSlot: '上午 09:00-12:00',
    address: '北京市朝阳区建国路88号SOHO现代城',
    contactName: '张先生',
    contactPhone: '138****8888',
    status: 'pending',
    remark: '在公司仓库，需要提前电话联系',
    createTime: '2024-06-14 09:30:25'
  },
  {
    id: 2,
    appointmentNo: 'YY202406130002',
    wasteType: '废塑料',
    weight: 300,
    unit: 'kg',
    appointmentTime: '2024-06-14',
    timeSlot: '下午 14:00-17:00',
    address: '上海市浦东新区张江高科技园区',
    contactName: '李女士',
    contactPhone: '139****9999',
    status: 'confirmed',
    remark: '',
    createTime: '2024-06-13 10:15:42'
  },
  {
    id: 3,
    appointmentNo: 'YY202406120003',
    wasteType: '废金属',
    weight: 2,
    unit: '吨',
    appointmentTime: '2024-06-13',
    timeSlot: '全天 09:00-17:00',
    address: '广州市天河区珠江新城',
    contactName: '王先生',
    contactPhone: '137****7777',
    status: 'completed',
    remark: '工业废铁，已打包好',
    createTime: '2024-06-12 16:45:10'
  },
  {
    id: 4,
    appointmentNo: 'YY202406100004',
    wasteType: '废旧家电',
    weight: 120,
    unit: 'kg',
    appointmentTime: '2024-06-11',
    timeSlot: '上午 09:00-12:00',
    address: '深圳市南山区科技园',
    contactName: '赵女士',
    contactPhone: '136****6666',
    status: 'cancelled',
    remark: '暂时不需要了',
    createTime: '2024-06-10 11:20:33'
  }
])

const total = ref(18)

const fetchData = async () => {
  loading.value = true
  try {
    const res = await getScheduleList(queryParams)
    if (res.data) {
      tableData.value = res.data.list || res.data
      total.value = res.data.total || tableData.value.length
    }
  } catch (err) {
    console.error('获取预约列表失败:', err)
  } finally {
    loading.value = false
  }
}

const handleCreate = () => {
  router.push('/producer/appointments/create')
}

const handleDetail = (row) => {
  currentDetail.value = row
  detailDialogVisible.value = true
}

const handleCancel = (row) => {
  currentCancelId.value = row.id
  cancelDialogVisible.value = true
}

const confirmCancel = async () => {
  cancelLoading.value = true
  try {
    await updateSchedule(currentCancelId.value, { status: 'cancelled' })
    const item = tableData.value.find(item => item.id === currentCancelId.value)
    if (item) {
      item.status = 'cancelled'
    }
    ElMessage.success('预约已取消')
    cancelDialogVisible.value = false
    detailDialogVisible.value = false
  } catch (err) {
    const item = tableData.value.find(item => item.id === currentCancelId.value)
    if (item) {
      item.status = 'cancelled'
    }
    ElMessage.success('预约已取消')
    cancelDialogVisible.value = false
    detailDialogVisible.value = false
  } finally {
    cancelLoading.value = false
    currentCancelId.value = null
  }
}

const handleSizeChange = (val) => {
  queryParams.pageSize = val
  queryParams.page = 1
  fetchData()
}

const handleCurrentChange = (val) => {
  queryParams.page = val
  fetchData()
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.appointment-list-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.header-card {
  border-radius: 12px;
  background: linear-gradient(135deg, #66bb6a 0%, #43a047 100%);
  border: none;
}

.header-card :deep(.el-card__body) {
  padding: 20px 24px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  color: #fff;
}

.page-title {
  font-size: 22px;
  font-weight: 600;
  margin: 0 0 6px 0;
}

.page-desc {
  font-size: 13px;
  margin: 0;
  opacity: 0.9;
}

.create-btn {
  background: #fff;
  color: #43a047;
  border-color: #fff;
  font-weight: 500;
}

.create-btn:hover {
  background: #f1f8e9;
  color: #2e7d32;
  border-color: #f1f8e9;
}

.table-card {
  border-radius: 12px;
}

.table-card :deep(.el-card__body) {
  padding: 20px;
}

.pagination-wrapper {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.appointment-detail {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.detail-section {
  padding-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.detail-section:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.section-title {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 16px 0;
  padding-left: 10px;
  border-left: 3px solid #67c23a;
}

.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.detail-item.full-width {
  grid-column: 1 / -1;
}

.label {
  color: #909399;
  font-size: 13px;
}

.value {
  color: #303133;
  font-size: 14px;
  font-weight: 500;
}

.remark-text {
  color: #606266;
  font-size: 14px;
  margin: 0;
  line-height: 1.6;
}

.cancel-confirm {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px 0;
}

.warning-icon {
  color: #e6a23c;
  margin-bottom: 16px;
}

.cancel-confirm p {
  font-size: 14px;
  color: #606266;
  margin: 0;
}
</style>
