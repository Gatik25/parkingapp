from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.db.base import get_db
from app.models.parking_lot import ParkingLot
from pydantic import BaseModel
from datetime import datetime

router = APIRouter()


class OccupancyHistoryPoint(BaseModel):
    timestamp: datetime
    occupancy: int
    occupancy_percentage: float


class OccupancyHistoryResponse(BaseModel):
    parking_lot_id: int
    parking_lot_name: str
    history: List[OccupancyHistoryPoint]


@router.get("/{lot_id}/occupancy-history", response_model=OccupancyHistoryResponse)
def get_occupancy_history(
    lot_id: int,
    hours: int = 24,
    db: Session = Depends(get_db)
):
    parking_lot = db.query(ParkingLot).filter(ParkingLot.id == lot_id).first()
    
    if not parking_lot:
        raise HTTPException(status_code=404, detail="Parking lot not found")
    
    history = []
    current_time = datetime.utcnow()
    
    for i in range(hours):
        from datetime import timedelta
        timestamp = current_time - timedelta(hours=hours-i)
        import random
        occupancy = random.randint(int(parking_lot.legal_capacity * 0.7), int(parking_lot.legal_capacity * 1.15))
        occupancy_pct = (occupancy / parking_lot.legal_capacity) * 100
        
        history.append(OccupancyHistoryPoint(
            timestamp=timestamp,
            occupancy=occupancy,
            occupancy_percentage=occupancy_pct
        ))
    
    return OccupancyHistoryResponse(
        parking_lot_id=parking_lot.id,
        parking_lot_name=parking_lot.name,
        history=history
    )
