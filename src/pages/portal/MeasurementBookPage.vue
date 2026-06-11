<template>
  <div class="page-container">
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-gray-900 mb-2">上门测量预约</h1>
      <p class="text-gray-500">免费专业测量，定制最佳包装运输方案</p>
    </div>

    <template v-if="!orderSubmitted">
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
                  <div v-if="locating" class="text-center relative z-10">
                    <component :is="icons.Loader2" class="w-10 h-10 text-brand-500 mx-auto mb-2 animate-spin" />
                    <div class="text-sm text-brand-600 font-medium">定位中...</div>
                  </div>
                  <div v-else-if="locationError" class="text-center relative z-10">
                    <component :is="icons.MapPin" class="w-10 h-10 text-red-400 mx-auto mb-2" />
                    <div class="text-sm text-red-500 mb-3">{{ locationError }}</div>
                    <button class="btn-primary text-sm py-1.5 px-4" @click="getLocation">
                      <component :is="icons.Crosshair" class="w-4 h-4 mr-1" />
                      重新定位
                    </button>
                  </div>
                  <div v-else-if="!location.latitude" class="text-center relative z-10">
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
                <div>
                  <label class="label-base">定位地址</label>
                  <div class="input-base bg-gray-50 text-gray-700 flex items-center gap-2" :class="{ 'text-gray-400': !locationAddress }">
                    <component :is="icons.MapPin" class="w-4 h-4 flex-shrink-0 text-brand-500" />
                    <span>{{ locationAddress || '定位后自动解析地址' }}</span>
                  </div>
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
                :key="photo.id"
                class="relative aspect-square rounded-xl overflow-hidden border border-gray-200 group"
              >
                <div class="w-full h-full bg-gradient-to-br from-brand-100 to-brand-200 flex flex-col items-center justify-center">
                  <component :is="icons.Image" class="w-8 h-8 text-brand-400" />
                  <div class="text-xs text-brand-500 mt-1 px-2 truncate max-w-full">{{ photo.fileName }}</div>
                </div>
                <div v-if="!photo.uploaded" class="absolute bottom-0 left-0 right-0 bg-white/90 px-3 py-2">
                  <div class="flex items-center justify-between text-xs text-gray-500 mb-1">
                    <span>上传中...</span>
                    <span>{{ photo.progress }}%</span>
                  </div>
                  <div class="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      class="h-full bg-brand-500 rounded-full transition-all duration-300"
                      :style="{ width: photo.progress + '%' }"
                    ></div>
                  </div>
                </div>
                <div v-else class="absolute top-2 right-2 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                  <component :is="icons.Check" class="w-3.5 h-3.5 text-white" />
                </div>
                <div v-if="photo.uploaded" class="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/60 rounded text-xs text-white">
                  {{ photo.fileSize }}
                </div>
                <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button class="p-2 bg-white rounded-lg text-gray-700 hover:text-red-500 transition-colors" @click="removePhoto(idx)">
                    <component :is="icons.Trash2" class="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div
                v-if="photos.length < 8"
                class="aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all"
                :class="dragOver ? 'border-brand-500 bg-brand-50 scale-[1.02]' : 'border-gray-300 hover:border-brand-400 hover:bg-brand-50'"
                @click="addPhoto"
                @dragenter.prevent="dragOver = true"
                @dragover.prevent="dragOver = true"
                @dragleave.prevent="dragOver = false"
                @drop.prevent="handleDrop"
              >
                <component :is="icons.Upload" class="w-8 h-8 text-gray-400 mb-2" :class="{ 'text-brand-500': dragOver }" />
                <span class="text-xs text-gray-500" :class="{ 'text-brand-500': dragOver }">{{ dragOver ? '释放即可上传' : '点击或拖拽上传' }}</span>
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

          <transition name="confirm-slide">
            <div v-if="showConfirm" class="card-base p-8 border-2 border-brand-200">
              <h2 class="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <component :is="icons.ClipboardCheck" class="w-5 h-5 text-brand-500" />
                确认预约信息
              </h2>
              <div class="bg-brand-50 rounded-xl p-4 mb-6">
                <div class="text-sm text-brand-600 mb-1">工单编号</div>
                <div class="text-xl font-bold text-brand-700 font-mono">{{ orderNo }}</div>
              </div>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 text-sm">
                <div class="flex justify-between py-2 border-b border-gray-100">
                  <span class="text-gray-500">联系人</span>
                  <span class="text-gray-900 font-medium">{{ form.contactName }}</span>
                </div>
                <div class="flex justify-between py-2 border-b border-gray-100">
                  <span class="text-gray-500">联系电话</span>
                  <span class="text-gray-900 font-medium">{{ form.contactPhone }}</span>
                </div>
                <div class="flex justify-between py-2 border-b border-gray-100">
                  <span class="text-gray-500">测量时间段</span>
                  <span class="text-gray-900 font-medium">{{ form.timeSlot }}</span>
                </div>
                <div class="flex justify-between py-2 border-b border-gray-100">
                  <span class="text-gray-500">详细地址</span>
                  <span class="text-gray-900 font-medium">{{ fullAddress }}</span>
                </div>
                <div class="flex justify-between py-2 border-b border-gray-100">
                  <span class="text-gray-500">GPS坐标</span>
                  <span class="text-gray-900 font-mono text-xs">{{ location.latitude?.toFixed(6) }}, {{ location.longitude?.toFixed(6) }}</span>
                </div>
                <div class="flex justify-between py-2 border-b border-gray-100">
                  <span class="text-gray-500">定位地址</span>
                  <span class="text-gray-900 font-medium">{{ locationAddress || '未解析' }}</span>
                </div>
                <div class="flex justify-between py-2 border-b border-gray-100">
                  <span class="text-gray-500">照片数量</span>
                  <span class="text-gray-900 font-medium">{{ photos.length }} 张</span>
                </div>
                <div class="flex justify-between py-2 border-b border-gray-100">
                  <span class="text-gray-500">货物类型</span>
                  <span class="text-gray-900 font-medium">{{ form.cargoType || '未选择' }}</span>
                </div>
                <div v-if="form.description" class="md:col-span-2 flex justify-between py-2 border-b border-gray-100">
                  <span class="text-gray-500 flex-shrink-0">特殊需求</span>
                  <span class="text-gray-900 text-right max-w-[70%]">{{ form.description }}</span>
                </div>
              </div>
              <div class="mt-6 flex gap-3 justify-end">
                <button class="btn-secondary" @click="showConfirm = false">
                  <component :is="icons.ArrowLeft" class="w-4 h-4 mr-1" />
                  返回修改
                </button>
                <button class="btn-primary" @click="confirmSubmit">
                  <component :is="icons.Check" class="w-4 h-4 mr-1" />
                  确认提交
                </button>
              </div>
            </div>
          </transition>
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
    </template>

    <template v-else>
      <div class="max-w-2xl mx-auto">
        <div class="card-base p-8">
          <div class="text-center mb-8">
            <div class="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <component :is="icons.CheckCircle" class="w-8 h-8 text-green-500" />
            </div>
            <h2 class="text-2xl font-bold text-gray-900 mb-2">预约提交成功</h2>
            <p class="text-gray-500">测量工程师将尽快与您联系确认</p>
          </div>

          <div class="bg-brand-50 rounded-xl p-5 mb-8 text-center">
            <div class="text-sm text-brand-600 mb-1">工单编号</div>
            <div class="text-2xl font-bold text-brand-700 font-mono">{{ orderNo }}</div>
          </div>

          <div class="mb-8">
            <div class="flex items-center gap-2 mb-4">
              <component :is="icons.Clock" class="w-5 h-5 text-brand-500" />
              <h3 class="font-semibold text-gray-900">工单状态</h3>
              <span class="badge badge-info ml-auto">{{ statusSteps[currentStatus] }}</span>
            </div>
            <div class="relative pl-8">
              <div class="absolute left-3 top-2 bottom-2 w-0.5 bg-gray-200"></div>
              <div
                v-for="(step, idx) in statusSteps"
                :key="step"
                class="relative mb-6 last:mb-0"
              >
                <div
                  class="absolute -left-5 w-4 h-4 rounded-full border-2 flex items-center justify-center"
                  :class="idx <= currentStatus ? 'bg-brand-500 border-brand-500' : 'bg-white border-gray-300'"
                >
                  <component v-if="idx <= currentStatus" :is="icons.Check" class="w-2.5 h-2.5 text-white" />
                </div>
                <div>
                  <div class="text-sm font-medium" :class="idx <= currentStatus ? 'text-gray-900' : 'text-gray-400'">{{ step }}</div>
                  <div v-if="idx <= currentStatus" class="text-xs text-gray-500 mt-0.5">{{ statusTimestamps[idx] }}</div>
                </div>
              </div>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div class="p-4 bg-gray-50 rounded-xl">
              <div class="text-xs text-gray-500 mb-1">预计测量时间</div>
              <div class="text-sm font-medium text-gray-900">{{ form.timeSlot }}</div>
            </div>
            <div class="p-4 bg-gray-50 rounded-xl">
              <div class="text-xs text-gray-500 mb-1">测量工程师</div>
              <div class="text-sm font-medium text-gray-900">李明</div>
              <div class="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                <component :is="icons.Phone" class="w-3 h-3" />
                139****8899
              </div>
            </div>
          </div>

          <button class="btn-secondary w-full justify-center" @click="resetForm">
            <component :is="icons.Plus" class="w-4 h-4 mr-1" />
            返回继续预约
          </button>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import {
  UserCircle, MapPinned, MapPin, Crosshair, ImagePlus, Image, Upload,
  Trash2, Lightbulb, FileText, ClipboardList, Send, Loader2, Check,
  ClipboardCheck, ArrowLeft, CheckCircle, Clock, Phone, Plus
} from 'lucide-vue-next'

