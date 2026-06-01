from app.database import engine, Base, SessionLocal
from app.models import City, Movie, Cinema, Schedule, User
from datetime import date, time

def simple_hash(password):
    return "hash_" + password + "_fixed"

def init_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    
    try:
        if db.query(City).count() == 0:
            cities = [
                City(name="北京", province="北京", latitude=39.9042, longitude=116.4074, is_hot=True, sort_order=1),
                City(name="上海", province="上海", latitude=31.2304, longitude=121.4737, is_hot=True, sort_order=2),
                City(name="广州", province="广东", latitude=23.1291, longitude=113.2644, is_hot=True, sort_order=3),
                City(name="深圳", province="广东", latitude=22.5431, longitude=114.0579, is_hot=True, sort_order=4),
                City(name="杭州", province="浙江", latitude=30.2741, longitude=120.1551, is_hot=True, sort_order=5),
                City(name="成都", province="四川", latitude=30.5728, longitude=104.0668, is_hot=True, sort_order=6),
                City(name="南京", province="江苏", latitude=32.0603, longitude=118.7969, is_hot=False, sort_order=7),
                City(name="武汉", province="湖北", latitude=30.5928, longitude=114.3055, is_hot=False, sort_order=8),
            ]
            db.add_all(cities)
            db.commit()
        
        if db.query(Movie).count() == 0:
            movies = [
                Movie(
                    title="流浪地球3",
                    original_title="The Wandering Earth 3",
                    poster="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=sci-fi%20movie%20poster%20earth%20space%20future&image_size=square",
                    backdrop="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cinematic%20space%20scene%20earth%20universe&image_size=landscape_16_9",
                    rating=9.5,
                    rating_count=125000,
                    genres="科幻/冒险",
                    duration=173,
                    release_date=date(2025, 1, 22),
                    country="中国",
                    language="普通话",
                    director="郭帆",
                    cast="吴京/刘德华/李雪健/沙溢",
                    synopsis="太阳即将毁灭，人类在地球表面建造出巨大的推进器，寻找新的家园。然而宇宙之路危机四伏，为了拯救地球，流浪地球时代的年轻人再次挺身而出，展开争分夺秒的生死之战。",
                    status="showing",
                    is_hot=True
                ),
                Movie(
                    title="封神第三部",
                    original_title="Creation of the Gods Ⅲ",
                    poster="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=chinese%20mythology%20movie%20poster%20ancient%20gods&image_size=square",
                    rating=9.2,
                    rating_count=98000,
                    genres="古装/神话/动作",
                    duration=148,
                    release_date=date(2025, 1, 15),
                    country="中国",
                    language="普通话",
                    director="乌尔善",
                    cast="费翔/黄渤/于适/娜然",
                    synopsis="封神之战进入最终决战，姜子牙带领众人对抗殷商王朝，揭开封神榜的真正秘密，决定人神两界命运的终极之战即将打响。",
                    status="showing",
                    is_hot=True
                ),
                Movie(
                    title="速度与激情11",
                    original_title="Fast & Furious 11",
                    poster="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=fast%20cars%20action%20movie%20poster%20racing&image_size=square",
                    rating=8.7,
                    rating_count=76000,
                    genres="动作/犯罪",
                    duration=141,
                    release_date=date(2025, 2, 1),
                    country="美国",
                    language="英语",
                    director="路易斯·莱特里尔",
                    cast="范·迪塞尔/杰森·斯坦森/米歇尔·罗德里格兹",
                    synopsis="多姆和他的家人必须面对一位最危险的敌人，这个对手从过去的阴影中浮现，他发誓要为血债血偿，决心摧毁多姆所爱的一切。",
                    status="coming",
                    is_hot=True
                ),
                Movie(
                    title="哪吒之魔童闹海",
                    original_title="Ne Zha 2",
                    poster="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=chinese%20animation%20movie%20poster%20nezhu%20mythology&image_size=square",
                    rating=0.0,
                    rating_count=0,
                    genres="动画/奇幻",
                    duration=110,
                    release_date=date(2025, 5, 1),
                    country="中国",
                    language="普通话",
                    director="饺子",
                    cast="吕艳婷/囧森瑟夫",
                    synopsis="天劫之后，哪吒、敖丙虽然保住了灵魂，但肉身已毁。太乙真人用七色宝莲给二人重塑肉身，但在重塑过程中却遇到了重重困难。",
                    status="coming",
                    is_hot=False
                ),
                Movie(
                    title="复仇者联盟5",
                    original_title="Avengers: The Kang Dynasty",
                    poster="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=superhero%20team%20movie%20poster%20marvel%20avengers&image_size=square",
                    rating=0.0,
                    rating_count=0,
                    genres="动作/科幻/冒险",
                    duration=180,
                    release_date=date(2025, 5, 15),
                    country="美国",
                    language="英语",
                    director="德斯汀·克里顿",
                    cast="待定",
                    synopsis="复仇者联盟将面对他们迄今为止最强大的敌人——征服者康，一位来自未来的时间旅行者，他的野心威胁着整个多元宇宙的安全。",
                    status="coming",
                    is_hot=False
                ),
            ]
            db.add_all(movies)
            db.commit()
        
        if db.query(Cinema).count() == 0:
            cinemas = [
                Cinema(
                    name="万达影城(CBD店)",
                    address="北京市朝阳区建国路88号SOHO现代城",
                    city_id=1,
                    city_name="北京",
                    phone="010-88888888",
                    business_hours="10:00-24:00",
                    latitude=39.9087,
                    longitude=116.4605,
                    facilities="IMAX厅/杜比厅/4D厅/VIP厅",
                    description="万达影城CBD店是北京最豪华的影城之一，拥有IMAX、杜比全景声等高端放映设备。"
                ),
                Cinema(
                    name="百老汇影城(东方广场店)",
                    address="北京市东城区东长安街1号东方广场地下一层",
                    city_id=1,
                    city_name="北京",
                    phone="010-66666666",
                    business_hours="09:30-23:30",
                    latitude=39.9139,
                    longitude=116.4074,
                    facilities="激光厅/巨幕厅",
                    description="位于东方广场的核心地段，交通便利，是观影的理想选择。"
                ),
                Cinema(
                    name="金逸影城(大悦城店)",
                    address="上海市静安区南京西路1688号大悦城",
                    city_id=2,
                    city_name="上海",
                    phone="021-55555555",
                    business_hours="10:00-24:00",
                    latitude=31.2345,
                    longitude=121.4567,
                    facilities="IMAX厅/4D厅",
                    description="上海知名影城，拥有先进的放映设备和舒适的观影环境。"
                ),
                Cinema(
                    name="中影国际影城(天河城店)",
                    address="广州市天河区天河路208号天河城",
                    city_id=3,
                    city_name="广州",
                    phone="020-77777777",
                    business_hours="10:00-23:00",
                    latitude=23.1345,
                    longitude=113.3256,
                    facilities="杜比厅/巨幕厅",
                    description="广州天河核心商圈的顶级影城，观影购物两不误。"
                ),
            ]
            db.add_all(cinemas)
            db.commit()
        
        if db.query(Schedule).count() == 0:
            today = date.today()
            schedules = [
                Schedule(movie_id=1, cinema_id=1, show_date=today, start_time=time(10, 0), end_time=time(12, 53), hall_name="IMAX厅", language="普通话", version="2D", price=89.0, available_seats=120),
                Schedule(movie_id=1, cinema_id=1, show_date=today, start_time=time(14, 30), end_time=time(17, 23), hall_name="杜比厅", language="普通话", version="2D", price=79.0, available_seats=100),
                Schedule(movie_id=1, cinema_id=1, show_date=today, start_time=time(19, 0), end_time=time(21, 53), hall_name="IMAX厅", language="普通话", version="2D", price=99.0, available_seats=80),
                Schedule(movie_id=1, cinema_id=2, show_date=today, start_time=time(11, 0), end_time=time(13, 53), hall_name="激光厅", language="普通话", version="2D", price=69.0, available_seats=150),
                Schedule(movie_id=2, cinema_id=1, show_date=today, start_time=time(13, 0), end_time=time(15, 28), hall_name="4D厅", language="普通话", version="3D", price=109.0, available_seats=60),
                Schedule(movie_id=2, cinema_id=2, show_date=today, start_time=time(16, 0), end_time=time(18, 28), hall_name="巨幕厅", language="普通话", version="3D", price=99.0, available_seats=90),
                Schedule(movie_id=1, cinema_id=3, show_date=today, start_time=time(10, 30), end_time=time(13, 23), hall_name="IMAX厅", language="普通话", version="2D", price=85.0, available_seats=110),
                Schedule(movie_id=1, cinema_id=4, show_date=today, start_time=time(14, 0), end_time=time(16, 53), hall_name="杜比厅", language="普通话", version="2D", price=75.0, available_seats=95),
            ]
            db.add_all(schedules)
            db.commit()
        
        if db.query(User).count() == 0:
            user = User(
                username="demo",
                password_hash=simple_hash("demo123"),
                phone="13800138000",
                nickname="演示用户",
                city_id=1,
                city_name="北京"
            )
            db.add(user)
            db.commit()
        
        print("数据库初始化完成！")
        print("演示账号: demo / demo123")
        
    finally:
        db.close()

if __name__ == "__main__":
    init_db()
