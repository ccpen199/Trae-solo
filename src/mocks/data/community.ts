import type { Community, Building, Unit, Room } from '@/types/entity';

const now = new Date().toISOString();
const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

export const mockCommunities: Community[] = [
  {
    id: 'comm_yangguang',
    name: '阳光花园',
    address: '北京市朝阳区阳光路88号',
    totalBuildings: 3,
    totalUnits: 6,
    totalRooms: 120,
    createdAt: thirtyDaysAgo,
    updatedAt: now,
  },
  {
    id: 'comm_cuihu',
    name: '翠湖天地',
    address: '北京市海淀区翠湖路66号',
    totalBuildings: 3,
    totalUnits: 6,
    totalRooms: 120,
    createdAt: thirtyDaysAgo,
    updatedAt: now,
  },
];

export const mockBuildings: Building[] = [
  {
    id: 'bld_yangguang_1',
    communityId: 'comm_yangguang',
    name: '1号楼',
    totalUnits: 2,
    totalRooms: 40,
    createdAt: thirtyDaysAgo,
    updatedAt: now,
  },
  {
    id: 'bld_yangguang_2',
    communityId: 'comm_yangguang',
    name: '2号楼',
    totalUnits: 2,
    totalRooms: 40,
    createdAt: thirtyDaysAgo,
    updatedAt: now,
  },
  {
    id: 'bld_yangguang_3',
    communityId: 'comm_yangguang',
    name: '3号楼',
    totalUnits: 2,
    totalRooms: 40,
    createdAt: thirtyDaysAgo,
    updatedAt: now,
  },
  {
    id: 'bld_cuihu_1',
    communityId: 'comm_cuihu',
    name: '1号楼',
    totalUnits: 2,
    totalRooms: 40,
    createdAt: thirtyDaysAgo,
    updatedAt: now,
  },
  {
    id: 'bld_cuihu_2',
    communityId: 'comm_cuihu',
    name: '2号楼',
    totalUnits: 2,
    totalRooms: 40,
    createdAt: thirtyDaysAgo,
    updatedAt: now,
  },
  {
    id: 'bld_cuihu_3',
    communityId: 'comm_cuihu',
    name: '3号楼',
    totalUnits: 2,
    totalRooms: 40,
    createdAt: thirtyDaysAgo,
    updatedAt: now,
  },
];

export const mockUnits: Unit[] = [
  { id: 'unit_yangguang_1_1', buildingId: 'bld_yangguang_1', name: '1单元', totalRooms: 20, createdAt: thirtyDaysAgo, updatedAt: now },
  { id: 'unit_yangguang_1_2', buildingId: 'bld_yangguang_1', name: '2单元', totalRooms: 20, createdAt: thirtyDaysAgo, updatedAt: now },
  { id: 'unit_yangguang_2_1', buildingId: 'bld_yangguang_2', name: '1单元', totalRooms: 20, createdAt: thirtyDaysAgo, updatedAt: now },
  { id: 'unit_yangguang_2_2', buildingId: 'bld_yangguang_2', name: '2单元', totalRooms: 20, createdAt: thirtyDaysAgo, updatedAt: now },
  { id: 'unit_yangguang_3_1', buildingId: 'bld_yangguang_3', name: '1单元', totalRooms: 20, createdAt: thirtyDaysAgo, updatedAt: now },
  { id: 'unit_yangguang_3_2', buildingId: 'bld_yangguang_3', name: '2单元', totalRooms: 20, createdAt: thirtyDaysAgo, updatedAt: now },
  { id: 'unit_cuihu_1_1', buildingId: 'bld_cuihu_1', name: '1单元', totalRooms: 20, createdAt: thirtyDaysAgo, updatedAt: now },
  { id: 'unit_cuihu_1_2', buildingId: 'bld_cuihu_1', name: '2单元', totalRooms: 20, createdAt: thirtyDaysAgo, updatedAt: now },
  { id: 'unit_cuihu_2_1', buildingId: 'bld_cuihu_2', name: '1单元', totalRooms: 20, createdAt: thirtyDaysAgo, updatedAt: now },
  { id: 'unit_cuihu_2_2', buildingId: 'bld_cuihu_2', name: '2单元', totalRooms: 20, createdAt: thirtyDaysAgo, updatedAt: now },
  { id: 'unit_cuihu_3_1', buildingId: 'bld_cuihu_3', name: '1单元', totalRooms: 20, createdAt: thirtyDaysAgo, updatedAt: now },
  { id: 'unit_cuihu_3_2', buildingId: 'bld_cuihu_3', name: '2单元', totalRooms: 20, createdAt: thirtyDaysAgo, updatedAt: now },
];

const ownerMap: Record<string, { ownerId: string; ownerName: string }> = {
  'room_yangguang_1_1_1001': { ownerId: 'user_res_001', ownerName: '张三' },
  'room_yangguang_1_1_1002': { ownerId: 'user_res_002', ownerName: '李四' },
  'room_yangguang_2_1_301': { ownerId: 'user_res_003', ownerName: '王五' },
  'room_cuihu_1_1_501': { ownerId: 'user_res_004', ownerName: '赵六' },
  'room_cuihu_2_2_802': { ownerId: 'user_res_005', ownerName: '孙七' },
  'room_yangguang_3_2_602': { ownerId: 'user_res_006', ownerName: '周八' },
};

const generateRooms = (communityPrefix: string, buildingIdx: number, unitIdx: number): Room[] => {
  const rooms: Room[] = [];
  const unitId = `unit_${communityPrefix}_${buildingIdx}_${unitIdx}`;
  for (let floor = 1; floor <= 10; floor++) {
    for (let room = 1; room <= 2; room++) {
      const roomNumber = `${floor}0${room}`;
      const roomId = `room_${communityPrefix}_${buildingIdx}_${unitIdx}_${roomNumber}`;
      const ownerInfo = ownerMap[roomId];
      rooms.push({
        id: roomId,
        unitId,
        roomNumber,
        area: 90 + Math.floor(Math.random() * 40),
        ownerId: ownerInfo?.ownerId,
        ownerName: ownerInfo?.ownerName,
        createdAt: thirtyDaysAgo,
        updatedAt: now,
      });
    }
  }
  return rooms;
};

export const mockRooms: Room[] = [
  ...generateRooms('yangguang', 1, 1),
  ...generateRooms('yangguang', 1, 2),
  ...generateRooms('yangguang', 2, 1),
  ...generateRooms('yangguang', 2, 2),
  ...generateRooms('yangguang', 3, 1),
  ...generateRooms('yangguang', 3, 2),
  ...generateRooms('cuihu', 1, 1),
  ...generateRooms('cuihu', 1, 2),
  ...generateRooms('cuihu', 2, 1),
  ...generateRooms('cuihu', 2, 2),
  ...generateRooms('cuihu', 3, 1),
  ...generateRooms('cuihu', 3, 2),
];
