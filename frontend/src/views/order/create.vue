<template>
  <div class="order-create">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>创建采购订单</span>
        </div>
      </template>

      <el-steps :active="currentStep" align-center style="margin-bottom: 40px">
        <el-step title="基本信息" />
        <el-step title="农户分配" />
        <el-step title="确认提交" />
      </el-steps>

      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="120px"
        class="order-form"
      >
        <div v-show="currentStep === 0" class="step-content">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="产品名称" prop="productName">
                <el-input v-model="form.productName" placeholder="请输入产品名称" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="产品类别" prop="productCategory">
                <el-select v-model="form.productCategory" placeholder="请选择产品类别" style="width: 100%">
                  <el-option label="蔬菜" value="蔬菜" />
                  <el-option label="水果" value="水果" />
                  <el-option label="肉类" value="肉类" />
                  <el-option label="水产" value="水产" />
                  <el-option label="粮油" value="粮油" />
                  <el-option label="其他" value="其他" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="预计重量(kg)" prop="expectedWeight">
                <el-input-number
                  v-model="form.expectedWeight"
                  :min="1"
                  :precision="2"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="预计单价(元/kg)" prop="expectedPrice">
                <el-input-number
                  v-model="form.expectedPrice"
                  :min="0"
                  :precision="2"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="容差率(%)" prop="toleranceRate">
                <el-input-number
                  v-model="form.toleranceRate"
                  :min="0"
                  :max="50"
                  :precision="2"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="是否冷链" prop="hasColdChain">
                <el-switch v-model="form.hasColdChain" active-text="是" inactive-text="否" />
              </el-form-item>
            </el-col>
          </el-row>

          <el-divider content-position="left">产地信息</el-divider>

          <el-row :gutter="20">
            <el-col :span="8">
              <el-form-item label="省份" prop="originProvince">
                <el-select
                  v-model="form.originProvince"
                  placeholder="请选择省份"
                  style="width: 100%"
                  @change="handleOriginProvinceChange"
                >
                  <el-option
                    v-for="province in originProvinces"
                    :key="province.code"
                    :label="province.name"
                    :value="province.code"
                  />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="城市" prop="originCity">
                <el-select
                  v-model="form.originCity"
                  placeholder="请选择城市"
                  style="width: 100%"
                  :disabled="!form.originProvince"
                  @change="handleOriginCityChange"
                >
                  <el-option
                    v-for="city in originCities"
                    :key="city.code"
                    :label="city.name"
                    :value="city.code"
                  />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="区县" prop="originDistrict">
                <el-select
                  v-model="form.originDistrict"
                  placeholder="请选择区县"
                  style="width: 100%"
                  :disabled="!form.originCity"
                >
                  <el-option
                    v-for="district in originDistricts"
                    :key="district.code"
                    :label="district.name"
                    :value="district.code"
                  />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>

          <el-divider content-position="left">目的地信息</el-divider>

          <el-row :gutter="20">
            <el-col :span="8">
              <el-form-item label="省份" prop="destinationProvince">
                <el-select
                  v-model="form.destinationProvince"
                  placeholder="请选择省份"
                  style="width: 100%"
                  @change="handleDestProvinceChange"
                >
                  <el-option
                    v-for="province in destProvinces"
                    :key="province.code"
                    :label="province.name"
                    :value="province.code"
                  />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="城市" prop="destinationCity">
                <el-select
                  v-model="form.destinationCity"
                  placeholder="请选择城市"
                  style="width: 100%"
                  :disabled="!form.destinationProvince"
                  @change="handleDestCityChange"
                >
                  <el-option
                    v-for="city in destCities"
                    :key="city.code"
                    :label="city.name"
                    :value="city.code"
                  />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="区县" prop="destinationDistrict">
                <el-select
                  v-model="form.destinationDistrict"
                  placeholder="请选择区县"
                  style="width: 100%"
                  :disabled="!form.destinationCity"
                >
                  <el-option
                    v-for="district in destDistricts"
                    :key="district.code"
                    :label="district.name"
                    :value="district.code"
                  />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="预计提货日期" prop="expectedPickupDate">
                <el-date-picker
                  v-model="form.expectedPickupDate"
                  type="date"
                  placeholder="选择日期"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="预计送达日期" prop="expectedDeliveryDate">
                <el-date-picker
                  v-model="form.expectedDeliveryDate"
                  type="date"
                  placeholder="选择日期"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
          </el-row>

          <el-form-item label="质量标准" prop="qualityStandard">
            <el-input
              v-model="form.qualityStandard"
              type="textarea"
              :rows="3"
              placeholder="请输入质量标准要求"
            />
          </el-form-item>

          <el-form-item label="备注" prop="remark">
            <el-input
              v-model="form.remark"
              type="textarea"
              :rows="2"
              placeholder="请输入备注信息"
            />
          </el-form-item>
        </div>

        <div v-show="currentStep === 1" class="step-content">
          <div style="margin-bottom: 16px">
            <el-button type="primary" @click="addFarmerAllocation">
              <el-icon><Plus /></el-icon>
              添加农户分配
            </el-button>
          </div>

          <div v-if="form.farmerAllocations.length === 0">
            <el-empty description="请添加农户分配" />
          </div>

          <div
            v-for="(allocation, index) in form.farmerAllocations"
            :key="index"
            class="allocation-card"
          >
            <el-card>
              <template #header>
                <div class="allocation-header">
                  <span>农户分配 {{ index + 1 }}</span>
                  <el-button type="danger" text @click="removeFarmerAllocation(index)">
                    删除
                  </el-button>
                </div>
              </template>

              <el-row :gutter="20">
                <el-col :span="12">
                  <el-form-item :label="`农户选择`" :prop="`farmerAllocations.${index}.farmerId`">
                    <el-select
                      v-model="allocation.farmerId"
                      placeholder="请选择农户"
                      style="width: 100%"
                    >
                      <el-option
                        v-for="farmer in farmers"
                        :key="farmer.id"
                        :label="farmer.realName"
                        :value="farmer.id"
                      >
                        <span>{{ farmer.realName }}</span>
                        <span style="float: right; color: #8492a6; font-size: 13px">
                          {{ farmer.phone }}
                        </span>
                      </el-option>
                    </el-select>
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item :label="`分配重量(kg)`" :prop="`farmerAllocations.${index}.expectedWeight`">
                    <el-input-number
                      v-model="allocation.expectedWeight"
                      :min="1"
                      :precision="2"
                      style="width: 100%"
                    />
                  </el-form-item>
                </el-col>
              </el-row>

              <el-row :gutter="20">
                <el-col :span="12">
                  <el-form-item :label="`单价(元/kg)`" :prop="`farmerAllocations.${index}.expectedPrice`">
                    <el-input-number
                      v-model="allocation.expectedPrice"
                      :min="0"
                      :precision="2"
                      style="width: 100%"
                    />
                  </el-form-item>
                </el-col>
              </el-row>

              <el-divider content-position="left">农户产地</el-divider>

              <el-row :gutter="20">
                <el-col :span="8">
                  <el-form-item label="省份">
                    <el-select
                      v-model="allocation.farmProvince"
                      placeholder="请选择省份"
                      style="width: 100%"
                      @change="handleFarmProvinceChange(index)"
                    >
                      <el-option
                        v-for="province in farmProvincesList[index] || []"
                        :key="province.code"
                        :label="province.name"
                        :value="province.code"
                      />
                    </el-select>
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item label="城市">
                    <el-select
                      v-model="allocation.farmCity"
                      placeholder="请选择城市"
                      style="width: 100%"
                      :disabled="!allocation.farmProvince"
                      @change="handleFarmCityChange(index)"
                    >
                      <el-option
                        v-for="city in farmCitiesList[index] || []"
                        :key="city.code"
                        :label="city.name"
                        :value="city.code"
                      />
                    </el-select>
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item label="区县">
                    <el-select
                      v-model="allocation.farmDistrict"
                      placeholder="请选择区县"
                      style="width: 100%"
                      :disabled="!allocation.farmCity"
                    >
                      <el-option
                        v-for="district in farmDistrictsList[index] || []"
                        :key="district.code"
                        :label="district.name"
                        :value="district.code"
                      />
                    </el-select>
                  </el-form-item>
                </el-col>
              </el-row>
            </el-card>
          </div>

          <el-row :gutter="20" style="margin-top: 20px">
            <el-col :span="12">
              <el-card>
                <template #header>
                  <span>重量汇总</span>
                </template>
                <div>预计总重量：{{ form.expectedWeight }} kg</div>
                <div>已分配重量：{{ totalAllocatedWeight }} kg</div>
                <div style="margin-top: 8px">
                  <el-progress
                    :percentage="allocatedWeightPercentage"
                    :color="allocatedWeightPercentage === 100 ? '#67c23a' : '#409eff'"
                  />
                </div>
              </el-card>
            </el-col>
            <el-col :span="12">
              <el-card>
                <template #header>
                  <span>金额汇总</span>
                </template>
                <div>预计总金额：¥{{ (form.expectedWeight * form.expectedPrice).toFixed(2) }}</div>
                <div>已分配金额：¥{{ totalAllocatedAmount.toFixed(2) }}</div>
              </el-card>
            </el-col>
          </el-row>
        </div>

        <div v-show="currentStep === 2" class="step-content">
          <el-descriptions title="订单信息" :column="2" border>
            <el-descriptions-item label="产品名称">{{ form.productName }}</el-descriptions-item>
            <el-descriptions-item label="产品类别">{{ form.productCategory }}</el-descriptions-item>
            <el-descriptions-item label="预计重量">{{ form.expectedWeight }} kg</el-descriptions-item>
            <el-descriptions-item label="预计单价">¥{{ form.expectedPrice }} / kg</el-descriptions-item>
            <el-descriptions-item label="预计总金额">
              ¥{{ (form.expectedWeight * form.expectedPrice).toFixed(2) }}
            </el-descriptions-item>
            <el-descriptions-item label="容差率">{{ form.toleranceRate }}%</el-descriptions-item>
            <el-descriptions-item label="是否冷链">
              <el-tag :type="form.hasColdChain ? 'primary' : 'info'">
                {{ form.hasColdChain ? '是' : '否' }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="产地">
              {{ getRegionFullName(form.originProvince, form.originCity, form.originDistrict) }}
            </el-descriptions-item>
            <el-descriptions-item label="目的地" :span="2">
              {{ getRegionFullName(form.destinationProvince, form.destinationCity, form.destinationDistrict) }}
            </el-descriptions-item>
            <el-descriptions-item label="质量标准" :span="2">
              {{ form.qualityStandard || '无' }}
            </el-descriptions-item>
          </el-descriptions>

          <el-divider content-position="left">农户分配</el-divider>

          <el-table :data="form.farmerAllocations" stripe style="width: 100%">
            <el-table-column type="index" label="序号" width="60" />
            <el-table-column label="农户" width="150">
              <template #default="{ row }">
                {{ farmers.find(f => f.id === row.farmerId)?.realName || '未选择' }}
              </template>
            </el-table-column>
            <el-table-column prop="expectedWeight" label="重量(kg)" width="120" />
            <el-table-column prop="expectedPrice" label="单价(元/kg)" width="120" />
            <el-table-column label="金额(元)" width="120">
              <template #default="{ row }">
                ¥{{ (row.expectedWeight * row.expectedPrice).toFixed(2) }}
              </template>
            </el-table-column>
            <el-table-column label="产地">
              <template #default="{ row }">
                {{ getRegionFullName(row.farmProvince, row.farmCity, row.farmDistrict) }}
              </template>
            </el-table-column>
          </el-table>
        </div>

        <div class="form-actions">
          <el-button v-if="currentStep > 0" @click="prevStep">上一步</el-button>
          <el-button v-if="currentStep < 2" type="primary" @click="nextStep">下一步</el-button>
          <el-button v-if="currentStep === 2" type="primary" :loading="submitting" @click="submitOrder">
            提交订单
          </el-button>
        </div>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, markRaw } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { orderApi } from '@/api/order'
