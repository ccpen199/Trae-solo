import { Repository } from "typeorm";
import { AppDataSource } from "../config/database";
import { User } from "../models/User";
import { hashPassword, comparePassword } from "../utils/password";
import { generateToken } from "../utils/jwt";
import { UserRole } from "../utils/enums";

export class UserService {
  private userRepository: Repository<User>;

  constructor() {
    this.userRepository = AppDataSource.getRepository(User);
  }

  async createUser(
    username: string,
    password: string,
    fullName: string,
    email?: string,
    role: UserRole = UserRole.VIEWER
  ): Promise<User> {
    const existingUser = await this.userRepository.findOne({
      where: [{ username }, { email }],
    });

    if (existingUser) {
      throw new Error("User with this username or email already exists");
    }

    const hashedPassword = await hashPassword(password);

    const user = this.userRepository.create({
      username,
      password: hashedPassword,
      fullName,
      email,
      role,
    });

    return this.userRepository.save(user);
  }

  async login(username: string, password: string): Promise<{ user: User; token: string }> {
    const user = await this.userRepository.findOne({
      where: { username },
    });

    if (!user) {
      throw new Error("Invalid username or password");
    }

    if (!user.isActive) {
      throw new Error("User account is disabled");
    }

    const isPasswordValid = await comparePassword(password, user.password);

    if (!isPasswordValid) {
      throw new Error("Invalid username or password");
    }

    const token = generateToken({
      userId: user.id,
      username: user.username,
      role: user.role,
    });

    return { user, token };
  }

  async findById(userId: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { id: userId },
      relations: ["projects", "groups"],
    });
  }

  async findAll(options?: {
    skip?: number;
    take?: number;
    role?: UserRole;
    search?: string;
  }): Promise<{ users: User[]; total: number }> {
    const qb = this.userRepository.createQueryBuilder("user");

    if (options?.role) {
      qb.andWhere("user.role = :role", { role: options.role });
    }

    if (options?.search) {
      qb.andWhere(
        "(user.username LIKE :search OR user.fullName LIKE :search OR user.email LIKE :search)",
        { search: `%${options.search}%` }
      );
    }

    if (options?.skip !== undefined) {
      qb.skip(options.skip);
    }

    if (options?.take !== undefined) {
      qb.take(options.take);
    }

    qb.orderBy("user.createdAt", "DESC");

    const [users, total] = await qb.getManyAndCount();

    return { users, total };
  }

  async updateUser(
    userId: string,
    updates: Partial<Pick<User, "fullName" | "email" | "role" | "isActive">>
  ): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new Error("User not found");
    }

    if (updates.email) {
      const existingUser = await this.userRepository.findOne({
        where: { email: updates.email },
      });

      if (existingUser && existingUser.id !== userId) {
        throw new Error("Email already in use");
      }
    }

    Object.assign(user, updates);

    return this.userRepository.save(user);
  }

  async changePassword(
    userId: string,
    oldPassword: string,
    newPassword: string
  ): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new Error("User not found");
    }

    const isOldPasswordValid = await comparePassword(oldPassword, user.password);

    if (!isOldPasswordValid) {
      throw new Error("Current password is incorrect");
    }

    user.password = await hashPassword(newPassword);
    await this.userRepository.save(user);
  }

  async createDefaultAdmin(): Promise<void> {
    const adminExists = await this.userRepository.findOne({
      where: { role: UserRole.ADMIN },
    });

    if (adminExists) {
      console.log("Default admin already exists");
      return;
    }

    await this.createUser(
      "admin",
      "admin123",
      "System Administrator",
      "admin@bugtracker.local",
      UserRole.ADMIN
    );

    console.log("Default admin user created");
    console.log("Username: admin");
    console.log("Password: admin123");
  }
}

export const userService = new UserService();
