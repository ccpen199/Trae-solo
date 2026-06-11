import { useEffect, useRef } from "react"
import * as echarts from "echarts"
import "echarts-wordcloud"

export function useECharts(options: echarts.EChartsOption, deps: unknown[] = []) {
  const chartRef = useRef<HTMLDivElement>(null)
  const instanceRef = useRef<echarts.ECharts | null>(null)

  useEffect(() => {
    if (!chartRef.current) return

    if (!instanceRef.current) {
      instanceRef.current = echarts.init(chartRef.current)
    }

    instanceRef.current.setOption(options, true)

    const handleResize = () => instanceRef.current?.resize()
    window.addEventListener("resize", handleResize)

    return () => {
      window.removeEventListener("resize", handleResize)
    }
  }, deps)

  useEffect(() => {
    return () => {
      instanceRef.current?.dispose()
      instanceRef.current = null
    }
  }, [])

  return chartRef
}
