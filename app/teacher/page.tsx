"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
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
} from "lucide-react"

const initialTeachersData = [
  {
    id: 1,
    name: "Manuj Lama",
    address: "Dolpa",
    email: "manuj@gmail.com",
    username: "@malama",
    password: "malama",
  },
  {
    id: 2,
    name: "Manuj Lama",
    address: "Dolpa",
    email: "manuj@gmail.com",
    username: "@malama",
    password: "malama",
  },
  {
    id: 3,
    name: "Manuj Lama",
    address: "Dolpa",
    email: "manuj@gmail.com",
    username: "@malama",
    password: "malama",
  },
  {
    id: 4,
    name: "Manuj Lama",
    address: "Dolpa",
    email: "manuj@gmail.com",
    username: "@malama",
    password: "malama",
  },
  {
    id: 5,
    name: "Manuj Lama",
    address: "Dolpa",
    email: "manuj@gmail.com",
    username: "@malama",
    password: "malama",
  },
  {
    id: 6,
    name: "Manuj Lama",
    address: "Dolpa",
    email: "manuj@gmail.com",
    username: "@malama",
    password: "malama",
  },
  {
    id: 7,
    name: "Manuj Lama",
    address: "Dolpa",
    email: "manuj@gmail.com",
    username: "@malama",
    password: "malama",
  },
]

export default function Teacher() {
  const [activeNav, setActiveNav] = useState("teacher")
  const [searchTerm, setSearchTerm] = useState("")
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [teachersData, setTeachersData] = useState(initialTeachersData)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingTeacherId, setEditingTeacherId] = useState<number | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    password: "",
    email: "",
    address: "",
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.name && formData.username && formData.password && formData.email && formData.address) {
      if (editingTeacherId) {
        setTeachersData((prev) =>
          prev.map((teacher) => (teacher.id === editingTeacherId ? { ...teacher, ...formData } : teacher)),
        )
        setIsEditModalOpen(false)
        setEditingTeacherId(null)
      } else {
        const newTeacher = {
          id: Math.max(...teachersData.map((t) => t.id)) + 1,
          name: formData.name,
          address: formData.address,
          email: formData.email,
          username: formData.username,
          password: formData.password,
        }
        setTeachersData((prev) => [...prev, newTeacher])
        setIsAddModalOpen(false)
      }
      setFormData({ name: "", username: "", password: "", email: "", address: "" })
    }
  }

  const handleReset = () => {
    setFormData({ name: "", username: "", password: "", email: "", address: "" })
  }

  const handleCancel = () => {
    setFormData({ name: "", username: "", password: "", email: "", address: "" })
    setIsAddModalOpen(false)
    setIsEditModalOpen(false)
    setEditingTeacherId(null)
  }

  const handleEdit = (teacher: any) => {
    setFormData({
      name: teacher.name,
      username: teacher.username,
      password: teacher.password,
      email: teacher.email,
      address: teacher.address,
    })
    setEditingTeacherId(teacher.id)
    setIsEditModalOpen(true)
  }

  const handleDelete = (teacherId: number) => {
    if (window.confirm("Are you sure you want to delete this teacher?")) {
      setTeachersData((prev) => prev.filter((teacher) => teacher.id !== teacherId))
    }
  }

  const handleLogout = () => {
    window.location.href = "/"
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

  const filteredTeachers = teachersData.filter(
    (teacher) =>
      teacher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacher.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacher.address.toLowerCase().includes(searchTerm.toLowerCase()),
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
              <h2 className="text-3xl font-bold text-blue-600 mb-2">Teacher</h2>
              <div className="text-sm text-gray-500">
                <span>Manage</span> <span className="mx-2">/</span> <span>Teacher</span>
                {isAddModalOpen ||
                  (isEditModalOpen && (
                    <>
                      <span className="mx-2">/</span> <span>{editingTeacherId ? "Edit Teacher" : "Add Teacher"}</span>
                    </>
                  ))}
              </div>
            </div>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => setIsAddModalOpen(true)}>
              Add Teacher
            </Button>
          </div>

          <Card className="bg-white">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold text-gray-900">Current Teachers</CardTitle>
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
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Teacher name</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Address</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Email</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Username</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Password</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTeachers.map((teacher, index) => (
                      <tr key={teacher.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 text-gray-600">{index + 1}</td>
                        <td className="py-3 px-4 text-gray-900">{teacher.name}</td>
                        <td className="py-3 px-4 text-gray-600">{teacher.address}</td>
                        <td className="py-3 px-4 text-gray-600">{teacher.email}</td>
                        <td className="py-3 px-4 text-gray-600">{teacher.username}</td>
                        <td className="py-3 px-4 text-gray-600">{teacher.password}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 hover:bg-blue-50"
                              onClick={() => handleEdit(teacher)}
                            >
                              <Edit className="h-4 w-4 text-blue-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 hover:bg-red-50"
                              onClick={() => handleDelete(teacher.id)}
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
            setEditingTeacherId(null)
            setFormData({ name: "", username: "", password: "", email: "", address: "" })
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-gray-900">
              {editingTeacherId ? "Edit teacher" : "Add a teacher"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full name</label>
              <Input
                name="name"
                placeholder="Name"
                value={formData.name}
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <Input
                name="address"
                placeholder="Apartment, studio, or floor"
                value={formData.address}
                onChange={handleInputChange}
                className="w-full"
                required
              />
            </div>

            <div className="flex space-x-3 pt-4">
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
                {editingTeacherId ? "Update" : "Submit"}
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
    </div>
  )
}
