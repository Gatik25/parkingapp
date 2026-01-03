from fastapi import APIRouter, Depends, HTTPException, Query, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import desc, asc
from typing import Optional, List
from datetime import datetime, date
from app.db.base import get_db
from app.models.violation import Violation, ViolationStatus
from app.models.parking_lot import ParkingLot
from app.schemas.violation import (
    ViolationResponse,
    ViolationUpdate,
    ViolationListResponse,
    ViolationCreate
)
from app.core.websocket import manager

router = APIRouter()


@router.get("/", response_model=ViolationListResponse)
def get_violations(
    status: Optional[ViolationStatus] = None,
    lot_id: Optional[int] = None,
    from_date: Optional[date] = None,
    to_date: Optional[date] = None,
    sort_by: str = Query("newest", regex="^(newest|severity|lot_name)$"),
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    query = db.query(Violation).options(joinedload(Violation.parking_lot))
    
    if status:
        query = query.filter(Violation.status == status)
    
    if lot_id:
        query = query.filter(Violation.parking_lot_id == lot_id)
    
    if from_date:
        query = query.filter(Violation.detected_at >= datetime.combine(from_date, datetime.min.time()))
    
    if to_date:
        query = query.filter(Violation.detected_at <= datetime.combine(to_date, datetime.max.time()))
    
    if sort_by == "newest":
        query = query.order_by(desc(Violation.detected_at))
    elif sort_by == "severity":
        query = query.order_by(desc(Violation.occupancy_percentage))
    elif sort_by == "lot_name":
        query = query.join(ParkingLot).order_by(asc(ParkingLot.name))
    
    total = query.count()
    violations = query.offset(skip).limit(limit).all()
    
    return ViolationListResponse(
        total=total,
        violations=[ViolationResponse.model_validate(v) for v in violations]
    )


@router.get("/{violation_id}", response_model=ViolationResponse)
def get_violation(violation_id: int, db: Session = Depends(get_db)):
    violation = db.query(Violation).options(
        joinedload(Violation.parking_lot)
    ).filter(Violation.id == violation_id).first()
    
    if not violation:
        raise HTTPException(status_code=404, detail="Violation not found")
    
    return ViolationResponse.model_validate(violation)


@router.patch("/{violation_id}", response_model=ViolationResponse)
async def update_violation(
    violation_id: int,
    violation_update: ViolationUpdate,
    db: Session = Depends(get_db)
):
    violation = db.query(Violation).options(
        joinedload(Violation.parking_lot)
    ).filter(Violation.id == violation_id).first()
    
    if not violation:
        raise HTTPException(status_code=404, detail="Violation not found")
    
    update_data = violation_update.model_dump(exclude_unset=True)
    
    if "status" in update_data:
        if update_data["status"] == ViolationStatus.ACKNOWLEDGED and not violation.acknowledged_at:
            violation.acknowledged_at = datetime.utcnow()
        elif update_data["status"] == ViolationStatus.RESOLVED and not violation.resolved_at:
            violation.resolved_at = datetime.utcnow()
    
    for field, value in update_data.items():
        setattr(violation, field, value)
    
    db.commit()
    db.refresh(violation)
    
    violation_response = ViolationResponse.model_validate(violation)
    
    await manager.broadcast_violation_status_update(
        violation_id=violation.id,
        status=violation.status.value,
        violation_data=violation_response.model_dump(mode='json')
    )
    
    return violation_response


@router.post("/", response_model=ViolationResponse, status_code=201)
async def create_violation(
    violation_data: ViolationCreate,
    db: Session = Depends(get_db)
):
    parking_lot = db.query(ParkingLot).filter(
        ParkingLot.id == violation_data.parking_lot_id
    ).first()
    
    if not parking_lot:
        raise HTTPException(status_code=404, detail="Parking lot not found")
    
    violation = Violation(**violation_data.model_dump())
    db.add(violation)
    db.commit()
    db.refresh(violation)
    
    violation = db.query(Violation).options(
        joinedload(Violation.parking_lot)
    ).filter(Violation.id == violation.id).first()
    
    violation_response = ViolationResponse.model_validate(violation)
    
    await manager.broadcast_violation(violation_response.model_dump(mode='json'))
    
    return violation_response


@router.get("/stats/count")
def get_open_violations_count(db: Session = Depends(get_db)):
    open_count = db.query(Violation).filter(
        Violation.status == ViolationStatus.OPEN
    ).count()
    
    critical_count = db.query(Violation).filter(
        Violation.status == ViolationStatus.OPEN,
        Violation.occupancy_percentage > 110
    ).count()
    
    return {
        "open_violations": open_count,
        "critical_violations": critical_count
    }


@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket, "violations")
    try:
        while True:
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
