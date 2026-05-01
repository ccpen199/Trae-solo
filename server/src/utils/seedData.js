const User = require('../models/User');
const Question = require('../models/Question');
const Answer = require('../models/Answer');
const ExpertMatchingEngine = require('../engines/ExpertMatchingEngine');
const { v4: uuidv4 } = require('uuid');

const generateQuestionId = () => {
  return `Q-${Date.now().toString(36)}-${uuidv4().substring(0, 8)}`.toUpperCase();
};

const generateAnswerId = () => {
  return `A-${Date.now().toString(36)}-${uuidv4().substring(0, 8)}`.toUpperCase();
};

const sampleQuestions = [
  {
    title: '如何优化大型React应用的性能？',
    content: '我有一个大型React应用，随着功能增加变得越来越慢。主要问题包括：\n\n1. 组件渲染慢，特别是列表页面\n2. 打包体积大，首屏加载慢\n3. 状态管理复杂，导致不必要的重渲染\n\n请问有哪些常见的性能优化策略？最好能有具体的代码示例。',
    tags: ['React', '性能优化', '前端', 'JavaScript'],
    reward: { type: 'points', points: 100, money: 0, isEscrowed: false },
    contentCompleteness: 85
  },
  {
    title: 'Python中如何处理大规模数据的内存管理？',
    content: '我正在处理一个超过10GB的数据集，直接加载到内存会导致OOM错误。数据格式是CSV和JSON混合的。\n\n问题描述：\n- 数据集包含约5000万条记录\n- 每条记录约200字节\n- 需要进行数据清洗和特征工程\n\n请问有什么好的解决方案？考虑使用Dask、Vaex还是其他库？',
    tags: ['Python', '数据处理', '内存管理', '大数据'],
    reward: { type: 'money', points: 0, money: 50, isEscrowed: false },
    contentCompleteness: 90
  },
  {
    title: '微服务架构下如何保证数据一致性？',
    content: '在微服务架构中，每个服务有自己的数据库。当一个业务操作涉及多个服务时，如何保证数据的最终一致性？\n\n具体场景：\n- 订单服务创建订单\n- 库存服务扣减库存\n- 支付服务处理支付\n- 用户服务更新积分\n\n如果其中某个环节失败，如何回滚？使用TCC模式还是事件驱动？Saga模式如何实现？',
    tags: ['微服务', '分布式系统', '数据一致性', '架构'],
    reward: { type: 'both', points: 200, money: 100, isEscrowed: false },
    contentCompleteness: 95
  },
  {
    title: 'TypeScript中泛型的最佳实践有哪些？',
    content: '我正在学习TypeScript，对泛型的理解还不够深入。希望了解：\n\n1. 泛型函数和泛型类的使用场景\n2. 泛型约束和条件类型\n3. 类型推断和类型守卫\n4. 实际项目中的最佳实践\n\n最好能结合一些复杂的业务场景来举例说明。',
    tags: ['TypeScript', 'JavaScript', '前端', '类型系统'],
    reward: { type: 'points', points: 50, money: 0, isEscrowed: false },
    contentCompleteness: 75
  },
  {
    title: '如何设计高可用的消息队列架构？',
    content: '我们团队正在考虑使用消息队列来解耦系统，但对高可用架构设计有一些疑问：\n\n1. Kafka vs RabbitMQ vs RocketMQ 的选择\n2. 集群部署和数据持久化\n3. 消息丢失和重复消费的处理\n4. 监控和告警\n\n目前系统的QPS约为5000，峰值可能达到20000。希望有经验的大神分享一下生产环境的实践经验。',
    tags: ['消息队列', 'Kafka', 'RabbitMQ', '高可用', '架构'],
    reward: { type: 'money', points: 0, money: 80, isEscrowed: false },
    contentCompleteness: 88
  }
];

