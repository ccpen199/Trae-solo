import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 45859;

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ code: 200, message: 'OK', data: { status: 'running' } });
});

app.get('/api/news', (req, res) => {
  const mockNews = [
    {
      id: 1,
      title: '曼城夺得英超冠军！',
      summary: '曼城在最后一轮逆转取胜，成功卫冕英超冠军',
      coverImage: 'https://picsum.photos/800/400?random=1',
      source: '体育新闻',
      author: '记者A',
      category: '英超',
      viewCount: 1234,
      createdAt: '2024-05-18 10:00:00'
    },
    {
      id: 2,
      title: '梅西再创纪录，职业生涯进球超800',
      summary: '梅西在本场比赛梅开二度，创造新的历史纪录',
      coverImage: 'https://picsum.photos/800/400?random=2',
      source: '足球周刊',
      author: '记者B',
      category: '国际足球',
      viewCount: 2345,
      createdAt: '2024-05-17 15:30:00'
    },
    {
      id: 3,
      title: '中超联赛即将开幕，各队引援动态汇总',
      summary: '新赛季中超联赛将在下周开幕，各队积极备战',
      coverImage: 'https://picsum.photos/800/400?random=3',
      source: '中超官网',
      author: '记者C',
      category: '中超',
      viewCount: 890,
      createdAt: '2024-05-16 09:00:00'
    }
  ];
  res.json({ code: 200, message: 'OK', data: mockNews });
});

app.get('/api/matches', (req, res) => {
  const mockMatches = [
    {
      id: 1,
      homeTeam: { id: 1, name: '曼城', logo: 'https://picsum.photos/100/100?random=10' },
      awayTeam: { id: 2, name: '阿森纳', logo: 'https://picsum.photos/100/100?random=11' },
      homeScore: 3,
      awayScore: 1,
      matchTime: '2024-05-19 22:00:00',
      status: 'finished',
      league: '英超',
      round: '第38轮'
    },
    {
      id: 2,
      homeTeam: { id: 3, name: '皇马', logo: 'https://picsum.photos/100/100?random=12' },
      awayTeam: { id: 4, name: '巴萨', logo: 'https://picsum.photos/100/100?random=13' },
      homeScore: 2,
      awayScore: 2,
      matchTime: '2024-05-20 03:00:00',
      status: 'live',
      league: '西甲',
      round: '第36轮'
    }
  ];
  res.json({ code: 200, message: 'OK', data: mockMatches });
});

app.listen(PORT, () => {
  console.log('Server running on http://localhost:' + PORT);
});
