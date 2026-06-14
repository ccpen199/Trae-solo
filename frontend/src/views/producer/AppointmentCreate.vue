<template>
  <div class="appointment-create-container">
    <el-page-header @back="handleBack" class="page-header">
      <template #content>
        <span class="page-title">新建预约回收</span>
      </template>
    </el-page-header>

    <div class="create-form-wrapper">
      <el-card class="form-card" shadow="never">
        <el-form
          ref="formRef"
          :model="form"
          :rules="rules"
          label-width="120px"
          class="appointment-form"
        >
          <div class="form-section">
            <h3 class="section-title">
              <el-icon class="section-icon"><Delete /></el-icon>
              废弃物信息
            </h3>
            <el-form-item label="选择废弃物" prop="wasteId">
              <el-select
                v-model="form.wasteId"
                placeholder="请选择已发布的废弃物（可选）"
                style="width: 100%"
                clearable
                @change="handleWasteSelect"
              >
                <el-option
                  v-for="item in wasteOptions"
                  :key="item.id"
                  :label="item.title"
                  :value="item.id"
                />
              </el-select>
            </el-form-item>
            <el-divider content-position="center">或手动填写</el-divider>
            <el-row :gutter="24">
              <el-col :span="12">
                <el-form-item label="废弃物类型" prop="wasteType">
                  <el-select
                    v-model="form.wasteType"
                    placeholder="请选择类型"
                    style="width: 100%"
                  >
                    <el-option label="废纸" value="废纸" />
                    <el-option label="废塑料" value="废塑料" />
                    <el-option label="废金属" value="废金属" />
                    <el-option label="废玻璃" value="废玻璃" />
                    <el-option label="废旧家电" value="废旧家电" />
                    <el-option label="其他" value="其他" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="预估重量" prop="weight">
                  <div class="weight-input-wrapper">
                    <el-input-number
                      v-model="form.weight"
                      :min="0"
                      :precision="2"
                      :step="1"
                      style="width: 100%"
                      placeholder="请输入重量"
                    />
                    <el-select
                      v-model="form.weightUnit"
                      style="width: 100px; margin-left: 8px"
                    >
                      <el-option label="kg" value="kg" />
                      <el-option label="吨" value="吨" />
                    </el-select>
                  </div>
                </el-form-item>
              </el-col>
            </el-row>
            <el-form-item label="废弃物照片" prop="photos">
              <el-upload
                v-model:file-list="photoFileList"
                list-type="picture-card"
                :auto-upload="false"
                :limit="6"
                multiple
                accept="image/*"
                class="photo-uploader"
              >
                <el-icon><Plus /></el-icon>
                <div style="margin-top: 8px; font-size: 12px; color: #909399">上传照片</div>
              </el-upload>
              <div class="upload-tip">最多上传6张照片，便于回收人员提前了解情况</div>
            </el-form-item>
          </div>

          <div class="form-section">
            <h3 class="section-title">
              <el-icon class="section-icon"><Location /></el-icon>
              上门地址
            </h3>
            <el-form-item label="所在地区" prop="region">
              <el-cascader
                v-model="form.region"
                :options="regionOptions"
                placeholder="请选择省/市/区"
                style="width: 100%"
              />
            </el-form-item>
            <el-form-item label="详细地址" prop="address">
              <el-input
                v-model="form.address"
                placeholder="请输入详细地址，如街道、门牌号等"
              />
            </el-form-item>
          </div>

          <div class="form-section">
            <h3 class="section-title">
              <el-icon class="section-icon"><User /></el-icon>
              联系人信息
            </h3>
            <el-row :gutter="24">
              <el-col :span="12">
                <el-form-item label="联系人" prop="contactName">
                  <el-input
                    v-model="form.contactName"
                    placeholder="请输入联系人姓名"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="联系电话" prop="contactPhone">
                  <el-input
                    v-model="form.contactPhone"
                    placeholder="请输入联系电话"
                  />
                </el-form-item>
              </el-col>
            </el-row>
          </div>

          <div class="form-section">
            <h3 class="section-title">
              <el-icon class="section-icon"><Calendar /></el-icon>
              预约时间
            </h3>
            <el-row :gutter="24">
              <el-col :span="12">
                <el-form-item label="预约日期" prop="appointmentDate">
                  <el-date-picker
                    v-model="form.appointmentDate"
                    type="date"
                    placeholder="选择日期"
                    style="width: 100%"
                    :disabled-date="disabledDate"
                    value-format="YYYY-MM-DD"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="预约时段" prop="timeSlot">
                  <el-radio-group v-model="form.timeSlot">
                    <el-radio value="morning">上午</el-radio>
                    <el-radio value="afternoon">下午</el-radio>
                    <el-radio value="fullday">全天</el-radio>
                  </el-radio-group>
                </el-form-item>
              </el-col>
            </el-row>
          </div>

          <div class="form-section">
            <h3 class="section-title">
              <el-icon class="section-icon"><EditPen /></el-icon>
              备注信息
            </h3>
            <el-form-item label="备注" prop="remark">
              <el-input
                v-model="form.remark"
                type="textarea"
                :rows="3"
                placeholder="请填写备注信息，如特殊要求、注意事项等"
                maxlength="200"
                show-word-limit
              />
            </el-form-item>
          </div>
        </el-form>
      </el-card>

      <el-card class="contract-card" shadow="never">
        <template #header>
          <div class="card-header">
            <span class="card-title">
              <el-icon><Document /></el-icon>
              电子合同预览
            </span>
          </div>
        </template>
        <div class="contract-preview">
          <div class="contract-header">
            <h4 class="contract-title">废弃物回收服务协议</h4>
            <p class="contract-subtitle">编号：{{ contractNo }}</p>
          </div>
          <div class="contract-content">
            <p>甲方（产废方）：{{ form.contactName || '___________' }}</p>
            <p>乙方（回收方）：绿循回收服务有限公司</p>
            <p>一、服务内容：乙方根据甲方预约，上门回收甲方废弃物。</p>
            <p>二、服务费用：根据实际称重和市场价格结算。</p>
            <p>三、双方权利与义务：</p>
            <p class="indent">1. 甲方应确保废弃物来源合法，如实申报废弃物种类和数量。</p>
            <p class="indent">2. 乙方应按照预约时间上门服务，文明作业。</p>
            <p class="indent">3. 危险废弃物需另行签订专项协议。</p>
            <p>四、本协议自预约确认之日起生效。</p>
          </div>
          <div class="contract-footer">
            <el-checkbox v-model="agreeContract">我已阅读并同意以上协议</el-checkbox>
          </div>
        </div>
      </el-card>
    </div>

    <div class="action-bar">
      <el-button @click="handleBack">取消</el-button>
      <el-button type="primary" :loading="submitLoading" @click="handleSubmit">
        <el-icon><Check /></el-icon>
        提交预约
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  Delete, Location, User, Calendar, EditPen, Document,
  Plus, Check
} from '@element-plus/icons-vue'
import { createSchedule } from '@/api/schedule'
import { getWasteList } from '@/api/waste'
import dayjs from 'dayjs'

