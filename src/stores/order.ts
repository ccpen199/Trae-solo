import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { OrderCreateRequest, OrderQuoteResponse, AddressInfo, CargoItem, PackagingQuoteItem } from '@/types'
import { updateCargoWeights, calculateFreightQuote, generateId } from '@/utils/logistics'
import { mockAddresses, mockCargoItems } from '@/mock'

export const useOrderStore = defineStore('order', () => {
  const sender = ref<AddressInfo>({ ...mockAddresses.sender })
  const receiver = ref<AddressInfo>({ ...mockAddresses.receiver })
  const cargoList = ref<CargoItem[]>(mockCargoItems.map(c => ({ ...c })))
  const services = ref({
    pickup: true,
    delivery: true,
    upstairs: false,
    insurance: true,
    temperatureControl: false
  })
  const pickupTime = ref('')
  const remark = ref('')
  const quote = ref<OrderQuoteResponse | null>(null)
  const packagingQuotes = ref<PackagingQuoteItem[]>([])

  const totalChargeWeight = computed(() =>
    cargoList.value.reduce((sum, c) => sum + c.chargeWeight * c.quantity, 0)
  )
  const totalActualWeight = computed(() =>
    cargoList.value.reduce((sum, c) => sum + c.actualWeight * c.quantity, 0)
  )
  const totalVolumeWeight = computed(() =>
    cargoList.value.reduce((sum, c) => sum + c.volumeWeight * c.quantity, 0)
  )

  function addCargoItem() {
    const newItem = updateCargoWeights({
      id: generateId(),
      name: '',
      length: 100,
      width: 100,
      height: 100,
      actualWeight: 100,
      quantity: 1,
      packaging: 'none',
      value: 0
    })
    cargoList.value.push(newItem)
  }

  function removeCargoItem(id: string) {
    const index = cargoList.value.findIndex(c => c.id === id)
    if (index > -1 && cargoList.value.length > 1) {
      cargoList.value.splice(index, 1)
    }
  }

  function updateCargoItem(id: string, updates: Partial<CargoItem>) {
    const item = cargoList.value.find(c => c.id === id)
    if (item) {
      const merged = { ...item, ...updates } as Omit<CargoItem, 'volumeWeight' | 'chargeWeight'>
      const updated = updateCargoWeights(merged)
      Object.assign(item, updated)
      recalculateQuote()
    }
  }

  function recalculateQuote() {
    const request: OrderCreateRequest = {
      sender: sender.value,
      receiver: receiver.value,
      cargoList: cargoList.value,
      services: services.value,
      pickupTime: pickupTime.value,
      remark: remark.value
    }
    quote.value = calculateFreightQuote(request)
  }

  function setPackagingQuotes(items: PackagingQuoteItem[]) {
    packagingQuotes.value = items
  }

  return {
    sender,
    receiver,
    cargoList,
    services,
    pickupTime,
    remark,
    quote,
    packagingQuotes,
    totalChargeWeight,
    totalActualWeight,
    totalVolumeWeight,
    addCargoItem,
    removeCargoItem,
    updateCargoItem,
    recalculateQuote,
    setPackagingQuotes
  }
})
