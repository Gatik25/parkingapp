from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.base import Base


class ParkingLot(Base):
    __tablename__ = "parking_lots"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    location = Column(String, nullable=False)
    latitude = Column(Float)
    longitude = Column(Float)
    legal_capacity = Column(Integer, nullable=False)
    current_occupancy = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    violations = relationship("Violation", back_populates="parking_lot")
    
    @property
    def occupancy_percentage(self):
        if self.legal_capacity == 0:
            return 0
        return (self.current_occupancy / self.legal_capacity) * 100
