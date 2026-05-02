<template>
  <div class="booking-create">
    <el-card>
      <template #header>
        <div class="card-header">
          <span class="card-title">新建订舱单</span>
          <el-button text @click="$router.back()">
            <el-icon><ArrowLeft /></el-icon>
            返回
          </el-button>
        </div>
      </template>

      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="120px"
        class="booking-form"
      >
        <div class="form-section">
          <div class="section-title">基本信息</div>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="货主名称" prop="shipperName">
                <el-input
                  v-model="form.shipperName"
                  placeholder="请输入货主名称"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="船期" prop="scheduleId">
                <el-select
                  v-model="form.scheduleId"
                  placeholder="请选择船期"
                  style="width: 100%"
                >
                  <el-option
                    v-for="schedule in schedules"
                    :key="schedule.id"
                    :label="`${schedule.vesselName || schedule.vessel_name} - ${schedule.voyageNo || schedule.voyage_number}`"
                    :value="schedule.id"
                  />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="装货港" prop="pol">
                <el-input v-model="form.pol" placeholder="如：上海港" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="卸货港" prop="pod">
                <el-input v-model="form.pod" placeholder="如：洛杉矶港" />
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="预计开船时间" prop="expectedDepartureDate">
                <el-date-picker
                  v-model="form.expectedDepartureDate"
                  type="datetime"
                  placeholder="选择预计开船时间"
                  value-format="YYYY-MM-DD HH:mm:ss"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="预计到港时间" prop="expectedArrivalDate">
                <el-date-picker
                  v-model="form.expectedArrivalDate"
                  type="datetime"
                  placeholder="选择预计到港时间"
                  value-format="YYYY-MM-DD HH:mm:ss"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
          </el-row>
        </div>

        <div class="form-section">
          <div class="section-title">货物信息</div>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="货物名称" prop="cargoName">
                <el-input v-model="form.cargoName" placeholder="请输入货物名称" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="货物类型" prop="cargoType">
                <el-select
                  v-model="form.cargoType"
                  placeholder="请选择货物类型"
                  style="width: 100%"
                >
                  <el-option label="普通货物" value="GENERAL" />
                  <el-option label="危险品" value="DANGEROUS" />
                  <el-option label="冷冻货" value="REEFER" />
                  <el-option label="超大件" value="OVERSIZE" />
                  <el-option label="其他" value="OTHER" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="集装箱数" prop="containerCount">
                <el-input-number
                  v-model="form.containerCount"
                  :min="1"
                  :max="100"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="集装箱类型" prop="containerType">
                <el-select
                  v-model="form.containerType"
                  placeholder="请选择集装箱类型"
                  style="width: 100%"
                >
                  <el-option label="20GP" value="20GP" />
                  <el-option label="40GP" value="40GP" />
                  <el-option label="40HQ" value="40HQ" />
                  <el-option label="45HQ" value="45HQ" />
                  <el-option label="冷冻箱" value="REEFER" />
                  <el-option label="开顶箱" value="OPEN_TOP" />
                  <el-option label="框架箱" value="FLAT_RACK" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="毛重(吨)" prop="cargoWeight">
                <el-input-number
                  v-model="form.cargoWeight"
                  :min="0"
                  :precision="2"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="体积(立方米)" prop="cargoVolume">
                <el-input-number
                  v-model="form.cargoVolume"
                  :min="0"
                  :precision="2"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
          </el-row>
        </div>

        <div class="form-section">
          <div class="section-title">责任人与期望</div>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="责任人" prop="responsiblePerson">
                <el-input
                  v-model="form.responsiblePerson"
                  placeholder="请输入责任人"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="期望完成时间" prop="deadline">
                <el-date-picker
                  v-model="form.deadline"
                  type="datetime"
                  placeholder="选择期望完成时间"
                  value-format="YYYY-MM-DD HH:mm:ss"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
          </el-row>

          <el-form-item label="备注" prop="remark">
            <el-input
              v-model="form.remark"
              type="textarea"
              :rows="3"
              placeholder="请输入备注信息"
            />
          </el-form-item>
        </div>

        <el-form-item>
          <el-button type="primary" :loading="submitting" @click="handleSubmit">
            <el-icon><Check /></el-icon>
            提交订舱
          </el-button>
          <el-button @click="$router.back()">
            取消
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { bookingsApi, schedulesApi } from '@/api'
import { ElMessage } from 'element-plus'

const router = useRouter()

const formRef = ref(null)
const submitting = ref(false)
const schedules = ref([])

const form = reactive({
  shipperName: '',
  scheduleId: null,
  pol: '',
  pod: '',
  expectedDepartureDate: null,
  expectedArrivalDate: null,
  cargoName: '',
  cargoType: 'GENERAL',
  containerCount: 1,
  containerType: '20GP',
  cargoWeight: 0,
  cargoVolume: 0,
  responsiblePerson: '',
  deadline: null,
  remark: '',
})

const rules = {
  shipperName: [{ required: true, message: '请输入货主名称', trigger: 'blur' }],
  cargoName: [{ required: true, message: '请输入货物名称', trigger: 'blur' }],
  pol: [{ required: true, message: '请输入装货港', trigger: 'blur' }],
  pod: [{ required: true, message: '请输入卸货港', trigger: 'blur' }],
  cargoType: [{ required: true, message: '请选择货物类型', trigger: 'change' }],
  containerCount: [{ required: true, message: '请输入集装箱数', trigger: 'blur' }],
  containerType: [{ required: true, message: '请选择集装箱类型', trigger: 'change' }],
  responsiblePerson: [{ required: true, message: '请输入责任人', trigger: 'blur' }],
}

const fetchSchedules = async () => {
  try {
    const result = await schedulesApi.getList({})
    schedules.value = result.data?.list || result.data?.data || []
  } catch (error) {
    console.error('Fetch schedules error:', error)
  }
}

const handleSubmit = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (valid) {
      submitting.value = true
      try {
        const data = {
          ...form,
          departurePort: form.pol,
          arrivalPort: form.pod,
        }
        const result = await bookingsApi.create(data)
        if (result.success) {
          ElMessage.success('订舱单创建成功')
          router.push('/bookings')
        } else {
          ElMessage.error(result.message || '创建失败')
        }
      } catch (error) {
        console.error('Create booking error:', error)
        ElMessage.error(error.message || '创建失败，请重试')
      } finally {
        submitting.value = false
      }
    }
  })
}

onMounted(() => {
  fetchSchedules()
})
</script>

<style scoped>
.booking-create {
  padding: 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
}

.booking-form {
  max-width: 900px;
}

.form-section {
  margin-bottom: 30px;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 20px;
  padding-left: 10px;
  border-left: 3px solid #409eff;
}
</style>
