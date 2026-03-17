import logging
import hashlib
import json
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, field_validator
from sqlalchemy import select, update, desc
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional, List

from core.database import get_db
from models.players import Players
from models.player_progress import Player_progress
from models.leaderboard_entries import Leaderboard_entries

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/game", tags=["game"])


def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()


def parse_datetime(s: Optional[str]) -> Optional[datetime]:
    """Parse ISO datetime string, handling trailing 'Z' for Python 3.10 compatibility."""
    if not s:
        return None
    try:
        cleaned = s.replace("Z", "+00:00") if s.endswith("Z") else s
        return datetime.fromisoformat(cleaned)
    except (ValueError, TypeError):
        return None


def safe_float(val, default: float = 0.0) -> float:
    """Safely convert to float, handling None and invalid values."""
    if val is None:
        return default
    try:
        return float(val)
    except (ValueError, TypeError):
        return default


def safe_int(val, default: int = 0) -> int:
    """Safely convert to int, handling None and invalid values."""
    if val is None:
        return default
    try:
        return int(val)
    except (ValueError, TypeError):
        return default


class RegisterRequest(BaseModel):
    nickname: str
    password: str

    @field_validator("nickname")
    @classmethod
    def validate_nickname(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 3:
            raise ValueError("Nickname must be at least 3 characters")
        if len(v) > 20:
            raise ValueError("Nickname must be at most 20 characters")
        # Only allow alphanumeric, underscore, dash
        import re
        if not re.match(r'^[a-zA-Z0-9_\-а-яА-ЯёЁіІїЇєЄґҐ]+$', v):
            raise ValueError("Nickname contains invalid characters")
        return v

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if len(v) < 4:
            raise ValueError("Password must be at least 4 characters")
        if len(v) > 100:
            raise ValueError("Password too long")
        return v


class LoginRequest(BaseModel):
    nickname: str
    password: str


class PlayerResponse(BaseModel):
    id: int
    nickname: str
    token: str
    is_admin: bool = False


class SaveProgressRequest(BaseModel):
    player_id: int
    balance: float = 1000
    level: int = 1
    xp: int = 0
    total_drops: int = 0
    total_won: float = 0
    total_spent: float = 0
    biggest_win: float = 0
    tap_count: int = 0
    combo_count: int = 0
    max_combo: int = 0
    consecutive_losses: int = 0
    prestige_level: int = 0
    selected_skin: str = "gold"
    selected_theme: str = "default"
    owned_skins: str = '["gold"]'
    owned_themes: str = '["default"]'
    active_boosters: str = "[]"
    shop_purchases: int = 0
    achievements: str = "[]"
    daily_challenges: str = "[]"
    weekly_challenges: str = "[]"
    last_daily_bonus: Optional[str] = None
    last_hourly_bonus: Optional[str] = None
    last_wheel_spin: Optional[str] = None
    login_streak: int = 0
    last_login_date: Optional[str] = None


class ProgressResponse(BaseModel):
    player_id: int
    balance: float
    level: int
    xp: int
    total_drops: int
    total_won: float
    total_spent: float
    biggest_win: float
    tap_count: int
    combo_count: int
    max_combo: int
    consecutive_losses: int
    prestige_level: int
    selected_skin: str
    selected_theme: str
    owned_skins: str
    owned_themes: str
    active_boosters: str
    shop_purchases: int
    achievements: str
    daily_challenges: str
    weekly_challenges: str
    last_daily_bonus: Optional[str]
    last_hourly_bonus: Optional[str]
    last_wheel_spin: Optional[str]
    login_streak: int = 0
    last_login_date: Optional[str] = None


class LeaderboardEntry(BaseModel):
    nickname: str
    total_won: float
    level: int
    prestige_level: int


def progress_to_response(progress: Player_progress) -> ProgressResponse:
    """Convert DB model to response, handling all null values safely."""
    return ProgressResponse(
        player_id=safe_int(progress.player_id),
        balance=safe_float(progress.balance, 1000),
        level=safe_int(progress.level, 1),
        xp=safe_int(progress.xp),
        total_drops=safe_int(progress.total_drops),
        total_won=safe_float(progress.total_won),
        total_spent=safe_float(progress.total_spent),
        biggest_win=safe_float(progress.biggest_win),
        tap_count=safe_int(progress.tap_count),
        combo_count=safe_int(progress.combo_count),
        max_combo=safe_int(progress.max_combo),
        consecutive_losses=safe_int(progress.consecutive_losses),
        prestige_level=safe_int(progress.prestige_level),
        selected_skin=progress.selected_skin or "gold",
        selected_theme=progress.selected_theme or "default",
        owned_skins=progress.owned_skins or '["gold"]',
        owned_themes=progress.owned_themes or '["default"]',
        active_boosters=progress.active_boosters or "[]",
        shop_purchases=safe_int(progress.shop_purchases),
        achievements=progress.achievements or "[]",
        daily_challenges=progress.daily_challenges or "[]",
        weekly_challenges=progress.weekly_challenges or "[]",
        last_daily_bonus=str(progress.last_daily_bonus) if progress.last_daily_bonus else None,
        last_hourly_bonus=str(progress.last_hourly_bonus) if progress.last_hourly_bonus else None,
        last_wheel_spin=str(progress.last_wheel_spin) if progress.last_wheel_spin else None,
        login_streak=safe_int(getattr(progress, 'login_streak', 0)),
        last_login_date=getattr(progress, 'last_login_date', None) or None,
    )


def create_default_progress(player_id: int, user_id: str) -> Player_progress:
    """Create a default progress record for a new player."""
    now = datetime.now()
    return Player_progress(
        user_id=user_id,
        player_id=player_id,
        balance=1000,
        level=1,
        xp=0,
        total_drops=0,
        total_won=0,
        total_spent=0,
        biggest_win=0,
        tap_count=0,
        combo_count=0,
        max_combo=0,
        consecutive_losses=0,
        prestige_level=0,
        selected_skin="gold",
        selected_theme="default",
        owned_skins='["gold"]',
        owned_themes='["default"]',
        active_boosters="[]",
        shop_purchases=0,
        achievements="[]",
        daily_challenges="[]",
        weekly_challenges="[]",
        last_daily_bonus=now,
        last_hourly_bonus=now,
        last_wheel_spin=now,
        login_streak=0,
        last_login_date=None,
        updated_at=now,
    )


# ==================== HEALTH CHECK ====================

@router.get("/health")
async def game_health(db: AsyncSession = Depends(get_db)):
    """Health check for game endpoints — verifies DB connectivity."""
    try:
        from sqlalchemy import text
        await db.execute(text("SELECT 1"))
        return {"status": "ok", "db": "connected"}
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return {"status": "degraded", "db": "error", "detail": str(e)}


# ==================== REGISTER ====================

@router.post("/register", response_model=PlayerResponse)
async def register(data: RegisterRequest, db: AsyncSession = Depends(get_db)):
    """Register a new player."""
    try:
        nickname = data.nickname.strip()

        # Check if nickname exists
        result = await db.execute(select(Players).where(Players.nickname == nickname))
        existing = result.scalar_one_or_none()
        if existing:
            raise HTTPException(status_code=409, detail="User already exists")

        # Create player
        now = datetime.now()
        user_id = f"local_{nickname.lower()}"
        player = Players(
            user_id=user_id,
            nickname=nickname,
            password_hash=hash_password(data.password),
            is_admin=False,
            created_at=now,
        )
        db.add(player)
        await db.flush()

        # Create initial progress
        progress = create_default_progress(player.id, user_id)
        db.add(progress)

        # Create leaderboard entry
        lb_entry = Leaderboard_entries(
            user_id=user_id,
            player_id=player.id,
            nickname=nickname,
            total_won=0,
            level=1,
            prestige_level=0,
            updated_at=now,
        )
        db.add(lb_entry)

        await db.commit()
        await db.refresh(player)

        return PlayerResponse(
            id=player.id,
            nickname=player.nickname,
            token=str(player.id),
            is_admin=bool(player.is_admin),
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Registration error: {e}", exc_info=True)
        try:
            await db.rollback()
        except Exception:
            pass
        raise HTTPException(status_code=500, detail="Registration failed, please try again")


# ==================== LOGIN ====================

@router.post("/login", response_model=PlayerResponse)
async def login(data: LoginRequest, db: AsyncSession = Depends(get_db)):
    """Login a player."""
    try:
        nickname = data.nickname.strip()
        if not nickname:
            raise HTTPException(status_code=400, detail="Nickname is required")

        result = await db.execute(select(Players).where(Players.nickname == nickname))
        player = result.scalar_one_or_none()
        if not player:
            raise HTTPException(status_code=404, detail="User not found")
        if player.password_hash != hash_password(data.password):
            raise HTTPException(status_code=401, detail="Wrong password")

        return PlayerResponse(
            id=player.id,
            nickname=player.nickname,
            token=str(player.id),
            is_admin=bool(player.is_admin),
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Login failed, please try again")


# ==================== GET PROGRESS ====================

@router.get("/progress/{player_id}", response_model=ProgressResponse)
async def get_progress(player_id: int, db: AsyncSession = Depends(get_db)):
    """Get player progress. Auto-creates default progress if missing."""
    try:
        result = await db.execute(
            select(Player_progress).where(Player_progress.player_id == player_id)
        )
        progress = result.scalar_one_or_none()

        if not progress:
            # Auto-create default progress instead of returning 404
            player_result = await db.execute(select(Players).where(Players.id == player_id))
            player = player_result.scalar_one_or_none()
            if not player:
                raise HTTPException(status_code=404, detail="Player not found")

            user_id = player.user_id or f"local_{player.nickname.lower()}"
            progress = create_default_progress(player_id, user_id)
            db.add(progress)

            # Also ensure leaderboard entry exists
            lb_result = await db.execute(
                select(Leaderboard_entries).where(Leaderboard_entries.player_id == player_id)
            )
            if not lb_result.scalar_one_or_none():
                lb_entry = Leaderboard_entries(
                    user_id=user_id,
                    player_id=player_id,
                    nickname=player.nickname,
                    total_won=0,
                    level=1,
                    prestige_level=0,
                    updated_at=datetime.now(),
                )
                db.add(lb_entry)

            await db.commit()
            await db.refresh(progress)

        return progress_to_response(progress)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get progress error for player {player_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to load progress")


# ==================== SAVE PROGRESS ====================

async def _do_save_progress(data: SaveProgressRequest, db: AsyncSession) -> dict:
    """Internal save logic shared by JSON endpoint and beacon endpoint."""
    result = await db.execute(
        select(Player_progress).where(Player_progress.player_id == data.player_id)
    )
    progress = result.scalar_one_or_none()
    now = datetime.now()

    update_values = dict(
        balance=safe_float(data.balance, 1000),
        level=safe_int(data.level, 1),
        xp=safe_int(data.xp),
        total_drops=safe_int(data.total_drops),
        total_won=safe_float(data.total_won),
        total_spent=safe_float(data.total_spent),
        biggest_win=safe_float(data.biggest_win),
        tap_count=safe_int(data.tap_count),
        combo_count=safe_int(data.combo_count),
        max_combo=safe_int(data.max_combo),
        consecutive_losses=safe_int(data.consecutive_losses),
        prestige_level=safe_int(data.prestige_level),
        selected_skin=data.selected_skin or "gold",
        selected_theme=data.selected_theme or "default",
        owned_skins=data.owned_skins or '["gold"]',
        owned_themes=data.owned_themes or '["default"]',
        active_boosters=data.active_boosters or "[]",
        shop_purchases=safe_int(data.shop_purchases),
        achievements=data.achievements or "[]",
        daily_challenges=data.daily_challenges or "[]",
        weekly_challenges=data.weekly_challenges or "[]",
        last_daily_bonus=parse_datetime(data.last_daily_bonus) or now,
        last_hourly_bonus=parse_datetime(data.last_hourly_bonus) or now,
        last_wheel_spin=parse_datetime(data.last_wheel_spin) or now,
        login_streak=safe_int(data.login_streak),
        last_login_date=data.last_login_date or None,
        updated_at=now,
    )

    if not progress:
        # Auto-create progress if missing
        progress = Player_progress(
            user_id=f"local_player_{data.player_id}",
            player_id=data.player_id,
            **update_values,
        )
        db.add(progress)
    else:
        await db.execute(
            update(Player_progress)
            .where(Player_progress.player_id == data.player_id)
            .values(**update_values)
        )

    # Update leaderboard
    lb_result = await db.execute(
        select(Leaderboard_entries).where(Leaderboard_entries.player_id == data.player_id)
    )
    lb = lb_result.scalar_one_or_none()
    if lb:
        await db.execute(
            update(Leaderboard_entries)
            .where(Leaderboard_entries.player_id == data.player_id)
            .values(
                total_won=safe_float(data.total_won),
                level=safe_int(data.level, 1),
                prestige_level=safe_int(data.prestige_level),
                updated_at=now,
            )
        )
    else:
        # Auto-create leaderboard entry
        player_result = await db.execute(
            select(Players).where(Players.id == data.player_id)
        )
        player = player_result.scalar_one_or_none()
        nickname = player.nickname if player else f"Player_{data.player_id}"
        lb_entry = Leaderboard_entries(
            user_id=f"local_{nickname.lower()}",
            player_id=data.player_id,
            nickname=nickname,
            total_won=safe_float(data.total_won),
            level=safe_int(data.level, 1),
            prestige_level=safe_int(data.prestige_level),
            updated_at=now,
        )
        db.add(lb_entry)

    await db.commit()
    return {"status": "ok"}


@router.post("/progress/save")
async def save_progress(data: SaveProgressRequest, db: AsyncSession = Depends(get_db)):
    """Save player progress (JSON endpoint)."""
    try:
        return await _do_save_progress(data, db)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Save progress error for player {data.player_id}: {e}", exc_info=True)
        try:
            await db.rollback()
        except Exception:
            pass
        raise HTTPException(status_code=500, detail="Failed to save progress")


@router.post("/progress/beacon")
async def save_progress_beacon(request: Request, db: AsyncSession = Depends(get_db)):
    """Save player progress via sendBeacon (handles text/plain content type)."""
    try:
        body = await request.body()
        if not body:
            return {"status": "empty"}
        raw = json.loads(body)
        data = SaveProgressRequest(**raw)
        return await _do_save_progress(data, db)
    except json.JSONDecodeError:
        logger.warning("Beacon: invalid JSON")
        return {"status": "invalid_json"}
    except Exception as e:
        logger.error(f"Beacon save error: {e}", exc_info=True)
        try:
            await db.rollback()
        except Exception:
            pass
        return {"status": "error"}


# ==================== LEADERBOARD ====================

@router.get("/leaderboard", response_model=List[LeaderboardEntry])
async def get_leaderboard(db: AsyncSession = Depends(get_db)):
    """Get top 50 players by total_won."""
    try:
        result = await db.execute(
            select(Leaderboard_entries)
            .order_by(desc(Leaderboard_entries.total_won))
            .limit(50)
        )
        entries = result.scalars().all()
        return [
            LeaderboardEntry(
                nickname=e.nickname or "???",
                total_won=safe_float(e.total_won),
                level=safe_int(e.level, 1),
                prestige_level=safe_int(e.prestige_level),
            )
            for e in entries
        ]
    except Exception as e:
        logger.error(f"Leaderboard error: {e}", exc_info=True)
        return []


# ==================== DELETE ACCOUNT ====================

@router.delete("/account/{player_id}")
async def delete_account(player_id: int, db: AsyncSession = Depends(get_db)):
    """Delete a player account and all associated data."""
    try:
        # Delete leaderboard entry
        await db.execute(
            select(Leaderboard_entries).where(Leaderboard_entries.player_id == player_id)
        )
        from sqlalchemy import delete as sql_delete
        await db.execute(sql_delete(Leaderboard_entries).where(Leaderboard_entries.player_id == player_id))
        await db.execute(sql_delete(Player_progress).where(Player_progress.player_id == player_id))
        await db.execute(sql_delete(Players).where(Players.id == player_id))
        await db.commit()
        return {"status": "deleted"}
    except Exception as e:
        logger.error(f"Delete account error for player {player_id}: {e}", exc_info=True)
        try:
            await db.rollback()
        except Exception:
            pass
        raise HTTPException(status_code=500, detail="Failed to delete account")