import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Role } from '../../common/enums/role.enum';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const existingUser = await this.usersRepository.findOne({
      where: [
        { username: createUserDto.username },
        { email: createUserDto.email },
      ],
    });

    if (existingUser) {
      throw new ConflictException('用户名或邮箱已存在');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    const user = this.usersRepository.create({
      ...createUserDto,
      password: hashedPassword,
    });

    return this.usersRepository.save(user);
  }

  async findAll(role?: Role): Promise<User[]> {
    const query = this.usersRepository.createQueryBuilder('user');

    if (role) {
      query.andWhere('user.role = :role', { role });
    }

    query.andWhere('user.deletedAt IS NULL');
    query.orderBy('user.createdAt', 'DESC');

    return query.getMany();
  }

  async findOne(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`用户不存在: ${id}`);
    }

    return user;
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { username },
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);

    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    Object.assign(user, updateUserDto);

    return this.usersRepository.save(user);
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    user.isActive = false;
    await this.usersRepository.softDelete(id);
  }

  async getDesigners(): Promise<User[]> {
    return this.usersRepository.find({
      where: { role: Role.DESIGNER, isActive: true },
      order: { name: 'ASC' },
    });
  }

  async getPatternMakers(): Promise<User[]> {
    return this.usersRepository.find({
      where: { role: Role.PATTERN_MAKER, isActive: true },
      order: { name: 'ASC' },
    });
  }

  async getPurchasers(): Promise<User[]> {
    return this.usersRepository.find({
      where: { role: Role.PURCHASER, isActive: true },
      order: { name: 'ASC' },
    });
  }

  async getFactories(): Promise<User[]> {
    return this.usersRepository.find({
      where: { role: Role.FACTORY, isActive: true },
      order: { name: 'ASC' },
    });
  }
}
