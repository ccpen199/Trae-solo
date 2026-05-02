import { MAP_PROVIDERS, getMapProvider } from './config'
import { SimulatedMapAdapter } from './simulatedAdapter'
import { AmapAdapter } from './amapAdapter'
import { BmapAdapter } from './bmapAdapter'

const adapterClasses = {
  [MAP_PROVIDERS.SIMULATED]: SimulatedMapAdapter,
  [MAP_PROVIDERS.AMAP]: AmapAdapter,
  [MAP_PROVIDERS.BMAP]: BmapAdapter
}

export class MapFactory {
  static create(provider, container, options = {}) {
    const ProviderClass = adapterClasses[provider]
    
    if (!ProviderClass) {
      throw new Error(`不支持的地图服务: ${provider}`)
    }

    return new ProviderClass(container, options)
  }

  static createDefault(container, options = {}) {
    const provider = getMapProvider()
    return this.create(provider, container, options)
  }

  static getAvailableProviders() {
    return [
      {
        value: MAP_PROVIDERS.SIMULATED,
        label: '模拟地图',
        description: '无需 API Key，用于开发测试'
      },
      {
        value: MAP_PROVIDERS.AMAP,
        label: '高德地图',
        description: '需要申请 Web JS API Key'
      },
      {
        value: MAP_PROVIDERS.BMAP,
        label: '百度地图',
        description: '需要申请 JavaScript API AK'
      }
    ]
  }
}

export default MapFactory