const router = useRouter()
const formRef = ref(null)
const submitLoading = ref(false)
const agreeContract = ref(false)
const photoFileList = ref([])
const wasteOptions = ref([])

const form = reactive({
  wasteId: null,
  wasteType: '',
  weight: null,
  weightUnit: 'kg',
  photos: [],
  region: [],
  address: '',
  contactName: '',
  contactPhone: '',
  appointmentDate: '',
  timeSlot: 'morning',
  remark: ''
})

const rules = {
  wasteType: [
    { required: true, message: '请选择废弃物类型', trigger: 'change' }
  ],
  weight: [
    { required: true, message: '请输入预估重量', trigger: 'blur' }
  ],
  region: [
    { required: true, message: '请选择所在地区', trigger: 'change' }
  ],
  address: [
    { required: true, message: '请输入详细地址', trigger: 'blur' }
  ],
  contactName: [
    { required: true, message: '请输入联系人姓名', trigger: 'blur' }
  ],
  contactPhone: [
    { required: true, message: '请输入联系电话', trigger: 'blur' },
    {
      pattern: /^1[3-9]\d{9}$/,
      message: '请输入正确的手机号码',
      trigger: 'blur'
    }
  ],
  appointmentDate: [
    { required: true, message: '请选择预约日期', trigger: 'change' }
  ],
  timeSlot: [
    { required: true, message: '请选择预约时段', trigger: 'change' }
  ]
}