const icons = {
  UserCircle, MapPinned, MapPin, Crosshair, ImagePlus, Image, Upload,
  Trash2, Lightbulb, FileText, ClipboardList, Send, Loader2, Check,
  ClipboardCheck, ArrowLeft, CheckCircle, Clock, Phone, Plus
}

interface PhotoItem {
  id: string
  fileName: string
  fileSize: string
  progress: number
  uploaded: boolean
}

const timeSlots = ['明天 上午', '明天 下午', '后天 上午', '后天 下午']
const cargoTypes = ['机械设备', '精密仪器', '家具家电', '其他货物']
const statusSteps = ['待确认', '已派工', '测量中', '已完成']

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
const locating = ref(false)
const locationAddress = ref('')
const locationError = ref('')

const photos = ref<PhotoItem[]>([
  { id: '1', fileName: 'IMG_20260610_001.jpg', fileSize: '1.8MB', progress: 100, uploaded: true },
  { id: '2', fileName: 'IMG_20260610_002.jpg', fileSize: '2.1MB', progress: 100, uploaded: true },
  { id: '3', fileName: 'IMG_20260610_003.jpg', fileSize: '1.2MB', progress: 100, uploaded: true }
])
const dragOver = ref(false)

const showConfirm = ref(false)
const orderNo = ref('')
const orderSubmitted = ref(false)
const currentStatus = ref(0)
const statusTimestamps = ref<string[]>([])

