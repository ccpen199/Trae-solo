<template>
  <div class="page-container">
    <div class="page-header">
      <div class="page-title">带看记录</div>
      <el-button type="primary" @click="openDialog()">
        <el-icon><plus /></el-icon>
        新增带看
      </el-button>
    </div>

    <el-table :data="viewingList" border style="width: 100%">
      <el-table-column prop="company_name" label="客户企业" width="140" />
      <el-table-column prop="viewing_time" label="带看时间" width="160" />
      <el-table-column prop="contact_person" label="联系人" width="100" />
      <el-table-column prop="contact_phone" label="联系电话" width="120" />
      <el-table-column prop="satisfaction_level" label="满意度" width="100" />
      <el-table-column prop="feedback" label="客户反馈" show-overflow-tooltip />
      <el-table-column prop="created_by" label="创建人" width="100" />
      <el-table-column label="操作" width="150" fixed="right">
        <template #default="{ row }">
          <div class="table-actions">
            <el-button size="small" @click="viewDetail(row)">详情</el-button>
            <el-button size="small" @click="openDialog(row)">编辑</el-button>
            <el-button size="small" type="danger" @click="handleDelete(row)">删除</el-button>
          </div>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialogVisible" :title="currentViewing.id ? '编辑带看' : '新增带看'" width="600px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="客户线索" required>
          <el-select v-model="form.lead_id" placeholder="请选择客户" style="width: 100%" filterable>
            <el-option v-for="l in leadList" :key="l.id" :label="l.company_name" :value="l.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="带看时间" required>
          <el-date-picker v-model="form.viewing_time" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" style="width: 100%" />
        </el-form-item>
        <el-form-item label="联系人">
          <el-input v-model="form.contact_person" />
        </el-form-item>
        <el-form-item label="联系电话">
          <el-input v-model="form.contact_phone" />
        </el-form-item>
        <el-form-item label="意向房源">
          <el-select v-model="selectedRooms" multiple placeholder="请选择房源" style="width: 100%" filterable>
            <el-option v-for="r in roomList" :key="r.id" :label="`${r.building_name}-${r.floor_number}层-${r.room_number}`" :value="r.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="满意度">
          <el-rate v-model="form.satisfaction_level" />
        </el-form-item>
        <el-form-item label="客户反馈">
          <el-input v-model="form.feedback" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { viewings as viewingsApi, leads as leadsApi, rooms as roomsApi } from '@/api'

const viewingList = ref([])
const leadList = ref([])
const roomList = ref([])
const dialogVisible = ref(false)
const currentViewing = ref({})
const selectedRooms = ref([])

const form = reactive({
  id: null,
  lead_id: null,
  viewing_time: '',
  contact_person: '',
  contact_phone: '',
  feedback: '',
  satisfaction_level: null,
  created_by: ''
})

async function loadViewings() {
  const data = await viewingsApi.list()
  viewingList.value = data
}

async function loadLeads() {
  const data = await leadsApi.list()
  leadList.value = data
}

async function loadRooms() {
  const data = await roomsApi.list({ status: 'available' })
  roomList.value = data
}

function openDialog(row = null) {
  if (row) {
    Object.assign(form, row)
    selectedRooms.value = row.room_ids ? row.room_ids.split(',').map(Number) : []
  } else {
    Object.assign(form, { id: null, lead_id: null, viewing_time: new Date().toISOString().slice(0, 19).replace('T', ' '), contact_person: '', contact_phone: '', feedback: '', satisfaction_level: null, created_by: '' })
    selectedRooms.value = []
  }
  dialogVisible.value = true
}

async function handleSave() {
  if (!form.lead_id || !form.viewing_time) {
    ElMessage.warning('请填写必填项')
    return
  }
  const data = { ...form, room_ids: selectedRooms.value }
  if (form.id) {
    await viewingsApi.update(form.id, data)
    ElMessage.success('更新成功')
  } else {
    await viewingsApi.create(data)
    ElMessage.success('创建成功')
  }
  dialogVisible.value = false
  loadViewings()
}

async function handleDelete(row) {
  try {
    await ElMessageBox.confirm('确定要删除该带看记录吗？', '提示', { type: 'warning' })
    await viewingsApi.delete(row.id)
    ElMessage.success('删除成功')
    loadViewings()
  } catch {
  }
}

function viewDetail(row) {
  ElMessage.info('详情功能开发中')
}

onMounted(() => {
  loadViewings()
  loadLeads()
  loadRooms()
})
</script>
