from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    avatar = Column(String, default="default_avatar.png")
    total_energy = Column(Integer, default=0)
    current_energy = Column(Integer, default=0)
    trees_planted = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Boolean, default=True)

    energy_bubbles = relationship("EnergyBubble", back_populates="owner")
    trees = relationship("Tree", back_populates="owner")
    sent_messages = relationship("Message", foreign_keys="Message.sender_id", back_populates="sender")
    received_messages = relationship("Message", foreign_keys="Message.receiver_id", back_populates="receiver")
    friends = relationship("Friendship", foreign_keys="Friendship.user_id", back_populates="user")
    notifications = relationship("Notification", back_populates="user")
    activities = relationship("Activity", back_populates="user")


class EnergyBubble(Base):
    __tablename__ = "energy_bubbles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    amount = Column(Integer)
    source = Column(String)
    expires_at = Column(DateTime)
    collected = Column(Boolean, default=False)
    collected_by = Column(Integer, nullable=True)
    collected_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    owner = relationship("User", back_populates="energy_bubbles")


class Tree(Base):
    __tablename__ = "trees"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    tree_type = Column(String)
    tree_name = Column(String)
    energy_cost = Column(Integer)
    project_name = Column(String)
    location = Column(String)
    certificate_number = Column(String)
    planted_at = Column(DateTime, default=datetime.utcnow)

    owner = relationship("User", back_populates="trees")


class TreeProject(Base):
    __tablename__ = "tree_projects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    description = Column(Text)
    tree_type = Column(String)
    energy_cost = Column(Integer)
    location = Column(String)
    total_plantings = Column(Integer, default=0)
    image_url = Column(String)
    is_active = Column(Boolean, default=True)


class Friendship(Base):
    __tablename__ = "friendships"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    friend_id = Column(Integer, ForeignKey("users.id"))
    remark = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", foreign_keys=[user_id], back_populates="friends")
    friend = relationship("User", foreign_keys=[friend_id])


class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    sender_id = Column(Integer, ForeignKey("users.id"))
    receiver_id = Column(Integer, ForeignKey("users.id"))
    content = Column(Text)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    sender = relationship("User", foreign_keys=[sender_id], back_populates="sent_messages")
    receiver = relationship("User", foreign_keys=[receiver_id], back_populates="received_messages")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    type = Column(String)
    title = Column(String)
    content = Column(Text)
    related_user_id = Column(Integer, nullable=True)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="notifications")


class Activity(Base):
    __tablename__ = "activities"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    type = Column(String)
    content = Column(Text)
    related_user_id = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="activities")


class AnalyticsEvent(Base):
    __tablename__ = "analytics_events"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=True)
    event_type = Column(String)
    page = Column(String)
    properties = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
