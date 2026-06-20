import React, { useState, useEffect } from 'react';
import {
  BedDouble,
  Users,
  Maximize2,
  Edit3,
  Package,
  Eye,
  EyeOff,
  Plus,
  Minus,
  DollarSign,
  Wifi,
  Coffee,
  Bath,
  Tv,
  Wind,
  Shield,
  Snowflake,
  Dumbbell,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { cn, formatCurrency } from '../../components/lib/utils';
import { hotelAdminApi } from '../../services/api';
import { RoomType, RoomTypeStatus, Currency } from '@shared/types';

interface RoomTypeWithInventory extends RoomType {
  price: number;
  currency: Currency;
  inventory: number;
  bookedCount: number;
}

const RoomsPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [rooms, setRooms] = useState<RoomTypeWithInventory[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<RoomTypeWithInventory | null>(null);
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [editPrice, setEditPrice] = useState(0);
  const [editInventory, setEditInventory] = useState(0);

  useEffect(() => {
    loadRooms();
  }, []);

  const loadRooms = async () => {
    setIsLoading(true);
    try {
      const hotelId = 'hotel-paris-001';
      
      try {
        const response = await hotelAdminApi.inventory.getRooms(hotelId) as any;
        if (response && response.length > 0) {
          setRooms(response.map((r: any) => ({
            ...r,
            price: r.price || 890,
            currency: r.currency || Currency.EUR,
            inventory: r.inventory || 10,
            bookedCount: r.bookedCount || 5,
          })));
        } else {
          setRooms(getMockRooms());
        }
      } catch (error) {
        console.warn('Failed to load rooms, using mock data');
        setRooms(getMockRooms());
      }
    } catch (error) {
      console.error('Failed to load rooms:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getMockRooms = (): RoomTypeWithInventory[] => {
    return [
      {
        id: 'room-paris-001',
        hotelId: 'hotel-paris-001',
        name: '豪华客房',
        nameEn: 'Deluxe Room',
        description: '35平方米豪华客房，配备特大号床，可欣赏花园或城市景观。大理石浴室配备独立浴缸和淋浴间。',
        sizeSqm: 35,
        maxOccupancy: 2,
        bedType: 'King',
        bedCount: 1,
        status: RoomTypeStatus.AVAILABLE,
        images: [
          'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=elegant%20deluxe%20hotel%20room%20king%20bed%20parisian%20style&image_size=square_hd',
        ],
        amenities: ['King Bed', 'Marble Bathroom', 'Bathtub', 'Rain Shower', '55" Smart TV', 'Minibar', 'Nespresso Machine', 'AC', 'WiFi', 'Safe', 'Robe & Slippers'],
        price: 890,
        currency: Currency.EUR,
        inventory: 15,
        bookedCount: 8,
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2025-03-20T14:30:00Z',
      },
      {
        id: 'room-paris-002',
        hotelId: 'hotel-paris-001',
        name: '行政套房',
        nameEn: 'Executive Suite',
        description: '60平方米一卧室套房，独立起居室，艾菲尔铁塔景观。配备Bose音响系统和Nespresso咖啡机。行政酒廊待遇，免费早餐和晚间鸡尾酒。',
        sizeSqm: 60,
        maxOccupancy: 2,
        bedType: 'King',
        bedCount: 1,
        status: RoomTypeStatus.AVAILABLE,
        images: [
          'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=luxury%20executive%20suite%20living%20room%20eiffel%20tower%20view&image_size=square_hd',
        ],
        amenities: ['King Bed', 'Separate Living Room', 'Eiffel Tower View', 'Marble Bathroom', 'Bathtub', 'Rain Shower', '65" Smart TV', 'Bose Sound System', 'Minibar', 'Nespresso Machine', 'AC', 'WiFi', 'Safe', 'Executive Lounge Access', 'Robe & Slippers'],
        price: 1580,
        currency: Currency.EUR,
        inventory: 8,
        bookedCount: 6,
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2025-03-20T14:30:00Z',
      },
      {
        id: 'room-paris-003',
        hotelId: 'hotel-paris-001',
        name: '皇家套房',
        nameEn: 'Royal Suite',
        description: '180平方米的皇家套房位于建筑顶层，拥有私人露台俯瞰艾菲尔铁塔。配备私人管家服务、室内游泳池和独立餐厅。',
        sizeSqm: 180,
        maxOccupancy: 4,
        bedType: 'King',
        bedCount: 2,
        status: RoomTypeStatus.AVAILABLE,
        images: [
          'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=royal%20penthouse%20suite%20private%20terrace%20eiffel%20tower%20view&image_size=square_hd',
        ],
        amenities: ['2 King Beds', 'Private Terrace', 'Private Plunge Pool', 'Separate Living Room', 'Dining Room', 'Kitchen', 'Eiffel Tower View', 'Marble Bathroom', 'Bathtub', 'Rain Shower', '75" Smart TV', 'Bose Home Theater', 'Minibar', 'Nespresso Machine', 'AC', 'WiFi', 'Safe', 'Butler Service', 'Robe & Slippers'],
        price: 4500,
        currency: Currency.EUR,
        inventory: 2,
        bookedCount: 1,
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2025-03-20T14:30:00Z',
      },
      {
        id: 'room-paris-004',
        hotelId: 'hotel-paris-001',
        name: '高级双床房',
        nameEn: 'Superior Twin Room',
        description: '32平方米高级客房，配备两张单人床，适合商务出行或朋友同住。可欣赏庭院景观。',
        sizeSqm: 32,
        maxOccupancy: 2,
        bedType: 'Twin',
        bedCount: 2,
        status: RoomTypeStatus.MAINTENANCE,
        images: [
          'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=superior%20twin%20room%20hotel%20elegant%20parisian&image_size=square_hd',
        ],
        amenities: ['2 Twin Beds', 'Marble Bathroom', 'Bathtub', 'Rain Shower', '50" Smart TV', 'Minibar', 'Nespresso Machine', 'AC', 'WiFi', 'Safe', 'Robe & Slippers'],
        price: 790,
        currency: Currency.EUR,
        inventory: 10,
        bookedCount: 0,
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2025-03-20T14:30:00Z',
      },
    ];
  };

  const handleEditPrice = (room: RoomTypeWithInventory) => {
    setSelectedRoom(room);
    setEditPrice(room.price);
    setShowPriceModal(true);
  };

  const handleEditInventory = (room: RoomTypeWithInventory) => {
    setSelectedRoom(room);
    setEditInventory(room.inventory);
    setShowInventoryModal(true);
  };

  const handleSavePrice = async () => {
    if (!selectedRoom) return;
    try {
      const hotelId = 'hotel-paris-001';
      await hotelAdminApi.inventory.updateRoom(hotelId, selectedRoom.id, { price: editPrice });
      setRooms(rooms.map(r => 
        r.id === selectedRoom.id ? { ...r, price: editPrice } : r
      ));
      setShowPriceModal(false);
    } catch (error) {
      console.error('Failed to update price:', error);
      setRooms(rooms.map(r => 
        r.id === selectedRoom.id ? { ...r, price: editPrice } : r
      ));
      setShowPriceModal(false);
    }
  };

  const handleSaveInventory = async () => {
    if (!selectedRoom) return;
    try {
      const hotelId = 'hotel-paris-001';
      await hotelAdminApi.inventory.updateInventory(hotelId, selectedRoom.id, { inventory: editInventory });
      setRooms(rooms.map(r => 
        r.id === selectedRoom.id ? { ...r, inventory: editInventory } : r
      ));
      setShowInventoryModal(false);
    } catch (error) {
      console.error('Failed to update inventory:', error);
      setRooms(rooms.map(r => 
        r.id === selectedRoom.id ? { ...r, inventory: editInventory } : r
      ));
      setShowInventoryModal(false);
    }
  };

  const toggleRoomStatus = async (room: RoomTypeWithInventory) => {
    const newStatus = room.status === RoomTypeStatus.AVAILABLE 
      ? RoomTypeStatus.UNAVAILABLE 
      : RoomTypeStatus.AVAILABLE;
    
    try {
      const hotelId = 'hotel-paris-001';
      await hotelAdminApi.inventory.updateRoom(hotelId, room.id, { status: newStatus });
      setRooms(rooms.map(r => 
        r.id === room.id ? { ...r, status: newStatus } : r
      ));
    } catch (error) {
      console.error('Failed to update room status:', error);
      setRooms(rooms.map(r => 
        r.id === room.id ? { ...r, status: newStatus } : r
      ));
    }
  };

  const getStatusConfig = (status: RoomTypeStatus) => {
    const configs: Record<RoomTypeStatus, { label: string; variant: any }> = {
      [RoomTypeStatus.AVAILABLE]: { label: '在售', variant: 'success' },
      [RoomTypeStatus.UNAVAILABLE]: { label: '下架', variant: 'danger' },
      [RoomTypeStatus.MAINTENANCE]: { label: '维护中', variant: 'warning' },
    };
    return configs[status] || configs[RoomTypeStatus.AVAILABLE];
  };

  const getAmenityIcon = (amenity: string) => {
    const lower = amenity.toLowerCase();
    if (lower.includes('wifi') || lower.includes('wi-fi')) return Wifi;
    if (lower.includes('breakfast') || lower.includes('coffee') || lower.includes('nespresso')) return Coffee;
    if (lower.includes('bath') || lower.includes('shower') || lower.includes('bathroom')) return Bath;
    if (lower.includes('tv') || lower.includes('television')) return Tv;
    if (lower.includes('ac') || lower.includes('air') || lower.includes('空调')) return Wind;
    if (lower.includes('safe')) return Shield;
    if (lower.includes('minibar') || lower.includes('fridge')) return Snowflake;
    if (lower.includes('gym') || lower.includes('fitness')) return Dumbbell;
    return BedDouble;
  };

  const displayAmenities = (amenities: string[], count: number = 6) => {
    return amenities.slice(0, count);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-graphite-900">房态管理</h1>
          <p className="text-graphite-500 mt-1">管理酒店房型、价格和库存</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="success" size="md">
            在售 {rooms.filter(r => r.status === RoomTypeStatus.AVAILABLE).length} 种
          </Badge>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <div className="h-48 bg-cloud-100 rounded-t-2xl animate-pulse" />
              <CardContent className="space-y-3">
                <div className="h-6 bg-cloud-100 rounded animate-pulse" />
                <div className="h-4 bg-cloud-100 rounded w-3/4 animate-pulse" />
                <div className="h-8 bg-cloud-100 rounded animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {rooms.map((room) => {
            const statusConfig = getStatusConfig(room.status);
            const availableCount = room.inventory - room.bookedCount;
            const occupancyRate = room.inventory > 0 
              ? Math.round((room.bookedCount / room.inventory) * 100) 
              : 0;

            return (
              <Card key={room.id} hoverable className="overflow-hidden">
                <div className="relative h-48 bg-cloud-100">
                  <img
                    src={room.images?.[0]}
                    alt={room.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 left-3">
                    <Badge variant={statusConfig.variant} size="sm" dot>
                      {statusConfig.label}
                    </Badge>
                  </div>
                  <div className="absolute top-3 right-3">
                    <Badge variant="gold" size="sm">
                      {room.sizeSqm}㎡
                    </Badge>
                  </div>
                </div>

                <CardContent className="space-y-4">
                  <div>
                    <div className="flex items-start justify-between">
                      <h3 className="text-lg font-display font-bold text-graphite-900">
                        {room.name}
                      </h3>
                    </div>
                    <p className="text-sm text-graphite-500 mt-1 line-clamp-2">
                      {room.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-graphite-600">
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4 text-deep-blue" />
                      <span>最多{room.maxOccupancy}人</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <BedDouble className="w-4 h-4 text-deep-blue" />
                      <span>{room.bedType}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {displayAmenities(room.amenities, 5).map((amenity, index) => {
                      const Icon = getAmenityIcon(amenity);
                      return (
                        <div
                          key={index}
                          className="flex items-center gap-1 px-2 py-1 bg-cloud-50 rounded-lg text-xs text-graphite-600"
                          title={amenity}
                        >
                          <Icon className="w-3 h-3" />
                          <span className="truncate max-w-20">{amenity}</span>
                        </div>
                      );
                    })}
                    {room.amenities.length > 5 && (
                      <span className="px-2 py-1 bg-cloud-50 rounded-lg text-xs text-graphite-500">
                        +{room.amenities.length - 5}
                      </span>
                    )}
                  </div>

                  <div className="pt-4 border-t border-cloud-100">
                    <div className="flex items-end justify-between mb-3">
                      <div>
                        <p className="text-xs text-graphite-500 mb-1">每晚价格</p>
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl font-display font-bold text-coral-orange">
                            {formatCurrency(room.price, room.currency)}
                          </span>
                          <span className="text-sm text-graphite-400">起</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-graphite-500 mb-1">库存</p>
                        <p className="text-sm font-medium text-graphite-700">
                          {availableCount} / {room.inventory} 间
                        </p>
                      </div>
                    </div>

                    <div className="mb-4">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-graphite-500">入住率</span>
                        <span className="font-medium text-graphite-700">{occupancyRate}%</span>
                      </div>
                      <div className="w-full h-2 bg-cloud-100 rounded-full overflow-hidden">
                        <div
                          className={cn(
                            'h-full rounded-full transition-all duration-500',
                            occupancyRate >= 90 ? 'bg-red-500' :
                            occupancyRate >= 70 ? 'bg-emerald-500' :
                            'bg-gold-foil'
                          )}
                          style={{ width: `${occupancyRate}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        leftIcon={<DollarSign className="w-4 h-4" />}
                        onClick={() => handleEditPrice(room)}
                        className="flex-1"
                      >
                        改价
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        leftIcon={<Package className="w-4 h-4" />}
                        onClick={() => handleEditInventory(room)}
                        className="flex-1"
                      >
                        库存
                      </Button>
                      <Button
                        variant={room.status === RoomTypeStatus.AVAILABLE ? 'ghost' : 'primary'}
                        size="sm"
                        leftIcon={room.status === RoomTypeStatus.AVAILABLE ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        onClick={() => toggleRoomStatus(room)}
                        disabled={room.status === RoomTypeStatus.MAINTENANCE}
                      >
                        {room.status === RoomTypeStatus.AVAILABLE ? '下架' : '上架'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {showPriceModal && selectedRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowPriceModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-floating w-full max-w-md p-6">
            <h3 className="text-xl font-display font-bold text-graphite-900 mb-4">
              编辑房价
            </h3>
            <p className="text-sm text-graphite-500 mb-4">
              {selectedRoom.name} - 当前价格：{formatCurrency(selectedRoom.price, selectedRoom.currency)}
            </p>
            <div className="mb-6">
              <label className="block text-sm font-medium text-graphite-700 mb-2">
                新价格 ({selectedRoom.currency})
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-graphite-500">€</span>
                <input
                  type="number"
                  value={editPrice}
                  onChange={(e) => setEditPrice(Number(e.target.value))}
                  className="w-full pl-8 pr-4 py-2 border border-cloud-200 rounded-lg focus:ring-2 focus:ring-deep-blue focus:border-deep-blue"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3">
              <Button variant="ghost" size="sm" onClick={() => setShowPriceModal(false)}>
                取消
              </Button>
              <Button variant="primary" size="sm" onClick={handleSavePrice}>
                保存
              </Button>
            </div>
          </div>
        </div>
      )}

      {showInventoryModal && selectedRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowInventoryModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-floating w-full max-w-md p-6">
            <h3 className="text-xl font-display font-bold text-graphite-900 mb-4">
              调整库存
            </h3>
            <p className="text-sm text-graphite-500 mb-4">
              {selectedRoom.name} - 当前库存：{selectedRoom.inventory} 间
            </p>
            <div className="mb-6">
              <label className="block text-sm font-medium text-graphite-700 mb-2">
                新库存数量
              </label>
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditInventory(Math.max(0, editInventory - 1))}
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <input
                  type="number"
                  value={editInventory}
                  onChange={(e) => setEditInventory(Math.max(0, Number(e.target.value)))}
                  className="flex-1 px-4 py-2 text-center text-xl font-bold border border-cloud-200 rounded-lg focus:ring-2 focus:ring-deep-blue focus:border-deep-blue"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditInventory(editInventory + 1)}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3">
              <Button variant="ghost" size="sm" onClick={() => setShowInventoryModal(false)}>
                取消
              </Button>
              <Button variant="primary" size="sm" onClick={handleSaveInventory}>
                保存
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoomsPage;
