<template>
  <div class="baggage-create">
    <div class="page-header">
      <h1 class="page-title">录入行李</h1>
      <p class="page-subtitle">登记新的行李托运信息</p>
    </div>

    <div class="card max-w-3xl mx-auto">
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="100px"
        @submit.prevent="handleSubmit"
      >
        <el-divider content-position="left">旅客信息</el-divider>
        
        <el-form-item label="旅客姓名" prop="passenger_name">
          <el-input v-model="form.passenger_name" placeholder="请输入旅客姓名" />
        </el-form-item>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="联系电话" prop="passenger_phone">
              <el-input v-model="form.passenger_phone" placeholder="请输入联系电话" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="证件号码">
              <el-input v-model="form.passenger_id_card" placeholder="请输入证件号码" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="left">航班信息</el-divider>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="航班号" prop="flight_no">
              <el-input v-model="form.flight_no" placeholder="例如：CA1234" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="航班日期" prop="flight_date">
              <el-date-picker
                v-model="form.flight_date"
                type="date"
                placeholder="选择日期"
                value-format="YYYY-MM-DD"
                style="width: 100%;"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="出发地" prop="departure">
              <el-input v-model="form.departure" placeholder="例如：北京" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="目的地" prop="destination">
              <el-input v-model="form.destination" placeholder="例如：上海" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="left">行李信息</el-divider>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="行李牌">
              <el-input v-model="form.baggage_tag" placeholder="不填则自动生成">
                <template #append>
                  <el-button @click="generateTag">生成</el-button>
                </template>
              </el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="件数" prop="pieces">
              <el-input-number v-model="form.pieces" :min="1" :max="10" style="width: 100%;" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="重量(kg)" prop="weight">
              <el-input-number v-model="form.weight" :min="0" :max="100" :step="0.5" style="width: 100%;" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="托运时间" prop="check_in_time">
              <el-date-picker
                v-model="form.check_in_time"
                type="datetime"
                placeholder="选择托运时间"
                value-format="YYYY-MM-DD HH:mm:ss"
                style="width: 100%;"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item>
          <el-button type="primary" size="large" @click="handleSubmit" :loading="submitting">
            提交登记
          </el-button>
          <el-button size="large" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { baggageApi } from '../api'

const router = useRouter()

const formRef = ref(null)
const submitting = ref(false)

const form = reactive({
  passenger_name: '',
  passenger_phone: '',
  passenger_id_card: '',
  flight_no: '',
  flight_date: '',
  departure: '',
  destination: '',
  baggage_tag: '',
  pieces: 1,
  weight: 0,
  check_in_time: ''
})

const rules = {
  passenger_name: [{ required: true, message: '请输入旅客姓名', trigger: 'blur' }],
  flight_no: [{ required: true, message: '请输入航班号', trigger: 'blur' }],
  flight_date: [{ required: true, message: '请选择航班日期', trigger: 'change' }],
  departure: [{ required: true, message: '请输入出发地', trigger: 'blur' }],
  destination: [{ required: true, message: '请输入目的地', trigger: 'blur' }],
  pieces: [{ required: true, message: '请输入件数', trigger: 'blur' }],
  weight: [{ required: true, message: '请输入重量', trigger: 'blur' }],
  check_in_time: [{ required: true, message: '请选择托运时间', trigger: 'change' }]
}

function generateTag() {
  const prefix = 'BN'
  const timestamp = Date.now().toString().slice(-6)
  const random = Math.floor(Math.random() * 9000 + 1000)
  form.baggage_tag = `${prefix}${timestamp}${random}`
}

async function handleSubmit() {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
  } catch {
    return
  }

  submitting.value = true
  try {
    const data = await baggageApi.create(form)
    ElMessage.success('行李登记成功')
    router.push(`/admin/baggage/${data.baggage_tag}`)
  } catch (err) {
    if (err.response?.status === 409) {
      ElMessage.error('行李牌已存在，请重新生成')
    } else {
      ElMessage.error('登记失败，请稍后重试')
    }
    console.error(err)
  } finally {
    submitting.value = false
  }
}

function handleReset() {
  formRef.value?.resetFields()
  form.check_in_time = ''
  form.flight_date = ''
}

onMounted(() => {
  form.check_in_time = new Date().toISOString().slice(0, 19).replace('T', ' ')
  form.flight_date = new Date().toISOString().slice(0, 10)
})
</script>

<style scoped>
.max-w-3xl {
  max-width: 768px;
}

.mx-auto {
  margin-left: auto;
  margin-right: auto;
}
</style>
