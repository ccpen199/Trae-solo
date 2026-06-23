import 'reflect-metadata';
import { DataSource } from 'typeorm';
import path from 'path';
import { Community } from './entities/Community';
import { Project } from './entities/Project';
import { User } from './entities/User';
import { Bill } from './entities/Bill';
import { WorkOrder } from './entities/WorkOrder';
import { Announcement } from './entities/Announcement';
import { Post } from './entities/Post';
import { Comment } from './entities/Comment';
import { MerchantProduct } from './entities/MerchantProduct';
import { Order } from './entities/Order';
import { Activity } from './entities/Activity';
import { ActivityRegistration } from './entities/ActivityRegistration';
import { Message } from './entities/Message';
import { GovDataChannel } from './entities/GovDataChannel';

export const AppDataSource = new DataSource({
  type: 'sqljs',
  location: path.resolve('data', 'community.db'),
  autoSave: true,
  synchronize: true,
  logging: false,
  entities: [
    Community, Project, User, Bill, WorkOrder, Announcement,
    Post, Comment, MerchantProduct, Order, Activity,
    ActivityRegistration, Message, GovDataChannel,
  ],
});
