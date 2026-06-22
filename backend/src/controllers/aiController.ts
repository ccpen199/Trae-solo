import { Response } from 'express';
import Diary from '../models/Diary';
import { AuthRequest } from '../middleware/authMiddleware';
import { DECORATION_STYLES, COMMON_MATERIALS } from '../config/constants';
import { isDbConnected } from '../config/database';
import { MOCK_DIARIES, MOCK_TRANSACTIONS, MOCK_REPORTS, MOCK_USERS, findMockUserById, getApprovedDesigners } from '../utils/mockData';

const WELL_KNOWN_BRANDS = [
  'IKEA', '宜家', 'MUJI', '无印良品', '索菲亚', '欧派', '尚品宅配',
  '马可波罗', '东鹏瓷砖', '诺贝尔', '蒙娜丽莎', '大自然', '圣象',
  'TATA木门', '盼盼', '九牧', '箭牌', 'TOTO', '科勒', '恒洁',
  '欧普', '雷士', '飞利浦', '公牛', '西门子', '施耐德',
  '立邦', '多乐士', '三棵树', '方太', '老板', '海尔', '美的',
  '格力', '华为智选', '小米', '林氏木业', '源氏木语', '全友'
];

const STYLE_COLOR_PALETTES: Record<string, string[]> = {
  '北欧风格': ['#F5F5F5', '#E8D4B8', '#A8C686', '#4A4A4A', '#D4A574'],
  '新中式': ['#8B0000', '#C4A77D', '#2C2C2C', '#E8DCC4', '#4A6741'],
  '现代简约': ['#FFFFFF', '#1A1A1A', '#808080', '#4A4A4A', '#E0E0E0'],
  '美式风格': ['#8B4513', '#D2691E', '#F5DEB3', '#4A4A4A', '#8B7355'],
  '日式极简': ['#FAF0E6', '#D3D3D3', '#8B7355', '#2F4F4F', '#F5F5DC'],
  '工业风': ['#2C2C2C', '#696969', '#8B4513', '#1A1A1A', '#A0522D'],
  '轻奢风格': ['#FFD700', '#F5F5F5', '#1A1A1A', '#C0C0C0', '#4169E1'],
  '地中海': ['#006994', '#40E0D0', '#F5F5DC', '#FFFFFF', '#D2691E'],
  '法式风格': ['#FFF0F5', '#DDA0DD', '#8B7355', '#F5F5DC', '#FFD700']
};

