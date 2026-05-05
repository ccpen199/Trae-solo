import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_GUARD } from '@nestjs/core';
import { RedisModule } from './redis/redis.module';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { RoleModule } from './modules/role/role.module';
import { ModuleModule } from './modules/module/module.module';
import { OrganizationModule } from './modules/organization/organization.module';
import { StoreModule } from './modules/store/store.module';
import { WorkflowModule } from './modules/workflow/workflow.module';
import { ImModule } from './modules/im/im.module';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';
import { Client } from 'pg';
import * as path from 'path';

async function checkPostgresAvailable(configService: ConfigService): Promise<boolean> {
  const client = new Client({
    host: configService.get('DB_HOST'),
    port: configService.get<number>('DB_PORT'),
    user: configService.get('DB_USERNAME'),
    password: configService.get('DB_PASSWORD'),
    database: configService.get('DB_DATABASE'),
  });
  try {
    await client.connect();
    await client.end();
    return true;
  } catch {
    return false;
  }
}

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const postgresAvailable = await checkPostgresAvailable(configService);
        
        if (postgresAvailable) {
          console.log('使用 PostgreSQL 数据库');
          return {
            type: 'postgres',
            host: configService.get('DB_HOST'),
            port: configService.get<number>('DB_PORT'),
            username: configService.get('DB_USERNAME'),
            password: configService.get('DB_PASSWORD'),
            database: configService.get('DB_DATABASE'),
            entities: [__dirname + '/**/*.entity{.ts,.js}'],
            synchronize: true,
            logging: false,
          };
        } else {
          console.log('PostgreSQL 不可用，使用 better-sqlite3 作为本地降级方案');
          const dbPath = path.join(process.cwd(), 'data', 'database.sqlite');
          return {
            type: 'better-sqlite3',
            database: dbPath,
            entities: [__dirname + '/**/*.entity{.ts,.js}'],
            synchronize: true,
            logging: false,
          };
        }
      },
      inject: [ConfigService],
    }),
    RedisModule,
    AuthModule,
    UserModule,
    RoleModule,
    ModuleModule,
    OrganizationModule,
    StoreModule,
    WorkflowModule,
    ImModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
