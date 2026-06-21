<script setup lang="ts">
import { ref, computed, reactive, onMounted } from 'vue'
import {
  BookOpen,
  Landmark,
  Dumbbell,
  Palette,
  FlaskConical,
  Building2,
  Star,
  MapPin,
  Clock,
  Users,
  Calendar,
  User,
  Phone,
  X,
  CheckCircle,
  ChevronRight,
  ArrowLeft,
  Search,
  QrCode,
  Trash2,
  Filter,
  SortAsc,
  Map,
  IdCard,
  Check,
  ArrowRight,
  Info,
} from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import { mockVenues } from '@/mock/data/venues'
import type { Venue } from '@/types'
import { ElMessage, ElMessageBox } from 'element-plus'
import { storage } from '@/utils/storage'

const router = useRouter()
const searchValue = ref('')
const activeType = ref<string>('all')
const activeTab = ref<'list' | 'myBookings'>('list')
const myBookingsTab = ref<'all' | 'booked' | 'cancelled' | 'completed'>('all')
const bookingDialogVisible = ref(false)
const bookingStep = ref(1)
const selectedVenue = ref<Venue | null>(null)
const bookingSuccessVisible = ref(false)
const bookingDetailVisible = ref(false)
const selectedBooking = ref<any>(null)
const sortBy = ref<'default' | 'distance'>('default')

const categoryList = [
  { key: 'all', label: '全部场馆', icon: Building2 },
  { key: 'library', label: '图书馆', icon: BookOpen },
  { key: 'museum', label: '博物馆', icon: Landmark },
  { key: 'gymnasium', label: '体育馆', icon: Dumbbell },
  { key: 'cultural_center', label: '文化馆', icon: Palette },
  { key: 'park', label: '科技馆', icon: FlaskConical },
  { key: 'government_hall', label: '政务大厅', icon: Building2 },
]

const typeIconMap: Record<string, any> = {
  library: BookOpen,
  museum: Landmark,
  gymnasium: Dumbbell,
  park: FlaskConical,
  community_center: Palette,
  cultural_center: Palette,
  government_hall: Building2,
}

const typeGradientMap: Record<string, string> = {
  library: 'from-indigo-500 to-blue-600',
  museum: 'from-amber-500 to-orange-600',
  gymnasium: 'from-emerald-500 to-teal-600',
  park: 'from-green-500 to-emerald-600',
  community_center: 'from-violet-500 to-purple-600',
  cultural_center: 'from-rose-500 to-pink-600',
  government_hall: 'from-sky-500 to-blue-600',
}

interface BookingForm {
  date: string
  timeSlot: string
  people: number
  contactName: string
  contactPhone: string
  idCard: string
  resourceId: string
}

const bookingForm = reactive<BookingForm>({
  date: '',
  timeSlot: '',
  people: 1,
  contactName: '',
  contactPhone: '',
  idCard: '',
  resourceId: '',
})

interface MyBooking {
  id: string
  venueId: string
  venueName: string
  venueType: string
  date: string
  timeSlot: string
  people: number
  contactName: string
  contactPhone: string
  bookingCode: string
  status: 'booked' | 'cancelled' | 'completed'
  createTime: string
  resourceName: string
}

const myBookings = ref<MyBooking[]>([])

const filteredVenues = computed(() => {
  let result = [...mockVenues]
  if (activeType.value !== 'all') {
    result = result.filter((v) => v.type === activeType.value)
  }
  if (searchValue.value.trim()) {
    const keyword = searchValue.value.trim().toLowerCase()
    result = result.filter(
      (v) => v.name.toLowerCase().includes(keyword) || v.address.toLowerCase().includes(keyword)
    )
  }
  return result
})

const filteredMyBookings = computed(() => {
  if (myBookingsTab.value === 'all') return myBookings.value
  return myBookings.value.filter((b) => b.status === myBookingsTab.value)
})

