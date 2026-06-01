from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv

from database import engine, get_db, Base
from models import User, EnergyBubble, TreeProject, Tree, Friendship, Notification, Activity, Message, AnalyticsEvent
from auth import verify_password, get_password_hash, create_access_token, get_current_active_user, ACCESS_TOKEN_EXPIRE_MINUTES
from schemas import (
    UserCreate, UserResponse, Token, EnergyBubbleResponse, TreeProjectResponse,
    TreeResponse, FriendResponse, NotificationResponse, ActivityResponse,
    MessageCreate, MessageResponse, PlantTreeRequest, CollectEnergyRequest,
    UpdateRemarkRequest
)

load_dotenv(dotenv_path='../.env')

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Energy Forest API")

BACKEND_PORT = int(os.getenv("BACKEND_PORT", 54868))
FRONTEND_PORT = int(os.getenv("FRONTEND_PORT", 44868))

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        f"http://127.0.0.1:{FRONTEND_PORT}",
        f"http://localhost:{FRONTEND_PORT}"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def init_tree_projects(db: Session):
    if db.query(TreeProject).count() == 0:
        projects = [
            TreeProject(
                name="阿拉善梭梭树",
                description="在内蒙古阿拉善地区种植梭梭树，防风固沙，改善生态环境",
                tree_type="梭梭树",
                energy_cost=17900,
                location="内蒙古阿拉善",
                image_url="https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=400"
            ),
            TreeProject(
                name="武威沙柳",
                description="在甘肃武威地区种植沙柳，治理沙漠化，保护家园",
                tree_type="沙柳",
                energy_cost=19680,
                location="甘肃武威",
                image_url="https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=400"
            ),
            TreeProject(
                name="鄂尔多斯樟子松",
                description="在内蒙古鄂尔多斯种植樟子松，打造绿色屏障",
                tree_type="樟子松",
                energy_cost=146210,
                location="内蒙古鄂尔多斯",
                image_url="https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?w=400"
            ),
            TreeProject(
                name="陇南油松",
                description="在甘肃陇南种植油松，涵养水源，保护生物多样性",
                tree_type="油松",
                energy_cost=100000,
                location="甘肃陇南",
                image_url="https://images.unsplash.com/photo-1473448912268-2022ce9509d8?w=400"
            )
        ]
        db.add_all(projects)
        db.commit()


def init_test_users(db: Session):
    if db.query(User).count() == 0:
        users_data = [
            {"username": "user1", "email": "user1@example.com", "password": "123456"},
            {"username": "user2", "email": "user2@example.com", "password": "123456"},
            {"username": "user3", "email": "user3@example.com", "password": "123456"},
        ]
        for user_data in users_data:
            hashed_password = get_password_hash(user_data["password"])
            user = User(
                username=user_data["username"],
                email=user_data["email"],
                hashed_password=hashed_password,
                current_energy=25000
            )
            db.add(user)
        db.commit()

        users = db.query(User).all()
        for i, user in enumerate(users):
            for j, friend in enumerate(users):
                if i != j:
                    friendship = Friendship(user_id=user.id, friend_id=friend.id)
                    db.add(friendship)

            for k in range(3):
                bubble = EnergyBubble(
                    user_id=user.id,
                    amount=10 + k * 5,
                    source=["步行", "线下支付", "公交出行"][k],
                    expires_at=datetime.utcnow() + timedelta(hours=24)
                )
                db.add(bubble)
        db.commit()


@app.on_event("startup")
async def startup_event():
    db = next(get_db())
    init_tree_projects(db)
    init_test_users(db)
    db.close()


