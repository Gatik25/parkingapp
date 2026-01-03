# Smart Municipal Parking Enforcement System

A full-stack, IoT-integrated parking management platform for Municipal Corporations to eliminate contractor fraud, prevent overparking, and ensure real-time contractual compliance.

## Features

### Real-Time Violation Monitoring
- **Live Violations Dashboard**: View all active parking violations in real-time
- **WebSocket Integration**: Instant updates when new violations are detected
- **Critical Alerts**: Visual highlighting for violations exceeding 110% capacity
- **Status Management**: Acknowledge and resolve violations with full audit trail
- **Filtering & Sorting**: Filter by status, lot, date range; sort by newest, severity, or lot name

### Violation Details
- **Comprehensive Information**: Full violation data including occupancy, timestamps, and location
- **Historical Charts**: 24-hour occupancy history with capacity reference lines
- **Evidence Management**: Support for evidence reports and photo uploads
- **Notes & Comments**: Add detailed notes to violations for documentation
- **Status Updates**: Track acknowledgment and resolution with user attribution

### Real-Time Updates
- **WebSocket Connection**: `/api/v1/violations/ws` endpoint for live updates
- **Automatic Reconnection**: Built-in reconnection logic with exponential backoff
- **Badge Notifications**: Real-time count of open and critical violations

## Tech Stack

### Backend
- **Framework**: FastAPI (Python)
- **Database**: PostgreSQL with SQLAlchemy ORM
- **Real-Time**: WebSockets for live violation updates
- **API Design**: RESTful API with OpenAPI documentation

### Frontend
- **Framework**: React 18 with Vite
- **UI Components**: Custom components with Lucide React icons
- **Charts**: Recharts for occupancy history visualization
- **State Management**: React Hooks with custom hooks for WebSocket integration
- **Styling**: Pure CSS with CSS variables for theming

## Project Structure

```
/backend
  /app
    /api/v1/endpoints
      - violations.py        # Violation CRUD and WebSocket endpoints
      - parking_lots.py      # Parking lot endpoints
    /core
      - config.py           # Configuration settings
      - websocket.py        # WebSocket connection manager
    /db
      - base.py             # Database connection and session
    /models
      - violation.py        # Violation SQLAlchemy model
      - parking_lot.py      # Parking lot SQLAlchemy model
    /schemas
      - violation.py        # Pydantic schemas
    - main.py              # FastAPI application entry point
  - requirements.txt       # Python dependencies
  - seed_data.py          # Database seeding script

/frontend
  /src
    /components/violations
      - ViolationsList.jsx          # Main violations view
      - ViolationListItem.jsx       # Individual violation card
      - ViolationDetailsModal.jsx   # Detailed violation view with charts
      - ViolationFilters.jsx        # Filter and sort controls
    /services
      - api.js              # Axios API client
      - websocket.js        # WebSocket service
    /hooks
      - useViolations.js    # Custom hook for violation management
    - App.jsx              # Main application component
    - App.css              # Application styles
    - main.jsx             # React entry point
  - package.json           # Node dependencies
  - vite.config.js         # Vite configuration
```

## Installation & Setup

### Prerequisites
- Python 3.9+
- Node.js 18+
- PostgreSQL 14+

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Create and activate virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Create `.env` file:
```bash
cp .env.example .env
```

5. Update database connection in `.env`:
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/parking_db
```

6. Create database:
```bash
createdb parking_db
```

7. Seed initial data:
```bash
python seed_data.py
```

8. Run the backend:
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

API will be available at: http://localhost:8000
API Documentation: http://localhost:8000/docs

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```bash
cp .env.example .env
```

4. Run the development server:
```bash
npm run dev
```

Frontend will be available at: http://localhost:3000

## API Endpoints

### Violations

- `GET /api/v1/violations/` - List violations with filtering and sorting
  - Query params: `status`, `lot_id`, `from_date`, `to_date`, `sort_by`, `skip`, `limit`
- `GET /api/v1/violations/{id}` - Get violation details
- `PATCH /api/v1/violations/{id}` - Update violation status/notes
- `POST /api/v1/violations/` - Create new violation
- `GET /api/v1/violations/stats/count` - Get open and critical violation counts
- `WS /api/v1/violations/ws` - WebSocket for real-time updates

### Parking Lots

- `GET /api/v1/parking-lots/{id}/occupancy-history` - Get 24-hour occupancy history
  - Query params: `hours` (default: 24)

## WebSocket Events

### Connection
```javascript
const ws = new WebSocket('ws://localhost:8000/api/v1/violations/ws');
```

### Event Types

**New Violation:**
```json
{
  "type": "violation_update",
  "data": { /* violation object */ },
  "timestamp": "2024-01-01T12:00:00"
}
```

**Status Update:**
```json
{
  "type": "violation_status_update",
  "violation_id": 1,
  "status": "ACKNOWLEDGED",
  "data": { /* updated violation object */ },
  "timestamp": "2024-01-01T12:00:00"
}
```

## Usage

### Viewing Violations

1. Open the application at http://localhost:3000
2. The main dashboard shows all active violations
3. Use filters to narrow down by status, date, or sort preferences
4. Statistics cards show open and critical violation counts

### Managing Violations

1. **Acknowledge**: Click "Acknowledge" to mark a violation as being reviewed
2. **View Details**: Click "View Details" to see:
   - Full violation information
   - 24-hour occupancy history chart
   - Evidence reports and photos
   - Add notes or comments
3. **Resolve**: Click "Mark Resolved" to close the violation

### Real-Time Updates

- New violations automatically appear at the top of the list
- Status changes made by other users update instantly
- Badge counters update in real-time
- Critical violations (>110% occupancy) pulse for attention

## Acceptance Criteria ✅

- ✅ Violations list displays all active violations
- ✅ Real-time WebSocket updates add new violations immediately
- ✅ Administrators can update violation status
- ✅ Violation details are comprehensive and easy to understand
- ✅ Status changes are reflected immediately
- ✅ Critical violations (>110%) are visually highlighted
- ✅ Filtering and sorting work correctly

## Future Enhancements

- Authentication and role-based access control
- Email/SMS notifications for critical violations
- Evidence file upload functionality
- Mobile app (React Native)
- Integration with IoT sensors and ANPR cameras
- Blockchain ledger for immutable records
- Advanced analytics and reporting
- Enforcement officer mobile app

## License

Copyright © 2024 Municipal Corporation. All rights reserved.
