import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Globe, Shield, TrendingUp, Clock, Users, Award, ChevronRight, Star, MapPin, Zap } from 'lucide-react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import SearchForm from '../components/search/SearchForm';
import HotelCard from '../components/hotel/HotelCard';
import Button from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { useAuthStore } from '../store/authStore';
import { hotelApi } from '../services/api';
import { HotelSearchResult } from '@shared/types';
import { SkeletonCard } from '../components/ui/Skeleton';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { fetchCurrentUser, isAuthenticated } = useAuthStore();
  const [featuredHotels, setFeaturedHotels] = React.useState<HotelSearchResult[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  useEffect(() => {
    if (isAuthenticated) {
      fetchCurrentUser();
    }
    loadFeaturedHotels();
  }, [isAuthenticated]);

  const loadFeaturedHotels = async () => {
    try {
      const response = await hotelApi.search({
        destination: '',
        checkIn: '',
        checkOut: '',
        adults: 2,
        children: 0,
        rooms: 1,
        page: 1,
        pageSize: 4,
      }) as any;
      if (response && response.data) {
        setFeaturedHotels(response.data.slice(0, 4));
      }
    } catch (error) {
      console.error('Failed to load featured hotels:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const features = [
    {
      icon: Globe,
      title: '全球覆盖',
      description: '200+国家和地区，500,000+精选酒店',
    },
    {
      icon: TrendingUp,
      title: '智能比价',
      description: '实时对比5+渠道，为您找到最优价格',
    },
    {
      icon: Shield,
      title: '价格保障',
      description: '低价保证，买贵双倍返还差价',
    },
    {
      icon: Clock,
      title: '免费取消',
      description: '大部分房型支持入住前免费取消',
    },
    {
      icon: Users,
      title: '会员尊享',
      description: 'Silver/Gold会员专享房型锁定、延迟退房',
    },
    {
      icon: Award,
      title: '积分奖励',
      description: '每消费1元累积积分，可兑换免费住宿',
    },
  ];

  const popularDestinations = [
    { city: '巴黎', country: '法国', image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400&h=300&fit=crop', hotels: 1280 },
    { city: '东京', country: '日本', image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400&h=300&fit=crop', hotels: 2340 },
    { city: '纽约', country: '美国', image: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=400&h=300&fit=crop', hotels: 1890 },
    { city: '迪拜', country: '阿联酋', image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=400&h=300&fit=crop', hotels: 960 },
    { city: '新加坡', country: '新加坡', image: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=400&h=300&fit=crop', hotels: 1560 },
    { city: '巴塞罗那', country: '西班牙', image: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=400&h=300&fit=crop', hotels: 1120 },
  ];

  const testimonials = [
    {
      name: '张先生',
      location: '上海',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
      rating: 5,
      comment: '通过StayGlobal预订了东京的酒店，比价功能帮我省了近2000元，非常推荐！',
      hotel: '东京香格里拉大酒店',
    },
    {
      name: '李女士',
      location: '北京',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop',
      rating: 5,
      comment: 'Gold会员权益太棒了，在巴黎免费升级了套房，还享受了行政酒廊，性价比超高！',
      hotel: '巴黎丽兹酒店',
    },
    {
      name: '王先生',
      location: '深圳',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
      rating: 5,
      comment: '行程管理功能非常实用，把我欧洲五国游的所有订单整合在一起，还可以分享给同行的朋友。',
      hotel: '多城市行程',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-cloud-50">
      <Header />
      
      <main className="flex-1">
        <section className="relative overflow-hidden bg-gradient-to-br from-deep-blue via-deep-blue-light to-deep-blue">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1920&h=800&fit=crop')] bg-cover bg-center opacity-30" />
          <div className="absolute inset-0 bg-gradient-to-b from-deep-blue/60 via-deep-blue/40 to-deep-blue" />
          
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
            <div className="text-center max-w-4xl mx-auto mb-12">
              <Badge variant="accent" size="lg" className="mb-6">
                <Zap className="w-4 h-4 mr-1" />
                智能比价 · 全球精选
              </Badge>
              <h1 className="text-4xl md:text-6xl font-display font-bold text-white mb-6 leading-tight">
                探索世界，<br />
                <span className="text-gold-foil">尊享每一次旅途</span>
              </h1>
              <p className="text-xl text-cloud-200 mb-8 max-w-2xl mx-auto">
                多语言、多币种、多渠道智能比价，为全球旅行者提供一站式住宿预订服务。
                Silver/Gold会员更享VIP房型锁定、延迟退房等专属权益。
              </p>
              
              <div className="flex flex-wrap justify-center gap-4 mb-12">
                <div className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-white">
                  <Globe className="w-5 h-5 text-gold-foil" />
                  <span>200+ 国家和地区</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-white">
                  <TrendingUp className="w-5 h-5 text-gold-foil" />
                  <span>5+ 渠道实时比价</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-white">
                  <Shield className="w-5 h-5 text-gold-foil" />
                  <span>低价保障 双倍返还</span>
                </div>
              </div>
            </div>
            
            <div className="max-w-6xl mx-auto">
              <SearchForm variant="hero" />
            </div>
          </div>
          
          <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-cloud-50 to-transparent" />
        </section>

        <section className="py-16 md:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <Badge variant="primary" size="lg" className="mb-4">
                核心优势
              </Badge>
              <h2 className="text-3xl md:text-4xl font-display font-bold text-graphite-900 mb-4">
                为什么选择 StayGlobal
              </h2>
              <p className="text-lg text-graphite-600 max-w-2xl mx-auto">
                我们致力于为全球旅行者提供最优质的住宿预订体验，从价格到服务，每一个细节都精益求精。
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="card card-hover p-8"
                >
                  <div className="w-14 h-14 bg-gradient-to-br from-deep-blue/10 to-deep-blue-light/10 rounded-2xl flex items-center justify-center mb-6">
                    <feature.icon className="w-7 h-7 text-deep-blue" />
                  </div>
                  <h3 className="text-xl font-display font-bold text-graphite-900 mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-graphite-600">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 md:py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-12">
              <div>
                <Badge variant="gold" size="lg" className="mb-4">
                  <Award className="w-4 h-4 mr-1" />
                  精选推荐
                </Badge>
                <h2 className="text-3xl md:text-4xl font-display font-bold text-graphite-900 mb-4">
                  热门酒店
                </h2>
                <p className="text-lg text-graphite-600">
                  全球旅行者的真实评价，为您精选最受欢迎的优质酒店
                </p>
              </div>
              <Button
                variant="outline"
                rightIcon={<ChevronRight className="w-4 h-4" />}
                className="mt-4 md:mt-0"
                onClick={() => navigate('/search')}
              >
                查看全部
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {isLoading ? (
                [...Array(4)].map((_, i) => <SkeletonCard key={i} />)
              ) : (
                featuredHotels.map((hotel, index) => (
                  <HotelCard
                    key={hotel.id}
                    hotel={hotel}
                    featured={index === 0}
                  />
                ))
              )}
            </div>
          </div>
        </section>

        <section className="py-16 md:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <Badge variant="accent" size="lg" className="mb-4">
                <MapPin className="w-4 h-4 mr-1" />
                热门目的地
              </Badge>
              <h2 className="text-3xl md:text-4xl font-display font-bold text-graphite-900 mb-4">
                探索全球热门城市
              </h2>
              <p className="text-lg text-graphite-600 max-w-2xl mx-auto">
                从浪漫巴黎到繁华东京，从摩登纽约到奢华迪拜，发现您的下一个完美目的地
              </p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {popularDestinations.map((dest, index) => (
                <div
                  key={index}
                  onClick={() => {
                    navigate('/search', {
                      state: { destination: dest.city },
                    });
                  }}
                  className="group relative aspect-[4/5] rounded-2xl overflow-hidden cursor-pointer"
                >
                  <img
                    src={dest.image}
                    alt={dest.city}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                    <h3 className="text-lg font-display font-bold">{dest.city}</h3>
                    <p className="text-sm text-cloud-200">{dest.country}</p>
                    <p className="text-xs text-gold-foil mt-1">{dest.hotels.toLocaleString()} 家酒店</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 md:py-24 bg-gradient-to-br from-graphite-900 to-deep-blue">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <Badge variant="gold" size="lg" className="mb-4">
                <Star className="w-4 h-4 mr-1" />
                真实评价
              </Badge>
              <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-4">
                来自全球旅行者的声音
              </h2>
              <p className="text-lg text-cloud-300 max-w-2xl mx-auto">
                超过100万真实旅客的评价，帮助您做出明智的预订决策
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {testimonials.map((testimonial, index) => (
                <div
                  key={index}
                  className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/10"
                >
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={cn(
                          'w-5 h-5',
                          i < testimonial.rating
                            ? 'text-gold-foil fill-gold-foil'
                            : 'text-cloud-400'
                        )}
                      />
                    ))}
                  </div>
                  <p className="text-white mb-6 leading-relaxed">
                    "{testimonial.comment}"
                  </p>
                  <div className="flex items-center gap-4 pt-6 border-t border-white/10">
                    <img
                      src={testimonial.avatar}
                      alt={testimonial.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div>
                      <p className="font-medium text-white">{testimonial.name}</p>
                      <p className="text-sm text-cloud-300">{testimonial.location} · {testimonial.hotel}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 md:py-24 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <Badge variant="primary" size="lg" className="mb-4">
              会员专属
            </Badge>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-graphite-900 mb-4">
              加入 StayGlobal 会员计划
            </h2>
            <p className="text-lg text-graphite-600 mb-8 max-w-2xl mx-auto">
              注册即享Bronze会员权益，累积积分升级Silver、Gold会员，解锁更多专属礼遇
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button
                variant="primary"
                size="lg"
                onClick={() => navigate('/register')}
              >
                免费注册
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => navigate('/member/benefits')}
              >
                了解会员权益
              </Button>
            </div>
            <div className="flex flex-wrap justify-center gap-8 mt-12 pt-12 border-t border-cloud-200">
              <div className="text-center">
                <div className="text-3xl font-display font-bold text-deep-blue">100万+</div>
                <div className="text-sm text-graphite-500 mt-1">活跃会员</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-display font-bold text-deep-blue">50万+</div>
                <div className="text-sm text-graphite-500 mt-1">合作酒店</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-display font-bold text-deep-blue">200+</div>
                <div className="text-sm text-graphite-500 mt-1">覆盖国家</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-display font-bold text-deep-blue">4.9</div>
                <div className="text-sm text-graphite-500 mt-1">用户评分</div>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default HomePage;
