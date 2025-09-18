from fastapi import FastAPI, HTTPException, Depends
from pydantic import BaseModel
import os
import base64
import numpy as np
from typing import List
from datetime import datetime
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

@app.get("/api/teachers/")
def get_teachers(db: Session = Depends(get_db)):
    return db.query(Teacher).all()

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


# Dependency for DB session

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
