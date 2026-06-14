<template>
  <div class="profile-rooms-page">
    <div class="page-header">
      <h2 class="page-title">房号绑定</h2>
      <div class="header-actions">
        <el-button @click="loadData">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
        <el-button type="primary" @click="showBindDialog = true">
          <el-icon><Plus /></el-icon>
          申请绑定
        </el-button>
      </div>
    </div>
    
    <el-card class="table-card" v-loading="loading">
      <el-table :data="userRooms" stripe>
        <el-table-column label="房屋信息">
          <template #default="{ row }">
            <div class="house-info">
              <el-icon size="20"><House /></el-icon>
              <div>
                <div class="house-name">{{ row.building_name }} {{ row.unit_number }}</div>
                <div class="house-extra">
                  <span>{{ row.area }}㎡ · {{ row.floor }}层</span>
                </div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="关系" width="100">
          <template #default="{ row }">
            <el-tag size="small">{{ row.relation === 'owner' ? '业主' : '租户' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="绑定状态" width="120">
          <template #default="{ row }">
            <el-tag :type="row.bind_status === 'verified' ? 'success' : 'warning'" size="small">
              {{ row.bind_status === 'verified' ? '已认证' : row.bind_status === 'rejected' ? '已拒绝' : '审核中' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="verified_at" label="认证时间" width="180">
          <template #default="{ row }">
            <span>{{ row.verified_at || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="申请时间" width="180" />
      </el-table>
      
      <el-empty v-if="!loading && userRooms.length === 0" description="暂无绑定记录，请点击右上角申请绑定" />
    </el-card>
    
    <el-dialog v-model="showBindDialog" title="申请房号绑定" width="500px">
      <el-form ref="bindFormRef" :model="bindForm" :rules="bindRules" label-width="100px">
        <el-form-item label="选择楼栋" prop="building_id">
          <el-select v-model="bindForm.building_id" placeholder="请选择楼栋" style="width: 100%;" @change="loadRooms">
            <el-option v-for="b in buildings" :key="b.id" :label="b.name" :value="b.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="选择房号" prop="room_id">
          <el-select v-model="bindForm.room_id" placeholder="请选择房号" style="width: 100%;">
            <el-option v-for="r in availableRooms" :key="r.id" :label="r.unit_number" :value="r.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="与业主关系" prop="relation">
          <el-radio-group v-model="bindForm.relation">
            <el-radio value="owner">业主本人</el-radio>
            <el-radio value="tenant">租户</el-radio>
            <el-radio value="family">家属</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showBindDialog = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleBind">提交申请</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useUserStore } from '../store/user'
import { getUserRooms, getBuildings, getRooms, bindRoom } from '../api'
import { ElMessage } from 'element-plus'

const userStore = useUserStore()

const loading = ref(false)
const submitting = ref(false)
const userRooms = ref([])
const buildings = ref([])
const availableRooms = ref([])
const showBindDialog = ref(false)
const bindFormRef = ref(null)

const bindForm = reactive({
  building_id: null,
  room_id: null,
  relation: 'owner'
})

const bindRules = {
  building_id: [{ required: true, message: '请选择楼栋', trigger: 'change' }],
  room_id: [{ required: true, message: '请选择房号', trigger: 'change' }],
  relation: [{ required: true, message: '请选择关系', trigger: 'change' }]
}

async function loadData() {
  loading.value = true
  try {
    const [roomsRes, buildingsRes] = await Promise.all([
      getUserRooms({ user_id: userStore.userId }),
      getBuildings()
    ])
    userRooms.value = roomsRes.data
    buildings.value = buildingsRes.data
  } finally {
    loading.value = false
  }
}

async function loadRooms() {
  if (!bindForm.building_id) return
  const res = await getRooms({ building_id: bindForm.building_id, status: 'vacant' })
  availableRooms.value = res.data
}

async function handleBind() {
  try {
    await bindFormRef.value.validate()
    submitting.value = true
    
    await bindRoom({
      user_id: userStore.userId,
      room_id: bindForm.room_id,
      relation: bindForm.relation
    })
    
    ElMessage.success('绑定申请已提交，请等待物业审核')
    showBindDialog.value = false
    loadData()
  } catch (err) {
    ElMessage.error(err.message || '提交失败')
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.profile-rooms-page {
  padding: 0;
}

.table-card {
  border: none;
  border-radius: 12px;
}

.house-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.house-name {
  font-size: 15px;
  font-weight: 500;
  margin-bottom: 3px;
}

.house-extra {
  font-size: 12px;
  color: #909399;
}
</style>
