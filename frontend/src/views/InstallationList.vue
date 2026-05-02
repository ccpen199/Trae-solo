<template>
  <div class="installation-list">
    <div class="page-header">
      <h1>安装管理</h1>
      <el-button type="primary" @click="showCreateModal = true">创建安装任务</el-button>
    </div>

    <el-table :data="installations" border>
      <el-table-column prop="taskNumber" label="任务编号" />
      <el-table-column prop="address" label="安装地址" />
      <el-table-column prop="contactName" label="联系人" />
      <el-table-column prop="contactPhone" label="联系电话" />
      <el-table-column prop="status" label="状态">
        <template #default="scope">
          <el-tag :type="getStatusType(scope.row.status)">{{ getStatusText(scope.row.status) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="installerName" label="安装师傅" />
      <el-table-column prop="scheduledDate" label="安排日期" />
      <el-table-column label="操作">
        <template #default="scope">
          <el-button size="small" @click="viewInstallation(scope.row)">查看</el-button>
          <el-button size="small" type="primary" @click="autoAssign(scope.row.id)" v-if="scope.row.status === 'PENDING_ASSIGNMENT'">智能派工</el-button>
          <el-button size="small" type="success" @click="startInstallation(scope.row.id)" v-if="scope.row.status === 'ASSIGNED'">开始安装</el-button>
          <el-button size="small" type="success" @click="completeInstallation(scope.row.id)" v-if="scope.row.status === 'IN_PROGRESS'">完成安装</el-button>
          <el-button size="small" type="primary" @click="acceptInstallation(scope.row.id)" v-if="scope.row.status === 'COMPLETED'">验收</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog title="创建安装任务" v-model="showCreateModal">
      <el-form :model="form" label-width="120px">
        <el-form-item label="订单ID">
          <el-input v-model="form.orderId" />
        </el-form-item>
        <el-form-item label="安装地址">
          <el-input v-model="form.address" />
        </el-form-item>
        <el-form-item label="省">
          <el-input v-model="form.province" />
        </el-form-item>
        <el-form-item label="市">
          <el-input v-model="form.city" />
        </el-form-item>
        <el-form-item label="区">
          <el-input v-model="form.district" />
        </el-form-item>
        <el-form-item label="联系人">
          <el-input v-model="form.contactName" />
        </el-form-item>
        <el-form-item label="联系电话">
          <el-input v-model="form.contactPhone" />
        </el-form-item>
        <el-form-item label="难度等级">
          <el-select v-model="form.difficultyLevel">
            <el-option label="简单" value="EASY" />
            <el-option label="中等" value="MEDIUM" />
            <el-option label="困难" value="HARD" />
            <el-option label="专家" value="EXPERT" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateModal = false">取消</el-button>
        <el-button type="primary" @click="createInstallation">创建</el-button>
      </template>
    </el-dialog>

    <el-dialog title="智能派工" v-model="showAssignModal">
      <el-form :model="assignForm" label-width="120px">
        <el-form-item label="期望日期">
          <el-date-picker v-model="assignForm.preferredDate" type="date" />
        </el-form-item>
        <el-form-item label="时间段">
          <el-select v-model="assignForm.timeSlot">
            <el-option label="上午" value="上午" />
            <el-option label="下午" value="下午" />
            <el-option label="全天" value="全天" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAssignModal = false">取消</el-button>
        <el-button type="primary" @click="confirmAutoAssign">确认派工</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { installationApi } from '../api'

const installations = ref([])
const showCreateModal = ref(false)
const showAssignModal = ref(false)
const currentInstallationId = ref('')

const form = ref({
  orderId: '',
  address: '',
  province: '',
  city: '',
  district: '',
  contactName: '',
  contactPhone: '',
  difficultyLevel: 'MEDIUM'
})

const assignForm = ref({
  preferredDate: new Date(Date.now() + 172800000),
  timeSlot: '上午'
})

onMounted(async () => {
  await loadInstallations()
})

const loadInstallations = async () => {
  try {
    const res = await installationApi.list()
    installations.value = res.data.data?.installations || res.data.installations || []
  } catch (error) {
    console.error('加载安装任务失败:', error)
  }
}

const createInstallation = async () => {
  try {
    await installationApi.create(form.value)
    showCreateModal.value = false
    await loadInstallations()
    form.value = {
      orderId: '',
      address: '',
      province: '',
      city: '',
      district: '',
      contactName: '',
      contactPhone: '',
      difficultyLevel: 'MEDIUM'
    }
    alert('安装任务创建成功')
  } catch (error) {
    console.error('创建安装任务失败:', error)
    alert('创建安装任务失败')
  }
}

const autoAssign = (id: string) => {
  currentInstallationId.value = id
  showAssignModal.value = true
}

const confirmAutoAssign = async () => {
  try {
    await installationApi.autoAssign(currentInstallationId.value, {
      preferredDate: assignForm.value.preferredDate.toISOString(),
      timeSlot: assignForm.value.timeSlot
    })
    showAssignModal.value = false
    await loadInstallations()
    alert('智能派工成功')
  } catch (error) {
    console.error('智能派工失败:', error)
    alert('智能派工失败')
  }
}

const startInstallation = async (id: string) => {
  try {
    await installationApi.start(id, { installerId: 'test-installer-id' })
    await loadInstallations()
    alert('安装开始成功')
  } catch (error) {
    console.error('开始安装失败:', error)
    alert('开始安装失败')
  }
}

const completeInstallation = async (id: string) => {
  try {
    await installationApi.complete(id, {
      installerId: 'test-installer-id',
      installationPhotos: ['install1.jpg', 'install2.jpg'],
      notes: '安装完成'
    })
    await loadInstallations()
    alert('安装完成成功')
  } catch (error) {
    console.error('完成安装失败:', error)
    alert('完成安装失败')
  }
}

const acceptInstallation = async (id: string) => {
  try {
    await installationApi.accept(id, {
      customerId: 'test-user-id',
      customerFeedback: '安装效果很好',
      customerRating: 5
    })
    await loadInstallations()
    alert('验收成功')
  } catch (error) {
    console.error('验收失败:', error)
    alert('验收失败')
  }
}

const viewInstallation = (installation: any) => {
  console.log('查看安装任务:', installation)
}

const getStatusType = (status: string) => {
  const types: Record<string, string> = {
    'PENDING_ASSIGNMENT': 'warning',
    'ASSIGNED': 'info',
    'SCHEDULED': 'info',
    'IN_PROGRESS': 'primary',
    'COMPLETED': 'success',
    'ACCEPTED': 'success',
    'CANCELLED': 'danger'
  }
  return types[status] || 'default'
}

const getStatusText = (status: string) => {
  const texts: Record<string, string> = {
    'PENDING_ASSIGNMENT': '待分配',
    'ASSIGNED': '已分配',
    'SCHEDULED': '已安排',
    'IN_PROGRESS': '安装中',
    'COMPLETED': '已完成',
    'ACCEPTED': '已验收',
    'CANCELLED': '已取消'
  }
  return texts[status] || status
}
</script>

<style scoped>
.installation-list {
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