const availableDates = computed(() => {
  const dates: { date: string; weekday: string; available: boolean; full: boolean }[] = []
  const today = new Date()
  for (let i = 0; i < 14; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() + i)
    const weekday = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][d.getDay()]
    const isMonday = d.getDay() === 1
    dates.push({
      date: d.toISOString().split('T')[0],
      weekday,
      available: !isMonday || selectedVenue.value?.type === 'gymnasium',
      full: Math.random() > 0.7,
    })
  }
  return dates
})

const timeSlots = computed(() => {
  if (!selectedVenue.value) return []
  const slots = [
    { time: '09:00-11:00', remaining: Math.floor(Math.random() * 50) + 10, period: '上午' },
    { time: '11:00-13:00', remaining: Math.floor(Math.random() * 30) + 5, period: '上午' },
    { time: '13:00-15:00', remaining: Math.floor(Math.random() * 40) + 15, period: '下午' },
    { time: '15:00-17:00', remaining: Math.floor(Math.random() * 35) + 10, period: '下午' },
    { time: '17:00-19:00', remaining: Math.floor(Math.random() * 20) + 5, period: '晚上' },
    { time: '19:00-21:00', remaining: Math.floor(Math.random() * 15) + 5, period: '晚上' },
  ]
  return slots
})

function openBookingDialog(venue: Venue) {
  selectedVenue.value = venue
  bookingDialogVisible.value = true
  bookingStep.value = 1
  bookingForm.date = ''
  bookingForm.timeSlot = ''
  bookingForm.people = 1
  bookingForm.contactName = ''
  bookingForm.contactPhone = ''
  bookingForm.idCard = ''
  bookingForm.resourceId = ''
}

function nextStep() {
  if (bookingStep.value === 1 && !bookingForm.date) {
    ElMessage.warning('请选择预约日期')
    return
  }
  if (bookingStep.value === 2 && !bookingForm.timeSlot) {
    ElMessage.warning('请选择预约时段')
    return
  }
  if (bookingStep.value === 3) {
    if (!bookingForm.contactName.trim()) {
      ElMessage.warning('请输入联系人姓名')
      return
    }
    if (!bookingForm.contactPhone.trim() || !/^1\d{10}$/.test(bookingForm.contactPhone)) {
      ElMessage.warning('请输入正确的手机号')
      return
    }
    if (!bookingForm.idCard.trim() || bookingForm.idCard.length !== 18) {
      ElMessage.warning('请输入正确的身份证号')
      return
    }
  }
  bookingStep.value++
}

function prevStep() {
  bookingStep.value--
}

function generateBookingCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = 'YY'
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

function submitBooking() {
  const bookingCode = generateBookingCode()
  const newBooking: MyBooking = {
    id: 'bk_' + Date.now(),
    venueId: selectedVenue.value?.id || '',
    venueName: selectedVenue.value?.name || '',
    venueType: selectedVenue.value?.type || '',
    date: bookingForm.date,
    timeSlot: bookingForm.timeSlot,
    people: bookingForm.people,
    contactName: bookingForm.contactName,
    contactPhone: bookingForm.contactPhone,
    bookingCode,
    status: 'booked',
    createTime: new Date().toLocaleString('zh-CN'),
    resourceName: '入馆参观',
  }

  const bookings = storage.get('venue_bookings', []) as MyBooking[]
  bookings.unshift(newBooking)
  storage.set('venue_bookings', bookings)
  myBookings.value = bookings

  bookingDialogVisible.value = false
  bookingSuccessVisible.value = true
  selectedBooking.value = newBooking
}

function viewBookingDetail(booking: MyBooking) {
  selectedBooking.value = booking
  bookingDetailVisible.value = true
}

async function cancelBooking(booking: MyBooking) {
  try {
    await ElMessageBox.confirm('确定要取消这个预约吗？取消后无法恢复。', '取消预约', {
      confirmButtonText: '确定取消',
      cancelButtonText: '再想想',
      type: 'warning',
    })

    const bookings = storage.get('venue_bookings', []) as MyBooking[]
    const index = bookings.findIndex((b) => b.id === booking.id)
    if (index > -1) {
      bookings[index].status = 'cancelled'
      storage.set('venue_bookings', bookings)
      myBookings.value = bookings
    }
    ElMessage.success('预约已取消')
    bookingDetailVisible.value = false
  } catch {
    // 用户取消
  }
}

