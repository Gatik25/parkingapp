from sqlalchemy import Column, Integer, String, Float, DateTime, Text, ForeignKey, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.db.base import Base


class ViolationStatus(str, enum.Enum):
    OPEN = "OPEN"
    ACKNOWLEDGED = "ACKNOWLEDGED"
    RESOLVED = "RESOLVED"


class Violation(Base):
    __tablename__ = "violations"
    
    id = Column(Integer, primary_key=True, index=True)
    parking_lot_id = Column(Integer, ForeignKey("parking_lots.id"), nullable=False)
    occupancy_percentage = Column(Float, nullable=False)
    occupancy_count = Column(Integer, nullable=False)
    legal_capacity = Column(Integer, nullable=False)
    status = Column(Enum(ViolationStatus), default=ViolationStatus.OPEN, index=True)
    detected_at = Column(DateTime, default=datetime.utcnow, index=True)
    acknowledged_at = Column(DateTime, nullable=True)
    resolved_at = Column(DateTime, nullable=True)
    notes = Column(Text, nullable=True)
    evidence_report_url = Column(String, nullable=True)
    photo_evidence_url = Column(String, nullable=True)
    acknowledged_by = Column(String, nullable=True)
    resolved_by = Column(String, nullable=True)
    
    parking_lot = relationship("ParkingLot", back_populates="violations")
    
    @property
    def is_critical(self):
        return self.occupancy_percentage > 110
