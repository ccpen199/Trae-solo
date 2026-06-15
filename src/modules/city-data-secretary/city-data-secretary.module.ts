import { Module, OnModuleInit, Logger } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { DashboardController } from './dashboard.controller';
import { RecommendationController } from './recommendation.controller';

import { UserProfileService } from './services/user-profile.service';
import { DataAssetService } from './services/data-asset.service';
import { RecommendationEngineService } from './services/recommendation-engine.service';
import { UserTagService } from './services/user-tag.service';

import { UserProfile } from './entities/user-profile.entity';
import { UserTag } from './entities/user-tag.entity';
import { UserTagRel } from './entities/user-tag-rel.entity';
import { DataAsset } from './entities/data-asset.entity';
import { BehaviorLog } from './entities/behavior-log.entity';
import { Recommendation } from './entities/recommendation.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserProfile,
      UserTag,
      UserTagRel,
      DataAsset,
      BehaviorLog,
      Recommendation,
    ]),
  ],
  controllers: [
    DashboardController,
    RecommendationController,
  ],
  providers: [
    UserProfileService,
    DataAssetService,
    RecommendationEngineService,
    UserTagService,
  ],
  exports: [
    TypeOrmModule,
    UserProfileService,
    DataAssetService,
    RecommendationEngineService,
    UserTagService,
  ],
})
export class CityDataSecretaryModule implements OnModuleInit {
  private readonly logger = new Logger(CityDataSecretaryModule.name);

  constructor(
    private readonly userTagService: UserTagService,
  ) {}

  async onModuleInit() {
    this.logger.log('城市数据秘书模块初始化...');

    try {
      await this.userTagService.initializeTagLibrary();
      this.logger.log('标签库初始化完成');
    } catch (error) {
      this.logger.error(`标签库初始化失败: ${error.message}`);
    }

    this.logger.log('城市数据秘书模块初始化完成');
  }
}
