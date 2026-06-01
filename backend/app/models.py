from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
import enum


class UserRole(str, enum.Enum):
    CAMPUS = "campus"
    SOCIAL = "social"
    GUEST = "guest"
    ADMIN = "admin"
    EDITOR = "editor"


class ContentStatus(str, enum.Enum):
    DRAFT = "draft"
    PUBLISHED = "published"
    ARCHIVED = "archived"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True)
    hashed_password = Column(String(200))
    full_name = Column(String(100))
    role = Column(Enum(UserRole), default=UserRole.GUEST)
    campus_id = Column(String(50))
    avatar = Column(String(500))
    bio = Column(Text)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    comments = relationship("Comment", back_populates="author")
    favorites = relationship("Favorite", back_populates="user")


class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), nullable=False)
    slug = Column(String(50), unique=True, index=True)
    description = Column(Text)
    icon = Column(String(200))
    order = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    parent_id = Column(Integer, ForeignKey("categories.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    news = relationship("News", back_populates="category")


class News(Base):
    __tablename__ = "news"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    slug = Column(String(200), unique=True, index=True)
    summary = Column(Text)
    content = Column(Text, nullable=False)
    cover_image = Column(String(500))
    status = Column(Enum(ContentStatus), default=ContentStatus.DRAFT)
    views = Column(Integer, default=0)
    category_id = Column(Integer, ForeignKey("categories.id"))
    author_id = Column(Integer, ForeignKey("users.id"))
    published_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    category = relationship("Category", back_populates="news")
    comments = relationship("Comment", back_populates="news")
    favorites = relationship("Favorite", back_populates="news")


class Comment(Base):
    __tablename__ = "comments"

    id = Column(Integer, primary_key=True, index=True)
    content = Column(Text, nullable=False)
    news_id = Column(Integer, ForeignKey("news.id"))
    author_id = Column(Integer, ForeignKey("users.id"))
    parent_id = Column(Integer, ForeignKey("comments.id"))
    is_approved = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    news = relationship("News", back_populates="comments")
    author = relationship("User", back_populates="comments")


class Favorite(Base):
    __tablename__ = "favorites"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    news_id = Column(Integer, ForeignKey("news.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="favorites")
    news = relationship("News", back_populates="favorites")


class ImageGallery(Base):
    __tablename__ = "image_galleries"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text)
    cover_image = Column(String(500))
    is_active = Column(Boolean, default=True)
    order = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class ImageItem(Base):
    __tablename__ = "image_items"

    id = Column(Integer, primary_key=True, index=True)
    gallery_id = Column(Integer, ForeignKey("image_galleries.id"))
    title = Column(String(200))
    image_url = Column(String(500), nullable=False)
    description = Column(Text)
    order = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Topic(Base):
    __tablename__ = "topics"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    slug = Column(String(200), unique=True, index=True)
    description = Column(Text)
    cover_image = Column(String(500))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class TopicNews(Base):
    __tablename__ = "topic_news"

    id = Column(Integer, primary_key=True, index=True)
    topic_id = Column(Integer, ForeignKey("topics.id"))
    news_id = Column(Integer, ForeignKey("news.id"))
    order = Column(Integer, default=0)