@app.post("/register", response_model=UserResponse)
def register(user: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    db_user = db.query(User).filter(User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_password = get_password_hash(user.password)
    db_user = User(
        username=user.username,
        email=user.email,
        hashed_password=hashed_password
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    for k in range(3):
        bubble = EnergyBubble(
            user_id=db_user.id,
            amount=10 + k * 5,
            source=["步行", "线下支付", "公交出行"][k],
            expires_at=datetime.utcnow() + timedelta(hours=24)
        )
        db.add(bubble)
    db.commit()

    return db_user


@app.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer", "user": user}


@app.get("/users/me", response_model=UserResponse)
def read_users_me(current_user: User = Depends(get_current_active_user)):
    return current_user


@app.get("/energy/bubbles", response_model=list[EnergyBubbleResponse])
def get_my_energy_bubbles(current_user: User = Depends(get_current_active_user), db: Session = Depends(get_db)):
    bubbles = db.query(EnergyBubble).filter(
        EnergyBubble.user_id == current_user.id,
        EnergyBubble.collected == False,
        EnergyBubble.expires_at > datetime.utcnow()
    ).all()
    return bubbles


@app.post("/energy/collect")
def collect_energy(
    request: CollectEnergyRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    user_id = request.friend_id if request.friend_id else current_user.id
    bubble = db.query(EnergyBubble).filter(
        EnergyBubble.id == request.bubble_id,
        EnergyBubble.user_id == user_id,
        EnergyBubble.collected == False
    ).first()

    if not bubble:
        raise HTTPException(status_code=404, detail="Energy bubble not found or already collected")

    if bubble.expires_at < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Energy bubble has expired")

    bubble.collected = True
    bubble.collected_by = current_user.id
    bubble.collected_at = datetime.utcnow()

    current_user.current_energy += bubble.amount
    current_user.total_energy += bubble.amount

    if request.friend_id and request.friend_id != current_user.id:
        friend = db.query(User).filter(User.id == request.friend_id).first()
        notification = Notification(
            user_id=request.friend_id,
            type="energy_collected",
            title="能量被收取",
            content=f"{current_user.username}收取了你的{bubble.amount}g绿色能量",
            related_user_id=current_user.id
        )
        db.add(notification)

        activity = Activity(
            user_id=current_user.id,
            type="collect_friend_energy",
            content=f"从{friend.username}的森林收取了{bubble.amount}g绿色能量",
            related_user_id=request.friend_id
        )
        db.add(activity)
    else:
        activity = Activity(
            user_id=current_user.id,
            type="collect_own_energy",
            content=f"收取了自己的{bubble.amount}g绿色能量（{bubble.source}）"
        )
        db.add(activity)

    db.commit()
    return {"success": True, "amount": bubble.amount, "current_energy": current_user.current_energy}


@app.get("/tree-projects", response_model=list[TreeProjectResponse])
def get_tree_projects(db: Session = Depends(get_db)):
    projects = db.query(TreeProject).filter(TreeProject.is_active == True).all()
    return projects


@app.post("/trees/plant")
def plant_tree(
    request: PlantTreeRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    project = db.query(TreeProject).filter(TreeProject.id == request.project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Tree project not found")

    if current_user.current_energy < project.energy_cost:
        raise HTTPException(status_code=400, detail="Not enough energy")

    current_user.current_energy -= project.energy_cost
    current_user.trees_planted += 1

    certificate_number = f"CERT-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}-{current_user.id}"
    tree = Tree(
        user_id=current_user.id,
        tree_type=project.tree_type,
        tree_name=project.name,
        energy_cost=project.energy_cost,
        project_name=project.name,
        location=project.location,
        certificate_number=certificate_number
    )
    db.add(tree)

    project.total_plantings += 1

    activity = Activity(
        user_id=current_user.id,
        type="plant_tree",
        content=f"成功在{project.location}种植了一棵{project.tree_type}！"
    )
    db.add(activity)

    db.commit()
    return {"success": True, "certificate_number": certificate_number, "current_energy": current_user.current_energy}


@app.get("/trees/my", response_model=list[TreeResponse])
def get_my_trees(current_user: User = Depends(get_current_active_user), db: Session = Depends(get_db)):
    trees = db.query(Tree).filter(Tree.user_id == current_user.id).order_by(Tree.planted_at.desc()).all()
    return trees


@app.get("/friends", response_model=list[FriendResponse])
def get_friends(current_user: User = Depends(get_current_active_user), db: Session = Depends(get_db)):
    friendships = db.query(Friendship).filter(Friendship.user_id == current_user.id).all()
    friend_ids = [f.friend_id for f in friendships]

    friends = db.query(User).filter(User.id.in_(friend_ids)).all()
    friend_remarks = {f.friend_id: f.remark for f in friendships}

    result = []
    for friend in friends:
        has_collectable = db.query(EnergyBubble).filter(
            EnergyBubble.user_id == friend.id,
            EnergyBubble.collected == False,
            EnergyBubble.expires_at > datetime.utcnow()
        ).count() > 0

        result.append(FriendResponse(
            id=friend.id,
            username=friend.username,
            avatar=friend.avatar,
            current_energy=friend.current_energy,
            trees_planted=friend.trees_planted,
            remark=friend_remarks.get(friend.id),
            has_collectable_energy=has_collectable
        ))

    result.sort(key=lambda x: x.trees_planted, reverse=True)
    return result


@app.get("/friends/{friend_id}/energy", response_model=list[EnergyBubbleResponse])
def get_friend_energy_bubbles(
    friend_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    is_friend = db.query(Friendship).filter(
        Friendship.user_id == current_user.id,
        Friendship.friend_id == friend_id
    ).first()

    if not is_friend:
        raise HTTPException(status_code=403, detail="Not friends with this user")

    bubbles = db.query(EnergyBubble).filter(
        EnergyBubble.user_id == friend_id,
        EnergyBubble.collected == False,
        EnergyBubble.expires_at > datetime.utcnow()
    ).all()
    return bubbles


@app.get("/notifications", response_model=list[NotificationResponse])
def get_notifications(current_user: User = Depends(get_current_active_user), db: Session = Depends(get_db)):
    notifications = db.query(Notification).filter(
        Notification.user_id == current_user.id
    ).order_by(Notification.created_at.desc()).all()

    result = []
    for notification in notifications:
        related_user = db.query(User).filter(User.id == notification.related_user_id).first() if notification.related_user_id else None
        result.append(NotificationResponse(
            id=notification.id,
            type=notification.type,
            title=notification.title,
            content=notification.content,
            related_user_id=notification.related_user_id,
            related_username=related_user.username if related_user else None,
            is_read=notification.is_read,
            created_at=notification.created_at
        ))
    return result


@app.get("/activities", response_model=list[ActivityResponse])
def get_activities(current_user: User = Depends(get_current_active_user), db: Session = Depends(get_db)):
    activities = db.query(Activity).filter(
        Activity.user_id == current_user.id
    ).order_by(Activity.created_at.desc()).limit(50).all()

    result = []
    for activity in activities:
        related_user = db.query(User).filter(User.id == activity.related_user_id).first() if activity.related_user_id else None
        result.append(ActivityResponse(
            id=activity.id,
            type=activity.type,
            content=activity.content,
            related_username=related_user.username if related_user else None,
            created_at=activity.created_at
        ))
    return result


@app.post("/messages/send")
def send_message(
    message: MessageCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    db_message = Message(
        sender_id=current_user.id,
        receiver_id=message.receiver_id,
        content=message.content
    )
    db.add(db_message)

    notification = Notification(
        user_id=message.receiver_id,
        type="message",
        title=f"来自 {current_user.username} 的消息",
        content=message.content,
        related_user_id=current_user.id
    )
    db.add(notification)

    db.commit()
    return {"success": True}


@app.post("/friends/remark")
def update_friend_remark(
    request: UpdateRemarkRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    friendship = db.query(Friendship).filter(
        Friendship.user_id == current_user.id,
        Friendship.friend_id == request.friend_id
    ).first()

    if not friendship:
        raise HTTPException(status_code=404, detail="Friendship not found")

    friendship.remark = request.remark if request.remark and request.remark.strip() else None
    db.commit()

    return {"success": True, "remark": friendship.remark}


@app.get("/messages", response_model=list[MessageResponse])
def get_messages(current_user: User = Depends(get_current_active_user), db: Session = Depends(get_db)):
    messages = db.query(Message).filter(
        (Message.sender_id == current_user.id) | (Message.receiver_id == current_user.id)
    ).order_by(Message.created_at.desc()).limit(50).all()

    result = []
    for message in messages:
        sender = db.query(User).filter(User.id == message.sender_id).first()
        result.append(MessageResponse(
            id=message.id,
            sender_id=message.sender_id,
            sender_username=sender.username,
            sender_avatar=sender.avatar,
            content=message.content,
            is_read=message.is_read,
            created_at=message.created_at
        ))
    return result


@app.get("/leaderboard")
def get_leaderboard(current_user: User = Depends(get_current_active_user), db: Session = Depends(get_db)):
    users = db.query(User).order_by(User.trees_planted.desc()).limit(20).all()

    result = []
    for rank, user in enumerate(users, 1):
        result.append({
            "rank": rank,
            "user_id": user.id,
            "username": user.username,
            "avatar": user.avatar,
            "trees_planted": user.trees_planted,
            "total_energy": user.total_energy,
            "is_current_user": user.id == current_user.id
        })
    return result


@app.post("/analytics/track")
def track_event(
    event_type: str,
    page: str = None,
    properties: str = None,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    analytics_event = AnalyticsEvent(
        user_id=current_user.id,
        event_type=event_type,
        page=page,
        properties=properties
    )
    db.add(analytics_event)
    db.commit()
    return {"success": True}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=BACKEND_PORT)