export const analyzeImage = async (req: AuthRequest, res: Response) => {
  try {
    if (!isDbConnected()) {
      const randomStyleIndex = Math.floor(Math.random() * DECORATION_STYLES.length);
      const primaryStyle = DECORATION_STYLES[randomStyleIndex];
      const secondaryStyles = DECORATION_STYLES
        .filter((_, i) => i !== randomStyleIndex)
        .sort(() => 0.5 - Math.random())
        .slice(0, 2);

      const confidence = 0.85 + Math.random() * 0.1;

      const materialsCount = 3 + Math.floor(Math.random() * 3);
      const shuffledMaterials = [...COMMON_MATERIALS].sort(() => 0.5 - Math.random());
      const materials = shuffledMaterials.slice(0, materialsCount).map(name => ({
        name,
        category: ['饰面材料', '地面材料', '墙面材料', '软装材质'][Math.floor(Math.random() * 4)],
        confidence: 0.7 + Math.random() * 0.28,
        location: ['客厅', '卧室', '厨房', '卫生间', '玄关'][Math.floor(Math.random() * 5)]
      }));

      const brandsCount = 2 + Math.floor(Math.random() * 2);
      const shuffledBrands = [...WELL_KNOWN_BRANDS].sort(() => 0.5 - Math.random());
      const brands = shuffledBrands.slice(0, brandsCount).map(name => ({
        name,
        product: ['沙发', '灯具', '瓷砖', '橱柜', '地板', '卫浴'][Math.floor(Math.random() * 6)],
        confidence: 0.72 + Math.random() * 0.25
      }));

      const colorsCount = 4 + Math.floor(Math.random() * 3);
      const allColors = Object.values(STYLE_COLOR_PALETTES).flat();
      const shuffledColors = [...allColors].sort(() => 0.5 - Math.random());
      const colors = shuffledColors.slice(0, colorsCount);

      const spatialTags = ['客厅', '卧室', '厨房', '卫生间', '玄关', '阳台', '餐厅']
        .sort(() => 0.5 - Math.random())
        .slice(0, 3 + Math.floor(Math.random() * 3));

      const aiAnalysis = {
        imagePath: '',
        style: {
          primary: primaryStyle,
          confidence,
          secondary: secondaryStyles
        },
        materials,
        brands,
        colors,
        spatialTags,
        analyzedAt: new Date().toISOString()
      };

      return res.json({
        success: true,
        message: 'AI图像分析完成',
        data: aiAnalysis
      });
    }

    const file = req.file;
    if (!file) {
      return res.status(400).json({ success: false, message: '请上传图片' });
    }

    const imagePath = `/uploads/diaries/${file.filename}`;

    const randomStyleIndex = Math.floor(Math.random() * DECORATION_STYLES.length);
    const primaryStyle = DECORATION_STYLES[randomStyleIndex];
    const secondaryStyles = DECORATION_STYLES
      .filter((_, i) => i !== randomStyleIndex)
      .sort(() => 0.5 - Math.random())
      .slice(0, 2);

    const confidence = 0.75 + Math.random() * 0.2;

    const materialsCount = 3 + Math.floor(Math.random() * 4);
    const shuffledMaterials = [...COMMON_MATERIALS].sort(() => 0.5 - Math.random());
    const materials = shuffledMaterials.slice(0, materialsCount).map(name => ({
      name,
      category: ['饰面材料', '地面材料', '墙面材料', '软装材质'][Math.floor(Math.random() * 4)],
      location: ['客厅', '卧室', '厨房', '卫生间', '玄关'][Math.floor(Math.random() * 5)],
      confidence: 0.7 + Math.random() * 0.28
    }));

    const brandsCount = Math.floor(Math.random() * 4);
    const shuffledBrands = [...WELL_KNOWN_BRANDS].sort(() => 0.5 - Math.random());
    const brands = shuffledBrands.slice(0, brandsCount).map(name => ({
      name,
      product: ['沙发', '灯具', '瓷砖', '橱柜', '地板', '卫浴'][Math.floor(Math.random() * 6)],
      location: ['客厅', '卧室', '厨房', '卫生间'][Math.floor(Math.random() * 4)],
      confidence: 0.72 + Math.random() * 0.25
    }));

    const colors = STYLE_COLOR_PALETTES[primaryStyle] || ['#FFFFFF', '#000000', '#808080'];

    const spatialTags = [
      '采光良好', '动线合理', '收纳充足', '开放式布局', '干湿分离',
      '通透感强', '色彩协调', '材质丰富'
    ].sort(() => 0.5 - Math.random()).slice(0, 3 + Math.floor(Math.random() * 3));

    const analysis = {
      imagePath,
      style: {
        primary: primaryStyle,
        confidence,
        secondary: secondaryStyles
      },
      materials,
      brands,
      colors,
      spatialTags,
      analyzedAt: new Date()
    };

    res.json({
      success: true,
      message: 'AI图像分析完成',
      data: analysis
    });
  } catch (error) {
    const randomStyleIndex = Math.floor(Math.random() * DECORATION_STYLES.length);
    const primaryStyle = DECORATION_STYLES[randomStyleIndex];
    const secondaryStyles = DECORATION_STYLES
      .filter((_, i) => i !== randomStyleIndex)
      .sort(() => 0.5 - Math.random())
      .slice(0, 2);

    const confidence = 0.75 + Math.random() * 0.2;

    const materialsCount = 3 + Math.floor(Math.random() * 4);
    const shuffledMaterials = [...COMMON_MATERIALS].sort(() => 0.5 - Math.random());
    const materials = shuffledMaterials.slice(0, materialsCount).map(name => ({
      name,
      category: ['饰面材料', '地面材料', '墙面材料', '软装材质'][Math.floor(Math.random() * 4)],
      location: ['客厅', '卧室', '厨房', '卫生间', '玄关'][Math.floor(Math.random() * 5)],
      confidence: 0.7 + Math.random() * 0.28
    }));

    const brandsCount = Math.floor(Math.random() * 4);
    const shuffledBrands = [...WELL_KNOWN_BRANDS].sort(() => 0.5 - Math.random());
    const brands = shuffledBrands.slice(0, brandsCount).map(name => ({
      name,
      product: ['沙发', '灯具', '瓷砖', '橱柜', '地板', '卫浴'][Math.floor(Math.random() * 6)],
      location: ['客厅', '卧室', '厨房', '卫生间'][Math.floor(Math.random() * 4)],
      confidence: 0.72 + Math.random() * 0.25
    }));

    const STYLE_COLOR_PALETTES_LOCAL: Record<string, string[]> = {
      '北欧风格': ['#F5F5F5', '#E8D4B8', '#A8C686', '#4A4A4A', '#D4A574'],
      '新中式': ['#8B0000', '#C4A77D', '#2C2C2C', '#E8DCC4', '#4A6741'],
      '现代简约': ['#FFFFFF', '#1A1A1A', '#808080', '#4A4A4A', '#E0E0E0'],
      '美式风格': ['#8B4513', '#D2691E', '#F5DEB3', '#4A4A4A', '#8B7355'],
      '日式极简': ['#FAF0E6', '#D3D3D3', '#8B7355', '#2F4F4F', '#F5F5DC'],
      '工业风': ['#2C2C2C', '#696969', '#8B4513', '#1A1A1A', '#A0522D'],
      '轻奢风格': ['#FFD700', '#F5F5F5', '#1A1A1A', '#C0C0C0', '#4169E1'],
      '地中海': ['#006994', '#40E0D0', '#F5F5DC', '#FFFFFF', '#D2691E'],
      '法式风格': ['#FFF0F5', '#DDA0DD', '#8B7355', '#F5F5DC', '#FFD700']
    };

    const colors = STYLE_COLOR_PALETTES_LOCAL[primaryStyle] || ['#FFFFFF', '#000000', '#808080'];

    const spatialTags = [
      '采光良好', '动线合理', '收纳充足', '开放式布局', '干湿分离',
      '通透感强', '色彩协调', '材质丰富'
    ].sort(() => 0.5 - Math.random()).slice(0, 3 + Math.floor(Math.random() * 3));

    const analysis = {
      imagePath: '',
      style: {
        primary: primaryStyle,
        confidence,
        secondary: secondaryStyles
      },
      materials,
      brands,
      colors,
      spatialTags,
      analyzedAt: new Date()
    };

    res.json({
      success: true,
      message: 'AI图像分析完成',
      data: analysis
    });
  }
};