const sampleAnswers = [
  {
    content: `React性能优化是一个系统性的工程，我来分享一些实践经验：

## 1. 渲染性能优化

### 使用 React.memo / PureComponent
\`\`\`jsx
const MyComponent = React.memo(({ data }) => {
  return <div>{data}</div>;
}, (prevProps, nextProps) => {
  return prevProps.data === nextProps.data;
});
\`\`\`

### 合理使用 useMemo 和 useCallback
\`\`\`jsx
const expensiveValue = useMemo(() => {
  return data.map(item => processItem(item));
}, [data]);

const handleClick = useCallback(() => {
  console.log('clicked');
}, []);
\`\`\`

## 2. 代码分割

### 路由级别分割
\`\`\`jsx
const Home = lazy(() => import('./pages/Home'));
const About = lazy(() => import('./pages/About'));

function App() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
      </Routes>
    </Suspense>
  );
}
\`\`\`

## 3. 虚拟列表

对于长列表，使用 react-window 或 react-virtualized：
\`\`\`jsx
import { FixedSizeList as List } from 'react-window';

const LargeList = ({ items }) => (
  <List
    height={400}
    itemCount={items.length}
    itemSize={50}
    width={300}
  >
    {({ index, style }) => (
      <div style={style}>{items[index]}</div>
    )}
  </List>
);
\`\`\`

## 4. 状态管理优化

### 避免不必要的重渲染
- 使用 selectors 从 store 中精确获取需要的数据
- 合理拆分组件，让数据变更只影响相关组件

## 5. 首屏优化

- 使用 Webpack 的 SplitChunks 优化分包
- 开启 gzip 压缩
- 使用 CDN 加速静态资源
- 预加载关键资源

希望这些对你有帮助！`,
    contentCompleteness: 92
  },
  {
    content: `处理大规模数据的内存问题，我推荐以下方案：

## 方案一：分块处理（Chunk Processing）

这是最简单且最通用的方法：

\`\`\`python
import pandas as pd

# 按块读取CSV
chunk_size = 10000
chunks = []

for chunk in pd.read_csv('large_file.csv', chunksize=chunk_size):
    # 处理每一块
    chunk_processed = process_chunk(chunk)
    chunks.append(chunk_processed)

# 合并结果（如果需要）
result = pd.concat(chunks, ignore_index=True)
\`\`\`

## 方案二：使用 Dask

Dask 是专门为大规模数据设计的：

\`\`\`python
import dask.dataframe as dd

# 读取大型CSV
df = dd.read_csv('large_file.csv')

# 操作和 pandas 一样，但延迟执行
result = df.groupby('category').value.sum()

# 触发计算
computed = result.compute()
\`\`\`

## 方案三：使用 Vaex

Vaex 支持内存映射，非常大的数据集：

\`\`\`python
import vaex

# 打开文件（不会加载到内存）
df = vaex.read_csv('large_file.csv')

# 所有操作都是懒加载的
filtered = df[df.value > 0]

# 计算时才真正处理
result = filtered.mean()
\`\`\`

## 方案四：转换为更高效的格式

\`\`\`python
import pandas as pd

# 分块读取并转换为 Parquet
chunk_size = 10000
chunks = pd.read_csv('large_file.csv', chunksize=chunk_size)

for i, chunk in enumerate(chunks):
    chunk.to_parquet(f'output/part_{i}.parquet')

# 之后用 Dask 读取所有 parquet 文件
import dask.dataframe as dd
df = dd.read_parquet('output/*.parquet')
\`\`\`

## 我的建议

**10GB 数据的推荐方案：**

- 如果数据是结构化的，优先使用 **Dask**
- 如果需要交互式分析，使用 **Vaex**
- 如果只是简单的ETL，使用 **分块处理 + Parquet**

**关键要点：**
1. 永远不要一次性加载全部数据
2. 使用列式存储格式（Parquet、ORC）
3. 考虑使用数据库（PostgreSQL、ClickHouse）
4. 如果是云端，可以考虑使用 BigQuery、Snowflake

希望这些对你有帮助！`,
    contentCompleteness: 95
  }
];

class SeedData {
  constructor() {
    this.expertMatchingEngine = new ExpertMatchingEngine();
  }

