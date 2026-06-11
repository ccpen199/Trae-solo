<template>
  <div class="page-container">
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-gray-900 mb-2">在线下单</h1>
      <p class="text-gray-500">填写运单信息，获取准确运费报价</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-4 gap-8">
      <div class="lg:col-span-3 space-y-8">
        <div class="flex items-center gap-2 mb-6">
          <div
            v-for="(step, index) in steps"
            :key="index"
            class="flex items-center gap-2"
          >
            <div
              class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors"
              :class="currentStep >= index ? 'bg-brand-500 text-white' : 'bg-gray-200 text-gray-500'"
            >
              {{ index + 1 }}
            </div>
            <span
              class="text-sm font-medium"
              :class="currentStep >= index ? 'text-brand-600' : 'text-gray-400'"
            >
              {{ step }}
            </span>
            <div v-if="index < steps.length - 1" class="w-12 h-0.5 bg-gray-200 mx-2">
              <div
                class="h-full bg-brand-500 transition-all duration-500"
                :style="{ width: currentStep > index ? '100%' : '0%' }"
              ></div>
            </div>
          </div>
        </div>

        <div v-if="currentStep === 0" class="card-base p-8">
          <h2 class="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <component :is="icons.MapPin" class="w-5 h-5 text-brand-500" />
            地址信息
          </h2>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div class="space-y-5">
              <div class="flex items-center gap-2 pb-3 border-b border-gray-100">
                <div class="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
                  <component :is="icons.Send" class="w-4 h-4 text-green-600" />
                </div>
                <span class="font-semibold text-gray-900">发货人信息</span>
              </div>
              <div class="form-grid">
                <div>
                  <label class="label-base">省份</label>
                  <el-select v-model="sender.province" class="input-base !p-0" placeholder="请选择省份">
                    <el-option label="广东省" value="广东省" />
                    <el-option label="北京市" value="北京市" />
                    <el-option label="上海市" value="上海市" />
                    <el-option label="江苏省" value="江苏省" />
                    <el-option label="浙江省" value="浙江省" />
                  </el-select>
                </div>
                <div>
                  <label class="label-base">城市</label>
                  <el-select v-model="sender.city" class="input-base !p-0" placeholder="请选择城市">
                    <el-option label="深圳市" value="深圳市" />
                    <el-option label="广州市" value="广州市" />
                    <el-option label="东莞市" value="东莞市" />
                  </el-select>
                </div>
              </div>
              <div>
                <label class="label-base">详细地址</label>
                <input v-model="sender.detail" class="input-base" placeholder="街道、门牌号等" />
              </div>
              <div class="form-grid">
                <div>
                  <label class="label-base">联系人</label>
                  <input v-model="sender.name" class="input-base" placeholder="请输入姓名" />
                </div>
                <div>
                  <label class="label-base">电话</label>
                  <input v-model="sender.phone" class="input-base" placeholder="请输入手机号" />
                </div>
              </div>
            </div>

            <div class="space-y-5">
              <div class="flex items-center gap-2 pb-3 border-b border-gray-100">
                <div class="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center">
                  <component :is="icons.Inbox" class="w-4 h-4 text-brand-600" />
                </div>
                <span class="font-semibold text-gray-900">收货人信息</span>
              </div>
              <div class="form-grid">
                <div>
                  <label class="label-base">省份</label>
                  <el-select v-model="receiver.province" class="input-base !p-0" placeholder="请选择省份">
                    <el-option label="广东省" value="广东省" />
                    <el-option label="北京市" value="北京市" />
                    <el-option label="上海市" value="上海市" />
                    <el-option label="江苏省" value="江苏省" />
                    <el-option label="浙江省" value="浙江省" />
                  </el-select>
                </div>
                <div>
                  <label class="label-base">城市</label>
                  <el-select v-model="receiver.city" class="input-base !p-0" placeholder="请选择城市">
                    <el-option label="北京市" value="北京市" />
                    <el-option label="天津市" value="天津市" />
                    <el-option label="石家庄市" value="石家庄市" />
                  </el-select>
                </div>
              </div>
              <div>
                <label class="label-base">详细地址</label>
                <input v-model="receiver.detail" class="input-base" placeholder="街道、门牌号等" />
              </div>
              <div class="form-grid">
                <div>
                  <label class="label-base">联系人</label>
                  <input v-model="receiver.name" class="input-base" placeholder="请输入姓名" />
                </div>
                <div>
                  <label class="label-base">电话</label>
                  <input v-model="receiver.phone" class="input-base" placeholder="请输入手机号" />
                </div>
              </div>
            </div>
          </div>

          <div class="mt-8 flex justify-end">
            <button class="btn-primary" @click="currentStep = 1">
              下一步
              <component :is="icons.ChevronRight" class="w-4 h-4 ml-1" />
            </button>
          </div>
        </div>

        <div v-if="currentStep === 1" class="space-y-8">
          <div class="card-base p-8">
            <h2 class="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <component :is="icons.Package" class="w-5 h-5 text-brand-500" />
              货物信息
            </h2>

            <div class="space-y-6">
              <div
                v-for="(cargo, index) in cargoList"
                :key="cargo.id"
                class="p-6 border border-gray-200 rounded-xl relative"
              >
                <div class="flex items-center justify-between mb-4">
                  <span class="font-medium text-gray-900">货物 {{ index + 1 }}</span>
                  <button
                    v-if="cargoList.length > 1"
                    class="text-red-500 hover:text-red-600 text-sm flex items-center gap-1"
                    @click="removeCargo(index)"
                  >
                    <component :is="icons.Trash2" class="w-4 h-4" />
                    删除
                  </button>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                  <div class="lg:col-span-2">
                    <label class="label-base">货物名称</label>
                    <input v-model="cargo.name" class="input-base" placeholder="如：精密数控机床" />
                  </div>
                  <div>
                    <label class="label-base">数量</label>
                    <input v-model.number="cargo.quantity" type="number" class="input-base" min="1" />
                  </div>
                  <div>
                    <label class="label-base">包装类型</label>
                    <el-select v-model="cargo.packaging" class="input-base !p-0">
                      <el-option label="无需包装" value="none" />
                      <el-option label="熏蒸木箱" value="wooden_box" />
                      <el-option label="实木托盘" value="wooden_pallet" />
                      <el-option label="木框架" value="wooden_frame" />
                      <el-option label="塑料托盘" value="plastic_pallet" />
                      <el-option label="铁框架" value="iron_frame" />
                    </el-select>
                  </div>
                </div>

                <VolumeWeightCalculator
                  :model-length="cargo.length"
                  :model-width="cargo.width"
                  :model-height="cargo.height"
                  :model-actual-weight="cargo.actualWeight"
                  @change="(val) => updateCargo(index, val)"
                />

                <div class="mt-4">
                  <label class="label-base">货值 (元)</label>
                  <input v-model.number="cargo.value" type="number" class="input-base" placeholder="申报货值用于保价" min="0" />
                </div>

                <div v-if="cargo.isOversize || cargo.isOverweight" class="mt-4 p-3 bg-alert-50 rounded-lg border border-alert-100">
                  <div class="flex items-center gap-2 text-alert-600 text-sm font-medium mb-1">
                    <component :is="icons.AlertTriangle" class="w-4 h-4" />
                    大件货物提示
                  </div>
                  <div class="text-xs text-alert-600">
                    <span v-if="cargo.isOverweight">单票实际重量超过50kg，</span>
                    <span v-if="cargo.isOversize">单边长度超过1.8m，</span>
                    将收取大件附加费
                  </div>
                </div>
              </div>

              <button
                class="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-brand-400 hover:text-brand-500 hover:bg-brand-50 transition-all flex items-center justify-center gap-2"
                @click="addCargo"
              >
                <component :is="icons.Plus" class="w-5 h-5" />
                添加货物
              </button>
            </div>
          </div>

          <div class="card-base p-8">
            <h2 class="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <component :is="icons.Sparkles" class="w-5 h-5 text-brand-500" />
              增值服务
            </h2>

            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div
                v-for="service in valueAddedServices"
                :key="service.key"
                class="p-5 border rounded-xl cursor-pointer transition-all"
                :class="services[service.key] ? 'border-brand-500 bg-brand-50' : 'border-gray-200 hover:border-gray-300'"
                @click="services[service.key] = !services[service.key]"
              >
                <div class="flex items-start justify-between mb-3">
                  <component :is="icons[service.icon]" class="w-6 h-6" :class="services[service.key] ? 'text-brand-500' : 'text-gray-400'" />
                  <div class="w-5 h-5 rounded border-2 flex items-center justify-center" :class="services[service.key] ? 'bg-brand-500 border-brand-500' : 'border-gray-300'">
                    <component :is="icons.Check" v-if="services[service.key]" class="w-3 h-3 text-white" />
                  </div>
                </div>
                <div class="font-medium text-gray-900 text-sm mb-1">{{ service.name }}</div>
                <div class="text-xs text-gray-500">{{ service.desc }}</div>
              </div>
            </div>
          </div>

          <div class="flex justify-between">
            <button class="btn-secondary" @click="currentStep = 0">
              <component :is="icons.ChevronLeft" class="w-4 h-4 mr-1" />
              上一步
            </button>
            <button class="btn-primary" @click="currentStep = 2">
              下一步
              <component :is="icons.ChevronRight" class="w-4 h-4 ml-1" />
            </button>
          </div>
        </div>

        <div v-if="currentStep === 2" class="space-y-8">
          <div class="card-base p-8">
            <h2 class="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <component :is="icons.ClipboardCheck" class="w-5 h-5 text-brand-500" />
              确认下单
            </h2>

            <div class="space-y-6">
              <div>
                <h3 class="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <component :is="icons.MapPin" class="w-4 h-4 text-brand-500" />
                  收发件人信息
                </h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 p-5 bg-bg-50 rounded-xl">
                  <div>
                    <div class="text-xs text-gray-500 mb-1 flex items-center gap-1">
                      <component :is="icons.Send" class="w-3 h-3 text-green-600" />
                      发货人
                    </div>
                    <div class="font-medium text-gray-900">{{ sender.name }} {{ sender.phone }}</div>
                    <div class="text-sm text-gray-600">{{ sender.province }}{{ sender.city }}{{ sender.detail }}</div>
                  </div>
                  <div>
                    <div class="text-xs text-gray-500 mb-1 flex items-center gap-1">
                      <component :is="icons.Inbox" class="w-3 h-3 text-brand-600" />
                      收货人
                    </div>
                    <div class="font-medium text-gray-900">{{ receiver.name }} {{ receiver.phone }}</div>
                    <div class="text-sm text-gray-600">{{ receiver.province }}{{ receiver.city }}{{ receiver.detail }}</div>
                  </div>
                </div>
              </div>

              <div>
                <h3 class="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <component :is="icons.Package" class="w-4 h-4 text-brand-500" />
                  货物清单
                </h3>
                <div class="overflow-x-auto rounded-xl border border-gray-200">
                  <table class="w-full text-sm">
                    <thead class="bg-gray-50">
                      <tr>
                        <th class="px-4 py-3 text-left font-medium text-gray-600">货物名称</th>
                        <th class="px-4 py-3 text-center font-medium text-gray-600">尺寸(cm)</th>
                        <th class="px-4 py-3 text-center font-medium text-gray-600">实际重</th>
                        <th class="px-4 py-3 text-center font-medium text-gray-600">体积重</th>
                        <th class="px-4 py-3 text-center font-medium text-gray-600">计费重</th>
                        <th class="px-4 py-3 text-center font-medium text-gray-600">包装</th>
                        <th class="px-4 py-3 text-center font-medium text-gray-600">货值</th>
                        <th class="px-4 py-3 text-right font-medium text-gray-600">小计运费</th>
                        <th class="px-4 py-3 text-right font-medium text-gray-600">包装费</th>
                        <th class="px-4 py-3 text-right font-medium text-gray-600">保价费</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-100">
                      <tr v-for="(cargo, idx) in cargoFreight" :key="idx" class="hover:bg-gray-50">
                        <td class="px-4 py-3 font-medium text-gray-900">{{ cargo.name || '未命名' }} × {{ cargo.quantity }}</td>
                        <td class="px-4 py-3 text-center text-gray-600">{{ cargo.length }}×{{ cargo.width }}×{{ cargo.height }}</td>
                        <td class="px-4 py-3 text-center text-gray-600">{{ cargo.actualWeight }}kg</td>
                        <td class="px-4 py-3 text-center text-gray-600">{{ cargo.volumeWeight }}kg</td>
                        <td class="px-4 py-3 text-center font-medium text-gray-900">{{ cargo.chargeWeight }}kg</td>
                        <td class="px-4 py-3 text-center text-gray-600">{{ packagingNameMap[cargo.packaging] }}</td>
                        <td class="px-4 py-3 text-center text-gray-600">¥{{ cargo.value.toLocaleString() }}</td>
                        <td class="px-4 py-3 text-right font-medium text-gray-900">¥{{ cargo.subtotal.toFixed(2) }}</td>
                        <td class="px-4 py-3 text-right text-gray-700">¥{{ cargo.cargoPackagingFee.toFixed(2) }}</td>
                        <td class="px-4 py-3 text-right text-gray-700">¥{{ cargo.cargoInsuranceFee.toFixed(2) }}</td>
                      </tr>
                    </tbody>
                    <tfoot class="bg-gray-50 border-t-2 border-gray-300">
                      <tr>
                        <td class="px-4 py-3 font-semibold text-gray-900">合计</td>
                        <td class="px-4 py-3"></td>
                        <td class="px-4 py-3 text-center font-medium text-gray-900">{{ cargoTotals.totalActualWeight }}kg</td>
                        <td class="px-4 py-3 text-center font-medium text-gray-900">{{ cargoTotals.totalVolumeWeight }}kg</td>
                        <td class="px-4 py-3 text-center font-semibold text-gray-900">{{ cargoTotals.totalChargeWeight }}kg</td>
                        <td class="px-4 py-3"></td>
                        <td class="px-4 py-3"></td>
                        <td class="px-4 py-3 text-right font-semibold text-gray-900">¥{{ cargoTotals.totalSubtotal.toFixed(2) }}</td>
                        <td class="px-4 py-3 text-right font-semibold text-gray-900">¥{{ cargoTotals.totalPackagingFee.toFixed(2) }}</td>
                        <td class="px-4 py-3 text-right font-semibold text-gray-900">¥{{ cargoTotals.totalInsuranceFee.toFixed(2) }}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              <div v-if="activeServiceList.length > 0">
                <h3 class="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <component :is="icons.Sparkles" class="w-4 h-4 text-brand-500" />
                  增值服务
                </h3>
                <div class="p-4 bg-bg-50 rounded-xl">
                  <div v-for="svc in activeServiceList" :key="svc.key" class="flex items-center justify-between py-2 last:border-0 border-b border-gray-200">
                    <div class="flex items-center gap-2">
                      <component :is="icons.Check" class="w-4 h-4 text-brand-500" />
                      <span class="text-sm text-gray-700">{{ svc.name }}</span>
                    </div>
                    <span class="text-sm text-gray-900 font-medium">¥{{ svc.fee.toFixed(2) }}</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 class="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <component :is="icons.Receipt" class="w-4 h-4 text-brand-500" />
                  费用明细
                </h3>
                <div class="p-5 bg-bg-50 rounded-xl space-y-0">
                  <div class="flex justify-between items-center py-2.5 border-b border-gray-200">
                    <span class="text-gray-600">基础运费</span>
                    <span class="text-gray-900 font-medium">¥{{ quote.baseFreight.toFixed(2) }}</span>
                  </div>
                  <div v-if="quote.pickupFee > 0" class="flex justify-between items-center py-2.5 border-b border-gray-200">
                    <span class="text-gray-600">取货费</span>
                    <span class="text-gray-900 font-medium">¥{{ quote.pickupFee.toFixed(2) }}</span>
                  </div>
                  <div v-if="quote.deliveryFee > 0" class="flex justify-between items-center py-2.5 border-b border-gray-200">
                    <span class="text-gray-600">送货费</span>
                    <span class="text-gray-900 font-medium">¥{{ quote.deliveryFee.toFixed(2) }}</span>
                  </div>
                  <div v-if="quote.upstairsFee > 0" class="flex justify-between items-center py-2.5 border-b border-gray-200">
                    <span class="text-gray-600">上楼费</span>
                    <span class="text-gray-900 font-medium">¥{{ quote.upstairsFee.toFixed(2) }}</span>
                  </div>
                  <div v-if="quote.packagingFee > 0" class="flex justify-between items-center py-2.5 border-b border-gray-200">
                    <span class="text-gray-600">包装费</span>
                    <span class="text-gray-900 font-medium">¥{{ quote.packagingFee.toFixed(2) }}</span>
                  </div>
                  <div v-if="quote.insuranceFee > 0" class="flex justify-between items-center py-2.5 border-b border-gray-200">
                    <span class="text-gray-600">保价费</span>
                    <span class="text-gray-900 font-medium">¥{{ quote.insuranceFee.toFixed(2) }}</span>
                  </div>
                  <div v-if="quote.temperatureFee > 0" class="flex justify-between items-center py-2.5 border-b border-gray-200">
                    <span class="text-gray-600">温控费</span>
                    <span class="text-gray-900 font-medium">¥{{ quote.temperatureFee.toFixed(2) }}</span>
                  </div>
                  <div v-if="quote.overweightSurcharge > 0" class="flex justify-between items-center py-2.5 border-b border-gray-200">
                    <span class="text-alert-600">超重附加费</span>
                    <span class="text-alert-600 font-medium">¥{{ quote.overweightSurcharge.toFixed(2) }}</span>
                  </div>
                  <div v-if="quote.oversizeSurcharge > 0" class="flex justify-between items-center py-2.5 border-b border-gray-200">
                    <span class="text-alert-600">超尺寸附加费</span>
                    <span class="text-alert-600 font-medium">¥{{ quote.oversizeSurcharge.toFixed(2) }}</span>
                  </div>
                  <div class="flex justify-between items-center pt-4">
                    <span class="text-gray-900 font-semibold">总计</span>
                    <span class="font-din text-2xl font-bold text-alert-600">¥{{ quote.total.toFixed(2) }}</span>
                  </div>
                </div>
              </div>

              <div v-if="packagingItems.length > 0">
                <h3 class="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <component :is="icons.Package" class="w-4 h-4 text-brand-500" />
                  包装报价清单
                </h3>
                <div class="overflow-x-auto rounded-xl border border-gray-200">
                  <table class="w-full text-sm">
                    <thead class="bg-gray-50">
                      <tr>
                        <th class="px-4 py-3 text-left font-medium text-gray-600">包装名称</th>
                        <th class="px-4 py-3 text-center font-medium text-gray-600">规格</th>
                        <th class="px-4 py-3 text-center font-medium text-gray-600">数量</th>
                        <th class="px-4 py-3 text-right font-medium text-gray-600">费用</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-100">
                      <tr v-for="(pkg, idx) in packagingItems" :key="idx" class="hover:bg-gray-50">
                        <td class="px-4 py-3 font-medium text-gray-900">{{ pkg.name }}</td>
                        <td class="px-4 py-3 text-center text-gray-600">{{ pkg.specs }}</td>
                        <td class="px-4 py-3 text-center text-gray-600">{{ pkg.quantity }}</td>
                        <td class="px-4 py-3 text-right font-medium text-alert-600">¥{{ pkg.subtotal.toFixed(2) }}</td>
                      </tr>
                    </tbody>
                    <tfoot class="bg-gray-50">
                      <tr>
                        <td colspan="3" class="px-4 py-3 font-semibold text-gray-900">包装费合计</td>
                        <td class="px-4 py-3 text-right font-din font-bold text-alert-600">¥{{ packagingItems.reduce((s, i) => s + i.subtotal, 0).toFixed(2) }}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              <div>
                <h3 class="text-sm font-semibold text-gray-700 mb-3">备注信息</h3>
                <p class="text-sm text-gray-600 p-4 bg-bg-50 rounded-xl min-h-[3rem]">{{ remark || '无' }}</p>
              </div>
            </div>
          </div>

          <div class="flex justify-between">
            <button class="btn-secondary" @click="currentStep = 1">
              <component :is="icons.ChevronLeft" class="w-4 h-4 mr-1" />
              上一步
            </button>
            <button class="btn-primary" @click="submitOrder">
              <component :is="icons.Check" class="w-4 h-4 mr-1" />
              确认提交
            </button>
          </div>
        </div>

        <div v-if="currentStep === 3" class="space-y-8">
          <div class="card-base p-8 text-center">
            <div class="w-20 h-20 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center">
              <component :is="icons.CheckCircle" class="w-12 h-12 text-green-500" />
            </div>
            <h2 class="text-2xl font-bold text-gray-900 mb-2">下单成功！</h2>
            <p class="text-gray-500 mb-8">您的运单已提交，请保存运单号以便查询</p>
            <div class="inline-block px-8 py-4 bg-brand-50 rounded-xl">
              <div class="text-sm text-brand-600 mb-1">运单号</div>
              <div class="font-din text-3xl font-bold text-brand-700 tracking-wider">{{ orderNo }}</div>
            </div>
          </div>

          <div class="card-base p-8">
            <h3 class="text-lg font-semibold text-gray-900 mb-5 flex items-center gap-2">
              <component :is="icons.ClipboardCheck" class="w-5 h-5 text-brand-500" />
              订单信息摘要
            </h3>
            <div class="space-y-6">
              <div>
                <h4 class="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <component :is="icons.MapPin" class="w-4 h-4 text-brand-500" />
                  收发货人信息
                </h4>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-bg-50 rounded-xl">
                  <div>
                    <div class="text-xs text-gray-500 mb-1 flex items-center gap-1">
                      <component :is="icons.Send" class="w-3 h-3 text-green-600" />
                      发货人
                    </div>
                    <div class="font-medium text-gray-900">{{ sender.name }} {{ sender.phone }}</div>
                    <div class="text-sm text-gray-600">{{ sender.province }}{{ sender.city }}{{ sender.detail }}</div>
                  </div>
                  <div>
                    <div class="text-xs text-gray-500 mb-1 flex items-center gap-1">
                      <component :is="icons.Inbox" class="w-3 h-3 text-brand-600" />
                      收货人
                    </div>
                    <div class="font-medium text-gray-900">{{ receiver.name }} {{ receiver.phone }}</div>
                    <div class="text-sm text-gray-600">{{ receiver.province }}{{ receiver.city }}{{ receiver.detail }}</div>
                  </div>
                </div>
              </div>

              <div>
                <h4 class="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <component :is="icons.Package" class="w-4 h-4 text-brand-500" />
                  货物信息
                </h4>
                <div class="p-4 bg-bg-50 rounded-xl">
                  <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <div class="text-xs text-gray-500 mb-1">总件数</div>
                      <div class="font-din text-xl font-bold text-gray-900">{{ cargoTotals.totalQuantity }} 件</div>
                    </div>
                    <div>
                      <div class="text-xs text-gray-500 mb-1">总实际重</div>
                      <div class="font-din text-xl font-bold text-gray-900">{{ cargoTotals.totalActualWeight }} kg</div>
                    </div>
                    <div>
                      <div class="text-xs text-gray-500 mb-1">总体积重</div>
                      <div class="font-din text-xl font-bold text-gray-900">{{ cargoTotals.totalVolumeWeight }} kg</div>
                    </div>
                    <div>
                      <div class="text-xs text-gray-500 mb-1">总计费重</div>
                      <div class="font-din text-xl font-bold text-brand-600">{{ cargoTotals.totalChargeWeight }} kg</div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 class="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <component :is="icons.Receipt" class="w-4 h-4 text-brand-500" />
                  费用明细
                </h4>
                <div class="overflow-x-auto rounded-xl border border-gray-200">
                  <table class="w-full text-sm">
                    <thead class="bg-gray-50">
                      <tr>
                        <th class="px-4 py-3 text-left font-medium text-gray-600">货物名称</th>
                        <th class="px-4 py-3 text-center font-medium text-gray-600">实际重</th>
                        <th class="px-4 py-3 text-center font-medium text-gray-600">计费重</th>
                        <th class="px-4 py-3 text-right font-medium text-gray-600">小计运费</th>
                        <th class="px-4 py-3 text-right font-medium text-gray-600">包装费</th>
                        <th class="px-4 py-3 text-right font-medium text-gray-600">保价费</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-100">
                      <tr v-for="(cargo, idx) in cargoFreight" :key="idx" class="hover:bg-gray-50">
                        <td class="px-4 py-3 font-medium text-gray-900">{{ cargo.name || '未命名' }} × {{ cargo.quantity }}</td>
                        <td class="px-4 py-3 text-center text-gray-600">{{ cargo.actualWeight }}kg</td>
                        <td class="px-4 py-3 text-center font-medium text-gray-900">{{ cargo.chargeWeight }}kg</td>
                        <td class="px-4 py-3 text-right font-medium text-gray-900">¥{{ cargo.subtotal.toFixed(2) }}</td>
                        <td class="px-4 py-3 text-right text-gray-700">¥{{ cargo.cargoPackagingFee.toFixed(2) }}</td>
                        <td class="px-4 py-3 text-right text-gray-700">¥{{ cargo.cargoInsuranceFee.toFixed(2) }}</td>
                      </tr>
                    </tbody>
                    <tfoot class="bg-gray-50 border-t-2 border-gray-300">
                      <tr>
                        <td class="px-4 py-3 font-semibold text-gray-900">合计</td>
                        <td class="px-4 py-3 text-center font-medium text-gray-900">{{ cargoTotals.totalActualWeight }}kg</td>
                        <td class="px-4 py-3 text-center font-semibold text-gray-900">{{ cargoTotals.totalChargeWeight }}kg</td>
                        <td class="px-4 py-3 text-right font-semibold text-gray-900">¥{{ cargoTotals.totalSubtotal.toFixed(2) }}</td>
                        <td class="px-4 py-3 text-right font-semibold text-gray-900">¥{{ cargoTotals.totalPackagingFee.toFixed(2) }}</td>
                        <td class="px-4 py-3 text-right font-semibold text-gray-900">¥{{ cargoTotals.totalInsuranceFee.toFixed(2) }}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
                <div class="mt-3 p-4 bg-bg-50 rounded-xl space-y-0">
                  <div class="flex justify-between items-center py-2.5 border-b border-gray-200">
                    <span class="text-gray-600">基础运费</span>
                    <span class="text-gray-900 font-medium">¥{{ quote.baseFreight.toFixed(2) }}</span>
                  </div>
                  <div v-if="quote.pickupFee > 0" class="flex justify-between items-center py-2.5 border-b border-gray-200">
                    <span class="text-gray-600">取货费</span>
                    <span class="text-gray-900 font-medium">¥{{ quote.pickupFee.toFixed(2) }}</span>
                  </div>
                  <div v-if="quote.deliveryFee > 0" class="flex justify-between items-center py-2.5 border-b border-gray-200">
                    <span class="text-gray-600">送货费</span>
                    <span class="text-gray-900 font-medium">¥{{ quote.deliveryFee.toFixed(2) }}</span>
                  </div>
                  <div v-if="quote.upstairsFee > 0" class="flex justify-between items-center py-2.5 border-b border-gray-200">
                    <span class="text-gray-600">上楼费</span>
                    <span class="text-gray-900 font-medium">¥{{ quote.upstairsFee.toFixed(2) }}</span>
                  </div>
                  <div v-if="quote.packagingFee > 0" class="flex justify-between items-center py-2.5 border-b border-gray-200">
                    <span class="text-gray-600">包装费</span>
                    <span class="text-gray-900 font-medium">¥{{ quote.packagingFee.toFixed(2) }}</span>
                  </div>
                  <div v-if="quote.insuranceFee > 0" class="flex justify-between items-center py-2.5 border-b border-gray-200">
                    <span class="text-gray-600">保价费</span>
                    <span class="text-gray-900 font-medium">¥{{ quote.insuranceFee.toFixed(2) }}</span>
                  </div>
                  <div v-if="quote.temperatureFee > 0" class="flex justify-between items-center py-2.5 border-b border-gray-200">
                    <span class="text-gray-600">温控费</span>
                    <span class="text-gray-900 font-medium">¥{{ quote.temperatureFee.toFixed(2) }}</span>
                  </div>
                  <div v-if="quote.overweightSurcharge > 0" class="flex justify-between items-center py-2.5 border-b border-gray-200">
                    <span class="text-alert-600">超重附加费</span>
                    <span class="text-alert-600 font-medium">¥{{ quote.overweightSurcharge.toFixed(2) }}</span>
                  </div>
                  <div v-if="quote.oversizeSurcharge > 0" class="flex justify-between items-center py-2.5 border-b border-gray-200">
                    <span class="text-alert-600">超尺寸附加费</span>
                    <span class="text-alert-600 font-medium">¥{{ quote.oversizeSurcharge.toFixed(2) }}</span>
                  </div>
                  <div class="flex justify-between items-center pt-3">
                    <span class="text-gray-900 font-semibold">总计</span>
                    <span class="font-din text-2xl font-bold text-alert-600">¥{{ quote.total.toFixed(2) }}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 class="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <component :is="icons.Clock" class="w-4 h-4 text-brand-500" />
                  预计到达时间
                </h4>
                <div class="p-4 bg-brand-50 rounded-xl flex items-center gap-3">
                  <component :is="icons.Clock" class="w-5 h-5 text-brand-500" />
                  <div>
                    <div class="text-sm text-brand-700">预计 <strong class="font-semibold">{{ estimatedArrival }}</strong> 送达</div>
                    <div class="text-xs text-brand-600 mt-0.5">运输时效约 {{ quote.estimatedDays }} 天</div>
                  </div>
                </div>
              </div>

              <div>
                <h4 class="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <component :is="icons.Shield" class="w-4 h-4 text-brand-500" />
                  服务保障
                </h4>
                <div class="p-4 bg-green-50 rounded-xl border border-green-100">
                  <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div class="flex items-center gap-2">
                      <component :is="icons.CheckCircle" class="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span class="text-sm text-green-700">全程物流追踪</span>
                    </div>
                    <div class="flex items-center gap-2">
                      <component :is="icons.CheckCircle" class="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span class="text-sm text-green-700">货物损坏赔偿</span>
                    </div>
                    <div class="flex items-center gap-2">
                      <component :is="icons.CheckCircle" class="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span class="text-sm text-green-700">专属客服支持</span>
                    </div>
                    <div v-if="services.insurance" class="flex items-center gap-2">
                      <component :is="icons.CheckCircle" class="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span class="text-sm text-green-700">保价运输保障</span>
                    </div>
                    <div v-if="services.temperatureControl" class="flex items-center gap-2">
                      <component :is="icons.CheckCircle" class="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span class="text-sm text-green-700">全程温控监测</span>
                    </div>
                    <div class="flex items-center gap-2">
                      <component :is="icons.CheckCircle" class="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span class="text-sm text-green-700">签收验货服务</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button class="btn-primary w-full sm:w-auto" @click="router.push(`/tracking/${orderNo}`)">
              <component :is="icons.ClipboardCheck" class="w-4 h-4 mr-1" />
              查看运单追踪
            </button>
            <button class="btn-secondary w-full sm:w-auto" @click="router.push('/')">
              <component :is="icons.Home" class="w-4 h-4 mr-1" />
              返回首页
            </button>
            <button class="btn-secondary w-full sm:w-auto" @click="resetForm">
              <component :is="icons.Plus" class="w-4 h-4 mr-1" />
              继续下单
            </button>
          </div>
        </div>
      </div>

      <div class="lg:col-span-1">
        <div class="sticky top-24">
          <div class="card-base p-6">
            <h3 class="font-semibold text-gray-900 mb-5 flex items-center gap-2">
              <component :is="icons.Receipt" class="w-5 h-5 text-brand-500" />
              运费试算
            </h3>

            <div class="space-y-3 text-sm">
              <div class="flex justify-between items-center py-2 border-b border-gray-100">
                <span class="text-gray-500">基础运费</span>
                <span class="text-gray-900 font-medium">¥{{ quote.baseFreight.toFixed(2) }}</span>
              </div>
              <div v-if="quote.pickupFee > 0" class="flex justify-between items-center py-2 border-b border-gray-100">
                <span class="text-gray-500">上门取货</span>
                <span class="text-gray-900 font-medium">¥{{ quote.pickupFee.toFixed(2) }}</span>
              </div>
              <div v-if="quote.deliveryFee > 0" class="flex justify-between items-center py-2 border-b border-gray-100">
                <span class="text-gray-500">送货上门</span>
                <span class="text-gray-900 font-medium">¥{{ quote.deliveryFee.toFixed(2) }}</span>
              </div>
              <div v-if="quote.upstairsFee > 0" class="flex justify-between items-center py-2 border-b border-gray-100">
                <span class="text-gray-500">送货上楼</span>
                <span class="text-gray-900 font-medium">¥{{ quote.upstairsFee.toFixed(2) }}</span>
              </div>
              <div v-if="quote.packagingFee > 0" class="flex justify-between items-center py-2 border-b border-gray-100">
                <span class="text-gray-500">包装服务费</span>
                <span class="text-gray-900 font-medium">¥{{ quote.packagingFee.toFixed(2) }}</span>
              </div>
              <div v-if="quote.insuranceFee > 0" class="flex justify-between items-center py-2 border-b border-gray-100">
                <span class="text-gray-500">保价费 (0.3%)</span>
                <span class="text-gray-900 font-medium">¥{{ quote.insuranceFee.toFixed(2) }}</span>
              </div>
              <div v-if="quote.temperatureFee > 0" class="flex justify-between items-center py-2 border-b border-gray-100">
                <span class="text-gray-500">温控运输</span>
                <span class="text-gray-900 font-medium">¥{{ quote.temperatureFee.toFixed(2) }}</span>
              </div>
              <div v-if="quote.overweightSurcharge > 0" class="flex justify-between items-center py-2 border-b border-gray-100">
                <span class="text-alert-600">超重附加费</span>
                <span class="text-gray-900 font-medium">¥{{ quote.overweightSurcharge.toFixed(2) }}</span>
              </div>
              <div v-if="quote.oversizeSurcharge > 0" class="flex justify-between items-center py-2 border-b border-gray-100">
                <span class="text-alert-600">超尺寸附加费</span>
                <span class="text-gray-900 font-medium">¥{{ quote.oversizeSurcharge.toFixed(2) }}</span>
              </div>
            </div>

            <div class="mt-5 pt-5 border-t-2 border-gray-100">
              <div class="flex justify-between items-center mb-3">
                <span class="text-gray-700 font-medium">总计</span>
                <span class="font-din text-3xl font-bold text-alert-600">¥{{ quote.total.toFixed(2) }}</span>
              </div>
              <div class="flex items-center gap-2 p-3 bg-brand-50 rounded-lg">
                <component :is="icons.Clock" class="w-4 h-4 text-brand-500" />
                <span class="text-sm text-brand-700">预计运输时效：<strong class="font-semibold">{{ quote.estimatedDays }} 天</strong></span>
              </div>
              <div v-if="currentStep === 1" class="mt-4 flex gap-3">
                <button class="flex-1 py-2.5 px-4 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors text-sm font-medium flex items-center justify-center gap-1" @click="currentStep = 0">
                  <component :is="icons.ChevronLeft" class="w-4 h-4" />
                  上一步
                </button>
                <button class="flex-[2] py-2.5 px-4 bg-brand-500 hover:bg-brand-600 text-white rounded-lg transition-colors text-sm font-semibold flex items-center justify-center gap-1 shadow-md shadow-brand-200" @click="currentStep = 2">
                  下一步：确认下单
                  <component :is="icons.ChevronRight" class="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  MapPin, Send, Inbox, Package, Plus, Trash2, AlertTriangle,
  Sparkles, Check, ChevronRight, ChevronLeft, ClipboardCheck,
  Receipt, Clock, Home, ArrowUp, Shield, Thermometer, Box, CheckCircle
} from 'lucide-vue-next'
import VolumeWeightCalculator from '@/components/business/VolumeWeightCalculator.vue'
import { calculateFreightQuote, updateCargoWeights, generateId } from '@/utils/logistics'
import { mockAddresses } from '@/mock'
import { orderApi } from '@/api'
import type { CargoItem, AddressInfo, OrderServices, OrderQuoteResponse } from '@/types'

