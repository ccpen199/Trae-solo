import { BaseMapAdapter } from './baseAdapter'
import { MAP_CONFIG, getAmapKey } from './config'

let scriptLoaded = false
let scriptPromise = null

export function loadAmapScript(key) {
  if (scriptLoaded) {
    return Promise.resolve(window.AMap)
  }

  if (scriptPromise) {
    return scriptPromise
  }

  scriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.type = 'text/javascript'
    script.src = `https://webapi.amap.com/maps?v=${MAP_CONFIG.amap.version}&key=${key}`
    script.async = true
    
    script.onload = () => {
      scriptLoaded = true
      resolve(window.AMap)
    }
    
    script.onerror = () => {
      reject(new Error('高德地图脚本加载失败'))
    }
    
    document.head.appendChild(script)
  })

  return scriptPromise
}

export class AmapAdapter extends BaseMapAdapter {
  constructor(container, options = {}) {
    super(container, options)
    this.config = { ...MAP_CONFIG.amap, ...options }
    this.AMap = null
  }

  async init() {
    const key = this.options.key || getAmapKey()
    
    if (!key) {
      throw new Error('请先配置高德地图 API Key。可调用 setAmapKey() 或在 localStorage 中设置 amapKey')
    }

    this.AMap = await loadAmapScript(key)
    
    const containerElement = typeof this.container === 'string'
      ? document.getElementById(this.container)
      : this.container

    if (!containerElement) {
      throw new Error('Map container not found')
    }

    this.map = new this.AMap.Map(containerElement, {
      zoom: this.config.zoom,
      center: this.config.center,
      viewMode: '2D',
      pitch: 0,
      ...this.options.mapOptions
    })

    this.map.on('click', (e) => {
      this.emit('click', { lng: e.lnglat.lng, lat: e.lnglat.lat })
    })

    return this
  }

  setCenter(lng, lat) {
    if (this.map) {
      this.map.setCenter([lng, lat])
    }
  }

  getCenter() {
    if (this.map) {
      const center = this.map.getCenter()
      return { lng: center.lng, lat: center.lat }
    }
    return { lng: 0, lat: 0 }
  }

  setZoom(zoom) {
    if (this.map) {
      this.map.setZoom(zoom)
    }
  }

  getZoom() {
    if (this.map) {
      return this.map.getZoom()
    }
    return 12
  }

  addMarker(lng, lat, options = {}) {
    if (!this.map || !this.AMap) return null

    const markerOptions = {
      position: [lng, lat],
      ...options.markerOptions
    }

    if (options.icon) {
      markerOptions.icon = options.icon
    }

    if (options.content) {
      markerOptions.content = options.content
    }

    const marker = new this.AMap.Marker(markerOptions)
    marker.setMap(this.map)

    if (options.onClick) {
      marker.on('click', (e) => {
        options.onClick({ lng, lat, marker, options, event: e })
      })
    }

    const markerWrapper = {
      lng,
      lat,
      options,
      marker,
      id: `marker-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    }

    this.markers.push(markerWrapper)
    return markerWrapper
  }

  removeMarker(markerWrapper) {
    if (markerWrapper && markerWrapper.marker) {
      markerWrapper.marker.setMap(null)
      markerWrapper.marker = null
    }
    const index = this.markers.indexOf(markerWrapper)
    if (index > -1) {
      this.markers.splice(index, 1)
    }
  }

  addPolyline(path, options = {}) {
    if (!this.map || !this.AMap) return null

    const pathArr = path.map(p => [p.lng, p.lat])

    const polylineOptions = {
      path: pathArr,
      strokeColor: options.strokeColor || '#409EFF',
      strokeWeight: options.strokeWidth || 3,
      strokeOpacity: options.strokeOpacity || 0.8,
      strokeStyle: options.strokeDasharray ? 'dashed' : 'solid',
      strokeDasharray: options.strokeDasharray,
      ...options.polylineOptions
    }

    const polyline = new this.AMap.Polyline(polylineOptions)
    polyline.setMap(this.map)

    const polylineWrapper = {
      path,
      options,
      polyline,
      id: `polyline-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    }

    this.polylines.push(polylineWrapper)
    return polylineWrapper
  }

  removePolyline(polylineWrapper) {
    if (polylineWrapper && polylineWrapper.polyline) {
      polylineWrapper.polyline.setMap(null)
      polylineWrapper.polyline = null
    }
    const index = this.polylines.indexOf(polylineWrapper)
    if (index > -1) {
      this.polylines.splice(index, 1)
    }
  }

  fitBounds(bounds) {
    if (!this.map || !this.AMap || !bounds || !bounds.length) return

    const lngLats = bounds.map(p => new this.AMap.LngLat(p.lng, p.lat))
    const boundsObj = new this.AMap.Bounds()
    
    lngLats.forEach(lngLat => {
      boundsObj.extend(lngLat)
    })

    this.map.setBounds(boundsObj)
  }

  destroy() {
    this.removeAllMarkers()
    this.removeAllPolylines()
    if (this.map) {
      this.map.destroy()
      this.map = null
    }
  }
}
