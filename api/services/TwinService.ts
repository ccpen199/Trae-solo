import { NetworkRepository } from '../repositories/NetworkRepository.js'

const networkRepo = new NetworkRepository()

export class TwinService {
  getNetworkData() {
    const networks = networkRepo.getNetworks()
    const stats = networkRepo.getNetworkStats()

    return {
      networks: networks.map(n => ({
        ...n,
        utilization: Math.round((n.throughput / n.capacity) * 100),
        loadLevel: n.status === 'overloaded' ? 'critical' : n.status === 'busy' ? 'warning' : 'normal',
      })),
      stats,
    }
  }

  getVehicleData() {
    const vehicles = networkRepo.getVehicles()
    const stats = networkRepo.getNetworkStats()

    const heatmapData: { lat: number; lng: number; intensity: number }[] = []
    vehicles.forEach(v => {
      heatmapData.push({
        lat: v.latitude,
        lng: v.longitude,
        intensity: v.status === 'in_transit' ? 1 : 0.5,
      })
    })

    return {
      vehicles,
      heatmapData,
      stats: {
        total: stats.total_vehicles,
        in_transit: stats.in_transit,
        loading: stats.loading,
        unloading: stats.unloading,
        idle: stats.total_vehicles - stats.in_transit - stats.loading - stats.unloading,
      },
    }
  }

  getWeatherForecast() {
    const forecast = networkRepo.getWeatherForecast()

    return {
      forecast,
      summary: {
        high_risk_count: forecast.filter(f => f.risk_level >= 3).length,
        medium_risk_count: forecast.filter(f => f.risk_level === 2).length,
        low_risk_count: forecast.filter(f => f.risk_level === 1).length,
        normal_count: forecast.filter(f => f.risk_level === 0).length,
        affected_routes: [...new Set(forecast.flatMap(f => f.affected_routes))],
      },
    }
  }

  getRealtimeData() {
    const networkData = this.getNetworkData()
    const vehicleData = this.getVehicleData()
    const weatherData = this.getWeatherForecast()

    return {
      timestamp: new Date().toISOString(),
      networks: networkData.stats,
      vehicles: vehicleData.stats,
      weather: weatherData.summary,
    }
  }

  getNetworkHistory(days: number = 7) {
    const history = []
    const now = new Date()

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now)
      date.setDate(date.getDate() - i)
      history.push({
        date: date.toISOString().slice(5, 10),
        throughput: Math.floor(Math.random() * 10000) + 40000,
        delivered: Math.floor(Math.random() * 8000) + 35000,
        exceptions: Math.floor(Math.random() * 100) + 20,
      })
    }

    return history
  }
}