const router = useRouter()
const route = useRoute()

const externalPackagingFee = computed(() => {
  const fee = route.query.packagingFee
  return fee ? Number(fee) : 0
})

interface PackagingItemSimple {
  name: string
  specs: string
  quantity: number
  subtotal: number
}

const packagingItems = computed<PackagingItemSimple[]>(() => {
  const raw = route.query.packagingItems
  if (!raw || typeof raw !== 'string') return []
  try {
    return JSON.parse(decodeURIComponent(raw)) as PackagingItemSimple[]
  } catch {
    return []
  }
})

const icons = {
  MapPin, Send, Inbox, Package, Plus, Trash2, AlertTriangle,
  Sparkles, Check, ChevronRight, ChevronLeft, ClipboardCheck,
  Receipt, Clock, Home, ArrowUp, Shield, Thermometer, Box, CheckCircle
}

const steps = ['地址信息', '货物信息', '确认下单', '下单成功']
const currentStep = ref(0)

const sender = reactive<AddressInfo>({ ...mockAddresses.sender })
const receiver = reactive<AddressInfo>({ ...mockAddresses.receiver })
const remark = ref('')

const createCargo = (): CargoItem => updateCargoWeights({
  id: generateId(),
  name: '',
  length: 120,
  width: 80,
  height: 100,
  actualWeight: 150,
  quantity: 1,
  packaging: 'wooden_box',
  value: 50000
})

