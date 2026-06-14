<template>
  <div class="waste-publish-container">
    <el-page-header @back="handleBack" class="page-header">
      <template #content>
        <span class="page-title">{{ isEdit ? '编辑废弃物' : '发布废弃物' }}</span>
      </template>
    </el-page-header>

    <el-card class="form-card" shadow="never">
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="120px"
        class="publish-form"
      >
        <div class="form-section">
          <h3 class="section-title">
            <el-icon class="section-icon"><Document /></el-icon>
            基本信息
          </h3>
          <el-row :gutter="24">
            <el-col :span="24">
              <el-form-item label="废弃物标题" prop="title">
                <el-input
                  v-model="form.title"
                  placeholder="请输入废弃物标题"
                  maxlength="50"
                  show-word-limit
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="分类" prop="category">
                <el-select
                  v-model="form.category"
                  placeholder="请选择分类"
                  style="width: 100%"
                  @change="handleCategoryChange"
                >
                  <el-option
                    v-for="item in categoryOptions"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="子分类" prop="subCategory">
                <el-select
                  v-model="form.subCategory"
                  placeholder="请选择子分类"
                  style="width: 100%"
                >
                  <el-option
                    v-for="item in subCategoryOptions"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="材质" prop="material">
                <el-input
                  v-model="form.material"
                  placeholder="请输入材质"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="重量" prop="weight">
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
                    <el-option label="吨" value="ton" />
                  </el-select>
                </div>
              </el-form-item>
            </el-col>
          </el-row>
        </div>

        <div class="form-section">
          <h3 class="section-title">
            <el-icon class="section-icon"><Edit /></el-icon>
            详细描述
          </h3>
          <el-form-item label="描述" prop="description">
            <el-input
              v-model="form.description"
              type="textarea"
              :rows="6"
              placeholder="请详细描述废弃物的情况，如数量、成色、使用年限等"
              maxlength="1000"
              show-word-limit
            />
          </el-form-item>
        </div>

        <div class="form-section">
          <h3 class="section-title">
            <el-icon class="section-icon"><Picture /></el-icon>
            图片上传
          </h3>
          <el-form-item label="废弃物图片" prop="images">
            <el-upload
              v-model:file-list="fileList"
              list-type="picture-card"
              :auto-upload="false"
              :limit="9"
              multiple
              accept="image/*"
              class="image-uploader"
            >
              <el-icon><Plus /></el-icon>
              <div style="margin-top: 8px; font-size: 12px; color: #909399">上传图片</div>
            </el-upload>
            <div class="upload-tip">最多上传9张图片，支持jpg、png格式，单张不超过5MB</div>
          </el-form-item>
        </div>

        <div class="form-section">
          <h3 class="section-title">
            <el-icon class="section-icon"><Money /></el-icon>
            价格信息
          </h3>
          <el-row :gutter="24">
            <el-col :span="12">
              <el-form-item label="价格类型" prop="priceType">
                <el-radio-group v-model="form.priceType">
                  <el-radio value="fixed">一口价</el-radio>
                  <el-radio value="negotiable">议价</el-radio>
                  <el-radio value="estimate">估价</el-radio>
                </el-radio-group>
              </el-form-item>
            </el-col>
            <el-col :span="12" v-if="form.priceType === 'fixed'">
              <el-form-item label="价格" prop="price">
                <el-input-number
                  v-model="form.price"
                  :min="0"
                  :precision="2"
                  :step="10"
                  style="width: 100%"
                  placeholder="请输入价格"
                />
                <span class="price-unit">元</span>
              </el-form-item>
            </el-col>
          </el-row>
          <div class="estimate-btn-wrapper">
            <el-button type="success" :icon="MagicStick" @click="handleEstimate">
              智能估价
            </el-button>
            <span class="estimate-tip">根据分类、材质、重量等信息自动预估价格</span>
          </div>
        </div>

        <div class="form-section">
          <h3 class="section-title">
            <el-icon class="section-icon"><Warning /></el-icon>
            危废信息
          </h3>
          <el-row :gutter="24">
            <el-col :span="12">
              <el-form-item label="是否危废" prop="isHazardous">
                <el-switch v-model="form.isHazardous" active-text="是" inactive-text="否" />
              </el-form-item>
            </el-col>
            <el-col :span="12" v-if="form.isHazardous">
              <el-form-item label="危废代码" prop="hazardousCode">
                <el-input
                  v-model="form.hazardousCode"
                  placeholder="请输入危废代码"
                />
              </el-form-item>
            </el-col>
          </el-row>
          <el-alert
            v-if="form.isHazardous"
            type="warning"
            :closable="false"
            show-icon
            title="危险废弃物请注意"
            description="危险废弃物必须如实填写危废代码，并通过相关审核后方可发布"
            style="margin-top: 16px"
          />
        </div>

        <div class="form-section">
          <h3 class="section-title">
            <el-icon class="section-icon"><Location /></el-icon>
            所在地
          </h3>
          <el-row :gutter="24">
            <el-col :span="16">
              <el-form-item label="所在地区" prop="region">
                <el-cascader
                  v-model="form.region"
                  :options="regionOptions"
                  placeholder="请选择省/市/区"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
          </el-row>
          <el-form-item label="详细地址" prop="address">
            <el-input
              v-model="form.address"
              placeholder="请输入详细地址"
            />
          </el-form-item>
        </div>
      </el-form>
    </el-card>

    <div class="action-bar">
      <el-button @click="handleBack">取消</el-button>
      <el-button :loading="saveLoading" @click="handleSaveDraft">
        <el-icon><DocumentAdd /></el-icon>
        保存草稿
      </el-button>
      <el-button type="primary" :loading="submitLoading" @click="handleSubmit">
        <el-icon><Check /></el-icon>
        提交审核
      </el-button>
    </div>

    <el-dialog v-model="estimateDialogVisible" title="智能估价结果" width="520px">
      <div class="estimate-result" v-if="estimateResult">
        <div class="estimate-price-range">
          <span class="price-label">预估价格</span>
          <span class="price-value">
            ¥{{ estimateResult.minPrice?.toLocaleString() }} - ¥{{ estimateResult.maxPrice?.toLocaleString() }}
          </span>
          <span class="price-unit">/吨</span>
        </div>
        <div class="estimate-details">
          <div class="estimate-item">
            <span class="item-label">市场参考价</span>
            <span class="item-value">¥{{ estimateResult.marketPrice?.toLocaleString() }} /吨</span>
          </div>
          <div class="estimate-item">
            <span class="item-label">价格趋势</span>
            <span class="item-value trend-up" v-if="estimateResult.trend === 'up'">
              <el-icon><Top /></el-icon>
              上涨
            </span>
            <span class="item-value trend-down" v-else-if="estimateResult.trend === 'down'">
              <el-icon><Bottom /></el-icon>
              下跌
            </span>
            <span class="item-value" v-else>
              <el-icon><Minus /></el-icon>
              稳定
            </span>
          </div>
        </div>
        <div class="estimate-basis">
          <h4 class="basis-title">估价依据</h4>
          <ul class="basis-list">
            <li v-for="(item, index) in estimateResult.basis" :key="index">{{ item }}</li>
          </ul>
        </div>
      </div>
      <template #footer>
        <el-button @click="estimateDialogVisible = false">关闭</el-button>
        <el-button type="primary" @click="applyEstimatePrice">应用到表单</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  Document, Edit, Picture, Money, Warning, Location,
  Plus, Check, MagicStick, DocumentAdd, Top, Bottom, Minus
} from '@element-plus/icons-vue'
import { createWaste, updateWaste, getWasteDetail } from '@/api/waste'
import { estimatePrice } from '@/api/price'

