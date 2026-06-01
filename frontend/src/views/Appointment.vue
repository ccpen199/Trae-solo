<template>
  <div class="appointment">
    <el-card>
      <template #header>
        <span>访客预约登记</span>
      </template>
      <el-form :model="form" label-width="120px" :rules="rules" ref="formRef">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="访客姓名" prop="visitorName">
              <el-input v-model="form.visitorName" placeholder="请输入访客姓名" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="联系电话" prop="visitorPhone">
              <el-input v-model="form.visitorPhone" placeholder="请输入联系电话" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="身份证号" prop="visitorIdCard">
              <el-input v-model="form.visitorIdCard" placeholder="请输入身份证号" maxlength="18" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="车牌号">
              <el-input v-model="form.licensePlate" placeholder="请输入车牌号（选填）" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="来访企业" prop="enterpriseId">
              <el-select v-model="form.enterpriseId" placeholder="请选择企业" style="width: 100%" @change="onEnterpriseChange">
                <el-option v-for="ent in enterprises" :key="ent.id" :label="ent.name" :value="ent.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="被访人" prop="contactPerson">
              <el-input v-model="form.contactPerson" placeholder="请输入被访人姓名" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="被访人电话">
              <el-input v-model="form.contactPhone" placeholder="请输入被访人电话（选填）" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="到访事由" prop="visitReason">
              <el-select v-model="form.visitReason" placeholder="请选择事由" style="width: 100%">
                <el-option label="商务洽谈" value="商务洽谈" />
                <el-option label="面试" value="面试" />
                <el-option label="项目合作" value="项目合作" />
                <el-option label="设备维护" value="设备维护" />
                <el-option label="快递物流" value="快递物流" />
                <el-option label="其他" value="其他" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="预计到达" prop="scheduledArrival">
              <el-date-picker 
                v-model="form.scheduledArrival" 
                type="datetime" 
                placeholder="选择到达时间" 
                style="width: 100%"
                value-format="YYYY-MM-DD HH:mm:ss"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="预计离开" prop="scheduledDeparture">
              <el-date-picker 
                v-model="form.scheduledDeparture" 
                type="datetime" 
                placeholder="选择离开时间" 
                style="width: 100%"
                value-format="YYYY-MM-DD HH:mm:ss"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item>
          <el-button type="primary" @click="submitForm" :loading="submitting">提交预约</el-button>
          <el-button @click="resetForm">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-dialog v-model="showSuccess" title="预约成功" width="500px">
      <div class="success-info">
        <el-icon color="#67c23a" size="60"><CircleCheck /></el-icon>
        <p>预约编号：{{ successData.appointment_no }}</p>
        <p>访客：{{ successData.visitor_name }}</p>
        <p>二维码：{{ successData.qr_code }}</p>
      </div>
      <template #footer>
        <el-button @click="showSuccess = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { CircleCheck } from '@element-plus/icons-vue'
import { enterprises, appointments } from '../api'

const formRef = ref()
const enterprisesList = ref([])
const submitting = ref(false)
const showSuccess = ref(false)
const successData = ref({})

const form = reactive({
  visitorName: '',
  visitorPhone: '',
  visitorIdCard: '',
  licensePlate: '',
  enterpriseId: null,
  enterpriseName: '',
  contactPerson: '',
  contactPhone: '',
  visitReason: '',
  scheduledArrival: '',
  scheduledDeparture: ''
})

const rules = {
  visitorName: [{ required: true, message: '请输入访客姓名', trigger: 'blur' }],
  visitorPhone: [{ required: true, message: '请输入联系电话', trigger: 'blur' }],
  visitorIdCard: [{ required: true, message: '请输入身份证号', trigger: 'blur' }],
  enterpriseId: [{ required: true, message: '请选择企业', trigger: 'change' }],
  contactPerson: [{ required: true, message: '请输入被访人', trigger: 'blur' }],
  visitReason: [{ required: true, message: '请选择事由', trigger: 'change' }],
  scheduledArrival: [{ required: true, message: '请选择到达时间', trigger: 'change' }],
  scheduledDeparture: [{ required: true, message: '请选择离开时间', trigger: 'change' }]
}

const loadEnterprises = async () => {
  try {
    const res = await enterprises.list()
    enterprisesList.value = res.data
  } catch (e) {
    console.error(e)
  }
}

const onEnterpriseChange = (id) => {
  const ent = enterprisesList.value.find(e => e.id === id)
  if (ent) {
    form.enterpriseName = ent.name
  }
}

const submitForm = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    
    submitting.value = true
    try {
      const res = await appointments.create(form)
      if (res.data.success) {
        successData.value = res.data.appointment
        showSuccess.value = true
        if (res.data.needsReview) {
          ElMessage.warning('该访客需人工审核，请等待审核结果')
        } else {
          ElMessage.success('预约提交成功')
        }
        resetForm()
      }
    } catch (e) {
      ElMessage.error('提交失败：' + (e.response?.data?.message || e.message))
    } finally {
      submitting.value = false
    }
  })
}

const resetForm = () => {
  formRef.value?.resetFields()
}

onMounted(() => {
  loadEnterprises()
})
</script>

<style scoped>
.success-info {
  text-align: center;
  padding: 20px;
}
.success-info p {
  margin: 10px 0;
  font-size: 14px;
  color: #666;
}
</style>
