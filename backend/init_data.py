import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import app, db
from models import Activity, Organizer, Review
from datetime import date, timedelta
import json

with app.app_context():
    db.drop_all()
    db.create_all()

    organizer1 = Organizer(
        name='城市探索工作室',
        avatar='https://via.placeholder.com/80x80',
        description='专注于城市文化探索与体验活动策划'
    )

    organizer2 = Organizer(
        name='美食工坊',
        avatar='https://via.placeholder.com/80x80',
        description='专业美食制作教学机构'
    )

    organizer3 = Organizer(
        name='艺术空间',
        avatar='https://via.placeholder.com/80x80',
        description='致力于艺术推广与体验活动'
    )

    db.session.add(organizer1)
    db.session.add(organizer2)
    db.session.add(organizer3)
    db.session.commit()

    activities = [
        {
            'name': '北京胡同深度探索之旅',
            'type': 'local',
            'sub_type': 'guide_tour',
            'city': '北京',
            'location': '南锣鼓巷',
            'images': json.dumps([
                'https://picsum.photos/seed/beijing/800/500',
                'https://picsum.photos/seed/hutong/800/500'
            ]),
            'tags': json.dumps(['文化探索', '历史古迹', '徒步']),
            'duration': '3小时',
            'max_participants': 15,
            'current_participants': 8,
            'language': '中文',
            'description': '跟随资深向导，深入北京老胡同，了解胡同文化历史，探访名人故居，品尝地道北京小吃。',
            'provided_items': json.dumps(['专业向导', '讲解器', '小吃品尝']),
            'required_items': json.dumps(['舒适步行鞋', '饮用水']),
            'booking_notes': '请提前30分钟到达集合地点，携带有效身份证件。',
            'organizer_id': 1,
            'price': 188,
            'start_date': date.today(),
            'end_date': date.today() + timedelta(days=90),
            'is_free': False,
            'rating': 4.8,
            'review_count': 126,
            'popularity': 500,
            'latitude': 39.9947,
            'longitude': 116.4074
        },
        {
            'name': '上海小笼包制作体验',
            'type': 'local',
            'sub_type': 'food',
            'city': '上海',
            'location': '豫园',
            'images': json.dumps([
                'https://picsum.photos/seed/xiaolongbao/800/500',
                'https://picsum.photos/seed/food/800/500'
            ]),
            'tags': json.dumps(['美食', '手工制作', '亲子']),
            'duration': '2小时',
            'max_participants': 10,
            'current_participants': 6,
            'language': '中文',
            'description': '跟着上海老字号点心师傅，学习正宗小笼包的制作技艺，亲手包制并品尝自己的作品。',
            'provided_items': json.dumps(['食材', '工具', '围裙']),
            'required_items': json.dumps(['干净衣物']),
            'booking_notes': '建议穿着舒适衣物，活动后可带走自己制作的小笼包。',
            'organizer_id': 2,
            'price': 268,
            'start_date': date.today(),
            'end_date': date.today() + timedelta(days=60),
            'is_free': False,
            'rating': 4.9,
            'review_count': 89,
            'popularity': 380,
            'latitude': 31.2304,
            'longitude': 121.4737
        },
        {
            'name': '成都川剧变脸体验',
            'type': 'local',
            'sub_type': 'traditional',
            'city': '成都',
            'location': '宽窄巷子',
            'images': json.dumps([
                'https://picsum.photos/seed/sichuan/800/500',
                'https://picsum.photos/seed/opera/800/500'
            ]),
            'tags': json.dumps(['传统文化', '表演艺术', '体验']),
            'duration': '2.5小时',
            'max_participants': 20,
            'current_participants': 12,
            'language': '中文',
            'description': '专业川剧演员指导，学习川剧基本动作和变脸技巧，感受传统戏曲魅力。',
            'provided_items': json.dumps(['戏服', '脸谱', '指导']),
            'required_items': json.dumps(['无']),
            'booking_notes': '活动包含化妆环节，请提前到达。',
            'organizer_id': 3,
            'price': 328,
            'start_date': date.today(),
            'end_date': date.today() + timedelta(days=45),
            'is_free': False,
            'rating': 4.7,
            'review_count': 67,
            'popularity': 420,
            'latitude': 30.5728,
            'longitude': 104.0668
        },
        {
            'name': '西湖摄影跟拍',
            'type': 'local',
            'sub_type': 'photography',
            'city': '杭州',
            'location': '西湖景区',
            'images': json.dumps([
                'https://picsum.photos/seed/westlake/800/500',
                'https://picsum.photos/seed/photography/800/500'
            ]),
            'tags': json.dumps(['摄影', '风景', '专业']),
            'duration': '4小时',
            'max_participants': 8,
            'current_participants': 4,
            'language': '中文',
            'description': '专业摄影师一对一指导，带你探访西湖最佳拍摄点，提升摄影技巧，留下美好回忆。',
            'provided_items': json.dumps(['摄影指导', '后期修图', '电子照片']),
            'required_items': json.dumps(['相机或手机']),
            'booking_notes': '请提前告知使用的摄影设备类型。',
            'organizer_id': 1,
            'price': 398,
            'start_date': date.today(),
            'end_date': date.today() + timedelta(days=60),
            'is_free': False,
            'rating': 4.9,
            'review_count': 54,
            'popularity': 290,
            'latitude': 30.2741,
            'longitude': 120.1552
        },
        {
            'name': '故宫汉服体验',
            'type': 'local',
            'sub_type': 'costume',
            'city': '北京',
            'location': '故宫博物院',
            'images': json.dumps([
                'https://picsum.photos/seed/forbidden/800/500',
                'https://picsum.photos/seed/hanfu/800/500'
            ]),
            'tags': json.dumps(['汉服', '古风', '摄影']),
            'duration': '3小时',
            'max_participants': 6,
            'current_participants': 3,
            'language': '中文',
            'description': '精选汉服体验，专业化妆师打造古风造型，在故宫内拍摄精美古风大片。',
            'provided_items': json.dumps(['汉服', '妆容', '摄影']),
            'required_items': json.dumps(['身份证（故宫门票需实名）']),
            'booking_notes': '需提前预约故宫门票，请提供身份证信息。',
            'organizer_id': 3,
            'price': 588,
            'start_date': date.today(),
            'end_date': date.today() + timedelta(days=30),
            'is_free': False,
            'rating': 4.8,
            'review_count': 42,
            'popularity': 350,
            'latitude': 39.9163,
            'longitude': 116.3972
        },
        {
            'name': '苏州园林手绘工作坊',
            'type': 'art',
            'sub_type': None,
            'city': '苏州',
            'location': '拙政园',
            'images': json.dumps([
                'https://picsum.photos/seed/suzhou/800/500',
                'https://picsum.photos/seed/painting/800/500'
            ]),
            'tags': json.dumps(['艺术', '绘画', '园林']),
            'duration': '3小时',
            'max_participants': 12,
            'current_participants': 7,
            'language': '中文',
            'description': '在拙政园内，跟随专业画家学习中国传统绘画技法，描绘园林美景。',
            'provided_items': json.dumps(['画具', '宣纸', '指导']),
            'required_items': json.dumps(['耐心和热情']),
            'booking_notes': '作品可带走留念。',
            'organizer_id': 3,
            'price': 298,
            'start_date': date.today(),
            'end_date': date.today() + timedelta(days=60),
            'is_free': False,
            'rating': 4.7,
            'review_count': 38,
            'popularity': 260,
            'latitude': 31.3251,
            'longitude': 120.6215
        },
        {
            'name': '广州早茶文化之旅',
            'type': 'local',
            'sub_type': 'food',
            'city': '广州',
            'location': '上下九步行街',
            'images': json.dumps([
                'https://picsum.photos/seed/guangzhou/800/500',
                'https://picsum.photos/seed/dimSum/800/500'
            ]),
            'tags': json.dumps(['美食', '文化', '体验']),
            'duration': '4小时',
            'max_participants': 10,
            'current_participants': 5,
            'language': '中文',
            'description': '探访广州老字号茶楼，品尝正宗粤式点心，了解广州早茶文化历史。',
            'provided_items': json.dumps(['早茶套餐', '讲解', '交通']),
            'required_items': json.dumps(['空腹前往']),
            'booking_notes': '建议早上8点到达集合点。',
            'organizer_id': 2,
            'price': 168,
            'start_date': date.today(),
            'end_date': date.today() + timedelta(days=90),
            'is_free': False,
            'rating': 4.8,
            'review_count': 76,
            'popularity': 380,
            'latitude': 23.1291,
            'longitude': 113.2644
        },
        {
            'name': '公益环保徒步',
            'type': 'hot',
            'sub_type': None,
            'city': '深圳',
            'location': '深圳湾公园',
            'images': json.dumps([
                'https://picsum.photos/seed/shenzhen/800/500',
                'https://picsum.photos/seed/environment/800/500'
            ]),
            'tags': json.dumps(['公益', '环保', '运动']),
            'duration': '2小时',
            'max_participants': 50,
            'current_participants': 35,
            'language': '中文',
            'description': '参与深圳湾海岸线清洁活动，为保护环境贡献一份力量，认识志同道合的朋友。',
            'provided_items': json.dumps(['手套', '垃圾袋', '饮用水']),
            'required_items': json.dumps(['运动鞋', '防晒用品']),
            'booking_notes': '活动完全免费，欢迎踊跃参与。',
            'organizer_id': 1,
            'price': 0,
            'start_date': date.today(),
            'end_date': date.today() + timedelta(days=7),
            'is_free': True,
            'rating': 4.9,
            'review_count': 156,
            'popularity': 890,
            'latitude': 22.4815,
            'longitude': 113.9068
        },
        {
            'name': '书法入门体验课',
            'type': 'skill',
            'sub_type': None,
            'city': '西安',
            'location': '碑林博物馆',
            'images': json.dumps([
                'https://picsum.photos/seed/calligraphy/800/500',
                'https://picsum.photos/seed/xian/800/500'
            ]),
            'tags': json.dumps(['书法', '传统文化', '技能']),
            'duration': '2小时',
            'max_participants': 15,
            'current_participants': 9,
            'language': '中文',
            'description': '在碑林博物馆内，跟随书法老师学习毛笔字基础，感受汉字之美。',
            'provided_items': json.dumps(['文房四宝', '字帖', '指导']),
            'required_items': json.dumps(['无']),
            'booking_notes': '作品可带走留念。',
            'organizer_id': 3,
            'price': 158,
            'start_date': date.today(),
            'end_date': date.today() + timedelta(days=45),
            'is_free': False,
            'rating': 4.6,
            'review_count': 45,
            'popularity': 220,
            'latitude': 34.2292,
            'longitude': 108.9463
        },
        {
            'name': '张家界自然风光摄影',
            'type': 'local',
            'sub_type': 'nature',
            'city': '张家界',
            'location': '武陵源景区',
            'images': json.dumps([
                'https://picsum.photos/seed/zhangjiajie/800/500',
                'https://picsum.photos/seed/nature/800/500'
            ]),
            'tags': json.dumps(['自然风光', '摄影', '户外']),
            'duration': '6小时',
            'max_participants': 10,
            'current_participants': 6,
            'language': '中文',
            'description': '深入张家界核心景区，在最佳时间和地点拍摄绝世美景。',
            'provided_items': json.dumps(['摄影指导', '景区门票', '午餐']),
            'required_items': json.dumps(['相机', '舒适徒步鞋', '雨具']),
            'booking_notes': '请穿着舒适户外装备，注意防晒防雨。',
            'organizer_id': 1,
            'price': 458,
            'start_date': date.today(),
            'end_date': date.today() + timedelta(days=60),
            'is_free': False,
            'rating': 4.9,
            'review_count': 32,
            'popularity': 280,
            'latitude': 29.1167,
            'longitude': 110.4722
        }
    ]

    for act in activities:
        activity = Activity(**act)
        db.session.add(activity)
    
    db.session.commit()

    reviews = [
        {'activity_id': 1, 'user_id': 1, 'user_name': '游客小明', 'rating': 5.0, 'content': '非常棒的体验！向导知识渊博，讲解生动有趣，胡同里的小吃也很地道。'},
        {'activity_id': 1, 'user_id': 2, 'user_name': '旅行达人', 'rating': 4.5, 'content': '行程安排合理，了解了很多北京胡同的历史故事，推荐！'},
        {'activity_id': 2, 'user_id': 3, 'user_name': '美食爱好者', 'rating': 5.0, 'content': '小笼包制作比想象中难，但是成就感满满，师傅很耐心！'},
        {'activity_id': 3, 'user_id': 4, 'user_name': '传统文化迷', 'rating': 5.0, 'content': '川剧变脸太神奇了，自己尝试后才知道有多难，很有意义的体验！'},
        {'activity_id': 4, 'user_id': 5, 'user_name': '摄影新手', 'rating': 4.5, 'content': '学到了很多摄影技巧，西湖的美景配上专业指导，照片效果很棒！'}
    ]

    for rev in reviews:
        review = Review(**rev)
        db.session.add(review)
    
    db.session.commit()

    print('初始化数据完成！')