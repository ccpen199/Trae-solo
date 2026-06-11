<template>
  <div class="page-container">
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-gray-900 mb-2">包装报价</h1>
      <p class="text-gray-500">专业定制包装方案，确保大件货物安全运输</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div class="lg:col-span-2 space-y-8">
        <div class="card-base p-8">
          <h2 class="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <component :is="icons.Boxes" class="w-5 h-5 text-brand-500" />
            选择包装类型
          </h2>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div
              v-for="option in packagingOptions"
              :key="option.name"
              class="p-5 border-2 rounded-xl cursor-pointer transition-all hover:-translate-y-0.5"
              :class="selectedType === option.name ? 'border-brand-500 bg-brand-50' : 'border-gray-200 hover:border-gray-300'"
              @click="selectType(option)"
            >
              <div class="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center mb-4">
                <component :is="icons[option.icon]" class="w-6 h-6 text-brand-500" />
              </div>
              <h3 class="font-semibold text-gray-900 mb-1">{{ option.name }}</h3>
              <p class="text-xs text-gray-500 mb-3 line-clamp-2">{{ option.description }}</p>
              <div class="flex items-center justify-between">
                <span class="text-alert-600 font-din font-bold">¥{{ option.baseMaterialPrice }}/{{ option.unit }}</span>
                <div
                  v-if="selectedType === option.name"
                  class="w-6 h-6 rounded-full bg-brand-500 flex items-center justify-center"
                >
                  <component :is="icons.Check" class="w-4 h-4 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-if="selectedOption" class="card-base p-8">
          <h2 class="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <component :is="icons.Settings" class="w-5 h-5 text-brand-500" />
            规格配置 - {{ selectedOption.name }}
          </h2>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <template v-if="selectedOption.type === 'wooden_box'">
              <div>
                <label class="label-base">长度 (cm)</label>
                <input v-model.number="configForm.length" type="number" class="input-base" min="10" step="1" />
              </div>
              <div>
                <label class="label-base">宽度 (cm)</label>
                <input v-model.number="configForm.width" type="number" class="input-base" min="10" step="1" />
              </div>
              <div>
                <label class="label-base">高度 (cm)</label>
                <input v-model.number="configForm.height" type="number" class="input-base" min="10" step="1" />
              </div>
            </template>
            <div>
              <label class="label-base">数量</label>
              <input v-model.number="configForm.quantity" type="number" class="input-base" min="1" step="1" />
            </div>
            <div>
              <label class="label-base">是否熏蒸</label>
              <el-select v-model="configForm.needFumigation" class="input-base !p-0">
                <el-option :label="selectedOption.fumigationFee > 0 ? '需要熏蒸 (+¥' + selectedOption.fumigationFee + '/个)' : '无需熏蒸'" :value="selectedOption.fumigationFee > 0" />
                <el-option label="无需熏蒸" :value="false" />
              </el-select>
            </div>
            <div>
              <label class="label-base">是否加固</label>
              <el-select v-model="configForm.needReinforce" class="input-base !p-0">
                <el-option :label="'需要加固 (+¥' + selectedOption.reinforceFee + '/个)'" :value="true" />
                <el-option label="无需加固" :value="false" />
              </el-select>
            </div>
          </div>

          <div class="mt-6 p-4 bg-bg-50 rounded-xl flex items-center justify-between">
            <div>
              <div class="text-sm text-gray-500">当前规格预估费用</div>
              <div class="font-din text-2xl font-bold text-alert-600">¥{{ previewQuote.subtotal.toFixed(2) }}</div>
            </div>
            <button class="btn-primary" @click="addToQuote">
              <component :is="icons.Plus" class="w-4 h-4 mr-1" />
              加入报价清单
            </button>
          </div>
        </div>

        <div class="card-base p-8">
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <component :is="icons.ScrollText" class="w-5 h-5 text-brand-500" />
              费用明细
            </h2>
            <button
              v-if="quoteList.length > 0"
              class="text-sm text-red-500 hover:text-red-600 flex items-center gap-1"
              @click="clearQuote"
            >
              <component :is="icons.Trash2" class="w-4 h-4" />
              清空
            </button>
          </div>

          <div v-if="quoteList.length === 0" class="text-center py-12 text-gray-400">
            <component :is="icons.FileQuestion" class="w-16 h-16 mx-auto mb-3 opacity-30" />
            <p>暂无包装配置，请先选择包装类型并添加到清单</p>
          </div>

          <div v-else>
            <div class="overflow-x-auto">
              <table class="w-full">
                <thead>
                  <tr class="border-b border-gray-200">
                    <th class="text-left py-3 px-4 text-sm font-medium text-gray-500">包装类型</th>
                    <th class="text-left py-3 px-4 text-sm font-medium text-gray-500">规格</th>
                    <th class="text-right py-3 px-4 text-sm font-medium text-gray-500">数量</th>
                    <th class="text-right py-3 px-4 text-sm font-medium text-gray-500">材料费</th>
                    <th class="text-right py-3 px-4 text-sm font-medium text-gray-500">人工费</th>
                    <th class="text-right py-3 px-4 text-sm font-medium text-gray-500">熏蒸费</th>
                    <th class="text-right py-3 px-4 text-sm font-medium text-gray-500">加固费</th>
                    <th class="text-right py-3 px-4 text-sm font-medium text-gray-500">小计</th>
                    <th class="text-center py-3 px-4 text-sm font-medium text-gray-500">操作</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(item, idx) in quoteList" :key="idx" class="border-b border-gray-100 hover:bg-bg-50">
                    <td class="py-4 px-4">
                      <div class="font-medium text-gray-900 text-sm">{{ item.name }}</div>
                    </td>
                    <td class="py-4 px-4 text-sm text-gray-600">{{ item.specs }}</td>
                    <td class="py-4 px-4 text-right text-sm text-gray-900">{{ item.quantity }}</td>
                    <td class="py-4 px-4 text-right text-sm text-gray-900">¥{{ item.materialCost.toFixed(2) }}</td>
                    <td class="py-4 px-4 text-right text-sm text-gray-900">¥{{ item.laborCost.toFixed(2) }}</td>
                    <td class="py-4 px-4 text-right text-sm text-gray-900">¥{{ item.fumigationCost.toFixed(2) }}</td>
                    <td class="py-4 px-4 text-right text-sm text-gray-900">¥{{ item.reinforceCost.toFixed(2) }}</td>
                    <td class="py-4 px-4 text-right text-sm font-semibold text-alert-600">¥{{ item.subtotal.toFixed(2) }}</td>
                    <td class="py-4 px-4 text-center">
                      <button class="text-red-500 hover:text-red-600" @click="removeItem(idx)">
                        <component :is="icons.Trash2" class="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr class="bg-bg-50">
                    <td colspan="3" class="py-4 px-4 font-semibold text-gray-900">合计</td>
                    <td class="py-4 px-4 text-right text-sm font-semibold text-gray-900">¥{{ totals.materialCost.toFixed(2) }}</td>
                    <td class="py-4 px-4 text-right text-sm font-semibold text-gray-900">¥{{ totals.laborCost.toFixed(2) }}</td>
                    <td class="py-4 px-4 text-right text-sm font-semibold text-gray-900">¥{{ totals.fumigationCost.toFixed(2) }}</td>
                    <td class="py-4 px-4 text-right text-sm font-semibold text-gray-900">¥{{ totals.reinforceCost.toFixed(2) }}</td>
                    <td class="py-4 px-4 text-right font-din text-xl font-bold text-alert-600">¥{{ totals.subtotal.toFixed(2) }}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      </div>

      <div class="lg:col-span-1">
        <div class="sticky top-24">
          <div class="card-base p-6">
            <h3 class="font-semibold text-gray-900 mb-5 flex items-center gap-2">
              <component :is="icons.Calculator" class="w-5 h-5 text-brand-500" />
              报价汇总
            </h3>

            <div class="space-y-4">
              <div class="p-4 bg-gradient-to-br from-brand-500 to-brand-700 rounded-xl text-white">
                <div class="text-brand-100 text-sm mb-1">预估总费用</div>
                <div class="font-din text-4xl font-bold">¥{{ totals.subtotal.toFixed(2) }}</div>
                <div class="text-brand-200 text-xs mt-2">含材料费、人工费、附加费</div>
              </div>

              <div class="space-y-3 text-sm">
                <div class="flex justify-between">
                  <span class="text-gray-500">包装项数</span>
                  <span class="text-gray-900 font-medium">{{ quoteList.length }} 项</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-500">总数量</span>
                  <span class="text-gray-900 font-medium">{{ totals.quantity }} 件</span>
                </div>
              </div>

              <div class="pt-4 border-t border-gray-100 space-y-3">
                <button class="btn-primary w-full justify-center" @click="goOrder">
                  <component :is="icons.FilePlus" class="w-4 h-4 mr-1" />
                  立即下单
                </button>
                <button class="btn-secondary w-full justify-center" @click="contactSales">
                  <component :is="icons.Phone" class="w-4 h-4 mr-1" />
                  联系销售顾问
                </button>
              </div>
            </div>
          </div>

          <div class="card-base p-6 mt-6">
            <h4 class="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <component :is="icons.ShieldCheck" class="w-5 h-5 text-green-500" />
              包装服务保障
            </h4>
            <ul class="space-y-3 text-sm text-gray-600">
              <li class="flex items-start gap-2">
                <component :is="icons.CheckCircle2" class="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>专业包装工程师上门设计方案</span>
              </li>
              <li class="flex items-start gap-2">
                <component :is="icons.CheckCircle2" class="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>所有包装材料符合国际运输标准</span>
              </li>
              <li class="flex items-start gap-2">
                <component :is="icons.CheckCircle2" class="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>IPPC熏蒸认证，出口无忧</span>
              </li>
              <li class="flex items-start gap-2">
                <component :is="icons.CheckCircle2" class="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>包装破损全额赔付保障</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  Boxes, Settings, Plus, Trash2, ScrollText, FileQuestion,
  Calculator, FilePlus, Phone, ShieldCheck, CheckCircle2, Check,
  Package, Palette, Frame, Layers, Box
} from 'lucide-vue-next'
import { PACKAGING_OPTIONS, calculatePackagingQuote } from '@/utils/logistics'
import type { PackagingQuoteItem, PackagingType } from '@/types'

