from datetime import datetime
from app import db

class Activity(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    type = db.Column(db.String(50), nullable=False)
    sub_type = db.Column(db.String(50))
    city = db.Column(db.String(50), nullable=False)
    location = db.Column(db.String(200))
    images = db.Column(db.Text)
    tags = db.Column(db.Text)
    duration = db.Column(db.String(50))
    max_participants = db.Column(db.Integer)
    current_participants = db.Column(db.Integer, default=0)
    language = db.Column(db.String(50))
    description = db.Column(db.Text)
    provided_items = db.Column(db.Text)
    required_items = db.Column(db.Text)
    booking_notes = db.Column(db.Text)
    organizer_id = db.Column(db.Integer, db.ForeignKey('organizer.id'))
    price = db.Column(db.Float)
    start_date = db.Column(db.Date)
    end_date = db.Column(db.Date)
    created_at = db.Column(db.DateTime, default=datetime.now)
    is_free = db.Column(db.Boolean, default=False)
    rating = db.Column(db.Float, default=0.0)
    review_count = db.Column(db.Integer, default=0)
    popularity = db.Column(db.Integer, default=0)
    latitude = db.Column(db.Float)
    longitude = db.Column(db.Float)

class Organizer(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    avatar = db.Column(db.String(200))
    description = db.Column(db.Text)
    activities = db.relationship('Activity', backref='organizer', lazy=True)

class Review(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    activity_id = db.Column(db.Integer, db.ForeignKey('activity.id'))
    user_id = db.Column(db.Integer)
    user_name = db.Column(db.String(100))
    user_avatar = db.Column(db.String(200))
    rating = db.Column(db.Float, nullable=False)
    content = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.now)

class Favorite(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer)
    activity_id = db.Column(db.Integer, db.ForeignKey('activity.id'))
    created_at = db.Column(db.DateTime, default=datetime.now)

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(100), unique=True, nullable=False)
    password_hash = db.Column(db.String(200))
    email = db.Column(db.String(100), unique=True)
    created_at = db.Column(db.DateTime, default=datetime.now)