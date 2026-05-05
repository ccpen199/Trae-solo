const { v4: uuidv4 } = require('uuid');

const mockPackages = [
  {
    id: 'pkg-001',
    name: '简约现代基础套餐',
    code: 'SIMPLE_MODERN_BASIC',
    category: '基础包',
    description: '适合追求简约风格的年轻家庭，包含基础装修项目',
    basePrice: 899.00,
    minArea: 60.00,
    maxArea: 150.00,
    coverImage: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=modern%20minimalist%20living%20room%20interior%20design%20with%20white%20walls%20and%20wooden%20floor&image_size=square_hd',
    images: [
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=modern%20kitchen%20design%20white%20cabinets&image_size=square_hd',
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=modern%20bedroom%20design%20cozy&image_size=square_hd'
    ],
    features: ['简约设计', '环保材料', '快速施工', '品质保证'],
    includedItems: ['水电改造', '墙面处理', '地面铺装', '厨房橱柜', '卫生间洁具'],
    excludedItems: ['家具家电', '软装设计', '个性化定制'],
    sortOrder: 1,
    status: 1,
    salesCount: 128,
    rating: 4.8,
    reviewCount: 56
  },
  {
    id: 'pkg-002',
    name: '北欧风格升级套餐',
    code: 'NORDIC_STYLE_UPGRADE',
    category: '升级包',
    description: '北欧风格设计，包含更多升级项目，打造温馨舒适的家居环境',
    basePrice: 1299.00,
    minArea: 80.00,
    maxArea: 200.00,
    coverImage: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=nordic%20style%20living%20room%20with%20light%20wood%20furniture%20and%20plants&image_size=square_hd',
    images: [
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=nordic%20kitchen%20open%20shelves&image_size=square_hd',
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=nordic%20bathroom%20white%20tiles&image_size=square_hd'
    ],
    features: ['北欧设计', '高端材料', '智能配套', '终身维护'],
    includedItems: ['水电改造', '墙面处理', '地面铺装', '厨房橱柜', '卫生间洁具', '吊顶设计', '背景墙', '定制衣柜'],
    excludedItems: ['家具家电', '软装设计'],
    sortOrder: 2,
    status: 1,
    salesCount: 86,
    rating: 4.9,
    reviewCount: 32
  },
  {
    id: 'pkg-003',
    name: '轻奢豪华定制套餐',
    code: 'LUXURY_CUSTOM',
    category: '定制包',
    description: '高端定制服务，根据您的需求量身打造，彰显尊贵品味',
    basePrice: 1999.00,
    minArea: 100.00,
    maxArea: 500.00,
    coverImage: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=luxury%20modern%20living%20room%20with%20gold%20accents%20and%20marble%20floor&image_size=square_hd',
    images: [
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=luxury%20kitchen%20island%20marble&image_size=square_hd',
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=luxury%20master%20bedroom%20suite&image_size=square_hd'
    ],
    features: ['专属设计', '进口材料', '一对一服务', '全屋定制'],
    includedItems: ['全屋水电改造', '高端墙面处理', '进口地面材料', '定制厨房', '豪华卫生间', '智能系统', '全屋定制家具', '软装设计'],
    excludedItems: ['家电设备'],
    sortOrder: 3,
    status: 1,
    salesCount: 34,
    rating: 5.0,
    reviewCount: 18
  }
];

