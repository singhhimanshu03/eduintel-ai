# EduIntel AI — AI-Powered Academic Intelligence Platform

> Production-grade, enterprise-level platform combining College ERP, Student Success Analytics, AI-powered Prediction Systems, and Academic Decision Support — built on a microservice architecture.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Tech Stack](#tech-stack)
3. [User Roles](#user-roles)
4. [Microservices](#microservices)
5. [AI Modules](#ai-modules)
6. [Quick Start](#quick-start)
7. [Development Setup](#development-setup)
8. [Training the AI Models](#training-the-ai-models)
9. [Environment Variables](#environment-variables)
10. [API Reference](#api-reference)
11. [Deployment](#deployment)
12. [Project Structure](#project-structure)

---

## Architecture Overview

```
                        ┌─────────────────────────────────────────────┐
                        │              React Frontend (Vite)          │
                        │     Tailwind · Redux Toolkit · React Query   │
                        └────────────────────┬────────────────────────┘
                                             │ HTTPS :80
                        ┌────────────────────▼────────────────────────┐
                        │         API Gateway (Node.js / Express)      │
                        │  JWT validation · RBAC · Rate limiting       │
                        │  Redis response caching · Reverse proxy      │
                        └────┬──────┬──────┬──────┬──────┬───────┬───┘
                             │      │      │      │      │       │
              ┌──────────────▼─┐ ┌──▼───┐ ┌──▼───┐ ┌──▼───┐ ┌──▼───────┐
              │  Auth Service  │ │Stud. │ │Fac.  │ │Attend│ │Exam Svc  │
              │  :3001 (RS256) │ │:3002 │ │:3003 │ │:3004 │ │:3005     │
              └────────────────┘ └──────┘ └──────┘ └──────┘ └──────────┘
              ┌──────────────┐ ┌─────────┐ ┌──────────┐ ┌────────────┐
              │  Fee  :3006  │ │Notif.   │ │Placement │ │Analytics   │
              │              │ │:3007    │ │:3008     │ │:3009       │
              └──────────────┘ └─────────┘ └──────────┘ └─────┬──────┘
                                                               │
                        ┌──────────────────────────────────────▼──────┐
                        │       AI Prediction Service (FastAPI :8000)  │
                        │  Eligibility · Performance · Dropout         │
                        │  Attendance Forecast · Recommendations       │
                        │  Placement Readiness · Skill Gap             │
                        └─────────────────────────────────────────────┘
                        ┌──────────────────┐  ┌──────────────────────┐
                        │  PostgreSQL :5432 │  │   Redis :6379        │
                        │  11 databases     │  │  Cache · Pub/Sub     │
                        └──────────────────┘  └──────────────────────┘
```

All inter-service communication is internal to the Docker network. Only the API Gateway (port 80) and the Frontend (port 3000) are exposed externally.

---

## Tech Stack

| Layer        | Technologies                                                                   |
|---|---|
| **Frontend** | React 18, TypeScript, Tailwind CSS, Redux Toolkit, React Query, Recharts, Vite |
| **Backend**  | Node.js 20, Express, TypeScript, JWT (RS256), Zod validation, PDFKit, ExcelJS  |
| **AI Layer** | Python 3.11, FastAPI, Scikit-Learn, XGBoost, Pandas, NumPy, APScheduler, Joblib |
| **Database** | PostgreSQL 15 (11 separate DBs, one per service)                               |
| **Caching**  | Redis 7 (rate limiting, response cache, pub/sub notifications)                 |
| **DevOps**   | Docker, Docker Compose, GitHub Actions CI/CD                                   |

---

## User Roles

| Role | Portal | Key Capabilities |
|---|---|---|
| `super_admin` | Admin | Full platform access, institution management |
| `college_admin` | Admin | Students, faculty, attendance, fees, AI insights, reports |
| `faculty` | Faculty | Mark attendance, enter marks, view AI alerts |
| `student` | Student | View attendance, results, fee status, AI recommendations, hall ticket |
| `parent` | Parent | View child's attendance, results, AI risk level |
| `examination_cell` | Exam | Schedule exams, publish results, manage hall tickets |
| `placement_cell` | Placement | Companies, drives, interviews, AI placement readiness |

---

## Microservices

| Service | Port | Database | Description |
|---|---|---|---|
| `api-gateway` | 80 | — | JWT validation, RBAC, rate limiting, proxy |
| `auth-service` | 3001 | `auth_db` | Register, login, refresh tokens, password reset, audit logs |
| `student-service` | 3002 | `student_db` | Student profiles, academic history, documents, bulk import |
| `faculty-service` | 3003 | `faculty_db` | Faculty profiles, subject assignments |
| `attendance-service` | 3004 | `attendance_db` | Class sessions, attendance marking, analytics, PDF export |
| `examination-service` | 3005 | `exam_db` | Marks entry, exam schedules, hall ticket generation, result publishing |
| `fee-service` | 3006 | `fee_db` | Fee structures, transactions, ledger, defaulter reports |
| `notification-service` | 3007 | `notification_db` | Email + in-app notifications, preferences |
| `placement-service` | 3008 | `placement_db` | Companies, recruitment drives, interviews, placement profiles |
| `analytics-service` | 3009 | `analytics_db` | Role-based dashboards, report exports (Excel/PDF) |
| `ai-service` | 8000 | — | 6 AI prediction endpoints + faculty flagging |

---

## AI Modules

| Module | Endpoint | Algorithm | Output |
|---|---|---|---|
| Eligibility Risk | `POST /api/ai/eligibility-risk` | Random Forest | Low / Medium / High |
| Performance Prediction | `POST /api/ai/performance-predict` | XGBoost + RF | GPA range, backlog probability per subject |
| Dropout Risk | `POST /api/ai/dropout-risk` | Random Forest | Probability, risk factors |
| Attendance Forecast | `POST /api/ai/attendance-forecast` | RF Regressor | 4-week forecast with confidence bounds |
| Recommendations | `POST /api/ai/recommendations/{id}` | Composite | Improvement plan, attendance targets |
| Placement Readiness | `POST /api/ai/placement/readiness-score` | Weighted formula | Score 0–100, breakdown |
| Skill Gap | `POST /api/ai/placement/skill-gap` | Set analysis | Missing skills, coverage % |
| Faculty Flagging | `GET /api/ai/faculty/{id}/flagged-students` | Eligibility RF | At-risk students list |

---

## Quick Start

### Prerequisites

- Docker Desktop (Windows/Mac) or Docker Engine + Compose (Linux)
- `openssl` in PATH (for key generation)
- 4 GB RAM minimum (8 GB recommended)

### 1. Clone and configure

```bash
git clone https://github.com/your-org/eduintel-ai.git
cd eduintel-ai
cp .env.example .env
# Edit .env — change passwords, SMTP credentials, INTERNAL_SERVICE_SECRET
```

### 2. Generate RS256 JWT keys

```bash
mkdir -p keys
openssl genrsa -out keys/private.pem 2048
openssl rsa -in keys/private.pem -pubout -out keys/public.pem
```

### 3. Start all services

```bash
docker compose up -d
```

First run downloads images and builds all containers (~3–5 minutes). PostgreSQL initialises all 11 databases automatically from `db/init/`.

### 4. Train the AI models (first time only)

```bash
docker compose exec ai-service python training/train_all.py
```

This generates ~3000 synthetic training records and saves 4 `.pkl` model files. Takes ~30 seconds.

### 5. Open the application

| URL | Description |
|---|---|
| http://localhost:3000 | Frontend (React) |
| http://localhost:80 | API Gateway |
| http://localhost:8000/docs | AI Service Swagger UI |

### 6. Login with seed credentials

| Role | Email | Password |
|---|---|---|
| College Admin | admin@eduintel.edu | Password@123 |
| Faculty | faculty1@eduintel.edu | Password@123 |
| Student | student1@eduintel.edu | Password@123 |
| Parent | parent1@eduintel.edu | Password@123 |
| Exam Cell | exam@eduintel.edu | Password@123 |
| Placement Cell | placement@eduintel.edu | Password@123 |

> **Note:** Seed password hashes in `db/init/11_seed_data.sql` use a placeholder hash. For actual development, register users via the Register page or generate fresh bcrypt hashes.

---

## Development Setup

### Frontend (local hot-reload)

```bash
cd frontend
npm install
cp .env.example .env.local
# Set VITE_API_URL=http://localhost:80
npm run dev
```

### Backend service (local)

```bash
cd services/auth-service
npm install
cp .env.example .env
# Fill in DATABASE_URL pointing to your local postgres
npm run dev   # or: npx ts-node src/index.ts
```

### AI Service (local)

```bash
cd ai-service
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Set MODEL_DIR=./models (relative path for local dev)
python training/train_all.py   # train models first
uvicorn app.main:app --reload --port 8000
```

---

## Training the AI Models

The training pipeline generates synthetic data and trains 4 models:

| Model file | Algorithm | Purpose |
|---|---|---|
| `eligibility_risk_model.pkl` | Random Forest Classifier | Eligibility risk: Low/Medium/High |
| `performance_gpa_model.pkl` | XGBoost Regressor | Predict semester GPA |
| `performance_backlog_model.pkl` | Random Forest Classifier | Backlog probability per subject |
| `dropout_risk_model.pkl` | Random Forest Classifier | Dropout probability |

```bash
# Inside Docker:
docker compose exec ai-service python training/train_all.py

# Local:
cd ai-service && python training/train_all.py
```

Models are saved to the directory specified by `MODEL_DIR` env var (default: `/app/models` in Docker).

---

## Environment Variables

See each service's `.env.example` for full variable reference. Key variables:

| Variable | Services | Description |
|---|---|---|
| `POSTGRES_USER` / `POSTGRES_PASSWORD` | All | PostgreSQL credentials |
| `INTERNAL_SERVICE_SECRET` | All Node.js | Shared secret for service-to-service auth |
| `JWT_PRIVATE_KEY_PATH` | auth-service | RS256 private key path |
| `JWT_PUBLIC_KEY_PATH` | api-gateway, auth-service | RS256 public key path |
| `REDIS_URL` | api-gateway, auth, notification, analytics | Redis connection string |
| `SMTP_HOST/PORT/USER/PASS` | auth-service, notification-service | Email delivery |
| `MODEL_DIR` | ai-service | Directory containing trained `.pkl` model files |
| `DEFAULT_ELIGIBILITY_THRESHOLD` | attendance-service | Min attendance % (default 75) |

---

## API Reference

The API Gateway routes all requests. Base URL: `http://localhost:80/api`

### Authentication

| Method | Path | Description |
|---|---|---|
| POST | `/auth/register` | Register new user |
| POST | `/auth/login` | Login, returns JWT + refresh token |
| POST | `/auth/refresh` | Refresh access token |
| POST | `/auth/logout` | Invalidate refresh token |
| POST | `/auth/forgot-password` | Send password reset email |
| POST | `/auth/reset-password` | Reset password with token |
| GET  | `/auth/verify-email` | Verify email address |

### Students

| Method | Path | Description |
|---|---|---|
| GET  | `/students` | List students (with filters) |
| POST | `/students` | Create student |
| GET  | `/students/:id` | Get student profile |
| PUT  | `/students/:id` | Update student |
| DELETE | `/students/:id` | Deactivate student |
| GET  | `/students/:id/academic-history` | Academic history |
| POST | `/students/:id/documents` | Upload document |
| POST | `/students/bulk-import` | CSV bulk import |

### Attendance

| Method | Path | Description |
|---|---|---|
| POST | `/attendance/classes` | Create class session |
| POST | `/attendance/classes/:id/mark` | Mark attendance |
| PUT  | `/attendance/records/:id` | Edit attendance record |
| GET  | `/attendance/students/:id` | Student attendance summary |
| GET  | `/attendance/students/:id/pdf` | Download PDF report |
| GET  | `/attendance/analytics` | Attendance analytics |

### Examinations

| Method | Path | Description |
|---|---|---|
| POST | `/exams/schedules` | Create exam schedule |
| GET  | `/exams/schedules` | List schedules |
| POST | `/exams/marks` | Enter marks |
| GET  | `/exams/results/:studentId` | Student results |
| POST | `/exams/results/publish` | Publish semester results |
| POST | `/exams/hall-tickets/generate` | Generate hall ticket |
| GET  | `/exams/hall-tickets/:studentId/pdf` | Download hall ticket PDF |

### Fees

| Method | Path | Description |
|---|---|---|
| POST | `/fees/structures` | Create fee structure |
| GET  | `/fees/students/:id/status` | Student fee status |
| POST | `/fees/transactions` | Record payment |
| GET  | `/fees/defaulters` | Fee defaulter list |
| GET  | `/fees/analytics` | Fee analytics |

### Placement

| Method | Path | Description |
|---|---|---|
| GET  | `/placement/students/:id/profile` | Get placement profile |
| PUT  | `/placement/students/:id/profile` | Update placement profile |
| GET  | `/placement/companies` | List companies |
| POST | `/placement/companies` | Add company |
| POST | `/placement/drives` | Create recruitment drive |
| GET  | `/placement/drives/:id/eligible-students` | Eligible students |
| POST | `/placement/interviews` | Schedule interview |
| GET  | `/placement/analytics` | Placement analytics |

### AI Predictions

| Method | Path | Description |
|---|---|---|
| POST | `/ai/eligibility-risk` | Single eligibility prediction |
| POST | `/ai/eligibility-risk/batch` | Batch eligibility (up to 500) |
| POST | `/ai/performance-predict` | Performance prediction |
| POST | `/ai/dropout-risk` | Dropout risk prediction |
| POST | `/ai/attendance-forecast` | 4-week attendance forecast |
| POST | `/ai/recommendations/:studentId` | AI improvement recommendations |
| POST | `/ai/placement/readiness-score` | Placement readiness score |
| POST | `/ai/placement/skill-gap` | Skill gap analysis |
| GET  | `/ai/faculty/:id/flagged-students` | At-risk students for faculty |

### Analytics & Reports

| Method | Path | Description |
|---|---|---|
| GET | `/analytics/dashboard/admin` | Admin dashboard data |
| GET | `/analytics/dashboard/faculty` | Faculty dashboard data |
| GET | `/analytics/dashboard/student/:id` | Student dashboard data |
| GET | `/analytics/dashboard/parent/:studentId` | Parent dashboard data |
| GET | `/analytics/reports/:type/export?format=excel` | Export report |

---

## Deployment

### Production with Docker Compose

```bash
# 1. Set NODE_ENV=production in .env
# 2. Use strong passwords and secrets
# 3. Set up proper SMTP credentials
docker compose -f docker-compose.yml up -d

# Scale a service:
docker compose up -d --scale student-service=2
```

### Health Checks

All services expose `GET /health` returning `{ status: "ok", service: "..." }`.

```bash
curl http://localhost/health          # API Gateway
curl http://localhost:8000/health     # AI Service
```

### Viewing Logs

```bash
docker compose logs -f api-gateway
docker compose logs -f ai-service
docker compose logs -f auth-service
```

---

## Project Structure

```
eduintel-ai/
├── .env.example                 # Root env vars template
├── docker-compose.yml           # Full stack orchestration
├── docker-compose.override.yml  # Dev overrides
├── keys/                        # RSA key pair (gitignored, generate locally)
│
├── db/init/                     # PostgreSQL initialisation scripts (auto-run)
│   ├── 01_create_databases.sql  # Creates all 11 databases
│   ├── 02_auth_schema.sql
│   ├── 03_student_schema.sql
│   ├── ...
│   ├── 10_analytics_schema.sql
│   └── 11_seed_data.sql         # Dev seed data
│
├── services/                    # Node.js microservices
│   ├── api-gateway/
│   ├── auth-service/
│   ├── student-service/
│   ├── faculty-service/
│   ├── attendance-service/
│   ├── examination-service/
│   ├── fee-service/
│   ├── notification-service/
│   ├── placement-service/
│   └── analytics-service/
│
├── ai-service/                  # Python FastAPI AI service
│   ├── app/
│   │   ├── main.py
│   │   ├── models/              # Model wrapper classes
│   │   ├── routers/             # 7 prediction routers
│   │   ├── schemas/             # Pydantic request/response schemas
│   │   └── services/            # Feature engineering, model loader
│   ├── training/                # Synthetic data generation + model training
│   └── requirements.txt
│
└── frontend/                    # React + TypeScript SPA
    └── src/
        ├── app/                 # Redux store, Axios API client
        ├── components/          # Reusable UI components + charts + layout
        ├── features/            # Redux slices + API service wrappers
        ├── hooks/               # React Query + Redux hooks
        ├── pages/               # Role-based page components
        │   ├── admin/           # AdminDashboard, Students, Fees, AI Insights, ...
        │   ├── faculty/         # FacultyDashboard, MarkAttendance, MarksEntry
        │   ├── student/         # StudentDashboard, MyAttendance, Results, Fees, HallTicket
        │   ├── parent/          # ParentDashboard, ParentOverview
        │   ├── exam/            # ExamDashboard, Schedules, HallTickets, Results
        │   └── placement/       # PlacementDashboard, Companies, Drives, AIProfile
        ├── router/              # AppRoutes, ProtectedRoute, RoleBasedRoute
        └── types/               # TypeScript interfaces (35+ types)
```

---

## Acknowledgements

Built as a final-year CSE (AI & ML) project demonstrating:
- Enterprise microservice architecture with 10 independent services
- ML-powered academic decision support using Scikit-Learn and XGBoost
- Full-stack TypeScript + React + Node.js development
- Production DevOps with Docker, GitHub Actions CI/CD
- Role-based access control across 7 user personas
