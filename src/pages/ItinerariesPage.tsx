import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Calendar, Users, ChevronRight, Share2, Download, Plus, Trash2, Edit3, Link2, Globe, Clock, Hotel, AlertCircle, Check } from 'lucide-react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import Button from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Skeleton, SkeletonText } from '../components/ui/Skeleton';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import { itineraryApi } from '../services/api';
import { useAuthStore, selectIsAuthenticated } from '../store/authStore';
import { cn, formatDate, formatDateRange, calculateNights } from '../components/lib/utils';
import { Itinerary, BookingOrder, Currency } from '@shared/types';

const ItinerariesPage: React.FC = () => {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const [itineraries, setItineraries] = useState<Itinerary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedItinerary, setSelectedItinerary] = useState<Itinerary | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [newItineraryName, setNewItineraryName] = useState('');
  const [shareLink, setShareLink] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/itineraries' } });
      return;
    }
    loadItineraries();
  }, [isAuthenticated]);

  const loadItineraries = async () => {
    setIsLoading(true);
    try {
      const response = await itineraryApi.getMyItineraries() as Itinerary[];
      setItineraries(response);
    } catch (error) {
      console.error('Failed to load itineraries:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateItinerary = async () => {
    if (!newItineraryName.trim()) return;
    
    try {
      const response = await itineraryApi.create({
        name: newItineraryName,
        description: '',
        bookings: [],
        isPublic: false,
      }) as Itinerary;
      
      setItineraries([response, ...itineraries]);
      setShowCreateModal(false);
      setNewItineraryName('');
    } catch (error) {
      console.error('Failed to create itinerary:', error);
    }
  };

  const handleDeleteItinerary = async (id: string) => {
    if (!confirm('确定要删除此行程吗？')) return;
    
    try {
      await itineraryApi.delete(id);
      setItineraries(itineraries.filter(i => i.id !== id));
    } catch (error) {
      console.error('Failed to delete itinerary:', error);
    }
  };

  const handleShareItinerary = async (itinerary: Itinerary) => {
    setSelectedItinerary(itinerary);
    try {
      const response = await itineraryApi.share(itinerary.id) as any;
      setShareLink(`${window.location.origin}/itineraries/shared/${response.shareToken}`);
      setShowShareModal(true);
    } catch (error) {
      console.error('Failed to share itinerary:', error);
    }
  };

  const handleDownloadItinerary = async (id: string) => {
    try {
      await itineraryApi.download(id);
    } catch (error) {
      console.error('Failed to download itinerary:', error);
    }
  };

  const copyShareLink = () => {
    navigator.clipboard.writeText(shareLink);
    alert('链接已复制到剪贴板');
  };

  const getTripDuration = (itinerary: Itinerary) => {
    if (!itinerary.bookings || itinerary.bookings.length === 0) return '暂无预订';
    
    const bookings = itinerary.bookings as BookingOrder[];
    const startDates = bookings.map(b => new Date(b.checkIn)).sort((a, b) => a.getTime() - b.getTime());
    const endDates = bookings.map(b => new Date(b.checkOut)).sort((a, b) => b.getTime() - a.getTime());
    
    if (startDates.length > 0 && endDates.length > 0) {
      const nights = calculateNights(
        startDates[0].toISOString().split('T')[0],
        endDates[0].toISOString().split('T')[0]
      );
      const cities = [...new Set(bookings.map(b => {
        const match = b.hotelName?.match(/^(巴黎|东京|纽约|伦敦|迪拜|新加坡|曼谷|巴塞罗那)/);
        return match ? match[0] : b.hotelName;
      }))];
      return `${nights}晚 · ${cities.join('、')}`;
    }
    
    return `${bookings.length}个预订`;
  };

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen flex flex-col bg-cloud-50">
      <Header />
      
      <main className="flex-1">
        <div className="bg-gradient-to-r from-deep-blue via-deep-blue-light to-deep-blue text-white py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-display font-bold mb-2">
                  我的行程
                </h1>
                <p className="text-cloud-200">
                  管理您的多段行程，离线查看确认单，一键分享给同行伙伴
                </p>
              </div>
              <Button
                variant="accent"
                size="lg"
                leftIcon={<Plus className="w-5 h-5" />}
                onClick={() => setShowCreateModal(true)}
              >
                创建新行程
              </Button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-deep-blue/10 rounded-xl flex items-center justify-center">
                    <MapPin className="w-6 h-6 text-deep-blue" />
                  </div>
                  <div>
                    <p className="text-2xl font-display font-bold text-graphite-900">
                      {itineraries.length}
                    </p>
                    <p className="text-sm text-graphite-500">行程总数</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-coral-orange/10 rounded-xl flex items-center justify-center">
                    <Hotel className="w-6 h-6 text-coral-orange" />
                  </div>
                  <div>
                    <p className="text-2xl font-display font-bold text-graphite-900">
                      {itineraries.reduce((acc, i) => acc + (i.bookings?.length || 0), 0)}
                    </p>
                    <p className="text-sm text-graphite-500">酒店预订</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gold-foil/10 rounded-xl flex items-center justify-center">
                    <Globe className="w-6 h-6 text-gold-foil" />
                  </div>
                  <div>
                    <p className="text-2xl font-display font-bold text-graphite-900">
                      {[...new Set(itineraries.flatMap(i => 
                        (i.bookings as BookingOrder[])?.map(b => 
                          b.hotelName?.match(/^(巴黎|东京|纽约|伦敦|迪拜|新加坡|曼谷|巴塞罗那)/)?.[0]
                        ).filter(Boolean)
                      ))].filter(Boolean).length}
                    </p>
                    <p className="text-sm text-graphite-500">到访城市</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[...Array(4)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <SkeletonText lines={2} />
                    <div className="mt-4 space-y-3">
                      {[...Array(3)].map((_, j) => (
                        <Skeleton key={j} variant="text" />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : itineraries.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {itineraries.map((itinerary) => (
                <Card key={itinerary.id} className="card-hover overflow-hidden">
                  <CardContent className="p-0">
                    <div className="h-32 bg-gradient-to-br from-deep-blue/20 to-coral-orange/20 relative">
                      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=600&h=200&fit=crop')] bg-cover bg-center opacity-50" />
                      <div className="absolute inset-0 flex items-end p-6">
                        <div>
                          <Badge variant="primary" size="sm" className="mb-2">
                            {itinerary.bookings?.length || 0} 个预订
                          </Badge>
                          <h3 className="text-xl font-display font-bold text-white">
                            {itinerary.name}
                          </h3>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-6">
                      <div className="flex items-center gap-2 text-sm text-graphite-500 mb-4">
                        <Clock className="w-4 h-4" />
                        <span>{getTripDuration(itinerary)}</span>
                      </div>

                      {itinerary.bookings && itinerary.bookings.length > 0 && (
                        <div className="space-y-3 mb-6">
                          {(itinerary.bookings as BookingOrder[]).slice(0, 3).map((booking, index) => (
                            <div
                              key={booking.id}
                              className="flex items-center gap-3 p-3 bg-cloud-50 rounded-xl"
                            >
                              <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                                <img
                                  src={booking.hotelThumbnail || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=100&h=100&fit=crop'}
                                  alt={booking.hotelName}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-graphite-900 truncate">
                                  {booking.hotelName}
                                </p>
                                <p className="text-xs text-graphite-500">
                                  {formatDate(booking.checkIn)} - {formatDate(booking.checkOut)}
                                </p>
                              </div>
                              <Badge variant="success" size="sm" dot>
                                已确认
                              </Badge>
                            </div>
                          ))}
                          {itinerary.bookings.length > 3 && (
                            <p className="text-sm text-center text-graphite-500">
                              还有 {itinerary.bookings.length - 3} 个预订...
                            </p>
                          )}
                        </div>
                      )}

                      {itinerary.bookings?.length === 0 && (
                        <div className="text-center py-8 mb-6">
                          <AlertCircle className="w-12 h-12 text-graphite-300 mx-auto mb-3" />
                          <p className="text-graphite-500">此行程暂无预订</p>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="mt-3"
                            onClick={() => navigate('/search')}
                          >
                            添加酒店预订
                          </Button>
                        </div>
                      )}

                      <div className="flex flex-wrap items-center justify-end gap-2 pt-4 border-t border-cloud-200">
                        <Button
                          variant="ghost"
                          size="sm"
                          leftIcon={<Share2 className="w-4 h-4" />}
                          onClick={() => handleShareItinerary(itinerary)}
                        >
                          分享
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          leftIcon={<Download className="w-4 h-4" />}
                          onClick={() => handleDownloadItinerary(itinerary.id)}
                        >
                          下载
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:bg-red-50"
                          leftIcon={<Trash2 className="w-4 h-4" />}
                          onClick={() => handleDeleteItinerary(itinerary.id)}
                        >
                          删除
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          rightIcon={<ChevronRight className="w-4 h-4" />}
                          onClick={() => navigate(`/itineraries/${itinerary.id}`)}
                        >
                          查看详情
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="w-24 h-24 bg-cloud-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <MapPin className="w-12 h-12 text-graphite-400" />
              </div>
              <h3 className="text-2xl font-display font-bold text-graphite-900 mb-2">
                暂无行程
              </h3>
              <p className="text-graphite-500 mb-8 max-w-md mx-auto">
                创建您的第一个行程，将多个酒店预订整合在一起，方便管理和分享
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Button
                  variant="primary"
                  size="lg"
                  leftIcon={<Plus className="w-5 h-5" />}
                  onClick={() => setShowCreateModal(true)}
                >
                  创建新行程
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => navigate('/bookings')}
                >
                  查看我的订单
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />

      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="创建新行程"
        description="为您的旅行创建一个新的行程计划"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowCreateModal(false)}>
              取消
            </Button>
            <Button
              variant="primary"
              onClick={handleCreateItinerary}
              disabled={!newItineraryName.trim()}
            >
              创建
            </Button>
          </>
        }
      >
        <Input
          label="行程名称"
          value={newItineraryName}
          onChange={(e) => setNewItineraryName(e.target.value)}
          placeholder="例如：2024欧洲五国游、东京周末之旅"
          autoFocus
        />
        <div className="mt-6 p-4 bg-cloud-50 rounded-xl">
          <p className="text-sm text-graphite-600 mb-3">行程可以帮助您：</p>
          <ul className="space-y-2 text-sm text-graphite-500">
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-500" />
              将多段酒店预订整合管理
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-500" />
              一键生成可分享的行程链接
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-500" />
              支持离线查看确认单
            </li>
          </ul>
        </div>
      </Modal>

      <Modal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        title="分享行程"
        description="将行程链接分享给您的同行伙伴"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowShareModal(false)}>
              关闭
            </Button>
            <Button variant="primary" onClick={copyShareLink}>
              复制链接
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="p-4 bg-cloud-50 rounded-xl">
            <p className="text-sm text-graphite-600 mb-2">行程链接</p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={shareLink}
                readOnly
                className="input-field flex-1 text-sm"
              />
              <Button variant="primary" size="sm" onClick={copyShareLink}>
                <Link2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div className="p-4 bg-deep-blue/5 rounded-xl border border-deep-blue/20">
            <p className="text-sm text-graphite-600">
              <AlertCircle className="w-4 h-4 inline mr-1 text-deep-blue" />
              任何拥有此链接的人都可以查看此行程的详情。
              您可以在行程设置中随时取消共享。
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ItinerariesPage;
