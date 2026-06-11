<template>
  <div class="page-container">
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-gray-900 mb-2">上门测量预约</h1>
      <p class="text-gray-500">免费专业测量，定制最佳包装运输方案</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div class="lg:col-span-2 space-y-8">
        <div class="card-base p-8">
          <h2 class="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <component :is="icons.UserCircle" class="w-5 h-5 text-brand-500" />
            预约信息
          </h2>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label class="label-base">联系人姓名 <span class="text-red-500">*</span></label>
              <input v-model="form.contactName" class="input-base" placeholder="请输入姓名" />
            </div>
            <div>
              <label class="label-base">联系电话 <span class="text-red-500">*</span></label>
              <input v-model="form.contactPhone" class="input-base" placeholder="请输入手机号" />
            </div>
            <div class="md:col-span-2">
              <label class="label-base">详细地址 <span class="text-red-500">*</span></label>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                <el-select v-model="form.province" class="input-base !p-0" placeholder="省份">
                  <el-option label="广东省" value="广东省" />
                  <el-option label="北京市" value="北京市" />
                  <el-option label="上海市" value="上海市" />
                  <el-option label="江苏省" value="江苏省" />
                  <el-option label="浙江省" value="浙江省" />
                </el-select>
                <el-select v-model="form.city" class="input-base !p-0" placeholder="城市">
                  <el-option label="深圳市" value="深圳市" />
                  <el-option label="广州市" value="广州市" />
                  <el-option label="东莞市" value="东莞市" />
                </el-select>
                <el-select v-model="form.district" class="input-base !p-0" placeholder="区县">
                  <el-option label="南山区" value="南山区" />
                  <el-option label="福田区" value="福田区" />
                  <el-option label="宝安区" value="宝安区" />
                </el-select>
              </div>
              <input v-model="form.detail" class="input-base" placeholder="街道、门牌号、楼层等详细信息" />
            </div>
            <div class="md:col-span-2">
              <label class="label-base">期望测量时间段 <span class="text-red-500">*</span></label>
              <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div
                  v-for="slot in timeSlots"
                  :key="slot"
                  class="p-3 border rounded-lg text-center cursor-pointer transition-all text-sm"
                  :class="form.timeSlot === slot ? 'border-brand-500 bg-brand-50 text-brand-600 font-medium' : 'border-gray-200 hover:border-gray-300 text-gray-600'"
                  @click="form.timeSlot = slot"
                >
                  {{ slot }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="card-base p-8">
          <h2 class="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <component :is="icons.MapPinned" class="w-5 h-5 text-brand-500" />
            GPS 定位
          </h2>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div class="label-base">当前位置</div>
              <div class="h-48 bg-gradient-to-br from-brand-50 to-brand-100 rounded-xl flex flex-col items-center justify-center border-2 border-dashed border-brand-200 relative overflow-hidden">
                <div class="absolute inset-0 opacity-20">
                  <div class="absolute top-4 left-8 w-16 h-1 bg-gray-400 rounded"></div>
                  <div class="absolute top-8 left-4 w-24 h-1 bg-gray-400 rounded"></div>
                  <div class="absolute top-16 left-16 w-20 h-1 bg-gray-400 rounded"></div>
                  <div class="absolute top-24 left-4 w-32 h-1 bg-gray-400 rounded"></div>
                  <div class="absolute top-12 right-8 w-16 h-1 bg-gray-400 rounded"></div>
                </div>
                <div v-if="!location.latitude" class="text-center relative z-10">
                  <component :is="icons.MapPin" class="w-10 h-10 text-brand-400 mx-auto mb-2" />
                  <div class="text-sm text-gray-500 mb-3">尚未获取位置信息</div>
                  <button class="btn-primary text-sm py-1.5 px-4" @click="getLocation">
                    <component :is="icons.Crosshair" class="w-4 h-4 mr-1" />
                    浏览器定位
                  </button>
                </div>
                <div v-else class="text-center relative z-10">
                  <div class="relative inline-block">
                    <div class="w-12 h-12 rounded-full bg-brand-500/20 flex items-center justify-center animate-pulse-red">
                      <component :is="icons.MapPin" class="w-6 h-6 text-brand-600" />
                    </div>
                  </div>
                  <div class="mt-2 text-sm font-medium text-gray-900">已获取位置</div>
                </div>
              </div>
            </div>
            <div class="space-y-4">
              <div>
                <label class="label-base">纬度</label>
                <input v-model.number="location.latitude" type="number" class="input-base" placeholder="自动填充或手动输入" step="0.000001" />
              </div>
              <div>
                <label class="label-base">经度</label>
                <input v-model.number="location.longitude" type="number" class="input-base" placeholder="自动填充或手动输入" step="0.000001" />
              </div>
              <div class="p-4 bg-bg-50 rounded-xl">
                <div class="text-xs text-gray-500 mb-1">定位提示</div>
                <div class="text-sm text-gray-700">
                  点击"浏览器定位"按钮自动获取当前位置，或手动输入经纬度。精确位置有助于测量工程师快速找到您的地址。
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="card-base p-8">
          <h2 class="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <component :is="icons.ImagePlus" class="w-5 h-5 text-brand-500" />
            货物照片上传
            <span class="text-xs text-gray-400 font-normal">(可选)</span>
          </h2>

          <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            <div
              v-for="(photo, idx) in photos"
              :key="idx"
              class="relative aspect-square rounded-xl overflow-hidden border border-gray-200 group"
            >
              <div class="w-full h-full bg-gradient-to-br from-brand-100 to-brand-200 flex items-center justify-center">
                <component :is="icons.Image" class="w-10 h-10 text-brand-400" />
              </div>
              <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button class="p-2 bg-white rounded-lg text-gray-700 hover:text-red-500 transition-colors" @click="removePhoto(idx)">
                  <component :is="icons.Trash2" class="w-4 h-4" />
                </button>
              </div>
              <div class="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/60 rounded text-xs text-white">
                {{ (Math.random() * 3 + 0.5).toFixed(1) }}MB
              </div>
            </div>

            <div
              v-if="photos.length < 8"
              class="aspect-square rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-brand-400 hover:bg-brand-50 transition-all"
              @click="addPhoto"
            >
              <component :is="icons.Upload" class="w-8 h-8 text-gray-400 mb-2" />
              <span class="text-xs text-gray-500">点击上传</span>
              <span class="text-xs text-gray-400 mt-1">支持 JPG/PNG</span>
            </div>
          </div>

          <div class="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-100 flex items-start gap-2">
            <component :is="icons.Lightbulb" class="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div class="text-xs text-yellow-700">
              建议拍摄货物整体外观、特殊部位、铭牌信息等，系统将自动压缩至2MB以内，最多上传8张照片。
            </div>
          </div>
        </div>

        <div class="card-base p-8">
          <h2 class="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <component :is="icons.FileText" class="w-5 h-5 text-brand-500" />
            货物描述
            <span class="text-xs text-gray-400 font-normal">(可选)</span>
          </h2>

          <div class="space-y-4">
            <div>
              <label class="label-base">货物类型</label>
              <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div
                  v-for="type in cargoTypes"
                  :key="type"
                  class="p-3 border rounded-lg text-center cursor-pointer transition-all text-sm"
                  :class="form.cargoType === type ? 'border-brand-500 bg-brand-50 text-brand-600 font-medium' : 'border-gray-200 hover:border-gray-300 text-gray-600'"
                  @click="form.cargoType = type"
                >
                  {{ type }}
                </div>
              </div>
            </div>
            <div>
              <label class="label-base">预估尺寸</label>
              <div class="grid grid-cols-3 gap-3">
                <div>
                  <input v-model.number="form.estLength" type="number" class="input-base" placeholder="长 cm" />
                </div>
                <div>
                  <input v-model.number="form.estWidth" type="number" class="input-base" placeholder="宽 cm" />
                </div>
                <div>
                  <input v-model.number="form.estHeight" type="number" class="input-base" placeholder="高 cm" />
                </div>
              </div>
            </div>
            <div>
              <label class="label-base">特殊需求</label>
              <textarea v-model="form.description" class="input-base h-32 resize-none" placeholder="请描述货物情况，如：是否需要吊装、是否有易碎部位、是否需要温控等"></textarea>
            </div>
          </div>
        </div>
      </div>

      <div class="lg:col-span-1">
        <div class="sticky top-24 space-y-6">
          <div class="card-base p-6">
            <h3 class="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <component :is="icons.ClipboardList" class="w-5 h-5 text-brand-500" />
              预约须知
            </h3>
            <ul class="space-y-3 text-sm text-gray-600">
              <li class="flex items-start gap-2">
                <div class="w-5 h-5 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center text-xs font-semibold flex-shrink-0 mt-0.5">1</div>
                <span>免费上门测量服务限市区范围内，偏远地区请提前咨询</span>
              </li>
              <li class="flex items-start gap-2">
                <div class="w-5 h-5 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center text-xs font-semibold flex-shrink-0 mt-0.5">2</div>
                <span>测量工程师将在预约时间前30分钟电话确认</span>
              </li>
              <li class="flex items-start gap-2">
                <div class="w-5 h-5 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center text-xs font-semibold flex-shrink-0 mt-0.5">3</div>
                <span>测量完成后24小时内提供包装运输方案及报价</span>
              </li>
              <li class="flex items-start gap-2">
                <div class="w-5 h-5 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center text-xs font-semibold flex-shrink-0 mt-0.5">4</div>
                <span>请确保测量现场货物已就位，便于准确测量</span>
              </li>
            </ul>
          </div>

          <div class="card-base p-6">
            <h3 class="font-semibold text-gray-900 mb-4">预约信息预览</h3>
            <div class="space-y-3 text-sm">
              <div class="flex justify-between">
                <span class="text-gray-500">联系人</span>
                <span class="text-gray-900">{{ form.contactName || '-' }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-500">联系电话</span>
                <span class="text-gray-900">{{ form.contactPhone || '-' }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-500">测量时间</span>
                <span class="text-gray-900">{{ form.timeSlot || '-' }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-500">照片数量</span>
                <span class="text-gray-900">{{ photos.length }} 张</span>
              </div>
            </div>
            <div class="mt-6 space-y-3">
              <button class="btn-primary w-full justify-center" @click="submitAppointment">
                <component :is="icons.Send" class="w-4 h-4 mr-1" />
                提交预约工单
              </button>
              <button class="btn-ghost w-full justify-center text-gray-500">
                客服热线：95353
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import {
  UserCircle, MapPinned, MapPin, Crosshair, ImagePlus, Image, Upload,
  Trash2, Lightbulb, FileText, ClipboardList, Send
} from 'lucide-vue-next'

const icons = {
  UserCircle, MapPinned, MapPin, Crosshair, ImagePlus, Image, Upload,
  Trash2, Lightbulb, FileText, ClipboardList, Send
}

const timeSlots = [
  '明天 上午',
  '明天 下午',
  '后天 上午',
  '后天 下午'
]

const cargoTypes = [
  '机械设备',
  '精密仪器',
  '家具家电',
  '其他货物'
]

const form = reactive({
  contactName: '张伟',
  contactPhone: '138****6688',
  province: '广东省',
  city: '深圳市',
  district: '南山区',
  detail: '科技园南区深南大道10000号德邦物流中心',
  timeSlot: '明天 上午',
  cargoType: '',
  estLength: null as number | null,
  estWidth: null as number | null,
  estHeight: null as number | null,
  description: ''
})

const location = reactive({
  latitude: null as number | null,
  longitude: null as number | null
})

const photos = ref<string[]>(['photo1', 'photo2', 'photo3'])

function getLocation() {
  if (!navigator.geolocation) {
    ElMessage.warning('当前浏览器不支持定位功能，请手动输入经纬度')
    location.latitude = 22.5431
    location.longitude = 113.9545
    return
  }
  ElMessage.info('正在获取位置...')
  setTimeout(() => {
    location.latitude = 22.5431
    location.longitude = 113.9545
    ElMessage.success('位置获取成功')
  }, 1500)
}

function addPhoto() {
  if (photos.value.length < 8) {
    photos.value.push('photo' + (photos.value.length + 1))
    ElMessage.success('照片已上传')
  }
}

function removePhoto(index: number) {
  photos.value.splice(index, 1)
}

function submitAppointment() {
  if (!form.contactName || !form.contactPhone || !form.detail || !form.timeSlot) {
    ElMessage.warning('请填写完整的预约信息')
    return
  }
  ElMessage.success('预约提交成功！工单编号：AP' + Date.now())
}
</script>
