from fastapi import FastAPI, HTTPException, Depends
from pydantic import BaseModel
import os
import base64
import numpy as np
from typing import List
from datetime import datetime
from datetime import timedelta
import cv2
import insightface
from insightface.app import FaceAnalysis
from sqlalchemy import create_engine, Column, Integer, String, DateTime, Float, ForeignKey, Text
from sqlalchemy.orm import sessionmaker, declarative_base, relationship, Session


app = FastAPI()
face_app = FaceAnalysis(name="buffalo_l", providers=["CPUExecutionProvider"])
face_app.prepare(ctx_id=0)

# Database setup
DATABASE_URL = "mysql+pymysql://root:12345@localhost/attendance_db"
engine = create_engine(DATABASE_URL, echo=True, future=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Dependency for DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Models
class Teacher(Base):
    __tablename__ = "teachers"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(128))
    email = Column(String(128), unique=True)
    username = Column(String(64), unique=True)
    password = Column(String(128))

class Student(Base):
    __tablename__ = "students"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(128))
    email = Column(String(128), unique=True)
    username = Column(String(64), unique=True)
    password = Column(String(128))
    course = Column(String(64))
    semester = Column(String(32))
    face_data = Column(Text, nullable=True)  # path to face embedding file

class Admin(Base):
    __tablename__ = "admins"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(128))
    email = Column(String(128), unique=True)
    username = Column(String(64), unique=True)
    password = Column(String(128))

class Subject(Base):
    __tablename__ = "subjects"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(128))
    code = Column(String(32))
    teacher_id = Column(Integer, ForeignKey("teachers.id"))
    teacher = relationship("Teacher")

class Attendance(Base):
    __tablename__ = "attendance"
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"))
    subject_id = Column(Integer, ForeignKey("subjects.id"))
    class_time = Column(String(32))
    timestamp = Column(DateTime, default=datetime.utcnow)
    status = Column(String(16))
    confidence = Column(Float, nullable=True)
    student = relationship("Student")
    subject = relationship("Subject")


class LeaveRequestModel(Base):
    __tablename__ = "leave_requests"
    id = Column(Integer, primary_key=True, index=True)
    teacher_id = Column(Integer, ForeignKey("teachers.id"))
    timetable_entry_id = Column(Integer)
    date = Column(String(32))  # ISO yyyy-mm-dd
    replacement_teacher_id = Column(Integer, nullable=True)
    auto_assigned = Column(Integer, default=0)  # 0/1
    status = Column(String(32), default="open")  # open/resolved/rejected
    created_at = Column(DateTime, default=datetime.utcnow)


class SubstitutionModel(Base):
    __tablename__ = "substitutions"
    id = Column(Integer, primary_key=True, index=True)
    timetable_entry_id = Column(Integer)
    date = Column(String(32))
    replacement_teacher_id = Column(Integer)
    original_teacher_id = Column(Integer)

class FaceEmbedding(Base):
    __tablename__ = "face_embeddings"
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"))
    embedding_path = Column(String(256))
    student = relationship("Student")

# Create tables
Base.metadata.create_all(bind=engine)


class RegisterRequest(BaseModel):
    images: List[str]


@app.post("/api/students/register")
def register_student(student: dict, db: Session = Depends(get_db)):
    # Register a new student
    new_student = Student(
        name=student.get("name"),
        email=student.get("email"),
        username=student.get("username"),
        password=student.get("password"),
        course=student.get("course"),
        semester=student.get("semester"),
    )
    db.add(new_student)
    db.commit()
    db.refresh(new_student)
    return {"status": "success", "student_id": new_student.id}


@app.post("/api/students/{student_id}/register")
def register(student_id: str, req: RegisterRequest, db: Session = Depends(get_db)):
    os.makedirs(f"students/{student_id}/images", exist_ok=True)
    embeddings = []
    for idx, img_b64 in enumerate(req.images):
        img_data = base64.b64decode(img_b64.split(",")[1])
        img_path = f"students/{student_id}/images/pose_{idx+1}.jpg"
        with open(img_path, "wb") as f:
            f.write(img_data)
        img_arr = np.frombuffer(img_data, np.uint8)
        img = cv2.imdecode(img_arr, cv2.IMREAD_COLOR)
        faces = face_app.get(img)
        if not faces:
            raise HTTPException(status_code=400, detail=f"No face found in pose {idx+1}")
        embeddings.append(faces[0].embedding)
    emb_path = f"students/{student_id}/embeddings.npy"
    np.save(emb_path, np.array(embeddings))
    # Save embedding path in DB
    db.add(FaceEmbedding(student_id=student_id, embedding_path=emb_path))
    db.commit()
    return {"status": "success", "embeddings_saved": len(embeddings)}


