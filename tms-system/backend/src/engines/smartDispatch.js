export class SmartDispatchEngine {
  recommend({ order, availableVehicles, availableDrivers, routes }) {
    const recommendations = []

    for (const vehicle of availableVehicles) {
      if (vehicle.max_load < order.weight) continue
      if (vehicle.max_volume && order.volume && vehicle.max_volume < order.volume) continue

      const matchingDrivers = availableDrivers.filter(d => {
        if (d.vehicle_id && d.vehicle_id !== vehicle.id) return false
        return d.status === 'AVAILABLE' || d.status === 'OFF_DUTY'
      })

      for (const driver of matchingDrivers) {
        const route = routes.find(r =>
          r.origin_city === order.pickup_city && r.destination_city === order.delivery_city
        ) || this.findBestRoute(order.pickup_city, order.delivery_city, routes)

        const distanceToPickup = this.calculateDistance(
          vehicle.current_lat || 0,
          vehicle.current_lng || 0,
          order.pickup_lat || 0,
          order.pickup_lng || 0
        )

        const matchingScore = this.calculateMatchingScore({
          vehicle,
          driver,
          order,
          route,
          distanceToPickup
        })

        const reasons = this.generateReasons({
          vehicle,
          driver,
          order,
          route,
          distanceToPickup,
          matchingScore
        })

        recommendations.push({
          vehicle,
          driver,
          route: route ? {
            distance: route.distance,
            duration: route.duration,
            waypoints: JSON.parse(route.waypoints || '[]')
          } : null,
          estimated_pickup_time: this.calculateEstimatedPickupTime(distanceToPickup),
          estimated_delivery_time: this.calculateEstimatedDeliveryTime(route, distanceToPickup),
          matching_score: matchingScore,
          reasons
        })
      }
    }

    recommendations.sort((a, b) => b.matching_score - a.matching_score)

    return recommendations[0] || null
  }

  calculateMatchingScore({ vehicle, driver, order, route, distanceToPickup }) {
    let score = 0.5

    if (vehicle.max_load >= order.weight * 1.2) score += 0.15
    else if (vehicle.max_load >= order.weight) score += 0.1

    if (distanceToPickup < 50) score += 0.2
    else if (distanceToPickup < 100) score += 0.1
    else if (distanceToPickup < 200) score += 0.05

    if (route) score += 0.1

    if (driver.total_orders > 100) score += 0.05

    return Math.min(score, 0.99)
  }

  generateReasons({ vehicle, driver, order, route, distanceToPickup, matchingScore }) {
    const reasons = []

    reasons.push(`车辆载重${vehicle.max_load}吨${vehicle.max_load >= order.weight ? '，满足货物' + order.weight + '吨需求' : '，略低于货物重量'}`)

    if (distanceToPickup < 50) {
      reasons.push(`车辆当前位置距提货点约${Math.round(distanceToPickup)}公里，响应快速`)
    } else {
      reasons.push(`车辆当前位置距提货点约${Math.round(distanceToPickup)}公里`)
    }

    if (route) {
      reasons.push(`存在成熟路线${route.route_name}，距离${route.distance}公里，预估${Math.round(route.duration / 60)}小时`)
    } else {
      reasons.push('将为您规划最优路线')
    }

    if (driver.total_orders > 50) {
      reasons.push(`司机${driver.name}已完成${driver.total_orders}单运输任务，经验丰富`)
    }

    return reasons
  }

  calculateDistance(lat1, lng1, lat2, lng2) {
    if (!lat1 || !lng1 || !lat2 || !lng2) return 100

    const R = 6371
    const dLat = this.deg2rad(lat2 - lat1)
    const dLng = this.deg2rad(lng2 - lng1)
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  deg2rad(deg) {
    return deg * (Math.PI / 180)
  }

  findBestRoute(pickupCity, deliveryCity, routes) {
    const directRoute = routes.find(r => r.origin_city === pickupCity && r.destination_city === deliveryCity)
    if (directRoute) return directRoute

    const reversedRoute = routes.find(r => r.origin_city === deliveryCity && r.destination_city === pickupCity)
    if (reversedRoute) {
      return {
        ...reversedRoute,
        origin_city: pickupCity,
        destination_city: deliveryCity,
        distance: reversedRoute.distance * 1.3,
        duration: reversedRoute.duration * 1.3
      }
    }

    return null
  }

  calculateEstimatedPickupTime(distanceToPickup) {
    const avgSpeed = 40
    const hours = distanceToPickup / avgSpeed
    const pickupTime = new Date(Date.now() + hours * 60 * 60 * 1000)
    return pickupTime.toISOString()
  }

  calculateEstimatedDeliveryTime(route, distanceToPickup) {
    const avgSpeed = 50
    const totalDistance = (route?.distance || 500) + distanceToPickup * 2
    const hours = totalDistance / avgSpeed
    const deliveryTime = new Date(Date.now() + hours * 60 * 60 * 1000)
    return deliveryTime.toISOString()
  }
}
