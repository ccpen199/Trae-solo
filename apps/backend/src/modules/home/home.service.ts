import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HomeEntity } from '../../database/entities/home.entity';
import { RoomEntity } from '../../database/entities/room.entity';
import { DeviceEntity } from '../../database/entities/device.entity';
import { UserEntity } from '../../database/entities/user.entity';

@Injectable()
export class HomeService {
  constructor(
    @InjectRepository(HomeEntity) private readonly homeRepo: Repository<HomeEntity>,
    @InjectRepository(RoomEntity) private readonly roomRepo: Repository<RoomEntity>,
    @InjectRepository(DeviceEntity) private readonly deviceRepo: Repository<DeviceEntity>,
    @InjectRepository(UserEntity) private readonly userRepo: Repository<UserEntity>,
  ) {}

  async getUserHomes(userId: string) {
    const allHomes = await this.homeRepo
      .createQueryBuilder('h')
      .leftJoinAndSelect('h.rooms', 'r')
      .where('h.ownerId = :userId', { userId })
      .orderBy('h.createdAt', 'DESC')
      .addOrderBy('r.sortOrder', 'ASC')
      .getMany();

    const memberHomes = await this.homeRepo
      .createQueryBuilder('h')
      .leftJoinAndSelect('h.rooms', 'r')
      .where('h.ownerId != :userId', { userId })
      .andWhere("h.members LIKE :pattern", { pattern: `%"userId":"${userId}"%` })
      .orderBy('h.createdAt', 'DESC')
      .addOrderBy('r.sortOrder', 'ASC')
      .getMany();

    const seenIds = new Set<string>();
    return [...allHomes, ...memberHomes].filter(h => {
      if (seenIds.has(h.id)) return false;
      seenIds.add(h.id);
      return true;
    });
  }

  async createHome(userId: string, dto: { name: string; address?: string; latitude?: number; longitude?: number }) {
    const home = this.homeRepo.create({
      ...dto,
      ownerId: userId,
      members: [{ userId, role: 'owner' }],
    });
    const saved = await this.homeRepo.save(home);

    const defaultRooms = ['客厅', '卧室', '厨房', '书房', '阳台'];
    for (let i = 0; i < defaultRooms.length; i++) {
      await this.roomRepo.save(this.roomRepo.create({
        homeId: saved.id,
        name: defaultRooms[i],
        sortOrder: i,
      }));
    }

    return this.findOne(saved.id);
  }

  async findOne(id: string) {
    const home = await this.homeRepo
      .createQueryBuilder('h')
      .leftJoinAndSelect('h.rooms', 'r')
      .where('h.id = :id', { id })
      .orderBy('r.sortOrder', 'ASC')
      .getOne();
    if (!home) throw new NotFoundException('家庭不存在');
    return home;
  }

  async update(id: string, userId: string, dto: Partial<HomeEntity>) {
    const home = await this.checkAccess(id, userId, ['owner', 'admin']);
    Object.assign(home, dto);
    return this.homeRepo.save(home);
  }

  async addMember(homeId: string, userId: string, dto: { emailOrPhone: string; role: 'admin' | 'member' }) {
    await this.checkAccess(homeId, userId, ['owner']);
    const user = await this.userRepo.findOne({
      where: [{ email: dto.emailOrPhone }, { phone: dto.emailOrPhone }],
    });
    if (!user) throw new NotFoundException('用户不存在');

    const home = await this.findOne(homeId);
    if (home.members.some(m => m.userId === user.id)) {
      throw new BadRequestException('该用户已是家庭成员');
    }
    home.members.push({ userId: user.id, role: dto.role });
    return this.homeRepo.save(home);
  }

  async removeMember(homeId: string, userId: string, targetUserId: string) {
    await this.checkAccess(homeId, userId, ['owner']);
    const home = await this.findOne(homeId);
    home.members = home.members.filter(m => m.userId !== targetUserId);
    return this.homeRepo.save(home);
  }

  async createRoom(homeId: string, userId: string, dto: { name: string; icon?: string }) {
    await this.checkAccess(homeId, userId, ['owner', 'admin']);
    const maxOrder = await this.roomRepo
      .createQueryBuilder('r')
      .select('MAX(r.sortOrder)', 'max')
      .where('r.homeId = :homeId', { homeId })
      .getRawOne();
    const room = this.roomRepo.create({
      homeId,
      name: dto.name,
      icon: dto.icon,
      sortOrder: (maxOrder?.max ?? -1) + 1,
    });
    return this.roomRepo.save(room);
  }

  async updateRoom(roomId: string, userId: string, dto: { name?: string; icon?: string; sortOrder?: number }) {
    const room = await this.roomRepo.findOne({ where: { id: roomId } });
    if (!room) throw new NotFoundException('房间不存在');
    await this.checkAccess(room.homeId, userId, ['owner', 'admin']);
    Object.assign(room, dto);
    return this.roomRepo.save(room);
  }

  async deleteRoom(roomId: string, userId: string) {
    const room = await this.roomRepo.findOne({ where: { id: roomId } });
    if (!room) throw new NotFoundException('房间不存在');
    await this.checkAccess(room.homeId, userId, ['owner']);
    await this.deviceRepo.update({ roomId }, { roomId: null });
    await this.roomRepo.delete(roomId);
    return { success: true };
  }

  async getRoomsWithDevices(homeId: string, userId: string) {
    await this.checkAccess(homeId, userId, ['owner', 'admin', 'member']);
    const rooms = await this.roomRepo
      .createQueryBuilder('r')
      .leftJoinAndMapMany('r.devices', DeviceEntity, 'd', 'd.roomId = r.id')
      .where('r.homeId = :homeId', { homeId })
      .orderBy('r.sortOrder', 'ASC')
      .addOrderBy('d.createdAt', 'DESC')
      .getMany();

    const unassigned = await this.deviceRepo.find({
      where: { homeId, roomId: null as any },
    });

    return { rooms, unassigned };
  }

  private async checkAccess(homeId: string, userId: string, allowedRoles: string[]): Promise<HomeEntity> {
    const home = await this.findOne(homeId);
    if (home.ownerId === userId && allowedRoles.includes('owner')) return home;
    const member = home.members.find(m => m.userId === userId);
    if (member && allowedRoles.includes(member.role)) return home;
    throw new ForbiddenException('没有权限执行此操作');
  }
}
