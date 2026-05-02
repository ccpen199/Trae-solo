export const MAP_PROVIDERS = {
  AMAP: 'amap',
  BMAP: 'bmap',
  SIMULATED: 'simulated'
}

export const MAP_CONFIG = {
  defaultProvider: MAP_PROVIDERS.SIMULATED,
  
  amap: {
    key: '',
    version: '2.0',
    securityCode: '',
    center: [116.4074, 39.9042],
    zoom: 12
  },
  
  bmap: {
    ak: '',
    version: '1.0',
    center: [116.4074, 39.9042],
    zoom: 12
  },
  
  simulated: {
    center: [116.4074, 39.9042],
    zoom: 12,
    bounds: {
      minLng: 116.3,
      maxLng: 116.5,
      minLat: 39.8,
      maxLat: 40.0
    }
  }
}

export function setMapProvider(provider) {
  localStorage.setItem('mapProvider', provider)
}

export function getMapProvider() {
  return localStorage.getItem('mapProvider') || MAP_CONFIG.defaultProvider
}

export function setAmapKey(key) {
  localStorage.setItem('amapKey', key)
  MAP_CONFIG.amap.key = key
}

export function setBmapAk(ak) {
  localStorage.setItem('bmapAk', ak)
  MAP_CONFIG.bmap.ak = ak
}

export function getAmapKey() {
  return localStorage.getItem('amapKey') || MAP_CONFIG.amap.key
}

export function getBmapAk() {
  return localStorage.getItem('bmapAk') || MAP_CONFIG.bmap.ak
}
