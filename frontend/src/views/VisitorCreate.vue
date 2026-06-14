<template>
  <div class="visitor-create-page">
    <el-page-header @back="$router.back()" content="访客授权" style="margin-bottom: 20px;" />
    
    <el-card class="form-card">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="120px">
        <el-divider content-position="left">访客信息</el-divider>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="访客姓名" prop="visitor_name">
              <el-input v-model="form.visitor_name" placeholder="请输入访客姓名" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="联系电话" prop="visitor_phone">
              <el-input v-model="form.visitor_phone" placeholder="请输入联系电话" />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="身份证号">
              <el-input v-model="form.visitor_id_card" placeholder="请输入身份证号（可选）" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="关联订单">
              <el-select v-model="form.visitor_id" placeholder="关联购买服务订单（可选）" clearable filterable style="width: 100%;">
                <el-option v-for="o in pendingOrders" :key="o.id" :label="`${o.order_no} - ${o.product_name}`" :value="o.id" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-divider content-position="left">访问信息</el-divider>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="被访房屋" prop="host_room_id">
              <el-select v-model="form.host_room_id" placeholder="请选择被访房屋" style="width: 100%;">
                <el-option v-for="r in userRooms" :key="r.room_id" :label="`${r.building_name} ${r.unit_number}`" :value="r.room_id" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="生效时间" prop="valid_from">
              <el-date-picker
                v-model="form.valid_from"
                type="datetime"
                placeholder="选择生效时间"
                style="width: 100%;"
                format="YYYY-MM-DD HH:mm:ss"
                value-format="YYYY-MM-DD HH:mm:ss"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="失效时间" prop="valid_to">
              <el-date-picker
                v-model="form.valid_to"
                type="datetime"
                placeholder="选择失效时间"
                style="width: 100%;"
                format="YYYY-MM-DD HH:mm:ss"
                value-format="YYYY-MM-DD HH:mm:ss"
              />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-divider content-position="left">权限配置</el-divider>
        
        <el-form-item label="通行区域" prop="access_areas">
          <el-checkbox-group v-model="accessAreas">
            <el-checkbox label="小区东门">小区东门</el-checkbox>
            <el-checkbox label="小区南门">小区南门</el-checkbox>
            <el-checkbox v-for="b in buildings" :key="b.id" :label="`${b.name}大门`">{{ b.name }}大门</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
        
        <el-form-item label="可访问楼栋" prop="access_buildings">
          <el-checkbox-group v-model="accessBuildings">
            <el-checkbox v-for="b in buildings" :key="b.id" :label="String(b.id)">{{ b.name }}</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
        
        <el-form-item>
          <el-button @click="$router.back()">取消</el-button>
          <el-button type="primary" :loading="submitting" @click="handleSubmit">
            生成授权
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
    
    <el-dialog v-model="resultDialogVisible" title="授权成功" width="500px">
      <div class="result-content">
        <div class="result-icon">
          <el-icon size="64" color="#67c23a"><CircleCheck /></el-icon>
        </div>
        <h3>访客授权已生成</h3>
        
        <div class="qr-display">
          <div class="qr-code-large">
            <el-icon size="140"><QrCode /></el-icon>
          </div>
          <div class="qr-detail">
            <div class="detail-item">
              <span class="label">授权码：</span>
              <el-tag type="primary" effect="plain" copyable>{{ authResult?.auth_code }}</el-tag>
            </div>
            <div class="detail-item">
              <span class="label">访客：</span>
              <span>{{ form.visitor_name }}</span>
            </div>
            <div class="detail-item">
              <span class="label">有效期：</span>
              <span>{{ form.valid_from }} ~ {{ form.valid_to }}</span>
            </div>
            <div class="detail-item">
              <span class="label">通行区域：</span>
              <span>{{ accessAreas.join('、') }}</span>
            </div>
          </div>
        </div>
        
        <div class="result-actions">
          <el-button @click="resultDialogVisible = false; $router.push('/visitors')">
            返回列表
          </el-button>
          <el-button type="primary" @click="handleCreateAgain">
            继续授权
          </el-button>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../store/user'
