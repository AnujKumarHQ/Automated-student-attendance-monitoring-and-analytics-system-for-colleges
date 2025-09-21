"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useData } from "@/lib/data-context"
import { useToast } from "@/hooks/use-toast"
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


export default function Teacher() {
  const [activeNav, setActiveNav] = useState("teacher")
  const [searchTerm, setSearchTerm] = useState("")
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  // data context (consolidated further down)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingTeacherId, setEditingTeacherId] = useState<number | null>(null)
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false)
  const [leaveForm, setLeaveForm] = useState({ teacherId: 0, timetableEntryId: 0, date: "", replacementTeacherId: 0, autoAssign: true })
  const [leaveError, setLeaveError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    password: "",
    email: "",
    address: "",
  })
  const { teachers: teachersData, addTeacher, updateTeacher, deleteTeacher, timetable, applyLeave, isTeacherOnLeave, leaveRequests, substitutions, resolveLeave } = useData()
  const [serverLeaves, setServerLeaves] = useState<any[]>([])
  // normalize server leave object to frontend shape
  const normalizeLeave = (l: any) => ({
    id: l.id,
    teacherId: l.teacher_id ?? l.teacherId,
    timetableEntryId: l.timetable_entry_id ?? l.timetableEntryId,
    date: l.date,
    replacementTeacherId: l.replacement_teacher_id ?? l.replacementTeacherId ?? null,
    autoAssigned: Boolean(l.auto_assigned ?? l.autoAssigned),
    status: l.status ?? "open",
  })
  // current logged-in user info (stored on login)
  const userType = typeof window !== "undefined" ? localStorage.getItem("attendify-user-type") : null
  const username = typeof window !== "undefined" ? localStorage.getItem("attendify-username") : null
  const { toast } = useToast()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.name && formData.username && formData.password && formData.email && formData.address) {
      if (editingTeacherId) {
        // update in global context
        updateTeacher(editingTeacherId, { ...formData })
        setIsEditModalOpen(false)
        setEditingTeacherId(null)
      } else {
        // add to global context (addTeacher will assign id)
        addTeacher({
          name: formData.name,
          address: formData.address,
          email: formData.email,
          username: formData.username,
          password: formData.password,
        })
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

  const handleLeaveInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement
    if (type === "checkbox") {
      setLeaveForm((prev) => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }))
    } else {
      setLeaveForm((prev) => ({ ...prev, [name]: value }))
    }
  }

  const submitLeave = (e: React.FormEvent) => {
    e.preventDefault()
    setLeaveError(null)
    if (!leaveForm.teacherId || !leaveForm.timetableEntryId || !leaveForm.date) {
      setLeaveError("Please select teacher, class/time and date")
      return
    }
    // ensure numeric ids (form select values may be strings)
    const teacherIdNum = Number(leaveForm.teacherId)
    const timetableIdNum = Number(leaveForm.timetableEntryId)
    const replacementId = leaveForm.replacementTeacherId ? Number(leaveForm.replacementTeacherId) : null

    // try create on backend first
    const payload = {
      teacher_id: teacherIdNum,
      timetable_entry_id: timetableIdNum,
      date: leaveForm.date,
      replacement_teacher_id: replacementId,
    }

    fetch("/api/leaves/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then((r) => r.json())
      .then((data) => {
        // add to local DataContext as well for immediate UI updates
        try {
          applyLeave(teacherIdNum, timetableIdNum, leaveForm.date, replacementId)
        } catch (e) {
          // fallback
        }
        // add server copy to visible serverLeaves (normalize shape)
        try {
          setServerLeaves((prev) => [...prev, normalizeLeave(data)])
        } catch (e) {}
        setIsLeaveModalOpen(false)
        try {
          toast({ title: "Leave requested", description: "Your leave request has been submitted." })
        } catch (e) {}
      })
      .catch((err) => {
        // fallback to local-only behaviour
        const newId = applyLeave(teacherIdNum, timetableIdNum, leaveForm.date, replacementId)
        if (!newId) {
          setLeaveError("Failed to create leave request")
          try {
            toast({ title: "Failed", description: "Could not create leave request.", variant: "destructive" })
          } catch (e) {}
        } else {
          setIsLeaveModalOpen(false)
          try {
            toast({ title: "Leave saved offline", description: "Leave request saved locally (offline mode)." })
          } catch (e) {}
        }
      })
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
    // Only admins can delete teachers
    if (userType !== "admin") {
      alert("Only admins can delete teachers.")
      return
    }
    if (window.confirm("Are you sure you want to delete this teacher?")) {
      // delete from global context
      deleteTeacher(teacherId)
    }
  }

  const handleLogout = () => {
    window.location.href = "/"
  }

  // load leaves from server when admin views the page
  useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem("attendify-user-type") === "admin") {
      fetch("/api/leaves/")
        .then((r) => r.json())
        .then((data) => {
          if (Array.isArray(data)) setServerLeaves(data.map(normalizeLeave))
        })
        .catch(() => {})
    }
  }, [])

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

  // If the logged-in user is a teacher, restrict the view to their own record only.
  const visibleTeachers = (() => {
    if (typeof window !== "undefined" && localStorage.getItem("attendify-user-type") === "teacher") {
      const me = localStorage.getItem("attendify-username")
      if (!me) return []
      return teachersData
        .filter((t) => t.username === me)
        .filter((teacher) =>
          teacher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          teacher.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (teacher.address || "").toLowerCase().includes(searchTerm.toLowerCase()),
        )
    }
    // Admins and others can see the full list filtered by search
    return teachersData.filter(
      (teacher) =>
        teacher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        teacher.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (teacher.address || "").toLowerCase().includes(searchTerm.toLowerCase()),
    )
  })()

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
            <div className="flex items-center space-x-2">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => setIsAddModalOpen(true)}>
                Add Teacher
              </Button>
              <Button className="bg-yellow-400 hover:bg-yellow-500 text-black" onClick={() => setIsLeaveModalOpen(true)}>
                Apply for Leave
              </Button>
            </div>
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
                    {visibleTeachers.map((teacher, index) => (
                      <tr
                        key={teacher.id}
                        className={`border-b border-gray-100 hover:bg-gray-50 ${
                          isTeacherOnLeave(teacher.id) ? "bg-yellow-50" : ""
                        }`}
                      >
                        <td className="py-3 px-4 text-gray-600">{index + 1}</td>
                          <td className="py-3 px-4 text-gray-900">{teacher.name}</td>
                        <td className="py-3 px-4 text-gray-600">{teacher.address || ""}</td>
                        <td className="py-3 px-4 text-gray-600">{teacher.email}</td>
                        <td className="py-3 px-4 text-gray-600">{teacher.username}</td>
                        <td className="py-3 px-4 text-gray-600">{teacher.password}</td>
                        <td className="py-3 px-4">
                          {userType === "admin" ? (
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

                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 hover:bg-yellow-50"
                                onClick={() => {
                                  setLeaveForm({ teacherId: teacher.id, timetableEntryId: timetable[0]?.id || 0, date: new Date().toISOString().split("T")[0], replacementTeacherId: 0, autoAssign: true })
                                  setIsLeaveModalOpen(true)
                                }}
                              >
                                <Badge className="text-xs">Leave</Badge>
                              </Button>
                            </div>
                          ) : null}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Leave Requests Panel */}
          <div className="mt-6">
            <Card className="bg-white">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold text-gray-900">Leave Requests</CardTitle>
                  <span className="text-sm text-gray-500">Open requests</span>
                </div>
              </CardHeader>
              <CardContent>
                {leaveRequests.filter((l) => l.status === "open").length === 0 ? (
                  <div className="text-sm text-gray-500">No open leave requests</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-4 text-sm text-gray-600">#</th>
                          <th className="text-left py-3 px-4 text-sm text-gray-600">Teacher</th>
                          <th className="text-left py-3 px-4 text-sm text-gray-600">Class / Time</th>
                          <th className="text-left py-3 px-4 text-sm text-gray-600">Date</th>
                          <th className="text-left py-3 px-4 text-sm text-gray-600">Replacement</th>
                          <th className="text-left py-3 px-4 text-sm text-gray-600">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {leaveRequests
                          .filter((l) => l.status === "open")
                          .map((lr, idx) => {
                            const teacher = teachersData.find((t) => t.id === lr.teacherId)
                            const tt = timetable.find((t) => t.id === lr.timetableEntryId)
                            return (
                              <tr key={lr.id} className="border-b border-gray-100">
                                <td className="py-3 px-4 text-gray-600">{idx + 1}</td>
                                <td className="py-3 px-4 text-gray-800">{teacher?.name || "-"}</td>
                                <td className="py-3 px-4 text-gray-600">{tt ? `${tt.day} ${tt.timeSlot}` : "-"}</td>
                                <td className="py-3 px-4 text-gray-600">{lr.date}</td>
                                <td className="py-3 px-4 text-gray-600">{lr.replacementTeacherId ? teachersData.find((t) => t.id === lr.replacementTeacherId)?.name : "Auto"}</td>
                                <td className="py-3 px-4">
                                  <div className="flex items-center space-x-2">
                                    {/* Auto-assign only available to admins */}
                                    {userType === "admin" && (
                                      <Button
                                        size="sm"
                                        onClick={() => {
                                          resolveLeave(lr.id, null)
                                        }}
                                        className="bg-green-600 hover:bg-green-700 text-white"
                                      >
                                        Auto-assign
                                      </Button>
                                    )}

                                    {/* Resolve allowed for admin or the teacher who created the request */}
                                    {(userType === "admin" || username === teachersData.find((t) => t.id === lr.teacherId)?.username) && (
                                      <>
                                        <Button
                                          size="sm"
                                          onClick={() => {
                                            // optimistic UI: call backend then update local context
                                            fetch(`/api/leaves/${lr.id}/resolve`, {
                                              method: "PUT",
                                              headers: { "Content-Type": "application/json" },
                                            })
                                              .then((r) => r.json())
                                              .then((updated) => {
                                                // update serverLeaves
                                                setServerLeaves((prev) => prev.map((s) => (s.id === updated.id ? updated : s)))
                                              })
                                              .catch(() => {
                                                // fallback: mark resolved locally
                                                try {
                                                  resolveLeave(lr.id, lr.replacementTeacherId || null)
                                                } catch (e) {}
                                              })
                                          }}
                                          className="bg-green-600 hover:bg-green-700 text-white"
                                        >
                                          Resolve
                                        </Button>

                                        <Button
                                          size="sm"
                                          onClick={() => {
                                            fetch(`/api/leaves/${lr.id}/reject`, { method: "PUT" })
                                              .then((r) => r.json())
                                              .then((updated) => {
                                                setServerLeaves((prev) => prev.map((s) => (s.id === updated.id ? updated : s)))
                                              })
                                              .catch(() => {
                                                // fallback: update local leaveRequests to rejected
                                                setLeaveForm((f) => f)
                                              })
                                          }}
                                          variant="ghost"
                                        >
                                          Reject
                                        </Button>
                                      </>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            )
                          })}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
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
                placeholder="Full name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full"
                required
              />
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

      <Dialog open={isLeaveModalOpen} onOpenChange={(open) => setIsLeaveModalOpen(open)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-gray-900">Apply for Leave</DialogTitle>
          </DialogHeader>

          <form onSubmit={submitLeave} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Teacher</label>
              <select
                name="teacherId"
                value={leaveForm.teacherId}
                onChange={handleLeaveInputChange}
                className="w-full border rounded p-2"
              >
                <option value={0}>Select teacher</option>
                {teachersData.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Class / Time</label>
              <select
                name="timetableEntryId"
                value={leaveForm.timetableEntryId}
                onChange={handleLeaveInputChange}
                className="w-full border rounded p-2"
              >
                <option value={0}>Select class/time</option>
                {timetable.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.day} - {t.timeSlot}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <Input name="date" type="date" value={leaveForm.date} onChange={handleLeaveInputChange} className="w-full" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Replacement (optional)</label>
              <select
                name="replacementTeacherId"
                value={leaveForm.replacementTeacherId}
                onChange={handleLeaveInputChange}
                className="w-full border rounded p-2"
              >
                <option value={0}>Auto-assign</option>
                {teachersData.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            {leaveError && <div className="text-sm text-red-600">{leaveError}</div>}

            <div className="flex space-x-3 pt-4">
              <Button type="submit" className="bg-yellow-400 hover:bg-yellow-500 text-black">
                Apply
              </Button>
              <Button type="button" variant="outline" onClick={() => setIsLeaveModalOpen(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
