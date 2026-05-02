export class FreightCalculator {
  calculate(waybill) {
    const distance = waybill.actual_distance || waybill.total_distance || this.getDistanceFromRoute(waybill)
    const weight = waybill.weight || 0
    const volume = waybill.volume || 0

    const unitPricePerKm = 3.5
    const unitPricePerTon = 50

    const distanceFee = Math.max(distance * unitPricePerKm, 300)
    const weightFee = weight * unitPricePerTon

    const volumeFee = volume * 20

    const pickupFee = 100
    const deliveryFee = 150

    const additionalFees = {
      pickup_service: { amount: pickupFee, description: '提货服务费' },
      delivery_service: { amount: deliveryFee, description: '送货服务费' }
    }

    const declaredValue = waybill.declared_value || 0
    const insuranceFee = declaredValue > 0 ? declaredValue * 0.001 : 0
    if (insuranceFee > 0) {
      additionalFees.insurance = { amount: insuranceFee, description: `按声明价值${declaredValue}元的0.1%收取保价费` }
    }

    const discount = this.calculateDiscount(waybill)

    const subtotal = distanceFee + weightFee + volumeFee +
      Object.values(additionalFees).reduce((sum, f) => sum + f.amount, 0)

    const totalFreight = Math.max(subtotal - discount, 100)

    const calculationBasis = {
      distance: {
        unit_price_per_km: unitPricePerKm,
        distance: distance,
        amount: distanceFee,
        explanation: `根据实际行驶里程${distance}公里，乘以协议单价${unitPricePerKm}元/公里`
      },
      weight: {
        unit_price_per_ton: unitPricePerTon,
        weight: weight,
        amount: weightFee,
        explanation: `货物重量${weight}吨，乘以协议单价${unitPricePerTon}元/吨`
      },
      volume: {
        unit_price_per_volume: 20,
        volume: volume,
        amount: volumeFee,
        explanation: `货物体积${volume}方，乘以单价20元/方`
      },
      additional_fees: Object.entries(additionalFees).map(([key, value]) => ({
        item: key,
        amount: value.amount,
        description: value.description
      })),
      discount: {
        amount: discount,
        reason: discount > 0 ? '长期客户折扣' : '无折扣'
      },
      formula: `总运费 = 里程费(${distanceFee}) + 吨位费(${weightFee}) + 附加费(${Object.values(additionalFees).reduce((sum, f) => sum + f.amount, 0)}) - 折扣(${discount}) = ${totalFreight}`
    }

    return {
      distance,
      weight,
      volume,
      distance_fee: Math.round(distanceFee * 100) / 100,
      weight_fee: Math.round(weightFee * 100) / 100,
      volume_fee: Math.round(volumeFee * 100) / 100,
      pickup_fee: pickupFee,
      delivery_fee: deliveryFee,
      additional_fees: additionalFees,
      declared_value: declaredValue,
      insurance_fee: Math.round(insuranceFee * 100) / 100,
      discount: discount,
      subtotal: Math.round(subtotal * 100) / 100,
      total_freight: Math.round(totalFreight * 100) / 100,
      calculation_basis: calculationBasis
    }
  }

  calculateDiscount(waybill) {
    let discount = 0

    const orderCount = waybill.order_count || 0
    if (orderCount >= 50) {
      discount += 0.1
    } else if (orderCount >= 20) {
      discount += 0.05
    }

    if (waybill.distance > 1000) {
      discount += 0.02
    }

    return Math.round(discount * 100) / 100
  }

  getDistanceFromRoute(waybill) {
    if (waybill.actual_distance) return waybill.actual_distance

    const baseDistance = {
      '北京-上海': 1200,
      '北京-广州': 2200,
      '上海-深圳': 1500,
      '广州-北京': 2200,
      '深圳-上海': 1500
    }

    const routeKey = `${waybill.pickup_city}-${waybill.delivery_city}`
    return baseDistance[routeKey] || 500
  }

  calculateForStatement(waybills) {
    const results = []

    for (const waybill of waybills) {
      const calculation = this.calculate(waybill)
      results.push({
        waybill_id: waybill.id,
        waybill_no: waybill.waybill_no,
        distance: calculation.distance,
        weight: calculation.weight,
        freight: calculation.total_freight,
        calculation_detail: calculation.calculation_basis
      })
    }

    return results
  }

  generateStatementSummary(freights) {
    const totalDistance = freights.reduce((sum, f) => sum + f.distance, 0)
    const totalWeight = freights.reduce((sum, f) => sum + f.weight, 0)
    const totalFreight = freights.reduce((sum, f) => sum + f.freight, 0)

    return {
      total_orders: freights.length,
      total_distance: Math.round(totalDistance * 100) / 100,
      total_weight: Math.round(totalWeight * 100) / 100,
      total_freight: Math.round(totalFreight * 100) / 100,
      avg_freight_per_km: Math.round((totalFreight / totalDistance) * 100) / 100,
      avg_freight_per_ton: Math.round((totalFreight / totalWeight) * 100) / 100
    }
  }
}