class RecognizeRequest(BaseModel):
    image: str
    subject_name: str
    class_time: str


@app.post("/api/attendance/recognize")
def recognize(req: RecognizeRequest):
    img_data = base64.b64decode(req.image.split(",")[1])
    img_arr = np.frombuffer(img_data, np.uint8)
    img = cv2.imdecode(img_arr, cv2.IMREAD_COLOR)
    faces = face_app.get(img)
    if not faces:
        return {"match": False}
    embedding = faces[0].embedding
    best_match = None
    best_score = 0.0
    for student_id in os.listdir("students"):
        emb_path = f"students/{student_id}/embeddings.npy"
        if not os.path.exists(emb_path):
            continue
        known_embs = np.load(emb_path)
        # Compute cosine similarity
        sims = np.dot(known_embs, embedding) / (np.linalg.norm(known_embs, axis=1) * np.linalg.norm(embedding) + 1e-8)
        score = np.max(sims)
        if score > best_score:
            best_score = score
            best_match = student_id
    threshold = 0.4  # InsightFace cosine similarity threshold (adjust as needed)
    if best_score > threshold:
        os.makedirs("attendance", exist_ok=True)
        record = {
            "student_id": best_match,
            "subject_name": req.subject_name,
            "class_time": req.class_time,
            "timestamp": datetime.now().isoformat(),
            "confidence": float(best_score),
        }
        with open(f"attendance/{best_match}_{req.subject_name}_{req.class_time}.json", "w") as f:
            import json
            json.dump(record, f)
        return {
            "match": True,
            "student_id": best_match,
            "confidence": float(best_score),
        }
    return {"match": False}


# TEACHER CRUD
from fastapi import Query

class TeacherCreate(BaseModel):
    name: str
    email: str
    username: str
    password: str

@app.post("/api/teachers/")
def create_teacher(teacher: TeacherCreate, db: Session = Depends(get_db)):
    new_teacher = Teacher(**teacher.dict())
    db.add(new_teacher)
    db.commit()
    db.refresh(new_teacher)
    return new_teacher


# Leave request endpoints
class LeaveCreate(BaseModel):
    teacher_id: int
    timetable_entry_id: int
    date: str
    replacement_teacher_id: int | None = None


@app.post("/api/leaves/")
def create_leave(req: LeaveCreate, db: Session = Depends(get_db)):
    # auto-assign if replacement not provided
    assigned = req.replacement_teacher_id
    auto_assigned = 0
    if not assigned:
        # pick any other teacher
        cand = db.query(Teacher).filter(Teacher.id != req.teacher_id).first()
        if cand:
            assigned = cand.id
            auto_assigned = 1

    lr = LeaveRequestModel(
        teacher_id=req.teacher_id,
        timetable_entry_id=req.timetable_entry_id,
        date=req.date,
        replacement_teacher_id=assigned,
        auto_assigned=auto_assigned,
        status="open",
    )
    db.add(lr)
    db.commit()
    db.refresh(lr)
    return lr


@app.get("/api/leaves/")
def list_leaves(status: str | None = None, db: Session = Depends(get_db)):
    q = db.query(LeaveRequestModel)
    if status:
        q = q.filter(LeaveRequestModel.status == status)
    return q.all()


@app.put("/api/leaves/{leave_id}/resolve")
def resolve_leave(leave_id: int, replacement_teacher_id: int | None = None, db: Session = Depends(get_db)):
    lr = db.query(LeaveRequestModel).filter(LeaveRequestModel.id == leave_id).first()
    if not lr:
        raise HTTPException(status_code=404, detail="Leave request not found")
    assigned = replacement_teacher_id or lr.replacement_teacher_id
    if assigned:
        sub = SubstitutionModel(timetable_entry_id=lr.timetable_entry_id, date=lr.date, replacement_teacher_id=assigned, original_teacher_id=lr.teacher_id)
        db.add(sub)
    lr.replacement_teacher_id = assigned
    lr.status = "resolved"
    db.commit()
    db.refresh(lr)
    return lr