const mockPackageAttributes = [
  {
    id: 'attr-001',
    packageId: 'pkg-001',
    name: '装修风格',
    code: 'style',
    type: 'select',
    isRequired: true,
    priceImpactType: 'add',
    sortOrder: 1,
    status: 1,
    values: [
      { id: 'val-001', attributeId: 'attr-001', value: 'modern', label: '现代简约', priceAdjustment: 0, isDefault: true, sortOrder: 1, status: 1 },
      { id: 'val-002', attributeId: 'attr-001', value: 'nordic', label: '北欧风格', priceAdjustment: 50, isDefault: false, sortOrder: 2, status: 1 },
      { id: 'val-003', attributeId: 'attr-001', value: 'chinese', label: '新中式', priceAdjustment: 80, isDefault: false, sortOrder: 3, status: 1 },
      { id: 'val-004', attributeId: 'attr-001', value: 'luxury', label: '轻奢风格', priceAdjustment: 100, isDefault: false, sortOrder: 4, status: 1 }
    ]
  },
  {
    id: 'attr-002',
    packageId: 'pkg-001',
    name: '房屋户型',
    code: 'houseType',
    type: 'select',
    isRequired: true,
    priceImpactType: 'none',
    sortOrder: 2,
    status: 1,
    values: [
      { id: 'val-005', attributeId: 'attr-002', value: '1room', label: '一室一厅', priceAdjustment: 0, isDefault: false, sortOrder: 1, status: 1 },
      { id: 'val-006', attributeId: 'attr-002', value: '2room', label: '两室一厅', priceAdjustment: 0, isDefault: true, sortOrder: 2, status: 1 },
      { id: 'val-007', attributeId: 'attr-002', value: '3room', label: '三室一厅', priceAdjustment: 0, isDefault: false, sortOrder: 3, status: 1 },
      { id: 'val-008', attributeId: 'attr-002', value: '4room', label: '四室两厅', priceAdjustment: 0, isDefault: false, sortOrder: 4, status: 1 }
    ]
  },
  {
    id: 'attr-003',
    packageId: 'pkg-002',
    name: '地板材质',
    code: 'floorMaterial',
    type: 'select',
    isRequired: true,
    priceImpactType: 'add',
    sortOrder: 1,
    status: 1,
    values: [
      { id: 'val-009', attributeId: 'attr-003', value: 'laminate', label: '强化复合地板', priceAdjustment: 0, isDefault: true, sortOrder: 1, status: 1 },
      { id: 'val-010', attributeId: 'attr-003', value: 'solid', label: '实木地板', priceAdjustment: 150, isDefault: false, sortOrder: 2, status: 1 },
      { id: 'val-011', attributeId: 'attr-003', value: 'tile', label: '瓷砖', priceAdjustment: 80, isDefault: false, sortOrder: 3, status: 1 },
      { id: 'val-012', attributeId: 'attr-003', value: 'marble', label: '大理石', priceAdjustment: 300, isDefault: false, sortOrder: 4, status: 1 }
    ]
  }
];

const mockAccessories = [
  {
    id: 'acc-001',
    name: '北欧简约沙发',
    code: 'SOFA_NORDIC_001',
    category: '客厅家具',
    description: '北欧风格三人位沙发，舒适透气，适合小户型',
    price: 3999.00,
    originalPrice: 4999.00,
    stock: 50,
    unit: '套',
    coverImage: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=nordic%20style%20light%20gray%20sofa%20in%20living%20room&image_size=square_hd',
    images: [
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=sofa%20detail%20fabric%20texture&image_size=square_hd'
    ],
    features: ['优质面料', '高密度海绵', '实木框架', '可拆洗设计'],
    specifications: {
      '尺寸': '2200x900x850mm',
      '材质': '棉麻面料+实木框架',
      '颜色': '浅灰色/米色/深蓝色'
    },
    packageIds: ['pkg-001', 'pkg-002'],
    sortOrder: 1,
    status: 1,
    salesCount: 156,
    rating: 4.7
  },
  {
    id: 'acc-002',
    name: '现代简约电视柜',
    code: 'TV_CABINET_MODERN_001',
    category: '客厅家具',
    description: '简约设计电视柜，大容量储物，搭配多种装修风格',
    price: 1899.00,
    originalPrice: 2399.00,
    stock: 80,
    unit: '个',
    coverImage: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=modern%20white%20tv%20cabinet%20with%20drawers&image_size=square_hd',
    images: [],
    features: ['环保板材', '大容量储物', '静音导轨', '简洁设计'],
    specifications: {
      '尺寸': '1800x400x450mm',
      '材质': 'E0级板材',
      '颜色': '白色/黑色/胡桃木色'
    },
    packageIds: ['pkg-001', 'pkg-002', 'pkg-003'],
    sortOrder: 2,
    status: 1,
    salesCount: 234,
    rating: 4.8
  },
  {
    id: 'acc-003',
    name: '主卧实木床架',
    code: 'BED_MASTER_001',
    category: '卧室家具',
    description: '进口实木床架，稳固耐用，简约大气',
    price: 4599.00,
    originalPrice: 5599.00,
    stock: 30,
    unit: '张',
    coverImage: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=solid%20wood%20bed%20frame%20minimalist%20design&image_size=square_hd',
    images: [],
    features: ['进口实木', '环保漆', '稳固结构', '静音设计'],
    specifications: {
      '尺寸': '1800x2000mm',
      '材质': '橡木/胡桃木',
      '颜色': '原木色/胡桃色'
    },
    packageIds: ['pkg-002', 'pkg-003'],
    sortOrder: 3,
    status: 1,
    salesCount: 89,
    rating: 4.9
  },
  {
    id: 'acc-004',
    name: '智能厨房套餐',
    code: 'KITCHEN_SMART_001',
    category: '厨房配件',
    description: '包含智能油烟机、燃气灶、消毒柜三件套',
    price: 8999.00,
    originalPrice: 12999.00,
    stock: 20,
    unit: '套',
    coverImage: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=modern%20smart%20kitchen%20appliances%20stainless%20steel&image_size=square_hd',
    images: [],
    features: ['智能控制', '一级能效', '大吸力', '安全防护'],
    specifications: {
      '油烟机': '大吸力22立方/min',
      '燃气灶': '5.0KW大火力',
      '消毒柜': '120L大容量'
    },
    packageIds: ['pkg-003'],
    sortOrder: 4,
    status: 1,
    salesCount: 45,
    rating: 4.9
  }
];