  async createSampleData() {
    console.log('Starting to seed sample data...');

    const users = await User.find({ role: { $in: ['questioner', 'answerer', 'expert'] } });
    
    if (users.length < 2) {
      console.log('Not enough users to create sample data. Please run init script first.');
      return;
    }

    const questioner = users.find(u => u.role === 'questioner') || users[0];
    const experts = users.filter(u => u.role === 'expert');
    const answerers = users.filter(u => u.role === 'answerer' || u.role === 'expert');

    console.log(`Found ${users.length} users, creating sample questions...`);

    const createdQuestions = [];

    for (let i = 0; i < sampleQuestions.length; i++) {
      const qData = sampleQuestions[i];
      
      const question = new Question({
        questionId: generateQuestionId(),
        title: qData.title,
        content: qData.content,
        tags: qData.tags,
        author: questioner._id,
        reward: qData.reward,
        status: 'published',
        workflowStatus: 'processing_ticket',
        stats: {
          viewCount: Math.floor(Math.random() * 5000) + 100,
          answerCount: 0,
          voteCount: Math.floor(Math.random() * 50),
          bookmarkCount: Math.floor(Math.random() * 30),
          shareCount: Math.floor(Math.random() * 20)
        }
      });

      const semanticAnalysis = this.expertMatchingEngine.analyzeQuestionSemantics({
        title: qData.title,
        content: qData.content,
        tags: qData.tags
      });
      question.semanticAnalysis = semanticAnalysis;

      if (experts.length > 0) {
        question.matchedExperts = experts.slice(0, 3).map(expert => ({
          expert: expert._id,
          matchScore: 0.6 + Math.random() * 0.4,
          notifiedAt: new Date(),
          responseStatus: Math.random() > 0.5 ? 'accepted' : 'pending'
        }));
      }

      await question.save();
      createdQuestions.push(question);

      console.log(`Created question: ${question.title.substring(0, 40)}...`);

      if (i < 2 && answerers.length > 0) {
        const answerData = sampleAnswers[i % sampleAnswers.length];
        const answerAuthor = answerers[i % answerers.length];

        const startedAt = new Date(Date.now() - Math.random() * 3600000);
        const submittedAt = new Date(startedAt.getTime() + 60000 + Math.random() * 1800000);

        const answer = new Answer({
          answerId: generateAnswerId(),
          question: question._id,
          author: answerAuthor._id,
          content: answerData.content,
          contentCompleteness: answerData.contentCompleteness,
          writingTime: {
            startedAt,
            submittedAt,
            duration: Math.floor((submittedAt - startedAt) / 1000)
          },
          isAccepted: i === 0,
          stats: {
            voteCount: Math.floor(Math.random() * 100),
            upvotes: Math.floor(Math.random() * 80),
            downvotes: Math.floor(Math.random() * 10),
            bookmarkCount: Math.floor(Math.random() * 20),
            shareCount: Math.floor(Math.random() * 10),
            viewCount: Math.floor(Math.random() * 500)
          }
        });

        answer.rankScore = answer.calculateRankScore();
        await answer.save();

        question.stats.answerCount += 1;
        question.status = 'has_answers';
        
        if (i === 0) {
          question.status = 'solved';
          question.workflowStatus = 'result_confirmation';
          question.isFeatured = true;
          answer.isAccepted = true;
          answer.acceptedAt = submittedAt;
          await answer.save();
        }

        await question.save();

        console.log(`  Created answer by ${answerAuthor.username}`);
      }
    }

    console.log('\n========================================');
    console.log('Sample data created successfully!');
    console.log(`Created ${createdQuestions.length} questions`);
    console.log('========================================\n');

    return createdQuestions;
  }

  async clearAllData() {
    console.log('Clearing all data...');
    
    await Question.deleteMany({});
    await Answer.deleteMany({});
    await Notification.deleteMany({});
    await Transaction.deleteMany({});
    await CreditRecord.deleteMany({});
    await ArchiveRecord.deleteMany({});
    await KnowledgeNode.deleteMany({});
    await Vote.deleteMany({});
    
    console.log('All data cleared!');
  }
}

module.exports = SeedData;
