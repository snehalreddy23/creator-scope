# CreatorScope — Instagram Creator Analytics SaaS

> **Tagline:** Make smarter creator decisions.

CreatorScope is a professional, customer-ready SaaS application designed for influencer marketing agencies, brand campaign managers, and talent representatives to analyze, compare, and audit public Instagram creators with mathematical rigor, data transparency, and reproducible methodology.

---

## Key Features

1. **Profile Intelligence & Auditing:**
   - Input validation accepting Instagram handles (`@natgeo`, `techinsider`) or full URLs (`https://www.instagram.com/natgeo/`).
   - Profile overview displaying followers, verification status, biography, profile link, and category.
   - 10 key metric KPI cards with detailed tooltips and mathematical formulas.
2. **Median & Mean Dissection:**
   - Calculates both arithmetic mean and median likes/views to reveal true typical performance without viral post distortion.
3. **Metric Integrity Taxonomy:**
   - Every metric is explicitly tagged as **Observed**, **Calculated**, **Estimated**, or **Unavailable**.
   - No fabricated private metrics (reach, impressions, saves, demographics).
4. **Side-by-Side Multi-Creator Comparison:**
   - Benchmarks up to 5 creators simultaneously across audience volume, engagement efficiency, and publishing cadence.
   - Highlights benchmark leaders (Highest Engagement, Largest Audience, Most Active Cadence).
5. **Interactive Recharts Visualizations:**
   - Chronological interaction timeline (Likes and Comments across recent sample posts).
   - Reel and video play counts bar chart.
   - Content-type mix distribution (photos, reels, carousels, videos).
6. **Analyzed Posts Table:**
   - Sortable by date, likes, comments, views, and engagement rate.
   - Filterable by media format (All, Reels, Photos, Carousels, Videos).
   - Pagination and outbound links directly to original Instagram posts.
7. **Secure CSV Export:**
   - RFC-4180 compliant CSV export with **CWE-1236 formula injection protection** (sanitizes `=, +, -, @, \t, \r` prefixes).
8. **Printable Executive Brief Report:**
   - Formatted one-click executive audit brief with print-friendly CSS.
9. **Persistence (SQLite):**
   - Save and bookmark creators with tags and custom notes.
10. **Dual Provider Architecture:**
    - Live **GramScraper API** integration.
    - Zero-cost **Deterministic Mock Provider** with rich presets (`natgeo`, `techinsider`, `fitcoach_alex`, `culinary_wanderer`).

---

## Technology Stack

- **Frontend:** React 18, TypeScript 5.9, Vite 5.4, Tailwind CSS 3.4, Recharts, Lucide Icons.
- **Backend:** Python 3.14 / 3.11, FastAPI, Pydantic 2.14, HTTPX, Pytest, Pytest-Asyncio.
- **Persistence:** SQLite (`creatorscope.db`) with zero external infrastructure requirements.
- **Deployment:** Vercel-ready frontend (`vercel.json`) with SPA routing rewrites.

---

## Project Structure

```text
creator-scope/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI application entrypoint & CORS
│   │   ├── core/
│   │   │   ├── config.py        # Environment settings
│   │   │   └── security.py      # SSRF protection & URL/username normalization
│   │   ├── schemas/
│   │   │   ├── instagram.py     # Profile, post, and coverage models
│   │   │   ├── analytics.py     # MetricCard, ProfileAnalytics, and result models
│   │   │   └── comparison.py    # Comparison request and table models
│   │   ├── providers/
│   │   │   ├── base.py          # Abstract provider interface & exceptions
│   │   │   ├── gramscraper.py   # Verified GramScraper live API integration
│   │   │   ├── mock.py          # Deterministic sample dataset provider
│   │   │   └── factory.py       # Provider selector
│   │   ├── analytics/
│   │   │   └── engine.py        # Pure analytics formulas (mean, median, cadence)
│   │   ├── services/
│   │   │   ├── cache.py         # Thread-safe TTL memory cache
│   │   │   ├── export.py        # RFC-4180 CSV export with formula injection defense
│   │   │   └── storage.py       # SQLite persistence for saved creators & history
│   │   └── api/
│   │       └── endpoints.py     # REST routes (/analyze, /compare, /export, /saved)
│   ├── tests/
│   │   ├── test_validation.py   # URL & username validation tests
│   │   ├── test_analytics.py    # Formulas, zero-division, and outlier tests
│   │   ├── test_export.py       # CSV sanitization & formula injection tests
│   │   └── test_api.py          # FastAPI endpoint integration tests
│   ├── requirements.txt
│   └── pytest.ini
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.tsx
│   │   │   ├── MetricCardView.tsx
│   │   │   ├── AnalyticsCharts.tsx
│   │   │   ├── PostTable.tsx
│   │   │   ├── CoverageNotice.tsx
│   │   │   └── ReportModal.tsx
│   │   ├── pages/
│   │   │   ├── LandingPage.tsx
│   │   │   ├── AnalyzePage.tsx
│   │   │   ├── ComparePage.tsx
│   │   │   ├── SavedPage.tsx
│   │   │   └── MethodologyPage.tsx
│   │   ├── services/
│   │   │   └── api.ts           # Typed API client
│   │   ├── types/
│   │   │   └── index.ts         # TypeScript interfaces
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── vercel.json
├── .env.example
├── .gitignore
├── vercel.json
├── COSTS_AND_LIMITS.md
├── PROJECT_STATUS.md
└── README.md
```