const cargoList = ref<CargoItem[]>([createCargo()])

const services = reactive<OrderServices>({
  pickup: true,
  delivery: true,
  upstairs: false,
  insurance: true,
  temperatureControl: false
})

const valueAddedServices = [
  { key: 'pickup', name: '上门取货', desc: '司机上门提货', icon: 'Home' },
  { key: 'delivery', name: '送货上门', desc: '送到指定地点', icon: 'Inbox' },
  { key: 'upstairs', name: '送货上楼', desc: '上楼搬运服务', icon: 'ArrowUp' },
  { key: 'insurance', name: '保价服务', desc: '货物价值保障', icon: 'Shield' }
]

function addCargo() {
  cargoList.value.push(createCargo())
}

function removeCargo(index: number) {
  cargoList.value.splice(index, 1)
}

function updateCargo(index: number, val: { length: number; width: number; height: number; actualWeight: number }) {
  const cargo = cargoList.value[index]
  cargo.length = val.length
  cargo.width = val.width
  cargo.height = val.height
  cargo.actualWeight = val.actualWeight
  cargoList.value[index] = updateCargoWeights(cargo)
}

const quote = computed<OrderQuoteResponse>(() => {
  const result = calculateFreightQuote({
    sender,
    receiver,
    cargoList: cargoList.value,
    services,
    pickupTime: '',
    remark: remark.value
  })
  if (externalPackagingFee.value > 0) {
    const originalPackagingFee = result.packagingFee
    result.packagingFee = externalPackagingFee.value
    result.total = Number((result.total - originalPackagingFee + externalPackagingFee.value).toFixed(2))
  }
  return result
})