import mockData from '@/utils/mock-data'
import regionData from '@/utils/region-data'
import type { User } from '@/types'

const router = useRouter()
const formRef = ref<FormInstance>()
const currentStep = ref(0)
const submitting = ref(false)
const farmers = ref<User[]>([])

type RegionOption = { code: string; name: string }

const originProvinces = computed<RegionOption[]>(() => regionData.getProvinces())
const originCities = computed<RegionOption[]>(() => {
  if (!form.originProvince) return []
  return regionData.getCities(form.originProvince)
})
const originDistricts = computed<RegionOption[]>(() => {
  if (!form.originProvince || !form.originCity) return []
  return regionData.getDistricts(form.originProvince, form.originCity)
})

const destProvinces = computed<RegionOption[]>(() => regionData.getProvinces())
const destCities = computed<RegionOption[]>(() => {
  if (!form.destinationProvince) return []
  return regionData.getCities(form.destinationProvince)
})
const destDistricts = computed<RegionOption[]>(() => {
  if (!form.destinationProvince || !form.destinationCity) return []
  return regionData.getDistricts(form.destinationProvince, form.destinationCity)
})

const farmProvincesList = ref<RegionOption[][]>([])
const farmCitiesList = ref<RegionOption[][]>([])
const farmDistrictsList = ref<RegionOption[][]>([])

