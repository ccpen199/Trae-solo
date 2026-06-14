import { getDatabase } from '../models/database.js';

export function seedDatabase(): void {
  const db = getDatabase();

  const countStmt = db.prepare('SELECT COUNT(*) as count FROM estates');
  const result = countStmt.get() as { count: number };
  if (result.count > 0) {
    console.log('Database already seeded, skipping...');
    return;
  }

  const tx = db.transaction(() => {
    const insertStore = db.prepare(`
      INSERT INTO stores (name, address, lat, lng, phone, business_hours)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const stores = [
      ['中原地产-国贸旗舰店', '北京市朝阳区建国门外大街1号', 39.9087, 116.4613, '010-88888001', '09:00-21:00'],
      ['中原地产-中关村店', '北京市海淀区中关村大街1号', 39.9832, 116.3169, '010-88888002', '09:00-21:00'],
      ['中原地产-望京店', '北京市朝阳区望京街9号', 40.0021, 116.4708, '010-88888003', '09:00-21:00'],
      ['中原地产-西二旗店', '北京市海淀区西二旗大街39号', 40.0512, 116.3057, '010-88888004', '09:00-21:00'],
      ['中原地产-亦庄店', '北京市大兴区荣华中路10号', 39.7896, 116.5123, '010-88888005', '09:00-21:00'],
    ];
    stores.forEach(s => insertStore.run(...s));

    const insertBroker = db.prepare(`
      INSERT INTO brokers (name, phone, avatar, certified, certification_no, store_id, rating, deal_count, experience_years, description)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const brokers = [
      ['李明', '13800138001', 'https://api.dicebear.com/7.x/avataaars/svg?seed=broker1', 1, 'ZY20200001', 1, 4.9, 128, 8, '资深房产顾问，擅长学区房分析'],
      ['王芳', '13800138002', 'https://api.dicebear.com/7.x/avataaars/svg?seed=broker2', 1, 'ZY20200002', 1, 4.8, 95, 6, '专注朝阳高端住宅，服务贴心'],
      ['张伟', '13800138003', 'https://api.dicebear.com/7.x/avataaars/svg?seed=broker3', 1, 'ZY20200003', 2, 4.7, 87, 5, '海淀学区房专家，熟悉升学政策'],
      ['刘洋', '13800138004', 'https://api.dicebear.com/7.x/avataaars/svg?seed=broker4', 1, 'ZY20200004', 2, 4.9, 156, 10, '中关村区域金牌经纪人'],
      ['陈静', '13800138005', 'https://api.dicebear.com/7.x/avataaars/svg?seed=broker5', 1, 'ZY20200005', 3, 4.6, 72, 4, '望京租房专家，快速匹配需求'],
      ['赵强', '13800138006', 'https://api.dicebear.com/7.x/avataaars/svg?seed=broker6', 0, null, 4, 4.5, 45, 3, '西二旗新房顾问'],
      ['孙丽', '13800138007', 'https://api.dicebear.com/7.x/avataaars/svg?seed=broker7', 1, 'ZY20200007', 5, 4.8, 102, 7, '亦庄开发区房产专家'],
    ];
    brokers.forEach(b => insertBroker.run(...b));

    const insertEstate = db.prepare(`
      INSERT INTO estates (name, type, address, district, lat, lng, developer, property_company, property_fee, build_year, total_households, parking_count, green_rate, volume_rate, average_price, description, metro_lines, school_district, facilities)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const estates = [
      ['国贸公寓', 'new', '北京市朝阳区建国门外大街1号', '朝阳区', 39.9087, 116.4613, '国贸地产', '国贸物业', 8.5, 2018, 1200, 1800, 0.35, 3.2, 95000, 'CBD核心区高端公寓，配套完善', '1号线,10号线', '朝阳区实验小学', '游泳池,健身房,会所,幼儿园'],
      ['万科城市花园', 'secondhand', '北京市海淀区中关村大街27号', '海淀区', 39.9832, 116.3169, '万科地产', '万科物业', 4.2, 2010, 2500, 3000, 0.40, 2.8, 88000, '中关村核心区域，成熟社区', '4号线,10号线', '中关村一小', '游泳池,健身房,网球场,小学'],
      ['保利中央公园', 'new', '北京市朝阳区望京西街8号', '朝阳区', 40.0021, 116.4708, '保利地产', '保利物业', 6.8, 2020, 1800, 2500, 0.38, 2.5, 92000, '望京核心地段，公园式社区', '14号线,15号线', '望京实验小学', '游泳池,健身房,会所,公园'],
      ['融泽嘉园', 'rent', '北京市海淀区西二旗中路6号', '海淀区', 40.0512, 116.3057, '融创地产', '融创物业', 3.5, 2015, 3200, 4000, 0.32, 2.6, 75000, '西二旗大型社区，互联网人聚居地', '13号线,昌平线', '西二旗小学', '健身房,超市,幼儿园'],
      ['亦庄金茂府', 'new', '北京市大兴区亦庄经济开发区', '大兴区', 39.7896, 116.5123, '金茂地产', '金茂物业', 5.8, 2021, 1500, 2200, 0.42, 2.2, 68000, '亦庄高端科技住宅，恒温恒湿恒氧', '亦庄线', '北京二中亦庄分校', '游泳池,健身房,会所,新风系统'],
      ['朝阳公园南路8号', 'secondhand', '北京市朝阳区朝阳公园南路8号', '朝阳区', 39.9356, 116.4738, '泛海地产', '泛海物业', 7.5, 2016, 800, 1200, 0.45, 2.0, 120000, '朝阳公园旁顶级豪宅', '14号线,6号线', '白家庄小学', '游泳池,健身房,会所,私家花园'],
      ['天通苑北一区', 'rent', '北京市昌平区天通苑北街道', '昌平区', 40.0956, 116.4123, '顺天通地产', '顺天通物业', 1.8, 2003, 5000, 6000, 0.28, 2.9, 45000, '亚洲最大社区，生活便利', '5号线,17号线', '天通苑小学', '超市,医院,学校,地铁'],
      ['中海枫涟山庄', 'secondhand', '北京市海淀区西北旺镇', '海淀区', 40.0357, 116.2845, '中海地产', '中海物业', 2.8, 2008, 1600, 2000, 0.38, 1.8, 98000, '西北旺低密度洋房', '16号线', '中关村二小', '游泳池,网球场,会所'],
      ['北京壹号院', 'new', '北京市朝阳区农展馆北路8号', '朝阳区', 39.9423, 116.4621, '融创地产', '融创物业', 12.0, 2022, 300, 500, 0.50, 1.2, 180000, '北京顶级豪宅，临湖独栋', '10号线,6号线', '朝阳区实验小学', '私人会所,游泳池,高尔夫'],
      ['回龙观龙泽苑', 'rent', '北京市昌平区回龙观镇', '昌平区', 40.0678, 116.3356, '天鸿地产', '天鸿物业', 1.5, 2000, 4200, 5000, 0.30, 2.4, 52000, '回龙观大型成熟社区', '13号线,8号线', '回龙观小学', '超市,医院,公园'],
      ['望京SOHO', 'secondhand', '北京市朝阳区望京街10号', '朝阳区', 40.0015, 116.4698, 'SOHO中国', 'SOHO物业', 5.0, 2014, 2000, 3000, 0.25, 4.0, 85000, '望京地标建筑，商住两用', '14号线,15号线', '暂无', '健身房,咖啡厅,商场'],
      ['华润橡树湾', 'new', '北京市海淀区清河中街', '海淀区', 40.0234, 116.3256, '华润置地', '华润物业', 5.5, 2019, 2200, 3000, 0.40, 2.5, 110000, '清河高端品质社区', '13号线,8号线', '海淀实验二小', '游泳池,健身房,会所,双语幼儿园'],
    ];
    estates.forEach(e => insertEstate.run(...e));

    const insertProperty = db.prepare(`
      INSERT INTO properties (estate_id, title, type, price, unit_price, area, bedrooms, livingrooms, bathrooms, floor, total_floors, orientation, decoration, building_type, has_vr, vr_url, floor_plan_url, images, hotspots, description, features, tags, broker_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const properties = [
      [1, '国贸公寓精装两居 高层观景 CBD核心地段', 'secondhand', 8500000, 94444, 90, 2, 1, 1, '中楼层', 30, '南北', '精装修', '板楼', 1, 'https://demo.krpano.com/krpano.html?xml=demos%2Ftour-skin%2Ftour.xml', '/static/floorplan1.svg', JSON.stringify(['https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800', 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800']), JSON.stringify([{id:1,x:32,y:45,name:'客厅',description:'宽敞明亮的客厅'},{id:2,x:67,y:34,name:'主卧',description:'朝南主卧带飘窗'}]), 'CBD核心地段，高层观景，精装修拎包入住', '南北通透,采光好,近地铁', JSON.stringify(['近地铁','精装修','学区房']), 1],
      [1, '国贸公寓豪华三居 全景落地窗 品牌家电', 'rent', 25000, 166, 150, 3, 2, 2, '高楼层', 30, '东南', '豪华装修', '板楼', 1, 'https://demo.krpano.com/krpano.html?xml=demos%2Ftour-skin%2Ftour.xml', '/static/floorplan2.svg', JSON.stringify(['https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800', 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800']), JSON.stringify([{id:1,x:25,y:55,name:'客厅',description:'超大落地窗客厅'},{id:2,x:75,y:40,name:'主卧',description:'独立卫浴主卧'}]), '豪华装修，全屋智能家居，全景落地窗', '落地窗,智能家居,近地铁', JSON.stringify(['整租','精装修','近地铁']), 2],
      [2, '万科城市花园 南北通透三居 满五唯一', 'secondhand', 9800000, 89091, 110, 3, 2, 2, '中楼层', 18, '南北', '精装修', '板楼', 1, 'https://demo.krpano.com/krpano.html?xml=demos%2Ftour-skin%2Ftour.xml', '/static/floorplan3.svg', JSON.stringify(['https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800', 'https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=800']), JSON.stringify([{id:1,x:40,y:50,name:'客厅',description:'南北通透客厅'},{id:2,x:20,y:30,name:'次卧',description:'次卧儿童房'}]), '满五唯一，学区房，业主诚心出售', '南北通透,满五唯一,学区房', JSON.stringify(['学区房','满五唯一','南北通透']), 3],
      [3, '保利中央公园 新房四居 科技住宅', 'new', 15000000, 100000, 150, 4, 2, 3, '低楼层', 20, '南北', '精装修', '板楼', 1, 'https://demo.krpano.com/krpano.html?xml=demos%2Ftour-skin%2Ftour.xml', '/static/floorplan4.svg', JSON.stringify(['https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800', 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800']), JSON.stringify([{id:1,x:50,y:45,name:'客厅',description:'超大面宽客厅'},{id:2,x:30,y:60,name:'书房',description:'独立书房'}]), '望京核心，公园地产，科技住宅，恒温恒湿', '公园地产,科技住宅,精装修', JSON.stringify(['新房','科技住宅','公园地产']), 4],
      [4, '融泽嘉园 精装两居 家电齐全 拎包入住', 'rent', 6500, 65, 100, 2, 1, 1, '中楼层', 25, '南', '精装修', '塔楼', 0, null, '/static/floorplan1.svg', JSON.stringify(['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800', 'https://images.unsplash.com/photo-1560185893-a55cbc8c57e8?w=800']), '[]', '西二旗核心位置，近地铁，适合互联网从业者', '近地铁,家电齐全,拎包入住', JSON.stringify(['整租','近地铁','互联网人首选']), 5],
      [5, '亦庄金茂府 科技住宅 恒温恒湿恒氧', 'new', 8500000, 85000, 100, 3, 2, 2, '中楼层', 15, '南北', '精装修', '板楼', 1, 'https://demo.krpano.com/krpano.html?xml=demos%2Ftour-skin%2Ftour.xml', '/static/floorplan2.svg', JSON.stringify(['https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=800', 'https://images.unsplash.com/photo-1600573472592-401b489a3cdc?w=800']), JSON.stringify([{id:1,x:45,y:50,name:'客厅',description:'科技系统客厅'},{id:2,x:65,y:35,name:'主卧',description:'带飘窗主卧'}]), '金茂府系产品，三恒系统，亦庄核心', '科技住宅,三恒系统,精装修', JSON.stringify(['新房','科技住宅','精装交付']), 7],
      [6, '朝阳公园8号 顶级豪宅 临湖观景', 'secondhand', 35000000, 175000, 200, 4, 3, 3, '高楼层', 25, '南北', '豪华装修', '板楼', 1, 'https://demo.krpano.com/krpano.html?xml=demos%2Ftour-skin%2Ftour.xml', '/static/floorplan4.svg', JSON.stringify(['https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800', 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800']), JSON.stringify([{id:1,x:35,y:55,name:'客厅',description:'挑高客厅'},{id:2,x:70,y:40,name:'主卧',description:'豪华主卧套间'}]), '朝阳公园旁顶级豪宅，临湖而居', '顶级豪宅,临湖观景,豪华装修', JSON.stringify(['豪宅','临湖','豪华装修']), 2],
      [7, '天通苑 温馨一居 近地铁 适合单身', 'rent', 3200, 45, 71, 1, 1, 1, '低楼层', 6, '南', '简装修', '板楼', 0, null, '/static/floorplan1.svg', JSON.stringify(['https://images.unsplash.com/photo-1522771930-78848d9293e8?w=800', 'https://images.unsplash.com/photo-1528892952291-009c663ce843?w=800']), '[]', '近地铁5号线，生活便利，性价比高', '近地铁,性价比高,生活便利', JSON.stringify(['合租','近地铁','便宜']), 5],
      [8, '中海枫涟山庄 低密度洋房 花园社区', 'secondhand', 12000000, 100000, 120, 3, 2, 2, '中楼层', 8, '南北', '精装修', '板楼', 0, null, '/static/floorplan3.svg', JSON.stringify(['https://images.unsplash.com/photo-1576941089067-2de3c901e126?w=800', 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800']), '[]', '西北旺低密度洋房，花园社区，学区房', '花园洋房,低密度,学区房', JSON.stringify(['学区房','花园洋房','低密度']), 4],
      [9, '北京壹号院 临湖独栋别墅 传世大宅', 'new', 80000000, 200000, 400, 5, 4, 5, '独栋', 3, '南北', '豪华装修', '独栋别墅', 1, 'https://demo.krpano.com/krpano.html?xml=demos%2Ftour-skin%2Ftour.xml', '/static/floorplan4.svg', JSON.stringify(['https://images.unsplash.com/photo-1613977257363-707ba9348227?w=800', 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800']), JSON.stringify([{id:1,x:50,y:50,name:'挑高客厅',description:'8米挑高客厅'},{id:2,x:25,y:35,name:'家庭厅',description:'家庭聚会厅'}]), '北京顶级豪宅，临湖独栋，传世之作', '独栋别墅,临湖,顶级豪宅', JSON.stringify(['豪宅','独栋别墅','临湖']), 1],
      [10, '回龙观 两居室 南北通透 近地铁', 'rent', 4500, 56, 80, 2, 1, 1, '中楼层', 6, '南北', '简装修', '板楼', 0, null, '/static/floorplan1.svg', JSON.stringify(['https://images.unsplash.com/photo-1554995207-c18c203602cb?w=800', 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800']), '[]', '回龙观成熟社区，近地铁13号线', '南北通透,近地铁,成熟社区', JSON.stringify(['整租','近地铁','南北通透']), 6],
      [11, '望京SOHO 商住两用 可注册公司', 'secondhand', 5500000, 68750, 80, 1, 1, 1, '中楼层', 45, '东南', '精装修', '塔楼', 1, 'https://demo.krpano.com/krpano.html?xml=demos%2Ftour-skin%2Ftour.xml', '/static/floorplan1.svg', JSON.stringify(['https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800', 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800']), JSON.stringify([{id:1,x:45,y:45,name:'办公区',description:'开放式办公区'},{id:2,x:75,y:55,name:'会议室',description:'小型会议室'}]), '望京地标，商住两用，可注册公司', '地标建筑,商住两用,可注册', JSON.stringify(['商住两用','地标建筑','可注册']), 5],
      [12, '华润橡树湾 品质四居 精装交付', 'new', 13200000, 110000, 120, 4, 2, 2, '高楼层', 22, '南北', '精装修', '板楼', 1, 'https://demo.krpano.com/krpano.html?xml=demos%2Ftour-skin%2Ftour.xml', '/static/floorplan4.svg', JSON.stringify(['https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800', 'https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=800']), JSON.stringify([{id:1,x:40,y:55,name:'客厅',description:'南向大面宽客厅'},{id:2,x:30,y:35,name:'儿童房',description:'北向儿童房'}]), '华润品质，精装交付，清河核心', '品质社区,精装交付,品牌开发商', JSON.stringify(['新房','精装修','品牌开发商']), 3],
    ];
    properties.forEach(p => insertProperty.run(...p));

    const insertPriceHistory = db.prepare(`
      INSERT INTO price_history (property_id, price, date, source)
      VALUES (?, ?, ?, ?)
    `);

    for (let pid = 1; pid <= 13; pid++) {
      const basePrice = 5000000 + pid * 500000;
      for (let month = 1; month <= 6; month++) {
        const variation = (Math.random() - 0.5) * 0.1;
        const price = Math.round(basePrice * (1 + month * 0.02 + variation));
        const date = `2025-${String(month).padStart(2, '0')}-01`;
        insertPriceHistory.run(pid, price, date, 'system');
      }
    }

    const insertPOI = db.prepare(`
      INSERT INTO pois (name, type, category, address, lat, lng, properties)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const pois = [
      ['天安门', 'landmark', '景点', '北京市东城区', 39.9042, 116.4074, '{}'],
      ['故宫博物院', 'landmark', '景点', '北京市东城区景山前街4号', 39.9163, 116.3972, '{}'],
      ['北京大学', 'education', '大学', '北京市海淀区颐和园路5号', 39.9929, 116.3104, '{}'],
      ['清华大学', 'education', '大学', '北京市海淀区清华园1号', 40.0000, 116.3264, '{}'],
      ['国贸地铁站', 'metro', '地铁站', '北京市朝阳区', 39.9087, 116.4613, '{"lines":["1号线","10号线"]}'],
      ['中关村地铁站', 'metro', '地铁站', '北京市海淀区', 39.9832, 116.3169, '{"lines":["4号线","10号线"]}'],
      ['望京地铁站', 'metro', '地铁站', '北京市朝阳区', 40.0021, 116.4708, '{"lines":["14号线","15号线"]}'],
      ['西二旗地铁站', 'metro', '地铁站', '北京市海淀区', 40.0512, 116.3057, '{"lines":["13号线","昌平线"]}'],
      ['亦庄地铁站', 'metro', '地铁站', '北京市大兴区', 39.7896, 116.5123, '{"lines":["亦庄线"]}'],
      ['朝阳公园', 'park', '公园', '北京市朝阳区朝阳公园南路1号', 39.9356, 116.4738, '{}'],
      ['奥林匹克公园', 'park', '公园', '北京市朝阳区北辰东路15号', 40.0028, 116.3819, '{}'],
      ['301医院', 'hospital', '医院', '北京市海淀区复兴路28号', 39.9088, 116.2863, '{}'],
      ['协和医院', 'hospital', '医院', '北京市东城区帅府园1号', 39.9139, 116.4111, '{}'],
      ['SKP商场', 'shopping', '商场', '北京市朝阳区建国路87号', 39.9075, 116.4589, '{}'],
      ['国贸商城', 'shopping', '商场', '北京市朝阳区建国门外大街1号', 39.9087, 116.4613, '{}'],
    ];
    pois.forEach(p => insertPOI.run(...p));

    const insertMetro = db.prepare(`
      INSERT INTO metro_lines (line_name, line_number, color, stations)
      VALUES (?, ?, ?, ?)
    `);

    const metros = [
      ['1号线', 'M1', '#c23a30', JSON.stringify(['苹果园','古城','八角游乐园','八宝山','玉泉路','五棵松','万寿路','公主坟','军事博物馆','木樨地','南礼士路','复兴门','西单','天安门西','天安门东','王府井','东单','建国门','永安里','国贸','大望路','四惠','四惠东'])],
      ['2号线', 'M2', '#004986', JSON.stringify(['西直门','车公庄','阜成门','复兴门','长椿街','宣武门','和平门','前门','崇文门','北京站','建国门','朝阳门','东四十条','东直门','雍和宫','安定门','鼓楼大街','积水潭','西直门'])],
      ['4号线', 'M4', '#00849c', JSON.stringify(['安河桥北','北宫门','西苑','圆明园','北京大学东门','中关村','海淀黄庄','人民大学','魏公村','国家图书馆','动物园','西直门','新街口','平安里','西四','灵境胡同','西单','宣武门','菜市口','陶然亭','北京南站','马家堡','角门西','公益西桥'])],
      ['10号线', 'M10', '#0097d0', JSON.stringify(['巴沟','苏州街','海淀黄庄','知春里','知春路','西土城','牡丹园','健德门','北土城','安贞门','惠新西街南口','芍药居','太阳宫','三元桥','亮马桥','农业展览馆','团结湖','呼家楼','金台夕照','国贸','双井','劲松','潘家园','十里河','分钟寺','成寿寺','宋家庄','石榴庄','大红门','角门东','角门西','草桥','纪家庙','首经贸','丰台站','泥洼','西局','六里桥','莲花桥','公主坟','西钓鱼台','慈寿寺','车道沟','长春桥','火器营','巴沟'])],
      ['13号线', 'M13', '#f3d03e', JSON.stringify(['西直门','大钟寺','知春路','五道口','上地','西二旗','龙泽','回龙观','霍营','立水桥','北苑','望京西','光熙门','柳芳','东直门'])],
      ['14号线', 'M14', '#ffb82c', JSON.stringify(['张郭庄','园博园','大瓦窑','郭庄子','大井','七里庄','西局','东管头','丽泽商务区','菜户营','西铁营','景风门','北京南站','陶然桥','永定门外','景泰','蒲黄榆','方庄','十里河','北工大西门','平乐园','九龙山','大望路','红庙','金台路','朝阳公园','枣营','东风北桥','将台','高家园','望京南','阜通','望京','东湖渠','来广营','善各庄'])],
    ];
    metros.forEach(m => insertMetro.run(...m));

    const insertSchool = db.prepare(`
      INSERT INTO school_districts (name, type, level, boundary, lat, lng)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const schools = [
      ['中关村一小', 'primary', 'top', JSON.stringify([[39.98,116.30],[40.00,116.30],[40.00,116.33],[39.98,116.33]]), 39.9850, 116.3150],
      ['中关村二小', 'primary', 'top', JSON.stringify([[40.02,116.27],[40.05,116.27],[40.05,116.30],[40.02,116.30]]), 40.0350, 116.2850],
      ['朝阳区实验小学', 'primary', 'key', JSON.stringify([[39.90,116.44],[39.92,116.44],[39.92,116.47],[39.90,116.47]]), 39.9100, 116.4550],
      ['海淀实验小学', 'primary', 'key', JSON.stringify([[39.95,116.28],[39.97,116.28],[39.97,116.31],[39.95,116.31]]), 39.9600, 116.2950],
      ['北京四中', 'middle', 'top', JSON.stringify([[39.95,116.35],[39.97,116.35],[39.97,116.38],[39.95,116.38]]), 39.9600, 116.3650],
      ['人大附中', 'middle', 'top', JSON.stringify([[39.96,116.30],[39.99,116.30],[39.99,116.33],[39.96,116.33]]), 39.9750, 116.3150],
    ];
    schools.forEach(s => insertSchool.run(...s));

    const insertUser = db.prepare(`
      INSERT INTO users (phone, name, avatar, role)
      VALUES (?, ?, ?, ?)
    `);

    const users = [
      ['13900139001', '张先生', 'https://api.dicebear.com/7.x/avataaars/svg?seed=user1', 'user'],
      ['13900139002', '李女士', 'https://api.dicebear.com/7.x/avataaars/svg?seed=user2', 'user'],
      ['13900139003', '王先生', 'https://api.dicebear.com/7.x/avataaars/svg?seed=user3', 'user'],
      ['13900139004', '刘女士', 'https://api.dicebear.com/7.x/avataaars/svg?seed=user4', 'user'],
    ];
    users.forEach(u => insertUser.run(...u));

    const insertCourse = db.prepare(`
      INSERT INTO training_courses (title, description, duration, category, level, content)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const courses = [
      ['房地产基础知识', '房产交易流程、税费计算等基础知识', 120, '基础', 'beginner', '房产类型介绍\\n交易流程详解\\n税费计算方法\\n政策法规解读'],
      ['客户沟通技巧', '如何与客户有效沟通，了解需求', 90, '销售', 'intermediate', '需求分析技巧\\n倾听的艺术\\n异议处理\\n谈判策略'],
      ['VR看房操作指南', 'VR带看系统操作与热点标注', 60, '工具', 'beginner', 'VR系统介绍\\n热点标注方法\\n带看话术\\n常见问题处理'],
      ['合同法务知识', '房产合同签订注意事项与风险防范', 150, '法务', 'advanced', '合同条款解读\\n风险识别\\n纠纷处理\\n法律责任'],
      ['AI房源推荐系统', '如何利用AI工具提高客户匹配效率', 45, '工具', 'intermediate', 'AI系统介绍\\n数据录入规范\\n推荐结果应用\\n效果追踪'],
    ];
    courses.forEach(c => insertCourse.run(...c));

    const insertTraining = db.prepare(`
      INSERT INTO broker_training (broker_id, course_id, progress, completed, start_date, score)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const trainings = [
      [1, 1, 100, 1, '2025-01-01', 95.5],
      [1, 2, 75, 0, '2025-02-01', null],
      [2, 1, 100, 1, '2025-01-05', 88.0],
      [2, 3, 100, 1, '2025-01-15', 92.0],
      [3, 1, 80, 0, '2025-02-10', null],
      [3, 4, 50, 0, '2025-02-20', null],
      [4, 1, 100, 1, '2025-01-01', 98.0],
      [4, 2, 100, 1, '2025-01-20', 91.5],
      [4, 5, 60, 0, '2025-03-01', null],
    ];
    trainings.forEach(t => insertTraining.run(...t));

    const insertFollow = db.prepare(`
      INSERT INTO customer_follows (broker_id, user_id, follow_date, content, next_follow_date)
      VALUES (?, ?, ?, ?, ?)
    `);

    const follows = [
      [1, 1, '2025-06-01', '客户考虑国贸三居，预算800万，需约看', '2025-06-08'],
      [1, 2, '2025-06-02', '客户想买学区房，关注中关村一带', '2025-06-09'],
      [2, 3, '2025-06-03', '客户想租望京两居，月租8000以内', '2025-06-10'],
      [3, 4, '2025-06-04', '客户咨询亦庄新房，考虑科技住宅', '2025-06-11'],
    ];
    follows.forEach(f => insertFollow.run(...f));

    const insertCommission = db.prepare(`
      INSERT INTO commissions (broker_id, property_id, deal_amount, commission_rate, commission_amount, deal_date, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const commissions = [
      [1, 1, 8500000, 0.025, 212500, '2025-05-15', 'paid'],
      [1, 6, 8500000, 0.025, 212500, '2025-05-20', 'settled'],
      [2, 2, 9800000, 0.025, 245000, '2025-05-25', 'pending'],
      [3, 3, 9800000, 0.025, 245000, '2025-04-10', 'paid'],
      [4, 4, 15000000, 0.025, 375000, '2025-04-20', 'paid'],
    ];
    commissions.forEach(c => insertCommission.run(...c));

    const insertBrowsing = db.prepare(`
      INSERT INTO user_browsing (user_id, session_id, property_id, view_duration, action)
      VALUES (?, ?, ?, ?, ?)
    `);

    const browsings = [];
    for (let i = 0; i < 50; i++) {
      browsings.push([
        Math.random() > 0.3 ? Math.floor(Math.random() * 4) + 1 : null,
        `session_${Math.floor(Math.random() * 10)}`,
        Math.floor(Math.random() * 13) + 1,
        Math.floor(Math.random() * 300) + 10,
        Math.random() > 0.8 ? 'favorite' : 'view'
      ]);
    }
    browsings.forEach(b => insertBrowsing.run(...b));

    const insertFakeLog = db.prepare(`
      INSERT INTO fake_detection_logs (property_id, image_similarity_score, price_deviation_score, total_score, is_fake)
      VALUES (?, ?, ?, ?, ?)
    `);

    for (let pid = 1; pid <= 13; pid++) {
      const imageScore = Math.random() * 0.3 + 0.7;
      const priceScore = Math.random() * 0.4 + 0.6;
      const totalScore = (imageScore + priceScore) / 2;
      insertFakeLog.run(pid, imageScore, priceScore, totalScore, totalScore < 0.6 ? 1 : 0);
    }

    console.log('Database seeded successfully');
  });

  try {
    tx();
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  }
}
