"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"

export interface Teacher {
  id: number
  name: string
  email: string
  username: string
  password: string
  subject?: string
  address?: string
}

export interface Student {
  id: number
  name: string
  email: string
  username: string
  password: string
  course: string
  semester?: string
  totalPresentDay?: number
  totalAbsenceDay?: number
  faceData?: string // Base64 encoded face image for recognition
}

export interface Subject {
  id: number
  name: string
  code: string
  course: string
  teacher: string
  teacherId?: number
  enrolledStudents?: number[]
}

export interface TimetableEntry {
  id: number
  day: string
  timeSlot: string
  subjectId: number
  teacherId: number
  room: string
  course: string
}

export interface AttendanceRecord {
  id: number
  studentId: number
  subjectId: number
  date: string
  status: "present" | "absent"
  timetableEntryId: number
}

export interface LeaveRequest {
  id: number
  teacherId: number
  timetableEntryId: number
  date: string // ISO yyyy-mm-dd
  replacementTeacherId: number | null
  autoAssigned: boolean
  status: "open" | "resolved"
}

export interface Substitution {
  id: number
  timetableEntryId: number
  date: string // ISO
  replacementTeacherId: number
  originalTeacherId: number
}

interface DataContextType {
  teachers: Teacher[]
  students: Student[]
  subjects: Subject[]
  timetable: TimetableEntry[]
  attendance: AttendanceRecord[]
  leaveRequests: LeaveRequest[]
  substitutions: Substitution[]
  addTeacher: (teacher: Omit<Teacher, "id">) => void
  updateTeacher: (id: number, teacher: Partial<Teacher>) => void
  deleteTeacher: (id: number) => void
  addStudent: (student: Omit<Student, "id">) => void
  updateStudent: (id: number, student: Partial<Student>) => void
  deleteStudent: (id: number) => void
  addSubject: (subject: Omit<Subject, "id">) => void
  updateSubject: (id: number, subject: Partial<Subject>) => void
  deleteSubject: (id: number) => void
  addTimetableEntry: (entry: Omit<TimetableEntry, "id">) => void
  updateTimetableEntry: (id: number, entry: Partial<TimetableEntry>) => void
  deleteTimetableEntry: (id: number) => void
  markAttendance: (studentId: number, subjectId: number, status: "present" | "absent", timetableEntryId: number) => void
  getAttendanceForClass: (timetableEntryId: number) => AttendanceRecord[]
  enrollStudentInSubject: (studentId: number, subjectId: number) => void
  unenrollStudentFromSubject: (studentId: number, subjectId: number) => void
  getEnrolledStudents: (subjectId: number) => Student[]
  getStudentSubjects: (studentId: number) => Subject[]
  getAttendanceCountsForStudentInSubject: (studentId: number, subjectId: number) => {
    presentCount: number
    totalClasses: number
  }
  seedAttendance: (days?: number) => void
  seedPatternedAttendance: (days?: number) => void
  applyLeave: (
    teacherId: number,
    timetableEntryId: number,
    date: string,
    replacementTeacherId?: number | null,
  ) => number | null
  isTeacherOnLeave: (teacherId: number, date?: string) => boolean
  resolveLeave: (leaveRequestId: number, replacementTeacherId?: number | null) => boolean
  addSubstitution: (timetableEntryId: number, date: string, replacementTeacherId: number, originalTeacherId: number) => number
  getReplacementForEntry: (timetableEntryId: number, date: string) => number | null
  updateStudentFaceData: (studentId: number, faceData: string) => void
  recognizeFace: (capturedFaceData: string, enrolledStudents: Student[]) => Student | null
  getStats: () => {
    totalStudents: number
    totalTeachers: number
    totalSubjects: number
    totalPresent: number
    totalAbsent: number
    attendanceRate: number
  }
}