const packagingNameMap: Record<string, string> = {
  none: '无需包装',
  wooden_box: '熏蒸木箱',
  wooden_pallet: '实木托盘',
  wooden_frame: '木框架',
  plastic_pallet: '塑料托盘',
  iron_frame: '铁框架'
}

const cargoFreight = computed(() => {
  const totalChargeWeight = cargoList.value.reduce((sum, c) => sum + c.chargeWeight * c.quantity, 0)
  const totalValue = cargoList.value.reduce((sum, c) => sum + c.value * c.quantity, 0)
  return cargoList.value.map(c => {
    const weightShare = totalChargeWeight > 0 ? (c.chargeWeight * c.quantity) / totalChargeWeight : 0
    const subtotal = Number((quote.value.baseFreight * weightShare).toFixed(2))
    let packagingFeePerUnit = 0
    switch (c.packaging) {
      case 'wooden_box': packagingFeePerUnit = (c.length * c.width * c.height / 1000000) * 280; break
      case 'wooden_pallet': packagingFeePerUnit = 180; break
      case 'wooden_frame': packagingFeePerUnit = 120; break
      case 'iron_frame': packagingFeePerUnit = 350; break
      case 'plastic_pallet': packagingFeePerUnit = 100; break
    }
    const cargoPackagingFee = Number((packagingFeePerUnit * c.quantity).toFixed(2))
    const valueShare = totalValue > 0 ? (c.value * c.quantity) / totalValue : 0
    const cargoInsuranceFee = Number((quote.value.insuranceFee * valueShare).toFixed(2))
    return { ...c, subtotal, cargoPackagingFee, cargoInsuranceFee }
  })
})

