<template>
  <div class="alarms-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>告警管理</span>
          <div>
            <el-radio-group v-model="filterStatus" @change="fetchAlarms" style="margin-right: 10px">
              <el-radio-button label="">全部</el-radio-button>
              <el-radio-button label="pending">待处理</el-radio-button>
              <el-radio-button label="handled">已处理</el-radio-button>
            </el-radio-group>
            <el-button type="primary" @click="fetchAlarms">
              <el-icon><Refresh /></el-icon>
              刷新
            </el-button>
          </div>
        </div>
      </template>

      <el-table :data="alarmList" v-loading="loading" style="width: 100%">
        <el-table-column prop="alarm_id" label="告警ID" width="180" />
        <el-table-column prop="alarm_type" label="告警类型" width="120">
          <template #default="{ row }">
            <el-tag :type="getAlarmTypeTag(row.alarm_type)">{{ getAlarmTypeName(row.alarm_type) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="alarm_level" label="级别" width="100">
          <template #default="{ row }">
            <el-tag :type="getLevelTag(row.alarm_level)">{{ getLevelName(row.alarm_level) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="message" label="告警信息" />
        <el-table-column prop="main_order_no" label="关联主单" width="180">
          <template #default="{ row }">
            <el-link v-if="row.main_order_no" type="primary" @click="goToOrder(row.main_order_no)">
              {{ row.main_order_no }}
            </el-link>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="is_handled" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.is_handled ? 'success' : 'warning'">
              {{ row.is_handled ? '已处理' : '待处理' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatTime(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button 
              v-if="!row.is_handled" 
              type="primary" 
              link 
              @click="openHandleDialog(row)"
            >
              处理
            </el-button>
            <el-button v-else type="info" link @click="viewDetail(row)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :total="pagination.total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="fetchAlarms"
        @current-change="fetchAlarms"
        style="margin-top: 20px; justify-content: flex-end"
      />
    </el-card>

    <el-dialog v-model="handleDialog.visible" title="处理告警" width="500px">
      <el-descriptions :column="1" border size="small" style="margin-bottom: 20px">
        <el-descriptions-item label="告警ID">{{ handleDialog.alarm?.alarm_id }}</el-descriptions-item>
        <el-descriptions-item label="告警类型">{{ getAlarmTypeName(handleDialog.alarm?.alarm_type) }}</el-descriptions-item>
        <el-descriptions-item label="告警级别">{{ getLevelName(handleDialog.alarm?.alarm_level) }}</el-descriptions-item>
        <el-descriptions-item label="告警信息">{{ handleDialog.alarm?.message }}</el-descriptions-item>
      </el-descriptions>
      <el-form label-width="100px">
        <el-form-item label="处理结果">
          <el-input 
            v-model="handleDialog.handle_result" 
            type="textarea" 
            :rows="3" 
            placeholder="请输入处理结果"
          ></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="handleDialog.visible = false">取消</el-button>
        <el-button type="primary" @click="submitHandle" :loading="actionLoading">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { alarmApi } from '@/api'
import { ElMessage } from 'element-plus'

const router = useRouter()

const loading = ref(false)
const actionLoading = ref(false)
const alarmList = ref([])
const filterStatus = ref('')

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

const handleDialog = reactive({
  visible: false,
  alarm: null,
  handle_result: ''
})

const alarmTypeMap = {
  drift: { name: '定位漂移', tag: 'danger' },
  route_deviation: { name: '路线偏离', tag: 'danger' },
  abnormal_stop: { name: '异常停留', tag: 'warning' },
  driver_refuse: { name: '司机拒接', tag: 'danger' },
  arrival_unconfirmed: { name: '到达未确认', tag: 'warning' },
  map_callback_delay: { name: '地图回调延迟', tag: 'info' }
}

const levelMap = {
  high: { name: '高', tag: 'danger' },
  medium: { name: '中', tag: 'warning' },
  low: { name: '低', tag: 'info' }
}

function getAlarmTypeName(type) {
  return alarmTypeMap[type]?.name || type
}

function getAlarmTypeTag(type) {
  return alarmTypeMap[type]?.tag || 'info'
}

function getLevelName(level) {
  return levelMap[level]?.name || level
}

function getLevelTag(level) {
  return levelMap[level]?.tag || 'info'
}

function formatTime(time) {
  if (!time) return '-'
  return new Date(time).toLocaleString('zh-CN')
}

async function fetchAlarms() {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize
    }
    
    if (filterStatus.value === 'pending') {
      params.is_handled = false
    } else if (filterStatus.value === 'handled') {
      params.is_handled = true
    }

    const result = await alarmApi.list(params)
    alarmList.value = result.data
    pagination.total = result.pagination.total
  } catch (error) {
    console.error('获取告警列表失败:', error)
  } finally {
    loading.value = false
  }
}

function openHandleDialog(alarm) {
  handleDialog.alarm = alarm
  handleDialog.handle_result = ''
  handleDialog.visible = true
}

function viewDetail(alarm) {
  console.log('查看告警详情:', alarm)
  ElMessage.info('详情功能开发中')
}

async function submitHandle() {
  if (!handleDialog.alarm) return
  
  actionLoading.value = true
  try {
    await alarmApi.handle(handleDialog.alarm.alarm_id, {
      handle_result: handleDialog.handle_result
    })
    ElMessage.success('处理成功')
    handleDialog.visible = false
    fetchAlarms()
  } catch (error) {
    console.error('处理失败:', error)
  } finally {
    actionLoading.value = false
  }
}

function goToOrder(mainOrderNo) {
  router.push(`/orders/${mainOrderNo}`)
}

onMounted(() => {
  fetchAlarms()
})
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
