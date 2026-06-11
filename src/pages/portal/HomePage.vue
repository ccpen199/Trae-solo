<template>
  <div class="min-h-screen">
    <section class="relative overflow-hidden bg-gradient-to-br from-brand-600 via-brand-500 to-brand-700">
      <div class="absolute inset-0 opacity-10">
        <div class="absolute top-10 left-10 w-72 h-72 bg-white rounded-full blur-3xl"></div>
        <div class="absolute bottom-10 right-10 w-96 h-96 bg-white rounded-full blur-3xl"></div>
      </div>
      <div class="container mx-auto px-4 max-w-7xl py-16 md:py-24 relative z-10">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div class="text-white space-y-6 animate-slide-up">
            <div class="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 rounded-full backdrop-blur-sm border border-white/20">
              <component :is="icons.ShieldCheck" class="w-4 h-4" />
              <span class="text-sm">德邦大件 · 国家AAAAA级物流企业</span>
            </div>
            <h1 class="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
              大件物流<br />
              <span class="text-brand-100">专业之选</span>
            </h1>
            <p class="text-lg md:text-xl text-brand-100 max-w-lg">
              覆盖全国330+城市，专业大件运输方案，精密设备、重型机械、冷链货物一站式服务
            </p>
            <div class="flex flex-wrap gap-4">
              <router-link to="/order/create" class="inline-flex items-center gap-2 px-8 py-3.5 bg-white text-brand-600 font-semibold rounded-lg hover:bg-brand-50 hover:-translate-y-0.5 transition-all duration-200 shadow-lg">
                <component :is="icons.FilePlus" class="w-5 h-5" />
                立即下单
              </router-link>
              <router-link to="/tracking" class="inline-flex items-center gap-2 px-8 py-3.5 bg-white/10 text-white font-semibold rounded-lg border border-white/30 hover:bg-white/20 transition-all duration-200 backdrop-blur-sm">
                <component :is="icons.Search" class="w-5 h-5" />
                运单追踪
              </router-link>
            </div>
            <div class="flex items-center gap-8 pt-4">
              <div>
                <div class="font-din text-3xl font-bold">95353</div>
                <div class="text-sm text-brand-200">全国服务热线</div>
              </div>
              <div class="w-px h-12 bg-white/20"></div>
              <div>
                <div class="font-din text-3xl font-bold">99.6%</div>
                <div class="text-sm text-brand-200">客户好评率</div>
              </div>
            </div>
          </div>
          <div class="hidden lg:block">
            <div class="relative">
              <div class="bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20 shadow-2xl">
                <div class="grid grid-cols-2 gap-4">
                  <div class="bg-white rounded-2xl p-5 shadow-lg">
                    <div class="flex items-center gap-3 mb-3">
                      <div class="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center">
                        <component :is="icons.Package" class="w-5 h-5 text-brand-500" />
                      </div>
                      <span class="font-semibold text-gray-900">精密设备</span>
                    </div>
                    <div class="font-din text-2xl font-bold text-brand-600">1,280<span class="text-sm font-normal text-gray-500"> 单/日</span></div>
                  </div>
                  <div class="bg-white rounded-2xl p-5 shadow-lg">
                    <div class="flex items-center gap-3 mb-3">
                      <div class="w-10 h-10 rounded-xl bg-alert-50 flex items-center justify-center">
                        <component :is="icons.Truck" class="w-5 h-5 text-alert-500" />
                      </div>
                      <span class="font-semibold text-gray-900">在途车辆</span>
                    </div>
                    <div class="font-din text-2xl font-bold text-alert-600">420<span class="text-sm font-normal text-gray-500"> 辆</span></div>
                  </div>
                  <div class="bg-white rounded-2xl p-5 shadow-lg col-span-2">
                    <div class="flex items-center justify-between mb-4">
                      <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
                          <component :is="icons.MapPin" class="w-5 h-5 text-green-500" />
                        </div>
                        <div>
                          <div class="font-semibold text-gray-900">DB2026061100001</div>
                          <div class="text-xs text-gray-500">深圳 → 北京</div>
                        </div>
                      </div>
                      <span class="badge badge-success">运输中</span>
                    </div>
                    <div class="relative">
                      <div class="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div class="h-full bg-gradient-to-r from-brand-500 to-brand-400 rounded-full" style="width: 62%"></div>
                      </div>
                      <div class="flex justify-between mt-2 text-xs text-gray-500">
                        <span>深圳 6/11 08:00</span>
                        <span class="text-brand-600 font-medium">郑州 62%</span>
                        <span>北京 预计6/13</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="py-16 bg-bg-50">
      <div class="container mx-auto px-4 max-w-7xl">
        <div class="text-center mb-12">
          <h2 class="section-title mb-3">一站式服务</h2>
          <p class="text-gray-500">从下单到签收，全程可视化跟踪</p>
        </div>
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <router-link
            v-for="service in services"
            :key="service.path"
            :to="service.path"
            class="card-base p-6 flex flex-col items-center text-center group hover:-translate-y-1"
          >
            <div class="w-14 h-14 rounded-2xl bg-brand-50 flex items-center justify-center mb-4 group-hover:bg-brand-500 transition-colors duration-300">
              <component :is="icons[service.icon]" class="w-7 h-7 text-brand-500 group-hover:text-white transition-colors duration-300" />
            </div>
            <h3 class="font-semibold text-gray-900 mb-1">{{ service.name }}</h3>
            <p class="text-xs text-gray-500">{{ service.desc }}</p>
          </router-link>
        </div>
      </div>
    </section>

    <section class="py-16">
      <div class="container mx-auto px-4 max-w-7xl">
        <div class="card-base p-8">
          <div class="flex items-center gap-3 mb-8">
            <div class="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center">
              <component :is="icons.Calculator" class="w-5 h-5 text-brand-500" />
            </div>
            <div>
              <h2 class="text-xl font-bold text-gray-900">快捷询价</h2>
              <p class="text-sm text-gray-500">输入基础信息，3秒获取预估运费</p>
            </div>
          </div>
          <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div>
              <label class="label-base">起始地</label>
              <input v-model="quoteForm.origin" class="input-base" placeholder="如：广东省深圳市" />
            </div>
            <div>
              <label class="label-base">目的地</label>
              <input v-model="quoteForm.destination" class="input-base" placeholder="如：北京市朝阳区" />
            </div>
            <div>
              <label class="label-base">实际重量 (kg)</label>
              <input v-model.number="quoteForm.weight" type="number" class="input-base" placeholder="请输入重量" min="0" @input="calcQuickQuote" />
            </div>
            <div>
              <label class="label-base">体积 (m³)</label>
              <input v-model.number="quoteForm.volume" type="number" class="input-base" placeholder="长×宽×高" min="0" step="0.01" @input="calcQuickQuote" />
            </div>
          </div>
          <div class="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4 p-6 bg-gradient-to-r from-brand-50 to-alert-50 rounded-xl">
            <div>
              <div class="text-sm text-gray-500 mb-1">计费重量</div>
              <div class="font-din text-2xl font-bold text-gray-900">{{ quickQuote.chargeWeight }} <span class="text-sm font-normal text-gray-500">kg</span></div>
            </div>
            <div>
              <div class="text-sm text-gray-500 mb-1">基础运费</div>
              <div class="font-din text-2xl font-bold text-brand-600">¥{{ quickQuote.baseFreight.toFixed(2) }}</div>
            </div>
            <div>
              <div class="text-sm text-gray-500 mb-1">预估总价</div>
              <div class="font-din text-3xl font-bold text-alert-600">¥{{ quickQuote.total.toFixed(2) }}</div>
            </div>
            <div class="flex items-end">
              <router-link to="/order/create" class="btn-primary w-full justify-center">
                去下单
              </router-link>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="py-16 bg-bg-50">
      <div class="container mx-auto px-4 max-w-7xl">
        <div class="text-center mb-12">
          <h2 class="section-title mb-3">实力见证</h2>
          <p class="text-gray-500">数据说话，值得信赖</p>
        </div>
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-6">
          <div v-for="stat in stats" :key="stat.label" class="stat-card text-center">
            <component :is="icons[stat.icon]" class="w-10 h-10 mx-auto text-brand-500 mb-3" />
            <div class="stat-number">{{ stat.value }}</div>
            <div class="stat-label">{{ stat.label }}</div>
          </div>
        </div>
      </div>
    </section>

    <section class="py-16">
      <div class="container mx-auto px-4 max-w-7xl">
        <div class="text-center mb-12">
          <h2 class="section-title mb-3">成功案例</h2>
          <p class="text-gray-500">千行百业的选择</p>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div v-for="(item, index) in cases" :key="index" class="card-base overflow-hidden group hover:-translate-y-1">
            <div class="h-48 bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center relative overflow-hidden">
              <component :is="icons[item.icon]" class="w-20 h-20 text-white/30 absolute" />
              <div class="relative z-10 text-white text-center">
                <div class="text-5xl font-din font-bold mb-2">{{ index + 1 }}</div>
                <div class="text-sm opacity-80">{{ item.category }}</div>
              </div>
            </div>
            <div class="p-6">
              <h3 class="font-semibold text-gray-900 text-lg mb-2">{{ item.title }}</h3>
              <p class="text-sm text-gray-500 mb-4 line-clamp-2">{{ item.desc }}</p>
              <div class="flex items-center justify-between">
                <div class="flex gap-2">
                  <span v-for="tag in item.tags" :key="tag" class="badge badge-info">{{ tag }}</span>
                </div>
                <span class="text-sm text-brand-600 font-medium">{{ item.date }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  ShieldCheck, FilePlus, Search, Package, Truck, MapPin,
  Calculator, Ruler, Clock, Users, Star, Building2, Boxes, Thermometer, BriefcaseBusiness
} from 'lucide-vue-next'
import { calculateVolumeWeight, calculateChargeWeight } from '@/utils/logistics'

