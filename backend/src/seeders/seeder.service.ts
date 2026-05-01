import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { User } from '../users/entities/user.entity';
import { Category, Content } from '../contents/entities/content.entity';
import { ContentVersion } from '../contents/entities/content-version.entity';
import { UserRole, ContentStatus } from '../common/enums';

const DEFAULT_USERS = [
  {
    username: 'admin',
    email: 'admin@cms.local',
    password: 'Admin@123',
    role: UserRole.ADMIN,
    displayName: '系统管理员',
    department: '技术部',
  },
  {
    username: 'chief_editor',
    email: 'chief@cms.local',
    password: 'Chief@123',
    role: UserRole.CHIEF_EDITOR,
    displayName: '张主编',
    department: '内容部',
  },
  {
    username: 'editor_zhang',
    email: 'zhang@cms.local',
    password: 'Editor@123',
    role: UserRole.EDITOR,
    displayName: '李编辑',
    department: '内容部',
  },
  {
    username: 'operator_wang',
    email: 'wang@cms.local',
    password: 'Operator@123',
    role: UserRole.CHANNEL_OPERATOR,
    displayName: '王运营',
    department: '运营部',
  },
  {
    username: 'analyst_liu',
    email: 'liu@cms.local',
    password: 'Analyst@123',
    role: UserRole.DATA_ANALYST,
    displayName: '刘分析师',
    department: '数据分析部',
  },
];

const DEFAULT_CATEGORIES = [
  { name: '新闻资讯', slug: 'news', description: '新闻资讯类内容', sortOrder: 1 },
  { name: '专题报道', slug: 'special', description: '专题深度报道', sortOrder: 2 },
  { name: '专栏文章', slug: 'column', description: '专栏作者文章', sortOrder: 3 },
  { name: '视频内容', slug: 'video', description: '视频类内容', sortOrder: 4 },
  { name: '图片故事', slug: 'gallery', description: '图片故事类内容', sortOrder: 5 },
];

