<img width="1912" height="940" alt="9" src="https://github.com/user-attachments/assets/ba872248-9d04-4854-bdc0-4b28677d2796" /># Automated Student Attendance Monitoring and Analytics System

An attendance tracking and analytics application built with a Next.js frontend and a FastAPI + SQLAlchemy backend. It includes face-recognition scaffolding, a demo data seeding mechanism, per-student dashboards, teacher/admin interfaces, leave/substitution workflows, and reporting tools.

> NOTE: This repository contains demo code and development conveniences. See the "Security & Production Considerations" section before deploying.

## Table of Contents

- Project overview
- Features
- Architecture
- Quick start (development)
  - Prerequisites
  - Backend setup
  - Frontend setup
- API endpoints (summary)
- Demo / seeding
- Important implementation details
  - Data model overview
  - Timetable & attendance seeding
  - Face recognition scaffold
- Security & privacy notes
- Recommended next steps
- Troubleshooting
- License

## Project overview

This project provides a full-stack attendance monitoring system targeted at colleges and institutions. It combines:

- A Next.js + React frontend (app/ directory) providing user-facing pages for students, teachers, and admins.
- A FastAPI backend (`backend/main.py`) using SQLAlchemy models and MySQL (via pymysql) for persistence.
- Face recognition scaffolding (InsightFace, OpenCV) for automated attendance capture (experimental).
- Demo data seeding and fallback localStorage-based state for local development.

The codebase includes many features implemented for demonstration and rapid testing.

## Features

- Student dashboard: per-student attendance metrics, today's schedule, subject-wise attendance with deterministic fallbacks.
- Teacher dashboard: teacher management, leave requests, substitution auto-assignment, role-based UI controls.
- Admin views: create/manage teachers/students/subjects; seed demo data endpoints.
- Attendance recognition scaffold: endpoint receives a base64 image and attempts to match known student embeddings.
- Weekly timetable editor (Report page) with attendance marking modal and camera integration.
- Charts and analytics: stacked bar and pie charts for present/absent counts and more.
- Demo-friendly behavior: seeded demo students (Anuj, Saksham, Rohain, Anirduh, Varun), deterministic attendance patterns for testing.
- Toast notifications, helpful UI components, and graceful fallbacks when backend is unavailable.

## Architecture

- Frontend: Next.js (app router), TypeScript/React, Tailwind CSS. Central client state and helpers live in `lib/data-context.tsx` which stores data in `localStorage` and optionally fetches from the backend.
- Backend: FastAPI with SQLAlchemy models, designed to use MySQL (`DATABASE_URL` environment variable expected). Face recognition uses InsightFace + OpenCV (optional heavy native deps).

## Quick start (development)

### Prerequisites
- Node.js (v16+ recommended)
- pnpm or npm/yarn for frontend dependencies (this project uses pnpm lockfile)
- Python 3.11+ (or at least 3.9+), pip
- MySQL server (local) or alternative SQL DB compatible with SQLAlchemy
- Optional (only if using face recognition): OpenCV, InsightFace, numpy, and supporting system libraries

### Backend setup

1. Create and activate a Python virtual environment. Example (Windows PowerShell):

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

2. Install Python dependencies (create a `requirements.txt` as needed). Example packages used in the repo:

- fastapi
- uvicorn
- sqlalchemy
- pymysql
- pydantic
- numpy
- opencv-python (optional)
- insightface (optional)

Install example:

```powershell
pip install fastapi uvicorn sqlalchemy pymysql pydantic numpy
# Optional for face recognition (may require system libraries)
pip install opencv-python insightface
```

3. Configure your database connection as an environment variable. The app previously had a default `DATABASE_URL` in code; do NOT use hardcoded credentials in production. Set an environment variable instead:

```powershell
$env:DATABASE_URL = "mysql+pymysql://appuser:securepassword@localhost/attendance_db"
```

4. Run the backend server from the `backend` directory:

```powershell
cd backend
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

Notes:
- InsightFace/OpenCV dependencies can be heavy and sometimes require native build tooling; if you don't need face recognition locally, skip installing them.

### Frontend setup

1. From the repository root, install dependencies and run the Next.js app:

```powershell
# Using pnpm
pnpm install
pnpm dev

# or using npm
npm install
npm run dev
```

2. Open `http://localhost:3000` and use the demo login or seed the backend via the provided endpoints.

## API endpoints (summary)

Note: many endpoints are currently unprotected and return full model rows including `password` fields — this is unsafe for production. See Security notes below.

Important endpoints (backend/main.py):

- POST /api/students/register — register a student (creates DB record)
- POST /api/students/{id}/register — upload face images (base64 array)
- POST /api/attendance/recognize — recognize face image and optionally write an attendance record (uses filesystem storage for attendance)
- Teachers CRUD: GET/POST /api/teachers/
- Students: GET /api/students/
- Admins CRUD: GET/POST /api/admins/
- Subjects CRUD: GET/POST /api/subjects/
- Attendance CRUD: GET/POST /api/attendance/
- Leave workflow: POST /api/leaves/, GET /api/leaves/, PUT /api/leaves/{id}/resolve, PUT /api/leaves/{id}/reject
- Demo seeding: POST /api/seed-demo, POST /api/seed-demo-students