@app.put("/api/leaves/{leave_id}/reject")
def reject_leave(leave_id: int, db: Session = Depends(get_db)):
    lr = db.query(LeaveRequestModel).filter(LeaveRequestModel.id == leave_id).first()
    if not lr:
        raise HTTPException(status_code=404, detail="Leave request not found")
    lr.status = "rejected"
    db.commit()
    db.refresh(lr)
    return lr

@app.get("/api/teachers/")
def get_teachers(db: Session = Depends(get_db)):
    return db.query(Teacher).all()


@app.get("/api/students/")
def get_students(db: Session = Depends(get_db)):
    """Return all students from the database."""
    return db.query(Student).all()


@app.post("/api/seed-demo-students")
def seed_demo_students(db: Session = Depends(get_db)):
    """Create demo student records (if missing): sakshamjain, rohain, anirduh, varun"""
    demo_names = [
        ("Saksham Jain", "sakshamjain"),
        ("Rohain", "rohain"),
        ("Anirduh", "anirduh"),
        ("Varun", "varun"),
    ]
    created = []
    for display_name, uname in demo_names:
        existing = db.query(Student).filter(Student.username == uname).first()
        if not existing:
            new_s = Student(name=display_name, email=f"{uname}@example.com", username=uname, password=uname, course="BIT", semester="First")
            db.add(new_s)
            db.commit()
            db.refresh(new_s)
            created.append({"id": new_s.id, "username": new_s.username, "name": new_s.name})

    return {"created": created, "count": len(created)}

@app.get("/api/teachers/{teacher_id}")
def get_teacher(teacher_id: int, db: Session = Depends(get_db)):
    teacher = db.query(Teacher).filter(Teacher.id == teacher_id).first()
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")
    return teacher

@app.delete("/api/teachers/{teacher_id}")
def delete_teacher(teacher_id: int, db: Session = Depends(get_db)):
    teacher = db.query(Teacher).filter(Teacher.id == teacher_id).first()
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")
    db.delete(teacher)
    db.commit()
    return {"status": "deleted"}

# ADMIN CRUD
class AdminCreate(BaseModel):
    name: str
    email: str
    username: str
    password: str

@app.post("/api/admins/")
def create_admin(admin: AdminCreate, db: Session = Depends(get_db)):
    new_admin = Admin(**admin.dict())
    db.add(new_admin)
    db.commit()
    db.refresh(new_admin)
    return new_admin

@app.get("/api/admins/")
def get_admins(db: Session = Depends(get_db)):
    return db.query(Admin).all()

# SUBJECT CRUD
class SubjectCreate(BaseModel):
    name: str
    code: str
    teacher_id: int

@app.post("/api/subjects/")
def create_subject(subject: SubjectCreate, db: Session = Depends(get_db)):
    new_subject = Subject(**subject.dict())
    db.add(new_subject)
    db.commit()
    db.refresh(new_subject)
    return new_subject

@app.get("/api/subjects/")
def get_subjects(db: Session = Depends(get_db)):
    return db.query(Subject).all()

# ATTENDANCE CRUD
class AttendanceCreate(BaseModel):
    student_id: int
    subject_id: int
    class_time: str
    status: str
    confidence: float = None

@app.post("/api/attendance/")
def create_attendance(att: AttendanceCreate, db: Session = Depends(get_db)):
    new_att = Attendance(**att.dict())
    db.add(new_att)
    db.commit()
    db.refresh(new_att)
    return new_att

@app.get("/api/attendance/")
def get_attendance(db: Session = Depends(get_db)):
    return db.query(Attendance).all()


