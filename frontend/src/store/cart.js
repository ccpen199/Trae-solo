import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { cartApi } from '@/api/cart'

export const useCartStore = defineStore('cart', () => {
  
  const cartItems = ref([])
  const cartId = ref(null)
  const loading = ref(false)

  const totalCount = computed(() => cartItems.value.length)
  
  const selectedCount = computed(() => 
    cartItems.value.filter(item => item.isSelected).length
  )

  const selectedItems = computed(() => 
    cartItems.value.filter(item => item.isSelected)
  )

  const totalAmount = computed(() => {
    return cartItems.value
      .filter(item => item.isSelected)
      .reduce((sum, item) => sum + (parseFloat(item.totalPrice) || 0), 0)
  })

  const packageItem = computed(() => 
    cartItems.value.find(item => item.itemType === 'package')
  )

  const accessoryItems = computed(() => 
    cartItems.value.filter(item => item.itemType === 'accessory')
  )

  const upgradeItems = computed(() => 
    cartItems.value.filter(item => item.itemType === 'upgrade')
  )

  const fetchCart = async () => {
    loading.value = true
    try {
      const result = await cartApi.getCart()
      cartItems.value = result.data.items || []
      cartId.value = result.data.cartId
      return result
    } finally {
      loading.value = false
    }
  }

  const addPackage = async (data) => {
    loading.value = true
    try {
      const result = await cartApi.addPackage(data)
      await fetchCart()
      return result
    } finally {
      loading.value = false
    }
  }

  const addAccessory = async (data) => {
    loading.value = true
    try {
      const result = await cartApi.addAccessory(data)
      await fetchCart()
      return result
    } finally {
      loading.value = false
    }
  }

  const addUpgrade = async (data) => {
    loading.value = true
    try {
      const result = await cartApi.addUpgrade(data)
      await fetchCart()
      return result
    } finally {
      loading.value = false
    }
  }

  const updateItem = async (itemId, data) => {
    loading.value = true
    try {
      const result = await cartApi.updateItem(itemId, data)
      await fetchCart()
      return result
    } finally {
      loading.value = false
    }
  }

  const removeItem = async (itemId) => {
    loading.value = true
    try {
      const result = await cartApi.removeItem(itemId)
      await fetchCart()
      return result
    } finally {
      loading.value = false
    }
  }

  const clearCart = async () => {
    loading.value = true
    try {
      const result = await cartApi.clearCart()
      cartItems.value = []
      return result
    } finally {
      loading.value = false
    }
  }

  const toggleItemSelection = (itemId) => {
    const item = cartItems.value.find(i => i.id === itemId)
    if (item) {
      item.isSelected = !item.isSelected
    }
  }

  const toggleAllSelection = (selected) => {
    cartItems.value.forEach(item => {
      item.isSelected = selected
    })
  }

  const getSelectedItemIds = () => {
    return selectedItems.value.map(item => item.id)
  }

  return {
    cartItems,
    cartId,
    loading,
    totalCount,
    selectedCount,
    selectedItems,
    totalAmount,
    packageItem,
    accessoryItems,
    upgradeItems,
    fetchCart,
    addPackage,
    addAccessory,
    addUpgrade,
    updateItem,
    removeItem,
    clearCart,
    toggleItemSelection,
    toggleAllSelection,
    getSelectedItemIds
  }
})