---

## Local Development Setup

### 1. Prerequisites
- Python 3.10+ (tested with Python 3.14 & 3.11)
- Node.js 18+ (tested with Node 26.12)
- npm or pnpm

### 2. Environment Configuration
Copy the template to `.env`:
```bash
cp .env.example .env
```
By default, `INSTAGRAM_PROVIDER=mock`, which allows you to run and test all features without requiring third-party API credentials or spending money.

### 3. Backend Setup & Execution
```bash
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run automated tests
pytest -v

# Start FastAPI server on port 8000
python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
API Documentation will be available at:
- Swagger UI: `http://localhost:8000/docs`
- Health check: `http://localhost:8000/health`

### 4. Frontend Setup & Execution
In a new terminal:
```bash
cd frontend

# Install dependencies
npm install

# Start Vite development server
npm run dev
```
Open your browser to: `http://localhost:5173`

---

## Running Automated Tests

Run the backend test suite:
```bash
cd backend
PYTHONPATH=. pytest -v
```
To run frontend type-checking and production build verification:
```bash
cd frontend
npm run build
```

---

## Configuring Live GramScraper Data

If you have a GramScraper account and API key:
1. Obtain an API key from [gramscraper.com](https://gramscraper.com) (100 free credits included on signup).
2. Edit `.env` or set environment variables:
   ```bash
   INSTAGRAM_PROVIDER=gramscraper
   GRAMSCRAPER_API_KEY=gs_your_actual_api_key
   ```
3. Restart the backend. CreatorScope will now query the live GramScraper API endpoints and normalize real Instagram data.

---

## Deployment Guide (Vercel-First)

### 1. Frontend on Vercel
1. Push the codebase to a GitHub repository:
   ```bash
   git init
   git add .
   git commit -m "feat: initial commit of CreatorScope"
   git remote add origin https://github.com/your-username/creator-scope.git
   git push -u origin main
   ```
2. Log in to [Vercel](https://vercel.com) and click **"Add New Project"**.
3. Select your GitHub repository.
4. Set the **Root Directory** to `frontend`.
5. Under **Environment Variables**, add:
   - `VITE_API_BASE_URL`: The public URL of your deployed backend (e.g. `https://creatorscope-api.onrender.com/api`).
6. Click **Deploy**. Vercel will build the Vite bundle into `dist/` and handle client routing via `frontend/vercel.json`.

### 2. Backend Deployment
Deploy the FastAPI backend to any standard Python container host:
- **Render:** Create a new Web Service pointing to `backend/`, with start command:
  ```bash
  uvicorn app.main:app --host 0.0.0.0 --port $PORT
  ```
- **Environment variables to configure on backend host:**
  - `INSTAGRAM_PROVIDER`: `mock` or `gramscraper`
  - `GRAMSCRAPER_API_KEY`: your API key (if live)
  - `CORS_ORIGINS`: `https://your-frontend-app.vercel.app`

---

## Methodology & Limitations

- **Current Followers Denominator:** Public endpoints return current followers, not the follower count at the exact moment past posts were published. Engagement by followers is therefore marked as **Estimated**.
- **Private Data Protection:** In compliance with ethical data standards, CreatorScope never attempts to estimate or guess private Meta account metrics (reach, story views, impressions, saves, audience demographics).

For complete cost and quota analysis, see [COSTS_AND_LIMITS.md](COSTS_AND_LIMITS.md).  
For implementation and test verification status, see [PROJECT_STATUS.md](PROJECT_STATUS.md).
