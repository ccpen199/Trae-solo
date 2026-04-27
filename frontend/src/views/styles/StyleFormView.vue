<template>
  <div class="style-form-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <el-breadcrumb separator="/">
            <el-breadcrumb-item>
              <router-link to="/styles">款式管理</router-link>
            </el-breadcrumb-item>
            <el-breadcrumb-item>{{ isEdit ? '编辑款式' : '新建款式' }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
      </template>

      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="120px"
        class="style-form"
      >
        <el-tabs v-model="activeTab">
          <el-tab-pane label="基本信息" name="basic">
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="款式名称" prop="name">
                  <el-input v-model="formData.name" placeholder="请输入款式名称" maxlength="100" show-word-limit />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="品类" prop="styleCategory">
                  <el-select v-model="formData.styleCategory" placeholder="请选择品类" style="width: 100%">
                    <el-option label="上衣" value="top" />
                    <el-option label="下装" value="bottom" />
                    <el-option label="连衣裙" value="dress" />
                    <el-option label="外套" value="coat" />
                    <el-option label="针织衫" value="knitwear" />
                    <el-option label="配饰" value="accessories" />
                    <el-option label="其他" value="other" />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>

            <el-row :gutter="20">
              <el-col :span="8">
                <el-form-item label="季节" prop="season">
                  <el-select v-model="formData.season" placeholder="请选择季节" style="width: 100%">
                    <el-option label="春季" value="spring" />
                    <el-option label="夏季" value="summer" />
                    <el-option label="秋季" value="autumn" />
                    <el-option label="冬季" value="winter" />
                    <el-option label="全年" value="all" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="年份" prop="year">
                  <el-select v-model="formData.year" placeholder="请选择年份" style="width: 100%">
                    <el-option v-for="year in years" :key="year" :label="String(year)" :value="year" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="优先级" prop="priority">
                  <el-select v-model="formData.priority" placeholder="请选择优先级" style="width: 100%">
                    <el-option label="正常" :value="3" />
                    <el-option label="高" :value="2" />
                    <el-option label="紧急" :value="1" />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>

            <el-row :gutter="20">
              <el-col :span="8">
                <el-form-item label="目标性别" prop="targetGender">
                  <el-select v-model="formData.targetGender" placeholder="请选择目标性别" style="width: 100%" clearable>
                    <el-option label="男装" value="men" />
                    <el-option label="女装" value="women" />
                    <el-option label="童装" value="kids" />
                    <el-option label="中性" value="unisex" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="年龄群" prop="ageGroup">
                  <el-select v-model="formData.ageGroup" placeholder="请选择年龄群" style="width: 100%" clearable>
                    <el-option label="婴儿" value="baby" />
                    <el-option label="儿童" value="children" />
                    <el-option label="青少年" value="teen" />
                    <el-option label="成人" value="adult" />
                    <el-option label="中老年" value="senior" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="参考编号" prop="referenceNumber">
                  <el-input v-model="formData.referenceNumber" placeholder="请输入参考编号" />
                </el-form-item>
              </el-col>
            </el-row>

            <el-row :gutter="20">
              <el-col :span="8">
                <el-form-item label="预估产量" prop="estimatedProductionQuantity">
                  <el-input-number v-model="formData.estimatedProductionQuantity" :min="0" style="width: 100%" />
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="目标成本" prop="targetUnitCost">
                  <el-input-number v-model="formData.targetUnitCost" :min="0" :precision="2" style="width: 100%" />
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="目标售价" prop="targetRetailPrice">
                  <el-input-number v-model="formData.targetRetailPrice" :min="0" :precision="2" style="width: 100%" />
                </el-form-item>
              </el-col>
            </el-row>

            <el-form-item label="描述" prop="description">
              <el-input
                v-model="formData.description"
                type="textarea"
                :rows="3"
                placeholder="请输入款式描述"
                maxlength="500"
                show-word-limit
              />
            </el-form-item>
          </el-tab-pane>

          <el-tab-pane label="设计资料" name="design">
            <el-form-item label="效果图">
              <el-upload
                class="image-uploader"
                action="#"
                list-type="picture-card"
                :limit="9"
                :on-change="handleEffectImageChange"
                :on-remove="handleEffectImageRemove"
              >
                <el-icon><Plus /></el-icon>
                <template #tip>
                  <div class="el-upload__tip">支持 jpg/png/gif 格式，单张图片不超过 2MB</div>
                </template>
              </el-upload>
            </el-form-item>

            <el-form-item label="细节图">
              <el-upload
                class="image-uploader"
                action="#"
                list-type="picture-card"
                :limit="9"
                :on-change="handleDetailImageChange"
                :on-remove="handleDetailImageRemove"
              >
                <el-icon><Plus /></el-icon>
                <template #tip>
                  <div class="el-upload__tip">支持 jpg/png/gif 格式，单张图片不超过 2MB</div>
                </template>
              </el-upload>
            </el-form-item>

            <el-form-item label="尺码表">
              <el-upload
                class="file-uploader"
                action="#"
                :limit="1"
                :on-change="handleSizeChartChange"
                :on-remove="handleSizeChartRemove"
              >
                <el-button type="primary">
                  <el-icon><Upload /></el-icon>
                  上传尺码表
                </el-button>
                <template #tip>
                  <div class="el-upload__tip">支持 Excel/PDF 格式</div>
                </template>
              </el-upload>
            </el-form-item>
          </el-tab-pane>

          <el-tab-pane label="工艺要求" name="process">
            <el-form-item label="工艺要求" prop="processRequirements">
              <el-input
                v-model="formData.processRequirements"
                type="textarea"
                :rows="8"
                placeholder="请详细描述工艺要求..."
                maxlength="2000"
                show-word-limit
              />
            </el-form-item>

            <el-form-item label="细节说明" prop="detailNotes">
              <el-input
                v-model="formData.detailNotes"
                type="textarea"
                :rows="5"
                placeholder="请输入其他细节说明..."
                maxlength="1000"
                show-word-limit
              />
            </el-form-item>
          </el-tab-pane>
        </el-tabs>

        <el-form-item class="form-actions">
          <el-button type="primary" :loading="submitting" @click="handleSubmit">
            保存
          </el-button>
          <el-button type="primary" :loading="submitting" @click="handleSaveAndSubmit">
            保存并提交打版
          </el-button>
          <el-button @click="handleCancel">取消</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import type { FormInstance, FormRules, UploadFile, UploadFiles } from 'element-plus'
import { stylesApi, type CreateStyleParams } from '@/api/styles'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const formRef = ref<FormInstance>()
const submitting = ref(false)
const activeTab = ref('basic')

const currentYear = new Date().getFullYear()
const years = computed(() => [currentYear, currentYear - 1, currentYear - 2, currentYear - 3])

const isEdit = computed(() => !!route.params.id)
const styleId = computed(() => route.params.id as string)

interface FormData extends CreateStyleParams {
  effectImageFiles: UploadFile[]
  detailImageFiles: UploadFile[]
  sizeChartFile: UploadFile | null
}

const formData = reactive<FormData>({
  name: '',
  styleCategory: '',
  season: '',
  year: currentYear,
  targetGender: '',
  ageGroup: '',
  description: '',
  processRequirements: '',
  detailNotes: '',
  referenceNumber: '',
  sampleSize: '',
  estimatedProductionQuantity: 0,
  targetUnitCost: 0,
  targetRetailPrice: 0,
  priority: 3,
  tags: [],
  effectImageUrls: [],
  detailImageUrls: [],
  sizeChartUrl: '',
  effectImageFiles: [],
  detailImageFiles: [],
  sizeChartFile: null,
})

const formRules: FormRules = {
  name: [
    { required: true, message: '请输入款式名称', trigger: 'blur' },
    { min: 2, max: 100, message: '长度在 2 到 100 个字符', trigger: 'blur' },
  ],
  styleCategory: [
    { required: true, message: '请选择品类', trigger: 'change' },
  ],
  season: [
    { required: true, message: '请选择季节', trigger: 'change' },
  ],
  year: [
    { required: true, message: '请选择年份', trigger: 'change' },
  ],
  priority: [
    { required: true, message: '请选择优先级', trigger: 'change' },
  ],
}

const handleEffectImageChange = (file: UploadFile, files: UploadFiles) => {
  formData.effectImageFiles = files
}

const handleEffectImageRemove = (_file: UploadFile, files: UploadFiles) => {
  formData.effectImageFiles = files
}

const handleDetailImageChange = (file: UploadFile, files: UploadFiles) => {
  formData.detailImageFiles = files
}

const handleDetailImageRemove = (_file: UploadFile, files: UploadFiles) => {
  formData.detailImageFiles = files
}

const handleSizeChartChange = (file: UploadFile, files: UploadFiles) => {
  formData.sizeChartFile = files.length > 0 ? files[0] : null
}

const handleSizeChartRemove = () => {
  formData.sizeChartFile = null
}

const fetchStyleDetail = async () => {
  if (!isEdit.value) return
  
  try {
    const res = await stylesApi.findOne(styleId.value)
    if (res.success && res.data) {
      const style = res.data
      formData.name = style.name || ''
      formData.styleCategory = style.styleCategory || ''
      formData.season = style.season || ''
      formData.year = style.year || currentYear
      formData.targetGender = style.targetGender || ''
      formData.ageGroup = style.ageGroup || ''
      formData.description = style.description || ''
      formData.processRequirements = style.processRequirements || ''
      formData.detailNotes = style.detailNotes || ''
      formData.referenceNumber = style.referenceNumber || ''
      formData.sampleSize = style.sampleSize || ''
      formData.estimatedProductionQuantity = style.estimatedProductionQuantity || 0
      formData.targetUnitCost = style.targetUnitCost || 0
      formData.targetRetailPrice = style.targetRetailPrice || 0
      formData.priority = style.priority || 3
      formData.tags = style.tags || []
      formData.effectImageUrls = style.effectImageUrls || []
      formData.detailImageUrls = style.detailImageUrls || []
      formData.sizeChartUrl = style.sizeChartUrl || ''
    }
  } catch (error) {
    console.error('获取款式详情失败:', error)
  }
}

const handleSubmit = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (valid) {
      submitting.value = true
      try {
        const params: CreateStyleParams = {
          name: formData.name,
          styleCategory: formData.styleCategory,
          season: formData.season,
          year: formData.year,
          targetGender: formData.targetGender,
          ageGroup: formData.ageGroup,
          description: formData.description,
          processRequirements: formData.processRequirements,
          detailNotes: formData.detailNotes,
          referenceNumber: formData.referenceNumber,
          sampleSize: formData.sampleSize,
          estimatedProductionQuantity: formData.estimatedProductionQuantity,
          targetUnitCost: formData.targetUnitCost,
          targetRetailPrice: formData.targetRetailPrice,
          priority: formData.priority,
          tags: formData.tags,
        }
        
        if (isEdit.value) {
          await stylesApi.update(styleId.value, params)
        } else {
          await stylesApi.create(params)
        }
        
        router.push('/styles')
      } catch (error) {
        console.error('保存失败:', error)
      } finally {
        submitting.value = false
      }
    }
  })
}

