import json
import logging
from typing import List, Optional

from datetime import datetime, date

from fastapi import APIRouter, Body, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from services.player_progress import Player_progressService
from dependencies.auth import get_current_user
from schemas.auth import UserResponse

# Set up logging
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/entities/player_progress", tags=["player_progress"])


# ---------- Pydantic Schemas ----------
class Player_progressData(BaseModel):
    """Entity data schema (for create/update)"""
    player_id: int
    balance: float = None
    level: int = None
    xp: int = None
    total_drops: int = None
    total_won: float = None
    total_spent: float = None
    biggest_win: float = None
    tap_count: int = None
    combo_count: int = None
    max_combo: int = None
    consecutive_losses: int = None
    prestige_level: int = None
    selected_skin: str = None
    selected_theme: str = None
    owned_skins: str = None
    owned_themes: str = None
    active_boosters: str = None
    shop_purchases: int = None
    achievements: str = None
    daily_challenges: str = None
    weekly_challenges: str = None
    last_daily_bonus: Optional[datetime] = None
    last_hourly_bonus: Optional[datetime] = None
    last_wheel_spin: Optional[datetime] = None
    login_streak: int = None
    last_login_date: str = None
    updated_at: Optional[datetime] = None


class Player_progressUpdateData(BaseModel):
    """Update entity data (partial updates allowed)"""
    player_id: Optional[int] = None
    balance: Optional[float] = None
    level: Optional[int] = None
    xp: Optional[int] = None
    total_drops: Optional[int] = None
    total_won: Optional[float] = None
    total_spent: Optional[float] = None
    biggest_win: Optional[float] = None
    tap_count: Optional[int] = None
    combo_count: Optional[int] = None
    max_combo: Optional[int] = None
    consecutive_losses: Optional[int] = None
    prestige_level: Optional[int] = None
    selected_skin: Optional[str] = None
    selected_theme: Optional[str] = None
    owned_skins: Optional[str] = None
    owned_themes: Optional[str] = None
    active_boosters: Optional[str] = None
    shop_purchases: Optional[int] = None
    achievements: Optional[str] = None
    daily_challenges: Optional[str] = None
    weekly_challenges: Optional[str] = None
    last_daily_bonus: Optional[datetime] = None
    last_hourly_bonus: Optional[datetime] = None
    last_wheel_spin: Optional[datetime] = None
    login_streak: Optional[int] = None
    last_login_date: Optional[str] = None
    updated_at: Optional[datetime] = None


class Player_progressResponse(BaseModel):
    """Entity response schema"""
    id: int
    user_id: str
    player_id: int
    balance: Optional[float] = None
    level: Optional[int] = None
    xp: Optional[int] = None
    total_drops: Optional[int] = None
    total_won: Optional[float] = None
    total_spent: Optional[float] = None
    biggest_win: Optional[float] = None
    tap_count: Optional[int] = None
    combo_count: Optional[int] = None
    max_combo: Optional[int] = None
    consecutive_losses: Optional[int] = None
    prestige_level: Optional[int] = None
    selected_skin: Optional[str] = None
    selected_theme: Optional[str] = None
    owned_skins: Optional[str] = None
    owned_themes: Optional[str] = None
    active_boosters: Optional[str] = None
    shop_purchases: Optional[int] = None
    achievements: Optional[str] = None
    daily_challenges: Optional[str] = None
    weekly_challenges: Optional[str] = None
    last_daily_bonus: Optional[datetime] = None
    last_hourly_bonus: Optional[datetime] = None
    last_wheel_spin: Optional[datetime] = None
    login_streak: Optional[int] = None
    last_login_date: Optional[str] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class Player_progressListResponse(BaseModel):
    """List response schema"""
    items: List[Player_progressResponse]
    total: int
    skip: int
    limit: int


class Player_progressBatchCreateRequest(BaseModel):
    """Batch create request"""
    items: List[Player_progressData]


class Player_progressBatchUpdateItem(BaseModel):
    """Batch update item"""
    id: int
    updates: Player_progressUpdateData


class Player_progressBatchUpdateRequest(BaseModel):
    """Batch update request"""
    items: List[Player_progressBatchUpdateItem]


class Player_progressBatchDeleteRequest(BaseModel):
    """Batch delete request"""
    ids: List[int]


