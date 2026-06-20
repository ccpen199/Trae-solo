import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Calendar, Users, Ticket, ChevronDown } from 'lucide-react';
import { useSearchStore, selectSearchParams } from '../../store/searchStore';
import Button from '../ui/Button';
import { cn } from '../lib/utils';
import { format, addDays } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface SearchFormProps {
  variant?: 'hero' | 'compact';
}

const SearchForm: React.FC<SearchFormProps> = ({ variant = 'hero' }) => {
  const navigate = useNavigate();
  const searchParams = useSearchStore(selectSearchParams);
  const setSearchParams = useSearchStore((state) => state.setSearchParams);
  const search = useSearchStore((state) => state.search);

  const [destination, setDestination] = useState(searchParams.destination || '');
  const [checkIn, setCheckIn] = useState(searchParams.checkIn || format(addDays(new Date(), 1), 'yyyy-MM-dd'));
  const [checkOut, setCheckOut] = useState(searchParams.checkOut || format(addDays(new Date(), 3), 'yyyy-MM-dd'));
  const [adults, setAdults] = useState(searchParams.adults || 2);
  const [children, setChildren] = useState(searchParams.children || 0);
  const [rooms, setRooms] = useState(searchParams.rooms || 1);
  const [channelCode, setChannelCode] = useState('');
  const [showGuestsDropdown, setShowGuestsDropdown] = useState(false);

  const popularDestinations = [
    '巴黎', '东京', '纽约', '伦敦', '迪拜', '新加坡', '曼谷', '巴塞罗那'
  ];

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const params = {
      destination,
      checkIn,
      checkOut,
      adults,
      children,
      rooms,
      channelCode: channelCode || undefined,
      page: 1,
    };

    setSearchParams(params);
    await search(params);
    navigate('/search');
  };

  const guestsLabel = () => {
    const totalGuests = adults + children;
    let label = `${adults} 位成人`;
    if (children > 0) label += `, ${children} 位儿童`;
    if (rooms > 1) label += ` · ${rooms} 间房`;
    return label;
  };

  return (
    <form onSubmit={handleSearch} className={cn(
      variant === 'hero'
        ? 'glass rounded-2xl p-6 shadow-floating'
        : 'bg-white rounded-xl p-4 shadow-elevated'
    )}>
      <div className={cn(
        'grid gap-4',
        variant === 'hero'
          ? 'grid-cols-1 md:grid-cols-12'
          : 'grid-cols-1 md:grid-cols-6'
      )}>
        <div className={cn(
          variant === 'hero' ? 'md:col-span-4' : 'md:col-span-2'
        )}>
          <label className="block text-sm font-medium text-graphite-700 mb-1.5">
            <MapPin className="w-4 h-4 inline mr-1" />
            目的地
          </label>
          <div className="relative">
            <input
              type="text"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="搜索城市、地区或酒店名称"
              className="input-field w-full"
              required
            />
          </div>
          {variant === 'hero' && (
            <div className="flex flex-wrap gap-2 mt-2">
              {popularDestinations.map((dest) => (
                <button
                  key={dest}
                  type="button"
                  onClick={() => setDestination(dest)}
                  className="px-3 py-1 text-xs bg-white/60 hover:bg-white rounded-full text-graphite-600 hover:text-deep-blue transition-colors"
                >
                  {dest}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className={cn(
          variant === 'hero' ? 'md:col-span-2' : 'md:col-span-1'
        )}>
          <label className="block text-sm font-medium text-graphite-700 mb-1.5">
            <Calendar className="w-4 h-4 inline mr-1" />
            入住日期
          </label>
          <input
            type="date"
            value={checkIn}
            onChange={(e) => setCheckIn(e.target.value)}
            className="input-field w-full"
            required
          />
        </div>

        <div className={cn(
          variant === 'hero' ? 'md:col-span-2' : 'md:col-span-1'
        )}>
          <label className="block text-sm font-medium text-graphite-700 mb-1.5">
            <Calendar className="w-4 h-4 inline mr-1" />
            退房日期
          </label>
          <input
            type="date"
            value={checkOut}
            onChange={(e) => setCheckOut(e.target.value)}
            className="input-field w-full"
            required
          />
        </div>

        <div className={cn(
          variant === 'hero' ? 'md:col-span-2' : 'md:col-span-1'
        )}>
          <label className="block text-sm font-medium text-graphite-700 mb-1.5">
            <Users className="w-4 h-4 inline mr-1" />
            旅客信息
          </label>
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowGuestsDropdown(!showGuestsDropdown)}
              className="input-field w-full text-left flex items-center justify-between"
            >
              <span>{guestsLabel()}</span>
              <ChevronDown className="w-4 h-4 text-graphite-400" />
            </button>
            {showGuestsDropdown && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-elevated border border-cloud-200 p-4 z-50">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-graphite-900">成人</p>
                      <p className="text-sm text-graphite-500">12岁及以上</p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <button
                        type="button"
                        onClick={() => setAdults(Math.max(1, adults - 1))}
                        className="w-8 h-8 rounded-full border border-cloud-300 flex items-center justify-center hover:bg-cloud-100"
                      >
                        -
                      </button>
                      <span className="w-6 text-center font-medium">{adults}</span>
                      <button
                        type="button"
                        onClick={() => setAdults(Math.min(9, adults + 1))}
                        className="w-8 h-8 rounded-full border border-cloud-300 flex items-center justify-center hover:bg-cloud-100"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-graphite-900">儿童</p>
                      <p className="text-sm text-graphite-500">0-11岁</p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <button
                        type="button"
                        onClick={() => setChildren(Math.max(0, children - 1))}
                        className="w-8 h-8 rounded-full border border-cloud-300 flex items-center justify-center hover:bg-cloud-100"
                      >
                        -
                      </button>
                      <span className="w-6 text-center font-medium">{children}</span>
                      <button
                        type="button"
                        onClick={() => setChildren(Math.min(9, children + 1))}
                        className="w-8 h-8 rounded-full border border-cloud-300 flex items-center justify-center hover:bg-cloud-100"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-graphite-900">房间</p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <button
                        type="button"
                        onClick={() => setRooms(Math.max(1, rooms - 1))}
                        className="w-8 h-8 rounded-full border border-cloud-300 flex items-center justify-center hover:bg-cloud-100"
                      >
                        -
                      </button>
                      <span className="w-6 text-center font-medium">{rooms}</span>
                      <button
                        type="button"
                        onClick={() => setRooms(Math.min(9, rooms + 1))}
                        className="w-8 h-8 rounded-full border border-cloud-300 flex items-center justify-center hover:bg-cloud-100"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-cloud-200">
                  <button
                    type="button"
                    onClick={() => setShowGuestsDropdown(false)}
                    className="w-full btn-primary py-2 rounded-lg text-white font-medium"
                  >
                    确定
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className={cn(
          variant === 'hero' ? 'md:col-span-2' : 'md:col-span-1'
        )}>
          <label className="block text-sm font-medium text-graphite-700 mb-1.5">
            <Ticket className="w-4 h-4 inline mr-1" />
            渠道码 (可选)
          </label>
          <input
            type="text"
            value={channelCode}
            onChange={(e) => setChannelCode(e.target.value.toUpperCase())}
            placeholder="MOBA / EXPEDIA / 企业码"
            className="input-field w-full"
          />
        </div>

        <div className={cn(
          variant === 'hero'
            ? 'md:col-span-12 flex justify-center'
            : 'md:col-span-0 flex items-end'
        )}>
          <Button
            type="submit"
            variant="primary"
            size={variant === 'hero' ? 'lg' : 'md'}
            fullWidth={variant !== 'hero'}
            leftIcon={<Search className="w-5 h-5" />}
            className={cn(
              variant === 'hero' && 'min-w-[200px]'
            )}
          >
            搜索酒店
          </Button>
        </div>
      </div>
    </form>
  );
};

export default SearchForm;
