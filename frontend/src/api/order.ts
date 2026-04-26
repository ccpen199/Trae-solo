import { request } from '@/utils/request'
import type { Order, SubOrder, OrderStatus, QualityLevel } from '@/types'
import mockData from '@/utils/mock-data'

export const orderApi = {
  async create(data: {
    productName: string
    productCategory: string
    expectedWeight: number
    expectedPrice: number
    originProvince: string
    originCity: string
    originDistrict: string
    originDetail?: string
    destinationProvince: string
    destinationCity: string
    destinationDistrict: string
    destinationDetail?: string
    expectedPickupDate?: string
    expectedDeliveryDate?: string
    toleranceRate?: number
    hasColdChain?: boolean
    qualityStandard?: string
    remark?: string
    farmerAllocations: Array<{
      farmerId: string
      expectedWeight: number
      expectedPrice: number
      farmProvince: string
      farmCity: string
      farmDistrict: string
      farmDetail?: string
    }>
  }): Promise<Order> {
    try {
      return await request.post('/orders', data)
    } catch (error) {
      console.log('Using mock data for create order')
      const newOrder: Order = {
        id: `order-${Date.now()}`,
        orderNo: `ORD${new Date().toISOString().slice(0, 10).replace(/-/g, '')}${String(Math.floor(Math.random() * 1000000)).padStart(6, '0')}`,
        buyerId: 'buyer-001',
        status: OrderStatus.PENDING_PREPAYMENT,
        productName: data.productName,
        productCategory: data.productCategory,
        expectedWeight: data.expectedWeight,
        expectedPrice: data.expectedPrice,
        expectedAmount: data.expectedWeight * data.expectedPrice,
        prepaidAmount: 0,
        originProvince: data.originProvince,
        originCity: data.originCity,
        originDistrict: data.originDistrict,
        originDetail: data.originDetail,
        destinationProvince: data.destinationProvince,
        destinationCity: data.destinationCity,
        destinationDistrict: data.destinationDistrict,
        destinationDetail: data.destinationDetail,
        expectedPickupDate: data.expectedPickupDate,
        expectedDeliveryDate: data.expectedDeliveryDate,
        toleranceRate: data.toleranceRate || 0.05,
        hasColdChain: data.hasColdChain || false,
        qualityStandard: data.qualityStandard,
        remark: data.remark,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      return newOrder
    }
  },

  async getList(status?: OrderStatus): Promise<Order[]> {
    try {
      const params = status ? { status } : {}
      return await request.get('/orders', { params })
    } catch (error) {
      console.log('Using mock data for order list')
      return mockData.getMockOrders(status)
    }
  },

  async getMySubOrders(status?: OrderStatus): Promise<SubOrder[]> {
    try {
      const params = status ? { status } : {}
      return await request.get('/orders/suborders', { params })
    } catch (error) {
      console.log('Using mock data for suborder list')
      return mockData.getMockSubOrders('farmer-001', status)
    }
  },

  async getById(id: string): Promise<Order> {
    try {
      return await request.get(`/orders/${id}`)
    } catch (error) {
      console.log('Using mock data for order detail')
      const order = mockData.getMockOrderById(id)
      if (order) return order
      return mockData.mockOrders[0]
    }
  },

  async getSubOrderById(subOrderId: string): Promise<SubOrder> {
    try {
      return await request.get(`/orders/suborders/${subOrderId}`)
    } catch (error) {
      console.log('Using mock data for suborder detail')
      const subOrder = mockData.getMockSubOrderById(subOrderId)
      if (subOrder) return subOrder
      return mockData.mockSubOrders[0]
    }
  },

  async update(id: string, data: {
    productName?: string
    productCategory?: string
    expectedWeight?: number
    expectedPrice?: number
    qualityStandard?: string
    remark?: string
  }): Promise<Order> {
    try {
      return await request.put(`/orders/${id}`, data)
    } catch (error) {
      console.log('Using mock data for update order')
      const order = mockData.getMockOrderById(id)
      if (order) {
        return { ...order, ...data, updatedAt: new Date().toISOString() }
      }
      return mockData.mockOrders[0]
    }
  },

  async prepay(id: string, amount: number, paymentMethod?: string): Promise<Order> {
    try {
      return await request.post(`/orders/${id}/prepay`, { amount, paymentMethod })
    } catch (error) {
      console.log('Using mock data for prepay order')
      const order = mockData.getMockOrderById(id)
      if (order) {
        return {
          ...order,
          status: OrderStatus.PREPAYMENT_PAID,
          prepaidAmount: amount,
          updatedAt: new Date().toISOString(),
        }
      }
      return mockData.mockOrders[0]
    }
  },

  async reportActualWeight(
    subOrderId: string,
    actualWeight: number,
    remark?: string
  ): Promise<SubOrder> {
    try {
      return await request.post(`/orders/suborders/${subOrderId}/report-weight`, {
        actualWeight,
        remark,
      })
    } catch (error) {
      console.log('Using mock data for report actual weight')
      const subOrder = mockData.getMockSubOrderById(subOrderId)
      if (subOrder) {
        return {
          ...subOrder,
          status: OrderStatus.IN_COLLECTION,
          actualWeight,
          remark,
          updatedAt: new Date().toISOString(),
        }
      }
      return mockData.mockSubOrders[0]
    }
  },

  async updateStatus(id: string, status: OrderStatus, remark?: string): Promise<Order> {
    try {
      return await request.put(`/orders/${id}/status`, { status, remark })
    } catch (error) {
      console.log('Using mock data for update order status')
      const order = mockData.getMockOrderById(id)
      if (order) {
        return {
          ...order,
          status,
          remark,
          updatedAt: new Date().toISOString(),
        }
      }
      return mockData.mockOrders[0]
    }
  },

  async cancel(id: string, remark?: string): Promise<Order> {
    try {
      return await request.post(`/orders/${id}/cancel`, { remark })
    } catch (error) {
      console.log('Using mock data for cancel order')
      const order = mockData.getMockOrderById(id)
      if (order) {
        return {
          ...order,
          status: OrderStatus.CANCELLED,
          remark: remark ? `${order.remark || ''}\n取消原因: ${remark}` : order.remark,
          updatedAt: new Date().toISOString(),
        }
      }
      return mockData.mockOrders[0]
    }
  },
}
