from sqlalchemy.orm import Session
from sqlalchemy import or_
from app import models, schemas
from app.auth import get_password_hash
from datetime import datetime


def get_user(db: Session, user_id: int):
    return db.query(models.User).filter(models.User.id == user_id).first()


def get_user_by_username(db: Session, username: str):
    return db.query(models.User).filter(models.User.username == username).first()


def create_user(db: Session, user: schemas.UserCreate):
    hashed_password = get_password_hash(user.password)
    db_user = models.User(
        username=user.username,
        email=user.email,
        full_name=user.full_name,
        hashed_password=hashed_password,
        role=user.role,
        campus_id=user.campus_id
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


def update_user(db: Session, user_id: int, user_update: schemas.UserUpdate):
    db_user = get_user(db, user_id)
    if db_user:
        for key, value in user_update.dict(exclude_unset=True).items():
            setattr(db_user, key, value)
        db.commit()
        db.refresh(db_user)
    return db_user


def get_categories(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Category).filter(models.Category.is_active == True).order_by(models.Category.order).offset(skip).limit(limit).all()


def get_category_by_slug(db: Session, slug: str):
    return db.query(models.Category).filter(models.Category.slug == slug).first()


def create_category(db: Session, category: schemas.CategoryCreate):
    db_category = models.Category(**category.dict())
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    return db_category


def get_news(db: Session, skip: int = 0, limit: int = 10, category_id: int = None):
    query = db.query(models.News).filter(models.News.status == models.ContentStatus.PUBLISHED)
    if category_id:
        query = query.filter(models.News.category_id == category_id)
    return query.order_by(models.News.published_at.desc()).offset(skip).limit(limit).all()


def get_news_count(db: Session, category_id: int = None):
    query = db.query(models.News).filter(models.News.status == models.ContentStatus.PUBLISHED)
    if category_id:
        query = query.filter(models.News.category_id == category_id)
    return query.count()


def get_news_by_slug(db: Session, slug: str):
    return db.query(models.News).filter(models.News.slug == slug).first()


def create_news(db: Session, news: schemas.NewsCreate, author_id: int):
    db_news = models.News(
        **news.dict(),
        author_id=author_id,
        published_at=datetime.utcnow(),
        status=models.ContentStatus.PUBLISHED
    )
    db.add(db_news)
    db.commit()
    db.refresh(db_news)
    return db_news


def increment_views(db: Session, news_id: int):
    db_news = db.query(models.News).filter(models.News.id == news_id).first()
    if db_news:
        db_news.views += 1
        db.commit()
    return db_news


def search_news(db: Session, query: str, skip: int = 0, limit: int = 10):
    return db.query(models.News).filter(
        or_(
            models.News.title.contains(query),
            models.News.summary.contains(query),
            models.News.content.contains(query)
        ),
        models.News.status == models.ContentStatus.PUBLISHED
    ).order_by(models.News.published_at.desc()).offset(skip).limit(limit).all()


def get_comments(db: Session, news_id: int, skip: int = 0, limit: int = 50):
    return db.query(models.Comment).filter(
        models.Comment.news_id == news_id,
        models.Comment.is_approved == True
    ).order_by(models.Comment.created_at.desc()).offset(skip).limit(limit).all()


def create_comment(db: Session, comment: schemas.CommentCreate, author_id: int):
    db_comment = models.Comment(
        **comment.dict(),
        author_id=author_id
    )
    db.add(db_comment)
    db.commit()
    db.refresh(db_comment)
    return db_comment


def get_favorites(db: Session, user_id: int, skip: int = 0, limit: int = 50):
    return db.query(models.Favorite).filter(models.Favorite.user_id == user_id).order_by(models.Favorite.created_at.desc()).offset(skip).limit(limit).all()


def create_favorite(db: Session, favorite: schemas.FavoriteCreate, user_id: int):
    db_favorite = models.Favorite(
        **favorite.dict(),
        user_id=user_id
    )
    db.add(db_favorite)
    db.commit()
    db.refresh(db_favorite)
    return db_favorite


def delete_favorite(db: Session, favorite_id: int, user_id: int):
    db_favorite = db.query(models.Favorite).filter(
        models.Favorite.id == favorite_id,
        models.Favorite.user_id == user_id
    ).first()
    if db_favorite:
        db.delete(db_favorite)
        db.commit()
    return db_favorite


def get_user_comments(db: Session, user_id: int, skip: int = 0, limit: int = 50):
    return db.query(models.Comment).filter(models.Comment.author_id == user_id).order_by(models.Comment.created_at.desc()).offset(skip).limit(limit).all()
