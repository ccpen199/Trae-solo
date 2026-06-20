import type { ApiResponse } from '@/types/api';
import type { Community, Building, Unit, Room } from '@/types/entity';
import { mockDelay, mockSuccess } from '@/mocks/utils';
import { mockCommunities, mockBuildings, mockUnits, mockRooms } from '@/mocks/data/community';

export const getCommunityList = async (): Promise<ApiResponse<Community[]>> => {
  await mockDelay();
  return mockSuccess(mockCommunities);
};

export const getCommunityDetail = async (id: string): Promise<ApiResponse<Community | null>> => {
  await mockDelay();
  const community = mockCommunities.find((c) => c.id === id) || null;
  return mockSuccess(community);
};

export interface BuildingTreeItem extends Building {
  units: (Unit & { rooms: Room[] })[];
}

export const getBuildingTree = async (communityId: string): Promise<ApiResponse<BuildingTreeItem[]>> => {
  await mockDelay();

  const buildings = mockBuildings.filter((b) => b.communityId === communityId);
  const tree: BuildingTreeItem[] = buildings.map((building) => {
    const units = mockUnits.filter((u) => u.buildingId === building.id);
    const unitsWithRooms = units.map((unit) => ({
      ...unit,
      rooms: mockRooms.filter((r) => r.unitId === unit.id),
    }));
    return {
      ...building,
      units: unitsWithRooms,
    };
  });

  return mockSuccess(tree);
};

export const getRoomList = async (buildingId?: string): Promise<ApiResponse<Room[]>> => {
  await mockDelay();

  let rooms = mockRooms;
  if (buildingId) {
    const unitIds = mockUnits.filter((u) => u.buildingId === buildingId).map((u) => u.id);
    rooms = mockRooms.filter((r) => unitIds.includes(r.unitId));
  }

  return mockSuccess(rooms);
};