type FarmerAllocation = {
  farmerId: string
  expectedWeight: number
  expectedPrice: number
  farmProvince: string
  farmCity: string
  farmDistrict: string
  farmDetail?: string
}

const form = reactive({
  productName: '',
  productCategory: '',
  expectedWeight: 1000,
  expectedPrice: 8,
  toleranceRate: 5,
  hasColdChain: false,
  originProvince: '',
  originCity: '',
  originDistrict: '',
  originDetail: '',
  destinationProvince: '',
  destinationCity: '',
  destinationDistrict: '',
  destinationDetail: '',
  expectedPickupDate: undefined as Date | undefined,
  expectedDeliveryDate: undefined as Date | undefined,
  qualityStandard: '',
  remark: '',
  farmerAllocations: [] as FarmerAllocation[],
})

const rules: FormRules = {
  productName: [{ required: true, message: '请输入产品名称', trigger: 'blur' }],
  productCategory: [{ required: true, message: '请选择产品类别', trigger: 'change' }],
  expectedWeight: [{ required: true, message: '请输入预计重量', trigger: 'blur' }],
  expectedPrice: [{ required: true, message: '请输入预计单价', trigger: 'blur' }],
  originProvince: [
    { required: true, message: '请选择产地省份', trigger: 'change' },
    { validator: validateProvince, trigger: 'change' },
  ],
  originCity: [
    { required: true, message: '请选择产地城市', trigger: 'change' },
    { validator: validateCity, trigger: 'change' },
  ],
  originDistrict: [
    { required: true, message: '请选择产地区县', trigger: 'change' },
    { validator: validateDistrict, trigger: 'change' },
  ],
  destinationProvince: [
    { required: true, message: '请选择目的地省份', trigger: 'change' },
    { validator: validateDestProvince, trigger: 'change' },
  ],
  destinationCity: [
    { required: true, message: '请选择目的地城市', trigger: 'change' },
    { validator: validateDestCity, trigger: 'change' },
  ],
  destinationDistrict: [
    { required: true, message: '请选择目的地区县', trigger: 'change' },
    { validator: validateDestDistrict, trigger: 'change' },
  ],
}

