<template>
  <div class="page-container">
    <div class="page-header">
      <div class="page-title">楼宇管理</div>
      <el-button type="primary" @click="openDialog()">
        <el-icon><plus /></el-icon>
        新增楼宇
      </el-button>
    </div>

    <el-table :data="buildingList" border style="width: 100%">
      <el-table-column prop="name" label="楼宇名称" />
      <el-table-column prop="total_floors" label="楼层数" width="100" />
      <el-table-column prop="floor_count" label="已配置楼层" width="120" />
      <el-table-column prop="room_count" label="房源数量" width="100" />
      <el-table-column prop="total_area" label="总面积(㎡)" width="120" />
      <el-table-column prop="address" label="地址" />
      <el-table-column prop="created_at" label="创建时间" width="180">
        <template #default="{ row }">
          {{ formatDate(row.created_at) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <div class="table-actions">
            <el-button size="small" @click="openFloorDialog(row)">楼层</el-button>
            <el-button size="small" @click="openDialog(row)">编辑</el-button>
            <el-button size="small" type="danger" @click="handleDelete(row)">删除</el-button>
          </div>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialogVisible" :title="currentBuilding.id ? '编辑楼宇' : '新增楼宇'" width="500px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="楼宇名称" required>
          <el-input v-model="form.name" placeholder="请输入楼宇名称" />
        </el-form-item>
        <el-form-item label="总楼层数">
          <el-input-number v-model="form.total_floors" :min="0" />
        </el-form-item>
        <el-form-item label="总面积">
          <el-input-number v-model="form.total_area" :min="0" />
          <span style="margin-left: 8px">㎡</span>
        </el-form-item>
        <el-form-item label="地址">
          <el-input v-model="form.address" placeholder="请输入地址" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="form.description" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="floorDialogVisible" :title="`${currentBuilding.name} - 楼层管理`" width="700px">
      <div class="page-header">
        <span>楼层列表</span>
        <el-button size="small" type="primary" @click="openFloorForm()">
          <el-icon><plus /></el-icon>
          新增楼层
        </el-button>
      </div>
      <el-table :data="floors" border style="width: 100%">
        <el-table-column prop="floor_number" label="楼层" width="100" />
        <el-table-column prop="area" label="面积(㎡)" width="120" />
        <el-table-column prop="unit_count" label="单元数" width="100" />
        <el-table-column prop="room_count" label="房源数" width="100" />
        <el-table-column prop="description" label="描述" />
        <el-table-column label="操作" width="100">
          <template #default="{ row }">
            <el-button size="small" type="danger" link @click="deleteFloor(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-form v-if="showFloorForm" :model="floorForm" label-width="100px" style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee">
        <el-form-item label="楼层号" required>
          <el-input-number v-model="floorForm.floor_number" :min="1" />
        </el-form-item>
        <el-form-item label="面积">
          <el-input-number v-model="floorForm.area" :min="0" />
          <span style="margin-left: 8px">㎡</span>
        </el-form-item>
        <el-form-item label="单元数">
          <el-input-number v-model="floorForm.unit_count" :min="0" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="floorForm.description" />
        </el-form-item>
        <el-form-item>
          <el-button @click="showFloorForm = false">取消</el-button>
          <el-button type="primary" @click="saveFloor">保存</el-button>
        </el-form-item>
      </el-form>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { buildings as buildingsApi } from '@/api'

const buildingList = ref([])
const dialogVisible = ref(false)
const floorDialogVisible = ref(false)
const showFloorForm = ref(false)
const currentBuilding = ref({})
const floors = ref([])

const form = reactive({
  id: null,
  name: '',
  total_floors: 0,
  total_area: 0,
  address: '',
  description: ''
})

const floorForm = reactive({
  floor_number: 1,
  area: 0,
  unit_count: 0,
  description: ''
})

function formatDate(date) {
  return date ? date.replace('T', ' ').substring(0, 19) : ''
}

async function loadBuildings() {
  const data = await buildingsApi.list()
  buildingList.value = data
}

function openDialog(row = null) {
  if (row) {
    Object.assign(form, row)
  } else {
    Object.assign(form, { id: null, name: '', total_floors: 0, total_area: 0, address: '', description: '' })
  }
  dialogVisible.value = true
}

async function handleSave() {
  if (!form.name) {
    ElMessage.warning('请输入楼宇名称')
    return
  }
  if (form.id) {
    await buildingsApi.update(form.id, form)
    ElMessage.success('更新成功')
  } else {
    await buildingsApi.create(form)
    ElMessage.success('创建成功')
  }
  dialogVisible.value = false
  loadBuildings()
}

async function handleDelete(row) {
  try {
    await ElMessageBox.confirm('确定要删除该楼宇吗？', '提示', { type: 'warning' })
    await buildingsApi.delete(row.id)
    ElMessage.success('删除成功')
    loadBuildings()
  } catch {
  }
}

async function openFloorDialog(row) {
  currentBuilding.value = row
  floorDialogVisible.value = true
  showFloorForm.value = false
  const data = await buildingsApi.getFloors(row.id)
  floors.value = data
}

function openFloorForm() {
  Object.assign(floorForm, { floor_number: 1, area: 0, unit_count: 0, description: '' })
  showFloorForm.value = true
}

async function saveFloor() {
  await buildingsApi.addFloor(currentBuilding.value.id, floorForm)
  ElMessage.success('楼层添加成功')
  showFloorForm.value = false
  const data = await buildings.getFloors(currentBuilding.value.id)
  floors.value = data
}

async function deleteFloor(row) {
  try {
    await ElMessageBox.confirm('确定要删除该楼层吗？', '提示', { type: 'warning' })
    ElMessage.success('删除成功')
    const data = await buildings.getFloors(currentBuilding.value.id)
    floors.value = data
  } catch {
  }
}

onMounted(() => {
  loadBuildings()
})
</script>