const router = useRouter()

const icons = {
  ShieldCheck, FilePlus, Search, Package, Truck, MapPin,
  Calculator, Ruler, Clock, Users, Star, Building2, Boxes, Thermometer, BriefcaseBusiness
}

const services = [
  { name: '在线下单', desc: '快速创建运单', icon: 'FilePlus', path: '/order/create' },
  { name: '包装报价', desc: '专业包装方案', icon: 'Boxes', path: '/packaging/quote' },
  { name: '上门测量', desc: '免费专业测量', icon: 'Ruler', path: '/measurement/book' },
  { name: '运单追踪', desc: '实时位置监控', icon: 'Search', path: '/tracking' },
  { name: '路由规划', desc: '智能路线优化', icon: 'MapPin', path: '/admin/routing' },
  { name: '理赔服务', desc: '快速定损赔付', icon: 'BriefcaseBusiness', path: '/admin/claims' }
]

const stats = [
  { value: '330+', label: '覆盖城市', icon: 'MapPin' },
  { value: '12,800+', label: '日均单量', icon: 'Package' },
  { value: '420+', label: '在途车辆', icon: 'Truck' },
  { value: '99.6%', label: '客户好评', icon: 'Star' }
]

const cases = [
  {
    title: '华为精密设备跨省运输',
    category: '精密仪器',
    desc: '从深圳到西安的5G基站设备运输，全程温控+防震包装，0破损交付。',
    tags: ['温控运输', '防震包装', '保价'],
    date: '2026-05',
    icon: 'Building2'
  },
  {
    title: '比亚迪大型冲压机搬迁',
    category: '重型机械',
    desc: '38吨大型冲压设备从长沙搬迁至深圳，专项运输方案，3天完成。',
    tags: ['超重货物', '专项路线', '吊装'],
    date: '2026-04',
    icon: 'Truck'
  },
  {
    title: '国药控股冷链物流',
    category: '医药冷链',
    desc: '疫苗及生物制品全国配送，全程2-8℃温控，实时温度监控。',
    tags: ['冷链运输', 'GSP认证', '实时监控'],
    date: '2026-03',
    icon: 'Thermometer'
  }
]

const quoteForm = reactive({
  origin: '广东省深圳市',
  destination: '北京市朝阳区',
  weight: 500,
  volume: 2.5
})

const quickQuote = reactive({
  chargeWeight: 0,
  baseFreight: 0,
  total: 0
})

function calcQuickQuote() {
  const weight = quoteForm.weight || 0
  const volumeWeight = (quoteForm.volume || 0) * 166.67
  const chargeWeight = calculateChargeWeight(weight, volumeWeight)
  quickQuote.chargeWeight = Number(chargeWeight.toFixed(2))
  quickQuote.baseFreight = Number((chargeWeight * 2.5).toFixed(2))
  quickQuote.total = Number((quickQuote.baseFreight * 1.15 + 200).toFixed(2))
}

onMounted(calcQuickQuote)
</script>
