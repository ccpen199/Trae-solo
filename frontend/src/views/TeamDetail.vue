<template>
  <div class="team-detail">
    <el-page-header @back="goBack" content="团队详情">
      <template #content>
        <span style="font-size: 18px; font-weight: 500">{{ team?.name }}</span>
      </template>
    </el-page-header>

    <el-card style="margin-top: 16px">
      <template #header>
        <div class="card-header">
          <span>预订管理</span>
          <el-button type="primary" size="small" @click="openReservationDialog">
            <el-icon><Plus /></el-icon>
            添加预订
          </el-button>
        </div>
      </template>
      <el-table :data="reservations" v-loading="reservationLoading" size="small">
        <el-table-column prop="hotel_name" label="酒店" />
        <el-table-column prop="room_type_name" label="房型" />
        <el-table-column prop="date" label="日期" width="120" />
        <el-table-column prop="rooms_needed" label="房数" width="80" />
        <el-table-column prop="check_in" label="入住" width="120" />
        <el-table-column prop="check_out" label="离店" width="120" />
        <el-table-column prop="price" label="单价" width="100">
          <template #default="{ row }">¥{{ row.price }}</template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="row.status === 'reserved' ? 'success' : 'info'" size="small">
              {{ row.status === 'reserved' ? '已预订' : '已取消' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100">
          <template #default="{ row }">
            <el-button type="danger" link size="small" @click="cancelReservation(row)" v-if="row.status === 'reserved'">取消</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-card style="margin-top: 16px">
      <template #header>
        <div class="card-header">
          <span>游客名单</span>
          <el-button type="primary" size="small" @click="openTouristDialog">
            <el-icon><Plus /></el-icon>
            添加游客
          </el-button>
        </div>
      </template>
      <el-table :data="tourists" v-loading="touristLoading" size="small">
        <el-table-column prop="name" label="姓名" width="100" />
        <el-table-column prop="gender" label="性别" width="80" />
        <el-table-column prop="id_card" label="身份证号" />
        <el-table-column prop="phone" label="电话" width="130" />
        <el-table-column prop="room_number" label="房号" width="100" />
        <el-table-column prop="check_in" label="入住" width="120" />
        <el-table-column prop="check_out" label="离店" width="120" />
        <el-table-column prop="status" label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="row.status === 'confirmed' ? 'success' : 'info'" size="small">
              {{ row.status === 'confirmed' ? '已确认' : '已取消' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="editTourist(row)">编辑</el-button>
            <el-button type="danger" link size="small" @click="deleteTourist(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="reservationDialogVisible" title="添加预订" width="500px">
      <el-form :model="reservationForm" label-width="100px">
        <el-form-item label="控房计划">
          <el-select v-model="reservationForm.control_plan_id" placeholder="请选择">
            <el-option 
              v-for="plan in availablePlans" 
              :key="plan.id" 
              :label="`${plan.hotel_name} - ${plan.room_type_name} - ${plan.date} (可用:${plan.available_rooms})`" 
              :value="plan.id" 
            />
          </el-select>
        </el-form-item>
        <el-form-item label="房间数">
          <el-input-number v-model="reservationForm.rooms_needed" :min="1" />
        </el-form-item>
        <el-form-item label="入住日期">
          <el-date-picker v-model="reservationForm.check_in" type="date" />
        </el-form-item>
        <el-form-item label="离店日期">
          <el-date-picker v-model="reservationForm.check_out" type="date" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="reservationDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveReservation">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="touristDialogVisible" :title="isEditingTourist ? '编辑游客' : '添加游客'" width="500px">
      <el-form :model="touristForm" label-width="100px">
        <el-form-item label="姓名">
          <el-input v-model="touristForm.name" />
        </el-form-item>
        <el-form-item label="性别">
          <el-radio-group v-model="touristForm.gender">
            <el-radio value="男">男</el-radio>
            <el-radio value="女">女</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="身份证号">
          <el-input v-model="touristForm.id_card" />
        </el-form-item>
        <el-form-item label="电话">
          <el-input v-model="touristForm.phone" />
        </el-form-item>
        <el-form-item label="房号">
          <el-input v-model="touristForm.room_number" />
        </el-form-item>
        <el-form-item label="入住">
          <el-date-picker v-model="touristForm.check_in" type="date" />
        </el-form-item>
        <el-form-item label="离店">
          <el-date-picker v-model="touristForm.check_out" type="date" />
        </el-form-item>
        <el-form-item label="状态" v-if="isEditingTourist">
          <el-select v-model="touristForm.status">
            <el-option label="已确认" value="confirmed" />
            <el-option label="已取消" value="cancelled" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="touristDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveTourist">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { teamApi, controlPlanApi } from '@/api'
import dayjs from 'dayjs'

const route = useRoute()
const router = useRouter()
const teamId = route.params.id

const team = ref(null)
const reservations = ref([])
const tourists = ref([])
const availablePlans = ref([])
const reservationLoading = ref(false)
const touristLoading = ref(false)
const reservationDialogVisible = ref(false)
const touristDialogVisible = ref(false)
const isEditingTourist = ref(false)

const reservationForm = ref({
  control_plan_id: '',
  rooms_needed: 1,
  check_in: '',
  check_out: ''
})

const touristForm = ref({
  name: '',
  gender: '男',
  id_card: '',
  phone: '',
  room_number: '',
  check_in: '',
  check_out: '',
  status: 'confirmed'
})

const goBack = () => {
  router.push('/teams')
}

const loadTeamData = async () => {
  try {
    const [teamsRes, reservationsRes, touristsRes] = await Promise.all([
      teamApi.getAll(),
      teamApi.getReservations(teamId),
      teamApi.getTourists(teamId)
    ])
    
    if (teamsRes.success) {
      team.value = teamsRes.data.find(t => t.id == teamId)
    }
    if (reservationsRes.success) {
      reservations.value = reservationsRes.data
    }
    if (touristsRes.success) {
      tourists.value = touristsRes.data
    }
  } catch (error) {
    ElMessage.error('加载失败')
  }
}

const loadAvailablePlans = async () => {
  try {
    const res = await controlPlanApi.getAll()
    if (res.success) {
      availablePlans.value = res.data.filter(p => p.available_rooms > 0)
    }
  } catch (error) {
    console.error(error)
  }
}

const openReservationDialog = () => {
  reservationForm.value = {
    control_plan_id: '',
    rooms_needed: 1,
    check_in: dayjs().format('YYYY-MM-DD'),
    check_out: dayjs().add(1, 'day').format('YYYY-MM-DD')
  }
  reservationDialogVisible.value = true
}

const saveReservation = async () => {
  reservationLoading.value = true
  try {
    await teamApi.createReservation({
      team_id: teamId,
      ...reservationForm.value
    })
    ElMessage.success('预订成功')
    reservationDialogVisible.value = false
    loadTeamData()
  } catch (error) {
    ElMessage.error(error.response?.data?.error || '预订失败')
  } finally {
    reservationLoading.value = false
  }
}

const cancelReservation = async (row) => {
  try {
    await ElMessageBox.confirm('确定要取消该预订吗？房量将退回公共库存。', '提示', { type: 'warning' })
    await teamApi.cancelReservation(row.id)
    ElMessage.success('取消成功')
    loadTeamData()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('取消失败')
    }
  }
}

const openTouristDialog = (row = null) => {
  isEditingTourist.value = !!row
  if (row) {
    touristForm.value = { ...row }
  } else {
    touristForm.value = {
      name: '',
      gender: '男',
      id_card: '',
      phone: '',
      room_number: '',
      check_in: '',
      check_out: '',
      status: 'confirmed'
    }
  }
  touristDialogVisible.value = true
}

const editTourist = (row) => {
  openTouristDialog(row)
}

const saveTourist = async () => {
  touristLoading.value = true
  try {
    if (isEditingTourist.value) {
      await teamApi.updateTourist(touristForm.value.id, touristForm.value)
      ElMessage.success('更新成功')
    } else {
      await teamApi.addTourist({
        team_id: teamId,
        ...touristForm.value
      })
      ElMessage.success('添加成功')
    }
    touristDialogVisible.value = false
    loadTeamData()
  } catch (error) {
    ElMessage.error('保存失败')
  } finally {
    touristLoading.value = false
  }
}

const deleteTourist = async (row) => {
  try {
    await ElMessageBox.confirm('确定要删除该游客吗？', '提示', { type: 'warning' })
    await teamApi.deleteTourist(row.id)
    ElMessage.success('删除成功')
    loadTeamData()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

onMounted(() => {
  loadTeamData()
  loadAvailablePlans()
})
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
