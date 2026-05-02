import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Member } from '../entities/member.entity';
import { MemberLevel, MemberStatus } from '../../common/types';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class MembersService {
  private readonly logger = new Logger(MembersService.name);

  constructor(
    @InjectRepository(Member)
    private memberRepository: Repository<Member>,
  ) {}

  async createMember(
    memberData: {
      name: string;
      phone: string;
      avatar?: string;
      birthday?: string;
      address?: string;
    },
  ): Promise<Member> {
    const existing = await this.memberRepository.findOne({
      where: { phone: memberData.phone },
    });

    if (existing) {
      throw new Error(`手机号已注册: ${memberData.phone}`);
    }

    const memberNumber = this.generateMemberNumber();

    const member = this.memberRepository.create({
      ...memberData,
      memberNumber,
      level: MemberLevel.REGULAR,
      status: MemberStatus.ACTIVE,
      balance: 0,
      points: 0,
      totalSpent: 0,
      orderCount: 0,
    });

    return this.memberRepository.save(member);
  }

  async getAllMembers(
    filters?: {
      level?: MemberLevel;
      status?: MemberStatus;
      keyword?: string;
    },
    pagination?: {
      page?: number;
      limit?: number;
    },
  ): Promise<{ data: Member[]; total: number }> {
    const { page = 1, limit = 20 } = pagination || {};
    const queryBuilder = this.memberRepository.createQueryBuilder('member');

    if (filters?.level) {
      queryBuilder.andWhere('member.level = :level', { level: filters.level });
    }

    if (filters?.status) {
      queryBuilder.andWhere('member.status = :status', { status: filters.status });
    }

    if (filters?.keyword) {
      queryBuilder.andWhere(
        '(member.name LIKE :keyword OR member.phone LIKE :keyword OR member.memberNumber LIKE :keyword)',
        { keyword: `%${filters.keyword}%` },
      );
    }

    queryBuilder.orderBy('member.createdAt', 'DESC');
    queryBuilder.skip((page - 1) * limit).take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return { data, total };
  }

  async getMemberById(id: string): Promise<Member> {
    return this.memberRepository.findOne({
      where: { id },
    });
  }

  async getMemberByPhone(phone: string): Promise<Member> {
    return this.memberRepository.findOne({
      where: { phone },
    });
  }

  async updateMember(
    id: string,
    updates: Partial<Member>,
  ): Promise<Member> {
    const member = await this.memberRepository.findOne({
      where: { id },
    });

    if (!member) {
      throw new Error(`会员不存在: ${id}`);
    }

    Object.assign(member, updates);

    return this.memberRepository.save(member);
  }

  async recharge(
    id: string,
    amount: number,
  ): Promise<Member> {
    const member = await this.memberRepository.findOne({
      where: { id },
    });

    if (!member) {
      throw new Error(`会员不存在: ${id}`);
    }

    member.balance = member.balance + amount;

    return this.memberRepository.save(member);
  }

  async adjustPoints(
    id: string,
    points: number,
  ): Promise<Member> {
    const member = await this.memberRepository.findOne({
      where: { id },
    });

    if (!member) {
      throw new Error(`会员不存在: ${id}`);
    }

    member.points = member.points + points;

    if (member.points < 0) {
      throw new Error('积分不足');
    }

    return this.memberRepository.save(member);
  }

  async updateMemberLevel(id: string): Promise<Member> {
    const member = await this.memberRepository.findOne({
      where: { id },
    });

    if (!member) {
      throw new Error(`会员不存在: ${id}`);
    }

    let newLevel = MemberLevel.REGULAR;

    if (member.totalSpent >= 10000) {
      newLevel = MemberLevel.DIAMOND;
    } else if (member.totalSpent >= 5000) {
      newLevel = MemberLevel.PLATINUM;
    } else if (member.totalSpent >= 2000) {
      newLevel = MemberLevel.GOLD;
    } else if (member.totalSpent >= 500) {
      newLevel = MemberLevel.SILVER;
    }

    member.level = newLevel;

    return this.memberRepository.save(member);
  }

  async deactivateMember(id: string): Promise<void> {
    const member = await this.memberRepository.findOne({
      where: { id },
    });

    if (!member) {
      throw new Error(`会员不存在: ${id}`);
    }

    member.status = MemberStatus.INACTIVE;
    await this.memberRepository.save(member);
  }

  private generateMemberNumber(): string {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000000)
      .toString()
      .padStart(6, '0');
    return `M${year}${month}${random}`;
  }
}