const router = useRouter()

const icons = {
  Boxes, Settings, Plus, Trash2, ScrollText, FileQuestion,
  Calculator, FilePlus, Phone, ShieldCheck, CheckCircle2, Check,
  Package, Palette, Frame, Layers, Box
}

const packagingOptions = PACKAGING_OPTIONS.map((opt, idx) => ({
  ...opt,
  icon: ['Package', 'Package', 'Palette', 'Frame', 'Layers', 'Box'][idx] as keyof typeof icons
}))

const selectedType = ref<string>('')
const selectedOption = ref(packagingOptions[0])

const configForm = reactive({
  length: 200,
  width: 120,
  height: 150,
  quantity: 1,
  needFumigation: false,
  needReinforce: false
})

const quoteList = ref<PackagingQuoteItem[]>([])

function selectType(option: typeof packagingOptions[0]) {
  selectedType.value = option.name
  selectedOption.value = option
  if (option.type === 'wooden_box') {
    configForm.needFumigation = option.fumigationFee > 0
  } else {
    configForm.needFumigation = false
  }
}

const previewQuote = computed<PackagingQuoteItem>(() => {
  return calculatePackagingQuote(
    selectedOption.value.type as PackagingType,
    configForm.quantity,
    configForm.length,
    configForm.width,
    configForm.height,
    configForm.needFumigation,
    configForm.needReinforce,
    selectedOption.value.name
  )
})