const handleSaveAndSubmit = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (valid) {
      submitting.value = true
      try {
        const params: CreateStyleParams = {
          name: formData.name,
          styleCategory: formData.styleCategory,
          season: formData.season,
          year: formData.year,
          targetGender: formData.targetGender,
          ageGroup: formData.ageGroup,
          description: formData.description,
          processRequirements: formData.processRequirements,
          detailNotes: formData.detailNotes,
          referenceNumber: formData.referenceNumber,
          sampleSize: formData.sampleSize,
          estimatedProductionQuantity: formData.estimatedProductionQuantity,
          targetUnitCost: formData.targetUnitCost,
          targetRetailPrice: formData.targetRetailPrice,
          priority: formData.priority,
          tags: formData.tags,
        }
        
        let styleRes
        if (isEdit.value) {
          await stylesApi.update(styleId.value, params)
          await stylesApi.submitForPattern(styleId.value)
        } else {
          styleRes = await stylesApi.create(params)
          if (styleRes.success && styleRes.data) {
            await stylesApi.submitForPattern(styleRes.data.id)
          }
        }
        
        router.push('/styles')
      } catch (error) {
        console.error('保存并提交失败:', error)
      } finally {
        submitting.value = false
      }
    }
  })
}

const handleCancel = () => {
  router.back()
}

onMounted(() => {
  if (isEdit.value) {
    fetchStyleDetail()
  }
})
</script>

<style scoped lang="scss">
.style-form-container {
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .style-form {
    padding-top: 20px;

    .form-actions {
      display: flex;
      justify-content: flex-start;
      gap: 12px;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #ebeef5;
    }
  }

  .image-uploader {
    :deep(.el-upload-list--picture-card) {
      display: flex;
      flex-wrap: wrap;
    }
    
    :deep(.el-upload--picture-card) {
      width: 100px;
      height: 100px;
    }
  }

  .file-uploader {
    :deep(.el-upload) {
      display: block;
    }
  }
}
</style>