function validateProvince(rule: unknown, value: string, callback: (error?: Error) => void) {
  if (value && !regionData.getProvinceName(value)) {
    callback(new Error('请选择有效的省份'))
  } else {
    callback()
  }
}

function validateCity(rule: unknown, value: string, callback: (error?: Error) => void) {
  if (value && form.originProvince && !regionData.getCityName(form.originProvince, value)) {
    callback(new Error('请选择有效的城市'))
  } else {
    callback()
  }
}

function validateDistrict(rule: unknown, value: string, callback: (error?: Error) => void) {
  if (value && form.originProvince && form.originCity && !regionData.getDistrictName(form.originProvince, form.originCity, value)) {
    callback(new Error('请选择有效的区县'))
  } else {
    callback()
  }
}

function validateDestProvince(rule: unknown, value: string, callback: (error?: Error) => void) {
  if (value && !regionData.getProvinceName(value)) {
    callback(new Error('请选择有效的省份'))
  } else {
    callback()
  }
}

function validateDestCity(rule: unknown, value: string, callback: (error?: Error) => void) {
  if (value && form.destinationProvince && !regionData.getCityName(form.destinationProvince, value)) {
    callback(new Error('请选择有效的城市'))
  } else {
    callback()
  }
}

function validateDestDistrict(rule: unknown, value: string, callback: (error?: Error) => void) {
  if (value && form.destinationProvince && form.destinationCity && !regionData.getDistrictName(form.destinationProvince, form.destinationCity, value)) {
    callback(new Error('请选择有效的区县'))
  } else {
    callback()
  }
}

