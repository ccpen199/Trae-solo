import { PrismaClient, UserRole, RoomType, RoomStatus, ChannelType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('开始初始化数据库...');

  const hashedPassword = await bcrypt.hash('123456', 10);

  const users = await prisma.user.createMany({
    data: [
      {
        username: 'admin',
        password: hashedPassword,
        name: '系统管理员',
        role: UserRole.ADMIN,
      },
      {
        username: 'frontdesk',
        password: hashedPassword,
        name: '前台小李',
        role: UserRole.FRONT_DESK,
      },
      {
        username: 'housekeeping',
        password: hashedPassword,
        name: '房务小张',
        role: UserRole.HOUSEKEEPING,
      },
      {
        username: 'channel',
        password: hashedPassword,
        name: '渠道经理小王',
        role: UserRole.CHANNEL_MANAGER,
      },
    ],
    skipDuplicates: true,
  });

  console.log('创建用户:', users.count);

  const channels = await prisma.channel.createMany({
    data: [
      {
        name: '自有渠道',
        type: ChannelType.DIRECT,
        commissionRate: 0,
      },
      {
        name: '携程',
        type: ChannelType.OTA_CTRIP,
        commissionRate: 0.12,
      },
      {
        name: '飞猪',
        type: ChannelType.OTA_FLIGGY,
        commissionRate: 0.10,
      },
      {
        name: '美团',
        type: ChannelType.OTA_MEITUAN,
        commissionRate: 0.15,
      },
      {
        name: 'Booking.com',
        type: ChannelType.OTA_BOOKING,
        commissionRate: 0.18,
      },
    ],
    skipDuplicates: true,
  });

  console.log('创建渠道:', channels.count);

  const rooms: Array<{
    roomNumber: string;
    floor: number;
    type: RoomType;
    status: RoomStatus;
    maxGuests: number;
    basePrice: number;
    amenities: string[];
  }> = [];

  for (let floor = 1; floor <= 6; floor++) {
    for (let room = 1; room <= 8; room++) {
      const roomNumber = `${floor}${room.toString().padStart(2, '0')}`;
      const roomType = room <= 4 ? RoomType.STANDARD : 
                       room <= 6 ? RoomType.DELUXE : 
                       room === 7 ? RoomType.SUITE : RoomType.FAMILY;
      const basePrice = roomType === RoomType.STANDARD ? 299 :
                        roomType === RoomType.DELUXE ? 399 :
                        roomType === RoomType.SUITE ? 599 : 499;
      const maxGuests = roomType === RoomType.FAMILY ? 4 : 
                        roomType === RoomType.SUITE ? 2 : 2;

      rooms.push({
        roomNumber,
        floor,
        type: roomType,
        status: RoomStatus.VACANT,
        maxGuests,
        basePrice,
        amenities: ['WiFi', '空调', '电视', '独立卫浴'],
      });
    }
  }

  const createdRooms = await prisma.room.createMany({
    data: rooms,
    skipDuplicates: true,
  });

  console.log('创建房间:', createdRooms.count);

  console.log('初始化完成！');
  console.log('\n默认账号:');
  console.log('  admin     / 123456 (系统管理员)');
  console.log('  frontdesk / 123456 (前台)');
  console.log('  housekeeping / 123456 (房务)');
  console.log('  channel   / 123456 (渠道经理)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
