import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Search,
  X,
  List as ListIcon,
  Map as MapIcon,
  Phone,
  Navigation,
  MapPin,
  Building2,
  UtensilsCrossed,
  Heart,
} from "lucide-react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import AppLayout from "@/components/AppLayout";
import TabBar from "@/components/TabBar";
import Empty from "@/components/Empty";
import { poiApi } from "@/api";
import { useLocation } from "@/hooks/useLocation";
import type { PointOfInterest, PoiType } from "../../shared/types";
import { haversineDistance } from "@/utils/format";
import { cn } from "@/lib/utils";

const POI_TABS = [
  { key: "all", label: "全部" },
  { key: "scenic", label: "A级景区" },
  { key: "restaurant", label: "餐饮评级" },
  { key: "medical", label: "医疗机构" },
];

const POI_TYPE_CONFIG: Record<PoiType, { label: string; color: string; bgColor: string; icon: typeof Building2 }> = {
  scenic: {
    label: "景区",
    color: "#10b981",
    bgColor: "#d1fae5",
    icon: MapPin,
  },
  restaurant: {
    label: "餐饮",
    color: "#f59e0b",
    bgColor: "#fef3c7",
    icon: UtensilsCrossed,
  },
  medical: {
    label: "医疗",
    color: "#ef4444",
    bgColor: "#fee2e2",
    icon: Heart,
  },
};

const SOURCE_CONFIG: Record<string, { label: string; icon: typeof Building2; color: string }> = {
  "青岛市文化和旅游局": { label: "文旅局", icon: Building2, color: "#10b981" },
  "青岛市商务局": { label: "市场监管局", icon: Building2, color: "#f59e0b" },
  "青岛市卫生健康委员会": { label: "卫健委", icon: Building2, color: "#ef4444" },
};