const fullAddress = computed(() => {
  return [form.province, form.city, form.district, form.detail].filter(Boolean).join('')
})

const uploadTimers = new Map<string, ReturnType<typeof setInterval>>()

function generateFileName(): string {
  const now = new Date()
  const dateStr = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0')
  ].join('')
  const seq = String(photos.value.length + 1).padStart(3, '0')
  return `IMG_${dateStr}_${seq}.jpg`
}

function generateFileSize(): string {
  return (Math.random() * 2.5 + 0.5).toFixed(1) + 'MB'
}

function simulateUpload(photo: PhotoItem) {
  const startTime = Date.now()
  const duration = 2000
  const timer = setInterval(() => {
    const elapsed = Date.now() - startTime
    const progress = Math.min(100, Math.round((elapsed / duration) * 100))
    photo.progress = progress
    if (progress >= 100) {
      photo.uploaded = true
      clearInterval(timer)
      uploadTimers.delete(photo.id)
    }
  }, 50)
  uploadTimers.set(photo.id, timer)
}

onUnmounted(() => {
  uploadTimers.forEach(timer => clearInterval(timer))
  uploadTimers.clear()
})

function getLocation() {
  locating.value = true
  locationError.value = ''

  if (!navigator.geolocation) {
    locating.value = false
    locationError.value = '浏览器不支持定位'
    location.latitude = 22.5431
    location.longitude = 113.9545
    resolveAddress()
    return
  }

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      locating.value = false
      location.latitude = pos.coords.latitude
      location.longitude = pos.coords.longitude
      resolveAddress()
    },
    (err) => {
      locating.value = false
      switch (err.code) {
        case err.PERMISSION_DENIED:
          locationError.value = '定位权限被拒绝，请手动输入'
          break
        case err.POSITION_UNAVAILABLE:
          locationError.value = '无法获取位置信息'
          break
        case err.TIMEOUT:
          locationError.value = '定位超时，请重试'
          break
        default:
          locationError.value = '定位失败，请手动输入'
      }
      location.latitude = 22.5431
      location.longitude = 113.9545
      resolveAddress()
    },
    { timeout: 10000, enableHighAccuracy: true }
  )
}