const DataContext = createContext<DataContextType | undefined>(undefined)

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [timetable, setTimetable] = useState<TimetableEntry[]>([])
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([])
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([])
  const [substitutions, setSubstitutions] = useState<Substitution[]>([])

  useEffect(() => {
    const initializeData = () => {
      const savedTeachers = localStorage.getItem("attendify-teachers")
      if (savedTeachers) {
        setTeachers(JSON.parse(savedTeachers))
      } else {
        const defaultTeachers = [
          {
            id: 1,
            name: "John Smith",
            email: "john@gmail.com",
            username: "johnsmith",
            password: "password123",
            subject: "Mathematics",
          },
          {
            id: 2,
            name: "Sarah Johnson",
            email: "sarah@gmail.com",
            username: "sarahj",
            password: "password456",
            subject: "Science",
          },
          {
            id: 3,
            name: "Mike Wilson",
            email: "mike@gmail.com",
            username: "mikew",
            password: "password789",
            subject: "English",
          },
        ]
        setTeachers(defaultTeachers)
        localStorage.setItem("attendify-teachers", JSON.stringify(defaultTeachers))
      }

      // Try to load students from backend API first. If backend unavailable, fall back to localStorage/defaults.
      ;(async () => {
        const backendBase = "http://127.0.0.1:8000"
        try {
          const res = await fetch(`${backendBase}/api/students/`, { cache: "no-store" })
          if (res.ok) {
            const data = await res.json()
            if (Array.isArray(data) && data.length > 0) {
              // Map backend student shape to frontend Student type where possible
              const mapped = data.map((s: any, idx: number) => ({
                id: s.id || idx + 1,
                name: s.name || s.username || `student-${idx + 1}`,
                email: s.email || `${s.username || `student${idx + 1}`}@example.com`,
                username: s.username || `${s.name?.toLowerCase().replace(/\s+/g, "")}`,
                password: s.password || "",
                course: s.course || "BIT",
                semester: s.semester || "First",
                totalPresentDay: (s.totalPresentDay as number) || undefined,
                totalAbsenceDay: (s.totalAbsenceDay as number) || undefined,
              }))
              setStudents(mapped)
              localStorage.setItem("attendify-students", JSON.stringify(mapped))
              return
            }
            // If backend returned empty array, attempt to seed demo students then re-fetch
            if (Array.isArray(data) && data.length === 0) {
              try {
                await fetch(`${backendBase}/api/seed-demo-students`, { method: "POST" })
                const retry = await fetch(`${backendBase}/api/students/`, { cache: "no-store" })
                if (retry.ok) {
                  const data2 = await retry.json()
                  if (Array.isArray(data2) && data2.length > 0) {
                    const mapped = data2.map((s: any, idx: number) => ({
                      id: s.id || idx + 1,
                      name: s.name || s.username || `student-${idx + 1}`,
                      email: s.email || `${s.username || `student${idx + 1}`}@example.com`,
                      username: s.username || `${s.name?.toLowerCase().replace(/\s+/g, "")}`,
                      password: s.password || "",
                      course: s.course || "BIT",
                      semester: s.semester || "First",
                      totalPresentDay: (s.totalPresentDay as number) || undefined,
                      totalAbsenceDay: (s.totalAbsenceDay as number) || undefined,
                    }))
                    setStudents(mapped)
                    localStorage.setItem("attendify-students", JSON.stringify(mapped))
                    return
                  }
                }
              } catch (e) {
                // ignore seed errors and fall back
              }
            }
          }
        } catch (e) {
          // backend not reachable — fallback to localStorage/defaults below
        }

        // Fallback if backend fetch failed or returned nothing
        const savedStudents = localStorage.getItem("attendify-students")
        if (savedStudents) {
          setStudents(JSON.parse(savedStudents))
        } else {
          const defaultStudents = [
            {
              id: 1,
              name: "Manoj Raj",
              email: "manoj@gmail.com",
              username: "@manojRaj",
              password: "manoj",
              course: "BIT",
              semester: "First",
              totalPresentDay: 10,
              totalAbsenceDay: 2,
            },
            {
              id: 4,
              name: "Anuj Kumar",
              email: "anuj@example.com",
              username: "anuj",
              password: "anuj",
              course: "BIT",
              semester: "First",
              totalPresentDay: 5,
              totalAbsenceDay: 2,
            },
            {
              id: 2,
              name: "mario Dil",
              email: "mario@gmail.com",
              username: "@parakas",
              password: "parakas",
              course: "BIT",
              semester: "First",
              totalPresentDay: 8,
              totalAbsenceDay: 10,
            },
            {
              id: 3,
              name: "Kiara Advani",
              email: "kiara@gmail.com",
              username: "@kiara",
              password: "Manag",
              course: "BIT",
              semester: "Second",
              totalPresentDay: 15,
              totalAbsenceDay: 3,
            },
          ]
          setStudents(defaultStudents)
          localStorage.setItem("attendify-students", JSON.stringify(defaultStudents))
        }
      })()

      const savedSubjects = localStorage.getItem("attendify-subjects")
      if (savedSubjects) {
        setSubjects(JSON.parse(savedSubjects))
      } else {
        const defaultSubjects = [
          {
            id: 1,
            name: "Advanced Java",
            code: "CS301",
            course: "Computer Science",
            teacher: "John Smith",
            teacherId: 1,
            enrolledStudents: [1, 2, 4],
          },
          {
            id: 2,
            name: "Data Structures",
            code: "CS201",
            course: "Computer Science",
            teacher: "Sarah Johnson",
            teacherId: 2,
            enrolledStudents: [1, 3, 4],
          },
          {
            id: 3,
            name: "Database Management",
            code: "CS401",
            course: "Computer Science",
            teacher: "Mike Wilson",
            teacherId: 3,
            enrolledStudents: [2, 3, 4],
          },
          {
            id: 4,
            name: "Web Development",
            code: "CS501",
            course: "Computer Science",
            teacher: "John Smith",
            teacherId: 1,
            enrolledStudents: [1, 4],
          },
        ]
        setSubjects(defaultSubjects)
        localStorage.setItem("attendify-subjects", JSON.stringify(defaultSubjects))
      }

      const savedTimetable = localStorage.getItem("attendify-timetable")
      if (savedTimetable) {
        setTimetable(JSON.parse(savedTimetable))
      } else {
        const defaultTimetable = [
          {
            id: 1,
            day: "Monday",
            timeSlot: "09:00 - 10:00",
            subjectId: 1,
            teacherId: 1,
            room: "Room 101",
            course: "Computer Science",
          },
          {
            id: 2,
            day: "Monday",
            timeSlot: "10:00 - 11:00",
            subjectId: 2,
            teacherId: 2,
            room: "Room 102",
            course: "Computer Science",
          },
          {
            id: 3,
            day: "Tuesday",
            timeSlot: "09:00 - 10:00",
            subjectId: 3,
            teacherId: 3,
            room: "Room 103",
            course: "Computer Science",
          },
          {
            id: 4,
            day: "Tuesday",
            timeSlot: "10:00 - 11:00",
            subjectId: 4,
            teacherId: 1,
            room: "Room 104",
            course: "Computer Science",
          },
          {
            id: 5,
            day: "Wednesday",
            timeSlot: "09:00 - 10:00",
            subjectId: 1,
            teacherId: 1,
            room: "Room 101",
            course: "Computer Science",
          },
        ]
        setTimetable(defaultTimetable)
        localStorage.setItem("attendify-timetable", JSON.stringify(defaultTimetable))
      }

      const savedAttendance = localStorage.getItem("attendify-attendance")
      if (savedAttendance) {
        setAttendance(JSON.parse(savedAttendance))
      } else {
        // Seed one week of attendance data based on timetable and enrolled students
        const seededAttendance: AttendanceRecord[] = []
        const today = new Date()
        const daysToSeed = 7
        let nextId = 1

        // Helper to format date
        const fmt = (d: Date) => d.toISOString().split("T")[0]

        for (let i = 0; i < daysToSeed; i++) {
          const d = new Date()
          d.setDate(today.getDate() - i)
          const dayName = d.toLocaleDateString(undefined, { weekday: "long" })
          const dateStr = fmt(d)

          const entries = (
            (JSON.parse(localStorage.getItem("attendify-timetable") || "[]") as TimetableEntry[]) || []
          ).filter((t) => t.day === dayName)

          entries.forEach((entry) => {
            const subject = (JSON.parse(localStorage.getItem("attendify-subjects") || "[]") as Subject[]).find(
              (s) => s.id === entry.subjectId,
            )
            const enrolled = subject?.enrolledStudents || []
            enrolled.forEach((studentId) => {
              // 80% chance present
              const isPresent = Math.random() < 0.8
              seededAttendance.push({
                id: nextId++,
                studentId,
                subjectId: entry.subjectId,
                date: dateStr,
                status: isPresent ? "present" : "absent",
                timetableEntryId: entry.id,
              })
            })
          })
        }

        // Ensure Anuj (id:4) has deterministic demo attendance: 5 present, 2 absent over last 7 days
        try {
          const anujId = 4
          const subjectsList = (JSON.parse(localStorage.getItem("attendify-subjects") || "[]") as Subject[])
          if (subjectsList.length > 0) {
            const fmt = (d: Date) => d.toISOString().split("T")[0]
            let adate = new Date()
            // create 7 records: first 5 present, last 2 absent
            for (let i = 0; i < 7; i++) {
              const subj = subjectsList[i % subjectsList.length]
              const isPresent = i < 5
              seededAttendance.push({
                id: nextId++,
                studentId: anujId,
                subjectId: subj.id,
                date: fmt(adate),
                status: isPresent ? "present" : "absent",
                timetableEntryId: (JSON.parse(localStorage.getItem("attendify-timetable") || "[]") as TimetableEntry[]).find((t) => t.subjectId === subj.id)?.id || 0,
              })
              adate.setDate(adate.getDate() - 1)
            }
          }
        } catch (e) {
          // ignore seeding errors
        }

        // Update student totals
        const updatedStudents = (JSON.parse(localStorage.getItem("attendify-students") || "[]") as Student[]).map(
          (s) => ({ ...s, totalPresentDay: 0, totalAbsenceDay: 0 }),
        )

        seededAttendance.forEach((rec) => {
          const st = updatedStudents.find((u) => u.id === rec.studentId)
          if (st) {
            if (rec.status === "present") st.totalPresentDay = (st.totalPresentDay || 0) + 1
            else st.totalAbsenceDay = (st.totalAbsenceDay || 0) + 1
          }
        })

        setAttendance(seededAttendance)
        localStorage.setItem("attendify-attendance", JSON.stringify(seededAttendance))
        setStudents(updatedStudents)
        localStorage.setItem("attendify-students", JSON.stringify(updatedStudents))
      }
      // load leave requests if present
      const savedLeaves = localStorage.getItem("attendify-leaves")
      if (savedLeaves) {
        setLeaveRequests(JSON.parse(savedLeaves))
      }
      const savedSubs = localStorage.getItem("attendify-subs")
      if (savedSubs) setSubstitutions(JSON.parse(savedSubs))
    }

    initializeData()
  }, [])

  useEffect(() => {
    if (teachers.length > 0) {
      localStorage.setItem("attendify-teachers", JSON.stringify(teachers))
    }
  }, [teachers])

  useEffect(() => {
    if (students.length > 0) {
      localStorage.setItem("attendify-students", JSON.stringify(students))
    }
  }, [students])

  useEffect(() => {
    if (subjects.length > 0) {
      localStorage.setItem("attendify-subjects", JSON.stringify(subjects))
    }
  }, [subjects])

  useEffect(() => {
    if (timetable.length > 0) {
      localStorage.setItem("attendify-timetable", JSON.stringify(timetable))
    }
  }, [timetable])

  useEffect(() => {
    localStorage.setItem("attendify-attendance", JSON.stringify(attendance))
  }, [attendance])

  useEffect(() => {
    localStorage.setItem("attendify-leaves", JSON.stringify(leaveRequests))
  }, [leaveRequests])

  useEffect(() => {
    localStorage.setItem("attendify-subs", JSON.stringify(substitutions))
  }, [substitutions])

  const addTeacher = (teacher: Omit<Teacher, "id">) => {
    const newId = Math.max(...teachers.map((t) => t.id), 0) + 1
    setTeachers((prev) => [...prev, { ...teacher, id: newId }])
  }

  const updateTeacher = (id: number, updatedTeacher: Partial<Teacher>) => {
    setTeachers((prev) => prev.map((teacher) => (teacher.id === id ? { ...teacher, ...updatedTeacher } : teacher)))
  }

  const deleteTeacher = (id: number) => {
    setTeachers((prev) => prev.filter((teacher) => teacher.id !== id))
  }

  const addStudent = (student: Omit<Student, "id">) => {
    const newId = Math.max(...students.map((s) => s.id), 0) + 1
    const newStudent = {
      ...student,
      id: newId,
      semester: student.semester || "First",
      totalPresentDay: student.totalPresentDay || 0,
      totalAbsenceDay: student.totalAbsenceDay || 0,
    }
    setStudents((prev) => [...prev, newStudent])
  }

  const updateStudent = (id: number, updatedStudent: Partial<Student>) => {
    setStudents((prev) => prev.map((student) => (student.id === id ? { ...student, ...updatedStudent } : student)))
  }

  const deleteStudent = (id: number) => {
    setStudents((prev) => prev.filter((student) => student.id !== id))
    // also remove student from any subject enrollments
    setSubjects((prev) =>
      prev.map((subject) => ({
        ...subject,
        enrolledStudents: subject.enrolledStudents ? subject.enrolledStudents.filter((sid) => sid !== id) : [],
      })),
    )
  }

  const addSubject = (subject: Omit<Subject, "id">) => {
    const newId = Math.max(...subjects.map((s) => s.id), 0) + 1
    setSubjects((prev) => [...prev, { ...subject, id: newId, enrolledStudents: [] }])
  }

  const updateSubject = (id: number, updatedSubject: Partial<Subject>) => {
    setSubjects((prev) => prev.map((subject) => (subject.id === id ? { ...subject, ...updatedSubject } : subject)))
  }

  const deleteSubject = (id: number) => {
    setSubjects((prev) => prev.filter((subject) => subject.id !== id))
  }

  const addTimetableEntry = (entry: Omit<TimetableEntry, "id">) => {
    const newId = Math.max(...timetable.map((t) => t.id), 0) + 1
    setTimetable((prev) => [...prev, { ...entry, id: newId }])
  }

  const updateTimetableEntry = (id: number, updatedEntry: Partial<TimetableEntry>) => {
    setTimetable((prev) => prev.map((entry) => (entry.id === id ? { ...entry, ...updatedEntry } : entry)))
  }

  const deleteTimetableEntry = (id: number) => {
    setTimetable((prev) => prev.filter((entry) => entry.id !== id))
    setAttendance((prev) => prev.filter((record) => record.timetableEntryId !== id))
  }

  const markAttendance = (
    studentId: number,
    subjectId: number,
    status: "present" | "absent",
    timetableEntryId: number,
  ) => {
    const today = new Date().toISOString().split("T")[0]
    const existingRecord = attendance.find(
      (record) =>
        record.studentId === studentId && record.timetableEntryId === timetableEntryId && record.date === today,
    )

    if (existingRecord) {
      setAttendance((prev) => prev.map((record) => (record.id === existingRecord.id ? { ...record, status } : record)))
    } else {
      const newId = Math.max(...attendance.map((a) => a.id), 0) + 1
      setAttendance((prev) => [
        ...prev,
        {
          id: newId,
          studentId,
          subjectId,
          date: today,
          status,
          timetableEntryId,
        },
      ])
    }

    const student = students.find((s) => s.id === studentId)
    if (student) {
      const updatedStudent = { ...student }
      if (status === "present") {
        updatedStudent.totalPresentDay = (updatedStudent.totalPresentDay || 0) + 1
        if (existingRecord?.status === "absent") {
          updatedStudent.totalAbsenceDay = Math.max((updatedStudent.totalAbsenceDay || 0) - 1, 0)
        }
      } else {
        updatedStudent.totalAbsenceDay = (updatedStudent.totalAbsenceDay || 0) + 1
        if (existingRecord?.status === "present") {
          updatedStudent.totalPresentDay = Math.max((updatedStudent.totalPresentDay || 0) - 1, 0)
        }
      }
      updateStudent(studentId, updatedStudent)
    }
  }

  const getAttendanceForClass = (timetableEntryId: number) => {
    const today = new Date().toISOString().split("T")[0]
    return attendance.filter((record) => record.timetableEntryId === timetableEntryId && record.date === today)
  }

  const enrollStudentInSubject = (studentId: number, subjectId: number) => {
    setSubjects((prev) =>
      prev.map((subject) =>
        subject.id === subjectId
          ? {
              ...subject,
              enrolledStudents: subject.enrolledStudents?.includes(studentId)
                ? subject.enrolledStudents
                : [...(subject.enrolledStudents || []), studentId],
            }
          : subject,
      ),
    )
  }

  const unenrollStudentFromSubject = (studentId: number, subjectId: number) => {
    setSubjects((prev) =>
      prev.map((subject) =>
        subject.id === subjectId
          ? {
              ...subject,
              enrolledStudents: subject.enrolledStudents?.filter((id) => id !== studentId) || [],
            }
          : subject,
      ),
    )
  }

  const getEnrolledStudents = (subjectId: number) => {
    const subject = subjects.find((s) => s.id === subjectId)
    if (!subject?.enrolledStudents) return []
    return students.filter((student) => subject.enrolledStudents!.includes(student.id))
  }

  const getStudentSubjects = (studentId: number) => {
    return subjects.filter((subject) => subject.enrolledStudents?.includes(studentId))
  }

  const seedAttendance = (days = 7) => {
    // similar to initialization seeding: generate `days` of attendance based on timetable and enrolled students
    const seededAttendance: AttendanceRecord[] = []
    const today = new Date()
    let nextId = Math.max(...attendance.map((a) => a.id), 0) + 1

    // Helper to format date
    const fmt = (d: Date) => d.toISOString().split("T")[0]

    for (let i = 0; i < days; i++) {
      const d = new Date()
      d.setDate(today.getDate() - i)
      const dayName = d.toLocaleDateString(undefined, { weekday: "long" })
      const dateStr = fmt(d)

      const entries = timetable.filter((t) => t.day === dayName)

      entries.forEach((entry) => {
        const subject = subjects.find((s) => s.id === entry.subjectId)
        const enrolled = subject?.enrolledStudents || []
        enrolled.forEach((studentId) => {
          const isPresent = Math.random() < 0.8
          seededAttendance.push({
            id: nextId++,
            studentId,
            subjectId: entry.subjectId,
            date: dateStr,
            status: isPresent ? "present" : "absent",
            timetableEntryId: entry.id,
          })
        })
      })
    }

    // Merge with existing attendance (keep old records plus new seeded ones)
    const merged = [...attendance, ...seededAttendance]
    setAttendance(merged)
    localStorage.setItem("attendify-attendance", JSON.stringify(merged))

    // Recompute student totals
    const updatedStudents = students.map((s) => ({ ...s, totalPresentDay: 0, totalAbsenceDay: 0 }))
    merged.forEach((rec) => {
      const st = updatedStudents.find((u) => u.id === rec.studentId)
      if (st) {
        if (rec.status === "present") st.totalPresentDay = (st.totalPresentDay || 0) + 1
        else st.totalAbsenceDay = (st.totalAbsenceDay || 0) + 1
      }
    })
    setStudents(updatedStudents)
    localStorage.setItem("attendify-students", JSON.stringify(updatedStudents))
  }

  // Seed attendance with deterministic patterns for demo/analysis (more absences on certain days/subjects/times)
  const seedPatternedAttendance = (days = 14) => {
    const seededAttendance: AttendanceRecord[] = []
    const today = new Date()
    let nextId = Math.max(...attendance.map((a) => a.id), 0) + 1

    const fmt = (d: Date) => d.toISOString().split("T")[0]

    for (let i = 0; i < days; i++) {
      const d = new Date()
      d.setDate(today.getDate() - i)
      const dayName = d.toLocaleDateString(undefined, { weekday: "long" })
      const dateStr = fmt(d)

      const entries = timetable.filter((t) => t.day === dayName)

      entries.forEach((entry) => {
        const subject = subjects.find((s) => s.id === entry.subjectId)
        const enrolled = subject?.enrolledStudents || []

        enrolled.forEach((studentId) => {
          // base present probability
          let presentProb = 0.8
          // make Mondays tougher (more absences)
          if (dayName === "Monday") presentProb = 0.5
          // specific subject more absences (if exists)
          if (entry.subjectId === 2) presentProb = Math.min(presentProb, 0.4)
          // certain time-slot (10:00) has more absences
          if (entry.timeSlot && entry.timeSlot.includes("10:00")) presentProb = Math.min(presentProb, 0.6)

          // also create a few chronically absent students (by id pattern)
          let isPresent = Math.random() < presentProb
          if (studentId % 5 === 0) {
            // every 5th student is more likely to be absent
            isPresent = Math.random() < (presentProb * 0.4)
          }

          seededAttendance.push({
            id: nextId++,
            studentId,
            subjectId: entry.subjectId,
            date: dateStr,
            status: isPresent ? "present" : "absent",
            timetableEntryId: entry.id,
          })
        })
      })
    }

    const merged = [...attendance.filter(a => !seededAttendance.some(s=>s.id===a.id)), ...seededAttendance]
    setAttendance(merged)
    localStorage.setItem("attendify-attendance", JSON.stringify(merged))

    // Recompute student totals
    const updatedStudents = students.map((s) => ({ ...s, totalPresentDay: 0, totalAbsenceDay: 0 }))
    merged.forEach((rec) => {
      const st = updatedStudents.find((u) => u.id === rec.studentId)
      if (st) {
        if (rec.status === "present") st.totalPresentDay = (st.totalPresentDay || 0) + 1
        else st.totalAbsenceDay = (st.totalAbsenceDay || 0) + 1
      }
    })
    setStudents(updatedStudents)
    localStorage.setItem("attendify-students", JSON.stringify(updatedStudents))
  }

  const applyLeave = (
    teacherId: number,
    timetableEntryId: number,
    date: string,
    replacementTeacherId: number | null = null,
  ) => {
    const newId = Math.max(...leaveRequests.map((l) => l.id), 0) + 1
    let autoAssigned = false
    let assignedReplacement = replacementTeacherId

    // If no replacement provided, auto-assign another teacher who teaches same subject or any other available teacher
    if (!assignedReplacement) {
      // Find timetable entry to get subject and teacher
      const entry = timetable.find((t) => t.id === timetableEntryId)
      // prefer teachers who are not the one on leave
      const candidates = teachers.filter((t) => t.id !== teacherId)
      if (candidates.length > 0) {
        assignedReplacement = candidates[0].id
        autoAssigned = true
      } else {
        assignedReplacement = null
      }
    }

    const newRequest: LeaveRequest = {
      id: newId,
      teacherId,
      timetableEntryId,
      date,
      replacementTeacherId: assignedReplacement,
      autoAssigned,
      status: "open",
    }
    setLeaveRequests((prev) => {
      const updated = [...prev, newRequest]
      try {
        localStorage.setItem("attendify-leaves", JSON.stringify(updated))
      } catch (e) {
        // ignore localStorage errors
      }
      return updated
    })
    return newRequest.id
  }

  const isTeacherOnLeave = (teacherId: number, date?: string) => {
    if (!date) date = new Date().toISOString().split("T")[0]
    return leaveRequests.some((lr) => lr.teacherId === teacherId && lr.date === date && lr.status === "open")
  }

  const addSubstitution = (timetableEntryId: number, date: string, replacementTeacherId: number, originalTeacherId: number) => {
    const newId = Math.max(...substitutions.map((s) => s.id), 0) + 1
    const sub: Substitution = { id: newId, timetableEntryId, date, replacementTeacherId, originalTeacherId }
    setSubstitutions((prev) => [...prev, sub])
    return newId
  }

  const getReplacementForEntry = (timetableEntryId: number, date: string) => {
    const s = substitutions.find((sub) => sub.timetableEntryId === timetableEntryId && sub.date === date)
    return s ? s.replacementTeacherId : null
  }

  const resolveLeave = (leaveRequestId: number, replacementTeacherId: number | null = null) => {
    const lr = leaveRequests.find((l) => l.id === leaveRequestId)
    if (!lr) return false
    // determine replacement
    let assigned = replacementTeacherId
    if (!assigned) {
      const candidates = teachers.filter((t) => t.id !== lr.teacherId)
      assigned = candidates.length > 0 ? candidates[0].id : null
    }
    if (assigned) {
      addSubstitution(lr.timetableEntryId, lr.date, assigned, lr.teacherId)
    }
    setLeaveRequests((prev) => prev.map((l) => (l.id === leaveRequestId ? { ...l, replacementTeacherId: assigned, autoAssigned: !replacementTeacherId, status: "resolved" } : l)))
    return true
  }

  const getAttendanceCountsForStudentInSubject = (studentId: number, subjectId: number) => {
    // Count present records for the student in the given subject
    const presentCount = attendance.filter(
      (record) => record.studentId === studentId && record.subjectId === subjectId && record.status === "present",
    ).length

    // Total classes for the subject is the number of distinct dates where attendance was recorded for that subject
    const dates = Array.from(
      new Set(attendance.filter((r) => r.subjectId === subjectId).map((r) => r.date)),
    )
    const totalClasses = dates.length

    return { presentCount, totalClasses }
  }

  const updateStudentFaceData = (studentId: number, faceData: string) => {
    setStudents((prev) => prev.map((student) => (student.id === studentId ? { ...student, faceData } : student)))
  }

  const recognizeFace = (capturedFaceData: string, enrolledStudents: Student[]): Student | null => {
    // Simple face recognition simulation - in real implementation, this would use ML libraries
    // For demo purposes, we'll simulate face matching based on stored face data
    const studentsWithFaceData = enrolledStudents.filter((student) => student.faceData)

    if (studentsWithFaceData.length === 0) return null

    // Simulate face recognition with 80% accuracy
    const matchProbability = Math.random()
    if (matchProbability > 0.2) {
      // Return a random student from those with face data (simulating successful recognition)
      const randomIndex = Math.floor(Math.random() * studentsWithFaceData.length)
      return studentsWithFaceData[randomIndex]
    }

    return null // No match found
  }

  const getStats = () => {
    const totalStudents = students.length
    const totalTeachers = teachers.length
    const totalSubjects = subjects.length
    const totalPresent = students.reduce((sum, student) => sum + (student.totalPresentDay || 0), 0)
    const totalAbsent = students.reduce((sum, student) => sum + (student.totalAbsenceDay || 0), 0)
    const attendanceRate =
      totalPresent + totalAbsent > 0 ? Math.round((totalPresent / (totalPresent + totalAbsent)) * 100) : 0

    return {
      totalStudents,
      totalTeachers,
      totalSubjects,
      totalPresent,
      totalAbsent,
      attendanceRate,
    }
  }

  return (
    <DataContext.Provider
      value={{
        teachers,
        students,
        subjects,
        timetable,
        attendance,
        addTeacher,
        updateTeacher,
        deleteTeacher,
        addStudent,
        updateStudent,
        deleteStudent,
        addSubject,
        updateSubject,
        deleteSubject,
        addTimetableEntry,
        updateTimetableEntry,
        deleteTimetableEntry,
        markAttendance,
        getAttendanceForClass,
        enrollStudentInSubject,
        unenrollStudentFromSubject,
  getEnrolledStudents,
  getStudentSubjects,
  getAttendanceCountsForStudentInSubject,
  seedAttendance,
  seedPatternedAttendance,
  leaveRequests,
  substitutions,
  applyLeave,
  isTeacherOnLeave,
  resolveLeave,
  addSubstitution,
  getReplacementForEntry,
  updateStudentFaceData,
  recognizeFace,
  getStats,
      }}
    >
      {children}
    </DataContext.Provider>
  )
}

export function useData() {
  const context = useContext(DataContext)
  if (context === undefined) {
    throw new Error("useData must be used within a DataProvider")
  }
  return context
}