function createCustomIcon(color: string) {
  return L.divIcon({
    className: "custom-marker",
    html: `<div style="background-color: ${color}; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.25); font-size: 14px;">●</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
}

function formatDistance(distanceKm: number): string {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)}米`;
  }
  return `${distanceKm.toFixed(1)}公里`;
}

function PoiCard({
  poi,
  distance,
  onClick,
}: {
  poi: PointOfInterest;
  distance?: number;
  onClick: () => void;
}) {
  const typeConfig = POI_TYPE_CONFIG[poi.type];
  const TypeIcon = typeConfig.icon;
  const sourceConfig = SOURCE_CONFIG[poi.source] || {
    label: poi.source,
    icon: Building2,
    color: "#64748b",
  };
  const SourceIcon = sourceConfig.icon;

  return (
    <div
      className="bg-white rounded-2xl shadow-card p-4 cursor-pointer hover:shadow-card-hover transition-all duration-300"
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: typeConfig.bgColor }}
        >
          <TypeIcon
            className="w-6 h-6"
            style={{ color: typeConfig.color }}
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-base font-semibold text-slate-800 line-clamp-1">
              {poi.name}
            </h3>
            <div
              className="flex-shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-full"
              style={{
                backgroundColor: typeConfig.bgColor,
                color: typeConfig.color,
              }}
            >
              <span className="text-xs font-medium">{poi.rating}</span>
            </div>
          </div>
          {poi.level && (
            <p className="text-xs text-slate-500 mt-0.5">{poi.level}</p>
          )}
          <p className="text-sm text-slate-600 mt-1.5 line-clamp-1">
            <MapPin className="w-3.5 h-3.5 inline -mt-0.5 mr-1 text-slate-400" />
            {poi.address}
          </p>
          {distance !== undefined && (
            <p className="text-xs text-brand-600 mt-1 font-medium">
              距您 {formatDistance(distance)}
            </p>
          )}
          <div className="flex items-center justify-between mt-3">
            <div className="flex flex-wrap gap-1.5">
              {poi.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600"
                >
                  {tag}
                </span>
              ))}
            </div>
            <div
              className="flex items-center gap-1 px-2 py-1 rounded-lg"
              style={{
                backgroundColor: `${sourceConfig.color}15`,
                color: sourceConfig.color,
              }}
            >
              <SourceIcon className="w-3 h-3" />
              <span className="text-xs font-medium">{sourceConfig.label}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PoiDetailModal({
  poi,
  distance,
  onClose,
}: {
  poi: PointOfInterest;
  distance?: number;
  onClose: () => void;
}) {
  const typeConfig = POI_TYPE_CONFIG[poi.type];
  const TypeIcon = typeConfig.icon;
  const sourceConfig = SOURCE_CONFIG[poi.source] || {
    label: poi.source,
    icon: Building2,
    color: "#64748b",
  };
  const SourceIcon = sourceConfig.icon;

  const handleNavigation = () => {
    const url = `https://uri.amap.com/marker?position=${poi.lng},${poi.lat}&name=${encodeURIComponent(poi.name)}`;
    window.open(url, "_blank");
  };

  const handleCall = () => {
    if (poi.phone) {
      window.location.href = `tel:${poi.phone}`;
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white rounded-t-3xl max-h-[85vh] overflow-y-auto animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white z-10 px-5 pt-4 pb-3 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center"
                style={{ backgroundColor: typeConfig.bgColor }}
              >
                <TypeIcon
                  className="w-6 h-6"
                  style={{ color: typeConfig.color }}
                />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-800">
                  {poi.name}
                </h2>
                <div className="flex items-center gap-2 mt-0.5">
                  <span
                    className="text-xs px-2 py-0.5 rounded-full"
                    style={{
                      backgroundColor: typeConfig.bgColor,
                      color: typeConfig.color,
                    }}
                  >
                    {poi.rating}
                  </span>
                  {poi.level && (
                    <span className="text-xs text-slate-500">{poi.level}</span>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>
        </div>

        <div className="p-5 space-y-5">
          {poi.description && (
            <div>
              <h4 className="text-sm font-semibold text-slate-700 mb-2">
                简介
              </h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                {poi.description}
              </p>
            </div>
          )}

          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
                <MapPin className="w-5 h-5 text-slate-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-700">地址</p>
                <p className="text-sm text-slate-500 mt-0.5">{poi.address}</p>
                {distance !== undefined && (
                  <p className="text-xs text-brand-600 mt-1 font-medium">
                    距您当前位置 {formatDistance(distance)}
                  </p>
                )}
              </div>
            </div>

            {poi.phone && (
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
                  <Phone className="w-5 h-5 text-emerald-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-700">联系电话</p>
                  <p className="text-sm text-emerald-600 mt-0.5">
                    {poi.phone}
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-start gap-3">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${sourceConfig.color}15` }}
              >
                <SourceIcon
                  className="w-5 h-5"
                  style={{ color: sourceConfig.color }}
                />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-700">来源部门</p>
                <p
                  className="text-sm mt-0.5"
                  style={{ color: sourceConfig.color }}
                >
                  {sourceConfig.label}
                </p>
              </div>
            </div>
          </div>

          {poi.tags.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-slate-700 mb-2">
                标签
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {poi.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-600"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="sticky bottom-0 bg-white border-t border-slate-100 p-4 flex gap-3">
          {poi.phone && (
            <button
              onClick={handleCall}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-emerald-500 text-white font-medium hover:bg-emerald-600 transition-colors"
            >
              <Phone className="w-5 h-5" />
              拨打电话
            </button>
          )}
          <button
            onClick={handleNavigation}
            className={cn(
              "flex items-center justify-center gap-2 py-3 rounded-2xl text-white font-medium transition-colors",
              poi.phone
                ? "flex-1 bg-brand-500 hover:bg-brand-600"
                : "flex-1 bg-brand-500 hover:bg-brand-600"
            )}
          >
            <Navigation className="w-5 h-5" />
            导航前往
          </button>
        </div>
      </div>
    </div>
  );
}

function ListView({
  pois,
  userLocation,
  onSelectPoi,
}: {
  pois: PointOfInterest[];
  userLocation: { lat: number; lng: number };
  onSelectPoi: (poi: PointOfInterest) => void;
}) {
  const sortedPois = useMemo(() => {
    return [...pois]
      .map((poi) => ({
        ...poi,
        distance: haversineDistance(
          { lat: userLocation.lat, lng: userLocation.lng },
          { lat: poi.lat, lng: poi.lng }
        ),
      }))
      .sort((a, b) => a.distance - b.distance);
  }, [pois, userLocation]);

  if (sortedPois.length === 0) {
    return <Empty />;
  }

  return (
    <div className="space-y-3">
      {sortedPois.map((poi) => (
        <PoiCard
          key={poi.id}
          poi={poi}
          distance={poi.distance}
          onClick={() => onSelectPoi(poi)}
        />
      ))}
    </div>
  );
}

function MapView({
  pois,
  userLocation,
  onSelectPoi,
}: {
  pois: PointOfInterest[];
  userLocation: { lat: number; lng: number };
  onSelectPoi: (poi: PointOfInterest) => void;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-card overflow-hidden h-[calc(100vh-260px)]">
      <MapContainer
        center={[userLocation.lat, userLocation.lng]}
        zoom={12}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap'
        />
        {pois.map((poi) => {
          const typeConfig = POI_TYPE_CONFIG[poi.type];
          const distance = haversineDistance(
            { lat: userLocation.lat, lng: userLocation.lng },
            { lat: poi.lat, lng: poi.lng }
          );
          return (
            <Marker
              key={poi.id}
              position={[poi.lat, poi.lng]}
              icon={createCustomIcon(typeConfig.color)}
              eventHandlers={{
                click: () => onSelectPoi(poi),
              }}
            >
              <Popup>
                <div className="min-w-[200px]">
                  <h4 className="font-semibold text-slate-800">{poi.name}</h4>
                  <p className="text-xs text-slate-500 mt-1">{poi.rating}</p>
                  <p className="text-xs text-slate-600 mt-1.5 line-clamp-2">
                    {poi.address}
                  </p>
                  <p className="text-xs text-brand-600 mt-1 font-medium">
                    {formatDistance(distance)}
                  </p>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}

export default function PoiPage() {
  const navigate = useNavigate();
  const { location } = useLocation();
  const [activeType, setActiveType] = useState("all");
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [pois, setPois] = useState<PointOfInterest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPoi, setSelectedPoi] = useState<PointOfInterest | null>(null);

  useEffect(() => {
    const fetchPois = async () => {
      try {
        setLoading(true);
        const type =
          activeType === "all" ? undefined : (activeType as PoiType);
        const data = await poiApi.getList({
          type,
          keyword: searchKeyword || undefined,
          lat: location.lat,
          lng: location.lng,
        });
        setPois(data);
      } catch (error) {
        console.error("Failed to fetch POIs:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPois();
  }, [activeType, searchKeyword, location.lat, location.lng]);

  const handleSelectPoi = (poi: PointOfInterest) => {
    setSelectedPoi(poi);
  };

  const selectedDistance = selectedPoi
    ? haversineDistance(
        { lat: location.lat, lng: location.lng },
        { lat: selectedPoi.lat, lng: selectedPoi.lng }
      )
    : undefined;

  return (
    <AppLayout>
      <div className="sticky top-0 z-20 bg-white border-b border-slate-100">
        <div className="flex items-center h-14 px-4">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 -ml-2 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-700" />
          </button>
          <h1 className="text-lg font-semibold text-slate-800 ml-1">
            城市服务图谱
          </h1>
        </div>
        <div className="px-4 pb-3 space-y-3">
          <TabBar
            tabs={POI_TABS}
            activeKey={activeType}
            onChange={setActiveType}
          />
          <div className="relative">
            <Search className="w-4.5 h-4.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="搜索POI名称、地址..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="w-full h-11 pl-11 pr-10 rounded-2xl bg-slate-50 border border-slate-200 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-400 transition-all"
            />
            {searchKeyword && (
              <button
                onClick={() => setSearchKeyword("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full bg-slate-200 hover:bg-slate-300 transition-colors"
              >
                <X className="w-3.5 h-3.5 text-slate-500" />
              </button>
            )}
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <MapPin className="w-4 h-4" />
              <span>
                {location.district || "当前位置"}
                {location.accuracy > 0 && ` (精度${location.accuracy.toFixed(0)}m)`}
              </span>
            </div>
            <div className="flex bg-slate-100 p-0.5 rounded-xl">
              <button
                onClick={() => setViewMode("list")}
                className={cn(
                  "flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                  viewMode === "list"
                    ? "bg-white text-brand-600 shadow-sm"
                    : "text-slate-500"
                )}
              >
                <ListIcon className="w-4 h-4" />
                列表
              </button>
              <button
                onClick={() => setViewMode("map")}
                className={cn(
                  "flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                  viewMode === "map"
                    ? "bg-white text-brand-600 shadow-sm"
                    : "text-slate-500"
                )}
              >
                <MapIcon className="w-4 h-4" />
                地图
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 pb-20">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-28 bg-white rounded-2xl animate-pulse shadow-card"
              />
            ))}
          </div>
        ) : viewMode === "list" ? (
          <ListView
            pois={pois}
            userLocation={{ lat: location.lat, lng: location.lng }}
            onSelectPoi={handleSelectPoi}
          />
        ) : (
          <MapView
            pois={pois}
            userLocation={{ lat: location.lat, lng: location.lng }}
            onSelectPoi={handleSelectPoi}
          />
        )}
      </div>

      {selectedPoi && (
        <PoiDetailModal
          poi={selectedPoi}
          distance={selectedDistance}
          onClose={() => setSelectedPoi(null)}
        />
      )}
    </AppLayout>
  );
}