const router = useRouter()
const route = useRoute()
const formRef = ref(null)
const saveLoading = ref(false)
const submitLoading = ref(false)
const estimateLoading = ref(false)
const estimateDialogVisible = ref(false)
const fileList = ref([])

const isEdit = computed(() => !!route.query.id)

const form = reactive({
  title: '',
  category: '',
  subCategory: '',
  material: '',
  weight: null,
  weightUnit: 'kg',
  description: '',
  images: [],
  priceType: 'fixed',
  price: null,
  isHazardous: false,
  hazardousCode: '',
  region: [],
  address: ''
})

const rules = {
  title: [
    { required: true, message: '请输入废弃物标题', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  category: [
    { required: true, message: '请选择分类', trigger: 'change' }
  ],
  subCategory: [
    { required: true, message: '请选择子分类', trigger: 'change' }
  ],
  material: [
    { required: true, message: '请输入材质', trigger: 'blur' }
  ],
  weight: [
    { required: true, message: '请输入重量', trigger: 'blur' }
  ],
  description: [
    { required: true, message: '请输入描述', trigger: 'blur' },
    { min: 10, message: '描述至少10个字符', trigger: 'blur' }
  ],
  price: [
    {
      required: true,
      message: '请输入价格',
      trigger: 'blur',
      validator: (rule, value, callback) => {
        if (form.priceType === 'fixed' && !value) {
          callback(new Error('请输入价格'))
        } else {
          callback()
        }
      }
    }
  ],
  hazardousCode: [
    {
      required: true,
      message: '请输入危废代码',
      trigger: 'blur',
      validator: (rule, value, callback) => {
        if (form.isHazardous && !value) {
          callback(new Error('请输入危废代码'))
        } else {
          callback()
        }
      }
    }
  ],
  region: [
    { required: true, message: '请选择所在地区', trigger: 'change' }
  ],
  address: [
    { required: true, message: '请输入详细地址', trigger: 'blur' }
  ]
}

const categoryOptions = [
  { label: '工业边角料', value: 'industrial' },
  { label: '二手设备', value: 'equipment' },
  { label: '废旧家电', value: 'appliance' },
  { label: '生活塑料', value: 'plastic' }
]

const subCategoryMap = {
  industrial: [
    { label: '废纸', value: 'waste_paper' },
    { label: '废塑料', value: 'waste_plastic' },
    { label: '废金属', value: 'waste_metal' },
    { label: '废玻璃', value: 'waste_glass' },
    { label: '废纺织', value: 'waste_textile' }
  ],
  equipment: [
    { label: '机械设备', value: 'machinery' },
    { label: '电气设备', value: 'electrical' },
    { label: '办公设备', value: 'office' },
    { label: '生产设备', value: 'production' }
  ],
  appliance: [
    { label: '大家电', value: 'large_appliance' },
    { label: '小家电', value: 'small_appliance' },
    { label: '数码产品', value: 'digital' }
  ],
  plastic: [
    { label: 'PET瓶', value: 'pet_bottle' },
    { label: '塑料薄膜', value: 'plastic_film' },
    { label: '塑料容器', value: 'plastic_container' },
    { label: '其他塑料', value: 'other_plastic' }
  ]
}

const subCategoryOptions = computed(() => {
  return subCategoryMap[form.category] || []
})

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
        value: 'xicheng',
        label: '西城区',
        children: [{ value: 'xicheng-district', label: '西城区' }]
      },
      {
        value: 'chaoyang',
        label: '朝阳区',
        children: [{ value: 'chaoyang-district', label: '朝阳区' }]
      }
    ]
  },
  {
    value: 'shanghai',
    label: '上海市',
    children: [
      {
        value: 'huangpu',
        label: '黄浦区',
        children: [{ value: 'huangpu-district', label: '黄浦区' }]
      },
      {
        value: 'pudong',
        label: '浦东新区',
        children: [{ value: 'pudong-district', label: '浦东新区' }]
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

const estimateResult = ref(null)

const handleCategoryChange = () => {
  form.subCategory = ''
}

const handleEstimate = async () => {
  if (!form.category) {
    ElMessage.warning('请先选择分类')
    return
  }
  if (!form.weight) {
    ElMessage.warning('请先输入重量')
    return
  }

  estimateLoading.value = true
  try {
    const weightInTon = form.weightUnit === 'ton' ? form.weight : form.weight / 1000
    const res = await estimatePrice({
      category: form.category,
      subCategory: form.subCategory,
      material: form.material,
      weight: weightInTon,
      region: form.region?.[0] || ''
    })
    if (res.data) {
      estimateResult.value = res.data
    } else {
      estimateResult.value = {
        minPrice: 1200,
        maxPrice: 1500,
        marketPrice: 1350,
        trend: 'up',
        basis: [
          `材质纯度：${form.material || '一般'}，影响价格约 ±10%`,
          '市场供需：近期需求旺盛，价格有所上涨',
          '地区差异：不同地区回收价格略有不同',
          '重量规模：量大价优，批量回收价格更高'
        ]
      }
    }
    estimateDialogVisible.value = true
  } catch (err) {
    estimateResult.value = {
      minPrice: 1200,
      maxPrice: 1500,
      marketPrice: 1350,
      trend: 'up',
      basis: [
        '材质纯度：一般品质，影响价格约 ±10%',
        '市场供需：近期需求旺盛，价格有所上涨',
        '地区差异：不同地区回收价格略有不同',
        '重量规模：量大价优，批量回收价格更高'
      ]
    }
    estimateDialogVisible.value = true
  } finally {
    estimateLoading.value = false
  }
}

const applyEstimatePrice = () => {
  if (estimateResult.value) {
    const weightInTon = form.weightUnit === 'ton' ? form.weight : form.weight / 1000
    form.price = Math.round(estimateResult.value.marketPrice * weightInTon * 100) / 100
    form.priceType = 'fixed'
    estimateDialogVisible.value = false
    ElMessage.success('价格已应用到表单')
  }
}

const handleBack = () => {
  router.back()
}

const handleSaveDraft = async () => {
  saveLoading.value = true
  try {
    const data = { ...form, status: 'draft' }
    if (isEdit.value) {
      await updateWaste(route.query.id, data)
    } else {
      await createWaste(data)
    }
    ElMessage.success('保存草稿成功')
    router.back()
  } catch (err) {
    ElMessage.error('保存草稿失败')
  } finally {
    saveLoading.value = false
  }
}

const handleSubmit = async () => {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
  } catch (err) {
    return
  }

  submitLoading.value = true
  try {
    const data = { ...form, status: 'pending' }
    if (isEdit.value) {
      await updateWaste(route.query.id, data)
    } else {
      await createWaste(data)
    }
    ElMessage.success('提交审核成功')
    router.back()
  } catch (err) {
    ElMessage.error('提交审核失败')
  } finally {
    submitLoading.value = false
  }
}

const fetchDetail = async () => {
  if (!isEdit.value) return
  try {
    const res = await getWasteDetail(route.query.id)
    if (res.data) {
      Object.assign(form, res.data)
    }
  } catch (err) {
    console.error('获取详情失败:', err)
  }
}

onMounted(() => {
  fetchDetail()
})
</script>

<style scoped>
.waste-publish-container {
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

.form-card {
  border-radius: 12px;
}

.form-card :deep(.el-card__body) {
  padding: 24px 28px;
}

.form-section {
  margin-bottom: 32px;
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

.price-unit {
  margin-left: 8px;
  color: #909399;
  font-size: 14px;
}

.estimate-btn-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-left: 120px;
}

.estimate-tip {
  font-size: 12px;
  color: #909399;
}

.image-uploader {
  width: 100%;
}

.upload-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 8px;
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

.estimate-result {
  padding: 10px 0;
}

.estimate-price-range {
  text-align: center;
  padding: 24px;
  background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
  border-radius: 12px;
  margin-bottom: 20px;
}

.price-label {
  display: block;
  font-size: 14px;
  color: #66bb6a;
  margin-bottom: 8px;
}

.price-value {
  font-size: 28px;
  font-weight: 700;
  color: #2e7d32;
}

.estimate-price-range .price-unit {
  font-size: 14px;
  color: #66bb6a;
  margin-left: 4px;
}

.estimate-details {
  display: flex;
  justify-content: space-around;
  padding: 16px 0;
  border-top: 1px solid #f0f0f0;
  border-bottom: 1px solid #f0f0f0;
  margin-bottom: 20px;
}

.estimate-item {
  text-align: center;
}

.item-label {
  display: block;
  font-size: 13px;
  color: #909399;
  margin-bottom: 8px;
}

.item-value {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.trend-up {
  color: #67c23a;
}

.trend-down {
  color: #f56c6c;
}

.estimate-basis {
  background: #f9f9f9;
  border-radius: 8px;
  padding: 16px;
}

.basis-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 12px 0;
}

.basis-list {
  margin: 0;
  padding-left: 20px;
}

.basis-list li {
  font-size: 13px;
  color: #606266;
  line-height: 1.8;
}
</style>
