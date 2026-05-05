import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as path from 'path';
import * as fs from 'fs';

import { Site, Category, Content } from './common/entities/base.entity';
import { User } from './modules/users/entities/user.entity';
import { Role } from './modules/users/entities/role.entity';
import { Permission } from './modules/users/entities/permission.entity';
import { SitePermission } from './modules/users/entities/site-permission.entity';
import { CategoryPermission } from './modules/users/entities/category-permission.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const dbType = configService.get('DB_TYPE', 'sqlite');
        
        if (dbType === 'postgres') {
          return {
            type: 'postgres',
            host: configService.get('DB_HOST', 'localhost'),
            port: configService.get('DB_PORT', 5432),
            username: configService.get('DB_USERNAME', 'postgres'),
            password: configService.get('DB_PASSWORD', 'postgres'),
            database: configService.get('DB_DATABASE', 'cms_system'),
            entities: [Site, Category, Content, User, Role, Permission, SitePermission, CategoryPermission],
            synchronize: configService.get('NODE_ENV') === 'development',
            logging: configService.get('NODE_ENV') === 'development',
          };
        } else {
          const sqlitePath = configService.get('DB_SQLITE_PATH', './data/cms.sqlite');
          const sqliteDir = path.dirname(sqlitePath);
          if (!fs.existsSync(sqliteDir)) {
            fs.mkdirSync(sqliteDir, { recursive: true });
          }
          
          return {
            type: 'better-sqlite3',
            database: sqlitePath,
            entities: [Site, Category, Content, User, Role, Permission, SitePermission, CategoryPermission],
            synchronize: configService.get('NODE_ENV') === 'development',
            logging: configService.get('NODE_ENV') === 'development',
          };
        }
      },
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([Site, Category, Content, User, Role, Permission, SitePermission, CategoryPermission]),
  ],
  controllers: [],
  providers: [],
  exports: [TypeOrmModule],
})
export class CoreModule {}
