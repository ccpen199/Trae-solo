from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional, List
from app.models import UserRole, ContentStatus


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    username: Optional[str] = None


class UserBase(BaseModel):
    username: str
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    role: UserRole = UserRole.GUEST
    campus_id: Optional[str] = None
    avatar: Optional[str] = None
    bio: Optional[str] = None


class UserCreate(UserBase):
    password: str


class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    avatar: Optional[str] = None
    bio: Optional[str] = None


class UserResponse(UserBase):
    id: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class CategoryBase(BaseModel):
    name: str
    slug: str
    description: Optional[str] = None
    icon: Optional[str] = None
    order: int = 0
    parent_id: Optional[int] = None


class CategoryCreate(CategoryBase):
    pass


class CategoryResponse(CategoryBase):
    id: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class NewsBase(BaseModel):
    title: str
    slug: str
    summary: Optional[str] = None
    content: str
    cover_image: Optional[str] = None
    category_id: Optional[int] = None


class NewsCreate(NewsBase):
    pass


class NewsUpdate(BaseModel):
    title: Optional[str] = None
    summary: Optional[str] = None
    content: Optional[str] = None
    cover_image: Optional[str] = None
    status: Optional[ContentStatus] = None
    category_id: Optional[int] = None


class NewsResponse(NewsBase):
    id: int
    status: ContentStatus
    views: int
    author_id: Optional[int] = None
    published_at: Optional[datetime] = None
    created_at: datetime
    category: Optional[CategoryResponse] = None

    class Config:
        from_attributes = True


class CommentBase(BaseModel):
    content: str
    news_id: int
    parent_id: Optional[int] = None


class CommentCreate(CommentBase):
    pass


class CommentResponse(CommentBase):
    id: int
    author_id: int
    is_approved: bool
    created_at: datetime
    author: Optional[UserResponse] = None

    class Config:
        from_attributes = True


class FavoriteCreate(BaseModel):
    news_id: int


class FavoriteResponse(BaseModel):
    id: int
    user_id: int
    news_id: int
    created_at: datetime
    news: Optional[NewsResponse] = None

    class Config:
        from_attributes = True


class NewsListResponse(BaseModel):
    total: int
    items: List[NewsResponse]
    page: int
    size: int