const mockUpgradePackages = [
  {
    id: 'upg-001',
    name: '水电升级包',
    code: 'UPGRADE_PLUMBING',
    description: '升级为品牌水管电线，增加质保年限',
    price: 5000.00,
    originalPrice: 6800.00,
    features: ['品牌水管', '国标电线', '10年质保', '免费检测'],
    sortOrder: 1,
    status: 1
  },
  {
    id: 'upg-002',
    name: '防水升级包',
    code: 'UPGRADE_WATERPROOF',
    description: '升级为高端防水材料，双重防水保障',
    price: 3000.00,
    originalPrice: 4500.00,
    features: ['进口材料', '双重防水', '闭水试验', '5年质保'],
    sortOrder: 2,
    status: 1
  },
  {
    id: 'upg-003',
    name: '智能家居包',
    code: 'UPGRADE_SMART_HOME',
    description: '包含智能开关、智能门锁、智能窗帘等',
    price: 8800.00,
    originalPrice: 12000.00,
    features: ['智能开关', '智能门锁', '智能窗帘', 'APP控制'],
    sortOrder: 3,
    status: 1
  }
];

const mockComments = [
  {
    id: 'cmt-001',
    packageId: 'pkg-001',
    userId: 'user-001',
    userName: '张先生',
    userAvatar: null,
    rating: 5,
    content: '非常满意的一次装修体验！设计师很专业，施工团队也很负责，效果超出预期。价格透明，没有增项，推荐给大家！',
    images: [
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=beautiful%20renovated%20living%20room%20modern%20style&image_size=square_hd'
    ],
    orderId: 'order-001',
    likeCount: 28,
    replyCount: 3,
    isAnonymous: false,
    status: 1,
    createdAt: new Date(Date.now() - 86400000 * 30)
  },
  {
    id: 'cmt-002',
    packageId: 'pkg-001',
    userId: 'user-002',
    userName: '李女士',
    userAvatar: null,
    rating: 4,
    content: '整体效果不错，就是施工周期稍微长了一点。材料质量很好，设计师很耐心地解答了我们的问题。',
    images: [],
    orderId: 'order-002',
    likeCount: 15,
    replyCount: 1,
    isAnonymous: false,
    status: 1,
    createdAt: new Date(Date.now() - 86400000 * 15)
  },
  {
    id: 'cmt-003',
    packageId: 'pkg-002',
    userId: 'user-003',
    userName: '王先生',
    userAvatar: null,
    rating: 5,
    content: '北欧风格真的太喜欢了！材料都是环保的，装修完很快就入住了。服务态度也很好，有问题都能及时解决。',
    images: [
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=nordic%20style%20renovated%20apartment%20cozy&image_size=square_hd'
    ],
    orderId: 'order-003',
    likeCount: 42,
    replyCount: 8,
    isAnonymous: false,
    status: 1,
    createdAt: new Date(Date.now() - 86400000 * 7)
  }
];