const cargoTotals = computed(() => {
  const items = cargoFreight.value
  return {
    totalQuantity: items.reduce((s, c) => s + c.quantity, 0),
    totalActualWeight: Number(items.reduce((s, c) => s + c.actualWeight * c.quantity, 0).toFixed(2)),
    totalVolumeWeight: Number(items.reduce((s, c) => s + c.volumeWeight * c.quantity, 0).toFixed(2)),
    totalChargeWeight: Number(items.reduce((s, c) => s + c.chargeWeight * c.quantity, 0).toFixed(2)),
    totalSubtotal: Number(items.reduce((s, c) => s + c.subtotal, 0).toFixed(2)),
    totalPackagingFee: Number(items.reduce((s, c) => s + c.cargoPackagingFee, 0).toFixed(2)),
    totalInsuranceFee: Number(items.reduce((s, c) => s + c.cargoInsuranceFee, 0).toFixed(2))
  }
})

const orderNo = ref('')
const estimatedArrival = ref('')
const isSubmitting = ref(false)

const activeServiceList = computed(() => {
  const list: { key: string; name: string; fee: number }[] = []
  if (services.pickup) list.push({ key: 'pickup', name: '上门取货', fee: quote.value.pickupFee })
  if (services.delivery) list.push({ key: 'delivery', name: '送货上门', fee: quote.value.deliveryFee })
  if (services.upstairs) list.push({ key: 'upstairs', name: '送货上楼', fee: quote.value.upstairsFee })
  if (services.insurance) list.push({ key: 'insurance', name: '保价服务', fee: quote.value.insuranceFee })
  if (services.temperatureControl) list.push({ key: 'temperatureControl', name: '温控运输', fee: quote.value.temperatureFee })
  return list
})

