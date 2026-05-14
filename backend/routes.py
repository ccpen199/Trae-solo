from flask import request, jsonify, g
from app import app, db
from models import Activity, Organizer, Review, Favorite, User
from datetime import datetime, timedelta
from passlib.hash import bcrypt
import jwt
import json

@app.before_request
def load_user():
    token = request.headers.get('Authorization')
    if token:
        try:
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
            g.user = User.query.get(data['user_id'])
        except:
            g.user = None
    else:
        g.user = None

@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.json
    password = data['password']
    
    # 密码验证
    if len(password) < 6:
        return jsonify({'error': '密码长度至少需要6位'}), 400
    if len(password.encode('utf-8')) > 72:
        password = password[:72]
    
    if User.query.filter_by(username=data['username']).first():
        return jsonify({'error': '用户名已存在'}), 400
    
    user = User(
        username=data['username'],
        password_hash=bcrypt.hash(password),
        email=data.get('email')
    )
    db.session.add(user)
    db.session.commit()
    token = jwt.encode({'user_id': user.id}, app.config['SECRET_KEY'])
    return jsonify({'token': token, 'user': {'id': user.id, 'username': user.username}})

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.json
    password = data['password']
    
    # 同样处理密码长度
    if len(password.encode('utf-8')) > 72:
        password = password[:72]
    
    user = User.query.filter_by(username=data['username']).first()
    if user and bcrypt.verify(password, user.password_hash):
        token = jwt.encode({'user_id': user.id}, app.config['SECRET_KEY'])
        return jsonify({'token': token, 'user': {'id': user.id, 'username': user.username}})
    return jsonify({'error': '用户名或密码错误'}), 401

@app.route('/api/user', methods=['GET'])
def get_user():
    if g.user:
        return jsonify({'id': g.user.id, 'username': g.user.username, 'email': g.user.email})
    return jsonify({'error': '未登录'}), 401

@app.route('/api/cities', methods=['GET'])
def get_cities():
    cities = db.session.query(Activity.city).distinct().all()
    return jsonify([city[0] for city in cities])

@app.route('/api/activities', methods=['GET'])
def get_activities():
    query = Activity.query
    
    city = request.args.get('city')
    if city:
        query = query.filter_by(city=city)
    
    activity_type = request.args.get('type')
    if activity_type:
        query = query.filter_by(type=activity_type)
    
    sub_type = request.args.get('sub_type')
    if sub_type:
        query = query.filter_by(sub_type=sub_type)
    
    keyword = request.args.get('keyword')
    if keyword:
        query = query.filter(Activity.name.like(f'%{keyword}%') | Activity.description.like(f'%{keyword}%'))
    
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    if start_date:
        query = query.filter(Activity.start_date >= datetime.strptime(start_date, '%Y-%m-%d').date())
    if end_date:
        query = query.filter(Activity.end_date <= datetime.strptime(end_date, '%Y-%m-%d').date())
    
    query = query.filter(Activity.current_participants < Activity.max_participants)
    
    sort_by = request.args.get('sort_by', 'popularity')
    if sort_by == 'nearest':
        query = query.order_by(Activity.popularity.desc())
    elif sort_by == 'popular':
        query = query.order_by(Activity.popularity.desc())
    elif sort_by == 'rating':
        query = query.order_by(Activity.rating.desc())
    elif sort_by == 'price_low':
        query = query.order_by(Activity.price.asc())
    elif sort_by == 'price_high':
        query = query.order_by(Activity.price.desc())
    else:
        query = query.order_by(Activity.created_at.desc())
    
    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 10))
    paginated = query.paginate(page=page, per_page=per_page)
    
    activities = []
    for activity in paginated.items:
        activities.append({
            'id': activity.id,
            'name': activity.name,
            'type': activity.type,
            'sub_type': activity.sub_type,
            'city': activity.city,
            'location': activity.location,
            'images': json.loads(activity.images) if activity.images else [],
            'tags': json.loads(activity.tags) if activity.tags else [],
            'duration': activity.duration,
            'max_participants': activity.max_participants,
            'current_participants': activity.current_participants,
            'language': activity.language,
            'price': activity.price,
            'rating': activity.rating,
            'review_count': activity.review_count,
            'is_free': activity.is_free,
            'start_date': activity.start_date.isoformat() if activity.start_date else None,
            'end_date': activity.end_date.isoformat() if activity.end_date else None,
            'latitude': activity.latitude,
            'longitude': activity.longitude
        })
    
    return jsonify({
        'activities': activities,
        'total': paginated.total,
        'pages': paginated.pages,
        'current_page': page
    })

