export * from './users';
export * from './bookings';
export * from './hotels';
export * from './itineraries';

import { mockUsers, mockMembers } from './users';
import { mockBookings } from './bookings';
import { mockHotels, mockRoomTypes, mockRatePlans, getMockSearchResults } from './hotels';
import { mockItineraries, mockGDPRRequests, mockPointsTransactions } from './itineraries';

export const mockData = {
  users: mockUsers,
  members: mockMembers,
  bookings: mockBookings,
  hotels: mockHotels,
  roomTypes: mockRoomTypes,
  ratePlans: mockRatePlans,
  searchResults: getMockSearchResults(),
  itineraries: mockItineraries,
  gdprRequests: mockGDPRRequests,
  pointsTransactions: mockPointsTransactions,
};

export default mockData;
