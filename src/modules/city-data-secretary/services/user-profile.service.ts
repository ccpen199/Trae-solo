import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserProfile } from '../entities/user-profile.entity';
import { UpdateProfileDto } from '../dto/profile.dto';

@Injectable()
export class UserProfileService {
  private readonly logger = new Logger(UserProfileService.name);

  constructor(
    @InjectRepository(UserProfile)
    private readonly userProfileRepo: Repository<UserProfile>,
  ) {}

  async getProfile(userId: string): Promise<UserProfile> {
    let profile = await this.userProfileRepo.findOne({
      where: { userId },
    });

    if (!profile) {
      profile = this.userProfileRepo.create({
        userId,
      });
      profile = await this.userProfileRepo.save(profile);
    }

    return profile;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto): Promise<UserProfile> {
    let profile = await this.userProfileRepo.findOne({
      where: { userId },
    });

    if (!profile) {
      profile = this.userProfileRepo.create({ userId });
    }

    Object.assign(profile, dto);
    return this.userProfileRepo.save(profile);
  }

  async upsertProfile(userId: string, data: Partial<UserProfile>): Promise<UserProfile> {
    let profile = await this.userProfileRepo.findOne({
      where: { userId },
    });

    if (!profile) {
      profile = this.userProfileRepo.create({ userId, ...data });
    } else {
      Object.assign(profile, data);
    }

    return this.userProfileRepo.save(profile);
  }

  async batchGetProfiles(userIds: string[]): Promise<UserProfile[]> {
    if (userIds.length === 0) return [];
    return this.userProfileRepo
      .createQueryBuilder('p')
      .where('p.user_id IN (:...userIds)', { userIds })
      .getMany();
  }

  async deleteProfile(userId: string): Promise<void> {
    await this.userProfileRepo.softDelete({ userId });
  }
}