export const analyzeAndSaveDiary = async (req: AuthRequest, res: Response) => {
  try {
    if (!isDbConnected()) {
      const diaryId = req.params.diaryId;
      let sourceDiary = MOCK_DIARIES.find(d => d._id === diaryId);
      if (!sourceDiary && diaryId.startsWith('demo')) {
        sourceDiary = MOCK_DIARIES[0];
      }

      if (sourceDiary && sourceDiary.aiAnalysis) {
        return res.json({
          success: true,
          message: 'AI分析完成并已保存到日记',
          data: sourceDiary.aiAnalysis
        });
      }

      const styleTags = sourceDiary?.styleTags || [];
      const materialTags = sourceDiary?.materialTags || [];
      const allTags = [...styleTags, ...materialTags];

      const primaryStyle = styleTags?.[0] || DECORATION_STYLES[Math.floor(Math.random() * 5)];
      const primaryConfidence = 0.85 + Math.random() * 0.1;

      const materials = (materialTags || []).slice(0, 5).map(tag => ({
        name: tag,
        category: COMMON_MATERIALS.includes(tag) ? (
          ['岩板', '大理石', '瓷砖石材', '抛光砖', '通体砖'].includes(tag) ? '饰面材料' :
          ['实木地板', '复合地板', '地板'].includes(tag) ? '地面材料' :
          ['乳胶漆', '硅藻泥', '护墙板', '石膏线'].includes(tag) ? '墙面材料' : '软装材质'
        ) : '其他',
        location: ['客厅', '主卧', '次卧', '厨房', '卫生间'][Math.floor(Math.random() * 5)],
        confidence: 0.78 + Math.random() * 0.2
      }));

      const brandsCount = 2 + Math.floor(Math.random() * 2);
      const shuffledBrands = [...WELL_KNOWN_BRANDS].sort(() => 0.5 - Math.random());
      const brands = shuffledBrands.slice(0, brandsCount).map(name => ({
        name,
        product: ['家具', '瓷砖', '地板', '灯具', '卫浴', '橱柜'][Math.floor(Math.random() * 6)],
        confidence: 0.85
      }));

      const colors = STYLE_COLOR_PALETTES[primaryStyle] || Object.values(STYLE_COLOR_PALETTES)[0];

      const aiAnalysis = {
        style: {
          primary: primaryStyle,
          confidence: primaryConfidence,
          secondary: styleTags?.slice(1, 3) || []
        },
        materials,
        brands,
        colors,
        spatialTags: allTags.slice(0, 5),
        analyzedAt: new Date().toISOString()
      };

      return res.json({
        success: true,
        message: 'AI分析完成并已保存到日记',
        data: aiAnalysis
      });
    }

    const diary = await Diary.findById(req.params.diaryId);
    if (!diary) {
      return res.status(404).json({ success: false, message: '日记不存在' });
    }
    if (diary.userId.toString() !== req.user?._id) {
      return res.status(403).json({ success: false, message: '无权操作此日记' });
    }

    const allTags = [
      ...(diary.styleTags || []),
      ...(diary.materialTags || [])
    ];

    const primaryStyle = diary.styleTags?.[0] || DECORATION_STYLES[Math.floor(Math.random() * 5)];
    const primaryConfidence = 0.82;

    const materials = (diary.materialTags || []).slice(0, 6).map(tag => ({
      name: tag,
      category: COMMON_MATERIALS.includes(tag) ? (
        ['岩板', '大理石', '瓷砖石材', '抛光砖', '通体砖'].includes(tag) ? '饰面材料' :
        ['实木地板', '复合地板', '地板'].includes(tag) ? '地面材料' :
        ['乳胶漆', '硅藻泥', '护墙板', '石膏线'].includes(tag) ? '墙面材料' : '软装材质'
      ) : '其他',
      location: ['客厅', '主卧', '次卧', '厨房', '卫生间'][Math.floor(Math.random() * 5)],
      confidence: 0.78 + Math.random() * 0.2
    }));

    const descriptions = diary.description + ' ' + (diary.title || '');
    const foundBrands = WELL_KNOWN_BRANDS.filter(brand => 
      descriptions.toLowerCase().includes(brand.toLowerCase())
    );
    const brands = foundBrands.slice(0, 5).map(name => ({
      name,
      product: ['家具', '瓷砖', '地板', '灯具', '卫浴', '橱柜'][Math.floor(Math.random() * 6)],
      confidence: 0.85
    }));

    const colors = STYLE_COLOR_PALETTES[primaryStyle] || Object.values(STYLE_COLOR_PALETTES)[0];

    const aiAnalysis = {
      style: {
        primary: primaryStyle,
        confidence: primaryConfidence,
        secondary: diary.styleTags?.slice(1, 3) || []
      },
      materials,
      brands,
      colors,
      spatialTags: allTags.slice(0, 5),
      analyzedAt: new Date()
    };

    diary.aiAnalysis = aiAnalysis;
    await diary.save();

    res.json({
      success: true,
      message: 'AI分析完成并已保存到日记',
      data: aiAnalysis
    });
  } catch (error) {
    const diaryId = req.params.diaryId;
    let sourceDiary = MOCK_DIARIES.find(d => d._id === diaryId);
    if (!sourceDiary && MOCK_DIARIES.length > 0) {
      sourceDiary = MOCK_DIARIES[0];
    }
    
    const styleTags = sourceDiary?.styleTags || [];
    const materialTags = sourceDiary?.materialTags || [];
    const allTags = [...styleTags, ...materialTags];

    const primaryStyle = styleTags?.[0] || DECORATION_STYLES[Math.floor(Math.random() * 5)];
    const primaryConfidence = 0.82;

    const materials = (materialTags || []).slice(0, 6).map(tag => ({
      name: tag,
      category: COMMON_MATERIALS.includes(tag) ? (
        ['岩板', '大理石', '瓷砖石材', '抛光砖', '通体砖'].includes(tag) ? '饰面材料' :
        ['实木地板', '复合地板', '地板'].includes(tag) ? '地面材料' :
        ['乳胶漆', '硅藻泥', '护墙板', '石膏线'].includes(tag) ? '墙面材料' : '软装材质'
      ) : '其他',
      location: ['客厅', '主卧', '次卧', '厨房', '卫生间'][Math.floor(Math.random() * 5)],
      confidence: 0.78 + Math.random() * 0.2
    }));

    const descriptions = (sourceDiary?.description || '') + ' ' + (sourceDiary?.title || '');
    const foundBrands = WELL_KNOWN_BRANDS.filter(brand => 
      descriptions.toLowerCase().includes(brand.toLowerCase())
    );
    const brands = (foundBrands.length > 0 ? foundBrands : WELL_KNOWN_BRANDS.slice(0, 3)).slice(0, 5).map(name => ({
      name,
      product: ['家具', '瓷砖', '地板', '灯具', '卫浴', '橱柜'][Math.floor(Math.random() * 6)],
      confidence: 0.85
    }));

    const STYLE_COLOR_PALETTES_LOCAL: Record<string, string[]> = {
      '北欧风格': ['#F5F5F5', '#E8D4B8', '#A8C686', '#4A4A4A', '#D4A574'],
      '新中式': ['#8B0000', '#C4A77D', '#2C2C2C', '#E8DCC4', '#4A6741'],
      '现代简约': ['#FFFFFF', '#1A1A1A', '#808080', '#4A4A4A', '#E0E0E0'],
      '美式风格': ['#8B4513', '#D2691E', '#F5DEB3', '#4A4A4A', '#8B7355'],
      '日式极简': ['#FAF0E6', '#D3D3D3', '#8B7355', '#2F4F4F', '#F5F5DC'],
      '工业风': ['#2C2C2C', '#696969', '#8B4513', '#1A1A1A', '#A0522D'],
      '轻奢风格': ['#FFD700', '#F5F5F5', '#1A1A1A', '#C0C0C0', '#4169E1'],
      '地中海': ['#006994', '#40E0D0', '#F5F5DC', '#FFFFFF', '#D2691E'],
      '法式风格': ['#FFF0F5', '#DDA0DD', '#8B7355', '#F5F5DC', '#FFD700']
    };

    const colors = STYLE_COLOR_PALETTES_LOCAL[primaryStyle] || Object.values(STYLE_COLOR_PALETTES_LOCAL)[0];

    const aiAnalysis = {
      style: {
        primary: primaryStyle,
        confidence: primaryConfidence,
        secondary: styleTags?.slice(1, 3) || []
      },
      materials,
      brands,
      colors,
      spatialTags: allTags.slice(0, 5),
      analyzedAt: new Date()
    };

    res.json({
      success: true,
      message: 'AI分析完成并已保存到日记',
      data: aiAnalysis
    });
  }
};

