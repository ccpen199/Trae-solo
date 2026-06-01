import type {
  Movie,
  Cinema,
  Showtime,
  Seat,
  Order,
  Ticket,
  User,
  Video,
  Post,
  Comment,
  AdminStats,
  LoginRequest,
  LoginResponse,
  ApiResponse,
} from '../types';

const API_BASE = '/api';

class ApiClient {
  private token: string | null = null;

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('auth_token', token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('auth_token');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers: {
          ...headers,
          ...options.headers,
        },
      });

      const data = await response.json();
      return data;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '网络请求失败',
      };
    }
  }

  async login(credentials: LoginRequest): Promise<ApiResponse<LoginResponse>> {
    return this.request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async logout(): Promise<ApiResponse<void>> {
    return this.request<void>('/auth/logout', {
      method: 'POST',
    });
  }

  async getCurrentUser(): Promise<ApiResponse<User>> {
    return this.request<User>('/auth/me');
  }

  async getMovies(status?: 'showing' | 'upcoming'): Promise<ApiResponse<Movie[]>> {
    const url = status ? `/movies?status=${status}` : '/movies';
    return this.request<Movie[]>(url);
  }

  async getMovie(id: string): Promise<ApiResponse<Movie>> {
    return this.request<Movie>(`/movies/${id}`);
  }

  async getHotMovies(limit = 10): Promise<ApiResponse<Movie[]>> {
    return this.request<Movie[]>(`/movies/hot?limit=${limit}`);
  }

  async getCinemas(movieId?: string): Promise<ApiResponse<Cinema[]>> {
    const url = movieId ? `/cinemas?movieId=${movieId}` : '/cinemas';
    return this.request<Cinema[]>(url);
  }

  async getShowtimes(movieId: string, cinemaId?: string): Promise<ApiResponse<Showtime[]>> {
    const url = cinemaId 
      ? `/showtimes?movieId=${movieId}&cinemaId=${cinemaId}` 
      : `/showtimes?movieId=${movieId}`;
    return this.request<Showtime[]>(url);
  }

  async getSeats(showtimeId: string): Promise<ApiResponse<Seat[]>> {
    return this.request<Seat[]>(`/showtimes/${showtimeId}/seats`);
  }

  async createOrder(orderData: {
    showtimeId: string;
    seats: string[];
  }): Promise<ApiResponse<Order>> {
    return this.request<Order>('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  }

  async getOrders(): Promise<ApiResponse<Order[]>> {
    return this.request<Order[]>('/orders');
  }

  async getOrder(id: string): Promise<ApiResponse<Order>> {
    return this.request<Order>(`/orders/${id}`);
  }

  async payOrder(orderId: string): Promise<ApiResponse<Order>> {
    return this.request<Order>(`/orders/${orderId}/pay`, {
      method: 'POST',
    });
  }

  async getTickets(): Promise<ApiResponse<Ticket[]>> {
    return this.request<Ticket[]>('/tickets');
  }

  async getTicket(id: string): Promise<ApiResponse<Ticket>> {
    return this.request<Ticket>(`/tickets/${id}`);
  }

  async getVideos(category?: string): Promise<ApiResponse<Video[]>> {
    const url = category ? `/videos?category=${category}` : '/videos';
    return this.request<Video[]>(url);
  }

  async getPosts(movieId?: string): Promise<ApiResponse<Post[]>> {
    const url = movieId ? `/posts?movieId=${movieId}` : '/posts';
    return this.request<Post[]>(url);
  }

  async createPost(postData: {
    content: string;
    movieId?: string;
    tags?: string[];
  }): Promise<ApiResponse<Post>> {
    return this.request<Post>('/posts', {
      method: 'POST',
      body: JSON.stringify(postData),
    });
  }

  async likePost(postId: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/posts/${postId}/like`, {
      method: 'POST',
    });
  }

  async getComments(postId: string): Promise<ApiResponse<Comment[]>> {
    return this.request<Comment[]>(`/posts/${postId}/comments`);
  }

  async getAdminStats(): Promise<ApiResponse<AdminStats>> {
    return this.request<AdminStats>('/admin/stats');
  }

  async addFavorite(movieId: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/user/favorites/${movieId}`, {
      method: 'POST',
    });
  }

  async removeFavorite(movieId: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/user/favorites/${movieId}`, {
      method: 'DELETE',
    });
  }

  async getFavorites(): Promise<ApiResponse<Movie[]>> {
    return this.request<Movie[]>('/user/favorites');
  }
}

export const api = new ApiClient();

export const mockData = {
  movies: [
    {
      id: '1',
      title: '星际穿越',
      originalTitle: 'Interstellar',
      poster: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=sci-fi%20movie%20poster%20interstellar%20space%20blackhole&image_size=portrait_4_3',
      backdrop: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=space%20galaxy%20stars%20blackhole%20cinematic&image_size=landscape_16_9',
      rating: 9.4,
      ratings: { douban: 9.4, imdb: 8.7, maoyan: 9.6 },
      genre: ['科幻', '剧情', '冒险'],
      duration: 169,
      releaseDate: '2024-11-07',
      region: '美国',
      language: '英语',
      director: '克里斯托弗·诺兰',
      cast: ['马修·麦康纳', '安妮·海瑟薇', '杰西卡·查斯坦'],
      synopsis: '近未来，地球环境逐步恶化，人类面临灭绝危机。前NASA宇航员库珀被选中执行一项穿越虫洞的星际探索任务，寻找人类新的家园。在爱与时间的交织中，他必须在家人和人类未来之间做出选择。',
      heatScore: 9850,
      heatTrend: [
        { date: '周一', value: 8500 },
        { date: '周二', value: 8800 },
        { date: '周三', value: 9100 },
        { date: '周四', value: 9400 },
        { date: '周五', value: 9600 },
        { date: '周六', value: 9850 },
        { date: '周日', value: 9700 },
      ],
      tags: ['烧脑', '视觉震撼', '情感动人'],
      status: 'showing',
    },
    {
      id: '2',
      title: '奥本海默',
      originalTitle: 'Oppenheimer',
      poster: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=historical%20drama%20movie%20poster%20oppenheimer%20nuclear%20physicist&image_size=portrait_4_3',
      backdrop: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=nuclear%20explosion%20mushroom%20cloud%20dramatic%20sky&image_size=landscape_16_9',
      rating: 9.0,
      ratings: { douban: 9.0, imdb: 8.5, rotten: 93 },
      genre: ['传记', '剧情', '历史'],
      duration: 180,
      releaseDate: '2024-08-30',
      region: '美国',
      language: '英语',
      director: '克里斯托弗·诺兰',
      cast: ['基里安·墨菲', '艾米莉·布朗特', '小罗伯特·唐尼'],
      synopsis: '讲述美国"原子弹之父"罗伯特·奥本海默在二战期间领导曼哈顿计划，以及他在面临可能毁灭世界的抉择时内心的挣扎与矛盾。',
      heatScore: 8920,
      heatTrend: [
        { date: '周一', value: 7800 },
        { date: '周二', value: 8100 },
        { date: '周三', value: 8400 },
        { date: '周四', value: 8600 },
        { date: '周五', value: 8800 },
        { date: '周六', value: 8920 },
        { date: '周日', value: 8700 },
      ],
      tags: ['奥斯卡', '历史巨制', '演技巅峰'],
      status: 'showing',
    },
    {
      id: '3',
      title: '流浪地球3',
      poster: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=chinese%20sci-fi%20movie%20poster%20wandering%20earth%20space%20station&image_size=portrait_4_3',
      backdrop: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=futuristic%20city%20space%20elevator%20earth%20orbit&image_size=landscape_16_9',
      rating: 8.8,
      ratings: { douban: 8.8, maoyan: 9.5 },
      genre: ['科幻', '灾难', '冒险'],
      duration: 173,
      releaseDate: '2025-01-22',
      region: '中国',
      language: '普通话',
      director: '郭帆',
      cast: ['吴京', '刘德华', '李雪健'],
      synopsis: '太阳即将氦闪，人类启动"流浪地球"计划。面对木星引力危机，人类必须团结一心，利用行星发动机推动地球逃离太阳系，寻找新的家园。',
      heatScore: 9650,
      heatTrend: [
        { date: '周一', value: 8200 },
        { date: '周二', value: 8600 },
        { date: '周三', value: 9000 },
        { date: '周四', value: 9300 },
        { date: '周五', value: 9500 },
        { date: '周六', value: 9650 },
        { date: '周日', value: 9400 },
      ],
      tags: ['国产科幻', '春节档', '视觉盛宴'],
      status: 'showing',
    },
    {
      id: '4',
      title: '沙丘2',
      originalTitle: 'Dune: Part Two',
      poster: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=epic%20sci-fi%20movie%20poster%20dune%20desert%20planet%20sandworm&image_size=portrait_4_3',
      backdrop: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=desert%20planet%20arrakis%20two%20moons%20sand%20dunes&image_size=landscape_16_9',
      rating: 9.1,
      ratings: { douban: 9.1, imdb: 8.6, rotten: 90 },
      genre: ['科幻', '冒险', '动作'],
      duration: 166,
      releaseDate: '2024-03-08',
      region: '美国',
      language: '英语',
      director: '丹尼斯·维伦纽瓦',
      cast: ['提莫西·查拉梅', '赞达亚', '丽贝卡·弗格森'],
      synopsis: '保罗·厄崔迪与契尼及弗雷曼人联合，踏上复仇之路，与毁灭家族的阴谋者对抗。面对爱情与宇宙命运的抉择，他必须阻止只有他能预见的可怕未来。',
      heatScore: 9100,
      heatTrend: [
        { date: '周一', value: 8000 },
        { date: '周二', value: 8300 },
        { date: '周三', value: 8600 },
        { date: '周四', value: 8800 },
        { date: '周五', value: 9000 },
        { date: '周六', value: 9100 },
        { date: '周日', value: 8900 },
      ],
      tags: ['史诗巨制', '视觉美学', 'IMAX必看'],
      status: 'showing',
    },
    {
      id: '5',
      title: '哪吒之魔童闹海',
      poster: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=chinese%20animation%20movie%20poster%20nezha%20dragon%20king%20ocean%20battle&image_size=portrait_4_3',
      backdrop: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=underwater%20dragon%20palace%20ocean%20battle%20chinese%20mythology&image_size=landscape_16_9',
      rating: 9.2,
      ratings: { douban: 9.2, maoyan: 9.7 },
      genre: ['动画', '奇幻', '动作'],
      duration: 128,
      releaseDate: '2025-02-01',
      region: '中国',
      language: '普通话',
      director: '饺子',
      cast: ['吕艳婷', '囧森瑟夫', '瀚墨'],
      synopsis: '天劫之后，哪吒、敖丙的灵魂虽保住了，但肉身很快会魂飞魄散。太乙真人打算用七色宝莲给二人重塑肉身。但是在重塑肉身的过程中却遇到重重困难，哪吒、敖丙的命运将走向何方？',
      heatScore: 9900,
      heatTrend: [
        { date: '周一', value: 9000 },
        { date: '周二', value: 9200 },
        { date: '周三', value: 9400 },
        { date: '周四', value: 9600 },
        { date: '周五', value: 9800 },
        { date: '周六', value: 9900 },
        { date: '周日', value: 9850 },
      ],
      tags: ['国漫巅峰', '春节档冠军', '票房神话'],
      status: 'showing',
    },
    {
      id: '6',
      title: '飞驰人生3',
      poster: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=chinese%20comedy%20racing%20movie%20poster%20rally%20car%20desert%20race&image_size=portrait_4_3',
      backdrop: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=rally%20car%20desert%20race%20track%20sunset%20cinematic&image_size=landscape_16_9',
      rating: 8.5,
      ratings: { douban: 8.5, maoyan: 9.3 },
      genre: ['喜剧', '运动', '剧情'],
      duration: 122,
      releaseDate: '2025-02-12',
      region: '中国',
      language: '普通话',
      director: '韩寒',
      cast: ['沈腾', '范丞丞', '尹正'],
      synopsis: '曾经的顶级赛车手张弛，在经历人生起伏后，决定重返赛场。这一次，他不仅要面对年轻一代的挑战，还要证明自己对赛车的热爱从未改变。',
      heatScore: 8750,
      heatTrend: [
        { date: '周一', value: 7600 },
        { date: '周二', value: 7900 },
        { date: '周三', value: 8200 },
        { date: '周四', value: 8400 },
        { date: '周五', value: 8600 },
        { date: '周六', value: 8750 },
        { date: '周日', value: 8500 },
      ],
      tags: ['喜剧', '热血', '春节档'],
      status: 'showing',
    },
    {
      id: '7',
      title: '蜘蛛侠：平行宇宙3',
      originalTitle: 'Spider-Man: Beyond the Spider-Verse',
      poster: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=animation%20spiderman%20movie%20poster%20multiverse%20colorful%20comic%20style&image_size=portrait_4_3',
      backdrop: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=spiderman%20multiverse%20cityscape%20colorful%20comic%20book%20art&image_size=landscape_16_9',
      rating: 9.3,
      ratings: { douban: 9.3, imdb: 8.8, rotten: 95 },
      genre: ['动画', '动作', '冒险'],
      duration: 140,
      releaseDate: '2025-03-15',
      region: '美国',
      language: '英语',
      director: '乔伊姆·多斯·桑托斯',
      cast: ['沙梅克·摩尔', '海莉·斯坦菲尔德', '奥斯卡·伊萨克'],
      synopsis: '迈尔斯·莫拉莱斯与关·史黛西重聚，二人穿梭多元宇宙。当他们与其他蜘蛛侠联手，却遇到了来自其他宇宙的威胁，迈尔斯必须重新定义英雄的意义。',
      heatScore: 9400,
      heatTrend: [
        { date: '周一', value: 8400 },
        { date: '周二', value: 8700 },
        { date: '周三', value: 9000 },
        { date: '周四', value: 9200 },
        { date: '周五', value: 9350 },
        { date: '周六', value: 9400 },
        { date: '周日', value: 9250 },
      ],
      tags: ['动画神作', '多元宇宙', '视觉革命'],
      status: 'upcoming',
    },
    {
      id: '8',
      title: '速度与激情11',
      originalTitle: 'Fast & Furious 11',
      poster: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=action%20movie%20poster%20fast%20and%20furious%20sports%20cars%20race&image_size=portrait_4_3',
      backdrop: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=sports%20cars%20highway%20chase%20night%20city%20cinematic&image_size=landscape_16_9',
      rating: 7.8,
      ratings: { douban: 7.8, imdb: 7.2 },
      genre: ['动作', '犯罪', '惊悚'],
      duration: 135,
      releaseDate: '2025-04-04',
      region: '美国',
      language: '英语',
      director: '路易斯·莱特里尔',
      cast: ['范·迪塞尔', '杰森·斯坦森', '查理兹·塞隆'],
      synopsis: '多姆和他的家人必须面对一位新的敌人，这个对手将利用多姆过去的罪行来撕裂他的团队。这是速度与激情系列的最终章，一切都将在这里结束。',
      heatScore: 8200,
      heatTrend: [
        { date: '周一', value: 7000 },
        { date: '周二', value: 7300 },
        { date: '周三', value: 7600 },
        { date: '周四', value: 7900 },
        { date: '周五', value: 8100 },
        { date: '周六', value: 8200 },
        { date: '周日', value: 8000 },
      ],
      tags: ['系列终章', '动作爽片', '飙车盛宴'],
      status: 'upcoming',
    },
    {
      id: '9',
      title: '悲情城市',
      poster: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=taiwanese%20art%20film%20poster%20historical%20drama%20vintage%201940s&image_size=portrait_4_3',
      backdrop: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=vintage%20taiwan%20street%201940s%20nostalgic%20film%20grain&image_size=landscape_16_9',
      rating: 9.5,
      ratings: { douban: 9.5 },
      genre: ['剧情', '历史'],
      duration: 157,
      releaseDate: '2024-06-15',
      region: '中国台湾',
      language: '闽南语',
      director: '侯孝贤',
      cast: ['梁朝伟', '陈松勇', '李天禄'],
      synopsis: '1945年台湾光复后，基隆林家四兄弟的不同遭遇，展现了那个动荡年代中小人物的悲欢离合，以及"二二八事件"对台湾社会的深远影响。',
      heatScore: 7500,
      heatTrend: [
        { date: '周一', value: 6800 },
        { date: '周二', value: 7000 },
        { date: '周三', value: 7200 },
        { date: '周四', value: 7350 },
        { date: '周五', value: 7450 },
        { date: '周六', value: 7500 },
        { date: '周日', value: 7400 },
      ],
      tags: ['经典修复', '侯孝贤', '金狮奖'],
      status: 'showing',
    },
    {
      id: '10',
      title: '花样年华',
      poster: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=hong%20kong%20art%20film%20poster%20wong%20kar%20wai%20romance%201960s&image_size=portrait_4_3',
      backdrop: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=hong%20kong%201960s%20street%20night%20neon%20rain%20cinematic&image_size=landscape_16_9',
      rating: 9.7,
      ratings: { douban: 9.7 },
      genre: ['剧情', '爱情'],
      duration: 98,
      releaseDate: '2024-09-20',
      region: '中国香港',
      language: '粤语',
      director: '王家卫',
      cast: ['梁朝伟', '张曼玉'],
      synopsis: '1962年的香港，两对年轻夫妇搬进了同一栋大楼。周慕云的妻子和苏丽珍的丈夫发生了婚外情，被蒙在鼓里的两人在发现真相后，也逐渐产生了微妙的感情。',
      heatScore: 8100,
      heatTrend: [
        { date: '周一', value: 7200 },
        { date: '周二', value: 7500 },
        { date: '周三', value: 7700 },
        { date: '周四', value: 7900 },
        { date: '周五', value: 8000 },
        { date: '周六', value: 8100 },
        { date: '周日', value: 8000 },
      ],
      tags: ['王家卫', '经典修复', '戛纳影帝'],
      status: 'showing',
    },
  ] as Movie[],

  cinemas: [
    {
      id: '1',
      name: '万达影城（CBD店）',
      address: '北京市朝阳区建国路88号万达广场3层',
      distance: '1.2km',
      halls: [
        { id: 'h1', name: '1号厅（激光IMAX）', type: 'imax', capacity: 400 },
        { id: 'h2', name: '2号厅（杜比影院）', type: 'dolby', capacity: 300 },
        { id: 'h3', name: '3号厅（VIP）', type: 'vip', capacity: 50 },
        { id: 'h4', name: '4号厅（标准）', type: 'standard', capacity: 200 },
      ],
    },
    {
      id: '2',
      name: 'CGV影城（合生汇店）',
      address: '北京市朝阳区西大望路21号合生汇购物中心5层',
      distance: '2.5km',
      halls: [
        { id: 'h5', name: '1号厅（IMAX）', type: 'imax', capacity: 350 },
        { id: 'h6', name: '2号厅（4DX）', type: 'standard', capacity: 150 },
        { id: 'h7', name: '3号厅（标准）', type: 'standard', capacity: 180 },
      ],
    },
    {
      id: '3',
      name: '金逸影城（国贸店）',
      address: '北京市朝阳区建国门外大街1号国贸商城B2层',
      distance: '0.8km',
      halls: [
        { id: 'h8', name: '1号厅（杜比全景声）', type: 'dolby', capacity: 250 },
        { id: 'h9', name: '2号厅（标准）', type: 'standard', capacity: 180 },
        { id: 'h10', name: '3号厅（情侣厅）', type: 'vip', capacity: 40 },
      ],
    },
  ] as Cinema[],

  showtimes: [
    {
      id: 'st1',
      movieId: '1',
      cinemaId: '1',
      hallId: 'h1',
      startTime: '2025-05-30 10:00',
      endTime: '2025-05-30 12:49',
      price: 89,
      vipPrice: 69,
      language: '英语原版',
      format: 'IMAX 3D',
    },
    {
      id: 'st2',
      movieId: '1',
      cinemaId: '1',
      hallId: 'h1',
      startTime: '2025-05-30 13:30',
      endTime: '2025-05-30 16:19',
      price: 99,
      vipPrice: 79,
      language: '英语原版',
      format: 'IMAX 3D',
    },
    {
      id: 'st3',
      movieId: '1',
      cinemaId: '1',
      hallId: 'h2',
      startTime: '2025-05-30 11:00',
      endTime: '2025-05-30 13:49',
      price: 79,
      vipPrice: 59,
      language: '国语配音',
      format: '杜比 2D',
    },
    {
      id: 'st4',
      movieId: '1',
      cinemaId: '2',
      hallId: 'h5',
      startTime: '2025-05-30 14:00',
      endTime: '2025-05-30 16:49',
      price: 95,
      vipPrice: 75,
      language: '英语原版',
      format: 'IMAX 3D',
    },
    {
      id: 'st5',
      movieId: '3',
      cinemaId: '1',
      hallId: 'h1',
      startTime: '2025-05-30 16:30',
      endTime: '2025-05-30 19:23',
      price: 109,
      vipPrice: 89,
      language: '国语配音',
      format: 'IMAX 3D',
    },
    {
      id: 'st6',
      movieId: '5',
      cinemaId: '1',
      hallId: 'h4',
      startTime: '2025-05-30 10:30',
      endTime: '2025-05-30 12:38',
      price: 59,
      vipPrice: 45,
      language: '国语配音',
      format: '2D',
    },
  ] as Showtime[],

  generateSeats: (showtimeId: string): Seat[] => {
    const seats: Seat[] = [];
    const rows = 10;
    const cols = 14;
    const occupiedSeats = ['2-3', '2-4', '3-5', '3-6', '5-7', '5-8', '7-4', '7-5', '8-9', '8-10'];
    const wheelchairSeats = ['5-1', '5-14', '6-1', '6-14'];

    for (let row = 1; row <= rows; row++) {
      for (let col = 1; col <= cols; col++) {
        const seatId = `${row}-${col}`;
        const isOccupied = occupiedSeats.includes(seatId);
        const isWheelchair = wheelchairSeats.includes(seatId);
        const centerRow = rows / 2;
        const centerCol = cols / 2;
        const rowDistance = Math.abs(row - centerRow);
        const colDistance = Math.abs(col - centerCol);
        const viewAngleScore = Math.max(30, 100 - rowDistance * 8 - colDistance * 5);

        let type: Seat['type'] = 'normal';
        if (isWheelchair) type = 'wheelchair';
        else if (row <= 2) type = 'vip';

        let price = 59;
        if (type === 'vip') price = 89;
        if (type === 'wheelchair') price = 39;
        if (row >= 4 && row <= 7 && col >= 5 && col <= 10) price = 79;

        seats.push({
          id: seatId,
          row,
          col,
          status: isOccupied ? 'occupied' : 'available',
          type,
          viewAngleScore,
          price,
        });
      }
    }
    return seats;
  },

  tickets: [
    {
      id: 't1',
      orderId: 'o1',
      movieTitle: '星际穿越',
      poster: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=sci-fi%20movie%20poster%20interstellar%20space%20blackhole&image_size=portrait_4_3',
      cinemaName: '万达影城（CBD店）',
      hallName: '1号厅（激光IMAX）',
      seat: '5排6座',
      startTime: '2025-05-30 13:30',
      endTime: '2025-05-30 16:19',
      price: 99,
      qrCode: 'TICKET_INTERSTELLAR_20250530_1330_001',
      status: 'valid',
      watermark: '张小明 138****5678',
    },
    {
      id: 't2',
      orderId: 'o2',
      movieTitle: '流浪地球3',
      poster: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=chinese%20sci-fi%20movie%20poster%20wandering%20earth%20space%20station&image_size=portrait_4_3',
      cinemaName: '万达影城（CBD店）',
      hallName: '1号厅（激光IMAX）',
      seat: '6排7座、6排8座',
      startTime: '2025-05-30 16:30',
      endTime: '2025-05-30 19:23',
      price: 218,
      qrCode: 'TICKET_WANDERING_20250530_1630_002',
      status: 'valid',
      watermark: '张小明 138****5678',
    },
    {
      id: 't3',
      orderId: 'o3',
      movieTitle: '奥本海默',
      poster: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=historical%20drama%20movie%20poster%20oppenheimer%20nuclear%20physicist&image_size=portrait_4_3',
      cinemaName: 'CGV影城（合生汇店）',
      hallName: '1号厅（IMAX）',
      seat: '4排5座',
      startTime: '2025-05-20 19:00',
      endTime: '2025-05-20 22:00',
      price: 95,
      qrCode: 'TICKET_OPPENHEIMER_20250520_1900_003',
      status: 'used',
      watermark: '张小明 138****5678',
    },
  ] as Ticket[],

  videos: [
    {
      id: 'v1',
      title: '《星际穿越》幕后特辑：诺兰如何打造黑洞视觉',
      thumbnail: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=behind%20the%20scenes%20movie%20production%20filming%20camera%20crew&image_size=landscape_16_9',
      duration: '12:35',
      views: 1258000,
      uploadTime: '3天前',
      author: '电影情报局',
      movieId: '1',
    },
    {
      id: 'v2',
      title: '《哪吒之魔童闹海》终极预告',
      thumbnail: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=chinese%20animation%20nezha%20dragon%20battle%20ocean%20epic&image_size=landscape_16_9',
      duration: '2:45',
      views: 5680000,
      uploadTime: '1周前',
      author: '光线影业',
      movieId: '5',
    },
    {
      id: 'v3',
      title: '3分钟看懂《沙丘》世界观设定',
      thumbnail: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=dune%20sandworm%20arrakis%20desert%20planet%20concept%20art&image_size=landscape_16_9',
      duration: '3:20',
      views: 890000,
      uploadTime: '5天前',
      author: '电影解说家',
      movieId: '4',
    },
    {
      id: 'v4',
      title: '《流浪地球3》特效制作解析',
      thumbnail: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=vfx%20behind%20the%20scenes%20green%20screen%20cgi%20production&image_size=landscape_16_9',
      duration: '15:42',
      views: 2150000,
      uploadTime: '2周前',
      author: 'MoreVFX',
      movieId: '3',
    },
    {
      id: 'v5',
      title: '2025年最值得期待的10部电影',
      thumbnail: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=movie%20collection%20posters%20cinema%20film%20reel%20cinematic&image_size=landscape_16_9',
      duration: '8:15',
      views: 3420000,
      uploadTime: '1个月前',
      author: '影评人小李',
    },
    {
      id: 'v6',
      title: '王家卫电影美学分析',
      thumbnail: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=wong%20kar%20wai%20film%20style%20neon%20lights%20reflection&image_size=landscape_16_9',
      duration: '22:18',
      views: 678000,
      uploadTime: '2周前',
      author: '电影美学',
      movieId: '10',
    },
  ] as Video[],

  posts: [
    {
      id: 'p1',
      userId: 'u1',
      username: '电影狂人',
      userAvatar: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=avatar%20portrait%20young%20man%20glasses%20friendly%20smile&image_size=square',
      content: '刚看完《星际穿越》重映，IMAX厅的效果太震撼了！黑洞那段视觉效果真的是影史最佳，诺兰真的太懂电影了。强烈推荐还没看的朋友去大银幕感受一下，绝对值得票价！',
      images: [],
      movieId: '1',
      movieTitle: '星际穿越',
      likes: 2341,
      comments: 156,
      createdAt: '2025-05-29 22:30',
      tags: ['星际穿越', '诺兰', 'IMAX必看'],
    },
    {
      id: 'p2',
      userId: 'u2',
      username: '国漫爱好者',
      userAvatar: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=avatar%20portrait%20young%20woman%20colorful%20hair%20creative&image_size=square',
      content: '《哪吒之魔童闹海》票房破50亿了！作为看着国漫成长的一代人，真的太感动了。饺子导演用了5年时间打磨这部作品，每一个画面都能看到用心。期待更多优秀的国漫作品！',
      images: [],
      movieId: '5',
      movieTitle: '哪吒之魔童闹海',
      likes: 5678,
      comments: 423,
      createdAt: '2025-05-28 18:45',
      tags: ['哪吒', '国漫崛起', '票房神话'],
    },
    {
      id: 'p3',
      userId: 'u3',
      username: '文艺青年',
      userAvatar: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=avatar%20portrait%20artistic%20man%20beret%20painter&image_size=square',
      content: '终于在大银幕上看到了《花样年华》4K修复版！王家卫的光影美学真的是独一份，张曼玉的旗袍，梁朝伟的眼神，每一个镜头都是艺术品。能在影院看到这样的经典，真的是影迷的幸福。',
      images: [],
      movieId: '10',
      movieTitle: '花样年华',
      likes: 1892,
      comments: 98,
      createdAt: '2025-05-27 21:15',
      tags: ['花样年华', '王家卫', '经典修复'],
    },
    {
      id: 'p4',
      userId: 'u4',
      username: '科幻迷阿杰',
      userAvatar: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=avatar%20portrait%20geek%20man%20robot%20tshirt&image_size=square',
      content: '看完《沙丘2》，维伦纽瓦真的把科幻片的美学推到了新高度。沙虫出场那段，整个影院都在震动，视听体验拉满。非常期待第三部，希望能早日官宣！',
      images: [],
      movieId: '4',
      movieTitle: '沙丘2',
      likes: 2456,
      comments: 187,
      createdAt: '2025-05-26 16:20',
      tags: ['沙丘2', '维伦纽瓦', '科幻神作'],
    },
  ] as Post[],

  user: {
    id: 'u1',
    username: '张小明',
    email: 'zhangxiaoming@example.com',
    avatar: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=avatar%20portrait%20chinese%20young%20man%20casual%20friendly&image_size=square',
    phone: '138****5678',
    vipLevel: 3,
    vipPoints: 2580,
    vipExpireDate: '2026-12-31',
    coupons: [
      {
        id: 'c1',
        name: '全场通兑券',
        type: 'free',
        value: 1,
        expireDate: '2025-06-30',
        status: 'available',
      },
      {
        id: 'c2',
        name: '5折优惠券',
        type: 'discount',
        value: 50,
        minSpend: 100,
        expireDate: '2025-07-15',
        status: 'available',
      },
      {
        id: 'c3',
        name: '20元现金券',
        type: 'cash',
        value: 20,
        minSpend: 50,
        expireDate: '2025-06-20',
        status: 'available',
      },
    ],
    watchHistory: ['1', '2', '4', '5', '10'],
    favorites: ['1', '3', '9', '10'],
  } as User,
};
