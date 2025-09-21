"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
  ChevronDown,
} from "lucide-react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts"
import { useData } from "@/lib/data-context"

const lineChartData = [
  { time: "00:00", present: 32, absent: 15, attendance: 12 },
  { time: "01:00", present: 38, absent: 18, attendance: 25 },
  { time: "02:00", present: 42, absent: 12, attendance: 35 },
  { time: "03:00", present: 45, absent: 28, attendance: 42 },
  { time: "04:00", present: 48, absent: 18, attendance: 32 },
  { time: "05:00", present: 82, absent: 8, attendance: 48 },
  { time: "06:00", present: 56, absent: 12, attendance: 38 },
]

export default function Dashboard() {
  const [activeNav, setActiveNav] = useState("dashboard")
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const { getStats, students, teachers, subjects, timetable, attendance, seedAttendance } = useData()
  const stats = getStats()

  // Get user type from localStorage
  const userType = typeof window !== "undefined" ? localStorage.getItem("attendify-user-type") : null

  // Only show Analyse items for students
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

  // Move these after useData destructuring
  const recentActivities = [
    { time: "32 min", activity: `New teacher created (${teachers.length} total)` },
    { time: "56 min", activity: `Student attendance updated` },
    { time: "2 hrs", activity: `Absence application processed` },
  ]

  const radarData = subjects.slice(0, 6).map((subject) => ({
    subject: subject.name,
    allocated: Math.floor(Math.random() * 40) + 60, // Random for demo
    actual: Math.floor(Math.random() * 40) + 50, // Random for demo
  }))

  const filteredSidebarItems = userType === "student" ? sidebarItems : [...sidebarItems, ...manageItems]

  // Build chart data from today's timetable and attendance
  const buildLineChartData = () => {
    try {
      const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
      const todayName = typeof window !== "undefined" ? dayNames[new Date().getDay()] : "Monday"
      const todayISO = typeof window !== "undefined" ? new Date().toISOString().split("T")[0] : ""

      const entriesToday = timetable.filter((t) => t.day === todayName)
      if (!entriesToday || entriesToday.length === 0) return lineChartData

      // Group by timeSlot
      const grouped: Record<string, { present: number; absent: number }> = {}
      entriesToday.forEach((entry) => {
        const slot = entry.timeSlot
        if (!grouped[slot]) grouped[slot] = { present: 0, absent: 0 }
        const records = attendance.filter(
          (r) => r.timetableEntryId === entry.id && (!todayISO || r.date === todayISO),
        )
        grouped[slot].present += records.filter((r) => r.status === "present").length
        grouped[slot].absent += records.filter((r) => r.status === "absent").length
      })

      // Preserve time order by unique timeSlots order in entriesToday
      const uniqueSlots = Array.from(new Set(entriesToday.map((e) => e.timeSlot)))
      const data = uniqueSlots.map((slot) => {
        const g = grouped[slot] || { present: 0, absent: 0 }
        // Ensure integer counts
        const presentCount = Number(g.present || 0)
        const absentCount = Number(g.absent || 0)
        return { time: slot, present: presentCount, absent: absentCount }
      })

      return data
    } catch (e) {
      return lineChartData
    }
  }

  const computedLineChartData = buildLineChartData()

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

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-sm border-r">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-gray-900">Attendify</h1>
        </div>

        <nav className="px-4 space-y-1">
          {/* ANALYSE Section */}
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

          {/* MANAGE Section (hidden for students) */}
          {userType !== "student" && (
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
          )}

          {/* CHAL CHLA NIKAL Section */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">CHAL CHLA NIKAL</p>
            <button
              onClick={() => (window.location.href = "/")}
              className="w-full flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-lg transition-colors"
            >
              <LogOut className="mr-3 h-5 w-5" />
              Logout
            </button>
          </div>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white shadow-sm border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input placeholder="Search" className="pl-10 w-80 bg-gray-50 border-gray-200" />
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <DropdownMenu>
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

        {/* Page Content */}
        <main className="flex-1 p-6">
          <div className="mb-6">
            <h2 className="text-3xl font-bold text-blue-600 mb-2">Dashboard</h2>
            <div className="text-sm text-gray-500">
              <span>Home</span> <span className="mx-2">/</span> <span>Dashboard</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Stats Cards */}
            <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <Card className="bg-white">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-blue-600">Present</CardTitle>
                    <span className="text-xs text-gray-500">Today</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600 mb-1">{stats.totalPresent}</div>
                  <div className="text-xs text-gray-500">{stats.attendanceRate}% attendance rate</div>
                </CardContent>
              </Card>

              <Card className="bg-white">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-blue-600">Absent</CardTitle>
                    <span className="text-xs text-gray-500">Today</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600 mb-1">{stats.totalAbsent}</div>
                  <div className="text-xs text-gray-500">{100 - stats.attendanceRate}% absence rate</div>
                </CardContent>
              </Card>

              <Card className="bg-white">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-blue-600">Students</CardTitle>
                    <span className="text-xs text-gray-500">Total</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600 mb-1">{stats.totalStudents}</div>
                  <div className="text-xs text-gray-500">{stats.totalSubjects} subjects</div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activities */}
            <div className="lg:col-span-1">
              <Card className="bg-white h-fit">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-green-600">Recent Activities</CardTitle>
                    <span className="text-xs text-gray-500">Today</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {recentActivities.map((activity, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <span className="text-xs text-gray-500 mt-1 min-w-[3rem]">{activity.time}</span>
                      <span className="text-sm text-gray-700">{activity.activity}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Reports Chart */}
            <div className="lg:col-span-2">
              <Card className="bg-white">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-green-600">Reports</CardTitle>
                    <span className="text-xs text-gray-500">Today</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={computedLineChartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="time" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        {/* Stacked bars: present (bottom) and absent (top) */}
                        <Bar dataKey="present" stackId="a" fill="#3b82f6" />
                        <Bar dataKey="absent" stackId="a" fill="#10b981" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-4 flex justify-end">
                    <Button size="sm" onClick={() => seedAttendance(7)} variant="outline">
                      Reseed 7-day data
                    </Button>
                    <Button
                      size="sm"
                      className="ml-2"
                      onClick={async () => {
                        try {
                          await fetch("http://127.0.0.1:8000/api/seed-demo-students", { method: "POST" })
                          // reload so data-context picks up new students from backend
                          window.location.reload()
                        } catch (e) {
                          alert("Failed to seed demo students — is the backend running?")
                        }
                      }}
                      variant="outline"
                    >
                      Seed demo students
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Attendance Pie Chart */}
            <div className="lg:col-span-2">
              <Card className="bg-white">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-green-600">Attendance Breakdown</CardTitle>
                    <span className="text-xs text-gray-500">Today</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[{ name: "Present", value: stats.totalPresent || 0 }, { name: "Absent", value: stats.totalAbsent || 0 }]}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          fill="#8884d8"
                          label
                        >
                          <Cell key="present" fill="#3b82f6" />
                          <Cell key="absent" fill="#ef4444" />
                        </Pie>
                        <Tooltip />
                        <Legend verticalAlign="bottom" />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Attendance Report */}
            <div className="lg:col-span-2">
              <Card className="bg-white">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-green-600">Subject Report</CardTitle>
                    <span className="text-xs text-gray-500">This Month</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={radarData}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey="subject" className="text-xs" />
                        <PolarRadiusAxis angle={90} domain={[0, 100]} className="text-xs" />
                        <Radar
                          name="Allocated Budget"
                          dataKey="allocated"
                          stroke="#3b82f6"
                          fill="#3b82f6"
                          fillOpacity={0.1}
                        />
                        <Radar
                          name="Actual Spending"
                          dataKey="actual"
                          stroke="#10b981"
                          fill="#10b981"
                          fillOpacity={0.1}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