const mockUsers = [
  {
    id: 'user-001',
    phone: '13800138001',
    password: null,
    realName: '张三',
    idCard: '110101199001011234',
    email: 'zhangsan@example.com',
    city: '北京市',
    district: '朝阳区',
    project: '朝阳公园小区',
    building: '3号楼',
    floor: '15层',
    houseType: '三室一厅',
    houseArea: 120.00,
    floorPlanImage: null,
    status: 1
  }
];

const memoryData = {
  packages: [...mockPackages],
  packageAttributes: [...mockPackageAttributes],
  accessories: [...mockAccessories],
  upgradePackages: [...mockUpgradePackages],
  comments: [...mockComments],
  users: [...mockUsers],
  carts: [],
  orders: []
};

const findPackageById = (id) => {
  const pkg = memoryData.packages.find(p => p.id === id || p.code === id);
  if (!pkg) return null;
  
  const attributes = memoryData.packageAttributes
    .filter(a => a.packageId === pkg.id && a.status === 1)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map(attr => ({
      ...attr,
      values: attr.values.filter(v => v.status === 1).sort((a, b) => a.sortOrder - b.sortOrder)
    }));
  
  return {
    ...pkg,
    attributes
  };
};

const findAllPackages = (options = {}) => {
  let result = [...memoryData.packages].filter(p => p.status === 1);
  
  if (options.category) {
    result = result.filter(p => p.category === options.category);
  }
  
  result.sort((a, b) => a.sortOrder - b.sortOrder);
  
  const page = options.page || 1;
  const pageSize = options.pageSize || 20;
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  
  return {
    list: result.slice(start, end),
    total: result.length,
    page,
    pageSize
  };
};

const getPackageCategories = () => {
  const categories = new Set();
  memoryData.packages
    .filter(p => p.status === 1 && p.category)
    .forEach(p => categories.add(p.category));
  
  return Array.from(categories).map(c => ({ code: c, name: c }));
};

const findAllAccessories = (options = {}) => {
  let result = [...memoryData.accessories].filter(a => a.status === 1);
  
  if (options.category) {
    result = result.filter(a => a.category === options.category);
  }
  
  if (options.packageId) {
    result = result.filter(a => a.packageIds && a.packageIds.includes(options.packageId));
  }
  
  if (options.keyword) {
    const keyword = options.keyword.toLowerCase();
    result = result.filter(a => 
      a.name.toLowerCase().includes(keyword) || 
      a.description.toLowerCase().includes(keyword)
    );
  }
  
  result.sort((a, b) => a.sortOrder - b.sortOrder);
  
  const page = options.page || 1;
  const pageSize = options.pageSize || 20;
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  
  return {
    list: result.slice(start, end),
    total: result.length,
    page,
    pageSize
  };
};

const getAccessoryCategories = () => {
  const categories = new Set();
  memoryData.accessories
    .filter(a => a.status === 1 && a.category)
    .forEach(a => categories.add(a.category));
  
  return Array.from(categories).map(c => ({ code: c, name: c }));
};

const findAccessoryById = (id) => {
  return memoryData.accessories.find(a => a.id === id || a.code === id);
};

const findAllUpgradePackages = () => {
  return [...memoryData.upgradePackages].filter(u => u.status === 1).sort((a, b) => a.sortOrder - b.sortOrder);
};

const findUpgradePackageById = (id) => {
  return memoryData.upgradePackages.find(u => u.id === id || u.code === id);
};

const findCommentsByPackageId = (packageId, options = {}) => {
  let result = [...memoryData.comments].filter(c => c.packageId === packageId && c.status === 1);
  
  if (options.rating) {
    result = result.filter(c => c.rating === parseInt(options.rating));
  }
  
  if (options.hasImage) {
    result = result.filter(c => c.images && c.images.length > 0);
  }
  
  result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  
  const page = options.page || 1;
  const pageSize = options.pageSize || 10;
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  
  return {
    list: result.slice(start, end),
    total: result.length,
    page,
    pageSize
  };
};

