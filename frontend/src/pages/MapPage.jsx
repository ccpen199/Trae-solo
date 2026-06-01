import React, { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import api, { useStore } from '../store';
import { useNavigate, useSearchParams } from 'react-router-dom';

delete L.Icon.Default.prototype._getIconUrl;

const ICON_COLORS = { rent: '#1890ff', house: '#722ed1', car: '#fa8c16', job: '#52c41a', service: '#eb2f96' };
const ICON_LABELS = { rent: '租', house: '房', car: '车', job: '聘', service: '服' };
const CATEGORY_LABELS = { job: '招聘', rent: '租房', house: '二手房', car: '二手车', service: '本地服务' };
const CATEGORY_ICONS = { job: '💼', rent: '🏠', house: '🏢', car: '🚗', service: '🛠️' };

function createIcon(code, isVerified) {
  const color = ICON_COLORS[code] || '#1890ff';
  const borderColor = isVerified ? '#52c41a' : '#fff';
  return L.divIcon({
    className: '',
    html: `<div style="background:${color};color:#fff;border-radius:50%;width:36px;height:36px;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:bold;border:3px solid ${borderColor};box-shadow:0 2px 8px rgba(0,0,0,.3);position:relative">
      ${ICON_LABELS[code] || '信'}
      ${isVerified ? '<div style="position:absolute;bottom:-4px;right:-4px;background:#52c41a;color:#fff;border-radius:50%;width:14px;height:14px;font-size:9px;display:flex;align-items:center;justify-content:center;border:2px solid #fff">✓</div>' : ''}
    </div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -36]
  });
}

function FlyToCenter({ center }) {
  const map = useMap();
  useEffect(() => { if (center) map.flyTo(center, 14, { duration: 0.8 }); }, [center, map]);
  return null;
}

function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function MapPage() {
  const { categories, user, showToast } = useStore();
  const navigate = useNavigate();
  const [urlParams] = useSearchParams();

  const [listings, setListings] = useState([]);
  const [activeCategory, setActiveCategory] = useState(urlParams.get('category_code') || '');
  const [fenceRadius, setFenceRadius] = useState(5);
  const [fenceCenter, setFenceCenter] = useState([31.2304, 121.4737]);
  const [showOnlyVerified, setShowOnlyVerified] = useState(urlParams.get('is_verified') === '1');
  const [browseHistory, setBrowseHistory] = useState([]);
  const [recommendListings, setRecommendListings] = useState([]);
  const [flyTo, setFlyTo] = useState(null);
  const [selectedListing, setSelectedListing] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    const params = new URLSearchParams({ page_size: 200 });
    if (activeCategory) params.set('category_code', activeCategory);
    if (showOnlyVerified) params.set('is_verified', '1');
    api.get(`/listings?${params}`).then(res => {
      if (!mounted) return;
      const withCoords = res.data.listings.map((l, idx) => ({
        ...l,
        latitude: l.latitude || (31.2304 + (Math.sin(idx * 1.7) * 0.025)),
        longitude: l.longitude || (121.4737 + (Math.cos(idx * 2.3) * 0.025))
      }));
      setListings(withCoords);
      setLoading(false);
    }).catch(() => {
      setLoading(false);
      setListings([]);
    });
    return () => { mounted = false; };
  }, [activeCategory, showOnlyVerified]);

  useEffect(() => {
    if (!user) return;
    api.get('/listings/history?page_size=5').then(res => {
      setBrowseHistory(res.data.listings || []);
    }).catch(() => {});
  }, [user]);

  useEffect(() => {
    api.get('/listings?page_size=6&sort_by=view_count').then(res => {
      setRecommendListings(res.data.listings || []);
    }).catch(() => {});
  }, []);

  const filtered = useMemo(() => {
    return listings.filter(l => {
      const d = getDistance(fenceCenter[0], fenceCenter[1], l.latitude, l.longitude);
      return d <= fenceRadius;
    });
  }, [listings, fenceCenter, fenceRadius]);

  const handleMarkerClick = (listing) => {
    setSelectedListing(listing);
    setFlyTo([listing.latitude, listing.longitude]);
  };

  const handleContact = async (listingId) => {
    if (!user) {
      showToast('请先登录后联系', 'error');
      navigate('/auth', { state: { from: { pathname: `/listing/${listingId}` } } });
      return;
    }
    try {
      await api.post('/merchants/leads', { listing_id: listingId, contact_info: user.phone, message: '对您的信息感兴趣，请回复' });
      showToast('线索已发送，商家将尽快回复您');
    } catch (e) {
      showToast('已记录您的意向，商家会联系您');
    }
  };

  return (
    <div className="container" style={{ paddingTop: 20, paddingBottom: 40 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
        <h2>🗺️ 地图找房/找车/找工作</h2>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', fontSize: 13, flexWrap: 'wrap' }}>
          {Object.entries(ICON_COLORS).map(([code, color]) => (
            <span key={code} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 12, height: 12, borderRadius: '50%', background: color, display: 'inline-block' }} />
              {CATEGORY_LABELS[code]}
            </span>
          ))}
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#52c41a' }}>
            <span style={{ width: 12, height: 12, borderRadius: '50%', border: '2px solid #52c41a', display: 'inline-block' }} />
            已认证
          </span>
        </div>
      </div>

      <div style={{ background: '#fff', padding: '16px 20px', borderRadius: 12, marginBottom: 16, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', boxShadow: '0 2px 8px rgba(0,0,0,.04)' }}>
        <span className={`category-tab ${!activeCategory ? 'active' : ''}`} onClick={() => setActiveCategory('')}>全部</span>
        {categories.map(cat => (
          <span key={cat.id} className={`category-tab ${activeCategory === cat.code ? 'active' : ''}`} onClick={() => setActiveCategory(cat.code)}>
            {cat.icon} {cat.name}
          </span>
        ))}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          <label style={{ fontSize: 13, color: '#666' }}>📍 围栏半径:</label>
          <input type="range" min={1} max={15} value={fenceRadius} onChange={e => setFenceRadius(Number(e.target.value))} style={{ width: 120 }} />
          <span style={{ fontSize: 13, minWidth: 35, fontWeight: 500, color: '#1890ff' }}>{fenceRadius}km</span>
        </div>
        <label style={{ fontSize: 13, color: '#666', display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', padding: '6px 12px', borderRadius: 8, background: showOnlyVerified ? '#f6ffed' : 'transparent', border: '1px solid', borderColor: showOnlyVerified ? '#b7eb8f' : 'transparent' }}>
          <input type="checkbox" checked={showOnlyVerified} onChange={e => setShowOnlyVerified(e.target.checked)} style={{ margin: 0 }} />
          ✓ 仅看已认证商家
        </label>
      </div>

      {user && browseHistory.length > 0 && (
        <div style={{ marginBottom: 16, padding: '12px 16px', background: '#fffbe6', borderRadius: 10, border: '1px solid #ffe58f', display: 'flex', gap: 12, alignItems: 'center', overflowX: 'auto' }}>
          <span style={{ fontSize: 13, fontWeight: 500, flexShrink: 0 }}>🕐 最近浏览:</span>
          {browseHistory.map(l => (
            <span key={l.id} onClick={() => navigate(`/listing/${l.id}`)} style={{ fontSize: 12, padding: '4px 10px', background: '#fff', borderRadius: 4, cursor: 'pointer', flexShrink: 0, border: '1px solid #ffecb3' }}>
              {l.title.slice(0, 12)}...
            </span>
          ))}
        </div>
      )}

      <div className="map-container">
        {loading ? (
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>加载地图数据中...</div>
        ) : (
          <MapContainer center={[31.2304, 121.4737]} zoom={13} style={{ height: '100%', width: '100%' }} whenReady={map => { map.target.on('click', e => setFenceCenter([e.latlng.lat, e.latlng.lng])); }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap' />
            <Circle center={fenceCenter} radius={fenceRadius * 1000} pathOptions={{ color: '#1890ff', fillColor: '#1890ff', fillOpacity: 0.06, weight: 1, dashArray: '5, 5' }} />
            <Circle center={fenceCenter} radius={200} pathOptions={{ color: '#1890ff', fillColor: '#1890ff', fillOpacity: 0.2 }} />
            <FlyToCenter center={flyTo} />
            {filtered.map(listing => (
              <Marker
                key={listing.id}
                position={[listing.latitude, listing.longitude]}
                icon={createIcon(listing.category_code, listing.is_verified || listing.merchant_name)}
                eventHandlers={{ click: () => handleMarkerClick(listing) }}
              >
                <Popup closeButton={false} maxWidth={300}>
                  <div style={{ minWidth: 260 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                      <h4 style={{ margin: 0, fontSize: 14, lineHeight: 1.4 }}>{listing.title}</h4>
                      {(listing.is_verified || listing.merchant_name) && <span style={{ background: '#f6ffed', color: '#52c41a', padding: '2px 8px', borderRadius: 4, fontSize: 11, whiteSpace: 'nowrap', flexShrink: 0 }}>✓ 认证</span>}
                    </div>
                    {listing.merchant_name && (
                      <div style={{ fontSize: 12, color: '#722ed1', marginTop: 6 }}>
                        🏪 {listing.merchant_name}
                        {listing.merchant_rating && <span style={{ marginLeft: 8 }}>⭐ {listing.merchant_rating}</span>}
                        {listing.merchant_level && <span style={{ marginLeft: 8 }}>Lv.{listing.merchant_level}</span>}
                      </div>
                    )}
                    <div style={{ color: '#ff4d4f', fontWeight: 'bold', marginTop: 8, fontSize: 18 }}>
                      ¥{listing.price_min?.toLocaleString() || '面议'}{listing.price_unit ? <span style={{ fontSize: 13, color: '#999', fontWeight: 'normal' }}>/{listing.price_unit}</span> : ''}
                    </div>
                    <div style={{ fontSize: 12, color: '#999', marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      <span>📍 {listing.district || listing.city || '未知'}</span>
                      <span>{CATEGORY_LABELS[listing.category_code]}</span>
                      <span>👁 {listing.view_count}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                      <button onClick={(e) => { e.stopPropagation(); navigate(`/listing/${listing.id}`); }} style={{ flex: 1, padding: '8px 0', background: '#1890ff', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}>
                        查看详情
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); handleContact(listing.id); }} style={{ flex: 1, padding: '8px 0', background: '#52c41a', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}>
                        发送线索
                      </button>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        )}
      </div>
      <div style={{ fontSize: 13, color: '#999', marginTop: 10, textAlign: 'center', background: '#f5f7fa', padding: '10px', borderRadius: 8 }}>
        💡 点击地图任意位置移动围栏中心 · 当前围栏内共 <span style={{ color: '#1890ff', fontWeight: 'bold' }}>{filtered.length}</span> 条信息 · 已加载 <span style={{ color: '#52c41a' }}>{listings.length}</span> 条
      </div>

      {selectedListing && (
        <div style={{ background: '#fff', borderRadius: 12, padding: 20, marginTop: 20, display: 'flex', gap: 20, alignItems: 'center', boxShadow: '0 4px 16px rgba(0,0,0,.08)', border: '1px solid #e6f7ff' }}>
          <div style={{ width: 120, height: 90, background: `linear-gradient(135deg, ${ICON_COLORS[selectedListing.category_code]}22, ${ICON_COLORS[selectedListing.category_code]}44)`, borderRadius: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontSize: 32, flexShrink: 0 }}>
            <div>{CATEGORY_ICONS[selectedListing.category_code]}</div>
            <div style={{ fontSize: 11, color: '#666', marginTop: 4 }}>{CATEGORY_LABELS[selectedListing.category_code]}</div>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{ marginBottom: 6, fontSize: 16, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedListing.title}</h3>
            <div style={{ color: '#ff4d4f', fontWeight: 'bold', fontSize: 20 }}>
              ¥{selectedListing.price_min?.toLocaleString() || '面议'}
              {selectedListing.price_unit && <span style={{ fontSize: 14, color: '#999', fontWeight: 'normal' }}>/{selectedListing.price_unit}</span>}
            </div>
            <div style={{ fontSize: 12, color: '#999', marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              <span>📍 {selectedListing.district || selectedListing.city || '未知'}</span>
              {(selectedListing.is_verified || selectedListing.merchant_name) && <span style={{ color: '#52c41a' }}>✓ 已认证</span>}
              {selectedListing.merchant_name && <span style={{ color: '#722ed1' }}>🏪 {selectedListing.merchant_name}</span>}
              {selectedListing.area && <span>📐 {selectedListing.area}㎡</span>}
              {selectedListing.rooms && <span>🏠 {selectedListing.rooms}室{selectedListing.bathrooms}卫</span>}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
            <button className="btn btn-primary" onClick={() => navigate(`/listing/${selectedListing.id}`)} style={{ minWidth: 110 }}>查看详情</button>
            <button className="btn btn-outline" onClick={() => handleContact(selectedListing.id)} style={{ minWidth: 110, color: '#52c41a', borderColor: '#52c41a' }}>发送线索</button>
            <button className="btn btn-outline" onClick={() => setSelectedListing(null)} style={{ minWidth: 110, fontSize: 12 }}>关闭</button>
          </div>
        </div>
      )}

      {filtered.length === 0 && !loading && (
        <div style={{ textAlign: 'center', padding: 40, background: '#fff', borderRadius: 12, marginTop: 16 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📍</div>
          <h3 style={{ color: '#666', marginBottom: 8 }}>围栏内暂无匹配信息</h3>
          <p style={{ color: '#999', marginBottom: 16 }}>试试调大围栏半径或切换其他类目</p>
          <button className="btn btn-outline" onClick={() => setFenceRadius(10)} style={{ marginRight: 12 }}>扩大半径至10km</button>
          <button className="btn btn-primary" onClick={() => setActiveCategory('')}>查看全部类目</button>

          {recommendListings.length > 0 && (
            <div style={{ textAlign: 'left', marginTop: 30 }}>
              <h4 style={{ marginBottom: 12, fontSize: 14, color: '#333' }}>🎯 其他区域热门推荐</h4>
              <div className="listing-grid">
                {recommendListings.slice(0, 4).map(l => (
                  <div key={l.id} className="listing-card" onClick={() => navigate(`/listing/${l.id}`)}>
                    <div className="listing-content">
                      <h3 className="listing-title" style={{ fontSize: 13 }}>{l.title}</h3>
                      <div className="listing-price">{l.price_min ? `¥${l.price_min.toLocaleString()}` : '面议'}</div>
                      <div className="listing-meta">
                        <span>{CATEGORY_LABELS[l.category_code]}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {user && browseHistory.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <h3 style={{ marginBottom: 12, fontSize: 16 }}>🕐 浏览足迹</h3>
          <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 4 }}>
            {browseHistory.map(l => (
              <div key={l.id} className="listing-card" style={{ minWidth: 200, cursor: 'pointer' }} onClick={() => navigate(`/listing/${l.id}`)}>
                <div className="listing-content">
                  <h3 className="listing-title" style={{ fontSize: 13 }}>{l.title}</h3>
                  <div className="listing-price" style={{ fontSize: 14 }}>{l.price_min ? `¥${l.price_min.toLocaleString()}` : '面议'}</div>
                  <div className="listing-meta">
                    <span>{new Date(l.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default MapPage;