function addToQuote() {
  quoteList.value = [...quoteList.value, { ...previewQuote.value }]
  ElMessage.success('已添加到报价清单')
}

function removeItem(index: number) {
  quoteList.value = quoteList.value.filter((_, i) => i !== index)
}

function clearQuote() {
  quoteList.value = []
}

const totals = computed(() => {
  return {
    materialCost: quoteList.value.reduce((s, i) => s + i.materialCost, 0),
    laborCost: quoteList.value.reduce((s, i) => s + i.laborCost, 0),
    fumigationCost: quoteList.value.reduce((s, i) => s + i.fumigationCost, 0),
    reinforceCost: quoteList.value.reduce((s, i) => s + i.reinforceCost, 0),
    subtotal: quoteList.value.reduce((s, i) => s + i.subtotal, 0),
    quantity: quoteList.value.reduce((s, i) => s + i.quantity, 0)
  }
})

function goOrder() {
  if (quoteList.value.length === 0) {
    ElMessage.warning('请先添加包装配置到报价清单')
    return
  }
  router.push({
    path: '/order/create',
    query: { packagingFee: totals.value.subtotal.toFixed(2) }
  })
}

function contactSales() {
  ElMessage.info('销售顾问热线：95353 转 2')
}

selectType(packagingOptions[0])
</script>