import { createVisitor, getUserRooms, getBuildings, getOrders } from '../api'
import { ElMessage } from 'element-plus'

const router = useRouter()
const userStore = useUserStore()

const formRef = ref(null)
const submitting = ref(false)
const resultDialogVisible = ref(false)
const authResult = ref(null)
const userRooms = ref([])
const buildings = ref([])
const pendingOrders = ref([])

const now = new Date()
const defaultFrom = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 19).replace('T', ' ')
const defaultTo = new Date(now.getTime() + 24 * 60 * 60 * 1000 - now.getTimezoneOffset() * 60000).toISOString().slice(0, 19).replace('T', ' ')

const form = reactive({
  visitor_name: '',
  visitor_phone: '',
  visitor_id_card: '',
  host_user_id: userStore.userId,
  host_room_id: null,
  valid_from: defaultFrom,
  valid_to: defaultTo,
  access_areas: '',
  access_buildings: '',
  created_by: userStore.userId
})

const accessAreas = ref([])
const accessBuildings = ref([])

const rules = {
  visitor_name: [{ required: true, message: '请输入访客姓名', trigger: 'blur' }],
  visitor_phone: [{ required: true, message: '请输入联系电话', trigger: 'blur' }],
  host_room_id: [{ required: true, message: '请选择被访房屋', trigger: 'change' }],
  valid_from: [{ required: true, message: '请选择生效时间', trigger: 'change' }],
  valid_to: [{ required: true, message: '请选择失效时间', trigger: 'change' }]
}

async function loadUserRooms() {
  const res = await getUserRooms({ user_id: userStore.userId, bind_status: 'verified' })
  userRooms.value = res.data
  if (userRooms.value.length > 0) {
    form.host_room_id = userRooms.value[0].room_id
  }
}

async function loadBuildings() {
  const res = await getBuildings()
  buildings.value = res.data
}

async function loadOrders() {
  try {
    const res = await getOrders({ user_id: userStore.userId, status: 'paid' })
    pendingOrders.value = res.data
  } catch {}
}

async function handleSubmit() {
  try {
    await formRef.value.validate()
    submitting.value = true
    
    form.access_areas = accessAreas.value.join(',')
    form.access_buildings = accessBuildings.value.join(',')
    
    const res = await createVisitor(form)
    authResult.value = res.data
    resultDialogVisible.value = true
    
    ElMessage.success('授权成功')
  } catch (err) {
    ElMessage.error(err.message || '授权失败')
  } finally {
    submitting.value = false
  }
}

function handleCreateAgain() {
  resultDialogVisible.value = false
  form.visitor_name = ''
  form.visitor_phone = ''
  form.visitor_id_card = ''
  accessAreas.value = []
  accessBuildings.value = []
  formRef.value?.resetFields()
}

onMounted(() => {
  loadUserRooms()
  loadBuildings()
  loadOrders()
})
</script>

<style scoped>
.visitor-create-page {
  padding: 0;
}

.form-card {
  border: none;
  border-radius: 12px;
  max-width: 900px;
  margin: 0 auto;
}

.result-content {
  text-align: center;
}

.result-icon {
  margin-bottom: 20px;
}

.result-content h3 {
  font-size: 20px;
  color: #303133;
  margin: 0 0 25px;
}

.qr-display {
  display: flex;
  gap: 30px;
  background: #f5f7fa;
  padding: 25px;
  border-radius: 12px;
  margin-bottom: 25px;
}

.qr-code-large {
  width: 180px;
  height: 180px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.qr-detail {
  flex: 1;
  text-align: left;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
  font-size: 14px;
}

.detail-item .label {
  color: #909399;
  min-width: 70px;
}

.result-actions {
  display: flex;
  gap: 15px;
  justify-content: center;
}
</style>