@app.route('/api/activities/<int:id>', methods=['GET'])
def get_activity(id):
    activity = Activity.query.get(id)
    if not activity:
        return jsonify({'error': '活动不存在'}), 404
    
    organizer = Organizer.query.get(activity.organizer_id) if activity.organizer_id else None
    reviews = Review.query.filter_by(activity_id=id).order_by(Review.created_at.desc()).all()
    
    activity_data = {
        'id': activity.id,
        'name': activity.name,
        'type': activity.type,
        'sub_type': activity.sub_type,
        'city': activity.city,
        'location': activity.location,
        'images': json.loads(activity.images) if activity.images else [],
        'tags': json.loads(activity.tags) if activity.tags else [],
        'duration': activity.duration,
        'max_participants': activity.max_participants,
        'current_participants': activity.current_participants,
        'language': activity.language,
        'description': activity.description,
        'provided_items': json.loads(activity.provided_items) if activity.provided_items else [],
        'required_items': json.loads(activity.required_items) if activity.required_items else [],
        'booking_notes': activity.booking_notes,
        'price': activity.price,
        'rating': activity.rating,
        'review_count': activity.review_count,
        'is_free': activity.is_free,
        'start_date': activity.start_date.isoformat() if activity.start_date else None,
        'end_date': activity.end_date.isoformat() if activity.end_date else None,
        'latitude': activity.latitude,
        'longitude': activity.longitude,
        'organizer': {
            'id': organizer.id,
            'name': organizer.name,
            'avatar': organizer.avatar,
            'description': organizer.description
        } if organizer else None,
        'reviews': [{
            'id': r.id,
            'user_id': r.user_id,
            'user_name': r.user_name,
            'user_avatar': r.user_avatar,
            'rating': r.rating,
            'content': r.content,
            'created_at': r.created_at.isoformat()
        } for r in reviews]
    }
    
    return jsonify(activity_data)

@app.route('/api/activities/<int:id>/favorite', methods=['POST'])
def toggle_favorite(id):
    if not g.user:
        return jsonify({'error': '请先登录'}), 401
    
    favorite = Favorite.query.filter_by(user_id=g.user.id, activity_id=id).first()
    
    if favorite:
        db.session.delete(favorite)
        db.session.commit()
        return jsonify({'status': 'removed'})
    else:
        new_favorite = Favorite(user_id=g.user.id, activity_id=id)
        db.session.add(new_favorite)
        db.session.commit()
        return jsonify({'status': 'added'})

@app.route('/api/activities/<int:id>/review', methods=['POST'])
def add_review(id):
    if not g.user:
        return jsonify({'error': '请先登录'}), 401
    
    data = request.json
    review = Review(
        activity_id=id,
        user_id=g.user.id,
        user_name=g.user.username,
        rating=data['rating'],
        content=data.get('content', '')
    )
    db.session.add(review)
    
    activity = Activity.query.get(id)
    activity.review_count += 1
    activity.rating = (activity.rating * (activity.review_count - 1) + data['rating']) / activity.review_count
    
    db.session.commit()
    return jsonify({'success': True})

@app.route('/api/activity_types', methods=['GET'])
def get_activity_types():
    types = [
        {'id': 'hot', 'name': '热门活动'},
        {'id': 'local', 'name': '体验当地'},
        {'id': 'art', 'name': '艺术之旅'},
        {'id': 'limited', 'name': '限定活动'},
        {'id': 'skill', 'name': 'Get新技能'},
        {'id': 'personalized', 'name': '个性化'}
    ]
    sub_types = {
        'local': [
            {'id': 'guide_tour', 'name': '向导旅行计划'},
            {'id': 'food', 'name': '美食制作'},
            {'id': 'photography', 'name': '摄影跟拍'},
            {'id': 'costume', 'name': '传统服饰租赁'},
            {'id': 'traditional', 'name': '传统活动'},
            {'id': 'culture', 'name': '城市历史名人文化'},
            {'id': 'nature', 'name': '自然风光'},
            {'id': 'alternative', 'name': '另类探索城市'},
            {'id': 'hidden', 'name': '小众去处'}
        ]
    }
    return jsonify({'types': types, 'sub_types': sub_types})

@app.route('/api/user/favorites', methods=['GET'])
def get_favorites():
    if not g.user:
        return jsonify({'error': '请先登录'}), 401
    
    favorites = Favorite.query.filter_by(user_id=g.user.id).all()
    activity_ids = [f.activity_id for f in favorites]
    activities = Activity.query.filter(Activity.id.in_(activity_ids)).all()
    
    result = []
    for activity in activities:
        result.append({
            'id': activity.id,
            'name': activity.name,
            'type': activity.type,
            'city': activity.city,
            'images': json.loads(activity.images) if activity.images else [],
            'price': activity.price,
            'rating': activity.rating
        })
    
    return jsonify(result)