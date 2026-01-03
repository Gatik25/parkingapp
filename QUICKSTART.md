# 🚀 Quick Start Guide - Real-Time Violation Monitoring

Get the Smart Municipal Parking Enforcement System running in minutes!

## Prerequisites Check

Before starting, ensure you have:
- [ ] Python 3.9+ (`python --version`)
- [ ] Node.js 18+ (`node --version`)
- [ ] PostgreSQL 14+ (`psql --version`)
- [ ] Git (`git --version`)

## 5-Minute Setup

### Step 1: Database Setup (2 minutes)

```bash
# Start PostgreSQL (if not running)
# macOS: brew services start postgresql
# Linux: sudo service postgresql start
# Windows: Start PostgreSQL service from Services

# Create database
createdb parking_db

# Verify database exists
psql -l | grep parking_db
```

### Step 2: Backend Setup (2 minutes)

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate it
source venv/bin/activate  # macOS/Linux
# venv\Scripts\activate   # Windows

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env

# Seed sample data
python seed_data.py

# Start backend server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Backend will be running at: **http://localhost:8000**  
API Documentation: **http://localhost:8000/docs**

### Step 3: Frontend Setup (1 minute)

**Open a new terminal:**

```bash
cd frontend

# Install dependencies
npm install

# Configure environment (optional - defaults work)
cp .env.example .env

# Start development server
npm run dev
```

Frontend will be running at: **http://localhost:3000**

## ✅ Verify Installation

### Backend Check
Visit http://localhost:8000/docs - You should see the FastAPI Swagger UI

### Frontend Check
Visit http://localhost:3000 - You should see the Violations Dashboard

### WebSocket Check
Open browser console and look for: `WebSocket connected`

## 🎯 Quick Tour

### 1. View Violations (Main Screen)
- See all active violations
- Notice statistics cards at the top (Open, Critical, Total)
- Observe the pulsing animation on critical violations (>110% occupancy)

### 2. Filter Violations
- Click on "Status" dropdown → Select "OPEN"
- Try sorting by "Severity" to see worst violations first
- Use date range filters for specific time periods

### 3. View Details
- Click "View Details" on any violation
- Explore the 24-hour occupancy history chart
- Notice reference lines at 100% (legal) and 110% (critical)

### 4. Manage Violations
- Click "Acknowledge" to mark as being reviewed
- Add notes in the modal
- Click "Mark Resolved" to close the violation

### 5. Test Real-Time Updates
- Open http://localhost:8000/docs
- Find POST `/api/v1/violations/`
- Create a new violation:
  ```json
  {
    "parking_lot_id": 1,
    "occupancy_percentage": 118.0,
    "occupancy_count": 118,
    "legal_capacity": 100
  }
  ```
- Watch it appear instantly in the UI! 🎉

### 6. Multi-User Simulation
- Open two browser windows side-by-side
- Acknowledge a violation in one window
- Watch it update in the other window automatically

## 📊 Sample Data Included

The seed script creates:
- **5 Parking Lots** with different capacities
- **3-4 Violations** including:
  - Open violations (needs attention)
  - Resolved violations (historical)
  - Critical violations (>110% occupancy)

## 🛠️ Troubleshooting

### Backend won't start
```bash
# Check if port 8000 is in use
lsof -i :8000  # macOS/Linux
netstat -ano | findstr :8000  # Windows

# Kill process if needed
kill -9 <PID>  # macOS/Linux
```

### Frontend won't start
```bash
# Check if port 3000 is in use
lsof -i :3000  # macOS/Linux

# Or run on different port
npm run dev -- --port 3001
```

### Database connection error
```bash
# Check PostgreSQL is running
pg_isready

# Check database exists
psql -l | grep parking_db

# Verify .env file has correct DATABASE_URL
cat backend/.env
```

### WebSocket not connecting
- Check backend is running on port 8000
- Open browser DevTools → Console
- Look for WebSocket error messages
- Verify proxy settings in `frontend/vite.config.js`

## 🎓 Next Steps

1. **Read the Docs**
   - `README.md` - Project overview
   - `DEVELOPMENT.md` - Detailed development guide
   - `IMPLEMENTATION_SUMMARY.md` - Complete feature list

2. **Explore the API**
   - Visit http://localhost:8000/docs
   - Try creating violations
   - Test different filters and sorts

3. **Customize**
   - Add more parking lots via API
   - Create violations with different severities
   - Experiment with the filters

4. **Develop**
   - Check `DEVELOPMENT.md` for architecture
   - Review code structure
   - Start building new features!

## 📝 Common Tasks

### Create a new parking lot
```bash
curl -X POST http://localhost:8000/api/v1/parking-lots/ \
  -H "Content-Type: application/json" \
  -d '{
    "name": "New Test Lot",
    "location": "123 Test St",
    "legal_capacity": 150,
    "current_occupancy": 120
  }'
```

### Query violations by status
```bash
curl "http://localhost:8000/api/v1/violations/?status=OPEN"
```

### Get violation stats
```bash
curl http://localhost:8000/api/v1/violations/stats/count
```

## 🎉 You're Ready!

The system is now fully functional. Explore the features, test real-time updates, and start developing!

**Questions?** Check `DEVELOPMENT.md` or the API docs at `/docs`

---

**Enjoy building the future of smart parking! 🚗💨**
