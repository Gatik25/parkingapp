# Development Guide

## Quick Start

### Option 1: Using Docker (Recommended - Coming Soon)
```bash
docker-compose up
```

### Option 2: Manual Setup

**Terminal 1 - Backend:**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your database credentials
python seed_data.py
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

**Terminal 3 - PostgreSQL (if not running):**
```bash
# MacOS with Homebrew
brew services start postgresql

# Ubuntu/Debian
sudo service postgresql start

# Create database
createdb parking_db
```

## Development Workflow

### Creating a New Violation (for testing)

Use the API documentation at http://localhost:8000/docs

```bash
curl -X POST "http://localhost:8000/api/v1/violations/" \
  -H "Content-Type: application/json" \
  -d '{
    "parking_lot_id": 1,
    "occupancy_percentage": 115.5,
    "occupancy_count": 115,
    "legal_capacity": 100
  }'
```

### Testing WebSocket Connection

```javascript
const ws = new WebSocket('ws://localhost:8000/api/v1/violations/ws');

ws.onopen = () => console.log('Connected');
ws.onmessage = (event) => console.log('Received:', JSON.parse(event.data));
ws.onerror = (error) => console.error('Error:', error);
```

## Architecture

### Backend Architecture
- **FastAPI**: ASGI web framework for building APIs
- **SQLAlchemy**: ORM for database interactions
- **Pydantic**: Data validation using Python type annotations
- **WebSockets**: Real-time bidirectional communication
- **PostgreSQL**: Relational database with ACID compliance

### Frontend Architecture
- **React**: Component-based UI library
- **Vite**: Fast build tool and dev server
- **Axios**: Promise-based HTTP client
- **Recharts**: Composable charting library
- **WebSocket API**: Native browser WebSocket support

### Data Flow
1. **Entry/Exit Events** → IoT Sensors/ANPR → Backend API
2. **Violation Detection** → Capacity Check → Create Violation
3. **WebSocket Broadcast** → All Connected Clients → UI Update
4. **Admin Action** → Frontend → API PATCH → Database Update → WebSocket Broadcast

## Database Schema

### parking_lots
- `id`: Primary key
- `name`: Lot name
- `location`: Physical address
- `latitude`, `longitude`: GPS coordinates
- `legal_capacity`: Maximum allowed vehicles
- `current_occupancy`: Current vehicle count
- `is_active`: Operational status
- `created_at`, `updated_at`: Timestamps

### violations
- `id`: Primary key
- `parking_lot_id`: Foreign key to parking_lots
- `occupancy_percentage`: Capacity percentage when detected
- `occupancy_count`: Vehicle count when detected
- `legal_capacity`: Capacity limit (denormalized for audit)
- `status`: OPEN, ACKNOWLEDGED, RESOLVED
- `detected_at`: When violation was detected
- `acknowledged_at`, `acknowledged_by`: Acknowledgment info
- `resolved_at`, `resolved_by`: Resolution info
- `notes`: Admin notes
- `evidence_report_url`: Link to evidence report
- `photo_evidence_url`: Link to photo evidence

## API Design Principles

### RESTful Endpoints
- **GET**: Retrieve resources (safe, idempotent)
- **POST**: Create new resources
- **PATCH**: Partial updates (preferred over PUT)
- **DELETE**: Remove resources (not implemented for violations - audit trail)

### Response Format
```json
{
  "id": 1,
  "field": "value",
  "nested": {
    "field": "value"
  }
}
```

### Error Format
```json
{
  "detail": "Error message"
}
```

## WebSocket Protocol

### Client → Server
- Keep-alive: Empty text messages
- No commands implemented yet

### Server → Client

**New Violation:**
```json
{
  "type": "violation_update",
  "data": { /* ViolationResponse */ },
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

**Status Update:**
```json
{
  "type": "violation_status_update",
  "violation_id": 1,
  "status": "ACKNOWLEDGED",
  "data": { /* ViolationResponse */ },
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

## Testing

### Backend Testing (Coming Soon)
```bash
pytest
pytest --cov=app tests/
```

### Frontend Testing (Coming Soon)
```bash
npm test
npm run test:coverage
```

### Manual Testing Checklist
- [ ] List violations with different filters
- [ ] Sort violations by newest, severity, lot name
- [ ] View violation details
- [ ] Acknowledge violation
- [ ] Resolve violation
- [ ] Add notes to violation
- [ ] WebSocket connection establishes
- [ ] New violations appear in real-time
- [ ] Status updates reflect immediately
- [ ] Critical violations are highlighted
- [ ] Occupancy chart displays correctly

## Code Style

### Python (Backend)
- Follow PEP 8
- Use type hints
- Maximum line length: 120 characters
- Use meaningful variable names
- Document complex functions with docstrings

### JavaScript/React (Frontend)
- Use functional components with hooks
- Follow React best practices
- Use meaningful component and variable names
- Keep components focused and small
- Extract reusable logic into custom hooks

## Performance Considerations

### Backend
- Database query optimization with `joinedload`
- Pagination for large result sets
- WebSocket connection pooling
- Async/await for I/O operations

### Frontend
- React.memo for expensive components
- useCallback for function memoization
- Debounce filter inputs
- Lazy loading for modal content
- WebSocket reconnection with backoff

## Security Considerations (Future)
- [ ] Authentication (JWT tokens)
- [ ] Role-based access control
- [ ] Rate limiting
- [ ] Input validation
- [ ] SQL injection prevention (using ORM)
- [ ] XSS prevention (React escapes by default)
- [ ] CORS configuration
- [ ] WebSocket authentication

## Deployment (Coming Soon)
- Docker containers
- Docker Compose for local development
- Kubernetes for production
- CI/CD pipeline with GitHub Actions
- Environment-specific configurations

## Troubleshooting

### Backend won't start
- Check PostgreSQL is running: `pg_isready`
- Verify database exists: `psql -l | grep parking_db`
- Check .env file has correct DATABASE_URL
- Ensure all dependencies installed: `pip install -r requirements.txt`

### Frontend won't connect to backend
- Verify backend is running on port 8000
- Check CORS settings in backend/app/main.py
- Inspect browser console for errors
- Verify .env has correct API URLs

### WebSocket disconnects
- Check network connectivity
- Verify WebSocket endpoint is correct
- Look for errors in browser console
- Check backend logs for WebSocket errors

### Database migrations (Future)
```bash
alembic revision --autogenerate -m "description"
alembic upgrade head
```

## Contributing

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make your changes
3. Test thoroughly
4. Commit with descriptive messages
5. Push and create a pull request

## Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [React Documentation](https://react.dev/)
- [SQLAlchemy Documentation](https://docs.sqlalchemy.org/)
- [WebSocket API](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
- [Recharts Documentation](https://recharts.org/)