# ---------- Routes ----------
@router.get("", response_model=Player_progressListResponse)
async def query_player_progresss(
    query: str = Query(None, description="Query conditions (JSON string)"),
    sort: str = Query(None, description="Sort field (prefix with '-' for descending)"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=2000, description="Max number of records to return"),
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Query player_progresss with filtering, sorting, and pagination (user can only see their own records)"""
    logger.debug(f"Querying player_progresss: query={query}, sort={sort}, skip={skip}, limit={limit}, fields={fields}")
    
    service = Player_progressService(db)
    try:
        # Parse query JSON if provided
        query_dict = None
        if query:
            try:
                query_dict = json.loads(query)
            except json.JSONDecodeError:
                raise HTTPException(status_code=400, detail="Invalid query JSON format")
        
        result = await service.get_list(
            skip=skip, 
            limit=limit,
            query_dict=query_dict,
            sort=sort,
            user_id=str(current_user.id),
        )
        logger.debug(f"Found {result['total']} player_progresss")
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error querying player_progresss: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/all", response_model=Player_progressListResponse)
async def query_player_progresss_all(
    query: str = Query(None, description="Query conditions (JSON string)"),
    sort: str = Query(None, description="Sort field (prefix with '-' for descending)"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=2000, description="Max number of records to return"),
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    db: AsyncSession = Depends(get_db),
):
    # Query player_progresss with filtering, sorting, and pagination without user limitation
    logger.debug(f"Querying player_progresss: query={query}, sort={sort}, skip={skip}, limit={limit}, fields={fields}")

    service = Player_progressService(db)
    try:
        # Parse query JSON if provided
        query_dict = None
        if query:
            try:
                query_dict = json.loads(query)
            except json.JSONDecodeError:
                raise HTTPException(status_code=400, detail="Invalid query JSON format")

        result = await service.get_list(
            skip=skip,
            limit=limit,
            query_dict=query_dict,
            sort=sort
        )
        logger.debug(f"Found {result['total']} player_progresss")
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error querying player_progresss: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/{id}", response_model=Player_progressResponse)
async def get_player_progress(
    id: int,
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a single player_progress by ID (user can only see their own records)"""
    logger.debug(f"Fetching player_progress with id: {id}, fields={fields}")
    
    service = Player_progressService(db)
    try:
        result = await service.get_by_id(id, user_id=str(current_user.id))
        if not result:
            logger.warning(f"Player_progress with id {id} not found")
            raise HTTPException(status_code=404, detail="Player_progress not found")
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching player_progress {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("", response_model=Player_progressResponse, status_code=201)
async def create_player_progress(
    data: Player_progressData,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new player_progress"""
    logger.debug(f"Creating new player_progress with data: {data}")
    
    service = Player_progressService(db)
    try:
        result = await service.create(data.model_dump(), user_id=str(current_user.id))
        if not result:
            raise HTTPException(status_code=400, detail="Failed to create player_progress")
        
        logger.info(f"Player_progress created successfully with id: {result.id}")
        return result
    except ValueError as e:
        logger.error(f"Validation error creating player_progress: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating player_progress: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("/batch", response_model=List[Player_progressResponse], status_code=201)
async def create_player_progresss_batch(
    request: Player_progressBatchCreateRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create multiple player_progresss in a single request"""
    logger.debug(f"Batch creating {len(request.items)} player_progresss")
    
    service = Player_progressService(db)
    results = []
    
    try:
        for item_data in request.items:
            result = await service.create(item_data.model_dump(), user_id=str(current_user.id))
            if result:
                results.append(result)
        
        logger.info(f"Batch created {len(results)} player_progresss successfully")
        return results
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch create: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch create failed: {str(e)}")


@router.put("/batch", response_model=List[Player_progressResponse])
async def update_player_progresss_batch(
    request: Player_progressBatchUpdateRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update multiple player_progresss in a single request (requires ownership)"""
    logger.debug(f"Batch updating {len(request.items)} player_progresss")
    
    service = Player_progressService(db)
    results = []
    
    try:
        for item in request.items:
            # Only include non-None values for partial updates
            update_dict = {k: v for k, v in item.updates.model_dump().items() if v is not None}
            result = await service.update(item.id, update_dict, user_id=str(current_user.id))
            if result:
                results.append(result)
        
        logger.info(f"Batch updated {len(results)} player_progresss successfully")
        return results
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch update: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch update failed: {str(e)}")


@router.put("/{id}", response_model=Player_progressResponse)
async def update_player_progress(
    id: int,
    data: Player_progressUpdateData,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update an existing player_progress (requires ownership)"""
    logger.debug(f"Updating player_progress {id} with data: {data}")

    service = Player_progressService(db)
    try:
        # Only include non-None values for partial updates
        update_dict = {k: v for k, v in data.model_dump().items() if v is not None}
        result = await service.update(id, update_dict, user_id=str(current_user.id))
        if not result:
            logger.warning(f"Player_progress with id {id} not found for update")
            raise HTTPException(status_code=404, detail="Player_progress not found")
        
        logger.info(f"Player_progress {id} updated successfully")
        return result
    except HTTPException:
        raise
    except ValueError as e:
        logger.error(f"Validation error updating player_progress {id}: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error updating player_progress {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.delete("/batch")
async def delete_player_progresss_batch(
    request: Player_progressBatchDeleteRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete multiple player_progresss by their IDs (requires ownership)"""
    logger.debug(f"Batch deleting {len(request.ids)} player_progresss")
    
    service = Player_progressService(db)
    deleted_count = 0
    
    try:
        for item_id in request.ids:
            success = await service.delete(item_id, user_id=str(current_user.id))
            if success:
                deleted_count += 1
        
        logger.info(f"Batch deleted {deleted_count} player_progresss successfully")
        return {"message": f"Successfully deleted {deleted_count} player_progresss", "deleted_count": deleted_count}
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch delete: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch delete failed: {str(e)}")


@router.delete("/{id}")
async def delete_player_progress(
    id: int,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a single player_progress by ID (requires ownership)"""
    logger.debug(f"Deleting player_progress with id: {id}")
    
    service = Player_progressService(db)
    try:
        success = await service.delete(id, user_id=str(current_user.id))
        if not success:
            logger.warning(f"Player_progress with id {id} not found for deletion")
            raise HTTPException(status_code=404, detail="Player_progress not found")
        
        logger.info(f"Player_progress {id} deleted successfully")
        return {"message": "Player_progress deleted successfully", "id": id}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting player_progress {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")