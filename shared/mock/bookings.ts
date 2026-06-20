import { BookingOrder, OrderStatus, Currency, TaxType } from '../types';
import { mockUsers } from './users';

export const mockBookings: BookingOrder[] = [
  {
    id: 'booking-001',
    orderNumber: 'SG202506150001',
    hotelId: 'hotel-paris-001',
    hotelName: 'Le Château Élysée',
    roomTypeId: 'room-paris-002',
    roomTypeName: '行政套房',
    ratePlanId: 'rate-room-paris-002-stayglobal',
    checkInDate: '2025-06-15',
    checkOutDate: '2025-06-20',
    nights: 5,
    guestCount: {
      adults: 2,
      children: 0,
      infants: 0,
    },
    guestInfo: [
      {
        firstName: '伟',
        lastName: '张',
        email: 'zhang.wei@example.com',
        phone: '+86 138 0000 0001',
      },
    ],
    specialRequests: '希望能安排高层艾菲尔铁塔景观的房间',
    pricing: {
      roomTotal: {
        amount: 7900,
        currency: Currency.EUR,
      },
      taxes: {
        amount: {
          amount: 869,
          currency: Currency.EUR,
        },
        breakdown: [
          {
            name: 'VAT (20%)',
            rate: 20,
            amount: { amount: 790, currency: Currency.EUR },
            type: TaxType.VAT,
          },
          {
            name: 'City Tax (€1.58/人/晚)',
            rate: 1.58,
            amount: { amount: 79, currency: Currency.EUR },
            type: TaxType.CITY_TAX,
          },
        ],
      },
      fees: {
        amount: {
          amount: 0,
          currency: Currency.EUR,
        },
        breakdown: [],
      },
      discounts: {
        amount: {
          amount: 790,
          currency: Currency.EUR,
        },
        breakdown: [
          {
            name: '会员专享折扣',
            code: 'GOLD10',
            amount: { amount: 790, currency: Currency.EUR },
            percentage: 10,
          },
        ],
      },
      grandTotal: {
        amount: 7979,
        currency: Currency.EUR,
      },
    },
    status: OrderStatus.CONFIRMED,
    channelCode: 'stayglobal',
    paymentStatus: 'paid',
    confirmationNumber: 'SG-20250615-789456',
    cancellationDeadline: '2025-06-12T23:59:59Z',
    createdAt: '2025-03-15T10:30:00Z',
    updatedAt: '2025-03-15T10:35:00Z',
  },
  {
    id: 'booking-002',
    orderNumber: 'SG202504100002',
    hotelId: 'hotel-tokyo-001',
    hotelName: '银座四季酒店',
    roomTypeId: 'room-tokyo-001',
    roomTypeName: '高级客房',
    ratePlanId: 'rate-room-tokyo-001-stayglobal',
    checkInDate: '2025-04-10',
    checkOutDate: '2025-04-15',
    nights: 5,
    guestCount: {
      adults: 2,
      children: 0,
      infants: 0,
    },
    guestInfo: [
      {
        firstName: 'Sarah',
        lastName: 'Johnson',
        email: 'sarah.johnson@example.com',
        phone: '+1 212 555 0101',
      },
    ],
    specialRequests: '庆祝结婚周年，希望能有小惊喜',
    pricing: {
      roomTotal: {
        amount: 375000,
        currency: Currency.JPY,
      },
      taxes: {
        amount: {
          amount: 37500,
          currency: Currency.JPY,
        },
        breakdown: [
          {
            name: 'Consumption Tax (10%)',
            rate: 10,
            amount: { amount: 37500, currency: Currency.JPY },
            type: TaxType.VAT,
          },
        ],
      },
      fees: {
        amount: {
          amount: 0,
          currency: Currency.JPY,
        },
        breakdown: [],
      },
      discounts: {
        amount: {
          amount: 0,
          currency: Currency.JPY,
        },
        breakdown: [],
      },
      grandTotal: {
        amount: 412500,
        currency: Currency.JPY,
      },
    },
    status: OrderStatus.CHECKED_OUT,
    channelCode: 'stayglobal',
    paymentStatus: 'paid',
    confirmationNumber: 'SG-20250410-123789',
    createdAt: '2025-02-20T14:20:00Z',
    updatedAt: '2025-04-15T12:00:00Z',
  },
  {
    id: 'booking-003',
    orderNumber: 'SG202507200003',
    hotelId: 'hotel-newyork-001',
    hotelName: 'The Plaza Hotel',
    roomTypeId: 'room-ny-002',
    roomTypeName: '一卧室套房',
    ratePlanId: 'rate-room-ny-002-stayglobal',
    checkInDate: '2025-07-20',
    checkOutDate: '2025-07-25',
    nights: 5,
    guestCount: {
      adults: 2,
      children: 1,
      infants: 0,
    },
    guestInfo: [
      {
        firstName: '伟',
        lastName: '张',
        email: 'zhang.wei@example.com',
        phone: '+86 138 0000 0001',
        specialRequests: '需要加床',
      },
      {
        firstName: '小',
        lastName: '明',
        email: 'zhang.wei@example.com',
        phone: '+86 138 0000 0001',
      },
    ],
    specialRequests: '需要婴儿床和儿童用品',
    pricing: {
      roomTotal: {
        amount: 8750,
        currency: Currency.USD,
      },
      taxes: {
        amount: {
          amount: 2083.12,
          currency: Currency.USD,
        },
        breakdown: [
          {
            name: 'NYC Sales Tax (8.875%)',
            rate: 8.875,
            amount: { amount: 776.56, currency: Currency.USD },
            type: TaxType.VAT,
          },
          {
            name: 'Hotel Occupancy Tax (14.75%)',
            rate: 14.75,
            amount: { amount: 1289.06, currency: Currency.USD },
            type: TaxType.CITY_TAX,
          },
          {
            name: 'Facility Fee ($3.50/晚)',
            rate: 3.5,
            amount: { amount: 17.5, currency: Currency.USD },
            type: TaxType.SERVICE_FEE,
          },
        ],
      },
      fees: {
        amount: {
          amount: 150,
          currency: Currency.USD,
        },
        breakdown: [
          {
            name: 'Extra Bed',
            amount: { amount: 150, currency: Currency.USD },
            description: '加床费用 (5晚 x $30)',
          },
        ],
      },
      discounts: {
        amount: {
          amount: 875,
          currency: Currency.USD,
        },
        breakdown: [
          {
            name: '限时特惠',
            code: 'SUMMER10',
            amount: { amount: 875, currency: Currency.USD },
            percentage: 10,
          },
        ],
      },
      grandTotal: {
        amount: 10108.12,
        currency: Currency.USD,
      },
    },
    status: OrderStatus.PENDING_PAYMENT,
    channelCode: 'stayglobal',
    paymentStatus: 'unpaid',
    cancellationDeadline: '2025-07-13T23:59:59Z',
    createdAt: '2025-03-20T09:15:00Z',
    updatedAt: '2025-03-20T09:15:00Z',
  },
  {
    id: 'booking-004',
    orderNumber: 'SG202503010004',
    hotelId: 'hotel-bangkok-001',
    hotelName: '文华东方曼谷',
    roomTypeId: 'room-bkk-002',
    roomTypeName: '作者翼套房',
    ratePlanId: 'rate-room-bkk-002-stayglobal',
    checkInDate: '2025-03-01',
    checkOutDate: '2025-03-05',
    nights: 4,
    guestCount: {
      adults: 2,
      children: 0,
      infants: 0,
    },
    guestInfo: [
      {
        firstName: 'Sarah',
        lastName: 'Johnson',
        email: 'sarah.johnson@example.com',
        phone: '+1 212 555 0101',
      },
    ],
    pricing: {
      roomTotal: {
        amount: 74000,
        currency: Currency.THB,
      },
      taxes: {
        amount: {
          amount: 12580,
          currency: Currency.THB,
        },
        breakdown: [
          {
            name: 'VAT (7%)',
            rate: 7,
            amount: { amount: 5180, currency: Currency.THB },
            type: TaxType.VAT,
          },
          {
            name: 'Tourism Tax (10%)',
            rate: 10,
            amount: { amount: 7400, currency: Currency.THB },
            type: TaxType.TOURISM_TAX,
          },
        ],
      },
      fees: {
        amount: {
          amount: 0,
          currency: Currency.THB,
        },
        breakdown: [],
      },
      discounts: {
        amount: {
          amount: 0,
          currency: Currency.THB,
        },
        breakdown: [],
      },
      grandTotal: {
        amount: 86580,
        currency: Currency.THB,
      },
    },
    status: OrderStatus.CANCELLED,
    channelCode: 'stayglobal',
    paymentStatus: 'refunded',
    createdAt: '2025-02-10T16:45:00Z',
    updatedAt: '2025-02-28T11:30:00Z',
  },
  {
    id: 'booking-005',
    orderNumber: 'SG202505010005',
    hotelId: 'hotel-dubai-001',
    hotelName: 'Atlantis The Royal',
    roomTypeId: 'room-dubai-002',
    roomTypeName: '天际线套房',
    ratePlanId: 'rate-room-dubai-002-stayglobal',
    checkInDate: '2025-05-01',
    checkOutDate: '2025-05-07',
    nights: 6,
    guestCount: {
      adults: 2,
      children: 0,
      infants: 0,
    },
    guestInfo: [
      {
        firstName: '伟',
        lastName: '张',
        email: 'zhang.wei@example.com',
        phone: '+86 138 0000 0001',
      },
    ],
    specialRequests: '希望安排高楼层海景房',
    pricing: {
      roomTotal: {
        amount: 16800,
        currency: Currency.AED,
      },
      taxes: {
        amount: {
          amount: 2610,
          currency: Currency.AED,
        },
        breakdown: [
          {
            name: 'Tourism Dirham (AED 15/晚)',
            rate: 15,
            amount: { amount: 90, currency: Currency.AED },
            type: TaxType.TOURISM_TAX,
          },
          {
            name: 'VAT (5%)',
            rate: 5,
            amount: { amount: 840, currency: Currency.AED },
            type: TaxType.VAT,
          },
          {
            name: 'Service Charge (10%)',
            rate: 10,
            amount: { amount: 1680, currency: Currency.AED },
            type: TaxType.SERVICE_FEE,
          },
        ],
      },
      fees: {
        amount: {
          amount: 0,
          currency: Currency.AED,
        },
        breakdown: [],
      },
      discounts: {
        amount: {
          amount: 1680,
          currency: Currency.AED,
        },
        breakdown: [
          {
            name: '会员专享折扣',
            code: 'GOLD10',
            amount: { amount: 1680, currency: Currency.AED },
            percentage: 10,
          },
        ],
      },
      grandTotal: {
        amount: 17730,
        currency: Currency.AED,
      },
    },
    status: OrderStatus.CONFIRMED,
    channelCode: 'stayglobal',
    paymentStatus: 'paid',
    confirmationNumber: 'SG-20250501-456123',
    cancellationDeadline: '2025-04-24T23:59:59Z',
    createdAt: '2025-03-10T11:00:00Z',
    updatedAt: '2025-03-10T11:05:00Z',
  },
  {
    id: 'booking-006',
    orderNumber: 'SG202508100006',
    hotelId: 'hotel-singapore-001',
    hotelName: 'Marina Bay Sands',
    roomTypeId: 'room-sg-002',
    roomTypeName: '滨海湾套房',
    ratePlanId: 'rate-room-sg-002-stayglobal',
    checkInDate: '2025-08-10',
    checkOutDate: '2025-08-14',
    nights: 4,
    guestCount: {
      adults: 2,
      children: 0,
      infants: 0,
    },
    guestInfo: [
      {
        firstName: '雪',
        lastName: '田中',
        email: 'tanaka.yuki@example.com',
        phone: '+81 90 1234 5678',
      },
    ],
    specialRequests: '蜜月旅行，希望有特别布置',
    pricing: {
      roomTotal: {
        amount: 4320,
        currency: Currency.SGD,
      },
      taxes: {
        amount: {
          amount: 777.6,
          currency: Currency.SGD,
        },
        breakdown: [
          {
            name: 'GST (8%)',
            rate: 8,
            amount: { amount: 345.6, currency: Currency.SGD },
            type: TaxType.VAT,
          },
          {
            name: 'Service Charge (10%)',
            rate: 10,
            amount: { amount: 432, currency: Currency.SGD },
            type: TaxType.SERVICE_FEE,
          },
        ],
      },
      fees: {
        amount: {
          amount: 0,
          currency: Currency.SGD,
        },
        breakdown: [],
      },
      discounts: {
        amount: {
          amount: 0,
          currency: Currency.SGD,
        },
        breakdown: [],
      },
      grandTotal: {
        amount: 5097.6,
        currency: Currency.SGD,
      },
    },
    status: OrderStatus.CONFIRMED,
    channelCode: 'stayglobal',
    paymentStatus: 'paid',
    confirmationNumber: 'SG-20250810-789654',
    cancellationDeadline: '2025-08-03T23:59:59Z',
    createdAt: '2025-03-18T13:45:00Z',
    updatedAt: '2025-03-18T13:50:00Z',
  },
];

export function getBookingsByUserId(userId: string): BookingOrder[] {
  return mockBookings.filter(b => {
    const user = mockUsers.find(u => u.id === userId);
    return user && b.guestInfo.some(g => g.email === user.email);
  });
}

export function getBookingById(bookingId: string): BookingOrder | undefined {
  return mockBookings.find(b => b.id === bookingId);
}

export function getBookingsByHotelId(hotelId: string): BookingOrder[] {
  return mockBookings.filter(b => b.hotelId === hotelId);
}

export function getBookingsByStatus(status: OrderStatus): BookingOrder[] {
  return mockBookings.filter(b => b.status === status);
}
