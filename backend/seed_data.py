from sqlalchemy.orm import Session
from app.db.base import SessionLocal, engine, Base
from app.models.parking_lot import ParkingLot
from app.models.violation import Violation, ViolationStatus
from datetime import datetime, timedelta
import random

Base.metadata.create_all(bind=engine)


def seed_data():
    db = SessionLocal()
    
    try:
        existing_lots = db.query(ParkingLot).count()
        if existing_lots > 0:
            print("Database already seeded. Skipping...")
            return
        
        print("Seeding parking lots...")
        parking_lots = [
            ParkingLot(
                name="Central Market Parking",
                location="123 Market Street, Delhi",
                latitude=28.6139,
                longitude=77.2090,
                legal_capacity=100,
                current_occupancy=115,
                is_active=True
            ),
            ParkingLot(
                name="Railway Station Lot",
                location="456 Station Road, Delhi",
                latitude=28.6412,
                longitude=77.2177,
                legal_capacity=150,
                current_occupancy=145,
                is_active=True
            ),
            ParkingLot(
                name="Shopping Mall Parking",
                location="789 Mall Avenue, Delhi",
                latitude=28.5355,
                longitude=77.3910,
                legal_capacity=200,
                current_occupancy=225,
                is_active=True
            ),
            ParkingLot(
                name="City Hospital Parking",
                location="321 Hospital Lane, Delhi",
                latitude=28.6692,
                longitude=77.4538,
                legal_capacity=80,
                current_occupancy=70,
                is_active=True
            ),
            ParkingLot(
                name="Government Office Lot",
                location="654 Admin Block, Delhi",
                latitude=28.6129,
                longitude=77.2295,
                legal_capacity=120,
                current_occupancy=135,
                is_active=True
            ),
        ]
        
        db.add_all(parking_lots)
        db.commit()
        
        print("Seeding violations...")
        violations = []
        
        for lot in parking_lots:
            if lot.occupancy_percentage > 105:
                occupancy_pct = lot.occupancy_percentage
                
                violation = Violation(
                    parking_lot_id=lot.id,
                    occupancy_percentage=occupancy_pct,
                    occupancy_count=lot.current_occupancy,
                    legal_capacity=lot.legal_capacity,
                    status=ViolationStatus.OPEN,
                    detected_at=datetime.utcnow() - timedelta(minutes=random.randint(5, 180))
                )
                violations.append(violation)
                
                if random.random() > 0.5:
                    old_violation = Violation(
                        parking_lot_id=lot.id,
                        occupancy_percentage=occupancy_pct + random.uniform(-5, 5),
                        occupancy_count=lot.current_occupancy + random.randint(-10, 10),
                        legal_capacity=lot.legal_capacity,
                        status=ViolationStatus.RESOLVED,
                        detected_at=datetime.utcnow() - timedelta(hours=random.randint(24, 72)),
                        resolved_at=datetime.utcnow() - timedelta(hours=random.randint(1, 24)),
                        resolved_by="Admin User",
                        notes="Situation resolved after enforcement action."
                    )
                    violations.append(old_violation)
        
        db.add_all(violations)
        db.commit()
        
        print(f"✅ Successfully seeded {len(parking_lots)} parking lots and {len(violations)} violations")
        
    except Exception as e:
        print(f"❌ Error seeding data: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    seed_data()
