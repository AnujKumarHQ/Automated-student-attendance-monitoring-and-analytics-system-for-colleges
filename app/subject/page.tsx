"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useData } from "@/lib/data-context"
import {
  Bell,
  Search,
  BarChart3,
  UserCheck,
  UserX,
  FileText,
  GraduationCap,
  User,
  LogOut,
  Edit,
  Trash2,
  Users,
  BookOpen,
  ChevronDown,
} from "lucide-react"

export default function Subject() {
  const [activeNav, setActiveNav] = useState("subject")
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCourse, setSelectedCourse] = useState("All")
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isEnrollmentModalOpen, setIsEnrollmentModalOpen] = useState(false)
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(null)
  const [editingSubjectId, setEditingSubjectId] = useState<number | null>(null)

  const {
    subjects,
    students,
    teachers,
    addSubject,
    updateSubject,
    deleteSubject,
    enrollStudentInSubject,
    unenrollStudentFromSubject,
    getEnrolledStudents,
  } = useData()

  const [formData, setFormData] = useState({
    name: "",
    code: "",
    course: "",
    teacher: "",
  })

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

  const courses = [
    "All",
    "B.Tech",
    "BCA",
    "BSc",
    "BA",
    "BBA",
    "B.Com",
    "M.Tech",
    "MCA",
    "MSc",
    "MA",
    "MBA",
    "BIT",
    "CSIT",
    "BSc.IT",
  ]

  const filteredSubjects = subjects.filter((subject) => {
    const matchesSearch =
      subject.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subject.course.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subject.teacher.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesCourse = selectedCourse === "All" || subject.course === selectedCourse

    return matchesSearch && matchesCourse
  })

  const handleNavigation = (item: any) => {
    if (item.href) {
      window.location.href = item.href
    } else {
      setActiveNav(item.id)
    }
  }

  const handleLogout = () => {
    window.location.href = "/"
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.name && formData.code && formData.course && formData.teacher) {
      if (editingSubjectId) {
        updateSubject(editingSubjectId, {
          name: formData.name,
          code: formData.code,
          course: formData.course,
          teacher: formData.teacher,
        })
        setIsEditModalOpen(false)
        setEditingSubjectId(null)
      } else {
        addSubject({
          name: formData.name,
          code: formData.code,
          course: formData.course,
          teacher: formData.teacher,
        })
      }
      setIsModalOpen(false)
      setFormData({ name: "", code: "", course: "", teacher: "" })
    }
  }

  const handleReset = () => {
    setFormData({ name: "", code: "", course: "", teacher: "" })
  }

  const handleCancel = () => {
    setIsModalOpen(false)
    setIsEditModalOpen(false)
    setSelectedSubjectId(null)
    setEditingSubjectId(null)
    setFormData({ name: "", code: "", course: "", teacher: "" })
  }

  const handleEdit = (subject: any) => {
    setFormData({
      name: subject.name,
      code: subject.code,
      course: subject.course,
      teacher: subject.teacher,
    })
    setEditingSubjectId(subject.id)
    setIsEditModalOpen(true)
  }

  const handleDelete = (subjectId: number) => {
    if (window.confirm("Are you sure you want to delete this subject?")) {
      deleteSubject(subjectId)
    }
  }

  const handleEnrollment = (subjectId: number) => {
    setSelectedSubjectId(subjectId)
    setIsEnrollmentModalOpen(true)
  }

  const handleEnrollmentToggle = (studentId: number, isEnrolled: boolean) => {
    if (selectedSubjectId) {
      if (isEnrolled) {
        enrollStudentInSubject(studentId, selectedSubjectId)
      } else {
        unenrollStudentFromSubject(studentId, selectedSubjectId)
      }
    }
  }

  const closeEnrollmentModal = () => {
    setIsEnrollmentModalOpen(false)
    setSelectedSubjectId(null)
  }

  const enrolledStudents = selectedSubjectId ? getEnrolledStudents(selectedSubjectId) : []
  const selectedSubject = subjects.find((s) => s.id === selectedSubjectId)

  return (
    <div className="min-h-screen bg-gray-50 flex">
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
                    activeNav === item.id
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
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    activeNav === item.id
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

      <div className="flex-1 flex flex-col">
        <header className="bg-white shadow-sm border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input placeholder="Search" className="pl-10 w-80 bg-gray-50 border-gray-200" />
              </div>
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

        <main className="flex-1 p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-blue-600 mb-2">Subject</h2>
              <div className="text-sm text-gray-500">
                <span>Manage</span> <span className="mx-2">/</span> <span>Subject</span>
                {(isModalOpen || isEditModalOpen) && (
                  <>
                    <span className="mx-2">/</span>
                    <span>{editingSubjectId ? "Edit Subject" : "Add Subject"}</span>
                  </>
                )}
                {isEnrollmentModalOpen && (
                  <>
                    <span className="mx-2">/</span>
                    <span>Enroll Students</span>
                  </>
                )}
              </div>
            </div>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => setIsModalOpen(true)}>
              Add Subject
            </Button>
          </div>

          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Current Subjects</h3>
                <div className="flex items-center space-x-4">
                  <select
                    value={selectedCourse}
                    onChange={(e) => setSelectedCourse(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    {courses.map((course) => (
                      <option key={course} value={course}>
                        {course === "All" ? "All Courses" : course}
                      </option>
                    ))}
                  </select>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-64 bg-gray-50 border-gray-200"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      #
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Subject name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Course
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Enrolled Students
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Assigned Teacher
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredSubjects.map((subject, index) => (
                    <tr key={subject.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{index + 1}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{subject.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{subject.course}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {(() => {
                          const enrolled = getEnrolledStudents(subject.id)
                          const count = enrolled.length
                          return (
                            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                              {count} student{count !== 1 ? "s" : ""}
                            </Badge>
                          )
                        })()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{subject.teacher}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 hover:bg-green-50"
                            onClick={() => handleEnrollment(subject.id)}
                            title="Manage Enrollment"
                          >
                            <Users className="h-4 w-4 text-green-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 hover:bg-blue-50"
                            onClick={() => handleEdit(subject)}
                          >
                            <Edit className="h-4 w-4 text-blue-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 hover:bg-red-50"
                            onClick={() => handleDelete(subject.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      <Dialog open={isEnrollmentModalOpen} onOpenChange={closeEnrollmentModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-gray-900">
              Enroll Students - {selectedSubject?.name}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="text-sm text-gray-600 mb-4">
              Select students to enroll in this subject. Currently enrolled: {enrolledStudents.length} students
            </div>

            <div className="max-h-96 overflow-y-auto space-y-3">
              {students.map((student) => {
                const isEnrolled = selectedSubjectId
                  ? getEnrolledStudents(selectedSubjectId).some((s) => s.id === student.id)
                  : false
                return (
                  <div key={student.id} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                    <Checkbox
                      id={`student-${student.id}`}
                      checked={isEnrolled}
                      onCheckedChange={(checked) => handleEnrollmentToggle(student.id, checked as boolean)}
                    />
                    <div className="flex-1">
                      <label
                        htmlFor={`student-${student.id}`}
                        className="text-sm font-medium text-gray-900 cursor-pointer"
                      >
                        {student.name}
                      </label>
                      <div className="text-xs text-gray-500">
                        {student.course} - {student.semester} Semester
                      </div>
                    </div>
                    <Badge variant={isEnrolled ? "default" : "secondary"} className="text-xs">
                      {isEnrolled ? "Enrolled" : "Not Enrolled"}
                    </Badge>
                  </div>
                )
              })}
            </div>

            <div className="flex justify-end space-x-2 pt-4 border-t">
              <Button variant="outline" onClick={closeEnrollmentModal}>
                Done
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isModalOpen || isEditModalOpen} onOpenChange={handleCancel}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-gray-900">
              {editingSubjectId ? "Edit Subject" : "Add Subject"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subject Name</label>
              <Input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Enter subject name"
                className="w-full"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subject Code</label>
              <Input
                type="text"
                value={formData.code}
                onChange={(e) => handleInputChange("code", e.target.value)}
                placeholder="Enter subject code"
                className="w-full"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Course</label>
              <select
                value={formData.course}
                onChange={(e) => handleInputChange("course", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select Course</option>
                {courses.slice(1).map((course) => (
                  <option key={course} value={course}>
                    {course}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Teacher</label>
              <select
                value={formData.teacher}
                onChange={(e) => handleInputChange("teacher", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select Teacher</option>
                {teachers.map((teacher) => (
                  <option key={teacher.id} value={teacher.name}>
                    {teacher.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button type="button" variant="outline" onClick={handleReset}>
                Reset
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
                {editingSubjectId ? "Update Subject" : "Add Subject"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
