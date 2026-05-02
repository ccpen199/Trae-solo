import { BaseMapAdapter } from './baseAdapter'
import { MAP_CONFIG, getBmapAk } from './config'

let scriptLoaded = false
let scriptPromise = null

export function loadBmapScript(ak) {
  if (scriptLoaded) {
    return Promise.resolve(window.BMap)
  }

  if (scriptPromise) {
    return scriptPromise
  }

  scriptPromise = new Promise((resolve, reject) => {
    window.BMap = window.BMap || {}
    window.BMap_loadScriptTime = (new Date()).getTime()
    
    const script = document.createElement('script')
    script.type = 'text/javascript'
    script.src = `https://api.map.baidu.com/api?v=${MAP_CONFIG.bmap.version}&ak=${ak}&callback=onBMapLoad`
    script.async = true
    
    window.onBMapLoad = () => {
      scriptLoaded = true
      delete window.onBMapLoad
      resolve(window.BMap)
    }
    
    script.onerror = () => {
      delete window.onBMapLoad
      reject(new Error('百度地图脚本加载失败'))
    }
    
    document.head.appendChild(script)
  })

  return scriptPromise
}

export class BmapAdapter extends BaseMapAdapter {
  constructor(container, options = {}) {
    super(container, options)
    this.config = { ...MAP_CONFIG.bmap, ...options }
    this.BMap = null
  }

  async init() {
    const ak = this.options.ak || getBmapAk()
    
    if (!ak) {
      throw new Error('请先配置百度地图 AK。可调用 setBmapAk() 或在 localStorage 中设置 bmapAk')
    }

    this.BMap = await loadBmapScript(ak)
    
    const containerElement = typeof this.container === 'string'
      ? document.getElementById(this.container)
      : this.container

    if (!containerElement) {
      throw new Error('Map container not found')
    }

    this.map = new this.BMap.Map(containerElement)
    this.map.centerAndZoom(
      new this.BMap.Point(this.config.center[0], this.config.center[1]),
      this.config.zoom
    )
    this.map.enableScrollWheelZoom(true)
    this.map.enableDragging(true)

    this.map.addEventListener('click', (e) => {
      this.emit('click', { lng: e.point.lng, lat: e.point.lat })
    })

    return this
  }

  setCenter(lng, lat) {
    if (this.map) {
      this.map.setCenter(new this.BMap.Point(lng, lat))
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
    if (!this.map || !this.BMap) return null

    const point = new this.BMap.Point(lng, lat)
    let marker

    if (options.icon) {
      const myIcon = new this.BMap.Icon(options.icon.image, new this.BMap.Size(options.icon.width, options.icon.height))
      marker = new this.BMap.Marker(point, { icon: myIcon })
    } else {
      marker = new this.BMap.Marker(point)
    }

    this.map.addOverlay(marker)

    if (options.onClick) {
      marker.addEventListener('click', (e) => {
        options.onClick({ lng, lat, marker, options, event: e })
      })
    }

    if (options.label) {
      const label = new this.BMap.Label(options.label, {
        offset: new this.BMap.Size(20, -10)
      })
      label.setStyle({
        border: 'none',
        padding: '4px 8px',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        color: '#fff',
        borderRadius: '4px',
        fontSize: '12px'
      })
      marker.setLabel(label)
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
      this.map.removeOverlay(markerWrapper.marker)
      markerWrapper.marker = null
    }
    const index = this.markers.indexOf(markerWrapper)
    if (index > -1) {
      this.markers.splice(index, 1)
    }
  }

  addPolyline(path, options = {}) {
    if (!this.map || !this.BMap) return null

    const points = path.map(p => new this.BMap.Point(p.lng, p.lat))

    const polylineOptions = {
      strokeColor: options.strokeColor || '#409EFF',
      strokeWeight: options.strokeWidth || 3,
      strokeOpacity: options.strokeOpacity || 0.8,
      ...options.polylineOptions
    }

    if (options.strokeDasharray) {
      polylineOptions.strokeStyle = 'dashed'
    }

    const polyline = new this.BMap.Polyline(points, polylineOptions)
    this.map.addOverlay(polyline)

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
      this.map.removeOverlay(polylineWrapper.polyline)
      polylineWrapper.polyline = null
    }
    const index = this.polylines.indexOf(polylineWrapper)
    if (index > -1) {
      this.polylines.splice(index, 1)
    }
  }

  fitBounds(bounds) {
    if (!this.map || !this.BMap || !bounds || !bounds.length) return

    const viewport = this.map.getViewport(bounds.map(p => new this.BMap.Point(p.lng, p.lat)))
    this.map.centerAndZoom(viewport.center, viewport.zoom)
  }

  destroy() {
    this.removeAllMarkers()
    this.removeAllPolylines()
    if (this.map) {
      this.map.clearOverlays()
      this.map = null
    }
  }
}