const totalAllocatedWeight = computed(() =>
  form.farmerAllocations.reduce((sum, a) => sum + a.expectedWeight, 0)
)

const totalAllocatedAmount = computed(() =>
  form.farmerAllocations.reduce((sum, a) => sum + a.expectedWeight * a.expectedPrice, 0)
)

const allocatedWeightPercentage = computed(() => {
  if (form.expectedWeight === 0) return 0
  return Math.round((totalAllocatedWeight.value / form.expectedWeight) * 100)
})

function handleOriginProvinceChange() {
  form.originCity = ''
  form.originDistrict = ''
}

function handleOriginCityChange() {
  form.originDistrict = ''
}

function handleDestProvinceChange() {
  form.destinationCity = ''
  form.destinationDistrict = ''
}

function handleDestCityChange() {
  form.destinationDistrict = ''
}

function initFarmRegionLists(index: number) {
  if (!farmProvincesList.value[index]) {
    farmProvincesList.value[index] = markRaw(regionData.getProvinces())
  }
  if (!farmCitiesList.value[index]) {
    farmCitiesList.value[index] = []
  }
  if (!farmDistrictsList.value[index]) {
    farmDistrictsList.value[index] = []
  }
}

function updateFarmCities(index: number, provinceCode: string) {
  initFarmRegionLists(index)
  farmCitiesList.value[index] = markRaw(regionData.getCities(provinceCode))
}

function updateFarmDistricts(index: number, provinceCode: string, cityCode: string) {
  initFarmRegionLists(index)
  farmDistrictsList.value[index] = markRaw(regionData.getDistricts(provinceCode, cityCode))
}

function handleFarmProvinceChange(index: number) {
  const allocation = form.farmerAllocations[index]
  if (allocation) {
    allocation.farmCity = ''
    allocation.farmDistrict = ''
    if (allocation.farmProvince) {
      updateFarmCities(index, allocation.farmProvince)
    } else {
      initFarmRegionLists(index)
      farmCitiesList.value[index] = []
    }
    farmDistrictsList.value[index] = []
  }
}

function handleFarmCityChange(index: number) {
  const allocation = form.farmerAllocations[index]
  if (allocation) {
    allocation.farmDistrict = ''
    if (allocation.farmProvince && allocation.farmCity) {
      updateFarmDistricts(index, allocation.farmProvince, allocation.farmCity)
    } else {
      farmDistrictsList.value[index] = []
    }
  }
}

function getRegionFullName(provinceCode: string, cityCode: string, districtCode: string): string {
  const provinceName = regionData.getProvinceName(provinceCode)
  const cityName = regionData.getCityName(provinceCode, cityCode)
  const districtName = regionData.getDistrictName(provinceCode, cityCode, districtCode)
  
  const parts: string[] = []
  if (provinceName) parts.push(provinceName)
  if (cityName && cityName !== provinceName) parts.push(cityName)
  if (districtName) parts.push(districtName)
  
  return parts.join(' ') || '未选择'
}

function loadFarmers() {
  farmers.value = mockData.getMockFarmers()
}

function addFarmerAllocation() {
  const newIndex = form.farmerAllocations.length
  
  form.farmerAllocations.push({
    farmerId: '',
    expectedWeight: form.expectedWeight / Math.max(1, form.farmerAllocations.length + 1),
    expectedPrice: form.expectedPrice,
    farmProvince: form.originProvince || '',
    farmCity: '',
    farmDistrict: '',
  })
  
  initFarmRegionLists(newIndex)
  
  if (form.originProvince) {
    updateFarmCities(newIndex, form.originProvince)
  }
}

function removeFarmerAllocation(index: number) {
  form.farmerAllocations.splice(index, 1)
  farmProvincesList.value.splice(index, 1)
  farmCitiesList.value.splice(index, 1)
  farmDistrictsList.value.splice(index, 1)
}

const validateStep0 = async (): Promise<boolean> => {
  if (!formRef.value) return false
  try {
    await formRef.value.validate()
    return true
  } catch {
    return false
  }
}