function generateOrderNo(): string {
  const now = new Date()
  const ts = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
    String(now.getHours()).padStart(2, '0'),
    String(now.getMinutes()).padStart(2, '0'),
    String(now.getSeconds()).padStart(2, '0')
  ].join('')
  return 'DB' + ts + String(Math.floor(Math.random() * 10000)).padStart(4, '0')
}

async function submitOrder() {
  if (isSubmitting.value) return
  isSubmitting.value = true

  try {
    const response = await orderApi.create({
      sender,
      receiver,
      cargoList: cargoList.value.map(cargo => ({
        name: cargo.name || '大件货物',
        length: cargo.length,
        width: cargo.width,
        height: cargo.height,
        actualWeight: cargo.actualWeight,
        quantity: cargo.quantity,
        packaging: cargo.packaging,
        value: cargo.value
      })),
      services,
      pickupTime: '',
      remark: remark.value
    }) as any

    orderNo.value = response.data?.waybillNo || generateOrderNo()
    estimatedArrival.value = response.data?.estimatedArrival || ''
    currentStep.value = 3
    ElMessage.success(`运单 ${orderNo.value} 创建成功`)
  } catch (error: any) {
    ElMessage.error(error?.message || '下单失败，请稍后重试')
  } finally {
    isSubmitting.value = false
  }
}

function resetForm() {
  currentStep.value = 0
  Object.assign(sender, { ...mockAddresses.sender })
  Object.assign(receiver, { ...mockAddresses.receiver })
  remark.value = ''
  cargoList.value = [createCargo()]
  Object.assign(services, { pickup: true, delivery: true, upstairs: false, insurance: true, temperatureControl: false })
  orderNo.value = ''
  estimatedArrival.value = ''
  isSubmitting.value = false
}
</script>