const createComment = (commentData) => {
  const comment = {
    id: 'cmt-' + uuidv4().split('-')[0],
    ...commentData,
    likeCount: 0,
    replyCount: 0,
    status: 1,
    createdAt: new Date()
  };
  memoryData.comments.push(comment);
  return comment;
};

const findUserByPhone = (phone) => {
  return memoryData.users.find(u => u.phone === phone);
};

const findUserById = (id) => {
  return memoryData.users.find(u => u.id === id);
};

const createUser = (userData) => {
  const user = {
    id: 'user-' + uuidv4().split('-')[0],
    ...userData,
    status: 1,
    createdAt: new Date()
  };
  memoryData.users.push(user);
  return user;
};

const updateUser = (id, updateData) => {
  const index = memoryData.users.findIndex(u => u.id === id);
  if (index !== -1) {
    memoryData.users[index] = { ...memoryData.users[index], ...updateData };
    return memoryData.users[index];
  }
  return null;
};

const getOrCreateCart = (userId) => {
  let cart = memoryData.carts.find(c => c.userId === userId);
  if (!cart) {
    cart = {
      id: 'cart-' + uuidv4().split('-')[0],
      userId,
      items: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    memoryData.carts.push(cart);
  }
  return cart;
};

const addToCart = (userId, itemData) => {
  const cart = getOrCreateCart(userId);
  const existingItem = cart.items.find(item => 
    item.itemType === itemData.itemType && item.itemId === itemData.itemId
  );
  
  if (existingItem) {
    existingItem.quantity += itemData.quantity || 1;
  } else {
    cart.items.push({
      id: 'item-' + uuidv4().split('-')[0],
      ...itemData,
      quantity: itemData.quantity || 1,
      addedAt: new Date()
    });
  }
  cart.updatedAt = new Date();
  return cart;
};

const updateCartItem = (userId, itemId, updateData) => {
  const cart = getOrCreateCart(userId);
  const item = cart.items.find(i => i.id === itemId);
  if (item) {
    Object.assign(item, updateData);
    cart.updatedAt = new Date();
    return true;
  }
  return false;
};

const removeFromCart = (userId, itemId) => {
  const cart = getOrCreateCart(userId);
  const index = cart.items.findIndex(i => i.id === itemId);
  if (index !== -1) {
    cart.items.splice(index, 1);
    cart.updatedAt = new Date();
    return true;
  }
  return false;
};

const clearCart = (userId) => {
  const cart = getOrCreateCart(userId);
  cart.items = [];
  cart.updatedAt = new Date();
  return cart;
};

const createOrder = (orderData) => {
  const order = {
    id: 'ORD' + Date.now(),
    orderNo: 'ORD' + Date.now() + Math.floor(Math.random() * 1000),
    ...orderData,
    status: 'pending',
    createdAt: new Date(),
    updatedAt: new Date(),
    logs: [{
      action: '创建订单',
      description: '订单已创建，等待确认',
      createdAt: new Date()
    }]
  };
  memoryData.orders.push(order);
  return order;
};

const findOrdersByUserId = (userId, options = {}) => {
  let result = [...memoryData.orders].filter(o => o.userId === userId);
  
  if (options.status) {
    result = result.filter(o => o.status === options.status);
  }
  
  result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  
  const page = options.page || 1;
  const pageSize = options.pageSize || 10;
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  
  return {
    list: result.slice(start, end),
    total: result.length,
    page,
    pageSize
  };
};

const findOrderById = (id) => {
  return memoryData.orders.find(o => o.id === id || o.orderNo === id);
};

const updateOrderStatus = (id, status, action, description) => {
  const order = findOrderById(id);
  if (order) {
    order.status = status;
    order.updatedAt = new Date();
    if (action || description) {
      order.logs.push({
        action,
        description,
        createdAt: new Date()
      });
    }
    return order;
  }
  return null;
};

module.exports = {
  memoryData,
  findPackageById,
  findAllPackages,
  getPackageCategories,
  findAllAccessories,
  getAccessoryCategories,
  findAccessoryById,
  findAllUpgradePackages,
  findUpgradePackageById,
  findCommentsByPackageId,
  createComment,
  findUserByPhone,
  findUserById,
  createUser,
  updateUser,
  getOrCreateCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  createOrder,
  findOrdersByUserId,
  findOrderById,
  updateOrderStatus
};