@Injectable()
export class SeederService implements OnModuleInit {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
    @InjectRepository(Content)
    private contentRepository: Repository<Content>,
    @InjectRepository(ContentVersion)
    private contentVersionRepository: Repository<ContentVersion>,
  ) {}

  async onModuleInit() {
    await this.seedUsers();
    await this.seedCategories();
    await this.seedContents();
  }

  private async seedUsers() {
    const count = await this.userRepository.count();
    if (count > 0) {
      console.log('📋 Users already exist, skipping seed');
      return;
    }

    console.log('🌱 Seeding default users...');

    for (const userData of DEFAULT_USERS) {
      const passwordHash = await bcrypt.hash(userData.password, 10);

      const user = this.userRepository.create({
        id: uuidv4(),
        username: userData.username,
        email: userData.email,
        passwordHash,
        role: userData.role,
        displayName: userData.displayName,
        department: userData.department,
        isActive: true,
      });

      await this.userRepository.save(user);
      console.log(`  ✅ Created user: ${userData.username} (${userData.role})`);
    }

    console.log('✅ Default users seeded successfully');
  }

  private async seedCategories() {
    const count = await this.categoryRepository.count();
    if (count > 0) {
      console.log('📋 Categories already exist, skipping seed');
      return;
    }

    console.log('🌱 Seeding default categories...');

    for (const catData of DEFAULT_CATEGORIES) {
      const category = this.categoryRepository.create({
        id: uuidv4(),
        ...catData,
        isActive: true,
      });

      await this.categoryRepository.save(category);
      console.log(`  ✅ Created category: ${catData.name}`);
    }

    console.log('✅ Default categories seeded successfully');
  }

  private async seedContents() {
    const count = await this.contentRepository.count();
    if (count > 0) {
      console.log('📋 Contents already exist, skipping seed');
      return;
    }

    const users = await this.userRepository.find();
    const categories = await this.categoryRepository.find();

    if (users.length === 0 || categories.length === 0) {
      console.log('⚠️ No users or categories found, skipping content seed');
      return;
    }

    console.log('🌱 Seeding default contents...');

    const editorZhang = users.find(u => u.username === 'editor_zhang');
    const chiefEditor = users.find(u => u.username === 'chief_editor');
    const newsCategory = categories.find(c => c.slug === 'news');
    const specialCategory = categories.find(c => c.slug === 'special');
    const columnCategory = categories.find(c => c.slug === 'column');

    const sampleContents = [
      {
        title: '2024年数字化转型趋势分析报告',
        summary: '本文深入分析了当前企业数字化转型的最新趋势，包括AI驱动的自动化、云原生架构的普及、数据安全与合规性等关键领域。',
        contentBody: `# 2024年数字化转型趋势分析报告

## 一、引言

数字化转型已成为企业发展的核心战略。在2024年，我们看到了许多令人兴奋的新趋势正在重塑商业格局。

## 二、主要趋势

### 1. AI驱动的自动化

人工智能技术的快速发展使得企业能够实现更高水平的自动化。从客户服务到供应链管理，AI正在各个领域创造价值。

### 2. 云原生架构的普及

越来越多的企业正在采用云原生架构，实现更灵活、可扩展的应用部署方式。

### 3. 数据安全与合规性

随着数据法规的不断完善，企业需要更加重视数据安全和合规性建设。

## 三、结论

数字化转型不再是可选项，而是企业生存发展的必选项。企业需要积极拥抱这些新技术，才能在竞争中保持优势。`,
        status: ContentStatus.PUBLISHED,
        category: newsCategory,
        author: editorZhang,
      },
      {
        title: '企业内容管理平台选型指南',
        summary: '如何选择适合企业需求的内容管理平台？本文从功能、性能、安全性、扩展性等多个维度进行了深入分析。',
        contentBody: `# 企业内容管理平台选型指南

## 一、为什么需要内容管理平台

在数字时代，内容已成为企业最重要的资产之一。有效的内容管理能够：

- 提高工作效率
- 确保内容一致性
- 支持多渠道发布
- 提供数据分析洞察

## 二、核心功能评估

### 1. 内容创作与编辑

- 富文本编辑器
- 版本控制
- 协作编辑功能

### 2. 工作流管理

- 自定义审批流程
- 角色权限管理
- 通知提醒机制

### 3. 多渠道分发

- 一键发布到多个平台
- 定时发布功能
- 发布状态追踪

## 三、技术考量

1. 系统架构
2. 集成能力
3. 安全合规

## 四、总结

选择合适的内容管理平台是企业数字化转型的重要一步。`,
        status: ContentStatus.IN_REVIEW,
        category: specialCategory,
        author: editorZhang,
      },
      {
        title: '媒体资产管理最佳实践',
        summary: '媒体资产是内容企业的核心资源。本文分享了媒体资产管理的最佳实践，包括存储策略、元数据管理、权限控制等。',
        contentBody: `# 媒体资产管理最佳实践

## 一、媒体资产管理概述

媒体资产包括图片、视频、音频、文档等各种形式的数字内容。

## 二、存储策略

### 1. 分级存储架构

- 热存储：频繁访问的文件
- 温存储：定期访问的文件
- 冷存储：长期归档的文件

### 2. 备份与恢复

- 自动备份机制
- 异地容灾
- 快速恢复能力

## 三、元数据管理

完善的元数据是高效管理的基础：

1. 技术元数据：文件格式、分辨率、大小等
2. 业务元数据：标签、分类、状态等
3. 管理元数据：创建者、创建时间、访问权限等

## 四、权限控制

基于角色的访问控制是企业级应用的标准做法。

## 五、总结

媒体资产管理需要综合考虑技术、流程和人员三个维度。`,
        status: ContentStatus.DRAFT,
        category: columnCategory,
        author: editorZhang,
      },
      {
        title: '主编视角：内容审核的艺术与科学',
        summary: '作为一名资深主编分享内容审核的经验和心得，探讨如何在保持内容质量的同时提高审核效率。',
        contentBody: `# 主编视角：内容审核的艺术与科学

## 一、引言

内容审核是内容生产流程中至关重要的一环。它既是一门艺术，也是一门科学。

## 二、审核原则

### 1. 准确性原则

事实核查是内容审核的基础。

### 2. 合规性原则

确保内容符合法律法规和平台规范。

### 3. 质量原则

语言表达、逻辑结构、专业深度等方面的把控。

## 三、三审三校工作流

1. 初审：内容完整性和基本质量
2. 二审：事实核查和深度审核
3. 三审：最终把关和发布决策

## 四、效率提升

- 建立标准化审核清单
- 利用AI辅助工具
- 持续培训和知识共享

## 五、结语

内容审核需要平衡质量和效率，这是每个主编都需要不断探索的课题。`,
        status: ContentStatus.APPROVED,
        category: columnCategory,
        author: chiefEditor,
      },
    ];

    for (const contentData of sampleContents) {
      if (!contentData.author || !contentData.category) continue;

      const content = this.contentRepository.create({
        id: uuidv4(),
        title: contentData.title,
        slug: contentData.title.toLowerCase().replace(/\s+/g, '-'),
        summary: contentData.summary,
        contentBody: contentData.contentBody,
        status: contentData.status,
        categoryId: contentData.category?.id,
        authorId: contentData.author?.id,
        currentVersion: 1,
        isFeatured: false,
        isUrgent: false,
      });

      const savedContent = await this.contentRepository.save(content);

      const version = this.contentVersionRepository.create({
        id: uuidv4(),
        contentId: savedContent.id,
        versionNumber: 1,
        title: savedContent.title,
        contentBody: savedContent.contentBody,
        summary: savedContent.summary,
        changeReason: 'Initial version',
        createdById: contentData.author?.id,
      });

      await this.contentVersionRepository.save(version);
      console.log(`  ✅ Created content: ${contentData.title} (${contentData.status})`);
    }

    console.log('✅ Default contents seeded successfully');
  }
}
