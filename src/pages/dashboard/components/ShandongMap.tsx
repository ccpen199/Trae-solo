import { useEffect, useRef, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts';
import type { EChartsOption } from 'echarts';
import type { MapHeatData } from '../../../services/api/analytics';
import { cities } from '../../../utils/region';
import './ShandongMap.css';

interface ShandongMapProps {
  data: MapHeatData[];
  onDrillDown: (region: MapHeatData) => void;
  currentLevel: 'province' | 'city' | 'district';
}

const ShandongMap = ({ data, onDrillDown, currentLevel }: ShandongMapProps) => {
  const chartRef = useRef<ReactECharts>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    const loadMapData = async () => {
      try {
        const shandongGeoJson = {
          type: 'FeatureCollection',
          features: cities.map((city, index) => {
            const angle = (index / cities.length) * Math.PI * 2;
            const radius = 8 + Math.random() * 2;
            const centerLng = 118.5 + Math.cos(angle) * radius;
            const centerLat = 36.5 + Math.sin(angle) * radius * 0.8;
            
            const points = [];
            const numPoints = 8 + Math.floor(Math.random() * 4);
            for (let i = 0; i < numPoints; i++) {
              const pointAngle = (i / numPoints) * Math.PI * 2;
              const pointRadius = 1 + Math.random() * 1.5;
              points.push([
                centerLng + Math.cos(pointAngle) * pointRadius,
                centerLat + Math.sin(pointAngle) * pointRadius
              ]);
            }
            points.push(points[0]);

            return {
              type: 'Feature',
              properties: {
                name: city.name,
                adcode: city.code,
                level: 'city'
              },
              geometry: {
                type: 'Polygon',
                coordinates: [points]
              }
            };
          })
        };

        echarts.registerMap('shandong', shandongGeoJson as any);
        setMapLoaded(true);
      } catch (error) {
        console.error('加载地图数据失败:', error);
        setMapLoaded(true);
      }
    };

    loadMapData();
  }, []);

  const getOption = (): EChartsOption => {
    const visualMax = Math.max(...data.map(d => d.value), 100);
    
    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(13, 33, 55, 0.95)',
        borderColor: 'rgba(0, 212, 255, 0.5)',
        borderWidth: 1,
        textStyle: {
          color: '#e0e6ed',
          fontSize: 14
        },
        padding: [12, 16],
        formatter: (params: any) => {
          const itemData = data.find(d => d.name === params.name);
          if (!itemData) return params.name;
          
          return `
            <div style="font-weight: 600; font-size: 16px; margin-bottom: 8px; color: #00d4ff;">
              ${params.name}
            </div>
            <div style="display: grid; grid-template-columns: auto auto; gap: 4px 12px; font-size: 13px;">
              <span style="color: rgba(224, 230, 237, 0.7);">场所总数:</span>
              <span style="color: #fff; font-weight: 600;">${itemData.placeCount.toLocaleString()} 家</span>
              <span style="color: rgba(224, 230, 237, 0.7);">在线场所:</span>
              <span style="color: #00ff88; font-weight: 600;">${itemData.onlineCount.toLocaleString()} 家</span>
              <span style="color: rgba(224, 230, 237, 0.7);">今日客流:</span>
              <span style="color: #ffd700; font-weight: 600;">${itemData.visitorCount.toLocaleString()} 人次</span>
              <span style="color: rgba(224, 230, 237, 0.7);">告警数量:</span>
              <span style="color: #ff4757; font-weight: 600;">${itemData.alarmCount} 条</span>
            </div>
            <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid rgba(0, 212, 255, 0.2); font-size: 12px; color: rgba(224, 230, 237, 0.5);">
              点击查看下一级详情
            </div>
          `;
        }
      },
      visualMap: {
        type: 'continuous',
        min: 0,
        max: visualMax,
        left: 20,
        bottom: 20,
        text: ['高', '低'],
        textStyle: {
          color: 'rgba(224, 230, 237, 0.7)',
          fontSize: 12
        },
        calculable: true,
        inRange: {
          color: [
            'rgba(0, 80, 120, 0.3)',
            'rgba(0, 150, 200, 0.5)',
            'rgba(0, 212, 255, 0.7)',
            'rgba(0, 255, 136, 0.8)',
            'rgba(255, 215, 0, 0.9)'
          ]
        },
        itemWidth: 15,
        itemHeight: 120,
        showLabel: true
      },
      geo: {
        map: 'shandong',
        roam: true,
        zoom: 1.2,
        center: [118.5, 36.5],
        label: {
          show: true,
          color: '#e0e6ed',
          fontSize: 12,
          fontWeight: 500
        },
        itemStyle: {
          areaColor: 'rgba(0, 50, 80, 0.3)',
          borderColor: 'rgba(0, 212, 255, 0.4)',
          borderWidth: 1
        },
        emphasis: {
          label: {
            show: true,
            color: '#fff',
            fontSize: 14,
            fontWeight: 600
          },
          itemStyle: {
            areaColor: 'rgba(0, 212, 255, 0.4)',
            borderColor: '#00d4ff',
            borderWidth: 2,
            shadowColor: 'rgba(0, 212, 255, 0.5)',
            shadowBlur: 20
          }
        }
      },
      series: [
        {
          name: '场所分布',
          type: 'map',
          map: 'shandong',
          geoIndex: 0,
          data: data.map(d => ({
            name: d.name,
            value: d.value,
            ...d
          }))
        },
        {
          name: '场所标记',
          type: 'effectScatter',
          coordinateSystem: 'geo',
          data: data.map((d, index) => {
            const city = cities.find(c => c.code === d.code || c.name === d.name);
            const baseLng = city ? 118.5 + (index - cities.length / 2) * 1.5 : 118.5;
            const baseLat = city ? 36.5 + (index % 4 - 2) * 1.2 : 36.5;
            
            return {
              name: d.name,
              value: [
                baseLng + (Math.random() - 0.5) * 2,
                baseLat + (Math.random() - 0.5) * 2,
                d.placeCount
              ],
              symbolSize: Math.max(8, Math.min(25, d.placeCount / 100)),
              itemStyle: {
                color: d.alarmCount > 20 ? '#ff4757' : d.alarmCount > 10 ? '#ffd700' : '#00ff88',
                shadowBlur: 10,
                shadowColor: d.alarmCount > 20 ? '#ff4757' : d.alarmCount > 10 ? '#ffd700' : '#00ff88'
              }
            };
          }),
          rippleEffect: {
            brushType: 'stroke',
            scale: 3,
            period: 4
          },
          showEffectOn: 'render',
          zlevel: 2
        },
        {
          name: '热点标记',
          type: 'scatter',
          coordinateSystem: 'geo',
          data: data
            .filter(d => d.visitorCount > 50000)
            .map((d, index) => {
              const baseLng = 118.5 + (index - data.filter(x => x.visitorCount > 50000).length / 2) * 1.8;
              const baseLat = 36.5 + (index % 3 - 1) * 1.5;
              
              return {
                name: d.name,
                value: [
                  baseLng + (Math.random() - 0.5),
                  baseLat + (Math.random() - 0.5),
                  d.visitorCount
                ],
                symbolSize: 12,
                itemStyle: {
                  color: '#ffd700',
                  shadowBlur: 15,
                  shadowColor: '#ffd700'
                }
              };
            }),
          zlevel: 3
        }
      ]
    };
  };

  const getFallbackOption = (): EChartsOption => {
    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        },
        backgroundColor: 'rgba(13, 33, 55, 0.95)',
        borderColor: 'rgba(0, 212, 255, 0.5)',
        borderWidth: 1,
        textStyle: {
          color: '#e0e6ed',
          fontSize: 14
        }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: '10%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: data.map(d => d.name.replace('市', '')),
        axisLine: {
          lineStyle: {
            color: 'rgba(0, 212, 255, 0.3)'
          }
        },
        axisLabel: {
          color: 'rgba(224, 230, 237, 0.7)',
          fontSize: 11,
          rotate: 30
        }
      },
      yAxis: {
        type: 'value',
        axisLine: {
          show: false
        },
        splitLine: {
          lineStyle: {
            color: 'rgba(0, 212, 255, 0.1)'
          }
        },
        axisLabel: {
          color: 'rgba(224, 230, 237, 0.7)',
          fontSize: 11
        }
      },
      series: [
        {
          name: '场所数量',
          type: 'bar',
          data: data.map(d => ({
            value: d.placeCount,
            itemStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: 'rgba(0, 212, 255, 0.9)' },
                { offset: 1, color: 'rgba(0, 128, 255, 0.6)' }
              ]),
              borderRadius: [4, 4, 0, 0]
            }
          })),
          barWidth: '50%',
          emphasis: {
            itemStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: 'rgba(0, 255, 136, 0.9)' },
                { offset: 1, color: 'rgba(0, 204, 106, 0.6)' }
              ])
            }
          }
        }
      ]
    };
  };

  const handleChartClick = (params: any) => {
    if (params.data && params.data.code) {
      const regionData = data.find(d => d.code === params.data.code || d.name === params.name);
      if (regionData) {
        onDrillDown(regionData);
      }
    } else if (params.name) {
      const regionData = data.find(d => d.name === params.name);
      if (regionData) {
        onDrillDown(regionData);
      }
    }
  };

  const onEvents = {
    click: handleChartClick
  };

  return (
    <div className="shandong-map-container">
      {!mapLoaded ? (
        <div className="map-loading">
          <div className="loading-spinner" />
          <span>地图加载中...</span>
        </div>
      ) : (
        <>
          <div className="map-legend">
            <div className="legend-title">图例说明</div>
            <div className="legend-items">
              <div className="legend-item">
                <span className="legend-dot" style={{ background: '#00ff88', boxShadow: '0 0 8px #00ff88' }} />
                <span>正常</span>
              </div>
              <div className="legend-item">
                <span className="legend-dot" style={{ background: '#ffd700', boxShadow: '0 0 8px #ffd700' }} />
                <span>关注</span>
              </div>
              <div className="legend-item">
                <span className="legend-dot" style={{ background: '#ff4757', boxShadow: '0 0 8px #ff4757' }} />
                <span>告警</span>
              </div>
              <div className="legend-item">
                <span className="legend-dot hotspot" />
                <span>客流热点</span>
              </div>
            </div>
          </div>
          <ReactECharts
            ref={chartRef}
            option={mapLoaded && data.length > 0 ? getOption() : getFallbackOption()}
            style={{ width: '100%', height: '100%' }}
            onEvents={onEvents}
            opts={{ renderer: 'canvas' }}
          />
          <div className="map-level-indicator">
            当前层级: {currentLevel === 'province' ? '省级' : currentLevel === 'city' ? '市级' : '区县级'}
          </div>
        </>
      )}
    </div>
  );
};

export default ShandongMap;