function resolveAddress() {
  setTimeout(() => {
    const districts = [
      '广东省深圳市南山区科技园南区深南大道10000号',
      '广东省深圳市福田区中心区福华三路星河中心',
      '广东省深圳市宝安区新安街道前进一路'
    ]
    locationAddress.value = districts[Math.floor(Math.random() * districts.length)]
    ElMessage.success('地址解析成功')
  }, 800)
}

function addPhoto() {
  if (photos.value.length >= 8) return
  const photo: PhotoItem = {
    id: Date.now().toString(),
    fileName: generateFileName(),
    fileSize: generateFileSize(),
    progress: 0,
    uploaded: false
  }
  photos.value.push(photo)
  simulateUpload(photo)
}

function handleDrop(_e: DragEvent) {
  dragOver.value = false
  addPhoto()
}

function removePhoto(index: number) {
  const photo = photos.value[index]
  if (uploadTimers.has(photo.id)) {
    clearInterval(uploadTimers.get(photo.id)!)
    uploadTimers.delete(photo.id)
  }
  photos.value.splice(index, 1)
}

function submitAppointment() {
  if (!form.contactName || !form.contactPhone || !form.detail || !form.timeSlot) {
    ElMessage.warning('请填写完整的预约信息')
    return
  }
  orderNo.value = 'AP' + Date.now()
  showConfirm.value = true
  window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })
}

function confirmSubmit() {
  orderSubmitted.value = true
  showConfirm.value = false
  currentStatus.value = 0

  const now = new Date()
  statusTimestamps.value = [formatTime(now), '', '', '']

  simulateStatusProgress()
  ElMessage.success('预约提交成功！')
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function simulateStatusProgress() {
  const delays = [5000, 12000, 20000]
  delays.forEach((delay, idx) => {
    setTimeout(() => {
      if (orderSubmitted.value && currentStatus.value === idx) {
        currentStatus.value = idx + 1
        statusTimestamps.value[idx + 1] = formatTime(new Date())
      }
    }, delay)
  })
}

function formatTime(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

function resetForm() {
  orderSubmitted.value = false
  showConfirm.value = false
  currentStatus.value = 0
  statusTimestamps.value = []
  orderNo.value = ''
}
</script>

<style scoped>
.confirm-slide-enter-active,
.confirm-slide-leave-active {
  transition: all 0.4s ease;
  max-height: 800px;
  overflow: hidden;
}
.confirm-slide-enter-from,
.confirm-slide-leave-to {
  max-height: 0;
  opacity: 0;
  padding-top: 0;
  padding-bottom: 0;
  margin-top: 0;
}
</style>