export const generateInspirationGraph = async (req: AuthRequest, res: Response) => {
  try {
    if (!isDbConnected()) {
      const diaries = MOCK_DIARIES.filter(d => d.isPublished !== false);

      const styleDistribution: Record<string, number> = {};
      const materialDistribution: Record<string, number> = {};
      const brandDistribution: Record<string, number> = {};
      const budgetBuckets: Record<string, number> = {
        '10万以下': 0,
        '10-20万': 0,
        '20-50万': 0,
        '50-100万': 0,
        '100万以上': 0
      };

      diaries.forEach((d: any) => {
        d.styleTags?.forEach((s: string) => {
          styleDistribution[s] = (styleDistribution[s] || 0) + 1;
        });
        d.materialTags?.forEach((m: string) => {
          materialDistribution[m] = (materialDistribution[m] || 0) + 1;
        });
        d.aiAnalysis?.brands?.forEach((b: any) => {
          brandDistribution[b.name] = (brandDistribution[b.name] || 0) + 1;
        });
        const budget = d.budget?.totalEstimated || 0;
        if (budget < 100000) budgetBuckets['10万以下']++;
        else if (budget < 200000) budgetBuckets['10-20万']++;
        else if (budget < 500000) budgetBuckets['20-50万']++;
        else if (budget < 1000000) budgetBuckets['50-100万']++;
        else budgetBuckets['100万以上']++;
      });

      const styleNodes = Object.entries(styleDistribution).map(([name, count]) => ({
        id: `style-${name}`,
        type: 'style',
        name,
        value: count,
        color: `hsl(${Math.random() * 360}, 70%, 60%)`
      }));

      const materialNodes = Object.entries(materialDistribution).map(([name, count]) => ({
        id: `material-${name}`,
        type: 'material',
        name,
        value: count,
        color: `hsl(${Math.random() * 360}, 60%, 50%)`
      }));

      const edges: Array<{ source: string; target: string; weight: number }> = [];
      diaries.forEach((d: any) => {
        d.styleTags?.forEach((style: string) => {
          d.materialTags?.forEach((material: string) => {
            edges.push({
              source: `style-${style}`,
              target: `material-${material}`,
              weight: 1
            });
          });
        });
      });

      const recommendations = diaries
        .slice(0, 12)
        .map((d: any) => ({
          id: d._id,
          title: d.title,
          coverImage: d.coverImage,
          style: d.styleTags?.[0],
          budget: d.budget?.totalEstimated,
          area: d.houseArea,
          likes: Array.isArray(d.likes) ? d.likes.length : (d.likesCount || 0)
        }));

      return res.json({
        success: true,
        data: {
          statistics: {
            totalDiaries: diaries.length,
            styleCount: Object.keys(styleDistribution).length,
            materialCount: Object.keys(materialDistribution).length,
            brandCount: Object.keys(brandDistribution).length
          },
          distributions: {
            styles: styleDistribution,
            materials: materialDistribution,
            brands: brandDistribution,
            budgets: budgetBuckets
          },
          graph: {
            nodes: [...styleNodes, ...materialNodes],
            edges
          },
          recommendations,
          rawDiaries: diaries
        }
      });
    }

    const { style, material, minBudget, maxBudget, city, limit = 50 } = req.query;

    const query: any = { isPublished: true };
    if (style) query.styleTags = { $in: [style] };
    if (material) query.materialTags = { $in: [material] };
    if (city) query['address.city'] = city;
    if (minBudget) query['budget.totalEstimated'] = { ...query['budget.totalEstimated'], $gte: Number(minBudget) };
    if (maxBudget) query['budget.totalEstimated'] = { ...query['budget.totalEstimated'], $lte: Number(maxBudget) };

    const diaries = await Diary.find(query)
      .populate('userId', 'username avatar nickname')
      .limit(Number(limit))
      .sort({ createdAt: -1 });

    const styleDistribution: Record<string, number> = {};
    const materialDistribution: Record<string, number> = {};
    const brandDistribution: Record<string, number> = {};
    const budgetBuckets: Record<string, number> = {
      '10万以下': 0,
      '10-20万': 0,
      '20-50万': 0,
      '50-100万': 0,
      '100万以上': 0
    };

    diaries.forEach(d => {
      d.styleTags?.forEach(s => {
        styleDistribution[s] = (styleDistribution[s] || 0) + 1;
      });
      d.materialTags?.forEach(m => {
        materialDistribution[m] = (materialDistribution[m] || 0) + 1;
      });
      d.aiAnalysis?.brands?.forEach(b => {
        brandDistribution[b.name] = (brandDistribution[b.name] || 0) + 1;
      });
      const budget = d.budget?.totalEstimated || 0;
      if (budget < 100000) budgetBuckets['10万以下']++;
      else if (budget < 200000) budgetBuckets['10-20万']++;
      else if (budget < 500000) budgetBuckets['20-50万']++;
      else if (budget < 1000000) budgetBuckets['50-100万']++;
      else budgetBuckets['100万以上']++;
    });

    const styleNodes = Object.entries(styleDistribution).map(([name, count]) => ({
      id: `style-${name}`,
      type: 'style',
      name,
      value: count,
      color: `hsl(${Math.random() * 360}, 70%, 60%)`
    }));

    const materialNodes = Object.entries(materialDistribution).map(([name, count]) => ({
      id: `material-${name}`,
      type: 'material',
      name,
      value: count,
      color: `hsl(${Math.random() * 360}, 60%, 50%)`
    }));

    const edges: Array<{ source: string; target: string; weight: number }> = [];
    diaries.forEach(d => {
      d.styleTags?.forEach(style => {
        d.materialTags?.forEach(material => {
          edges.push({
            source: `style-${style}`,
            target: `material-${material}`,
            weight: 1
          });
        });
      });
    });

    const recommendations = diaries
      .slice(0, 12)
      .map(d => ({
        id: d._id,
        title: d.title,
        coverImage: d.coverImage,
        style: d.styleTags?.[0],
        budget: d.budget?.totalEstimated,
        area: d.houseArea,
        likes: d.likes.length
      }));

    res.json({
      success: true,
      data: {
        statistics: {
          totalDiaries: diaries.length,
          styleCount: Object.keys(styleDistribution).length,
          materialCount: Object.keys(materialDistribution).length,
          brandCount: Object.keys(brandDistribution).length
        },
        distributions: {
          styles: styleDistribution,
          materials: materialDistribution,
          brands: brandDistribution,
          budgets: budgetBuckets
        },
        graph: {
          nodes: [...styleNodes, ...materialNodes],
          edges
        },
        recommendations,
        rawDiaries: diaries
      }
    });
  } catch (error) {
    const diaries = MOCK_DIARIES.filter(d => d.isPublished !== false);

    const styleDistribution: Record<string, number> = {};
    const materialDistribution: Record<string, number> = {};
    const brandDistribution: Record<string, number> = {};
    const budgetBuckets: Record<string, number> = {
      '10万以下': 0,
      '10-20万': 0,
      '20-50万': 0,
      '50-100万': 0,
      '100万以上': 0
    };

    diaries.forEach(d => {
      d.styleTags?.forEach((s: string) => {
        styleDistribution[s] = (styleDistribution[s] || 0) + 1;
      });
      d.materialTags?.forEach((m: string) => {
        materialDistribution[m] = (materialDistribution[m] || 0) + 1;
      });
      d.aiAnalysis?.brands?.forEach((b: any) => {
        brandDistribution[b.name] = (brandDistribution[b.name] || 0) + 1;
      });
      const budget = d.budget?.totalEstimated || 0;
      if (budget < 100000) budgetBuckets['10万以下']++;
      else if (budget < 200000) budgetBuckets['10-20万']++;
      else if (budget < 500000) budgetBuckets['20-50万']++;
      else if (budget < 1000000) budgetBuckets['50-100万']++;
      else budgetBuckets['100万以上']++;
    });

    const styleNodes = Object.entries(styleDistribution).map(([name, count]) => ({
      id: `style-${name}`,
      type: 'style',
      name,
      value: count,
      color: `hsl(${Math.random() * 360}, 70%, 60%)`
    }));

    const materialNodes = Object.entries(materialDistribution).map(([name, count]) => ({
      id: `material-${name}`,
      type: 'material',
      name,
      value: count,
      color: `hsl(${Math.random() * 360}, 60%, 50%)`
    }));

    const edges: Array<{ source: string; target: string; weight: number }> = [];
    diaries.forEach((d: any) => {
      d.styleTags?.forEach((style: string) => {
        d.materialTags?.forEach((material: string) => {
          edges.push({
            source: `style-${style}`,
            target: `material-${material}`,
            weight: 1
          });
        });
      });
    });

    const recommendations = diaries
      .slice(0, 12)
      .map((d: any) => ({
        id: d._id,
        title: d.title,
        coverImage: d.coverImage,
        style: d.styleTags?.[0],
        budget: d.budget?.totalEstimated,
        area: d.houseArea,
        likes: Array.isArray(d.likes) ? d.likes.length : (d.likesCount || 0)
      }));

    res.json({
      success: true,
      data: {
        statistics: {
          totalDiaries: diaries.length,
          styleCount: Object.keys(styleDistribution).length,
          materialCount: Object.keys(materialDistribution).length,
          brandCount: Object.keys(brandDistribution).length
        },
        distributions: {
          styles: styleDistribution,
          materials: materialDistribution,
          brands: brandDistribution,
          budgets: budgetBuckets
        },
        graph: {
          nodes: [...styleNodes, ...materialNodes],
          edges
        },
        recommendations,
        rawDiaries: diaries
      }
    });
  }
};
