from core.database import Base
from sqlalchemy import Column, DateTime, Float, Integer, String


class Leaderboard_entries(Base):
    __tablename__ = "leaderboard_entries"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True, autoincrement=True, nullable=False)
    user_id = Column(String, nullable=False)
    player_id = Column(Integer, nullable=False)
    nickname = Column(String, nullable=False)
    total_won = Column(Float, nullable=True)
    level = Column(Integer, nullable=True)
    prestige_level = Column(Integer, nullable=True)
    updated_at = Column(DateTime(timezone=True), nullable=True)