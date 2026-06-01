<template>
  <div class="control-plans">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>控房计划</span>
          <el-button type="primary" @click="openPlanDialog">
            <el-icon><Plus /></el-icon>
            新建控房
          </el-button>
        </div>
      </template>

      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="酒店">
          <el-select v-model="searchForm.hotelId" placeholder="请选择" clearable style="width: 150px">
            <el-option v-for="hotel in hotels" :key="hotel.id" :label="hotel.name" :value="hotel.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="开始日期">
          <el-date-picker v-model="searchForm.startDate" type="date" placeholder="选择日期" />
        </el-form-item>
        <el-form-item label="结束日期">
          <el-date-picker v-model="searchForm.endDate" type="date" placeholder="选择日期" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadPlans">查询</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="plans" v-loading="loading">
        <el-table-column prop="hotel_name" label="酒店" />
        <el-table-column prop="room_type_name" label="房型" />
        <el-table-column prop="date" label="日期" width="120" />
        <el-table-column prop="total_rooms" label="总房量" width="90" align="center" />
        <el-table-column prop="used_rooms" label="已用" width="80" align="center">
          <template #default="{ row }">
            <el-tag type="warning" size="small">{{ row.used_rooms }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="可用" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="row.available_rooms > 0 ? 'success' : 'danger'" size="small">
              {{ row.available_rooms }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="price" label="单价" width="100">
          <template #default="{ row }">¥{{ row.price }}</template>
        </el-table-column>
        <el-table-column prop="release_date" label="释放期" width="120" />
        <el-table-column prop="team_name" label="归属团队" />
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="openAdjustDialog(row)">调房</el-button>
            <el-button type="primary" link size="small" @click="viewAdjustments(row)">记录</el-button>
            <el-button type="primary" link size="small" @click="editPlan(row)">编辑</el-button>
            <el-button type="danger" link size="small" @click="deletePlan(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="planDialogVisible" :title="isEditing ? '编辑控房' : '新建控房'" width="550px">
      <el-form :model="planForm" label-width="100px">
        <el-form-item label="酒店">
          <el-select v-model="planForm.hotel_id" placeholder="请选择酒店" @change="onHotelChange">
            <el-option v-for="hotel in hotels" :key="hotel.id" :label="hotel.name" :value="hotel.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="房型">
          <el-select v-model="planForm.room_type_id" placeholder="请选择房型">
            <el-option v-for="rt in roomTypes" :key="rt.id" :label="rt.name" :value="rt.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="控房日期">
          <el-date-picker v-model="planForm.date" type="date" placeholder="选择日期" />
        </el-form-item>
        <el-form-item label="房量">
          <el-input-number v-model="planForm.total_rooms" :min="1" />
        </el-form-item>
        <el-form-item label="单价">
          <el-input-number v-model="planForm.price" :min="0" :precision="2" />
        </el-form-item>
        <el-form-item label="释放期">
          <el-date-picker v-model="planForm.release_date" type="date" placeholder="选择日期" />
        </el-form-item>
        <el-form-item label="归属团队">
          <el-select v-model="planForm.team_name" placeholder="请选择团队" clearable style="width: 100%">
            <el-option v-for="team in teams" :key="team.id" :label="team.name" :value="team.name" />
          </el-select>
        </el-form-item>
        <el-form-item label="创建人">
          <el-input v-model="planForm.created_by" placeholder="请输入" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="planDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="savePlan">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="adjustDialogVisible" title="调房操作" width="450px">
      <el-form :model="adjustForm" label-width="100px">
        <el-form-item label="操作类型">
          <el-radio-group v-model="adjustForm.adjustment_type">
            <el-radio value="occupy">占用</el-radio>
            <el-radio value="release">释放</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="房间数">
          <el-input-number v-model="adjustForm.rooms_change" :min="1" />
        </el-form-item>
        <el-form-item label="原因">
          <el-input v-model="adjustForm.reason" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="操作人">
          <el-input v-model="adjustForm.operator" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="adjustDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveAdjust">确认</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="adjustmentsDialogVisible" title="调房记录" width="600px">
      <el-table :data="adjustments" size="small">
        <el-table-column prop="adjustment_type" label="类型" width="80">
          <template #default="{ row }">
            <el-tag :type="row.adjustment_type === 'occupy' ? 'warning' : 'success'" size="small">
              {{ row.adjustment_type === 'occupy' ? '占用' : '释放' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="rooms_change" label="房数" width="80" />
        <el-table-column prop="team_name" label="团队" />
        <el-table-column prop="reason" label="原因" />
        <el-table-column prop="operator" label="操作人" width="100" />
        <el-table-column prop="created_at" label="时间" width="160" />
      </el-table>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { controlPlanApi, hotelApi, teamApi } from '@/api'
import dayjs from 'dayjs'

const loading = ref(false)
const plans = ref([])
const hotels = ref([])
const roomTypes = ref([])
const teams = ref([])
const planDialogVisible = ref(false)
const adjustDialogVisible = ref(false)
const adjustmentsDialogVisible = ref(false)
const isEditing = ref(false)
const currentPlan = ref(null)
const adjustments = ref([])

const searchForm = ref({
  hotelId: '',
  startDate: '',
  endDate: ''
})

const planForm = ref({
  hotel_id: '',
  room_type_id: '',
  date: '',
  total_rooms: 10,
  price: 200,
  release_date: '',
  team_name: '',
  created_by: ''
})

const adjustForm = ref({
  adjustment_type: 'occupy',
  rooms_change: 1,
  reason: '',
  operator: ''
})

const loadPlans = async () => {
  loading.value = true
  try {
    const params = {}
    if (searchForm.value.hotelId) params.hotelId = searchForm.value.hotelId
    if (searchForm.value.startDate) params.startDate = searchForm.value.startDate
    if (searchForm.value.endDate) params.endDate = searchForm.value.endDate
    
    const res = await controlPlanApi.getAll(params)
    if (res.success) {
      plans.value = res.data
    }
  } catch (error) {
    ElMessage.error('加载失败')
  } finally {
    loading.value = false
  }
}

const loadHotels = async () => {
  try {
    const res = await hotelApi.getAll()
    if (res.success) {
      hotels.value = res.data
    }
  } catch (error) {
    console.error(error)
  }
}

const loadTeams = async () => {
  try {
    const res = await teamApi.getAll()
    if (res.success) {
      teams.value = res.data
    }
  } catch (error) {
    console.error(error)
  }
}

const onHotelChange = async (hotelId) => {
  try {
    const res = await hotelApi.getRoomTypes(hotelId)
    if (res.success) {
      roomTypes.value = res.data
    }
  } catch (error) {
    ElMessage.error('加载房型失败')
  }
}

const resetSearch = () => {
  searchForm.value = { hotelId: '', startDate: '', endDate: '' }
  loadPlans()
}

const openPlanDialog = (row = null) => {
  isEditing.value = !!row
  roomTypes.value = []
  if (row) {
    planForm.value = { ...row }
    onHotelChange(row.hotel_id)
  } else {
    planForm.value = {
      hotel_id: '',
      room_type_id: '',
      date: dayjs().format('YYYY-MM-DD'),
      total_rooms: 10,
      price: 200,
      release_date: dayjs().add(7, 'day').format('YYYY-MM-DD'),
      team_name: '',
      created_by: ''
    }
  }
  planDialogVisible.value = true
}

const editPlan = (row) => {
  openPlanDialog(row)
}

const savePlan = async () => {
  try {
    if (isEditing.value) {
      await controlPlanApi.update(planForm.value.id, planForm.value)
      ElMessage.success('更新成功')
    } else {
      await controlPlanApi.create(planForm.value)
      ElMessage.success('创建成功')
    }
    planDialogVisible.value = false
    loadPlans()
  } catch (error) {
    ElMessage.error(error.response?.data?.error || '保存失败')
  }
}

const deletePlan = async (row) => {
  try {
    await ElMessageBox.confirm('确定要删除该控房计划吗？', '提示', { type: 'warning' })
    await controlPlanApi.delete(row.id)
    ElMessage.success('删除成功')
    loadPlans()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error.response?.data?.error || '删除失败')
    }
  }
}

const openAdjustDialog = (row) => {
  currentPlan.value = row
  adjustForm.value = {
    adjustment_type: 'occupy',
    rooms_change: 1,
    reason: '',
    operator: ''
  }
  adjustDialogVisible.value = true
}

const saveAdjust = async () => {
  try {
    await controlPlanApi.adjust(currentPlan.value.id, {
      ...adjustForm.value,
      team_id: null
    })
    ElMessage.success('操作成功')
    adjustDialogVisible.value = false
    setTimeout(() => {
      loadPlans()
    }, 100)
  } catch (error) {
    ElMessage.error(error.response?.data?.error || '操作失败')
  }
}

const viewAdjustments = async (row) => {
  currentPlan.value = row
  adjustmentsDialogVisible.value = true
  try {
    const res = await controlPlanApi.getAdjustments(row.id)
    if (res.success) {
      adjustments.value = res.data
    }
  } catch (error) {
    ElMessage.error('加载失败')
  }
}

onMounted(() => {
  loadPlans()
  loadHotels()
  loadTeams()
})
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.search-form {
  margin-bottom: 16px;
}
</style>
