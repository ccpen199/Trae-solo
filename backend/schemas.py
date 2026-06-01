from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime


class UserBase(BaseModel):
    username: str
    email: EmailStr


class UserCreate(UserBase):
    password: str


class UserLogin(BaseModel):
    username: str
    password: str


class UserResponse(UserBase):
    id: int
    avatar: str
    total_energy: int
    current_energy: int
    trees_planted: int
    created_at: datetime

    class Config:
        orm_mode = True


class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse


class EnergyBubbleResponse(BaseModel):
    id: int
    amount: int
    source: str
    expires_at: datetime
    collected: bool
    created_at: datetime

    class Config:
        orm_mode = True


class TreeProjectResponse(BaseModel):
    id: int
    name: str
    description: str
    tree_type: str
    energy_cost: int
    location: str
    total_plantings: int
    image_url: str

    class Config:
        orm_mode = True


class TreeResponse(BaseModel):
    id: int
    tree_type: str
    tree_name: str
    energy_cost: int
    project_name: str
    location: str
    certificate_number: str
    planted_at: datetime

    class Config:
        orm_mode = True


class FriendResponse(BaseModel):
    id: int
    username: str
    avatar: str
    current_energy: int
    trees_planted: int
    remark: Optional[str] = None
    has_collectable_energy: bool = False

    class Config:
        orm_mode = True


class NotificationResponse(BaseModel):
    id: int
    type: str
    title: str
    content: str
    related_user_id: Optional[int] = None
    related_username: Optional[str] = None
    is_read: bool
    created_at: datetime

    class Config:
        orm_mode = True


class ActivityResponse(BaseModel):
    id: int
    type: str
    content: str
    related_username: Optional[str] = None
    created_at: datetime

    class Config:
        orm_mode = True


class MessageCreate(BaseModel):
    receiver_id: int
    content: str


class MessageResponse(BaseModel):
    id: int
    sender_id: int
    sender_username: str
    sender_avatar: str
    content: str
    is_read: bool
    created_at: datetime

    class Config:
        orm_mode = True


class PlantTreeRequest(BaseModel):
    project_id: int


class CollectEnergyRequest(BaseModel):
    bubble_id: int
    friend_id: Optional[int] = None


class UpdateRemarkRequest(BaseModel):
    friend_id: int
    remark: Optional[str] = None
