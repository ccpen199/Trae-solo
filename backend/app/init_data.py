from sqlalchemy.orm import Session
from app.database import SessionLocal, engine, Base
from app import models, crud, schemas
from app.models import UserRole, ContentStatus
from datetime import datetime


def init_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        admin = crud.get_user_by_username(db, "admin")
        if not admin:
            admin_data = schemas.UserCreate(
                username="admin",
                email="admin@campus.edu",
                full_name="Administrator",
                password="admin123",
                role=UserRole.ADMIN
            )
            crud.create_user(db, admin_data)
            print("Admin user created")

        editor = crud.get_user_by_username(db, "editor")
        if not editor:
            editor_data = schemas.UserCreate(
                username="editor",
                email="editor@campus.edu",
                full_name="News Editor",
                password="editor123",
                role=UserRole.EDITOR
            )
            crud.create_user(db, editor_data)
            print("Editor user created")

        campus_user = crud.get_user_by_username(db, "student01")
        if not campus_user:
            student_data = schemas.UserCreate(
                username="student01",
                email="student01@campus.edu",
                full_name="Campus Student",
                password="student123",
                role=UserRole.CAMPUS,
                campus_id="STU2024001"
            )
            crud.create_user(db, student_data)
            print("Campus user created")

        social_user = crud.get_user_by_username(db, "user01")
        if not social_user:
            social_data = schemas.UserCreate(
                username="user01",
                email="user01@example.com",
                full_name="Social User",
                password="user123",
                role=UserRole.SOCIAL
            )
            crud.create_user(db, social_data)
            print("Social user created")

        categories = [
            {"name": "校园要闻", "slug": "campus-news", "description": "校园重要新闻动态", "order": 1},
            {"name": "学术科研", "slug": "academic", "description": "学术研究与科研成果", "order": 2},
            {"name": "校园活动", "slug": "events", "description": "校园活动预告与回顾", "order": 3},
            {"name": "招生就业", "slug": "admission", "description": "招生信息与就业指导", "order": 4},
            {"name": "校园文化", "slug": "culture", "description": "校园文化建设", "order": 5},
        ]

        for cat_data in categories:
            existing = crud.get_category_by_slug(db, cat_data["slug"])
            if not existing:
                crud.create_category(db, schemas.CategoryCreate(**cat_data))
                print(f"Category '{cat_data['name']}' created")

        cat1 = crud.get_category_by_slug(db, "campus-news")
        if cat1:
            admin_user = crud.get_user_by_username(db, "admin")
            news_items = [
                {
                    "title": "我校2024年春季学期开学典礼隆重举行",
                    "slug": "2024-spring-opening-ceremony",
                    "summary": "3月1日上午，我校2024年春季学期开学典礼在主校区体育场隆重举行，全体师生参加了本次盛会。",
                    "content": "3月1日上午，我校2024年春季学期开学典礼在主校区体育场隆重举行。校长在致辞中回顾了过去一年学校取得的各项成就，对新学期提出了新的期望和要求。全体师生精神饱满，共同迎接新学期的到来。各学院院长、教师代表和学生代表分别发言，表示将以更加饱满的热情投入到工作和学习中。",
                    "category_id": cat1.id
                },
                {
                    "title": "图书馆推出全新数字资源平台",
                    "slug": "library-new-digital-platform",
                    "summary": "为更好地服务师生教学科研，图书馆近期上线了全新的数字资源平台，提供海量学术资源。",
                    "content": "为更好地服务师生教学科研，图书馆近期上线了全新的数字资源平台。该平台整合了国内外主流数据库，提供超过100万种电子图书、5000种学术期刊以及各类音视频资源。师生可通过校园网或VPN随时随地访问，支持在线阅读和下载。平台还提供智能检索、个性化推荐等功能，大大提升了资源获取效率。",
                    "category_id": cat1.id
                }
            ]

            for news_data in news_items:
                existing = crud.get_news_by_slug(db, news_data["slug"])
                if not existing and admin_user:
                    crud.create_news(db, schemas.NewsCreate(**news_data), admin_user.id)
                    print(f"News '{news_data['title']}' created")

    finally:
        db.close()


if __name__ == "__main__":
    init_db()
    print("Database initialization completed!")