const validateStep1 = (): boolean => {
  if (form.farmerAllocations.length === 0) {
    ElMessage.warning('请至少添加一个农户分配')
    return false
  }

  for (let i = 0; i < form.farmerAllocations.length; i++) {
    const allocation = form.farmerAllocations[i]
    if (!allocation.farmerId) {
      ElMessage.warning(`请选择农户分配 ${i + 1} 的农户`)
      return false
    }
    if (allocation.expectedWeight <= 0) {
      ElMessage.warning(`农户分配 ${i + 1} 的重量必须大于 0`)
      return false
    }
    if (allocation.expectedPrice <= 0) {
      ElMessage.warning(`农户分配 ${i + 1} 的单价必须大于 0`)
      return false
    }
    if (!allocation.farmProvince) {
      ElMessage.warning(`请选择农户分配 ${i + 1} 的省份`)
      return false
    }
    if (!regionData.getProvinceName(allocation.farmProvince)) {
      ElMessage.warning(`农户分配 ${i + 1} 的省份无效`)
      return false
    }
    if (!allocation.farmCity) {
      ElMessage.warning(`请选择农户分配 ${i + 1} 的城市`)
      return false
    }
    if (!regionData.getCityName(allocation.farmProvince, allocation.farmCity)) {
      ElMessage.warning(`农户分配 ${i + 1} 的城市无效`)
      return false
    }
    if (!allocation.farmDistrict) {
      ElMessage.warning(`请选择农户分配 ${i + 1} 的区县`)
      return false
    }
    if (!regionData.getDistrictName(allocation.farmProvince, allocation.farmCity, allocation.farmDistrict)) {
      ElMessage.warning(`农户分配 ${i + 1} 的区县无效`)
      return false
    }
  }

  if (totalAllocatedWeight.value !== form.expectedWeight) {
    ElMessage.warning(`分配的总重量 (${totalAllocatedWeight.value}kg) 必须等于预计重量 (${form.expectedWeight}kg)`)
    return false
  }

  return true
}

const nextStep = async () => {
  if (currentStep.value === 0) {
    const valid = await validateStep0()
    if (!valid) return
  } else if (currentStep.value === 1) {
    const valid = validateStep1()
    if (!valid) return
  }
  currentStep.value++
}

const prevStep = () => {
  currentStep.value--
}

const submitOrder = async () => {
  submitting.value = true
  try {
    const orderData = {
      productName: form.productName,
      productCategory: form.productCategory,
      expectedWeight: form.expectedWeight,
      expectedPrice: form.expectedPrice,
      originProvince: regionData.getProvinceName(form.originProvince),
      originCity: regionData.getCityName(form.originProvince, form.originCity),
      originDistrict: regionData.getDistrictName(form.originProvince, form.originCity, form.originDistrict),
      originDetail: form.originDetail,
      destinationProvince: regionData.getProvinceName(form.destinationProvince),
      destinationCity: regionData.getCityName(form.destinationProvince, form.destinationCity),
      destinationDistrict: regionData.getDistrictName(form.destinationProvince, form.destinationCity, form.destinationDistrict),
      destinationDetail: form.destinationDetail,
      expectedPickupDate: form.expectedPickupDate?.toISOString(),
      expectedDeliveryDate: form.expectedDeliveryDate?.toISOString(),
      toleranceRate: form.toleranceRate / 100,
      hasColdChain: form.hasColdChain,
      qualityStandard: form.qualityStandard,
      remark: form.remark,
      farmerAllocations: form.farmerAllocations.map(a => ({
        farmerId: a.farmerId,
        expectedWeight: a.expectedWeight,
        expectedPrice: a.expectedPrice,
        farmProvince: regionData.getProvinceName(a.farmProvince),
        farmCity: regionData.getCityName(a.farmProvince, a.farmCity),
        farmDistrict: regionData.getDistrictName(a.farmProvince, a.farmCity, a.farmDistrict),
        farmDetail: a.farmDetail,
      })),
    }

    const order = await orderApi.create(orderData)
    ElMessage.success('订单创建成功')
    router.push(`/orders/${order.id}`)
  } catch (error) {
    console.error('Failed to create order:', error)
    ElMessage.error('订单创建失败')
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  loadFarmers()
})
</script>

<style lang="scss" scoped>
.order-create {
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .step-content {
    padding: 20px 0;
  }

  .allocation-card {
    margin-bottom: 20px;

    .allocation-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
  }

  .form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    margin-top: 30px;
    padding-top: 20px;
    border-top: 1px solid #eee;
  }
}
</style>