import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin, Bike, Bell, Navigation, User, QrCode, ChevronRight, Zap } from 'lucide-react'
import { bikeApi, orderApi } from '../services/api'
import { useBikeStore, useOrderStore, useAuthStore } from '../store'

const HomePage = () => {
  const navigate = useNavigate()
  const { nearbyBikes, parkingZones, setNearbyBikes, selectBike, selectedBike, nearestBike } = useBikeStore()
  const { setActiveOrder } = useOrderStore()
  const { user } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [showBikeDetail, setShowBikeDetail] = useState(false)
  const [ringing, setRinging] = useState(false)

  useEffect(() => {
    loadNearbyBikes()
    checkActiveOrder()
  }, [])

  const loadNearbyBikes = async () => {
    try {
      setLoading(true)
      const res = await bikeApi.getNearby(39.9042, 116.4074, 3)
      setNearbyBikes(res.data.bikes, res.data.parkingZones)
    } catch (e) {
      console.error('Failed to load bikes:', e)
    } finally {
      setLoading(false)
    }
  }

  const checkActiveOrder = async () => {
    try {
      const res = await orderApi.getActive()
      if (res.data.hasActiveOrder) {
        setActiveOrder(res.data.order)
        navigate('/riding')
      }
    } catch (e) {
      console.error('Check active order failed:', e)
    }
  }

  const handleBikeSelect = (bike) => {
    selectBike(bike)
    setShowBikeDetail(true)
  }

  const handleRing = async (bike) => {
    if (ringing) return
    setRinging(true)
    try {
      await bikeApi.ring(bike.id)
      alert('响铃成功！车辆已发出提示音')
    } catch (e) {
      alert(e.response?.data?.error || '响铃失败')
    } finally {
      setRinging(false)
    }
  }

  const handleScan = () => {
    navigate('/scan')
  }

  const handleUnlock = (bike) => {
    if (!bike.canRide && bike.battery < 20) {
      alert('车辆电量不足，请换一辆车')
      return
    }
    navigate('/unlock', { state: { bike } })
  }

  return (
    <div style={styles.container}>
      <div style={styles.mapArea}>
        <div style={styles.mapPlaceholder}>
          <div style={styles.mapHeader}>
            <div style={styles.userAvatar}>
              <User size={20} color="#FF6B00" />
            </div>
            <div style={styles.locationText}>
              <MapPin size={14} color="#FF6B00" />
              <span>北京市东城区</span>
            </div>
            <button 
              onClick={() => navigate('/profile')}
              style={styles.profileBtn}
            >
              <User size={22} color="#666" />
            </button>
          </div>

          <div style={styles.mapContent}>
            <div style={styles.myLocation}>
              <div style={styles.myLocationDot}>
                <div style={styles.myLocationPulse} />
              </div>
            </div>

            {nearbyBikes.map((bike, index) => (
              <button
                key={bike.id}
                onClick={() => handleBikeSelect(bike)}
                style={{
                  ...styles.bikeMarker,
                  ...(bike.isNearest ? styles.nearestBikeMarker : {}),
                  left: `${20 + index * 15}%`,
                  top: `${30 + (index % 3) * 20}%`,
                }}
              >
                <Bike size={18} color="#fff" />
                {bike.isNearest && <span style={styles.nearestBadge}>最近</span>}
              </button>
            ))}

            {parkingZones.map((zone, index) => (
              <div
                key={zone.id}
                style={{
                  ...styles.parkingZone,
                  left: `${15 + index * 20}%`,
                  top: `${50 + (index % 2) * 30}%`,
                }}
              >
                <div style={styles.parkingZoneInner}>
                  <MapPin size={16} color="#1890FF" />
                </div>
                <span style={styles.parkingLabel}>{zone.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {!showBikeDetail ? (
        <div style={styles.bottomPanel}>
          <div style={styles.statsRow}>
            <div style={styles.statItem}>
              <span style={styles.statValue}>{nearbyBikes.length}</span>
              <span style={styles.statLabel}>可用车辆</span>
            </div>
            <div style={styles.statDivider} />
            <div style={styles.statItem}>
              <span style={styles.statValue}>{parkingZones.length}</span>
              <span style={styles.statLabel}>还车点</span>
            </div>
            {nearestBike && (
              <>
                <div style={styles.statDivider} />
                <div style={styles.statItem}>
                  <span style={styles.statValue}>{nearestBike.distanceFormatted}</span>
                  <span style={styles.statLabel}>最近车辆</span>
                </div>
              </>
            )}
          </div>

          <button onClick={handleScan} style={styles.scanBtn}>
            <QrCode size={24} color="#fff" />
            <span style={styles.scanBtnText}>扫码用车</span>
          </button>
        </div>
      ) : (
        selectedBike && (
          <div style={styles.bikeDetailPanel}>
            <div style={styles.detailHeader}>
              <div style={styles.detailTitle}>
                <Bike size={20} color="#FF6B00" />
                <span style={styles.bikeCode}>{selectedBike.bike_code}</span>
                {selectedBike.isNearest && (
                  <span style={styles.nearestTag}>最近</span>
                )}
              </div>
              <button 
                onClick={() => setShowBikeDetail(false)}
                style={styles.closeBtn}
              >
                ×
              </button>
            </div>

            <div style={styles.detailInfo}>
              <div style={styles.infoRow}>
                <div style={styles.infoItem}>
                  <Navigation size={16} color="#FF6B00" />
                  <span>{selectedBike.distanceFormatted}</span>
                </div>
                <div style={styles.infoDivider} />
                <div style={styles.infoItem}>
                  <span style={styles.walkIcon}>🚶</span>
                  <span>步行 {selectedBike.walkingTime} 分钟</span>
                </div>
              </div>

              <div style={styles.batteryRow}>
                <div style={styles.batteryInfo}>
                  <Zap size={16} color={selectedBike.battery < 30 ? '#FAAD14' : '#52C41A'} />
                  <span>电量 {selectedBike.battery}%</span>
                </div>
                <span style={styles.rangeText}>
                  可骑行约 {Math.round(selectedBike.max_range * (selectedBike.battery / 100))} 公里
                </span>
              </div>

              <div style={styles.batteryBar}>
                <div 
                  style={{
                    ...styles.batteryFill,
                    width: `${selectedBike.battery}%`,
                    backgroundColor: selectedBike.battery < 30 ? '#FAAD14' : '#52C41A'
                  }}
                />
              </div>
            </div>

            <div style={styles.detailActions}>
              <button
                onClick={() => handleRing(selectedBike)}
                disabled={ringing}
                style={styles.ringBtn}
              >
                <Bell size={20} color="#FF6B00" />
                <span>{ringing ? '响铃中...' : '响铃寻车'}</span>
              </button>
              <button
                onClick={() => handleUnlock(selectedBike)}
                disabled={selectedBike.battery < 20}
                style={{
                  ...styles.unlockBtn,
                  ...(selectedBike.battery < 20 ? styles.unlockBtnDisabled : {})
                }}
              >
                <span>立即开锁</span>
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )
      )}
    </div>
  )
}

const styles = {
  container: {
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#f5f5f5',
  },
  mapArea: {
    flex: 1,
    position: 'relative',
  },
  mapPlaceholder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'linear-gradient(180deg, #E8F4FD 0%, #D5E8F5 100%)',
  },
  mapHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    padding: '12px 16px',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    zIndex: 10,
  },
  userAvatar: {
    width: 36,
    height: 36,
    backgroundColor: '#FFF7E6',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationText: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    fontSize: 14,
    color: '#333',
    backgroundColor: 'rgba(255,255,255,0.9)',
    padding: '8px 12px',
    borderRadius: 20,
  },
  profileBtn: {
    width: 36,
    height: 36,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: '50%',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapContent: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundImage: `
      repeating-linear-gradient(0deg, transparent, transparent 49px, rgba(100,150,200,0.1) 49px, rgba(100,150,200,0.1) 50px),
      repeating-linear-gradient(90deg, transparent, transparent 49px, rgba(100,150,200,0.1) 49px, rgba(100,150,200,0.1) 50px)
    `,
  },
  myLocation: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    transform: 'translate(-50%, -50%)',
  },
  myLocationDot: {
    width: 24,
    height: 24,
    backgroundColor: 'rgba(24, 144, 255, 0.3)',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  myLocationPulse: {
    width: 12,
    height: 12,
    backgroundColor: '#1890FF',
    borderRadius: '50%',
  },
  bikeMarker: {
    position: 'absolute',
    width: 40,
    height: 40,
    backgroundColor: '#FF6B00',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '3px solid #fff',
    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
    cursor: 'pointer',
    border: 'none',
  },
  nearestBikeMarker: {
    width: 48,
    height: 48,
    backgroundColor: '#52C41A',
  },
  nearestBadge: {
    position: 'absolute',
    bottom: -8,
    backgroundColor: '#52C41A',
    color: '#fff',
    fontSize: 10,
    padding: '2px 6px',
    borderRadius: 4,
    whiteSpace: 'nowrap',
  },
  parkingZone: {
    position: 'absolute',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    cursor: 'pointer',
  },
  parkingZoneInner: {
    width: 36,
    height: 36,
    backgroundColor: 'rgba(24, 144, 255, 0.2)',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '2px dashed #1890FF',
  },
  parkingLabel: {
    fontSize: 11,
    color: '#1890FF',
    backgroundColor: 'rgba(255,255,255,0.9)',
    padding: '2px 8px',
    borderRadius: 4,
    marginTop: 4,
    whiteSpace: 'nowrap',
  },
  bottomPanel: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 30,
    boxShadow: '0 -4px 20px rgba(0,0,0,0.1)',
  },
  statsRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  statItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF6B00',
  },
  statLabel: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#f0f0f0',
  },
  scanBtn: {
    width: '100%',
    height: 54,
    backgroundColor: '#FF6B00',
    color: '#fff',
    border: 'none',
    borderRadius: 27,
    fontSize: 18,
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  scanBtnText: {
    fontSize: 18,
  },
  bikeDetailPanel: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 30,
    boxShadow: '0 -4px 20px rgba(0,0,0,0.1)',
  },
  detailHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  detailTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  bikeCode: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  nearestTag: {
    backgroundColor: '#F6FFED',
    color: '#52C41A',
    fontSize: 12,
    padding: '2px 8px',
    borderRadius: 4,
  },
  closeBtn: {
    width: 32,
    height: 32,
    backgroundColor: '#f5f5f5',
    borderRadius: '50%',
    border: 'none',
    fontSize: 20,
    color: '#999',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailInfo: {
    backgroundColor: '#F7F8FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  infoRow: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: 16,
  },
  infoItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 14,
    color: '#333',
  },
  infoDivider: {
    width: 1,
    height: 20,
    backgroundColor: '#e0e0e0',
    margin: '0 16px',
  },
  walkIcon: {
    fontSize: 16,
  },
  batteryRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  batteryInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 14,
    fontWeight: '500',
  },
  rangeText: {
    fontSize: 12,
    color: '#999',
  },
  batteryBar: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  batteryFill: {
    height: '100%',
    borderRadius: 4,
    transition: 'width 0.3s',
  },
  detailActions: {
    display: 'flex',
    gap: 12,
  },
  ringBtn: {
    flex: 1,
    height: 50,
    backgroundColor: '#FFF7E6',
    color: '#FF6B00',
    border: 'none',
    borderRadius: 12,
    fontSize: 15,
    fontWeight: '500',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  unlockBtn: {
    flex: 2,
    height: 50,
    backgroundColor: '#FF6B00',
    color: '#fff',
    border: 'none',
    borderRadius: 12,
    fontSize: 16,
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  unlockBtnDisabled: {
    backgroundColor: '#ccc',
    cursor: 'not-allowed',
  },
}

export default HomePage