function getStatusBadge(status: MyBooking['status']) {
  switch (status) {
    case 'booked':
      return { text: '已预约', class: 'tag-primary' }
    case 'cancelled':
      return { text: '已取消', class: 'tag-danger' }
    case 'completed':
      return { text: '已完成', class: 'tag-success' }
  }
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return `${d.getMonth() + 1}月${d.getDate()}日`
}

function goBack() {
  router.push('/tools')
}

onMounted(() => {
  myBookings.value = storage.get('venue_bookings', []) as MyBooking[]
})
</script>

<template>
  <div class="container py-8">
    <button @click="goBack" class="flex items-center gap-2 text-neutral-500 hover:text-gov-blue mb-4 transition-colors">
      <ArrowLeft class="w-4 h-4" />
      <span>返回工具列表</span>
    </button>

    <div class="mb-6">
      <div class="flex items-center gap-3 mb-2">
        <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center">
          <BookOpen class="w-5 h-5 text-white" />
        </div>
        <h1 class="text-2xl font-bold text-neutral-800">场馆预约</h1>
      </div>
      <p class="text-neutral-500 ml-13">预约图书馆、博物馆、体育馆等公共文化场馆</p>
    </div>

    <div class="card mb-6">
      <div class="flex gap-2">
        <button
          @click="activeTab = 'list'"
          :class="[
            'flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all',
            activeTab === 'list'
              ? 'bg-gov-gradient text-white shadow-md'
              : 'bg-neutral-50 text-neutral-600 hover:bg-neutral-100',
          ]"
        >
          <Landmark class="w-4 h-4" />
          场馆列表
        </button>
        <button
          @click="activeTab = 'myBookings'"
          :class="[
            'flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all',
            activeTab === 'myBookings'
              ? 'bg-gov-gradient text-white shadow-md'
              : 'bg-neutral-50 text-neutral-600 hover:bg-neutral-100',
          ]"
        >
          <Calendar class="w-4 h-4" />
          我的预约
          <span v-if="myBookings.filter(b => b.status === 'booked').length > 0" class="text-xs bg-white/20 px-2 py-0.5 rounded-full">
            {{ myBookings.filter(b => b.status === 'booked').length }}
          </span>
        </button>
      </div>
    </div>

    <div v-if="activeTab === 'list'">
      <div class="card mb-6">
        <div class="flex flex-col sm:flex-row gap-4">
          <div class="relative flex-1">
            <Search class="w-5 h-5 text-neutral-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              v-model="searchValue"
              type="text"
              placeholder="搜索场馆名称或地址..."
              class="w-full pl-12 pr-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:border-gov-blue focus:ring-2 focus:ring-gov-blue/20 transition-all"
            />
          </div>
          <div class="flex gap-2">
            <button class="flex items-center gap-2 px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl hover:bg-neutral-100 transition-colors">
              <SortAsc class="w-4 h-4 text-neutral-500" />
              <span class="text-sm text-neutral-600">距离排序</span>
            </button>
            <button class="flex items-center gap-2 px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl hover:bg-neutral-100 transition-colors">
              <Filter class="w-4 h-4 text-neutral-500" />
              <span class="text-sm text-neutral-600">筛选</span>
            </button>
          </div>
        </div>
        <div class="flex flex-wrap gap-2 mt-4">
          <button
            v-for="cat in categoryList"
            :key="cat.key"
            @click="activeType = cat.key"
            :class="[
              'flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-all duration-200',
              activeType === cat.key
                ? 'bg-gov-gradient text-white shadow-md'
                : 'bg-neutral-50 text-neutral-600 hover:bg-neutral-100 hover:text-gov-blue',
            ]"
          >
            <component :is="cat.icon" class="w-4 h-4" />
            {{ cat.label }}
          </button>
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <div
          v-for="venue in filteredVenues"
          :key="venue.id"
          class="card card-hover overflow-hidden group"
        >
          <div class="relative h-40 -mx-6 -mt-6 mb-4 overflow-hidden">
            <div
              :class="[
                'w-full h-full bg-gradient-to-br flex items-center justify-center',
                typeGradientMap[venue.type] || 'from-slate-400 to-slate-600',
              ]"
            >
              <component :is="typeIconMap[venue.type] || Building2" class="w-16 h-16 text-white/80" />
            </div>
            <div
              v-if="!venue.isOpen"
              class="absolute inset-0 bg-black/50 flex items-center justify-center"
            >
              <span class="text-white font-medium">暂未开放</span>
            </div>
            <div class="absolute top-3 right-3 bg-white/90 backdrop-blur px-2.5 py-1 rounded-full flex items-center gap-1">
              <Star class="w-3.5 h-3.5 text-accent-yellow fill-accent-yellow" />
              <span class="text-xs font-medium text-neutral-700">{{ venue.rating }}</span>
            </div>
          </div>
          <h3 class="text-lg font-semibold text-neutral-800 group-hover:text-gov-blue transition-colors mb-2">
            {{ venue.name }}
          </h3>
          <div class="space-y-1.5 mb-4">
            <p class="text-sm text-neutral-500 flex items-center gap-1.5">
              <MapPin class="w-3.5 h-3.5 flex-shrink-0" />
              <span class="truncate">{{ venue.address }}</span>
            </p>
            <p class="text-sm text-neutral-500 flex items-center gap-1.5">
              <Clock class="w-3.5 h-3.5 flex-shrink-0" />
              <span>{{ venue.workHours }}</span>
            </p>
            <p class="text-sm text-neutral-500 flex items-center gap-1.5">
              <Users class="w-3.5 h-3.5 flex-shrink-0" />
              <span>当前 {{ venue.currentOccupancy }}/{{ venue.capacity }} 人</span>
            </p>
          </div>

          <div class="flex items-center justify-between pt-3 border-t border-neutral-100">
            <div>
              <p class="text-xs text-neutral-400">剩余名额</p>
              <p class="text-lg font-bold text-gov-blue">
                {{ venue.resources.reduce((s, r) => s + r.availableCount, 0) || 0 }}
              </p>
            </div>
            <button
              @click="openBookingDialog(venue)"
              :disabled="!venue.isOpen"
              class="px-5 py-2 rounded-xl bg-gov-gradient text-white text-sm font-medium hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-1.5"
            >
              <Calendar class="w-4 h-4" />
              立即预约
              <ChevronRight class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div v-if="filteredVenues.length === 0" class="card text-center py-16">
        <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-neutral-100 flex items-center justify-center">
          <Search class="w-8 h-8 text-neutral-400" />
        </div>
        <p class="text-neutral-500">没有找到匹配的场馆</p>
        <button @click="searchValue = ''; activeType = 'all'" class="mt-4 text-gov-blue hover:underline text-sm">
          查看全部场馆
        </button>
      </div>
    </div>

    <div v-else>
      <div class="card mb-6">
        <div class="flex gap-2">
          <button
            v-for="tab in [
              { key: 'all', label: '全部预约' },
              { key: 'booked', label: '已预约' },
              { key: 'cancelled', label: '已取消' },
              { key: 'completed', label: '已完成' },
            ]"
            :key="tab.key"
            @click="myBookingsTab = tab.key as any"
            :class="[
              'px-4 py-2 rounded-lg text-sm font-medium transition-all',
              myBookingsTab === tab.key
                ? 'bg-gov-blue text-white'
                : 'text-neutral-600 hover:bg-neutral-50',
            ]"
          >
            {{ tab.label }}
          </button>
        </div>
      </div>

      <div v-if="filteredMyBookings.length === 0" class="card text-center py-16">
        <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-neutral-100 flex items-center justify-center">
          <Calendar class="w-8 h-8 text-neutral-400" />
        </div>
        <p class="text-neutral-500">暂无预约记录</p>
        <button @click="activeTab = 'list'" class="mt-4 text-gov-blue hover:underline text-sm">
          去预约场馆
        </button>
      </div>

      <div v-else class="space-y-4">
        <div
          v-for="booking in filteredMyBookings"
          :key="booking.id"
          @click="viewBookingDetail(booking)"
          class="card card-hover cursor-pointer"
        >
          <div class="flex items-start justify-between">
            <div class="flex items-start gap-4">
              <div
                :class="[
                  'w-14 h-14 rounded-xl bg-gradient-to-br flex items-center justify-center flex-shrink-0',
                  typeGradientMap[booking.venueType] || 'from-slate-400 to-slate-600',
                ]"
              >
                <component :is="typeIconMap[booking.venueType] || Building2" class="w-7 h-7 text-white" />
              </div>
              <div>
                <h3 class="font-semibold text-neutral-800 mb-1">{{ booking.venueName }}</h3>
                <div class="space-y-1">
                  <p class="text-sm text-neutral-500 flex items-center gap-1.5">
                    <Calendar class="w-3.5 h-3.5" />
                    {{ booking.date }} {{ booking.timeSlot }}
                  </p>
                  <p class="text-sm text-neutral-500 flex items-center gap-1.5">
                    <Users class="w-3.5 h-3.5" />
                    {{ booking.people }}人 · {{ booking.resourceName }}
                  </p>
                </div>
              </div>
            </div>
            <span :class="['tag', getStatusBadge(booking.status).class]">
              {{ getStatusBadge(booking.status).text }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <el-dialog
      v-model="bookingDialogVisible"
      width="640px"
      :close-on-click-modal="false"
      class="booking-dialog"
    >
      <template #header>
        <div class="flex items-center gap-3 py-2">
          <div
            v-if="selectedVenue"
            :class="[
              'w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center',
              typeGradientMap[selectedVenue.type] || 'from-slate-400 to-slate-600',
            ]"
          >
            <component :is="typeIconMap[selectedVenue?.type || ''] || Building2" class="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 class="text-lg font-semibold text-neutral-800">
              {{ selectedVenue?.name }}
            </h3>
            <p class="text-xs text-neutral-500">预约流程 · 第 {{ bookingStep }}/4 步</p>
          </div>
        </div>
      </template>

      <div class="mb-6">
        <div class="flex items-center justify-between">
          <div
            v-for="(step, index) in ['选择日期', '选择时段', '填写信息', '确认提交']"
            :key="index"
            :class="[
              'flex-1 text-center',
              index < 3 ? 'relative' : '',
            ]"
          >
            <div
              :class="[
                'w-8 h-8 mx-auto rounded-full flex items-center justify-center text-sm font-medium mb-2 transition-all',
                bookingStep > index + 1
                  ? 'bg-accent-green text-white'
                  : bookingStep === index + 1
                  ? 'bg-gov-blue text-white'
                  : 'bg-neutral-100 text-neutral-400',
              ]"
            >
              <Check v-if="bookingStep > index + 1" class="w-4 h-4" />
              <span v-else>{{ index + 1 }}</span>
            </div>
            <p
              :class="[
                'text-xs',
                bookingStep >= index + 1 ? 'text-neutral-700 font-medium' : 'text-neutral-400',
              ]"
            >
              {{ step }}
            </p>
            <div
              v-if="index < 3"
              :class="[
                'absolute top-4 left-1/2 w-full h-0.5 -translate-y-1/2',
                bookingStep > index + 1 ? 'bg-accent-green' : 'bg-neutral-100',
              ]"
            ></div>
          </div>
        </div>
      </div>

      <div v-if="bookingStep === 1" class="space-y-4">
        <h4 class="font-medium text-neutral-800 flex items-center gap-2">
          <Calendar class="w-5 h-5 text-gov-blue" />
          选择预约日期
        </h4>
        <div class="grid grid-cols-7 gap-2">
          <button
            v-for="d in availableDates"
            :key="d.date"
            @click="d.available && !d.full && (bookingForm.date = d.date)"
            :disabled="!d.available || d.full"
            :class="[
              'py-3 rounded-xl text-center transition-all',
              bookingForm.date === d.date
                ? 'bg-gov-gradient text-white shadow-md'
                : d.available && !d.full
                ? 'bg-neutral-50 text-neutral-600 hover:bg-gov-blue/10 hover:text-gov-blue'
                : 'bg-neutral-100 text-neutral-300 cursor-not-allowed',
            ]"
          >
            <p class="text-sm font-medium">{{ formatDate(d.date) }}</p>
            <p class="text-xs mt-1">{{ d.weekday }}</p>
            <p v-if="d.full && d.available" class="text-xs mt-1">已约满</p>
            <p v-if="!d.available" class="text-xs mt-1">闭馆</p>
          </button>
        </div>
        <div class="p-3 bg-gov-blue-50 rounded-xl text-sm text-gov-blue-dark flex items-start gap-2">
          <Info class="w-4 h-4 flex-shrink-0 mt-0.5 text-gov-blue" />
          <span>请选择您要预约的日期，部分场馆周一闭馆。预约成功后请按时前往。</span>
        </div>
      </div>

      <div v-if="bookingStep === 2" class="space-y-4">
        <h4 class="font-medium text-neutral-800 flex items-center gap-2">
          <Clock class="w-5 h-5 text-gov-blue" />
          选择预约时段
        </h4>
        <div class="space-y-4">
          <div v-for="period in ['上午', '下午', '晚上']" :key="period">
            <p class="text-sm text-neutral-500 mb-2">{{ period }}</p>
            <div class="grid grid-cols-3 gap-2">
              <button
                v-for="slot in timeSlots.filter(s => s.period === period)"
                :key="slot.time"
                @click="bookingForm.timeSlot = slot.time"
                :class="[
                  'py-3 rounded-xl text-center transition-all',
                  bookingForm.timeSlot === slot.time
                    ? 'bg-gov-gradient text-white shadow-md'
                    : slot.remaining > 0
                    ? 'bg-neutral-50 text-neutral-600 hover:bg-gov-blue/10 hover:text-gov-blue'
                    : 'bg-neutral-100 text-neutral-300 cursor-not-allowed',
                ]"
              >
                <p class="text-sm font-medium">{{ slot.time }}</p>
                <p class="text-xs mt-1">剩余 {{ slot.remaining }} 名额</p>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div v-if="bookingStep === 3" class="space-y-4">
        <h4 class="font-medium text-neutral-800 flex items-center gap-2">
          <User class="w-5 h-5 text-gov-blue" />
          填写预约信息
        </h4>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-neutral-700 mb-2">
              <User class="w-4 h-4 inline mr-1" />
              联系人姓名
            </label>
            <el-input v-model="bookingForm.contactName" placeholder="请输入真实姓名" />
          </div>
          <div>
            <label class="block text-sm font-medium text-neutral-700 mb-2">
              <Phone class="w-4 h-4 inline mr-1" />
              联系电话
            </label>
            <el-input v-model="bookingForm.contactPhone" placeholder="请输入手机号" maxlength="11" />
          </div>
          <div class="sm:col-span-2">
            <label class="block text-sm font-medium text-neutral-700 mb-2">
              <IdCard class="w-4 h-4 inline mr-1" />
              身份证号
            </label>
            <el-input v-model="bookingForm.idCard" placeholder="请输入身份证号" maxlength="18" />
          </div>
          <div>
            <label class="block text-sm font-medium text-neutral-700 mb-2">
              <Users class="w-4 h-4 inline mr-1" />
              预约人数
            </label>
            <el-input-number v-model="bookingForm.people" :min="1" :max="10" class="w-full" />
          </div>
        </div>
      </div>

      <div v-if="bookingStep === 4" class="space-y-4">
        <h4 class="font-medium text-neutral-800 flex items-center gap-2">
          <CheckCircle class="w-5 h-5 text-gov-blue" />
          确认预约信息
        </h4>
        <div class="bg-neutral-50 rounded-xl p-4 space-y-3">
          <div class="flex items-center justify-between py-2 border-b border-neutral-100">
            <span class="text-neutral-500">场馆名称</span>
            <span class="font-medium text-neutral-800">{{ selectedVenue?.name }}</span>
          </div>
          <div class="flex items-center justify-between py-2 border-b border-neutral-100">
            <span class="text-neutral-500">预约日期</span>
            <span class="font-medium text-neutral-800">{{ bookingForm.date }}</span>
          </div>
          <div class="flex items-center justify-between py-2 border-b border-neutral-100">
            <span class="text-neutral-500">预约时段</span>
            <span class="font-medium text-neutral-800">{{ bookingForm.timeSlot }}</span>
          </div>
          <div class="flex items-center justify-between py-2 border-b border-neutral-100">
            <span class="text-neutral-500">预约人数</span>
            <span class="font-medium text-neutral-800">{{ bookingForm.people }} 人</span>
          </div>
          <div class="flex items-center justify-between py-2 border-b border-neutral-100">
            <span class="text-neutral-500">联系人</span>
            <span class="font-medium text-neutral-800">{{ bookingForm.contactName }}</span>
          </div>
          <div class="flex items-center justify-between py-2">
            <span class="text-neutral-500">联系电话</span>
            <span class="font-medium text-neutral-800">{{ bookingForm.contactPhone }}</span>
          </div>
        </div>
        <div class="p-3 bg-gov-blue-50 rounded-xl text-sm text-gov-blue-dark flex items-start gap-2">
          <CheckCircle class="w-4 h-4 flex-shrink-0 mt-0.5 text-gov-blue" />
          <span>预约成功后，请在预约时间前15分钟到达场馆，凭预约码入内。如需取消请提前2小时。</span>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-between">
          <button
            v-if="bookingStep > 1"
            @click="prevStep"
            class="btn-secondary flex items-center gap-1.5"
          >
            <ArrowLeft class="w-4 h-4" />
            上一步
          </button>
          <div v-else></div>
          <div class="flex gap-3">
            <button @click="bookingDialogVisible = false" class="btn-secondary flex items-center gap-1.5">
              <X class="w-4 h-4" />
              取消
            </button>
            <button
              v-if="bookingStep < 4"
              @click="nextStep"
              class="btn-primary flex items-center gap-1.5"
            >
              下一步
              <ArrowRight class="w-4 h-4" />
            </button>
            <button
              v-else
              @click="submitBooking"
              class="btn-primary flex items-center gap-1.5"
            >
              <CheckCircle class="w-4 h-4" />
              确认预约
            </button>
          </div>
        </div>
      </template>
    </el-dialog>

    <el-dialog
      v-model="bookingSuccessVisible"
      width="480px"
      :close-on-click-modal="false"
    >
      <div class="text-center py-6">
        <div class="w-20 h-20 mx-auto mb-4 rounded-full bg-accent-green/10 flex items-center justify-center">
          <CheckCircle class="w-10 h-10 text-accent-green" />
        </div>
        <h3 class="text-xl font-bold text-neutral-800 mb-2">预约成功！</h3>
        <p class="text-neutral-500 mb-6">请准时前往场馆，凭预约码入场</p>

        <div class="bg-neutral-50 rounded-xl p-4 mb-6">
          <div class="flex items-center justify-center gap-4">
            <div class="w-24 h-24 bg-white rounded-xl flex items-center justify-center border border-neutral-200">
              <QrCode class="w-16 h-16 text-neutral-400" />
            </div>
            <div class="text-left">
              <p class="text-sm text-neutral-500 mb-1">预约码</p>
              <p class="text-2xl font-bold text-gov-blue font-mono">{{ selectedBooking?.bookingCode }}</p>
              <p class="text-xs text-neutral-400 mt-2">{{ selectedBooking?.date }} {{ selectedBooking?.timeSlot }}</p>
            </div>
          </div>
        </div>

        <div class="flex gap-3">
          <button @click="bookingSuccessVisible = false; activeTab = 'myBookings'" class="flex-1 btn-secondary">
            查看我的预约
          </button>
          <button @click="bookingSuccessVisible = false" class="flex-1 btn-primary">
            完成
          </button>
        </div>
      </div>
    </el-dialog>

    <el-dialog
      v-model="bookingDetailVisible"
      width="520px"
      title="预约详情"
    >
      <div v-if="selectedBooking" class="space-y-6">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div
              :class="[
                'w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center',
                typeGradientMap[selectedBooking.venueType] || 'from-slate-400 to-slate-600',
              ]"
            >
              <component :is="typeIconMap[selectedBooking.venueType] || Building2" class="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 class="font-semibold text-neutral-800">{{ selectedBooking.venueName }}</h3>
              <span :class="['tag', getStatusBadge(selectedBooking.status).class]">
                {{ getStatusBadge(selectedBooking.status).text }}
              </span>
            </div>
          </div>
        </div>

        <div class="flex items-center justify-center gap-6 p-4 bg-neutral-50 rounded-xl">
          <div class="w-20 h-20 bg-white rounded-xl flex items-center justify-center border border-neutral-200">
            <QrCode class="w-14 h-14 text-neutral-400" />
          </div>
          <div class="text-left">
            <p class="text-sm text-neutral-500 mb-1">预约码</p>
            <p class="text-xl font-bold text-gov-blue font-mono">{{ selectedBooking.bookingCode }}</p>
          </div>
        </div>

        <div class="space-y-3">
          <div class="flex items-center justify-between py-2 border-b border-neutral-100">
            <span class="text-neutral-500 flex items-center gap-2">
              <Calendar class="w-4 h-4" />
              预约日期
            </span>
            <span class="font-medium text-neutral-800">{{ selectedBooking.date }}</span>
          </div>
          <div class="flex items-center justify-between py-2 border-b border-neutral-100">
            <span class="text-neutral-500 flex items-center gap-2">
              <Clock class="w-4 h-4" />
              入场时段
            </span>
            <span class="font-medium text-neutral-800">{{ selectedBooking.timeSlot }}</span>
          </div>
          <div class="flex items-center justify-between py-2 border-b border-neutral-100">
            <span class="text-neutral-500 flex items-center gap-2">
              <Users class="w-4 h-4" />
              预约人数
            </span>
            <span class="font-medium text-neutral-800">{{ selectedBooking.people }} 人</span>
          </div>
          <div class="flex items-center justify-between py-2 border-b border-neutral-100">
            <span class="text-neutral-500 flex items-center gap-2">
              <User class="w-4 h-4" />
              联系人
            </span>
            <span class="font-medium text-neutral-800">{{ selectedBooking.contactName }}</span>
          </div>
          <div class="flex items-center justify-between py-2 border-b border-neutral-100">
            <span class="text-neutral-500 flex items-center gap-2">
              <Phone class="w-4 h-4" />
              联系电话
            </span>
            <span class="font-medium text-neutral-800">{{ selectedBooking.contactPhone }}</span>
          </div>
          <div class="flex items-center justify-between py-2">
            <span class="text-neutral-500 flex items-center gap-2">
              <Clock class="w-4 h-4" />
              预约时间
            </span>
            <span class="font-medium text-neutral-800">{{ selectedBooking.createTime }}</span>
          </div>
        </div>

        <div v-if="selectedBooking.status === 'booked'" class="flex gap-3">
          <button
            @click="cancelBooking(selectedBooking)"
            class="flex-1 py-3 border border-accent-red text-accent-red rounded-xl font-medium hover:bg-accent-red/5 transition-colors flex items-center justify-center gap-2"
          >
            <Trash2 class="w-4 h-4" />
            取消预约
          </button>
        </div>
      </div>
    </el-dialog>
  </div>
</template>
