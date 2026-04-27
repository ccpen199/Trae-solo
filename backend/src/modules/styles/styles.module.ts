import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StylesService } from './styles.service';
import { StylesController } from './styles.controller';
import { Style } from './entities/style.entity';
import { StyleHistory } from './entities/style-history.entity';
import { EnginesModule } from '../engines/engines.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Style, StyleHistory]),
    EnginesModule,
  ],
  controllers: [StylesController],
  providers: [StylesService],
  exports: [StylesService, TypeOrmModule],
})
export class StylesModule {}
