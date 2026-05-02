<template>
  <div class="demand-list">
    <div class="page-header">
      <h1>需求管理</h1>
      <el-button type="primary" @click="showCreateModal = true">创建需求</el-button>
    </div>

    <el-table :data="demands" border>
      <el-table-column prop="demandNumber" label="需求编号" />
      <el-table-column prop="customerName" label="客户名称" />
      <el-table-column prop="houseType" label="户型" />
      <el-table-column prop="area" label="面积" />
      <el-table-column prop="style" label="风格" />
      <el-table-column prop="status" label="状态">
        <template #default="scope">
          <el-tag :type="getStatusType(scope.row.status)">{{ getStatusText(scope.row.status) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createdAt" label="创建时间" />
      <el-table-column label="操作">
        <template #default="scope">
          <el-button size="small" @click="goToDetail(scope.row.id)">查看</el-button>
          <el-button size="small" type="success" @click="assignDesigner(scope.row.id)">分配设计师</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog title="创建需求" v-model="showCreateModal">
      <el-form :model="form" label-width="120px">
        <el-form-item label="客户ID">
          <el-input v-model="form.customerId" />
        </el-form-item>
        <el-form-item label="户型">
          <el-input v-model="form.houseType" />
        </el-form-item>
        <el-form-item label="面积">
          <el-input v-model.number="form.area" />
        </el-form-item>
        <el-form-item label="风格">
          <el-input v-model="form.style" />
        </el-form-item>
        <el-form-item label="预算范围">
          <el-input v-model="form.budgetRange" />
        </el-form-item>
        <el-form-item label="地址">
          <el-input v-model="form.address" />
        </el-form-item>
        <el-form-item label="联系人">
          <el-input v-model="form.contactName" />
        </el-form-item>
        <el-form-item label="联系电话">
          <el-input v-model="form.contactPhone" />
        </el-form-item>
        <el-form-item label="描述">
          <el-textarea v-model="form.description" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateModal = false">取消</el-button>
        <el-button type="primary" @click="createDemand">创建</el-button>
      </template>
    </el-dialog>

    <el-dialog title="分配设计师" v-model="showAssignModal">
      <el-form :model="assignForm" label-width="120px">
        <el-form-item label="设计师ID">
          <el-input v-model="assignForm.designerId" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAssignModal = false">取消</el-button>
        <el-button type="primary" @click="confirmAssign">确认分配</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { demandApi } from '../api'

const router = useRouter()
const demands = ref([])
const showCreateModal = ref(false)
const showAssignModal = ref(false)
const currentDemandId = ref('')

const form = ref({
  customerId: '',
  houseType: '',
  area: 0,
  style: '',
  budgetRange: '',
  address: '',
  province: '',
  city: '',
  district: '',
  contactName: '',
  contactPhone: '',
  description: ''
})

const assignForm = ref({
  designerId: 'test-designer-id'
})

onMounted(async () => {
  await loadDemands()
})

const loadDemands = async () => {
  try {
    const res = await demandApi.list()
    demands.value = res.data.data?.demands || res.data.demands || []
  } catch (error) {
    console.error('加载需求列表失败:', error)
  }
}

const goToDetail = (id: string) => {
  router.push(`/demands/${id}`)
}

const createDemand = async () => {
  try {
    const requestData = {
      ...form.value,
      area: Number(form.value.area) || 0
    }
    const response = await demandApi.create(requestData)
    if (response.data.success) {
      showCreateModal.value = false
      await loadDemands()
      form.value = {
        customerId: '',
        houseType: '',
        area: 0,
        style: '',
        budgetRange: '',
        address: '',
        province: '',
        city: '',
        district: '',
        contactName: '',
        contactPhone: '',
        description: ''
      }
      ElMessage.success('需求创建成功')
    } else {
      ElMessage.error(response.data.message || '创建需求失败')
    }
  } catch (error: any) {
    console.error('创建需求失败:', error.response?.data || error.message)
    ElMessage.error('创建需求失败: ' + (error.response?.data?.message || error.message))
  }
}

const assignDesigner = (id: string) => {
  currentDemandId.value = id
  showAssignModal.value = true
}

const confirmAssign = async () => {
  try {
    const response = await demandApi.assignDesigner(currentDemandId.value, assignForm.value)
    if (response.data.success) {
      showAssignModal.value = false
      await loadDemands()
      ElMessage.success('设计师分配成功')
    } else {
      ElMessage.error(response.data.message || '分配设计师失败')
    }
  } catch (error: any) {
    console.error('分配设计师失败:', error.response?.data || error.message)
    ElMessage.error('分配设计师失败: ' + (error.response?.data?.message || error.message))
  }
}

const getStatusType = (status: string) => {
  const types: Record<string, string> = {
    'PENDING': 'warning',
    'DESIGNER_ASSIGNED': 'info',
    'MEASUREMENT_SCHEDULED': 'info',
    'MEASURED': 'success',
    'DESIGN_IN_PROGRESS': 'warning',
    'DESIGN_SUBMITTED': 'info',
    'DESIGN_APPROVED': 'success',
    'QUOTED': 'success',
    'ORDER_CREATED': 'success'
  }
  return types[status] || 'default'
}

const getStatusText = (status: string) => {
  const texts: Record<string, string> = {
    'PENDING': '待处理',
    'DESIGNER_ASSIGNED': '已分配设计师',
    'MEASUREMENT_SCHEDULED': '量尺已安排',
    'MEASURED': '已量尺',
    'DESIGN_IN_PROGRESS': '设计中',
    'DESIGN_SUBMITTED': '设计已提交',
    'DESIGN_APPROVED': '设计已审核',
    'QUOTED': '已报价',
    'ORDER_CREATED': '已下单'
  }
  return texts[status] || status
}
</script>

<style scoped>
.demand-list {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h1 {
  margin: 0;
}
</style>