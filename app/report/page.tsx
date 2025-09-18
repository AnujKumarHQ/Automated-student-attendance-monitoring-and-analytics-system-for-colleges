"use client"

import { useState } from "react"
import { useData } from "@/lib/data-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import LiveVideoFeed from "@/components/live-video-feed"
import {
  Calendar,
  Users,
  BookOpen,
  Filter,
  Plus,
  Trash2,
  UserCheck,
  UserX,
  Camera,
  Bell,
  BarChart3,
  FileText,
  GraduationCap,
  User,
  LogOut,
  ChevronDown,
} from "lucide-react"

const timeSlots = [
  "09:00 - 10:00",
  "10:00 - 11:00",
  "11:00 - 12:00",
  "12:00 - 13:00",
  "13:00 - 14:00",
  "14:00 - 15:00",
  "15:00 - 16:00",
]

const weekDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]

export default function ReportPage() {
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const {
    students,
    teachers,
    subjects,
    timetable,
    addTimetableEntry,
    deleteTimetableEntry,
    markAttendance,
    getAttendanceForClass,
    getEnrolledStudents,
  } = useData()

  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCourse, setSelectedCourse] = useState("all")
  const [isAddingClass, setIsAddingClass] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<{ day: string; timeSlot: string } | null>(null)
  const [attendanceModal, setAttendanceModal] = useState<{
    isOpen: boolean
    timetableEntry: any
    classStudents: any[]
  }>({
    isOpen: false,
    timetableEntry: null,
    classStudents: [],
  })

  const [isCameraMode, setIsCameraMode] = useState(false)

  const [newClassForm, setNewClassForm] = useState({
    subjectId: "",
    teacherId: "",
    room: "",
    course: "",
  })

  const courses = [...new Set(subjects.map((s) => s.course))]

  const handleLogout = () => {
    window.location.href = "/"
  }

  const createTimetableGrid = () => {
    const grid: any = {}
    weekDays.forEach((day) => {
      grid[day] = {}
      timeSlots.forEach((slot) => {
        const entry = timetable.find((t) => t.day === day && t.timeSlot === slot)
        if (entry) {
          const subject = subjects.find((s) => s.id === entry.subjectId)
          const teacher = teachers.find((t) => t.id === entry.teacherId)
          const enrolledStudents = getEnrolledStudents(entry.subjectId)

          grid[day][slot] = {
            ...entry,
            subject: subject?.name || "Unknown Subject",
            teacher: teacher?.name || "Unknown Teacher",
            studentCount: enrolledStudents.length,
            students: enrolledStudents,
          }
        }
      })
    })
    return grid
  }

  const timetableGrid = createTimetableGrid()

  const handleAddClass = () => {
    if (selectedSlot && newClassForm.subjectId && newClassForm.teacherId && newClassForm.room) {
      const subject = subjects.find((s) => s.id === Number.parseInt(newClassForm.subjectId))
      addTimetableEntry({
        day: selectedSlot.day,
        timeSlot: selectedSlot.timeSlot,
        subjectId: Number.parseInt(newClassForm.subjectId),
        teacherId: Number.parseInt(newClassForm.teacherId),
        room: newClassForm.room,
        course: subject?.course || newClassForm.course,
      })
      setIsAddingClass(false)
      setSelectedSlot(null)
      setNewClassForm({ subjectId: "", teacherId: "", room: "", course: "" })
    }
  }

  const handleSubjectClick = (classData: any) => {
    const classStudents = getEnrolledStudents(classData.subjectId) || []
    const attendanceRecords = getAttendanceForClass(classData.id)

    const studentsWithAttendance = classStudents.map((student) => {
      const record = attendanceRecords.find((r) => r.studentId === student.id)
      return {
        ...student,
        attendanceStatus: record?.status || "unmarked",
      }
    })

    setAttendanceModal({
      isOpen: true,
      timetableEntry: classData,
      classStudents: studentsWithAttendance,
    })
    setIsCameraMode(false)
  }

  const handleMarkAttendance = (studentId: number, status: "present" | "absent") => {
    if (attendanceModal.timetableEntry) {
      markAttendance(studentId, attendanceModal.timetableEntry.subjectId, status, attendanceModal.timetableEntry.id)

      setAttendanceModal((prev) => ({
        ...prev,
        classStudents: prev.classStudents.map((student) =>
          student.id === studentId ? { ...student, attendanceStatus: status } : student,
        ),
      }))
    }
  }

  const handleAutoAttendanceMarked = (studentId: number, studentName: string) => {
    console.log("[v0] Auto attendance marked for:", studentName)
    handleMarkAttendance(studentId, "present")
  }

  const handleRecognitionResult = (result: string, isSuccess: boolean) => {
    console.log("[v0] Recognition result:", result, "Success:", isSuccess)
  }

  const handleCloseModal = () => {
    setIsCameraMode(false)
    setAttendanceModal((prev) => ({ ...prev, isOpen: false }))
  }

  const filteredTimetable = () => {
    const filtered: any = {}
    weekDays.forEach((day) => {
      filtered[day] = {}
      timeSlots.forEach((slot) => {
        const classData = timetableGrid[day]?.[slot]
        if (classData) {
          const matchesSearch =
            searchTerm === "" ||
            classData.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
            classData.teacher.toLowerCase().includes(searchTerm.toLowerCase())

          const matchesCourse = selectedCourse === "all" || classData.course === selectedCourse

          if (matchesSearch && matchesCourse) {
            filtered[day][slot] = classData
          }
        }
      })
    })
    return filtered
  }

  const displayTimetable = filteredTimetable()

  const totalClasses = timetable.length

  const averageStudentsPerClass =
    totalClasses > 0
      ? Math.round(
          timetable.reduce((total, entry) => {
            const enrolledStudents = getEnrolledStudents(entry.subjectId)
            return total + enrolledStudents.length
          }, 0) / totalClasses,
        )
      : 0

  const sidebarItems = [
    { id: "dashboard", label: "Dashboard", icon: BarChart3, href: "/dashboard" },
    { id: "attendance", label: "Attendance", icon: UserCheck, href: "/attendance" },
    { id: "absence", label: "Absence", icon: UserX, href: "/attendance" },
    { id: "report", label: "Report", icon: FileText, href: "/report" },
  ]

  const manageItems = [
    { id: "teacher", label: "Teacher", icon: GraduationCap, href: "/teacher" },
    { id: "student", label: "Student", icon: User, href: "/student" },
    { id: "subject", label: "Subject", icon: BookOpen, href: "/subject" },
  ]

  const handleNavigation = (item: any) => {
    if (item.href) {
      window.location.href = item.href
    }
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <div className="w-64 bg-white shadow-sm border-r">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-gray-900">Attendify</h1>
        </div>

        <nav className="px-4 space-y-1">
          <div className="mb-6">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">ANALYSE</p>
            {sidebarItems.map((item) => {
              const Icon = item.icon
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavigation(item)}
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    item.id === "report"
                      ? "bg-blue-50 text-blue-700 border-r-2 border-blue-700"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {item.label}
                </button>
              )
            })}
          </div>

          <div className="mb-6">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">MANAGE</p>
            {manageItems.map((item) => {
              const Icon = item.icon
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavigation(item)}
                  className="w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {item.label}
                </button>
              )
            })}
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">CHAL CHLA NIKAL</p>
            <button
              onClick={handleLogout}
              className="w-full flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-lg transition-colors"
            >
              <LogOut className="mr-3 h-5 w-5" />
              Logout
            </button>
          </div>
        </nav>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow-sm border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Report</h1>
              <p className="text-sm text-gray-500">Manage / Report</p>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="h-5 w-5" />
                <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-blue-600 text-xs p-0 flex items-center justify-center">
                  1
                </Badge>
              </Button>

              <DropdownMenu open={isProfileOpen} onOpenChange={setIsProfileOpen}>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-2 hover:bg-gray-50">
                    <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                      <User className="h-4 w-4 text-gray-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-700">Peterpan</span>
                    <ChevronDown className="h-4 w-4 text-gray-500" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6">
          <Tabs defaultValue="timetable" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="timetable">Class Timetable</TabsTrigger>
              <TabsTrigger value="statistics">Statistics</TabsTrigger>
              <TabsTrigger value="summary">Summary Report</TabsTrigger>
            </TabsList>

            <TabsContent value="timetable" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Filter className="w-5 h-5" />
                    Filters
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <Input
                        placeholder="Search by subject or teacher..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full"
                      />
                    </div>
                    <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Select Course" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Courses</SelectItem>
                        {courses.map((course) => (
                          <SelectItem key={course} value={course}>
                            {course}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Weekly Class Timetable</CardTitle>
                  <CardDescription>
                    Click on subject names to mark attendance. Click empty slots to add classes.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr>
                          <th className="border border-gray-200 p-3 bg-gray-50 text-left font-medium">Time</th>
                          {weekDays.map((day) => (
                            <th
                              key={day}
                              className="border border-gray-200 p-3 bg-gray-50 text-center font-medium min-w-48"
                            >
                              {day}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {timeSlots.map((slot) => (
                          <tr key={slot}>
                            <td className="border border-gray-200 p-3 bg-gray-50 font-medium text-sm">{slot}</td>
                            {weekDays.map((day) => {
                              const classData = displayTimetable[day]?.[slot]
                              return (
                                <td key={`${day}-${slot}`} className="border border-gray-200 p-2">
                                  {classData ? (
                                    <div className="space-y-2">
                                      <button
                                        onClick={() => handleSubjectClick(classData)}
                                        className="font-medium text-sm text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                                      >
                                        {classData.subject}
                                      </button>
                                      <div className="text-xs text-gray-600">{classData.teacher}</div>
                                      <div className="flex items-center justify-between">
                                        <Badge variant="secondary" className="text-xs">
                                          {classData.course}
                                        </Badge>
                                        <div className="flex items-center gap-1 text-xs text-gray-500">
                                          <Users className="w-3 h-3" />
                                          {classData.studentCount}
                                        </div>
                                      </div>
                                      <div className="text-xs text-gray-500">{classData.room}</div>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          deleteTimetableEntry(classData.id)
                                        }}
                                        className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </Button>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => {
                                        setSelectedSlot({ day, timeSlot: slot })
                                        setIsAddingClass(true)
                                      }}
                                      className="w-full text-gray-400 text-xs text-center py-4 hover:bg-gray-50 hover:text-gray-600 rounded"
                                    >
                                      <Plus className="w-4 h-4 mx-auto mb-1" />
                                      Add Class
                                    </button>
                                  )}
                                </td>
                              )
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="statistics" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{students.length}</div>
                    <p className="text-xs text-muted-foreground">Enrolled students</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Teachers</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{teachers.length}</div>
                    <p className="text-xs text-muted-foreground">Active teachers</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Subjects</CardTitle>
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{subjects.length}</div>
                    <p className="text-xs text-muted-foreground">Available subjects</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Weekly Classes</CardTitle>
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{timetable.length}</div>
                    <p className="text-xs text-muted-foreground">Total scheduled classes</p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="summary" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Summary Report</CardTitle>
                  <CardDescription>Comprehensive overview of the academic schedule and enrollment</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <h3 className="font-medium mb-3">Teacher Workload</h3>
                      <div className="space-y-2">
                        {teachers.map((teacher) => {
                          const teacherSubjects = subjects.filter((s) => s.teacherId === teacher.id)
                          return (
                            <div key={teacher.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                              <span className="text-sm">{teacher.name}</span>
                              <Badge variant="outline">{teacherSubjects.length} subjects</Badge>
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    <div>
                      <h3 className="font-medium mb-3">Class Capacity</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                          <span className="text-sm text-gray-600">Average Students per Class</span>
                          <Badge variant="outline">{averageStudentsPerClass} students</Badge>
                        </div>
                        <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                          <span className="text-sm text-gray-600">Total Weekly Classes</span>
                          <Badge variant="outline">{totalClasses} classes</Badge>
                        </div>
                        <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                          <span className="text-sm text-gray-600">Active Courses</span>
                          <Badge variant="outline">{courses.length} courses</Badge>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium mb-3">Subject Distribution</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {subjects.map((subject) => {
                        const teacher = teachers.find((t) => t.id === subject.teacherId)
                        const enrolledStudents = getEnrolledStudents(subject.id)

                        return (
                          <div key={subject.id} className="p-4 border rounded-lg">
                            <h4 className="font-medium text-blue-600">{subject.name}</h4>
                            <p className="text-sm text-gray-600 mt-1">Code: {subject.code}</p>
                            <p className="text-sm text-gray-600">Teacher: {teacher?.name || "Unassigned"}</p>
                            <p className="text-sm text-gray-600">Course: {subject.course}</p>
                            <div className="mt-2 flex items-center gap-1">
                              <Users className="w-4 h-4 text-gray-400" />
                              <span className="text-sm text-gray-600">{enrolledStudents.length} students</span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <Dialog open={isAddingClass} onOpenChange={setIsAddingClass}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Class</DialogTitle>
                <DialogDescription>
                  Add a new class to {selectedSlot?.day} at {selectedSlot?.timeSlot}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="subject">Subject</Label>
                  <Select
                    value={newClassForm.subjectId}
                    onValueChange={(value) => setNewClassForm((prev) => ({ ...prev, subjectId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map((subject) => (
                        <SelectItem key={subject.id} value={subject.id.toString()}>
                          {subject.name} ({subject.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="teacher">Teacher</Label>
                  <Select
                    value={newClassForm.teacherId}
                    onValueChange={(value) => setNewClassForm((prev) => ({ ...prev, teacherId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Teacher" />
                    </SelectTrigger>
                    <SelectContent>
                      {teachers.map((teacher) => (
                        <SelectItem key={teacher.id} value={teacher.id.toString()}>
                          {teacher.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="room">Room</Label>
                  <Input
                    id="room"
                    value={newClassForm.room}
                    onChange={(e) => setNewClassForm((prev) => ({ ...prev, room: e.target.value }))}
                    placeholder="e.g., Room 101"
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleAddClass} className="flex-1">
                    Add Class
                  </Button>
                  <Button variant="outline" onClick={() => setIsAddingClass(false)} className="flex-1">
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={attendanceModal.isOpen} onOpenChange={handleCloseModal}>
            <DialogContent className="w-[95vw] max-w-6xl h-[90vh] max-h-[90vh] overflow-hidden flex flex-col">
              <DialogHeader className="flex-shrink-0">
                <DialogTitle>Mark Attendance</DialogTitle>
                <DialogDescription>
                  {attendanceModal.timetableEntry?.subject} - {attendanceModal.timetableEntry?.teacher}
                </DialogDescription>
              </DialogHeader>

              <div className="flex-1 overflow-y-auto space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg flex-wrap gap-2">
                  <div className="flex items-center gap-4 flex-wrap">
                    <Button
                      variant={!isCameraMode ? "default" : "outline"}
                      onClick={() => setIsCameraMode(false)}
                      className="flex items-center gap-2"
                    >
                      <UserCheck className="w-4 h-4" />
                      Manual Mode
                    </Button>
                    <Button
                      variant={isCameraMode ? "default" : "outline"}
                      onClick={() => setIsCameraMode(true)}
                      className="flex items-center gap-2"
                    >
                      <Camera className="w-4 h-4" />
                      Camera Mode
                    </Button>
                  </div>
                </div>

                {isCameraMode && (
                  <LiveVideoFeed
                    enrolledStudents={attendanceModal.classStudents}
                    onAttendanceMarked={handleAutoAttendanceMarked}
                    onRecognitionResult={handleRecognitionResult}
                    className="px-4"
                  />
                )}

                <div className="space-y-4 px-4">
                  <h3 className="font-medium">
                    {isCameraMode ? "Enrolled Students (for reference)" : "Mark Attendance Manually"}
                  </h3>
                  <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                    {attendanceModal.classStudents.map((student) => (
                      <div key={student.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{student.name}</div>
                          <div className="text-sm text-gray-600 truncate">{student.email}</div>
                          <div className="text-xs text-gray-500">
                            {student.faceData ? "✅ Face data available" : "❌ No face data"}
                          </div>
                          <div className="text-xs mt-1">
                            <Badge
                              variant={
                                student.attendanceStatus === "present"
                                  ? "default"
                                  : student.attendanceStatus === "absent"
                                    ? "destructive"
                                    : "secondary"
                              }
                              className="text-xs"
                            >
                              {student.attendanceStatus === "present"
                                ? "Present"
                                : student.attendanceStatus === "absent"
                                  ? "Absent"
                                  : "Unmarked"}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex gap-2 flex-shrink-0 ml-4">
                          <Button
                            variant={student.attendanceStatus === "present" ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleMarkAttendance(student.id, "present")}
                            className="flex items-center gap-1"
                            disabled={isCameraMode}
                          >
                            <UserCheck className="w-4 h-4" />
                            Present
                          </Button>
                          <Button
                            variant={student.attendanceStatus === "absent" ? "destructive" : "outline"}
                            size="sm"
                            onClick={() => handleMarkAttendance(student.id, "absent")}
                            className="flex items-center gap-1"
                            disabled={isCameraMode}
                          >
                            <UserX className="w-4 h-4" />
                            Absent
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end p-4 border-t flex-shrink-0">
                <Button variant="outline" onClick={handleCloseModal}>
                  Close
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  )
}