@app.post("/api/seed-demo")
def seed_demo(db: Session = Depends(get_db)):
    # Simple idempotent seeding: only create records if tables are empty
    created = {"teachers": 0, "students": 0, "subjects": 0, "attendance": 0}

    if db.query(Teacher).count() == 0:
        demo_teachers = [
            Teacher(name="John Smith", email="john@example.com", username="johnsmith", password="pass"),
            Teacher(name="Sarah Johnson", email="sarah@example.com", username="sarahj", password="pass"),
            Teacher(name="Mike Wilson", email="mike@example.com", username="mikew", password="pass"),
        ]
        db.add_all(demo_teachers)
        db.commit()
        created["teachers"] = len(demo_teachers)

    if db.query(Student).count() == 0:
        demo_students = [
            Student(name="Manoj Raj", email="manoj@example.com", username="manoj", password="s1", course="BIT", semester="First"),
            Student(name="Mario Dil", email="mario@example.com", username="mario", password="s2", course="BIT", semester="First"),
            Student(name="Kiara Advani", email="kiara@example.com", username="kiara", password="s3", course="BIT", semester="Second"),
            # Add Anuj Kumar demo student for testing low attendance
            Student(name="Anuj Kumar", email="anuj@example.com", username="anuj", password="anuj", course="BIT", semester="First"),
        ]
        db.add_all(demo_students)
        db.commit()
        created["students"] = len(demo_students)

    # Ensure specific demo students exist (create if missing)
    demo_names = [
        ("Saksham Jain", "sakshamjain"),
        ("Rohain", "rohain"),
        ("Anirduh", "anirduh"),
        ("Varun", "varun"),
    ]
    for display_name, uname in demo_names:
        existing = db.query(Student).filter(Student.username == uname).first()
        if not existing:
            new_s = Student(name=display_name, email=f"{uname}@example.com", username=uname, password=uname, course="BIT", semester="First")
            db.add(new_s)
            db.commit()
            created.setdefault("students_added_extra", 0)
            created["students_added_extra"] += 1

    if db.query(Subject).count() == 0:
        # pick first two teachers if exist
        t = db.query(Teacher).limit(3).all()
        demo_subjects = [
            Subject(name="Advanced Java", code="CS301", teacher_id=t[0].id if len(t) > 0 else None),
            Subject(name="Data Structures", code="CS201", teacher_id=t[1].id if len(t) > 1 else None),
            Subject(name="Database Management", code="CS401", teacher_id=t[2].id if len(t) > 2 else None),
        ]
        db.add_all(demo_subjects)
        db.commit()
        created["subjects"] = len(demo_subjects)

    # Seed attendance for the last 7 days for each student-subject pair
    students = db.query(Student).all()
    subjects = db.query(Subject).all()
    if students and subjects:
        today = datetime.utcnow()
        added = 0
        for d in range(7):
            date = (today).strftime("%Y-%m-%d")
            for s in students:
                for sub in subjects:
                    # Random present/absent
                    import random
                    status = "present" if random.random() < 0.8 else "absent"
                    att = Attendance(student_id=s.id, subject_id=sub.id, class_time="09:00-10:00", timestamp=today, status=status, confidence=1.0)
                    db.add(att)
                    added += 1
            # move to previous day (safe fallback)
            today = today - timedelta(days=1)
        db.commit()
        created["attendance"] = added

    # Ensure Anuj has deterministic attendance records: 11 present, 7 absent across the last 18 days for each subject
    anuj = db.query(Student).filter(Student.username == "anuj").first()
    if anuj:
        # remove any old Anuj attendance to avoid duplicates
        db.query(Attendance).filter(Attendance.student_id == anuj.id).delete()
        db.commit()
        # create 7 records per subject: first 5 present, last 2 absent
        subjects = db.query(Subject).all()
        if subjects:
            today = datetime.utcnow()
            added_anuj = 0
            # Create 18 days of records: first 11 days present, last 7 days absent
            for d in range(18):
                ts = today - timedelta(days=d)
                status = "present" if d < 11 else "absent"
                for sub in subjects:
                    att = Attendance(student_id=anuj.id, subject_id=sub.id, class_time="09:00-10:00", timestamp=ts, status=status, confidence=1.0)
                    db.add(att)
                    added_anuj += 1
            db.commit()
            created.setdefault("anuj_attendance", 0)
            created["anuj_attendance"] = added_anuj

    return {"status": "seeded", "created": created}


# Dependency for DB session

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
