from core.database import Base
from sqlalchemy import Column, DateTime, Float, Integer, String


class Player_progress(Base):
    __tablename__ = "player_progress"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True, autoincrement=True, nullable=False)
    user_id = Column(String, nullable=False)
    player_id = Column(Integer, nullable=False)
    balance = Column(Float, nullable=True)
    level = Column(Integer, nullable=True)
    xp = Column(Integer, nullable=True)
    total_drops = Column(Integer, nullable=True)
    total_won = Column(Float, nullable=True)
    total_spent = Column(Float, nullable=True)
    biggest_win = Column(Float, nullable=True)
    tap_count = Column(Integer, nullable=True)
    combo_count = Column(Integer, nullable=True)
    max_combo = Column(Integer, nullable=True)
    consecutive_losses = Column(Integer, nullable=True)
    prestige_level = Column(Integer, nullable=True)
    selected_skin = Column(String, nullable=True)
    selected_theme = Column(String, nullable=True)
    owned_skins = Column(String, nullable=True)
    owned_themes = Column(String, nullable=True)
    active_boosters = Column(String, nullable=True)
    shop_purchases = Column(Integer, nullable=True)
    achievements = Column(String, nullable=True)
    daily_challenges = Column(String, nullable=True)
    weekly_challenges = Column(String, nullable=True)
    last_daily_bonus = Column(DateTime(timezone=True), nullable=True)
    last_hourly_bonus = Column(DateTime(timezone=True), nullable=True)
    last_wheel_spin = Column(DateTime(timezone=True), nullable=True)
    login_streak = Column(Integer, nullable=True)
    last_login_date = Column(String, nullable=True)
    updated_at = Column(DateTime(timezone=True), nullable=True)