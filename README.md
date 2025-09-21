Automated Student Attendance Monitoring and Analytics System
 
An advanced attendance tracking and analytics platform designed for colleges, built for the Smart India Hackathon. Features a Next.js frontend, FastAPI backend with SQLAlchemy, and experimental face recognition using InsightFace and OpenCV. Includes student/teacher dashboards, leave workflows, and demo data seeding for rapid development.

Warning: This is demo code with development conveniences. Review the Security & Production Considerations before deploying.


Table of Contents

Project Overview
Features
Architecture
Quick Start (Development)
Prerequisites
Backend Setup
Frontend Setup


API Endpoints (Summary)
Demo & Seeding
Implementation Details
Data Model Overview
Timetable & Attendance Seeding
Face Recognition Scaffold


Security & Production Considerations
Recommended Next Steps
Troubleshooting
Contributing
License

Project Overview
This project delivers a full-stack solution for automated attendance monitoring in colleges. It integrates:

A Next.js + TypeScript frontend (app/) for student, teacher, and admin interfaces.
A FastAPI backend (backend/main.py) with SQLAlchemy and MySQL for data persistence.
Experimental face recognition using InsightFace and OpenCV for automated attendance.
Demo data seeding for rapid testing, with fallback to localStorage for offline development.

Designed for the Smart India Hackathon, it streamlines attendance tracking, analytics, and administrative workflows.
Features

Student Dashboard: View personal attendance, today’s schedule, and subject-wise metrics with deterministic fallbacks.
Teacher Dashboard: Manage classes, request leaves, auto-assign substitutions, and access role-based controls.
Admin Interface: Create/manage teachers, students, subjects, and seed demo data.
Face Recognition: Upload base64 images to match student embeddings and record attendance.
Timetable Editor: Weekly schedule management with attendance marking and camera integration.
Analytics: Visualizations (stacked bar/pie charts) for attendance trends.
Demo Mode: Pre-seeded data (students: Anuj, Saksham, Rohain, Anirudh, Varun) with predictable attendance patterns.
UI Enhancements: Toast notifications, responsive design, and graceful backend fallbacks.

Architecture

Frontend: Next.js (App Router), TypeScript, React, Tailwind CSS. State management via lib/data-context.tsx with localStorage and backend sync.
Backend: FastAPI, SQLAlchemy, MySQL (via pymysql). Optional face recognition with InsightFace + OpenCV.
Data Storage: MySQL for persistent data; filesystem for face embeddings and attendance logs.

Quick Start (Development)
Prerequisites

Node.js: v16+ (v18 recommended)
pnpm: v8+ (or npm/yarn; pnpm lockfile included)
Python: 3.11+ (3.9+ compatible)
MySQL: Local server or compatible SQL database
Optional (Face Recognition): OpenCV, InsightFace, NumPy, system libraries (e.g., libpng, cmake)

Backend Setup

Create a Virtual Environment:
python -m venv .venv
.\venv\Scripts\Activate.ps1


Install Dependencies:Create a requirements.txt file:
fastapi==0.115.0
uvicorn==0.31.0
sqlalchemy==2.0.35
pymysql==1.1.1
pydantic==2.9.2
numpy==2.1.1
opencv-python==4.10.0.84
insightface==0.7.3

Install:
pip install -r requirements.txt


Configure Database:Set the DATABASE_URL environment variable (replace with your credentials):
$env:DATABASE_URL = "mysql+pymysql://appuser:securepassword@localhost/attendance_db"


Run Backend:
cd backend
uvicorn main:app --reload --host 127.0.0.1 --port 8000

Access API at http://localhost:8000/docs.


Frontend Setup

Install Dependencies:
pnpm install
# or: npm install


Run Frontend:
pnpm dev
# or: npm run dev

Open http://localhost:3000 and use demo login or seed backend data.


API Endpoints (Summary)

Security Note: Many endpoints are unprotected and expose sensitive data (e.g., passwords). Secure before production.


POST /api/students/register: Register a student.
POST /api/students/{id}/register: Upload face images (base64).
POST /api/attendance/recognize: Match face image and log attendance.
CRUD Endpoints: /api/teachers/, /api/students/, /api/admins/, /api/subjects/, /api/attendance/.
Leave Workflow: POST /api/leaves/, GET /api/leaves/, PUT /api/leaves/{id}/resolve, PUT /api/leaves/{id}/reject.
Demo Seeding: POST /api/seed-demo, POST /api/seed-demo-students.

Demo & Seeding

Endpoints:
POST /api/seed-demo: Seeds teachers, students, subjects, and attendance.
POST /api/seed-demo-students: Adds demo students (e.g., Anuj, Saksham).


Frontend Fallback: lib/data-context.tsx uses localStorage if backend is unavailable.

Implementation Details
Data Model Overview

Entities: Teacher, Student, Admin (id, name, email, username, password), Subject, TimetableEntry, Attendance, LeaveRequestModel, SubstitutionModel.
Relationships: Subjects linked to teachers; attendance tied to students/subjects.

Timetable & Attendance Seeding

Frontend seeds timetable in localStorage if no backend.
Backend /api/seed-demo generates demo data with deterministic attendance for testing.

Face Recognition Scaffold

Uses InsightFace/OpenCV to extract/store embeddings (students/{id}/embeddings.npy).
/api/attendance/recognize compares images and logs attendance to attendance/.

Security & Production Considerations

Critical: This is demo code with significant security gaps. Address these before production:


Authentication: Add OAuth2/JWT and role-based access control (RBAC).
Passwords: Hash passwords (bcrypt/argon2); never expose in API responses.
Secrets: Use environment variables or a secret manager, not hardcoded credentials.
File Uploads: Validate images, limit size, scan for malware, use secure storage (e.g., S3).
Face Recognition: Require teacher authentication, add liveness checks.
Demo Endpoints: Disable /api/seed-demo in production.
Additional: Implement rate limiting, logging, and data retention policies.

Recommended Next Steps

Add authentication middleware (FastAPI + JWT).
Hash passwords and sanitize API responses.
Validate inputs with Pydantic and restrict exposed fields.
Use secure storage (e.g., S3) for face embeddings.
Write unit/integration tests for API and business logic.
Set up CI/CD with linting and code scanning.
Deploy to a staging environment with an API gateway.

Troubleshooting

Backend Fails (InsightFace/OpenCV): Skip these imports if not using face recognition.
DB Connection Errors: Verify DATABASE_URL and database user privileges.
Frontend Fails: Ensure pnpm install completed and backend is running at http://localhost:8000.

Contributing
Contributions are welcome! For major changes:

Open an issue to discuss the change.
Submit a pull request with clear descriptions.Focus Areas:


Authentication and RBAC.
Secure password handling.
File upload validation.
Logging and monitoring.

License
MIT License – see the LICENSE file for details.
