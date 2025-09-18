"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"

export interface Teacher {
  id: number
  name: string
  email: string
  username: string
  password: string
  subject: string
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

interface DataContextType {
  teachers: Teacher[]
  students: Student[]
  subjects: Subject[]
  timetable: TimetableEntry[]
  attendance: AttendanceRecord[]
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
            enrolledStudents: [1, 2],
          },
          {
            id: 2,
            name: "Data Structures",
            code: "CS201",
            course: "Computer Science",
            teacher: "Sarah Johnson",
            teacherId: 2,
            enrolledStudents: [1, 3],
          },
          {
            id: 3,
            name: "Database Management",
            code: "CS401",
            course: "Computer Science",
            teacher: "Mike Wilson",
            teacherId: 3,
            enrolledStudents: [2, 3],
          },
          {
            id: 4,
            name: "Web Development",
            code: "CS501",
            course: "Computer Science",
            teacher: "John Smith",
            teacherId: 1,
            enrolledStudents: [1],
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
        setAttendance([])
        localStorage.setItem("attendify-attendance", JSON.stringify([]))
      }
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
