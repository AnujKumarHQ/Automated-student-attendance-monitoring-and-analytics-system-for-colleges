"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useData } from "@/lib/data-context"
import { PhotoCapture } from "@/components/photo-capture"
import {
  Bell,
  Search,
  BarChart3,
  UserCheck,
  UserX,
  FileText,
  GraduationCap,
  User,
  BookOpen,
  LogOut,
  Edit,
  Trash2,
  ChevronDown,
  Camera,
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

const courseOptions = [
  { value: "B.Tech", label: "Bachelor of Technology (B.Tech)" },
  { value: "BCA", label: "Bachelor of Computer Applications (BCA)" },
  { value: "BSc", label: "Bachelor of Science (BSc)" },
  { value: "BA", label: "Bachelor of Arts (BA)" },
  { value: "BBA", label: "Bachelor of Business Administration (BBA)" },
  { value: "B.Com", label: "Bachelor of Commerce (B.Com)" },
  { value: "BIT", label: "Bachelor of Information Technology (BIT)" },
  { value: "CSIT", label: "Computer Science and Information Technology (CSIT)" },
  { value: "BIM", label: "Bachelor in Information Management (BIM)" },
  { value: "M.Tech", label: "Master of Technology (M.Tech)" },
  { value: "MCA", label: "Master of Computer Applications (MCA)" },
  { value: "MSc", label: "Master of Science (MSc)" },
  { value: "MA", label: "Master of Arts (MA)" },
  { value: "MBA", label: "Master of Business Administration (MBA)" },
]

export default function Student() {
  const [activeNav, setActiveNav] = useState("student")
  const [searchTerm, setSearchTerm] = useState("")
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const { students, addStudent, updateStudent, deleteStudent } = useData()
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false)
  const [photoStudentId, setPhotoStudentId] = useState<number | null>(null)
  const [editingStudentId, setEditingStudentId] = useState<number | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    course: "",
    email: "",
    username: "",
    password: "",
    semester: "",
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.name && formData.course && formData.email && formData.username && formData.password) {
      if (editingStudentId) {
        updateStudent(editingStudentId, formData)
        setIsEditModalOpen(false)
        setEditingStudentId(null)
      } else {
        addStudent({
          name: formData.name,
          course: formData.course,
          email: formData.email,
          username: formData.username,
          password: formData.password,
          semester: formData.semester || "First",
        })
        setIsAddModalOpen(false)
      }
      setFormData({ name: "", course: "", email: "", username: "", password: "", semester: "" })
    }
  }

  const handleReset = () => {
    setFormData({ name: "", course: "", email: "", username: "", password: "", semester: "" })
  }

  const handleCancel = () => {
    setFormData({ name: "", course: "", email: "", username: "", password: "", semester: "" })
    setIsAddModalOpen(false)
    setIsEditModalOpen(false)
    setEditingStudentId(null)
  }

  const handleEdit = (student: any) => {
    setFormData({
      name: student.name,
      course: student.course,
      email: student.email,
      username: student.username,
      password: student.password,
      semester: student.semester || "",
    })
    setEditingStudentId(student.id)
    setIsEditModalOpen(true)
  }

  const handleDelete = (studentId: number) => {
    if (window.confirm("Are you sure you want to delete this student?")) {
      deleteStudent(studentId)
    }
  }

  const handleLogout = () => {
    window.location.href = "/"
  }

  const handleTakePhoto = (student: any) => {
    setPhotoStudentId(student.id)
    setIsPhotoModalOpen(true)
  }

  const handlePhotosCapture = (photos: string[]) => {
    console.log(`[v0] Photos captured for student ${photoStudentId}:`, photos.length)
    setIsPhotoModalOpen(false)
    setPhotoStudentId(null)
  }

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
    } else {
      setActiveNav(item.id)
    }
  }

  const filteredStudents = students.filter(
    (student) =>
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.course.toLowerCase().includes(searchTerm.toLowerCase()),
  )

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
              <h2 className="text-3xl font-bold text-blue-600 mb-2">Student</h2>
              <div className="text-sm text-gray-500">
                <span>Manage</span> <span className="mx-2">/</span> <span>Student</span>
                {isAddModalOpen ||
                  (isEditModalOpen && (
                    <>
                      <span className="mx-2">/</span> <span>{editingStudentId ? "Edit Student" : "Add Student"}</span>
                    </>
                  ))}
              </div>
            </div>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => setIsAddModalOpen(true)}>
              Add student
            </Button>
          </div>

          <Card className="bg-white">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold text-gray-900">Current Student</CardTitle>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search..."
                    className="pl-10 w-64 bg-gray-50 border-gray-200"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-700">#</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Student name</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Course</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Semester</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">email</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">username</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">password</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map((student, index) => (
                      <tr key={student.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 text-gray-600">{index + 1}</td>
                        <td className="py-3 px-4 text-gray-900">{student.name}</td>
                        <td className="py-3 px-4 text-gray-600">{student.course}</td>
                        <td className="py-3 px-4 text-gray-600">{student.semester || "First"}</td>
                        <td className="py-3 px-4 text-gray-600">{student.email}</td>
                        <td className="py-3 px-4 text-gray-600">{student.username}</td>
                        <td className="py-3 px-4 text-gray-600">{student.password}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 hover:bg-green-50"
                              onClick={() => handleTakePhoto(student)}
                              title="Take Photo for Face Recognition"
                            >
                              <Camera className="h-4 w-4 text-green-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 hover:bg-blue-50"
                              onClick={() => handleEdit(student)}
                            >
                              <Edit className="h-4 w-4 text-blue-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 hover:bg-red-50"
                              onClick={() => handleDelete(student.id)}
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
            </CardContent>
          </Card>
        </main>
      </div>

      <Dialog
        open={isAddModalOpen || isEditModalOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsAddModalOpen(false)
            setIsEditModalOpen(false)
            setEditingStudentId(null)
            setFormData({ name: "", course: "", email: "", username: "", password: "", semester: "" })
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-gray-900">
              {editingStudentId ? "Edit student" : "Add a student"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Student name</label>
              <Input
                name="name"
                placeholder="Name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <Input
                name="email"
                type="email"
                placeholder="sam@gmail.com"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                <Input
                  name="username"
                  placeholder="Username"
                  value={formData.username}
                  onChange={handleInputChange}
                  className="w-full"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <Input
                  name="password"
                  type="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Course</label>
                <Select value={formData.course} onValueChange={(value) => handleSelectChange("course", value)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a course" />
                  </SelectTrigger>
                  <SelectContent>
                    {courseOptions.map((course) => (
                      <SelectItem key={course.value} value={course.value}>
                        {course.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
                <Select value={formData.semester} onValueChange={(value) => handleSelectChange("semester", value)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select semester" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="First">First Semester</SelectItem>
                    <SelectItem value="Second">Second Semester</SelectItem>
                    <SelectItem value="Third">Third Semester</SelectItem>
                    <SelectItem value="Fourth">Fourth Semester</SelectItem>
                    <SelectItem value="Fifth">Fifth Semester</SelectItem>
                    <SelectItem value="Sixth">Sixth Semester</SelectItem>
                    <SelectItem value="Seventh">Seventh Semester</SelectItem>
                    <SelectItem value="Eighth">Eighth Semester</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex space-x-3 pt-4">
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
                {editingStudentId ? "Update" : "Submit"}
              </Button>
              <Button type="button" variant="secondary" onClick={handleReset}>
                Reset
              </Button>
              <Button type="button" variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isPhotoModalOpen} onOpenChange={setIsPhotoModalOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
              <Camera className="h-5 w-5 text-green-600" />
              <span>Take Photo for Face Recognition</span>
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            {photoStudentId && (
              <PhotoCapture studentId={photoStudentId} onPhotosCapture={handlePhotosCapture} mode="training" />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
