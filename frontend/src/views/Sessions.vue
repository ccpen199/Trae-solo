<template>
  <div class="sessions-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>看房会话列表</span>
          <div class="header-actions">
            <el-select v-model="filterStatus" placeholder="筛选状态" clearable style="width: 150px" @change="fetchSessions">
              <el-option label="待选房源" value="pending_house_selection" />
              <el-option label="待3D空间" value="pending_3d_space" />
              <el-option label="待看热点" value="pending_hotspot_view" />
              <el-option label="待咨询预约" value="pending_consultation" />
              <el-option label="待留资" value="pending_lead_capture" />
              <el-option label="已完成" value="completed" />
              <el-option label="已撤销" value="cancelled" />
              <el-option label="已驳回" value="rejected" />
            </el-select>
          </div>
        </div>
      </template>

      <el-table :data="sessions" v-loading="loading" style="width: 100%" stripe>
        <el-table-column prop="session_no" label="会话编号" width="180" />
        <el-table-column prop="house_name" label="房源名称" min-width="200">
          <template #default="scope">
            <el-button type="primary" link @click="goToHouse(scope.row.house_id)">{{ scope.row.house_name }}</el-button>
          </template>
        </el-table-column>
        <el-table-column prop="buyer_name" label="购房者" width="100" />
        <el-table-column prop="agent_name" label="经纪人" width="100" />
        <el-table-column prop="status" label="状态" width="140">
          <template #default="scope">
            <el-tag :type="getStatusType(scope.row.status)" size="large">
              {{ getStatusLabel(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="current_step" label="当前步骤" width="140">
          <template #default="scope">
            <el-steps :active="getStepIndex(scope.row.current_step)" align-center finish-status="success" simple>
              <el-step title="选房" />
              <el-step title="3D空间" />
              <el-step title="热点" />
              <el-step title="预约" />
              <el-step title="留资" />
            </el-steps>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="180">
          <template #default="scope">
            {{ scope.row.created_at }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="scope">
            <el-button type="primary" link @click="goToDetail(scope.row.id)">详情</el-button>
            <template v-for="action in scope.row.availableActions" :key="action.action">
              <el-button 
                :type="action.type === 'primary' ? 'success' : action.type === 'danger' ? 'danger' : 'warning'" 
                link 
                @click="executeAction(scope.row, action.action)"
              >
                {{ action.label }}
              </el-button>
            </template>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="fetchSessions"
          @current-change="fetchSessions"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { sessionsApi } from '@/api'

const router = useRouter()

const loading = ref(false)
const sessions = ref([])
const filterStatus = ref('')

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const getStatusType = (status) => {
  const typeMap = {
    'pending_house_selection': 'info',
    'pending_3d_space': 'warning',
    'pending_hotspot_view': 'primary',
    'pending_consultation': 'warning',
    'pending_lead_capture': 'primary',
    'completed': 'success',
    'cancelled': 'info',
    'rejected': 'danger'
  }
  return typeMap[status] || 'info'
}

const getStatusLabel = (status) => {
  const labelMap = {
    'pending_house_selection': '待选房源',
    'pending_3d_space': '待3D空间',
    'pending_hotspot_view': '待看热点',
    'pending_consultation': '待咨询预约',
    'pending_lead_capture': '待留资',
    'completed': '已完成',
    'cancelled': '已撤销',
    'rejected': '已驳回'
  }
  return labelMap[status] || status
}

const getStepIndex = (step) => {
  const stepMap = {
    'house_selection': 0,
    'three_d_space': 1,
    'hotspot_view': 2,
    'consultation': 3,
    'lead_capture': 4
  }
  return stepMap[step] || 0
}

const goToDetail = (id) => {
  router.push(`/sessions/${id}`)
}

const goToHouse = (id) => {
  router.push(`/houses/${id}`)
}

const executeAction = (row, action) => {
  if (action === 'cancel') {
    router.push(`/sessions/${row.id}`)
  } else {
    router.push(`/sessions/${row.id}`)
  }
}

const fetchSessions = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize
    }
    if (filterStatus.value) {
      params.status = filterStatus.value
    }
    
    const res = await sessionsApi.getList(params)
    sessions.value = res.sessions
    pagination.total = res.pagination.total
  } catch (error) {
    console.error('获取会话列表失败:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchSessions()
})
</script>

<style scoped>
.sessions-container {
  min-height: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.pagination-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}
</style>
