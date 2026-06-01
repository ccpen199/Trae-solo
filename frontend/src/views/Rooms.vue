<template>
  <div class="page-container">
    <div class="page-header">
      <div class="page-title">房源管理</div>
      <el-button type="primary" @click="openDialog()">
        <el-icon><plus /></el-icon>
        新增房源
      </el-button>
    </div>

    <div class="search-bar">
      <el-form :inline="true" :model="searchForm">
        <el-form-item label="楼宇">
          <el-select v-model="searchForm.building_id" placeholder="全部楼宇" clearable style="width: 150px">
            <el-option v-for="b in buildingList" :key="b.id" :label="b.name" :value="b.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="全部状态" clearable style="width: 120px">
            <el-option label="可租" value="available" />
            <el-option label="已预订" value="reserved" />
            <el-option label="已出租" value="rented" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadRooms">查询</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <el-table :data="roomList" border style="width: 100%">
      <el-table-column prop="building_name" label="所属楼宇" width="120" />
      <el-table-column prop="floor_number" label="楼层" width="80" />
      <el-table-column prop="room_number" label="房间号" width="100" />
      <el-table-column prop="area" label="面积(㎡)" width="100" />
      <el-table-column prop="business_type" label="业态" width="100" />
      <el-table-column prop="rent_price" label="租金(元/月)" width="120" />
      <el-table-column prop="status" label="状态" width="100">
        <template #default="{ row }">
          <span :class="['status-tag', `status-${row.status}`]">{{ row.status_text }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="available_date" label="可租日期" width="120" />
      <el-table-column prop="supporting_facilities" label="配套设施" show-overflow-tooltip />
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <div class="table-actions">
            <el-button size="small" @click="viewHistory(row)">历史</el-button>
            <el-button size="small" @click="openDialog(row)">编辑</el-button>
            <el-button size="small" type="danger" @click="handleDelete(row)">删除</el-button>
          </div>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialogVisible" :title="currentRoom.id ? '编辑房源' : '新增房源'" width="600px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="所属楼宇" required>
          <el-select v-model="form.building_id" placeholder="请选择楼宇" style="width: 100%" @change="loadFloors">
            <el-option v-for="b in buildingList" :key="b.id" :label="b.name" :value="b.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="所属楼层" required>
          <el-select v-model="form.floor_id" placeholder="请选择楼层" style="width: 100%">
            <el-option v-for="f in floorList" :key="f.id" :label="`${f.floor_number}层`" :value="f.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="房间号" required>
          <el-input v-model="form.room_number" placeholder="请输入房间号" />
        </el-form-item>
        <el-form-item label="面积" required>
          <el-input-number v-model="form.area" :min="0" />
          <span style="margin-left: 8px">㎡</span>
        </el-form-item>
        <el-form-item label="业态">
          <el-input v-model="form.business_type" placeholder="如：办公、商业等" />
        </el-form-item>
        <el-form-item label="租金" required>
          <el-input-number v-model="form.rent_price" :min="0" />
          <span style="margin-left: 8px">元/月</span>
        </el-form-item>
        <el-form-item label="可租日期">
          <el-date-picker v-model="form.available_date" type="date" value-format="YYYY-MM-DD" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="form.status" style="width: 100%">
            <el-option label="可租" value="available" />
            <el-option label="已预订" value="reserved" />
            <el-option label="已出租" value="rented" />
          </el-select>
        </el-form-item>
        <el-form-item label="配套设施">
          <el-input v-model="form.supporting_facilities" type="textarea" :rows="2" placeholder="如：空调、电梯、网络等" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="form.description" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="historyDialogVisible" title="变更历史" width="600px">
      <el-table :data="historyList" border style="width: 100%">
        <el-table-column prop="field_name" label="字段" width="120">
          <template #default="{ row }">
            {{ fieldLabels[row.field_name] || row.field_name }}
          </template>
        </el-table-column>
        <el-table-column prop="old_value" label="原值" />
        <el-table-column prop="new_value" label="新值" />
        <el-table-column prop="changed_at" label="变更时间" width="180" />
      </el-table>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { rooms as roomsApi, buildings as buildingsApi } from '@/api'

const roomList = ref([])
const buildingList = ref([])
const floorList = ref([])
const dialogVisible = ref(false)
const historyDialogVisible = ref(false)
const currentRoom = ref({})
const historyList = ref([])

const searchForm = reactive({
  building_id: null,
  status: ''
})

const form = reactive({
  id: null,
  building_id: null,
  floor_id: null,
  room_number: '',
  area: 0,
  business_type: '',
  rent_price: 0,
  rent_unit: 'month',
  available_date: '',
  supporting_facilities: '',
  status: 'available',
  description: ''
})

const fieldLabels = {
  room_number: '房间号',
  area: '面积',
  rent_price: '租金',
  status: '状态',
  business_type: '业态'
}

async function loadRooms() {
  const params = {
    building_id: searchForm.building_id || undefined,
    status: searchForm.status || undefined
  }
  const data = await roomsApi.list(params)
  roomList.value = data
}

async function loadBuildings() {
  const data = await buildingsApi.list()
  buildingList.value = data
}

async function loadFloors(buildingId) {
  if (buildingId) {
    const data = await buildingsApi.getFloors(buildingId)
    floorList.value = data
  } else {
    floorList.value = []
  }
}

function resetSearch() {
  searchForm.building_id = null
  searchForm.status = ''
  loadRooms()
}

function openDialog(row = null) {
  if (row) {
    Object.assign(form, row)
    loadFloors(row.building_id)
  } else {
    Object.assign(form, { id: null, building_id: null, floor_id: null, room_number: '', area: 0, business_type: '', rent_price: 0, rent_unit: 'month', available_date: '', supporting_facilities: '', status: 'available', description: '' })
    floorList.value = []
  }
  currentRoom.value = row || {}
  dialogVisible.value = true
}

async function handleSave() {
  if (!form.building_id || !form.floor_id || !form.room_number || !form.area || !form.rent_price) {
    ElMessage.warning('请填写必填项')
    return
  }
  if (form.id) {
    await roomsApi.update(form.id, form)
    ElMessage.success('更新成功')
  } else {
    await roomsApi.create(form)
    ElMessage.success('创建成功')
  }
  dialogVisible.value = false
  loadRooms()
}

async function handleDelete(row) {
  try {
    await ElMessageBox.confirm('确定要删除该房源吗？', '提示', { type: 'warning' })
    await roomsApi.delete(row.id)
    ElMessage.success('删除成功')
    loadRooms()
  } catch {
  }
}

async function viewHistory(row) {
  const data = await roomsApi.history(row.id)
  historyList.value = data
  historyDialogVisible.value = true
}

onMounted(() => {
  loadRooms()
  loadBuildings()
})
</script>