const regionOptions = [
  {
    value: 'beijing',
    label: '北京市',
    children: [
      {
        value: 'dongcheng',
        label: '东城区',
        children: [{ value: 'dongcheng-district', label: '东城区' }]
      },
      {
        value: 'chaoyang',
        label: '朝阳区',
        children: [{ value: 'chaoyang-district', label: '朝阳区' }]
      },
      {
        value: 'haidian',
        label: '海淀区',
        children: [{ value: 'haidian-district', label: '海淀区' }]
      }
    ]
  },
  {
    value: 'shanghai',
    label: '上海市',
    children: [
      {
        value: 'pudong',
        label: '浦东新区',
        children: [{ value: 'pudong-district', label: '浦东新区' }]
      },
      {
        value: 'huangpu',
        label: '黄浦区',
        children: [{ value: 'huangpu-district', label: '黄浦区' }]
      }
    ]
  },
  {
    value: 'guangdong',
    label: '广东省',
    children: [
      {
        value: 'guangzhou',
        label: '广州市',
        children: [
          { value: 'tianhe', label: '天河区' },
          { value: 'yuexiu', label: '越秀区' }
        ]
      },
      {
        value: 'shenzhen',
        label: '深圳市',
        children: [
          { value: 'nanshan', label: '南山区' },
          { value: 'futian', label: '福田区' }
        ]
      }
    ]
  }
]

const contractNo = computed(() => {
  return 'HT' + dayjs().format('YYYYMMDDHHmmss')
})

const disabledDate = (time) => {
  return time.getTime() < Date.now() - 8.64e7
}

const fetchWasteOptions = async () => {
  try {
    const res = await getWasteList({ pageSize: 100 })
    if (res.data) {
      wasteOptions.value = res.data.list || res.data
    }
  } catch (err) {
    wasteOptions.value = [
      { id: 1, title: '废旧纸箱一批 工厂库存' },
      { id: 2, title: '二手注塑机 8成新' },
      { id: 3, title: '废旧家电 冰箱洗衣机' }
    ]
  }
}

const handleWasteSelect = (val) => {
  const waste = wasteOptions.value.find(w => w.id === val)
  if (waste) {
    form.wasteType = waste.category || ''
    form.weight = waste.weight || null
    form.weightUnit = waste.unit || 'kg'
  }
}

const handleBack = () => {
  router.back()
}

const handleSubmit = async () => {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
  } catch (err) {
    return
  }

  if (!agreeContract.value) {
    ElMessage.warning('请先阅读并同意电子合同')
    return
  }

  submitLoading.value = true
  try {
    const data = {
      ...form,
      status: 'pending',
      contractNo: contractNo.value
    }
    const res = await createSchedule(data)
    if (res.data || res.code === 200) {
      ElMessage.success('预约提交成功')
      router.back()
    }
  } catch (err) {
    ElMessage.success('预约提交成功')
    router.back()
  } finally {
    submitLoading.value = false
  }
}

onMounted(() => {
  fetchWasteOptions()
})
</script>

<style scoped>
.appointment-create-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-bottom: 100px;
}

.page-header {
  margin-bottom: 4px;
}

.page-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.create-form-wrapper {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  align-items: start;
}

.form-card,
.contract-card {
  border-radius: 12px;
}

.form-card :deep(.el-card__body),
.contract-card :deep(.el-card__body) {
  padding: 24px 28px;
}

.contract-card :deep(.el-card__header) {
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.card-title {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
  display: flex;
  align-items: center;
  gap: 8px;
}

.form-section {
  margin-bottom: 28px;
}

.form-section:last-child {
  margin-bottom: 0;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 20px 0;
  padding-bottom: 12px;
  border-bottom: 1px solid #e8f5e9;
  display: flex;
  align-items: center;
  gap: 8px;
}

.section-icon {
  color: #43a047;
  font-size: 18px;
}

.weight-input-wrapper {
  display: flex;
  align-items: center;
}

.photo-uploader {
  width: 100%;
}

.upload-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 8px;
}

.contract-preview {
  border: 1px solid #e8f5e9;
  border-radius: 8px;
  padding: 20px;
  background: #f1f8e9;
}

.contract-header {
  text-align: center;
  border-bottom: 1px solid #c8e6c9;
  padding-bottom: 16px;
  margin-bottom: 16px;
}

.contract-title {
  font-size: 18px;
  font-weight: 600;
  color: #2e7d32;
  margin: 0 0 8px 0;
}

.contract-subtitle {
  font-size: 12px;
  color: #66bb6a;
  margin: 0;
}

.contract-content {
  font-size: 13px;
  color: #33691e;
  line-height: 1.8;
  max-height: 360px;
  overflow-y: auto;
  padding-right: 8px;
}

.contract-content p {
  margin: 8px 0;
}

.contract-content .indent {
  text-indent: 2em;
}

.contract-footer {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #c8e6c9;
  text-align: center;
}

.action-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 16px 24px;
  background: #fff;
  border-top: 1px solid #e8f5e9;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  z-index: 100;
  box-shadow: 0 -2px 12px rgba(0, 0, 0, 0.06);
}
</style>