## Demo / seeding

Two endpoints help populate demo data:

- POST `/api/seed-demo` — seeds teachers, students (including Anuj with deterministic attendance), subjects, and attendance.
- POST `/api/seed-demo-students` — ensures demo student records (Saksham, Rohain, Anirduh, Varun) exist.

The frontend also includes localStorage fallbacks and will call `/api/students/` and seed endpoints when available.

## Important implementation details

### Data model overview

Key models (in `backend/main.py` and mirrored in frontend types):

- Teacher, Student, Admin — have `id`, `name`, `email`, `username`, `password` (plaintext in current code) and other fields.
- Subject — name, code, teacher relationship.
- TimetableEntry (frontend) — day, timeSlot, subjectId, teacherId, room, course.
- Attendance — student_id, subject_id, class_time, timestamp, status, confidence.
- LeaveRequestModel & SubstitutionModel — used for leave/substitution flows.

### Timetable & attendance seeding

- Frontend `lib/data-context.tsx` seeds default timetable entries in `localStorage` if no backend is available.
- Backend `/api/seed-demo` creates demo subjects and seeds attendance (including deterministic records for Anuj).

### Face recognition scaffold

- The backend uses InsightFace and OpenCV to extract embeddings from provided images and saves embeddings per student under `students/{id}/embeddings.npy`.
- Recognition endpoint compares an incoming embedding to stored embeddings and writes a JSON record to `attendance/` on a successful match.

## Security & production considerations (important)

This repo contains multiple deliberate development conveniences and known security gaps. Before deploying to production, do not skip the following:

1. Implement server-side authentication + RBAC. Do not rely on client-side localStorage for role checks.
2. Stop storing plaintext passwords. Use bcrypt/argon2 and never return password fields in API responses.
3. Move secrets into environment variables or a secret manager. Rotate credentials.
4. Harden file uploads: validate image content, limit size, use safe filenames, and scan content.
5. Protect face recognition endpoint: require authenticated teacher requests and add liveness checks.
6. Remove or protect all seeding/demo endpoints in production.
7. Add rate limiting, logging, monitoring, and an audit trail for actions like attendance marking.
8. Implement privacy safeguards and data retention policies for face data.

## Recommended next steps (developer roadmap)

1. Add authentication (OAuth2 / JWT or session-based) and implement RBAC middleware.
2. Hash passwords and migrate existing user records.
3. Sanitize all inputs, use Pydantic models for validation, and restrict returned fields.
4. Secure file storage (S3 or secure uploads dir), scan uploads, and set quotas.
5. Add tests (unit tests for business logic and integration tests for API endpoints).
6. Add CI checks, linting, and a code scanning step.
7. Consider deploying to a staging environment behind an API gateway (rate-limiting and WAF).

## Troubleshooting

- If the backend fails to start due to InsightFace or OpenCV, remove or guard those imports while developing without face recognition.
- If DB connection fails, ensure `DATABASE_URL` is correctly set and the DB user has appropriate privileges. Do not use `root` credentials in production.

## Contributing

Contributions are welcome. For large changes, please open an issue describing the intended change, then a pull request. Focus areas that need immediate attention:

- Authentication & authorization
- Password hashing and secure credential handling
- Upload validation and secure storage
- Logging and monitoring

## Code ScreenShots

<img width="1915" height="949" alt="image" src="https://github.com<img width="1896" height="942" alt="2" src="https://github.com/user-attachments/assets/99644964-d2c2-49ec-a1a6-8457d7fd4ea2" />
<img width="1900" height="944" alt="3" src="https://github.com/user-attachments/assets/6e815316-56a1-468c-a25e-b684572c01d0" />
<img width="1895" height="944" alt="4" src="https://github.com/user-attachments/assets/1dde0589-e158-4c56-9ba7-f0dab469b6f5" />
<img width="1896" height="942" alt="5" src="https://github.com/user-attachments/assets/d74bc0b4-dd65-4a8e-8ee4-fbef4bbd1134" />
/user-attachments/assets/c693f60b-d23d-4998-abbc-2b94be4b730b" />
<img width="1908" height="941" alt="8" src="https://github.com/user-attachments/assets/96c932ec-78a7-4a53-9086-6e3ce12f9575" /><img width="1907" height="943" alt="7" src="https://github.com/user-attachments/assets/ff12b8ef-93c0-4b32-9457-b82f801b1aac" />
<img width="1896" height="942" alt="2" src="https://github.com/user-attachments/assets/83a8b030-3040-4540-b5cf-d11273131236" />
<img width="1907" height="942" alt="6" src="https://github.com/user-attachments/assets/990c2647-9afe-4f71-9457-4af8f4f9c1e2" />



## License

This project is provided as-is for demonstration. Add a license file before public distribution.

---

